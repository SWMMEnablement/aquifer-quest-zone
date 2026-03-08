import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { onClose: () => void; }

const g = 9.81;

const SedimentTransportCalculator = ({ onClose }: Props) => {
  const [depth, setDepth] = useState(2);
  const [velocity, setVelocity] = useState(1.5);
  const [slope, setSlope] = useState(0.001);
  const [D50, setD50] = useState(2); // mm
  const [temp, setTemp] = useState(20);

  const D50m = D50 / 1000;
  const rhoS = 2650;
  const rhoW = 1000;
  const nu = 1.3e-6 * Math.pow(20 / temp, 0.5);
  const tau = rhoW * g * depth * slope;
  const tauStar = tau / ((rhoS - rhoW) * g * D50m);
  const ReStar = Math.sqrt(tau / rhoW) * D50m / nu;

  // Transport formulas (simplified, kg/s/m)
  const mpm = useMemo(() => {
    const qs = 8 * Math.pow(Math.max(0, tauStar - 0.047), 1.5) * Math.sqrt((rhoS / rhoW - 1) * g * D50m * D50m * D50m) * rhoS;
    return +qs.toFixed(4);
  }, [tauStar, D50m]);

  const engelundHansen = useMemo(() => {
    const f = 2 * g * depth * slope / (velocity * velocity);
    const qs = 0.05 * rhoS * velocity * velocity * Math.pow(tauStar, 1.5) / (Math.sqrt((rhoS / rhoW - 1) * g * D50m) * f);
    return +(Math.abs(qs) || 0).toFixed(4);
  }, [velocity, depth, slope, tauStar, D50m]);

  const yang = useMemo(() => {
    const Vcr = 2.5 / (Math.log10(ReStar) - 0.06) + 0.66;
    const wFall = Math.sqrt((rhoS / rhoW - 1) * g * D50m * D50m * D50m / (18 * nu));
    const logCt = 5.435 - 0.286 * Math.log10(wFall * D50m / nu) - 0.457 * Math.log10(Math.sqrt(tau / rhoW) / wFall)
      + (1.799 - 0.409 * Math.log10(wFall * D50m / nu) - 0.314 * Math.log10(Math.sqrt(tau / rhoW) / wFall))
      * Math.log10(Math.max(0.01, velocity * slope / wFall - Vcr * slope / wFall));
    return +(Math.pow(10, logCt) * velocity * depth * rhoS / 1e6 || 0).toFixed(4);
  }, [velocity, depth, slope, D50m, ReStar, tau, nu]);

  const compData = [
    { method: "Meyer-Peter-Müller", qs: mpm },
    { method: "Engelund-Hansen", qs: engelundHansen },
    { method: "Yang", qs: yang },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={onClose} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">Sediment Transport Calculator</h1>
      <p className="text-muted-foreground mb-6">Compare transport formulas — they can differ by orders of magnitude.
        <a href="https://ponce.sdsu.edu/" target="_blank" rel="noopener noreferrer" className="text-primary ml-2 inline-flex items-center gap-1">Ponce Reference <ExternalLink className="w-3 h-3" /></a>
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Flow & Sediment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Depth: {depth} m</Label><Slider min={0.5} max={10} step={0.1} value={[depth]} onValueChange={([v]) => setDepth(v)} /></div>
            <div><Label>Velocity: {velocity} m/s</Label><Slider min={0.1} max={5} step={0.1} value={[velocity]} onValueChange={([v]) => setVelocity(v)} /></div>
            <div><Label>Slope: {slope.toFixed(4)}</Label><Slider min={0.0001} max={0.01} step={0.0001} value={[slope]} onValueChange={([v]) => setSlope(v)} /></div>
            <div><Label>D₅₀: {D50} mm</Label><Slider min={0.1} max={100} step={0.1} value={[D50]} onValueChange={([v]) => setD50(v)} /></div>
            <Card className="bg-secondary/50 border-0"><CardContent className="p-3 text-sm space-y-1">
              <div>Bed shear τ = {tau.toFixed(2)} Pa</div>
              <div>Shields τ* = {tauStar.toFixed(4)}</div>
              <div>Motion: {tauStar > 0.047 ? "✓ Above threshold" : "✗ Below threshold"}</div>
            </CardContent></Card>
          </CardContent>
        </Card>
        <Card className="card-water lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Formula Comparison</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={compData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="method" tick={{ fontSize: 9 }} />
                <YAxis label={{ value: "qs (kg/s/m)", angle: -90, position: "insideLeft" }} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="qs" fill="hsl(var(--earth-brown))" name="Transport rate" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2 italic">⚠ Methods can differ by 10× or more — this is a fundamental challenge in sediment transport prediction.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SedimentTransportCalculator;
