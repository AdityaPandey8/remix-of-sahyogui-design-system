import { useMemo } from "react";
import { TrendingUp, ThumbsUp, MessageSquare, Vote } from "lucide-react";
import type { Issue, Poll, DiscussionComment } from "@/data/mockData";

interface Props {
  issues: Issue[];
  polls: Poll[];
  comments: DiscussionComment[];
  limit?: number;
}

export function TrendingMonitor({ issues, polls, comments, limit = 5 }: Props) {
  const ranked = useMemo(() => {
    return issues
      .map((i) => {
        const c = comments.filter((x) => x.issueId === i.id).length;
        const pollVotes = polls
          .filter((p) => p.issueId === i.id)
          .reduce((s, p) => s + p.options.reduce((a, o) => a + o.votes, 0), 0);
        const score = i.upvotes * 2 + c * 3 + pollVotes;
        return { issue: i, score, comments: c, pollVotes };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }, [issues, polls, comments, limit]);

  return (
    <div className="rounded-2xl border bg-card/50 p-5">
      <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-primary" /> Trending Issues
      </h3>
      <div className="space-y-2">
        {ranked.map((r, idx) => (
          <div key={r.issue.id} className="flex items-center gap-3 rounded-xl border bg-background/40 p-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{r.issue.title}</p>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5"><ThumbsUp className="h-3 w-3" /> {r.issue.upvotes}</span>
                <span className="flex items-center gap-0.5"><MessageSquare className="h-3 w-3" /> {r.comments}</span>
                <span className="flex items-center gap-0.5"><Vote className="h-3 w-3" /> {r.pollVotes}</span>
              </div>
            </div>
            <span className="text-xs font-bold tabular-nums text-primary">{r.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}