import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ExternalLink, Search, X, BookOpen } from "lucide-react";

interface Props { onClose: () => void; }

interface ConceptNode {
  id: string;
  label: string;
  domain: string;
  description: string;
  equation?: string;
  related: string[];
  poncePage?: string;
  calculatorId?: string;
}

const DOMAIN_COLORS: Record<string, string> = {
  "Hydrology": "#0ea5e9",
  "Hydraulics": "#14b8a6",
  "Hydromechanics": "#8b5cf6",
  "Hydrogeology": "#3b82f6",
  "Geomorphology": "#f59e0b",
  "Sedimentology": "#a16207",
  "Climatology": "#f97316",
  "Ecology": "#22c55e",
  "Structures": "#6b7280",
  "Statistics": "#a855f7",
};

const CONCEPTS: ConceptNode[] = [
  // Hydrology
  { id: "curve-number", label: "Curve Number", domain: "Hydrology", description: "SCS lumped rainfall-runoff model. CN ranges 1-100 reflecting soil/land use/AMC.", equation: "Q = (P-Ia)²/(P-Ia+S), S = 25400/CN - 254", related: ["runoff", "infiltration", "amc", "initial-abstraction", "unit-hydrograph"], poncePage: "https://ponce.sdsu.edu/onlinecurvenumber.php", calculatorId: "cn-calculator" },
  { id: "runoff", label: "Surface Runoff", domain: "Hydrology", description: "Excess rainfall that flows overland to stream channels.", related: ["curve-number", "infiltration", "rational-method", "hydrograph"] },
  { id: "infiltration", label: "Infiltration", domain: "Hydrology", description: "Process by which water enters the soil surface.", related: ["curve-number", "soil-type", "green-ampt", "initial-abstraction"] },
  { id: "amc", label: "AMC Conditions", domain: "Hydrology", description: "Antecedent Moisture Condition — soil wetness before a storm event (I=dry, II=average, III=wet).", related: ["curve-number", "soil-type"] },
  { id: "initial-abstraction", label: "Initial Abstraction", domain: "Hydrology", description: "Losses before runoff begins: interception, depression storage, initial infiltration. Ia = λS.", equation: "Ia = λS, typically λ = 0.2", related: ["curve-number", "infiltration"] },
  { id: "unit-hydrograph", label: "Unit Hydrograph", domain: "Hydrology", description: "DRO hydrograph from 1 unit of excess rainfall over 1 unit duration.", related: ["curve-number", "hydrograph", "s-curve", "convolution", "time-concentration"], calculatorId: "unit-hydrograph" },
  { id: "hydrograph", label: "Storm Hydrograph", domain: "Hydrology", description: "Plot of discharge vs time at a watershed outlet.", related: ["unit-hydrograph", "runoff", "baseflow", "time-concentration"] },
  { id: "s-curve", label: "S-Curve Method", domain: "Hydrology", description: "Technique for changing UH duration by summing an infinite series of UHs.", related: ["unit-hydrograph", "convolution"] },
  { id: "convolution", label: "Convolution", domain: "Hydrology", description: "Mathematical operation to combine UH with rainfall excess.", related: ["unit-hydrograph", "s-curve", "hydrograph"] },
  { id: "rational-method", label: "Rational Method", domain: "Hydrology", description: "Simple peak flow estimation: Q = CiA. Valid for small catchments (<80 ha).", equation: "Q = CiA", related: ["runoff", "time-concentration", "idf-curve"], calculatorId: "rational-method" },
  { id: "idf-curve", label: "IDF Curves", domain: "Hydrology", description: "Intensity-Duration-Frequency curves for design storm selection.", related: ["rational-method", "return-period"] },
  { id: "time-concentration", label: "Time of Concentration", domain: "Hydrology", description: "Time for water to travel from the most remote point to the outlet.", equation: "tc varies by method (Kirpich, SCS lag)", related: ["rational-method", "unit-hydrograph", "hydrograph"] },
  { id: "muskingum", label: "Muskingum-Cunge", domain: "Hydrology", description: "Physics-based flood routing through channel reaches with wave celerity and diffusivity.", related: ["hydrograph", "wave-celerity", "diffusion-wave", "courant-number"], calculatorId: "muskingum-routing" },
  { id: "return-period", label: "Return Period", domain: "Statistics", description: "Average recurrence interval T for a flood of given magnitude. P = 1/T.", related: ["idf-curve", "flood-frequency"] },
  { id: "flood-frequency", label: "Flood Frequency", domain: "Statistics", description: "Statistical analysis of annual maximum series using Gumbel, Log-Pearson III, etc.", related: ["return-period", "gumbel"], calculatorId: "flood-frequency" },
  { id: "gumbel", label: "Gumbel Distribution", domain: "Statistics", description: "Extreme value Type I distribution commonly used for flood frequency.", related: ["flood-frequency", "return-period"] },
  // Hydraulics
  { id: "manning", label: "Manning's Equation", domain: "Hydraulics", description: "Empirical formula for uniform flow: V = (1/n)R²/³S½.", equation: "V = (1/n)R^(2/3)S^(1/2)", related: ["normal-depth", "friction", "hydraulic-radius", "rating-curve"], calculatorId: "manning-rating" },
  { id: "normal-depth", label: "Normal Depth", domain: "Hydraulics", description: "Depth at which flow is uniform — gravitational and frictional forces balanced.", related: ["manning", "critical-depth", "gvf-profiles"] },
  { id: "critical-depth", label: "Critical Depth", domain: "Hydraulics", description: "Depth at which specific energy is minimum and Froude number = 1.", equation: "yc = (q²/g)^(1/3) for rectangular", related: ["froude-number", "specific-energy", "normal-depth"] },
  { id: "froude-number", label: "Froude Number", domain: "Hydraulics", description: "Ratio of flow velocity to wave celerity. Fr<1 subcritical, Fr>1 supercritical.", equation: "Fr = V/√(gD)", related: ["critical-depth", "specific-energy", "hydraulic-jump", "wave-celerity"], calculatorId: "froude-explorer" },
  { id: "specific-energy", label: "Specific Energy", domain: "Hydraulics", description: "Energy per unit weight relative to channel bottom: E = y + V²/2g.", equation: "E = y + V²/(2g)", related: ["critical-depth", "froude-number", "conjugate-depths", "hydraulic-jump"], calculatorId: "specific-energy" },
  { id: "conjugate-depths", label: "Conjugate Depths", domain: "Hydraulics", description: "Depth pair sharing the same specific momentum — connected by a hydraulic jump.", related: ["specific-energy", "hydraulic-jump", "momentum"] },
  { id: "momentum", label: "Specific Momentum", domain: "Hydraulics", description: "M = Q²/(gA) + Aȳ — force + momentum flux per unit weight.", related: ["conjugate-depths", "hydraulic-jump", "specific-energy"] },
  { id: "hydraulic-jump", label: "Hydraulic Jump", domain: "Hydraulics", description: "Abrupt transition from supercritical to subcritical flow with energy dissipation.", equation: "ΔE = (y₂-y₁)³/(4y₁y₂)", related: ["conjugate-depths", "froude-number", "stilling-basin"] },
  { id: "gvf-profiles", label: "GVF Profiles", domain: "Hydraulics", description: "12 gradually-varied flow profiles: M1-M3, S1-S3, C1/C3, H2/H3, A2/A3.", related: ["normal-depth", "critical-depth", "manning"], calculatorId: "gvf-profiles" },
  { id: "rating-curve", label: "Rating Curve", domain: "Hydraulics", description: "Relationship between stage (depth) and discharge at a cross-section.", related: ["manning", "normal-depth"] },
  { id: "hydraulic-radius", label: "Hydraulic Radius", domain: "Hydraulics", description: "R = A/P — ratio of flow area to wetted perimeter.", related: ["manning", "friction"] },
  { id: "friction", label: "Friction / Roughness", domain: "Hydraulics", description: "Manning's n quantifies channel resistance from grain and form roughness.", related: ["manning", "form-friction", "hydraulic-radius"] },
  // Hydromechanics
  { id: "saint-venant", label: "Saint-Venant Equations", domain: "Hydromechanics", description: "Full shallow-water equations governing unsteady open-channel flow.", related: ["kinematic-wave", "diffusion-wave", "dynamic-wave", "wave-celerity"], calculatorId: "saint-venant" },
  { id: "kinematic-wave", label: "Kinematic Wave", domain: "Hydromechanics", description: "Simplest wave model — only gravity and friction. No attenuation.", related: ["saint-venant", "diffusion-wave", "wave-celerity"] },
  { id: "diffusion-wave", label: "Diffusion Wave", domain: "Hydromechanics", description: "Adds pressure gradient to kinematic. Waves attenuate and spread.", related: ["saint-venant", "kinematic-wave", "dynamic-wave", "muskingum"] },
  { id: "dynamic-wave", label: "Dynamic Wave", domain: "Hydromechanics", description: "Full Saint-Venant — includes all inertia and pressure terms.", related: ["saint-venant", "diffusion-wave", "wave-celerity"] },
  { id: "wave-celerity", label: "Wave Celerity", domain: "Hydromechanics", description: "Speed of wave propagation. Kinematic: ck=βV. Dynamic: cd=V±√(gD).", equation: "ck = βV, cd = V ± √(gD)", related: ["froude-number", "saint-venant", "vedernikov"], calculatorId: "wave-propagation" },
  { id: "vedernikov", label: "Vedernikov Number", domain: "Hydromechanics", description: "V = (β-1)Fr — stability criterion. V>1 triggers roll waves.", equation: "V = (β-1)Fr", related: ["wave-celerity", "froude-number", "roll-waves"], calculatorId: "vedernikov" },
  { id: "roll-waves", label: "Roll Waves", domain: "Hydromechanics", description: "Periodic surges on steep channels when Vedernikov > 1.", related: ["vedernikov", "froude-number"] },
  { id: "courant-number", label: "Courant Number", domain: "Hydromechanics", description: "C = cΔt/Δx — numerical stability criterion for routing.", related: ["muskingum", "wave-celerity"] },
  // Hydrogeology
  { id: "sustainable-yield", label: "Sustainable Yield", domain: "Hydrogeology", description: "Pumping rate that does not exceed recharge minus ecosystem needs. Less than safe yield.", related: ["safe-yield", "recharge", "baseflow", "capture"], calculatorId: "groundwater" },
  { id: "safe-yield", label: "Safe Yield", domain: "Hydrogeology", description: "Maximum pumping without depleting aquifer — ignores ecosystem needs.", related: ["sustainable-yield", "recharge"] },
  { id: "recharge", label: "Groundwater Recharge", domain: "Hydrogeology", description: "Water percolating from surface to saturated zone.", related: ["sustainable-yield", "infiltration", "baseflow"], calculatorId: "gw-recharge" },
  { id: "baseflow", label: "Baseflow", domain: "Hydrogeology", description: "Streamflow sustained by groundwater discharge.", related: ["sustainable-yield", "recharge", "hydrograph", "recession"], calculatorId: "baseflow-recession" },
  { id: "recession", label: "Recession Curve", domain: "Hydrogeology", description: "Exponential decline of baseflow: Q(t) = Q₀αᵗ.", equation: "Q(t) = Q₀ × α^t", related: ["baseflow"] },
  { id: "theis", label: "Theis Equation", domain: "Hydrogeology", description: "Drawdown from pumping: s = Q/(4πT) × W(u).", equation: "s = Q/(4πT) × W(u)", related: ["well-function", "transmissivity", "storativity"], calculatorId: "theis-well" },
  { id: "well-function", label: "Well Function W(u)", domain: "Hydrogeology", description: "Exponential integral for transient well drawdown.", related: ["theis"] },
  { id: "transmissivity", label: "Transmissivity", domain: "Hydrogeology", description: "T = Kb — product of hydraulic conductivity and aquifer thickness.", related: ["theis", "storativity"] },
  { id: "storativity", label: "Storativity", domain: "Hydrogeology", description: "Volume of water released per unit area per unit head decline.", related: ["theis", "transmissivity"] },
  { id: "capture", label: "Capture", domain: "Hydrogeology", description: "Pumping derives water from increased recharge + decreased discharge + storage depletion.", related: ["sustainable-yield", "baseflow"] },
  // Geomorphology & more
  { id: "lanes-balance", label: "Lane's Balance", domain: "Geomorphology", description: "QₛD₅₀ ∝ QwS — stream equilibrium between sediment and flow.", equation: "QₛD₅₀ ∝ QwS", related: ["aggradation", "degradation", "sediment-transport"], calculatorId: "lanes-balance" },
  { id: "aggradation", label: "Aggradation", domain: "Geomorphology", description: "Channel bed rises when sediment supply exceeds transport capacity.", related: ["lanes-balance", "degradation"] },
  { id: "degradation", label: "Degradation", domain: "Geomorphology", description: "Channel bed incises when transport capacity exceeds sediment supply.", related: ["lanes-balance", "aggradation"] },
  { id: "sediment-transport", label: "Sediment Transport", domain: "Sedimentology", description: "Movement of bed material and suspended load by flowing water.", related: ["lanes-balance", "shields", "form-friction"], calculatorId: "sediment-transport" },
  { id: "shields", label: "Shields Criterion", domain: "Sedimentology", description: "Threshold of sediment motion based on dimensionless shear stress.", related: ["sediment-transport", "tractive-force"] },
  { id: "tractive-force", label: "Tractive Force", domain: "Sedimentology", description: "Shear stress exerted by flowing water on the channel boundary.", related: ["shields", "stable-channel"], calculatorId: "tractive-force" },
  { id: "form-friction", label: "Form Friction", domain: "Sedimentology", description: "Resistance from bedforms (ripples, dunes, antidunes). Non-monotonic with velocity.", related: ["friction", "sediment-transport"], calculatorId: "form-friction" },
  { id: "stable-channel", label: "Stable Channel Design", domain: "Geomorphology", description: "Design channels that neither erode nor deposit.", related: ["tractive-force", "lanes-balance"], calculatorId: "channel-design" },
  { id: "green-ampt", label: "Green-Ampt Model", domain: "Hydrology", description: "Physics-based infiltration model using Darcy's law.", related: ["infiltration", "soil-type"] },
  { id: "soil-type", label: "Soil Type (HSG)", domain: "Hydrology", description: "Hydrologic Soil Groups A-D based on infiltration rate.", related: ["curve-number", "infiltration", "amc", "green-ampt"] },
  { id: "albedo", label: "Surface Albedo", domain: "Climatology", description: "Fraction of solar radiation reflected by a surface.", related: ["energy-balance", "et"], calculatorId: "albedo" },
  { id: "energy-balance", label: "Energy Balance", domain: "Climatology", description: "Rn = λE + H + G — net radiation partitions into latent, sensible, and ground heat.", equation: "Rn = λE + H + G", related: ["albedo", "et", "bowen-ratio"] },
  { id: "bowen-ratio", label: "Bowen Ratio", domain: "Climatology", description: "β = H/λE — ratio of sensible to latent heat flux.", related: ["energy-balance", "et"] },
  { id: "et", label: "Evapotranspiration", domain: "Climatology", description: "Combined evaporation and plant transpiration.", related: ["energy-balance", "albedo", "water-balance"], calculatorId: "et-calculator" },
  { id: "water-balance", label: "Water Balance", domain: "Ecology", description: "P = ET + Qs + Qb + ΔS — fundamental catchment equation.", equation: "P = ET + Qs + Qb + ΔS", related: ["et", "runoff", "baseflow", "recharge"], calculatorId: "catchment-water-balance" },
  { id: "stilling-basin", label: "Stilling Basin", domain: "Structures", description: "Energy dissipation structure downstream of spillways using hydraulic jumps.", related: ["hydraulic-jump", "spillway"], calculatorId: "stilling-basin" },
  { id: "spillway", label: "Spillway", domain: "Structures", description: "Overflow structure for safely passing floods past a dam.", related: ["stilling-basin", "hydraulic-jump"], calculatorId: "spillway-design" },
];

