import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { designTractiveForce, BED_MATERIALS_MAP, BANK_MATERIALS_MAP } from "@/lib/hydrology/stable-channel";

interface TractiveForceWizardProps {
  onClose: () => void;
}

const BED_MATERIALS = BED_MATERIALS_MAP;
const BANK_MATERIALS = BANK_MATERIALS_MAP;

const TractiveForceWizard = ({ onClose }: TractiveForceWizardProps) => {
  const [step, setStep] = useState(1);
  const [bedMat, setBedMat] = useState("medium-sand");
  const [bankMat, setBankMat] = useState("cohesive-clay");
  const [Q, setQ] = useState([25]);
  const [slope, setSlope] = useState([0.001]);
  const [sideSlope, setSideSlope] = useState([2]);
  const [freeboard, setFreeboard] = useState([0.5]);

  const bed = BED_MATERIALS[bedMat];
  const bank = BANK_MATERIALS[bankMat];

  const design = useMemo(() =>
    designTractiveForce(Q[0], slope[0], sideSlope[0], freeboard[0], bed, bank),
    [bedMat, bankMat, Q, slope, sideSlope, freeboard, bed, bank]);

  const safetyIcon = (fs: number) => {
    if (fs >= 1.5) return <CheckCircle className="w-5 h-5 text-earth-green" />;
    if (fs >= 1.0) return <AlertTriangle className="w-5 h-5 text-earth-sand" />;
    return <XCircle className="w-5 h-5 text-destructive" />;
  };

  const safetyLabel = (fs: number) => {
    if (fs >= 1.5) return "Safe";
    if (fs >= 1.0) return "Marginal";
    return "Unstable";
  };

  // SVG cross-section
  const svgW = 400;
  const svgH = 200;
  const scale = Math.min(svgW / (design.b + 2 * sideSlope[0] * design.totalDepth + 4), svgH / (design.totalDepth + 1)) * 0.7;
  const cx = svgW / 2;
  const baseY = svgH - 30;
  const bPx = design.b * scale;
  const dPx = design.d * scale;
  const fbPx = freeboard[0] * scale;
  const zRun = sideSlope[0] * design.totalDepth * scale;

  return (
    <div className="min-h-screen bg-background py-8 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={onClose}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Tractive Force Design Wizard</h1>
            <p className="text-muted-foreground mt-1">Step-by-step stable channel design using permissible shear stress</p>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setStep(s)}
              className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold transition-all ${step === s ? 'bg-primary text-primary-foreground scale-110' : step > s ? 'bg-primary/30 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {s}
            </button>
          ))}
          <div className="ml-4 text-sm font-medium text-foreground">
            {step === 1 && "Material Selection"}
            {step === 2 && "Determine Max Depth"}
            {step === 3 && "Compute Bottom Width"}
            {step === 4 && "Verify Stability"}
            {step === 5 && "Add Freeboard & Finalize"}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <Card className="p-6 shadow-card">
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="font-semibold text-lg text-foreground">Step 1: Select Materials</h2>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Bed Material</label>
                  <Select value={bedMat} onValueChange={setBedMat}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(BED_MATERIALS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.name} — τc = {v.tau_c} Pa</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Bank Material</label>
                  <Select value={bankMat} onValueChange={setBankMat}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(BANK_MATERIALS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.name} — τc = {v.tau_c} Pa</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Design Discharge Q: <span className="text-primary font-bold">{Q[0]} m³/s</span></label>
                  <Slider value={Q} onValueChange={setQ} min={1} max={500} step={1} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Channel Slope S: <span className="text-primary font-bold">{slope[0].toFixed(4)}</span></label>
                  <Slider value={slope} onValueChange={setSlope} min={0.0001} max={0.01} step={0.0001} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Side Slope z:1 (H:V): <span className="text-primary font-bold">{sideSlope[0]}:1</span></label>
                  <Slider value={sideSlope} onValueChange={setSideSlope} min={1} max={4} step={0.5} />
                </div>
                <Button onClick={() => setStep(2)} className="w-full">Next: Determine Max Depth →</Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="font-semibold text-lg text-foreground">Step 2: Maximum Stable Depth</h2>
                <div className="p-4 bg-muted rounded-xl space-y-3">
                  <p className="text-sm text-muted-foreground">Bank shear reduction factor K = {design.K.toFixed(3)}</p>
                  <p className="text-sm text-muted-foreground">Effective bank τc = {design.tauBankEffective.toFixed(2)} Pa</p>
                  <p className="text-sm text-muted-foreground">Max depth (bank) = τc,bank / (0.75γS) = <span className="text-primary font-bold">{design.dMax.toFixed(2)} m</span></p>
                  <p className="text-sm text-muted-foreground">Max depth (bed) = τc,bed / (γS) = <span className="text-primary font-bold">{design.dMaxBed.toFixed(2)} m</span></p>
                  <p className="text-foreground font-semibold">Design depth = min({design.dMax.toFixed(2)}, {design.dMaxBed.toFixed(2)}) = {design.d.toFixed(2)} m</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">← Back</Button>
                  <Button onClick={() => setStep(3)} className="flex-1">Next →</Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="font-semibold text-lg text-foreground">Step 3: Bottom Width</h2>
                <div className="p-4 bg-muted rounded-xl space-y-3">
                  <p className="text-sm text-muted-foreground">Solving Manning's equation for b with d = {design.d.toFixed(2)} m</p>
                  <p className="text-foreground font-semibold">Bottom width b = {design.b.toFixed(2)} m</p>
                  <p className="text-sm text-muted-foreground">Flow area A = {design.A.toFixed(2)} m²</p>
                  <p className="text-sm text-muted-foreground">Velocity V = {design.V.toFixed(2)} m/s</p>
                  <p className="text-sm text-muted-foreground">Froude number Fr = {design.Fr.toFixed(3)}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">← Back</Button>
                  <Button onClick={() => setStep(4)} className="flex-1">Next →</Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <h2 className="font-semibold text-lg text-foreground">Step 4: Stability Verification</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-xl">
                    {safetyIcon(design.fsBed)}
                    <div>
                      <p className="text-sm font-medium text-foreground">Bed Shear: {design.tauActualBed.toFixed(2)} Pa vs {design.tauBed.toFixed(2)} Pa permissible</p>
                      <p className="text-sm text-muted-foreground">Factor of Safety = {design.fsBed.toFixed(2)} — {safetyLabel(design.fsBed)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-xl">
                    {safetyIcon(design.fsBank)}
                    <div>
                      <p className="text-sm font-medium text-foreground">Bank Shear: {design.tauActualBank.toFixed(2)} Pa vs {design.tauBankEffective.toFixed(2)} Pa permissible</p>
                      <p className="text-sm text-muted-foreground">Factor of Safety = {design.fsBank.toFixed(2)} — {safetyLabel(design.fsBank)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-xl">
                    {safetyIcon(design.Fr < 0.8 ? 2 : design.Fr < 1 ? 1.2 : 0.5)}
                    <div>
                      <p className="text-sm font-medium text-foreground">Froude Number = {design.Fr.toFixed(3)}</p>
                      <p className="text-sm text-muted-foreground">{design.Fr < 0.8 ? "Subcritical — stable" : design.Fr < 1 ? "Near critical — caution" : "Supercritical — unstable"}</p>
                    </div>
                  </div>
                </div>

                {/* Shear distribution bar */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Shear Stress Distribution</p>
                  <div className="relative h-8 rounded-full overflow-hidden bg-muted">
                    <div className="absolute inset-y-0 left-0 bg-earth-green/50 transition-all" style={{ width: `${Math.min((design.tauActualBank / design.tauBankEffective) * 30, 30)}%` }} />
                    <div className="absolute inset-y-0 bg-primary/50 transition-all" style={{ left: '30%', width: '40%' }} />
                    <div className="absolute inset-y-0 right-0 bg-earth-green/50 transition-all" style={{ width: `${Math.min((design.tauActualBank / design.tauBankEffective) * 30, 30)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Left Bank (0.75γdS)</span>
                    <span>Bed (γdS)</span>
                    <span>Right Bank (0.75γdS)</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1">← Back</Button>
                  <Button onClick={() => setStep(5)} className="flex-1">Next →</Button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <h2 className="font-semibold text-lg text-foreground">Step 5: Freeboard & Final Design</h2>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Freeboard: <span className="text-primary font-bold">{freeboard[0].toFixed(1)} m</span></label>
                  <Slider value={freeboard} onValueChange={setFreeboard} min={0.2} max={2.0} step={0.1} />
                </div>
                <div className="p-4 bg-primary/10 rounded-xl space-y-2">
                  <p className="text-foreground font-bold text-lg">Final Design Summary</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Bottom width:</span><span className="text-foreground font-medium">{design.b.toFixed(2)} m</span>
                    <span className="text-muted-foreground">Flow depth:</span><span className="text-foreground font-medium">{design.d.toFixed(2)} m</span>
                    <span className="text-muted-foreground">Total depth:</span><span className="text-foreground font-medium">{design.totalDepth.toFixed(2)} m</span>
                    <span className="text-muted-foreground">Side slope:</span><span className="text-foreground font-medium">{sideSlope[0]}:1 (H:V)</span>
                    <span className="text-muted-foreground">Top width:</span><span className="text-foreground font-medium">{design.T.toFixed(2)} m</span>
                    <span className="text-muted-foreground">Velocity:</span><span className="text-foreground font-medium">{design.V.toFixed(2)} m/s</span>
                    <span className="text-muted-foreground">Discharge:</span><span className="text-foreground font-medium">{Q[0]} m³/s</span>
                    <span className="text-muted-foreground">Manning's n:</span><span className="text-foreground font-medium">{bed.n}</span>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setStep(1)} className="w-full">← Start Over</Button>
              </div>
            )}
          </Card>

          {/* Cross-section SVG */}
          <Card className="p-6 shadow-card">
            <h2 className="font-semibold text-lg text-foreground mb-4">Channel Cross-Section</h2>
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
              {/* Channel outline */}
              <polygon
                points={`
                  ${cx - bPx / 2 - zRun},${baseY - (design.totalDepth * scale)}
                  ${cx - bPx / 2},${baseY}
                  ${cx + bPx / 2},${baseY}
                  ${cx + bPx / 2 + zRun},${baseY - (design.totalDepth * scale)}
                `}
                fill="none" stroke="hsl(var(--foreground))" strokeWidth="2"
              />
              {/* Water fill */}
              <polygon
                points={`
                  ${cx - bPx / 2 - sideSlope[0] * dPx},${baseY - dPx}
                  ${cx - bPx / 2},${baseY}
                  ${cx + bPx / 2},${baseY}
                  ${cx + bPx / 2 + sideSlope[0] * dPx},${baseY - dPx}
                `}
                fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth="1.5"
              />
              {/* Water surface label */}
              <line x1={cx - bPx / 2 - sideSlope[0] * dPx - 10} y1={baseY - dPx} x2={cx + bPx / 2 + sideSlope[0] * dPx + 10} y2={baseY - dPx} stroke="hsl(var(--primary))" strokeDasharray="4 2" strokeWidth="1" />
              {/* Freeboard zone */}
              {fbPx > 0 && (
                <rect x={cx - bPx / 2 - zRun} y={baseY - dPx - fbPx} width={bPx + 2 * zRun} height={fbPx} fill="hsl(var(--muted) / 0.3)" stroke="none" />
              )}
              {/* Dimension labels */}
              <text x={cx} y={baseY + 18} textAnchor="middle" className="text-xs fill-muted-foreground">b = {design.b.toFixed(1)} m</text>
              <text x={cx + bPx / 2 + zRun + 8} y={baseY - dPx / 2} textAnchor="start" className="text-xs fill-primary">d = {design.d.toFixed(2)} m</text>
              {fbPx > 5 && <text x={cx + bPx / 2 + zRun + 8} y={baseY - dPx - fbPx / 2} textAnchor="start" className="text-xs fill-muted-foreground">fb = {freeboard[0].toFixed(1)} m</text>}
              {/* Bed material label */}
              <text x={cx} y={baseY - 5} textAnchor="middle" className="text-[9px] fill-muted-foreground">{bed.name}</text>
              {/* Bank material label */}
              <text x={cx - bPx / 2 - zRun / 2} y={baseY - dPx / 2 - 8} textAnchor="middle" className="text-[9px] fill-muted-foreground" transform={`rotate(-${Math.atan(1 / sideSlope[0]) * 180 / Math.PI}, ${cx - bPx / 2 - zRun / 2}, ${baseY - dPx / 2 - 8})`}>{bank.name}</text>
            </svg>

            {/* Shear stress visualization */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-foreground mb-3">Shear Stress Check</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Bed: τ = {design.tauActualBed.toFixed(1)} Pa</span>
                    <span className="text-muted-foreground">τc = {design.tauBed.toFixed(1)} Pa</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${design.fsBed >= 1.5 ? 'bg-earth-green' : design.fsBed >= 1 ? 'bg-earth-sand' : 'bg-destructive'}`} style={{ width: `${Math.min((design.tauActualBed / design.tauBed) * 100, 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Bank: τ = {design.tauActualBank.toFixed(1)} Pa</span>
                    <span className="text-muted-foreground">τc = {design.tauBankEffective.toFixed(1)} Pa</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${design.fsBank >= 1.5 ? 'bg-earth-green' : design.fsBank >= 1 ? 'bg-earth-sand' : 'bg-destructive'}`} style={{ width: `${Math.min((design.tauActualBank / design.tauBankEffective) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Based on USBR tractive force method — Prof. Victor Miguel Ponce, SDSU
                <br /><a href="https://ponce.sdsu.edu/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ponce.sdsu.edu</a>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TractiveForceWizard;
