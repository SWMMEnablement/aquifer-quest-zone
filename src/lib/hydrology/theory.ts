// Structured theory & assumptions registry, keyed by module slug (matches ModulePage routes).
// Each entry documents the governing equations, assumptions/limitations, recommended parameter ranges,
// and authoritative references. Keep entries concise — this powers the in-module TheoryPanel.

export interface TheoryEquation {
  /** Display label, e.g. "SCS runoff equation" */
  label: string;
  /** Plain-text or unicode equation. Use sub/sup unicode for compactness. */
  formula: string;
  /** Optional short description of variables/usage. Supports inline citations like [1]. */
  notes?: string;
}

export interface TheoryParameter {
  symbol: string;
  name: string;
  range: string;
  units?: string;
  note?: string;
}

export interface TheoryReference {
  citation: string;
  url?: string;
}

export interface TheoryExampleField {
  label: string;
  value: string;
  units?: string;
}

export interface TheoryExample {
  title: string;
  description?: string;
  inputs: TheoryExampleField[];
  outputs: TheoryExampleField[];
  notes?: string;
}

export interface ModuleTheory {
  title: string;
  summary: string;
  equations: TheoryEquation[];
  assumptions: string[];
  limitations: string[];
  parameters: TheoryParameter[];
  references: TheoryReference[];
  /** Optional worked examples (2–3 recommended). */
  examples?: TheoryExample[];
}


const PONCE = (path: string, label: string): TheoryReference => ({
  citation: label,
  url: `https://ponce.sdsu.edu/${path}`,
});

