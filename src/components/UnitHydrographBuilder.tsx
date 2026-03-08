import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Area } from "recharts";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { onClose: () => void; }

type UHType = "scs-triangular" | "scs-curvilinear" | "snyder";

const UnitHydrographBuilder = ({ onClose }: Props) => {
  const [uhType, setUhType] = useState<UHType>("scs-triangular");
  const [area, setArea] = useState(100); // km²
  const [tc, setTc] = useState(6); // hours
  const [duration, setDuration] = useState(2); // hours
  const [rainfallBars, setRainfallBars] = useState([10, 25, 40, 30, 15, 5]); // mm per increment

  const tp = tc * 0.6 + duration / 2; // time to peak
  const tb = 2.67 * tp; // base time (SCS)
  const Qp = 2.08 * area / tp; // peak (m³/s per mm)

  // Generate UH ordinates
  const uhOrdinates = useMemo(() => {
    const dt = duration;
    const pts: number[] = [];
    for (let t = 0; t <= tb * 1.5; t += dt) {
      let q = 0;
      const tRatio = t / tp;
      switch (uhType) {
        case "scs-triangular":
          if (t <= tp) q = Qp * tRatio;
          else if (t <= tb) q = Qp * (1 - (t - tp) / (tb - tp));
          break;
        case "scs-curvilinear":
          q = Qp * Math.pow(tRatio, 3) * Math.exp(-3 * (tRatio - 1));
          if (q < 0) q = 0;
          break;
        case "snyder": {
          const Cp = 0.6;
          q = Cp * Qp * Math.pow(tRatio, 2) * Math.exp(-2 * (tRatio - 1));
          break;
        }
      }
      pts.push(Math.max(0, +q.toFixed(2)));
    }
    return pts;
  }, [uhType, Qp, tp, tb, duration]);

  // Composite hydrograph via superposition
  const compositeData = useMemo(() => {
    const totalSteps = uhOrdinates.length + rainfallBars.length;
    const composite: { time: number; total: number; [key: string]: number }[] = [];
    const contributions: number[][] = rainfallBars.map(() => new Array(totalSteps).fill(0));

    for (let i = 0; i < totalSteps; i++) {
      const entry: any = { time: +(i * duration).toFixed(1), total: 0 };
      for (let j = 0; j < rainfallBars.length; j++) {
        const uhIdx = i - j;
        const q = uhIdx >= 0 && uhIdx < uhOrdinates.length ? uhOrdinates[uhIdx] * rainfallBars[j] / 1000 : 0;
        contributions[j][i] = q;
        entry[`r${j}`] = +q.toFixed(1);
        entry.total += q;
      }
      entry.total = +entry.total.toFixed(1);
      composite.push(entry);
    }
    return composite;
  }, [uhOrdinates, rainfallBars, duration]);

  const peakQ = Math.max(...compositeData.map(d => d.total));
  const peakTime = compositeData.find(d => d.total === peakQ)?.time || 0;

  const rainfallData = rainfallBars.map((r, i) => ({ time: i * duration, rainfall: r }));

  const updateRainfall = (index: number, value: number) => {
    const newBars = [...rainfallBars];
    newBars[index] = value;
    setRainfallBars(newBars);
  };

  const colors = ["hsl(205, 85%, 35%)", "hsl(195, 75%, 50%)", "hsl(180, 65%, 40%)", "hsl(200, 60%, 60%)", "hsl(210, 50%, 70%)", "hsl(190, 40%, 75%)"];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={onClose} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">Unit Hydrograph Constructor</h1>
      <p className="text-muted-foreground mb-6">Build storm hydrographs using superposition of unit hydrograph responses.
        <a href="https://ponce.sdsu.edu/onlineunithydrographcalculator.html" target="_blank" rel="noopener noreferrer" className="text-primary ml-2 inline-flex items-center gap-1">Ponce Reference <ExternalLink className="w-3 h-3" /></a>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Watershed & UH</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>UH Type</Label>
              <Select value={uhType} onValueChange={(v) => setUhType(v as UHType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scs-triangular">SCS Triangular</SelectItem>
                  <SelectItem value="scs-curvilinear">SCS Curvilinear</SelectItem>
                  <SelectItem value="snyder">Snyder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Watershed Area: {area} km²</Label><Slider min={10} max={5000} step={10} value={[area]} onValueChange={([v]) => setArea(v)} /></div>
            <div><Label>Time of concentration t<sub>c</sub>: {tc} hr</Label><Slider min={1} max={48} step={0.5} value={[tc]} onValueChange={([v]) => setTc(v)} /></div>
            <div><Label>UH Duration: {duration} hr</Label><Slider min={0.5} max={12} step={0.5} value={[duration]} onValueChange={([v]) => setDuration(v)} /></div>
            <Card className="bg-secondary/50 border-0"><CardContent className="p-3 text-sm space-y-1">
              <div>t<sub>p</sub> = {tp.toFixed(1)} hr</div>
              <div>Q<sub>p</sub> = {Qp.toFixed(1)} m³/s/mm</div>
              <div>t<sub>b</sub> = {tb.toFixed(1)} hr</div>
              <div className="font-bold pt-1">Peak flow: {peakQ.toFixed(0)} m³/s at t = {peakTime} hr</div>
            </CardContent></Card>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          {/* Rainfall hyetograph */}
          <Card className="card-water">
            <CardHeader><CardTitle className="text-lg">Rainfall Hyetograph (drag sliders)</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-2 mb-4">
                {rainfallBars.map((r, i) => (
                  <div key={i} className="text-center">
                    <Label className="text-xs">P{i + 1}: {r} mm</Label>
                    <Slider orientation="vertical" min={0} max={60} step={1} value={[r]} onValueChange={([v]) => updateRainfall(i, v)} className="h-16 mx-auto" />
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={rainfallData}>
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis reversed tick={{ fontSize: 10 }} />
                  <Bar dataKey="rainfall" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Composite hydrograph */}
          <Card className="card-water">
            <CardHeader><CardTitle className="text-lg">Composite Storm Hydrograph</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={compositeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" label={{ value: "Time (hr)", position: "bottom", offset: -5 }} tick={{ fontSize: 10 }} />
                  <YAxis label={{ value: "Q (m³/s)", angle: -90, position: "insideLeft" }} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  {rainfallBars.map((_, i) => (
                    <Area key={i} type="monotone" dataKey={`r${i}`} stackId="1" fill={colors[i % colors.length]} fillOpacity={0.3} stroke={colors[i % colors.length]} name={`P${i + 1} response`} />
                  ))}
                  <Line type="monotone" dataKey="total" stroke="hsl(var(--foreground))" strokeWidth={3} dot={false} name="Total Q" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UnitHydrographBuilder;
