import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Power, Vote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PollCard } from "./PollCard";
import { toast } from "sonner";
import type { Poll, Issue } from "@/data/mockData";

interface Props {
  polls: Poll[];
  issues: Issue[];
  onCreate: (poll: Poll) => void;
  onToggle: (pollId: string) => void;
  onDelete: (pollId: string) => void;
}

export function PollManagementPanel({ polls, issues, onCreate, onToggle, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [issueId, setIssueId] = useState<string>(issues[0]?.id ?? "");
  const [question, setQuestion] = useState("");
  const [opt1, setOpt1] = useState("Yes");
  const [opt2, setOpt2] = useState("No");

  const issueById = useMemo(() => new Map(issues.map((i) => [i.id, i])), [issues]);

  const handleCreate = () => {
    if (!question.trim() || !issueId) {
      toast.error("Question and linked issue are required");
      return;
    }
    const poll: Poll = {
      id: `POLL-${Date.now()}`,
      issueId,
      question: question.trim(),
      options: [
        { label: opt1.trim() || "Yes", votes: 0 },
        { label: opt2.trim() || "No", votes: 0 },
      ],
      active: true,
      createdAt: new Date().toISOString(),
    };
    onCreate(poll);
    toast.success("Poll created");
    setQuestion("");
    setOpt1("Yes");
    setOpt2("No");
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Vote className="h-5 w-5 text-primary" /> Poll Management
          </h2>
          <p className="text-xs text-muted-foreground mt-1">{polls.length} total · {polls.filter(p => p.active).length} active</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 rounded-xl"><Plus className="h-4 w-4" /> Create Poll</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Create Community Poll</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Linked Issue</label>
                <Select value={issueId} onValueChange={setIssueId}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {issues.map(i => <SelectItem key={i.id} value={i.id} className="text-xs">{i.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Question</label>
                <Input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Is this issue urgent?" className="mt-1 h-9 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Option 1 (Urgent)</label>
                  <Input value={opt1} onChange={e => setOpt1(e.target.value)} className="mt-1 h-9 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Option 2</label>
                  <Input value={opt2} onChange={e => setOpt2(e.target.value)} className="mt-1 h-9 text-sm" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreate}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {polls.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 p-10 text-center">
          <Vote className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No polls yet. Create the first.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {polls.map(p => (
            <motion.div key={p.id} layout className="space-y-2">
              <PollCard poll={p} issueTitle={issueById.get(p.issueId)?.title} showStatus />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 gap-1.5 h-8 text-xs" onClick={() => onToggle(p.id)}>
                  <Power className="h-3 w-3" /> {p.active ? "Disable" : "Enable"}
                </Button>
                <Button size="sm" variant="destructive" className="flex-1 gap-1.5 h-8 text-xs" onClick={() => { onDelete(p.id); toast.success("Poll removed"); }}>
                  <Trash2 className="h-3 w-3" /> Remove
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}