import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Scatter, ScatterChart, ZAxis } from "recharts";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { computeSpecificEnergy, generateEnergyMomentumCurve } from "@/lib/hydrology/open-channel";

interface Props { onClose: () => void; }

const g = 9.81;

const SpecificEnergyMomentum = ({ onClose }: Props) => {
  const [q, setQ] = useState(5);
  const [currentY, setCurrentY] = useState(2);
  const [animTime, setAnimTime] = useState(0);
  const animRef = useRef<number>(0);

  const result = useMemo(() => computeSpecificEnergy(q, currentY), [q, currentY]);
  const { yc, Emin, Fr: Fr, y2, Fr2, E: currentE, M: currentM, energyLoss, jumpType, efficiency } = result;
  const V2 = q / y2;
  const E2 = y2 + V2 * V2 / (2 * g);

  // Animation for hydraulic jump
  useEffect(() => {
    const animate = () => {
      setAnimTime(t => t + 0.03);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const data = useMemo(() => generateEnergyMomentumCurve(q), [q]);

  // E-y current points for scatter overlay
  const currentEPoint = [{ E: +currentE.toFixed(3), y: currentY }];
  const conjugateEPoint = Fr > 1 ? [{ E: +E2.toFixed(3), y: +y2.toFixed(2) }] : [];

  // Animated hydraulic jump SVG
  const jumpSvgW = 500, jumpSvgH = 160;
  const bedY = 140;
  const y1Px = Math.min(currentY * 18, 100);
  const y2Px = Math.min(y2 * 18, 120);

  // Turbulent roller bubbles
  const bubbles = useMemo(() => {
    const b = [];
    for (let i = 0; i < 12; i++) {
      b.push({
        cx: 200 + Math.sin(i * 1.3) * 30,
        cy: bedY - y2Px * 0.5 + Math.cos(i * 0.9) * (y2Px * 0.3),
        r: 2 + Math.random() * 3,
        phase: i * 0.5,
      });
    }
    return b;
  }, [y2Px]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={onClose} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">Specific Energy & Momentum Diagrams</h1>
      <p className="text-muted-foreground mb-6">Draggable depth with conjugate depth pairs and animated hydraulic jump.
        <a href="https://ponce.sdsu.edu/" target="_blank" rel="noopener noreferrer" className="text-primary ml-2 inline-flex items-center gap-1">Ponce Reference <ExternalLink className="w-3 h-3" /></a>
      </p>

      {/* Controls */}
      <Card className="card-water mb-6">
        <CardContent className="p-4 flex flex-wrap gap-6">
          <div className="flex-1 min-w-48"><Label>Unit discharge q: {q.toFixed(1)} m³/s/m</Label><Slider min={0.5} max={20} step={0.5} value={[q]} onValueChange={([v]) => setQ(v)} /></div>
          <div className="flex-1 min-w-48"><Label>Current depth y₁: {currentY.toFixed(2)} m (drag to explore)</Label><Slider min={0.1} max={6} step={0.02} value={[currentY]} onValueChange={([v]) => setCurrentY(v)} /></div>
          <div className="flex-1 min-w-48 flex items-end">
            <div className="text-sm space-y-1">
              <div>Critical depth y<sub>c</sub> = <span className="font-mono font-bold">{yc.toFixed(3)} m</span></div>
              <div>Froude Fr₁ = <span className={`font-mono font-bold ${Fr > 1 ? 'text-destructive' : 'text-primary'}`}>{Fr.toFixed(3)}</span>
                <span className="ml-2 text-xs">({Fr < 1 ? "Subcritical" : Fr === 1 ? "Critical" : "Supercritical"})</span>
              </div>
              <div>Conjugate y₂ = <span className="font-mono font-bold text-accent">{y2.toFixed(3)} m</span>
                <span className="ml-2 text-xs text-muted-foreground">Fr₂ = {Fr2.toFixed(3)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* E-y diagram with operating point */}
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Specific Energy E vs y</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={data} margin={{ bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="E" type="number" domain={[0, 'auto']} label={{ value: "E (m)", position: "bottom", offset: 0 }} tick={{ fontSize: 10 }} />
                <YAxis dataKey="y" type="number" domain={[0, 6]} label={{ value: "y (m)", angle: -90, position: "insideLeft" }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => v.toFixed(3)} />
                <Line type="monotone" dataKey="y" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
                {/* 45° line E=y */}
                <Line type="monotone" dataKey="y" stroke="hsl(var(--muted-foreground))" dot={false} strokeWidth={1} strokeDasharray="4 4" data={[{E:0,y:0},{E:6,y:6}]} />
                <ReferenceLine y={yc} stroke="hsl(var(--accent))" strokeDasharray="5 5" label={{ value: `yc=${yc.toFixed(2)}`, fill: "hsl(var(--accent-foreground))", fontSize: 10 }} />
                {/* Current depth line */}
                <ReferenceLine y={currentY} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label={{ value: `y₁`, fill: "hsl(var(--destructive))", fontSize: 10 }} />
                {/* Conjugate depth line */}
                {Fr > 1 && <ReferenceLine y={y2} stroke="hsl(var(--accent))" strokeDasharray="3 3" label={{ value: `y₂`, fill: "hsl(var(--accent))", fontSize: 10 }} />}
                {/* Energy loss shading */}
                {Fr > 1 && <ReferenceLine x={currentE} stroke="hsl(var(--destructive))" strokeDasharray="2 2" />}
                {Fr > 1 && <ReferenceLine x={E2} stroke="hsl(var(--accent))" strokeDasharray="2 2" />}
              </LineChart>
            </ResponsiveContainer>
            <div className="text-xs text-center text-muted-foreground mt-1">
              E = y + V²/(2g) | E<sub>min</sub> = {Emin.toFixed(3)} m at y<sub>c</sub>
              {Fr > 1 && <span className="text-destructive ml-2">| ΔE = {energyLoss.toFixed(3)} m lost in jump</span>}
            </div>
          </CardContent>
        </Card>

        {/* M-y diagram */}
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Specific Momentum M vs y</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={data} margin={{ bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="M" type="number" domain={[0, 'auto']} label={{ value: "M (m³)", position: "bottom", offset: 0 }} tick={{ fontSize: 10 }} />
                <YAxis dataKey="y" type="number" domain={[0, 6]} label={{ value: "y (m)", angle: -90, position: "insideLeft" }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => v.toFixed(3)} />
                <Line type="monotone" dataKey="y" stroke="hsl(var(--accent))" dot={false} strokeWidth={2} />
                <ReferenceLine y={yc} stroke="hsl(var(--accent))" strokeDasharray="5 5" />
                <ReferenceLine y={currentY} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label={{ value: "y₁", fill: "hsl(var(--destructive))", fontSize: 10 }} />
                {Fr > 1 && <ReferenceLine y={y2} stroke="hsl(var(--primary))" strokeDasharray="3 3" label={{ value: "y₂", fill: "hsl(var(--primary))", fontSize: 10 }} />}
                <ReferenceLine x={currentM} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label={{ value: "M (same for conjugate pair)", fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="text-xs text-center text-muted-foreground mt-1">M = q²/(gy) + y²/2 — Conjugate depths share the same M value</div>
          </CardContent>
        </Card>
      </div>

      {/* Animated Hydraulic Jump */}
      <Card className="card-water mt-6">
        <CardHeader><CardTitle className="text-lg">Animated Hydraulic Jump</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Upstream y₁</div>
              <div className="font-mono text-lg font-bold">{currentY.toFixed(2)} m</div>
              <div className="text-xs">Fr₁ = {Fr.toFixed(2)}</div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Downstream y₂</div>
              <div className="font-mono text-lg font-bold text-accent">{y2.toFixed(2)} m</div>
              <div className="text-xs">Fr₂ = {Fr2.toFixed(2)}</div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Energy Loss ΔE</div>
              <div className="font-mono text-lg font-bold">{energyLoss > 0 ? energyLoss.toFixed(3) : "—"} m</div>
              <div className="text-xs">{energyLoss > 0 ? `${((energyLoss / currentE) * 100).toFixed(1)}%` : ""}</div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Classification</div>
              <div className="font-mono text-lg font-bold">{jumpType}</div>
              <div className="text-xs">y₂/y₁ = {(y2 / currentY).toFixed(2)}</div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Dissipation</div>
              <div className="font-mono text-lg font-bold">{energyLoss > 0 ? `${((energyLoss / currentE) * 100).toFixed(0)}%` : "—"}</div>
              <div className="text-xs">of upstream energy</div>
            </div>
          </div>

          {/* Animated SVG */}
          <svg viewBox={`0 0 ${jumpSvgW} ${jumpSvgH}`} className="w-full h-40 rounded-lg bg-secondary/20 overflow-hidden">
            <defs>
              <linearGradient id="waterGradUp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="waterGradDown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
              </linearGradient>
            </defs>

            {/* Channel bed */}
            <rect x="0" y={bedY} width={jumpSvgW} height="20" fill="hsl(var(--earth-brown))" rx="2" />

            {/* Upstream (supercritical - thin fast) */}
            <rect x="0" y={bedY - y1Px} width="170" height={y1Px} fill="url(#waterGradUp)" />
            <line x1="0" y1={bedY - y1Px} x2="170" y2={bedY - y1Px} stroke="hsl(var(--primary))" strokeWidth="2" />

            {/* Flow arrows upstream */}
            {[0.3, 0.5, 0.7].map((f, i) => {
              const arrowY = bedY - y1Px * f;
              const offset = (animTime * 80 + i * 30) % 120;
              return <polygon key={i} points={`${50 + offset},${arrowY - 3} ${60 + offset},${arrowY} ${50 + offset},${arrowY + 3}`} fill="hsl(var(--primary))" opacity={0.6} />;
            })}

            {/* Transition / roller zone */}
            <path
              d={`M170,${bedY - y1Px} C185,${bedY - y1Px} 195,${bedY - y2Px * 0.8} 210,${bedY - y2Px} L230,${bedY - y2Px} L230,${bedY} L170,${bedY} Z`}
              fill="url(#waterGradDown)"
            />

            {/* Turbulent roller */}
            {Fr > 1 && bubbles.map((b, i) => (
              <circle
                key={i}
                cx={b.cx + Math.sin(animTime * 3 + b.phase) * 8}
                cy={b.cy + Math.cos(animTime * 2.5 + b.phase) * 6}
                r={b.r}
                fill="hsl(var(--primary-foreground))"
                opacity={0.3 + 0.2 * Math.sin(animTime * 4 + b.phase)}
              />
            ))}

            {/* Roller ellipse */}
            {Fr > 1 && (
              <ellipse
                cx={200} cy={bedY - y2Px * 0.6}
                rx={25 + Math.sin(animTime * 2) * 3}
                ry={y2Px * 0.25 + Math.cos(animTime * 1.5) * 2}
                fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeDasharray="4 3" opacity={0.5}
              />
            )}

            {/* Downstream (subcritical - deep slow) */}
            <rect x="230" y={bedY - y2Px} width="270" height={y2Px} fill="url(#waterGradDown)" />
            <line x1="230" y1={bedY - y2Px} x2="500" y2={bedY - y2Px} stroke="hsl(var(--primary))" strokeWidth="2" />

            {/* Flow arrows downstream (slower) */}
            {[0.3, 0.5, 0.7].map((f, i) => {
              const arrowY = bedY - y2Px * f;
              const offset = (animTime * 30 + i * 40) % 200;
              return <polygon key={i} points={`${280 + offset},${arrowY - 2} ${287 + offset},${arrowY} ${280 + offset},${arrowY + 2}`} fill="hsl(var(--accent))" opacity={0.5} />;
            })}

            {/* Labels */}
            <text x="85" y={bedY + 15} textAnchor="middle" fill="hsl(var(--foreground))" fontSize="9" fontFamily="monospace">y₁={currentY.toFixed(1)}m  Fr={Fr.toFixed(1)}</text>
            <text x="380" y={bedY + 15} textAnchor="middle" fill="hsl(var(--foreground))" fontSize="9" fontFamily="monospace">y₂={y2.toFixed(1)}m  Fr={Fr2.toFixed(2)}</text>
            {Fr > 1 && <text x="200" y={bedY - y2Px - 8} textAnchor="middle" fill="hsl(var(--destructive))" fontSize="10" fontWeight="bold">{jumpType} Jump</text>}

            {/* Depth dimension lines */}
            <line x1="10" y1={bedY} x2="10" y2={bedY - y1Px} stroke="hsl(var(--foreground))" strokeWidth="1" markerEnd="url(#arrow)" />
            <line x1="490" y1={bedY} x2="490" y2={bedY - y2Px} stroke="hsl(var(--foreground))" strokeWidth="1" />
          </svg>

          <p className="text-xs text-muted-foreground mt-2 italic text-center">
            ΔE = (y₂ − y₁)³ / (4y₁y₂) — Energy dissipated in the hydraulic jump. Drag y₁ slider to explore different jump regimes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpecificEnergyMomentum;
