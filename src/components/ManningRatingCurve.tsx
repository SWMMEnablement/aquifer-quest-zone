import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { onClose: () => void; }

type CrossSection = "rectangular" | "trapezoidal" | "triangular" | "circular" | "parabolic";

const computeGeometry = (shape: CrossSection, depth: number, width: number, sideSlope: number, diameter: number) => {
  let A = 0, P = 0, T = 0;
  switch (shape) {
    case "rectangular":
      A = width * depth; P = width + 2 * depth; T = width; break;
    case "trapezoidal":
      A = (width + sideSlope * depth) * depth;
      P = width + 2 * depth * Math.sqrt(1 + sideSlope * sideSlope);
      T = width + 2 * sideSlope * depth; break;
    case "triangular":
      A = sideSlope * depth * depth;
      P = 2 * depth * Math.sqrt(1 + sideSlope * sideSlope);
      T = 2 * sideSlope * depth; break;
    case "parabolic": {
      // Parabolic: y = (x/T_f)^2 * d_f where T_f = width (top width at full depth)
      const Tf = width;
      A = (2 / 3) * Tf * depth;
      P = Tf + (8 * depth * depth) / (3 * Tf); // approximate
      T = Tf * Math.sqrt(depth / Math.max(depth, 0.01));
      if (T < 0.01) T = 0.01;
      break;
    }
    case "circular": {
      const r = diameter / 2;
      const y = Math.min(depth, diameter);
      const theta = 2 * Math.acos(Math.max(-1, Math.min(1, (r - y) / r)));
      A = r * r * (theta - Math.sin(theta)) / 2;
      P = r * theta;
      T = 2 * Math.sqrt(Math.max(0, 2 * r * y - y * y)); break;
    }
  }
  const R = P > 0 ? A / P : 0;
  const D = T > 0 ? A / T : 0;
  return { A, P, R, T, D };
};

