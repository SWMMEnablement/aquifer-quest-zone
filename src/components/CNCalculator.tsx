import { useState, useMemo } from "react";
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
import { ArrowLeft, Info, AlertTriangle, TrendingUp, GitCompare } from "lucide-react";
import CNMethodComparison from "./CNMethodComparison";
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
} from "recharts";

interface CNCalculatorProps {
  onClose: () => void;
}

// Curve Number lookup table (simplified)
const cnTable: Record<string, Record<string, number>> = {
  "open-space-good": { A: 39, B: 61, C: 74, D: 80 },
  "open-space-fair": { A: 49, B: 69, C: 79, D: 84 },
  "open-space-poor": { A: 68, B: 79, C: 86, D: 89 },
  residential: { A: 61, B: 75, C: 83, D: 87 },
  commercial: { A: 89, B: 92, C: 94, D: 95 },
  industrial: { A: 81, B: 88, C: 91, D: 93 },
  agricultural: { A: 67, B: 78, C: 85, D: 89 },
  forest: { A: 30, B: 55, C: 70, D: 77 },
  meadow: { A: 30, B: 58, C: 71, D: 78 },
  paved: { A: 98, B: 98, C: 98, D: 98 },
};

const landUseLabels: Record<string, string> = {
  "open-space-good": "Open Space (Good Condition)",
  "open-space-fair": "Open Space (Fair Condition)",
  "open-space-poor": "Open Space (Poor Condition)",
  residential: "Residential (1/4 acre lots)",
  commercial: "Commercial/Business",
  industrial: "Industrial",
  agricultural: "Agricultural (Row Crops)",
  forest: "Forest (Good Cover)",
  meadow: "Meadow",
  paved: "Paved/Impervious",
};

const soilDescriptions: Record<string, string> = {
  A: "Low runoff potential, high infiltration (sand, loamy sand)",
  B: "Moderate infiltration (silt loam, loam)",
  C: "Slow infiltration (sandy clay loam)",
  D: "High runoff potential, very slow infiltration (clay)",
};

// AMC adjustment factors
const adjustCNForAMC = (cn: number, amc: number): number => {
  if (amc === 1) {
    // Dry conditions - AMC I
    return (4.2 * cn) / (10 - 0.058 * cn);
  } else if (amc === 3) {
    // Wet conditions - AMC III
    return (23 * cn) / (10 + 0.13 * cn);
  }
  return cn; // AMC II - normal
};

