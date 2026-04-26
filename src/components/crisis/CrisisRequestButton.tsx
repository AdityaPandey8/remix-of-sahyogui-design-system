import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ShieldAlert } from "lucide-react";
import type { Issue } from "@/data/mockData";
import { useCrisis } from "@/contexts/CrisisContext";
import { cn } from "@/lib/utils";

interface Props {
  issues: Issue[];
  ngoName: string;
}

export function CrisisRequestButton({ issues, ngoName }: Props) {
  const { requests, requestActivation } = useCrisis();
  const [open, setOpen] = useState(false);
  const sorted = [...issues].sort((a, b) => (b.aiPriorityScore ?? 0) - (a.aiPriorityScore ?? 0)).slice(0, 6);
  const [selectedId, setSelectedId] = useState<string>(sorted[0]?.id ?? "");

  const myPending = requests.find((r) => r.requestedBy === ngoName && r.status === "pending");

  const submit = () => {
    const issue = issues.find((i) => i.id === selectedId);
    if (!issue) return;
    requestActivation(issue, ngoName);
    setOpen(false);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <ShieldAlert className="h-4 w-4 mr-1.5" /> Request Crisis Activation
        {myPending && <Badge variant="outline" className="ml-2 text-[10px] bg-warning/10 text-warning border-warning/30">Pending</Badge>}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Crisis Activation</DialogTitle>
            <DialogDescription>Admin will review and approve.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[280px] pr-2">
            <div className="space-y-2">
              {sorted.map((i) => (
                <button
                  key={i.id}
                  onClick={() => setSelectedId(i.id)}
                  className={cn(
                    "w-full text-left rounded-xl border p-3 transition-all",
                    selectedId === i.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  )}
                >
                  <p className="text-sm font-bold truncate">{i.title}</p>
                  <p className="text-[11px] text-muted-foreground">{i.location} · {i.urgency}</p>
                </button>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={!selectedId}>
              <Send className="h-4 w-4 mr-1.5" /> Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}