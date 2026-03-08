import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { onClose: () => void; }

const g = 9.81;

type SlopeCategory = "mild" | "steep" | "critical" | "horizontal" | "adverse";
type BoundaryType = "dam" | "free-overfall" | "gate";

const profileDescriptions: Record<string, string> = {
  M1: "Backwater curve above yn. Caused by dams or raised tailwater. Depth increases upstream.",
  M2: "Drawdown curve between yn and yc. Approaches yc at a break in slope. Depth decreases downstream.",
  M3: "Supercritical flow below yc on mild slope. Occurs below sluice gates.",
  S1: "Backwater curve above yn on steep slope. Rare — caused by submerged outlet.",
  S2: "Drawdown from yn toward yc. Transition zone on steep slopes.",
  S3: "Supercritical flow below yn. Occurs below steeper-to-less-steep transition.",
  C1: "Above critical depth on critical slope. Backwater from downstream.",
  C3: "Below critical depth on critical slope. Flow from gate or steeper slope.",
  H2: "Drawdown toward yc on horizontal bed. Free-surface approaches critical depth.",
  H3: "Supercritical flow on horizontal bed. Occurs below sluice gate.",
  A2: "Drawdown on adverse slope. Flow decelerating uphill.",
  A3: "Supercritical on adverse slope. Below sluice gate going uphill.",
};

