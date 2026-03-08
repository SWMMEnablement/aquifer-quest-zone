import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";

interface Props { onClose: () => void; }

const SCENARIOS: Record<string, { Qs: number; D50: number; Qw: number; S: number; label: string }> = {
  dam: { Qs: -40, D50: -30, Qw: 0, S: 0, label: "Dam reduces sediment supply downstream → degradation" },
  urbanization: { Qs: 10, D50: 0, Qw: 40, S: 0, label: "Urbanization increases runoff → degradation tendency" },
  straightening: { Qs: 0, D50: 0, Qw: 0, S: 30, label: "Straightening increases slope → degradation" },
  deforestation: { Qs: 30, D50: 0, Qw: 20, S: 0, label: "Deforestation increases both sediment and water" },
};

const LanesBalance = ({ onClose }: Props) => {
  const [Qs, setQs] = useState(50);
  const [D50, setD50] = useState(50);
  const [Qw, setQw] = useState(50);
  const [S, setS] = useState(50);
  const [scenarioMsg, setScenarioMsg] = useState("");

  const leftArm = Qs * D50;
  const rightArm = Qw * S;
  const ratio = leftArm / (rightArm || 1);
  const tiltAngle = Math.max(-25, Math.min(25, (ratio - 1) * 30));
  const state = Math.abs(tiltAngle) < 3 ? "Equilibrium" : tiltAngle > 0 ? "Aggradation" : "Degradation";
  const stateColor = state === "Equilibrium" ? "text-earth-green" : state === "Aggradation" ? "text-amber-600" : "text-destructive";

  const applyScenario = (key: string) => {
    const s = SCENARIOS[key];
    setQs(Math.max(1, Math.min(100, 50 + s.Qs)));
    setD50(Math.max(1, Math.min(100, 50 + s.D50)));
    setQw(Math.max(1, Math.min(100, 50 + s.Qw)));
    setS(Math.max(1, Math.min(100, 50 + s.S)));
    setScenarioMsg(s.label);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={onClose} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">Lane's Balance — Stream Equilibrium</h1>
      <p className="text-muted-foreground mb-6">QₛD₅₀ ∝ QwS — Sediment supply balanced against flow power.
        <a href="https://ponce.sdsu.edu/" target="_blank" rel="noopener noreferrer" className="text-primary ml-2 inline-flex items-center gap-1">Ponce Reference <ExternalLink className="w-3 h-3" /></a>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Parameters</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Sediment Load Qₛ: {Qs}%</Label><Slider min={1} max={100} value={[Qs]} onValueChange={([v]) => { setQs(v); setScenarioMsg(""); }} /></div>
            <div><Label>Grain Size D₅₀: {D50}%</Label><Slider min={1} max={100} value={[D50]} onValueChange={([v]) => { setD50(v); setScenarioMsg(""); }} /></div>
            <div><Label>Water Discharge Qw: {Qw}%</Label><Slider min={1} max={100} value={[Qw]} onValueChange={([v]) => { setQw(v); setScenarioMsg(""); }} /></div>
            <div><Label>Channel Slope S: {S}%</Label><Slider min={1} max={100} value={[S]} onValueChange={([v]) => { setS(v); setScenarioMsg(""); }} /></div>
            <div className="border-t border-border pt-3">
              <Label className="mb-2 block">Scenarios</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={() => applyScenario("dam")}>Dam</Button>
                <Button size="sm" variant="outline" onClick={() => applyScenario("urbanization")}>Urbanization</Button>
                <Button size="sm" variant="outline" onClick={() => applyScenario("straightening")}>Straightening</Button>
                <Button size="sm" variant="outline" onClick={() => applyScenario("deforestation")}>Deforestation</Button>
              </div>
            </div>
            {scenarioMsg && <p className="text-xs text-muted-foreground italic">{scenarioMsg}</p>}
          </CardContent>
        </Card>

        {/* Balance beam visualization */}
        <Card className="card-water lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Lane's Balance</CardTitle></CardHeader>
          <CardContent>
            <div className="flex justify-center mb-2">
              <span className={`text-2xl font-bold font-display ${stateColor}`}>{state}</span>
            </div>
            <svg viewBox="0 0 500 280" className="w-full h-64">
              {/* Fulcrum */}
              <polygon points="250,200 235,240 265,240" fill="hsl(var(--earth-brown))" />
              <text x="250" y="260" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">Equilibrium Point</text>
              {/* Beam */}
              <g transform={`rotate(${tiltAngle}, 250, 200)`}>
                <line x1="50" y1="200" x2="450" y2="200" stroke="hsl(var(--foreground))" strokeWidth="4" />
                {/* Left pan - Sediment */}
                <rect x="60" y="175" width="80" height="25" rx="3" fill="hsl(var(--earth-brown) / 0.6)" stroke="hsl(var(--earth-brown))" />
                <text x="100" y="192" textAnchor="middle" fontSize="10" fill="hsl(var(--foreground))">QₛD₅₀</text>
                <text x="100" y="170" textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">Sediment</text>
                {/* Sediment pile proportional */}
                <ellipse cx="100" cy={175 - Qs * D50 / 150} rx={20 + Qs / 5} ry={5 + D50 / 10} fill="hsl(40, 35%, 55%)" opacity="0.7" />
                {/* Right pan - Flow */}
                <rect x="360" y="175" width="80" height="25" rx="3" fill="hsl(var(--primary) / 0.4)" stroke="hsl(var(--primary))" />
                <text x="400" y="192" textAnchor="middle" fontSize="10" fill="hsl(var(--foreground))">QwS</text>
                <text x="400" y="170" textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">Flow Power</text>
                {/* Water volume proportional */}
                <ellipse cx="400" cy={175 - Qw * S / 150} rx={20 + Qw / 5} ry={5 + S / 10} fill="hsl(var(--primary) / 0.5)" />
              </g>
            </svg>

            {/* Channel response */}
            <div className="mt-4">
              <svg viewBox="0 0 500 100" className="w-full h-24">
                {/* Channel bed */}
                {state === "Equilibrium" ? (
                  <>
                    <line x1="50" y1="60" x2="450" y2="60" stroke="hsl(var(--earth-brown))" strokeWidth="3" />
                    <rect x="50" y="60" width="400" height="30" fill="hsl(var(--earth-brown) / 0.2)" />
                    <text x="250" y="55" textAnchor="middle" fontSize="10" fill="hsl(var(--earth-green))">Stable channel</text>
                  </>
                ) : state === "Aggradation" ? (
                  <>
                    <path d="M50,70 Q150,50 250,45 Q350,40 450,55" fill="hsl(40, 35%, 55% / 0.4)" stroke="hsl(var(--earth-brown))" strokeWidth="2" />
                    <rect x="50" y="70" width="400" height="20" fill="hsl(var(--earth-brown) / 0.2)" />
                    <text x="250" y="35" textAnchor="middle" fontSize="10" fill="hsl(30, 60%, 40%)">↑ Bed rising, channel widening</text>
                  </>
                ) : (
                  <>
                    <path d="M50,50 Q150,60 250,70 Q350,65 450,55" fill="none" stroke="hsl(var(--earth-brown))" strokeWidth="2" />
                    <rect x="50" y="70" width="400" height="20" fill="hsl(var(--earth-brown) / 0.2)" />
                    <text x="250" y="35" textAnchor="middle" fontSize="10" fill="hsl(var(--destructive))">↓ Bed lowering, channel incising</text>
                  </>
                )}
                {/* Water surface */}
                <line x1="50" y1="40" x2="450" y2="40" stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="4 4" />
              </svg>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LanesBalance;
