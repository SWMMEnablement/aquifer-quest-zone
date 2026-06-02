# Ponce Hydrology Lab

An interactive hydrology and hydraulics learning platform built with React, TypeScript, and Vite. The application teaches engineering hydrology, open-channel hydraulics, hydromechanics, hydrogeology, SWMM-related urban stormwater concepts, and related topics through calculators, simulators, and visual explanations. [page:4]

**Live site:** [aquifer-quest-zone.lovable.app](https://aquifer-quest-zone.lovable.app/) [page:4]

## Overview

Ponce Hydrology Lab is a fully client-side educational web application inspired by the work of **Prof. Victor Miguel Ponce** of San Diego State University. It combines interactive calculators, guided learning paths, concept maps, synchronized lecture companions, and embedded documentation into a single browser-based experience. [page:4]

The project is aimed at hydrology students, civil and environmental engineers, and researchers working in eco-hydrology, hydrogeomorphology, and hydraulic modeling. It runs entirely in the browser, with no backend, database, or authentication layer. [page:4]

## Features

- **33 interactive modules** across **11 hydrologic domains**. [page:4]
- **Calculator Hub** for searching and filtering all available modules. [page:4]
- **Workflow Builder** for chaining calculators into multi-step hydrologic workflows. [page:4]
- **Nutshells Knowledge Graph** with 60+ connected concepts, equations, and references. [page:4]
- **Video Lecture Companion** with synchronized diagrams and instructional context. [page:4]
- **Integrated documentation** with theory, equations, and references. [page:4]
- **6 institutional themes**: Ponce Lab, SDSU, UF, OSU, Auburn, and EPA. [page:4]
- **Dark/light mode** with theme persistence in localStorage. [page:4]
- **Responsive design** for desktop, tablet, and mobile. [page:4]
- **Extracted calculation libraries** in `src/lib/hydrology/` backed by **125 unit tests across 11 suites**. [page:4]

## Module Domains

The module catalog is organized into 11 scientific domains with URL-based routing through `/modules/:moduleId`. [page:4]

| Domain | Example Modules |
|---|---|
| Engineering Hydrology | CN Calculator, Unit Hydrograph, Rational Method, Flood Frequency, Muskingum Routing [page:4] |
| Open-Channel Hydraulics | Manning Rating Curve, Specific Energy & Momentum, GVF Profiles, Froude Explorer, Culvert Analyzer [page:4] |
| Hydromechanics | Saint-Venant Visualizer, Wave Propagation Lab, Vedernikov Roll Wave [page:4] |
| Hydrogeology | Groundwater Simulator, Theis Well Calculator, Baseflow Recession, GW Recharge [page:4] |
| Hydrogeomorphology | Stable Channel Wizard, Tractive Force Wizard, Lane’s Balance, Channel Classification [page:4] |
| Hydrosedimentology | Sediment Transport, Form Friction Decomposer [page:4] |
| Hydroclimatology | Albedo Water Balance, ET Calculator Suite [page:4] |
| Hydroecology & Water Balance | Catchment Water Balance, HydroEcological Tracker, Environmental Flow [page:4] |
| Hydraulic Structures | Spillway Designer, Stilling Basin Designer [page:4] |
| Urban Stormwater (SWMM) | SWMM Calculator [page:4] |
| Learning & Platform | Workflow Builder, Nutshells Graph, Video Lectures, Calculator Hub, Documentation [page:4] |

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18.3 [page:4] |
| Language | TypeScript 5.8 [page:4] |
| Build Tool | Vite 5.4 [page:4] |
| Styling | Tailwind CSS 3.4 + tailwindcss-animate [page:4] |
| UI Components | shadcn/ui with Radix primitives [page:4] |
| Charts | Recharts 2.15 [page:4] |
| Icons | Lucide React [page:4] |
| Routing | React Router DOM 6.30 [page:4] |
| Testing | Vitest 3.2 + Testing Library [page:4] |

## Project Structure

```text
src/
├── main.tsx
├── App.tsx
├── pages/
│   ├── Index.tsx
│   ├── ModulePage.tsx
│   └── NotFound.tsx
├── components/
│   ├── Header.tsx
│   ├── Hero.tsx
│   ├── GettingStarted.tsx
│   ├── ModulesSection.tsx
│   ├── CalculatorHub.tsx
│   ├── Documentation.tsx
│   └── ...
├── lib/
│   └── hydrology/
│       ├── cn-method.ts
│       ├── muskingum.ts
│       ├── saint-venant.ts
│       ├── open-channel.ts
│       ├── swmm.ts
│       ├── groundwater.ts
│       └── __tests__/
└── public/
```

The project also includes a `handover.md` file with a comprehensive technical walkthrough covering routing, theming, module mappings, extracted libraries, testing, and future work. [page:4]

## Routing

The app uses URL-based module routing so each calculator or simulator can be linked directly. The main routes are `/` for the landing page, `/modules/:moduleId` for module rendering, and `*` for the 404 page. [page:4]

## Themes and Dark Mode

The interface supports six branding themes and a separate dark/light mode toggle. Theme choice is stored in `localStorage` under `uni-theme`, and the theme classes override CSS variables to re-skin buttons, cards, gradients, charts, and other semantic UI elements. [page:4]

## Development

```bash
npm install
npm run dev
```

The default Lovable-generated README indicates the project uses Node.js and npm for local development, and the repository contains the standard Vite project files including `package.json`, `vite.config.ts`, and `tsconfig` files. [page:4]

## Testing

Scientific calculations are extracted into reusable library modules under `src/lib/hydrology/`, with 125 unit tests across 11 suites covering topics such as Curve Number runoff, Muskingum routing, Saint-Venant equations, groundwater, SWMM-related calculations, energy balance, and stable channel design. [page:4]

## Attribution

All scientific content is based on the work of **Prof. Victor Miguel Ponce**, San Diego State University, with source material associated with [ponce.sdsu.edu](https://ponce.sdsu.edu/). The site footer described in the handover notes also states that the project is for educational purposes and is not affiliated with SDSU. [page:4]

## Notes

The current repository README is still the default Lovable template rather than project-specific documentation. Replacing it with a focused README like this would make the repository much clearer for users, contributors, and students. [page:4]
