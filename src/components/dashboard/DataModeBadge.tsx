import { Wifi, WifiOff } from "lucide-react";
import { useDataMode } from "@/lib/data-source";
import { cn } from "@/lib/utils";

export function DataModeBadge({ className }: { className?: string }) {
  const { mode } = useDataMode();
  const live = mode === "live";
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur",
        live
          ? "border-success/30 bg-success/10 text-success"
          : "border-warning/30 bg-warning/10 text-warning",
        className,
      )}
      title={live ? "Realtime data from Supabase" : "Showing demo (mock) data"}
    >
      {live ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
      {live ? "Live Data" : "Demo Mode"}
    </div>
  );
}