const CNCalculator = ({ onClose }: CNCalculatorProps) => {
  const [landUse, setLandUse] = useState("residential");
  const [soilType, setSoilType] = useState("B");
  const [amc, setAmc] = useState(2);
  const [rainfall, setRainfall] = useState([4]);
  const [showLimitations, setShowLimitations] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Calculate CN and runoff
  const calculations = useMemo(() => {
    const baseCN = cnTable[landUse]?.[soilType] || 75;
    const adjustedCN = adjustCNForAMC(baseCN, amc);
    const P = rainfall[0]; // inches

    // SCS Runoff Equation: Q = (P - Ia)² / (P - Ia + S)
    // where S = (1000/CN) - 10 and Ia = 0.2S (initial abstraction)
    const S = 1000 / adjustedCN - 10;
    const Ia = 0.2 * S;
    const runoff = P > Ia ? Math.pow(P - Ia, 2) / (P - Ia + S) : 0;
    const infiltration = P - runoff;
    const runoffPercent = (runoff / P) * 100;

    return {
      baseCN: Math.round(baseCN),
      adjustedCN: Math.round(adjustedCN * 10) / 10,
      S: Math.round(S * 100) / 100,
      Ia: Math.round(Ia * 100) / 100,
      runoff: Math.round(runoff * 100) / 100,
      infiltration: Math.round(infiltration * 100) / 100,
      runoffPercent: Math.round(runoffPercent),
    };
  }, [landUse, soilType, amc, rainfall]);

  // Generate sensitivity data
  const sensitivityData = useMemo(() => {
    const baseCN = cnTable[landUse]?.[soilType] || 75;
    const P = rainfall[0];
    const data = [];

    for (let cnDelta = -15; cnDelta <= 15; cnDelta += 3) {
      const cn = Math.max(30, Math.min(98, baseCN + cnDelta));
      const adjustedCN = adjustCNForAMC(cn, amc);
      const S = 1000 / adjustedCN - 10;
      const Ia = 0.2 * S;
      const runoff = P > Ia ? Math.pow(P - Ia, 2) / (P - Ia + S) : 0;

      data.push({
        cn: Math.round(adjustedCN),
        runoff: Math.round(runoff * 100) / 100,
        isCurrent: cnDelta === 0,
      });
    }
    return data;
  }, [landUse, soilType, amc, rainfall]);

  // Generate rainfall-runoff curve
  const rainfallRunoffData = useMemo(() => {
    const baseCN = cnTable[landUse]?.[soilType] || 75;
    const adjustedCN = adjustCNForAMC(baseCN, amc);
    const S = 1000 / adjustedCN - 10;
    const Ia = 0.2 * S;
    const data = [];

    for (let P = 0; P <= 10; P += 0.5) {
      const runoff = P > Ia ? Math.pow(P - Ia, 2) / (P - Ia + S) : 0;
      data.push({
        rainfall: P,
        runoff: Math.round(runoff * 100) / 100,
        isSelected: Math.abs(P - rainfall[0]) < 0.25,
      });
    }
    return data;
  }, [landUse, soilType, amc, rainfall]);

  const amcLabels = ["", "I (Dry)", "II (Normal)", "III (Wet)"];

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
              Curve Number Calculator
            </h1>
            <p className="text-muted-foreground mt-1">
              SCS Runoff Curve Number Method with sensitivity analysis
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <Card className="p-6 shadow-card">
            <h2 className="font-semibold text-lg mb-6 text-foreground">
              Input Parameters
            </h2>

            {/* Land Use */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Land Use / Cover
              </label>
              <Select value={landUse} onValueChange={setLandUse}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(landUseLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Soil Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Hydrologic Soil Group
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["A", "B", "C", "D"].map((soil) => (
                  <Button
                    key={soil}
                    variant={soilType === soil ? "default" : "outline"}
                    className="font-semibold"
                    onClick={() => setSoilType(soil)}
                  >
                    {soil}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {soilDescriptions[soilType]}
              </p>
            </div>

            {/* AMC */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Antecedent Moisture Condition
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((condition) => (
                  <Button
                    key={condition}
                    variant={amc === condition ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAmc(condition)}
                  >
                    {amcLabels[condition]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Rainfall */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Rainfall Depth: <span className="text-primary font-bold">{rainfall[0]}"</span>
              </label>
              <Slider
                value={rainfall}
                onValueChange={setRainfall}
                min={0}
                max={10}
                step={0.1}
                className="mt-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0"</span>
                <span>10"</span>
              </div>
            </div>

            {/* Limitations toggle */}
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={() => setShowLimitations(!showLimitations)}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              {showLimitations ? "Hide" : "Show"} Assumptions & Limitations
            </Button>

            {showLimitations && (
              <div className="mt-4 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-2">Method Limitations:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Assumes uniform rainfall distribution</li>
                  <li>Initial abstraction (Ia = 0.2S) is empirical</li>
                  <li>Not suitable for storms &lt; 1" or &gt; 10"</li>
                  <li>CN is lumped parameter, doesn't capture spatial variation</li>
                  <li>AMC adjustments are approximations</li>
                </ul>
              </div>
            )}

            {/* Method comparison toggle */}
            <Button
              variant={showComparison ? "default" : "outline"}
              className="w-full mt-4"
              onClick={() => setShowComparison(!showComparison)}
            >
              <GitCompare className="w-4 h-4 mr-2" />
              {showComparison ? "Hide" : "Compare"} Methods
            </Button>
          </Card>

          {/* Method Comparison Panel - conditionally rendered */}
          {showComparison && (
            <CNMethodComparison
              rainfall={rainfall[0]}
              soilType={soilType}
              landUse={landUse}
              scsCN={calculations.adjustedCN}
              scsRunoff={calculations.runoff}
            />
          )}

          {/* Results Panel */}
          <Card className="p-6 shadow-card">
            <h2 className="font-semibold text-lg mb-6 text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Results
            </h2>

            {/* Main results */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-secondary rounded-xl">
                <div className="text-sm text-muted-foreground mb-1">Base CN</div>
                <div className="text-3xl font-bold text-secondary-foreground">
                  {calculations.baseCN}
                </div>
              </div>
              <div className="p-4 bg-primary/10 rounded-xl">
                <div className="text-sm text-muted-foreground mb-1">
                  Adjusted CN
                </div>
                <div className="text-3xl font-bold text-primary">
                  {calculations.adjustedCN}
                </div>
              </div>
            </div>

            {/* Water balance breakdown */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Water Balance</span>
                <span className="text-xs text-muted-foreground">
                  P = {rainfall[0]}"
                </span>
              </div>
              <div className="h-6 rounded-full overflow-hidden flex bg-muted">
                <div
                  className="water-gradient transition-all duration-500"
                  style={{ width: `${calculations.runoffPercent}%` }}
                />
                <div
                  className="bg-earth-green/60 transition-all duration-500"
                  style={{ width: `${100 - calculations.runoffPercent}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-primary font-medium">
                  Runoff: {calculations.runoff}" ({calculations.runoffPercent}%)
                </span>
                <span className="text-earth-green font-medium">
                  Infiltration: {calculations.infiltration}"
                </span>
              </div>
            </div>

            {/* Intermediate values */}
            <div className="p-4 bg-muted rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  Intermediate Values
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">S (Storage):</span>
                  <span className="ml-2 font-medium text-foreground">
                    {calculations.S}"
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Ia (Initial Abs):</span>
                  <span className="ml-2 font-medium text-foreground">
                    {calculations.Ia}"
                  </span>
                </div>
              </div>
            </div>

            {/* Rainfall-Runoff Curve */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-foreground mb-3">
                Rainfall-Runoff Relationship
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={rainfallRunoffData}>
                    <defs>
                      <linearGradient id="runoffGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(205 85% 35%)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(205 85% 35%)" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="rainfall"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      label={{ value: 'Rainfall (in)', position: 'bottom', offset: -5, fontSize: 10 }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      label={{ value: 'Runoff (in)', angle: -90, position: 'insideLeft', fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="runoff"
                      stroke="hsl(205 85% 35%)"
                      strokeWidth={2}
                      fill="url(#runoffGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          {/* Sensitivity Panel */}
          <Card className="p-6 shadow-card">
            <h2 className="font-semibold text-lg mb-6 text-foreground">
              Sensitivity Analysis
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              See how small changes in CN affect runoff estimates. The highlighted point shows your current selection.
            </p>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensitivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="cn"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    label={{ value: 'Curve Number', position: 'bottom', offset: -5, fontSize: 10 }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    label={{ value: 'Runoff (in)', angle: -90, position: 'insideLeft', fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="runoff"
                    stroke="hsl(180 65% 40%)"
                    strokeWidth={2}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      if (payload.isCurrent) {
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={6}
                            fill="hsl(205 85% 35%)"
                            stroke="white"
                            strokeWidth={2}
                          />
                        );
                      }
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={3}
                          fill="hsl(180 65% 40%)"
                        />
                      );
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Insight box */}
            <div className="mt-6 p-4 bg-accent/10 rounded-xl border border-accent/20">
              <p className="text-sm text-foreground">
                <span className="font-semibold">Key Insight:</span> A change of just ±5 in CN can result in{" "}
                <span className="text-primary font-bold">
                  {Math.abs(
                    (sensitivityData.find((d) => d.isCurrent)?.runoff || 0) -
                      (sensitivityData[Math.floor(sensitivityData.length / 2) + 2]?.runoff || 0)
                  ).toFixed(2)}"
                </span>{" "}
                difference in runoff depth.
              </p>
            </div>

            {/* Attribution */}
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Based on the work of Prof. Victor Miguel Ponce, SDSU
                <br />
                <a
                  href="https://ponce.sdsu.edu/"
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

export default CNCalculator;
