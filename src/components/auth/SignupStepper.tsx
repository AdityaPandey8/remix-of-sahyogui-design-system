import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Props {
  current: number;
  total: number;
  labels?: string[];
}

export function SignupStepper({ current, total, labels }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <span>
          Step {current} of {total}
        </span>
        <span>{Math.round((current / total) * 100)}%</span>
      </div>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => {
          const idx = i + 1;
          const done = idx < current;
          const active = idx === current;
          return (
            <div
              key={idx}
              className={cn(
                "flex-1 h-1.5 rounded-full transition-all duration-500",
                done && "bg-primary",
                active && "bg-primary/70 ring-2 ring-primary/20",
                !done && !active && "bg-muted",
              )}
            />
          );
        })}
      </div>
      {labels && (
        <p className="text-center text-xs font-semibold text-foreground">
          {labels[current - 1]}
        </p>
      )}
    </div>
  );
}

export function ChipSelect({
  options,
  value,
  onChange,
  multi = true,
}: {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  multi?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value.includes(opt);
        return (
          <button
            type="button"
            key={opt}
            onClick={() => {
              if (selected) onChange(value.filter((v) => v !== opt));
              else onChange(multi ? [...value, opt] : [opt]);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all",
              selected
                ? "border-primary bg-primary text-primary-foreground shadow"
                : "border-border bg-muted/50 text-muted-foreground hover:border-primary/40",
            )}
          >
            {selected && <Check className="h-3 w-3" />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}