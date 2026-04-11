import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from "recharts";
import { computeRecharge, generateRechargeSensitivity } from "@/lib/hydrology/groundwater";

interface GWRechargeCalculatorProps {
  onClose: () => void;
}

const LAND_COVERS: Record<string, { name: string; interception: number; etFactor: number }> = {
  forest: { name: "Forest", interception: 0.25, etFactor: 1.0 },
  grassland: { name: "Grassland", interception: 0.10, etFactor: 0.85 },
  cropland: { name: "Cropland", interception: 0.05, etFactor: 0.90 },
  urban: { name: "Urban", interception: 0.02, etFactor: 0.30 },
  bare: { name: "Bare Soil", interception: 0.0, etFactor: 0.50 },
};

const SOIL_TYPES: Record<string, { name: string; infiltCapacity: number; fieldCapacity: number }> = {
  A: { name: "Sand (Group A)", infiltCapacity: 0.85, fieldCapacity: 0.10 },
  B: { name: "Sandy Loam (Group B)", infiltCapacity: 0.65, fieldCapacity: 0.20 },
  C: { name: "Clay Loam (Group C)", infiltCapacity: 0.40, fieldCapacity: 0.30 },
  D: { name: "Clay (Group D)", infiltCapacity: 0.20, fieldCapacity: 0.40 },
};

const GWRechargeCalculator = ({ onClose }: GWRechargeCalculatorProps) => {
  const [P, setP] = useState([800]);
  const [T, setT] = useState([18]);
  const [landCover, setLandCover] = useState("grassland");
  const [soilType, setSoilType] = useState("B");

  const lc = LAND_COVERS[landCover];
  const soil = SOIL_TYPES[soilType];

  const results = useMemo(() =>
    computeRecharge(P[0], T[0], lc, soil),
    [P, T, landCover, soilType, lc, soil]);

  const sensitivityData = useMemo(() =>
    generateRechargeSensitivity(T[0], lc, soil),
    [T, landCover, soilType, lc, soil]);

  // Water balance arrows
  const total = results.precipitation || 1;
  const pcts = {
    inter: (results.interception / total) * 100,
    et: (results.AET / total) * 100,
    runoff: (results.surfaceRunoff / total) * 100,
    recharge: (results.recharge / total) * 100,
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={onClose}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Groundwater Recharge Calculator</h1>
            <p className="text-muted-foreground mt-1">Catchment wetting method for estimating annual recharge</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inputs */}
          <Card className="p-6 shadow-card">
            <h2 className="font-semibold text-lg mb-6 text-foreground">Input Parameters</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Precipitation P: <span className="text-primary font-bold">{P[0]} mm/yr</span></label>
                <Slider value={P} onValueChange={setP} min={100} max={3000} step={50} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Mean Temperature: <span className="text-primary font-bold">{T[0]}°C</span></label>
                <Slider value={T} onValueChange={setT} min={5} max={35} step={1} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Land Cover</label>
                <Select value={landCover} onValueChange={setLandCover}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(LAND_COVERS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Soil Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(SOIL_TYPES).map(([k, v]) => (
                    <Button key={k} variant={soilType === k ? "default" : "outline"} size="sm" onClick={() => setSoilType(k)}>{k}</Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{soil.name}</p>
              </div>
            </div>
          </Card>

          {/* Results */}
          <Card className="p-6 shadow-card">
            <h2 className="font-semibold text-lg mb-6 text-foreground">Water Balance</h2>

            {/* Partition bar */}
            <div className="mb-6">
              <div className="h-8 rounded-full overflow-hidden flex">
                <div className="bg-muted-foreground/30 transition-all" style={{ width: `${pcts.inter}%` }} title="Interception" />
                <div className="bg-earth-sand/60 transition-all" style={{ width: `${pcts.et}%` }} title="ET" />
                <div className="bg-primary/40 transition-all" style={{ width: `${pcts.runoff}%` }} title="Runoff" />
                <div className="bg-earth-green/60 transition-all" style={{ width: `${pcts.recharge}%` }} title="Recharge" />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Intercept</span><span>ET</span><span>Runoff</span><span>Recharge</span>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between p-2 bg-muted rounded-lg">
                <span className="text-muted-foreground">Precipitation</span>
                <span className="text-foreground font-medium">{results.precipitation} mm</span>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded-lg">
                <span className="text-muted-foreground">Interception</span>
                <span className="text-foreground font-medium">{Math.round(results.interception)} mm</span>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded-lg">
                <span className="text-muted-foreground">AET</span>
                <span className="text-foreground font-medium">{results.AET} mm</span>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded-lg">
                <span className="text-muted-foreground">Surface Runoff</span>
                <span className="text-foreground font-medium">{results.surfaceRunoff} mm</span>
              </div>
              <div className="flex justify-between p-2 bg-primary/10 rounded-lg border border-primary/20">
                <span className="text-foreground font-semibold">Recharge</span>
                <span className="text-primary font-bold">{results.recharge} mm</span>
              </div>
              <div className="flex justify-between p-2 bg-earth-green/10 rounded-lg border border-earth-green/20">
                <span className="text-foreground font-semibold">Recharge Coefficient φ</span>
                <span className="text-earth-green font-bold">{(results.rechargeCoeff * 100).toFixed(1)}%</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-muted rounded-xl text-xs text-muted-foreground">
              <p>W = P - Qs (catchment wetting)</p>
              <p>R = W - ET (recharge)</p>
              <p>φ = R / P (recharge coefficient)</p>
            </div>
          </Card>

          {/* Sensitivity plot */}
          <Card className="p-6 shadow-card">
            <h2 className="font-semibold text-lg mb-4 text-foreground">Recharge Sensitivity</h2>
            <p className="text-sm text-muted-foreground mb-4">Recharge coefficient φ vs precipitation — non-linear relationship.</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sensitivityData}>
                  <defs>
                    <linearGradient id="rechargeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(140 45% 40%)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(140 45% 40%)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="P" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} label={{ value: 'P (mm/yr)', position: 'bottom', offset: -5, fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} label={{ value: 'φ', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} />
                  <ReferenceLine x={P[0]} stroke="hsl(var(--primary))" strokeDasharray="4 4" strokeWidth={2} />
                  <Area type="monotone" dataKey="phi" stroke="hsl(140 45% 40%)" strokeWidth={2} fill="url(#rechargeGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 h-48">
              <p className="text-sm font-medium text-foreground mb-2">Recharge Volume vs Precipitation</p>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensitivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="P" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} label={{ value: 'R (mm)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} />
                  <ReferenceLine x={P[0]} stroke="hsl(var(--primary))" strokeDasharray="4 4" strokeWidth={2} />
                  <Line type="monotone" dataKey="recharge" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Based on catchment wetting methodology — Prof. Victor Miguel Ponce, SDSU
                <br /><a href="https://ponce.sdsu.edu/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ponce.sdsu.edu</a>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GWRechargeCalculator;
