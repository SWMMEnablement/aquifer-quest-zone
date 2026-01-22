import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Sun, Cloud, Droplets, ThermometerSun, Wind, TreePine } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

interface AlbedoWaterBalanceProps {
  onClose: () => void;
}

interface LandCover {
  id: string;
  name: string;
  albedo: number;
  emissivity: number;
  roughness: number; // aerodynamic roughness length (m)
  rootDepth: number; // m
  leafAreaIndex: number;
  color: string;
}

const landCovers: LandCover[] = [
  { id: "forest", name: "Dense Forest", albedo: 0.12, emissivity: 0.98, roughness: 2.0, rootDepth: 3.0, leafAreaIndex: 6, color: "hsl(var(--earth-green))" },
  { id: "grassland", name: "Grassland", albedo: 0.20, emissivity: 0.96, roughness: 0.03, rootDepth: 0.5, leafAreaIndex: 2, color: "hsl(var(--earth-amber))" },
  { id: "cropland", name: "Cropland", albedo: 0.18, emissivity: 0.95, roughness: 0.1, rootDepth: 1.0, leafAreaIndex: 3, color: "#8BC34A" },
  { id: "bare", name: "Bare Soil", albedo: 0.25, emissivity: 0.92, roughness: 0.005, rootDepth: 0, leafAreaIndex: 0, color: "hsl(var(--earth-brown))" },
  { id: "urban", name: "Urban/Impervious", albedo: 0.15, emissivity: 0.90, roughness: 1.0, rootDepth: 0, leafAreaIndex: 0.5, color: "hsl(var(--muted))" },
  { id: "water", name: "Open Water", albedo: 0.08, emissivity: 0.97, roughness: 0.0001, rootDepth: 0, leafAreaIndex: 0, color: "hsl(var(--water))" },
  { id: "snow", name: "Snow/Ice", albedo: 0.80, emissivity: 0.99, roughness: 0.001, rootDepth: 0, leafAreaIndex: 0, color: "#E3F2FD" },
  { id: "desert", name: "Desert Sand", albedo: 0.35, emissivity: 0.90, roughness: 0.001, rootDepth: 0.1, leafAreaIndex: 0.1, color: "#FFE0B2" },
];

