import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { onClose: () => void; }

const TENNANT: Record<string, number> = { "Flushing": 2.0, "Optimum": 0.6, "Outstanding": 0.4, "Excellent": 0.3, "Good": 0.2, "Fair/Degrading": 0.1, "Poor/Minimum": 0.05 };

const EnvironmentalFlowCalculator = ({ onClose }: Props) => {
  const [method, setMethod] = useState("tennant");
  const [annualFlow, setAnnualFlow] = useState(100); // m³/s mean annual
  const [monthlyPattern] = useState([0.6, 0.5, 0.7, 1.0, 1.5, 1.8, 1.2, 0.9, 0.8, 0.7, 0.6, 0.5]); // relative

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const data = useMemo(() => {
    return monthNames.map((m, i) => {
      const natural = annualFlow * monthlyPattern[i];
      let eflow = 0;
      switch (method) {
        case "tennant": eflow = annualFlow * 0.3; break;
        case "wetted-perimeter": eflow = annualFlow * 0.25; break;
        case "bbm": eflow = natural * 0.4; break;
        case "rva": eflow = natural * 0.35; break;
      }
      return { month: m, natural: +natural.toFixed(1), eflow: +eflow.toFixed(1), available: +(natural - eflow).toFixed(1) };
    });
  }, [annualFlow, method, monthlyPattern]);

  const totalEflow = data.reduce((s, d) => s + d.eflow, 0);
  const totalNatural = data.reduce((s, d) => s + d.natural, 0);
  const pctAllocated = (totalEflow / totalNatural * 100).toFixed(0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={onClose} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">Environmental Flow Calculator</h1>
      <p className="text-muted-foreground mb-6">Allocate flows for ecosystem health using standard methods.
        <a href="https://ponce.sdsu.edu/" target="_blank" rel="noopener noreferrer" className="text-primary ml-2 inline-flex items-center gap-1">Ponce Reference <ExternalLink className="w-3 h-3" /></a>
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Parameters</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Mean Annual Flow: {annualFlow} m³/s</Label><Slider min={10} max={1000} step={10} value={[annualFlow]} onValueChange={([v]) => setAnnualFlow(v)} /></div>
            <div>
              <Label>Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tennant">Tennant (Montana)</SelectItem>
                  <SelectItem value="wetted-perimeter">Wetted Perimeter</SelectItem>
                  <SelectItem value="bbm">Building Block (BBM)</SelectItem>
                  <SelectItem value="rva">Range of Variability (RVA)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Card className="bg-secondary/50 border-0"><CardContent className="p-3 text-sm space-y-1">
              <div>E-flow allocation: <span className="font-bold">{pctAllocated}%</span> of natural</div>
              <div>Available for use: {(100 - Number(pctAllocated))}%</div>
            </CardContent></Card>
          </CardContent>
        </Card>
        <Card className="card-water lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Monthly Flow Allocation</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis label={{ value: "Q (m³/s)", angle: -90, position: "insideLeft" }} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="eflow" stackId="a" fill="hsl(var(--earth-green))" name="Environmental Flow" />
                <Bar dataKey="available" stackId="a" fill="hsl(var(--primary))" name="Available" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnvironmentalFlowCalculator;
