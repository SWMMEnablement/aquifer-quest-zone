import {
  Calculator, Waves, Droplet, Mountain, Sun, TreePine, Activity,
  Gauge, Zap, GitBranch, CloudRain, BarChart3, Compass,
  FlaskConical, Wind, Pipette, ArrowDownUp, Thermometer,
  Fish, Scale, Layers, Shield, Building, Network, Map,
  Grid3X3, CloudDrizzle,
} from "lucide-react";
import ModuleCard from "./ModuleCard";

interface ModulesSectionProps {
  onOpenModule: (moduleId: string) => void;
}

interface ModuleDef {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: "blue" | "teal" | "green" | "amber";
  status: "available" | "coming-soon";
}

interface DomainGroup {
  domain: string;
  description: string;
  modules: ModuleDef[];
}

const domains: DomainGroup[] = [
  {
    domain: "Engineering Hydrology",
    description: "Rainfall-runoff, flood frequency, and routing methods",
    modules: [
      { id: "cn-calculator", title: "Curve Number Calculator", description: "SCS Runoff CN method with sensitivity analysis, AMC variations, and method comparison.", icon: Calculator, color: "blue", status: "available" },
      { id: "unit-hydrograph", title: "Unit Hydrograph Builder", description: "Build storm hydrographs via superposition — SCS, Snyder, and custom rainfall patterns.", icon: CloudRain, color: "blue", status: "available" },
      { id: "rational-method", title: "Rational Method + IDF", description: "Q = CiA with integrated IDF curves, tc estimation, and applicability warnings.", icon: Gauge, color: "blue", status: "available" },
      { id: "flood-frequency", title: "Flood Frequency Analysis", description: "Estimate design discharges using Gumbel, Log-Pearson III, and other distributions.", icon: BarChart3, color: "blue", status: "available" },
      { id: "muskingum-routing", title: "Muskingum-Cunge Routing", description: "Flood wave propagation and attenuation through channel reaches.", icon: Waves, color: "blue", status: "available" },
    ],
  },
  {
    domain: "Open-Channel Hydraulics",
    description: "Manning's equation, energy, momentum, and water surface profiles",
    modules: [
      { id: "manning-rating", title: "Manning's Rating Curve", description: "Interactive cross-section editor with live Q-y rating curves for 5 channel shapes.", icon: Layers, color: "teal", status: "available" },
      { id: "specific-energy", title: "Specific Energy & Momentum", description: "E-y and M-y diagrams with draggable conjugate depths and animated hydraulic jump.", icon: Zap, color: "teal", status: "available" },
      { id: "gvf-profiles", title: "GVF Profile Classifier", description: "All 12 water surface profile types with auto-classification and boundary conditions.", icon: GitBranch, color: "teal", status: "available" },
      { id: "froude-explorer", title: "Froude Number Explorer", description: "Visualize sub/supercritical flow transitions with animated wave propagation.", icon: Compass, color: "teal", status: "available" },
      { id: "culvert-hydraulics", title: "Culvert Hydraulic Analyzer", description: "Determine flow control type and discharge for circular culverts.", icon: Pipette, color: "teal", status: "available" },
    ],
  },
  {
    domain: "Hydromechanics",
    description: "Wave theory, Saint-Venant equations, and flow stability",
    modules: [
      { id: "saint-venant", title: "Saint-Venant Wave Explorer", description: "Toggle equation terms to see how wave behavior changes — dynamic to kinematic.", icon: Activity, color: "teal", status: "available" },
      { id: "wave-propagation", title: "Wave Propagation Lab", description: "Compare kinematic and dynamic wave celerity with animated channel visualization.", icon: Waves, color: "teal", status: "available" },
      { id: "vedernikov", title: "Vedernikov & Roll Waves", description: "Stability threshold and roll wave formation in steep channels.", icon: Wind, color: "teal", status: "available" },
    ],
  },
  {
    domain: "Hydrogeology",
    description: "Groundwater flow, wells, recharge, and sustainable yield",
    modules: [
      { id: "groundwater", title: "Groundwater Yield Simulator", description: "Balance pumping rates with ecosystem health in this aquifer management game.", icon: Droplet, color: "blue", status: "available" },
      { id: "theis-well", title: "Theis Well Drawdown", description: "Cone of depression calculator with well function W(u) and distance tables.", icon: Droplet, color: "blue", status: "available" },
      { id: "baseflow-recession", title: "Baseflow Recession Analyzer", description: "Exponential recession curves with ecosystem health thresholds.", icon: ArrowDownUp, color: "blue", status: "available" },
      { id: "gw-recharge", title: "GW Recharge Calculator", description: "Catchment wetting method with φ vs P sensitivity and recharge pathway diagram.", icon: Droplet, color: "blue", status: "available" },
    ],
  },
  {
    domain: "Hydrogeomorphology",
    description: "Channel equilibrium, classification, and stable design",
    modules: [
      { id: "channel-design", title: "Stable Channel Design", description: "Design non-eroding, non-silting channels based on flow and sediment load.", icon: Mountain, color: "amber", status: "available" },
      { id: "tractive-force", title: "Tractive Force Wizard", description: "Step-by-step stable channel design using permissible shear stress.", icon: Shield, color: "amber", status: "available" },
      { id: "lanes-balance", title: "Lane's Balance", description: "QₛD₅₀ ∝ QwS — Sediment equilibrium with scenario analysis.", icon: Scale, color: "amber", status: "available" },
      { id: "channel-classification", title: "Channel Classification", description: "Rosgen stream classification decision tree with gallery view.", icon: Map, color: "amber", status: "available" },
    ],
  },
  {
    domain: "Hydrosedimentology",
    description: "Sediment transport, bedforms, and friction decomposition",
    modules: [
      { id: "sediment-transport", title: "Sediment Transport Calculator", description: "Compare Meyer-Peter-Müller, Engelund-Hansen, and Yang formulas.", icon: Mountain, color: "amber", status: "available" },
      { id: "form-friction", title: "Form vs Grain Friction", description: "Non-monotonic friction decomposition across bedform regimes.", icon: Layers, color: "amber", status: "available" },
    ],
  },
  {
    domain: "Hydroclimatology",
    description: "Energy balance, albedo, and evapotranspiration",
    modules: [
      { id: "albedo", title: "Albedo & Water Balance", description: "Explore how land surface changes affect water resources through energy balance.", icon: Sun, color: "amber", status: "available" },
      { id: "et-calculator", title: "ET Calculator Suite", description: "Five evapotranspiration methods compared: Penman-Monteith, Hargreaves, and more.", icon: Thermometer, color: "amber", status: "available" },
    ],
  },
  {
    domain: "Hydroecology & Water Balance",
    description: "Ecosystem flows, catchment budgets, and environmental impact",
    modules: [
      { id: "catchment-water-balance", title: "Catchment Water Balance", description: "P = ET + Qs + Qb + ΔS with monthly breakdown and flow diagrams.", icon: FlaskConical, color: "green", status: "available" },
      { id: "hydroecology", title: "Hydro-Ecological Tracker", description: "Link water management decisions to ecosystem impacts.", icon: TreePine, color: "green", status: "available" },
      { id: "environmental-flow", title: "Environmental Flow Calculator", description: "Allocate flows for ecosystems using Tennant, BBM, and RVA methods.", icon: Fish, color: "green", status: "available" },
    ],
  },
  {
    domain: "Hydraulic Structures",
    description: "Spillways, stilling basins, and energy dissipation",
    modules: [
      { id: "spillway-design", title: "WES Spillway Designer", description: "Ogee spillway profile, rating curve, and discharge computation.", icon: Building, color: "amber", status: "available" },
      { id: "stilling-basin", title: "Stilling Basin Designer", description: "USBR hydraulic jump basin with energy dissipation and tailwater analysis.", icon: Building, color: "amber", status: "available" },
    ],
  },
  {
    domain: "Urban Stormwater (SWMM)",
    description: "Gutters, inlets, pipe flow, weirs, water hammer, and pump curves",
    modules: [
      { id: "swmm-calculator", title: "SWMM Urban Hydraulics Suite", description: "6-tab stormwater toolbox: gutter flow, inlet design, pipe flow, weirs, water hammer, pump curves.", icon: CloudDrizzle, color: "teal", status: "available" },
    ],
  },
  {
    domain: "Learning & Platform",
    description: "Knowledge graph, workflow builder, and lecture companion",
    modules: [
      { id: "workflow-builder", title: "Workflow Builder", description: "Chain calculators to model complete hydrological processes.", icon: Network, color: "blue", status: "available" },
      { id: "nutshells-graph", title: "Nutshells Knowledge Graph", description: "60+ interconnected hydrology concepts with equations and links.", icon: Network, color: "blue", status: "available" },
      { id: "video-lectures", title: "Video Lecture Companion", description: "Synchronized diagrams that update with lecture content.", icon: Activity, color: "blue", status: "available" },
    ],
  },
];

