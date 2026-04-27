import { MapPin, ThumbsUp, MessageSquare, Brain, Activity, Heart, Shield, Droplets, AlertTriangle, HelpCircle, HardHat, Phone, Clock, Users, Building2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Issue, Category } from "@/data/mockData";
import { calcPriorityScore, predictResponseTime, estimateVolunteers } from "@/lib/ai-insights";
import { StatusBadge } from "./StatusBadge";
import { UrgencyBadge } from "./UrgencyBadge";
import { motion } from "framer-motion";
import { getIssueMapLink } from "@/lib/map-utils";

const urgencyBorder: Record<string, string> = {
  High: "border-l-destructive",
  Medium: "border-l-warning",
  Low: "border-l-success",
};

const categoryIcons: Record<Category, React.ReactNode> = {
  Health: <Heart className="h-3.5 w-3.5" />,
  Disaster: <AlertTriangle className="h-3.5 w-3.5" />,
  Food: <Droplets className="h-3.5 w-3.5" />,
  Infrastructure: <HardHat className="h-3.5 w-3.5" />,
  Environment: <Activity className="h-3.5 w-3.5" />,
  Safety: <Shield className="h-3.5 w-3.5" />,
  Communication: <Phone className="h-3.5 w-3.5" />,
  Shelter: <HelpCircle className="h-3.5 w-3.5" />,
};

export function IssueCard({ issue }: { issue: Issue }) {
  const score = calcPriorityScore(issue);
  const respTime = predictResponseTime(issue);
  const volsNeeded = estimateVolunteers(issue);

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group relative flex flex-col rounded-2xl border border-l-[4px] bg-card p-4 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/5",
        urgencyBorder[issue.urgency]
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
             <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                {categoryIcons[issue.category] || <Activity className="h-3.5 w-3.5" />}
             </div>
             <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">{issue.category}</span>
          </div>
          <h3 className="text-sm font-bold text-card-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2">{issue.title}</h3>
        </div>
        <UrgencyBadge urgency={issue.urgency} />
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/60" />
          <span className="truncate">{issue.location}</span>
        </div>

        {/* AI Priority Indicator */}
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
           <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-all duration-1000",
              score > 80 ? "bg-destructive" : score > 50 ? "bg-warning" : "bg-primary"
            )}
            style={{ width: `${score}%` }}
           />
        </div>
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tight">
          <span className="flex items-center gap-1 text-muted-foreground"><Brain className="h-3 w-3" /> AI Priority</span>
          <span className={cn(
            score > 80 ? "text-destructive" : score > 50 ? "text-warning" : "text-primary"
          )}>{score}%</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{respTime}m</span>
          <span className="flex items-center gap-0.5"><Users className="h-3 w-3" />{volsNeeded} vol</span>
        </div>
      </div>

      <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground transition-colors group-hover:text-foreground">
            <ThumbsUp className="h-3 w-3" />
            {issue.upvotes}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground transition-colors group-hover:text-foreground">
            <MessageSquare className="h-3 w-3" />
            {issue.comments.length}
          </div>
          <a
            href={getIssueMapLink(issue)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
            title="Track issue location"
          >
            <MapPin className="h-3 w-3" /> Track <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground font-medium">{timeAgo(issue.createdAt)}</span>
          <StatusBadge status={issue.status} />
        </div>
      </div>

      {/* Glass gradient overlay on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  );
}

