import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Info } from "lucide-react";

interface StillingBasinDesignerProps {
  onClose: () => void;
}

const BASIN_TYPES = [
  { id: "I", name: "USBR Type I", frRange: "Fr > 4.5, no appurtenances", desc: "High Froude, simple basin with end sill only." },
  { id: "II", name: "USBR Type II", frRange: "Fr > 4.5, chute blocks + dentated sill", desc: "Reduces basin length by ~33% vs Type I." },
  { id: "III", name: "USBR Type III", frRange: "4.5 < Fr < 14, baffle piers + end sill", desc: "Most common type, uses baffle piers for energy dissipation." },
  { id: "IV", name: "USBR Type IV", frRange: "2.5 < Fr < 4.5, oscillating jump", desc: "Difficult range — consider alternative designs." },
  { id: "SAF", name: "SAF Basin", frRange: "Fr 1.7–17", desc: "St. Anthony Falls basin, compact design." },
];

const StillingBasinDesigner = ({ onClose }: StillingBasinDesignerProps) => {
  const [q, setQ] = useState([5]); // unit discharge m²/s
  const [y1, setY1] = useState([0.3]); // supercritical depth
  const [tailwater, setTailwater] = useState([3.0]);

  const results = useMemo(() => {
    const g = 9.81;
    const V1 = q[0] / y1[0];
    const Fr1 = V1 / Math.sqrt(g * y1[0]);
    const y2 = (y1[0] / 2) * (Math.sqrt(1 + 8 * Fr1 * Fr1) - 1);
    const V2 = q[0] / y2;
    const Fr2 = V2 / Math.sqrt(g * y2);
    const dE = Math.pow(y2 - y1[0], 3) / (4 * y1[0] * y2);
    const E1 = y1[0] + V1 * V1 / (2 * g);
    const efficiency = ((E1 - dE) / E1) * 100;

    // Basin length (approx 6 * y2)
    const Lb = 6 * y2;

    // Auto-select basin type
    let basinType = "I";
    if (Fr1 < 2.5) basinType = "IV";
    else if (Fr1 < 4.5) basinType = "IV";
    else if (Fr1 < 14) basinType = "III";
    else basinType = "II";

    // Tailwater adequacy
    const twRatio = tailwater[0] / y2;
    const twAdequate = twRatio >= 0.95;
    const jumpContained = tailwater[0] >= y2 * 0.85;

    // Jump classification
    let jumpClass = "Undular";
    if (Fr1 > 1.7 && Fr1 <= 2.5) jumpClass = "Weak";
    else if (Fr1 > 2.5 && Fr1 <= 4.5) jumpClass = "Oscillating";
    else if (Fr1 > 4.5 && Fr1 <= 9) jumpClass = "Steady";
    else if (Fr1 > 9) jumpClass = "Strong";

    return { V1, V2, Fr1, Fr2, y2, dE, E1, efficiency, Lb, basinType, twRatio, twAdequate, jumpContained, jumpClass };
  }, [q, y1, tailwater]);

  const svgW = 500;
  const svgH = 220;
  const scale = 20;

  return (
    <div className="min-h-screen bg-background py-8 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={onClose}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Stilling Basin Designer</h1>
            <p className="text-muted-foreground mt-1">USBR hydraulic jump basin with energy dissipation analysis</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inputs */}
          <Card className="p-6 shadow-card">
            <h2 className="font-semibold text-lg mb-6 text-foreground">Input Parameters</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Unit Discharge q: <span className="text-primary font-bold">{q[0].toFixed(1)} m²/s</span></label>
                <Slider value={q} onValueChange={setQ} min={0.5} max={30} step={0.5} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Supercritical Depth y₁: <span className="text-primary font-bold">{y1[0].toFixed(2)} m</span></label>
                <Slider value={y1} onValueChange={setY1} min={0.05} max={2} step={0.05} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tailwater Depth: <span className="text-primary font-bold">{tailwater[0].toFixed(2)} m</span></label>
                <Slider value={tailwater} onValueChange={setTailwater} min={0.5} max={10} step={0.1} />
              </div>
            </div>

            {/* Results */}
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-secondary rounded-xl">
                  <div className="text-xs text-muted-foreground">Fr₁</div>
                  <div className="text-2xl font-bold text-secondary-foreground">{results.Fr1.toFixed(2)}</div>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <div className="text-xs text-muted-foreground">y₂ (sequent)</div>
                  <div className="text-2xl font-bold text-primary">{results.y2.toFixed(2)} m</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">ΔE = </span>
                  <span className="font-medium text-foreground">{results.dE.toFixed(3)} m</span>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">η = </span>
                  <span className="font-medium text-foreground">{results.efficiency.toFixed(1)}%</span>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Basin L = </span>
                  <span className="font-medium text-foreground">{results.Lb.toFixed(1)} m</span>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Jump: </span>
                  <span className="font-medium text-foreground">{results.jumpClass}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Basin Diagram */}
          <Card className="p-6 shadow-card lg:col-span-2">
            <h2 className="font-semibold text-lg mb-4 text-foreground">Basin Cross-Section</h2>
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
              {/* Basin floor */}
              <rect x={50} y={svgH - 30} width={svgW - 100} height={4} fill="hsl(var(--foreground))" rx={1} />

              {/* Chute */}
              <line x1={30} y1={svgH - 30 - results.y2 * scale * 0.8} x2={80} y2={svgH - 30} stroke="hsl(var(--foreground))" strokeWidth="3" />

              {/* Supercritical flow */}
              <rect x={80} y={svgH - 30 - y1[0] * scale} width={40} height={y1[0] * scale} fill="hsl(var(--primary) / 0.3)" stroke="hsl(var(--primary))" strokeWidth="1" />

              {/* Jump roller (animated) */}
              <ellipse cx={160} cy={svgH - 30 - results.y2 * scale * 0.4} rx={50} ry={results.y2 * scale * 0.35} fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1" strokeDasharray="4 2">
                <animate attributeName="rx" values="48;52;48" dur="2s" repeatCount="indefinite" />
              </ellipse>

              {/* Jump water surface */}
              <path d={`M 80 ${svgH - 30 - y1[0] * scale} Q 120 ${svgH - 30 - results.y2 * scale * 0.3} 160 ${svgH - 30 - results.y2 * scale * 0.7} Q 200 ${svgH - 30 - results.y2 * scale * 1.05} 250 ${svgH - 30 - results.y2 * scale}`}
                fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" />

              {/* Subcritical flow */}
              <rect x={250} y={svgH - 30 - results.y2 * scale} width={svgW - 350} height={results.y2 * scale} fill="hsl(var(--primary) / 0.2)" stroke="none" />
              <line x1={250} y1={svgH - 30 - results.y2 * scale} x2={svgW - 80} y2={svgH - 30 - results.y2 * scale} stroke="hsl(var(--primary))" strokeWidth="1.5" />

              {/* Tailwater line */}
              <line x1={svgW - 80} y1={svgH - 30 - tailwater[0] * scale} x2={svgW - 50} y2={svgH - 30 - tailwater[0] * scale} stroke="hsl(var(--accent))" strokeWidth="2" strokeDasharray="6 3" />
              <text x={svgW - 45} y={svgH - 30 - tailwater[0] * scale + 4} className="text-[10px] fill-accent">TW</text>

              {/* Baffle piers (for Type III) */}
              {(results.basinType === "III" || results.basinType === "II") && (
                <>
                  <rect x={170} y={svgH - 30 - results.y2 * scale * 0.3} width={6} height={results.y2 * scale * 0.3} fill="hsl(var(--foreground))" />
                  <rect x={190} y={svgH - 30 - results.y2 * scale * 0.3} width={6} height={results.y2 * scale * 0.3} fill="hsl(var(--foreground))" />
                </>
              )}

              {/* End sill */}
              <rect x={svgW - 110} y={svgH - 30 - results.y2 * scale * 0.2} width={8} height={results.y2 * scale * 0.2} fill="hsl(var(--foreground))" />

              {/* Labels */}
              <text x={90} y={svgH - 30 - y1[0] * scale - 5} className="text-[10px] fill-primary" textAnchor="middle">y₁={y1[0].toFixed(2)}m</text>
              <text x={300} y={svgH - 30 - results.y2 * scale - 5} className="text-[10px] fill-primary" textAnchor="middle">y₂={results.y2.toFixed(2)}m</text>
              <text x={svgW / 2} y={svgH - 8} className="text-[10px] fill-muted-foreground" textAnchor="middle">Basin Length ≈ {results.Lb.toFixed(1)} m</text>

              {/* Flow arrows */}
              <line x1={60} y1={svgH - 30 - y1[0] * scale / 2} x2={90} y2={svgH - 30 - y1[0] * scale / 2} stroke="hsl(var(--primary))" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--primary))" />
                </marker>
              </defs>
            </svg>

            {/* Basin type recommendation */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Recommended: {BASIN_TYPES.find(b => b.id === results.basinType)?.name}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {BASIN_TYPES.map((bt) => (
                  <div key={bt.id} className={`p-3 rounded-lg text-sm border ${bt.id === results.basinType ? 'border-primary bg-primary/5' : 'border-border bg-muted/50'}`}>
                    <p className="font-medium text-foreground">{bt.name}</p>
                    <p className="text-xs text-muted-foreground">{bt.frRange}</p>
                  </div>
                ))}
              </div>

              {/* Tailwater check */}
              <div className={`p-3 rounded-lg text-sm ${results.twAdequate ? 'bg-earth-green/10 border border-earth-green/20' : 'bg-destructive/10 border border-destructive/20'}`}>
                <p className="font-medium text-foreground">
                  Tailwater {results.twAdequate ? '✅ Adequate' : '❌ Insufficient'}: TW/y₂ = {results.twRatio.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {results.twAdequate ? 'Jump is contained within basin.' : 'Jump may sweep out — increase tailwater or depress basin floor.'}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Based on USBR Engineering Monograph No. 25 — Prof. Victor Miguel Ponce, SDSU
                <br /><a href="https://ponce.sdsu.edu/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ponce.sdsu.edu</a>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StillingBasinDesigner;
