import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Play, Pause, RotateCcw, Zap, Info, AlertTriangle } from "lucide-react";
import {
  type EquationTerms,
  type ChannelParams,
  EQUATION_TERMS,
  WAVE_TYPE_LABELS,
  WAVE_TYPE_DESCRIPTIONS,
  MANNINGS_PRESETS,
  analyzeWave,
  generateWaveSurface,
} from "@/lib/hydrology/saint-venant";

interface SaintVenantVisualizerProps {
  onClose: () => void;
}

const SaintVenantVisualizer = ({ onClose }: SaintVenantVisualizerProps) => {
  // Channel parameters
  const [depth, setDepth] = useState([1.5]);
  const [slope, setSlope] = useState([0.005]);
  const [manningsN, setManningsN] = useState([0.035]);

  // Equation terms
  const [terms, setTerms] = useState<EquationTerms>({
    localAcceleration: true,
    convectiveAcceleration: true,
    pressureGradient: true,
    gravity: true,
    friction: true,
  });

  // Animation
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const animRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);

  const channelLength = 500; // m
  const pulseStart = channelLength * 0.15;

  const channelParams: ChannelParams = useMemo(
    () => ({
      depth: depth[0],
      slope: slope[0],
      manningsN: manningsN[0],
      length: channelLength,
    }),
    [depth, slope, manningsN]
  );

  const analysis = useMemo(
    () => analyzeWave(channelParams, terms),
    [channelParams, terms]
  );

  const waveSurface = useMemo(
    () => generateWaveSurface(channelParams, terms, time, pulseStart),
    [channelParams, terms, time]
  );

  // Animation loop
  const animate = useCallback(
    (timestamp: number) => {
      if (!lastFrameRef.current) lastFrameRef.current = timestamp;
      const delta = (timestamp - lastFrameRef.current) / 1000;
      lastFrameRef.current = timestamp;
      setTime((t) => t + delta * 2); // 2x speed for visibility
      animRef.current = requestAnimationFrame(animate);
    },
    []
  );

  useEffect(() => {
    if (isRunning) {
      lastFrameRef.current = 0;
      animRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [isRunning, animate]);

  const reset = () => {
    setIsRunning(false);
    setTime(0);
    lastFrameRef.current = 0;
  };

  const toggleTerm = (termId: keyof EquationTerms) => {
    setTerms((prev) => ({ ...prev, [termId]: !prev[termId] }));
    reset();
  };

  // SVG rendering helpers
  const svgWidth = 800;
  const svgHeight = 260;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const plotW = svgWidth - margin.left - margin.right;
  const plotH = svgHeight - margin.top - margin.bottom;

  const maxElev = depth[0] * 1.6;
  const toX = (x: number) => margin.left + (x / channelLength) * plotW;
  const toY = (elev: number) => margin.top + plotH - (elev / maxElev) * plotH;

  // Build wave path
  const wavePath = useMemo(() => {
    if (waveSurface.length === 0) return "";
    const pts = waveSurface.map((p) => `${toX(p.x)},${toY(p.elevation)}`);
    return `M${pts.join("L")}`;
  }, [waveSurface, depth]);

  // Channel bed path
  const bedPath = useMemo(() => {
    const startY = toY(0);
    const endY = toY(0);
    return `M${margin.left},${startY}L${margin.left + plotW},${endY}`;
  }, []);

  // Water fill area
  const fillPath = useMemo(() => {
    if (waveSurface.length === 0) return "";
    const pts = waveSurface.map((p) => `${toX(p.x)},${toY(p.elevation)}`);
    const bedRight = `${toX(channelLength)},${toY(0)}`;
    const bedLeft = `${toX(0)},${toY(0)}`;
    return `M${pts.join("L")}L${bedRight}L${bedLeft}Z`;
  }, [waveSurface, depth]);

  const froudeColor = analysis.isSupercritical
    ? "hsl(0 72% 55%)"
    : "hsl(210 80% 55%)";

  const nPreset = MANNINGS_PRESETS.find((p) => Math.abs(p.value - manningsN[0]) < 0.002);

  return (
    <div className="min-h-screen bg-background py-8 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Saint-Venant Equations Visualizer
            </h1>
            <p className="text-muted-foreground mt-1">
              Toggle equation terms to see how wave behavior changes — from dynamic to kinematic
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left Panel: Controls ── */}
          <Card className="p-6 shadow-card space-y-6">
            {/* Playback */}
            <div className="flex gap-2">
              <Button onClick={() => setIsRunning(!isRunning)} className="flex-1">
                {isRunning ? (
                  <><Pause className="w-4 h-4 mr-2" /> Pause</>
                ) : (
                  <><Play className="w-4 h-4 mr-2" /> {time > 0 ? "Resume" : "Run"}</>
                )}
              </Button>
              <Button variant="outline" onClick={reset}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Channel params */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Channel Parameters</h3>

              <div className="mb-4">
                <label className="block text-sm text-muted-foreground mb-1">
                  Flow Depth: <span className="text-foreground font-medium">{depth[0].toFixed(1)} m</span>
                </label>
                <Slider value={depth} onValueChange={(v) => { setDepth(v); reset(); }} min={0.1} max={5} step={0.1} />
              </div>

              <div className="mb-4">
                <label className="block text-sm text-muted-foreground mb-1">
                  Channel Slope: <span className="text-foreground font-medium">{slope[0].toFixed(4)} m/m</span>
                </label>
                <Slider value={slope} onValueChange={(v) => { setSlope(v); reset(); }} min={0.0001} max={0.05} step={0.0001} />
              </div>

              <div className="mb-2">
                <label className="block text-sm text-muted-foreground mb-1">
                  Manning's n: <span className="text-foreground font-medium">{manningsN[0].toFixed(3)}</span>
                  {nPreset && <span className="text-xs text-muted-foreground ml-1">({nPreset.label})</span>}
                </label>
                <Select
                  value={String(manningsN[0])}
                  onValueChange={(v) => { setManningsN([Number(v)]); reset(); }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MANNINGS_PRESETS.map((p) => (
                      <SelectItem key={p.value} value={String(p.value)}>
                        {p.label} ({p.value})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Equation terms */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Momentum Equation Terms
              </h3>
              <div className="space-y-3">
                {EQUATION_TERMS.map((term) => (
                  <div
                    key={term.id}
                    className="flex items-center justify-between p-2 rounded-lg border"
                    style={{
                      borderColor: terms[term.id] ? term.color : "hsl(var(--border))",
                      backgroundColor: terms[term.id] ? `${term.color.replace(")", " / 0.08)")}` : "transparent",
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-mono font-bold"
                          style={{ color: terms[term.id] ? term.color : "hsl(var(--muted-foreground))" }}
                        >
                          {term.symbol}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">{term.name}</span>
                      </div>
                    </div>
                    {term.canToggle ? (
                      <Switch
                        checked={terms[term.id]}
                        onCheckedChange={() => toggleTerm(term.id)}
                      />
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-medium px-2 py-0.5 rounded bg-muted">
                        ALWAYS ON
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* ── Center + Right: Visualization ── */}
          <Card className="p-6 shadow-card lg:col-span-2 space-y-6">
            {/* Wave type badge */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-sm font-bold"
                    style={{
                      backgroundColor:
                        analysis.waveType === "dynamic"
                          ? "hsl(270 60% 55% / 0.15)"
                          : analysis.waveType === "diffusion"
                          ? "hsl(210 80% 55% / 0.15)"
                          : analysis.waveType === "kinematic"
                          ? "hsl(145 60% 42% / 0.15)"
                          : "hsl(var(--muted))",
                      color:
                        analysis.waveType === "dynamic"
                          ? "hsl(270 60% 45%)"
                          : analysis.waveType === "diffusion"
                          ? "hsl(210 80% 45%)"
                          : analysis.waveType === "kinematic"
                          ? "hsl(145 60% 35%)"
                          : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {WAVE_TYPE_LABELS[analysis.waveType]}
                  </span>
                  {analysis.isSupercritical && (
                    <span className="flex items-center gap-1 text-xs font-bold text-destructive">
                      <AlertTriangle className="w-3 h-3" /> Supercritical
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 max-w-lg">
                  {WAVE_TYPE_DESCRIPTIONS[analysis.waveType]}
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                t = {time.toFixed(1)} s
              </div>
            </div>

            {/* SVG Channel Visualization */}
            <div className="rounded-xl border border-border bg-secondary/30 overflow-hidden">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full"
                style={{ minHeight: 200 }}
              >
                {/* Background gradient */}
                <defs>
                  <linearGradient id="waterFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(200 75% 45%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(205 85% 35%)" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="bedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(30 40% 45%)" />
                    <stop offset="100%" stopColor="hsl(30 40% 30%)" />
                  </linearGradient>
                </defs>

                {/* Channel bed */}
                <rect
                  x={margin.left}
                  y={toY(0)}
                  width={plotW}
                  height={svgHeight - toY(0)}
                  fill="url(#bedFill)"
                  rx={2}
                />

                {/* Grid lines */}
                {[0.25, 0.5, 0.75, 1.0].map((frac) => {
                  const elev = maxElev * frac;
                  const y = toY(elev);
                  return (
                    <g key={frac}>
                      <line
                        x1={margin.left}
                        y1={y}
                        x2={margin.left + plotW}
                        y2={y}
                        stroke="hsl(var(--border))"
                        strokeDasharray="4 4"
                        opacity={0.4}
                      />
                      <text
                        x={margin.left - 6}
                        y={y + 4}
                        textAnchor="end"
                        fontSize={9}
                        fill="hsl(var(--muted-foreground))"
                      >
                        {elev.toFixed(1)}m
                      </text>
                    </g>
                  );
                })}

                {/* Base depth line */}
                <line
                  x1={margin.left}
                  y1={toY(depth[0])}
                  x2={margin.left + plotW}
                  y2={toY(depth[0])}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="6 3"
                  opacity={0.5}
                />
                <text
                  x={margin.left + plotW + 4}
                  y={toY(depth[0]) + 3}
                  fontSize={8}
                  fill="hsl(var(--muted-foreground))"
                >
                  d₀
                </text>

                {/* Water body fill */}
                <path d={fillPath} fill="url(#waterFill)" />

                {/* Wave surface */}
                <path
                  d={wavePath}
                  fill="none"
                  stroke={analysis.isSupercritical ? "hsl(0 72% 55%)" : "hsl(200 75% 45%)"}
                  strokeWidth={2.5}
                />

                {/* Froude indicator */}
                <rect
                  x={margin.left + plotW - 100}
                  y={margin.top}
                  width={95}
                  height={28}
                  rx={6}
                  fill="hsl(var(--card))"
                  stroke="hsl(var(--border))"
                  opacity={0.9}
                />
                <text
                  x={margin.left + plotW - 52}
                  y={margin.top + 18}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight="bold"
                  fill={froudeColor}
                >
                  Fr = {analysis.froudeNumber.toFixed(2)}
                </text>

                {/* X axis label */}
                <text
                  x={margin.left + plotW / 2}
                  y={svgHeight - 6}
                  textAnchor="middle"
                  fontSize={10}
                  fill="hsl(var(--muted-foreground))"
                >
                  Distance along channel (m)
                </text>

                {/* Flow direction arrow */}
                <g transform={`translate(${margin.left + 10}, ${margin.top + 6})`}>
                  <text fontSize={9} fill="hsl(var(--muted-foreground))">Flow →</text>
                </g>
              </svg>
            </div>

            {/* Equation display */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                Saint-Venant Momentum Equation
              </h3>
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-sm leading-relaxed">
                {EQUATION_TERMS.map((term, i) => (
                  <span key={term.id} className="flex items-center gap-1">
                    {i > 0 && (
                      <span className="text-muted-foreground mx-0.5">
                        {i <= 2 ? "+" : i === 3 ? "=" : "−"}
                      </span>
                    )}
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold transition-all duration-200 ${
                        terms[term.id]
                          ? "opacity-100"
                          : "opacity-25 line-through"
                      }`}
                      style={{
                        color: terms[term.id] ? term.color : "hsl(var(--muted-foreground))",
                        backgroundColor: terms[term.id]
                          ? `${term.color.replace(")", " / 0.1)")}`
                          : "transparent",
                      }}
                      title={term.description}
                    >
                      {term.symbol}
                    </span>
                  </span>
                ))}
                <span className="text-muted-foreground ml-1">= 0</span>
              </div>
            </div>

            {/* Metrics row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-secondary rounded-xl text-center">
                <div className="text-[10px] text-muted-foreground mb-1">Flow Velocity</div>
                <div className="text-lg font-bold text-foreground">{analysis.velocity.toFixed(2)}</div>
                <div className="text-[10px] text-muted-foreground">m/s</div>
              </div>
              <div className="p-3 bg-secondary rounded-xl text-center">
                <div className="text-[10px] text-muted-foreground mb-1">Kinematic Celerity</div>
                <div className="text-lg font-bold text-accent">{analysis.kinematicCelerity.toFixed(2)}</div>
                <div className="text-[10px] text-muted-foreground">cₖ = βV (m/s)</div>
              </div>
              <div className="p-3 bg-secondary rounded-xl text-center">
                <div className="text-[10px] text-muted-foreground mb-1">Dynamic ↓</div>
                <div className="text-lg font-bold text-primary">{analysis.dynamicCelerityDown.toFixed(2)}</div>
                <div className="text-[10px] text-muted-foreground">V + √(gd) m/s</div>
              </div>
              <div className="p-3 bg-secondary rounded-xl text-center">
                <div className="text-[10px] text-muted-foreground mb-1">Dynamic ↑</div>
                <div
                  className="text-lg font-bold"
                  style={{ color: analysis.dynamicCelerityUp < 0 ? "hsl(0 72% 55%)" : "hsl(var(--foreground))" }}
                >
                  {analysis.dynamicCelerityUp.toFixed(2)}
                </div>
                <div className="text-[10px] text-muted-foreground">V − √(gd) m/s</div>
              </div>
            </div>

            {/* Supercritical callout */}
            {analysis.isSupercritical && (
              <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/30 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    The flow is now supercritical (Fr ≥ 1.0)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Information can only travel downstream. The upstream dynamic celerity (V − √gd) 
                    is positive, meaning disturbances cannot propagate upstream. This has major 
                    implications for flood warning and backwater analysis.
                  </p>
                </div>
              </div>
            )}

            {/* Attribution */}
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Based on the work of Prof. Victor Miguel Ponce, SDSU —{" "}
                <a
                  href="https://ponce.sdsu.edu/the_saint_venant_equations.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  ponce.sdsu.edu
                </a>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SaintVenantVisualizer;
