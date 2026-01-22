import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ArrowLeft, TreePine, Droplets, Fish, Bird, Leaf, Factory, Home, Wheat } from "lucide-react";

interface HydroEcologicalTrackerProps {
  onClose: () => void;
}

interface LandUse {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  baseFlow: number; // contribution to baseflow (0-1)
  runoff: number; // runoff coefficient
  habitat: number; // habitat quality (0-1)
  pollution: number; // pollution load (0-1)
}

const landUseTypes: LandUse[] = [
  { id: "forest", name: "Forest", icon: TreePine, color: "hsl(var(--earth-green))", baseFlow: 0.8, runoff: 0.1, habitat: 1.0, pollution: 0.05 },
  { id: "wetland", name: "Wetland", icon: Droplets, color: "hsl(var(--water-dark))", baseFlow: 0.9, runoff: 0.15, habitat: 0.95, pollution: 0.02 },
  { id: "agriculture", name: "Agriculture", icon: Wheat, color: "hsl(var(--earth-amber))", baseFlow: 0.4, runoff: 0.35, habitat: 0.3, pollution: 0.5 },
  { id: "urban", name: "Urban", icon: Home, color: "hsl(var(--muted))", baseFlow: 0.1, runoff: 0.85, habitat: 0.1, pollution: 0.7 },
  { id: "industrial", name: "Industrial", icon: Factory, color: "hsl(var(--destructive))", baseFlow: 0.05, runoff: 0.9, habitat: 0.05, pollution: 0.9 },
];

