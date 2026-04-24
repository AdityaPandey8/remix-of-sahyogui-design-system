import { useMemo } from "react";
import { Vote } from "lucide-react";
import { PollCard } from "./PollCard";
import type { Poll, Issue } from "@/data/mockData";

interface Props {
  polls: Poll[];
  issues: Issue[];
  onVote: (pollId: string, optionIndex: number) => void;
}

export function PollsSection({ polls, issues, onVote }: Props) {
  const activePolls = useMemo(() => polls.filter((p) => p.active), [polls]);
  const issueById = useMemo(() => new Map(issues.map((i) => [i.id, i])), [issues]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Vote className="h-5 w-5 text-primary" /> Community Polls
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Your vote shapes how priorities are set. One tap, one voice.
        </p>
      </div>

      {activePolls.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 p-10 text-center">
          <Vote className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No active polls right now.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {activePolls.map((p) => (
            <PollCard
              key={p.id}
              poll={p}
              issueTitle={issueById.get(p.issueId)?.title}
              onVote={onVote}
            />
          ))}
        </div>
      )}
    </div>
  );
}