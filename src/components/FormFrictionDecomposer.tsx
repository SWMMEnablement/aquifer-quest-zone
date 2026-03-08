import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { onClose: () => void; }

const FormFrictionDecomposer = ({ onClose }: Props) => {
  const [velocity, setVelocity] = useState(1.0);
  const [D50, setD50] = useState(2); // mm
  const [depth, setDepth] = useState(2);

  const D50m = D50 / 1000;
  const Fr = velocity / Math.sqrt(9.81 * depth);
  const nGrain = 0.047 * Math.pow(D50m, 1 / 6); // Strickler

  // Bedform regime based on Fr and grain size
  const regime = Fr < 0.1 ? "Flat bed" : Fr < 0.3 ? "Ripples" : Fr < 0.8 ? "Dunes" : Fr < 1.0 ? "Transition" : "Antidunes";

  // Form friction varies by regime
  const nForm = regime === "Flat bed" ? 0 :
    regime === "Ripples" ? 0.005 + Fr * 0.02 :
    regime === "Dunes" ? 0.01 + Fr * 0.03 :
    regime === "Transition" ? 0.005 :
    0.008 + (Fr - 1) * 0.02;

  const nTotal = nGrain + nForm;
  const grainPct = nTotal > 0 ? (nGrain / nTotal * 100).toFixed(0) : "0";
  const formPct = nTotal > 0 ? (nForm / nTotal * 100).toFixed(0) : "0";

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={onClose} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">Form vs Grain Friction</h1>
      <p className="text-muted-foreground mb-6">Non-monotonic friction decomposition across bedform regimes.
        <a href="https://ponce.sdsu.edu/" target="_blank" rel="noopener noreferrer" className="text-primary ml-2 inline-flex items-center gap-1">Ponce Reference <ExternalLink className="w-3 h-3" /></a>
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Flow Parameters</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Velocity: {velocity.toFixed(2)} m/s</Label><Slider min={0.05} max={3} step={0.05} value={[velocity]} onValueChange={([v]) => setVelocity(v)} /></div>
            <div><Label>Grain Size D₅₀: {D50} mm</Label><Slider min={0.1} max={50} step={0.1} value={[D50]} onValueChange={([v]) => setD50(v)} /></div>
            <div><Label>Depth: {depth} m</Label><Slider min={0.5} max={10} step={0.5} value={[depth]} onValueChange={([v]) => setDepth(v)} /></div>
            <Card className="bg-secondary/50 border-0"><CardContent className="p-3 text-sm space-y-1">
              <div>Fr = {Fr.toFixed(3)}</div>
              <div>Regime: <span className="font-bold">{regime}</span></div>
              <div>n<sub>grain</sub> = {nGrain.toFixed(4)}</div>
              <div>n<sub>form</sub> = {nForm.toFixed(4)}</div>
              <div className="font-bold">n<sub>total</sub> = {nTotal.toFixed(4)}</div>
            </CardContent></Card>
          </CardContent>
        </Card>
        <Card className="card-water lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Friction Decomposition</CardTitle></CardHeader>
          <CardContent>
            {/* Stacked bar */}
            <div className="h-12 rounded-lg overflow-hidden flex mb-4">
              <div className="flex items-center justify-center text-xs font-bold" style={{ width: `${grainPct}%`, background: "hsl(var(--earth-brown))", color: "white" }}>
                n<sub>grain</sub> {grainPct}%
              </div>
              <div className="flex items-center justify-center text-xs font-bold" style={{ width: `${formPct}%`, background: "hsl(var(--primary))", color: "white" }}>
                n<sub>form</sub> {formPct}%
              </div>
            </div>

            {/* Bedform animation */}
            <svg viewBox="0 0 500 120" className="w-full h-28 rounded bg-secondary/20">
              <rect x="0" y="60" width="500" height="60" fill="hsl(var(--primary) / 0.15)" />
              {regime === "Flat bed" && <line x1="0" y1="80" x2="500" y2="80" stroke="hsl(var(--earth-brown))" strokeWidth="2" />}
              {regime === "Ripples" && (
                <path d={Array.from({ length: 25 }, (_, i) => `${i === 0 ? 'M' : 'Q'} ${i * 20},${80 - 3 * Math.sin(i * 0.5)} ${i * 20 + 10},${80 + 3 * Math.cos(i * 0.5)}`).join(" ")}
                  fill="none" stroke="hsl(var(--earth-brown))" strokeWidth="2" />
              )}
              {regime === "Dunes" && (
                <path d={Array.from({ length: 8 }, (_, i) => {
                  const x0 = i * 62;
                  return `M${x0},85 Q${x0 + 15},60 ${x0 + 30},85 L${x0 + 62},85`;
                }).join(" ")} fill="hsl(var(--earth-brown) / 0.3)" stroke="hsl(var(--earth-brown))" strokeWidth="2" />
              )}
              {regime === "Transition" && <line x1="0" y1="80" x2="500" y2="80" stroke="hsl(var(--earth-brown))" strokeWidth="2" strokeDasharray="10 5" />}
              {regime === "Antidunes" && (
                <path d={Array.from({ length: 10 }, (_, i) => `${i === 0 ? 'M' : ''} ${i * 50},${80 - 8 * Math.sin(i * 0.8)}`).join(" L")}
                  fill="none" stroke="hsl(var(--earth-brown))" strokeWidth="2" />
              )}
              <text x="250" y="110" textAnchor="middle" fontSize="11" fontWeight="bold" fill="hsl(var(--foreground))">{regime}</text>
            </svg>

            {/* Regime progression */}
            <div className="flex gap-1 mt-4">
              {["Flat bed", "Ripples", "Dunes", "Transition", "Antidunes"].map(r => (
                <div key={r} className={`flex-1 text-center text-xs p-2 rounded ${r === regime ? 'bg-primary text-primary-foreground font-bold' : 'bg-secondary/50'}`}>{r}</div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 italic">Form friction is non-monotonic: grows through dunes, drops at transition, grows again for antidunes.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FormFrictionDecomposer;
