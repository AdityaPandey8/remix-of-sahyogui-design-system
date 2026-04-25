import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";

export function calcNGOTrust(opts: { verified: boolean; issuesHandled?: number; successRate?: number }) {
  const v = opts.verified ? 40 : 0;
  const a = Math.min(30, Math.round(((opts.issuesHandled || 0) / 200) * 30));
  const s = Math.min(30, Math.round(((opts.successRate || 0) / 100) * 30));
  return v + a + s;
}

export function calcVolunteerTrust(opts: { tasksCompleted?: number; reliability?: number; available?: boolean }) {
  const t = Math.min(40, Math.round(((opts.tasksCompleted || 0) / 50) * 40));
  const r = Math.min(40, Math.round(((opts.reliability || 0) / 100) * 40));
  const a = opts.available ? 20 : 0;
  return t + r + a;
}

export function TrustScoreBadge({ score }: { score: number }) {
  const tier = score >= 70 ? "High" : score >= 40 ? "Medium" : "Low";
  const cls =
    tier === "High"
      ? "bg-success/10 text-success border-success/30"
      : tier === "Medium"
        ? "bg-primary/10 text-primary border-primary/30"
        : "bg-warning/10 text-warning border-warning/30";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest", cls)}>
      <Shield className="h-3 w-3" /> {score} · {tier}
    </span>
  );
}