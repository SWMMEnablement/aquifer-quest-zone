import { 
  GraduationCap, 
  Droplets, 
  TreePine, 
  Building2, 
  ArrowRight, 
  CheckCircle2,
  BookOpen,
  Lightbulb,
  Target
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface GettingStartedProps {
  onOpenModule: (moduleId: string) => void;
}

const learningPaths = [
  {
    id: "beginner",
    title: "Hydrology Fundamentals",
    audience: "For undergrads and early-grad students.",
    outcome: "Estimate event runoff with SCS CN and interpret routed hydrographs.",
    icon: GraduationCap,
    description: "Start with rainfall-runoff basics and build toward flood routing.",
    duration: "~30 min",
    color: "text-water-light",
    bgColor: "bg-water-light/10",
    borderColor: "border-water-light/30",
    steps: [
      { module: "cn-calculator", name: "SCS Curve Number", description: "How land use and soils control runoff" },
      { module: "muskingum-routing", name: "Flood Routing", description: "Track flood waves moving downstream" },
      { module: "documentation", name: "Theory Review", description: "Equations, assumptions, references" }
    ]
  },
  {
    id: "practitioner",
    title: "Engineering Applications",
    audience: "For practicing engineers and design-office QC.",
    outcome: "Run quick conceptual checks for channel, well, and water-balance design.",
    icon: Building2,
    description: "Hands-on design and analysis tools you can verify against textbook methods.",
    duration: "~45 min",
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    borderColor: "border-amber-400/30",
    steps: [
      { module: "channel-design", name: "Channel Design", description: "Stable alluvial channel sizing" },
      { module: "groundwater", name: "Groundwater Yield", description: "Balance extraction with sustainability" },
      { module: "albedo", name: "Energy Balance", description: "Land-cover impacts on the water budget" }
    ]
  },
  {
    id: "researcher",
    title: "Eco-Hydrology Focus",
    audience: "For watershed, ecology, and environmental applications.",
    outcome: "Trace how flow decisions propagate into ecosystem response.",
    icon: TreePine,
    description: "Connect the water cycle to ecosystem health and management trade-offs.",
    duration: "~40 min",
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    borderColor: "border-emerald-400/30",
    steps: [
      { module: "albedo", name: "Albedo & Water Balance", description: "Energy partitioning basics" },
      { module: "hydroecology", name: "Impact Tracker", description: "Link water decisions to ecosystems" },
      { module: "groundwater", name: "Aquifer Game", description: "Sustainable groundwater management" }
    ]
  }
];

const quickTips = [
  {
    icon: Lightbulb,
    title: "Interactive Learning",
    description: "Adjust sliders and inputs to see real-time changes in calculations and visualizations."
  },
  {
    icon: Target,
    title: "Try Real Scenarios",
    description: "Each module includes realistic default values based on common engineering applications."
  },
  {
    icon: BookOpen,
    title: "Read the Theory",
    description: "Expand the theory sections in each module to understand the equations behind the calculations."
  }
];

const GettingStarted = ({ onOpenModule }: GettingStartedProps) => {
  return (
    <section id="getting-started" className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4 border-water-light/30 text-water-light">
            <Droplets className="w-3 h-3 mr-1" />
            New to Hydrology Lab?
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Getting Started
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Pick a learning path that matches your background, or jump straight into any module.
            Each path builds progressively from foundational concepts to advanced applications.
          </p>
        </div>

        {/* What's in each module */}
        <div className="max-w-3xl mx-auto mb-12 p-5 rounded-xl bg-card border border-border">
          <h3 className="font-display text-base font-semibold text-foreground mb-3">
            What's in each module
          </h3>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-water-light flex-shrink-0" /> Interactive calculator or simulator</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-water-light flex-shrink-0" /> Pre-loaded example scenarios</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-water-light flex-shrink-0" /> Theory: equations and assumptions</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-water-light flex-shrink-0" /> Links back to Ponce's source pages</li>
          </ul>
        </div>


        {/* Quick Tips */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {quickTips.map((tip, index) => (
            <div 
              key={index}
              className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border"
            >
              <div className="p-2 rounded-md bg-water-light/10">
                <tip.icon className="w-4 h-4 text-water-light" />
              </div>
              <div>
                <h4 className="font-medium text-sm text-foreground">{tip.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Learning Paths */}
        <div className="grid lg:grid-cols-3 gap-6">
          {learningPaths.map((path) => (
            <Card 
              key={path.id} 
              className={`border-2 ${path.borderColor} bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300`}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-xl ${path.bgColor} flex items-center justify-center mb-3`}>
                  <path.icon className={`w-6 h-6 ${path.color}`} />
                </div>
                <CardTitle className="text-lg">{path.title}</CardTitle>
                <p className={`text-xs font-medium ${path.color} mt-1`}>{path.audience}</p>
                <CardDescription className="text-sm mt-2">
                  {path.description}
                </CardDescription>
                <p className="text-xs text-muted-foreground mt-2 italic">
                  Outcome: {path.outcome}
                </p>
                <Badge variant="secondary" className="w-fit mt-3">
                  {path.duration}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Steps */}
                <div className="space-y-3">
                  {path.steps.map((step, index) => (
                    <button
                      key={step.module}
                      onClick={() => onOpenModule(step.module)}
                      className="w-full flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left group"
                    >
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full ${path.bgColor} flex items-center justify-center`}>
                        <span className={`text-xs font-bold ${path.color}`}>{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                            {step.name}
                          </span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-xs text-muted-foreground">{step.description}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Start Button */}
                <Button 
                  variant="outline" 
                  className={`w-full ${path.borderColor} hover:${path.bgColor}`}
                  onClick={() => onOpenModule(path.steps[0].module)}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Start This Path
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* First-Time Recommendation */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-water-deep/20 to-water-light/10 border border-water-light/20 text-center">
          <h3 className="font-display text-xl font-semibold text-foreground mb-2">
            First time here?
          </h3>
          <p className="text-muted-foreground mb-4 max-w-xl mx-auto">
            We recommend starting with the <span className="font-medium text-water-light">SCS Curve Number Calculator</span>. 
            It's the foundation of rainfall-runoff analysis and will help you understand how the other modules build upon it.
          </p>
          <Button 
            variant="water" 
            size="lg"
            onClick={() => onOpenModule("cn-calculator")}
          >
            <Droplets className="w-4 h-4 mr-2" />
            Start with Curve Number
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default GettingStarted;
