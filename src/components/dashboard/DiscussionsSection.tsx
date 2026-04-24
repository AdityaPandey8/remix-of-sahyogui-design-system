import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DiscussionComment, Issue } from "@/data/mockData";

interface Props {
  comments: DiscussionComment[];
  issues: Issue[];
  onAddComment: (issueId: string, text: string) => void;
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function DiscussionsSection({ comments, issues, onAddComment }: Props) {
  const [selectedIssueId, setSelectedIssueId] = useState<string>(issues[0]?.id ?? "");
  const [text, setText] = useState("");

  const issueById = useMemo(() => new Map(issues.map((i) => [i.id, i])), [issues]);

  // Latest first, flat list
  const sorted = useMemo(
    () => [...comments].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()),
    [comments]
  );

  const handlePost = () => {
    if (!text.trim() || !selectedIssueId) return;
    onAddComment(selectedIssueId, text.trim());
    setText("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" /> Discussions
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Share updates and observations on active issues. Latest first.
        </p>
      </div>

      {/* Composer */}
      <div className="rounded-2xl border bg-card/50 p-4 space-y-3">
        <Select value={selectedIssueId} onValueChange={setSelectedIssueId}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Select an issue…" />
          </SelectTrigger>
          <SelectContent>
            {issues.map((i) => (
              <SelectItem key={i.id} value={i.id} className="text-xs">
                {i.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add your comment…"
            className="h-9 text-xs"
            onKeyDown={(e) => e.key === "Enter" && handlePost()}
          />
          <Button size="sm" onClick={handlePost} className="gap-1.5 shrink-0">
            <Send className="h-3.5 w-3.5" /> Post
          </Button>
        </div>
      </div>

      {/* Comment feed */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {sorted.map((c) => {
            const issue = issueById.get(c.issueId);
            return (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border bg-card p-3"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-xs font-bold">{c.user}</p>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {timeAgo(c.time)}
                  </span>
                </div>
                {issue && (
                  <p className="text-[10px] uppercase tracking-wider text-primary/70 font-bold mb-1 truncate">
                    {issue.title}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{c.text}</p>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {sorted.length === 0 && (
          <div className="rounded-2xl border border-dashed bg-muted/20 p-10 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No comments yet. Be the first.</p>
          </div>
        )}
      </div>
    </div>
  );
}