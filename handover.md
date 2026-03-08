# Ponce Hydrology Lab — Detailed Handover Document

> **Last updated:** March 2026  
> **Stack:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui  
> **Live URL:** https://aquifer-quest-zone.lovable.app  
> **Attribution:** All scientific content is based on the work of **Prof. Victor Miguel Ponce**, San Diego State University — [ponce.sdsu.edu](https://ponce.sdsu.edu)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Tech Stack](#2-architecture--tech-stack)
3. [Project Structure](#3-project-structure)
4. [Routing & Navigation](#4-routing--navigation)
5. [Design System](#5-design-system)
6. [Landing Page Components](#6-landing-page-components)
7. [Interactive Modules (Detail)](#7-interactive-modules-detail)
8. [Documentation System](#8-documentation-system)
9. [State Management](#9-state-management)
10. [Animations & Visual Effects](#10-animations--visual-effects)
11. [Dark Mode](#11-dark-mode)
12. [Dependencies](#12-dependencies)
13. [Testing](#13-testing)
14. [Known Considerations & Future Work](#14-known-considerations--future-work)

---

## 1. Project Overview

**Ponce Hydrology Lab** is a single-page educational web application that teaches hydrology and hydraulics concepts through interactive calculators, simulators, and visualizations. It is inspired by the extensive web-based hydrology resources created by Prof. Victor Miguel Ponce at San Diego State University.

### Core Features
- **6 interactive modules** covering rainfall-runoff, flood routing, groundwater, channel design, energy balance, and eco-hydrology
- **Guided learning paths** for beginners, practitioners, and researchers
- **Integrated documentation** with theory, equations, and references for every module
- **Dark/light theme** toggle with full design system support
- **Fully client-side** — no backend, no database, no authentication required
- **Responsive design** for desktop, tablet, and mobile

### Target Audience
- Hydrology students learning fundamentals
- Practicing civil/environmental engineers
- Researchers exploring eco-hydrology concepts

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
- **No backend:** All calculations run client-side in the browser. No data persistence.
- **No global state:** Each module manages its own state independently via React hooks.
- **URL-based module routing:** Each module has its own route (`/modules/:moduleId`) via `ModulePage.tsx`, enabling deep-linking and sharing.
- **Large monolithic module components:** Each module (CN Calculator, Groundwater Simulator, etc.) is a single 400–800 line component containing UI, state, and calculation logic. This is a known area for future refactoring.

---

## 3. Project Structure

```
src/
├── main.tsx                          # React entry point, renders App
├── App.tsx                           # Router setup, providers (QueryClient, Tooltip, Toasters)
├── App.css                           # (minimal/unused)
├── index.css                         # Design system: CSS variables, fonts, animations, utility classes
├── vite-env.d.ts                     # Vite type declarations
│
├── pages/
│   ├── Index.tsx                     # Landing page with Hero, GettingStarted, ModulesSection, Footer
│   ├── ModulePage.tsx                # Dynamic module renderer — maps :moduleId param to module components
│   └── NotFound.tsx                  # 404 catch-all route
│
├── components/
│   ├── Header.tsx                    # Fixed navigation bar with logo, links, theme toggle, mobile menu
│   ├── Hero.tsx                      # Landing hero section with animated water effects
│   ├── WaterWaves.tsx                # SVG wave animation at bottom of hero
│   ├── GettingStarted.tsx            # Tutorial section with learning paths and quick tips
│   ├── ModulesSection.tsx            # Grid of module cards
│   ├── ModuleCard.tsx                # Individual module card with hover effects
│   ├── NavLink.tsx                   # React Router NavLink wrapper with active class support
│   ├── Footer.tsx                    # Site footer with attribution and resource links
│   ├── Documentation.tsx             # Tabbed documentation viewer (817 lines)
│   │
│   ├── CNCalculator.tsx              # SCS Curve Number Calculator (526 lines)
│   ├── CNMethodComparison.tsx        # Comparison chart sub-component for CN Calculator (243 lines)
│   ├── GroundwaterSimulator.tsx       # Aquifer management game/simulator (544 lines)
│   ├── MuskingumSimulator.tsx         # Muskingum-Cunge flood routing (509 lines)
│   ├── StableChannelWizard.tsx        # Stable channel design tool (640 lines)
│   ├── AlbedoWaterBalance.tsx         # Albedo & energy balance module (644 lines)
│   └── HydroEcologicalTracker.tsx     # Hydro-ecological watershed tracker (473 lines)
│   │
│   └── ui/                           # shadcn/ui component library (~50+ files)
│       ├── button.tsx
│       ├── card.tsx
│       ├── slider.tsx
│       ├── select.tsx
│       ├── tabs.tsx
│       ├── ... (accordion, dialog, toast, etc.)
│
├── hooks/
│   ├── use-mobile.tsx                # Mobile breakpoint detection hook
│   └── use-toast.ts                  # Toast notification hook
│
├── lib/
│   └── utils.ts                      # cn() utility for className merging (clsx + tailwind-merge)
│
├── test/
│   ├── setup.ts                      # Vitest setup (jest-dom matchers)
│   └── example.test.ts               # Example test file
│
├── public/
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
│
├── tailwind.config.ts                # Tailwind configuration with custom theme
├── vite.config.ts                    # Vite configuration
├── vitest.config.ts                  # Vitest configuration
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json  # TypeScript configs
├── components.json                   # shadcn/ui configuration
└── package.json                      # Dependencies and scripts
```

---

## 4. Routing & Navigation

### URL Routes (React Router)
The app uses React Router with URL-based module routing for deep-linking:

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Index` | Landing page (Hero, GettingStarted, ModulesSection, Footer) |
| `/modules/:moduleId` | `ModulePage` | Dynamic module renderer |
| `*` | `NotFound` | 404 catch-all |

### Supported Module IDs
| URL Path | Module Component |
|----------|-----------------|
| `/modules/cn-calculator` | `CNCalculator` |
| `/modules/groundwater` | `GroundwaterSimulator` |
| `/modules/muskingum-routing` | `MuskingumSimulator` |
| `/modules/channel-design` | `StableChannelWizard` |
| `/modules/albedo` | `AlbedoWaterBalance` |
| `/modules/hydroecology` | `HydroEcologicalTracker` |
| `/modules/documentation` | `Documentation` |

### ModulePage (`src/pages/ModulePage.tsx`)
- Reads `:moduleId` from URL params via `useParams()`
- Looks up the component from a `moduleComponents` record mapping IDs to React components
- If the module ID is invalid, renders a "Module Not Found" page with a link back to home
- Close/back button navigates to `/` via `useNavigate()`
- Docs link navigates to `/modules/documentation`

### Index Page Navigation
- `Index.tsx` uses `useNavigate()` to navigate to `/modules/:moduleId` when a module card is clicked
- No in-page state management for module switching — fully URL-driven

### Header Behavior
- `Header` receives `isCalculatorOpen` boolean (true when any module is active)
- When on landing page: transparent background, white text (over hero gradient)
- When module is open: solid background with blur, standard foreground text
- "Docs" button calls `onOpenDocs()` → navigates to `/modules/documentation`

---

## 5. Design System

### Typography
- **Display font:** `Playfair Display` (weights 600, 700, 800) — used for h1, h2, h3 headings
- **Body font:** `Inter` (weights 400, 500, 600, 700, 800) — used for body text
- **Headings:** `font-weight: 800` (extra-bold)
- **Body text:** `font-weight: 500` (medium)
- Fonts loaded via Google Fonts CDN import in `index.css`

### Color System (HSL-based CSS Variables)

#### Light Mode
| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--background` | `210 40% 98%` | Page background |
| `--foreground` | `210 50% 10%` | Primary text |
| `--primary` | `205 85% 35%` | Deep ocean blue — buttons, links, accents |
| `--secondary` | `200 60% 94%` | Soft sky blue backgrounds |
| `--accent` | `180 65% 40%` | Teal for secondary accents |
| `--muted` | `210 30% 95%` | Subtle backgrounds |
| `--destructive` | `0 84.2% 60.2%` | Error/danger states |

#### Water Theme Colors (Custom)
| Token | Usage |
|-------|-------|
| `--water-deep` | Deep water elements, dark backgrounds |
| `--water-medium` | Mid-tone water elements |
| `--water-light` | Light water highlights, badges |
| `--water-surface` | Light reflective surfaces |
| `--water-foam` | Near-white foam/text on dark backgrounds |

#### Earth/Nature Colors
| Token | Usage |
|-------|-------|
| `--earth-brown` | Soil, channel materials |
| `--earth-green` | Vegetation, forest elements |
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
| `.text-gradient-water` | Gradient text effect (blue) |
| `.btn-water` | Water-themed button with gradient and shadow |
| `.water-card` | Card with gradient border glow on hover (pseudo-element) |
| `.animate-wave` | 4s wave motion animation |
| `.animate-float` | 6s vertical floating animation |
| `.animate-ripple` | 2s expanding ripple animation |
| `.animate-flow` | 8s background position animation |

---

## 6. Landing Page Components

### Hero (`Hero.tsx`)
- Full-viewport hero section with `hero-gradient` background
- Floating water droplet icons with staggered `animate-float` animations
- Badge: "Interactive Hydrology Education"
- Title: "Ponce Hydrology Lab" (h1, Playfair Display, 5xl–8xl responsive)
- Subtitle mentioning Prof. Victor Miguel Ponce
- SDSU attribution line
- Two CTA buttons: "Explore Modules" (scrolls to #modules) and "Learn More"
- Stats row: 380+ Concepts, 6 Modules, ∞ Learning
- `WaterWaves` component at bottom (animated SVG waves transitioning to page background)

### WaterWaves (`WaterWaves.tsx`)
- Three layered SVG `<path>` elements creating a wave effect
- Each wave has different animation duration (4s, 6s, 8s) and delay
- Front wave uses `--background` color to blend into the page
- Absolutely positioned at bottom of hero, pointer-events disabled

### Getting Started (`GettingStarted.tsx`)
- **Quick Tips** section: 3 cards (Interactive Learning, Try Real Scenarios, Read the Theory)
- **Learning Paths**: 3 cards in a grid:
  - **Hydrology Fundamentals** (Beginner, ~30 min): CN Calculator → Flood Routing → Theory
  - **Engineering Applications** (Practitioner, ~45 min): Channel Design → Groundwater → Energy Balance
  - **Eco-Hydrology Focus** (Researcher, ~40 min): Albedo → Impact Tracker → Aquifer Game
- Each path has numbered steps that are clickable (calls `onOpenModule`)
- "Start This Path" button opens the first module in the path
- **First-Time Recommendation** banner: suggests starting with SCS Curve Number Calculator

### Modules Section (`ModulesSection.tsx`)
- Section header: "Interactive Modules" with gradient text
- 3-column grid of `ModuleCard` components
- 6 modules defined in a static array with id, title, description, icon, color, and status

### Module Card (`ModuleCard.tsx`)
- Accepts: title, description, icon, color scheme, status, onClick handler, animation delay
- 4 color schemes (`blue`, `teal`, `green`, `amber`) with matched bg, icon, border, and glow styles
- Hover effects: -translate-y-2, elevated shadow, colored glow, icon scale-up, arrow indicator
- "Coming Soon" badge support (currently unused — all modules are "available")
- Staggered `animate-fade-in` on page load

### Footer (`Footer.tsx`)
- 3-column layout: Brand description, Resource links, About/attribution
- Resource links to ponce.sdsu.edu, 380nutshells.html, textbooks.html (all open in new tabs)
- Copyright notice with dynamic year
- Disclaimer: "Not affiliated with SDSU. For educational purposes only."

---

## 7. Interactive Modules (Detail)

All modules share a common pattern:
- Accept `onClose: () => void` prop
- Render a back button (ArrowLeft icon) that calls `onClose()`
- Use `useState` for input parameters and `useMemo` for derived calculations
- Display results via Recharts charts and/or custom SVG visualizations
- Wrap in full-screen layout with `min-h-screen bg-background`
- Reference ponce.sdsu.edu as authoritative source

### 7.1 SCS Curve Number Calculator (`CNCalculator.tsx`, 526 lines)

**Purpose:** Calculates rainfall-runoff using the SCS (NRCS) Curve Number method.

**Inputs:**
- Soil hydrologic group (A, B, C, D)
- Land use type (from lookup table)
- Rainfall depth (mm, via slider)
- Antecedent Moisture Condition (AMC I, II, III)

**Calculations:**
- Curve Number lookup from soil/land-use combination
- AMC adjustment (AMC I = drier, AMC III = wetter)
- Potential retention (S) = (25400/CN) - 254
- Initial abstraction (Ia) = 0.2 × S
- Runoff (Q) using SCS formula: Q = (P - Ia)² / (P - Ia + S) when P > Ia
- Sensitivity analysis across rainfall range

**Outputs:**
- Numerical results (CN, S, Ia, Q, infiltration)
- Rainfall-runoff relationship chart (AreaChart)
- Sensitivity analysis visualization
- AMC comparison
- **Method Comparison** sub-component (`CNMethodComparison.tsx`)

**Sub-component — CNMethodComparison (`CNMethodComparison.tsx`, 243 lines):**
- Compares SCS-CN method with Green-Ampt and Horton infiltration methods
- Green-Ampt: Uses soil-specific parameters (K, ψ, θ) for physically-based infiltration
- Horton: Uses exponential decay model (f₀, f_c, k parameters)
- Bar chart comparing runoff estimates across methods
- Detailed explanation cards for each method

### 7.2 Muskingum-Cunge Flood Routing (`MuskingumSimulator.tsx`, 509 lines)

**Purpose:** Simulates flood wave propagation through a channel reach.

**Inputs:**
- Channel reach length
- Wave celerity
- Routing coefficient (X)
- Inflow hydrograph shape (selection of predefined shapes)
- Time step

**Calculations:**
- Muskingum routing parameters (K, X)
- Routing coefficients (C₁, C₂, C₃)
- Step-by-step outflow hydrograph computation
- Peak attenuation and translation

**Outputs:**
- Animated inflow vs outflow hydrograph (time-series chart)
- Peak flow comparison
- Playback controls (Play, Pause, Reset)
- Real-time animation of flood wave propagation

### 7.3 Groundwater Yield Simulator (`GroundwaterSimulator.tsx`, 544 lines)

**Purpose:** Interactive aquifer management game balancing pumping with sustainability.

**Inputs:**
- Pumping rate (slider)
- Recharge rate
- Aquifer properties (storativity, transmissivity)

**Calculations:**
- Water table dynamics over time
- Storage depletion curves
- Ecosystem health index (linked to water table depth)
- Cumulative pumping vs recharge balance

**Outputs:**
- Time-series simulation (animated year-by-year)
- Water table depth chart
- Ecosystem health indicator
- Storage balance visualization
- Playback controls (Play, Pause, Reset)

### 7.4 Stable Channel Design Wizard (`StableChannelWizard.tsx`, 640 lines)

**Purpose:** Designs non-eroding, non-silting alluvial channels.

**Inputs:**
- Design discharge (Q)
- Channel slope
- Sediment size (d₅₀)
- Bank material (Sand, Gravel, Cobbles, Clay — each with Manning's n and angle of repose)
- Manning's roughness coefficient
- Side slope
- Cross-section shape (trapezoidal, rectangular, parabolic, triangular)

**Calculations:**
- Manning's equation for normal depth
- Channel geometry (width, depth, area, wetted perimeter, hydraulic radius)
- Froude number check
- Tractive force analysis (shear stress vs critical shear)
- Regime theory comparisons (Lacey, Simons-Albertson)

**Outputs:**
- SVG cross-section visualization (shape changes with parameters)
- Tabbed results view
- Geometry summary table
- Stability indicators (badges showing erosion/deposition risk)
- Collapsible theory sections with equations

### 7.5 Albedo & Water Balance (`AlbedoWaterBalance.tsx`, 644 lines)

**Purpose:** Explores how land surface albedo changes affect energy balance and water resources.

**Inputs:**
- Surface type / land cover (selection with preset albedo values)
- Albedo (slider, 0–1)
- Latitude
- Solar constant
- Temperature
- Cloud cover

**Calculations:**
- Incoming solar radiation (adjusted for latitude and cloud cover)
- Reflected radiation (albedo × incoming)
- Net radiation balance
- Evapotranspiration estimation (energy-balance approach)
- Water balance components (precipitation, ET, runoff, recharge)

**Outputs:**
- Energy balance bar chart
- Water balance area chart
- Monthly variation visualization
- Comparative analysis across surface types

### 7.6 Hydro-Ecological Impact Tracker (`HydroEcologicalTracker.tsx`, 473 lines)

**Purpose:** Links land use and water management decisions to watershed ecosystem health.

**Inputs:**
- Land use distribution (5 categories with sliders that auto-normalize to 100%):
  - Forest (high baseflow, low runoff, excellent habitat)
  - Wetland (highest baseflow, best water quality)
  - Agriculture (moderate runoff, moderate pollution)
  - Urban (high runoff, high pollution)
  - Industrial (highest runoff and pollution)
- Annual precipitation (400–2000 mm)
- Water diversion percentage (0–80%)

**Calculations:**
- Weighted watershed metrics (baseflow, runoff, habitat quality, pollution) based on land use fractions
- Simplified water balance: ET depends on forest/wetland fraction
- Effective precipitation → partitioned into runoff and baseflow
- Available flow after diversion
- Ecosystem health indices:
  - **Flow Health:** Available flow vs 70% minimum ecological flow threshold
  - **Water Quality:** 1 - (weighted pollution × 0.8)
  - **Habitat Connectivity:** Weighted habitat × diversion adjustment
  - **Fish Health:** 80% flow/quality + 20% habitat
  - **Bird Health:** 60% habitat + 40% quality
  - **Riparian Health:** 50% flow + 50% habitat
  - **Overall:** Average of fish, bird, riparian, and water quality

**Land Use Normalization Logic:**
When user adjusts one slider, the `updateLandUse()` function:
1. Calculates the difference from the old value
2. Distributes the adjustment equally among other land use types
3. Clamps all values to [0, 100]
4. Normalizes the total to exactly 100%

**Outputs:**
- **Interactive SVG watershed map** (500×350 viewBox):
  - Mountains/watershed boundary path
  - Forest patches with tree icons (opacity scales with forest %)
  - Wetland with reed illustrations (opacity scales with wetland %)
  - Agriculture with crop row patterns (opacity scales with agriculture %)
  - Urban area with building rectangles (opacity scales with urban %)
  - Industrial area with smokestacks (opacity scales with industrial %)
  - River path (width and opacity scale with available flow and flow health)
  - Animated rain drops (appear when precipitation > 800mm)
  - Species indicator icons (Fish, Bird, Leaf) colored by health status
- **Water Balance card:** Precipitation, ET, Runoff, Baseflow, Available Flow
- **Ecosystem Indicators card:** Fish Health, Bird Habitat, Riparian Zone, Water Quality (colored badges)
- **Overall Ecosystem Health meter:** Percentage with progress bar, color-coded (green/yellow/red) with descriptive text

**Health Color System:**
- ≥ 70%: Green (healthy)
- 40–69%: Yellow (moderate stress)
- < 40%: Red (critical)

---

## 8. Documentation System

### Documentation (`Documentation.tsx`, 817 lines)

**Structure:** Tabbed interface using shadcn `Tabs` component.

**Tabs (one per module):**
1. **Curve Number** — SCS-CN method theory, equations, lookup tables
2. **Groundwater Yield** — Aquifer dynamics, Darcy's law, safe yield concepts
3. **Muskingum-Cunge Routing** — Flood routing theory, routing equations
4. **Stable Channel Design** — Manning's equation, tractive force, regime theory
5. **Albedo & Water Balance** — Radiation balance, Penman equation concepts
6. **Hydro-Ecological Impact** — Ecosystem services, environmental flows

Each tab contains:
- Conceptual explanation
- Key equations (rendered as text/code blocks)
- Parameter descriptions
- Reference links to ponce.sdsu.edu
- Related publications

---

## 9. State Management

### Pattern: Local Component State Only
There is **no global state management** (no Redux, Zustand, Context, etc.). Each component manages its own state:

```
App.tsx (Router, Providers)
├── Index.tsx (Landing page)
│   └── Header.tsx
│       ├── mobileMenuOpen (mobile nav toggle)
│       └── isDark (theme toggle, persisted to localStorage)
│
├── ModulePage.tsx (Dynamic module renderer via URL params)
│   ├── Header.tsx (shared)
│   │
│   ├── CNCalculator.tsx
│   │   ├── soilType, landUse, rainfall, amc (inputs)
│   │   └── derived calculations via useMemo
│   │
│   ├── GroundwaterSimulator.tsx
│   │   ├── pumpingRate, rechargeRate, etc. (inputs)
│   │   ├── timeSeriesData (simulation output)
│   │   └── isPlaying, currentYear (animation state)
│   │
│   ├── MuskingumSimulator.tsx
│   │   ├── reachLength, celerity, routingX, etc.
│   │   ├── routingData (computed hydrographs)
│   │   └── isPlaying, timeStep (animation state)
│   │
│   ├── StableChannelWizard.tsx
│   │   ├── channelParams (discharge, slope, sediment, etc.)
│   │   └── computed geometry via useMemo
│   │
│   ├── AlbedoWaterBalance.tsx
│   │   ├── surfaceType, albedo, latitude, etc.
│   │   └── energy/water balance via useMemo
│   │
│   └── HydroEcologicalTracker.tsx
│       ├── landUseDistribution (Record<string, number>)
│       ├── precipitation, waterDiversion
│       └── watershedMetrics via useMemo
```

### Data Persistence
- **Theme preference:** Stored in `localStorage` (`"theme"` key), read on mount
- **Everything else:** No persistence. All module state resets when navigating away and back.

---

## 10. Animations & Visual Effects

### CSS Keyframe Animations (index.css)
| Animation | Duration | Effect |
|-----------|----------|--------|
| `wave` | 4s | Horizontal + vertical wave motion |
| `float` | 6s | Gentle vertical bobbing |
| `ripple` | 2s | Expanding circle with fade |
| `flow` | 8s | Background position shift for gradient animation |

### Tailwind Keyframe Animations (tailwind.config.ts)
| Animation | Duration | Effect |
|-----------|----------|--------|
| `fade-in` | 0.6s | Fade in + slide up 20px |
| `slide-in-right` | 0.5s | Fade in + slide from right 20px |
| `scale-in` | 0.4s | Fade in + scale from 95% |
| `accordion-down/up` | 0.2s | Height transition for accordions |

### Staggered Animations
Many components use `animationDelay` inline styles to create staggered entrance effects:
- Hero elements: 0s, 0.1s, 0.2s, 0.25s, 0.3s, 0.4s delays
- Module cards: 0.1s + index × 0.1s
- Floating droplets in Hero: 0s, 1s, 1.5s, 2s delays

### SVG Visualizations
- **WaterWaves:** 3-layer animated wave at hero bottom
- **HydroEcologicalTracker:** Full watershed illustration with dynamic opacity/sizing
- **StableChannelWizard:** Cross-section drawing that responds to parameter changes

### Interactive Hover Effects (ModuleCard)
- `hover:-translate-y-2` lift
- `hover:shadow-elevated` shadow increase
- Color-matched glow: `group-hover:shadow-[0_0_30px_-5px_hsl(...)]`
- Icon scale: `group-hover:scale-110`
- Arrow indicator: slides in from right on hover

### Water Card Effect (`.water-card`)
- Pseudo-element `::before` with `--gradient-water` background
- `opacity: 0` → `opacity: 0.15` on hover
- Creates a subtle gradient border glow

---

## 11. Dark Mode

### Implementation
- **Toggle mechanism:** `isDark` state in `Header.tsx`, toggles `dark` class on `document.documentElement`
- **Persistence:** Saved to `localStorage` under `"theme"` key
- **System preference fallback:** Checks `prefers-color-scheme: dark` if no saved preference
- **Tailwind config:** `darkMode: ["class"]` enables class-based dark mode

### Dark Mode Color Overrides (index.css `.dark`)
All CSS variables are redefined for dark mode:
- Background shifts from near-white to deep blue-black (`210 50% 8%`)
- Primary shifts from deep blue to bright cyan (`195 80% 55%`)
- Cards become dark with blue tint (`210 45% 12%`)
- Water colors become brighter/lighter for contrast
- Hero gradient darkens significantly
- Muted colors shift to darker tones

---

## 12. Dependencies

### Runtime Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| react, react-dom | ^18.3.1 | Core UI framework |
| react-router-dom | ^6.30.1 | Client-side routing |
| @tanstack/react-query | ^5.83.0 | Data fetching (installed but minimally used) |
| recharts | ^2.15.4 | Charts and data visualization |
| lucide-react | ^0.462.0 | Icon library |
| tailwind-merge | ^2.6.0 | Intelligent Tailwind class merging |
| clsx | ^2.1.1 | Conditional className construction |
| class-variance-authority | ^0.7.1 | Component variant management (cva) |
| @radix-ui/* | Various | Accessible UI primitives (20+ packages) |
| sonner | ^1.7.4 | Toast notifications |
| vaul | ^0.9.9 | Drawer component |
| cmdk | ^1.1.1 | Command palette component |
| zod | ^3.25.76 | Schema validation |
| react-hook-form | ^7.61.1 | Form state management |
| @hookform/resolvers | ^3.10.0 | Zod resolver for react-hook-form |
| date-fns | ^3.6.0 | Date utility functions |
| react-day-picker | ^8.10.1 | Calendar/date picker |
| input-otp | ^1.4.2 | OTP input component |
| embla-carousel-react | ^8.6.0 | Carousel component |
| react-resizable-panels | ^2.1.9 | Resizable panel layout |
| next-themes | ^0.3.0 | Theme management (installed but custom impl used) |
| tailwindcss-animate | ^1.0.7 | Tailwind animation utilities |

### Dev Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| vite | ^5.4.19 | Build tool and dev server |
| @vitejs/plugin-react-swc | ^3.11.0 | React SWC transform for Vite |
| typescript | ^5.8.3 | TypeScript compiler |
| tailwindcss | ^3.4.17 | CSS framework |
| autoprefixer | ^10.4.21 | CSS vendor prefixing |
| postcss | ^8.5.6 | CSS processing |
| vitest | ^3.2.4 | Test runner |
| @testing-library/react | ^16.0.0 | React component testing |
| @testing-library/jest-dom | ^6.6.0 | DOM assertion matchers |
| jsdom | ^20.0.3 | DOM emulation for tests |
| eslint | ^9.32.0 | Code linting |
| lovable-tagger | ^1.1.13 | Lovable platform integration |

### Unused/Underutilized Dependencies
- `@tanstack/react-query` — QueryClientProvider is set up in App.tsx but no queries are made
- `next-themes` — Installed but a custom theme implementation is used instead
- Several Radix UI packages are installed via shadcn/ui but may not be actively used in custom components (e.g., `alert-dialog`, `context-menu`, `menubar`)

---

## 13. Testing

### Setup
- **Runner:** Vitest (configured in `vitest.config.ts`)
- **Environment:** jsdom
- **Matchers:** jest-dom extended matchers via `@testing-library/jest-dom`
- **Scripts:**
  - `npm test` → `vitest run` (single run)
  - `npm run test:watch` → `vitest` (watch mode)

### Current Test Coverage
- `src/test/example.test.ts` — Basic example test (likely a placeholder)
- No component tests, integration tests, or calculation verification tests exist

### Recommended Test Areas (for future development)
1. **Calculation accuracy:** Verify CN lookup, Manning's equation, Muskingum routing coefficients
2. **Land use normalization:** Test that `updateLandUse()` in HydroEcologicalTracker always sums to 100%
3. **Edge cases:** Zero rainfall, 100% urban, max diversion, etc.
4. **Component rendering:** Verify each module renders without errors
5. **Theme toggle:** Verify dark class application and localStorage persistence

---

## 14. Known Considerations & Future Work

### Architecture Concerns
1. **Large monolithic components:** Module components are 400–800+ lines each, mixing UI, state, and calculation logic. Recommended refactoring:
   - Extract calculation functions into `src/lib/` or `src/utils/` modules
   - Extract sub-components for input panels, chart sections, result displays
   - Create shared hooks for common patterns (animation playback, slider normalization)

2. **No data persistence:** Users lose all work on page refresh. Could add localStorage or IndexedDB for session recovery.

3. **No data persistence:** Users lose all work on page refresh. Could add localStorage or IndexedDB for session recovery.

4. **Unused dependencies:** Several packages are installed but unused, adding to bundle size.

### Content Accuracy
- All scientific models are **simplified/conceptual** versions of the real methods
- Calculations are for educational demonstration, not professional engineering use
- All content must continue to cite ponce.sdsu.edu as the authoritative source

### Accessibility
- shadcn/ui provides good baseline accessibility via Radix UI primitives
- SVG visualizations (watershed map, channel cross-section) lack ARIA labels
- Color-only health indicators (red/yellow/green) should have text alternatives (partially implemented)
- Mobile menu is functional but could benefit from focus trapping

### Performance
- All calculations run synchronously on the main thread (useMemo)
- No web workers for heavy computation
- Recharts re-renders full charts on any input change
- SVG watershed map re-renders on every slider adjustment
- No virtualization or lazy loading of module components

### Potential Enhancements
- Export calculation results as PDF reports
- Add challenge/scenario modes with pre-loaded real-world problems
- Progress tracking across learning paths
- Comparison mode (side-by-side parameter scenarios)
- Mobile-optimized touch interactions for sliders
- Internationalization (i18n) support
