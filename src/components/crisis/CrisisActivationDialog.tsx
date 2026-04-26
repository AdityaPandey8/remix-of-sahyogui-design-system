import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldAlert } from "lucide-react";
import type { Issue } from "@/data/mockData";
import { useCrisis } from "@/contexts/CrisisContext";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  issues: Issue[];
}

export function CrisisActivationDialog({ open, onOpenChange, issues }: Props) {
  const { activateCrisis } = useCrisis();
  const sorted = [...issues].sort((a, b) => (b.aiPriorityScore ?? 0) - (a.aiPriorityScore ?? 0)).slice(0, 8);
  const [selectedId, setSelectedId] = useState<string>(sorted[0]?.id ?? "");

  const onActivate = () => {
    const issue = issues.find((i) => i.id === selectedId);
    if (!issue) return;
    activateCrisis(issue, "admin");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" /> Activate Crisis Protocol
          </DialogTitle>
          <DialogDescription>
            Select the issue to escalate. Nearby NGOs, volunteers and emergency services will be notified.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[320px] pr-2">
          <div className="space-y-2">
            {sorted.map((i) => (
              <button
                key={i.id}
                onClick={() => setSelectedId(i.id)}
                className={cn(
                  "w-full text-left rounded-xl border p-3 transition-all",
                  selectedId === i.id ? "border-destructive bg-destructive/5" : "hover:bg-muted/50"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold truncate">{i.title}</p>
                  <Badge variant="outline" className="shrink-0 text-[10px]">Score {i.aiPriorityScore ?? "—"}</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{i.location} · {i.category} · {i.urgency}</p>
              </button>
            ))}
            {sorted.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No issues available.</p>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={onActivate} disabled={!selectedId}>
            <ShieldAlert className="h-4 w-4 mr-1.5" /> Activate Crisis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}