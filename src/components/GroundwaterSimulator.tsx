import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Play, Pause, RotateCcw, Droplet, TreePine, AlertTriangle, TrendingDown, TrendingUp, Activity } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts";

interface GroundwaterSimulatorProps {
  onClose: () => void;
}

interface TimeSeriesPoint {
  year: number;
  storage: number;
  waterTable: number;
  ecosystemHealth: number;
  cumulativePumping: number;
  cumulativeRecharge: number;
}

const GroundwaterSimulator = ({ onClose }: GroundwaterSimulatorProps) => {
  // Aquifer parameters
  const [rechargeRate, setRechargeRate] = useState([50]); // acre-feet/year
  const [initialStorage, setInitialStorage] = useState([1000]); // acre-feet
  const [specificYield, setSpecificYield] = useState([0.15]); // dimensionless
  const [aquiferArea, setAquiferArea] = useState([500]); // acres
  
  // User-controlled pumping
  const [pumpingRate, setPumpingRate] = useState([30]); // acre-feet/year
  
  // Simulation state
  const [isRunning, setIsRunning] = useState(false);
  const [currentYear, setCurrentYear] = useState(0);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesPoint[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameMessage, setGameMessage] = useState("");
  
  // Calculate derived values
  const maxWaterTable = useMemo(() => {
    return initialStorage[0] / (aquiferArea[0] * specificYield[0]);
  }, [initialStorage, aquiferArea, specificYield]);
  
  // Current state from simulation
  const currentState = useMemo(() => {
    if (timeSeriesData.length === 0) {
      return {
        storage: initialStorage[0],
        waterTable: maxWaterTable,
        ecosystemHealth: 100,
        netChange: rechargeRate[0] - pumpingRate[0],
      };
    }
    const latest = timeSeriesData[timeSeriesData.length - 1];
    return {
      storage: latest.storage,
      waterTable: latest.waterTable,
      ecosystemHealth: latest.ecosystemHealth,
      netChange: rechargeRate[0] - pumpingRate[0],
    };
  }, [timeSeriesData, initialStorage, maxWaterTable, rechargeRate, pumpingRate]);
  
  // Calculate sustainable yield
  const sustainableYield = useMemo(() => {
    // True sustainable yield considering ecosystem needs (baseflow)
    const baseflowNeed = rechargeRate[0] * 0.3; // 30% for ecosystems
    return rechargeRate[0] - baseflowNeed;
  }, [rechargeRate]);
  
  // Simulation step
  const simulateStep = useCallback(() => {
    if (gameOver) return;
    
    setTimeSeriesData(prev => {
      const lastPoint = prev.length > 0 ? prev[prev.length - 1] : {
        year: 0,
        storage: initialStorage[0],
        waterTable: maxWaterTable,
        ecosystemHealth: 100,
        cumulativePumping: 0,
        cumulativeRecharge: 0,
      };
      
      // Calculate new storage
      const netChange = rechargeRate[0] - pumpingRate[0];
      let newStorage = Math.max(0, lastPoint.storage + netChange);
      
      // Water table depth (relative to surface)
      const newWaterTable = newStorage / (aquiferArea[0] * specificYield[0]);
      
      // Ecosystem health calculation
      // Health depends on water table maintaining baseflow to streams/wetlands
      const criticalDepth = maxWaterTable * 0.3; // Below 30% is critical
      const optimalDepth = maxWaterTable * 0.7; // Above 70% is optimal
      
      let newHealth = lastPoint.ecosystemHealth;
      if (newWaterTable < criticalDepth) {
        // Rapid decline when below critical
        newHealth = Math.max(0, lastPoint.ecosystemHealth - (criticalDepth - newWaterTable) / criticalDepth * 15);
      } else if (newWaterTable < optimalDepth) {
        // Slow decline when between critical and optimal
        newHealth = Math.max(0, lastPoint.ecosystemHealth - 2);
      } else if (lastPoint.ecosystemHealth < 100) {
        // Slow recovery when above optimal
        newHealth = Math.min(100, lastPoint.ecosystemHealth + 1);
      }
      
      const newYear = lastPoint.year + 1;
      
      const newPoint: TimeSeriesPoint = {
        year: newYear,
        storage: Math.round(newStorage * 10) / 10,
        waterTable: Math.round(newWaterTable * 100) / 100,
        ecosystemHealth: Math.round(newHealth * 10) / 10,
        cumulativePumping: lastPoint.cumulativePumping + pumpingRate[0],
        cumulativeRecharge: lastPoint.cumulativeRecharge + rechargeRate[0],
      };
      
      // Check for game over conditions
      if (newStorage <= 0) {
        setGameOver(true);
        setIsRunning(false);
        setGameMessage("Aquifer depleted! Pumping exceeded sustainable capacity.");
      } else if (newHealth <= 0) {
        setGameOver(true);
        setIsRunning(false);
        setGameMessage("Ecosystem collapsed! Baseflow ceased and wetlands dried up.");
      } else if (newYear >= 100) {
        setIsRunning(false);
        if (newHealth > 70 && newStorage > initialStorage[0] * 0.5) {
          setGameMessage("Excellent! You maintained sustainable groundwater management for 100 years!");
        } else if (newHealth > 40) {
          setGameMessage("Completed 100 years with moderate ecosystem stress. Consider reducing pumping.");
        } else {
          setGameMessage("Completed 100 years but ecosystem is severely stressed.");
        }
      }
      
      setCurrentYear(newYear);
      return [...prev, newPoint];
    });
  }, [gameOver, initialStorage, maxWaterTable, rechargeRate, pumpingRate, aquiferArea, specificYield]);
  
  // Auto-advance simulation
  useEffect(() => {
    if (!isRunning) return;
    
    const interval = setInterval(simulateStep, 300);
    return () => clearInterval(interval);
  }, [isRunning, simulateStep]);
  
  // Reset simulation
  const resetSimulation = () => {
    setTimeSeriesData([]);
    setCurrentYear(0);
    setIsRunning(false);
    setGameOver(false);
    setGameMessage("");
  };
  
  // Get health color
  const getHealthColor = (health: number) => {
    if (health > 70) return "text-earth-green";
    if (health > 40) return "text-amber-500";
    return "text-destructive";
  };
  
  const getHealthBgColor = (health: number) => {
    if (health > 70) return "bg-earth-green/20";
    if (health > 40) return "bg-amber-500/20";
    return "bg-destructive/20";
  };

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
              Groundwater Yield Simulator
            </h1>
            <p className="text-muted-foreground mt-1">
              Balance pumping rates with ecosystem health over time
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Control Panel */}
          <Card className="p-6 shadow-card">
            <h2 className="font-semibold text-lg mb-6 text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Simulation Controls
            </h2>

            {/* Playback controls */}
            <div className="flex gap-2 mb-6">
              <Button
                onClick={() => setIsRunning(!isRunning)}
                disabled={gameOver || currentYear >= 100}
                className="flex-1"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" /> {currentYear === 0 ? "Start" : "Resume"}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={resetSimulation}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Pumping Rate - main control */}
            <div className="mb-6 p-4 bg-primary/5 rounded-xl border border-primary/20">
              <label className="block text-sm font-medium text-foreground mb-2">
                Pumping Rate: <span className="text-primary font-bold">{pumpingRate[0]} AF/yr</span>
              </label>
              <Slider
                value={pumpingRate}
                onValueChange={setPumpingRate}
                min={0}
                max={100}
                step={1}
                className="mt-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0 AF/yr</span>
                <span className="text-earth-green">Sustainable: ~{Math.round(sustainableYield)} AF/yr</span>
                <span>100 AF/yr</span>
              </div>
            </div>

            {/* Aquifer parameters */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Recharge Rate: <span className="text-water-medium">{rechargeRate[0]} AF/yr</span>
                </label>
                <Slider
                  value={rechargeRate}
                  onValueChange={(v) => { setRechargeRate(v); resetSimulation(); }}
                  min={10}
                  max={100}
                  step={5}
                  disabled={isRunning}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Initial Storage: <span className="text-water-medium">{initialStorage[0]} AF</span>
                </label>
                <Slider
                  value={initialStorage}
                  onValueChange={(v) => { setInitialStorage(v); resetSimulation(); }}
                  min={500}
                  max={2000}
                  step={100}
                  disabled={isRunning}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Specific Yield: <span className="text-water-medium">{specificYield[0]}</span>
                </label>
                <Slider
                  value={specificYield}
                  onValueChange={(v) => { setSpecificYield(v); resetSimulation(); }}
                  min={0.05}
                  max={0.3}
                  step={0.01}
                  disabled={isRunning}
                />
              </div>
            </div>

            {/* Game message */}
            {gameMessage && (
              <div className={`mt-6 p-4 rounded-xl ${gameOver ? 'bg-destructive/10 border border-destructive/30' : 'bg-earth-green/10 border border-earth-green/30'}`}>
                <p className={`text-sm font-medium ${gameOver ? 'text-destructive' : 'text-earth-green'}`}>
                  {gameMessage}
                </p>
              </div>
            )}
          </Card>

          {/* Current Status */}
          <Card className="p-6 shadow-card">
            <h2 className="font-semibold text-lg mb-6 text-foreground">
              Current Status — Year {currentYear}
            </h2>

            {/* Ecosystem health meter */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground flex items-center gap-2">
                  <TreePine className="w-4 h-4 text-earth-green" />
                  Ecosystem Health
                </span>
                <span className={`text-2xl font-bold ${getHealthColor(currentState.ecosystemHealth)}`}>
                  {Math.round(currentState.ecosystemHealth)}%
                </span>
              </div>
              <div className="h-4 rounded-full overflow-hidden bg-muted">
                <div
                  className={`h-full transition-all duration-500 ${
                    currentState.ecosystemHealth > 70 ? 'bg-earth-green' :
                    currentState.ecosystemHealth > 40 ? 'bg-amber-500' : 'bg-destructive'
                  }`}
                  style={{ width: `${currentState.ecosystemHealth}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {currentState.ecosystemHealth > 70 ? "Healthy baseflow maintains wetlands and streams" :
                 currentState.ecosystemHealth > 40 ? "Reduced baseflow stressing dependent ecosystems" :
                 "Critical! Wetlands drying, habitat loss occurring"}
              </p>
            </div>

            {/* Storage indicators */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-secondary rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Droplet className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Storage</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {Math.round(currentState.storage)} AF
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.round(currentState.storage / initialStorage[0] * 100)}% of initial
                </div>
              </div>
              
              <div className="p-4 bg-secondary rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-water-medium" />
                  <span className="text-sm text-muted-foreground">Water Table</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {currentState.waterTable.toFixed(1)} ft
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.round(currentState.waterTable / maxWaterTable * 100)}% of max
                </div>
              </div>
            </div>

            {/* Net change indicator */}
            <div className={`p-4 rounded-xl ${currentState.netChange >= 0 ? 'bg-earth-green/10' : 'bg-destructive/10'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Annual Net Change</span>
                <span className={`text-lg font-bold flex items-center gap-1 ${
                  currentState.netChange >= 0 ? 'text-earth-green' : 'text-destructive'
                }`}>
                  {currentState.netChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {currentState.netChange > 0 ? '+' : ''}{currentState.netChange} AF/yr
                </span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Recharge: +{rechargeRate[0]} AF/yr | Pumping: -{pumpingRate[0]} AF/yr
              </div>
            </div>

            {/* Aquifer visualization */}
            <div className="mt-6 relative h-48 bg-gradient-to-b from-earth-tan/30 via-earth-tan/50 to-water-medium/30 rounded-xl overflow-hidden border border-border">
              {/* Ground surface */}
              <div className="absolute top-0 left-0 right-0 h-8 bg-earth-green/30 flex items-center justify-center">
                <span className="text-xs text-foreground/70">Ground Surface</span>
              </div>
              
              {/* Water table indicator */}
              <div 
                className="absolute left-0 right-0 transition-all duration-500 border-t-2 border-dashed border-water-dark"
                style={{ top: `${8 + (1 - currentState.waterTable / maxWaterTable) * 120}px` }}
              >
                <span className="absolute -top-3 right-2 text-xs text-water-dark font-medium">
                  Water Table
                </span>
              </div>
              
              {/* Saturated zone */}
              <div 
                className="absolute bottom-0 left-0 right-0 bg-water-medium/40 transition-all duration-500"
                style={{ height: `${(currentState.waterTable / maxWaterTable) * 140}px` }}
              />
              
              {/* Ecosystem indicators */}
              <div className="absolute top-10 left-4 flex flex-col gap-1">
                <div className={`text-xs px-2 py-1 rounded ${getHealthBgColor(currentState.ecosystemHealth)}`}>
                  🌳 Riparian: {currentState.ecosystemHealth > 60 ? 'Healthy' : 'Stressed'}
                </div>
                <div className={`text-xs px-2 py-1 rounded ${getHealthBgColor(currentState.ecosystemHealth - 10)}`}>
                  💧 Springs: {currentState.ecosystemHealth > 50 ? 'Flowing' : 'Reduced'}
                </div>
                <div className={`text-xs px-2 py-1 rounded ${getHealthBgColor(currentState.ecosystemHealth - 20)}`}>
                  🐟 Baseflow: {currentState.ecosystemHealth > 40 ? 'Maintained' : 'Declining'}
                </div>
              </div>
            </div>
          </Card>

          {/* Time Series Charts */}
          <Card className="p-6 shadow-card">
            <h2 className="font-semibold text-lg mb-6 text-foreground">
              Historical Trends
            </h2>

            {timeSeriesData.length > 1 ? (
              <div className="space-y-6">
                {/* Storage over time */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">Aquifer Storage</h3>
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timeSeriesData}>
                        <defs>
                          <linearGradient id="storageGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(205 85% 35%)" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="hsl(205 85% 35%)" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '11px',
                          }}
                        />
                        <ReferenceLine y={initialStorage[0] * 0.3} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
                        <Area
                          type="monotone"
                          dataKey="storage"
                          stroke="hsl(205 85% 35%)"
                          strokeWidth={2}
                          fill="url(#storageGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Ecosystem health over time */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">Ecosystem Health</h3>
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '11px',
                          }}
                        />
                        <ReferenceLine y={40} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
                        <ReferenceLine y={70} stroke="hsl(142 71% 35%)" strokeDasharray="5 5" />
                        <Line
                          type="monotone"
                          dataKey="ecosystemHealth"
                          stroke="hsl(142 71% 35%)"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Start the simulation to see trends</p>
                </div>
              </div>
            )}

            {/* Challenge info */}
            <div className="mt-6 p-4 bg-accent/10 rounded-xl border border-accent/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-accent mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">The Challenge</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Find the maximum pumping rate that maintains ecosystem health above 70% 
                    for 100 years. The "sustainable yield" isn't just recharge—ecosystems need 
                    baseflow too!
                  </p>
                </div>
              </div>
            </div>

            {/* Attribution */}
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Based on the work of Prof. Victor Miguel Ponce, SDSU
                <br />
                <a
                  href="https://ponce.sdsu.edu/groundwater_sustainable_yield.html"
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

export default GroundwaterSimulator;
