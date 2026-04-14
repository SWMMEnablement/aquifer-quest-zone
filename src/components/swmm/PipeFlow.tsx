import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { computePipeFlow } from "@/lib/hydrology/swmm";

export default function PipeFlow() {
  const [method, setMethod] = useState("manning");
  const [diameter, setDiameter] = useState(0.6);
  const [slope, setSlope] = useState(0.005);
  const [roughness, setRoughness] = useState(0.013);
  const [depth, setDepth] = useState(0.3);

  const results = useMemo(() =>
    computePipeFlow(method as "manning" | "hazen-williams", diameter, slope, roughness, depth),
    [method, diameter, slope, roughness, depth]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="card-water">
        <CardHeader><CardTitle className="text-lg">Pipe Flow Calculator</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Head Loss Method</label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manning">Manning's Formula</SelectItem>
                <SelectItem value="hazen-williams">Hazen-Williams</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Diameter D: <strong>{(diameter * 1000).toFixed(0)} mm</strong></label>
            <Slider min={0.15} max={3.0} step={0.05} value={[diameter]} onValueChange={([v]) => setDiameter(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Slope S: <strong>{slope.toFixed(4)}</strong></label>
            <Slider min={0.0005} max={0.05} step={0.0005} value={[slope]} onValueChange={([v]) => setSlope(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">
              {method === "manning" ? "Manning's n" : "Roughness C"}: <strong>{roughness.toFixed(3)}</strong>
            </label>
            <Slider min={0.008} max={0.035} step={0.001} value={[roughness]} onValueChange={([v]) => setRoughness(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Flow Depth y: <strong>{(depth * 1000).toFixed(0)} mm</strong></label>
            <Slider min={0.01} max={diameter * 0.99} step={0.01} value={[depth]} onValueChange={([v]) => setDepth(v)} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Pipe Cross-Section</CardTitle></CardHeader>
          <CardContent>
            <svg viewBox="0 0 400 280" className="w-full">
              <circle cx="200" cy="140" r="100" fill="none" stroke="hsl(var(--foreground))" strokeWidth="3" />
              {depth > 0 && (() => {
                const r = 100;
                const dRatio = Math.min(depth / diameter, 0.99);
                const waterY = 140 + r - dRatio * 2 * r;
                const halfChord = Math.sqrt(Math.max(r * r - Math.pow(waterY - 140, 2), 0));
                return (
                  <path
                    d={`M${200 - halfChord},${waterY} A${r},${r} 0 ${dRatio > 0.5 ? 1 : 0},0 ${200 + halfChord},${waterY} L${200 + halfChord},${waterY} A${r},${r} 0 ${dRatio > 0.5 ? 1 : 0},1 ${200 - halfChord},${waterY} Z`}
                    fill="hsl(var(--primary))" opacity="0.3"
                  />
                );
              })()}
              {depth > 0 && (() => {
                const r = 100;
                const dRatio = Math.min(depth / diameter, 0.99);
                const waterY = 140 + r - dRatio * 2 * r;
                const halfChord = Math.sqrt(Math.max(r * r - Math.pow(waterY - 140, 2), 0));
                return (
                  <line x1={200 - halfChord} y1={waterY} x2={200 + halfChord} y2={waterY}
                    stroke="hsl(var(--primary))" strokeWidth="2" />
                );
              })()}
              <line x1="200" y1="40" x2="200" y2="240" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" strokeDasharray="4 2" />
              <text x="215" y="145" fontSize="10" fill="hsl(var(--muted-foreground))">D = {(diameter*1000).toFixed(0)}mm</text>
              {(() => {
                const waterY = 140 + 100 - (depth/diameter) * 200;
                return (
                  <>
                    <line x1="310" y1={waterY} x2="310" y2="240" stroke="hsl(var(--primary))" strokeWidth="1" />
                    <text x="325" y={(waterY + 240)/2} fontSize="9" fill="hsl(var(--primary))">
                      y = {(depth*1000).toFixed(0)}mm
                    </text>
                  </>
                );
              })()}
              <text x="200" y="270" textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))" fontWeight="bold">
                {results.percentFull.toFixed(0)}% Full — Q = {results.Q.toFixed(3)} m³/s
              </text>
            </svg>
          </CardContent>
        </Card>

        <Card className="card-water">
          <CardHeader><CardTitle className="text-sm">Hydraulic Properties</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 text-sm">
              {[
                ["Q", `${results.Q.toFixed(3)} m³/s`],
                ["V", `${results.V.toFixed(2)} m/s`],
                ["A", `${results.A.toFixed(4)} m²`],
                ["R", `${results.R.toFixed(3)} m`],
                ["Fr", results.Fr.toFixed(3)],
                ["Qfull", `${results.Qfull.toFixed(3)} m³/s`],
              ].map(([label, val]) => (
                <div key={label} className="bg-secondary/30 rounded-lg p-2 text-center">
                  <span className="text-[10px] text-muted-foreground block">{label}</span>
                  <span className="font-bold text-xs text-foreground">{val}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className={`px-2 py-0.5 rounded-full ${results.Fr < 1 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                {results.Fr < 1 ? "Subcritical" : "Supercritical"}
              </span>
              <span className="text-muted-foreground">Fr = {results.Fr.toFixed(3)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