// Simple force-directed layout
function useForceLayout(concepts: ConceptNode[], selected: string | null, width: number, height: number) {
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    const cx = width / 2, cy = height / 2;
    // Group by domain
    const domains = [...new Set(concepts.map(c => c.domain))];
    concepts.forEach((c, i) => {
      const domIdx = domains.indexOf(c.domain);
      const angle = (domIdx / domains.length) * 2 * Math.PI;
      const radius = 180 + Math.random() * 80;
      const spread = (i % 8) * 0.3;
      pos[c.id] = {
        x: cx + Math.cos(angle + spread) * radius + (Math.random() - 0.5) * 60,
        y: cy + Math.sin(angle + spread) * radius + (Math.random() - 0.5) * 60,
      };
    });

    // Run simple force simulation (50 iterations)
    for (let iter = 0; iter < 80; iter++) {
      // Repulsion between all nodes
      for (let i = 0; i < concepts.length; i++) {
        for (let j = i + 1; j < concepts.length; j++) {
          const a = pos[concepts[i].id], b = pos[concepts[j].id];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const force = 800 / (dist * dist);
          const fx = (dx / dist) * force, fy = (dy / dist) * force;
          a.x -= fx; a.y -= fy;
          b.x += fx; b.y += fy;
        }
      }
      // Attraction along edges
      concepts.forEach(c => {
        c.related.forEach(rId => {
          const a = pos[c.id], b = pos[rId];
          if (!a || !b) return;
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const force = (dist - 100) * 0.005;
          const fx = (dx / dist) * force, fy = (dy / dist) * force;
          a.x += fx; a.y += fy;
          b.x -= fx; b.y -= fy;
        });
      });
      // Center gravity
      concepts.forEach(c => {
        const p = pos[c.id];
        p.x += (cx - p.x) * 0.01;
        p.y += (cy - p.y) * 0.01;
      });
    }
    setPositions(pos);
  }, [concepts, width, height]);

  return positions;
}