const AlbedoWaterBalance = ({ onClose }: AlbedoWaterBalanceProps) => {
  const [currentLandCover, setCurrentLandCover] = useState("forest");
  const [proposedLandCover, setProposedLandCover] = useState("urban");
  const [solarRadiation, setSolarRadiation] = useState(250); // W/m²
  const [airTemperature, setAirTemperature] = useState(25); // °C
  const [relativeHumidity, setRelativeHumidity] = useState(60); // %
  const [windSpeed, setWindSpeed] = useState(3); // m/s
  const [precipitation, setPrecipitation] = useState(1200); // mm/year

  const currentCover = landCovers.find(lc => lc.id === currentLandCover)!;
  const proposedCover = landCovers.find(lc => lc.id === proposedLandCover)!;

  const calculateEnergyBalance = (cover: LandCover) => {
    // Stefan-Boltzmann constant
    const sigma = 5.67e-8;
    
    // Net shortwave radiation (absorbed solar)
    const Rns = solarRadiation * (1 - cover.albedo);
    
    // Surface temperature estimate (simplified)
    const Ts = airTemperature + 273.15 + (Rns * 0.02); // K
    const Ta = airTemperature + 273.15;
    
    // Net longwave radiation
    const Rnl = cover.emissivity * sigma * (Ta ** 4) - cover.emissivity * sigma * (Ts ** 4);
    
    // Net radiation
    const Rn = Rns + Rnl;
    
    // Ground heat flux (simplified - about 10% of Rn for vegetated, 30% for bare)
    const G = Rn * (cover.leafAreaIndex > 0 ? 0.1 : 0.3);
    
    // Available energy
    const availableEnergy = Rn - G;
    
    // Latent heat flux (evapotranspiration) - Penman-Monteith simplified
    const satVaporPressure = 0.6108 * Math.exp((17.27 * airTemperature) / (airTemperature + 237.3));
    const vaporPressureDeficit = satVaporPressure * (1 - relativeHumidity / 100);
    
    // Stomatal resistance based on LAI
    const rs = cover.leafAreaIndex > 0 ? 100 / cover.leafAreaIndex : 10000;
    const ra = Math.log((2 - 0.67 * cover.roughness) / (0.123 * cover.roughness)) ** 2 / (0.41 ** 2 * windSpeed);
    
    // Priestley-Taylor alpha modified by surface resistance
    const alpha = 1.26 * (1 / (1 + rs / (ra + 1)));
    
    // Latent heat (evapotranspiration energy)
    const LE = availableEnergy * alpha * (cover.leafAreaIndex > 0 ? 1 : 0.3);
    
    // Sensible heat (heating the air)
    const H = availableEnergy - LE;
    
    // Convert LE to evapotranspiration rate (mm/day)
    const latentHeatVaporization = 2.45e6; // J/kg
    const ET = (LE > 0 ? LE : 0) * 86400 / latentHeatVaporization; // mm/day
    const annualET = ET * 365; // mm/year
    
    // Water balance
    const runoff = Math.max(0, precipitation * (1 - cover.rootDepth / 3) * (1 - cover.leafAreaIndex / 8));
    const infiltration = precipitation - runoff - Math.min(annualET, precipitation);
    
    // Surface temperature relative to air
    const surfaceTempChange = (H > 0 ? H : 0) * 0.01;
    
    return {
      albedo: cover.albedo,
      netShortwave: Rns,
      netLongwave: Rnl,
      netRadiation: Rn,
      groundHeat: G,
      latentHeat: LE,
      sensibleHeat: H,
      availableEnergy,
      evapotranspiration: Math.min(annualET, precipitation),
      runoff,
      infiltration: Math.max(0, infiltration),
      surfaceTempChange,
      dailyET: ET,
    };
  };

  const currentBalance = useMemo(() => calculateEnergyBalance(currentCover), [currentCover, solarRadiation, airTemperature, relativeHumidity, windSpeed, precipitation]);
  const proposedBalance = useMemo(() => calculateEnergyBalance(proposedCover), [proposedCover, solarRadiation, airTemperature, relativeHumidity, windSpeed, precipitation]);

  const comparisonData = useMemo(() => [
    {
      name: "Net Radiation",
      current: currentBalance.netRadiation,
      proposed: proposedBalance.netRadiation,
      unit: "W/m²",
    },
    {
      name: "Latent Heat",
      current: currentBalance.latentHeat,
      proposed: proposedBalance.latentHeat,
      unit: "W/m²",
    },
    {
      name: "Sensible Heat",
      current: currentBalance.sensibleHeat,
      proposed: proposedBalance.sensibleHeat,
      unit: "W/m²",
    },
    {
      name: "Ground Heat",
      current: currentBalance.groundHeat,
      proposed: proposedBalance.groundHeat,
      unit: "W/m²",
    },
  ], [currentBalance, proposedBalance]);

  const waterBalanceData = useMemo(() => [
    {
      name: "Evapotranspiration",
      current: currentBalance.evapotranspiration,
      proposed: proposedBalance.evapotranspiration,
    },
    {
      name: "Runoff",
      current: currentBalance.runoff,
      proposed: proposedBalance.runoff,
    },
    {
      name: "Infiltration",
      current: currentBalance.infiltration,
      proposed: proposedBalance.infiltration,
    },
  ], [currentBalance, proposedBalance]);

  const albedoChange = proposedCover.albedo - currentCover.albedo;
  const etChange = proposedBalance.evapotranspiration - currentBalance.evapotranspiration;
  const tempChange = proposedBalance.surfaceTempChange - currentBalance.surfaceTempChange;

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
              Albedo & Water Balance Visualizer
            </h1>
            <p className="text-muted-foreground mt-1">
              Explore how land cover changes affect local climate and water resources through energy balance
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Controls Panel */}
          <div className="space-y-6">
            <Card className="water-card">
              <CardHeader>
                <CardTitle className="text-lg">Land Cover Comparison</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Land Cover</Label>
                  <Select value={currentLandCover} onValueChange={setCurrentLandCover}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {landCovers.map(lc => (
                        <SelectItem key={lc.id} value={lc.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: lc.color }} />
                            {lc.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Proposed Land Cover</Label>
                  <Select value={proposedLandCover} onValueChange={setProposedLandCover}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {landCovers.map(lc => (
                        <SelectItem key={lc.id} value={lc.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: lc.color }} />
                            {lc.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="water-card">
              <CardHeader>
                <CardTitle className="text-lg">Climate Conditions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Sun className="h-4 w-4 text-amber-500" />
                      Solar Radiation
                    </Label>
                    <span className="text-sm font-medium">{solarRadiation} W/m²</span>
                  </div>
                  <Slider
                    value={[solarRadiation]}
                    onValueChange={([v]) => setSolarRadiation(v)}
                    min={100}
                    max={400}
                    step={10}
                    className="cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <ThermometerSun className="h-4 w-4 text-red-500" />
                      Air Temperature
                    </Label>
                    <span className="text-sm font-medium">{airTemperature}°C</span>
                  </div>
                  <Slider
                    value={[airTemperature]}
                    onValueChange={([v]) => setAirTemperature(v)}
                    min={0}
                    max={40}
                    step={1}
                    className="cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Cloud className="h-4 w-4 text-slate-500" />
                      Relative Humidity
                    </Label>
                    <span className="text-sm font-medium">{relativeHumidity}%</span>
                  </div>
                  <Slider
                    value={[relativeHumidity]}
                    onValueChange={([v]) => setRelativeHumidity(v)}
                    min={20}
                    max={100}
                    step={5}
                    className="cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Wind className="h-4 w-4 text-cyan-500" />
                      Wind Speed
                    </Label>
                    <span className="text-sm font-medium">{windSpeed} m/s</span>
                  </div>
                  <Slider
                    value={[windSpeed]}
                    onValueChange={([v]) => setWindSpeed(v)}
                    min={0.5}
                    max={10}
                    step={0.5}
                    className="cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      Annual Precipitation
                    </Label>
                    <span className="text-sm font-medium">{precipitation} mm</span>
                  </div>
                  <Slider
                    value={[precipitation]}
                    onValueChange={([v]) => setPrecipitation(v)}
                    min={200}
                    max={2500}
                    step={50}
                    className="cursor-pointer"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Surface Properties */}
            <Card className="water-card">
              <CardHeader>
                <CardTitle className="text-lg">Surface Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-2 font-medium">Current</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Albedo:</span>
                        <span>{(currentCover.albedo * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">LAI:</span>
                        <span>{currentCover.leafAreaIndex}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Root Depth:</span>
                        <span>{currentCover.rootDepth}m</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-2 font-medium">Proposed</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Albedo:</span>
                        <span>{(proposedCover.albedo * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">LAI:</span>
                        <span>{proposedCover.leafAreaIndex}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Root Depth:</span>
                        <span>{proposedCover.rootDepth}m</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visualizations */}
          <div className="lg:col-span-2 space-y-6">
            {/* Impact Summary */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className={`water-card ${albedoChange > 0 ? "border-amber-500/50" : "border-blue-500/50"}`}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Sun className="h-4 w-4" />
                    <span className="text-sm">Albedo Change</span>
                  </div>
                  <div className={`text-2xl font-bold ${albedoChange > 0 ? "text-amber-500" : "text-blue-500"}`}>
                    {albedoChange > 0 ? "+" : ""}{(albedoChange * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {albedoChange > 0 ? "More light reflected" : "More light absorbed"}
                  </p>
                </CardContent>
              </Card>

              <Card className={`water-card ${etChange < 0 ? "border-red-500/50" : "border-green-500/50"}`}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Droplets className="h-4 w-4" />
                    <span className="text-sm">ET Change</span>
                  </div>
                  <div className={`text-2xl font-bold ${etChange < 0 ? "text-red-500" : "text-green-500"}`}>
                    {etChange > 0 ? "+" : ""}{etChange.toFixed(0)} mm/yr
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {etChange < 0 ? "Less water recycled" : "More water recycled"}
                  </p>
                </CardContent>
              </Card>

              <Card className={`water-card ${tempChange > 0 ? "border-red-500/50" : "border-blue-500/50"}`}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <ThermometerSun className="h-4 w-4" />
                    <span className="text-sm">Temperature Effect</span>
                  </div>
                  <div className={`text-2xl font-bold ${tempChange > 0 ? "text-red-500" : "text-blue-500"}`}>
                    {tempChange > 0 ? "+" : ""}{tempChange.toFixed(1)}°C
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tempChange > 0 ? "Surface warming" : "Surface cooling"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Energy Balance Diagram */}
            <Card className="water-card">
              <CardHeader>
                <CardTitle className="text-lg">Energy Balance Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <svg viewBox="0 0 600 250" className="w-full h-auto">
                  {/* Background */}
                  <defs>
                    <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#87CEEB" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="white" stopOpacity="0" />
                    </linearGradient>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
                    </marker>
                  </defs>
                  <rect x="0" y="0" width="600" height="250" fill="url(#skyGradient)" />
                  
                  {/* Sun */}
                  <circle cx="300" cy="30" r="25" fill="#FFC107" />
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                    <line
                      key={i}
                      x1={300 + 30 * Math.cos(angle * Math.PI / 180)}
                      y1={30 + 30 * Math.sin(angle * Math.PI / 180)}
                      x2={300 + 40 * Math.cos(angle * Math.PI / 180)}
                      y2={30 + 40 * Math.sin(angle * Math.PI / 180)}
                      stroke="#FFC107"
                      strokeWidth="2"
                    />
                  ))}
                  
                  {/* Current surface (left) */}
                  <rect x="50" y="180" width="200" height="60" fill={currentCover.color} rx="5" />
                  <text x="150" y="215" textAnchor="middle" className="text-xs fill-foreground font-medium">
                    {currentCover.name}
                  </text>
                  
                  {/* Proposed surface (right) */}
                  <rect x="350" y="180" width="200" height="60" fill={proposedCover.color} rx="5" />
                  <text x="450" y="215" textAnchor="middle" className="text-xs fill-foreground font-medium">
                    {proposedCover.name}
                  </text>
                  
                  {/* Current arrows */}
                  <g className="text-amber-500">
                    {/* Incoming solar */}
                    <line x1="150" y1="70" x2="150" y2="130" stroke="currentColor" strokeWidth="3" markerEnd="url(#arrowhead)" />
                    <text x="160" y="100" className="text-[10px] fill-amber-600">R↓s</text>
                    
                    {/* Reflected */}
                    <line x1="120" y1="160" x2="100" y2="120" stroke="currentColor" strokeWidth={1 + currentCover.albedo * 4} opacity="0.7" />
                    <text x="95" y="135" className="text-[10px] fill-amber-600">{(currentCover.albedo * 100).toFixed(0)}%</text>
                  </g>
                  
                  <g className="text-blue-500">
                    {/* Latent heat */}
                    <line x1="170" y1="170" x2="170" y2="130" stroke="currentColor" strokeWidth={1 + currentBalance.latentHeat / 50} strokeDasharray="5,3" />
                    <text x="175" y="145" className="text-[10px] fill-blue-600">LE</text>
                  </g>
                  
                  <g className="text-red-500">
                    {/* Sensible heat */}
                    <line x1="130" y1="170" x2="130" y2="130" stroke="currentColor" strokeWidth={1 + currentBalance.sensibleHeat / 50} />
                    <text x="112" y="145" className="text-[10px] fill-red-600">H</text>
                  </g>
                  
                  {/* Proposed arrows */}
                  <g className="text-amber-500">
                    <line x1="450" y1="70" x2="450" y2="130" stroke="currentColor" strokeWidth="3" markerEnd="url(#arrowhead)" />
                    <text x="460" y="100" className="text-[10px] fill-amber-600">R↓s</text>
                    
                    <line x1="420" y1="160" x2="400" y2="120" stroke="currentColor" strokeWidth={1 + proposedCover.albedo * 4} opacity="0.7" />
                    <text x="395" y="135" className="text-[10px] fill-amber-600">{(proposedCover.albedo * 100).toFixed(0)}%</text>
                  </g>
                  
                  <g className="text-blue-500">
                    <line x1="470" y1="170" x2="470" y2="130" stroke="currentColor" strokeWidth={1 + proposedBalance.latentHeat / 50} strokeDasharray="5,3" />
                    <text x="475" y="145" className="text-[10px] fill-blue-600">LE</text>
                  </g>
                  
                  <g className="text-red-500">
                    <line x1="430" y1="170" x2="430" y2="130" stroke="currentColor" strokeWidth={1 + proposedBalance.sensibleHeat / 50} />
                    <text x="412" y="145" className="text-[10px] fill-red-600">H</text>
                  </g>
                  
                  {/* Labels */}
                  <text x="150" y="245" textAnchor="middle" className="text-xs fill-muted-foreground">Current</text>
                  <text x="450" y="245" textAnchor="middle" className="text-xs fill-muted-foreground">Proposed</text>
                </svg>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="water-card">
                <CardHeader>
                  <CardTitle className="text-base">Energy Flux Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis dataKey="name" type="category" width={100} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => `${value.toFixed(1)} W/m²`}
                        />
                        <Legend />
                        <Bar dataKey="current" name={currentCover.name} fill="hsl(var(--water))" />
                        <Bar dataKey="proposed" name={proposedCover.name} fill="hsl(var(--earth-amber))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="water-card">
                <CardHeader>
                  <CardTitle className="text-base">Water Balance (mm/year)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={waterBalanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => `${value.toFixed(0)} mm/yr`}
                        />
                        <Legend />
                        <Bar dataKey="current" name={currentCover.name} fill="hsl(var(--water))" />
                        <Bar dataKey="proposed" name={proposedCover.name} fill="hsl(var(--earth-amber))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Theory */}
            <Card className="water-card">
              <CardHeader>
                <CardTitle className="text-base">Energy Balance Theory</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none text-muted-foreground">
                <p>
                  The surface energy balance governs how incoming solar radiation is partitioned:
                </p>
                <p className="font-mono text-sm bg-muted p-2 rounded">
                  Rn = G + H + LE
                </p>
                <p>
                  Where <strong>Rn</strong> is net radiation, <strong>G</strong> is ground heat flux,
                  <strong> H</strong> is sensible heat (warming air), and <strong>LE</strong> is latent heat (evapotranspiration).
                </p>
                <p>
                  <strong>Albedo</strong> determines how much solar radiation is reflected vs absorbed.
                  Higher albedo (snow, desert) reflects more; lower albedo (forests, water) absorbs more.
                </p>
                <p>
                  <strong>Vegetation</strong> increases evapotranspiration through transpiration, recycling water
                  to the atmosphere and providing cooling. Deforestation typically increases runoff and reduces
                  local precipitation recycling.
                </p>
              </CardContent>
            </Card>

            {/* Reference */}
            <p className="text-xs text-muted-foreground text-center">
              Based on energy balance principles from{" "}
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

export default AlbedoWaterBalance;
