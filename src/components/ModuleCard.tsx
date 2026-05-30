import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ModuleKind = "Calculator" | "Simulator" | "Visualization" | "Builder" | "Game";

function inferKind(title: string): ModuleKind {
  const t = title.toLowerCase();
  if (t.includes("game") || t.includes("yield simulator")) return "Game";
  if (t.includes("simulator")) return "Simulator";
  if (t.includes("explorer") || t.includes("visualizer") || t.includes("lab") || t.includes("classifier") || t.includes("tracker") || t.includes("graph") || t.includes("companion")) return "Visualization";
  if (t.includes("builder") || t.includes("wizard") || t.includes("designer")) return "Builder";
  return "Calculator";
}

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: "blue" | "teal" | "green" | "amber";
  status: "available" | "coming-soon";
  onClick?: () => void;
  delay?: number;
}

const colorStyles = {
  blue: {
    bg: "bg-gradient-to-br from-primary/10 to-water-light/10",
    icon: "text-primary",
    border: "border-primary/20 hover:border-primary/40",
    glow: "group-hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)]",
  },
  teal: {
    bg: "bg-gradient-to-br from-accent/10 to-water-medium/10",
    icon: "text-accent",
    border: "border-accent/20 hover:border-accent/40",
    glow: "group-hover:shadow-[0_0_30px_-5px_hsl(var(--accent)/0.3)]",
  },
  green: {
    bg: "bg-gradient-to-br from-earth-green/10 to-accent/10",
    icon: "text-earth-green",
    border: "border-earth-green/20 hover:border-earth-green/40",
    glow: "group-hover:shadow-[0_0_30px_-5px_hsl(140_45%_40%/0.3)]",
  },
  amber: {
    bg: "bg-gradient-to-br from-earth-sand/30 to-earth-brown/10",
    icon: "text-earth-brown",
    border: "border-earth-brown/20 hover:border-earth-brown/40",
    glow: "group-hover:shadow-[0_0_30px_-5px_hsl(30_40%_35%/0.3)]",
  },
};

const ModuleCard = ({
  title,
  description,
  icon: Icon,
  color,
  status,
  onClick,
  delay = 0,
}: ModuleCardProps) => {
  const styles = colorStyles[color];
  const isAvailable = status === "available";

  return (
    <div
      className={cn(
        "group relative p-6 rounded-2xl border-2 bg-card transition-all duration-500 cursor-pointer animate-fade-in",
        styles.border,
        styles.glow,
        isAvailable
          ? "hover:-translate-y-2 hover:shadow-elevated"
          : "opacity-70 cursor-not-allowed"
      )}
      style={{ animationDelay: `${delay}s` }}
      onClick={isAvailable ? onClick : undefined}
    >
      {/* Status badge */}
      {!isAvailable && (
        <div className="absolute top-4 right-4 px-2 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">
          Coming Soon
        </div>
      )}

      {/* Icon container */}
      <div
        className={cn(
          "w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110",
          styles.bg
        )}
      >
        <Icon className={cn("w-7 h-7", styles.icon)} />
      </div>

      {/* Content */}
      <h3 className="font-display text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>

      {/* Hover arrow indicator */}
      {isAvailable && (
        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
          <svg
            className={cn("w-5 h-5", styles.icon)}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default ModuleCard;