const ManningRatingCurve = ({ onClose }: Props) => {
  const [shape, setShape] = useState<CrossSection>("trapezoidal");
  const [width, setWidth] = useState(10);
  const [sideSlope, setSideSlope] = useState(2);
  const [diameter, setDiameter] = useState(3);
  const [manningN, setManningN] = useState(0.03);
  const [slope, setSlope] = useState(0.001);
  const [currentDepth, setCurrentDepth] = useState(2);
  const [chartMode, setChartMode] = useState("rating");

  const ratingData = useMemo(() => {
    const data = [];
    const maxD = shape === "circular" ? diameter : 6;
    for (let y = 0.1; y <= maxD; y += 0.1) {
      const { A, P, R, T, D } = computeGeometry(shape, y, width, sideSlope, diameter);
      if (A <= 0 || P <= 0) continue;
      const V = (1 / manningN) * Math.pow(R, 2 / 3) * Math.pow(slope, 0.5);
      const Q = A * V;
      const Fr = D > 0 ? V / Math.sqrt(9.81 * D) : 0;
      const E = y + V * V / (2 * 9.81);
      data.push({ y: +y.toFixed(2), A: +A.toFixed(2), P: +P.toFixed(2), R: +R.toFixed(3), V: +V.toFixed(3), Q: +Q.toFixed(2), Fr: +Fr.toFixed(3), E: +E.toFixed(3) });
    }
    return data;
  }, [shape, width, sideSlope, diameter, manningN, slope]);

  const current = useMemo(() => {
    const { A, P, R, T, D } = computeGeometry(shape, currentDepth, width, sideSlope, diameter);
    const V = A > 0 && P > 0 ? (1 / manningN) * Math.pow(R, 2 / 3) * Math.pow(slope, 0.5) : 0;
    const Q = A * V;
    const Fr = D > 0 ? V / Math.sqrt(9.81 * D) : 0;
    const E = currentDepth + V * V / (2 * 9.81);
    // Critical depth (iterative for non-rectangular)
    let yc = 0;
    if (shape === "rectangular") {
      yc = Math.pow(Q * Q / (9.81 * width * width), 1 / 3);
    } else {
      // Bisection for critical depth where Fr=1
      let lo = 0.01, hi = shape === "circular" ? diameter : 10;
      for (let iter = 0; iter < 50; iter++) {
        const mid = (lo + hi) / 2;
        const g = computeGeometry(shape, mid, width, sideSlope, diameter);
        const Vc = g.A > 0 ? Q / g.A : 0;
        const Dc = g.T > 0 ? g.A / g.T : 0;
        const FrC = Dc > 0 ? Vc / Math.sqrt(9.81 * Dc) : 0;
        if (FrC > 1) lo = mid; else hi = mid;
      }
      yc = (lo + hi) / 2;
    }
    return { A: +A.toFixed(2), P: +P.toFixed(2), R: +R.toFixed(3), V: +V.toFixed(3), Q: +Q.toFixed(2), Fr: +Fr.toFixed(3), yc: +yc.toFixed(3), E: +E.toFixed(3), T: +T.toFixed(2), D: +D.toFixed(3) };
  }, [shape, currentDepth, width, sideSlope, diameter, manningN, slope]);

  // Cross-section SVG points
  const crossSectionPoints = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    const maxY = shape === "circular" ? diameter : currentDepth + 1;
    switch (shape) {
      case "rectangular":
        pts.push({ x: -width / 2, y: 0 }, { x: -width / 2, y: maxY }, { x: width / 2, y: maxY }, { x: width / 2, y: 0 });
        break;
      case "trapezoidal":
        pts.push({ x: -width / 2 - sideSlope * maxY, y: maxY }, { x: -width / 2, y: 0 }, { x: width / 2, y: 0 }, { x: width / 2 + sideSlope * maxY, y: maxY });
        break;
      case "triangular":
        pts.push({ x: -sideSlope * maxY, y: maxY }, { x: 0, y: 0 }, { x: sideSlope * maxY, y: maxY });
        break;
      case "parabolic": {
        const Tf = width;
        for (let t = -1; t <= 1; t += 0.05) {
          pts.push({ x: t * Tf / 2, y: t * t * maxY });
        }
        break;
      }
      case "circular":
        for (let a = 0; a <= Math.PI; a += 0.05) {
          pts.push({ x: (diameter / 2) * Math.cos(a), y: diameter - (diameter / 2) * Math.sin(a) });
        }
        break;
    }
    return pts;
  }, [shape, width, sideSlope, diameter, currentDepth]);

  const svgW = 300, svgH = 200;
  const xRange = crossSectionPoints.length > 0 ? Math.max(...crossSectionPoints.map(p => Math.abs(p.x))) * 1.2 : 10;
  const yRange = (shape === "circular" ? diameter : currentDepth + 1) * 1.1;

  // Wetted perimeter points
  const wettedPoints = useMemo(() => {
    return crossSectionPoints.filter(p => p.y <= currentDepth);
  }, [crossSectionPoints, currentDepth]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={onClose} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">Manning's Rating Curve Builder</h1>
      <p className="text-muted-foreground mb-6">Interactive cross-section editor with live Q-y, V-y, and Fr-y rating curves.
        <a href="https://ponce.sdsu.edu/onlinemanningscalculator.html" target="_blank" rel="noopener noreferrer" className="text-primary ml-2 inline-flex items-center gap-1">Ponce Reference <ExternalLink className="w-3 h-3" /></a>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Channel Properties</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Cross-Section Shape</Label>
              <Select value={shape} onValueChange={(v) => setShape(v as CrossSection)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rectangular">Rectangular</SelectItem>
                  <SelectItem value="trapezoidal">Trapezoidal</SelectItem>
                  <SelectItem value="triangular">Triangular</SelectItem>
                  <SelectItem value="parabolic">Parabolic</SelectItem>
                  <SelectItem value="circular">Circular</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(shape === "rectangular" || shape === "trapezoidal" || shape === "parabolic") && (
              <div><Label>{shape === "parabolic" ? "Top Width" : "Bottom Width"}: {width} m</Label><Slider min={1} max={50} step={0.5} value={[width]} onValueChange={([v]) => setWidth(v)} /></div>
            )}
            {(shape === "trapezoidal" || shape === "triangular") && (
              <div><Label>Side Slope z: {sideSlope}:1</Label><Slider min={0.5} max={5} step={0.25} value={[sideSlope]} onValueChange={([v]) => setSideSlope(v)} /></div>
            )}
            {shape === "circular" && (
              <div><Label>Diameter: {diameter} m</Label><Slider min={0.5} max={10} step={0.1} value={[diameter]} onValueChange={([v]) => setDiameter(v)} /></div>
            )}
            <div><Label>Manning's n: {manningN.toFixed(3)}</Label><Slider min={0.01} max={0.15} step={0.001} value={[manningN]} onValueChange={([v]) => setManningN(v)} /></div>
            <div><Label>Slope S₀: {slope.toFixed(4)}</Label><Slider min={0.0001} max={0.05} step={0.0001} value={[slope]} onValueChange={([v]) => setSlope(v)} /></div>
            <div><Label>Current Depth y: {currentDepth.toFixed(1)} m</Label><Slider min={0.1} max={shape === "circular" ? diameter : 6} step={0.1} value={[currentDepth]} onValueChange={([v]) => setCurrentDepth(v)} /></div>

            <Card className="bg-secondary/50 border-0"><CardContent className="p-3 text-sm space-y-1">
              <div className="grid grid-cols-2 gap-1">
                <span className="text-muted-foreground">Area A:</span><span className="font-mono">{current.A} m²</span>
                <span className="text-muted-foreground">Perimeter P:</span><span className="font-mono">{current.P} m</span>
                <span className="text-muted-foreground">Hyd. Radius R:</span><span className="font-mono">{current.R} m</span>
                <span className="text-muted-foreground">Top Width T:</span><span className="font-mono">{current.T} m</span>
                <span className="text-muted-foreground">Hyd. Depth D:</span><span className="font-mono">{current.D} m</span>
                <span className="text-muted-foreground">Velocity V:</span><span className="font-mono">{current.V} m/s</span>
                <span className="text-muted-foreground">Discharge Q:</span><span className="font-mono font-bold">{current.Q} m³/s</span>
                <span className="text-muted-foreground">Froude Fr:</span>
                <span className={`font-mono ${parseFloat(current.Fr) > 1 ? 'text-destructive font-bold' : ''}`}>{current.Fr}</span>
                <span className="text-muted-foreground">Specific E:</span><span className="font-mono">{current.E} m</span>
                <span className="text-muted-foreground">Critical y<sub>c</sub>:</span><span className="font-mono text-accent">{current.yc} m</span>
              </div>
            </CardContent></Card>
          </CardContent>
        </Card>

        {/* Cross-section SVG */}
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Cross-Section View</CardTitle></CardHeader>
          <CardContent>
            <svg viewBox={`${-xRange} 0 ${xRange * 2} ${yRange}`} className="w-full h-52 border rounded bg-secondary/20" style={{ transform: "scaleY(-1)" }}>
              {/* Channel boundary */}
              <polyline points={crossSectionPoints.map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke="hsl(var(--foreground))" strokeWidth={yRange * 0.02} />
              {/* Wetted perimeter highlight */}
              {wettedPoints.length > 1 && (
                <polyline points={wettedPoints.map(p => `${p.x},${Math.min(p.y, currentDepth)}`).join(" ")} fill="none" stroke="hsl(var(--destructive))" strokeWidth={yRange * 0.025} />
              )}
              {/* Water fill */}
              {crossSectionPoints.length > 0 && (
                <polygon
                  points={[
                    ...crossSectionPoints.filter(p => p.y <= currentDepth).map(p => `${p.x},${Math.min(p.y, currentDepth)}`),
                    `${crossSectionPoints[crossSectionPoints.length - 1].x},${currentDepth}`,
                    `${crossSectionPoints[0].x},${currentDepth}`
                  ].join(" ")}
                  fill="hsl(var(--primary) / 0.3)" stroke="hsl(var(--primary))" strokeWidth={yRange * 0.01}
                />
              )}
              {/* Water surface line */}
              <line x1={-xRange} y1={currentDepth} x2={xRange} y2={currentDepth} stroke="hsl(var(--primary))" strokeWidth={yRange * 0.015} strokeDasharray={`${yRange * 0.04} ${yRange * 0.02}`} />
              {/* Critical depth line */}
              {parseFloat(current.yc) > 0 && (
                <line x1={-xRange} y1={parseFloat(current.yc)} x2={xRange} y2={parseFloat(current.yc)} stroke="hsl(var(--accent))" strokeWidth={yRange * 0.01} strokeDasharray={`${yRange * 0.03} ${yRange * 0.02}`} />
              )}
            </svg>
            <div className="flex gap-4 text-xs text-muted-foreground mt-2 justify-center">
              <span><span className="inline-block w-3 h-0.5 bg-primary mr-1 align-middle" />Water surface</span>
              <span><span className="inline-block w-3 h-0.5 bg-destructive mr-1 align-middle" />Wetted perimeter</span>
              <span><span className="inline-block w-3 h-0.5 bg-accent mr-1 align-middle" style={{borderTop: "1px dashed"}} />Critical depth</span>
            </div>
          </CardContent>
        </Card>

        {/* Rating Curves with tabs */}
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Rating Curves</CardTitle></CardHeader>
          <CardContent>
            <Tabs value={chartMode} onValueChange={setChartMode} className="mb-2">
              <TabsList className="grid grid-cols-3 h-8">
                <TabsTrigger value="rating" className="text-xs">Q vs y</TabsTrigger>
                <TabsTrigger value="velocity" className="text-xs">V vs y</TabsTrigger>
                <TabsTrigger value="froude" className="text-xs">Fr vs y</TabsTrigger>
              </TabsList>
            </Tabs>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={ratingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                {chartMode === "rating" && (
                  <>
                    <XAxis dataKey="Q" label={{ value: "Q (m³/s)", position: "bottom", offset: -5 }} tick={{ fontSize: 10 }} />
                    <YAxis dataKey="y" label={{ value: "y (m)", angle: -90, position: "insideLeft" }} tick={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="y" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
                  </>
                )}
                {chartMode === "velocity" && (
                  <>
                    <XAxis dataKey="V" label={{ value: "V (m/s)", position: "bottom", offset: -5 }} tick={{ fontSize: 10 }} />
                    <YAxis dataKey="y" label={{ value: "y (m)", angle: -90, position: "insideLeft" }} tick={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="y" stroke="hsl(var(--accent))" dot={false} strokeWidth={2} />
                  </>
                )}
                {chartMode === "froude" && (
                  <>
                    <XAxis dataKey="Fr" label={{ value: "Fr", position: "bottom", offset: -5 }} tick={{ fontSize: 10 }} />
                    <YAxis dataKey="y" label={{ value: "y (m)", angle: -90, position: "insideLeft" }} tick={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="y" stroke="hsl(var(--destructive))" dot={false} strokeWidth={2} />
                    <ReferenceLine x={1} stroke="hsl(var(--accent))" strokeDasharray="5 5" label={{ value: "Fr=1", fill: "hsl(var(--accent))" }} />
                  </>
                )}
                <Tooltip formatter={(v: number) => v.toFixed(3)} />
                <ReferenceLine y={currentDepth} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: `y=${currentDepth}`, fill: "hsl(var(--destructive))", fontSize: 10 }} />
                {parseFloat(current.yc) > 0 && <ReferenceLine y={parseFloat(current.yc)} stroke="hsl(var(--accent))" strokeDasharray="3 3" label={{ value: "yc", fill: "hsl(var(--accent))", fontSize: 10 }} />}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Rating Table */}
      <Card className="card-water mt-6">
        <CardHeader><CardTitle className="text-lg">Rating Table</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              {["y (m)", "A (m²)", "P (m)", "R (m)", "V (m/s)", "Q (m³/s)", "Fr", "E (m)"].map(h => (
                <th key={h} className="px-3 py-2 text-left text-muted-foreground font-medium">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {ratingData.filter((_, i) => i % 5 === 0).map((r, i) => (
                <tr key={i} className={`border-b border-border/50 ${Math.abs(r.y - currentDepth) < 0.2 ? 'bg-primary/10 font-bold' : ''}`}>
                  <td className="px-3 py-1 font-mono">{r.y}</td>
                  <td className="px-3 py-1 font-mono">{r.A}</td>
                  <td className="px-3 py-1 font-mono">{r.P}</td>
                  <td className="px-3 py-1 font-mono">{r.R}</td>
                  <td className="px-3 py-1 font-mono">{r.V}</td>
                  <td className="px-3 py-1 font-mono">{r.Q}</td>
                  <td className={`px-3 py-1 font-mono ${r.Fr > 1 ? 'text-destructive' : ''}`}>{r.Fr}</td>
                  <td className="px-3 py-1 font-mono">{r.E}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManningRatingCurve;
