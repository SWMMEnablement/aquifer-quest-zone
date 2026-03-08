import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from "recharts";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface Props { onClose: () => void; }

const BaseflowRecession = ({ onClose }: Props) => {
  const [Q0, setQ0] = useState(50); // initial baseflow m³/s
  const [alpha, setAlpha] = useState(0.97); // recession constant
  const [threshold, setThreshold] = useState(10); // ecosystem min flow
  const [showComparison, setShowComparison] = useState(false);
  const [alpha2, setAlpha2] = useState(0.99); // post-development

  const data = useMemo(() => {
    const pts = [];
    for (let t = 0; t <= 120; t++) {
      const Q1 = Q0 * Math.pow(alpha, t);
      const Q2 = Q0 * Math.pow(alpha2, t);
      pts.push({
        day: t,
        Q: +Q1.toFixed(2),
        Q2: showComparison ? +Q2.toFixed(2) : undefined,
        threshold,
        belowThreshold: Q1 < threshold ? threshold - Q1 : 0,
      });
    }
    return pts;
  }, [Q0, alpha, alpha2, threshold, showComparison]);

  const daysBelowThreshold = data.filter(d => d.Q < threshold).length;
  const daysBelowPost = showComparison ? data.filter(d => (d.Q2 || 0) < threshold).length : 0;
  const halfLife = Math.log(0.5) / Math.log(alpha);

  // Ecosystem health
  const healthPct = Math.max(0, 100 - daysBelowThreshold * 2);
  const healthColor = healthPct > 70 ? "text-earth-green" : healthPct > 40 ? "text-amber-500" : "text-destructive";

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={onClose} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">Baseflow Recession Analyzer</h1>
      <p className="text-muted-foreground mb-6">Q(t) = Q₀ × αᵗ — Exponential recession with ecosystem thresholds.
        <a href="https://ponce.sdsu.edu/" target="_blank" rel="noopener noreferrer" className="text-primary ml-2 inline-flex items-center gap-1">Ponce Reference <ExternalLink className="w-3 h-3" /></a>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Parameters</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Initial Baseflow Q₀: {Q0} m³/s</Label><Slider min={5} max={200} step={1} value={[Q0]} onValueChange={([v]) => setQ0(v)} /></div>
            <div><Label>Recession Constant α: {alpha.toFixed(3)}</Label><Slider min={0.9} max={0.999} step={0.001} value={[alpha]} onValueChange={([v]) => setAlpha(v)} /></div>
            <div><Label>Ecosystem Threshold: {threshold} m³/s</Label><Slider min={1} max={100} step={1} value={[threshold]} onValueChange={([v]) => setThreshold(v)} /></div>
            <div className="flex items-center gap-2">
              <Switch checked={showComparison} onCheckedChange={setShowComparison} />
              <Label>Compare pre/post development</Label>
            </div>
            {showComparison && (
              <div><Label>Post-dev α₂: {alpha2.toFixed(3)}</Label><Slider min={0.9} max={0.999} step={0.001} value={[alpha2]} onValueChange={([v]) => setAlpha2(v)} /></div>
            )}

            <Card className="bg-secondary/50 border-0"><CardContent className="p-3 text-sm space-y-1">
              <div>Half-life: {halfLife.toFixed(1)} days</div>
              <div>Days below threshold: <span className="font-bold">{daysBelowThreshold}</span> / 120</div>
              {showComparison && <div>Post-dev days below: <span className="font-bold">{daysBelowPost}</span></div>}
              <div className={`font-bold ${healthColor}`}>Ecosystem health: {healthPct}%</div>
            </CardContent></Card>
          </CardContent>
        </Card>

        <Card className="card-water lg:col-span-3">
          <CardHeader><CardTitle className="text-lg">Recession Curve</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={data} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" label={{ value: "Days", position: "bottom", offset: 0 }} tick={{ fontSize: 10 }} />
                <YAxis label={{ value: "Q (m³/s)", angle: -90, position: "insideLeft" }} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="belowThreshold" fill="hsl(var(--destructive) / 0.15)" stroke="none" name="Below threshold" />
                <Line type="monotone" dataKey="Q" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} name="Pre-development" />
                {showComparison && <Line type="monotone" dataKey="Q2" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Post-development" />}
                <ReferenceLine y={threshold} stroke="hsl(var(--destructive))" strokeDasharray="8 4" label={{ value: "Eco threshold", fill: "hsl(var(--destructive))", fontSize: 10 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ecological indicators */}
      <Card className="card-water mt-6">
        <CardHeader><CardTitle className="text-lg">Ecological Impact Indicators</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Fish Survival", icon: "🐟", val: healthPct > 60 ? "Healthy" : healthPct > 30 ? "Stressed" : "Critical" },
              { label: "Riparian Zone", icon: "🌳", val: healthPct > 50 ? "Intact" : healthPct > 20 ? "Degraded" : "Collapsed" },
              { label: "Bird Habitat", icon: "🦅", val: healthPct > 40 ? "Supported" : "Insufficient" },
              { label: "Macroinvertebrates", icon: "🦐", val: daysBelowThreshold < 30 ? "Diverse" : daysBelowThreshold < 60 ? "Reduced" : "Depleted" },
            ].map(item => (
              <div key={item.label} className="bg-secondary/50 rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
                <div className="font-bold text-sm">{item.val}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BaseflowRecession;
