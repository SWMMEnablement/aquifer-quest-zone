import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ExternalLink } from "lucide-react";
import GutterFlow from "@/components/swmm/GutterFlow";
import InletDesign from "@/components/swmm/InletDesign";
import PipeFlow from "@/components/swmm/PipeFlow";
import WeirOrifice from "@/components/swmm/WeirOrifice";
import WaterHammer from "@/components/swmm/WaterHammer";
import PumpCurves from "@/components/swmm/PumpCurves";

interface Props { onClose: () => void; }

const SWMMCalculator = ({ onClose }: Props) => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={onClose} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">SWMM Urban Hydraulics Suite</h1>
      <p className="text-muted-foreground mb-6">
        Stormwater management calculators with interactive diagrams — gutters, inlets, pipes, weirs, water hammer, and pumps.
        <a href="https://ponce.sdsu.edu/" target="_blank" rel="noopener noreferrer" className="text-primary ml-2 inline-flex items-center gap-1">
          Ponce Reference <ExternalLink className="w-3 h-3" />
        </a>
      </p>

      <Tabs defaultValue="gutter" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 mb-6">
          <TabsTrigger value="gutter" className="text-xs">Gutter Flow</TabsTrigger>
          <TabsTrigger value="inlet" className="text-xs">Inlet Design</TabsTrigger>
          <TabsTrigger value="pipe" className="text-xs">Pipe Flow</TabsTrigger>
          <TabsTrigger value="weir" className="text-xs">Weirs & Orifices</TabsTrigger>
          <TabsTrigger value="hammer" className="text-xs">Water Hammer</TabsTrigger>
          <TabsTrigger value="pump" className="text-xs">Pump Curves</TabsTrigger>
        </TabsList>

        <TabsContent value="gutter"><GutterFlow /></TabsContent>
        <TabsContent value="inlet"><InletDesign /></TabsContent>
        <TabsContent value="pipe"><PipeFlow /></TabsContent>
        <TabsContent value="weir"><WeirOrifice /></TabsContent>
        <TabsContent value="hammer"><WaterHammer /></TabsContent>
        <TabsContent value="pump"><PumpCurves /></TabsContent>
      </Tabs>

      <div className="mt-8 pt-4 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">
          Inspired by H₂OCalc methodology (MWH Soft) — Prof. Victor Miguel Ponce, SDSU
          <br /><a href="https://ponce.sdsu.edu/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ponce.sdsu.edu</a>
        </p>
      </div>
    </div>
  );
};

export default SWMMCalculator;
