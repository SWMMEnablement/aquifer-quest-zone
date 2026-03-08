import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import CNCalculator from "@/components/CNCalculator";
import GroundwaterSimulator from "@/components/GroundwaterSimulator";
import MuskingumSimulator from "@/components/MuskingumSimulator";
import StableChannelWizard from "@/components/StableChannelWizard";
import AlbedoWaterBalance from "@/components/AlbedoWaterBalance";
import HydroEcologicalTracker from "@/components/HydroEcologicalTracker";
import Documentation from "@/components/Documentation";

const moduleComponents: Record<string, React.ComponentType<{ onClose: () => void }>> = {
  "cn-calculator": CNCalculator,
  "groundwater": GroundwaterSimulator,
  "muskingum-routing": MuskingumSimulator,
  "channel-design": StableChannelWizard,
  "albedo": AlbedoWaterBalance,
  "hydroecology": HydroEcologicalTracker,
  "documentation": Documentation,
};

const ModulePage = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();

  const ModuleComponent = moduleId ? moduleComponents[moduleId] : null;

  const handleClose = () => navigate("/");
  const openDocs = () => navigate("/modules/documentation");

  if (!ModuleComponent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Module Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested module does not exist.</p>
          <a href="/" className="text-primary underline hover:text-primary/90">Return to Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isCalculatorOpen={true} onOpenDocs={openDocs} />
      <div className="pt-16">
        <ModuleComponent onClose={handleClose} />
      </div>
    </div>
  );
};

export default ModulePage;
