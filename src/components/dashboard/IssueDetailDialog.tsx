import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import { Progress } from "@/components/ui/progress";
import { MapPin, Clock, Users, ThumbsUp, MessageSquare, Star, Image, Trash2, ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ngos, volunteers, type Issue } from "@/data/mockData";
import { AIInsightsPanel } from "@/components/dashboard/AIInsightsPanel";
import { getIssueMapLink } from "@/lib/map-utils";
import { toast } from "sonner";

interface IssueDetailDialogProps {
  issue: Issue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpvote?: (id: string) => void;
  onComment?: (id: string, text: string) => void;
  onDelete?: (id: string) => void;
  showAIInsights?: boolean;
  showDelete?: boolean;
}

export function IssueDetailDialog({ issue, open, onOpenChange, onUpvote, onComment, onDelete, showAIInsights, showDelete }: IssueDetailDialogProps) {
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);

  if (!issue) return null;
  const ngo = ngos.find((n) => n.id === issue.assignedNgo);
  const assignedVols = volunteers.filter(v => issue.assignedVolunteers.includes(v.id));
  const scoreColor = issue.aiPriorityScore >= 80 ? "text-danger" : issue.aiPriorityScore >= 50 ? "text-warning" : "text-success";
  const progressColor = issue.aiPriorityScore >= 80 ? "[&>div]:bg-danger" : issue.aiPriorityScore >= 50 ? "[&>div]:bg-warning" : "[&>div]:bg-success";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base leading-snug pr-6">{issue.title}</DialogTitle>
          <DialogDescription className="sr-only">Issue details</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <StatusBadge status={issue.status} />
          <UrgencyBadge urgency={issue.urgency} />
          <span className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">{issue.category}</span>
        </div>

        <p className="text-sm text-muted-foreground">{issue.description}</p>

        <div className="grid grid-cols-2 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{issue.location}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{issue.responseTime || "Awaiting"}</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{issue.affectedPeople} affected</span>
          <span className="flex items-center gap-1">Reported by: {issue.reportedBy}</span>
        </div>

        {/* Track location */}
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" className="rounded-xl gap-1.5 font-bold">
            <a href={getIssueMapLink(issue)} target="_blank" rel="noopener noreferrer">
              <MapPin className="h-3.5 w-3.5" /> Track Location <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl gap-1.5"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(getIssueMapLink(issue));
                toast.success("Map link copied");
              } catch { toast.error("Copy failed"); }
            }}
          >
            <Copy className="h-3.5 w-3.5" /> Copy Link
          </Button>
        </div>

        {/* Photos/Videos */}
        {issue.photos.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Image className="h-3 w-3" /> Photos/Videos ({issue.photos.length})</p>
            <div className="grid grid-cols-3 gap-2">
              {issue.photos.map((photo, idx) => (
                <div key={idx} className="aspect-video rounded-lg bg-muted border overflow-hidden">
                  <img src={photo} alt={`Issue photo ${idx + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {ngo && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
            <p className="text-xs font-medium text-primary">Assigned NGO</p>
            <p className="text-sm font-semibold">{ngo.name}</p>
            <p className="text-xs text-muted-foreground">{ngo.focusArea}</p>
          </div>
        )}

        {/* Assigned Volunteers */}
        {assignedVols.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assigned Volunteers ({assignedVols.length})</p>
            {assignedVols.map(v => (
              <div key={v.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-2">
                <p className="text-xs font-medium">{v.name}</p>
                <p className="text-[10px] text-muted-foreground">{v.skills.join(", ")}</p>
              </div>
            ))}
          </div>
        )}

        {/* AI Insights Panel */}
        {showAIInsights && <AIInsightsPanel issue={issue} compact />}

        {/* Progress timeline */}
        <div className="space-y-2">
          <p className="text-xs font-medium">Progress Timeline</p>
          {["Reported", "Verified", "In Progress", "Solved"].map((step, i) => {
            const statusOrder = ["Pending", "Verified", "In Progress", "Solved"];
            const current = statusOrder.indexOf(issue.status);
            const active = i <= current;
            return (
              <div key={step} className="flex items-center gap-2">
                <div className={cn("h-2.5 w-2.5 rounded-full transition-colors", active ? "bg-primary shadow-sm" : "bg-muted")} />
                <span className={cn("text-xs transition-colors", active ? "text-foreground font-medium" : "text-muted-foreground")}>{step}</span>
              </div>
            );
          })}
        </div>

        {/* Engagement */}
        <div className="flex items-center gap-3 border-t pt-3">
          <Button variant="outline" size="sm" onClick={() => onUpvote?.(issue.id)} className="gap-1 transition-all hover:shadow-sm active:scale-95">
            <ThumbsUp className="h-3 w-3" /> {issue.upvotes}
          </Button>
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><MessageSquare className="h-3 w-3" />{issue.comments.length} comments</span>
          {showDelete && onDelete && (
            <Button variant="destructive" size="sm" className="gap-1 ml-auto" onClick={() => onDelete(issue.id)}>
              <Trash2 className="h-3 w-3" /> Delete
            </Button>
          )}
        </div>

        {/* Comments */}
        {issue.comments.length > 0 && (
          <div className="space-y-2">
            {issue.comments.map((c) => (
              <div key={c.id} className="rounded-lg bg-muted/50 p-2.5">
                <p className="text-xs font-medium">{c.author}</p>
                <p className="text-xs text-muted-foreground">{c.text}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input placeholder="Add a comment…" value={comment} onChange={(e) => setComment(e.target.value)} className="h-8 text-xs" />
          <Button size="sm" variant="outline" onClick={() => { if (comment.trim()) { onComment?.(issue.id, comment); setComment(""); } }}>Post</Button>
        </div>

        {/* Rating */}
        {issue.status === "Solved" && (
          <div className="border-t pt-3">
            <p className="text-xs font-medium mb-1">Rate Response</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)} className="transition-transform hover:scale-125 active:scale-95">
                  <Star className={cn("h-5 w-5", s <= rating ? "fill-warning text-warning" : "text-muted-foreground")} />
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
