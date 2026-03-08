import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { onClose: () => void; }

const g = 9.81;

const SpecificEnergyMomentum = ({ onClose }: Props) => {
  const [q, setQ] = useState(5); // m³/s per unit width
  const [currentY, setCurrentY] = useState(2);

  const yc = useMemo(() => Math.pow(q * q / g, 1 / 3), [q]);
  const Emin = useMemo(() => 1.5 * yc, [yc]);

  const data = useMemo(() => {
    const pts = [];
    for (let y = 0.1; y <= 6; y += 0.05) {
      const V = q / y;
      const E = y + V * V / (2 * g);
      const M = q * q / (g * y) + y * y / 2;
      pts.push({ y: +y.toFixed(2), E: +E.toFixed(3), M: +M.toFixed(3) });
    }
    return pts;
  }, [q]);

  const currentV = q / currentY;
  const currentE = currentY + currentV * currentV / (2 * g);
  const currentM = q * q / (g * currentY) + currentY * currentY / 2;
  const Fr = currentV / Math.sqrt(g * currentY);

  // Conjugate depth for hydraulic jump (from momentum equation)
  const y2 = currentY / 2 * (Math.sqrt(1 + 8 * Fr * Fr) - 1);
  const V2 = q / y2;
  const Fr2 = V2 / Math.sqrt(g * y2);
  const E2 = y2 + V2 * V2 / (2 * g);
  const energyLoss = currentE - E2;
  const jumpType = Fr < 1 ? "N/A (subcritical)" : Fr < 1.7 ? "Undular" : Fr < 2.5 ? "Weak" : Fr < 4.5 ? "Oscillating" : Fr < 9 ? "Steady" : "Strong";

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={onClose} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">Specific Energy & Momentum Diagrams</h1>
      <p className="text-muted-foreground mb-6">Draggable depth with conjugate depth pairs and hydraulic jump analysis.
        <a href="https://ponce.sdsu.edu/" target="_blank" rel="noopener noreferrer" className="text-primary ml-2 inline-flex items-center gap-1">Ponce Reference <ExternalLink className="w-3 h-3" /></a>
      </p>

      {/* Controls */}
      <Card className="card-water mb-6">
        <CardContent className="p-4 flex flex-wrap gap-6">
          <div className="flex-1 min-w-48"><Label>Unit discharge q: {q.toFixed(1)} m³/s/m</Label><Slider min={0.5} max={20} step={0.5} value={[q]} onValueChange={([v]) => setQ(v)} /></div>
          <div className="flex-1 min-w-48"><Label>Current depth y₁: {currentY.toFixed(2)} m</Label><Slider min={0.1} max={6} step={0.05} value={[currentY]} onValueChange={([v]) => setCurrentY(v)} /></div>
          <div className="flex-1 min-w-48 flex items-end">
            <div className="text-sm space-y-1">
              <div>Critical depth y<sub>c</sub> = <span className="font-mono font-bold">{yc.toFixed(3)} m</span></div>
              <div>Froude Fr = <span className={`font-mono font-bold ${Fr > 1 ? 'text-destructive' : 'text-primary'}`}>{Fr.toFixed(3)}</span>
                <span className="ml-2 text-xs">({Fr < 1 ? "Subcritical" : Fr === 1 ? "Critical" : "Supercritical"})</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* E-y diagram */}
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Specific Energy E vs y</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="E" type="number" domain={[0, 'auto']} label={{ value: "E (m)", position: "bottom", offset: 0 }} tick={{ fontSize: 10 }} />
                <YAxis dataKey="y" type="number" domain={[0, 6]} label={{ value: "y (m)", angle: -90, position: "insideLeft" }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => v.toFixed(3)} />
                <Line type="monotone" dataKey="y" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} data={data.map(d => ({ ...d, x: d.E }))} />
                <ReferenceLine y={yc} stroke="hsl(var(--accent))" strokeDasharray="5 5" label={{ value: `yc=${yc.toFixed(2)}`, fill: "hsl(var(--accent))" }} />
                <ReferenceLine x={currentE} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
            <div className="text-xs text-center text-muted-foreground mt-1">E = y + V²/(2g) | E<sub>min</sub> = {Emin.toFixed(3)} m at y<sub>c</sub></div>
          </CardContent>
        </Card>

        {/* M-y diagram */}
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Specific Momentum M vs y</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="M" type="number" domain={[0, 'auto']} label={{ value: "M (m³)", position: "bottom", offset: 0 }} tick={{ fontSize: 10 }} />
                <YAxis dataKey="y" type="number" domain={[0, 6]} label={{ value: "y (m)", angle: -90, position: "insideLeft" }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => v.toFixed(3)} />
                <Line type="monotone" dataKey="y" stroke="hsl(var(--accent))" dot={false} strokeWidth={2} />
                <ReferenceLine y={yc} stroke="hsl(var(--accent))" strokeDasharray="5 5" />
                <ReferenceLine x={currentM} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
            <div className="text-xs text-center text-muted-foreground mt-1">M = q²/(gy) + y²/2</div>
          </CardContent>
        </Card>
      </div>

      {/* Hydraulic Jump Panel */}
      <Card className="card-water mt-6">
        <CardHeader><CardTitle className="text-lg">Hydraulic Jump Analysis</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Upstream y₁</div>
              <div className="font-mono text-lg font-bold">{currentY.toFixed(2)} m</div>
              <div className="text-xs">Fr₁ = {Fr.toFixed(2)}</div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Downstream y₂ (conjugate)</div>
              <div className="font-mono text-lg font-bold">{y2.toFixed(2)} m</div>
              <div className="text-xs">Fr₂ = {Fr2.toFixed(2)}</div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Energy Loss ΔE</div>
              <div className="font-mono text-lg font-bold">{energyLoss > 0 ? energyLoss.toFixed(3) : "—"} m</div>
              <div className="text-xs">{energyLoss > 0 ? `${((energyLoss / currentE) * 100).toFixed(1)}% of E₁` : ""}</div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Jump Classification</div>
              <div className="font-mono text-lg font-bold">{jumpType}</div>
              <div className="text-xs">y₂/y₁ = {(y2 / currentY).toFixed(2)}</div>
            </div>
          </div>
          {/* Simple jump SVG */}
          <svg viewBox="0 0 400 120" className="w-full h-32 rounded bg-secondary/20">
            <rect x="0" y="100" width="400" height="20" fill="hsl(var(--earth-brown))" />
            {/* Upstream supercritical */}
            <rect x="0" y={100 - Math.min(currentY * 15, 80)} width="150" height={Math.min(currentY * 15, 80)} fill="hsl(var(--primary) / 0.4)" stroke="hsl(var(--primary))" />
            {/* Turbulent roller */}
            <ellipse cx="175" cy={100 - Math.min(y2 * 10, 70)} rx="25" ry="15" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeDasharray="3 2" />
            {/* Downstream subcritical */}
            <rect x="200" y={100 - Math.min(y2 * 15, 80)} width="200" height={Math.min(y2 * 15, 80)} fill="hsl(var(--primary) / 0.3)" stroke="hsl(var(--primary))" />
            <text x="75" y="115" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="9">y₁={currentY.toFixed(1)}</text>
            <text x="300" y="115" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="9">y₂={y2.toFixed(1)}</text>
            <text x="175" y={100 - Math.min(y2 * 10, 70) - 18} textAnchor="middle" fill="hsl(var(--accent))" fontSize="9">Jump</text>
          </svg>
          <p className="text-xs text-muted-foreground mt-2 italic">ΔE = (y₂ − y₁)³ / (4y₁y₂) — Energy dissipated in the hydraulic jump</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpecificEnergyMomentum;
