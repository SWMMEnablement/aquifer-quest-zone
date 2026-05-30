import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import GettingStarted from "@/components/GettingStarted";
import ModulesSection from "@/components/ModulesSection";
import Footer from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();

  const openModule = (moduleId: string) => {
    navigate(`/modules/${moduleId}`);
  };

  const openDocs = () => {
    navigate("/modules/documentation");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isCalculatorOpen={false} onOpenDocs={openDocs} />
      <main>
        <Hero />
        <GettingStarted onOpenModule={openModule} />
        <ModulesSection onOpenModule={openModule} />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
