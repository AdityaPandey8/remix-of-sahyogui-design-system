import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain } from "lucide-react";
import { useCrisis } from "@/contexts/CrisisContext";
import { getRequiredServices } from "@/lib/crisis-utils";
import { serviceTypeLabel } from "@/data/emergencyServices";

export function AIExplanationCard() {
  const { activeIssue, broadcast } = useCrisis();
  if (!activeIssue || !broadcast) return null;
  const required = getRequiredServices(activeIssue.category);
  return (
    <Card className="border-primary/30 bg-primary/[0.04]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" /> AI Decision Rationale
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-2">
        <p>
          Selected responder types based on issue category{" "}
          <span className="font-bold">{activeIssue.category}</span>:{" "}
          {required.map((r) => serviceTypeLabel[r]).join(", ")}.
        </p>
        <p className="text-muted-foreground text-xs">
          Filtered by proximity (Euclidean distance ≤ 4°) to{" "}
          <span className="font-mono">{activeIssue.location}</span>. Crisis mode boosts
          recommendation from "deploy 3 volunteers" → "deploy ALL nearby volunteers + notify emergency services".
        </p>
      </CardContent>
    </Card>
  );
}