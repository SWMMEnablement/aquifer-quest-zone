import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { onClose: () => void; }
const g = 9.81;

const CulvertAnalyzer = ({ onClose }: Props) => {
  const [diameter, setDiameter] = useState(1.5);
  const [length, setLength] = useState(30);
  const [slope, setSlope] = useState(0.01);
  const [manningN, setManningN] = useState(0.013);
  const [HW, setHW] = useState(2.5);
  const [TW, setTW] = useState(0.5);

  const A = Math.PI * diameter * diameter / 4;
  const Qfull = (1 / manningN) * A * Math.pow(diameter / 4, 2 / 3) * Math.pow(slope, 0.5);

  // Inlet control (unsubmerged): weir flow
  const Cd_inlet = 0.62;
  const Q_inlet = HW > diameter
    ? Cd_inlet * A * Math.sqrt(2 * g * (HW - diameter / 2)) // submerged orifice
    : Cd_inlet * diameter * Math.pow(HW, 1.5) * 1.5; // weir

  // Outlet control
  const Q_outlet = Math.min(Qfull, A * Math.sqrt(2 * g * Math.max(0, HW - TW) / (1 + 29 * manningN * manningN * length / Math.pow(diameter / 4, 4 / 3))));

  const Q = Math.min(Q_inlet, Q_outlet);
  const controlType = Q_inlet < Q_outlet ? "Inlet Control" : "Outlet Control";
  const flowDesc = HW > diameter * 1.2
    ? (TW > diameter ? "Submerged both ends" : "Inlet submerged")
    : (TW > diameter * 0.8 ? "Outlet submerged" : "Free flow");

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={onClose} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">Culvert Hydraulic Analyzer</h1>
      <p className="text-muted-foreground mb-6">Determine flow control type and discharge capacity.
        <a href="https://ponce.sdsu.edu/" target="_blank" rel="noopener noreferrer" className="text-primary ml-2 inline-flex items-center gap-1">Ponce Reference <ExternalLink className="w-3 h-3" /></a>
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Culvert Properties</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Diameter: {diameter} m</Label><Slider min={0.3} max={5} step={0.1} value={[diameter]} onValueChange={([v]) => setDiameter(v)} /></div>
            <div><Label>Length: {length} m</Label><Slider min={5} max={100} step={1} value={[length]} onValueChange={([v]) => setLength(v)} /></div>
            <div><Label>Slope: {slope.toFixed(3)}</Label><Slider min={0.001} max={0.05} step={0.001} value={[slope]} onValueChange={([v]) => setSlope(v)} /></div>
            <div><Label>Manning's n: {manningN.toFixed(3)}</Label><Slider min={0.01} max={0.03} step={0.001} value={[manningN]} onValueChange={([v]) => setManningN(v)} /></div>
            <div><Label>Headwater HW: {HW} m</Label><Slider min={0.1} max={diameter * 3} step={0.1} value={[HW]} onValueChange={([v]) => setHW(v)} /></div>
            <div><Label>Tailwater TW: {TW} m</Label><Slider min={0} max={diameter * 2} step={0.1} value={[TW]} onValueChange={([v]) => setTW(v)} /></div>
          </CardContent>
        </Card>
        <Card className="card-water lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Flow Analysis</CardTitle></CardHeader>
          <CardContent>
            <svg viewBox="0 0 500 200" className="w-full h-40 rounded bg-secondary/20 mb-4">
              {/* Ground */}
              <rect x="0" y="140" width="500" height="60" fill="hsl(var(--earth-brown) / 0.3)" />
              {/* Culvert barrel */}
              <rect x="150" y={140 - diameter * 25} width="200" height={diameter * 25} fill="hsl(var(--muted))" stroke="hsl(var(--foreground))" strokeWidth="2" rx="3" />
              {/* Upstream water */}
              <rect x="0" y={140 - Math.min(HW, diameter * 3) * 25} width="150" height={Math.min(HW, diameter * 3) * 25} fill="hsl(var(--primary) / 0.3)" />
              <line x1="0" y1={140 - Math.min(HW, diameter * 3) * 25} x2="150" y2={140 - Math.min(HW, diameter * 3) * 25} stroke="hsl(var(--primary))" strokeWidth="2" />
              {/* Downstream water */}
              <rect x="350" y={140 - TW * 25} width="150" height={TW * 25} fill="hsl(var(--primary) / 0.2)" />
              <line x1="350" y1={140 - TW * 25} x2="500" y2={140 - TW * 25} stroke="hsl(var(--primary))" strokeWidth="1.5" />
              {/* Labels */}
              <text x="75" y={140 - Math.min(HW, diameter * 3) * 25 - 5} textAnchor="middle" fontSize="10" fill="hsl(var(--primary))">HW={HW.toFixed(1)}m</text>
              <text x="425" y={140 - TW * 25 - 5} textAnchor="middle" fontSize="10" fill="hsl(var(--primary))">TW={TW.toFixed(1)}m</text>
            </svg>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary/10 rounded-lg p-3 text-center">
                <div className="text-sm text-muted-foreground">Discharge Q</div>
                <div className="font-mono text-2xl font-bold text-primary">{Q.toFixed(2)} m³/s</div>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <div className="text-sm text-muted-foreground">Control Type</div>
                <div className="font-mono text-lg font-bold">{controlType}</div>
                <div className="text-xs text-muted-foreground">{flowDesc}</div>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <div className="text-sm text-muted-foreground">Q inlet control</div>
                <div className="font-mono">{Q_inlet.toFixed(2)} m³/s</div>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <div className="text-sm text-muted-foreground">Q outlet control</div>
                <div className="font-mono">{Q_outlet.toFixed(2)} m³/s</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CulvertAnalyzer;
