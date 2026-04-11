import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { computeDrawdown, generateDrawdownProfile, generateWellFunctionCurve } from "@/lib/hydrology/groundwater";

interface Props { onClose: () => void; }

const TheisWellCalculator = ({ onClose }: Props) => {
  const [Q, setQ] = useState(500);
  const [T, setT] = useState(500);
  const [S, setS] = useState(0.001);
  const [time, setTime] = useState(1);
  const [obsR, setObsR] = useState(100);

  const { s: drawdownAtR } = useMemo(() => computeDrawdown(Q, T, S, obsR, time), [Q, T, S, time, obsR]);

  const crossSectionData = useMemo(() => generateDrawdownProfile(Q, T, S, time), [Q, T, S, time]);

  const wuData = useMemo(() => generateWellFunctionCurve(), []);

  const tableDistances = [10, 50, 100, 200, 500, 1000];
  const tableData = useMemo(() => {
    return tableDistances.map(r => {
      const result = computeDrawdown(Q, T, S, r, time);
      return { r, u: result.u.toExponential(2), W: result.W.toFixed(4), s: result.s.toFixed(3) };
    });
  }, [Q, T, S, time]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={onClose} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">Theis Well Drawdown Calculator</h1>
      <p className="text-muted-foreground mb-6">s = Q/(4πT) × W(u) where u = r²S/(4Tt).
        <a href="https://ponce.sdsu.edu/" target="_blank" rel="noopener noreferrer" className="text-primary ml-2 inline-flex items-center gap-1">Ponce Reference <ExternalLink className="w-3 h-3" /></a>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Well Parameters</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Pumping Rate Q: {Q} m³/day</Label><Slider min={10} max={5000} step={10} value={[Q]} onValueChange={([v]) => setQ(v)} /></div>
            <div><Label>Transmissivity T: {T} m²/day</Label><Slider min={10} max={5000} step={10} value={[T]} onValueChange={([v]) => setT(v)} /></div>
            <div><Label>Storativity S: {S.toFixed(4)}</Label><Slider min={0.00001} max={0.3} step={0.0001} value={[S]} onValueChange={([v]) => setS(v)} /></div>
            <div><Label>Time: {time < 1 ? (time * 24).toFixed(0) + " hr" : time.toFixed(0) + " days"}</Label><Slider min={0.01} max={365} step={0.5} value={[time]} onValueChange={([v]) => setTime(v)} /></div>
            <div><Label>Observation distance r: {obsR} m</Label><Slider min={1} max={2000} step={5} value={[obsR]} onValueChange={([v]) => setObsR(v)} /></div>
            <Card className="bg-primary/10 border-primary/30"><CardContent className="p-3 text-center">
              <div className="text-sm text-muted-foreground">Drawdown at r = {obsR} m</div>
              <div className="font-mono text-2xl font-bold text-primary">{drawdownAtR.toFixed(3)} m</div>
            </CardContent></Card>
          </CardContent>
        </Card>

        {/* Drawdown profile */}
        <Card className="card-water lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Cone of Depression</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={crossSectionData} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="r" label={{ value: "Distance r (m)", position: "bottom", offset: 0 }} tick={{ fontSize: 10 }} />
                <YAxis dataKey="negS" label={{ value: "Drawdown s (m)", angle: -90, position: "insideLeft" }} tick={{ fontSize: 10 }} reversed />
                <Tooltip formatter={(v: number) => Math.abs(v).toFixed(3) + " m"} />
                <Line type="monotone" dataKey="negS" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} name="Drawdown" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* W(u) curve */}
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Well Function W(u)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={wuData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="logU" label={{ value: "log(u)", position: "bottom", offset: -5 }} tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip />
                <Line type="monotone" dataKey="W" stroke="hsl(var(--accent))" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Drawdown Table */}
      <Card className="card-water mt-6">
        <CardHeader><CardTitle className="text-lg">Drawdown Summary</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              {["r (m)", "u", "W(u)", "s (m)"].map(h => (
                <th key={h} className="px-4 py-2 text-left text-muted-foreground">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {tableData.map((row, i) => (
                <tr key={i} className={`border-b border-border/50 ${row.r === obsR ? 'bg-primary/10' : ''}`}>
                  <td className="px-4 py-1 font-mono">{row.r}</td>
                  <td className="px-4 py-1 font-mono">{row.u}</td>
                  <td className="px-4 py-1 font-mono">{row.W}</td>
                  <td className="px-4 py-1 font-mono font-bold">{row.s}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TheisWellCalculator;
