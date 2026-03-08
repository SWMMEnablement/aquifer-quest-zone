import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { onClose: () => void; }
const g = 9.81;

const FloodFrequencyAnalysis = ({ onClose }: Props) => {
  const [returnPeriod, setReturnPeriod] = useState(100);
  const [meanQ, setMeanQ] = useState(500);
  const [stdDev, setStdDev] = useState(150);
  const [skew, setSkew] = useState(0.5);
  const [dist, setDist] = useState("gumbel");

  const results = useMemo(() => {
    const data = [];
    const periods = [2, 5, 10, 25, 50, 100, 200, 500];
    for (const T of periods) {
      const p = 1 - 1 / T;
      let KT = 0;
      switch (dist) {
        case "gumbel": {
          const yT = -Math.log(-Math.log(p));
          KT = (yT - 0.5772) / 1.2825;
          break;
        }
        case "lognormal": {
          const z = 4.91 * (Math.pow(p, 0.14) - Math.pow(1 - p, 0.14));
          KT = z + (z * z - 1) * skew / 6 + (z * z * z / 3 - z) * skew * skew / 36;
          break;
        }
        case "log-pearson": {
          const z = 4.91 * (Math.pow(p, 0.14) - Math.pow(1 - p, 0.14));
          KT = z + (z * z - 1) * skew / 6;
          break;
        }
        default: {
          KT = 4.91 * (Math.pow(p, 0.14) - Math.pow(1 - p, 0.14));
        }
      }
      const QT = meanQ + KT * stdDev;
      data.push({ T, p: +(p * 100).toFixed(1), KT: +KT.toFixed(3), Q: +Math.max(0, QT).toFixed(0) });
    }
    return data;
  }, [meanQ, stdDev, skew, dist]);

  const selectedQ = results.find(r => r.T === returnPeriod)?.Q || 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={onClose} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">Flood Frequency Analysis</h1>
      <p className="text-muted-foreground mb-6">Estimate design discharges using statistical distributions.
        <a href="https://ponce.sdsu.edu/" target="_blank" rel="noopener noreferrer" className="text-primary ml-2 inline-flex items-center gap-1">Ponce Reference <ExternalLink className="w-3 h-3" /></a>
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Statistics</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Mean Q: {meanQ} m³/s</Label><Slider min={50} max={5000} step={50} value={[meanQ]} onValueChange={([v]) => setMeanQ(v)} /></div>
            <div><Label>Std Dev σ: {stdDev} m³/s</Label><Slider min={10} max={2000} step={10} value={[stdDev]} onValueChange={([v]) => setStdDev(v)} /></div>
            <div><Label>Skewness: {skew.toFixed(2)}</Label><Slider min={-2} max={2} step={0.1} value={[skew]} onValueChange={([v]) => setSkew(v)} /></div>
            <div>
              <Label>Distribution</Label>
              <Select value={dist} onValueChange={setDist}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gumbel">Gumbel (EV1)</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="lognormal">Log-Normal</SelectItem>
                  <SelectItem value="log-pearson">Log-Pearson III</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Return Period: {returnPeriod} yr</Label>
              <Select value={String(returnPeriod)} onValueChange={v => setReturnPeriod(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2, 5, 10, 25, 50, 100, 200, 500].map(T => <SelectItem key={T} value={String(T)}>{T} yr</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Card className="bg-primary/10 border-primary/30"><CardContent className="p-3 text-center">
              <div className="text-sm text-muted-foreground">Q({returnPeriod})</div>
              <div className="font-mono text-2xl font-bold text-primary">{selectedQ} m³/s</div>
            </CardContent></Card>
          </CardContent>
        </Card>
        <Card className="card-water lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Frequency Table</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                {["T (yr)", "Prob (%)", "KT", "Q (m³/s)"].map(h => <th key={h} className="px-4 py-2 text-left text-muted-foreground">{h}</th>)}
              </tr></thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className={`border-b border-border/50 ${r.T === returnPeriod ? 'bg-primary/10 font-bold' : ''}`}>
                    <td className="px-4 py-2 font-mono">{r.T}</td>
                    <td className="px-4 py-2 font-mono">{r.p}</td>
                    <td className="px-4 py-2 font-mono">{r.KT}</td>
                    <td className="px-4 py-2 font-mono font-bold">{r.Q}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FloodFrequencyAnalysis;
