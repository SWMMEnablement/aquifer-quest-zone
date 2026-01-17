import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

interface CNMethodComparisonProps {
  rainfall: number;
  soilType: string;
  landUse: string;
  scsCN: number;
  scsRunoff: number;
}

// Infiltration calculation methods
const calculateGreenAmpt = (rainfall: number, soilType: string): { runoff: number; infiltration: number; description: string } => {
  // Green-Ampt parameters by soil type
  const params: Record<string, { K: number; psi: number; theta: number }> = {
    A: { K: 11.78, psi: 4.95, theta: 0.417 }, // Sandy loam
    B: { K: 1.09, psi: 8.89, theta: 0.434 },  // Loam
    C: { K: 0.34, psi: 20.88, theta: 0.476 }, // Clay loam
    D: { K: 0.03, psi: 31.63, theta: 0.475 }, // Clay
  };
  
  const p = params[soilType] || params.B;
  const rainIntensity = rainfall / 2; // assume 2-hour storm (in/hr)
  
  // Simplified Green-Ampt: F = K*t + psi*theta*ln(1 + F/(psi*theta))
  // Iterative solution approximation
  let cumInfiltration = 0;
  const dt = 0.1; // 6 min intervals
  const totalTime = 2; // hours
  
  for (let t = 0; t < totalTime; t += dt) {
    const potentialRate = p.K * (1 + (p.psi * p.theta) / (cumInfiltration + 0.001));
    const actualRate = Math.min(rainIntensity, potentialRate);
    cumInfiltration += actualRate * dt;
  }
  
  const runoff = Math.max(0, rainfall - cumInfiltration);
  
  return {
    runoff: Math.round(runoff * 100) / 100,
    infiltration: Math.round(cumInfiltration * 100) / 100,
    description: "Physics-based infiltration using soil hydraulic properties (K, ψ, θ)"
  };
};

const calculatePhilip = (rainfall: number, soilType: string): { runoff: number; infiltration: number; description: string } => {
  // Philip's infiltration equation parameters
  const params: Record<string, { S: number; A: number }> = {
    A: { S: 6.0, A: 3.0 },   // High sorptivity sandy soil
    B: { S: 4.0, A: 1.5 },   // Medium loam
    C: { S: 2.0, A: 0.5 },   // Low infiltration clay loam
    D: { S: 0.5, A: 0.1 },   // Very low infiltration clay
  };
  
  const p = params[soilType] || params.B;
  const t = 2; // 2-hour storm
  
  // Philip equation: f(t) = 0.5*S*t^(-0.5) + A
  // Cumulative: F(t) = S*t^0.5 + A*t
  const cumInfiltration = p.S * Math.sqrt(t) + p.A * t;
  const runoff = Math.max(0, rainfall - cumInfiltration);
  
  return {
    runoff: Math.round(runoff * 100) / 100,
    infiltration: Math.round(Math.min(rainfall, cumInfiltration) * 100) / 100,
    description: "Two-term algebraic equation (sorptivity + steady-state rate)"
  };
};

const calculateHorton = (rainfall: number, soilType: string): { runoff: number; infiltration: number; description: string } => {
  // Horton equation parameters
  const params: Record<string, { f0: number; fc: number; k: number }> = {
    A: { f0: 5.0, fc: 1.5, k: 2.0 },   // High initial, high final
    B: { f0: 3.0, fc: 0.8, k: 2.5 },   // Medium
    C: { f0: 1.5, fc: 0.3, k: 3.0 },   // Low
    D: { f0: 0.5, fc: 0.05, k: 4.0 },  // Very low
  };
  
  const p = params[soilType] || params.B;
  const t = 2; // 2-hour storm
  
  // Horton: f(t) = fc + (f0 - fc) * e^(-kt)
  // Cumulative: F(t) = fc*t + (f0 - fc)/k * (1 - e^(-kt))
  const cumInfiltration = p.fc * t + (p.f0 - p.fc) / p.k * (1 - Math.exp(-p.k * t));
  const runoff = Math.max(0, rainfall - cumInfiltration);
  
  return {
    runoff: Math.round(runoff * 100) / 100,
    infiltration: Math.round(Math.min(rainfall, cumInfiltration) * 100) / 100,
    description: "Exponential decay from initial to final infiltration rate"
  };
};

