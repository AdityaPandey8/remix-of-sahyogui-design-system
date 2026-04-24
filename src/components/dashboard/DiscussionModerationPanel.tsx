import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { DiscussionComment, Issue } from "@/data/mockData";

interface Props {
  comments: DiscussionComment[];
  issues: Issue[];
  onDelete: (id: string) => void;
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function DiscussionModerationPanel({ comments, issues, onDelete }: Props) {
  const sorted = useMemo(
    () => [...comments].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()),
    [comments]
  );
  const issueById = useMemo(() => new Map(issues.map((i) => [i.id, i])), [issues]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" /> Discussion Moderation
        </h2>
        <p className="text-xs text-muted-foreground mt-1">{sorted.length} comments across {new Set(sorted.map(c => c.issueId)).size} issues</p>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {sorted.map((c) => {
            const issue = issueById.get(c.issueId);
            return (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -20 }}
                className="rounded-xl border bg-card p-3 flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 text-[10px]">
                    <span className="font-bold">{c.user}</span>
                    <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(c.time)}</span>
                    {issue && <span className="rounded-full bg-primary/10 text-primary px-1.5 py-0.5 font-bold truncate max-w-[200px]">{issue.title}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{c.text}</p>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 w-7 p-0 shrink-0"
                  onClick={() => { onDelete(c.id); toast.success("Comment deleted"); }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {sorted.length === 0 && (
          <div className="rounded-2xl border border-dashed bg-muted/20 p-10 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No comments to moderate.</p>
          </div>
        )}
      </div>
    </div>
  );
}