export const MODULE_THEORY: Record<string, ModuleTheory> = {
  "cn-calculator": {
    title: "SCS / NRCS Curve Number Method",
    summary:
      "Empirical event-based rainfall–runoff model developed by USDA-SCS (now NRCS). Estimates direct runoff depth from storm rainfall using a single lumped parameter (CN) that captures land use, soil hydrologic group, and antecedent moisture.",
    equations: [
      { label: "Runoff depth", formula: "Q = (P − Iₐ)² / (P − Iₐ + S),  for P > Iₐ" },
      { label: "Potential maximum retention", formula: "S = (1000 / CN) − 10  (inches)" },
      { label: "Initial abstraction", formula: "Iₐ = 0.2 S  (standard assumption)" },
      { label: "AMC I (dry) adjustment", formula: "CN(I) = 4.2 CN(II) / (10 − 0.058 CN(II))" },
      { label: "AMC III (wet) adjustment", formula: "CN(III) = 23 CN(II) / (10 + 0.13 CN(II))" },
    ],
    assumptions: [
      "Event-based: applies to a single storm, not continuous simulation.",
      "Iₐ = 0.2 S is an empirical average; field values range 0.05 S – 0.2 S.",
      "Soil moisture and storm intensity effects are lumped into CN and AMC class.",
      "No explicit accounting for storm duration, intensity pattern, or partial-area runoff.",
    ],
    limitations: [
      "Less reliable for very small storms (P close to Iₐ) — runoff is highly sensitive to CN.",
      "Not intended for snowmelt, frozen ground, or very long-duration low-intensity events.",
      "Original calibration is U.S.-centric (agricultural watersheds, < ~10 mi²).",
    ],
    parameters: [
      { symbol: "CN", name: "Curve Number", range: "30 – 98", note: "Typical urban 70–95, forest 30–77" },
      { symbol: "P", name: "Storm rainfall", range: "10 – 300", units: "mm", note: "Recommended ≥ 25 mm for stable Q" },
      { symbol: "Iₐ/S", name: "Initial abstraction ratio", range: "0.05 – 0.20", note: "0.20 is standard; 0.05 used in modern NRCS updates" },
    ],
    references: [
      PONCE("onlinerunoffcurvenumber.html", "Ponce, V.M. — Online Runoff Curve Number"),
      { citation: "USDA NRCS, National Engineering Handbook, Part 630 (Hydrology), Chapters 9–10" },
      { citation: "Ponce, V.M. (2014). Engineering Hydrology: Principles and Practices, Ch. 5" },
    ],
  },

  groundwater: {
    title: "Sustainable Groundwater Yield (Lumped Aquifer Storage)",
    summary:
      "Lumped water-balance model relating pumping, recharge, and aquifer storage. Used to illustrate the difference between safe yield and sustainable yield, and the ecological cost of overdraft.",
    equations: [
      { label: "Storage balance", formula: "ΔS/Δt = R − Q_b − ET_gw − P_pump" },
      { label: "Sustainable yield (long-term)", formula: "P_pump ≤ R − Q_b,min − ET_gw" },
    ],
    assumptions: [
      "Single-cell (lumped) aquifer; no spatial drawdown distribution.",
      "Recharge and discharge are mean annual values, not transient.",
      "Storage is linearly proportional to head (constant specific yield).",
    ],
    limitations: [
      "Does not resolve well interference, anisotropy, or layered aquifer behavior.",
      "Ecosystem response curves are illustrative thresholds, not calibrated to a specific basin.",
    ],
    parameters: [
      { symbol: "R", name: "Recharge", range: "5 – 500", units: "mm/yr" },
      { symbol: "Sy", name: "Specific yield", range: "0.01 – 0.30", note: "Sand & gravel ~0.20; clay ~0.03" },
      { symbol: "P_pump", name: "Pumping rate", range: "0 – 1.5 × R", note: "> R causes long-term overdraft" },
    ],
    references: [
      PONCE("groundwater_overdraft.html", "Ponce, V.M. — Groundwater Overdraft"),
      { citation: "Alley, W.M., Reilly, T.E., & Franke, O.L. (1999). Sustainability of Ground-Water Resources. USGS Circular 1186" },
    ],
  },

  "muskingum-routing": {
    title: "Muskingum–Cunge Flood Routing",
    summary:
      "Hydrologic-hydraulic hybrid routing method. Uses Muskingum's storage relationship but derives K and X from physical channel properties (celerity, width, slope), so it approximates the convection–diffusion form of the Saint-Venant equations.",
    equations: [
      { label: "Routing", formula: "O₂ = C₀ I₂ + C₁ I₁ + C₂ O₁,  Σ Cᵢ = 1" },
      { label: "Wave celerity (Manning, wide channel)", formula: "c = (5/3) · (1/n) R^(2/3) S^(1/2)" },
      { label: "Weighting factor", formula: "X = ½ (1 − q / (S₀ · c · Δx))" },
      { label: "Courant & cell Reynolds", formula: "C = c Δt / Δx,  D = q / (S₀ c Δx)" },
    ],
    assumptions: [
      "Diffusion-wave approximation (inertia terms in Saint-Venant neglected).",
      "Prismatic channel, gradually varied flow, single-valued stage–discharge.",
      "Lateral inflow is small compared to channel flow.",
    ],
    limitations: [
      "Not valid for very flat slopes where backwater dominates (use full dynamic wave).",
      "Numerical diffusion controls accuracy; choose Δt and Δx so C + D ≈ 1 (Ponce's grid criterion).",
    ],
    parameters: [
      { symbol: "X", name: "Weighting factor", range: "0 – 0.5", note: "0.5 = pure translation, 0 = max attenuation" },
      { symbol: "K", name: "Travel time", range: "Δx / c", units: "h" },
      { symbol: "Δt/K", name: "Time-step ratio", range: "0.5 – 2", note: "Keep C + D ≈ 1 for accuracy" },
    ],
    references: [
      PONCE("muskingumcunge.html", "Ponce, V.M. — Online Muskingum–Cunge"),
      { citation: "Ponce, V.M. & Yevjevich, V. (1978). Muskingum–Cunge method with variable parameters. J. Hydraulics Div., ASCE" },
      { citation: "Ponce, V.M. (2014). Engineering Hydrology, Ch. 9" },
    ],
  },

  "channel-design": {
    title: "Stable Channel Design (Regime, Tractive Force, Shields)",
    summary:
      "Determines non-eroding and non-silting cross-section dimensions for alluvial channels. Combines Lacey regime theory, permissible tractive force (USBR), and Shields critical-shear approach.",
    equations: [
      { label: "Lacey perimeter", formula: "P = 4.75 √Q" },
      { label: "Lacey hydraulic radius", formula: "R = 0.47 (Q / f)^(1/3)" },
      { label: "Tractive shear", formula: "τ₀ = γ R S" },
      { label: "Shields critical shear", formula: "τ_c = θ_c (γ_s − γ) d₅₀,  θ_c ≈ 0.045 – 0.06" },
    ],
    assumptions: [
      "Steady, uniform flow at design discharge.",
      "Cohesionless bed material characterized by d₅₀.",
      "Bank stability handled separately (angle of repose corrections).",
    ],
    limitations: [
      "Regime equations calibrated on Indian/Pakistani canals; transfer with caution.",
      "Does not account for bedform-induced form drag or armoring evolution.",
    ],
    parameters: [
      { symbol: "f", name: "Lacey silt factor", range: "0.4 – 2.0", note: "Fine silt 0.4–0.6; coarse sand 1.5–2.0" },
      { symbol: "θ_c", name: "Shields parameter", range: "0.03 – 0.06" },
      { symbol: "d₅₀", name: "Median grain size", range: "0.05 – 100", units: "mm" },
    ],
    references: [
      PONCE("designofstablechannels.html", "Ponce, V.M. — Design of Stable Channels"),
      { citation: "USBR (1987). Design of Small Canal Structures" },
      { citation: "Lane, E.W. (1955). Design of Stable Channels. Trans. ASCE 120" },
    ],
  },

  albedo: {
    title: "Albedo & Surface Energy Balance",
    summary:
      "Couples shortwave/longwave radiation balance to latent and sensible heat partitioning. Demonstrates how land-cover change (deforestation, urbanization, snow loss) shifts net radiation and evapotranspiration.",
    equations: [
      { label: "Net radiation", formula: "Rn = (1 − α) Rs↓ + ε (Rl↓ − σT⁴)" },
      { label: "Energy balance", formula: "Rn = G + H + LE" },
      { label: "Bowen ratio", formula: "β = H / LE" },
    ],
    assumptions: [
      "One-dimensional, daily-mean balance; no advection.",
      "Surface emissivity ε ≈ 0.95 – 0.98 unless otherwise specified.",
      "Soil heat flux G is a small fraction (~10%) of Rn over vegetated surfaces.",
    ],
    limitations: [
      "Bowen partitioning depends on moisture availability — drought conditions invalidate the default β.",
      "Does not resolve canopy radiation transfer or sub-daily diurnal cycles.",
    ],
    parameters: [
      { symbol: "α", name: "Albedo", range: "0.05 – 0.90", note: "Asphalt 0.05; fresh snow 0.85+" },
      { symbol: "Rs↓", name: "Incoming shortwave", range: "100 – 350", units: "W/m²" },
      { symbol: "β", name: "Bowen ratio", range: "0.1 – 10", note: "Forest ~0.2–0.6, desert > 5" },
    ],
    references: [
      { citation: "Brutsaert, W. (2005). Hydrology: An Introduction, Cambridge University Press" },
      { citation: "Bonan, G. (2015). Ecological Climatology, 3rd ed." },
    ],
  },

  hydroecology: {
    title: "Hydro-Ecological Impact (Flow–Ecology Relationships)",
    summary:
      "Links altered flow regimes (magnitude, frequency, duration, timing, rate of change) to ecosystem indicators. Based on the Natural Flow Regime paradigm.",
    equations: [
      { label: "Range of Variability (RVA) target", formula: "P[Q ∈ natural 25–75% range] ≥ 0.50" },
      { label: "Eco-deficit / surplus", formula: "EFD = Σ |Q_post − Q_pre| / Σ Q_pre" },
    ],
    assumptions: [
      "Pre-development flow record is representative of the 'natural' regime.",
      "Ecological indicators respond monotonically to flow alteration over the analysis period.",
    ],
    limitations: [
      "Does not capture water-quality or temperature interactions.",
      "Indicator thresholds are heuristic; calibrate to local species when possible.",
    ],
    parameters: [
      { symbol: "Q₇,₁₀", name: "7-day 10-yr low flow", range: "site-specific", units: "m³/s" },
      { symbol: "RVA", name: "Range of Variability", range: "25–75th percentile" },
    ],
    references: [
      { citation: "Poff, N.L. et al. (1997). The Natural Flow Regime. BioScience 47(11), 769–784" },
      { citation: "Richter, B.D. et al. (1996). A method for assessing hydrologic alteration. Conservation Biology 10(4)" },
    ],
  },

  "saint-venant": {
    title: "Saint-Venant Equations (1-D Unsteady Open-Channel Flow)",
    summary:
      "Full dynamic-wave description of 1-D free-surface flow: continuity plus momentum, including local and convective inertia, pressure, gravity, and friction.",
    equations: [
      { label: "Continuity", formula: "∂A/∂t + ∂Q/∂x = q_L" },
      { label: "Momentum", formula: "∂Q/∂t + ∂(Q²/A)/∂x + gA ∂h/∂x = gA (S₀ − S_f)" },
    ],
    assumptions: [
      "Hydrostatic pressure distribution.",
      "1-D flow with cross-section averaged variables.",
      "Channel slope small enough that sin θ ≈ tan θ ≈ S₀.",
    ],
    limitations: [
      "Requires sub-critical–super-critical transition handling (shocks, hydraulic jumps).",
      "Computationally heavier than kinematic/diffusion approximations; needs CFL stability control.",
    ],
    parameters: [
      { symbol: "CFL", name: "Courant number", range: "≤ 1", note: "Explicit schemes require CFL ≤ 1" },
      { symbol: "n", name: "Manning roughness", range: "0.012 – 0.10" },
    ],
    references: [
      PONCE("kinematicwave.html", "Ponce, V.M. — Kinematic, Diffusion, and Dynamic Waves"),
      { citation: "Chow, V.T., Maidment, D., Mays, L. (1988). Applied Hydrology, Ch. 9–10" },
    ],
  },

  "manning-rating": {
    title: "Manning's Equation & Rating Curves",
    summary:
      "Uniform-flow resistance equation widely used to convert stage to discharge in open channels.",
    equations: [
      { label: "Manning (SI)", formula: "Q = (1/n) A R^(2/3) S^(1/2)" },
      { label: "Hydraulic radius", formula: "R = A / P" },
    ],
    assumptions: [
      "Steady, uniform flow (energy slope = bed slope).",
      "Fully turbulent, rough boundary; n is independent of depth (approximation).",
    ],
    limitations: [
      "n actually varies with depth, vegetation seasonality, and bedforms.",
      "Not valid in pressurized or transitional flows.",
    ],
    parameters: [
      { symbol: "n", name: "Manning roughness", range: "0.012 – 0.10", note: "Concrete 0.013; vegetated floodplain 0.05–0.10" },
      { symbol: "S", name: "Channel slope", range: "10⁻⁵ – 10⁻¹" },
    ],
    references: [
      PONCE("onlinechannel01.html", "Ponce, V.M. — Online Channel"),
      { citation: "Chow, V.T. (1959). Open-Channel Hydraulics" },
    ],
  },

  "specific-energy": {
    title: "Specific Energy & Momentum Function",
    summary:
      "Energy–depth and momentum–depth relationships used to analyze critical flow, channel transitions, and hydraulic jumps.",
    equations: [
      { label: "Specific energy", formula: "E = y + Q² / (2 g A²)" },
      { label: "Specific momentum", formula: "M = Q² / (g A) + ȳ A" },
      { label: "Critical-flow condition", formula: "Q² T / (g A³) = 1  ⇒ Fr = 1" },
    ],
    assumptions: [
      "Hydrostatic pressure, uniform velocity in the section.",
      "No energy loss between adjacent sections (for E-curve); momentum form admits losses (jump)." ,
    ],
    limitations: [
      "Single-section analysis — does not resolve longitudinal profiles (use GVF for that).",
    ],
    parameters: [
      { symbol: "Fr", name: "Froude number", range: "0.1 – 4", note: "1.7 – 4.5 yields stable hydraulic jumps" },
    ],
    references: [
      PONCE("specificenergy.html", "Ponce, V.M. — Specific Energy"),
      { citation: "Henderson, F.M. (1966). Open Channel Flow, Ch. 2–3" },
    ],
  },

  "gvf-profiles": {
    title: "Gradually Varied Flow Profiles",
    summary:
      "Classifies and integrates 1-D steady non-uniform free-surface profiles (M, S, C, H, A) using the GVF equation.",
    equations: [
      { label: "GVF equation", formula: "dy/dx = (S₀ − S_f) / (1 − Fr²)" },
      { label: "Friction slope (Manning)", formula: "S_f = n² Q² / (A² R^(4/3))" },
    ],
    assumptions: [
      "Steady flow, gradually varied (curvature of streamlines is small).",
      "Hydrostatic pressure; channel prismatic between sections.",
    ],
    limitations: [
      "Cannot cross critical depth smoothly — switch between sub- and supercritical reaches.",
    ],
    parameters: [
      { symbol: "y_n", name: "Normal depth", range: "channel-specific" },
      { symbol: "y_c", name: "Critical depth", range: "channel-specific" },
    ],
    references: [
      PONCE("graduallyvariedflow.html", "Ponce, V.M. — Gradually Varied Flow"),
      { citation: "Chow, V.T. (1959). Open-Channel Hydraulics, Ch. 9–10" },
    ],
  },

  "wave-propagation": {
    title: "Surface Wave Propagation (Kinematic / Diffusion / Dynamic)",
    summary:
      "Compares wave types arising from Saint-Venant simplifications, showing how celerity and attenuation depend on the dimensionless wave number and Froude number.",
    equations: [
      { label: "Kinematic celerity", formula: "c_k = (5/3) V  (wide channel, Manning)" },
      { label: "Dynamic celerity", formula: "c_d = V ± √(g y)" },
      { label: "Ponce–Simons dimensionless wave number", formula: "σ* = (S₀ L / y₀) · (1 / F₀²)" },
    ],
    assumptions: [
      "Small-amplitude perturbation around uniform base flow.",
      "Prismatic channel; linear analysis.",
    ],
    limitations: [
      "Linear theory — large waves and bores require fully nonlinear treatment.",
    ],
    parameters: [
      { symbol: "F₀", name: "Base Froude", range: "0.1 – 2" },
      { symbol: "σ*", name: "Dimensionless wave number", range: "0.001 – 1000" },
    ],
    references: [
      PONCE("kinematicwave.html", "Ponce, V.M. — Kinematic, Diffusion, and Dynamic Waves"),
      { citation: "Ponce, V.M. & Simons, D.B. (1977). Shallow wave propagation in open-channel flow. J. Hyd. Div., ASCE" },
    ],
  },

  "unit-hydrograph": {
    title: "Unit Hydrograph Theory",
    summary:
      "Linear, time-invariant response of a watershed to a unit depth of effective rainfall applied uniformly over a unit duration.",
    equations: [
      { label: "Convolution", formula: "Q(t) = Σ P_eff(τ) · U(t − τ) Δτ" },
      { label: "SCS dimensionless UH peak", formula: "q_p = 484 A / T_p  (English units)" },
    ],
    assumptions: [
      "Linearity: doubling rainfall doubles runoff.",
      "Time invariance: response shape independent of when storm occurs.",
      "Uniform rainfall in space and time over the unit duration.",
    ],
    limitations: [
      "Real watersheds are nonlinear at extreme storms (saturation, channel storage).",
      "Spatial uniformity rarely holds for large basins (> ~1000 km²).",
    ],
    parameters: [
      { symbol: "T_p", name: "Time-to-peak", range: "watershed-specific", units: "h" },
      { symbol: "Δt", name: "Unit duration", range: "≤ T_p / 4" },
    ],
    references: [
      PONCE("unithydrograph.html", "Ponce, V.M. — Unit Hydrograph"),
      { citation: "Sherman, L.K. (1932). Streamflow from rainfall by the unit-graph method. Eng. News-Record" },
    ],
  },

  "rational-method": {
    title: "Rational Method (Q = C i A)",
    summary:
      "Peak-discharge formula for small, mostly-impervious catchments based on the assumption that peak flow occurs when the entire catchment contributes (i.e., at the time of concentration).",
    equations: [
      { label: "Peak discharge (SI)", formula: "Q = C i A / 360,  Q[m³/s], i[mm/h], A[ha]" },
      { label: "Peak discharge (English)", formula: "Q = C i A,  Q[cfs], i[in/h], A[acre]" },
    ],
    assumptions: [
      "Rainfall intensity is uniform over the catchment and over duration ≥ t_c.",
      "Runoff coefficient C is constant for the design event.",
      "Storm return period = flood return period.",
    ],
    limitations: [
      "Recommended only for catchments < 80–200 ha.",
      "No hydrograph — peak only.",
    ],
    parameters: [
      { symbol: "C", name: "Runoff coefficient", range: "0.10 – 0.95" },
      { symbol: "t_c", name: "Time of concentration", range: "5 – 180", units: "min" },
      { symbol: "A", name: "Catchment area", range: "≤ 200", units: "ha" },
    ],
    references: [
      PONCE("onlinerationalmethod.html", "Ponce, V.M. — Online Rational Method"),
      { citation: "ASCE/WEF (1992). Design and Construction of Urban Stormwater Management Systems" },
    ],
  },

  "lanes-balance": {
    title: "Lane's Balance (Qualitative Sediment-Water Relationship)",
    summary:
      "Heuristic balance Q_s · d₅₀ ∝ Q_w · S that predicts whether a channel will aggrade or degrade in response to changes in water discharge, sediment supply, slope, or grain size.",
    equations: [
      { label: "Lane's relation", formula: "Q_s · d₅₀ ∝ Q_w · S" },
    ],
    assumptions: [
      "Qualitative — proportionality constant is site-specific.",
      "System has time to adjust to new equilibrium.",
    ],
    limitations: [
      "Does not give magnitudes; for quantitative work use transport equations (e.g. Meyer-Peter–Müller, Yang).",
    ],
    parameters: [
      { symbol: "Q_s", name: "Sediment discharge", range: "site-specific", units: "kg/s" },
    ],
    references: [
      { citation: "Lane, E.W. (1955). The importance of fluvial morphology in hydraulic engineering. Proc. ASCE 81" },
    ],
  },

  "catchment-water-balance": {
    title: "Catchment Water Balance",
    summary:
      "Conservation of mass applied to a catchment over a control period: precipitation in, ET + runoff + storage change out.",
    equations: [
      { label: "Annual balance", formula: "P = Q + ET + ΔS" },
      { label: "Long-term (ΔS ≈ 0)", formula: "P − Q = ET" },
    ],
    assumptions: [
      "Catchment boundaries are also groundwater divides (no inter-basin transfer).",
      "Measurement errors small relative to fluxes.",
    ],
    limitations: [
      "ΔS often unknown at sub-annual scales; closure errors typical 5–15%.",
    ],
    parameters: [
      { symbol: "P", name: "Precipitation", range: "100 – 4000", units: "mm/yr" },
      { symbol: "ET/P", name: "Evaporative fraction", range: "0.3 – 0.95", note: "Budyko framework" },
    ],
    references: [
      { citation: "Budyko, M.I. (1974). Climate and Life" },
      { citation: "Brutsaert, W. (2005). Hydrology: An Introduction" },
    ],
  },

  "theis-well": {
    title: "Theis Non-Equilibrium Well Equation",
    summary:
      "Analytical drawdown solution for a fully-penetrating well pumping at constant rate from a homogeneous, isotropic, confined aquifer of infinite extent.",
    equations: [
      { label: "Drawdown", formula: "s = (Q / 4πT) · W(u)" },
      { label: "Argument", formula: "u = r² S / (4 T t)" },
      { label: "Well function", formula: "W(u) = ∫_u^∞ (e^(−x)/x) dx ≈ −γ − ln u + u − u²/4 + ..." },
    ],
    assumptions: [
      "Confined, homogeneous, isotropic aquifer of constant thickness.",
      "Fully penetrating well, negligible well storage.",
      "Constant pumping rate, radial flow, infinite areal extent.",
    ],
    limitations: [
      "Not directly applicable to unconfined aquifers (use Neuman) or leaky systems (Hantush).",
    ],
    parameters: [
      { symbol: "T", name: "Transmissivity", range: "10⁻⁶ – 10⁻¹", units: "m²/s" },
      { symbol: "S", name: "Storativity", range: "10⁻⁵ – 10⁻³", note: "Confined; unconfined S_y 0.01–0.3" },
    ],
    references: [
      { citation: "Theis, C.V. (1935). The relation between the lowering of the piezometric surface and the rate and duration of discharge of a well. Trans. AGU 16" },
      { citation: "Kruseman, G.P. & de Ridder, N.A. (1994). Analysis and Evaluation of Pumping Test Data, ILRI" },
    ],
  },

  vedernikov: {
    title: "Vedernikov Number & Roll Waves",
    summary:
      "Stability criterion for free-surface flow on steep slopes. When V > 1, small disturbances grow into roll waves; when V < 1, they decay.",
    equations: [
      { label: "Vedernikov (Manning, wide channel)", formula: "V = (2/3) · Fr" },
      { label: "Chezy", formula: "V = (1/2) · Fr" },
      { label: "Stability threshold", formula: "V > 1  ⇒  roll waves develop" },
    ],
    assumptions: [
      "Wide rectangular channel; uniform flow base state.",
      "Friction described by Manning or Chezy.",
    ],
    limitations: [
      "Linear stability — does not predict roll-wave amplitude or wavelength.",
    ],
    parameters: [
      { symbol: "Fr", name: "Froude", range: "0.5 – 3" },
    ],
    references: [
      PONCE("vedernikovnumber.html", "Ponce, V.M. — The Vedernikov Number"),
      { citation: "Vedernikov, V.V. (1945). Conditions at the front of a translation wave disturbing a steady motion of a real fluid" },
    ],
  },

  "baseflow-recession": {
    title: "Baseflow Recession",
    summary:
      "Exponential depletion of streamflow from groundwater discharge during periods without recharge.",
    equations: [
      { label: "Recession", formula: "Q(t) = Q₀ · α^t  (α < 1)" },
      { label: "Equivalent", formula: "Q(t) = Q₀ · e^(−kt),  k = −ln α" },
      { label: "Half-life", formula: "t_½ = ln 2 / k" },
    ],
    assumptions: [
      "Linear reservoir: discharge proportional to storage.",
      "No recharge during the recession period.",
    ],
    limitations: [
      "Real aquifers often show multiple recession slopes (fast/slow components).",
    ],
    parameters: [
      { symbol: "α", name: "Recession constant", range: "0.90 – 0.999", note: "Daily; closer to 1 = slower depletion" },
    ],
    references: [
      { citation: "Tallaksen, L.M. (1995). A review of baseflow recession analysis. J. Hydrology 165" },
    ],
  },

  "flood-frequency": {
    title: "Flood Frequency Analysis",
    summary:
      "Fits a probability distribution to annual peak discharges to estimate flood quantiles for design return periods.",
    equations: [
      { label: "Return period", formula: "T = 1 / (1 − F(Q_T))" },
      { label: "Log-Pearson III quantile", formula: "log Q_T = μ + K_T σ" },
    ],
    assumptions: [
      "Annual peaks are independent and identically distributed.",
      "Stationarity — climate and land-use do not change over the record.",
    ],
    limitations: [
      "Quantile uncertainty grows rapidly for T ≫ record length (rule: T ≤ 2 N).",
      "Non-stationarity from climate change invalidates classical methods — use trend tests.",
    ],
    parameters: [
      { symbol: "N", name: "Record length", range: "≥ 25", units: "yr" },
    ],
    references: [
      { citation: "USGS Bulletin 17C (2018). Guidelines for Determining Flood Flow Frequency" },
    ],
  },

  "spillway-design": {
    title: "Ogee Spillway Design",
    summary:
      "Standard WES (Waterways Experiment Station) ogee-crest spillway profile and discharge equation.",
    equations: [
      { label: "Discharge", formula: "Q = C L H^(3/2)" },
      { label: "WES crest profile", formula: "x^1.85 = 2 H_d^0.85 · y" },
    ],
    assumptions: [
      "Crest shape matches the lower nappe of a free overfall at design head H_d.",
      "No submergence by tailwater.",
    ],
    limitations: [
      "C varies with H/H_d, approach depth, and pier effects — use USBR/USACE charts.",
    ],
    parameters: [
      { symbol: "C", name: "Discharge coefficient", range: "1.7 – 2.2", units: "m^½/s" },
      { symbol: "H/H_d", name: "Head ratio", range: "0.5 – 1.33" },
    ],
    references: [
      { citation: "USBR (1987). Design of Small Dams, Ch. 9" },
      { citation: "USACE EM 1110-2-1603. Hydraulic Design of Spillways" },
    ],
  },

  "sediment-transport": {
    title: "Sediment Transport (Bedload & Total Load)",
    summary:
      "Empirical and semi-theoretical equations for bedload, suspended load, and total load transport in alluvial channels.",
    equations: [
      { label: "Meyer-Peter–Müller (bedload)", formula: "q_b* = 8 (τ* − 0.047)^(3/2)" },
      { label: "Rouse number", formula: "Z = w_s / (κ u*)" },
      { label: "Shields parameter", formula: "τ* = τ₀ / ((ρ_s − ρ) g d)" },
    ],
    assumptions: [
      "Equilibrium transport (supply = capacity).",
      "Uniform grain size representative of bed material.",
    ],
    limitations: [
      "Predicted vs measured transport routinely differs by a factor of 2–10.",
    ],
    parameters: [
      { symbol: "τ*", name: "Shields stress", range: "0.03 – 1" },
      { symbol: "Z", name: "Rouse number", range: "< 0.8 wash, 0.8–2.5 suspended, > 2.5 bedload" },
    ],
    references: [
      { citation: "García, M.H., ed. (2008). Sedimentation Engineering, ASCE Manual 110" },
      PONCE("sediment.html", "Ponce, V.M. — Sediment Transport"),
    ],
  },

  "form-friction": {
    title: "Form vs. Grain Friction Decomposition",
    summary:
      "Decomposes total bed shear stress into a grain (skin) component responsible for sediment transport and a form (bedform) component associated with bedform drag.",
    equations: [
      { label: "Total stress", formula: "τ = τ' + τ''" },
      { label: "Einstein–Barbarossa partition", formula: "u/u*' = f₁(R'/d₆₅);  u/u*'' = f₂(ψ')" },
    ],
    assumptions: [
      "Linear superposition of grain and form resistance.",
      "Bedforms are in equilibrium with flow.",
    ],
    limitations: [
      "Decomposition is empirical and varies between methods (Einstein, Engelund, Van Rijn).",
    ],
    parameters: [
      { symbol: "τ'/τ", name: "Grain stress fraction", range: "0.1 – 1" },
    ],
    references: [
      { citation: "Einstein, H.A. & Barbarossa, N.L. (1952). River channel roughness. Trans. ASCE 117" },
      { citation: "Van Rijn, L.C. (1984). Sediment transport — Part III: Bed forms and alluvial roughness. J. Hyd. Eng. 110" },
    ],
  },

  "et-calculator": {
    title: "Evapotranspiration (Penman–Monteith / Priestley–Taylor)",
    summary:
      "Reference ET estimation methods combining radiation and aerodynamic terms.",
    equations: [
      { label: "FAO-56 Penman–Monteith", formula: "ET₀ = [0.408 Δ (Rn − G) + γ · 900/(T+273) · u₂ (e_s − e_a)] / [Δ + γ (1 + 0.34 u₂)]" },
      { label: "Priestley–Taylor", formula: "ET = α · Δ/(Δ+γ) · (Rn − G) / λ,  α ≈ 1.26" },
    ],
    assumptions: [
      "Reference surface: 0.12 m grass, albedo 0.23, surface resistance 70 s/m (FAO-56).",
      "Priestley–Taylor: well-watered conditions, advection-free." ,
    ],
    limitations: [
      "Actual ET requires crop coefficients (K_c) or soil-moisture stress factors.",
    ],
    parameters: [
      { symbol: "α", name: "Priestley–Taylor coefficient", range: "1.0 – 1.3" },
      { symbol: "u₂", name: "Wind speed at 2 m", range: "0.5 – 10", units: "m/s" },
    ],
    references: [
      { citation: "Allen, R.G. et al. (1998). Crop evapotranspiration — Guidelines. FAO Irrigation & Drainage Paper 56" },
      { citation: "Priestley, C.H.B. & Taylor, R.J. (1972). Mon. Weather Rev. 100" },
    ],
  },

  "environmental-flow": {
    title: "Environmental Flow Requirements",
    summary:
      "Methods (Tennant/Montana, wetted-perimeter, IFIM/PHABSIM, holistic) for determining flows required to sustain freshwater ecosystems.",
    equations: [
      { label: "Tennant method", formula: "EF = f · MAF,  f = 0.10 (poor) – 0.60 (outstanding)" },
    ],
    assumptions: [
      "MAF (mean annual flow) is representative of natural conditions.",
      "Ecosystem responds to magnitude alone (Tennant); other methods relax this." ,
    ],
    limitations: [
      "Tennant ignores timing, frequency, duration, rate of change — use ELOHA / building-block for full regime.",
    ],
    parameters: [
      { symbol: "EF/MAF", name: "Environmental flow fraction", range: "0.10 – 0.60" },
    ],
    references: [
      { citation: "Tennant, D.L. (1976). Instream flow regimens for fish, wildlife, recreation and related environmental resources. Fisheries 1(4)" },
      { citation: "Poff, N.L. et al. (2010). The ecological limits of hydrologic alteration (ELOHA). Freshwater Biology 55" },
    ],
  },

  "froude-explorer": {
    title: "Froude Number & Flow Regime",
    summary:
      "Dimensionless ratio of inertial to gravitational forces that classifies open-channel flow as subcritical (Fr<1), critical (Fr=1), or supercritical (Fr>1).",
    equations: [
      { label: "Froude number", formula: "Fr = V / √(g D),  D = A/T" },
      { label: "Hydraulic-jump depth ratio", formula: "y₂/y₁ = ½ (√(1 + 8 Fr₁²) − 1)" },
    ],
    assumptions: [
      "Hydrostatic pressure, 1-D flow.",
    ],
    limitations: [
      "D = A/T assumes prismatic section; complex sections need full energy analysis.",
    ],
    parameters: [
      { symbol: "Fr", name: "Froude", range: "0.1 – 5" },
    ],
    references: [
      { citation: "Chow, V.T. (1959). Open-Channel Hydraulics, Ch. 1, 3" },
    ],
  },

  "culvert-hydraulics": {
    title: "Culvert Hydraulics (Inlet vs. Outlet Control)",
    summary:
      "Determines whether culvert capacity is limited by the inlet geometry (inlet control) or by barrel friction and tailwater (outlet control). Design is governed by the lower capacity.",
    equations: [
      { label: "Inlet control (submerged)", formula: "Q = C_d A √(2 g (HW − D/2))" },
      { label: "Outlet control", formula: "HW = TW + (1 + K_e + 29 n² L / R^(4/3)) · V²/2g" },
    ],
    assumptions: [
      "Steady flow at design discharge.",
      "Standard entrance loss coefficient K_e from FHWA HDS-5 tables.",
    ],
    limitations: [
      "Transitional flows near HW/D ≈ 1.2 – 1.5 are uncertain; design conservatively.",
    ],
    parameters: [
      { symbol: "HW/D", name: "Headwater ratio", range: "≤ 1.5", note: "Higher values risk roadway overtopping" },
      { symbol: "n", name: "Barrel roughness", range: "0.012 – 0.024" },
    ],
    references: [
      { citation: "FHWA HDS-5 (2012). Hydraulic Design of Highway Culverts, 3rd ed." },
    ],
  },

  "tractive-force": {
    title: "Tractive Force Method",
    summary:
      "Channel sizing based on the requirement that boundary shear stress not exceed the permissible value for the bank/bed material.",
    equations: [
      { label: "Average bed shear", formula: "τ₀ = γ R S" },
      { label: "Bank shear factor", formula: "τ_b ≈ 0.76 τ₀ (trapezoidal)" },
      { label: "Side-slope reduction", formula: "K = √(1 − sin² φ / sin² θ)" },
    ],
    assumptions: [
      "Cohesionless material with internal friction angle φ.",
      "Side-slope angle θ < φ for stability." ,
    ],
    limitations: [
      "Cohesive soils require different (USBR / Chow) criteria.",
    ],
    parameters: [
      { symbol: "φ", name: "Angle of repose", range: "26° – 40°" },
      { symbol: "θ/φ", name: "Side slope / repose", range: "< 1" },
    ],
    references: [
      { citation: "Lane, E.W. (1955). Design of Stable Channels. Trans. ASCE 120" },
      { citation: "Chow, V.T. (1959). Open-Channel Hydraulics, Ch. 7" },
    ],
  },

  "stilling-basin": {
    title: "USBR Stilling Basin Design",
    summary:
      "Energy-dissipation basins (USBR Types II, III, IV) designed around the classical hydraulic jump.",
    equations: [
      { label: "Sequent depths", formula: "y₂/y₁ = ½ (√(1 + 8 Fr₁²) − 1)" },
      { label: "Energy loss in jump", formula: "ΔE = (y₂ − y₁)³ / (4 y₁ y₂)" },
      { label: "Jump length (Type II)", formula: "L_j ≈ 4.5 y₂" },
    ],
    assumptions: [
      "Stable jump (Fr₁ in correct range for chosen USBR type).",
      "Adequate tailwater to hold the jump within the basin." ,
    ],
    limitations: [
      "Type II for Fr₁ > 4.5 and V > 18 m/s; Type III for Fr₁ > 4.5 and V < 18 m/s; Type IV for 2.5 < Fr₁ < 4.5.",
    ],
    parameters: [
      { symbol: "Fr₁", name: "Incoming Froude", range: "1.7 – 12" },
    ],
    references: [
      { citation: "USBR (1987). Design of Small Dams, Appendix on Stilling Basins" },
      { citation: "Peterka, A.J. (1984). Hydraulic Design of Stilling Basins and Energy Dissipators. USBR EM-25" },
    ],
  },

  "channel-classification": {
    title: "Channel Classification (Slope, Pattern, Planform)",
    summary:
      "Geomorphic classification of channels by bed slope (steep/mild/horizontal/adverse), planform (straight/meandering/braided), and Rosgen stream type.",
    equations: [
      { label: "Slope categories", formula: "Steep: y_n < y_c;  Mild: y_n > y_c" },
      { label: "Braiding threshold (Leopold–Wolman)", formula: "S > 0.012 Q^(−0.44)" },
    ],
    assumptions: [
      "Long-term equilibrium morphology.",
    ],
    limitations: [
      "Empirical thresholds; transitions in classification are gradational.",
    ],
    parameters: [
      { symbol: "S", name: "Channel slope", range: "10⁻⁵ – 10⁻¹" },
    ],
    references: [
      { citation: "Rosgen, D.L. (1994). A classification of natural rivers. Catena 22" },
      { citation: "Leopold, L.B. & Wolman, M.G. (1957). River channel patterns. USGS PP 282-B" },
    ],
  },

  "gw-recharge": {
    title: "Groundwater Recharge Estimation",
    summary:
      "Methods for estimating recharge: water-table fluctuation, chloride mass balance, water budget, baseflow separation, and tracer methods.",
    equations: [
      { label: "Water-table fluctuation", formula: "R = S_y · Δh / Δt" },
      { label: "Chloride mass balance", formula: "R = P · Cl_P / Cl_gw" },
    ],
    assumptions: [
      "WTF: rise solely due to recharge (no pumping or ET losses during the period).",
      "CMB: chloride conservative, only atmospheric source, steady state." ,
    ],
    limitations: [
      "WTF over-estimates if specific yield is mis-specified; CMB invalid where halite or anthropogenic Cl is present.",
    ],
    parameters: [
      { symbol: "S_y", name: "Specific yield", range: "0.01 – 0.30" },
      { symbol: "R/P", name: "Recharge fraction", range: "0.01 – 0.40" },
    ],
    references: [
      { citation: "Healy, R.W. (2010). Estimating Groundwater Recharge. Cambridge University Press" },
      { citation: "Scanlon, B.R., Healy, R.W., Cook, P.G. (2002). Choosing appropriate techniques for quantifying recharge. Hydrogeology J. 10" },
    ],
  },

  "swmm-calculator": {
    title: "Urban Stormwater Hydraulics (SWMM-style)",
    summary:
      "Collection of urban drainage tools: gutter flow, inlet capture, pipe flow (Manning), orifice/weir, water hammer (Joukowsky), pump performance.",
    equations: [
      { label: "Gutter (modified Manning)", formula: "Q = (0.376/n) S_x^(5/3) S_L^(1/2) T^(8/3)" },
      { label: "Orifice", formula: "Q = C_d A √(2 g h)" },
      { label: "Sharp-crested weir", formula: "Q = C_w L H^(3/2)" },
      { label: "Joukowsky pressure surge", formula: "Δp = ρ a Δv" },
    ],
    assumptions: [
      "Steady flow for capacity equations; transient only for water hammer.",
      "Free-surface flow in gutters and most conduits.",
    ],
    limitations: [
      "Surcharged pipe networks require full SWMM simulation, not these spreadsheet-style tools.",
    ],
    parameters: [
      { symbol: "n", name: "Pipe roughness", range: "0.011 – 0.024" },
      { symbol: "C_d", name: "Orifice coefficient", range: "0.60 – 0.65" },
      { symbol: "a", name: "Pressure wave speed", range: "800 – 1400", units: "m/s" },
    ],
    references: [
      { citation: "Rossman, L.A. (2015). Storm Water Management Model Reference Manual, US EPA" },
      { citation: "FHWA HEC-22 (2009). Urban Drainage Design Manual, 3rd ed." },
    ],
  },
};

