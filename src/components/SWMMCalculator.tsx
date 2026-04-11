import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ExternalLink } from "lucide-react";
import {
  computeGutterFlow,
  computeGrateInlet,
  computeCurbInlet,
  computePipeFlow,
  computeWeirOrifice,
  computeWaterHammer,
  generatePumpCurve,
  applyAffinityLaws,
  computeSpecificSpeed,
  classifyPumpType,
  type StructureType,
} from "@/lib/hydrology/swmm";

interface Props { onClose: () => void; }

// ─── GUTTER FLOW ─────────────────────────────────────────
function GutterFlow() {
  const [n, setN] = useState(0.016);
  const [slope, setSlope] = useState(0.02);
  const [Sx, setSx] = useState(0.02);
  const [Sw, setSw] = useState(0.06);
  const [gutterW, setGutterW] = useState(0.6);
  const [Q, setQ] = useState(0.05);

  // Izzard's modified Manning for composite gutter
  const spread = useMemo(() => {
    // Simplified: T = (Q*n/(0.376*Sx^(5/3)*slope^0.5))^(3/8)
    const T = Math.pow((Q * n) / (0.376 * Math.pow(Sx, 5/3) * Math.pow(slope, 0.5)), 3/8);
    return isFinite(T) ? T : 0;
  }, [Q, n, Sx, slope]);

  const depth = spread * Sx;
  const gutterDepth = depth + gutterW * (Sw - Sx);
  const velocity = spread > 0 ? Q / (0.5 * spread * depth) : 0;
  const flowArea = 0.5 * spread * depth;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="card-water">
        <CardHeader><CardTitle className="text-lg">Gutter Flow Inputs</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Manning's n: <strong>{n.toFixed(3)}</strong></label>
            <Slider min={0.010} max={0.030} step={0.001} value={[n]} onValueChange={([v]) => setN(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Longitudinal Slope S: <strong>{slope.toFixed(3)}</strong></label>
            <Slider min={0.001} max={0.10} step={0.001} value={[slope]} onValueChange={([v]) => setSlope(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Road Cross Slope Sx: <strong>{Sx.toFixed(3)}</strong></label>
            <Slider min={0.01} max={0.08} step={0.005} value={[Sx]} onValueChange={([v]) => setSx(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Gutter Cross Slope Sw: <strong>{Sw.toFixed(3)}</strong></label>
            <Slider min={0.02} max={0.12} step={0.005} value={[Sw]} onValueChange={([v]) => setSw(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Gutter Width W: <strong>{gutterW.toFixed(2)} m</strong></label>
            <Slider min={0.3} max={1.5} step={0.1} value={[gutterW]} onValueChange={([v]) => setGutterW(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Discharge Q: <strong>{Q.toFixed(3)} m³/s</strong></label>
            <Slider min={0.005} max={0.3} step={0.005} value={[Q]} onValueChange={([v]) => setQ(v)} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Gutter Cross-Section</CardTitle></CardHeader>
          <CardContent>
            <svg viewBox="0 0 500 220" className="w-full">
              {/* Street surface */}
              <rect x="0" y="0" width="500" height="220" fill="hsl(var(--secondary))" opacity="0.1" />
              {/* Road surface line - slopes from left curb down to right */}
              <line x1="40" y1="80" x2="460" y2={80 + (420 * Sx * 5)} stroke="hsl(var(--foreground))" strokeWidth="3" />
              {/* Curb */}
              <rect x="20" y="40" width="20" height={40 + gutterDepth * 300} fill="hsl(var(--muted-foreground))" opacity="0.5" rx="2" />
              {/* Gutter depression zone */}
              {Sw > Sx && (
                <polygon
                  points={`40,80 40,${80 + gutterDepth * 300} ${40 + gutterW * 200},${80 + depth * 300}`}
                  fill="hsl(var(--primary))" opacity="0.15"
                />
              )}
              {/* Water spread */}
              {spread > 0 && (
                <polygon
                  points={`40,${80 + gutterDepth * 300} ${40 + Math.min(spread, 4) * 100},${80} 40,80`}
                  fill="hsl(var(--primary))" opacity="0.3"
                  stroke="hsl(var(--primary))" strokeWidth="1.5"
                />
              )}
              {/* Spread dimension line */}
              <line x1="40" y1="180" x2={40 + Math.min(spread, 4) * 100} y2="180"
                stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="4 2" />
              <text x={(40 + 40 + Math.min(spread, 4) * 100) / 2} y="195" textAnchor="middle"
                fontSize="11" fill="hsl(var(--primary))" fontWeight="bold">
                T = {spread.toFixed(2)} m
              </text>
              {/* Gutter width dimension */}
              <line x1="40" y1="210" x2={40 + gutterW * 200} y2="210"
                stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeDasharray="3 2" />
              <text x={40 + gutterW * 100} y="218" textAnchor="middle"
                fontSize="9" fill="hsl(var(--muted-foreground))">W = {gutterW.toFixed(1)}m</text>
              {/* Depth label */}
              <line x1="35" y1="80" x2="35" y2={80 + gutterDepth * 300}
                stroke="hsl(var(--accent))" strokeWidth="1" />
              <text x="15" y={(80 + 80 + gutterDepth * 300) / 2} textAnchor="middle"
                fontSize="9" fill="hsl(var(--accent))" transform={`rotate(-90, 15, ${(80 + 80 + gutterDepth * 300) / 2})`}>
                d = {(gutterDepth * 1000).toFixed(0)} mm
              </text>
              {/* Labels */}
              <text x="250" y="25" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">
                Sx = {Sx.toFixed(3)} | Sw = {Sw.toFixed(3)}
              </text>
              {/* Flow arrow */}
              <text x="420" y="70" fontSize="10" fill="hsl(var(--primary))">→ Flow</text>
            </svg>
          </CardContent>
        </Card>

        <Card className="card-water">
          <CardHeader><CardTitle className="text-sm">Results</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-secondary/30 rounded-lg p-3">
                <span className="text-xs text-muted-foreground block">Spread T</span>
                <span className="font-bold text-foreground">{spread.toFixed(3)} m</span>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3">
                <span className="text-xs text-muted-foreground block">Depth d</span>
                <span className="font-bold text-foreground">{(depth * 1000).toFixed(1)} mm</span>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3">
                <span className="text-xs text-muted-foreground block">Velocity V</span>
                <span className="font-bold text-foreground">{velocity.toFixed(2)} m/s</span>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3">
                <span className="text-xs text-muted-foreground block">Flow Area A</span>
                <span className="font-bold text-foreground">{flowArea.toFixed(4)} m²</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 italic">
              Based on FHWA HEC-22 methodology — Q = (0.376/n) × Sx^(5/3) × S^(1/2) × T^(8/3)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── INLET DESIGN ─────────────────────────────────────────
function InletDesign() {
  const [inletType, setInletType] = useState("grate");
  const [location, setLocation] = useState("on-grade");
  const [Q, setQ] = useState(0.1);
  const [slope, setSlope] = useState(0.02);
  const [Sx, setSx] = useState(0.025);
  const [grateLength, setGrateLength] = useState(0.9);
  const [grateWidth, setGrateWidth] = useState(0.6);
  const [clogging, setClogging] = useState(0);

  // Simplified inlet interception
  const results = useMemo(() => {
    const n = 0.016;
    const T = Math.pow((Q * n) / (0.376 * Math.pow(Sx, 5/3) * Math.pow(slope, 0.5)), 3/8);
    const V = T > 0 ? Q / (0.5 * T * T * Sx) : 0;
    const depth = T * Sx;

    if (inletType === "grate") {
      // Frontal flow ratio
      const Eo = grateWidth > 0 ? 1 - Math.pow(1 - grateWidth / Math.max(T, 0.01), 2.67) : 0;
      // Frontal flow interception
      const Vo = 0.9; // splash-over velocity approximation
      const Rf = V > Vo ? 1 - 0.09 * (V - Vo) : 1;
      // Side flow interception
      const Rs = 1 / (1 + 0.15 * Math.pow(V, 1.8) / (Sx * Math.pow(grateLength * (1 - clogging/100), 2.3)));
      const E = Math.min(Math.max(Rf * Eo + Rs * (1 - Eo), 0), 1);
      const Qi = E * Q;
      return { T, V, depth, E, Qi, bypass: Q - Qi, Eo, Rf, Rs, type: "Grate" as const };
    } else {
      // Curb-opening: LT = 0.6 Q^0.42 S^0.3 (1/(n*Sx))^0.6
      const LT = 0.6 * Math.pow(Q, 0.42) * Math.pow(slope, 0.3) * Math.pow(1/(n * Sx), 0.6);
      const Lc = grateLength; // using grateLength as curb length
      const E = Lc >= LT ? 1 : 1 - Math.pow(1 - Lc / LT, 1.8);
      const Qi = E * Q;
      return { T, V, depth, E, Qi, bypass: Q - Qi, LT, Lc, type: "Curb" as const };
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
                  {/* Street surface */}
                  <rect x="20" y="40" width="460" height="160" fill="hsl(var(--muted))" opacity="0.15" rx="4" />
                  {/* Curb */}
                  <rect x="20" y="40" width="15" height="160" fill="hsl(var(--muted-foreground))" opacity="0.4" rx="2" />
                  {/* Grate */}
                  <rect x="120" y="80" width={grateWidth * 150} height={grateLength * 80}
                    fill="hsl(var(--primary))" opacity="0.2" stroke="hsl(var(--primary))" strokeWidth="2" rx="3" />
                  {/* Grate bars */}
                  {Array.from({length: 6}, (_, i) => (
                    <line key={i} x1={120 + (i+1) * grateWidth * 150 / 7} y1="80"
                      x2={120 + (i+1) * grateWidth * 150 / 7} y2={80 + grateLength * 80}
                      stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.5" />
                  ))}
                  {/* Clogged area */}
                  {clogging > 0 && (
                    <rect x="120" y="80" width={grateWidth * 150 * clogging / 100} height={grateLength * 80}
                      fill="hsl(var(--destructive))" opacity="0.2" />
                  )}
                  {/* Flow arrows */}
                  {[60, 100, 140, 180].map((y, i) => (
                    <g key={i}>
                      <line x1="380" y1={y} x2="140" y2={y + 20} stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.4" />
                      <polygon points={`140,${y+20} 148,${y+16} 148,${y+24}`} fill="hsl(var(--primary))" opacity="0.4" />
                    </g>
                  ))}
                  {/* Labels */}
                  <text x={120 + grateWidth * 75} y={90 + grateLength * 80} textAnchor="middle"
                    fontSize="10" fill="hsl(var(--foreground))">{grateWidth.toFixed(1)}m × {grateLength.toFixed(1)}m</text>
                  <text x="250" y="230" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">
                    Plan view — flow approaches from right
                  </text>
                  {/* Efficiency label */}
                  <text x="400" y="230" textAnchor="middle" fontSize="12" fill="hsl(var(--primary))" fontWeight="bold">
                    E = {(results.E * 100).toFixed(0)}%
                  </text>
                </>
              ) : (
                <>
                  {/* Street cross-section with curb opening */}
                  <rect x="20" y="40" width="460" height="130" fill="hsl(var(--muted))" opacity="0.1" rx="4" />
                  {/* Road */}
                  <line x1="40" y1="100" x2="460" y2={100 + 360 * Sx} stroke="hsl(var(--foreground))" strokeWidth="3" />
                  {/* Curb */}
                  <rect x="20" y="60" width="20" height="60" fill="hsl(var(--muted-foreground))" opacity="0.5" rx="2" />
                  {/* Curb opening */}
                  <rect x="20" y="90" width="20" height={Math.min(grateLength * 15, 30)}
                    fill="hsl(var(--primary))" opacity="0.5" rx="1" />
                  {/* Water at curb */}
                  <polygon points={`40,100 40,${100 + results.depth * 500} ${40 + Math.min(results.T, 3) * 120},100`}
                    fill="hsl(var(--primary))" opacity="0.25" />
                  {/* Arrow into opening */}
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
            {/* Efficiency bar */}
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

// ─── PIPE FLOW ─────────────────────────────────────────
function PipeFlow() {
  const [method, setMethod] = useState("manning");
  const [diameter, setDiameter] = useState(0.6);
  const [slope, setSlope] = useState(0.005);
  const [roughness, setRoughness] = useState(0.013);
  const [depth, setDepth] = useState(0.3);

  const results = useMemo(() => {
    const r = diameter / 2;
    const dRatio = Math.min(depth / diameter, 0.99);
    // Circular geometry
    const theta = 2 * Math.acos(1 - 2 * dRatio); // central angle
    const A = (r * r / 2) * (theta - Math.sin(theta));
    const P = r * theta;
    const R = P > 0 ? A / P : 0;
    const Tw = diameter * Math.sin(theta / 2);

    let V = 0, Q = 0;
    if (method === "manning") {
      V = (1 / roughness) * Math.pow(R, 2/3) * Math.pow(slope, 0.5);
    } else if (method === "hazen-williams") {
      const C = 1 / roughness * 10; // approximate
      V = 0.849 * C * Math.pow(R, 0.63) * Math.pow(slope, 0.54);
    }
    Q = V * A;

    // Critical depth (approximate for circular)
    const yc = Math.pow(Q * Q / (9.81 * Tw * Tw * A), 1/3) || 0;
    const Fr = Tw > 0 ? V / Math.sqrt(9.81 * A / Tw) : 0;

    // Full pipe capacity
    const Afull = Math.PI * r * r;
    const Rfull = r / 2;
    const Vfull = (1 / roughness) * Math.pow(Rfull, 2/3) * Math.pow(slope, 0.5);
    const Qfull = Vfull * Afull;

    return { A, P, R, V, Q, Tw, yc, Fr, Qfull, percentFull: dRatio * 100, theta };
  }, [method, diameter, slope, roughness, depth]);

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
              {/* Pipe circle */}
              <circle cx="200" cy="140" r="100" fill="none" stroke="hsl(var(--foreground))" strokeWidth="3" />
              {/* Water fill (circular segment) */}
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
              {/* Water surface line */}
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
              {/* Diameter line */}
              <line x1="200" y1="40" x2="200" y2="240" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" strokeDasharray="4 2" />
              <text x="215" y="145" fontSize="10" fill="hsl(var(--muted-foreground))">D = {(diameter*1000).toFixed(0)}mm</text>
              {/* Depth label */}
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
              {/* Percent full */}
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

// ─── WEIR & ORIFICE ─────────────────────────────────────────
function WeirOrifice() {
  const [type, setType] = useState("rect-weir");
  const [headwater, setHeadwater] = useState(2.0);
  const [crest, setCrest] = useState(1.0);
  const [tailwater, setTailwater] = useState(0.5);
  const [length, setLength] = useState(3.0);
  const [Cd, setCd] = useState(1.84);
  const [angle, setAngle] = useState(90);
  const [orificeDia, setOrificeDia] = useState(0.5);

  const results = useMemo(() => {
    const H = Math.max(headwater - crest, 0);
    const Ht = Math.max(tailwater - crest, 0);
    const subRatio = Ht > 0 && H > 0 ? Ht / H : 0;
    const subFactor = subRatio > 0.67 ? Math.pow(1 - Math.pow(subRatio, 1.5), 0.385) : 1;

    let Q = 0, formula = "";
    if (type === "rect-weir") {
      Q = Cd * length * Math.pow(H, 1.5) * subFactor;
      formula = `Q = Cd × L × H^(3/2) = ${Cd} × ${length} × ${H.toFixed(2)}^1.5`;
    } else if (type === "v-notch") {
      const theta = angle * Math.PI / 180;
      Q = (8/15) * 0.58 * Math.sqrt(2 * 9.81) * Math.tan(theta/2) * Math.pow(H, 2.5) * subFactor;
      formula = `Q = (8/15)Cd√(2g)tan(θ/2)H^(5/2)`;
    } else if (type === "broad-crest") {
      Q = Cd * length * Math.pow(H, 1.5) * subFactor;
      formula = `Q = Cd × L × H^(3/2)`;
    } else if (type === "orifice") {
      const Ao = Math.PI * orificeDia * orificeDia / 4;
      const Heff = headwater - (crest - orificeDia/2);
      Q = 0.61 * Ao * Math.sqrt(2 * 9.81 * Math.max(Heff, 0));
      formula = `Q = Cd × A × √(2gH)`;
    }

    const A = type === "orifice" ? Math.PI * orificeDia * orificeDia / 4 : length * H;
    const V = A > 0 ? Q / A : 0;
    return { Q, H, Ht, subRatio, subFactor, V, A, formula };
  }, [type, headwater, crest, tailwater, length, Cd, angle, orificeDia]);

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
              {/* Channel bed */}
              <rect x="0" y="220" width="500" height="60" fill="hsl(var(--muted))" opacity="0.2" />
              <line x1="0" y1="220" x2="500" y2="220" stroke="hsl(var(--foreground))" strokeWidth="2" />
              {/* Weir/wall */}
              <rect x="220" y={220 - crest * 40} width={type === "broad-crest" ? 60 : 15} height={crest * 40}
                fill="hsl(var(--foreground))" opacity="0.6" rx="2" />
              {/* Headwater */}
              <rect x="0" y={220 - headwater * 40} width="220" height={headwater * 40}
                fill="hsl(var(--primary))" opacity="0.2" />
              <line x1="0" y1={220 - headwater * 40} x2="220" y2={220 - headwater * 40}
                stroke="hsl(var(--primary))" strokeWidth="2" />
              {/* Tailwater */}
              <rect x={type === "broad-crest" ? 280 : 235} y={220 - tailwater * 40}
                width={type === "broad-crest" ? 220 : 265} height={tailwater * 40}
                fill="hsl(var(--primary))" opacity="0.15" />
              <line x1={type === "broad-crest" ? 280 : 235} y1={220 - tailwater * 40}
                x2="500" y2={220 - tailwater * 40}
                stroke="hsl(var(--primary))" strokeWidth="1.5" strokeDasharray="4 2" />
              {/* H dimension */}
              <line x1="200" y1={220 - headwater * 40} x2="200" y2={220 - crest * 40}
                stroke="hsl(var(--accent))" strokeWidth="1.5" />
              <text x="185" y={(220 - headwater * 40 + 220 - crest * 40) / 2}
                textAnchor="end" fontSize="10" fill="hsl(var(--accent))">
                H = {results.H.toFixed(2)} m
              </text>
              {/* Flow arrow */}
              {results.Q > 0 && (
                <>
                  <path d={`M210,${220 - crest * 40 - 5} Q230,${220 - crest * 40 - 20} 260,${220 - crest * 40 + 15}`}
                    fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
                  <text x="280" y={220 - crest * 40 + 10} fontSize="10" fill="hsl(var(--primary))" fontWeight="bold">
                    Q = {results.Q.toFixed(3)}
                  </text>
                </>
              )}
              {/* Labels */}
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

// ─── WATER HAMMER ─────────────────────────────────────────
function WaterHammer() {
  const [pipeLength, setPipeLength] = useState(500);
  const [diameter, setDiameter] = useState(0.5);
  const [thickness, setThickness] = useState(0.01);
  const [V0, setV0] = useState(2.0);
  const [closureTime, setClosureTime] = useState(3.0);
  const [Kw, setKw] = useState(2.2e9); // water bulk modulus
  const [Ep, setEp] = useState(200e9); // pipe elasticity (steel)

  const results = useMemo(() => {
    // Wave speed: a = sqrt(Kw/ρ / (1 + Kw*D/(Ep*e)))
    const rho = 998;
    const a = Math.sqrt((Kw / rho) / (1 + (Kw * diameter) / (Ep * thickness)));
    // Critical time
    const tc = 2 * pipeLength / a;
    const isRapid = closureTime < tc;
    // Joukowski pressure rise
    const dP = isRapid ? rho * a * V0 : rho * a * V0 * (tc / closureTime);
    const dH = dP / (rho * 9.81);

    return { a, tc, isRapid, dP, dH, dPbar: dP / 1e5 };
  }, [pipeLength, diameter, thickness, V0, closureTime, Kw, Ep]);

  const pipeMaterial = Ep > 100e9 ? "Steel" : Ep > 2e9 ? "Cast Iron" : "PVC";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="card-water">
        <CardHeader><CardTitle className="text-lg">Water Hammer (Transient Flow)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Pipe Length L: <strong>{pipeLength} m</strong></label>
            <Slider min={50} max={5000} step={50} value={[pipeLength]} onValueChange={([v]) => setPipeLength(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Diameter D: <strong>{(diameter*1000).toFixed(0)} mm</strong></label>
            <Slider min={0.1} max={2.0} step={0.05} value={[diameter]} onValueChange={([v]) => setDiameter(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Wall Thickness e: <strong>{(thickness*1000).toFixed(1)} mm</strong></label>
            <Slider min={0.003} max={0.05} step={0.001} value={[thickness]} onValueChange={([v]) => setThickness(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Initial Velocity V₀: <strong>{V0.toFixed(1)} m/s</strong></label>
            <Slider min={0.5} max={6.0} step={0.1} value={[V0]} onValueChange={([v]) => setV0(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Valve Closure Time: <strong>{closureTime.toFixed(1)} s</strong></label>
            <Slider min={0.1} max={30.0} step={0.1} value={[closureTime]} onValueChange={([v]) => setClosureTime(v)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Pipe Material (Ep)</label>
            <Select value={Ep.toString()} onValueChange={v => setEp(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="200000000000">Steel (200 GPa)</SelectItem>
                <SelectItem value="100000000000">Cast Iron (100 GPa)</SelectItem>
                <SelectItem value="3000000000">PVC (3 GPa)</SelectItem>
                <SelectItem value="1000000000">HDPE (1 GPa)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Pressure Wave Diagram</CardTitle></CardHeader>
          <CardContent>
            <svg viewBox="0 0 500 250" className="w-full">
              {/* Pipe */}
              <rect x="40" y="80" width="420" height="40" fill="hsl(var(--muted))" opacity="0.2"
                stroke="hsl(var(--foreground))" strokeWidth="2" rx="4" />
              {/* Water inside */}
              <rect x="42" y="82" width="416" height="36" fill="hsl(var(--primary))" opacity="0.2" rx="3" />
              {/* Valve at right */}
              <rect x="455" y="70" width="15" height="60" fill="hsl(var(--destructive))" opacity="0.6" rx="2" />
              <text x="462" y="68" textAnchor="middle" fontSize="9" fill="hsl(var(--destructive))">Valve</text>
              {/* Pressure wave */}
              {results.isRapid ? (
                <path d={`M455,100 L${455 - (closureTime / results.tc) * 400},100`}
                  stroke="hsl(var(--destructive))" strokeWidth="3" strokeDasharray="6 3" />
              ) : (
                <path d={`M455,100 L45,100`}
                  stroke="hsl(var(--accent))" strokeWidth="2" strokeDasharray="8 4" />
              )}
              {/* Pressure profile above pipe */}
              <rect x="40" y={80 - Math.min(results.dH * 0.5, 50)} width="420" height={Math.min(results.dH * 0.5, 50)}
                fill={results.isRapid ? "hsl(var(--destructive))" : "hsl(var(--accent))"} opacity="0.15" rx="3" />
              <text x="250" y={75 - Math.min(results.dH * 0.5, 50)} textAnchor="middle"
                fontSize="11" fill={results.isRapid ? "hsl(var(--destructive))" : "hsl(var(--accent))"} fontWeight="bold">
                ΔP = {results.dPbar.toFixed(1)} bar ({results.dH.toFixed(1)} m head)
              </text>
              {/* Flow arrow */}
              <line x1="80" y1="100" x2="400" y2="100" stroke="hsl(var(--primary))" strokeWidth="1.5" />
              <polygon points="400,100 392,95 392,105" fill="hsl(var(--primary))" />
              <text x="240" y="112" textAnchor="middle" fontSize="9" fill="hsl(var(--primary))">V₀ = {V0} m/s →</text>
              {/* Info */}
              <text x="250" y="165" textAnchor="middle" fontSize="10" fill="hsl(var(--foreground))">
                L = {pipeLength}m | D = {(diameter*1000).toFixed(0)}mm | {pipeMaterial}
              </text>
              <text x="250" y="185" textAnchor="middle" fontSize="10"
                fill={results.isRapid ? "hsl(var(--destructive))" : "hsl(var(--accent))"} fontWeight="bold">
                {results.isRapid ? "⚠ RAPID closure (tc < 2L/a)" : "✓ Slow closure (tc > 2L/a)"}
              </text>
              {/* Timeline */}
              <line x1="40" y1="210" x2="460" y2="210" stroke="hsl(var(--border))" strokeWidth="1" />
              <circle cx="40" cy="210" r="3" fill="hsl(var(--foreground))" />
              <text x="40" y="228" textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">t=0</text>
              {/* tc marker */}
              {(() => {
                const tcX = 40 + Math.min(results.tc / Math.max(closureTime * 1.5, results.tc * 1.5), 1) * 420;
                const tvX = 40 + Math.min(closureTime / Math.max(closureTime * 1.5, results.tc * 1.5), 1) * 420;
                return (
                  <>
                    <circle cx={tcX} cy="210" r="3" fill="hsl(var(--accent))" />
                    <text x={tcX} y="228" textAnchor="middle" fontSize="8" fill="hsl(var(--accent))">tc={results.tc.toFixed(1)}s</text>
                    <circle cx={tvX} cy="210" r="3" fill="hsl(var(--destructive))" />
                    <text x={tvX} y="243" textAnchor="middle" fontSize="8" fill="hsl(var(--destructive))">tv={closureTime.toFixed(1)}s</text>
                  </>
                );
              })()}
            </svg>
          </CardContent>
        </Card>

        <Card className="card-water">
          <CardHeader><CardTitle className="text-sm">Joukowski Results</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-secondary/30 rounded-lg p-3">
                <span className="text-xs text-muted-foreground block">Wave Speed a</span>
                <span className="font-bold text-foreground">{results.a.toFixed(0)} m/s</span>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3">
                <span className="text-xs text-muted-foreground block">Critical Time tc</span>
                <span className="font-bold text-foreground">{results.tc.toFixed(2)} s</span>
              </div>
              <div className={`rounded-lg p-3 ${results.isRapid ? "bg-destructive/10" : "bg-secondary/30"}`}>
                <span className="text-xs text-muted-foreground block">Pressure Rise ΔP</span>
                <span className={`font-bold ${results.isRapid ? "text-destructive" : "text-foreground"}`}>
                  {results.dPbar.toFixed(1)} bar
                </span>
              </div>
              <div className={`rounded-lg p-3 ${results.isRapid ? "bg-destructive/10" : "bg-secondary/30"}`}>
                <span className="text-xs text-muted-foreground block">Head Rise ΔH</span>
                <span className={`font-bold ${results.isRapid ? "text-destructive" : "text-foreground"}`}>
                  {results.dH.toFixed(1)} m
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 font-mono">
              ΔP = ρaV₀{!results.isRapid ? " × (tc/tv)" : ""} — Joukowski (1898)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── PUMP CURVES ─────────────────────────────────────────
function PumpCurves() {
  const [Qrated, setQrated] = useState(0.1);
  const [Hrated, setHrated] = useState(30);
  const [Hshutoff, setHshutoff] = useState(40);
  const [N, setN] = useState(1750);
  const [N2, setN2] = useState(1500);

  // Generate pump curve points (parabolic approximation)
  const pumpCurve = useMemo(() => {
    const points: { Q: number; H: number; eff: number; P: number }[] = [];
    for (let i = 0; i <= 20; i++) {
      const q = (i / 20) * Qrated * 1.4;
      const qr = q / Qrated;
      const H = Hshutoff - (Hshutoff - Hrated) * qr * qr;
      const eff = qr > 0 ? Math.max(4 * qr * (1 - 0.5 * qr) * 0.82, 0) : 0;
      const P = q > 0 ? (998 * 9.81 * q * H) / (eff > 0 ? eff : 0.01) / 1000 : 0;
      points.push({ Q: q, H: Math.max(H, 0), eff, P });
    }
    return points;
  }, [Qrated, Hrated, Hshutoff]);

  // Affinity law curve at N2
  const affinityCurve = useMemo(() => {
    const ratio = N2 / N;
    return pumpCurve.map(p => ({
      Q: p.Q * ratio,
      H: p.H * ratio * ratio,
      eff: p.eff,
      P: p.P * ratio * ratio * ratio,
    }));
  }, [pumpCurve, N, N2]);

  // Specific speed
  const Ns = N * Math.sqrt(Qrated * 1000) / Math.pow(Hrated, 0.75);

  const maxQ = Qrated * 1.5;
  const maxH = Hshutoff * 1.2;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="card-water">
        <CardHeader><CardTitle className="text-lg">Pump Characteristic Curves</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Rated Discharge Q: <strong>{(Qrated * 1000).toFixed(0)} L/s</strong></label>
            <Slider min={0.01} max={0.5} step={0.01} value={[Qrated]} onValueChange={([v]) => setQrated(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Rated Head H: <strong>{Hrated} m</strong></label>
            <Slider min={5} max={80} step={1} value={[Hrated]} onValueChange={([v]) => setHrated(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Shutoff Head H₀: <strong>{Hshutoff} m</strong></label>
            <Slider min={Hrated * 1.05} max={Hrated * 2} step={1} value={[Hshutoff]} onValueChange={([v]) => setHshutoff(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Speed N₁: <strong>{N} RPM</strong></label>
            <Slider min={500} max={3600} step={50} value={[N]} onValueChange={([v]) => setN(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Affinity Speed N₂: <strong>{N2} RPM</strong></label>
            <Slider min={500} max={3600} step={50} value={[N2]} onValueChange={([v]) => setN2(v)} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-secondary/30 rounded-lg p-2">
              <span className="text-xs text-muted-foreground block">Specific Speed Ns</span>
              <span className="font-bold">{Ns.toFixed(0)}</span>
            </div>
            <div className="bg-secondary/30 rounded-lg p-2">
              <span className="text-xs text-muted-foreground block">Pump Type</span>
              <span className="font-bold text-xs">{Ns < 2000 ? "Radial" : Ns < 5000 ? "Mixed" : "Axial"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-water">
        <CardHeader><CardTitle className="text-lg">H-Q Curve & Affinity Laws</CardTitle></CardHeader>
        <CardContent>
          <svg viewBox="0 0 500 350" className="w-full">
            {/* Axes */}
            <line x1="60" y1="20" x2="60" y2="280" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
            <line x1="60" y1="280" x2="480" y2="280" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
            <text x="30" y="150" textAnchor="middle" fontSize="10" fill="hsl(var(--foreground))"
              transform="rotate(-90, 30, 150)">Head (m)</text>
            <text x="270" y="300" textAnchor="middle" fontSize="10" fill="hsl(var(--foreground))">Discharge (L/s)</text>

            {/* Grid */}
            {[0.25, 0.5, 0.75, 1.0].map(f => (
              <line key={f} x1="60" y1={280 - f * 250} x2="480" y2={280 - f * 250}
                stroke="hsl(var(--border))" strokeWidth="0.5" />
            ))}

            {/* Pump curve at N1 */}
            <polyline
              points={pumpCurve.map(p => `${60 + (p.Q / maxQ) * 410},${280 - (p.H / maxH) * 250}`).join(" ")}
              fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5"
            />
            <text x="350" y={280 - (pumpCurve[10].H / maxH) * 250 - 8}
              fontSize="9" fill="hsl(var(--primary))" fontWeight="bold">N₁ = {N} RPM</text>

            {/* Affinity curve at N2 */}
            <polyline
              points={affinityCurve.map(p => `${60 + (p.Q / maxQ) * 410},${280 - (p.H / maxH) * 250}`).join(" ")}
              fill="none" stroke="hsl(var(--accent))" strokeWidth="2" strokeDasharray="6 3"
            />
            <text x="250" y={280 - (affinityCurve[10].H / maxH) * 250 - 8}
              fontSize="9" fill="hsl(var(--accent))" fontWeight="bold">N₂ = {N2} RPM</text>

            {/* Efficiency curve (secondary axis on right) */}
            <polyline
              points={pumpCurve.map(p => `${60 + (p.Q / maxQ) * 410},${280 - p.eff * 250}`).join(" ")}
              fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" strokeDasharray="3 2"
            />
            <text x="460" y="25" textAnchor="end" fontSize="9" fill="hsl(var(--muted-foreground))">η (%)</text>

            {/* BEP marker */}
            {(() => {
              const bep = pumpCurve.reduce((best, p) => p.eff > best.eff ? p : best, pumpCurve[0]);
              const x = 60 + (bep.Q / maxQ) * 410;
              const y = 280 - (bep.H / maxH) * 250;
              return (
                <>
                  <circle cx={x} cy={y} r="5" fill="hsl(var(--primary))" />
                  <text x={x + 8} y={y - 5} fontSize="9" fill="hsl(var(--primary))">
                    BEP η={Math.round(bep.eff * 100)}%
                  </text>
                </>
              );
            })()}

            {/* Axis labels */}
            {[0, 0.25, 0.5, 0.75, 1.0].map(f => (
              <text key={f} x="55" y={283 - f * 250} textAnchor="end" fontSize="8" fill="hsl(var(--muted-foreground))">
                {(f * maxH).toFixed(0)}
              </text>
            ))}
            {[0, 0.25, 0.5, 0.75, 1.0].map(f => (
              <text key={f} x={60 + f * 410} y="295" textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">
                {(f * maxQ * 1000).toFixed(0)}
              </text>
            ))}

            {/* Affinity law box */}
            <rect x="310" y="310" width="170" height="35" fill="hsl(var(--secondary))" rx="4" opacity="0.5" />
            <text x="395" y="325" textAnchor="middle" fontSize="8" fill="hsl(var(--foreground))">
              Q₂/Q₁ = N₂/N₁ = {(N2/N).toFixed(2)}
            </text>
            <text x="395" y="340" textAnchor="middle" fontSize="8" fill="hsl(var(--foreground))">
              H₂/H₁ = (N₂/N₁)² = {(N2*N2/(N*N)).toFixed(2)}
            </text>
          </svg>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── MAIN SWMM CALCULATOR ─────────────────────────────────────────
const SWMMCalculator = ({ onClose }: Props) => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={onClose} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">SWMM Urban Hydraulics Suite</h1>
      <p className="text-muted-foreground mb-6">
        Stormwater management calculators with interactive diagrams — gutters, inlets, pipes, weirs, water hammer, and pumps.
        <a href="https://ponce.sdsu.edu/" target="_blank" rel="noopener noreferrer" className="text-primary ml-2 inline-flex items-center gap-1">
          Ponce Reference <ExternalLink className="w-3 h-3" />
        </a>
      </p>

      <Tabs defaultValue="gutter" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 mb-6">
          <TabsTrigger value="gutter" className="text-xs">Gutter Flow</TabsTrigger>
          <TabsTrigger value="inlet" className="text-xs">Inlet Design</TabsTrigger>
          <TabsTrigger value="pipe" className="text-xs">Pipe Flow</TabsTrigger>
          <TabsTrigger value="weir" className="text-xs">Weirs & Orifices</TabsTrigger>
          <TabsTrigger value="hammer" className="text-xs">Water Hammer</TabsTrigger>
          <TabsTrigger value="pump" className="text-xs">Pump Curves</TabsTrigger>
        </TabsList>

        <TabsContent value="gutter"><GutterFlow /></TabsContent>
        <TabsContent value="inlet"><InletDesign /></TabsContent>
        <TabsContent value="pipe"><PipeFlow /></TabsContent>
        <TabsContent value="weir"><WeirOrifice /></TabsContent>
        <TabsContent value="hammer"><WaterHammer /></TabsContent>
        <TabsContent value="pump"><PumpCurves /></TabsContent>
      </Tabs>

      <div className="mt-8 pt-4 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">
          Inspired by H₂OCalc methodology (MWH Soft) — Prof. Victor Miguel Ponce, SDSU
          <br /><a href="https://ponce.sdsu.edu/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ponce.sdsu.edu</a>
        </p>
      </div>
    </div>
  );
};

export default SWMMCalculator;
