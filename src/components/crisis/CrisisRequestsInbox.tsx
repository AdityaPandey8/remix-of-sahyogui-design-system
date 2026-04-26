import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Inbox, Check, X } from "lucide-react";
import { useCrisis } from "@/contexts/CrisisContext";

export function CrisisRequestsInbox() {
  const { requests, approveRequest, rejectRequest } = useCrisis();
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
          <Inbox className="h-4 w-4" /> Crisis Requests ({requests.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {requests.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No pending crisis requests.</p>
        )}
        {requests.map((r) => (
          <div key={r.id} className="rounded-xl border bg-card/60 p-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{r.issue.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {r.issue.location} · {r.issue.urgency} · requested by {r.requestedBy}
                </p>
              </div>
              <Badge
                variant="outline"
                className={
                  r.status === "approved"
                    ? "bg-success/10 text-success border-success/30"
                    : r.status === "rejected"
                    ? "bg-destructive/10 text-destructive border-destructive/30"
                    : "bg-warning/10 text-warning border-warning/30"
                }
              >
                {r.status}
              </Badge>
            </div>
            {r.status === "pending" && (
              <div className="flex gap-2 mt-2">
                <Button size="sm" className="h-7 text-xs" onClick={() => approveRequest(r.id)}>
                  <Check className="h-3 w-3 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => rejectRequest(r.id)}>
                  <X className="h-3 w-3 mr-1" /> Reject
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}