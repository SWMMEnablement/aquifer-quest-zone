import { lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import TheoryPanel from "@/components/TheoryPanel";

const moduleComponents: Record<string, React.LazyExoticComponent<React.ComponentType<{ onClose: () => void }>>> = {
  "cn-calculator": lazy(() => import("@/components/CNCalculator")),
  "groundwater": lazy(() => import("@/components/GroundwaterSimulator")),
  "muskingum-routing": lazy(() => import("@/components/MuskingumSimulator")),
  "channel-design": lazy(() => import("@/components/StableChannelWizard")),
  "albedo": lazy(() => import("@/components/AlbedoWaterBalance")),
  "hydroecology": lazy(() => import("@/components/HydroEcologicalTracker")),
  "saint-venant": lazy(() => import("@/components/SaintVenantVisualizer")),
  "documentation": lazy(() => import("@/components/Documentation")),
  "manning-rating": lazy(() => import("@/components/ManningRatingCurve")),
  "specific-energy": lazy(() => import("@/components/SpecificEnergyMomentum")),
  "gvf-profiles": lazy(() => import("@/components/GVFProfileClassifier")),
  "wave-propagation": lazy(() => import("@/components/WavePropagationLab")),
  "unit-hydrograph": lazy(() => import("@/components/UnitHydrographBuilder")),
  "rational-method": lazy(() => import("@/components/RationalMethodCalculator")),
  "lanes-balance": lazy(() => import("@/components/LanesBalance")),
  "catchment-water-balance": lazy(() => import("@/components/CatchmentWaterBalance")),
  "theis-well": lazy(() => import("@/components/TheisWellCalculator")),
  "vedernikov": lazy(() => import("@/components/VedernikovRollWave")),
  "baseflow-recession": lazy(() => import("@/components/BaseflowRecession")),
  "flood-frequency": lazy(() => import("@/components/FloodFrequencyAnalysis")),
  "spillway-design": lazy(() => import("@/components/SpillwayDesigner")),
  "sediment-transport": lazy(() => import("@/components/SedimentTransportCalculator")),
  "form-friction": lazy(() => import("@/components/FormFrictionDecomposer")),
  "et-calculator": lazy(() => import("@/components/ETCalculatorSuite")),
  "environmental-flow": lazy(() => import("@/components/EnvironmentalFlowCalculator")),
  "froude-explorer": lazy(() => import("@/components/FroudeNumberExplorer")),
  "culvert-hydraulics": lazy(() => import("@/components/CulvertAnalyzer")),
  "tractive-force": lazy(() => import("@/components/TractiveForceWizard")),
  "stilling-basin": lazy(() => import("@/components/StillingBasinDesigner")),
  "channel-classification": lazy(() => import("@/components/ChannelClassification")),
  "gw-recharge": lazy(() => import("@/components/GWRechargeCalculator")),
  "calculator-hub": lazy(() => import("@/components/CalculatorHub")),
  "workflow-builder": lazy(() => import("@/components/WorkflowBuilder")),
  "nutshells-graph": lazy(() => import("@/components/NutshellsGraph")),
  "video-lectures": lazy(() => import("@/components/VideoLectureCompanion")),
  "swmm-calculator": lazy(() => import("@/components/SWMMCalculator")),
  
};

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center space-y-4">
      <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
      <p className="text-muted-foreground text-sm">Loading module…</p>
    </div>
  </div>
);

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
        <Suspense fallback={<LoadingFallback />}>
          <ModuleComponent onClose={handleClose} />
          {moduleId && moduleId !== "documentation" && moduleId !== "calculator-hub" && (
            <TheoryPanel slug={moduleId} />
          )}
        </Suspense>
      </div>
    </div>
  );
};

export default ModulePage;
