import { Droplets, BookOpen, Calculator, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import WaterWaves from "./WaterWaves";

const Hero = () => {
  const scrollToModules = () => {
    document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToStart = () => {
    document.getElementById('getting-started')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[90vh] hero-gradient flex items-center justify-center overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-[10%] animate-float" style={{ animationDelay: '0s' }}>
          <Droplets className="w-8 h-8 text-water-light opacity-30" />
        </div>
        <div className="absolute top-40 right-[15%] animate-float" style={{ animationDelay: '1s' }}>
          <Droplets className="w-12 h-12 text-water-light opacity-20" />
        </div>
        <div className="absolute bottom-40 left-[20%] animate-float" style={{ animationDelay: '2s' }}>
          <Droplets className="w-6 h-6 text-water-light opacity-25" />
        </div>
        <div className="absolute top-60 left-[70%] animate-float" style={{ animationDelay: '1.5s' }}>
          <Droplets className="w-10 h-10 text-water-light opacity-20" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-water-deep/30" />
      </div>

      <div className="container relative z-10 px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-water-foam/10 border border-water-light/20 backdrop-blur-sm animate-fade-in">
          <FlaskConical className="w-4 h-4 text-water-light" />
          <span className="text-sm font-medium text-water-foam">Interactive Hydrology Education</span>
        </div>

        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-water-foam mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          Ponce Hydrology
          <span className="block text-water-light">Lab</span>
        </h1>

        <p className="max-w-3xl mx-auto text-lg md:text-xl text-water-surface/90 mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Interactive hydrology calculators and simulators based on{" "}
          <span className="font-semibold text-water-light">Prof. Victor M. Ponce's</span> web hydrology
          library — for students, educators, and practicing engineers.
        </p>

        <p className="max-w-2xl mx-auto text-sm md:text-base text-water-surface/75 mb-3 animate-fade-in" style={{ animationDelay: '0.22s' }}>
          Use real design methods — SCS CN, Muskingum-Cunge, stable channel design, groundwater yield —
          with explorable parameters and theory panels.
        </p>

        <p className="text-xs text-water-surface/60 mb-10 animate-fade-in" style={{ animationDelay: '0.25s' }}>
          San Diego State University lineage • Independent educational adaptation
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Button variant="hero" size="xl" onClick={scrollToModules} aria-label="Browse all interactive modules">
            <Calculator className="w-5 h-5" />
            Explore Modules
          </Button>
          <Button
            variant="outline"
            size="xl"
            className="border-water-light/30 text-water-foam hover:bg-water-light/10 hover:text-water-foam"
            onClick={scrollToStart}
            aria-label="See guided learning paths"
          >
            <BookOpen className="w-5 h-5" />
            Guided Learning Paths
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-8 max-w-xl mx-auto mt-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-water-foam">33</div>
            <div className="text-sm text-water-surface/70">Interactive Modules</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-water-foam">11</div>
            <div className="text-sm text-water-surface/70">Hydrology Domains</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-water-foam">380+</div>
            <div className="text-sm text-water-surface/70">Concepts Referenced</div>
          </div>
        </div>
      </div>

      <WaterWaves />
    </section>
  );
};

export default Hero;
