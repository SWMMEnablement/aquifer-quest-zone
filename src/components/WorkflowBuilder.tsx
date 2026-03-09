import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Plus, X, Play, ExternalLink, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props { onClose: () => void; }

interface WorkflowNode {
  id: string;
  calcId: string;
  inputs: Record<string, number>;
  outputs: Record<string, number>;
}

const CALCULATORS = [
  { id: "rainfall", label: "Rainfall Input", category: "input", inputs: [], outputs: ["P", "duration", "returnPeriod"], description: "Define storm event" },
  { id: "cn", label: "SCS Curve Number", category: "hydrology", inputs: ["P"], outputs: ["Q", "S", "Ia", "F"], description: "Q = (P-Ia)²/(P-Ia+S)" },
  { id: "rational", label: "Rational Method", category: "hydrology", inputs: ["intensity", "area"], outputs: ["Qpeak"], description: "Q = CiA" },
  { id: "unit-hydrograph", label: "Unit Hydrograph", category: "hydrology", inputs: ["Q", "area", "tc"], outputs: ["Qpeak", "hydrograph"], description: "Storm → Hydrograph" },
  { id: "muskingum", label: "Muskingum-Cunge", category: "routing", inputs: ["hydrograph", "reachLength", "slope"], outputs: ["routedHydrograph", "peakAttenuation"], description: "Flood routing" },
  { id: "manning", label: "Manning's Equation", category: "hydraulics", inputs: ["Q", "slope", "n"], outputs: ["depth", "velocity", "Fr"], description: "V = (1/n)R²/³S½" },
  { id: "energy", label: "Specific Energy", category: "hydraulics", inputs: ["Q", "depth"], outputs: ["E", "yc", "Fr", "conjugateDepth"], description: "E = y + V²/2g" },
  { id: "gvf", label: "GVF Profile", category: "hydraulics", inputs: ["Q", "slope", "depth"], outputs: ["profileType", "waterSurface"], description: "Classify M/S/C/H/A" },
  { id: "flood-freq", label: "Flood Frequency", category: "statistics", inputs: ["annualMaxSeries"], outputs: ["Q100", "Q50", "Q25"], description: "Return period analysis" },
  { id: "spillway", label: "Spillway Design", category: "structures", inputs: ["Qdesign", "headwaterElev"], outputs: ["crestLength", "profile"], description: "WES ogee profile" },
  { id: "stilling", label: "Stilling Basin", category: "structures", inputs: ["Q", "upstreamDepth", "tailwaterDepth"], outputs: ["basinType", "basinLength"], description: "USBR jump basin" },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  input: "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700",
  hydrology: "bg-cyan-100 dark:bg-cyan-900/30 border-cyan-300 dark:border-cyan-700",
  routing: "bg-teal-100 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700",
  hydraulics: "bg-sky-100 dark:bg-sky-900/30 border-sky-300 dark:border-sky-700",
  statistics: "bg-violet-100 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700",
  structures: "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700",
};

const PRESETS = [
  { label: "Rainfall → Runoff → Routing", nodes: ["rainfall", "cn", "unit-hydrograph", "muskingum"] },
  { label: "Rainfall → CN → Manning", nodes: ["rainfall", "cn", "manning"] },
  { label: "Flood Freq → Spillway → Basin", nodes: ["flood-freq", "spillway", "stilling"] },
  { label: "Rainfall → Rational Method", nodes: ["rainfall", "rational"] },
];

// Simple demo values
function computeNode(calcId: string, inputs: Record<string, number>): Record<string, number> {
  const P = inputs.P ?? 100;
  switch (calcId) {
    case "rainfall": return { P, duration: 6, returnPeriod: 100 };
    case "cn": {
      const CN = 75; const S = 25400/CN - 254; const Ia = 0.2*S;
      const Q = P > Ia ? Math.pow(P-Ia, 2)/(P-Ia+S) : 0;
      return { Q: +Q.toFixed(2), S: +S.toFixed(1), Ia: +Ia.toFixed(1), F: +(P-Ia-Q).toFixed(1) };
    }
    case "unit-hydrograph": {
      const Q = inputs.Q ?? 50; const area = 100; const tc = 4;
      const Qp = 2.08 * area * Q / (1000 * tc);
      return { Qpeak: +Qp.toFixed(1), hydrograph: 1 };
    }
    case "muskingum": {
      const Qp = inputs.Qpeak ?? inputs.Q ?? 100;
      return { routedHydrograph: 1, peakAttenuation: +(Qp * 0.12).toFixed(1) };
    }
    case "manning": {
      const Q = inputs.Q ?? 10; const n = 0.035; const S = 0.001;
      const y = Math.pow(Q * n / Math.sqrt(S), 3/8);
      return { depth: +y.toFixed(2), velocity: +(Q/(y*10)).toFixed(2), Fr: 0.5 };
    }
    case "energy": {
      const Q = inputs.Q ?? 10; const y = inputs.depth ?? 2;
      const V = Q / (y * 10); const E = y + V*V/(2*9.81);
      return { E: +E.toFixed(3), yc: +Math.pow(Q*Q/(9.81*100), 1/3).toFixed(3), Fr: +(V/Math.sqrt(9.81*y)).toFixed(3), conjugateDepth: 0 };
    }
    case "rational": return { Qpeak: +(0.5 * (P/6) * 2).toFixed(1) };
    default: return {};
  }
}

