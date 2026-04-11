import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const MODULE_ROUTES: Record<string, string> = {
  "CN Calculator": "cn-calculator",
  "Unit Hydrograph": "unit-hydrograph",
  "Rational Method": "rational-method",
  "Flood Frequency": "flood-frequency",
  "Muskingum Routing": "muskingum-routing",
  "Manning Rating": "manning-rating",
  "Specific Energy": "specific-energy",
  "GVF Profiles": "gvf-profiles",
  "Froude Explorer": "froude-explorer",
  "Culvert Analyzer": "culvert-hydraulics",
  "Saint-Venant": "saint-venant",
  "Wave Propagation": "wave-propagation",
  "Vedernikov Roll Wave": "vedernikov",
  "Groundwater Sim": "groundwater",
  "Theis Well": "theis-well",
  "Baseflow Recession": "baseflow-recession",
  "GW Recharge": "gw-recharge",
  "Channel Design": "channel-design",
  "Tractive Force": "tractive-force",
  "Lane's Balance": "lanes-balance",
  "Channel Class.": "channel-classification",
  "Sediment Transport": "sediment-transport",
  "Form Friction": "form-friction",
  "Albedo & Energy": "albedo",
  "ET Calculator": "et-calculator",
  "Water Balance": "catchment-water-balance",
  "Eco Tracker": "hydroecology",
  "Env. Flow": "environmental-flow",
  "Spillway Design": "spillway-design",
  "Stilling Basin": "stilling-basin",
  "SWMM Calculator": "swmm-calculator",
  "Workflow Builder": "workflow-builder",
  "Nutshells Graph": "nutshells-graph",
  "Video Companion": "video-lectures",
};

const MODULES = [
  { id: "eng", label: "Engineering Hydrology", count: 5, icon: "⚡", color: "#0ea5e9", items: ["CN Calculator", "Unit Hydrograph", "Rational Method", "Flood Frequency", "Muskingum Routing"] },
  { id: "och", label: "Open-Channel Hydraulics", count: 5, icon: "🌊", color: "#06b6d4", items: ["Manning Rating", "Specific Energy", "GVF Profiles", "Froude Explorer", "Culvert Analyzer"] },
  { id: "hmc", label: "Hydromechanics", count: 3, icon: "∿", color: "#14b8a6", items: ["Saint-Venant", "Wave Propagation", "Vedernikov Roll Wave"] },
  { id: "hgeo", label: "Hydrogeology", count: 4, icon: "◉", color: "#10b981", items: ["Groundwater Sim", "Theis Well", "Baseflow Recession", "GW Recharge"] },
  { id: "hgm", label: "Hydrogeomorphology", count: 4, icon: "⛰", color: "#22c55e", items: ["Channel Design", "Tractive Force", "Lane's Balance", "Channel Class."] },
  { id: "sed", label: "Hydrosedimentology", count: 2, icon: "⏚", color: "#84cc16", items: ["Sediment Transport", "Form Friction"] },
  { id: "clim", label: "Hydroclimatology", count: 2, icon: "☀", color: "#eab308", items: ["Albedo & Energy", "ET Calculator"] },
  { id: "eco", label: "Hydroecology", count: 3, icon: "🌿", color: "#f97316", items: ["Water Balance", "Eco Tracker", "Env. Flow"] },
  { id: "str", label: "Hydraulic Structures", count: 2, icon: "◧", color: "#ef4444", items: ["Spillway Design", "Stilling Basin"] },
  { id: "swmm", label: "Urban Stormwater", count: 1, icon: "🏙", color: "#a855f7", items: ["SWMM Calculator"] },
  { id: "learn", label: "Learning Tools", count: 3, icon: "📖", color: "#ec4899", items: ["Workflow Builder", "Nutshells Graph", "Video Companion"] },
];

const TOTAL = MODULES.reduce((s, m) => s + m.count, 0);

function Counter({ end, duration = 1800, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - t, 3);
          setVal(Math.round(ease * end));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.disconnect();
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{val}{suffix}</span>;
}

function RainCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let raf: number;
    const drops = Array.from({ length: 60 }, () => ({
      x: Math.random() * 1400,
      y: Math.random() * 700,
      l: 8 + Math.random() * 18,
      v: 2 + Math.random() * 4,
      o: 0.08 + Math.random() * 0.15,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, 1400, 700);
      drops.forEach(d => {
        ctx.strokeStyle = `rgba(180,220,255,${d.o})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 1, d.y + d.l);
        ctx.stroke();
        d.y += d.v;
        if (d.y > 700) { d.y = -d.l; d.x = Math.random() * 1400; }
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={canvasRef} width={1400} height={700} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.6 }} />;
}

export default function PonceHydrologyLab() {
  const navigate = useNavigate();
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
  const [dark, setDark] = useState(true);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const goToModule = (name: string) => {
    const route = MODULE_ROUTES[name];
    if (route) navigate(`/modules/${route}`);
  };

  const bg = dark ? "#0a1628" : "#f0f7fc";
  const fg = dark ? "#e2edf8" : "#1a2a3a";
  const muted = dark ? "rgba(180,210,240,0.5)" : "rgba(40,80,120,0.5)";
  const cardBg = dark ? "rgba(15,30,55,0.7)" : "rgba(255,255,255,0.85)";
  const border = dark ? "rgba(60,120,200,0.15)" : "rgba(0,60,130,0.08)";
  const heroGrad = dark
    ? "linear-gradient(165deg, #081a30 0%, #0c2d4a 40%, #0f3d5e 70%, #0a2540 100%)"
    : "linear-gradient(165deg, #1a6fa0 0%, #2488be 40%, #3aa0d4 70%, #1976a0 100%)";

  return (
    <div style={{ background: bg, color: fg, minHeight: "100vh", fontFamily: "'Instrument Serif', 'Georgia', serif", transition: "background 0.4s, color 0.4s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;1,9..40,400&display=swap');
        .fade-up { opacity: 0; transform: translateY(30px); animation: fadeUp 0.7s ease forwards; }
        .fade-up-d1 { animation-delay: 0.15s; }
        .fade-up-d2 { animation-delay: 0.3s; }
        .fade-up-d3 { animation-delay: 0.45s; }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes drift { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-12px) rotate(2deg); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .domain-pill { transition: all 0.25s ease; cursor: pointer; }
        .domain-pill:hover { transform: translateY(-2px) scale(1.03); }
        .module-chip { transition: all 0.2s ease; }
        .module-chip:hover { transform: scale(1.06); }
        .stat-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .stat-card:hover { transform: translateY(-4px); }
        .wave-path { animation: waveDrift 6s ease-in-out infinite; }
        @keyframes waveDrift { 0%,100% { d: path("M0,40 Q175,10 350,35 T700,30 L700,80 L0,80 Z"); } 50% { d: path("M0,35 Q175,50 350,25 T700,40 L700,80 L0,80 Z"); } }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: scrollY > 60 ? (dark ? "rgba(10,22,40,0.92)" : "rgba(240,247,252,0.92)") : "transparent",
        backdropFilter: scrollY > 60 ? "blur(16px)" : "none",
        borderBottom: scrollY > 60 ? `1px solid ${border}` : "none",
        transition: "all 0.3s ease",
        padding: "0 clamp(16px, 4vw, 48px)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate("/")}>
            <svg width="28" height="28" viewBox="0 0 28 28">
              <circle cx="14" cy="14" r="12" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.5" />
              <path d="M14 6 C14 6, 8 14, 8 18 C8 21.3 10.7 24 14 24 C17.3 24 20 21.3 20 18 C20 14 14 6 14 6Z" fill="#38bdf8" opacity="0.8" />
            </svg>
            <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, fontWeight: 400, letterSpacing: "-0.01em" }}>Ponce Lab</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24, fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 500, letterSpacing: "0.02em" }}>
            <a href="#modules" style={{ color: muted, textDecoration: "none", transition: "color 0.2s" }}>Modules</a>
            <a href="#domains" style={{ color: muted, textDecoration: "none", transition: "color 0.2s" }}>Domains</a>
            <span onClick={() => navigate("/")} style={{ color: muted, textDecoration: "none", cursor: "pointer" }}>Classic View</span>
            <a href="https://ponce.sdsu.edu" target="_blank" rel="noreferrer" style={{ color: muted, textDecoration: "none" }}>Source ↗</a>
            <button onClick={() => setDark(!dark)} style={{
              background: dark ? "rgba(56,189,248,0.12)" : "rgba(0,80,160,0.08)",
              border: `1px solid ${dark ? "rgba(56,189,248,0.2)" : "rgba(0,80,160,0.12)"}`,
              borderRadius: 99, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: fg, fontSize: 16, transition: "all 0.3s",
            }}>
              {dark ? "☀" : "☾"}
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header style={{
        position: "relative", overflow: "hidden",
        background: heroGrad,
        minHeight: "min(92vh, 720px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "100px clamp(20px, 5vw, 60px) 80px",
      }}>
        <RainCanvas />
        {[0,1,2,3,4].map(i => (
          <svg key={i} width="24" height="24" viewBox="0 0 24 24" style={{
            position: "absolute",
            left: `${15 + i * 18}%`, top: `${20 + (i % 3) * 25}%`,
            opacity: 0.06, animation: `drift ${4 + i}s ease-in-out infinite`, animationDelay: `${i * 0.8}s`,
          }}>
            <path d="M12 2C12 2 5 12 5 16.5C5 20.1 8.1 23 12 23C15.9 23 19 20.1 19 16.5C19 12 12 2 12 2Z" fill="white" />
          </svg>
        ))}

        <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 780 }}>
          <div className="fade-up" style={{
            display: "inline-block", padding: "6px 18px", borderRadius: 99,
            background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.2)",
            fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, fontWeight: 600,
            letterSpacing: "0.08em", textTransform: "uppercase", color: "#7dd3fc", marginBottom: 32,
          }}>
            Interactive Hydrology Education
          </div>

          <h1 className="fade-up fade-up-d1" style={{
            fontSize: "clamp(42px, 7vw, 82px)", fontWeight: 400, lineHeight: 1.05,
            letterSpacing: "-0.03em", color: "#f0f9ff", marginBottom: 12,
          }}>
            Ponce Hydrology
          </h1>
          <h1 className="fade-up fade-up-d1" style={{
            fontSize: "clamp(42px, 7vw, 82px)", fontWeight: 400, fontStyle: "italic",
            lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: 32,
            background: "linear-gradient(90deg, #38bdf8, #67e8f9, #a5f3fc, #67e8f9, #38bdf8)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            animation: "shimmer 4s linear infinite",
          }}>
            Lab
          </h1>

          <p className="fade-up fade-up-d2" style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(15px, 2vw, 18px)",
            lineHeight: 1.7, color: "rgba(186,220,248,0.75)", maxWidth: 540, margin: "0 auto 40px",
          }}>
            Explore the science of water through interactive calculators, simulators, and visualizations — based on the work of <span style={{ color: "#7dd3fc", fontWeight: 500 }}>Prof. Victor Miguel Ponce</span> at San Diego State University.
          </p>

          <div className="fade-up fade-up-d3" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="#domains" style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 14.5, fontWeight: 600,
              padding: "13px 32px", borderRadius: 99,
              background: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
              color: "#fff", textDecoration: "none",
              boxShadow: "0 4px 20px rgba(14,165,233,0.35)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}>
              Explore {TOTAL} Modules →
            </a>
            <a href="https://ponce.sdsu.edu" target="_blank" rel="noreferrer" style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 14.5, fontWeight: 500,
              padding: "13px 28px", borderRadius: 99,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)",
              color: "#bae6fd", textDecoration: "none", backdropFilter: "blur(8px)",
              transition: "background 0.2s",
            }}>
              Learn More
            </a>
          </div>
        </div>

        <svg viewBox="0 0 700 80" preserveAspectRatio="none" style={{ position: "absolute", bottom: -1, left: 0, right: 0, width: "100%", height: 80 }}>
          <path className="wave-path" d="M0,40 Q175,10 350,35 T700,30 L700,80 L0,80 Z" fill={bg} />
        </svg>
      </header>

      {/* STATS */}
      <section id="modules" style={{ padding: "60px clamp(20px, 5vw, 60px)", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20 }}>
          {[
            { n: TOTAL, label: "Interactive Modules", suffix: "" },
            { n: 11, label: "Scientific Domains", suffix: "" },
            { n: 380, label: "Concepts Covered", suffix: "+" },
            { n: 60, label: "Knowledge Nodes", suffix: "+" },
          ].map((s, i) => (
            <div key={i} className="stat-card" style={{
              background: cardBg, border: `1px solid ${border}`, borderRadius: 16,
              padding: "28px 24px", textAlign: "center",
              boxShadow: dark ? "0 4px 24px rgba(0,0,0,0.3)" : "0 4px 24px rgba(0,40,100,0.06)",
            }}>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 38, fontWeight: 400, color: "#38bdf8", lineHeight: 1.1 }}>
                <Counter end={s.n} suffix={s.suffix} />
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: muted, marginTop: 6, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* DOMAINS */}
      <section id="domains" style={{ padding: "40px clamp(20px, 5vw, 60px) 80px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 400, letterSpacing: "-0.02em", marginBottom: 12 }}>
            The Periodic Table of <span style={{ fontStyle: "italic", color: "#38bdf8" }}>Hydrology</span>
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: muted, maxWidth: 520, margin: "0 auto" }}>
            {TOTAL} modules organized across 11 scientific domains. Click any domain to explore its tools.
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 32 }}>
          {MODULES.map(m => {
            const active = activeDomain === m.id;
            return (
              <button key={m.id} className="domain-pill" onClick={() => setActiveDomain(active ? null : m.id)} style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
                padding: "8px 16px", borderRadius: 99,
                border: `1.5px solid ${active ? m.color : border}`,
                background: active ? `${m.color}18` : cardBg,
                color: active ? m.color : fg, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 7,
              }}>
                <span style={{ fontSize: 15 }}>{m.icon}</span>
                {m.label}
                <span style={{
                  background: active ? m.color : (dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"),
                  color: active ? "#fff" : muted,
                  fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
                  transition: "all 0.2s",
                }}>{m.count}</span>
              </button>
            );
          })}
        </div>

        {activeDomain && (() => {
          const m = MODULES.find(d => d.id === activeDomain)!;
          return (
            <div style={{
              background: cardBg, border: `1px solid ${m.color}30`, borderRadius: 20,
              padding: "32px 36px", marginBottom: 32,
              boxShadow: `0 8px 40px ${m.color}10`,
              animation: "fadeUp 0.35s ease forwards",
            }}>
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 700, color: m.color, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>{m.icon}</span> {m.label}
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {m.items.map((item, i) => (
                  <span key={i} className="module-chip" onClick={() => goToModule(item)} style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 500,
                    padding: "10px 18px", borderRadius: 12,
                    background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                    border: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                    cursor: "pointer", color: fg,
                  }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          );
        })()}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
          {MODULES.map(m => (
            <button key={m.id} className="stat-card" onClick={() => setActiveDomain(activeDomain === m.id ? null : m.id)} style={{
              background: activeDomain === m.id ? `${m.color}10` : cardBg,
              border: `1px solid ${activeDomain === m.id ? `${m.color}40` : border}`,
              borderRadius: 16, padding: "22px 20px", textAlign: "left", cursor: "pointer",
              boxShadow: dark ? "0 2px 12px rgba(0,0,0,0.2)" : "0 2px 12px rgba(0,40,100,0.04)",
              transition: "all 0.25s ease",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <span style={{ fontSize: 26 }}>{m.icon}</span>
                <span style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700,
                  background: `${m.color}18`, color: m.color, padding: "3px 9px", borderRadius: 99,
                }}>{m.count} tools</span>
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: muted, lineHeight: 1.5 }}>
                {m.items.slice(0, 3).join(" · ")}{m.items.length > 3 ? " …" : ""}
              </div>
              <div style={{ marginTop: 14, height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${m.color}, transparent)`, opacity: activeDomain === m.id ? 1 : 0.3, transition: "opacity 0.3s" }} />
            </button>
          ))}
        </div>
      </section>

      {/* LEARNING PATHS */}
      <section style={{ padding: "60px clamp(20px, 5vw, 60px) 80px", maxWidth: 1200, margin: "0 auto" }}>
        <h2 style={{ fontSize: "clamp(26px, 3.5vw, 38px)", fontWeight: 400, letterSpacing: "-0.02em", textAlign: "center", marginBottom: 40 }}>
          Guided Learning <span style={{ fontStyle: "italic", color: "#38bdf8" }}>Paths</span>
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
          {[
            { title: "Beginner", desc: "Fundamentals of rainfall-runoff, Manning's equation, and the water cycle.", modules: "6 modules", accent: "#22d3ee", tag: "Start Here" },
            { title: "Practitioner", desc: "Flood routing, channel design, SWMM simulation, and engineering methods.", modules: "12 modules", accent: "#38bdf8", tag: "Core Skills" },
            { title: "Researcher", desc: "Saint-Venant equations, eco-hydrology, hydrogeomorphology, and wave mechanics.", modules: "15 modules", accent: "#818cf8", tag: "Advanced" },
          ].map((p, i) => (
            <div key={i} style={{
              background: cardBg, border: `1px solid ${border}`, borderRadius: 18,
              padding: "28px 26px",
              boxShadow: dark ? "0 4px 24px rgba(0,0,0,0.25)" : "0 4px 24px rgba(0,40,100,0.05)",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${p.accent}, transparent)` }} />
              <span style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700,
                color: p.accent, textTransform: "uppercase", letterSpacing: "0.08em",
              }}>{p.tag}</span>
              <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, fontWeight: 400, marginTop: 8, marginBottom: 10 }}>{p.title}</h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.65, color: muted, marginBottom: 16 }}>{p.desc}</p>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: p.accent }}>{p.modules} →</span>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: `1px solid ${border}`,
        padding: "40px clamp(20px, 5vw, 60px)",
        maxWidth: 1200, margin: "0 auto",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18, marginBottom: 4 }}>Ponce Hydrology Lab</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, color: muted, lineHeight: 1.6 }}>
            Based on the work of Prof. Victor Miguel Ponce · San Diego State University
          </div>
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: muted }}>
          Educational use · Client-side · Open source
        </div>
      </footer>
    </div>
  );
}