const NutshellsGraph = ({ onClose }: Props) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [domainFilter, setDomainFilter] = useState<string | null>(null);
  const svgW = 900, svgH = 700;

  const filtered = useMemo(() => {
    let result = CONCEPTS;
    if (search) result = result.filter(c => c.label.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase()));
    if (domainFilter) result = result.filter(c => c.domain === domainFilter);
    return result;
  }, [search, domainFilter]);

  const positions = useForceLayout(filtered, selected, svgW, svgH);
  const selectedConcept = selected ? CONCEPTS.find(c => c.id === selected) : null;
  const relatedIds = selectedConcept ? selectedConcept.related : [];
  const allDomains = [...new Set(CONCEPTS.map(c => c.domain))];

  // Edges
  const edges = useMemo(() => {
    const seen = new Set<string>();
    const result: { from: string; to: string }[] = [];
    filtered.forEach(c => {
      c.related.forEach(rId => {
        const key = [c.id, rId].sort().join("-");
        if (!seen.has(key) && positions[c.id] && positions[rId]) {
          seen.add(key);
          result.push({ from: c.id, to: rId });
        }
      });
    });
    return result;
  }, [filtered, positions]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={onClose} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">Nutshells Knowledge Graph</h1>
      <p className="text-muted-foreground mb-6">
        {CONCEPTS.length} interconnected hydrology concepts. Click nodes to explore.
        <a href="https://ponce.sdsu.edu/the_nutshells.html" target="_blank" rel="noopener noreferrer" className="text-primary ml-2 inline-flex items-center gap-1">Ponce Nutshells <ExternalLink className="w-3 h-3" /></a>
      </p>

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search concepts..." className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1">
          <Button size="sm" variant={domainFilter === null ? "default" : "outline"} onClick={() => setDomainFilter(null)} className="text-xs">All</Button>
          {allDomains.map(d => (
            <Button key={d} size="sm" variant={domainFilter === d ? "default" : "outline"} onClick={() => setDomainFilter(d)} className="text-xs">{d}</Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graph SVG */}
        <div className="lg:col-span-2">
          <Card className="card-water overflow-hidden">
            <CardContent className="p-0">
              <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ minHeight: 400 }}>
                {/* Edges */}
                {edges.map((e, i) => {
                  const from = positions[e.from], to = positions[e.to];
                  if (!from || !to) return null;
                  const isHighlighted = selected && (e.from === selected || e.to === selected);
                  return (
                    <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      stroke={isHighlighted ? "hsl(var(--primary))" : "hsl(var(--border))"}
                      strokeWidth={isHighlighted ? 2 : 0.5}
                      opacity={selected ? (isHighlighted ? 0.8 : 0.1) : 0.3}
                    />
                  );
                })}
                {/* Nodes */}
                {filtered.map(c => {
                  const p = positions[c.id];
                  if (!p) return null;
                  const isSelected = c.id === selected;
                  const isRelated = relatedIds.includes(c.id);
                  const dimmed = selected && !isSelected && !isRelated;
                  const color = DOMAIN_COLORS[c.domain] || "#888";
                  const r = isSelected ? 22 : isRelated ? 16 : 12;
                  return (
                    <g key={c.id} onClick={() => setSelected(isSelected ? null : c.id)} className="cursor-pointer">
                      <circle cx={p.x} cy={p.y} r={r + 3} fill="transparent" />
                      <circle cx={p.x} cy={p.y} r={r} fill={color} opacity={dimmed ? 0.15 : isSelected ? 1 : 0.7}
                        stroke={isSelected ? "hsl(var(--foreground))" : "none"} strokeWidth={isSelected ? 2 : 0} />
                      <text x={p.x} y={p.y + r + 12} textAnchor="middle" fontSize={isSelected ? 11 : 9}
                        fill="hsl(var(--foreground))" opacity={dimmed ? 0.2 : 1} fontWeight={isSelected ? 700 : 400}>
                        {c.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </CardContent>
          </Card>
        </div>

        {/* Detail Panel */}
        <div>
          {selectedConcept ? (
            <Card className="card-water sticky top-20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{selectedConcept.label}</CardTitle>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelected(null)}><X className="w-4 h-4" /></Button>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: DOMAIN_COLORS[selectedConcept.domain] + "30", color: DOMAIN_COLORS[selectedConcept.domain] }}>
                  {selectedConcept.domain}
                </span>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{selectedConcept.description}</p>
                {selectedConcept.equation && (
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <span className="text-xs text-muted-foreground block mb-1">Key Equation</span>
                    <code className="text-sm font-mono font-bold">{selectedConcept.equation}</code>
                  </div>
                )}
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Related Concepts</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedConcept.related.map(rId => {
                      const rc = CONCEPTS.find(c => c.id === rId);
                      return rc ? (
                        <Button key={rId} variant="outline" size="sm" className="text-xs h-6" onClick={() => setSelected(rId)}>{rc.label}</Button>
                      ) : null;
                    })}
                  </div>
                </div>
                {selectedConcept.poncePage && (
                  <a href={selectedConcept.poncePage} target="_blank" rel="noopener noreferrer" className="text-xs text-primary inline-flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> View on ponce.sdsu.edu <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {selectedConcept.calculatorId && (
                  <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => window.location.href = `/modules/${selectedConcept.calculatorId}`}>
                    Open Calculator →
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="card-water">
              <CardContent className="p-6 text-center text-muted-foreground">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Click any node in the graph to explore its definition, equations, and connections.</p>
                <p className="text-xs mt-2">{filtered.length} concepts shown • {edges.length} connections</p>
              </CardContent>
            </Card>
          )}

          {/* Domain Legend */}
          <Card className="card-water mt-4">
            <CardContent className="p-4">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Domains</h4>
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(DOMAIN_COLORS).map(([d, c]) => (
                  <div key={d} className="flex items-center gap-1.5 text-xs cursor-pointer" onClick={() => setDomainFilter(domainFilter === d ? null : d)}>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                    <span className={domainFilter === d ? "font-bold" : ""}>{d}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NutshellsGraph;