const WorkflowBuilder = ({ onClose }: Props) => {
  const navigate = useNavigate();
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [addCalcId, setAddCalcId] = useState<string>("");

  const addNode = useCallback((calcId: string) => {
    if (!calcId) return;
    setNodes(prev => [...prev, { id: `${calcId}-${Date.now()}`, calcId, inputs: {}, outputs: {} }]);
    setAddCalcId("");
  }, []);

  const removeNode = useCallback((id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
  }, []);

  const loadPreset = useCallback((preset: typeof PRESETS[number]) => {
    setNodes(preset.nodes.map((calcId, i) => ({ id: `${calcId}-${i}`, calcId, inputs: {}, outputs: {} })));
  }, []);

  // Compute chain
  const computedNodes = useMemo(() => {
    let carry: Record<string, number> = {};
    return nodes.map(node => {
      const merged = { ...carry, ...node.inputs };
      const outputs = computeNode(node.calcId, merged);
      carry = { ...carry, ...outputs };
      return { ...node, inputs: merged, outputs };
    });
  }, [nodes]);

  // Check connections
  const getConnectionWarnings = (idx: number): string[] => {
    if (idx === 0) return [];
    const calc = CALCULATORS.find(c => c.id === computedNodes[idx].calcId);
    if (!calc) return [];
    const available = Object.keys(computedNodes[idx].inputs);
    return calc.inputs.filter(inp => !available.includes(inp)).map(inp => `Missing input: ${inp}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Button variant="ghost" onClick={onClose} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">Calculator Workflow Builder</h1>
      <p className="text-muted-foreground mb-6">
        Chain calculators to model complete hydrological processes. Outputs flow downstream automatically.
        <a href="https://ponce.sdsu.edu/" target="_blank" rel="noopener noreferrer" className="text-primary ml-2 inline-flex items-center gap-1">Ponce Reference <ExternalLink className="w-3 h-3" /></a>
      </p>

      {/* Presets */}
      <Card className="card-water mb-6">
        <CardHeader><CardTitle className="text-lg">Quick Start Workflows</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {PRESETS.map((p, i) => (
            <Button key={i} variant="outline" size="sm" onClick={() => loadPreset(p)} className="text-xs">
              {p.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Workflow Chain */}
      <div className="space-y-1 mb-6">
        {computedNodes.length === 0 && (
          <Card className="card-water border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">
              <p className="text-lg mb-2">No calculators in the workflow yet</p>
              <p className="text-sm">Add a calculator below or choose a quick start preset above.</p>
            </CardContent>
          </Card>
        )}

        {computedNodes.map((node, idx) => {
          const calc = CALCULATORS.find(c => c.id === node.calcId)!;
          const warnings = getConnectionWarnings(idx);
          return (
            <div key={node.id}>
              {idx > 0 && (
                <div className="flex justify-center py-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ArrowRight className="w-3 h-3" />
                    <span className="font-mono">{Object.keys(computedNodes[idx-1].outputs).join(", ")}</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              )}
              <Card className={`border-2 ${CATEGORY_COLORS[calc.category]} transition-all`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-background/50 text-muted-foreground">{idx + 1}</span>
                        <h3 className="font-bold text-foreground">{calc.label}</h3>
                        <span className="text-xs text-muted-foreground">{calc.category}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{calc.description}</p>
                      {warnings.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mb-2">
                          <AlertTriangle className="w-3 h-3" />
                          {warnings.join(", ")}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                        {calc.inputs.length > 0 && (
                          <div>
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Inputs</span>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {calc.inputs.map(inp => (
                                <span key={inp} className="text-xs font-mono px-1.5 py-0.5 rounded bg-background/80 border border-border">
                                  {inp}{node.inputs[inp] !== undefined ? ` = ${node.inputs[inp]}` : ""}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {Object.keys(node.outputs).length > 0 && (
                          <div>
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Outputs</span>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {Object.entries(node.outputs).map(([k, v]) => (
                                <span key={k} className="text-xs font-mono px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary">
                                  {k} = {typeof v === "number" ? v : "✓"}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                        const moduleMap: Record<string, string> = {
                          cn: "cn-calculator", "unit-hydrograph": "unit-hydrograph",
                          muskingum: "muskingum-routing", manning: "manning-rating",
                          energy: "specific-energy", gvf: "gvf-profiles",
                          rational: "rational-method", "flood-freq": "flood-frequency",
                          spillway: "spillway-design", stilling: "stilling-basin",
                        };
                        const route = moduleMap[node.calcId];
                        if (route) navigate(`/modules/${route}`);
                      }}>
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeNode(node.id)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Add calculator */}
      <Card className="card-water">
        <CardContent className="p-4 flex items-center gap-3">
          <Plus className="w-5 h-5 text-muted-foreground" />
          <Select value={addCalcId} onValueChange={setAddCalcId}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Add a calculator to the workflow..." /></SelectTrigger>
            <SelectContent>
              {CALCULATORS.map(c => (
                <SelectItem key={c.id} value={c.id} className="text-sm">
                  <span className="font-medium">{c.label}</span>
                  <span className="text-muted-foreground ml-2 text-xs">— {c.description}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => addNode(addCalcId)} disabled={!addCalcId}>Add</Button>
        </CardContent>
      </Card>

      {/* Summary */}
      {computedNodes.length > 1 && (
        <Card className="card-water mt-6">
          <CardHeader><CardTitle className="text-lg">Workflow Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {computedNodes.map((node, idx) => {
                const calc = CALCULATORS.find(c => c.id === node.calcId)!;
                return (
                  <div key={node.id} className="flex items-center gap-1">
                    <span className="text-xs font-mono px-2 py-1 rounded bg-secondary text-secondary-foreground">{calc.label}</span>
                    {idx < computedNodes.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Total steps:</strong> {computedNodes.length}</p>
              <p><strong>Final outputs:</strong> {Object.entries(computedNodes[computedNodes.length-1].outputs).map(([k,v]) => `${k}=${v}`).join(", ")}</p>
              <p className="italic mt-2">Outputs from each step are automatically passed as inputs to subsequent steps in the chain.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WorkflowBuilder;
