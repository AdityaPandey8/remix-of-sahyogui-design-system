import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Building2, Heart, CheckCircle2, XCircle } from "lucide-react";

interface Item {
  id: string;
  kind: "ngo_signup" | "vol_signup" | "ngo_verified" | "ngo_rejected";
  label: string;
  time: string;
}

export function ActivityMonitorPanel() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: ngos }, { data: vols }] = await Promise.all([
        supabase.from("ngo_details").select("id, ngo_name, verification_status, created_at, updated_at, verified_at").order("updated_at", { ascending: false }).limit(20),
        supabase.from("volunteer_details").select("id, full_name, created_at").order("created_at", { ascending: false }).limit(20),
      ]);
      const out: Item[] = [];
      (ngos || []).forEach((n: any) => {
        out.push({ id: `n-${n.id}`, kind: "ngo_signup", label: `NGO signup — ${n.ngo_name}`, time: n.created_at });
        if (n.verification_status === "verified" && n.verified_at)
          out.push({ id: `nv-${n.id}`, kind: "ngo_verified", label: `Verified — ${n.ngo_name}`, time: n.verified_at });
        if (n.verification_status === "rejected")
          out.push({ id: `nr-${n.id}`, kind: "ngo_rejected", label: `Rejected — ${n.ngo_name}`, time: n.updated_at });
      });
      (vols || []).forEach((v: any) => {
        out.push({ id: `v-${v.id}`, kind: "vol_signup", label: `Volunteer signup — ${v.full_name}`, time: v.created_at });
      });
      out.sort((a, b) => (a.time < b.time ? 1 : -1));
      setItems(out.slice(0, 25));
    })();
  }, []);

  const Icon = (k: Item["kind"]) =>
    k === "ngo_signup" ? Building2 :
    k === "vol_signup" ? Heart :
    k === "ngo_verified" ? CheckCircle2 : XCircle;

  const color = (k: Item["kind"]) =>
    k === "ngo_verified" ? "text-success" :
    k === "ngo_rejected" ? "text-destructive" :
    k === "vol_signup" ? "text-warning" : "text-primary";

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Activity Monitor</h2>
      <Card className="p-4">
        <ol className="relative border-l-2 border-border ml-3 space-y-4">
          {items.map((i) => {
            const I = Icon(i.kind);
            return (
              <li key={i.id} className="ml-6">
                <span className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-background border ${color(i.kind)}`}>
                  <I className="h-3 w-3" />
                </span>
                <p className="text-sm font-medium">{i.label}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(i.time).toLocaleString()}</p>
              </li>
            );
          })}
          {items.length === 0 && <p className="text-sm text-muted-foreground ml-6">No recent activity.</p>}
        </ol>
      </Card>
    </div>
  );
}