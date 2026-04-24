import { useMemo } from "react";
import { Activity, ThumbsUp, MessageSquare, Vote } from "lucide-react";
import type { Issue, Poll, DiscussionComment } from "@/data/mockData";

interface Props {
  issues: Issue[];
  polls: Poll[];
  comments: DiscussionComment[];
}

export function CommunityInsightsPanel({ issues, polls, comments }: Props) {
  const rows = useMemo(() => {
    return issues.map((i) => {
      const issuePolls = polls.filter((p) => p.issueId === i.id);
      const pollVotes = issuePolls.reduce((s, p) => s + p.options.reduce((a, o) => a + o.votes, 0), 0);
      const c = comments.filter((x) => x.issueId === i.id).length;
      return { issue: i, votes: i.upvotes, pollVotes, polls: issuePolls.length, comments: c };
    }).sort((a, b) => (b.votes + b.pollVotes + b.comments) - (a.votes + a.pollVotes + a.comments));
  }, [issues, polls, comments]);

  const totals = useMemo(() => ({
    votes: issues.reduce((s, i) => s + i.upvotes, 0),
    polls: polls.length,
    pollVotes: polls.reduce((s, p) => s + p.options.reduce((a, o) => a + o.votes, 0), 0),
    comments: comments.length,
  }), [issues, polls, comments]);

  return (
    <div className="rounded-2xl border bg-card/50 p-5">
      <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
        <Activity className="h-4 w-4 text-primary" /> Community Insights
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        <div className="rounded-xl border bg-background/40 p-3 text-center">
          <ThumbsUp className="h-4 w-4 mx-auto text-primary mb-1" />
          <p className="text-lg font-bold tabular-nums">{totals.votes}</p>
          <p className="text-[10px] text-muted-foreground">Total Votes</p>
        </div>
        <div className="rounded-xl border bg-background/40 p-3 text-center">
          <Vote className="h-4 w-4 mx-auto text-primary mb-1" />
          <p className="text-lg font-bold tabular-nums">{totals.polls}</p>
          <p className="text-[10px] text-muted-foreground">Polls</p>
        </div>
        <div className="rounded-xl border bg-background/40 p-3 text-center">
          <Vote className="h-4 w-4 mx-auto text-warning mb-1" />
          <p className="text-lg font-bold tabular-nums">{totals.pollVotes}</p>
          <p className="text-[10px] text-muted-foreground">Poll Responses</p>
        </div>
        <div className="rounded-xl border bg-background/40 p-3 text-center">
          <MessageSquare className="h-4 w-4 mx-auto text-success mb-1" />
          <p className="text-lg font-bold tabular-nums">{totals.comments}</p>
          <p className="text-[10px] text-muted-foreground">Comments</p>
        </div>
      </div>

      <div className="space-y-1.5 max-h-[360px] overflow-y-auto">
        {rows.map((r) => (
          <div key={r.issue.id} className="flex items-center gap-3 rounded-lg border bg-background/30 px-3 py-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{r.issue.title}</p>
              <p className="text-[10px] text-muted-foreground truncate">{r.issue.location}</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] tabular-nums shrink-0">
              <span className="flex items-center gap-0.5"><ThumbsUp className="h-3 w-3 text-primary" /> {r.votes}</span>
              <span className="flex items-center gap-0.5"><Vote className="h-3 w-3 text-warning" /> {r.pollVotes}</span>
              <span className="flex items-center gap-0.5"><MessageSquare className="h-3 w-3 text-success" /> {r.comments}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}