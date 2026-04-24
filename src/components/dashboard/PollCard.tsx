import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Poll } from "@/data/mockData";

interface Props {
  poll: Poll;
  issueTitle?: string;
  onVote?: (pollId: string, optionIndex: number) => void;
  showStatus?: boolean;
}

export function PollCard({ poll, issueTitle, onVote, showStatus }: Props) {
  const [voted, setVoted] = useState<number | null>(null);
  const total = poll.options.reduce((s, o) => s + o.votes, 0);

  const handleVote = (idx: number) => {
    if (voted !== null || !poll.active) return;
    setVoted(idx);
    onVote?.(poll.id, idx);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-sm transition-all hover:shadow-md",
        !poll.active && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          {issueTitle && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              {issueTitle}
            </p>
          )}
          <h3 className="text-sm font-bold text-card-foreground leading-tight mt-0.5">{poll.question}</h3>
        </div>
        {showStatus && (
          <span className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
            poll.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
          )}>
            {poll.active ? "Active" : "Inactive"}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {poll.options.map((opt, idx) => {
          const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
          const showResult = voted !== null || !poll.active;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleVote(idx)}
              disabled={!poll.active}
              className={cn(
                "relative w-full overflow-hidden rounded-lg border text-left transition-all",
                "px-3 py-2 text-xs font-medium",
                voted === idx ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                !poll.active && "cursor-not-allowed"
              )}
            >
              {showResult && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={cn(
                    "absolute inset-y-0 left-0 -z-0",
                    voted === idx ? "bg-primary/15" : "bg-muted"
                  )}
                />
              )}
              <div className="relative z-10 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  {voted === idx && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                  {opt.label}
                </span>
                {showResult && <span className="font-bold tabular-nums">{pct}%</span>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <BarChart3 className="h-3 w-3" />
        <span>{total} total votes</span>
      </div>
    </motion.div>
  );
}