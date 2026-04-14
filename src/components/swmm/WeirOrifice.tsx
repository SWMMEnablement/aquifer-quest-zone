import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { computeWeirOrifice, type StructureType } from "@/lib/hydrology/swmm";

export default function WeirOrifice() {
  const [type, setType] = useState("rect-weir");
  const [headwater, setHeadwater] = useState(2.0);
  const [crest, setCrest] = useState(1.0);
  const [tailwater, setTailwater] = useState(0.5);
  const [length, setLength] = useState(3.0);
  const [Cd, setCd] = useState(1.84);
  const [angle, setAngle] = useState(90);
  const [orificeDia, setOrificeDia] = useState(0.5);

  const results = useMemo(() =>
    computeWeirOrifice(type as StructureType, headwater, crest, tailwater, length, Cd, angle, orificeDia),
    [type, headwater, crest, tailwater, length, Cd, angle, orificeDia]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="card-water">
        <CardHeader><CardTitle className="text-lg">Weir & Orifice Calculator</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Structure Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rect-weir">Sharp-Crested Rectangular Weir</SelectItem>
                <SelectItem value="v-notch">V-Notch Weir</SelectItem>
                <SelectItem value="broad-crest">Broad-Crested Weir</SelectItem>
                <SelectItem value="orifice">Circular Orifice</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Headwater Elev: <strong>{headwater.toFixed(2)} m</strong></label>
            <Slider min={0.5} max={5.0} step={0.1} value={[headwater]} onValueChange={([v]) => setHeadwater(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Crest Elev: <strong>{crest.toFixed(2)} m</strong></label>
            <Slider min={0.1} max={4.0} step={0.1} value={[crest]} onValueChange={([v]) => setCrest(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Tailwater Elev: <strong>{tailwater.toFixed(2)} m</strong></label>
            <Slider min={0} max={4.0} step={0.1} value={[tailwater]} onValueChange={([v]) => setTailwater(v)} />
          </div>
          {type !== "orifice" && type !== "v-notch" && (
            <>
              <div>
                <label className="text-sm text-muted-foreground">Crest Length L: <strong>{length.toFixed(1)} m</strong></label>
                <Slider min={0.5} max={10.0} step={0.5} value={[length]} onValueChange={([v]) => setLength(v)} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Discharge Coeff Cd: <strong>{Cd.toFixed(2)}</strong></label>
                <Slider min={1.4} max={2.2} step={0.02} value={[Cd]} onValueChange={([v]) => setCd(v)} />
              </div>
            </>
          )}
          {type === "v-notch" && (
            <div>
              <label className="text-sm text-muted-foreground">Notch Angle θ: <strong>{angle}°</strong></label>
              <Slider min={30} max={120} step={10} value={[angle]} onValueChange={([v]) => setAngle(v)} />
            </div>
          )}
          {type === "orifice" && (
            <div>
              <label className="text-sm text-muted-foreground">Orifice Diameter: <strong>{(orificeDia * 1000).toFixed(0)} mm</strong></label>
              <Slider min={0.1} max={2.0} step={0.05} value={[orificeDia]} onValueChange={([v]) => setOrificeDia(v)} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Diagram</CardTitle></CardHeader>
          <CardContent>
            <svg viewBox="0 0 500 280" className="w-full">
              <rect x="0" y="220" width="500" height="60" fill="hsl(var(--muted))" opacity="0.2" />
              <line x1="0" y1="220" x2="500" y2="220" stroke="hsl(var(--foreground))" strokeWidth="2" />
              <rect x="220" y={220 - crest * 40} width={type === "broad-crest" ? 60 : 15} height={crest * 40}
                fill="hsl(var(--foreground))" opacity="0.6" rx="2" />
              <rect x="0" y={220 - headwater * 40} width="220" height={headwater * 40}
                fill="hsl(var(--primary))" opacity="0.2" />
              <line x1="0" y1={220 - headwater * 40} x2="220" y2={220 - headwater * 40}
                stroke="hsl(var(--primary))" strokeWidth="2" />
              <rect x={type === "broad-crest" ? 280 : 235} y={220 - tailwater * 40}
                width={type === "broad-crest" ? 220 : 265} height={tailwater * 40}
                fill="hsl(var(--primary))" opacity="0.15" />
              <line x1={type === "broad-crest" ? 280 : 235} y1={220 - tailwater * 40}
                x2="500" y2={220 - tailwater * 40}
                stroke="hsl(var(--primary))" strokeWidth="1.5" strokeDasharray="4 2" />
              <line x1="200" y1={220 - headwater * 40} x2="200" y2={220 - crest * 40}
                stroke="hsl(var(--accent))" strokeWidth="1.5" />
              <text x="185" y={(220 - headwater * 40 + 220 - crest * 40) / 2}
                textAnchor="end" fontSize="10" fill="hsl(var(--accent))">
                H = {results.H.toFixed(2)} m
              </text>
              {results.Q > 0 && (
                <>
                  <path d={`M210,${220 - crest * 40 - 5} Q230,${220 - crest * 40 - 20} 260,${220 - crest * 40 + 15}`}
                    fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
                  <text x="280" y={220 - crest * 40 + 10} fontSize="10" fill="hsl(var(--primary))" fontWeight="bold">
                    Q = {results.Q.toFixed(3)}
                  </text>
                </>
              )}
              <text x="100" y={215 - headwater * 40} textAnchor="middle" fontSize="9" fill="hsl(var(--primary))">HW = {headwater.toFixed(1)}m</text>
              <text x="400" y={215 - tailwater * 40} textAnchor="middle" fontSize="9" fill="hsl(var(--primary))">TW = {tailwater.toFixed(1)}m</text>
              {results.subRatio > 0.67 && (
                <text x="250" y="265" textAnchor="middle" fontSize="10" fill="hsl(var(--destructive))">
                  ⚠ Submerged (TW/H = {results.subRatio.toFixed(2)})
                </text>
              )}
            </svg>
          </CardContent>
        </Card>

        <Card className="card-water">
          <CardHeader><CardTitle className="text-sm">Results</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-secondary/30 rounded-lg p-3">
                <span className="text-xs text-muted-foreground block">Discharge Q</span>
                <span className="font-bold text-foreground">{results.Q.toFixed(3)} m³/s</span>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3">
                <span className="text-xs text-muted-foreground block">Velocity V</span>
                <span className="font-bold text-foreground">{results.V.toFixed(2)} m/s</span>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3">
                <span className="text-xs text-muted-foreground block">Head H</span>
                <span className="font-bold text-foreground">{results.H.toFixed(2)} m</span>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3">
                <span className="text-xs text-muted-foreground block">Submergence</span>
                <span className={`font-bold ${results.subRatio > 0.67 ? "text-destructive" : "text-foreground"}`}>
                  {results.subRatio > 0.67 ? "Yes" : "Free"} ({(results.subFactor * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 font-mono">{results.formula}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
