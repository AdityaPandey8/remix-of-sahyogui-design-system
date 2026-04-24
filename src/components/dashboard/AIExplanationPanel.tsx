import { Brain } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { explainPriority } from "@/lib/ai-insights";
import type { Issue, Poll, DiscussionComment, AIWeights } from "@/data/mockData";

interface Props {
  issue: Issue;
  polls: Poll[];
  comments: DiscussionComment[];
  weights: AIWeights;
}

export function AIExplanationPanel({ issue, polls, comments, weights }: Props) {
  const { score, factors } = explainPriority(issue, polls, comments, weights);
  const tier = score >= 80 ? "High" : score >= 50 ? "Medium" : "Low";
  const tierColor = score >= 80 ? "text-destructive" : score >= 50 ? "text-warning" : "text-success";

  return (
    <div className="rounded-2xl border bg-card/50 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /> AI Priority Explanation</h3>
        <div className="text-right">
          <p className={"text-2xl font-bold tabular-nums " + tierColor}>{score}</p>
          <p className={"text-[10px] font-bold uppercase tracking-wider " + tierColor}>{tier} priority</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-4 truncate">{issue.title}</p>
      <div className="space-y-3">
        {factors.map((f) => (
          <div key={f.label}>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-semibold">{f.label}</span>
              <span className="tabular-nums text-muted-foreground">+{f.contribution}</span>
            </div>
            <Progress value={f.contribution} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground mt-0.5">{f.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}