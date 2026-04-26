import { Card, CardContent } from "@/components/ui/card";
import { Activity, Users, AlertTriangle } from "lucide-react";
import { useCrisis } from "@/contexts/CrisisContext";
import { CrisisCountdownTimer } from "./CrisisCountdownTimer";

export function CrisisMetricsPanel() {
  const { broadcast, activeIssue } = useCrisis();
  if (!broadcast || !activeIssue) return null;
  const responders = broadcast.ngos + broadcast.volunteers + broadcast.services.length;
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Metric icon={Users} label="Active Responders" value={responders} />
      <Card>
        <CardContent className="p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase tracking-widest font-bold">
            <Activity className="h-3.5 w-3.5" /> Active For
          </div>
          <div className="text-xl font-black tabular-nums">
            <CrisisCountdownTimer sentAt={broadcast.sentAt} />
          </div>
        </CardContent>
      </Card>
      <Metric icon={AlertTriangle} label="Issues Under Crisis" value={1} />
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase tracking-widest font-bold">
          <Icon className="h-3.5 w-3.5" /> {label}
        </div>
        <p className="text-2xl font-black tabular-nums mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}