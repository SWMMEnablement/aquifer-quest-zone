import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { computeGutterFlow } from "@/lib/hydrology/swmm";

export default function GutterFlow() {
  const [n, setN] = useState(0.016);
  const [slope, setSlope] = useState(0.02);
  const [Sx, setSx] = useState(0.02);
  const [Sw, setSw] = useState(0.06);
  const [gutterW, setGutterW] = useState(0.6);
  const [Q, setQ] = useState(0.05);

  const gutter = useMemo(() =>
    computeGutterFlow(Q, n, Sx, Sw, slope, gutterW),
    [Q, n, Sx, Sw, slope, gutterW]);

  const { spread, depth, gutterDepth, velocity, flowArea } = gutter;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="card-water">
        <CardHeader><CardTitle className="text-lg">Gutter Flow Inputs</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Manning's n: <strong>{n.toFixed(3)}</strong></label>
            <Slider min={0.010} max={0.030} step={0.001} value={[n]} onValueChange={([v]) => setN(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Longitudinal Slope S: <strong>{slope.toFixed(3)}</strong></label>
            <Slider min={0.001} max={0.10} step={0.001} value={[slope]} onValueChange={([v]) => setSlope(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Road Cross Slope Sx: <strong>{Sx.toFixed(3)}</strong></label>
            <Slider min={0.01} max={0.08} step={0.005} value={[Sx]} onValueChange={([v]) => setSx(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Gutter Cross Slope Sw: <strong>{Sw.toFixed(3)}</strong></label>
            <Slider min={0.02} max={0.12} step={0.005} value={[Sw]} onValueChange={([v]) => setSw(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Gutter Width W: <strong>{gutterW.toFixed(2)} m</strong></label>
            <Slider min={0.3} max={1.5} step={0.1} value={[gutterW]} onValueChange={([v]) => setGutterW(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Discharge Q: <strong>{Q.toFixed(3)} m³/s</strong></label>
            <Slider min={0.005} max={0.3} step={0.005} value={[Q]} onValueChange={([v]) => setQ(v)} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Gutter Cross-Section</CardTitle></CardHeader>
          <CardContent>
            <svg viewBox="0 0 500 220" className="w-full">
              <rect x="0" y="0" width="500" height="220" fill="hsl(var(--secondary))" opacity="0.1" />
              <line x1="40" y1="80" x2="460" y2={80 + (420 * Sx * 5)} stroke="hsl(var(--foreground))" strokeWidth="3" />
              <rect x="20" y="40" width="20" height={40 + gutterDepth * 300} fill="hsl(var(--muted-foreground))" opacity="0.5" rx="2" />
              {Sw > Sx && (
                <polygon
                  points={`40,80 40,${80 + gutterDepth * 300} ${40 + gutterW * 200},${80 + depth * 300}`}
                  fill="hsl(var(--primary))" opacity="0.15"
                />
              )}
              {spread > 0 && (
                <polygon
                  points={`40,${80 + gutterDepth * 300} ${40 + Math.min(spread, 4) * 100},${80} 40,80`}
                  fill="hsl(var(--primary))" opacity="0.3"
                  stroke="hsl(var(--primary))" strokeWidth="1.5"
                />
              )}
              <line x1="40" y1="180" x2={40 + Math.min(spread, 4) * 100} y2="180"
                stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="4 2" />
              <text x={(40 + 40 + Math.min(spread, 4) * 100) / 2} y="195" textAnchor="middle"
                fontSize="11" fill="hsl(var(--primary))" fontWeight="bold">
                T = {spread.toFixed(2)} m
              </text>
              <line x1="40" y1="210" x2={40 + gutterW * 200} y2="210"
                stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeDasharray="3 2" />
              <text x={40 + gutterW * 100} y="218" textAnchor="middle"
                fontSize="9" fill="hsl(var(--muted-foreground))">W = {gutterW.toFixed(1)}m</text>
              <line x1="35" y1="80" x2="35" y2={80 + gutterDepth * 300}
                stroke="hsl(var(--accent))" strokeWidth="1" />
              <text x="15" y={(80 + 80 + gutterDepth * 300) / 2} textAnchor="middle"
                fontSize="9" fill="hsl(var(--accent))" transform={`rotate(-90, 15, ${(80 + 80 + gutterDepth * 300) / 2})`}>
                d = {(gutterDepth * 1000).toFixed(0)} mm
              </text>
              <text x="250" y="25" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">
                Sx = {Sx.toFixed(3)} | Sw = {Sw.toFixed(3)}
              </text>
              <text x="420" y="70" fontSize="10" fill="hsl(var(--primary))">→ Flow</text>
            </svg>
          </CardContent>
        </Card>

        <Card className="card-water">
          <CardHeader><CardTitle className="text-sm">Results</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-secondary/30 rounded-lg p-3">
                <span className="text-xs text-muted-foreground block">Spread T</span>
                <span className="font-bold text-foreground">{spread.toFixed(3)} m</span>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3">
                <span className="text-xs text-muted-foreground block">Depth d</span>
                <span className="font-bold text-foreground">{(depth * 1000).toFixed(1)} mm</span>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3">
                <span className="text-xs text-muted-foreground block">Velocity V</span>
                <span className="font-bold text-foreground">{velocity.toFixed(2)} m/s</span>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3">
                <span className="text-xs text-muted-foreground block">Flow Area A</span>
                <span className="font-bold text-foreground">{flowArea.toFixed(4)} m²</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 italic">
              Based on FHWA HEC-22 methodology — Q = (0.376/n) × Sx^(5/3) × S^(1/2) × T^(8/3)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
