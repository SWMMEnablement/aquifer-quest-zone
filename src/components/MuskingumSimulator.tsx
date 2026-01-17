import { useState, useMemo, useEffect, useCallback } from "react";
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
import { ArrowLeft, Play, Pause, RotateCcw, Waves, Info, Zap } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  ComposedChart,
} from "recharts";

interface MuskingumSimulatorProps {
  onClose: () => void;
}

type HydrographType = "triangular" | "trapezoidal" | "scs";

const MuskingumSimulator = ({ onClose }: MuskingumSimulatorProps) => {
  // Channel parameters
  const [reachLength, setReachLength] = useState([5000]); // meters
  const [channelSlope, setChannelSlope] = useState([0.001]); // m/m
  const [manningsN, setManningsN] = useState([0.035]); // roughness
  const [channelWidth, setChannelWidth] = useState([20]); // meters
  
  // Routing parameters
  const [routingX, setRoutingX] = useState([0.2]); // weighting factor (0-0.5)
  
  // Hydrograph parameters
  const [hydrographType, setHydrographType] = useState<HydrographType>("triangular");
  const [peakFlow, setPeakFlow] = useState([100]); // m³/s
  const [baseDuration, setBaseDuration] = useState([6]); // hours
  const [timeStep, setTimeStep] = useState([0.5]); // hours
  
  // Animation state
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showComparison, setShowComparison] = useState(true);
  
  // Generate input hydrograph
  const inputHydrograph = useMemo(() => {
    const data: { time: number; inflow: number }[] = [];
    const duration = baseDuration[0];
    const peak = peakFlow[0];
    const dt = timeStep[0];
    const totalTime = duration * 3; // Run for 3x duration
    
    for (let t = 0; t <= totalTime; t += dt) {
      let flow = 0;
      
      if (hydrographType === "triangular") {
        const timeToPeak = duration * 0.4;
        if (t <= timeToPeak) {
          flow = (peak * t) / timeToPeak;
        } else if (t <= duration) {
          flow = peak * (1 - (t - timeToPeak) / (duration - timeToPeak));
        }
      } else if (hydrographType === "trapezoidal") {
        const riseTime = duration * 0.3;
        const peakDuration = duration * 0.2;
        const fallTime = duration * 0.5;
        
        if (t <= riseTime) {
          flow = (peak * t) / riseTime;
        } else if (t <= riseTime + peakDuration) {
          flow = peak;
        } else if (t <= duration) {
          flow = peak * (1 - (t - riseTime - peakDuration) / fallTime);
        }
      } else if (hydrographType === "scs") {
        // SCS dimensionless unit hydrograph approximation
        const tp = duration * 0.375; // time to peak
        const tr = tp / 0.6; // recession time
        if (t <= tp) {
          flow = peak * Math.pow(t / tp, 3);
        } else {
          const tRec = (t - tp) / tr;
          flow = peak * Math.exp(-1.5 * tRec);
        }
      }
      
      data.push({ time: t, inflow: Math.max(0, Math.round(flow * 100) / 100) });
    }
    
    return data;
  }, [hydrographType, peakFlow, baseDuration, timeStep]);
  
  // Calculate Muskingum K parameter (travel time)
  const routingK = useMemo(() => {
    // K = L / c, where c is wave celerity
    // For flood waves: c ≈ 1.5 * V (kinematic wave approximation)
    // Use Manning's equation to estimate average velocity
    const avgDepth = 2; // assumed average depth in meters
    const hydraulicRadius = (channelWidth[0] * avgDepth) / (channelWidth[0] + 2 * avgDepth);
    const velocity = (1 / manningsN[0]) * Math.pow(hydraulicRadius, 2/3) * Math.pow(channelSlope[0], 0.5);
    const waveCelerity = 1.5 * velocity;
    const K = reachLength[0] / waveCelerity / 3600; // convert to hours
    return Math.round(K * 100) / 100;
  }, [reachLength, channelSlope, manningsN, channelWidth]);
  
  // Route hydrograph using Muskingum method
  const routedData = useMemo(() => {
    const K = routingK;
    const X = routingX[0];
    const dt = timeStep[0];
    
    // Muskingum routing coefficients
    const denom = 2 * K * (1 - X) + dt;
    const C0 = (dt - 2 * K * X) / denom;
    const C1 = (dt + 2 * K * X) / denom;
    const C2 = (2 * K * (1 - X) - dt) / denom;
    
    const data = inputHydrograph.map((point, i) => {
      let muskingumOutflow = 0;
      let kinematicOutflow = 0;
      
      if (i === 0) {
        muskingumOutflow = point.inflow;
        kinematicOutflow = point.inflow;
      } else {
        const prevData = inputHydrograph[i - 1];
        const prevMuskingum = data[i - 1]?.muskingumOutflow || prevData.inflow;
        
        // Muskingum-Cunge routing
        muskingumOutflow = Math.max(0, 
          C0 * point.inflow + 
          C1 * prevData.inflow + 
          C2 * prevMuskingum
        );
        
        // Simple kinematic wave (pure translation, less attenuation)
        // Translate by K hours
        const lagSteps = Math.floor(K / dt);
        const lagIndex = Math.max(0, i - lagSteps);
        kinematicOutflow = inputHydrograph[lagIndex]?.inflow || 0;
      }
      
      return {
        time: point.time,
        inflow: point.inflow,
        muskingumOutflow: Math.round(muskingumOutflow * 100) / 100,
        kinematicOutflow: Math.round(kinematicOutflow * 100) / 100,
      };
    });
    
    return data;
  }, [inputHydrograph, routingK, routingX, timeStep]);
  
  // Get current animation data
  const animationData = useMemo(() => {
    return routedData.slice(0, currentStep + 1);
  }, [routedData, currentStep]);
  
  // Animation control
  useEffect(() => {
    if (!isRunning) return;
    if (currentStep >= routedData.length - 1) {
      setIsRunning(false);
      return;
    }
    
    const interval = setInterval(() => {
      setCurrentStep(prev => Math.min(prev + 1, routedData.length - 1));
    }, 100);
    
    return () => clearInterval(interval);
  }, [isRunning, currentStep, routedData.length]);
  
  // Reset animation
  const resetAnimation = () => {
    setCurrentStep(0);
    setIsRunning(false);
  };
  
  // Calculate statistics
  const stats = useMemo(() => {
    const inflowPeak = Math.max(...routedData.map(d => d.inflow));
    const muskingumPeak = Math.max(...routedData.map(d => d.muskingumOutflow));
    const kinematicPeak = Math.max(...routedData.map(d => d.kinematicOutflow));
    
    const inflowPeakTime = routedData.find(d => d.inflow === inflowPeak)?.time || 0;
    const muskingumPeakTime = routedData.find(d => d.muskingumOutflow === muskingumPeak)?.time || 0;
    const kinematicPeakTime = routedData.find(d => d.kinematicOutflow === kinematicPeak)?.time || 0;
    
    const attenuation = ((inflowPeak - muskingumPeak) / inflowPeak) * 100;
    const translation = muskingumPeakTime - inflowPeakTime;
    
    return {
      inflowPeak,
      muskingumPeak,
      kinematicPeak,
      inflowPeakTime,
      muskingumPeakTime,
      kinematicPeakTime,
      attenuation: Math.round(attenuation * 10) / 10,
      translation: Math.round(translation * 100) / 100,
    };
  }, [routedData]);

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
              Muskingum-Cunge Flood Routing
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize flood wave propagation and attenuation through channel reaches
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <Card className="p-6 shadow-card">
            <h2 className="font-semibold text-lg mb-6 text-foreground flex items-center gap-2">
              <Waves className="w-5 h-5 text-primary" />
              Channel & Hydrograph
            </h2>

            {/* Playback controls */}
            <div className="flex gap-2 mb-6">
              <Button
                onClick={() => setIsRunning(!isRunning)}
                className="flex-1"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" /> {currentStep === 0 ? "Run" : "Resume"}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={resetAnimation}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Hydrograph type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Inflow Hydrograph Shape
              </label>
              <Select value={hydrographType} onValueChange={(v) => { setHydrographType(v as HydrographType); resetAnimation(); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="triangular">Triangular</SelectItem>
                  <SelectItem value="trapezoidal">Trapezoidal</SelectItem>
                  <SelectItem value="scs">SCS Unit Hydrograph</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Peak flow */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Peak Inflow: <span className="text-primary font-bold">{peakFlow[0]} m³/s</span>
              </label>
              <Slider
                value={peakFlow}
                onValueChange={(v) => { setPeakFlow(v); resetAnimation(); }}
                min={20}
                max={500}
                step={10}
              />
            </div>

            {/* Duration */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Base Duration: <span className="text-primary font-bold">{baseDuration[0]} hrs</span>
              </label>
              <Slider
                value={baseDuration}
                onValueChange={(v) => { setBaseDuration(v); resetAnimation(); }}
                min={2}
                max={24}
                step={1}
              />
            </div>

            <div className="border-t border-border my-4 pt-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Channel Parameters</h3>
              
              {/* Reach length */}
              <div className="mb-4">
                <label className="block text-sm text-muted-foreground mb-2">
                  Reach Length: <span className="text-foreground">{reachLength[0]} m</span>
                </label>
                <Slider
                  value={reachLength}
                  onValueChange={(v) => { setReachLength(v); resetAnimation(); }}
                  min={1000}
                  max={20000}
                  step={500}
                />
              </div>

              {/* Slope */}
              <div className="mb-4">
                <label className="block text-sm text-muted-foreground mb-2">
                  Channel Slope: <span className="text-foreground">{channelSlope[0].toFixed(4)} m/m</span>
                </label>
                <Slider
                  value={channelSlope}
                  onValueChange={(v) => { setChannelSlope(v); resetAnimation(); }}
                  min={0.0001}
                  max={0.01}
                  step={0.0001}
                />
              </div>

              {/* Manning's n */}
              <div className="mb-4">
                <label className="block text-sm text-muted-foreground mb-2">
                  Manning's n: <span className="text-foreground">{manningsN[0]}</span>
                </label>
                <Slider
                  value={manningsN}
                  onValueChange={(v) => { setManningsN(v); resetAnimation(); }}
                  min={0.01}
                  max={0.1}
                  step={0.005}
                />
              </div>
            </div>

            {/* Routing X parameter */}
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <label className="block text-sm font-medium text-foreground mb-2">
                Muskingum X: <span className="text-primary font-bold">{routingX[0]}</span>
              </label>
              <Slider
                value={routingX}
                onValueChange={(v) => { setRoutingX(v); resetAnimation(); }}
                min={0}
                max={0.5}
                step={0.05}
              />
              <p className="text-xs text-muted-foreground mt-2">
                X=0: Maximum attenuation (reservoir) | X=0.5: Pure translation
              </p>
            </div>
          </Card>

          {/* Main visualization */}
          <Card className="p-6 shadow-card lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-lg text-foreground">
                Wave Propagation — t = {animationData[animationData.length - 1]?.time.toFixed(1) || 0} hrs
              </h2>
              <Button
                variant={showComparison ? "default" : "outline"}
                size="sm"
                onClick={() => setShowComparison(!showComparison)}
              >
                <Zap className="w-4 h-4 mr-2" />
                {showComparison ? "Comparing Methods" : "Show Comparison"}
              </Button>
            </div>

            {/* Main chart */}
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={animationData}>
                  <defs>
                    <linearGradient id="inflowGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(205 85% 35%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(205 85% 35%)" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="muskingumGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(180 65% 40%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(180 65% 40%)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    label={{ value: 'Time (hours)', position: 'bottom', offset: -5, fontSize: 11 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    label={{ value: 'Flow (m³/s)', angle: -90, position: 'insideLeft', fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="inflow"
                    name="Inflow"
                    stroke="hsl(205 85% 35%)"
                    strokeWidth={2}
                    fill="url(#inflowGradient)"
                  />
                  <Line
                    type="monotone"
                    dataKey="muskingumOutflow"
                    name="Muskingum-Cunge Outflow"
                    stroke="hsl(180 65% 40%)"
                    strokeWidth={3}
                    dot={false}
                  />
                  {showComparison && (
                    <Line
                      type="monotone"
                      dataKey="kinematicOutflow"
                      name="Kinematic Wave (translation only)"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="p-3 bg-secondary rounded-xl text-center">
                <div className="text-xs text-muted-foreground mb-1">Routing K</div>
                <div className="text-xl font-bold text-foreground">{routingK} hrs</div>
              </div>
              <div className="p-3 bg-secondary rounded-xl text-center">
                <div className="text-xs text-muted-foreground mb-1">Peak Attenuation</div>
                <div className="text-xl font-bold text-primary">{stats.attenuation}%</div>
              </div>
              <div className="p-3 bg-secondary rounded-xl text-center">
                <div className="text-xs text-muted-foreground mb-1">Peak Translation</div>
                <div className="text-xl font-bold text-water-medium">{stats.translation} hrs</div>
              </div>
              <div className="p-3 bg-secondary rounded-xl text-center">
                <div className="text-xs text-muted-foreground mb-1">Outflow Peak</div>
                <div className="text-xl font-bold text-accent">{stats.muskingumPeak} m³/s</div>
              </div>
            </div>

            {/* Method comparison info */}
            {showComparison && (
              <div className="mt-6 p-4 bg-accent/10 rounded-xl border border-accent/20">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-accent mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Muskingum-Cunge vs Kinematic Wave</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      The <strong>kinematic wave</strong> (dashed red) only translates the wave with no attenuation—
                      useful for steep channels. The <strong>Muskingum-Cunge</strong> method captures both translation 
                      AND attenuation (diffusion), making it more accurate for flood routing in mild-slope channels.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Attribution */}
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Based on the work of Prof. Victor Miguel Ponce, SDSU
                <br />
                <a
                  href="https://ponce.sdsu.edu/muskingum_cunge_method_explained.html"
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

export default MuskingumSimulator;