const totalModules = domains.reduce((acc, d) => acc + d.modules.length, 0);

const ModulesSection = ({ onOpenModule }: ModulesSectionProps) => {
  return (
    <section id="modules" className="py-24 bg-background">
      <div className="container px-6">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4 animate-fade-in">
            Interactive{" "}
            <span className="text-gradient-water">Modules</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {totalModules} interactive tools spanning {domains.length} hydrological domains.
            Each card is tagged by type — Calculator, Simulator, Builder, or Visualization — so you can pick the right tool fast.
          </p>
          <button
            onClick={() => onOpenModule("calculator-hub")}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
            aria-label="Open the Calculator Hub to search all modules"
          >
            <Grid3X3 className="w-4 h-4" />
            Open Calculator Hub
          </button>
        </div>

        <div className="max-w-7xl mx-auto space-y-16">
          {domains.map((domain, di) => (
            <div key={domain.domain}>
              <div className="mb-6">
                <h3 className="font-display text-2xl font-bold text-foreground">{domain.domain}</h3>
                <p className="text-sm text-muted-foreground">{domain.description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {domain.modules.map((module, mi) => (
                  <ModuleCard
                    key={module.id}
                    {...module}
                    delay={0.05 + mi * 0.03}
                    onClick={() => onOpenModule(module.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ModulesSection;
