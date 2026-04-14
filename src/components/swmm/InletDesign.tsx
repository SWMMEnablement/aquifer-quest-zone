import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { computeGrateInlet, computeCurbInlet } from "@/lib/hydrology/swmm";

export default function InletDesign() {
  const [inletType, setInletType] = useState("grate");
  const [location, setLocation] = useState("on-grade");
  const [Q, setQ] = useState(0.1);
  const [slope, setSlope] = useState(0.02);
  const [Sx, setSx] = useState(0.025);
  const [grateLength, setGrateLength] = useState(0.9);
  const [grateWidth, setGrateWidth] = useState(0.6);
  const [clogging, setClogging] = useState(0);

  const results = useMemo(() => {
    if (inletType === "grate") {
      return computeGrateInlet(Q, slope, Sx, grateLength, grateWidth, clogging);
    } else {
      return computeCurbInlet(Q, slope, Sx, grateLength);
    }
  }, [Q, slope, Sx, grateLength, grateWidth, clogging, inletType]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="card-water">
        <CardHeader><CardTitle className="text-lg">Inlet Design</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Inlet Type</label>
              <Select value={inletType} onValueChange={setInletType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grate">Grate Inlet</SelectItem>
                  <SelectItem value="curb">Curb-Opening Inlet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Location</label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="on-grade">On Grade</SelectItem>
                  <SelectItem value="in-sag">In Sag</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Discharge Q: <strong>{Q.toFixed(3)} m³/s</strong></label>
            <Slider min={0.01} max={0.5} step={0.01} value={[Q]} onValueChange={([v]) => setQ(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Longitudinal Slope: <strong>{slope.toFixed(3)}</strong></label>
            <Slider min={0.005} max={0.08} step={0.005} value={[slope]} onValueChange={([v]) => setSlope(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Cross Slope Sx: <strong>{Sx.toFixed(3)}</strong></label>
            <Slider min={0.01} max={0.06} step={0.005} value={[Sx]} onValueChange={([v]) => setSx(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">
              {inletType === "grate" ? "Grate" : "Curb Opening"} Length: <strong>{grateLength.toFixed(2)} m</strong>
            </label>
            <Slider min={0.3} max={3.0} step={0.1} value={[grateLength]} onValueChange={([v]) => setGrateLength(v)} />
          </div>
          {inletType === "grate" && (
            <>
              <div>
                <label className="text-sm text-muted-foreground">Grate Width: <strong>{grateWidth.toFixed(2)} m</strong></label>
                <Slider min={0.3} max={1.2} step={0.05} value={[grateWidth]} onValueChange={([v]) => setGrateWidth(v)} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Clogging: <strong>{clogging}%</strong></label>
                <Slider min={0} max={80} step={5} value={[clogging]} onValueChange={([v]) => setClogging(v)} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">{inletType === "grate" ? "Grate" : "Curb-Opening"} Inlet Diagram</CardTitle></CardHeader>
          <CardContent>
            <svg viewBox="0 0 500 250" className="w-full">
              {inletType === "grate" ? (
                <>
                  <rect x="20" y="40" width="460" height="160" fill="hsl(var(--muted))" opacity="0.15" rx="4" />
                  <rect x="20" y="40" width="15" height="160" fill="hsl(var(--muted-foreground))" opacity="0.4" rx="2" />
                  <rect x="120" y="80" width={grateWidth * 150} height={grateLength * 80}
                    fill="hsl(var(--primary))" opacity="0.2" stroke="hsl(var(--primary))" strokeWidth="2" rx="3" />
                  {Array.from({length: 6}, (_, i) => (
                    <line key={i} x1={120 + (i+1) * grateWidth * 150 / 7} y1="80"
                      x2={120 + (i+1) * grateWidth * 150 / 7} y2={80 + grateLength * 80}
                      stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.5" />
                  ))}
                  {clogging > 0 && (
                    <rect x="120" y="80" width={grateWidth * 150 * clogging / 100} height={grateLength * 80}
                      fill="hsl(var(--destructive))" opacity="0.2" />
                  )}
                  {[60, 100, 140, 180].map((y, i) => (
                    <g key={i}>
                      <line x1="380" y1={y} x2="140" y2={y + 20} stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.4" />
                      <polygon points={`140,${y+20} 148,${y+16} 148,${y+24}`} fill="hsl(var(--primary))" opacity="0.4" />
                    </g>
                  ))}
                  <text x={120 + grateWidth * 75} y={90 + grateLength * 80} textAnchor="middle"
                    fontSize="10" fill="hsl(var(--foreground))">{grateWidth.toFixed(1)}m × {grateLength.toFixed(1)}m</text>
                  <text x="250" y="230" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">
                    Plan view — flow approaches from right
                  </text>
                  <text x="400" y="230" textAnchor="middle" fontSize="12" fill="hsl(var(--primary))" fontWeight="bold">
                    E = {(results.E * 100).toFixed(0)}%
                  </text>
                </>
              ) : (
                <>
                  <rect x="20" y="40" width="460" height="130" fill="hsl(var(--muted))" opacity="0.1" rx="4" />
                  <line x1="40" y1="100" x2="460" y2={100 + 360 * Sx} stroke="hsl(var(--foreground))" strokeWidth="3" />
                  <rect x="20" y="60" width="20" height="60" fill="hsl(var(--muted-foreground))" opacity="0.5" rx="2" />
                  <rect x="20" y="90" width="20" height={Math.min(grateLength * 15, 30)}
                    fill="hsl(var(--primary))" opacity="0.5" rx="1" />
                  <polygon points={`40,100 40,${100 + results.depth * 500} ${40 + Math.min(results.T, 3) * 120},100`}
                    fill="hsl(var(--primary))" opacity="0.25" />
                  <line x1="70" y1="100" x2="40" y2="100" stroke="hsl(var(--primary))" strokeWidth="2" markerEnd="url(#arrow)" />
                  <text x="250" y="195" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">
                    Curb opening length L = {grateLength.toFixed(1)} m
                  </text>
                  <text x="250" y="220" textAnchor="middle" fontSize="12" fill="hsl(var(--primary))" fontWeight="bold">
                    E = {(results.E * 100).toFixed(0)}%
                  </text>
                </>
              )}
            </svg>
          </CardContent>
        </Card>

        <Card className="card-water">
          <CardHeader><CardTitle className="text-sm">Interception Results</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-secondary/30 rounded-lg p-3">
                <span className="text-xs text-muted-foreground block">Efficiency E</span>
                <span className="font-bold text-foreground">{(results.E * 100).toFixed(1)}%</span>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3">
                <span className="text-xs text-muted-foreground block">Intercepted Qi</span>
                <span className="font-bold text-foreground">{results.Qi.toFixed(3)} m³/s</span>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3">
                <span className="text-xs text-muted-foreground block">Bypass Flow</span>
                <span className="font-bold text-foreground">{results.bypass.toFixed(3)} m³/s</span>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3">
                <span className="text-xs text-muted-foreground block">Spread T</span>
                <span className="font-bold text-foreground">{results.T.toFixed(2)} m</span>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3">
                <span className="text-xs text-muted-foreground block">Velocity V</span>
                <span className="font-bold text-foreground">{results.V.toFixed(2)} m/s</span>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3">
                <span className="text-xs text-muted-foreground block">Depth d</span>
                <span className="font-bold text-foreground">{(results.depth * 1000).toFixed(1)} mm</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Intercepted</span><span>Bypass</span>
              </div>
              <div className="h-4 rounded-full bg-muted overflow-hidden flex">
                <div className="h-full bg-primary/60 transition-all" style={{ width: `${results.E * 100}%` }} />
                <div className="h-full bg-destructive/30 transition-all" style={{ width: `${(1 - results.E) * 100}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
