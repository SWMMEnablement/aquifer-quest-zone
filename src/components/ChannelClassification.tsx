import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ChevronRight } from "lucide-react";

interface ChannelClassificationProps {
  onClose: () => void;
}

interface StreamType {
  type: string;
  name: string;
  description: string;
  entrenchment: string;
  wdRatio: string;
  sinuosity: string;
  slope: string;
  bedMaterial: string;
  stability: "very high" | "high" | "moderate" | "low" | "very low";
  management: string;
}

const STREAM_TYPES: StreamType[] = [
  { type: "A", name: "Steep, Entrenched", description: "Steep, confined headwater channels with cascading step-pool morphology.", entrenchment: "< 1.4", wdRatio: "< 12", sinuosity: "1.0–1.2", slope: "> 4%", bedMaterial: "Bedrock/Boulder", stability: "very high", management: "Minimal intervention needed." },
  { type: "B", name: "Moderate Gradient, Entrenched", description: "Moderate gradient, moderately entrenched with rapids and riffle-pool sequences.", entrenchment: "1.4–2.2", wdRatio: "< 12", sinuosity: "> 1.2", slope: "2–4%", bedMaterial: "Boulder/Cobble", stability: "high", management: "Protect riparian corridor." },
  { type: "C", name: "Meandering, Alluvial", description: "Low gradient meandering channel with well-developed floodplain and riffle-pool.", entrenchment: "> 2.2", wdRatio: "> 12", sinuosity: "> 1.4", slope: "< 2%", bedMaterial: "Gravel/Sand", stability: "moderate", management: "Maintain floodplain connectivity." },
  { type: "D", name: "Braided", description: "Multiple channels, very wide, high sediment supply, high width/depth ratio.", entrenchment: "N/A", wdRatio: "> 40", sinuosity: "< 1.2", slope: "Variable", bedMaterial: "Sand/Gravel", stability: "very low", management: "Difficult to stabilize; reduce sediment supply." },
  { type: "E", name: "Meadow, Low Gradient", description: "Low gradient, highly sinuous, narrow and deep, well-vegetated banks.", entrenchment: "> 2.2", wdRatio: "< 12", sinuosity: "> 1.5", slope: "< 2%", bedMaterial: "Sand/Silt", stability: "moderate", management: "Protect bank vegetation; sensitive to disturbance." },
  { type: "F", name: "Entrenched Meandering", description: "Entrenched meandering channel in alluvium, deeply incised.", entrenchment: "< 1.4", wdRatio: "> 12", sinuosity: "> 1.4", slope: "< 2%", bedMaterial: "Sand/Gravel", stability: "low", management: "Active restoration needed; prone to widening." },
  { type: "G", name: "Gully, Entrenched", description: "Narrow, deep, entrenched gully with steep banks.", entrenchment: "< 1.4", wdRatio: "< 12", sinuosity: "> 1.2", slope: "2–4%", bedMaterial: "Gravel/Sand", stability: "low", management: "Grade control structures; high erosion risk." },
];

const QUESTIONS = [
  { id: 1, text: "What is the entrenchment ratio (flood-prone width / bankfull width)?", options: ["< 1.4 (Entrenched)", "1.4–2.2 (Moderately entrenched)", "> 2.2 (Slightly entrenched)"] },
  { id: 2, text: "What is the width/depth ratio (bankfull width / bankfull depth)?", options: ["< 12 (Narrow, deep)", "12–40 (Moderate)", "> 40 (Wide, shallow)"] },
  { id: 3, text: "What is the sinuosity (stream length / valley length)?", options: ["< 1.2 (Low)", "1.2–1.5 (Moderate)", "> 1.5 (High)"] },
  { id: 4, text: "What is the channel slope?", options: ["< 2% (Low)", "2–4% (Moderate)", "> 4% (Steep)"] },
  { id: 5, text: "What is the dominant bed material?", options: ["Bedrock/Boulder", "Cobble/Gravel", "Sand/Silt"] },
];

const classifyChannel = (answers: number[]): StreamType[] => {
  if (answers.length < 5) return STREAM_TYPES;
  const [ent, wd, sin, sl, bed] = answers;

  return STREAM_TYPES.filter((st) => {
    let score = 0;
    // Entrenchment
    if (ent === 0 && st.entrenchment.includes("< 1.4")) score += 2;
    if (ent === 1 && st.entrenchment.includes("1.4")) score += 2;
    if (ent === 2 && st.entrenchment.includes("> 2.2")) score += 2;
    // W/D
    if (wd === 0 && st.wdRatio.includes("< 12")) score += 2;
    if (wd === 1) score += 1;
    if (wd === 2 && st.wdRatio.includes("> 40")) score += 2;
    if (wd === 2 && st.wdRatio.includes("> 12")) score += 1;
    // Sinuosity
    if (sin === 2 && st.sinuosity.includes("> 1.5")) score += 1;
    if (sin === 2 && st.sinuosity.includes("> 1.4")) score += 1;
    if (sin === 0 && st.sinuosity.includes("< 1.2")) score += 1;
    // Slope
    if (sl === 2 && st.slope.includes("> 4")) score += 2;
    if (sl === 1 && st.slope.includes("2–4")) score += 2;
    if (sl === 0 && st.slope.includes("< 2")) score += 2;

    return score >= 3;
  }).sort((a, b) => {
    const stability = { "very high": 5, high: 4, moderate: 3, low: 2, "very low": 1 };
    return stability[b.stability] - stability[a.stability];
  });
};

