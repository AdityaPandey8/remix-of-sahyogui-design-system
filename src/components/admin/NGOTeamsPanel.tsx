import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Users, X } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface NGORow { id: string; ngo_name: string; verification_status: string; }
interface VolRow { id: string; full_name: string; ngoId: string; }

export function NGOTeamsPanel() {
  const [ngos, setNgos] = useState<NGORow[]>([]);
  const [vols, setVols] = useState<VolRow[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [allVols, setAllVols] = useState<{ id: string; full_name: string }[]>([]);

  const load = async () => {
    const [{ data: nd }, { data: rel }, { data: vd }] = await Promise.all([
      supabase.from("ngo_details").select("id, ngo_name, verification_status"),
      supabase.from("ngo_volunteer_relations").select("ngo_id, volunteer_id"),
      supabase.from("volunteer_details").select("id, full_name"),
    ]);
    if (nd) setNgos(nd as any);
    if (vd) setAllVols(vd as any);
    if (rel && vd) {
      const map = new Map((vd as any[]).map((v) => [v.id, v.full_name]));
      setVols((rel as any[]).map((r) => ({ id: r.volunteer_id, full_name: map.get(r.volunteer_id) || "Unknown", ngoId: r.ngo_id })));
    }
  };
  useEffect(() => { load(); }, []);

  const remove = async (ngoId: string, volId: string) => {
    await supabase.from("ngo_volunteer_relations").delete().eq("ngo_id", ngoId).eq("volunteer_id", volId);
    toast.success("Volunteer removed");
    load();
  };
  const add = async (ngoId: string, volId: string) => {
    if (!volId) return;
    const { error } = await supabase.from("ngo_volunteer_relations").insert({ ngo_id: ngoId, volunteer_id: volId } as any);
    if (error) toast.error(error.message);
    else { toast.success("Volunteer added"); load(); }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">NGO Teams</h2>
      <div className="grid gap-3">
        {ngos.map((n) => {
          const teamVols = vols.filter((v) => v.ngoId === n.id);
          const open = openId === n.id;
          return (
            <Card key={n.id} className="overflow-hidden">
              <button onClick={() => setOpenId(open ? null : n.id)} className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors">
                {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Users className="h-4 w-4 text-primary" />
                <span className="font-bold flex-1 text-left">{n.ngo_name}</span>
                <span className="text-xs text-muted-foreground">{teamVols.length} volunteers</span>
              </button>
              <AnimatePresence>
                {open && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t bg-muted/20">
                    <div className="p-4 space-y-2">
                      {teamVols.length === 0 && <p className="text-sm text-muted-foreground">No volunteers in this team yet.</p>}
                      {teamVols.map((v) => (
                        <div key={v.id} className="flex items-center gap-2 rounded-lg bg-background p-2">
                          <span className="text-sm flex-1">{v.full_name}</span>
                          <Button size="sm" variant="ghost" onClick={() => remove(n.id, v.id)}><X className="h-3.5 w-3.5" /></Button>
                        </div>
                      ))}
                      <div className="pt-2 flex gap-2">
                        <select id={`add-${n.id}`} className="flex-1 h-9 rounded-lg border bg-background px-2 text-xs">
                          <option value="">Add volunteer…</option>
                          {allVols.filter((av) => !teamVols.some((tv) => tv.id === av.id)).map((v) => (
                            <option key={v.id} value={v.id}>{v.full_name}</option>
                          ))}
                        </select>
                        <Button size="sm" onClick={() => {
                          const sel = (document.getElementById(`add-${n.id}`) as HTMLSelectElement);
                          add(n.id, sel.value);
                          sel.value = "";
                        }}>Add</Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>
    </div>
  );
}