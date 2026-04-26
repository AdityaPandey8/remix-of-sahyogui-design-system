import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import type { NearbyService } from "@/lib/crisis-utils";
import { serviceTypeEmoji, serviceTypeLabel } from "@/data/emergencyServices";
import { estimateEta } from "@/lib/crisis-utils";

export function EmergencyServicesList({ services }: { services: NearbyService[] }) {
  if (services.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          No nearby emergency services matched this issue.
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {services.map((s) => (
        <Card key={s.id} className="border-destructive/20 bg-destructive/[0.03]">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold tracking-tight truncate">
                  <span className="mr-1.5">{serviceTypeEmoji[s.type]}</span>
                  {s.name}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" /> {s.city}
                </p>
              </div>
              <Badge variant="outline" className="shrink-0 text-[10px]">
                {serviceTypeLabel[s.type]}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-muted-foreground">~{s.distance.toFixed(2)}° away</span>
              <span className="font-bold text-destructive">ETA {estimateEta(s.distance)} min</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full h-8 text-xs"
              onClick={() => toast.success(`Notified ${s.name}`)}
            >
              <Phone className="h-3 w-3 mr-1.5" /> Notify {s.phone}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}