import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { generatePumpCurve, applyAffinityLaws, computeSpecificSpeed, classifyPumpType } from "@/lib/hydrology/swmm";

export default function PumpCurves() {
  const [Qrated, setQrated] = useState(0.1);
  const [Hrated, setHrated] = useState(30);
  const [Hshutoff, setHshutoff] = useState(40);
  const [N, setN] = useState(1750);
  const [N2, setN2] = useState(1500);

  const pumpCurve = useMemo(() => generatePumpCurve(Qrated, Hrated, Hshutoff), [Qrated, Hrated, Hshutoff]);
  const affinityCurve = useMemo(() => applyAffinityLaws(pumpCurve, N, N2), [pumpCurve, N, N2]);
  const Ns = computeSpecificSpeed(N, Qrated, Hrated);
  const maxQ = Qrated * 1.5;
  const maxH = Hshutoff * 1.2;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="card-water">
        <CardHeader><CardTitle className="text-lg">Pump Characteristic Curves</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Rated Discharge Q: <strong>{(Qrated * 1000).toFixed(0)} L/s</strong></label>
            <Slider min={0.01} max={0.5} step={0.01} value={[Qrated]} onValueChange={([v]) => setQrated(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Rated Head H: <strong>{Hrated} m</strong></label>
            <Slider min={5} max={80} step={1} value={[Hrated]} onValueChange={([v]) => setHrated(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Shutoff Head H₀: <strong>{Hshutoff} m</strong></label>
            <Slider min={Hrated * 1.05} max={Hrated * 2} step={1} value={[Hshutoff]} onValueChange={([v]) => setHshutoff(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Speed N₁: <strong>{N} RPM</strong></label>
            <Slider min={500} max={3600} step={50} value={[N]} onValueChange={([v]) => setN(v)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Affinity Speed N₂: <strong>{N2} RPM</strong></label>
            <Slider min={500} max={3600} step={50} value={[N2]} onValueChange={([v]) => setN2(v)} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-secondary/30 rounded-lg p-2">
              <span className="text-xs text-muted-foreground block">Specific Speed Ns</span>
              <span className="font-bold">{Ns.toFixed(0)}</span>
            </div>
            <div className="bg-secondary/30 rounded-lg p-2">
              <span className="text-xs text-muted-foreground block">Pump Type</span>
              <span className="font-bold text-xs">{classifyPumpType(Ns)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-water">
        <CardHeader><CardTitle className="text-lg">H-Q Curve & Affinity Laws</CardTitle></CardHeader>
        <CardContent>
          <svg viewBox="0 0 500 350" className="w-full">
            <line x1="60" y1="20" x2="60" y2="280" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
            <line x1="60" y1="280" x2="480" y2="280" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
            <text x="30" y="150" textAnchor="middle" fontSize="10" fill="hsl(var(--foreground))"
              transform="rotate(-90, 30, 150)">Head (m)</text>
            <text x="270" y="300" textAnchor="middle" fontSize="10" fill="hsl(var(--foreground))">Discharge (L/s)</text>

            {[0.25, 0.5, 0.75, 1.0].map(f => (
              <line key={f} x1="60" y1={280 - f * 250} x2="480" y2={280 - f * 250}
                stroke="hsl(var(--border))" strokeWidth="0.5" />
            ))}

            <polyline
              points={pumpCurve.map(p => `${60 + (p.Q / maxQ) * 410},${280 - (p.H / maxH) * 250}`).join(" ")}
              fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5"
            />
            <text x="350" y={280 - (pumpCurve[10].H / maxH) * 250 - 8}
              fontSize="9" fill="hsl(var(--primary))" fontWeight="bold">N₁ = {N} RPM</text>

            <polyline
              points={affinityCurve.map(p => `${60 + (p.Q / maxQ) * 410},${280 - (p.H / maxH) * 250}`).join(" ")}
              fill="none" stroke="hsl(var(--accent))" strokeWidth="2" strokeDasharray="6 3"
            />
            <text x="250" y={280 - (affinityCurve[10].H / maxH) * 250 - 8}
              fontSize="9" fill="hsl(var(--accent))" fontWeight="bold">N₂ = {N2} RPM</text>

            <polyline
              points={pumpCurve.map(p => `${60 + (p.Q / maxQ) * 410},${280 - p.eff * 250}`).join(" ")}
              fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" strokeDasharray="3 2"
            />
            <text x="460" y="25" textAnchor="end" fontSize="9" fill="hsl(var(--muted-foreground))">η (%)</text>

            {(() => {
              const bep = pumpCurve.reduce((best, p) => p.eff > best.eff ? p : best, pumpCurve[0]);
              const x = 60 + (bep.Q / maxQ) * 410;
              const y = 280 - (bep.H / maxH) * 250;
              return (
                <>
                  <circle cx={x} cy={y} r="5" fill="hsl(var(--primary))" />
                  <text x={x + 8} y={y - 5} fontSize="9" fill="hsl(var(--primary))">
                    BEP η={Math.round(bep.eff * 100)}%
                  </text>
                </>
              );
            })()}

            {[0, 0.25, 0.5, 0.75, 1.0].map(f => (
              <text key={f} x="55" y={283 - f * 250} textAnchor="end" fontSize="8" fill="hsl(var(--muted-foreground))">
                {(f * maxH).toFixed(0)}
              </text>
            ))}
            {[0, 0.25, 0.5, 0.75, 1.0].map(f => (
              <text key={f} x={60 + f * 410} y="295" textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">
                {(f * maxQ * 1000).toFixed(0)}
              </text>
            ))}

            <rect x="310" y="310" width="170" height="35" fill="hsl(var(--secondary))" rx="4" opacity="0.5" />
            <text x="395" y="325" textAnchor="middle" fontSize="8" fill="hsl(var(--foreground))">
              Q₂/Q₁ = N₂/N₁ = {(N2/N).toFixed(2)}
            </text>
            <text x="395" y="340" textAnchor="middle" fontSize="8" fill="hsl(var(--foreground))">
              H₂/H₁ = (N₂/N₁)² = {(N2*N2/(N*N)).toFixed(2)}
            </text>
          </svg>
        </CardContent>
      </Card>
    </div>
  );
}