/** Worked examples (input → output). Stored separately so the main registry stays compact. */
const MODULE_EXAMPLES: Record<string, TheoryExample[]> = {
  "cn-calculator": [
    {
      title: "Suburban storm (CN = 80, P = 75 mm)",
      description: "Standard SCS computation with Iₐ = 0.2 S [1].",
      inputs: [
        { label: "Curve Number (CN)", value: "80" },
        { label: "Storm rainfall P", value: "75", units: "mm" },
        { label: "AMC class", value: "II" },
      ],
      outputs: [
        { label: "S = 25400/CN − 254", value: "63.5", units: "mm" },
        { label: "Iₐ = 0.2 S", value: "12.7", units: "mm" },
        { label: "Runoff Q", value: "30.4", units: "mm" },
        { label: "Runoff coefficient Q/P", value: "0.41" },
      ],
    },
    {
      title: "Dry-antecedent forest (CN = 55 → CN(I) = 35)",
      description: "Apply AMC I adjustment, then run the SCS equation [2].",
      inputs: [
        { label: "CN(II)", value: "55" },
        { label: "P", value: "50", units: "mm" },
        { label: "AMC class", value: "I (dry)" },
      ],
      outputs: [
        { label: "CN(I)", value: "35" },
        { label: "S", value: "471.7", units: "mm" },
        { label: "Iₐ", value: "94.3", units: "mm" },
        { label: "Runoff Q", value: "0", units: "mm", note: "P < Iₐ → no runoff" },
      ],
    },
    {
      title: "Wet urban catchment (CN = 92, P = 120 mm)",
      inputs: [
        { label: "CN(II)", value: "92" },
        { label: "P", value: "120", units: "mm" },
        { label: "AMC class", value: "III (wet)" },
      ],
      outputs: [
        { label: "CN(III)", value: "96.4" },
        { label: "S", value: "9.5", units: "mm" },
        { label: "Q", value: "108.8", units: "mm" },
        { label: "Q/P", value: "0.91" },
      ],
    },
  ],

  "muskingum-routing": [
    {
      title: "Wide channel, mild slope",
      description: "Compute Muskingum–Cunge parameters for a single reach [1].",
      inputs: [
        { label: "Reach length Δx", value: "5000", units: "m" },
        { label: "Bed slope S₀", value: "0.0008" },
        { label: "Wave celerity c", value: "1.4", units: "m/s" },
        { label: "Unit discharge q", value: "2.5", units: "m²/s" },
        { label: "Time step Δt", value: "900", units: "s" },
      ],
      outputs: [
        { label: "Travel time K = Δx/c", value: "3571", units: "s" },
        { label: "Weighting X", value: "0.27" },
        { label: "Courant C", value: "0.252" },
        { label: "Cell Reynolds D", value: "0.625" },
        { label: "C + D", value: "0.88", note: "Near grid-independence target ≈ 1" },
      ],
    },
    {
      title: "Steep channel — translation-dominated",
      inputs: [
        { label: "Δx", value: "2000", units: "m" },
        { label: "S₀", value: "0.01" },
        { label: "c", value: "3.0", units: "m/s" },
        { label: "q", value: "4.0", units: "m²/s" },
        { label: "Δt", value: "300", units: "s" },
      ],
      outputs: [
        { label: "K", value: "667", units: "s" },
        { label: "X", value: "0.467", note: "→ 0.5 = pure translation" },
        { label: "C", value: "0.45" },
        { label: "D", value: "0.067" },
      ],
    },
  ],

  "channel-design": [
    {
      title: "Lacey regime canal (Q = 50 m³/s, f = 1.0)",
      description: "Stable alluvial dimensions from Lacey's regime equations [3].",
      inputs: [
        { label: "Design discharge Q", value: "50", units: "m³/s" },
        { label: "Silt factor f", value: "1.0" },
      ],
      outputs: [
        { label: "Wetted perimeter P = 4.75√Q", value: "33.6", units: "m" },
        { label: "Hydraulic radius R = 0.47 (Q/f)^(1/3)", value: "1.73", units: "m" },
        { label: "Approx. depth", value: "1.5", units: "m" },
      ],
    },
    {
      title: "Tractive force check on gravel bed",
      description: "Shields-based non-erosion check [2].",
      inputs: [
        { label: "Hydraulic radius R", value: "1.2", units: "m" },
        { label: "Slope S", value: "0.0012" },
        { label: "d₅₀", value: "20", units: "mm" },
        { label: "θ_c", value: "0.047" },
      ],
      outputs: [
        { label: "τ₀ = γRS", value: "14.1", units: "N/m²" },
        { label: "τ_c (Shields)", value: "15.3", units: "N/m²" },
        { label: "Verdict", value: "Stable", note: "τ₀ < τ_c" },
      ],
    },
  ],

  "manning-rating": [
    {
      title: "Trapezoidal concrete channel",
      description: "Compute Q at y = 1.5 m using Manning [1].",
      inputs: [
        { label: "Bottom width b", value: "3.0", units: "m" },
        { label: "Side slope z", value: "1.5" },
        { label: "Depth y", value: "1.5", units: "m" },
        { label: "n", value: "0.013" },
        { label: "S", value: "0.001" },
      ],
      outputs: [
        { label: "Area A", value: "7.875", units: "m²" },
        { label: "Wetted perimeter P", value: "8.41", units: "m" },
        { label: "R = A/P", value: "0.936", units: "m" },
        { label: "Discharge Q", value: "18.0", units: "m³/s" },
      ],
    },
    {
      title: "Vegetated floodplain",
      inputs: [
        { label: "Depth y", value: "0.8", units: "m" },
        { label: "Width (rectangular)", value: "50", units: "m" },
        { label: "n", value: "0.07" },
        { label: "S", value: "0.0005" },
      ],
      outputs: [
        { label: "R ≈ y", value: "0.78", units: "m" },
        { label: "Q", value: "13.7", units: "m³/s" },
        { label: "V", value: "0.34", units: "m/s" },
      ],
    },
  ],

  groundwater: [
    {
      title: "Sustainable yield check",
      description: "Annual water-balance sanity check [1].",
      inputs: [
        { label: "Recharge R", value: "120", units: "mm/yr" },
        { label: "Baseflow Q_b,min", value: "30", units: "mm/yr" },
        { label: "Phreatic ET", value: "10", units: "mm/yr" },
      ],
      outputs: [
        { label: "Max sustainable pumping", value: "80", units: "mm/yr" },
        { label: "Verdict @ 100 mm/yr pump", value: "Overdraft" },
      ],
    },
    {
      title: "Storage decline from overdraft",
      inputs: [
        { label: "Specific yield Sy", value: "0.15" },
        { label: "Annual deficit", value: "20", units: "mm/yr" },
        { label: "Aquifer area", value: "100", units: "km²" },
      ],
      outputs: [
        { label: "Volume lost / yr", value: "2.0", units: "Mm³" },
        { label: "Head decline / yr", value: "133", units: "mm" },
      ],
    },
  ],

  "unit-hydrograph": [
    {
      title: "SCS dimensionless UH peak",
      description: "Peak discharge for a 50 km² basin [1].",
      inputs: [
        { label: "Area A", value: "50", units: "km²" },
        { label: "Time-to-peak T_p", value: "3.5", units: "h" },
      ],
      outputs: [
        { label: "q_p (metric, 0.208 A/T_p)", value: "2.97", units: "m³/s per mm" },
        { label: "Base time t_b ≈ 2.67 T_p", value: "9.35", units: "h" },
      ],
    },
    {
      title: "Convolution of 3-pulse hyetograph",
      inputs: [
        { label: "Effective rainfall pulses", value: "10, 25, 8", units: "mm" },
        { label: "UH ordinates (Δt = 1 h)", value: "0, 2, 5, 3, 1", units: "m³/s per mm" },
      ],
      outputs: [
        { label: "Peak Q", value: "180", units: "m³/s" },
        { label: "Peak time", value: "3", units: "h after start" },
      ],
    },
  ],
};

export const getTheory = (slug: string | undefined): ModuleTheory | null => {
  if (!slug) return null;
  const base = MODULE_THEORY[slug];
  if (!base) return null;
  return base.examples ? base : { ...base, examples: MODULE_EXAMPLES[slug] };
};

