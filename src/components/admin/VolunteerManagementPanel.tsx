import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, ShieldOff, Search } from "lucide-react";
import { toast } from "sonner";
import { TrustScoreBadge, calcVolunteerTrust } from "./TrustScoreBadge";
import { cn } from "@/lib/utils";

interface VRow {
  id: string;
  full_name: string;
  skills: string[];
  city?: string | null;
  location_text?: string | null;
  type: string;
  availability: boolean;
  blocked: boolean;
  tasks_completed: number;
  reliability_score: number;
  invite_code_used?: string | null;
}

export function VolunteerManagementPanel() {
  const [rows, setRows] = useState<VRow[]>([]);
  const [skillFilter, setSkillFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [ngos, setNgos] = useState<{ id: string; ngo_name: string }[]>([]);

  const load = async () => {
    const { data } = await supabase.from("volunteer_details").select("*").order("created_at", { ascending: false });
    if (data) setRows(data as any);
    const { data: n } = await supabase.from("ngo_details").select("id, ngo_name").eq("verification_status", "verified");
    if (n) setNgos(n);
  };
  useEffect(() => { load(); }, []);

  const verify = async (id: string) => {
    await supabase.from("volunteer_details").update({ verification_status: "verified", type: "verified" } as any).eq("id", id);
    toast.success("Volunteer verified");
    load();
  };
  const block = async (id: string, blocked: boolean) => {
    await supabase.from("volunteer_details").update({ blocked: !blocked } as any).eq("id", id);
    await supabase.from("profiles").update({ blocked: !blocked } as any).eq("id", id);
    toast.success(blocked ? "Unblocked" : "Blocked");
    load();
  };
  const assignNgo = async (volunteerId: string, ngoId: string) => {
    if (!ngoId) return;
    const { error } = await supabase.from("ngo_volunteer_relations").insert({ ngo_id: ngoId, volunteer_id: volunteerId } as any);
    if (error) toast.error(error.message);
    else toast.success("Assigned to NGO");
    load();
  };

  const filtered = rows.filter((r) =>
    (!skillFilter || r.skills?.some((s) => s.toLowerCase().includes(skillFilter.toLowerCase()))) &&
    (!cityFilter || (r.city || "").toLowerCase().includes(cityFilter.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold flex-1">Volunteer Management</h2>
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Filter by skill" value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} className="pl-9 h-9 w-40 rounded-xl" />
        </div>
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Filter by city" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="pl-9 h-9 w-40 rounded-xl" />
        </div>
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 && <Card className="p-8 text-center text-sm text-muted-foreground">No volunteers found.</Card>}
        {filtered.map((v) => {
          const score = calcVolunteerTrust({ tasksCompleted: v.tasks_completed, reliability: v.reliability_score, available: v.availability });
          return (
            <Card key={v.id} className="p-4">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold">{v.full_name}</h3>
                    <TypeBadge type={v.type} invited={!!v.invite_code_used} />
                    <TrustScoreBadge score={score} />
                    {v.blocked && <span className="text-[10px] font-bold text-destructive uppercase">Blocked</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{v.city || v.location_text || "—"} · {v.availability ? "Available" : "Unavailable"} · {v.tasks_completed} tasks</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(v.skills || []).slice(0, 6).map((s) => (
                      <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-stretch">
                  <div className="flex gap-2">
                    {v.type !== "verified" && v.type !== "ngo_verified" && (
                      <Button size="sm" onClick={() => verify(v.id)} className="gap-1 bg-success hover:bg-success/90"><CheckCircle2 className="h-3.5 w-3.5" /> Verify</Button>
                    )}
                    <Button size="sm" variant={v.blocked ? "outline" : "destructive"} onClick={() => block(v.id, v.blocked)} className="gap-1"><ShieldOff className="h-3.5 w-3.5" /> {v.blocked ? "Unblock" : "Block"}</Button>
                  </div>
                  <select onChange={(e) => assignNgo(v.id, e.target.value)} value="" className="h-8 rounded-lg border bg-background px-2 text-xs">
                    <option value="">Assign to NGO…</option>
                    {ngos.map((n) => <option key={n.id} value={n.id}>{n.ngo_name}</option>)}
                  </select>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function TypeBadge({ type, invited }: { type: string; invited: boolean }) {
  const ngoVerified = type === "ngo_verified" || invited;
  const cls = ngoVerified ? "bg-success/10 text-success border-success/30" : type === "verified" ? "bg-primary/10 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border";
  return <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest", cls)}>{ngoVerified ? "NGO Verified" : type === "verified" ? "Verified" : "Basic"}</span>;
}