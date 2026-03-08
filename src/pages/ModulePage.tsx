import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import CNCalculator from "@/components/CNCalculator";
import GroundwaterSimulator from "@/components/GroundwaterSimulator";
import MuskingumSimulator from "@/components/MuskingumSimulator";
import StableChannelWizard from "@/components/StableChannelWizard";
import AlbedoWaterBalance from "@/components/AlbedoWaterBalance";
import HydroEcologicalTracker from "@/components/HydroEcologicalTracker";
import SaintVenantVisualizer from "@/components/SaintVenantVisualizer";
import Documentation from "@/components/Documentation";
import ManningRatingCurve from "@/components/ManningRatingCurve";
import SpecificEnergyMomentum from "@/components/SpecificEnergyMomentum";
import GVFProfileClassifier from "@/components/GVFProfileClassifier";
import WavePropagationLab from "@/components/WavePropagationLab";
import UnitHydrographBuilder from "@/components/UnitHydrographBuilder";
import RationalMethodCalculator from "@/components/RationalMethodCalculator";
import LanesBalance from "@/components/LanesBalance";
import CatchmentWaterBalance from "@/components/CatchmentWaterBalance";
import TheisWellCalculator from "@/components/TheisWellCalculator";
import VedernikovRollWave from "@/components/VedernikovRollWave";
import BaseflowRecession from "@/components/BaseflowRecession";
import FloodFrequencyAnalysis from "@/components/FloodFrequencyAnalysis";
import SpillwayDesigner from "@/components/SpillwayDesigner";
import SedimentTransportCalculator from "@/components/SedimentTransportCalculator";
import FormFrictionDecomposer from "@/components/FormFrictionDecomposer";
import ETCalculatorSuite from "@/components/ETCalculatorSuite";
import EnvironmentalFlowCalculator from "@/components/EnvironmentalFlowCalculator";
import FroudeNumberExplorer from "@/components/FroudeNumberExplorer";
import CulvertAnalyzer from "@/components/CulvertAnalyzer";

const moduleComponents: Record<string, React.ComponentType<{ onClose: () => void }>> = {
  "cn-calculator": CNCalculator,
  "groundwater": GroundwaterSimulator,
  "muskingum-routing": MuskingumSimulator,
  "channel-design": StableChannelWizard,
  "albedo": AlbedoWaterBalance,
  "hydroecology": HydroEcologicalTracker,
  "saint-venant": SaintVenantVisualizer,
  "documentation": Documentation,
  "manning-rating": ManningRatingCurve,
  "specific-energy": SpecificEnergyMomentum,
  "gvf-profiles": GVFProfileClassifier,
  "wave-propagation": WavePropagationLab,
  "unit-hydrograph": UnitHydrographBuilder,
  "rational-method": RationalMethodCalculator,
  "lanes-balance": LanesBalance,
  "catchment-water-balance": CatchmentWaterBalance,
  "theis-well": TheisWellCalculator,
  "vedernikov": VedernikovRollWave,
  "baseflow-recession": BaseflowRecession,
  "flood-frequency": FloodFrequencyAnalysis,
  "spillway-design": SpillwayDesigner,
  "sediment-transport": SedimentTransportCalculator,
  "form-friction": FormFrictionDecomposer,
  "et-calculator": ETCalculatorSuite,
  "environmental-flow": EnvironmentalFlowCalculator,
  "froude-explorer": FroudeNumberExplorer,
  "culvert-hydraulics": CulvertAnalyzer,
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
