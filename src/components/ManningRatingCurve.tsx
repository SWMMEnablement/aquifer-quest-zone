import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { onClose: () => void; }

type CrossSection = "rectangular" | "trapezoidal" | "triangular" | "circular";

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
    case "circular": {
      const r = diameter / 2;
      const y = Math.min(depth, diameter);
      const theta = 2 * Math.acos((r - y) / r);
      A = r * r * (theta - Math.sin(theta)) / 2;
      P = r * theta;
      T = 2 * Math.sqrt(2 * r * y - y * y); break;
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

  const ratingData = useMemo(() => {
    const data = [];
    const maxD = shape === "circular" ? diameter : 6;
    for (let y = 0.1; y <= maxD; y += 0.1) {
      const { A, P, R, T, D } = computeGeometry(shape, y, width, sideSlope, diameter);
      if (A <= 0 || P <= 0) continue;
      const V = (1 / manningN) * Math.pow(R, 2 / 3) * Math.pow(slope, 0.5);
      const Q = A * V;
      const Fr = D > 0 ? V / Math.sqrt(9.81 * D) : 0;
      data.push({ y: +y.toFixed(2), A: +A.toFixed(2), P: +P.toFixed(2), R: +R.toFixed(3), V: +V.toFixed(3), Q: +Q.toFixed(2), Fr: +Fr.toFixed(3) });
    }
    return data;
  }, [shape, width, sideSlope, diameter, manningN, slope]);

  const current = useMemo(() => {
    const { A, P, R, T, D } = computeGeometry(shape, currentDepth, width, sideSlope, diameter);
    const V = A > 0 && P > 0 ? (1 / manningN) * Math.pow(R, 2 / 3) * Math.pow(slope, 0.5) : 0;
    const Q = A * V;
    const Fr = D > 0 ? V / Math.sqrt(9.81 * D) : 0;
    const yc = shape === "rectangular" ? Math.pow(Q * Q / (9.81 * width * width), 1 / 3) : 0;
    return { A: +A.toFixed(2), P: +P.toFixed(2), R: +R.toFixed(3), V: +V.toFixed(3), Q: +Q.toFixed(2), Fr: +Fr.toFixed(3), yc: +yc.toFixed(3) };
  }, [shape, currentDepth, width, sideSlope, diameter, manningN, slope]);

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
      case "circular":
        for (let a = 0; a <= Math.PI; a += 0.1) {
          pts.push({ x: (diameter / 2) * Math.cos(a), y: diameter - (diameter / 2) * Math.sin(a) });
        }
        break;
    }
    return pts;
  }, [shape, width, sideSlope, diameter, currentDepth]);

  const svgW = 300, svgH = 200;
  const xRange = crossSectionPoints.length > 0 ? Math.max(...crossSectionPoints.map(p => Math.abs(p.x))) * 1.2 : 10;
  const yRange = (shape === "circular" ? diameter : currentDepth + 1) * 1.1;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={onClose} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">Manning's Rating Curve Builder</h1>
      <p className="text-muted-foreground mb-6">Interactive cross-section editor with live Q-y rating curve.
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
                  <SelectItem value="circular">Circular</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(shape === "rectangular" || shape === "trapezoidal") && (
              <div><Label>Bottom Width: {width} m</Label><Slider min={1} max={50} step={0.5} value={[width]} onValueChange={([v]) => setWidth(v)} /></div>
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
                <span className="text-muted-foreground">Velocity V:</span><span className="font-mono">{current.V} m/s</span>
                <span className="text-muted-foreground">Discharge Q:</span><span className="font-mono font-bold">{current.Q} m³/s</span>
                <span className="text-muted-foreground">Froude Fr:</span>
                <span className={`font-mono ${current.Fr > 1 ? 'text-destructive font-bold' : ''}`}>{current.Fr}</span>
              </div>
            </CardContent></Card>
          </CardContent>
        </Card>

        {/* Cross-section SVG */}
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Cross-Section</CardTitle></CardHeader>
          <CardContent>
            <svg viewBox={`${-xRange} 0 ${xRange * 2} ${yRange}`} className="w-full h-48 border rounded bg-secondary/20" style={{ transform: "scaleY(-1)" }}>
              {/* Channel boundary */}
              <polyline points={crossSectionPoints.map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke="hsl(var(--foreground))" strokeWidth={yRange * 0.02} />
              {/* Water */}
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
            </svg>
            <p className="text-xs text-muted-foreground text-center mt-2">Blue = wetted area, dashed = water surface at y = {currentDepth.toFixed(1)} m</p>
          </CardContent>
        </Card>

        {/* Rating Curve */}
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Rating Curve Q vs y</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={ratingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="Q" label={{ value: "Q (m³/s)", position: "bottom", offset: -5 }} tick={{ fontSize: 10 }} />
                <YAxis dataKey="y" label={{ value: "y (m)", angle: -90, position: "insideLeft" }} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => v.toFixed(2)} />
                <Line type="monotone" dataKey="y" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
                <ReferenceLine y={currentDepth} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: `y=${currentDepth}`, fill: "hsl(var(--destructive))" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="card-water mt-6">
        <CardHeader><CardTitle className="text-lg">Rating Table</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              {["y (m)", "A (m²)", "P (m)", "R (m)", "V (m/s)", "Q (m³/s)", "Fr"].map(h => (
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
