import { useState, useMemo } from "react";
import { X, Ruler, Waves, Mountain, Info, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { designStableChannel, BANK_MATERIALS, type CrossSectionShape } from "@/lib/hydrology/stable-channel";
import CrossSectionViewer from "@/components/stable-channel/CrossSectionViewer";
import StabilityAnalysis from "@/components/stable-channel/StabilityAnalysis";

interface StableChannelWizardProps {
  onClose: () => void;
}

interface ChannelParams {
  discharge: number;
  slope: number;
  sedimentSize: number;
  bankMaterial: string;
  manningN: number;
  sideSlope: number;
}

const bankMaterials = BANK_MATERIALS;

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

  const calculations = useMemo(() =>
    designStableChannel(params.discharge, params.slope, params.sedimentSize, params.manningN, params.sideSlope, shape),
    [params, shape]);

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
                  <Slider value={[params.discharge]} onValueChange={([v]) => setParams(p => ({ ...p, discharge: v }))} min={1} max={500} step={1} className="w-full" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Channel Slope (S)</label>
                    <span className="text-sm font-mono text-primary">{params.slope.toFixed(4)}</span>
                  </div>
                  <Slider value={[params.slope * 10000]} onValueChange={([v]) => setParams(p => ({ ...p, slope: v / 10000 }))} min={1} max={100} step={1} className="w-full" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Sediment Size (d₅₀)</label>
                    <span className="text-sm font-mono text-primary">{params.sedimentSize} mm</span>
                  </div>
                  <Slider value={[params.sedimentSize]} onValueChange={([v]) => setParams(p => ({ ...p, sedimentSize: v }))} min={0.1} max={100} step={0.1} className="w-full" />
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
                  <Select value={params.bankMaterial} onValueChange={(v) => {
                    const mat = bankMaterials.find(b => b.value === v);
                    if (mat) setParams(p => ({ ...p, bankMaterial: v, manningN: mat.n }));
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {bankMaterials.map(mat => (
                        <SelectItem key={mat.value} value={mat.value}>{mat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Manning's n</label>
                    <span className="text-sm font-mono text-primary">{params.manningN.toFixed(3)}</span>
                  </div>
                  <Slider value={[params.manningN * 1000]} onValueChange={([v]) => setParams(p => ({ ...p, manningN: v / 1000 }))} min={15} max={60} step={1} className="w-full" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Side Slope (z:1)</label>
                    <span className="text-sm font-mono text-primary">{params.sideSlope}:1</span>
                  </div>
                  <Slider value={[params.sideSlope * 10]} onValueChange={([v]) => setParams(p => ({ ...p, sideSlope: v / 10 }))} min={5} max={40} step={1} className="w-full" />
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
                    <CrossSectionViewer calculations={calculations} shape={shape} sideSlope={params.sideSlope} />
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

              <StabilityAnalysis calculations={calculations} />
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
                        <a href="https://ponce.sdsu.edu/design_of_a_stable_channel.html" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ponce.sdsu.edu</a>
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
