import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldOff } from "lucide-react";
import { useCrisis } from "@/contexts/CrisisContext";
import { CrisisBroadcastPanel } from "./CrisisBroadcastPanel";
import { CrisisMetricsPanel } from "./CrisisMetricsPanel";
import { EmergencyServicesList } from "./EmergencyServicesList";
import { AIExplanationCard } from "./AIExplanationCard";
import { CrisisRequestsInbox } from "./CrisisRequestsInbox";

/** Aggregated panel rendered inside the Admin "Crisis Center" section. */
export function CrisisCenter() {
  const { crisisMode, broadcast, deactivateCrisis } = useCrisis();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Crisis Center</h2>
          <p className="text-sm text-muted-foreground">
            Emergency Response Protocol — control, coordinate and monitor active crises.
          </p>
        </div>
        {crisisMode && (
          <Button variant="outline" size="sm" onClick={deactivateCrisis}>
            <ShieldOff className="h-4 w-4 mr-1.5" /> Deactivate Crisis
          </Button>
        )}
      </div>

      {!crisisMode && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No active crisis. Use the <span className="font-bold">Activate Crisis</span> action on the Overview to engage the protocol.
          </CardContent>
        </Card>
      )}

      {crisisMode && (
        <>
          <CrisisMetricsPanel />
          <div className="grid gap-6 lg:grid-cols-2">
            <CrisisBroadcastPanel />
            <AIExplanationCard />
          </div>
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Nearby Emergency Services
            </h3>
            <EmergencyServicesList services={broadcast?.services ?? []} />
          </div>
        </>
      )}

      <CrisisRequestsInbox />
    </div>
  );
}