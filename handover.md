# Ponce Hydrology Lab — Comprehensive Handover Document

> **Last updated:** April 2026  
> **Stack:** React 18 + TypeScript 5 + Vite 5 + Tailwind CSS 3 + shadcn/ui  
> **Live URL:** [aquifer-quest-zone.lovable.app](https://aquifer-quest-zone.lovable.app)  
> **Attribution:** All scientific content is based on the work of **Prof. Victor Miguel Ponce**, San Diego State University — [ponce.sdsu.edu](https://ponce.sdsu.edu)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Tech Stack](#2-architecture--tech-stack)
3. [Project Structure](#3-project-structure)
4. [Routing & Navigation](#4-routing--navigation)
5. [Design System & Theming](#5-design-system--theming)
6. [University Theme System](#6-university-theme-system)
7. [Landing Page Components](#7-landing-page-components)
8. [Module Catalog — All 33 Modules](#8-module-catalog--all-33-modules)
9. [Documentation System](#9-documentation-system)
10. [State Management](#10-state-management)
11. [Extracted Calculation Libraries](#11-extracted-calculation-libraries)
12. [Animations & Visual Effects](#12-animations--visual-effects)
13. [Dark Mode](#13-dark-mode)
14. [Dependencies](#14-dependencies)
15. [Testing](#15-testing)
16. [Known Considerations & Future Work](#16-known-considerations--future-work)
17. [Project Evaluation & Scorecard](#17-project-evaluation--scorecard)

---

## 1. Project Overview

**Ponce Hydrology Lab** is a client-side educational web application that teaches hydrology and hydraulics through interactive calculators, simulators, and visualizations. It is inspired by the extensive web-based resources created by Prof. Victor Miguel Ponce at San Diego State University.

### Core Features
- **33 interactive modules** spanning 11 hydrological domains
- **Calculator Hub** — searchable, filterable discovery portal for all modules
- **Workflow Builder** — chain calculators to model multi-step hydrological processes
- **Nutshells Knowledge Graph** — 60+ interconnected concepts with equations and links
- **Video Lecture Companion** — synchronized diagrams that update with lecture content
- **Guided learning paths** for beginners, practitioners, and researchers
- **Integrated documentation** with theory, equations, and references
- **6 university/agency color themes** (Ponce Lab, SDSU, UF, OSU, Auburn, EPA)
- **Dark/light mode** toggle with full design system support
- **Fully client-side** — no backend, no database, no authentication
- **Responsive design** for desktop, tablet, and mobile

### Target Audience
- Hydrology and civil engineering students
- Practicing civil/environmental engineers
- Researchers exploring eco-hydrology and hydrogeomorphology

### Key Statistics
- **33 interactive module components** totaling ~11,750 lines of code
- **3 extracted calculation libraries** with unit tests
- **11 domain categories** with periodic-table-style organization
- **6 color themes** for institutional branding

---

## 2. Architecture & Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React 18.3 | UI rendering with hooks-based architecture |
| **Language** | TypeScript 5.8 | Type safety across all components |
| **Build Tool** | Vite 5.4 | Fast dev server, HMR, production bundling |
| **Styling** | Tailwind CSS 3.4 + tailwindcss-animate | Utility-first CSS with animation primitives |
| **UI Components** | shadcn/ui (Radix UI primitives) | Accessible, composable component library |
| **Charts** | Recharts 2.15 | SVG-based charting for data visualization |
| **Icons** | Lucide React 0.462 | Consistent iconography |
| **Routing** | React Router DOM 6.30 | Client-side routing with URL-based module navigation |
| **State** | React useState/useMemo | Local component state only (no global store) |
| **Testing** | Vitest 3.2 + Testing Library | Unit/component testing |

### Key Architectural Decisions
- **No backend:** All calculations run client-side in the browser. No data persistence beyond theme preference.
- **No global state:** Each module manages its own state independently via React hooks.
- **URL-based module routing:** Each module has its own route (`/modules/:moduleId`) via `ModulePage.tsx`, enabling deep-linking and sharing.
- **Domain-grouped catalog:** Modules are organized into 11 scientific domains with a periodic-table-style layout.
- **Extracted calculation libraries:** Core scientific formulas for CN method, Muskingum routing, and Saint-Venant equations are in testable `src/lib/hydrology/` modules.

---

## 3. Project Structure

```
src/
├── main.tsx                          # React entry point
├── App.tsx                           # Router setup, providers (QueryClient, Tooltip, Toasters)
├── App.css                           # (minimal/unused legacy styles)
├── index.css                         # Design system: CSS variables, fonts, animations, theme overrides
├── vite-env.d.ts                     # Vite type declarations
│
├── pages/
│   ├── Index.tsx                     # Landing page (Hero, GettingStarted, ModulesSection, Footer)
│   ├── ModulePage.tsx                # Dynamic module renderer — maps :moduleId to 33 module components
│   └── NotFound.tsx                  # 404 catch-all route
│
├── components/
│   ├── Header.tsx             (159 lines)  # Fixed nav with logo, links, theme selector, dark/light toggle, mobile menu
│   ├── Hero.tsx               (90 lines)   # Landing hero with animated water effects
│   ├── WaterWaves.tsx         (36 lines)   # SVG wave animation at bottom of hero
│   ├── GettingStarted.tsx     (205 lines)  # Tutorial section with learning paths
│   ├── ModulesSection.tsx     (180 lines)  # Domain-grouped module catalog (11 domains)
│   ├── ModuleCard.tsx         (113 lines)  # Individual module card with hover effects
│   ├── CalculatorHub.tsx      (187 lines)  # Searchable/filterable calculator discovery portal
│   ├── NavLink.tsx                         # React Router NavLink wrapper
│   ├── Footer.tsx             (84 lines)   # Site footer with attribution
│   ├── Documentation.tsx      (817 lines)  # Tabbed documentation viewer
│   │
│   │── ── Engineering Hydrology ──
│   ├── CNCalculator.tsx       (435 lines)  # SCS Curve Number Calculator
│   ├── CNMethodComparison.tsx (166 lines)  # CN vs Green-Ampt vs Horton comparison
│   ├── UnitHydrographBuilder.tsx (169 lines) # Storm hydrograph via superposition
│   ├── RationalMethodCalculator.tsx (158 lines) # Q=CiA with IDF curves
│   ├── FloodFrequencyAnalysis.tsx (119 lines) # Gumbel, Log-Pearson III distributions
│   ├── MuskingumSimulator.tsx (400 lines)  # Muskingum-Cunge flood routing
│   │
│   │── ── Open-Channel Hydraulics ──
│   ├── ManningRatingCurve.tsx (311 lines)  # Interactive cross-section with rating curves
│   ├── SpecificEnergyMomentum.tsx (278 lines) # E-y and M-y diagrams
│   ├── GVFProfileClassifier.tsx (190 lines) # 12 water surface profile types
│   ├── FroudeNumberExplorer.tsx (139 lines) # Sub/supercritical flow visualization
│   ├── CulvertAnalyzer.tsx    (101 lines)  # Culvert flow control analysis
│   │
│   │── ── Hydromechanics ──
│   ├── SaintVenantVisualizer.tsx (534 lines) # Toggle equation terms for wave behavior
│   ├── WavePropagationLab.tsx (150 lines)  # Kinematic vs dynamic wave celerity
│   ├── VedernikovRollWave.tsx (147 lines)  # Roll wave stability threshold
│   │
│   │── ── Hydrogeology ──
│   ├── GroundwaterSimulator.tsx (544 lines) # Aquifer management game
│   ├── TheisWellCalculator.tsx (162 lines) # Cone of depression calculator
│   ├── BaseflowRecession.tsx  (118 lines)  # Exponential recession curves
│   ├── GWRechargeCalculator.tsx (243 lines) # Catchment wetting method
│   │
│   │── ── Hydrogeomorphology ──
│   ├── StableChannelWizard.tsx (640 lines) # Non-eroding channel design
│   ├── TractiveForceWizard.tsx (384 lines) # 5-step stable channel via shear stress
│   ├── LanesBalance.tsx       (133 lines)  # QₛD₅₀ ∝ QwS sediment equilibrium
│   ├── ChannelClassification.tsx (207 lines) # Rosgen stream classification tree
│   │
│   │── ── Hydrosedimentology ──
│   ├── SedimentTransportCalculator.tsx (98 lines) # Meyer-Peter-Müller, Engelund-Hansen, Yang
│   ├── FormFrictionDecomposer.tsx (105 lines) # n_grain + n_form decomposition
│   │
│   │── ── Hydroclimatology ──
│   ├── AlbedoWaterBalance.tsx (644 lines)  # Energy balance and albedo effects
│   ├── ETCalculatorSuite.tsx  (102 lines)  # 5 ET methods compared
│   │
│   │── ── Hydroecology & Water Balance ──
│   ├── CatchmentWaterBalance.tsx (177 lines) # P = ET + Qs + Qb + ΔS
│   ├── HydroEcologicalTracker.tsx (473 lines) # Land use → ecosystem impact SVG
│   ├── EnvironmentalFlowCalculator.tsx (89 lines) # Tennant, BBM, RVA methods
│   │
│   │── ── Hydraulic Structures ──
│   ├── SpillwayDesigner.tsx   (85 lines)   # WES ogee spillway profile
│   ├── StillingBasinDesigner.tsx (222 lines) # USBR hydraulic jump basin
│   │
│   │── ── Urban Stormwater (SWMM) ──
│   ├── SWMMCalculator.tsx     (1068 lines) # 6-tab urban hydraulics suite
│   │
│   │── ── Learning & Platform ──
│   ├── WorkflowBuilder.tsx    (282 lines)  # Chain calculators in workflows
│   ├── NutshellsGraph.tsx     (340 lines)  # 60+ concept knowledge graph
│   ├── VideoLectureCompanion.tsx (442 lines) # Synchronized lecture diagrams
│   │
│   └── ui/                               # shadcn/ui component library (~50+ files)
│       ├── button.tsx, card.tsx, slider.tsx, select.tsx, tabs.tsx, ...
│
├── hooks/
│   ├── use-mobile.tsx                    # Mobile breakpoint detection hook
│   └── use-toast.ts                      # Toast notification hook
│
├── lib/
│   ├── utils.ts                          # cn() utility for className merging
│   └── hydrology/
│       ├── cn-method.ts       (11,431 B) # Extracted CN calculation logic
│       ├── muskingum.ts       (9,100 B)  # Extracted Muskingum routing logic
│       ├── saint-venant.ts    (10,826 B) # Extracted Saint-Venant wave equations
│       └── __tests__/
│           ├── cn-method.test.ts         # CN method unit tests
│           ├── muskingum.test.ts         # Muskingum routing unit tests
│           └── saint-venant.test.ts      # Saint-Venant unit tests
│
├── test/
│   ├── setup.ts                          # Vitest setup (jest-dom matchers)
│   └── example.test.ts                   # Example test file
│
├── public/
│   ├── placeholder.svg
│   └── robots.txt
│
├── tailwind.config.ts                    # Tailwind config with custom water theme
├── vite.config.ts                        # Vite configuration
├── vitest.config.ts                      # Vitest configuration
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── components.json                       # shadcn/ui configuration
└── package.json
```

---

## 4. Routing & Navigation

### URL Routes (React Router)

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Index` | Landing page (Hero, GettingStarted, ModulesSection, Footer) |
| `/modules/:moduleId` | `ModulePage` | Dynamic module renderer (33 modules) |
| `*` | `NotFound` | 404 catch-all |

### Complete Module ID → Component Mapping

| Module ID | Component | Domain |
|-----------|-----------|--------|
| `cn-calculator` | CNCalculator | Engineering Hydrology |
| `unit-hydrograph` | UnitHydrographBuilder | Engineering Hydrology |
| `rational-method` | RationalMethodCalculator | Engineering Hydrology |
| `flood-frequency` | FloodFrequencyAnalysis | Engineering Hydrology |
| `muskingum-routing` | MuskingumSimulator | Engineering Hydrology |
| `manning-rating` | ManningRatingCurve | Open-Channel Hydraulics |
| `specific-energy` | SpecificEnergyMomentum | Open-Channel Hydraulics |
| `gvf-profiles` | GVFProfileClassifier | Open-Channel Hydraulics |
| `froude-explorer` | FroudeNumberExplorer | Open-Channel Hydraulics |
| `culvert-hydraulics` | CulvertAnalyzer | Open-Channel Hydraulics |
| `saint-venant` | SaintVenantVisualizer | Hydromechanics |
| `wave-propagation` | WavePropagationLab | Hydromechanics |
| `vedernikov` | VedernikovRollWave | Hydromechanics |
| `groundwater` | GroundwaterSimulator | Hydrogeology |
| `theis-well` | TheisWellCalculator | Hydrogeology |
| `baseflow-recession` | BaseflowRecession | Hydrogeology |
| `gw-recharge` | GWRechargeCalculator | Hydrogeology |
| `channel-design` | StableChannelWizard | Hydrogeomorphology |
| `tractive-force` | TractiveForceWizard | Hydrogeomorphology |
| `lanes-balance` | LanesBalance | Hydrogeomorphology |
| `channel-classification` | ChannelClassification | Hydrogeomorphology |
| `sediment-transport` | SedimentTransportCalculator | Hydrosedimentology |
| `form-friction` | FormFrictionDecomposer | Hydrosedimentology |
| `albedo` | AlbedoWaterBalance | Hydroclimatology |
| `et-calculator` | ETCalculatorSuite | Hydroclimatology |
| `catchment-water-balance` | CatchmentWaterBalance | Hydroecology & Water Balance |
| `hydroecology` | HydroEcologicalTracker | Hydroecology & Water Balance |
| `environmental-flow` | EnvironmentalFlowCalculator | Hydroecology & Water Balance |
| `spillway-design` | SpillwayDesigner | Hydraulic Structures |
| `stilling-basin` | StillingBasinDesigner | Hydraulic Structures |
| `swmm-calculator` | SWMMCalculator | Urban Stormwater (SWMM) |
| `workflow-builder` | WorkflowBuilder | Learning & Platform |
| `nutshells-graph` | NutshellsGraph | Learning & Platform |
| `video-lectures` | VideoLectureCompanion | Learning & Platform |
| `calculator-hub` | CalculatorHub | Learning & Platform |
| `documentation` | Documentation | Reference |

### ModulePage (`src/pages/ModulePage.tsx`)
- Reads `:moduleId` from URL params via `useParams()`
- Looks up the component from a `moduleComponents` record mapping IDs to React components
- If the module ID is invalid, renders a "Module Not Found" page with a link back to home
- Close/back button navigates to `/` via `useNavigate()`
- Docs link navigates to `/modules/documentation`

### Header Behavior
- Receives `isCalculatorOpen` boolean (true when any module is active)
- Landing page: transparent header, light text over hero gradient
- Module pages: solid background with backdrop blur, standard foreground text
- Theme selector dropdown (6 themes) and dark/light toggle always visible

---

## 5. Design System & Theming

### Typography
- **Display font:** `Playfair Display` (weights 600, 700, 800) — h1, h2, h3 headings
- **Body font:** `Inter` (weights 400, 500, 600, 700, 800) — all body text
- Headings: `font-weight: 800` (extra-bold)
- Body text: `font-weight: 500` (medium)
- Loaded via Google Fonts CDN in `index.css`

### Color System (HSL CSS Variables)

#### Light Mode Core
| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--background` | `210 40% 98%` | Page background |
| `--foreground` | `210 50% 10%` | Primary text |
| `--primary` | `205 85% 35%` | Deep ocean blue — buttons, links |
| `--secondary` | `200 60% 94%` | Soft sky blue backgrounds |
| `--accent` | `180 65% 40%` | Teal accents |
| `--muted` | `210 30% 95%` | Subtle backgrounds |
| `--destructive` | `0 84.2% 60.2%` | Error/danger states |

#### Water Theme Colors
| Token | Usage |
|-------|-------|
| `--water-deep` | Deep water, dark backgrounds |
| `--water-medium` | Mid-tone water elements |
| `--water-light` | Light highlights, badges |
| `--water-surface` | Reflective surfaces |
| `--water-foam` | Near-white text on dark backgrounds |

#### Earth Colors
| Token | Usage |
|-------|-------|
| `--earth-brown` | Soil, channel materials |
| `--earth-green` | Vegetation elements |
| `--earth-sand` | Sandy surfaces |

#### Custom Gradients
| Variable | Description |
|----------|-------------|
| `--gradient-water` | 135° blue gradient for buttons/badges |
| `--gradient-ocean` | Vertical deep-to-medium blue |
| `--gradient-sky` | Vertical light blue to white |
| `--gradient-hero` | Hero section background (dark blue to teal) |

#### Custom Shadows
| Variable | Description |
|----------|-------------|
| `--shadow-water` | Blue-tinted shadow for water-themed elements |
| `--shadow-card` | Subtle card shadow |
| `--shadow-elevated` | Deeper shadow for hovered/elevated cards |

### Tailwind Extensions (tailwind.config.ts)
- Custom `fontFamily`: `sans` (Inter), `display` (Playfair Display)
- Custom `colors`: All CSS variables mapped to Tailwind classes (`water-deep`, `earth-brown`, etc.)
- Custom `keyframes`: `fade-in`, `slide-in-right`, `scale-in`
- Custom `animation`: Preset durations and easings
- Custom `boxShadow`: `water`, `card`, `elevated`

### CSS Utility Classes (index.css)
| Class | Description |
|-------|-------------|
| `.water-gradient` | Applies `--gradient-water` background |
| `.hero-gradient` | Applies `--gradient-hero` background |
| `.card-water` | Card with border and shadow |
| `.card-elevated` | Card with elevated shadow |
| `.text-gradient-water` | Gradient text effect |
| `.btn-water` | Water-themed button with gradient and shadow |
| `.water-card` | Card with gradient border glow on hover |
| `.animate-wave` | 4s wave motion |
| `.animate-float` | 6s vertical bobbing |
| `.animate-ripple` | 2s expanding ripple |
| `.animate-flow` | 8s gradient position animation |

---

## 6. University Theme System

The app supports **6 color themes** that re-brand the entire interface with institutional colors. Themes are selected via a dropdown in the header and persisted in `localStorage` under the key `uni-theme`.

### Implementation
- **CSS approach:** Theme classes (`.theme-sdsu`, `.theme-uf`, etc.) are defined **outside `@layer base`** in `index.css` to ensure they properly override `:root` CSS variables.
- **JavaScript:** `Header.tsx` applies theme classes to both `document.documentElement` and `document.body` via a `useEffect` triggered by `themeId` state changes.
- **Persistence:** Theme ID stored in `localStorage("uni-theme")`.
- **State initialization:** Read from localStorage on component mount.

### Available Themes

| Theme ID | Label | Primary Color | Accent |
|----------|-------|--------------|--------|
| `default` | Ponce Lab | `205 85% 35%` (ocean blue) | `180 65% 40%` (teal) |
| `sdsu` | San Diego State | `0 100% 30%` (scarlet) | `0 0% 15%` (black) |
| `uf` | U. of Florida | `24 100% 50%` (orange) | `220 100% 30%` (blue) |
| `osu` | Oregon State | `16 100% 40%` (beaver orange) | `0 0% 20%` (dark) |
| `auburn` | Auburn University | `22 80% 35%` (burnt orange) | `220 60% 30%` (navy) |
| `epa` | EPA | `210 70% 35%` (EPA blue) | `145 50% 38%` (EPA green) |

### What Each Theme Overrides
Each theme class overrides these CSS variables:
- `--primary`, `--primary-foreground`
- `--accent`, `--accent-foreground`
- `--water-deep`, `--water-medium`, `--water-light`
- `--gradient-water`, `--gradient-hero`
- `--shadow-water`, `--ring`

This means **every element** using semantic design tokens (buttons, cards, sliders, badges, hero gradient, logo background, charts) automatically adapts to the selected theme.

### Technical Note
Theme CSS classes must be placed **outside** `@layer base` in the CSS file. When placed inside the layer, CSS specificity rules prevent them from overriding `:root` variables defined in the same layer. This was a critical fix — without it, themes appear selected in the dropdown but have no visual effect.

---

## 7. Landing Page Components

### Hero (`Hero.tsx`, 90 lines)
- Full-viewport section with `hero-gradient` background
- Floating water droplet icons with staggered `animate-float` animations
- Badge: "Interactive Hydrology Education"
- Title: "Ponce Hydrology Lab" (h1, Playfair Display, responsive 5xl–8xl)
- Subtitle mentioning Prof. Victor Miguel Ponce
- Two CTAs: "Explore Modules" (scrolls to #modules), "Learn More"
- Stats row: 380+ Concepts, 6 Modules, ∞ Learning
- `WaterWaves` SVG animation at bottom

### WaterWaves (`WaterWaves.tsx`, 36 lines)
- Three layered SVG `<path>` elements creating an animated wave effect
- Front wave uses `--background` color to blend into the page
- Absolutely positioned at bottom of hero

### GettingStarted (`GettingStarted.tsx`, 205 lines)
- **Quick Tips** section: 3 cards (Interactive Learning, Real Scenarios, Theory)
- **Learning Paths**: 3 structured paths
  - **Hydrology Fundamentals** (Beginner, ~30 min): CN Calculator → Flood Routing → Theory
  - **Engineering Applications** (Practitioner, ~45 min): Channel Design → Groundwater → Energy Balance
  - **Eco-Hydrology Focus** (Researcher, ~40 min): Albedo → Impact Tracker → Aquifer Game
- First-Time Recommendation banner suggesting CN Calculator

### ModulesSection (`ModulesSection.tsx`, 180 lines)
- **11 domain groups** displayed with headers and descriptions
- Each domain contains 1–5 module cards in a responsive grid (1–4 columns)
- Total module count dynamically computed
- "Open Calculator Hub" button links to the searchable hub

### ModuleCard (`ModuleCard.tsx`, 113 lines)
- 4 color schemes (`blue`, `teal`, `green`, `amber`) with matched styling
- Hover effects: lift, shadow increase, colored glow, icon scale
- Staggered `animate-fade-in` entrance

### Footer (`Footer.tsx`, 84 lines)
- 3-column layout: Brand description, Resource links, About/attribution
- Links to ponce.sdsu.edu resources
- Disclaimer: "Not affiliated with SDSU. For educational purposes only."

---

## 8. Module Catalog — All 33 Modules

All modules follow a common pattern:
- Accept `onClose: () => void` prop
- Back button (ArrowLeft) that calls `onClose()`
- `useState` for inputs, `useMemo` for derived calculations
- Results via Recharts charts and/or custom SVG visualizations
- Reference ponce.sdsu.edu as authoritative source

### 8.1 Engineering Hydrology (5 modules)

#### SCS Curve Number Calculator (`CNCalculator.tsx`, 435 lines)
- **Inputs:** Soil group (A/B/C/D), land use, rainfall depth (slider), AMC (I/II/III)
- **Calculations:** CN lookup, AMC adjustment, S = (25400/CN) - 254, Ia = 0.2S, Q = (P-Ia)²/(P-Ia+S)
- **Outputs:** Numerical results, rainfall-runoff chart, sensitivity analysis, AMC comparison
- **Sub-component:** `CNMethodComparison.tsx` — compares SCS-CN with Green-Ampt and Horton methods

#### Unit Hydrograph Builder (`UnitHydrographBuilder.tsx`, 169 lines)
- **Inputs:** Basin area, time of concentration, rainfall pattern
- **Calculations:** SCS dimensionless UH, convolution for storm hydrograph
- **Outputs:** Hydrograph chart with peak flow and time-to-peak

#### Rational Method + IDF (`RationalMethodCalculator.tsx`, 158 lines)
- **Inputs:** Drainage area, runoff coefficient, rainfall intensity
- **Calculations:** Q = CiA with IDF curve integration, tc estimation
- **Outputs:** Peak discharge, applicability warnings for large catchments

#### Flood Frequency Analysis (`FloodFrequencyAnalysis.tsx`, 119 lines)
- **Inputs:** Annual maximum series, distribution type
- **Calculations:** Gumbel, Log-Pearson III frequency factors
- **Outputs:** Frequency curve plot, return period estimates

#### Muskingum-Cunge Routing (`MuskingumSimulator.tsx`, 400 lines)
- **Inputs:** Reach length, wave celerity, routing coefficient X, inflow hydrograph, time step
- **Calculations:** K/X parameters, C₁/C₂/C₃ routing coefficients, step-by-step outflow
- **Outputs:** Animated inflow vs outflow hydrograph, peak attenuation, playback controls

### 8.2 Open-Channel Hydraulics (5 modules)

#### Manning's Rating Curve (`ManningRatingCurve.tsx`, 311 lines)
- **Inputs:** Channel shape (rect/trap/triangular/circular/parabolic), dimensions, Manning's n, slope
- **Outputs:** Live cross-section SVG, Q-y rating curve, velocity profile, critical/normal depth markers

#### Specific Energy & Momentum (`SpecificEnergyMomentum.tsx`, 278 lines)
- **Outputs:** Side-by-side E-y and M-y diagrams, draggable conjugate depths, animated hydraulic jump

#### GVF Profile Classifier (`GVFProfileClassifier.tsx`, 190 lines)
- **Inputs:** Channel slope, normal depth, critical depth, downstream condition
- **Outputs:** Auto-classified profile type (M1/M2/M3/S1/S2/S3/C/H/A), water surface drawing

#### Froude Number Explorer (`FroudeNumberExplorer.tsx`, 139 lines)
- **Outputs:** Sub/supercritical flow transition visualization with wave propagation animation

#### Culvert Hydraulic Analyzer (`CulvertAnalyzer.tsx`, 101 lines)
- **Inputs:** Diameter, length, slope, headwater, tailwater
- **Outputs:** Flow control type determination (inlet vs outlet), discharge calculation

### 8.3 Hydromechanics (3 modules)

#### Saint-Venant Wave Explorer (`SaintVenantVisualizer.tsx`, 534 lines)
- **Inputs:** Toggle equation terms (local inertia, convective inertia, pressure gradient, friction, gravity)
- **Outputs:** Visual representation of how wave behavior changes from dynamic to kinematic

#### Wave Propagation Lab (`WavePropagationLab.tsx`, 150 lines)
- **Outputs:** Kinematic vs dynamic wave celerity comparison with animated channel visualization

#### Vedernikov & Roll Waves (`VedernikovRollWave.tsx`, 147 lines)
- **Inputs:** Channel shape, slope, friction type
- **Outputs:** Vedernikov number, stability threshold, roll wave formation region

### 8.4 Hydrogeology (4 modules)

#### Groundwater Yield Simulator (`GroundwaterSimulator.tsx`, 544 lines)
- **Inputs:** Pumping rate (slider), recharge rate, aquifer properties
- **Calculations:** Water table dynamics, storage depletion, ecosystem health index
- **Outputs:** Animated year-by-year simulation, water table depth chart, ecosystem health indicator, playback controls

#### Theis Well Drawdown (`TheisWellCalculator.tsx`, 162 lines)
- **Inputs:** Pumping rate, transmissivity, storativity, distance, time
- **Calculations:** Well function W(u), Theis equation s = Q/(4πT) × W(u)
- **Outputs:** Drawdown cone visualization, distance-drawdown table

#### Baseflow Recession Analyzer (`BaseflowRecession.tsx`, 118 lines)
- **Inputs:** Initial baseflow, recession constant
- **Outputs:** Exponential recession curve with ecosystem health thresholds

#### GW Recharge Calculator (`GWRechargeCalculator.tsx`, 243 lines)
- **Inputs:** Precipitation, soil type, vegetation cover
- **Calculations:** Catchment wetting method, φ index
- **Outputs:** φ vs P sensitivity chart, recharge pathway diagram

### 8.5 Hydrogeomorphology (4 modules)

#### Stable Channel Design (`StableChannelWizard.tsx`, 640 lines)
- **Inputs:** Discharge, slope, sediment d₅₀, bank material, Manning's n, side slope, cross-section shape
- **Calculations:** Manning's equation, Froude number, tractive force, regime theory (Lacey, Simons-Albertson)
- **Outputs:** SVG cross-section, tabbed results, stability indicators

#### Tractive Force Wizard (`TractiveForceWizard.tsx`, 384 lines)
- **5-step wizard:** Material Selection → Flow Parameters → Channel Geometry → Shear Analysis → Final Design
- **Calculations:** Permissible shear stress, bed/bank factor of safety
- **Outputs:** Step-by-step results with max depth, bottom width, FoS values

#### Lane's Balance (`LanesBalance.tsx`, 133 lines)
- **Concept:** QₛD₅₀ ∝ QwS — sediment equilibrium with scenario analysis
- **Outputs:** Interactive balance scale visualization

#### Channel Classification (`ChannelClassification.tsx`, 207 lines)
- **Method:** Rosgen stream classification via 5-question decision tree
- **Questions:** Entrenchment ratio, W/D ratio, sinuosity, slope, bed material
- **Outputs:** Stream type identification (A through G) with gallery view of matching types

### 8.6 Hydrosedimentology (2 modules)

#### Sediment Transport Calculator (`SedimentTransportCalculator.tsx`, 98 lines)
- **Methods:** Meyer-Peter-Müller, Engelund-Hansen, Yang formulas compared

#### Form vs Grain Friction (`FormFrictionDecomposer.tsx`, 105 lines)
- **Concept:** n = n_grain + n_form decomposition across bedform regimes
- **Outputs:** Non-monotonic friction behavior visualization

### 8.7 Hydroclimatology (2 modules)

#### Albedo & Water Balance (`AlbedoWaterBalance.tsx`, 644 lines)
- **Inputs:** Surface type, albedo (slider 0–1), latitude, solar constant, temperature, cloud cover
- **Calculations:** Incoming/reflected radiation, net radiation, ET estimation, water balance
- **Outputs:** Energy balance bar chart, water balance area chart, monthly variations

#### ET Calculator Suite (`ETCalculatorSuite.tsx`, 102 lines)
- **Methods:** Penman-Monteith, Hargreaves, Priestley-Taylor, Thornthwaite, Blaney-Criddle
- **Outputs:** Comparative bar chart of ET estimates

### 8.8 Hydroecology & Water Balance (3 modules)

#### Catchment Water Balance (`CatchmentWaterBalance.tsx`, 177 lines)
- **Equation:** P = ET + Qs + Qb + ΔS
- **Outputs:** Monthly breakdown chart, flow diagram

#### Hydro-Ecological Impact Tracker (`HydroEcologicalTracker.tsx`, 473 lines)
- **Inputs:** Land use distribution (5 categories, auto-normalizing sliders), precipitation, water diversion
- **Calculations:** Weighted watershed metrics, ecosystem health indices (Fish, Bird, Riparian, Water Quality)
- **Outputs:** Interactive SVG watershed map with animated elements, health meter
- **Health thresholds:** ≥70% green, 40–69% yellow, <40% red

#### Environmental Flow Calculator (`EnvironmentalFlowCalculator.tsx`, 89 lines)
- **Methods:** Tennant method, Building Block Methodology (BBM), Range of Variability Approach (RVA)

### 8.9 Hydraulic Structures (2 modules)

#### WES Spillway Designer (`SpillwayDesigner.tsx`, 85 lines)
- **Outputs:** Ogee spillway profile, rating curve, discharge computation

#### Stilling Basin Designer (`StillingBasinDesigner.tsx`, 222 lines)
- **Inputs:** Upstream depth, velocity, tailwater depth
- **Calculations:** Froude number, sequent depth, energy loss, basin length
- **Outputs:** USBR basin type recommendation (I, II, III, IV), SVG cross-section with jump location

### 8.10 Urban Stormwater — SWMM (`SWMMCalculator.tsx`, 1068 lines)

The largest single module — a **6-tab stormwater toolbox** based on H₂OCalc documentation:

| Tab | Description | Key Calculations |
|-----|-------------|-----------------|
| **Gutter Flow** | FHWA HEC-22 composite gutter analysis | Spread T, depth d, velocity V |
| **Inlet Design** | Grate and curb-opening inlets | Interception efficiency E with clogging factors |
| **Pipe Flow** | Circular pipe analysis (Manning's/Hazen-Williams) | Water-level cross-section, percent-full |
| **Weirs & Orifices** | Rectangular, V-notch, broad-crested structures | Submergence detection (TW/H ratio) |
| **Water Hammer** | Joukowski transient analysis | Wave speed a, critical time t_c, ΔP |
| **Pump Curves** | H-Q characteristic curves | Affinity law scaling, BEP identification |

Each tab includes live SVG diagrams that update with input changes.

### 8.11 Learning & Platform (4 modules)

#### Calculator Hub (`CalculatorHub.tsx`, 187 lines)
- **Searchable/filterable** portal for all 33 modules
- Text search across titles and descriptions
- Category toggle filters by domain
- Periodic-table-style grid layout

#### Workflow Builder (`WorkflowBuilder.tsx`, 282 lines)
- Chain multiple calculators to model complete hydrological processes
- Visual node-based workflow with connections
- Example workflows: Rainfall→Runoff→Routing, Channel Design→Stability Check

#### Nutshells Knowledge Graph (`NutshellsGraph.tsx`, 340 lines)
- **60+ interconnected concepts** with equations and reference links
- Interactive node graph with zoom/pan
- Search and filter by topic area
- Based on Ponce's "380 Nutshells" collection

#### Video Lecture Companion (`VideoLectureCompanion.tsx`, 442 lines)
- Synchronized diagrams that update with lecture timestamps
- Chapter navigation with key concept summaries
- Links to relevant calculator modules

---

## 9. Documentation System

### Documentation (`Documentation.tsx`, 817 lines)

Tabbed interface using shadcn `Tabs` component with one tab per original module:

1. **Curve Number** — SCS-CN method theory, equations, lookup tables
2. **Groundwater Yield** — Aquifer dynamics, Darcy's law, safe yield
3. **Muskingum-Cunge** — Flood routing theory, routing equations
4. **Stable Channel** — Manning's equation, tractive force, regime theory
5. **Albedo & Water Balance** — Radiation balance, Penman equation concepts
6. **Hydro-Ecological Impact** — Ecosystem services, environmental flows

Each tab contains conceptual explanations, key equations, parameter descriptions, and reference links to ponce.sdsu.edu.

---

## 10. State Management

### Pattern: Local Component State Only
No global state management (no Redux, Zustand, Context). Each module manages its own state independently via React hooks.

### State Tree Overview
```
App.tsx (Router, Providers)
├── Index.tsx
│   ├── Header.tsx
│   │   ├── mobileMenuOpen (boolean)
│   │   ├── isDark (boolean → persisted to localStorage "theme")
│   │   └── themeId (string → persisted to localStorage "uni-theme")
│   └── ModulesSection → ModuleCard (click → navigate)
│
├── ModulePage.tsx (dynamic module via URL :moduleId)
│   ├── Header.tsx (shared, receives isCalculatorOpen=true)
│   └── [Module Component]
│       ├── Input state (useState)
│       ├── Derived calculations (useMemo)
│       └── Animation state (isPlaying, currentStep) where applicable
```

### Data Persistence
| Key | Storage | Description |
|-----|---------|-------------|
| `theme` | localStorage | `"dark"` or `"light"` |
| `uni-theme` | localStorage | Theme ID: `"default"`, `"sdsu"`, `"uf"`, `"osu"`, `"auburn"`, `"epa"` |

All module state resets when navigating away.

---

## 11. Extracted Calculation Libraries

Three core scientific calculation modules have been extracted from UI components into pure, testable TypeScript functions under `src/lib/hydrology/`:

### cn-method.ts (11,431 bytes)
- CN lookup tables for all soil groups and land use combinations
- AMC adjustment formulas (AMC I, II, III)
- SCS runoff equation: Q = (P - Ia)² / (P - Ia + S)
- Potential retention and initial abstraction calculations
- Green-Ampt and Horton infiltration for method comparison

### muskingum.ts (9,100 bytes)
- Muskingum routing coefficient computation (C₁, C₂, C₃)
- Step-by-step outflow hydrograph generation
- Peak attenuation and translation calculations
- Multiple inflow hydrograph shape generators

### saint-venant.ts (10,826 bytes)
- Full Saint-Venant equation term decomposition
- Kinematic, diffusion, and dynamic wave approximations
- Wave celerity calculations for each approximation level

### Test Coverage
Each library has corresponding test files in `src/lib/hydrology/__tests__/`:
- `cn-method.test.ts` — Verifies CN lookup, AMC adjustment, and runoff calculations
- `muskingum.test.ts` — Verifies routing coefficients and outflow computation
- `saint-venant.test.ts` — Verifies equation term behavior

---

## 12. Animations & Visual Effects

### CSS Keyframe Animations (index.css)
| Animation | Duration | Effect |
|-----------|----------|--------|
| `wave` | 4s | Horizontal + vertical wave motion |
| `float` | 6s | Gentle vertical bobbing |
| `ripple` | 2s | Expanding circle with fade |
| `flow` | 8s | Background position shift |

### Tailwind Keyframe Animations (tailwind.config.ts)
| Animation | Duration | Effect |
|-----------|----------|--------|
| `fade-in` | 0.6s | Fade in + slide up 20px |
| `slide-in-right` | 0.5s | Fade in + slide from right |
| `scale-in` | 0.4s | Fade in + scale from 95% |
| `accordion-down/up` | 0.2s | Height transition for accordions |

### Staggered Entrance Animations
- Hero elements: 0s → 0.4s staggered delays
- Module cards: 0.05s + index × 0.03s
- Floating droplets: 0s, 1s, 1.5s, 2s

### SVG Visualizations
- **WaterWaves:** 3-layer animated wave at hero bottom
- **HydroEcologicalTracker:** Full watershed map with dynamic opacity
- **StableChannelWizard:** Cross-section that responds to parameter changes
- **StillingBasinDesigner:** Hydraulic jump with energy dissipation diagram
- **SWMMCalculator:** 6 interactive SVG diagrams (gutter, pipe, weir, pump, etc.)

### Hover Effects (ModuleCard)
- `hover:-translate-y-2` lift
- `hover:shadow-elevated` shadow increase
- Color-matched glow: `group-hover:shadow-[0_0_30px_-5px_hsl(...)]`
- Icon scale: `group-hover:scale-110`

---

## 13. Dark Mode

### Implementation
- **Toggle:** `isDark` state in `Header.tsx`, toggles `dark` class on `document.documentElement`
- **Persistence:** `localStorage` key `"theme"` (`"dark"` or `"light"`)
- **System fallback:** Checks `prefers-color-scheme: dark` if no saved preference
- **Tailwind config:** `darkMode: ["class"]`

### Dark Mode Overrides
All CSS variables redefined in `.dark`:
- Background: near-white → deep blue-black (`210 50% 8%`)
- Primary: deep blue → bright cyan (`195 80% 55%`)
- Cards: white → dark with blue tint (`210 45% 12%`)
- Water colors shift brighter for contrast
- Hero gradient darkens significantly

---

## 14. Dependencies

### Runtime Dependencies (Key)
| Package | Version | Purpose |
|---------|---------|---------|
| react, react-dom | ^18.3 | Core UI framework |
| react-router-dom | ^6.30 | Client-side routing |
| recharts | ^2.15 | Charts and data visualization |
| lucide-react | ^0.462 | Icon library |
| tailwind-merge, clsx, cva | Various | Class name utilities |
| @radix-ui/* | Various | Accessible UI primitives (20+ packages via shadcn/ui) |
| sonner | ^1.7 | Toast notifications |
| zod | ^3.25 | Schema validation |
| react-hook-form | ^7.61 | Form state management |

### Dev Dependencies (Key)
| Package | Version | Purpose |
|---------|---------|---------|
| vite | ^5.4 | Build tool and dev server |
| typescript | ^5.8 | TypeScript compiler |
| tailwindcss | ^3.4 | CSS framework |
| vitest | ^3.2 | Test runner |
| @testing-library/react | ^16.0 | Component testing |

### Potentially Unused Dependencies
- `@tanstack/react-query` — QueryClientProvider set up but no queries made
- `next-themes` — Custom theme implementation used instead
- `date-fns`, `react-day-picker`, `input-otp`, `embla-carousel-react` — Installed by shadcn/ui but not actively used

---

## 15. Testing

### Setup
- **Runner:** Vitest (configured in `vitest.config.ts`)
- **Environment:** jsdom
- **Matchers:** jest-dom via `@testing-library/jest-dom`
- **Commands:** `npm test` (single run), `npm run test:watch` (watch mode)

### Current Test Coverage
- `src/lib/hydrology/__tests__/cn-method.test.ts` — CN method calculations
- `src/lib/hydrology/__tests__/muskingum.test.ts` — Muskingum routing
- `src/lib/hydrology/__tests__/saint-venant.test.ts` — Saint-Venant equations
- `src/test/example.test.ts` — Basic example/placeholder

### Recommended Test Additions
1. **More calculation verification** — Extend existing tests with textbook worked examples
2. **Component rendering** — Verify all 33 modules render without errors
3. **Theme switching** — Verify class application and CSS variable inheritance
4. **Calculator Hub** — Verify search and filtering work correctly
5. **Edge cases** — Zero rainfall, 100% urban, max diversion, etc.

---

## 16. Known Considerations & Future Work

### Architecture
1. **Module component sizes vary widely** — From 85 lines (SpillwayDesigner) to 1,068 lines (SWMMCalculator). Larger modules would benefit from sub-component extraction.
2. **Only 3 of 33 modules have extracted calculation logic** — The remaining modules have calculations inline in the component.
3. **No data persistence** — Users lose work on navigation. SessionStorage or context could preserve state.
4. **No lazy loading** — All 33 module components loaded upfront. `React.lazy()` + `Suspense` would improve initial load.

### Content Accuracy
- All models are **simplified/conceptual** for educational use
- Calculations are NOT for professional engineering design
- All content cites ponce.sdsu.edu as authoritative source
- Ecosystem weighting formulas are illustrative, not empirically derived

### Accessibility
- shadcn/ui provides good baseline via Radix UI primitives
- SVG visualizations lack comprehensive ARIA labels
- Color-only health indicators have text alternatives (partially)
- Mobile menu could benefit from focus trapping

### Performance
- All calculations run synchronously (useMemo)
- Recharts re-renders full charts on input changes
- SVG visualizations re-render on every slider adjustment
- No debouncing on continuous slider drags

### Potential Enhancements
- PDF/CSV export of calculation results
- Pre-loaded challenge scenarios with real-world problems
- Progress tracking across learning paths
- Comparison/split-screen mode for side-by-side scenarios
- "Predict before you calculate" assessment prompts
- Internationalization (Spanish would pair with Ponce's Spanish texts)
- Debounced chart re-renders during continuous slider interaction
- "What's This?" tooltip system for technical terms

### Priority Roadmap

#### High Priority
1. Extract more calculation logic into `src/lib/hydrology/` with tests
2. Add `React.lazy()` for all module components
3. Persist module state in sessionStorage
4. Add ARIA labels to SVG visualizations
5. Replace magic numbers with named constants + references

#### Medium Priority
6. Add assessment/quiz features for pedagogical value
7. Add breadcrumb/progress indicators within learning paths
8. Clean up unused dependencies to reduce bundle size
9. Add "Simplifications & Limitations" notices in module UIs
10. Debounce Recharts re-renders

#### Lower Priority
11. Real-world watershed challenge scenarios
12. Comparison/split-screen mode
13. i18n support (Spanish)
14. Mobile-optimized touch interactions
15. "What's This?" tooltip system

---

## 17. Project Evaluation & Scorecard

### Overall Grade: **A-** (~88/100)

A comprehensive educational web app with 33 interactive modules spanning the full breadth of hydrology. Well-designed theming system, cohesive visual identity, and thoughtful domain organization.

### Category Scores

| Category | Grade | Notes |
|---|---|---|
| Concept & Educational Value | A (94) | 33 modules across 11 domains, structured learning paths, knowledge graph |
| Technical Architecture | B+ (85) | Modern stack, extracted calc libs, but monolithic components remain |
| UI/UX Design | A (92) | Polished water theme, 6 university themes, cohesive design system |
| Code Quality & Maintainability | B+ (85) | TypeScript, extracted libs, good docs, but inconsistent component sizes |
| Scientific Accuracy & Attribution | B+ (87) | Well-attributed, textbook formulas, needs more validation tests |
| Testing & Reliability | B- (78) | 3 extracted libs have tests, but 30 modules untested |
| Performance & Accessibility | B (80) | Good Radix baseline, gaps in SVG a11y and lazy loading |

### Strengths
- 33 modules cover a genuinely comprehensive cross-section of hydrology mapping to a full curriculum
- 11-domain organization with Calculator Hub provides excellent discoverability
- 6 university themes allow institutional branding without code changes
- Water-themed HSL design system is cohesive and maintainable
- Fully client-side — zero hosting costs, zero privacy concerns
- Extracted calculation libraries with tests set a good pattern
- Learning paths, knowledge graph, and video companion add pedagogical depth

### Path to A+
Focus on **engineering discipline** (extract more calc logic, test coverage, lazy loading) and **pedagogical depth** (assessment features, worked examples, limitations transparency).

---

*End of handover document.*