const CNMethodComparison = ({ rainfall, soilType, landUse, scsCN, scsRunoff }: CNMethodComparisonProps) => {
  const comparisons = useMemo(() => {
    const greenAmpt = calculateGreenAmpt(rainfall, soilType);
    const philip = calculatePhilip(rainfall, soilType);
    const horton = calculateHorton(rainfall, soilType);
    
    return {
      greenAmpt,
      philip,
      horton,
      chartData: [
        {
          method: "SCS-CN",
          runoff: scsRunoff,
          infiltration: rainfall - scsRunoff,
          color: "hsl(205 85% 35%)",
        },
        {
          method: "Green-Ampt",
          runoff: greenAmpt.runoff,
          infiltration: greenAmpt.infiltration,
          color: "hsl(180 65% 40%)",
        },
        {
          method: "Philip",
          runoff: philip.runoff,
          infiltration: philip.infiltration,
          color: "hsl(142 71% 35%)",
        },
        {
          method: "Horton",
          runoff: horton.runoff,
          infiltration: horton.infiltration,
          color: "hsl(45 93% 47%)",
        },
      ],
    };
  }, [rainfall, soilType, scsRunoff]);

  return (
    <Card className="p-6 shadow-card">
      <h2 className="font-semibold text-lg mb-2 text-foreground">
        Method Comparison
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Compare SCS-CN with physics-based infiltration models for the same conditions
      </p>

      {/* Bar chart comparison */}
      <div className="h-56 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={comparisons.chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              type="number" 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              label={{ value: 'Depth (inches)', position: 'bottom', offset: -5, fontSize: 10 }}
            />
            <YAxis 
              type="category" 
              dataKey="method" 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              width={80}
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
            <Bar dataKey="runoff" name="Runoff" stackId="a">
              {comparisons.chartData.map((entry, index) => (
                <Cell key={`runoff-${index}`} fill={entry.color} />
              ))}
            </Bar>
            <Bar dataKey="infiltration" name="Infiltration" stackId="a" fill="hsl(var(--muted))" opacity={0.5} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Method descriptions */}
      <div className="space-y-3">
        <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-foreground">SCS Curve Number</span>
            <span className="text-sm font-bold text-primary">{scsRunoff}" runoff</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Empirical method using CN to represent combined land use and soil effects
          </p>
        </div>

        <div className="p-3 bg-water-light/10 rounded-lg border border-water-light/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-foreground">Green-Ampt</span>
            <span className="text-sm font-bold text-water-medium">{comparisons.greenAmpt.runoff}" runoff</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {comparisons.greenAmpt.description}
          </p>
        </div>

        <div className="p-3 bg-earth-green/10 rounded-lg border border-earth-green/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-foreground">Philip Equation</span>
            <span className="text-sm font-bold text-earth-green">{comparisons.philip.runoff}" runoff</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {comparisons.philip.description}
          </p>
        </div>

        <div className="p-3 bg-earth-amber/10 rounded-lg border border-earth-amber/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-foreground">Horton Equation</span>
            <span className="text-sm font-bold text-earth-amber">{comparisons.horton.runoff}" runoff</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {comparisons.horton.description}
          </p>
        </div>
      </div>

      {/* Key insight */}
      <div className="mt-4 p-3 bg-accent/10 rounded-lg border border-accent/20">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Note:</strong> Results vary because each method 
          captures different physics. Green-Ampt is most rigorous but requires more parameters. 
          SCS-CN is empirical but widely used for design storms.
        </p>
      </div>
    </Card>
  );
};

export default CNMethodComparison;
