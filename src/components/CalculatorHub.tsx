import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search } from "lucide-react";

interface CalculatorHubProps {
  onClose: () => void;
}

interface CalcEntry {
  id: string;
  symbol: string;
  name: string;
  category: string;
  description: string;
  hasModule: boolean;
}

const CATEGORIES: Record<string, { label: string; color: string }> = {
  hydrology: { label: "Engineering Hydrology", color: "bg-primary/20 text-primary border-primary/30" },
  hydraulics: { label: "Open-Channel Hydraulics", color: "bg-accent/20 text-accent border-accent/30" },
  hydromechanics: { label: "Hydromechanics", color: "bg-accent/20 text-accent border-accent/30" },
  hydrogeology: { label: "Hydrogeology", color: "bg-primary/20 text-primary border-primary/30" },
  sediment: { label: "Sedimentology", color: "bg-earth-brown/20 text-earth-brown border-earth-brown/30" },
  geomorphology: { label: "Geomorphology", color: "bg-earth-brown/20 text-earth-brown border-earth-brown/30" },
  structures: { label: "Hydraulic Structures", color: "bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30" },
  climate: { label: "Hydroclimatology", color: "bg-earth-sand/30 text-earth-brown border-earth-brown/30" },
  ecology: { label: "Hydroecology", color: "bg-earth-green/20 text-earth-green border-earth-green/30" },
  balance: { label: "Water Balance", color: "bg-earth-green/20 text-earth-green border-earth-green/30" },
};

const CALCULATORS: CalcEntry[] = [
  // Hydrology
  { id: "cn-calculator", symbol: "CN", name: "Curve Number", category: "hydrology", description: "SCS runoff curve number with sensitivity", hasModule: true },
  { id: "unit-hydrograph", symbol: "UH", name: "Unit Hydrograph", category: "hydrology", description: "Superposition-based hydrograph builder", hasModule: true },
  { id: "rational-method", symbol: "Rm", name: "Rational Method", category: "hydrology", description: "Q = CiA with IDF curves", hasModule: true },
  { id: "flood-frequency", symbol: "FF", name: "Flood Frequency", category: "hydrology", description: "Gumbel, Log-Pearson III analysis", hasModule: true },

  // Hydraulics
  { id: "manning-rating", symbol: "Mn", name: "Manning's Rating", category: "hydraulics", description: "Rating curve for 5 cross-section shapes", hasModule: true },
  { id: "specific-energy", symbol: "SE", name: "Specific Energy", category: "hydraulics", description: "E-y, M-y diagrams + hydraulic jump", hasModule: true },
  { id: "gvf-profiles", symbol: "GV", name: "GVF Profiles", category: "hydraulics", description: "12 water surface profile types", hasModule: true },
  { id: "froude-explorer", symbol: "Fr", name: "Froude Number", category: "hydraulics", description: "Flow regime spectrum explorer", hasModule: true },
  { id: "culvert-hydraulics", symbol: "Cu", name: "Culvert Analyzer", category: "hydraulics", description: "6 flow control types", hasModule: true },

  // Hydromechanics
  { id: "saint-venant", symbol: "SV", name: "Saint-Venant", category: "hydromechanics", description: "Equation term decomposer", hasModule: true },
  { id: "wave-propagation", symbol: "WP", name: "Wave Propagation", category: "hydromechanics", description: "Kinematic vs dynamic celerity", hasModule: true },
  { id: "vedernikov", symbol: "Ve", name: "Vedernikov Number", category: "hydromechanics", description: "Roll wave stability threshold", hasModule: true },

  // Routing
  { id: "muskingum-routing", symbol: "MC", name: "Muskingum-Cunge", category: "hydrology", description: "Flood wave routing", hasModule: true },

  // Hydrogeology
  { id: "groundwater", symbol: "GW", name: "Aquifer Simulator", category: "hydrogeology", description: "Sustainable yield dashboard", hasModule: true },
  { id: "theis-well", symbol: "Th", name: "Theis Drawdown", category: "hydrogeology", description: "Cone of depression calculator", hasModule: true },
  { id: "baseflow-recession", symbol: "Bf", name: "Baseflow Recession", category: "hydrogeology", description: "Exponential recession analysis", hasModule: true },
  { id: "gw-recharge", symbol: "Re", name: "GW Recharge", category: "hydrogeology", description: "Catchment wetting recharge model", hasModule: true },

  // Geomorphology
  { id: "channel-design", symbol: "SC", name: "Stable Channel", category: "geomorphology", description: "Regime theory channel design", hasModule: true },
  { id: "lanes-balance", symbol: "Ln", name: "Lane's Balance", category: "geomorphology", description: "QₛD₅₀ ∝ QwS equilibrium", hasModule: true },
  { id: "tractive-force", symbol: "Tf", name: "Tractive Force", category: "geomorphology", description: "Permissible shear design wizard", hasModule: true },
  { id: "channel-classification", symbol: "Rc", name: "Channel Classification", category: "geomorphology", description: "Rosgen decision tree", hasModule: true },

  // Sediment
  { id: "sediment-transport", symbol: "St", name: "Sediment Transport", category: "sediment", description: "MPM, Engelund-Hansen, Yang", hasModule: true },
  { id: "form-friction", symbol: "Ff", name: "Form Friction", category: "sediment", description: "Grain + form resistance split", hasModule: true },

  // Climate
  { id: "albedo", symbol: "Ab", name: "Albedo Balance", category: "climate", description: "Radiation budget simulator", hasModule: true },
  { id: "et-calculator", symbol: "ET", name: "ET Suite", category: "climate", description: "5 evapotranspiration methods", hasModule: true },

  // Balance
  { id: "catchment-water-balance", symbol: "Wb", name: "Water Balance", category: "balance", description: "P = ET + Qs + Qb + ΔS", hasModule: true },

  // Ecology
  { id: "hydroecology", symbol: "Ec", name: "Hydro-Ecology", category: "ecology", description: "Water-ecosystem impact tracker", hasModule: true },
  { id: "environmental-flow", symbol: "Ef", name: "Environmental Flow", category: "ecology", description: "Tennant, BBM, RVA methods", hasModule: true },

  // Structures
  { id: "spillway-design", symbol: "Sp", name: "WES Spillway", category: "structures", description: "Ogee profile + rating curve", hasModule: true },
  { id: "stilling-basin", symbol: "Sb", name: "Stilling Basin", category: "structures", description: "USBR basin type selector", hasModule: true },

  // Future / reference-only
  { id: "", symbol: "Nd", name: "Normal Depth", category: "hydraulics", description: "Iterative normal depth solver", hasModule: false },
  { id: "", symbol: "Cd", name: "Critical Depth", category: "hydraulics", description: "Critical depth computation", hasModule: false },
  { id: "", symbol: "Wr", name: "Weir Discharge", category: "structures", description: "V-notch, rectangular, Cipolletti", hasModule: false },
  { id: "", symbol: "Sc", name: "Scour Depth", category: "sediment", description: "Local + contraction scour", hasModule: false },
  { id: "", symbol: "Rv", name: "Reservoir Life", category: "sediment", description: "Sedimentation-based lifespan", hasModule: false },
  { id: "", symbol: "Fl", name: "Flood Map", category: "hydrology", description: "Stage-area-discharge mapping", hasModule: false },
];

