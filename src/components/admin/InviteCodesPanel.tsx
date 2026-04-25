import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Power, PowerOff, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CodeRow {
  id: string;
  ngo_id: string;
  code: string;
  active: boolean;
  created_at: string;
  ngo_name?: string;
}

export function InviteCodesPanel() {
  const [rows, setRows] = useState<CodeRow[]>([]);
  const [ngos, setNgos] = useState<{ id: string; ngo_name: string }[]>([]);
  const [pickedNgo, setPickedNgo] = useState("");

  const load = async () => {
    const [{ data: codes }, { data: nd }] = await Promise.all([
      supabase.from("ngo_invite_codes").select("*").order("created_at", { ascending: false }),
      supabase.from("ngo_details").select("id, ngo_name"),
    ]);
    if (nd) setNgos(nd);
    if (codes && nd) {
      const map = new Map(nd.map((n: any) => [n.id, n.ngo_name]));
      setRows((codes as any[]).map((c) => ({ ...c, ngo_name: map.get(c.ngo_id) })));
    }
  };
  useEffect(() => { load(); }, []);

  const generate = async () => {
    if (!pickedNgo) { toast.error("Pick an NGO first"); return; }
    const code = `INV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const { error } = await supabase.from("ngo_invite_codes").insert({ ngo_id: pickedNgo, code, active: true } as any);
    if (error) toast.error(error.message);
    else { toast.success(`Code ${code} created`); load(); }
  };
  const toggle = async (id: string, active: boolean) => {
    await supabase.from("ngo_invite_codes").update({ active: !active } as any).eq("id", id);
    toast.success(active ? "Deactivated" : "Activated");
    load();
  };
  const copy = (code: string) => { navigator.clipboard.writeText(code); toast.success("Copied"); };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Invite Codes</h2>
      <Card className="p-4 flex flex-wrap gap-2 items-center">
        <select value={pickedNgo} onChange={(e) => setPickedNgo(e.target.value)} className="h-9 rounded-lg border bg-background px-2 text-sm flex-1 min-w-[200px]">
          <option value="">Select NGO…</option>
          {ngos.map((n) => <option key={n.id} value={n.id}>{n.ngo_name}</option>)}
        </select>
        <Button onClick={generate} className="gap-2"><Plus className="h-4 w-4" /> Generate Code</Button>
      </Card>

      <div className="grid gap-2">
        {rows.map((r) => (
          <Card key={r.id} className="p-3 flex items-center gap-3">
            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", r.active ? "bg-success/10 text-success border-success/30" : "bg-muted text-muted-foreground")}>
              {r.active ? "Active" : "Inactive"}
            </span>
            <code className="font-mono text-sm font-bold flex-1">{r.code}</code>
            <span className="text-xs text-muted-foreground">{r.ngo_name || "—"}</span>
            <Button size="sm" variant="ghost" onClick={() => copy(r.code)}><Copy className="h-3.5 w-3.5" /></Button>
            <Button size="sm" variant="outline" onClick={() => toggle(r.id, r.active)} className="gap-1">
              {r.active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
              {r.active ? "Deactivate" : "Activate"}
            </Button>
          </Card>
        ))}
        {rows.length === 0 && <Card className="p-6 text-center text-sm text-muted-foreground">No invite codes yet.</Card>}
      </div>
    </div>
  );
}