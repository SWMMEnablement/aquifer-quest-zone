import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { computeWaterHammer } from "@/lib/hydrology/swmm";

export default function WaterHammer() {
  const [pipeLength, setPipeLength] = useState(500);
  const [diameter, setDiameter] = useState(0.5);
  const [thickness, setThickness] = useState(0.01);
  const [V0, setV0] = useState(2.0);
  const [closureTime, setClosureTime] = useState(3.0);
  const [Kw, setKw] = useState(2.2e9);
  const [Ep, setEp] = useState(200e9);

  const results = useMemo(() =>
    computeWaterHammer(pipeLength, diameter, thickness, V0, closureTime, Kw, Ep),
    [pipeLength, diameter, thickness, V0, closureTime, Kw, Ep]);

  const pipeMaterial = Ep > 100e9 ? "Steel" : Ep > 2e9 ? "Cast Iron" : "PVC";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="card-water">
        <CardHeader><CardTitle className="text-lg">Water Hammer (Transient Flow)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Pipe Length L: <strong>{pipeLength} m</strong></label>
            <Slider min={50} max={5000} step={50} value={[pipeLength]} onValueChange={([v]) => setPipeLength(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Diameter D: <strong>{(diameter*1000).toFixed(0)} mm</strong></label>
            <Slider min={0.1} max={2.0} step={0.05} value={[diameter]} onValueChange={([v]) => setDiameter(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Wall Thickness e: <strong>{(thickness*1000).toFixed(1)} mm</strong></label>
            <Slider min={0.003} max={0.05} step={0.001} value={[thickness]} onValueChange={([v]) => setThickness(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Initial Velocity V₀: <strong>{V0.toFixed(1)} m/s</strong></label>
            <Slider min={0.5} max={6.0} step={0.1} value={[V0]} onValueChange={([v]) => setV0(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Valve Closure Time: <strong>{closureTime.toFixed(1)} s</strong></label>
            <Slider min={0.1} max={30.0} step={0.1} value={[closureTime]} onValueChange={([v]) => setClosureTime(v)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Pipe Material (Ep)</label>
            <Select value={Ep.toString()} onValueChange={v => setEp(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="200000000000">Steel (200 GPa)</SelectItem>
                <SelectItem value="100000000000">Cast Iron (100 GPa)</SelectItem>
                <SelectItem value="3000000000">PVC (3 GPa)</SelectItem>
                <SelectItem value="1000000000">HDPE (1 GPa)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Pressure Wave Diagram</CardTitle></CardHeader>
          <CardContent>
            <svg viewBox="0 0 500 250" className="w-full">
              <rect x="40" y="80" width="420" height="40" fill="hsl(var(--muted))" opacity="0.2"
                stroke="hsl(var(--foreground))" strokeWidth="2" rx="4" />
              <rect x="42" y="82" width="416" height="36" fill="hsl(var(--primary))" opacity="0.2" rx="3" />
              <rect x="455" y="70" width="15" height="60" fill="hsl(var(--destructive))" opacity="0.6" rx="2" />
              <text x="462" y="68" textAnchor="middle" fontSize="9" fill="hsl(var(--destructive))">Valve</text>
              {results.isRapid ? (
                <path d={`M455,100 L${455 - (closureTime / results.tc) * 400},100`}
                  stroke="hsl(var(--destructive))" strokeWidth="3" strokeDasharray="6 3" />
              ) : (
                <path d={`M455,100 L45,100`}
                  stroke="hsl(var(--accent))" strokeWidth="2" strokeDasharray="8 4" />
              )}
              <rect x="40" y={80 - Math.min(results.dH * 0.5, 50)} width="420" height={Math.min(results.dH * 0.5, 50)}
                fill={results.isRapid ? "hsl(var(--destructive))" : "hsl(var(--accent))"} opacity="0.15" rx="3" />
              <text x="250" y={75 - Math.min(results.dH * 0.5, 50)} textAnchor="middle"
                fontSize="11" fill={results.isRapid ? "hsl(var(--destructive))" : "hsl(var(--accent))"} fontWeight="bold">
                ΔP = {results.dPbar.toFixed(1)} bar ({results.dH.toFixed(1)} m head)
              </text>
              <line x1="80" y1="100" x2="400" y2="100" stroke="hsl(var(--primary))" strokeWidth="1.5" />
              <polygon points="400,100 392,95 392,105" fill="hsl(var(--primary))" />
              <text x="240" y="112" textAnchor="middle" fontSize="9" fill="hsl(var(--primary))">V₀ = {V0} m/s →</text>
              <text x="250" y="165" textAnchor="middle" fontSize="10" fill="hsl(var(--foreground))">
                L = {pipeLength}m | D = {(diameter*1000).toFixed(0)}mm | {pipeMaterial}
              </text>
              <text x="250" y="185" textAnchor="middle" fontSize="10"
                fill={results.isRapid ? "hsl(var(--destructive))" : "hsl(var(--accent))"} fontWeight="bold">
                {results.isRapid ? "⚠ RAPID closure (tc < 2L/a)" : "✓ Slow closure (tc > 2L/a)"}
              </text>
              <line x1="40" y1="210" x2="460" y2="210" stroke="hsl(var(--border))" strokeWidth="1" />
              <circle cx="40" cy="210" r="3" fill="hsl(var(--foreground))" />
              <text x="40" y="228" textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">t=0</text>
              {(() => {
                const tcX = 40 + Math.min(results.tc / Math.max(closureTime * 1.5, results.tc * 1.5), 1) * 420;
                const tvX = 40 + Math.min(closureTime / Math.max(closureTime * 1.5, results.tc * 1.5), 1) * 420;
                return (
                  <>
                    <circle cx={tcX} cy="210" r="3" fill="hsl(var(--accent))" />
                    <text x={tcX} y="228" textAnchor="middle" fontSize="8" fill="hsl(var(--accent))">tc={results.tc.toFixed(1)}s</text>
                    <circle cx={tvX} cy="210" r="3" fill="hsl(var(--destructive))" />
                    <text x={tvX} y="243" textAnchor="middle" fontSize="8" fill="hsl(var(--destructive))">tv={closureTime.toFixed(1)}s</text>
                  </>
                );
              })()}
            </svg>
          </CardContent>
        </Card>

        <Card className="card-water">
          <CardHeader><CardTitle className="text-sm">Joukowski Results</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-secondary/30 rounded-lg p-3">
                <span className="text-xs text-muted-foreground block">Wave Speed a</span>
                <span className="font-bold text-foreground">{results.a.toFixed(0)} m/s</span>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3">
                <span className="text-xs text-muted-foreground block">Critical Time tc</span>
                <span className="font-bold text-foreground">{results.tc.toFixed(2)} s</span>
              </div>
              <div className={`rounded-lg p-3 ${results.isRapid ? "bg-destructive/10" : "bg-secondary/30"}`}>
                <span className="text-xs text-muted-foreground block">Pressure Rise ΔP</span>
                <span className={`font-bold ${results.isRapid ? "text-destructive" : "text-foreground"}`}>
                  {results.dPbar.toFixed(1)} bar
                </span>
              </div>
              <div className={`rounded-lg p-3 ${results.isRapid ? "bg-destructive/10" : "bg-secondary/30"}`}>
                <span className="text-xs text-muted-foreground block">Head Rise ΔH</span>
                <span className={`font-bold ${results.isRapid ? "text-destructive" : "text-foreground"}`}>
                  {results.dH.toFixed(1)} m
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 font-mono">
              ΔP = ρaV₀{!results.isRapid ? " × (tc/tv)" : ""} — Joukowski (1898)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
