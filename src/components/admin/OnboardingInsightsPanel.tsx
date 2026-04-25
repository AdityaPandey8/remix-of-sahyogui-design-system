import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Building2, Users, CheckCircle2, Clock, UserCheck } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export function OnboardingInsightsPanel() {
  const [stats, setStats] = useState({ totalNgos: 0, verifiedNgos: 0, pendingNgos: 0, totalVols: 0, activeVols: 0 });
  const [series, setSeries] = useState<{ day: string; ngos: number; volunteers: number }[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: ngos }, { data: vols }] = await Promise.all([
        supabase.from("ngo_details").select("verification_status, created_at"),
        supabase.from("volunteer_details").select("availability, created_at"),
      ]);
      const n = ngos || [];
      const v = vols || [];
      setStats({
        totalNgos: n.length,
        verifiedNgos: n.filter((x: any) => x.verification_status === "verified").length,
        pendingNgos: n.filter((x: any) => x.verification_status === "pending").length,
        totalVols: v.length,
        activeVols: v.filter((x: any) => x.availability).length,
      });

      const buckets: Record<string, { ngos: number; volunteers: number }> = {};
      const days = 7;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(5, 10);
        buckets[key] = { ngos: 0, volunteers: 0 };
      }
      n.forEach((x: any) => { const k = (x.created_at || "").slice(5, 10); if (buckets[k]) buckets[k].ngos++; });
      v.forEach((x: any) => { const k = (x.created_at || "").slice(5, 10); if (buckets[k]) buckets[k].volunteers++; });
      setSeries(Object.entries(buckets).map(([day, vals]) => ({ day, ...vals })));
    })();
  }, []);

  const cards = [
    { label: "Total NGOs", value: stats.totalNgos, icon: Building2, color: "text-primary" },
    { label: "Verified", value: stats.verifiedNgos, icon: CheckCircle2, color: "text-success" },
    { label: "Pending", value: stats.pendingNgos, icon: Clock, color: "text-warning" },
    { label: "Total Volunteers", value: stats.totalVols, icon: Users, color: "text-primary" },
    { label: "Active Volunteers", value: stats.activeVols, icon: UserCheck, color: "text-success" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Onboarding Insights</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className="p-4">
            <c.icon className={`h-4 w-4 ${c.color}`} />
            <p className="text-2xl font-bold mt-2">{c.value}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{c.label}</p>
          </Card>
        ))}
      </div>
      <Card className="p-4">
        <h3 className="font-bold mb-3 text-sm">Signups — Last 7 Days</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series}>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="ngos" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              <Bar dataKey="volunteers" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}