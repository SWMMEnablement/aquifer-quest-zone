import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StableChannelResult } from "@/lib/hydrology/stable-channel";

interface Props {
  calculations: StableChannelResult;
}

const getStabilityColor = (status: string) => {
  switch (status) {
    case "stable": return "text-green-500";
    case "marginal": return "text-yellow-500";
    case "unstable": return "text-red-500";
    default: return "text-muted-foreground";
  }
};

const getStabilityBadge = (status: string) => {
  switch (status) {
    case "stable": return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Stable</Badge>;
    case "marginal": return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Marginal</Badge>;
    case "unstable": return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Unstable</Badge>;
    default: return null;
  }
};

export default function StabilityAnalysis({ calculations }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          Stability Analysis
          {getStabilityBadge(calculations.stabilityStatus)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center py-2 border-b border-border/50">
          <span className="text-sm text-muted-foreground">Bed Shear Stress (τ₀)</span>
          <span className="font-mono">{calculations.shearStress.toFixed(2)} Pa</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-border/50">
          <span className="text-sm text-muted-foreground">Critical Shear (τc)</span>
          <span className="font-mono">{calculations.criticalShearStress.toFixed(2)} Pa</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-border/50">
          <span className="text-sm text-muted-foreground">Stability Ratio (τc/τ₀)</span>
          <span className={`font-mono font-bold ${getStabilityColor(calculations.stabilityStatus)}`}>
            {calculations.stabilityRatio.toFixed(2)}
          </span>
        </div>

        <div className={`p-4 rounded-lg ${
          calculations.stabilityStatus === 'stable' ? 'bg-green-500/10 border border-green-500/20' :
          calculations.stabilityStatus === 'marginal' ? 'bg-yellow-500/10 border border-yellow-500/20' :
          'bg-red-500/10 border border-red-500/20'
        }`}>
          <p className={`text-sm font-medium ${getStabilityColor(calculations.stabilityStatus)}`}>
            {calculations.stabilityStatus === 'stable' && 'Channel is stable. Bed material will not erode under design flow.'}
            {calculations.stabilityStatus === 'marginal' && 'Channel stability is marginal. Consider increasing sediment size or reducing slope.'}
            {calculations.stabilityStatus === 'unstable' && 'Channel will erode! Increase sediment size, add protection, or reduce slope.'}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Unstable</span>
            <span>Marginal</span>
            <span>Stable</span>
          </div>
          <div className="h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 relative">
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-foreground rounded-full shadow-lg transition-all"
              style={{
                left: `${Math.min(100, Math.max(0, (calculations.stabilityRatio / 2) * 100))}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