const stabilityColor = (s: string) => {
  if (s === "very high" || s === "high") return "bg-earth-green/20 text-earth-green";
  if (s === "moderate") return "bg-earth-sand/30 text-earth-brown";
  return "bg-destructive/10 text-destructive";
};

const ChannelClassification = ({ onClose }: ChannelClassificationProps) => {
  const [answers, setAnswers] = useState<number[]>([]);
  const [mode, setMode] = useState<"tree" | "gallery">("tree");

  const currentQ = answers.length;
  const matches = classifyChannel(answers);
  const isComplete = answers.length >= 5;

  const handleAnswer = (idx: number) => {
    setAnswers([...answers, idx]);
  };

  const reset = () => setAnswers([]);

  return (
    <div className="min-h-screen bg-background py-8 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={onClose}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Channel Classification</h1>
            <p className="text-muted-foreground mt-1">Rosgen stream classification decision tree</p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-6">
          <Button variant={mode === "tree" ? "default" : "outline"} size="sm" onClick={() => setMode("tree")}>Decision Tree</Button>
          <Button variant={mode === "gallery" ? "default" : "outline"} size="sm" onClick={() => setMode("gallery")}>Gallery View</Button>
        </div>

        {mode === "gallery" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {STREAM_TYPES.map((st) => (
              <Card key={st.type} className="p-5 shadow-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">{st.type}</div>
                  <div>
                    <p className="font-semibold text-foreground">{st.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${stabilityColor(st.stability)}`}>{st.stability} stability</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{st.description}</p>
                <div className="space-y-1 text-xs">
                  <p><span className="text-muted-foreground">Entrenchment:</span> <span className="text-foreground">{st.entrenchment}</span></p>
                  <p><span className="text-muted-foreground">W/D Ratio:</span> <span className="text-foreground">{st.wdRatio}</span></p>
                  <p><span className="text-muted-foreground">Sinuosity:</span> <span className="text-foreground">{st.sinuosity}</span></p>
                  <p><span className="text-muted-foreground">Slope:</span> <span className="text-foreground">{st.slope}</span></p>
                  <p><span className="text-muted-foreground">Bed:</span> <span className="text-foreground">{st.bedMaterial}</span></p>
                </div>
                <p className="text-xs text-muted-foreground mt-3 pt-2 border-t border-border italic">{st.management}</p>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Decision tree */}
            <Card className="p-6 shadow-card">
              <h2 className="font-semibold text-lg text-foreground mb-4">Classification Questions</h2>

              {/* Progress */}
              <div className="flex gap-1 mb-6">
                {QUESTIONS.map((_, i) => (
                  <div key={i} className={`h-2 flex-1 rounded-full ${i < answers.length ? 'bg-primary' : 'bg-muted'}`} />
                ))}
              </div>

              {!isComplete ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Question {currentQ + 1} of 5</p>
                  <p className="text-foreground font-medium mb-4">{QUESTIONS[currentQ].text}</p>
                  <div className="space-y-2">
                    {QUESTIONS[currentQ].options.map((opt, idx) => (
                      <Button key={idx} variant="outline" className="w-full justify-start text-left h-auto py-3" onClick={() => handleAnswer(idx)}>
                        <ChevronRight className="w-4 h-4 mr-2 flex-shrink-0" />
                        {opt}
                      </Button>
                    ))}
                  </div>
                  {answers.length > 0 && (
                    <Button variant="ghost" size="sm" className="mt-4" onClick={() => setAnswers(answers.slice(0, -1))}>← Go Back</Button>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-earth-green font-semibold mb-4">Classification Complete!</p>
                  <div className="space-y-2 mb-4">
                    {QUESTIONS.map((q, i) => (
                      <p key={i} className="text-sm"><span className="text-muted-foreground">{q.text.slice(0, 30)}...</span> <span className="text-foreground font-medium">{q.options[answers[i]]}</span></p>
                    ))}
                  </div>
                  <Button onClick={reset} variant="outline" className="w-full">Start Over</Button>
                </div>
              )}
            </Card>

            {/* Results */}
            <Card className="p-6 shadow-card">
              <h2 className="font-semibold text-lg text-foreground mb-4">{isComplete ? "Best Matches" : "Possible Stream Types"}</h2>
              <div className="space-y-3">
                {matches.map((st) => (
                  <div key={st.type} className="p-4 bg-muted rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-bold text-primary">{st.type}</span>
                      <div>
                        <p className="font-medium text-foreground">{st.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${stabilityColor(st.stability)}`}>{st.stability} stability</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{st.description}</p>
                    <p className="text-xs text-muted-foreground mt-2 italic">{st.management}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  Based on Rosgen classification — Prof. Victor Miguel Ponce, SDSU
                  <br /><a href="https://ponce.sdsu.edu/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ponce.sdsu.edu</a>
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelClassification;
