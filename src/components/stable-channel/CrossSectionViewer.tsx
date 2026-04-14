import type { StableChannelResult, CrossSectionShape } from "@/lib/hydrology/stable-channel";

interface Props {
  calculations: StableChannelResult;
  shape: CrossSectionShape;
  sideSlope: number;
}

export default function CrossSectionViewer({ calculations, shape, sideSlope }: Props) {
  const svgWidth = 400;
  const svgHeight = 200;
  const padding = 30;
  const waterColor = "hsl(var(--primary))";
  const bankColor = "hsl(var(--muted))";

  const maxWidth = calculations.width * 1.3;
  const maxDepth = calculations.depth * 1.5;
  const scaleX = (svgWidth - 2 * padding) / maxWidth;
  const scaleY = (svgHeight - 2 * padding) / maxDepth;
  const scale = Math.min(scaleX, scaleY);

  const centerX = svgWidth / 2;
  const baseY = svgHeight - padding;
  const w = calculations.width * scale;
  const d = calculations.depth * scale;
  const z = sideSlope;

  let pathD = "";
  let bankPathD = "";

  switch (shape) {
    case "rectangular":
      pathD = `M ${centerX - w/2} ${baseY - d} L ${centerX - w/2} ${baseY} L ${centerX + w/2} ${baseY} L ${centerX + w/2} ${baseY - d} Z`;
      bankPathD = `M ${centerX - w/2 - 20} ${baseY - d - 20} L ${centerX - w/2} ${baseY - d} L ${centerX - w/2} ${baseY} L ${centerX - w/2 - 20} ${baseY} M ${centerX + w/2 + 20} ${baseY - d - 20} L ${centerX + w/2} ${baseY - d} L ${centerX + w/2} ${baseY} L ${centerX + w/2 + 20} ${baseY}`;
      break;
    case "triangular":
      pathD = `M ${centerX} ${baseY} L ${centerX - w/2} ${baseY - d} L ${centerX + w/2} ${baseY - d} Z`;
      bankPathD = `M ${centerX - w/2 - 30} ${baseY - d - 20} L ${centerX - w/2} ${baseY - d} L ${centerX} ${baseY} M ${centerX + w/2 + 30} ${baseY - d - 20} L ${centerX + w/2} ${baseY - d} L ${centerX} ${baseY}`;
      break;
    case "parabolic": {
      const points = [];
      for (let i = -10; i <= 10; i++) {
        const x = (i / 10) * (w / 2);
        const y = d * (1 - Math.pow(i / 10, 2));
        points.push(`${centerX + x},${baseY - y}`);
      }
      pathD = `M ${points[0]} ${points.map(p => `L ${p}`).join(' ')} Z`;
      bankPathD = `M ${centerX - w/2 - 30} ${baseY - 20} Q ${centerX - w/2 - 15} ${baseY - d/2} ${centerX - w/2} ${baseY} M ${centerX + w/2 + 30} ${baseY - 20} Q ${centerX + w/2 + 15} ${baseY - d/2} ${centerX + w/2} ${baseY}`;
      break;
    }
    case "trapezoidal":
    default: {
      const topHalfW = (calculations.width + 2 * z * calculations.depth) * scale / 2;
      pathD = `M ${centerX - w/2} ${baseY} L ${centerX - topHalfW} ${baseY - d} L ${centerX + topHalfW} ${baseY - d} L ${centerX + w/2} ${baseY} Z`;
      bankPathD = `M ${centerX - topHalfW - 30} ${baseY - d - 20} L ${centerX - topHalfW} ${baseY - d} L ${centerX - w/2} ${baseY} L ${centerX - w/2 - 20} ${baseY} M ${centerX + topHalfW + 30} ${baseY - d - 20} L ${centerX + topHalfW} ${baseY - d} L ${centerX + w/2} ${baseY} L ${centerX + w/2 + 20} ${baseY}`;
      break;
    }
  }

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-48">
      <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="hsl(var(--card))" />
      <path d={bankPathD} fill="none" stroke={bankColor} strokeWidth="3" />
      <path d={pathD} fill={waterColor} fillOpacity="0.3" stroke={waterColor} strokeWidth="2" />
      <line x1={centerX - w/2} y1={baseY + 15} x2={centerX + w/2} y2={baseY + 15}
        stroke="hsl(var(--muted-foreground))" strokeWidth="1" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
      <text x={centerX} y={baseY + 28} textAnchor="middle" className="text-xs fill-muted-foreground">
        B = {calculations.width.toFixed(2)}m
      </text>
      <line x1={centerX + w/2 + 25} y1={baseY} x2={centerX + w/2 + 25} y2={baseY - d}
        stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
      <text x={centerX + w/2 + 35} y={baseY - d/2} textAnchor="start" className="text-xs fill-muted-foreground">
        y = {calculations.depth.toFixed(2)}m
      </text>
      <defs>
        <marker id="arrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="hsl(var(--muted-foreground))" />
        </marker>
      </defs>
    </svg>
  );
}
