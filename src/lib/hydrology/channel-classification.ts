/**
 * Channel Classification — Pure calculation functions
 *
 * Covers: Rosgen stream classification decision tree.
 *
 * Reference: Prof. Victor Miguel Ponce, SDSU — ponce.sdsu.edu
 */

// ─── Types ──────────────────────────────────────────────────

export type StabilityLevel = "very high" | "high" | "moderate" | "low" | "very low";

export interface StreamType {
  type: string;
  name: string;
  description: string;
  entrenchment: string;
  wdRatio: string;
  sinuosity: string;
  slope: string;
  bedMaterial: string;
  stability: StabilityLevel;
  management: string;
}

export interface ClassificationQuestion {
  id: number;
  text: string;
  options: string[];
}

// ─── Constants ──────────────────────────────────────────────

export const STREAM_TYPES: StreamType[] = [
  { type: "A", name: "Steep, Entrenched", description: "Steep, confined headwater channels with cascading step-pool morphology.", entrenchment: "< 1.4", wdRatio: "< 12", sinuosity: "1.0–1.2", slope: "> 4%", bedMaterial: "Bedrock/Boulder", stability: "very high", management: "Minimal intervention needed." },
  { type: "B", name: "Moderate Gradient, Entrenched", description: "Moderate gradient, moderately entrenched with rapids and riffle-pool sequences.", entrenchment: "1.4–2.2", wdRatio: "< 12", sinuosity: "> 1.2", slope: "2–4%", bedMaterial: "Boulder/Cobble", stability: "high", management: "Protect riparian corridor." },
  { type: "C", name: "Meandering, Alluvial", description: "Low gradient meandering channel with well-developed floodplain and riffle-pool.", entrenchment: "> 2.2", wdRatio: "> 12", sinuosity: "> 1.4", slope: "< 2%", bedMaterial: "Gravel/Sand", stability: "moderate", management: "Maintain floodplain connectivity." },
  { type: "D", name: "Braided", description: "Multiple channels, very wide, high sediment supply, high width/depth ratio.", entrenchment: "N/A", wdRatio: "> 40", sinuosity: "< 1.2", slope: "Variable", bedMaterial: "Sand/Gravel", stability: "very low", management: "Difficult to stabilize; reduce sediment supply." },
  { type: "E", name: "Meadow, Low Gradient", description: "Low gradient, highly sinuous, narrow and deep, well-vegetated banks.", entrenchment: "> 2.2", wdRatio: "< 12", sinuosity: "> 1.5", slope: "< 2%", bedMaterial: "Sand/Silt", stability: "moderate", management: "Protect bank vegetation; sensitive to disturbance." },
  { type: "F", name: "Entrenched Meandering", description: "Entrenched meandering channel in alluvium, deeply incised.", entrenchment: "< 1.4", wdRatio: "> 12", sinuosity: "> 1.4", slope: "< 2%", bedMaterial: "Sand/Gravel", stability: "low", management: "Active restoration needed; prone to widening." },
  { type: "G", name: "Gully, Entrenched", description: "Narrow, deep, entrenched gully with steep banks.", entrenchment: "< 1.4", wdRatio: "< 12", sinuosity: "> 1.2", slope: "2–4%", bedMaterial: "Gravel/Sand", stability: "low", management: "Grade control structures; high erosion risk." },
];

export const CLASSIFICATION_QUESTIONS: ClassificationQuestion[] = [
  { id: 1, text: "What is the entrenchment ratio (flood-prone width / bankfull width)?", options: ["< 1.4 (Entrenched)", "1.4–2.2 (Moderately entrenched)", "> 2.2 (Slightly entrenched)"] },
  { id: 2, text: "What is the width/depth ratio (bankfull width / bankfull depth)?", options: ["< 12 (Narrow, deep)", "12–40 (Moderate)", "> 40 (Wide, shallow)"] },
  { id: 3, text: "What is the sinuosity (stream length / valley length)?", options: ["< 1.2 (Low)", "1.2–1.5 (Moderate)", "> 1.5 (High)"] },
  { id: 4, text: "What is the channel slope?", options: ["< 2% (Low)", "2–4% (Moderate)", "> 4% (Steep)"] },
  { id: 5, text: "What is the dominant bed material?", options: ["Bedrock/Boulder", "Cobble/Gravel", "Sand/Silt"] },
];

// ─── Classification Logic ───────────────────────────────────

/**
 * Classify channel based on answers to the 5-question decision tree.
 * Returns matching stream types sorted by stability.
 */
export const classifyChannel = (answers: number[]): StreamType[] => {
  if (answers.length < 5) return STREAM_TYPES;
  const [ent, wd, sin, sl] = answers;

  return STREAM_TYPES.filter((st) => {
    let score = 0;
    if (ent === 0 && st.entrenchment.includes("< 1.4")) score += 2;
    if (ent === 1 && st.entrenchment.includes("1.4")) score += 2;
    if (ent === 2 && st.entrenchment.includes("> 2.2")) score += 2;
    if (wd === 0 && st.wdRatio.includes("< 12")) score += 2;
    if (wd === 1) score += 1;
    if (wd === 2 && st.wdRatio.includes("> 40")) score += 2;
    if (wd === 2 && st.wdRatio.includes("> 12")) score += 1;
    if (sin === 2 && st.sinuosity.includes("> 1.5")) score += 1;
    if (sin === 2 && st.sinuosity.includes("> 1.4")) score += 1;
    if (sin === 0 && st.sinuosity.includes("< 1.2")) score += 1;
    if (sl === 2 && st.slope.includes("> 4")) score += 2;
    if (sl === 1 && st.slope.includes("2–4")) score += 2;
    if (sl === 0 && st.slope.includes("< 2")) score += 2;
    return score >= 3;
  }).sort((a, b) => {
    const stability = { "very high": 5, high: 4, moderate: 3, low: 2, "very low": 1 };
    return stability[b.stability] - stability[a.stability];
  });
};
