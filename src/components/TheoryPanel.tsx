import { BookOpen, AlertTriangle, Sigma, Sliders, ExternalLink, ChevronDown, FlaskConical, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMergedTheory, isOverridden } from "@/lib/hydrology/theory-store";

interface Props {
  slug: string;
  className?: string;
  defaultOpen?: boolean;
}

const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <section>
    <h3 className="flex items-center gap-2 text-base font-semibold text-foreground mb-2">
      {icon}
      {title}
    </h3>
    {children}
  </section>
);

/** Render text with inline [n] citations as anchor links into the bibliography. */
const renderWithCitations = (text: string, slug: string, refsCount: number): React.ReactNode => {
  const parts = text.split(/(\[\d+\])/g);
  return parts.map((p, i) => {
    const m = p.match(/^\[(\d+)\]$/);
    if (m) {
      const n = Number(m[1]);
      if (n >= 1 && n <= refsCount) {
        return (
          <a key={i} href={`#ref-${slug}-${n}`} className="text-primary hover:underline font-medium">[{n}]</a>
        );
      }
    }
    return <span key={i}>{p}</span>;
  });
};

const TheoryPanel = ({ slug, className = "container mx-auto px-4 pb-10 max-w-7xl", defaultOpen = false }: Props) => {
  const theory = getMergedTheory(slug);
  const refsCount = theory?.references.length ?? 0;
  const cite = (text: string) => renderWithCitations(text, slug, refsCount);

  return (
    <div className={className}>
      <Card className="card-water border-primary/20">
        <Collapsible defaultOpen={defaultOpen}>
          <div className="flex items-center justify-between gap-2 pr-4">
            <CollapsibleTrigger className="flex-1 text-left" aria-label="Toggle theory and assumptions">
              <CardHeader className="flex flex-row items-center justify-between gap-3 cursor-pointer hover:bg-secondary/30 transition-colors rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Theory &amp; Assumptions
                  {theory ? (
                    <Badge variant="secondary" className="ml-2 text-xs font-normal">{theory.title}</Badge>
                  ) : (
                    <Badge variant="outline" className="ml-2 text-xs font-normal">Reference pending</Badge>
                  )}
                  {isOverridden(slug) && (
                    <Badge variant="outline" className="text-xs font-normal border-amber-500/40 text-amber-600 dark:text-amber-400">Edited locally</Badge>
                  )}
                </CardTitle>
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
              </CardHeader>
            </CollapsibleTrigger>
            <Button asChild variant="ghost" size="sm" className="shrink-0">
              <Link to={`/admin/theory?slug=${encodeURIComponent(slug)}`} aria-label="Edit theory content">
                <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
              </Link>
            </Button>
          </div>

          <CollapsibleContent>
            <CardContent className="space-y-6 pt-2">
              {!theory && (
                <p className="text-sm text-muted-foreground">
                  A structured theory note for this module is being prepared. Use the Edit button to add one — it will save to your browser and appear immediately.
                </p>
              )}

              {theory && (
                <>
                  <p className="text-sm text-muted-foreground leading-relaxed">{cite(theory.summary)}</p>

                  <Section title="Governing Equations" icon={<Sigma className="w-4 h-4 text-primary" />}>
                    <div className="space-y-3 bg-secondary/40 rounded-lg p-4">
                      {theory.equations.map((eq, i) => (
                        <div key={i} className="border-l-2 border-primary/40 pl-3">
                          <div className="text-xs uppercase tracking-wide text-muted-foreground">{eq.label}</div>
                          <div className="font-mono text-sm text-foreground mt-0.5">{eq.formula}</div>
                          {eq.notes && <div className="text-xs text-muted-foreground mt-1">{cite(eq.notes)}</div>}
                        </div>
                      ))}
                    </div>
                  </Section>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Section title="Assumptions" icon={<BookOpen className="w-4 h-4 text-earth-green" />}>
                      <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
                        {theory.assumptions.map((a, i) => <li key={i}>{cite(a)}</li>)}
                      </ul>
                    </Section>
                    <Section title="Limitations" icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}>
                      <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
                        {theory.limitations.map((l, i) => <li key={i}>{cite(l)}</li>)}
                      </ul>
                    </Section>
                  </div>

                  <Section title="Recommended Parameter Ranges" icon={<Sliders className="w-4 h-4 text-primary" />}>
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-sm">
                        <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
                          <tr>
                            <th className="text-left px-3 py-2">Symbol</th>
                            <th className="text-left px-3 py-2">Parameter</th>
                            <th className="text-left px-3 py-2">Typical range</th>
                            <th className="text-left px-3 py-2">Units</th>
                            <th className="text-left px-3 py-2">Note</th>
                          </tr>
                        </thead>
                        <tbody>
                          {theory.parameters.map((p, i) => (
                            <tr key={i} className="border-t border-border/60">
                              <td className="px-3 py-2 font-mono text-foreground">{p.symbol}</td>
                              <td className="px-3 py-2">{p.name}</td>
                              <td className="px-3 py-2 font-mono">{p.range}</td>
                              <td className="px-3 py-2 text-muted-foreground">{p.units ?? "—"}</td>
                              <td className="px-3 py-2 text-muted-foreground">{p.note ? cite(p.note) : ""}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Section>

                  {theory.examples && theory.examples.length > 0 && (
                    <Section title="Worked Examples" icon={<FlaskConical className="w-4 h-4 text-primary" />}>
                      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {theory.examples.map((ex, i) => (
                          <div key={i} className="rounded-lg border border-border bg-card/60 p-3 space-y-2">
                            <div className="font-semibold text-sm text-foreground">{ex.title}</div>
                            {ex.description && (
                              <div className="text-xs text-muted-foreground">{cite(ex.description)}</div>
                            )}
                            <div>
                              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Inputs</div>
                              <ul className="text-xs space-y-0.5">
                                {ex.inputs.map((f, j) => (
                                  <li key={j} className="flex justify-between gap-2 font-mono">
                                    <span className="text-muted-foreground">{f.label}</span>
                                    <span className="text-foreground">{f.value}{f.units ? ` ${f.units}` : ""}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Outputs</div>
                              <ul className="text-xs space-y-0.5">
                                {ex.outputs.map((f, j) => (
                                  <li key={j} className="flex justify-between gap-2 font-mono">
                                    <span className="text-muted-foreground">{f.label}</span>
                                    <span className="text-primary font-semibold">{f.value}{f.units ? ` ${f.units}` : ""}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            {ex.notes && <div className="text-xs text-muted-foreground italic">{cite(ex.notes)}</div>}
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  <Section title="Bibliography" icon={<ExternalLink className="w-4 h-4 text-primary" />}>
                    <ol className="text-sm space-y-1.5 list-none pl-0">
                      {theory.references.map((r, i) => {
                        const n = i + 1;
                        return (
                          <li key={i} id={`ref-${slug}-${n}`} className="text-muted-foreground flex gap-2 scroll-mt-20">
                            <span className="font-mono text-primary shrink-0">[{n}]</span>
                            <span>
                              {r.url ? (
                                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                                  {r.citation}<ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                r.citation
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                    <p className="text-xs text-muted-foreground mt-3 italic">
                      Educational tool. Verify all assumptions and parameters against local design manuals and regulatory criteria before professional use.
                    </p>
                  </Section>
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
};

export default TheoryPanel;
