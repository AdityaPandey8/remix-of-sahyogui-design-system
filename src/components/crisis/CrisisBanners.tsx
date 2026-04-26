import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ShieldAlert, Zap, Handshake } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCrisis } from "@/contexts/CrisisContext";
import { generateCrisisLink } from "@/lib/crisis-utils";
import { CrisisCountdownTimer } from "./CrisisCountdownTimer";
import { toast } from "sonner";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="rounded-2xl border-2 border-destructive/40 bg-destructive/[0.06] p-4 shadow-lg shadow-destructive/10"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function Header() {
  const { activeIssue, broadcast } = useCrisis();
  if (!activeIssue || !broadcast) return null;
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-destructive text-destructive-foreground">
          <ShieldAlert className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-destructive">Crisis Alert Received</p>
          <p className="text-xs text-muted-foreground">{activeIssue.title} · {activeIssue.location}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-destructive/10 border-destructive/30 text-destructive text-[10px]">
          {activeIssue.urgency}
        </Badge>
        <CrisisCountdownTimer sentAt={broadcast.sentAt} />
      </div>
    </div>
  );
}

export function VolunteerCrisisBanner({ onJoin }: { onJoin?: () => void }) {
  const { crisisMode, activeIssue } = useCrisis();
  if (!crisisMode || !activeIssue) return null;
  return (
    <Wrapper>
      <Header />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => { onJoin?.(); toast.success("🚨 You've joined the emergency response"); }}
        >
          <Zap className="h-4 w-4 mr-1.5" /> Join Emergency Now
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href={generateCrisisLink(activeIssue)} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4 mr-1.5" /> View Location
          </a>
        </Button>
      </div>
    </Wrapper>
  );
}

export function NGOCrisisBanner({ onAccept }: { onAccept?: () => void }) {
  const { crisisMode, activeIssue } = useCrisis();
  if (!crisisMode || !activeIssue) return null;
  return (
    <Wrapper>
      <Header />
      <p className="text-xs text-muted-foreground mb-2">
        Emergency Request Received. Deploy ALL nearby volunteers and coordinate with emergency services.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => { onAccept?.(); toast.success("✅ Accepted — team deploying"); }}
        >
          <Handshake className="h-4 w-4 mr-1.5" /> Accept &amp; Deploy
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href={generateCrisisLink(activeIssue)} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4 mr-1.5" /> View Location
          </a>
        </Button>
      </div>
    </Wrapper>
  );
}

export function PublicCrisisBanner() {
  const { crisisMode, activeIssue } = useCrisis();
  if (!crisisMode || !activeIssue) return null;
  return (
    <Wrapper>
      <Header />
      <p className="text-xs text-muted-foreground mb-2">
        A crisis is being coordinated in your area. Please follow official guidance and avoid the affected zone unless trained.
      </p>
      <Button asChild variant="outline" size="sm">
        <a href={generateCrisisLink(activeIssue)} target="_blank" rel="noreferrer">
          <ExternalLink className="h-4 w-4 mr-1.5" /> View Location
        </a>
      </Button>
    </Wrapper>
  );
}