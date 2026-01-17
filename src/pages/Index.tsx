import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ModulesSection from "@/components/ModulesSection";
import CNCalculator from "@/components/CNCalculator";
import Footer from "@/components/Footer";

const Index = () => {
  const [showCNCalculator, setShowCNCalculator] = useState(false);

  const openCNCalculator = () => {
    setShowCNCalculator(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeCNCalculator = () => {
    setShowCNCalculator(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isCalculatorOpen={showCNCalculator} />

      {showCNCalculator ? (
        <div className="pt-16">
          <CNCalculator onClose={closeCNCalculator} />
        </div>
      ) : (
        <>
          <Hero />
          <ModulesSection onOpenCNCalculator={openCNCalculator} />
          <Footer />
        </>
      )}
    </div>
  );
};

export default Index;
