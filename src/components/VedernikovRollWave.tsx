import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { onClose: () => void; }
const g = 9.81;

const BETA_VALUES: Record<string, number> = { "wide-rect": 5 / 3, "trapezoidal": 1.5, "triangular": 4 / 3, "circular": 1.4 };

const VedernikovRollWave = ({ onClose }: Props) => {
  const [slope, setSlope] = useState(0.02);
  const [depth, setDepth] = useState(1);
  const [manningN, setManningN] = useState(0.015);
  const [shape, setShape] = useState("wide-rect");
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const animRef = useRef<number>();

  const beta = BETA_VALUES[shape] || 5 / 3;
  const V = (1 / manningN) * Math.pow(depth, 2 / 3) * Math.pow(slope, 0.5);
  const Fr = V / Math.sqrt(g * depth);
  const Ved = (beta - 1) * Fr;

  useEffect(() => {
    if (playing) {
      const tick = () => { setTime(t => t + 0.02); animRef.current = requestAnimationFrame(tick); };
      animRef.current = requestAnimationFrame(tick);
    } else if (animRef.current) cancelAnimationFrame(animRef.current);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [playing]);

  // Phase diagram data
  const phaseData = useMemo(() => {
    const data = [];
    for (let fr = 0; fr <= 3; fr += 0.1) {
      data.push({ Fr: +fr.toFixed(1), V_stable: Math.min(3, 1 / (beta - 1)), Ved: +((beta - 1) * fr).toFixed(2) });
    }
    return data;
  }, [beta]);

  // Generate water surface with or without roll waves
  const waterSurface = useMemo(() => {
    const pts: string[] = [];
    const baseY = 100;
    for (let x = 0; x <= 500; x += 2) {
      let perturbation = 0;
      if (Ved > 0.8 && Ved < 1.0) {
        perturbation = 2 * Math.sin((x - time * 50) * 0.1) * (Ved - 0.8) * 5;
      } else if (Ved >= 1.0) {
        const amplitude = Math.min(20, (Ved - 1) * 15 + 5);
        const freq = 0.08;
        perturbation = amplitude * Math.abs(Math.sin((x - time * 80) * freq)) * Math.sign(Math.sin((x - time * 80) * freq));
      }
      pts.push(`${x},${baseY - depth * 15 - perturbation}`);
    }
    return pts.join(" ");
  }, [Ved, depth, time]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={onClose} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">Vedernikov Number & Roll Waves</h1>
      <p className="text-muted-foreground mb-6">Stability threshold and roll wave formation in steep channels.
        <a href="https://ponce.sdsu.edu/the_control_of_roll_waves.html" target="_blank" rel="noopener noreferrer" className="text-primary ml-2 inline-flex items-center gap-1">Ponce Reference <ExternalLink className="w-3 h-3" /></a>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Controls</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Slope: {slope.toFixed(3)}</Label><Slider min={0.001} max={0.1} step={0.001} value={[slope]} onValueChange={([v]) => setSlope(v)} /></div>
            <div><Label>Depth: {depth.toFixed(2)} m</Label><Slider min={0.1} max={5} step={0.1} value={[depth]} onValueChange={([v]) => setDepth(v)} /></div>
            <div><Label>Manning's n: {manningN.toFixed(3)}</Label><Slider min={0.01} max={0.05} step={0.001} value={[manningN]} onValueChange={([v]) => setManningN(v)} /></div>
            <div>
              <Label>Cross-Section</Label>
              <Select value={shape} onValueChange={setShape}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="wide-rect">Wide Rectangle (β=5/3)</SelectItem>
                  <SelectItem value="trapezoidal">Trapezoidal (β=3/2)</SelectItem>
                  <SelectItem value="triangular">Triangular (β=4/3)</SelectItem>
                  <SelectItem value="circular">Circular (β≈1.4)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" variant="outline" onClick={() => setPlaying(!playing)}>{playing ? "Pause" : "Play"}</Button>

            <Card className="bg-secondary/50 border-0"><CardContent className="p-3 text-sm space-y-1">
              <div>V = {V.toFixed(2)} m/s</div>
              <div>Fr = {Fr.toFixed(3)}</div>
              <div>β = {beta.toFixed(3)}</div>
              <div className={`font-bold text-lg ${Ved >= 1 ? 'text-destructive' : Ved > 0.8 ? 'text-amber-500' : 'text-earth-green'}`}>
                V = (β−1)Fr = {Ved.toFixed(3)}
              </div>
              <div className="text-xs">{Ved < 0.8 ? "✓ Stable flow" : Ved < 1 ? "⚠ Near instability" : "✗ Roll waves forming!"}</div>
            </CardContent></Card>
          </CardContent>
        </Card>

        {/* Channel animation */}
        <Card className="card-water lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Channel Flow</CardTitle></CardHeader>
          <CardContent>
            <svg viewBox="0 0 500 160" className="w-full h-40 rounded bg-secondary/20">
              <rect x="0" y="120" width="500" height="40" fill="hsl(var(--earth-brown) / 0.3)" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="hsl(var(--earth-brown))" strokeWidth="2" />
              <polyline points={waterSurface} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
              {/* Fill water */}
              <polygon points={`0,120 ${waterSurface} 500,120`} fill="hsl(var(--primary) / 0.2)" />
              <text x="250" y="145" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">
                {Ved < 0.8 ? "Smooth free surface" : Ved < 1 ? "Small perturbations appearing" : "Roll waves developed"}
              </text>
            </svg>
          </CardContent>
        </Card>

        {/* Phase diagram */}
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Stability Diagram</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={phaseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="Fr" tick={{ fontSize: 9 }} label={{ value: "Fr", position: "bottom", offset: -5 }} />
                <YAxis domain={[0, 3]} tick={{ fontSize: 9 }} label={{ value: "V", angle: -90, position: "insideLeft" }} />
                <ReferenceLine y={1} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: "V=1", fill: "hsl(var(--destructive))", fontSize: 9 }} />
                <Line type="monotone" dataKey="Ved" stroke="hsl(var(--accent))" dot={false} strokeWidth={1.5} />
                <Tooltip />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-2 text-xs text-center">
              <span className="inline-block w-3 h-3 rounded-full bg-earth-green mr-1" />Stable (V&lt;1)
              <span className="inline-block w-3 h-3 rounded-full bg-destructive ml-3 mr-1" />Unstable (V≥1)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VedernikovRollWave;
