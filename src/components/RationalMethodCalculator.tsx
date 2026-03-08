import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { ArrowLeft, ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { onClose: () => void; }

const RUNOFF_COEFFICIENTS: Record<string, number> = {
  "Asphalt/Concrete": 0.90, "Commercial": 0.85, "Industrial": 0.75, "Residential (dense)": 0.65,
  "Residential (suburban)": 0.40, "Parkland": 0.25, "Forest": 0.15, "Agricultural": 0.30,
};

// Simplified IDF: i = a / (tc + b) for different return periods
const IDF_PARAMS: Record<number, { a: number; b: number }> = {
  2: { a: 800, b: 10 }, 5: { a: 1200, b: 10 }, 10: { a: 1500, b: 10 },
  25: { a: 1900, b: 10 }, 50: { a: 2200, b: 10 }, 100: { a: 2500, b: 10 },
};

const RationalMethodCalculator = ({ onClose }: Props) => {
  const [area, setArea] = useState(50); // hectares
  const [landUse, setLandUse] = useState("Residential (suburban)");
  const [C, setC] = useState(RUNOFF_COEFFICIENTS["Residential (suburban)"]);
  const [returnPeriod, setReturnPeriod] = useState(25);
  const [tc, setTc] = useState(30); // minutes

  const intensity = useMemo(() => {
    const p = IDF_PARAMS[returnPeriod] || IDF_PARAMS[25];
    return p.a / (tc + p.b);
  }, [returnPeriod, tc]);

  const Q = C * intensity * area / 360; // m³/s (metric rational formula)

  const idfData = useMemo(() => {
    const data = [];
    for (let d = 5; d <= 180; d += 5) {
      const entry: any = { duration: d };
      Object.entries(IDF_PARAMS).forEach(([T, p]) => {
        entry[`T${T}`] = +(p.a / (d + p.b)).toFixed(1);
      });
      data.push(entry);
    }
    return data;
  }, []);

  const handleLandUseChange = (v: string) => {
    setLandUse(v);
    setC(RUNOFF_COEFFICIENTS[v]);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={onClose} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">Rational Method Calculator</h1>
      <p className="text-muted-foreground mb-6">Q = CiA with integrated IDF curves.
        <a href="https://ponce.sdsu.edu/onlinerationalmethod.html" target="_blank" rel="noopener noreferrer" className="text-primary ml-2 inline-flex items-center gap-1">Ponce Reference <ExternalLink className="w-3 h-3" /></a>
      </p>

      {area > 200 && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="w-4 h-4" />The Rational Method is typically applied to catchments &lt; 200 ha. Consider unit hydrograph methods for larger areas.
        </div>
      )}
      {area > 80 && area <= 200 && (
        <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-sm text-amber-700">
          <AlertTriangle className="w-4 h-4" />Approaching the upper limit of the Rational Method. Use with caution.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Inputs</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Catchment Area A: {area} ha</Label><Slider min={1} max={500} step={1} value={[area]} onValueChange={([v]) => setArea(v)} /></div>
            <div>
              <Label>Land Use</Label>
              <Select value={landUse} onValueChange={handleLandUseChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(RUNOFF_COEFFICIENTS).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Runoff Coefficient C: {C.toFixed(2)}</Label><Slider min={0.05} max={0.95} step={0.01} value={[C]} onValueChange={([v]) => setC(v)} /></div>
            <div>
              <Label>Return Period T: {returnPeriod} years</Label>
              <Select value={String(returnPeriod)} onValueChange={(v) => setReturnPeriod(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2, 5, 10, 25, 50, 100].map(T => <SelectItem key={T} value={String(T)}>{T} yr</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Time of Concentration t<sub>c</sub>: {tc} min</Label><Slider min={5} max={180} step={5} value={[tc]} onValueChange={([v]) => setTc(v)} /></div>

            <Card className="bg-primary/10 border-primary/30"><CardContent className="p-4 text-center">
              <div className="text-sm text-muted-foreground">Peak Discharge Q = CiA</div>
              <div className="font-mono text-3xl font-bold text-primary">{Q.toFixed(1)} m³/s</div>
              <div className="text-xs text-muted-foreground mt-1">i = {intensity.toFixed(1)} mm/hr | C = {C.toFixed(2)} | A = {area} ha</div>
            </CardContent></Card>
          </CardContent>
        </Card>

        {/* IDF Curves */}
        <Card className="card-water lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">IDF Curves</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={idfData} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="duration" label={{ value: "Duration (min)", position: "bottom", offset: 0 }} tick={{ fontSize: 10 }} />
                <YAxis label={{ value: "Intensity (mm/hr)", angle: -90, position: "insideLeft" }} tick={{ fontSize: 10 }} />
                <Tooltip />
                <ReferenceLine x={tc} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: `tc=${tc}`, fill: "hsl(var(--destructive))", fontSize: 10 }} />
                {Object.keys(IDF_PARAMS).map((T, i) => (
                  <Line key={T} type="monotone" dataKey={`T${T}`} name={`T=${T} yr`}
                    stroke={`hsl(${200 + i * 15}, ${60 + i * 5}%, ${30 + i * 8}%)`}
                    strokeWidth={Number(T) === returnPeriod ? 3 : 1}
                    dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground text-center mt-1">Red dashed line = t<sub>c</sub> = {tc} min → i = {intensity.toFixed(1)} mm/hr for T = {returnPeriod} yr</p>
          </CardContent>
        </Card>
      </div>

      {/* tc computation methods */}
      <Card className="card-water mt-6">
        <CardHeader><CardTitle className="text-lg">t<sub>c</sub> Estimation Methods</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="font-bold mb-1">Kirpich</div>
              <div className="font-mono text-xs">t<sub>c</sub> = 0.0195 L<sup>0.77</sup> S<sup>−0.385</sup></div>
              <div className="text-muted-foreground mt-1">L = channel length (m), S = average slope</div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="font-bold mb-1">SCS Lag</div>
              <div className="font-mono text-xs">t<sub>c</sub> = 1.67 × lag time</div>
              <div className="text-muted-foreground mt-1">lag = L<sup>0.8</sup>(S<sub>r</sub>+1)<sup>0.7</sup> / (1140·Y<sup>0.5</sup>)</div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="font-bold mb-1">Ponce Method</div>
              <div className="font-mono text-xs">t<sub>c</sub> = L / V<sub>c</sub></div>
              <div className="text-muted-foreground mt-1">V<sub>c</sub> = kinematic wave velocity</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RationalMethodCalculator;