const GVFProfileClassifier = ({ onClose }: Props) => {
  const [slopeCategory, setSlopeCategory] = useState<SlopeCategory>("mild");
  const [Q, setQ] = useState(50);
  const [width, setWidth] = useState(10);
  const [manningN, setManningN] = useState(0.03);
  const [slope, setSlope] = useState(0.001);
  const [boundary, setBoundary] = useState<BoundaryType>("dam");

  const yn = useMemo(() => {
    // Normal depth by iteration (rectangular)
    if (slope <= 0) return Infinity;
    for (let y = 0.01; y < 20; y += 0.01) {
      const A = width * y;
      const P = width + 2 * y;
      const R = A / P;
      const Qn = (1 / manningN) * A * Math.pow(R, 2 / 3) * Math.pow(slope, 0.5);
      if (Qn >= Q) return +y.toFixed(3);
    }
    return 20;
  }, [Q, width, manningN, slope]);

  const yc = useMemo(() => Math.pow(Q * Q / (g * width * width), 1 / 3), [Q, width]);

  const slopeType = useMemo(() => {
    if (slope <= 0) return slopeCategory === "adverse" ? "Adverse" : "Horizontal";
    if (Math.abs(yn - yc) < 0.05) return "Critical";
    return yn > yc ? "Mild" : "Steep";
  }, [yn, yc, slope, slopeCategory]);

  const profiles = useMemo(() => {
    const list: string[] = [];
    switch (slopeType) {
      case "Mild": list.push("M1", "M2", "M3"); break;
      case "Steep": list.push("S1", "S2", "S3"); break;
      case "Critical": list.push("C1", "C3"); break;
      case "Horizontal": list.push("H2", "H3"); break;
      case "Adverse": list.push("A2", "A3"); break;
    }
    return list;
  }, [slopeType]);

  // Determine active profile based on boundary
  const activeProfile = useMemo(() => {
    if (slopeType === "Mild") {
      if (boundary === "dam") return "M1";
      if (boundary === "free-overfall") return "M2";
      if (boundary === "gate") return "M3";
    }
    if (slopeType === "Steep") {
      if (boundary === "dam") return "S1";
      if (boundary === "free-overfall") return "S2";
      if (boundary === "gate") return "S3";
    }
    return profiles[0];
  }, [slopeType, boundary, profiles]);

  // Generate profile shape
  const profileShape = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    const L = 500; // reach length
    for (let i = 0; i <= 20; i++) {
      const x = (i / 20) * L;
      let y = yn;
      const frac = i / 20;
      switch (activeProfile) {
        case "M1": y = yn + (yn * 0.6) * (1 - frac); break;
        case "M2": y = yn - (yn - yc) * frac * 0.8; break;
        case "M3": y = yc * 0.4 + yc * 0.3 * frac; break;
        case "S1": y = yn + (yn * 0.8) * (1 - frac); break;
        case "S2": y = yc - (yc - yn) * frac * 0.7; break;
        case "S3": y = yn * 0.5 + yn * 0.3 * frac; break;
        default: y = yn + (yc - yn) * Math.sin(frac * Math.PI / 2); break;
      }
      pts.push({ x, y: Math.max(0.05, y) });
    }
    return pts;
  }, [activeProfile, yn, yc]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={onClose} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">GVF Profile Classifier</h1>
      <p className="text-muted-foreground mb-6">All 12 water surface profile types with live classification.
        <a href="https://ponce.sdsu.edu/" target="_blank" rel="noopener noreferrer" className="text-primary ml-2 inline-flex items-center gap-1">Ponce Reference <ExternalLink className="w-3 h-3" /></a>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Channel Parameters</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Discharge Q: {Q} m³/s</Label><Slider min={1} max={500} step={1} value={[Q]} onValueChange={([v]) => setQ(v)} /></div>
            <div><Label>Width b: {width} m</Label><Slider min={2} max={50} step={1} value={[width]} onValueChange={([v]) => setWidth(v)} /></div>
            <div><Label>Manning's n: {manningN.toFixed(3)}</Label><Slider min={0.01} max={0.1} step={0.001} value={[manningN]} onValueChange={([v]) => setManningN(v)} /></div>
            <div><Label>Slope S₀: {slope.toFixed(4)}</Label><Slider min={0} max={0.05} step={0.0002} value={[slope]} onValueChange={([v]) => setSlope(v)} /></div>
            <div>
              <Label>Boundary Condition</Label>
              <Select value={boundary} onValueChange={(v) => setBoundary(v as BoundaryType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dam">Dam / Raised Tailwater</SelectItem>
                  <SelectItem value="free-overfall">Free Overfall</SelectItem>
                  <SelectItem value="gate">Sluice Gate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Card className="bg-secondary/50 border-0"><CardContent className="p-3 text-sm space-y-1">
              <div>Normal depth y<sub>n</sub> = <span className="font-mono font-bold">{yn === Infinity ? "∞" : yn.toFixed(3)} m</span></div>
              <div>Critical depth y<sub>c</sub> = <span className="font-mono font-bold">{yc.toFixed(3)} m</span></div>
              <div>Slope type: <span className="font-mono font-bold">{slopeType}</span></div>
              <div>Active profile: <span className="font-mono font-bold text-primary text-lg">{activeProfile}</span></div>
            </CardContent></Card>
          </CardContent>
        </Card>

        {/* Profile visualization */}
        <Card className="card-water lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Water Surface Profile — {activeProfile}</CardTitle></CardHeader>
          <CardContent>
            <svg viewBox="0 0 520 200" className="w-full h-56 rounded bg-secondary/20">
              {/* Bed */}
              <line x1="10" y1={180 - slope * 500 * 100} x2="510" y2="180" stroke="hsl(var(--earth-brown))" strokeWidth="3" />
              {/* yn line */}
              <line x1="10" y1={180 - slope * 500 * 100 - yn * 20} x2="510" y2={180 - yn * 20} stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="8 4" />
              <text x="512" y={180 - yn * 20} fontSize="9" fill="hsl(var(--primary))">yn</text>
              {/* yc line */}
              <line x1="10" y1={180 - slope * 500 * 100 - yc * 20} x2="510" y2={180 - yc * 20} stroke="hsl(var(--destructive))" strokeWidth="1" strokeDasharray="4 4" />
              <text x="512" y={180 - yc * 20} fontSize="9" fill="hsl(var(--destructive))">yc</text>
              {/* Water surface profile */}
              <polyline
                points={profileShape.map((p, i) => `${10 + i * 25},${180 - (slope * (500 - p.x) * 100 + p.y * 20)}`).join(" ")}
                fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5"
              />
              {/* Flow arrows */}
              <polygon points="480,170 495,175 480,180" fill="hsl(var(--primary))" opacity="0.5" />
              <text x="260" y="15" textAnchor="middle" fontSize="14" fontWeight="bold" fill="hsl(var(--foreground))">{activeProfile}</text>
            </svg>
            <p className="text-sm text-muted-foreground mt-3">{profileDescriptions[activeProfile] || ""}</p>
          </CardContent>
        </Card>
      </div>

      {/* Profile gallery */}
      <Card className="card-water mt-6">
        <CardHeader><CardTitle className="text-lg">All Profile Types</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(profileDescriptions).map(([name, desc]) => (
              <div key={name} className={`p-3 rounded-lg border text-sm ${name === activeProfile ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'}`}>
                <div className="font-mono font-bold text-lg mb-1">{name}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">{desc.split(".")[0]}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GVFProfileClassifier;
