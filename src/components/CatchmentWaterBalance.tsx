import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { onClose: () => void; }

const CatchmentWaterBalance = ({ onClose }: Props) => {
  const [P, setP] = useState(1000); // mm/yr
  const [temp, setTemp] = useState(15); // °C
  const [forestPct, setForestPct] = useState(40);
  const [urbanPct, setUrbanPct] = useState(20);
  const [area, setArea] = useState(100); // km²

  const agPct = 100 - forestPct - urbanPct;

  // Simplified Thornthwaite PET
  const PET = useMemo(() => {
    if (temp <= 0) return 0;
    const I = Math.pow(temp / 5, 1.514) * 12;
    const a = 6.75e-7 * I * I * I - 7.71e-5 * I * I + 1.79e-2 * I + 0.49;
    return 16 * Math.pow(10 * temp / I, a) * 12; // annual
  }, [temp]);

  // Actual ET depends on land cover and available water
  const ET = useMemo(() => {
    const cropCoeff = (forestPct * 1.1 + agPct * 0.9 + urbanPct * 0.3) / 100;
    return Math.min(P * 0.95, PET * cropCoeff);
  }, [P, PET, forestPct, urbanPct, agPct]);

  // Surface runoff
  const Qs = useMemo(() => {
    const runoffCoeff = (forestPct * 0.1 + agPct * 0.3 + urbanPct * 0.8) / 100;
    return P * runoffCoeff;
  }, [P, forestPct, urbanPct, agPct]);

  // Baseflow
  const Qb = Math.max(0, P - ET - Qs) * 0.6;
  const deltaS = P - ET - Qs - Qb;

  // Monthly distribution (simplified sinusoidal)
  const monthlyData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map((m, i) => {
      const pFrac = 1 + 0.5 * Math.sin((i - 3) * Math.PI / 6); // peaks in Jun
      const etFrac = 1 + 0.7 * Math.sin((i - 2) * Math.PI / 6); // peaks in Jul
      const mP = (P / 12) * pFrac;
      const mET = (ET / 12) * etFrac;
      const mQs = (Qs / 12) * pFrac * 1.2;
      const mQb = (Qb / 12) * (1 + 0.3 * Math.sin((i - 4) * Math.PI / 6));
      return { month: m, P: +mP.toFixed(0), ET: +mET.toFixed(0), Qs: +mQs.toFixed(0), Qb: +mQb.toFixed(0) };
    });
  }, [P, ET, Qs, Qb]);

  const arrowScale = (val: number) => Math.max(2, Math.min(20, val / 50));

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={onClose} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">Catchment Water Balance</h1>
      <p className="text-muted-foreground mb-6">P = ET + Qs + Qb + ΔS — Complete budget with monthly breakdown.
        <a href="https://ponce.sdsu.edu/onlinewaterbalance.html" target="_blank" rel="noopener noreferrer" className="text-primary ml-2 inline-flex items-center gap-1">Ponce Reference <ExternalLink className="w-3 h-3" /></a>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Inputs</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Precipitation P: {P} mm/yr</Label><Slider min={100} max={3000} step={50} value={[P]} onValueChange={([v]) => setP(v)} /></div>
            <div><Label>Temperature: {temp}°C</Label><Slider min={-5} max={35} step={1} value={[temp]} onValueChange={([v]) => setTemp(v)} /></div>
            <div><Label>Forest: {forestPct}%</Label><Slider min={0} max={100 - urbanPct} value={[forestPct]} onValueChange={([v]) => setForestPct(v)} /></div>
            <div><Label>Urban: {urbanPct}%</Label><Slider min={0} max={100 - forestPct} value={[urbanPct]} onValueChange={([v]) => setUrbanPct(v)} /></div>
            <div className="text-xs text-muted-foreground">Agriculture: {agPct}%</div>
            <div><Label>Area: {area} km²</Label><Slider min={1} max={10000} step={10} value={[area]} onValueChange={([v]) => setArea(v)} /></div>
          </CardContent>
        </Card>

        {/* Water balance diagram */}
        <Card className="card-water lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Water Balance Diagram</CardTitle></CardHeader>
          <CardContent>
            <svg viewBox="0 0 500 300" className="w-full h-64">
              {/* Ground surface */}
              <rect x="50" y="140" width="400" height="30" fill="hsl(var(--earth-green) / 0.3)" stroke="hsl(var(--earth-green))" />
              <text x="250" y="158" textAnchor="middle" fontSize="10" fill="hsl(var(--foreground))">Land Surface</text>
              {/* Soil layer */}
              <rect x="50" y="170" width="400" height="40" fill="hsl(var(--earth-brown) / 0.2)" />
              <text x="250" y="195" textAnchor="middle" fontSize="9" fill="hsl(var(--earth-brown))">Soil Zone</text>
              {/* Aquifer */}
              <rect x="50" y="210" width="400" height="50" fill="hsl(var(--primary) / 0.1)" />
              <text x="250" y="240" textAnchor="middle" fontSize="9" fill="hsl(var(--primary))">Aquifer</text>

              {/* P arrows down */}
              <rect x={240 - arrowScale(P) / 2} y="10" width={arrowScale(P)} height="125" fill="hsl(var(--primary))" opacity="0.6" />
              <polygon points={`${240 - arrowScale(P)},135 ${240 + arrowScale(P)},135 240,145`} fill="hsl(var(--primary))" opacity="0.6" />
              <text x="240" y="8" textAnchor="middle" fontSize="11" fontWeight="bold" fill="hsl(var(--primary))">P = {P.toFixed(0)}</text>

              {/* ET arrows up */}
              <rect x={120 - arrowScale(ET) / 2} y="40" width={arrowScale(ET)} height="95" fill="hsl(var(--earth-green))" opacity="0.5" />
              <polygon points={`${120 - arrowScale(ET)},40 ${120 + arrowScale(ET)},40 120,30`} fill="hsl(var(--earth-green))" opacity="0.5" />
              <text x="120" y="25" textAnchor="middle" fontSize="10" fill="hsl(var(--earth-green))">ET = {ET.toFixed(0)}</text>

              {/* Qs arrow right */}
              <rect x="450" y={155 - arrowScale(Qs) / 2} width="40" height={arrowScale(Qs)} fill="hsl(var(--accent))" opacity="0.5" />
              <text x="480" y="150" textAnchor="middle" fontSize="10" fill="hsl(var(--accent))">Qs = {Qs.toFixed(0)}</text>

              {/* Infiltration arrow */}
              <rect x={340 - arrowScale(P - Qs) / 4} y="145" width={arrowScale(P - Qs) / 2} height="25" fill="hsl(var(--primary) / 0.4)" />

              {/* Qb arrow right from aquifer */}
              <rect x="450" y={235 - arrowScale(Qb) / 2} width="40" height={arrowScale(Qb)} fill="hsl(var(--primary))" opacity="0.4" />
              <text x="480" y="255" textAnchor="middle" fontSize="10" fill="hsl(var(--primary))">Qb = {Qb.toFixed(0)}</text>
            </svg>

            <div className="text-center mt-2 font-mono text-sm">
              P = ET + Qs + Qb + ΔS → {P.toFixed(0)} = {ET.toFixed(0)} + {Qs.toFixed(0)} + {Qb.toFixed(0)} + {deltaS.toFixed(0)}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Budget Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              { label: "Precipitation P", val: P, color: "bg-primary/20" },
              { label: "Evapotranspiration ET", val: ET, color: "bg-earth-green/20" },
              { label: "Surface Runoff Qs", val: Qs, color: "bg-accent/20" },
              { label: "Baseflow Qb", val: Qb, color: "bg-primary/10" },
              { label: "Storage Change ΔS", val: deltaS, color: deltaS >= 0 ? "bg-secondary" : "bg-destructive/10" },
            ].map(item => (
              <div key={item.label} className={`${item.color} rounded p-2 flex justify-between`}>
                <span>{item.label}</span>
                <span className="font-mono font-bold">{item.val.toFixed(0)} mm/yr</span>
              </div>
            ))}
            <div className="border-t border-border pt-2">
              <div className="flex justify-between">
                <span>PET (Thornthwaite)</span>
                <span className="font-mono">{PET.toFixed(0)} mm/yr</span>
              </div>
              <div className="flex justify-between">
                <span>Total yield (Qs+Qb)</span>
                <span className="font-mono">{(Qs + Qb).toFixed(0)} mm/yr</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly chart */}
      <Card className="card-water mt-6">
        <CardHeader><CardTitle className="text-lg">Monthly Water Balance</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} label={{ value: "mm", angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="P" fill="hsl(var(--primary))" name="Precipitation" />
              <Bar dataKey="ET" fill="hsl(var(--earth-green))" name="ET" />
              <Bar dataKey="Qs" fill="hsl(var(--accent))" name="Surface Runoff" />
              <Bar dataKey="Qb" fill="hsl(200, 60%, 70%)" name="Baseflow" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default CatchmentWaterBalance;
