import {
  Calculator,
  Waves,
  Droplet,
  Mountain,
  Sun,
  TreePine,
} from "lucide-react";
import ModuleCard from "./ModuleCard";

interface ModulesSectionProps {
  onOpenModule: (moduleId: string) => void;
}

const modules = [
  {
    id: "cn-calculator",
    title: "Curve Number Calculator",
    description:
      "Interactive SCS Runoff Curve Number method with sensitivity analysis, AMC variations, and method comparison.",
    icon: Calculator,
    color: "blue" as const,
    status: "available" as const,
  },
  {
    id: "muskingum-routing",
    title: "Muskingum-Cunge Routing",
    description:
      "Visualize flood wave propagation and attenuation through channel reaches with animated simulation.",
    icon: Waves,
    color: "teal" as const,
    status: "available" as const,
  },
  {
    id: "groundwater",
    title: "Groundwater Yield Simulator",
    description:
      "Balance pumping rates with ecosystem health in this aquifer management game.",
    icon: Droplet,
    color: "blue" as const,
    status: "available" as const,
  },
  {
    id: "channel-design",
    title: "Stable Channel Design",
    description:
      "Design non-eroding, non-silting channels based on flow and sediment load.",
    icon: Mountain,
    color: "amber" as const,
    status: "available" as const,
  },
  {
    id: "albedo",
    title: "Albedo & Water Balance",
    description:
      "Explore how land surface changes affect local water resources through energy balance.",
    icon: Sun,
    color: "amber" as const,
    status: "available" as const,
  },
  {
    id: "hydroecology",
    title: "Hydro-Ecological Tracker",
    description:
      "Link water management decisions to ecosystem impacts in an interactive watershed.",
    icon: TreePine,
    color: "green" as const,
    status: "available" as const,
  },
];

const ModulesSection = ({ onOpenModule }: ModulesSectionProps) => {
  return (
    <section id="modules" className="py-24 bg-background">
      <div className="container px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4 animate-fade-in">
            Interactive{" "}
            <span className="text-gradient-water">Modules</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Explore hydrological concepts through hands-on calculators, simulators, and visualization tools.
          </p>
        </div>

        {/* Module grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {modules.map((module, index) => (
            <ModuleCard
              key={module.id}
              {...module}
              delay={0.1 + index * 0.1}
              onClick={() => onOpenModule(module.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ModulesSection;
