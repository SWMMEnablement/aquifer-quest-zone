import { useState, useMemo } from "react";
import { X, Ruler, Waves, Mountain, Info, ChevronRight, TriangleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface StableChannelWizardProps {
  onClose: () => void;
}

type CrossSectionShape = "trapezoidal" | "rectangular" | "parabolic" | "triangular";

interface ChannelParams {
  discharge: number;
  slope: number;
  sedimentSize: number;
  bankMaterial: string;
  manningN: number;
  sideSlope: number;
}

const bankMaterials = [
  { value: "sand", label: "Sand (loose)", n: 0.025, angle: 26 },
  { value: "gravel", label: "Gravel", n: 0.028, angle: 32 },
  { value: "cobbles", label: "Cobbles", n: 0.035, angle: 38 },
  { value: "clay", label: "Clay (stiff)", n: 0.022, angle: 45 },
  { value: "vegetated", label: "Vegetated", n: 0.040, angle: 35 },
  { value: "riprap", label: "Riprap", n: 0.045, angle: 40 },
];

const StableChannelWizard = ({ onClose }: StableChannelWizardProps) => {
  const [shape, setShape] = useState<CrossSectionShape>("trapezoidal");
  const [params, setParams] = useState<ChannelParams>({
    discharge: 50,
    slope: 0.001,
    sedimentSize: 2,
    bankMaterial: "gravel",
    manningN: 0.028,
    sideSlope: 2,
  });
  const [showTheory, setShowTheory] = useState(false);

  const bankInfo = bankMaterials.find(b => b.value === params.bankMaterial) || bankMaterials[1];

  // Calculate stable channel dimensions using regime equations
  const calculations = useMemo(() => {
    const Q = params.discharge;
    const S = params.slope;
    const d50 = params.sedimentSize / 1000; // Convert mm to m
    const n = params.manningN;
    const z = params.sideSlope;

    // Lacey's regime equations (modified)
    const f = 1.76 * Math.sqrt(d50 * 1000); // Silt factor
    const P = 4.75 * Math.sqrt(Q); // Wetted perimeter (m)
    const R = 0.47 * Math.pow(Q / f, 1/3); // Hydraulic radius (m)
    const A = P * R; // Cross-sectional area (m²)

    // Shape-specific calculations
    let width: number, depth: number, velocity: number, area: number, wettedPerimeter: number;

    switch (shape) {
      case "rectangular":
        // For rectangular: A = B*y, P = B + 2y
        // Optimize for hydraulic efficiency: B = 2y
        depth = Math.pow(A / 2, 1/3);
        width = 2 * depth;
        area = width * depth;
        wettedPerimeter = width + 2 * depth;
        break;
      case "triangular":
        // For triangular: A = z*y², P = 2y*sqrt(1+z²)
        depth = Math.pow(A / z, 0.5);
        width = 2 * z * depth;
        area = z * depth * depth;
        wettedPerimeter = 2 * depth * Math.sqrt(1 + z * z);
        break;
      case "parabolic":
        // For parabolic: A = (2/3)*T*y, P ≈ T + (8y²)/(3T)
        depth = Math.pow(3 * A / 4, 1/3);
        width = 1.5 * A / depth;
        area = (2/3) * width * depth;
        wettedPerimeter = width + (8 * depth * depth) / (3 * width);
        break;
      case "trapezoidal":
      default:
        // For trapezoidal: A = (B + zy)y, P = B + 2y*sqrt(1+z²)
        // Using regime theory approximation
        depth = R * 1.1;
        width = A / depth - z * depth;
        if (width < 0) width = Math.sqrt(A);
        area = (width + z * depth) * depth;
        wettedPerimeter = width + 2 * depth * Math.sqrt(1 + z * z);
        break;
    }

    const hydraulicRadius = area / wettedPerimeter;
    velocity = (1 / n) * Math.pow(hydraulicRadius, 2/3) * Math.pow(S, 0.5);
    const calculatedQ = velocity * area;

    // Froude number
    const froude = velocity / Math.sqrt(9.81 * depth);

    // Shear stress
    const shearStress = 9810 * hydraulicRadius * S; // Pa
    const criticalShearStress = 0.047 * (2650 - 1000) * 9.81 * d50; // Shields criterion

    // Stability assessment
    const stabilityRatio = criticalShearStress / shearStress;
    let stabilityStatus: "stable" | "marginal" | "unstable";
    if (stabilityRatio > 1.3) stabilityStatus = "stable";
    else if (stabilityRatio > 0.9) stabilityStatus = "marginal";
    else stabilityStatus = "unstable";

    // Rating exponent (beta) for rating curve Q = aH^beta
    const beta = shape === "rectangular" ? 5/3 
               : shape === "triangular" ? 8/3 
               : shape === "parabolic" ? 7/3 
               : 5/3 + 0.5; // trapezoidal approximation

    // Width-to-depth ratio
    const widthDepthRatio = width / depth;

    return {
      width: Math.max(0.5, width),
      depth: Math.max(0.1, depth),
      area: Math.max(0.1, area),
      wettedPerimeter: Math.max(0.5, wettedPerimeter),
      hydraulicRadius: Math.max(0.05, hydraulicRadius),
      velocity: Math.max(0.1, velocity),
      calculatedQ,
      froude,
      shearStress,
      criticalShearStress,
      stabilityRatio,
      stabilityStatus,
      beta,
      widthDepthRatio,
      siltFactor: f,
    };
  }, [params, shape]);

  // SVG cross-section visualization
  const renderCrossSection = () => {
    const svgWidth = 400;
    const svgHeight = 200;
    const padding = 30;
    const waterColor = "hsl(var(--primary))";
    const bankColor = "hsl(var(--muted))";

    const maxWidth = calculations.width * 1.3;
    const maxDepth = calculations.depth * 1.5;
    const scaleX = (svgWidth - 2 * padding) / maxWidth;
    const scaleY = (svgHeight - 2 * padding) / maxDepth;
    const scale = Math.min(scaleX, scaleY);

    const centerX = svgWidth / 2;
    const baseY = svgHeight - padding;
    const w = calculations.width * scale;
    const d = calculations.depth * scale;
    const z = params.sideSlope;

    let pathD = "";
    let bankPathD = "";

    switch (shape) {
      case "rectangular":
        pathD = `M ${centerX - w/2} ${baseY - d} 
                 L ${centerX - w/2} ${baseY} 
                 L ${centerX + w/2} ${baseY} 
                 L ${centerX + w/2} ${baseY - d} Z`;
        bankPathD = `M ${centerX - w/2 - 20} ${baseY - d - 20}
                     L ${centerX - w/2} ${baseY - d}
                     L ${centerX - w/2} ${baseY}
                     L ${centerX - w/2 - 20} ${baseY}
                     M ${centerX + w/2 + 20} ${baseY - d - 20}
                     L ${centerX + w/2} ${baseY - d}
                     L ${centerX + w/2} ${baseY}
                     L ${centerX + w/2 + 20} ${baseY}`;
        break;
      case "triangular":
        pathD = `M ${centerX} ${baseY} 
                 L ${centerX - w/2} ${baseY - d} 
                 L ${centerX + w/2} ${baseY - d} Z`;
        bankPathD = `M ${centerX - w/2 - 30} ${baseY - d - 20}
                     L ${centerX - w/2} ${baseY - d}
                     L ${centerX} ${baseY}
                     M ${centerX + w/2 + 30} ${baseY - d - 20}
                     L ${centerX + w/2} ${baseY - d}
                     L ${centerX} ${baseY}`;
        break;
      case "parabolic":
        const points = [];
        for (let i = -10; i <= 10; i++) {
          const x = (i / 10) * (w / 2);
          const y = d * (1 - Math.pow(i / 10, 2));
          points.push(`${centerX + x},${baseY - y}`);
        }
        pathD = `M ${points[0]} ${points.map(p => `L ${p}`).join(' ')} Z`;
        bankPathD = `M ${centerX - w/2 - 30} ${baseY - 20}
                     Q ${centerX - w/2 - 15} ${baseY - d/2} ${centerX - w/2} ${baseY}
                     M ${centerX + w/2 + 30} ${baseY - 20}
                     Q ${centerX + w/2 + 15} ${baseY - d/2} ${centerX + w/2} ${baseY}`;
        break;
      case "trapezoidal":
      default:
        const topWidth = w + 2 * z * d * scale / scale;
        const topHalfW = (calculations.width + 2 * z * calculations.depth) * scale / 2;
        pathD = `M ${centerX - w/2} ${baseY} 
                 L ${centerX - topHalfW} ${baseY - d} 
                 L ${centerX + topHalfW} ${baseY - d} 
                 L ${centerX + w/2} ${baseY} Z`;
        bankPathD = `M ${centerX - topHalfW - 30} ${baseY - d - 20}
                     L ${centerX - topHalfW} ${baseY - d}
                     L ${centerX - w/2} ${baseY}
                     L ${centerX - w/2 - 20} ${baseY}
                     M ${centerX + topHalfW + 30} ${baseY - d - 20}
                     L ${centerX + topHalfW} ${baseY - d}
                     L ${centerX + w/2} ${baseY}
                     L ${centerX + w/2 + 20} ${baseY}`;
        break;
    }

    return (
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-48">
        {/* Background */}
        <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="hsl(var(--card))" />
        
        {/* Ground/Bank lines */}
        <path d={bankPathD} fill="none" stroke={bankColor} strokeWidth="3" />
        
        {/* Water cross-section */}
        <path d={pathD} fill={waterColor} fillOpacity="0.3" stroke={waterColor} strokeWidth="2" />
        
        {/* Dimension lines */}
        {/* Width */}
        <line x1={centerX - w/2} y1={baseY + 15} x2={centerX + w/2} y2={baseY + 15} 
              stroke="hsl(var(--muted-foreground))" strokeWidth="1" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
        <text x={centerX} y={baseY + 28} textAnchor="middle" className="text-xs fill-muted-foreground">
          B = {calculations.width.toFixed(2)}m
        </text>
        
        {/* Depth */}
        <line x1={centerX + w/2 + 25} y1={baseY} x2={centerX + w/2 + 25} y2={baseY - d} 
              stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
        <text x={centerX + w/2 + 35} y={baseY - d/2} textAnchor="start" className="text-xs fill-muted-foreground">
          y = {calculations.depth.toFixed(2)}m
        </text>

        {/* Arrow marker definition */}
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 Z" fill="hsl(var(--muted-foreground))" />
          </marker>
        </defs>
      </svg>
    );
  };

  const getStabilityColor = (status: string) => {
    switch (status) {
      case "stable": return "text-green-500";
      case "marginal": return "text-yellow-500";
      case "unstable": return "text-red-500";
      default: return "text-muted-foreground";
    }
  };

  const getStabilityBadge = (status: string) => {
    switch (status) {
      case "stable": return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Stable</Badge>;
      case "marginal": return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Marginal</Badge>;
      case "unstable": return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Unstable</Badge>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl water-gradient flex items-center justify-center">
              <Ruler className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Stable Channel Design Wizard</h1>
              <p className="text-muted-foreground">Design non-eroding, non-silting channels using regime theory</p>
            </div>
          </div>
          <Button variant="outline" onClick={onClose} className="gap-2">
            <X className="h-4 w-4" />
            Close
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Input Parameters */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Waves className="h-5 w-5 text-primary" />
                  Flow Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Design Discharge (Q)</label>
                    <span className="text-sm font-mono text-primary">{params.discharge} m³/s</span>
                  </div>
                  <Slider
                    value={[params.discharge]}
                    onValueChange={([v]) => setParams(p => ({ ...p, discharge: v }))}
                    min={1}
                    max={500}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Channel Slope (S)</label>
                    <span className="text-sm font-mono text-primary">{params.slope.toFixed(4)}</span>
                  </div>
                  <Slider
                    value={[params.slope * 10000]}
                    onValueChange={([v]) => setParams(p => ({ ...p, slope: v / 10000 }))}
                    min={1}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Sediment Size (d₅₀)</label>
                    <span className="text-sm font-mono text-primary">{params.sedimentSize} mm</span>
                  </div>
                  <Slider
                    value={[params.sedimentSize]}
                    onValueChange={([v]) => setParams(p => ({ ...p, sedimentSize: v }))}
                    min={0.1}
                    max={100}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mountain className="h-5 w-5 text-primary" />
                  Bank Properties
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bank Material</label>
                  <Select
                    value={params.bankMaterial}
                    onValueChange={(v) => {
                      const mat = bankMaterials.find(b => b.value === v);
                      if (mat) {
                        setParams(p => ({ ...p, bankMaterial: v, manningN: mat.n }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bankMaterials.map(mat => (
                        <SelectItem key={mat.value} value={mat.value}>
                          {mat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Manning's n</label>
                    <span className="text-sm font-mono text-primary">{params.manningN.toFixed(3)}</span>
                  </div>
                  <Slider
                    value={[params.manningN * 1000]}
                    onValueChange={([v]) => setParams(p => ({ ...p, manningN: v / 1000 }))}
                    min={15}
                    max={60}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Side Slope (z:1)</label>
                    <span className="text-sm font-mono text-primary">{params.sideSlope}:1</span>
                  </div>
                  <Slider
                    value={[params.sideSlope * 10]}
                    onValueChange={([v]) => setParams(p => ({ ...p, sideSlope: v / 10 }))}
                    min={5}
                    max={40}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended max for {bankInfo.label}: {Math.tan(bankInfo.angle * Math.PI / 180).toFixed(1)}:1
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cross-Section Visualization */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cross-Section Shape</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={shape} onValueChange={(v) => setShape(v as CrossSectionShape)}>
                  <TabsList className="grid grid-cols-4 mb-6">
                    <TabsTrigger value="trapezoidal">Trapezoidal</TabsTrigger>
                    <TabsTrigger value="rectangular">Rectangular</TabsTrigger>
                    <TabsTrigger value="parabolic">Parabolic</TabsTrigger>
                    <TabsTrigger value="triangular">Triangular</TabsTrigger>
                  </TabsList>

                  <div className="bg-muted/30 rounded-lg p-4 mb-6">
                    {renderCrossSection()}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Bottom Width</p>
                      <p className="text-lg font-bold text-primary">{calculations.width.toFixed(2)} m</p>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Flow Depth</p>
                      <p className="text-lg font-bold text-primary">{calculations.depth.toFixed(2)} m</p>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">W/D Ratio</p>
                      <p className="text-lg font-bold text-primary">{calculations.widthDepthRatio.toFixed(1)}</p>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Rating Exponent (β)</p>
                      <p className="text-lg font-bold text-primary">{calculations.beta.toFixed(2)}</p>
                    </div>
                  </div>
                </Tabs>
              </CardContent>
            </Card>

            {/* Hydraulic Results */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hydraulic Properties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Cross-sectional Area (A)</span>
                    <span className="font-mono">{calculations.area.toFixed(2)} m²</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Wetted Perimeter (P)</span>
                    <span className="font-mono">{calculations.wettedPerimeter.toFixed(2)} m</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Hydraulic Radius (R)</span>
                    <span className="font-mono">{calculations.hydraulicRadius.toFixed(3)} m</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Flow Velocity (V)</span>
                    <span className="font-mono">{calculations.velocity.toFixed(2)} m/s</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Froude Number (Fr)</span>
                    <span className={`font-mono ${calculations.froude > 1 ? 'text-yellow-500' : 'text-green-500'}`}>
                      {calculations.froude.toFixed(3)} {calculations.froude > 1 ? '(supercritical)' : '(subcritical)'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Silt Factor (f)</span>
                    <span className="font-mono">{calculations.siltFactor.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Stability Analysis
                    {getStabilityBadge(calculations.stabilityStatus)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Bed Shear Stress (τ₀)</span>
                    <span className="font-mono">{calculations.shearStress.toFixed(2)} Pa</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Critical Shear (τc)</span>
                    <span className="font-mono">{calculations.criticalShearStress.toFixed(2)} Pa</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Stability Ratio (τc/τ₀)</span>
                    <span className={`font-mono font-bold ${getStabilityColor(calculations.stabilityStatus)}`}>
                      {calculations.stabilityRatio.toFixed(2)}
                    </span>
                  </div>

                  <div className={`p-4 rounded-lg ${
                    calculations.stabilityStatus === 'stable' ? 'bg-green-500/10 border border-green-500/20' :
                    calculations.stabilityStatus === 'marginal' ? 'bg-yellow-500/10 border border-yellow-500/20' :
                    'bg-red-500/10 border border-red-500/20'
                  }`}>
                    <p className={`text-sm font-medium ${getStabilityColor(calculations.stabilityStatus)}`}>
                      {calculations.stabilityStatus === 'stable' && 'Channel is stable. Bed material will not erode under design flow.'}
                      {calculations.stabilityStatus === 'marginal' && 'Channel stability is marginal. Consider increasing sediment size or reducing slope.'}
                      {calculations.stabilityStatus === 'unstable' && 'Channel will erode! Increase sediment size, add protection, or reduce slope.'}
                    </p>
                  </div>

                  {/* Stability meter */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Unstable</span>
                      <span>Marginal</span>
                      <span>Stable</span>
                    </div>
                    <div className="h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 relative">
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-foreground rounded-full shadow-lg transition-all"
                        style={{ 
                          left: `${Math.min(100, Math.max(0, (calculations.stabilityRatio / 2) * 100))}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Theory Section */}
            <Collapsible open={showTheory} onOpenChange={setShowTheory}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Info className="h-5 w-5 text-primary" />
                      Design Theory & Equations
                      <ChevronRight className={`h-4 w-4 ml-auto transition-transform ${showTheory ? 'rotate-90' : ''}`} />
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2">Lacey's Regime Equations</h4>
                      <div className="bg-muted/30 p-4 rounded-lg font-mono text-sm space-y-2">
                        <p>P = 4.75 × √Q (Wetted Perimeter)</p>
                        <p>R = 0.47 × (Q/f)^(1/3) (Hydraulic Radius)</p>
                        <p>f = 1.76 × √d₅₀ (Silt Factor, d₅₀ in mm)</p>
                        <p>S = f^(5/3) / (3340 × Q^(1/6)) (Regime Slope)</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Manning's Equation</h4>
                      <div className="bg-muted/30 p-4 rounded-lg font-mono text-sm">
                        <p>V = (1/n) × R^(2/3) × S^(1/2)</p>
                        <p>Q = V × A</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Shields Criterion for Stability</h4>
                      <div className="bg-muted/30 p-4 rounded-lg font-mono text-sm space-y-2">
                        <p>τ₀ = γ × R × S (Bed Shear Stress)</p>
                        <p>τc = 0.047 × (γs - γ) × d₅₀ (Critical Shear)</p>
                        <p>Stable when τc/τ₀ {">"} 1.0</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Rating Curve Exponent</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        The rating exponent (β) relates stage to discharge: Q = aH^β
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 bg-muted/30 rounded">Rectangular: β = 5/3</div>
                        <div className="p-2 bg-muted/30 rounded">Triangular: β = 8/3</div>
                        <div className="p-2 bg-muted/30 rounded">Parabolic: β = 7/3</div>
                        <div className="p-2 bg-muted/30 rounded">Trapezoidal: β ≈ 2.0-2.5</div>
                      </div>
                    </div>

                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <p className="text-sm">
                        <strong>Reference:</strong> Based on the methodologies described in Prof. Victor Miguel Ponce's 
                        work on stable channel design. See{" "}
                        <a 
                          href="https://ponce.sdsu.edu/design_of_a_stable_channel.html" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          ponce.sdsu.edu
                        </a>
                      </p>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StableChannelWizard;
