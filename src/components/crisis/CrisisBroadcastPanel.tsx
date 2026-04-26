import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, ExternalLink, Copy } from "lucide-react";
import { useCrisis } from "@/contexts/CrisisContext";
import { copyCrisisLink, generateCrisisLink } from "@/lib/crisis-utils";
import { serviceTypeEmoji, serviceTypeLabel, type EmergencyServiceType } from "@/data/emergencyServices";
import { CrisisCountdownTimer } from "./CrisisCountdownTimer";

type Status = "Pending" | "Acknowledged" | "En Route";
const STATUS_FLOW: Status[] = ["Pending", "Acknowledged", "En Route"];

export function CrisisBroadcastPanel() {
  const { activeIssue, broadcast } = useCrisis();
  const [statuses, setStatuses] = useState<Record<string, Status>>({});

  useEffect(() => {
    if (!broadcast) return;
    setStatuses(Object.fromEntries(broadcast.services.map((s) => [s.id, "Pending" as Status])));
    const t1 = setTimeout(() => {
      setStatuses((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, "Acknowledged"])));
    }, 3500);
    const t2 = setTimeout(() => {
      setStatuses((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, "En Route"])));
    }, 8000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [broadcast?.sentAt]);

  if (!activeIssue || !broadcast) return null;

  const counts: Record<EmergencyServiceType, number> = { hospital: 0, fire: 0, police: 0 };
  broadcast.services.forEach((s) => { counts[s.type] += 1; });

  return (
    <Card className="border-destructive/30 bg-destructive/[0.04]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-destructive flex items-center gap-2">
            ✅ Alerts Sent
          </CardTitle>
          <CrisisCountdownTimer sentAt={broadcast.sentAt} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Crisis</p>
          <p className="text-base font-bold mt-0.5">{activeIssue.title}</p>
          <p className="text-xs text-muted-foreground">{activeIssue.location} · Urgency {activeIssue.urgency}</p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          <Stat icon="🏢" label="NGOs" value={broadcast.ngos} />
          <Stat icon="🧑" label="Volunteers" value={broadcast.volunteers} />
          <Stat icon={serviceTypeEmoji.hospital} label="Hospitals" value={counts.hospital} />
          <Stat icon={serviceTypeEmoji.fire} label="Fire" value={counts.fire} />
          <Stat icon={serviceTypeEmoji.police} label="Police" value={counts.police} />
        </div>

        {broadcast.services.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recipients</p>
            {broadcast.services.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border bg-card/60 px-3 py-2 text-xs">
                <span className="truncate">
                  <span className="mr-1.5">{serviceTypeEmoji[s.type]}</span>
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground"> · {serviceTypeLabel[s.type]}</span>
                </span>
                <Badge
                  variant="outline"
                  className={
                    statuses[s.id] === "En Route"
                      ? "text-[10px] bg-success/10 text-success border-success/30"
                      : statuses[s.id] === "Acknowledged"
                      ? "text-[10px] bg-primary/10 text-primary border-primary/30"
                      : "text-[10px]"
                  }
                >
                  {statuses[s.id] ?? "Pending"}
                </Badge>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button asChild size="sm" variant="destructive" className="h-8 text-xs">
            <a href={generateCrisisLink(activeIssue)} target="_blank" rel="noreferrer">
              <ExternalLink className="h-3 w-3 mr-1.5" /> View Location
            </a>
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => copyCrisisLink(activeIssue)}>
            <Copy className="h-3 w-3 mr-1.5" /> Copy Link
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card/60 p-3 text-center">
      <div className="text-lg leading-none">{icon}</div>
      <p className="text-lg font-black tabular-nums mt-1">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

export { Building2, Users };