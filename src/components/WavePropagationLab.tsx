import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause, RotateCcw, ExternalLink } from "lucide-react";

interface Props { onClose: () => void; }
const g = 9.81;

const WavePropagationLab = ({ onClose }: Props) => {
  const [depth, setDepth] = useState(2);
  const [manningN, setManningN] = useState(0.03);
  const [slope, setSlope] = useState(0.005);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const animRef = useRef<number>();

  const R = depth; // wide channel approximation
  const V = (1 / manningN) * Math.pow(R, 2 / 3) * Math.pow(slope, 0.5);
  const Fr = V / Math.sqrt(g * depth);
  const beta = 5 / 3; // Manning
  const ck = beta * V; // kinematic celerity
  const cd_plus = V + Math.sqrt(g * depth); // dynamic downstream
  const cd_minus = V - Math.sqrt(g * depth); // dynamic upstream
  const Ved = (beta - 1) * Fr; // Vedernikov number

  useEffect(() => {
    if (playing) {
      const tick = () => {
        setTime(t => t + 0.05);
        animRef.current = requestAnimationFrame(tick);
      };
      animRef.current = requestAnimationFrame(tick);
    } else if (animRef.current) {
      cancelAnimationFrame(animRef.current);
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [playing]);

  // Wave positions at current time (normalized 0-1 across channel)
  const waveScale = 0.02; // scale factor for visualization
  const kinPos = Math.min((ck * time * waveScale) % 1.2, 1.1);
  const dynPosPlus = Math.min((cd_plus * time * waveScale) % 1.2, 1.1);
  const dynPosMinus = Fr < 1 ? Math.max(0, 0.3 + (cd_minus * time * waveScale) % 1.2) : -1; // only if subcritical

  const generateWaveSurface = (pos: number, amplitude: number, spread: number) => {
    const pts: string[] = [];
    for (let x = 0; x <= 1; x += 0.005) {
      const dist = x - pos;
      const h = amplitude * Math.exp(-dist * dist / (2 * spread * spread));
      pts.push(`${x * 500 + 10},${120 - (depth * 18 + h * 100)}`);
    }
    return pts.join(" ");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={onClose} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">Shallow Wave Propagation Lab</h1>
      <p className="text-muted-foreground mb-6">Compare kinematic and dynamic wave celerity in real-time.
        <a href="https://ponce.sdsu.edu/the_kinematic_wave_controversy.html" target="_blank" rel="noopener noreferrer" className="text-primary ml-2 inline-flex items-center gap-1">Ponce Reference <ExternalLink className="w-3 h-3" /></a>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Channel Controls</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Depth y: {depth.toFixed(1)} m</Label><Slider min={0.1} max={5} step={0.1} value={[depth]} onValueChange={([v]) => setDepth(v)} /></div>
            <div><Label>Manning's n: {manningN.toFixed(3)}</Label><Slider min={0.01} max={0.1} step={0.001} value={[manningN]} onValueChange={([v]) => setManningN(v)} /></div>
            <div><Label>Slope S₀: {slope.toFixed(4)}</Label><Slider min={0.0001} max={0.05} step={0.0001} value={[slope]} onValueChange={([v]) => setSlope(v)} /></div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setPlaying(!playing)}>{playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</Button>
              <Button size="sm" variant="outline" onClick={() => { setTime(0); setPlaying(false); }}><RotateCcw className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>

        <Card className="card-water lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Wave Propagation</CardTitle></CardHeader>
          <CardContent>
            <svg viewBox="0 0 520 160" className="w-full h-48 rounded bg-secondary/20">
              {/* Channel bed */}
              <rect x="10" y="120" width="500" height="40" fill="hsl(var(--earth-brown) / 0.4)" />
              <line x1="10" y1="120" x2="510" y2="120" stroke="hsl(var(--earth-brown))" strokeWidth="2" />
              {/* Still water level */}
              <line x1="10" y1={120 - depth * 18} x2="510" y2={120 - depth * 18} stroke="hsl(var(--primary) / 0.3)" strokeWidth="1" strokeDasharray="4 4" />
              {/* Kinematic wave (green) */}
              <polyline points={generateWaveSurface(kinPos, 0.15, 0.03)} fill="none" stroke="hsl(var(--earth-green))" strokeWidth="2.5" />
              {/* Dynamic wave downstream (red) */}
              <polyline points={generateWaveSurface(dynPosPlus, 0.1, 0.025)} fill="none" stroke="hsl(var(--destructive))" strokeWidth="2" />
              {/* Dynamic wave upstream (purple) - only subcritical */}
              {Fr < 1 && dynPosMinus >= 0 && (
                <polyline points={generateWaveSurface(dynPosMinus, 0.08, 0.02)} fill="none" stroke="hsl(270 60% 50%)" strokeWidth="2" />
              )}
              {/* Legend */}
              <line x1="20" y1="12" x2="40" y2="12" stroke="hsl(var(--earth-green))" strokeWidth="2" />
              <text x="45" y="15" fontSize="9" fill="hsl(var(--foreground))">Kinematic (βV)</text>
              <line x1="150" y1="12" x2="170" y2="12" stroke="hsl(var(--destructive))" strokeWidth="2" />
              <text x="175" y="15" fontSize="9" fill="hsl(var(--foreground))">Dynamic (V+√gd)</text>
              {Fr < 1 && <>
                <line x1="310" y1="12" x2="330" y2="12" stroke="hsl(270 60% 50%)" strokeWidth="2" />
                <text x="335" y="15" fontSize="9" fill="hsl(var(--foreground))">Dynamic (V−√gd)</text>
              </>}
              {/* Flow direction */}
              <polygon points="490,125 500,130 490,135" fill="hsl(var(--primary))" opacity="0.5" />
            </svg>
            {Fr >= 1 && (
              <div className="mt-2 p-2 rounded bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                ⚠ Supercritical flow (Fr = {Fr.toFixed(2)} &gt; 1). Upstream propagation impossible — information travels downstream only.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Wave Metrics</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="bg-secondary/50 rounded p-2">
              <div className="text-muted-foreground">Flow velocity V</div>
              <div className="font-mono text-lg">{V.toFixed(2)} m/s</div>
            </div>
            <div className="bg-secondary/50 rounded p-2">
              <div className="text-muted-foreground">Froude number Fr</div>
              <div className={`font-mono text-lg ${Fr > 1 ? 'text-destructive font-bold' : ''}`}>{Fr.toFixed(3)}</div>
            </div>
            <div className="rounded p-2" style={{ background: "hsl(var(--earth-green) / 0.1)" }}>
              <div className="text-muted-foreground">Kinematic cₖ = βV</div>
              <div className="font-mono text-lg">{ck.toFixed(2)} m/s</div>
            </div>
            <div className="bg-destructive/10 rounded p-2">
              <div className="text-muted-foreground">Dynamic c₊ = V+√(gd)</div>
              <div className="font-mono text-lg">{cd_plus.toFixed(2)} m/s</div>
            </div>
            <div className="rounded p-2" style={{ background: "hsl(270 60% 50% / 0.1)" }}>
              <div className="text-muted-foreground">Dynamic c₋ = V−√(gd)</div>
              <div className="font-mono text-lg">{cd_minus.toFixed(2)} m/s</div>
            </div>
            <div className="bg-secondary/50 rounded p-2">
              <div className="text-muted-foreground">Vedernikov V = (β−1)Fr</div>
              <div className={`font-mono text-lg ${Ved > 1 ? 'text-destructive font-bold' : ''}`}>{Ved.toFixed(3)}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WavePropagationLab;
