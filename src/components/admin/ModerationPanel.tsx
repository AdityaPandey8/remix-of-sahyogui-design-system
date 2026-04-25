import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flag, ShieldOff, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function ModerationPanel() {
  const [ngos, setNgos] = useState<any[]>([]);
  const [vols, setVols] = useState<any[]>([]);

  const load = async () => {
    const [{ data: n }, { data: v }] = await Promise.all([
      supabase.from("ngo_details").select("id, ngo_name, is_flagged, verification_status"),
      supabase.from("volunteer_details").select("id, full_name, blocked"),
    ]);
    if (n) setNgos(n);
    if (v) setVols(v);
  };
  useEffect(() => { load(); }, []);

  const flagNgo = async (id: string, flagged: boolean) => {
    await supabase.from("ngo_details").update({ is_flagged: !flagged } as any).eq("id", id);
    toast.success(flagged ? "Flag cleared" : "NGO flagged as suspicious");
    load();
  };
  const blockVol = async (id: string, blocked: boolean) => {
    await supabase.from("volunteer_details").update({ blocked: !blocked } as any).eq("id", id);
    await supabase.from("profiles").update({ blocked: !blocked } as any).eq("id", id);
    toast.success(blocked ? "Volunteer unblocked" : "Volunteer blocked");
    load();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" /> Moderation & Fraud Control</h2>

      <Card className="p-4">
        <h3 className="font-bold mb-3 text-sm">Flag Suspicious NGOs</h3>
        <div className="space-y-2">
          {ngos.map((n) => (
            <div key={n.id} className="flex items-center gap-3 rounded-xl bg-muted/30 p-3">
              <span className="text-sm font-medium flex-1">{n.ngo_name}</span>
              {n.is_flagged && <span className="text-[10px] font-bold text-destructive uppercase">FLAGGED</span>}
              <Button size="sm" variant={n.is_flagged ? "outline" : "destructive"} onClick={() => flagNgo(n.id, n.is_flagged)} className="gap-1">
                <Flag className="h-3.5 w-3.5" /> {n.is_flagged ? "Clear Flag" : "Flag"}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-bold mb-3 text-sm">Block / Disable Volunteers</h3>
        <div className="space-y-2">
          {vols.map((v) => (
            <div key={v.id} className="flex items-center gap-3 rounded-xl bg-muted/30 p-3">
              <span className="text-sm font-medium flex-1">{v.full_name}</span>
              {v.blocked && <span className="text-[10px] font-bold text-destructive uppercase">BLOCKED</span>}
              <Button size="sm" variant={v.blocked ? "outline" : "destructive"} onClick={() => blockVol(v.id, v.blocked)} className="gap-1">
                <ShieldOff className="h-3.5 w-3.5" /> {v.blocked ? "Unblock" : "Block"}
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}