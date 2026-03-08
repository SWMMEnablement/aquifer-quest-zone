import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { onClose: () => void; }
const g = 9.81;

const FroudeNumberExplorer = ({ onClose }: Props) => {
  const [velocity, setVelocity] = useState(1.5);
  const [depth, setDepth] = useState(2);
  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useState(0);
  const animRef = useRef<number>();

  const Fr = velocity / Math.sqrt(g * depth);
  const yc = Math.pow(velocity * velocity / g, 1 / 3);
  const regime = Fr < 0.95 ? "Subcritical" : Fr > 1.05 ? "Supercritical" : "Critical";
  const regimeColor = Fr < 0.95 ? "text-primary" : Fr > 1.05 ? "text-destructive" : "text-amber-500";

  useEffect(() => {
    if (playing) {
      const tick = () => { setTime(t => t + 0.03); animRef.current = requestAnimationFrame(tick); };
      animRef.current = requestAnimationFrame(tick);
    } else if (animRef.current) cancelAnimationFrame(animRef.current);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [playing]);

  // Ripple simulation from "pebble drop" at center
  const ripples = useMemo(() => {
    const waveCelerity = Math.sqrt(g * depth);
    const results = [];
    const dropX = 250, dropY = 120;
    for (let i = 1; i <= 5; i++) {
      const age = (time * 2) % 5 + i * 0.4;
      if (age < 0 || age > 5) continue;
      const radius = waveCelerity * age * 8;
      // Flow carries ripples downstream
      const cx = dropX + velocity * age * 8;
      results.push({ cx, cy: dropY, r: radius, opacity: Math.max(0, 1 - age / 5) });
    }
    return results;
  }, [time, velocity, depth]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={onClose} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">Froude Number Explorer</h1>
      <p className="text-muted-foreground mb-6">Visualize flow regime transitions and wave behavior.
        <a href="https://ponce.sdsu.edu/" target="_blank" rel="noopener noreferrer" className="text-primary ml-2 inline-flex items-center gap-1">Ponce Reference <ExternalLink className="w-3 h-3" /></a>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Controls</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Velocity V: {velocity.toFixed(2)} m/s</Label><Slider min={0.1} max={8} step={0.1} value={[velocity]} onValueChange={([v]) => setVelocity(v)} /></div>
            <div><Label>Depth y: {depth.toFixed(2)} m</Label><Slider min={0.1} max={5} step={0.1} value={[depth]} onValueChange={([v]) => setDepth(v)} /></div>
            <Button size="sm" variant="outline" onClick={() => setPlaying(!playing)}>{playing ? "Pause" : "Play"} Animation</Button>

            {/* Froude spectrum */}
            <div className="relative h-8 rounded-full overflow-hidden bg-gradient-to-r from-primary via-amber-400 to-destructive mt-4">
              <div className="absolute top-0 h-full w-0.5 bg-foreground" style={{ left: `${Math.min(95, Fr / 3 * 100)}%` }} />
              <div className="absolute -top-5 text-xs font-mono" style={{ left: `${Math.min(90, Fr / 3 * 100)}%` }}>Fr={Fr.toFixed(2)}</div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground"><span>Fr = 0</span><span>Fr = 1</span><span>Fr = 3</span></div>

            <Card className="bg-secondary/50 border-0"><CardContent className="p-3 text-sm space-y-1">
              <div>Fr = V/√(gD) = <span className={`font-mono font-bold ${regimeColor}`}>{Fr.toFixed(3)}</span></div>
              <div>Regime: <span className={`font-bold ${regimeColor}`}>{regime}</span></div>
              <div>Wave celerity c = √(gd) = {Math.sqrt(g * depth).toFixed(2)} m/s</div>
              <div>Critical depth yc = {yc.toFixed(3)} m</div>
            </CardContent></Card>
          </CardContent>
        </Card>

        {/* Wave visualization */}
        <Card className="card-water lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Wave Propagation — {regime}</CardTitle></CardHeader>
          <CardContent>
            <svg viewBox="0 0 500 240" className="w-full h-56 rounded bg-secondary/20">
              {/* Water body */}
              <rect x="0" y="80" width="500" height="100" fill="hsl(var(--primary) / 0.15)" />
              {/* Flow direction */}
              <text x="460" y="75" fontSize="10" fill="hsl(var(--muted-foreground))">Flow →</text>
              {/* Ripples */}
              {ripples.map((r, i) => (
                <ellipse key={i} cx={r.cx} cy={r.cy} rx={r.r} ry={r.r * 0.4}
                  fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity={r.opacity * 0.6}
                />
              ))}
              {/* Drop point */}
              <circle cx="250" cy="120" r="4" fill="hsl(var(--foreground))" />
              <text x="250" y="200" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">Pebble drop point</text>

              {/* Regime explanation */}
              <text x="250" y="225" textAnchor="middle" fontSize="11" fontWeight="bold" fill={Fr < 1 ? "hsl(var(--primary))" : "hsl(var(--destructive))"}>
                {Fr < 1 ? "Ripples travel both upstream and downstream" : Fr > 1 ? "Ripples only travel downstream — V-shaped wake" : "Ripples barely hold upstream"}
              </text>
            </svg>
            {Fr >= 1 && (
              <div className="mt-2 p-2 rounded bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                ⚠ Supercritical flow: Information cannot propagate upstream. Downstream control governs.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Formulas */}
      <Card className="card-water mt-6">
        <CardHeader><CardTitle className="text-lg">Key Relationships</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="font-bold mb-1">Froude Number</div>
              <div className="font-mono">Fr = V / √(gD)</div>
              <div className="text-muted-foreground mt-1">D = A/T (hydraulic depth)</div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="font-bold mb-1">Critical Depth (rectangular)</div>
              <div className="font-mono">yc = (q²/g)^(1/3)</div>
              <div className="text-muted-foreground mt-1">Where q = Q/b</div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="font-bold mb-1">Critical Velocity</div>
              <div className="font-mono">Vc = √(g·yc)</div>
              <div className="text-muted-foreground mt-1">At critical depth, Fr = 1 exactly</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FroudeNumberExplorer;
