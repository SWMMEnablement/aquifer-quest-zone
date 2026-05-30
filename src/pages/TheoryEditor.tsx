import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Save, RotateCcw, Download, Upload } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { getTheory, type ModuleTheory, type TheoryExample, type TheoryExampleField } from "@/lib/hydrology/theory";
import {
  clearOverride,
  exportOverrides,
  importOverrides,
  isOverridden,
  listAllSlugs,
  loadOverrides,
  saveOverride,
} from "@/lib/hydrology/theory-store";

const empty: ModuleTheory = {
  title: "",
  summary: "",
  equations: [],
  assumptions: [],
  limitations: [],
  parameters: [],
  references: [],
  examples: [],
};

const emptyExample: TheoryExample = { title: "", description: "", inputs: [], outputs: [], notes: "" };
const emptyField: TheoryExampleField = { label: "", value: "", units: "" };

const TheoryEditor = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSlug = searchParams.get("slug") || listAllSlugs()[0] || "";
  const [slug, setSlug] = useState(initialSlug);
  const [draft, setDraft] = useState<ModuleTheory>(empty);
  const slugs = useMemo(() => listAllSlugs(), []);

  useEffect(() => {
    const overrides = loadOverrides();
    const base = overrides[slug] ?? getTheory(slug);
    setDraft(base ? { ...empty, ...base, examples: base.examples ?? [] } : empty);
  }, [slug]);

  const update = <K extends keyof ModuleTheory>(key: K, value: ModuleTheory[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const handleSave = () => {
    if (!slug) return;
    saveOverride(slug, draft);
    toast({ title: "Saved", description: `Theory for "${slug}" updated locally.` });
  };
  const handleReset = () => {
    if (!slug) return;
    clearOverride(slug);
    const base = getTheory(slug);
    setDraft(base ? { ...empty, ...base, examples: base.examples ?? [] } : empty);
    toast({ title: "Reverted", description: "Local override removed." });
  };
  const handleExport = () => {
    const blob = new Blob([exportOverrides()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "theory-overrides.json";
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleImport = async (file: File) => {
    const text = await file.text();
    const res = importOverrides(text);
    if (res.ok) {
      toast({ title: "Imported", description: `${res.count} module override(s) loaded.` });
      const base = loadOverrides()[slug] ?? getTheory(slug);
      setDraft(base ? { ...empty, ...base, examples: base.examples ?? [] } : empty);
    } else {
      toast({ title: "Import failed", description: res.error, variant: "destructive" });
    }
  };

  const StringList = ({
    label,
    items,
    onChange,
    placeholder,
  }: { label: string; items: string[]; onChange: (v: string[]) => void; placeholder: string }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Textarea
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
            placeholder={placeholder}
            className="min-h-[60px]"
          />
          <Button variant="ghost" size="icon" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...items, ""])}>
        <Plus className="w-3 h-3 mr-1" /> Add
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header isCalculatorOpen={true} onOpenDocs={() => navigate("/modules/documentation")} />
      <div className="pt-16 container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate(slug ? `/modules/${slug}` : "/")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="font-display text-3xl font-bold">Theory Editor</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Edit equations, assumptions, parameter ranges, references, and worked examples for any module.
              Changes are saved to your browser (localStorage) — no redeploy required. Use Export/Import to share edits.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="w-4 h-4 mr-1" /> Export</Button>
            <Button variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                <Upload className="w-4 h-4 mr-1" /> Import
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
                />
              </label>
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Module
              {isOverridden(slug) && <Badge variant="outline" className="text-xs">Locally edited</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={slug} onValueChange={(v) => { setSlug(v); setSearchParams({ slug: v }); }}>
              <SelectTrigger><SelectValue placeholder="Select module" /></SelectTrigger>
              <SelectContent>
                {slugs.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">
              Inline citation syntax: use <code className="bg-secondary px-1 rounded">[1]</code>, <code className="bg-secondary px-1 rounded">[2]</code>… in any text field to link to references below.
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Overview</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Title</Label>
                <Input value={draft.title} onChange={(e) => update("title", e.target.value)} />
              </div>
              <div>
                <Label>Summary</Label>
                <Textarea value={draft.summary} onChange={(e) => update("summary", e.target.value)} className="min-h-[100px]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Equations</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {draft.equations.map((eq, i) => (
                <div key={i} className="grid md:grid-cols-[1fr_2fr_2fr_auto] gap-2 items-start">
                  <Input placeholder="Label" value={eq.label} onChange={(e) => {
                    const next = [...draft.equations]; next[i] = { ...eq, label: e.target.value }; update("equations", next);
                  }} />
                  <Input placeholder="Formula" value={eq.formula} onChange={(e) => {
                    const next = [...draft.equations]; next[i] = { ...eq, formula: e.target.value }; update("equations", next);
                  }} className="font-mono" />
                  <Input placeholder="Notes (supports [1])" value={eq.notes ?? ""} onChange={(e) => {
                    const next = [...draft.equations]; next[i] = { ...eq, notes: e.target.value }; update("equations", next);
                  }} />
                  <Button variant="ghost" size="icon" onClick={() => update("equations", draft.equations.filter((_, j) => j !== i))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => update("equations", [...draft.equations, { label: "", formula: "", notes: "" }])}>
                <Plus className="w-3 h-3 mr-1" /> Add equation
              </Button>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Assumptions</CardTitle></CardHeader>
              <CardContent>
                <StringList label="" items={draft.assumptions} onChange={(v) => update("assumptions", v)} placeholder="One assumption per entry" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Limitations</CardTitle></CardHeader>
              <CardContent>
                <StringList label="" items={draft.limitations} onChange={(v) => update("limitations", v)} placeholder="One limitation per entry" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Parameter Ranges</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {draft.parameters.map((p, i) => (
                <div key={i} className="grid md:grid-cols-[1fr_2fr_1fr_1fr_2fr_auto] gap-2 items-start">
                  <Input placeholder="Symbol" value={p.symbol} onChange={(e) => {
                    const next = [...draft.parameters]; next[i] = { ...p, symbol: e.target.value }; update("parameters", next);
                  }} />
                  <Input placeholder="Name" value={p.name} onChange={(e) => {
                    const next = [...draft.parameters]; next[i] = { ...p, name: e.target.value }; update("parameters", next);
                  }} />
                  <Input placeholder="Range" value={p.range} onChange={(e) => {
                    const next = [...draft.parameters]; next[i] = { ...p, range: e.target.value }; update("parameters", next);
                  }} />
                  <Input placeholder="Units" value={p.units ?? ""} onChange={(e) => {
                    const next = [...draft.parameters]; next[i] = { ...p, units: e.target.value }; update("parameters", next);
                  }} />
                  <Input placeholder="Note" value={p.note ?? ""} onChange={(e) => {
                    const next = [...draft.parameters]; next[i] = { ...p, note: e.target.value }; update("parameters", next);
                  }} />
                  <Button variant="ghost" size="icon" onClick={() => update("parameters", draft.parameters.filter((_, j) => j !== i))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => update("parameters", [...draft.parameters, { symbol: "", name: "", range: "" }])}>
                <Plus className="w-3 h-3 mr-1" /> Add parameter
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">References (Bibliography)</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {draft.references.map((r, i) => (
                <div key={i} className="grid md:grid-cols-[auto_3fr_2fr_auto] gap-2 items-center">
                  <span className="font-mono text-primary text-sm">[{i + 1}]</span>
                  <Input placeholder="Citation" value={r.citation} onChange={(e) => {
                    const next = [...draft.references]; next[i] = { ...r, citation: e.target.value }; update("references", next);
                  }} />
                  <Input placeholder="URL (optional)" value={r.url ?? ""} onChange={(e) => {
                    const next = [...draft.references]; next[i] = { ...r, url: e.target.value }; update("references", next);
                  }} />
                  <Button variant="ghost" size="icon" onClick={() => update("references", draft.references.filter((_, j) => j !== i))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => update("references", [...draft.references, { citation: "", url: "" }])}>
                <Plus className="w-3 h-3 mr-1" /> Add reference
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Worked Examples</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {(draft.examples ?? []).map((ex, ei) => {
                const updateEx = (patch: Partial<TheoryExample>) => {
                  const next = [...(draft.examples ?? [])];
                  next[ei] = { ...ex, ...patch };
                  update("examples", next);
                };
                const renderFields = (kind: "inputs" | "outputs") => (
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wide">{kind}</Label>
                    {ex[kind].map((f, fi) => (
                      <div key={fi} className="grid grid-cols-[2fr_1fr_1fr_2fr_auto] gap-2">
                        <Input placeholder="Label" value={f.label} onChange={(e) => {
                          const next = [...ex[kind]]; next[fi] = { ...f, label: e.target.value }; updateEx({ [kind]: next } as Partial<TheoryExample>);
                        }} />
                        <Input placeholder="Value" value={f.value} onChange={(e) => {
                          const next = [...ex[kind]]; next[fi] = { ...f, value: e.target.value }; updateEx({ [kind]: next } as Partial<TheoryExample>);
                        }} />
                        <Input placeholder="Units" value={f.units ?? ""} onChange={(e) => {
                          const next = [...ex[kind]]; next[fi] = { ...f, units: e.target.value }; updateEx({ [kind]: next } as Partial<TheoryExample>);
                        }} />
                        <Input placeholder="Note" value={f.note ?? ""} onChange={(e) => {
                          const next = [...ex[kind]]; next[fi] = { ...f, note: e.target.value }; updateEx({ [kind]: next } as Partial<TheoryExample>);
                        }} />
                        <Button variant="ghost" size="icon" onClick={() => {
                          updateEx({ [kind]: ex[kind].filter((_, j) => j !== fi) } as Partial<TheoryExample>);
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => updateEx({ [kind]: [...ex[kind], { ...emptyField }] } as Partial<TheoryExample>)}>
                      <Plus className="w-3 h-3 mr-1" /> Add {kind === "inputs" ? "input" : "output"}
                    </Button>
                  </div>
                );
                return (
                  <div key={ei} className="border border-border rounded-lg p-3 space-y-3">
                    <div className="flex gap-2 items-start">
                      <Input placeholder="Example title" value={ex.title} onChange={(e) => updateEx({ title: e.target.value })} />
                      <Button variant="ghost" size="icon" onClick={() => update("examples", (draft.examples ?? []).filter((_, j) => j !== ei))}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Textarea placeholder="Description (supports [1])" value={ex.description ?? ""} onChange={(e) => updateEx({ description: e.target.value })} />
                    {renderFields("inputs")}
                    {renderFields("outputs")}
                    <Input placeholder="Notes" value={ex.notes ?? ""} onChange={(e) => updateEx({ notes: e.target.value })} />
                  </div>
                );
              })}
              <Button variant="outline" size="sm" onClick={() => update("examples", [...(draft.examples ?? []), { ...emptyExample, inputs: [], outputs: [] }])}>
                <Plus className="w-3 h-3 mr-1" /> Add worked example
              </Button>
            </CardContent>
          </Card>

          <div className="flex gap-3 sticky bottom-4 bg-background/90 backdrop-blur p-3 rounded-lg border border-border">
            <Button onClick={handleSave}><Save className="w-4 h-4 mr-2" /> Save changes</Button>
            <Button variant="outline" onClick={handleReset} disabled={!isOverridden(slug)}>
              <RotateCcw className="w-4 h-4 mr-2" /> Revert to default
            </Button>
            <Button variant="ghost" asChild>
              <Link to={`/modules/${slug}`}>Preview in module →</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TheoryEditor;
