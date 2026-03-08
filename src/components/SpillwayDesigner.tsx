import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { onClose: () => void; }

const SpillwayDesigner = ({ onClose }: Props) => {
  const [Hd, setHd] = useState(5);
  const [crestLength, setCrestLength] = useState(50);
  const [spillwayHeight, setSpillwayHeight] = useState(15);

  const Cd = 2.2 * Math.pow(1, 0.006); // discharge coefficient
  const Q = Cd * crestLength * Math.pow(Hd, 1.5);

  const ratingData = useMemo(() => {
    const pts = [];
    for (let h = 0; h <= Hd * 2; h += 0.2) {
      pts.push({ H: +h.toFixed(1), Q: +(Cd * crestLength * Math.pow(h, 1.5)).toFixed(0) });
    }
    return pts;
  }, [Cd, crestLength, Hd]);

  // WES profile points
  const profilePts = useMemo(() => {
    const pts: string[] = [];
    // Upstream quadrant
    for (let x = -Hd * 0.5; x <= 0; x += 0.1) {
      const y = spillwayHeight + Hd * 0.04 * Math.pow(x / Hd, 2);
      pts.push(`${200 + x * 8},${200 - y * 3}`);
    }
    // Crest
    pts.push(`${200},${200 - (spillwayHeight + 0) * 3}`);
    // Downstream face: X^1.85 = 2*Hd^0.85 * Y
    for (let X = 0.1; X <= Hd * 3; X += 0.2) {
      const Y = Math.pow(X, 1.85) / (2 * Math.pow(Hd, 0.85));
      pts.push(`${200 + X * 8},${200 - (spillwayHeight - Y) * 3}`);
      if (spillwayHeight - Y <= 0) break;
    }
    return pts.join(" ");
  }, [Hd, spillwayHeight]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={onClose} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">WES Spillway Designer</h1>
      <p className="text-muted-foreground mb-6">Ogee spillway profile and rating curve.
        <a href="https://ponce.sdsu.edu/" target="_blank" rel="noopener noreferrer" className="text-primary ml-2 inline-flex items-center gap-1">Ponce Reference <ExternalLink className="w-3 h-3" /></a>
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Parameters</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Design Head Hd: {Hd} m</Label><Slider min={1} max={20} step={0.5} value={[Hd]} onValueChange={([v]) => setHd(v)} /></div>
            <div><Label>Crest Length L: {crestLength} m</Label><Slider min={10} max={200} step={5} value={[crestLength]} onValueChange={([v]) => setCrestLength(v)} /></div>
            <div><Label>Spillway Height P: {spillwayHeight} m</Label><Slider min={5} max={50} step={1} value={[spillwayHeight]} onValueChange={([v]) => setSpillwayHeight(v)} /></div>
            <Card className="bg-primary/10 border-primary/30"><CardContent className="p-3 text-center">
              <div className="text-sm text-muted-foreground">Design Discharge</div>
              <div className="font-mono text-2xl font-bold text-primary">{Q.toFixed(0)} m³/s</div>
              <div className="text-xs">Cd = {Cd.toFixed(2)}</div>
            </CardContent></Card>
          </CardContent>
        </Card>
        <Card className="card-water lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Spillway Profile</CardTitle></CardHeader>
          <CardContent>
            <svg viewBox="0 0 500 250" className="w-full h-48 rounded bg-secondary/20">
              <rect x="0" y="200" width="500" height="50" fill="hsl(var(--earth-brown) / 0.3)" />
              <polyline points={profilePts} fill="hsl(var(--muted) / 0.5)" stroke="hsl(var(--foreground))" strokeWidth="2" />
              {/* Water upstream */}
              <rect x="0" y={200 - (spillwayHeight + Hd) * 3} width="200" height={(spillwayHeight + Hd) * 3} fill="hsl(var(--primary) / 0.2)" />
              <line x1="0" y1={200 - (spillwayHeight + Hd) * 3} x2="200" y2={200 - (spillwayHeight + Hd) * 3} stroke="hsl(var(--primary))" strokeWidth="1.5" />
              <text x="100" y={200 - (spillwayHeight + Hd) * 3 - 5} textAnchor="middle" fontSize="9" fill="hsl(var(--primary))">HW = {(spillwayHeight + Hd).toFixed(1)} m</text>
            </svg>
            <div className="text-xs text-muted-foreground text-center mt-1">WES standard ogee profile: X^1.85 = 2·Hd^0.85·Y</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SpillwayDesigner;
