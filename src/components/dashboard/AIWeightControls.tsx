import { Sliders, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { AIWeights } from "@/data/mockData";
import { defaultAIWeights } from "@/data/mockData";

interface Props {
  weights: AIWeights;
  onChange: (w: AIWeights) => void;
}

export function AIWeightControls({ weights, onChange }: Props) {
  const setW = (key: keyof AIWeights, val: number) => onChange({ ...weights, [key]: val });

  const Row = ({ label, k }: { label: string; k: keyof AIWeights }) => (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
        <span className="text-xs font-bold tabular-nums text-primary">{weights[k].toFixed(2)}</span>
      </div>
      <Slider
        value={[weights[k]]}
        onValueChange={(v) => setW(k, v[0])}
        min={0}
        max={1}
        step={0.05}
      />
    </div>
  );

  return (
    <div className="rounded-2xl border bg-card/50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold flex items-center gap-2"><Sliders className="h-4 w-4 text-primary" /> AI Weight Controls</h3>
        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => onChange(defaultAIWeights)}>
          <RotateCcw className="h-3 w-3" /> Reset
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground -mt-2">
        Tune how community signals influence the AI priority score.
      </p>
      <Row label="Vote Weight" k="voteWeight" />
      <Row label="Poll Weight" k="pollWeight" />
      <Row label="Discussion Weight" k="discussionWeight" />
    </div>
  );
}