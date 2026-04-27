import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Bell, CheckCircle2, Clock, Megaphone, Send, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type Channel = "all" | "team" | "crisis" | "skill";
type Priority = "info" | "urgent" | "critical";

interface SentBroadcast {
  id: string;
  channel: Channel;
  priority: Priority;
  message: string;
  delivered: number;
  scheduled: boolean;
  at: string;
}

const channelMeta: Record<Channel, { label: string; icon: any }> = {
  all: { label: "All Volunteers", icon: Users },
  team: { label: "My Team", icon: Users },
  crisis: { label: "Crisis Responders", icon: Bell },
  skill: { label: "Specific Skill", icon: Sparkles },
};

const priorityMeta: Record<Priority, { label: string; severity: string; class: string }> = {
  info: { label: "Info", severity: "Low", class: "bg-primary/10 text-primary border-primary/30" },
  urgent: { label: "Urgent", severity: "Medium", class: "bg-warning/10 text-warning border-warning/30" },
  critical: { label: "Critical", severity: "High", class: "bg-destructive/10 text-destructive border-destructive/30" },
};

const SKILLS = ["First Aid", "Medical Support", "Rescue Operations", "Logistics", "Food Distribution"];

interface Props {
  myVolCount: number;
  globalPoolCount: number;
  ngoName?: string;
}

export function BroadcastPanel({ myVolCount, globalPoolCount, ngoName }: Props) {
  const [channel, setChannel] = useState<Channel>("team");
  const [priority, setPriority] = useState<Priority>("info");
  const [skill, setSkill] = useState<string>(SKILLS[0]);
  const [region, setRegion] = useState<string>("");
  const [message, setMessage] = useState("");
  const [scheduled, setScheduled] = useState(false);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<SentBroadcast[]>([]);

  const audience = useMemo(() => {
    if (channel === "team") return myVolCount;
    if (channel === "all") return myVolCount + globalPoolCount;
    if (channel === "crisis") return Math.max(1, Math.floor((myVolCount + globalPoolCount) * 0.3));
    return Math.max(1, Math.floor(myVolCount * 0.5));
  }, [channel, myVolCount, globalPoolCount]);

  const handleSend = async () => {
    if (!message.trim()) return toast.error("Write a message");
    setSending(true);
    const meta = priorityMeta[priority];
    const channelLabel =
      channel === "skill" ? `${channelMeta[channel].label} (${skill})` : channelMeta[channel].label;

    // Persist as alert (visible across the platform's alert feeds)
    const id = `BCAST-${Date.now()}`;
    const { error } = await supabase.from("alerts").insert({
      id,
      type: "broadcast",
      title: `${ngoName || "NGO"} · ${meta.label} broadcast`,
      message: message.trim(),
      severity: meta.severity,
      affected_area: region || channelLabel,
    });
    setSending(false);

    if (error) {
      // Still record locally as a soft fallback
      toast.error(error.message);
    } else {
      toast.success(`Sent to ~${audience} volunteers`);
    }

    setHistory((prev) => [
      {
        id,
        channel,
        priority,
        message: message.trim(),
        delivered: audience,
        scheduled,
        at: new Date().toISOString(),
      },
      ...prev,
    ]);
    setMessage("");
    setScheduled(false);
  };

  const meta = priorityMeta[priority];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-gradient-to-br from-primary/5 to-primary/10 p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-widest">Broadcast Center</p>
            <p className="text-xs text-muted-foreground">Reach volunteers instantly with priority routing.</p>
          </div>
        </div>

        {/* Channel chips */}
        <div>
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Channel</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {(Object.keys(channelMeta) as Channel[]).map((c) => {
              const Icon = channelMeta[c].icon;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setChannel(c)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all uppercase tracking-tight flex items-center gap-1.5",
                    channel === c
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  <Icon className="h-3 w-3" /> {channelMeta[c].label}
                </button>
              );
            })}
          </div>
        </div>

        {channel === "skill" && (
          <div>
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Required Skill</Label>
            <select value={skill} onChange={(e) => setSkill(e.target.value)} className="mt-1.5 w-full h-10 px-3 rounded-xl border-2 bg-background text-sm">
              {SKILLS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}

        {/* Priority */}
        <div>
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Priority</Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {(Object.keys(priorityMeta) as Priority[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={cn(
                  "h-9 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all",
                  priority === p ? priorityMeta[p].class : "bg-muted/50 border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                {priorityMeta[p].label}
              </button>
            ))}
          </div>
        </div>

        {/* Region + schedule */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Region (optional)</Label>
            <Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g. Patna, Bihar" className="h-10 rounded-xl mt-1.5" />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setScheduled((v) => !v)}
              className={cn(
                "w-full h-10 rounded-xl border-2 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                scheduled ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              <Clock className="h-3.5 w-3.5" /> {scheduled ? "Scheduled" : "Send Now"}
            </button>
          </div>
        </div>

        {/* Message */}
        <div>
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Message</Label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1.5 w-full min-h-[90px] rounded-xl border-2 bg-background p-3 text-sm outline-none focus:ring-1 ring-primary/20"
            placeholder="Type your broadcast — keep it short and actionable."
            maxLength={280}
          />
          <p className="text-[10px] text-muted-foreground mt-1 text-right">{message.length}/280</p>
        </div>

        {/* Preview + send */}
        <div className={cn("rounded-2xl border-2 p-3", meta.class)}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest">{meta.label} preview</p>
            <span className="text-[10px] font-bold flex items-center gap-1"><Users className="h-3 w-3" /> ~{audience} volunteers</span>
          </div>
          <p className="text-sm mt-1 font-medium text-foreground">
            {message || <span className="opacity-60">Your broadcast preview will appear here…</span>}
          </p>
        </div>

        <Button onClick={handleSend} disabled={sending} className="w-full h-12 rounded-2xl font-bold gap-2">
          <Send className="h-4 w-4" />
          {scheduled ? "Schedule Broadcast" : `Send to ~${audience} volunteers`}
        </Button>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Recent Broadcasts</p>
          {history.map((h) => (
            <div key={h.id} className="rounded-xl border bg-card p-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("text-[9px] font-black uppercase tracking-tight px-1.5 py-0.5 rounded border", priorityMeta[h.priority].class)}>
                    {priorityMeta[h.priority].label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{channelMeta[h.channel].label}</span>
                </div>
                <p className="text-xs text-foreground truncate">{h.message}</p>
              </div>
              <span className="text-[10px] text-success flex items-center gap-1 shrink-0"><CheckCircle2 className="h-3 w-3" /> {h.delivered}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}