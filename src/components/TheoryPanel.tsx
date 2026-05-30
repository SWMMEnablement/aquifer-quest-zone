import { BookOpen, AlertTriangle, Sigma, Sliders, ExternalLink, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { getTheory } from "@/lib/hydrology/theory";

interface Props {
  /** Module slug matching the ModulePage route (e.g. "cn-calculator"). */
  slug: string;
  /** Optional CSS max-width container override. */
  className?: string;
  /** Start collapsed (default) or open. */
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

/**
 * Structured Theory & Assumptions panel.
 * Renders equations, assumptions, limitations, recommended parameter ranges,
 * and authoritative references for the given module slug. Falls back to a
 * minimal placeholder when no entry exists yet, so every module always has
 * a docs hook.
 */
const TheoryPanel = ({ slug, className = "container mx-auto px-4 pb-10 max-w-7xl", defaultOpen = false }: Props) => {
  const theory = getTheory(slug);

  return (
    <div className={className}>
      <Card className="card-water border-primary/20">
        <Collapsible defaultOpen={defaultOpen}>
          <CollapsibleTrigger className="w-full text-left" aria-label="Toggle theory and assumptions">
            <CardHeader className="flex flex-row items-center justify-between gap-3 cursor-pointer hover:bg-secondary/30 transition-colors rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="w-5 h-5 text-primary" />
                Theory &amp; Assumptions
                {theory ? (
                  <Badge variant="secondary" className="ml-2 text-xs font-normal">{theory.title}</Badge>
                ) : (
                  <Badge variant="outline" className="ml-2 text-xs font-normal">Reference pending</Badge>
                )}
              </CardTitle>
              <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-6 pt-2">
              {!theory && (
                <p className="text-sm text-muted-foreground">
                  A structured theory note for this module is being prepared. In the meantime,
                  consult the linked Ponce reference inside the module and the global Documentation tab.
                </p>
              )}

              {theory && (
                <>
                  <p className="text-sm text-muted-foreground leading-relaxed">{theory.summary}</p>

                  <Section title="Governing Equations" icon={<Sigma className="w-4 h-4 text-primary" />}>
                    <div className="space-y-3 bg-secondary/40 rounded-lg p-4">
                      {theory.equations.map((eq, i) => (
                        <div key={i} className="border-l-2 border-primary/40 pl-3">
                          <div className="text-xs uppercase tracking-wide text-muted-foreground">{eq.label}</div>
                          <div className="font-mono text-sm text-foreground mt-0.5">{eq.formula}</div>
                          {eq.notes && <div className="text-xs text-muted-foreground mt-1">{eq.notes}</div>}
                        </div>
                      ))}
                    </div>
                  </Section>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Section title="Assumptions" icon={<BookOpen className="w-4 h-4 text-earth-green" />}>
                      <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
                        {theory.assumptions.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </Section>
                    <Section title="Limitations" icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}>
                      <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
                        {theory.limitations.map((l, i) => <li key={i}>{l}</li>)}
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
                              <td className="px-3 py-2 text-muted-foreground">{p.note ?? ""}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Section>

                  <Section title="References" icon={<ExternalLink className="w-4 h-4 text-primary" />}>
                    <ul className="text-sm space-y-1.5">
                      {theory.references.map((r, i) => (
                        <li key={i} className="text-muted-foreground">
                          {r.url ? (
                            <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                              {r.citation}<ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            r.citation
                          )}
                        </li>
                      ))}
                    </ul>
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
