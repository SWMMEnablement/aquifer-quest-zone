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
import { ArrowLeft, Info, AlertTriangle, TrendingUp, GitCompare, Download, Ruler } from "lucide-react";
import { getMergedTheory } from "@/lib/hydrology/theory-store";
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
import {
  LAND_USE_LABELS,
  SOIL_DESCRIPTIONS,
  AMC_LABELS,
  computeCNResults,
  computeSensitivityData,
  computeRainfallRunoffCurve,
} from "@/lib/hydrology/cn-method";
import packageJson from "../../package.json";

interface CNCalculatorProps {
  onClose: () => void;
}

const CNCalculator = ({ onClose }: CNCalculatorProps) => {
  const [landUse, setLandUse] = useState("residential");
  const [soilType, setSoilType] = useState("B");
  const [amc, setAmc] = useState(2);
  const [rainfall, setRainfall] = useState([4]);
  const [showLimitations, setShowLimitations] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [units, setUnits] = useState<"imperial" | "metric">("imperial");

  const INCH_TO_MM = 25.4;
  const toDisplay = (inches: number) =>
    units === "metric" ? Math.round(inches * INCH_TO_MM * 10) / 10 : inches;
  const unitLabel = () => (units === "metric" ? "mm" : '"');
  const unitLabelLong = () => (units === "metric" ? "mm" : "in");

  const calculations = useMemo(
    () => computeCNResults(landUse, soilType, amc, rainfall[0]),
    [landUse, soilType, amc, rainfall]
  );

  const sensitivityData = useMemo(
    () => computeSensitivityData(landUse, soilType, amc, rainfall[0]),
    [landUse, soilType, amc, rainfall]
  );

  const rainfallRunoffData = useMemo(
    () => computeRainfallRunoffCurve(landUse, soilType, amc, rainfall[0]),
    [landUse, soilType, amc, rainfall]
  );

  const theory = getMergedTheory("cn-calculator");

  const displaySensitivityData = useMemo(
    () =>
      sensitivityData.map((d) => ({
        ...d,
        runoff: toDisplay(d.runoff),
      })),
    [sensitivityData, units]
  );

  const displayRainfallRunoffData = useMemo(
    () =>
      rainfallRunoffData.map((d) => ({
        ...d,
        rainfall: toDisplay(d.rainfall),
        runoff: toDisplay(d.runoff),
      })),
    [rainfallRunoffData, units]
  );

  const exportPayload = useMemo(
    () => ({
      module: "CN Explorer — SCS Curve Number Method",
      appVersion: packageJson.version,
      timestamp: new Date().toISOString(),
      units: unitLabelLong(),
      inputs: {
        landUse: LAND_USE_LABELS[landUse],
        soilType,
        soilDescription: SOIL_DESCRIPTIONS[soilType],
        amc: AMC_LABELS[amc],
        rainfallDepth: toDisplay(rainfall[0]),
      },
      results: {
        baseCN: calculations.baseCN,
        adjustedCN: calculations.adjustedCN,
        S: toDisplay(calculations.S),
        Ia: toDisplay(calculations.Ia),
        runoff: toDisplay(calculations.runoff),
        infiltration: toDisplay(calculations.infiltration),
        runoffPercent: calculations.runoffPercent,
      },
      sensitivity: displaySensitivityData,
      rainfallRunoffCurve: displayRainfallRunoffData,
      references: theory?.references.map((r) => r.citation) ?? [],
    }),
    [
      landUse,
      soilType,
      amc,
      rainfall,
      units,
      calculations,
      displaySensitivityData,
      displayRainfallRunoffData,
      theory,
    ]
  );

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cn-explorer-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    const rows: string[][] = [];
    rows.push(["CN Explorer — SCS Curve Number Method"]);
    rows.push(["App Version", exportPayload.appVersion]);
    rows.push(["Timestamp", exportPayload.timestamp]);
    rows.push(["Units", exportPayload.units]);
    rows.push([]);
    rows.push(["Inputs"]);
    rows.push(["Land Use", exportPayload.inputs.landUse]);
    rows.push(["Soil Group", exportPayload.inputs.soilType]);
    rows.push(["Soil Description", exportPayload.inputs.soilDescription]);
    rows.push(["AMC", exportPayload.inputs.amc]);
    rows.push([`Rainfall Depth (${unitLabelLong()})`, String(exportPayload.inputs.rainfallDepth)]);
    rows.push([]);
    rows.push(["Results"]);
    rows.push(["Base CN", String(calculations.baseCN)]);
    rows.push(["Adjusted CN", String(calculations.adjustedCN)]);
    rows.push([`S (storage) (${unitLabelLong()})`, `${toDisplay(calculations.S)}${unitLabel()}`]);
    rows.push([`Ia (initial abstraction) (${unitLabelLong()})`, `${toDisplay(calculations.Ia)}${unitLabel()}`]);
    rows.push([`Runoff (${unitLabelLong()})`, `${toDisplay(calculations.runoff)}${unitLabel()}`]);
    rows.push([`Infiltration (${unitLabelLong()})`, `${toDisplay(calculations.infiltration)}${unitLabel()}`]);
    rows.push(["Runoff (%)", `${calculations.runoffPercent}%`]);
    rows.push([]);
    rows.push(["Sensitivity Analysis"]);
    rows.push(["CN", `Runoff (${unitLabelLong()})`, "Current"]);
    displaySensitivityData.forEach((d) => rows.push([String(d.cn), String(d.runoff), d.isCurrent ? "Yes" : "No"]));
    rows.push([]);
    rows.push(["Rainfall–Runoff Curve"]);
    rows.push([`Rainfall (${unitLabelLong()})`, `Runoff (${unitLabelLong()})`, "Selected"]);
    displayRainfallRunoffData.forEach((d) => rows.push([String(d.rainfall), String(d.runoff), d.isSelected ? "Yes" : "No"]));
    rows.push([]);
    rows.push(["References"]);
    (theory?.references.map((r) => r.citation) ?? []).forEach((c) => rows.push([c]));

    const csv = rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cn-explorer-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-lg text-foreground">
                Input Parameters
              </h2>
              <div className="flex bg-muted rounded-lg p-0.5">
                <Button
                  variant={units === "imperial" ? "secondary" : "ghost"}
                  size="sm"
                  className="text-xs px-2 py-1 h-7"
                  onClick={() => setUnits("imperial")}
                >
                  in
                </Button>
                <Button
                  variant={units === "metric" ? "secondary" : "ghost"}
                  size="sm"
                  className="text-xs px-2 py-1 h-7"
                  onClick={() => setUnits("metric")}
                >
                  mm
                </Button>
              </div>
            </div>

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
                  {Object.entries(LAND_USE_LABELS).map(([value, label]) => (
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
                {SOIL_DESCRIPTIONS[soilType]}
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
                    {AMC_LABELS[condition]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Rainfall */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Rainfall Depth: <span className="text-primary font-bold">{toDisplay(rainfall[0])}{unitLabel()}</span>
              </label>
              <Slider
                value={units === "metric" ? [Math.round(rainfall[0] * INCH_TO_MM)] : rainfall}
                onValueChange={(v) =>
                  setRainfall(units === "metric" ? [Math.round((v[0] / INCH_TO_MM) * 10) / 10] : v)
                }
                min={0}
                max={units === "metric" ? 250 : 10}
                step={units === "metric" ? 2.5 : 0.1}
                className="mt-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0{unitLabel()}</span>
                <span>{units === "metric" ? "250" : "10"}{unitLabel()}</span>
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-lg text-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Results
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={downloadJSON}>
                  <Download className="w-3.5 h-3.5 mr-1" /> JSON
                </Button>
                <Button variant="outline" size="sm" onClick={downloadCSV}>
                  <Download className="w-3.5 h-3.5 mr-1" /> CSV
                </Button>
              </div>
            </div>

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
                  P = {toDisplay(rainfall[0])}{unitLabel()}
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
                  Runoff: {toDisplay(calculations.runoff)}{unitLabel()} ({calculations.runoffPercent}%)
                </span>
                <span className="text-earth-green font-medium">
                  Infiltration: {toDisplay(calculations.infiltration)}{unitLabel()}
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
                    {toDisplay(calculations.S)}{unitLabel()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Ia (Initial Abs):</span>
                  <span className="ml-2 font-medium text-foreground">
                    {toDisplay(calculations.Ia)}{unitLabel()}
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
                  <AreaChart data={displayRainfallRunoffData}>
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
                      label={{ value: `Rainfall (${unitLabelLong()})`, position: 'bottom', offset: -5, fontSize: 10 }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      label={{ value: `Runoff (${unitLabelLong()})`, angle: -90, position: 'insideLeft', fontSize: 10 }}
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
                <LineChart data={displaySensitivityData}>
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
                    label={{ value: `Runoff (${unitLabelLong()})`, angle: -90, position: 'insideLeft', fontSize: 10 }}
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
