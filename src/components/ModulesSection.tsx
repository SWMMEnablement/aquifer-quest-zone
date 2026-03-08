import {
  Calculator, Waves, Droplet, Mountain, Sun, TreePine, Activity,
  Gauge, Zap, GitBranch, CloudRain, BarChart3, Compass,
  FlaskConical, Wind, Pipette, ArrowDownUp, Thermometer,
  Fish, Scale, Layers,
} from "lucide-react";
import ModuleCard from "./ModuleCard";

interface ModulesSectionProps {
  onOpenModule: (moduleId: string) => void;
}

const modules = [
  // ── Engineering Hydrology ──
  { id: "cn-calculator", title: "Curve Number Calculator", description: "SCS Runoff CN method with sensitivity analysis, AMC variations, and method comparison.", icon: Calculator, color: "blue" as const, status: "available" as const },
  { id: "unit-hydrograph", title: "Unit Hydrograph Builder", description: "Build storm hydrographs via superposition — SCS, Snyder, and custom rainfall patterns.", icon: CloudRain, color: "blue" as const, status: "available" as const },
  { id: "rational-method", title: "Rational Method + IDF", description: "Q = CiA with integrated IDF curves, tc estimation, and applicability warnings.", icon: Gauge, color: "blue" as const, status: "available" as const },
  { id: "flood-frequency", title: "Flood Frequency Analysis", description: "Estimate design discharges using Gumbel, Log-Pearson III, and other distributions.", icon: BarChart3, color: "blue" as const, status: "available" as const },

  // ── Open-Channel Hydraulics ──
  { id: "manning-rating", title: "Manning's Rating Curve", description: "Interactive cross-section editor with live Q-y rating curves for 4 channel shapes.", icon: Layers, color: "teal" as const, status: "available" as const },
  { id: "specific-energy", title: "Specific Energy & Momentum", description: "E-y and M-y diagrams with conjugate depths and hydraulic jump classification.", icon: Zap, color: "teal" as const, status: "available" as const },
  { id: "gvf-profiles", title: "GVF Profile Classifier", description: "All 12 water surface profile types with auto-classification and boundary conditions.", icon: GitBranch, color: "teal" as const, status: "available" as const },
  { id: "froude-explorer", title: "Froude Number Explorer", description: "Visualize sub/supercritical flow transitions with animated wave propagation.", icon: Compass, color: "teal" as const, status: "available" as const },
  { id: "culvert-hydraulics", title: "Culvert Hydraulic Analyzer", description: "Determine flow control type and discharge for circular culverts.", icon: Pipette, color: "teal" as const, status: "available" as const },

  // ── Hydromechanics ──
  { id: "saint-venant", title: "Saint-Venant Wave Explorer", description: "Toggle equation terms to see how wave behavior changes — dynamic to kinematic.", icon: Activity, color: "teal" as const, status: "available" as const },
  { id: "wave-propagation", title: "Wave Propagation Lab", description: "Compare kinematic and dynamic wave celerity with animated channel visualization.", icon: Waves, color: "teal" as const, status: "available" as const },
  { id: "vedernikov", title: "Vedernikov & Roll Waves", description: "Stability threshold and roll wave formation in steep channels.", icon: Wind, color: "teal" as const, status: "available" as const },

  // ── Flood Routing ──
  { id: "muskingum-routing", title: "Muskingum-Cunge Routing", description: "Flood wave propagation and attenuation through channel reaches.", icon: Waves, color: "teal" as const, status: "available" as const },

  // ── Hydrogeology ──
  { id: "groundwater", title: "Groundwater Yield Simulator", description: "Balance pumping rates with ecosystem health in this aquifer management game.", icon: Droplet, color: "blue" as const, status: "available" as const },
  { id: "theis-well", title: "Theis Well Drawdown", description: "Cone of depression calculator with well function W(u) and distance tables.", icon: Droplet, color: "blue" as const, status: "available" as const },
  { id: "baseflow-recession", title: "Baseflow Recession Analyzer", description: "Exponential recession curves with ecosystem health thresholds.", icon: ArrowDownUp, color: "blue" as const, status: "available" as const },

  // ── Stable Channel Design ──
  { id: "channel-design", title: "Stable Channel Design", description: "Design non-eroding, non-silting channels based on flow and sediment load.", icon: Mountain, color: "amber" as const, status: "available" as const },
  { id: "lanes-balance", title: "Lane's Balance", description: "QₛD₅₀ ∝ QwS — Sediment equilibrium with scenario analysis.", icon: Scale, color: "amber" as const, status: "available" as const },

  // ── Sedimentology ──
  { id: "sediment-transport", title: "Sediment Transport Calculator", description: "Compare Meyer-Peter-Müller, Engelund-Hansen, and Yang formulas.", icon: Mountain, color: "amber" as const, status: "available" as const },
  { id: "form-friction", title: "Form vs Grain Friction", description: "Non-monotonic friction decomposition across bedform regimes.", icon: Layers, color: "amber" as const, status: "available" as const },

  // ── Hydroclimatology ──
  { id: "albedo", title: "Albedo & Water Balance", description: "Explore how land surface changes affect water resources through energy balance.", icon: Sun, color: "amber" as const, status: "available" as const },
  { id: "et-calculator", title: "ET Calculator Suite", description: "Five evapotranspiration methods compared: Penman-Monteith, Hargreaves, and more.", icon: Thermometer, color: "amber" as const, status: "available" as const },

  // ── Water Balance ──
  { id: "catchment-water-balance", title: "Catchment Water Balance", description: "P = ET + Qs + Qb + ΔS with monthly breakdown and flow diagrams.", icon: FlaskConical, color: "green" as const, status: "available" as const },

  // ── Hydroecology ──
  { id: "hydroecology", title: "Hydro-Ecological Tracker", description: "Link water management decisions to ecosystem impacts.", icon: TreePine, color: "green" as const, status: "available" as const },
  { id: "environmental-flow", title: "Environmental Flow Calculator", description: "Allocate flows for ecosystems using Tennant, BBM, and RVA methods.", icon: Fish, color: "green" as const, status: "available" as const },

  // ── Structures ──
  { id: "spillway-design", title: "WES Spillway Designer", description: "Ogee spillway profile, rating curve, and discharge computation.", icon: Mountain, color: "amber" as const, status: "available" as const },
];

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
            {modules.length} interactive tools spanning hydrology, hydraulics, hydrogeology, sedimentology, and environmental engineering.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-w-7xl mx-auto">
          {modules.map((module, index) => (
            <ModuleCard
              key={module.id}
              {...module}
              delay={0.05 + index * 0.03}
              onClick={() => onOpenModule(module.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ModulesSection;
