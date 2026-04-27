import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Building2, Filter, Handshake, MessageSquare, Package, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { NGO } from "@/data/mockData";

type ProposalKind = "joint" | "resources" | "message";
type ProposalStatus = "pending" | "accepted" | "declined";

interface Proposal {
  id: string;
  ngoId: string;
  ngoName: string;
  kind: ProposalKind;
  text: string;
  status: ProposalStatus;
  direction: "out" | "in";
  createdAt: string;
}

const kindMeta: Record<ProposalKind, { label: string; icon: any; color: string }> = {
  joint: { label: "Joint Operation", icon: Handshake, color: "bg-primary/10 text-primary" },
  resources: { label: "Resource Share", icon: Package, color: "bg-warning/10 text-warning" },
  message: { label: "Message", icon: MessageSquare, color: "bg-success/10 text-success" },
};

const statusMeta: Record<ProposalStatus, string> = {
  pending: "bg-warning/10 text-warning border-warning/30",
  accepted: "bg-success/10 text-success border-success/30",
  declined: "bg-destructive/10 text-destructive border-destructive/30",
};

interface Props {
  ngos: NGO[];
  currentNgoId?: string;
  onOpenDetails?: (ngo: NGO) => void;
}

export function CollaborationPanel({ ngos, currentNgoId, onOpenDetails }: Props) {
  const [focusFilter, setFocusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [proposals, setProposals] = useState<Proposal[]>([
    {
      id: "p-demo-1",
      ngoId: "demo",
      ngoName: "Helping Hands Foundation",
      kind: "joint",
      text: "Coordinate flood relief in Patna — share volunteer rosters?",
      status: "pending",
      direction: "in",
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
  ]);

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTarget, setComposeTarget] = useState<NGO | null>(null);
  const [composeKind, setComposeKind] = useState<ProposalKind>("joint");
  const [composeText, setComposeText] = useState("");

  const focusAreas = useMemo(() => {
    return Array.from(new Set(ngos.map((n) => n.focusArea).filter(Boolean)));
  }, [ngos]);

  const filtered = useMemo(() => {
    return ngos
      .filter((n) => n.id !== currentNgoId)
      .filter((n) => (focusFilter === "all" ? true : n.focusArea === focusFilter))
      .filter((n) => (search ? n.name.toLowerCase().includes(search.toLowerCase()) : true));
  }, [ngos, currentNgoId, focusFilter, search]);

  const openCompose = (ngo: NGO, kind: ProposalKind) => {
    setComposeTarget(ngo);
    setComposeKind(kind);
    setComposeText(
      kind === "joint"
        ? `We'd like to coordinate on an active issue. Are you available for a joint operation?`
        : kind === "resources"
          ? `Can you share specific resources (medical/food/shelter) with our active response?`
          : `Hi ${ngo.name}, reaching out from our coordination team.`
    );
    setComposeOpen(true);
  };

  const send = () => {
    if (!composeTarget) return;
    const p: Proposal = {
      id: `p-${Date.now()}`,
      ngoId: composeTarget.id,
      ngoName: composeTarget.name,
      kind: composeKind,
      text: composeText.trim(),
      status: "pending",
      direction: "out",
      createdAt: new Date().toISOString(),
    };
    setProposals((prev) => [p, ...prev]);
    toast.success(`Proposal sent to ${composeTarget.name}`);
    setComposeOpen(false);
    setComposeText("");
    // Auto-simulate response after a moment for demo realism
    setTimeout(() => {
      setProposals((prev) =>
        prev.map((x) =>
          x.id === p.id ? { ...x, status: Math.random() > 0.3 ? "accepted" : "declined" } : x
        )
      );
    }, 6000);
  };

  const respond = (id: string, status: ProposalStatus) => {
    setProposals((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    toast.success(status === "accepted" ? "Proposal accepted" : "Proposal declined");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" /> NGO Collaboration Network
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              placeholder="Search NGOs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-44 rounded-xl"
            />
          </div>
          <select
            value={focusFilter}
            onChange={(e) => setFocusFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border-2 bg-muted/20 text-xs font-bold"
          >
            <option value="all">All Areas</option>
            {focusAreas.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <Filter className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Proposal feed */}
      {proposals.length > 0 && (
        <div className="rounded-2xl border bg-card/40 backdrop-blur-md p-4 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Collaboration Feed</p>
          {proposals.map((p) => {
            const Meta = kindMeta[p.kind];
            const Icon = Meta.icon;
            return (
              <div key={p.id} className="flex items-start gap-3 p-3 rounded-xl border bg-background/50">
                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", Meta.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold">{p.direction === "out" ? `To ${p.ngoName}` : `From ${p.ngoName}`}</p>
                    <span className="text-[10px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded bg-muted">{Meta.label}</span>
                    <span className={cn("text-[10px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded border", statusMeta[p.status])}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{p.text}</p>
                </div>
                {p.direction === "in" && p.status === "pending" && (
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" className="h-8 rounded-lg" onClick={() => respond(p.id, "accepted")}>Accept</Button>
                    <Button size="sm" variant="ghost" className="h-8 rounded-lg text-destructive" onClick={() => respond(p.id, "declined")}>Decline</Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* NGO grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((ngo) => (
          <div key={ngo.id} className="rounded-2xl border bg-card p-5 transition-all hover:shadow-md group">
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{ngo.name}</p>
                <p className="text-xs text-muted-foreground">{ngo.focusArea}</p>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                {ngo.successRate}% success
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div><p className="text-base font-bold tabular-nums">{ngo.volunteerIds.length}</p><p className="text-[9px] text-muted-foreground">Volunteers</p></div>
              <div><p className="text-base font-bold tabular-nums">{ngo.issuesHandled}</p><p className="text-[9px] text-muted-foreground">Handled</p></div>
              <div><p className="text-base font-bold tabular-nums">{ngo.activeIssues}</p><p className="text-[9px] text-muted-foreground">Active</p></div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Button size="sm" className="h-8 rounded-lg flex-1 gap-1 text-xs font-bold" onClick={() => openCompose(ngo, "joint")}>
                <Handshake className="h-3 w-3" /> Joint Op
              </Button>
              <Button size="sm" variant="outline" className="h-8 rounded-lg flex-1 gap-1 text-xs" onClick={() => openCompose(ngo, "resources")}>
                <Package className="h-3 w-3" /> Resources
              </Button>
              <Button size="sm" variant="ghost" className="h-8 rounded-lg gap-1 text-xs" onClick={() => openCompose(ngo, "message")}>
                <MessageSquare className="h-3 w-3" />
              </Button>
              {onOpenDetails && (
                <Button size="sm" variant="outline" className="h-8 rounded-lg gap-1 text-xs" onClick={() => onOpenDetails(ngo)}>
                  Details
                </Button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            <Sparkles className="h-6 w-6 mx-auto mb-2 opacity-40" />
            No NGOs match your filters.
          </div>
        )}
      </div>

      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" /> {composeTarget && `Send to ${composeTarget.name}`}
            </DialogTitle>
            <DialogDescription>{composeTarget?.focusArea}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {(["joint", "resources", "message"] as ProposalKind[]).map((k) => (
                <Button
                  key={k}
                  type="button"
                  variant={composeKind === k ? "default" : "outline"}
                  onClick={() => setComposeKind(k)}
                  className="h-9 rounded-lg text-[10px] font-bold uppercase"
                >
                  {kindMeta[k].label}
                </Button>
              ))}
            </div>
            <textarea
              value={composeText}
              onChange={(e) => setComposeText(e.target.value)}
              className="w-full min-h-[100px] rounded-xl border-2 bg-muted/20 p-3 text-sm outline-none focus:bg-background"
              placeholder="Write your proposal…"
            />
            <Button onClick={send} className="w-full h-11 rounded-xl font-bold gap-2">
              <Send className="h-4 w-4" /> Send Proposal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}