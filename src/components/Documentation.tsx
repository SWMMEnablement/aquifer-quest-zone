import { X, BookOpen, Calculator, Droplets, Waves, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface DocumentationProps {
  onClose: () => void;
}

const Documentation = ({ onClose }: DocumentationProps) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Documentation</h1>
              <p className="text-muted-foreground">Theory, equations, and usage guides for all modules</p>
            </div>
          </div>
          <Button variant="outline" onClick={onClose} className="gap-2">
            <X className="h-4 w-4" />
            Close
          </Button>
        </div>

        <Tabs defaultValue="cn-calculator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto gap-2 bg-transparent p-0">
            <TabsTrigger 
              value="cn-calculator" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-3"
            >
              <Calculator className="h-4 w-4" />
              CN Calculator
            </TabsTrigger>
            <TabsTrigger 
              value="groundwater" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-3"
            >
              <Droplets className="h-4 w-4" />
              Groundwater
            </TabsTrigger>
            <TabsTrigger 
              value="muskingum" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-3"
            >
              <Waves className="h-4 w-4" />
              Muskingum-Cunge
            </TabsTrigger>
            <TabsTrigger 
              value="references" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-3"
            >
              <FileText className="h-4 w-4" />
              References
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-280px)]">
            {/* CN Calculator Documentation */}
            <TabsContent value="cn-calculator" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-water-500" />
                    SCS Curve Number Method
                    <Badge variant="secondary">Available</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <section>
                    <h3 className="text-lg font-semibold mb-3">Overview</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      The SCS (Soil Conservation Service) Curve Number method, now known as the NRCS method, 
                      is an empirical approach developed by the USDA for estimating direct runoff from rainfall. 
                      It accounts for land use, soil type, and antecedent moisture conditions.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold mb-3">Key Equations</h3>
                    <div className="space-y-4 bg-muted/50 p-4 rounded-lg font-mono text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Runoff Equation:</p>
                        <p className="text-foreground">Q = (P - Ia)² / (P - Ia + S)</p>
                        <p className="text-xs text-muted-foreground mt-1">where P {">"} Ia, otherwise Q = 0</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Storage Parameter:</p>
                        <p className="text-foreground">S = (1000 / CN) - 10</p>
                        <p className="text-xs text-muted-foreground mt-1">S in inches</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Initial Abstraction:</p>
                        <p className="text-foreground">Ia = 0.2 × S</p>
                        <p className="text-xs text-muted-foreground mt-1">Standard assumption (can range from 0.05S to 0.2S)</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold mb-3">AMC Adjustment</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <Card className="bg-yellow-500/10 border-yellow-500/20">
                        <CardContent className="pt-4">
                          <h4 className="font-semibold text-yellow-600">AMC I (Dry)</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            CN(I) = 4.2 × CN(II) / (10 - 0.058 × CN(II))
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-blue-500/10 border-blue-500/20">
                        <CardContent className="pt-4">
                          <h4 className="font-semibold text-blue-600">AMC II (Normal)</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Base condition from tables
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-green-500/10 border-green-500/20">
                        <CardContent className="pt-4">
                          <h4 className="font-semibold text-green-600">AMC III (Wet)</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            CN(III) = 23 × CN(II) / (10 + 0.13 × CN(II))
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold mb-3">Comparison Methods</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <h4 className="font-medium">Green-Ampt Equation</h4>
                        <p className="text-sm text-muted-foreground">f = Ks × (1 + (ψ × Δθ) / F)</p>
                        <p className="text-xs text-muted-foreground mt-1">Physics-based infiltration model</p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <h4 className="font-medium">Philip Equation</h4>
                        <p className="text-sm text-muted-foreground">f = 0.5 × S × t^(-0.5) + A</p>
                        <p className="text-xs text-muted-foreground mt-1">Sorptivity-based approach</p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <h4 className="font-medium">Horton Equation</h4>
                        <p className="text-sm text-muted-foreground">f = fc + (f0 - fc) × e^(-kt)</p>
                        <p className="text-xs text-muted-foreground mt-1">Exponential decay model</p>
                      </div>
                    </div>
                  </section>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Groundwater Documentation */}
            <TabsContent value="groundwater" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-water-500" />
                    Sustainable Groundwater Yield
                    <Badge variant="secondary">Available</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <section>
                    <h3 className="text-lg font-semibold mb-3">Overview</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      This simulator models the relationship between groundwater pumping, aquifer storage, 
                      and ecosystem health. It demonstrates the concept of sustainable yield—the rate at which 
                      water can be extracted without causing long-term depletion or ecosystem damage.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold mb-3">Key Concepts</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <h4 className="font-medium mb-2">Safe Yield</h4>
                        <p className="text-sm text-muted-foreground">
                          The amount of water that can be withdrawn annually without producing 
                          undesirable effects. Often approximated as equal to long-term recharge.
                        </p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <h4 className="font-medium mb-2">Sustainable Yield</h4>
                        <p className="text-sm text-muted-foreground">
                          A more holistic concept that considers ecosystem needs, water quality, 
                          and long-term aquifer health in addition to quantity.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold mb-3">Water Balance Equation</h3>
                    <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm">
                      <p className="text-foreground">ΔS = R - Q - ET - P</p>
                      <div className="mt-3 text-muted-foreground space-y-1">
                        <p>ΔS = Change in storage</p>
                        <p>R = Recharge (precipitation + irrigation return)</p>
                        <p>Q = Natural discharge (baseflow to streams)</p>
                        <p>ET = Evapotranspiration from water table</p>
                        <p>P = Pumping withdrawal</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold mb-3">Ecosystem Dependencies</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                        <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5" />
                        <div>
                          <h4 className="font-medium text-red-600">Critical ({"<"}30% storage)</h4>
                          <p className="text-sm text-muted-foreground">Wetlands dry, springs cease, riparian vegetation dies</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                        <div className="w-3 h-3 rounded-full bg-yellow-500 mt-1.5" />
                        <div>
                          <h4 className="font-medium text-yellow-600">Stressed (30-60% storage)</h4>
                          <p className="text-sm text-muted-foreground">Reduced baseflow, stressed vegetation, declining habitat</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5" />
                        <div>
                          <h4 className="font-medium text-green-600">Healthy ({">"} 60% storage)</h4>
                          <p className="text-sm text-muted-foreground">Sustained baseflow, healthy ecosystems, resilient system</p>
                        </div>
                      </div>
                    </div>
                  </section>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Muskingum-Cunge Documentation */}
            <TabsContent value="muskingum" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Waves className="h-5 w-5 text-water-500" />
                    Muskingum-Cunge Flood Routing
                    <Badge variant="secondary">Available</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <section>
                    <h3 className="text-lg font-semibold mb-3">Overview</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      The Muskingum-Cunge method is a hydraulic flood routing technique that combines the 
                      simplicity of the Muskingum method with physical channel characteristics. It routes 
                      flood waves through channel reaches, accounting for both translation and attenuation.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold mb-3">Routing Equation</h3>
                    <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm">
                      <p className="text-foreground">O₂ = C₀I₂ + C₁I₁ + C₂O₁</p>
                      <div className="mt-3 text-muted-foreground space-y-1">
                        <p>O = Outflow at downstream end</p>
                        <p>I = Inflow at upstream end</p>
                        <p>C₀, C₁, C₂ = Routing coefficients (must sum to 1)</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold mb-3">Key Parameters</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <h4 className="font-medium mb-2">K (Storage Constant)</h4>
                        <p className="text-sm text-muted-foreground">
                          Travel time through the reach. K = Δx / c, where c is wave celerity.
                        </p>
                        <p className="text-xs text-muted-foreground mt-2 font-mono">
                          c = (1/n) × R^(2/3) × S^(1/2) × (5/3)
                        </p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <h4 className="font-medium mb-2">X (Weighting Factor)</h4>
                        <p className="text-sm text-muted-foreground">
                          Controls attenuation. X = 0.5 means no attenuation (kinematic wave), 
                          X = 0 gives maximum attenuation.
                        </p>
                        <p className="text-xs text-muted-foreground mt-2 font-mono">
                          X = 0.5 × (1 - Q / (B × S × c × Δx))
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold mb-3">Routing Coefficients</h3>
                    <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm space-y-2">
                      <p>C₀ = (-KX + 0.5Δt) / (K - KX + 0.5Δt)</p>
                      <p>C₁ = (KX + 0.5Δt) / (K - KX + 0.5Δt)</p>
                      <p>C₂ = (K - KX - 0.5Δt) / (K - KX + 0.5Δt)</p>
                      <p className="text-muted-foreground mt-2">Constraint: C₀ + C₁ + C₂ = 1</p>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold mb-3">Comparison: Kinematic vs Diffusion Wave</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="bg-blue-500/10 border-blue-500/20">
                        <CardContent className="pt-4">
                          <h4 className="font-semibold text-blue-600">Kinematic Wave</h4>
                          <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                            <li>• Pure translation, no attenuation</li>
                            <li>• Friction slope = bed slope</li>
                            <li>• Valid for steep channels</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="bg-purple-500/10 border-purple-500/20">
                        <CardContent className="pt-4">
                          <h4 className="font-semibold text-purple-600">Diffusion Wave</h4>
                          <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                            <li>• Translation + attenuation</li>
                            <li>• Includes backwater effects</li>
                            <li>• Better for mild slopes</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </section>
                </CardContent>
              </Card>
            </TabsContent>

            {/* References */}
            <TabsContent value="references" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-water-500" />
                    References & Sources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <section>
                    <h3 className="text-lg font-semibold mb-3">Primary Source</h3>
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">Prof. Victor Miguel Ponce</h4>
                            <p className="text-sm text-muted-foreground">San Diego State University</p>
                            <p className="text-sm text-muted-foreground mt-2">
                              All calculators and simulators in this lab are based on the research, 
                              publications, and educational materials developed by Prof. Ponce.
                            </p>
                          </div>
                          <a 
                            href="https://ponce.sdsu.edu/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm" className="gap-2">
                              <ExternalLink className="h-4 w-4" />
                              Visit Site
                            </Button>
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold mb-3">Key Publications</h3>
                    <div className="space-y-3">
                      <a 
                        href="https://ponce.sdsu.edu/runoff_curve_number_method.html" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">The Runoff Curve Number Method</h4>
                            <p className="text-sm text-muted-foreground">Comprehensive guide to the SCS-CN method</p>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </a>
                      <a 
                        href="https://ponce.sdsu.edu/groundwater_sustainable_yield.html" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Sustainable Yield of Groundwater</h4>
                            <p className="text-sm text-muted-foreground">Balancing use with ecosystem preservation</p>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </a>
                      <a 
                        href="https://ponce.sdsu.edu/muskingum_cunge_method_explained.html" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Muskingum-Cunge Method Explained</h4>
                            <p className="text-sm text-muted-foreground">Flood routing methodology</p>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </a>
                      <a 
                        href="https://ponce.sdsu.edu/380nutshells.html" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Concepts in a Nutshell</h4>
                            <p className="text-sm text-muted-foreground">380+ short explanations of key hydrological concepts</p>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </a>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold mb-3">Additional Resources</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <h4 className="font-medium mb-2">NRCS NEH Part 630</h4>
                        <p className="text-sm text-muted-foreground">
                          National Engineering Handbook, Hydrology chapter. Official USDA documentation 
                          for the Curve Number method.
                        </p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <h4 className="font-medium mb-2">Chow, Maidment & Mays</h4>
                        <p className="text-sm text-muted-foreground">
                          Applied Hydrology (1988). Classic textbook covering flood routing and 
                          hydrological methods.
                        </p>
                      </div>
                    </div>
                  </section>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
};

export default Documentation;