const HydroEcologicalTracker = ({ onClose }: HydroEcologicalTrackerProps) => {
  const [landUseDistribution, setLandUseDistribution] = useState<Record<string, number>>({
    forest: 40,
    wetland: 10,
    agriculture: 30,
    urban: 15,
    industrial: 5,
  });
  
  const [precipitation, setPrecipitation] = useState(1000); // mm/year
  const [waterDiversion, setWaterDiversion] = useState(20); // % of flow

  const updateLandUse = (id: string, value: number) => {
    const currentTotal = Object.values(landUseDistribution).reduce((a, b) => a + b, 0);
    const currentValue = landUseDistribution[id];
    const diff = value - currentValue;
    
    // Adjust other values proportionally to maintain 100%
    if (currentTotal + diff !== 100) {
      const others = Object.keys(landUseDistribution).filter(k => k !== id);
      const othersTotal = others.reduce((sum, k) => sum + landUseDistribution[k], 0);
      
      if (othersTotal > 0) {
        const newDist = { ...landUseDistribution, [id]: value };
        const adjustment = diff / others.length;
        
        others.forEach(k => {
          newDist[k] = Math.max(0, Math.min(100, landUseDistribution[k] - adjustment));
        });
        
        // Normalize to 100%
        const newTotal = Object.values(newDist).reduce((a, b) => a + b, 0);
        if (newTotal !== 100) {
          const scale = 100 / newTotal;
          Object.keys(newDist).forEach(k => {
            newDist[k] = Math.round(newDist[k] * scale * 10) / 10;
          });
        }
        
        setLandUseDistribution(newDist);
      }
    } else {
      setLandUseDistribution({ ...landUseDistribution, [id]: value });
    }
  };

  const watershedMetrics = useMemo(() => {
    let weightedBaseFlow = 0;
    let weightedRunoff = 0;
    let weightedHabitat = 0;
    let weightedPollution = 0;
    
    landUseTypes.forEach(lu => {
      const fraction = landUseDistribution[lu.id] / 100;
      weightedBaseFlow += lu.baseFlow * fraction;
      weightedRunoff += lu.runoff * fraction;
      weightedHabitat += lu.habitat * fraction;
      weightedPollution += lu.pollution * fraction;
    });
    
    // Calculate flows (simplified water balance)
    const totalPrecip = precipitation; // mm/year
    const evapotranspiration = totalPrecip * (0.4 + 0.3 * (landUseDistribution.forest + landUseDistribution.wetland) / 100);
    const effectivePrecip = totalPrecip - evapotranspiration;
    
    const runoffVolume = effectivePrecip * weightedRunoff;
    const baseflowVolume = effectivePrecip * (1 - weightedRunoff) * weightedBaseFlow;
    const totalStreamflow = runoffVolume + baseflowVolume;
    
    const availableFlow = totalStreamflow * (1 - waterDiversion / 100);
    
    // Ecosystem health indices
    const flowHealth = Math.min(1, availableFlow / (totalStreamflow * 0.7)); // 70% minimum flow
    const waterQuality = 1 - weightedPollution * 0.8;
    const habitatConnectivity = weightedHabitat * (1 - waterDiversion / 200);
    
    // Species indicators
    const fishHealth = flowHealth * waterQuality * 0.8 + habitatConnectivity * 0.2;
    const birdHealth = habitatConnectivity * 0.6 + waterQuality * 0.4;
    const riparianHealth = flowHealth * 0.5 + habitatConnectivity * 0.5;
    
    const overallEcosystemHealth = (fishHealth + birdHealth + riparianHealth + waterQuality) / 4;
    
    return {
      totalPrecip,
      evapotranspiration,
      runoffVolume,
      baseflowVolume,
      totalStreamflow,
      availableFlow,
      flowHealth,
      waterQuality,
      habitatConnectivity,
      fishHealth,
      birdHealth,
      riparianHealth,
      overallEcosystemHealth,
      weightedRunoff,
    };
  }, [landUseDistribution, precipitation, waterDiversion]);

  const getHealthColor = (value: number) => {
    if (value >= 0.7) return "text-green-500";
    if (value >= 0.4) return "text-yellow-500";
    return "text-red-500";
  };

  const getHealthBg = (value: number) => {
    if (value >= 0.7) return "bg-green-500/20";
    if (value >= 0.4) return "bg-yellow-500/20";
    return "bg-red-500/20";
  };

  return (
    <div className="min-h-screen bg-background py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Hydro-Ecological Impact Tracker
            </h1>
            <p className="text-muted-foreground mt-1">
              Explore how land use and water management affect watershed ecosystem health
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Controls Panel */}
          <div className="space-y-6">
            <Card className="water-card">
              <CardHeader>
                <CardTitle className="text-lg">Land Use Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {landUseTypes.map((lu) => {
                  const Icon = lu.icon;
                  return (
                    <div key={lu.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" style={{ color: lu.color }} />
                          <Label className="text-sm">{lu.name}</Label>
                        </div>
                        <span className="text-sm font-medium">
                          {landUseDistribution[lu.id].toFixed(1)}%
                        </span>
                      </div>
                      <Slider
                        value={[landUseDistribution[lu.id]]}
                        onValueChange={([v]) => updateLandUse(lu.id, v)}
                        max={100}
                        step={1}
                        className="cursor-pointer"
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="water-card">
              <CardHeader>
                <CardTitle className="text-lg">Climate & Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Annual Precipitation</Label>
                    <span className="text-sm font-medium">{precipitation} mm</span>
                  </div>
                  <Slider
                    value={[precipitation]}
                    onValueChange={([v]) => setPrecipitation(v)}
                    min={400}
                    max={2000}
                    step={50}
                    className="cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Water Diversion</Label>
                    <span className="text-sm font-medium">{waterDiversion}%</span>
                  </div>
                  <Slider
                    value={[waterDiversion]}
                    onValueChange={([v]) => setWaterDiversion(v)}
                    min={0}
                    max={80}
                    step={5}
                    className="cursor-pointer"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Watershed Visualization */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="water-card">
              <CardHeader>
                <CardTitle className="text-lg">Interactive Watershed</CardTitle>
              </CardHeader>
              <CardContent>
                <svg viewBox="0 0 500 350" className="w-full h-auto">
                  {/* Background */}
                  <defs>
                    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="hsl(var(--water-light))" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="hsl(var(--background))" />
                    </linearGradient>
                    <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="hsl(var(--water))" />
                      <stop offset="100%" stopColor="hsl(var(--water-dark))" />
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" width="500" height="350" fill="url(#skyGrad)" />
                  
                  {/* Mountains/Watershed boundary */}
                  <path
                    d="M0,150 Q50,80 100,120 Q150,50 200,100 Q250,30 300,90 Q350,60 400,110 Q450,70 500,120 L500,350 L0,350 Z"
                    fill="hsl(var(--earth-brown))"
                    opacity="0.3"
                  />
                  
                  {/* Land use patches - Forest */}
                  <g opacity={landUseDistribution.forest / 100}>
                    <ellipse cx="80" cy="200" rx="60" ry="40" fill="hsl(var(--earth-green))" opacity="0.7" />
                    <ellipse cx="420" cy="180" rx="50" ry="35" fill="hsl(var(--earth-green))" opacity="0.7" />
                    {/* Trees */}
                    {[70, 90, 110, 400, 430].map((x, i) => (
                      <g key={i}>
                        <polygon points={`${x},${170 + i * 5} ${x - 10},${200 + i * 5} ${x + 10},${200 + i * 5}`} fill="hsl(var(--earth-green))" />
                        <rect x={x - 2} y={200 + i * 5} width="4" height="15" fill="hsl(var(--earth-brown))" />
                      </g>
                    ))}
                  </g>
                  
                  {/* Wetland */}
                  <g opacity={landUseDistribution.wetland / 100}>
                    <ellipse cx="250" cy="290" rx="60" ry="25" fill="hsl(var(--water-dark))" opacity="0.5" />
                    {/* Reeds */}
                    {[220, 240, 260, 280].map((x, i) => (
                      <g key={i}>
                        <line x1={x} y1="280" x2={x} y2="260" stroke="hsl(var(--earth-green))" strokeWidth="2" />
                        <ellipse cx={x} cy="258" rx="3" ry="5" fill="hsl(var(--earth-amber))" />
                      </g>
                    ))}
                  </g>
                  
                  {/* Agriculture */}
                  <g opacity={landUseDistribution.agriculture / 100}>
                    <rect x="150" y="200" width="80" height="50" fill="hsl(var(--earth-amber))" opacity="0.6" rx="5" />
                    {/* Crop rows */}
                    {[160, 175, 190, 205, 220].map((x, i) => (
                      <line key={i} x1={x} y1="205" x2={x} y2="245" stroke="hsl(var(--earth-green))" strokeWidth="3" strokeDasharray="2,4" />
                    ))}
                  </g>
                  
                  {/* Urban */}
                  <g opacity={landUseDistribution.urban / 100}>
                    <rect x="300" y="220" width="70" height="60" fill="hsl(var(--muted))" opacity="0.7" rx="3" />
                    {/* Buildings */}
                    <rect x="310" y="235" width="15" height="25" fill="hsl(var(--muted-foreground))" opacity="0.5" />
                    <rect x="330" y="225" width="12" height="35" fill="hsl(var(--muted-foreground))" opacity="0.5" />
                    <rect x="347" y="240" width="18" height="20" fill="hsl(var(--muted-foreground))" opacity="0.5" />
                  </g>
                  
                  {/* Industrial */}
                  <g opacity={landUseDistribution.industrial / 100}>
                    <rect x="380" y="250" width="50" height="40" fill="hsl(var(--destructive))" opacity="0.4" rx="2" />
                    {/* Smokestacks */}
                    <rect x="395" y="230" width="8" height="30" fill="hsl(var(--muted-foreground))" />
                    <ellipse cx="399" cy="225" rx="12" ry="8" fill="hsl(var(--muted))" opacity="0.5" />
                  </g>
                  
                  {/* River */}
                  <path
                    d="M250,100 Q230,150 250,180 Q270,210 240,250 Q220,280 250,320 Q260,340 250,350"
                    fill="none"
                    stroke="url(#waterGrad)"
                    strokeWidth={8 + watershedMetrics.availableFlow / 50}
                    strokeLinecap="round"
                    opacity={0.5 + watershedMetrics.flowHealth * 0.5}
                  />
                  
                  {/* Rain drops */}
                  {precipitation > 800 && Array.from({ length: Math.floor((precipitation - 800) / 100) }, (_, i) => (
                    <g key={i} className="animate-flow" style={{ animationDelay: `${i * 0.2}s` }}>
                      <ellipse cx={50 + i * 80} cy="50" rx="2" ry="4" fill="hsl(var(--water))" opacity="0.6" />
                    </g>
                  ))}
                  
                  {/* Species indicators */}
                  <g transform="translate(20, 310)">
                    <Fish className={`h-6 w-6 ${getHealthColor(watershedMetrics.fishHealth)}`} />
                  </g>
                  <g transform="translate(460, 140)">
                    <Bird className={`h-6 w-6 ${getHealthColor(watershedMetrics.birdHealth)}`} />
                  </g>
                  <g transform="translate(180, 180)">
                    <Leaf className={`h-5 w-5 ${getHealthColor(watershedMetrics.riparianHealth)}`} />
                  </g>
                </svg>
              </CardContent>
            </Card>

            {/* Ecosystem Health Dashboard */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="water-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Water Balance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Precipitation</span>
                    <span className="font-medium">{watershedMetrics.totalPrecip} mm/yr</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Evapotranspiration</span>
                    <span className="font-medium">{watershedMetrics.evapotranspiration.toFixed(0)} mm/yr</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Runoff</span>
                    <span className="font-medium">{watershedMetrics.runoffVolume.toFixed(0)} mm/yr</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Baseflow</span>
                    <span className="font-medium">{watershedMetrics.baseflowVolume.toFixed(0)} mm/yr</span>
                  </div>
                  <div className="h-px bg-border my-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Available Flow</span>
                    <span className={`font-bold ${getHealthColor(watershedMetrics.flowHealth)}`}>
                      {watershedMetrics.availableFlow.toFixed(0)} mm/yr
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="water-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Ecosystem Indicators</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Fish className="h-4 w-4" />
                      <span className="text-sm text-muted-foreground">Fish Health</span>
                    </div>
                    <div className={`px-2 py-0.5 rounded text-xs font-medium ${getHealthBg(watershedMetrics.fishHealth)} ${getHealthColor(watershedMetrics.fishHealth)}`}>
                      {(watershedMetrics.fishHealth * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bird className="h-4 w-4" />
                      <span className="text-sm text-muted-foreground">Bird Habitat</span>
                    </div>
                    <div className={`px-2 py-0.5 rounded text-xs font-medium ${getHealthBg(watershedMetrics.birdHealth)} ${getHealthColor(watershedMetrics.birdHealth)}`}>
                      {(watershedMetrics.birdHealth * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Leaf className="h-4 w-4" />
                      <span className="text-sm text-muted-foreground">Riparian Zone</span>
                    </div>
                    <div className={`px-2 py-0.5 rounded text-xs font-medium ${getHealthBg(watershedMetrics.riparianHealth)} ${getHealthColor(watershedMetrics.riparianHealth)}`}>
                      {(watershedMetrics.riparianHealth * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4" />
                      <span className="text-sm text-muted-foreground">Water Quality</span>
                    </div>
                    <div className={`px-2 py-0.5 rounded text-xs font-medium ${getHealthBg(watershedMetrics.waterQuality)} ${getHealthColor(watershedMetrics.waterQuality)}`}>
                      {(watershedMetrics.waterQuality * 100).toFixed(0)}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Overall Health Meter */}
            <Card className={`water-card ${getHealthBg(watershedMetrics.overallEcosystemHealth)}`}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Overall Ecosystem Health</h3>
                    <p className="text-sm text-muted-foreground">
                      {watershedMetrics.overallEcosystemHealth >= 0.7
                        ? "Healthy watershed with good ecological function"
                        : watershedMetrics.overallEcosystemHealth >= 0.4
                        ? "Moderate stress - consider reducing development or diversion"
                        : "Critical - ecosystem services severely impaired"}
                    </p>
                  </div>
                  <div className={`text-4xl font-bold ${getHealthColor(watershedMetrics.overallEcosystemHealth)}`}>
                    {(watershedMetrics.overallEcosystemHealth * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="mt-3 h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      watershedMetrics.overallEcosystemHealth >= 0.7
                        ? "bg-green-500"
                        : watershedMetrics.overallEcosystemHealth >= 0.4
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${watershedMetrics.overallEcosystemHealth * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Reference */}
            <p className="text-xs text-muted-foreground text-center">
              Based on conceptual models from{" "}
              <a
                href="https://ponce.sdsu.edu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                ponce.sdsu.edu
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HydroEcologicalTracker;
