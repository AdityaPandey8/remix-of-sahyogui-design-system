import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Eye, FileText, Clock, Search } from "lucide-react";
import { toast } from "sonner";
import { TrustScoreBadge, calcNGOTrust } from "./TrustScoreBadge";
import { cn } from "@/lib/utils";

interface Row {
  id: string;
  ngo_name: string;
  registration_number: string;
  darpan_id: string | null;
  pan_tax_id: string;
  ngo_type: string | null;
  document_url: string | null;
  verification_status: string;
  rejection_reason: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  email?: string | null;
  est_year?: number | null;
  areas_of_work?: string[] | null;
  is_flagged?: boolean | null;
}

export function NGOVerificationPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "rejected">("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Row | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const load = async () => {
    const { data } = await supabase.from("ngo_details").select("*").order("created_at", { ascending: false });
    if (data) setRows(data as any);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: "verified" | "rejected" | "pending", rej?: string) => {
    const { error } = await supabase
      .from("ngo_details")
      .update({ verification_status: status, rejection_reason: rej || null, verified_at: status === "verified" ? new Date().toISOString() : null } as any)
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`NGO ${status}`);
    setSelected(null);
    setReason("");
    load();
  };

  const filtered = rows.filter((r) =>
    (filter === "all" || r.verification_status === filter) &&
    (r.ngo_name?.toLowerCase().includes(q.toLowerCase()) || r.registration_number?.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <h2 className="text-2xl font-bold flex-1">NGO Verification</h2>
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search NGOs…" className="pl-9 h-9 w-56 rounded-xl" />
        </div>
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          {(["all", "pending", "verified", "rejected"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cn("px-3 py-1 rounded-lg text-xs font-bold capitalize", filter === f && "bg-background shadow")}>{f}</button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground text-sm">No NGOs match this filter.</Card>
        )}
        {filtered.map((r) => {
          const score = calcNGOTrust({ verified: r.verification_status === "verified" });
          return (
            <Card key={r.id} className="p-4 flex flex-wrap items-center gap-4 hover:shadow-md transition-shadow">
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold">{r.ngo_name}</h3>
                  <StatusPill status={r.verification_status} />
                  <TrustScoreBadge score={score} />
                  {r.is_flagged && <span className="text-[10px] font-bold text-destructive uppercase tracking-wider">⚠ Flagged</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Reg #{r.registration_number} · Darpan {r.darpan_id || "—"} · {r.city || "—"}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelected(r)} className="gap-1"><Eye className="h-3.5 w-3.5" /> Details</Button>
                {r.document_url && (
                  <Button size="sm" variant="outline" onClick={() => setDocPreview(r.document_url)} className="gap-1"><FileText className="h-3.5 w-3.5" /> Doc</Button>
                )}
                {r.verification_status !== "verified" && (
                  <Button size="sm" onClick={() => setStatus(r.id, "verified")} className="gap-1 bg-success hover:bg-success/90"><CheckCircle2 className="h-3.5 w-3.5" /> Approve</Button>
                )}
                {r.verification_status !== "rejected" && (
                  <Button size="sm" variant="destructive" onClick={() => setSelected(r)} className="gap-1"><XCircle className="h-3.5 w-3.5" /> Reject</Button>
                )}
                {r.verification_status !== "pending" && (
                  <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, "pending")} className="gap-1"><Clock className="h-3.5 w-3.5" /> Pending</Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selected?.ngo_name}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <Row k="Registration No." v={selected.registration_number} />
              <Row k="Type" v={selected.ngo_type || "—"} />
              <Row k="Established" v={selected.est_year?.toString() || "—"} />
              <Row k="Darpan ID" v={selected.darpan_id || "—"} />
              <Row k="PAN / Tax" v={selected.pan_tax_id || "—"} />
              <Row k="Phone" v={selected.phone || "—"} />
              <Row k="Location" v={[selected.city, selected.state].filter(Boolean).join(", ") || "—"} />
              <Row k="Areas" v={(selected.areas_of_work || []).join(", ") || "—"} />
              <Row k="Status" v={selected.verification_status} />
              <div className="pt-3 border-t space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider">Reject with reason</p>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional reason" className="h-9 rounded-lg" />
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={() => setStatus(selected.id, "rejected", reason)} className="flex-1">Reject</Button>
                  <Button size="sm" onClick={() => setStatus(selected.id, "verified")} className="flex-1 bg-success hover:bg-success/90">Approve</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!docPreview} onOpenChange={(o) => !o && setDocPreview(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Document Preview</DialogTitle></DialogHeader>
          <div className="aspect-[3/4] rounded-xl border border-dashed bg-muted/30 flex flex-col items-center justify-center gap-3">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <p className="text-xs font-bold text-muted-foreground">{docPreview}</p>
            <p className="text-[10px] text-muted-foreground">Simulated preview — full document viewer pending storage integration.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    verified: "bg-success/10 text-success border-success/30",
    pending: "bg-warning/10 text-warning border-warning/30",
    rejected: "bg-destructive/10 text-destructive border-destructive/30",
  };
  return <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", map[status] || "bg-muted")}>{status}</span>;
}