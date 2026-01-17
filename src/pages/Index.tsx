import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ModulesSection from "@/components/ModulesSection";
import CNCalculator from "@/components/CNCalculator";
import GroundwaterSimulator from "@/components/GroundwaterSimulator";
import MuskingumSimulator from "@/components/MuskingumSimulator";
import Footer from "@/components/Footer";

type ActiveModule = null | "cn-calculator" | "groundwater" | "muskingum-routing";

const Index = () => {
  const [activeModule, setActiveModule] = useState<ActiveModule>(null);

  const openModule = (moduleId: string) => {
    setActiveModule(moduleId as ActiveModule);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeModule = () => {
    setActiveModule(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isCalculatorOpen={activeModule !== null} />

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

      {activeModule === null && (
        <>
          <Hero />
          <ModulesSection onOpenModule={openModule} />
          <Footer />
        </>
      )}
    </div>
  );
};

export default Index;
