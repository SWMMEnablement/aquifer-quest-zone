import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import GettingStarted from "@/components/GettingStarted";
import ModulesSection from "@/components/ModulesSection";
import CNCalculator from "@/components/CNCalculator";
import GroundwaterSimulator from "@/components/GroundwaterSimulator";
import MuskingumSimulator from "@/components/MuskingumSimulator";
import StableChannelWizard from "@/components/StableChannelWizard";
import AlbedoWaterBalance from "@/components/AlbedoWaterBalance";
import HydroEcologicalTracker from "@/components/HydroEcologicalTracker";
import Documentation from "@/components/Documentation";
import Footer from "@/components/Footer";

type ActiveModule = null | "cn-calculator" | "groundwater" | "muskingum-routing" | "channel-design" | "albedo" | "hydroecology" | "documentation";

const Index = () => {
  const [activeModule, setActiveModule] = useState<ActiveModule>(null);

  const openModule = (moduleId: string) => {
    setActiveModule(moduleId as ActiveModule);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeModule = () => {
    setActiveModule(null);
  };

  const openDocs = () => {
    setActiveModule("documentation");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isCalculatorOpen={activeModule !== null} onOpenDocs={openDocs} />

      {activeModule === "cn-calculator" && (
        <div className="pt-16">
          <CNCalculator onClose={closeModule} />
        </div>
      )}

      {activeModule === "groundwater" && (
        <div className="pt-16">
          <GroundwaterSimulator onClose={closeModule} />
        </div>
      )}

      {activeModule === "muskingum-routing" && (
        <div className="pt-16">
          <MuskingumSimulator onClose={closeModule} />
        </div>
      )}

      {activeModule === "channel-design" && (
        <div className="pt-16">
          <StableChannelWizard onClose={closeModule} />
        </div>
      )}

      {activeModule === "albedo" && (
        <div className="pt-16">
          <AlbedoWaterBalance onClose={closeModule} />
        </div>
      )}

      {activeModule === "hydroecology" && (
        <div className="pt-16">
          <HydroEcologicalTracker onClose={closeModule} />
        </div>
      )}

      {activeModule === "documentation" && (
        <div className="pt-16">
          <Documentation onClose={closeModule} />
        </div>
      )}

      {activeModule === null && (
        <>
          <Hero />
          <GettingStarted onOpenModule={openModule} />
          <ModulesSection onOpenModule={openModule} />
          <Footer />
        </>
      )}
    </div>
  );
};

export default Index;
