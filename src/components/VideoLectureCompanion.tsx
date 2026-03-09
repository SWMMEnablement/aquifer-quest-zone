import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ExternalLink, Play, Pause, SkipBack, SkipForward, BookOpen, ChevronRight, Link } from "lucide-react";

interface Props { onClose: () => void; }

interface DiagramState {
  timestamp: number;
  label: string;
  description: string;
  highlights: string[];
  equation?: string;
  parameters?: Record<string, number>;
}

interface Lecture {
  id: string;
  title: string;
  source: string;
  duration: number; // seconds
  description: string;
  ponceUrl: string;
  diagramType: "aquifer" | "flood-routing" | "water-balance" | "energy-balance";
  states: DiagramState[];
  notes: { time: number; text: string }[];
}

const LECTURES: Lecture[] = [
  {
    id: "gw-sustainability",
    title: "Groundwater Utilization and Sustainability",
    source: "Prof. Victor Miguel Ponce — SDSU",
    duration: 3780,
    description: "How pumping affects aquifer levels and ecosystem health over time.",
    ponceUrl: "https://ponce.sdsu.edu/groundwater_utilization_and_sustainability.html",
    diagramType: "aquifer",
    states: [
      { timestamp: 0, label: "Introduction", description: "Natural aquifer system in equilibrium. Recharge equals natural discharge.", highlights: ["recharge", "natural-discharge"], parameters: { pumpingRate: 0, waterTable: 100, ecosystemHealth: 100 } },
      { timestamp: 300, label: "Natural Recharge", description: "Precipitation infiltrates through soil, percolates to water table. Recharge zone shown.", highlights: ["recharge", "infiltration"], equation: "R = P × φ", parameters: { pumpingRate: 0, waterTable: 100, ecosystemHealth: 100 } },
      { timestamp: 600, label: "Pumping Begins", description: "Wells installed. Initial pumping at moderate rate. Cone of depression forms.", highlights: ["wells", "cone-depression"], parameters: { pumpingRate: 30, waterTable: 92, ecosystemHealth: 95 } },
      { timestamp: 900, label: "Capture Concept", description: "Pumping derives water from: increased recharge, decreased natural discharge, storage depletion.", highlights: ["capture-sources"], equation: "Pumping = ΔRecharge + ΔDischarge + ΔStorage", parameters: { pumpingRate: 50, waterTable: 85, ecosystemHealth: 85 } },
      { timestamp: 1200, label: "Safe Yield vs Sustainable Yield", description: "Safe yield = recharge. Sustainable yield < safe yield because ecosystems need water too.", highlights: ["safe-yield", "sustainable-yield"], parameters: { pumpingRate: 60, waterTable: 78, ecosystemHealth: 70 } },
      { timestamp: 1800, label: "Ecosystem Decline", description: "Water table drops below root zone. Phreatophytes begin to stress. Baseflow to streams decreases.", highlights: ["root-zone", "baseflow-decline"], parameters: { pumpingRate: 70, waterTable: 65, ecosystemHealth: 45 } },
      { timestamp: 2400, label: "Over-Pumping", description: "Pumping exceeds sustainable yield. Aquifer mining begins. Storage depletes.", highlights: ["mining", "storage-depletion"], parameters: { pumpingRate: 90, waterTable: 45, ecosystemHealth: 20 } },
      { timestamp: 3000, label: "Recovery Scenario", description: "Reduced pumping allows slow recovery. But ecosystem damage may be irreversible.", highlights: ["recovery"], parameters: { pumpingRate: 30, waterTable: 55, ecosystemHealth: 30 } },
      { timestamp: 3600, label: "Sustainability Principles", description: "Key insight: sustainable yield considers both human needs and ecosystem requirements.", highlights: ["balance"], parameters: { pumpingRate: 40, waterTable: 75, ecosystemHealth: 70 } },
    ],
    notes: [
      { time: 0, text: "Natural system: Recharge = Natural Discharge" },
      { time: 600, text: "Pumping creates cone of depression" },
      { time: 900, text: "Capture = ΔR + ΔD + ΔS (Theis, 1940)" },
      { time: 1200, text: "Sustainable yield < Safe yield (Ponce)" },
      { time: 1800, text: "Root zone threshold: vegetation stress begins" },
      { time: 3600, text: "Balance human use with ecosystem needs" },
    ],
  },
  {
    id: "water-balance",
    title: "Water Balance Using Catchment Wetting",
    source: "Prof. Victor Miguel Ponce — SDSU",
    duration: 2400,
    description: "Catchment wetting method for estimating water balance components.",
    ponceUrl: "https://ponce.sdsu.edu/water_balance_catchment_wetting.html",
    diagramType: "water-balance",
    states: [
      { timestamp: 0, label: "The Water Balance", description: "Fundamental equation: P = ET + Qs + Qb + ΔS", highlights: ["equation"], equation: "P = ET + Qs + Qb + ΔS", parameters: { P: 800, ET: 500, Qs: 150, Qb: 150 } },
      { timestamp: 300, label: "Catchment Wetting", description: "W = P - Qs. Wetting is the water that enters the ground.", highlights: ["wetting"], equation: "W = P - Qs", parameters: { P: 800, ET: 500, Qs: 150, Qb: 150 } },
      { timestamp: 600, label: "ET Component", description: "Evapotranspiration returns water to atmosphere. ET ≈ 60-70% of P in many catchments.", highlights: ["et"], parameters: { P: 800, ET: 500, Qs: 150, Qb: 150 } },
      { timestamp: 900, label: "Recharge", description: "R = W - ET. What's left after ET is groundwater recharge.", highlights: ["recharge"], equation: "R = W - ET", parameters: { P: 800, ET: 500, Qs: 150, Qb: 150 } },
      { timestamp: 1200, label: "Baseflow Coefficient", description: "φ = Qb/W relates baseflow to catchment wetting.", highlights: ["baseflow-coeff"], equation: "φ = Qb/W", parameters: { P: 800, ET: 500, Qs: 150, Qb: 150 } },
      { timestamp: 1800, label: "Climate Sensitivity", description: "Drier climates: higher ET/P ratio, lower recharge efficiency.", highlights: ["climate"], parameters: { P: 400, ET: 340, Qs: 30, Qb: 30 } },
      { timestamp: 2200, label: "Summary", description: "The wetting method provides a simple, physically-based framework for water balance.", highlights: ["summary"], parameters: { P: 800, ET: 500, Qs: 150, Qb: 150 } },
    ],
    notes: [
      { time: 0, text: "P = ET + Qs + Qb + ΔS" },
      { time: 300, text: "Catchment wetting: W = P - Qs" },
      { time: 900, text: "Recharge: R = W - ET" },
      { time: 1200, text: "Baseflow coefficient: φ = Qb/W" },
    ],
  },
  {
    id: "muskingum-explained",
    title: "Muskingum-Cunge Method Explained",
    source: "Prof. Victor Miguel Ponce — SDSU",
    duration: 3000,
    description: "How the Muskingum-Cunge method routes floods through channel reaches.",
    ponceUrl: "https://ponce.sdsu.edu/muskingum_cunge_method_explained.html",
    diagramType: "flood-routing",
    states: [
      { timestamp: 0, label: "Flood Wave Enters", description: "An inflow hydrograph enters the upstream end of a channel reach.", highlights: ["inflow"], parameters: { progress: 0, attenuation: 0 } },
      { timestamp: 300, label: "Storage Equation", description: "S = K[XI + (1-X)O] — storage is a weighted average of inflow and outflow.", highlights: ["storage"], equation: "S = K[XI + (1-X)O]", parameters: { progress: 10, attenuation: 2 } },
      { timestamp: 600, label: "Wave Celerity", description: "c = (1/T)(dQ/dy) — speed at which the flood wave translates downstream.", highlights: ["celerity"], equation: "c = (1/T)(dQ/dy)", parameters: { progress: 25, attenuation: 5 } },
      { timestamp: 900, label: "Hydraulic Diffusivity", description: "ν = Q/(2TS₀) — controls how much the wave attenuates.", highlights: ["diffusivity"], equation: "ν = Q/(2TS₀)", parameters: { progress: 40, attenuation: 8 } },
      { timestamp: 1200, label: "Routing Coefficients", description: "C₁, C₂, C₃ computed from K and X. Must sum to 1.", highlights: ["coefficients"], equation: "C₁ + C₂ + C₃ = 1", parameters: { progress: 55, attenuation: 10 } },
      { timestamp: 1800, label: "Peak Attenuation", description: "Flood peak reduces as wave propagates. Amount depends on ν and reach length.", highlights: ["attenuation"], parameters: { progress: 75, attenuation: 12 } },
      { timestamp: 2400, label: "Grid Independence", description: "Muskingum-Cunge matches analytical diffusion solution when Courant ≈ 1.", highlights: ["grid-independence"], equation: "Courant C = cΔt/Δx ≈ 1", parameters: { progress: 90, attenuation: 12 } },
      { timestamp: 2800, label: "Outflow Emerges", description: "Routed hydrograph: attenuated, lagged, but same volume as inflow.", highlights: ["outflow"], parameters: { progress: 100, attenuation: 12 } },
    ],
    notes: [
      { time: 0, text: "Flood wave enters upstream" },
      { time: 300, text: "Muskingum storage equation" },
      { time: 600, text: "Wave celerity from rating curve" },
      { time: 900, text: "Diffusivity controls attenuation" },
      { time: 2400, text: "Grid independence at Courant ≈ 1" },
    ],
  },
];

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// Diagram renderers
function AquiferDiagram({ params }: { params: Record<string, number> }) {
  const wt = params.waterTable ?? 100;
  const pump = params.pumpingRate ?? 0;
  const health = params.ecosystemHealth ?? 100;
  const wtY = 40 + (100 - wt) * 1.2;
  const treeColor = health > 70 ? "#22c55e" : health > 40 ? "#eab308" : "#dc2626";
  return (
    <svg viewBox="0 0 500 250" className="w-full">
      {/* Sky */}
      <rect x="0" y="0" width="500" height="60" fill="hsl(var(--secondary))" />
      {/* Rain */}
      {[50,120,200,300,400].map((x,i) => <line key={i} x1={x} y1={5+i*3} x2={x-3} y2={15+i*3} stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.4" />)}
      {/* Ground surface */}
      <rect x="0" y="60" width="500" height="190" fill="hsl(var(--muted))" opacity="0.3" />
      <line x1="0" y1="60" x2="500" y2="60" stroke="hsl(var(--foreground))" strokeWidth="2" />
      {/* Trees */}
      {[60,130,200,350,420].map((x,i) => (
        <g key={i}>
          <rect x={x-2} y="42" width="4" height="18" fill="#8B4513" />
          <circle cx={x} cy="38" r={10} fill={treeColor} opacity="0.8" />
        </g>
      ))}
      {/* Water table */}
      <path d={`M0,${wtY} Q100,${wtY-3} 200,${wtY} Q300,${pump > 40 ? wtY+15 : wtY+3} 350,${pump > 40 ? wtY+20 : wtY} Q400,${pump > 40 ? wtY+3 : wtY-2} 500,${wtY}`}
        fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="6 3" />
      <text x="10" y={wtY - 5} fontSize="9" fill="hsl(var(--primary))">Water Table</text>
      {/* Saturated zone */}
      <rect x="0" y={wtY} width="500" height={250 - wtY} fill="hsl(var(--primary))" opacity="0.15" />
      {/* Wells */}
      {pump > 0 && [280, 320].map((x, i) => (
        <g key={i}>
          <rect x={x-2} y="55" width="4" height={wtY - 50} fill="hsl(var(--foreground))" opacity="0.6" />
          <text x={x} y="52" textAnchor="middle" fontSize="8" fill="hsl(var(--foreground))">⬆</text>
        </g>
      ))}
      {/* Labels */}
      <text x="250" y="230" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">
        Pumping: {pump}% | Water Table: {wt}% | Ecosystem: {health}%
      </text>
      {/* Health bar */}
      <rect x="150" y="240" width="200" height="6" rx="3" fill="hsl(var(--muted))" />
      <rect x="150" y="240" width={health * 2} height="6" rx="3" fill={treeColor} />
    </svg>
  );
}

function FloodRoutingDiagram({ params }: { params: Record<string, number> }) {
  const progress = params.progress ?? 0;
  const atten = params.attenuation ?? 0;
  return (
    <svg viewBox="0 0 500 200" className="w-full">
      <rect x="0" y="160" width="500" height="40" fill="hsl(var(--muted))" opacity="0.3" />
      {/* Channel */}
      <line x1="30" y1="160" x2="470" y2="160" stroke="hsl(var(--foreground))" strokeWidth="2" />
      {/* Inflow hydrograph */}
      <path d="M30,160 Q60,160 80,120 Q100,80 120,60 Q140,80 160,120 Q180,150 200,160" fill="hsl(var(--primary))" opacity="0.3" stroke="hsl(var(--primary))" strokeWidth="2" />
      <text x="115" y="50" textAnchor="middle" fontSize="10" fill="hsl(var(--primary))" fontWeight="bold">Inflow</text>
      {/* Outflow hydrograph (shifted + attenuated) */}
      {progress > 20 && (
        <>
          <path d={`M${150 + progress * 2},160 Q${170 + progress * 2},160 ${190 + progress * 2},${130 + atten * 0.5} Q${210 + progress * 2},${90 + atten} ${230 + progress * 2},${75 + atten} Q${250 + progress * 2},${90 + atten} ${270 + progress * 2},${130 + atten * 0.5} Q${290 + progress * 2},155 ${310 + progress * 2},160`}
            fill="hsl(var(--accent))" opacity="0.3" stroke="hsl(var(--accent))" strokeWidth="2" />
          <text x={230 + progress * 2} y={65 + atten} textAnchor="middle" fontSize="10" fill="hsl(var(--accent))" fontWeight="bold">Outflow</text>
        </>
      )}
      {/* Progress arrow */}
      <line x1="30" y1="175" x2={30 + progress * 4.4} y2="175" stroke="hsl(var(--primary))" strokeWidth="3" markerEnd="url(#arrowhead)" />
      <text x="250" y="195" textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">
        Progress: {progress}% | Peak attenuation: {atten}%
      </text>
    </svg>
  );
}

function WaterBalanceDiagram({ params }: { params: Record<string, number> }) {
  const { P = 800, ET = 500, Qs = 150, Qb = 150 } = params;
  const total = P || 1;
  return (
    <svg viewBox="0 0 500 220" className="w-full">
      {/* P bar */}
      <rect x="50" y="20" width={P / 4} height="25" fill="hsl(var(--primary))" opacity="0.7" rx="3" />
      <text x="40" y="37" textAnchor="end" fontSize="10" fill="hsl(var(--foreground))">P</text>
      <text x={55 + P/4} y="37" fontSize="9" fill="hsl(var(--muted-foreground))">{P} mm</text>
      {/* = sign */}
      <text x="250" y="70" textAnchor="middle" fontSize="14" fill="hsl(var(--foreground))" fontWeight="bold">=</text>
      {/* ET bar */}
      <rect x="50" y="85" width={ET / 4} height="20" fill="#f97316" opacity="0.7" rx="3" />
      <text x="40" y="99" textAnchor="end" fontSize="10" fill="hsl(var(--foreground))">ET</text>
      <text x={55 + ET/4} y="99" fontSize="9" fill="hsl(var(--muted-foreground))">{ET} mm ({(ET/total*100).toFixed(0)}%)</text>
      {/* + */}
      <text x="40" y="125" textAnchor="end" fontSize="12" fill="hsl(var(--foreground))">+</text>
      {/* Qs bar */}
      <rect x="50" y="115" width={Qs / 4} height="20" fill="#0ea5e9" opacity="0.7" rx="3" />
      <text x="40" y="129" textAnchor="end" fontSize="10" fill="hsl(var(--foreground))">Qs</text>
      <text x={55 + Qs/4} y="129" fontSize="9" fill="hsl(var(--muted-foreground))">{Qs} mm ({(Qs/total*100).toFixed(0)}%)</text>
      {/* + */}
      <text x="40" y="155" textAnchor="end" fontSize="12" fill="hsl(var(--foreground))">+</text>
      {/* Qb bar */}
      <rect x="50" y="145" width={Qb / 4} height="20" fill="#3b82f6" opacity="0.7" rx="3" />
      <text x="40" y="159" textAnchor="end" fontSize="10" fill="hsl(var(--foreground))">Qb</text>
      <text x={55 + Qb/4} y="159" fontSize="9" fill="hsl(var(--muted-foreground))">{Qb} mm ({(Qb/total*100).toFixed(0)}%)</text>
      {/* Wetting */}
      <text x="250" y="200" textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">W = P - Qs = {P - Qs} mm | R = W - ET = {P - Qs - ET} mm</text>
    </svg>
  );
}

const DIAGRAM_RENDERERS: Record<string, React.FC<{ params: Record<string, number> }>> = {
  aquifer: AquiferDiagram,
  "flood-routing": FloodRoutingDiagram,
  "water-balance": WaterBalanceDiagram,
  "energy-balance": WaterBalanceDiagram, // fallback
};

const VideoLectureCompanion = ({ onClose }: Props) => {
  const [lectureId, setLectureId] = useState(LECTURES[0].id);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [personalNotes, setPersonalNotes] = useState<Record<string, string>>({});
  const intervalRef = useRef<number>(0);

  const lecture = LECTURES.find(l => l.id === lectureId)!;

  // Find current state
  const currentState = useMemo(() => {
    let state = lecture.states[0];
    for (const s of lecture.states) {
      if (s.timestamp <= currentTime) state = s;
      else break;
    }
    return state;
  }, [lecture, currentTime]);

  // Playback
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        setCurrentTime(t => {
          if (t >= lecture.duration) { setIsPlaying(false); return lecture.duration; }
          return t + 1;
        });
      }, 100); // 10x speed for demo
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, lecture.duration]);

  const jumpToState = useCallback((timestamp: number) => {
    setCurrentTime(timestamp);
  }, []);

  const DiagramRenderer = DIAGRAM_RENDERERS[lecture.diagramType];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={onClose} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">Video Lecture Companion</h1>
      <p className="text-muted-foreground mb-6">
        Synchronized diagrams that update with lecture content.
        <a href="https://ponce.sdsu.edu/" target="_blank" rel="noopener noreferrer" className="text-primary ml-2 inline-flex items-center gap-1">Ponce Lectures <ExternalLink className="w-3 h-3" /></a>
      </p>

      {/* Lecture selector */}
      <Card className="card-water mb-6">
        <CardContent className="p-4">
          <Select value={lectureId} onValueChange={v => { setLectureId(v); setCurrentTime(0); setIsPlaying(false); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LECTURES.map(l => (
                <SelectItem key={l.id} value={l.id}>
                  <span className="font-medium">{l.title}</span>
                  <span className="text-muted-foreground ml-2 text-xs">({formatTime(l.duration)})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">{lecture.description} — <a href={lecture.ponceUrl} target="_blank" rel="noopener noreferrer" className="text-primary">Source <ExternalLink className="w-3 h-3 inline" /></a></p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Simulated video + diagram */}
          <Card className="card-water">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{currentState.label}</CardTitle>
                <span className="text-xs font-mono text-muted-foreground">{formatTime(currentTime)} / {formatTime(lecture.duration)}</span>
              </div>
            </CardHeader>
            <CardContent>
              {/* Diagram */}
              <div className="bg-secondary/20 rounded-lg p-4 mb-4">
                <DiagramRenderer params={currentState.parameters || {}} />
              </div>

              {/* Description */}
              <p className="text-sm text-foreground mb-2">{currentState.description}</p>
              {currentState.equation && (
                <div className="bg-secondary/50 rounded-lg p-2 mb-3">
                  <code className="text-sm font-mono font-bold">{currentState.equation}</code>
                </div>
              )}

              {/* Playback controls */}
              <div className="space-y-2">
                <Slider min={0} max={lecture.duration} step={1} value={[currentTime]}
                  onValueChange={([v]) => setCurrentTime(v)} />
                <div className="flex items-center justify-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentTime(Math.max(0, currentTime - 300))}>
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button variant="default" size="icon" className="h-10 w-10" onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentTime(Math.min(lecture.duration, currentTime + 300))}>
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timestamp markers */}
          <Card className="card-water">
            <CardHeader><CardTitle className="text-sm">Lecture Timeline</CardTitle></CardHeader>
            <CardContent className="p-4">
              <div className="space-y-1">
                {lecture.states.map((s, i) => {
                  const isActive = currentState.timestamp === s.timestamp;
                  const isPast = s.timestamp <= currentTime;
                  return (
                    <button key={i} onClick={() => jumpToState(s.timestamp)}
                      className={`w-full text-left flex items-center gap-3 p-2 rounded-lg transition-colors ${isActive ? "bg-primary/10 border border-primary/20" : isPast ? "bg-secondary/30" : "hover:bg-secondary/20"}`}>
                      <span className={`text-xs font-mono w-10 ${isActive ? "text-primary font-bold" : "text-muted-foreground"}`}>{formatTime(s.timestamp)}</span>
                      <ChevronRight className={`w-3 h-3 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-sm flex-1 ${isActive ? "font-bold text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                      {s.equation && <code className="text-[10px] font-mono text-muted-foreground hidden md:inline">{s.equation}</code>}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Auto-generated notes */}
          <Card className="card-water">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BookOpen className="w-4 h-4" />Key Points</CardTitle></CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {lecture.notes.filter(n => n.time <= currentTime).map((n, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <button onClick={() => jumpToState(n.time)} className="text-primary font-mono whitespace-nowrap hover:underline">
                      {formatTime(n.time)}
                    </button>
                    <span className="text-muted-foreground">{n.text}</span>
                  </div>
                ))}
                {lecture.notes.filter(n => n.time <= currentTime).length === 0 && (
                  <p className="text-xs text-muted-foreground italic">Notes appear as the lecture progresses...</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Highlighted concepts */}
          <Card className="card-water">
            <CardHeader><CardTitle className="text-sm">Active Concepts</CardTitle></CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-1">
                {currentState.highlights.map(h => (
                  <span key={h} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">{h.replace(/-/g, " ")}</span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Related calculators */}
          <Card className="card-water">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Link className="w-4 h-4" />Related Modules</CardTitle></CardHeader>
            <CardContent className="p-4 space-y-2">
              {lecture.id === "gw-sustainability" && (
                <>
                  <Button variant="outline" size="sm" className="w-full text-xs justify-start" onClick={() => window.location.href = "/modules/groundwater"}>Groundwater Yield Simulator</Button>
                  <Button variant="outline" size="sm" className="w-full text-xs justify-start" onClick={() => window.location.href = "/modules/theis-well"}>Theis Well Drawdown</Button>
                  <Button variant="outline" size="sm" className="w-full text-xs justify-start" onClick={() => window.location.href = "/modules/baseflow-recession"}>Baseflow Recession</Button>
                </>
              )}
              {lecture.id === "water-balance" && (
                <>
                  <Button variant="outline" size="sm" className="w-full text-xs justify-start" onClick={() => window.location.href = "/modules/catchment-water-balance"}>Catchment Water Balance</Button>
                  <Button variant="outline" size="sm" className="w-full text-xs justify-start" onClick={() => window.location.href = "/modules/et-calculator"}>ET Calculator Suite</Button>
                </>
              )}
              {lecture.id === "muskingum-explained" && (
                <>
                  <Button variant="outline" size="sm" className="w-full text-xs justify-start" onClick={() => window.location.href = "/modules/muskingum-routing"}>Muskingum-Cunge Routing</Button>
                  <Button variant="outline" size="sm" className="w-full text-xs justify-start" onClick={() => window.location.href = "/modules/saint-venant"}>Saint-Venant Visualizer</Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Source */}
          <Card className="card-water">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-2">Based on lectures by</p>
              <p className="text-sm font-bold">Prof. Victor Miguel Ponce</p>
              <p className="text-xs text-muted-foreground">San Diego State University</p>
              <a href={lecture.ponceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary inline-flex items-center gap-1 mt-2">
                View original <ExternalLink className="w-3 h-3" />
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VideoLectureCompanion;
