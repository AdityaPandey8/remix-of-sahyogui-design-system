import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export function CrisisCountdownTimer({ sentAt }: { sentAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const elapsed = Math.max(0, Math.floor((now - new Date(sentAt).getTime()) / 1000));
  const m = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const s = String(elapsed % 60).padStart(2, "0");
  return (
    <span className="inline-flex items-center gap-1.5 font-mono tabular-nums text-sm font-bold text-destructive">
      <Clock className="h-3.5 w-3.5" /> {m}:{s}
    </span>
  );
}