const CalculatorHub = ({ onClose }: CalculatorHubProps) => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return CALCULATORS.filter((c) => {
      const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase()) || c.symbol.toLowerCase().includes(search.toLowerCase());
      const matchCat = !activeCategory || c.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [search, activeCategory]);

  const navigate = (id: string) => {
    if (id) window.location.href = `/modules/${id}`;
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={onClose}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Calculator Hub</h1>
            <p className="text-muted-foreground mt-1">Periodic table of hydrology calculators — {CALCULATORS.length} tools across {Object.keys(CATEGORIES).length} domains</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search calculators..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button variant={activeCategory === null ? "default" : "outline"} size="sm" onClick={() => setActiveCategory(null)}>All ({CALCULATORS.length})</Button>
          {Object.entries(CATEGORIES).map(([key, cat]) => {
            const count = CALCULATORS.filter(c => c.category === key).length;
            return (
              <Button key={key} variant={activeCategory === key ? "default" : "outline"} size="sm" onClick={() => setActiveCategory(activeCategory === key ? null : key)}>
                {cat.label} ({count})
              </Button>
            );
          })}
        </div>

        {/* Periodic table grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
          {filtered.map((calc, i) => {
            const cat = CATEGORIES[calc.category];
            return (
              <button
                key={`${calc.symbol}-${i}`}
                onClick={() => calc.hasModule && navigate(calc.id)}
                className={`relative p-2 rounded-xl border-2 text-center transition-all duration-200 ${calc.hasModule ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg' : 'opacity-50 cursor-not-allowed'} ${cat?.color || 'bg-muted text-muted-foreground border-border'}`}
                title={`${calc.name}: ${calc.description}`}
              >
                <div className="text-lg font-bold leading-tight">{calc.symbol}</div>
                <div className="text-[8px] leading-tight mt-0.5 truncate">{calc.name}</div>
                {!calc.hasModule && <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-8 p-4 bg-muted rounded-xl">
          <p className="text-sm font-medium text-foreground mb-3">Legend</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={`w-4 h-4 rounded border ${cat.color}`} />
                <span className="text-xs text-muted-foreground">{cat.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border border-border bg-muted flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" /></div>
              <span className="text-xs text-muted-foreground">Coming Soon</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Based on the online calculator collection of Prof. Victor Miguel Ponce, SDSU
            <br /><a href="https://ponce.sdsu.edu/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ponce.sdsu.edu</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CalculatorHub;
