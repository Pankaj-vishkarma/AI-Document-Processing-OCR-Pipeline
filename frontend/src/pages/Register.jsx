import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";

/* ═══════════════════════════════════════════════════
   GLOBAL CSS — identical to Login page
═══════════════════════════════════════════════════ */
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
    --ink:    #06060a;
    --edge:   rgba(255,255,255,0.08);
    --glow-a: #5b6ef5;
    --glow-b: #a855f7;
    --glow-c: #22d3ee;
    --text:   #e8e8f0;
    --muted:  #8888a8;
    --accent: #7c84ff;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: var(--ink); color: var(--text); font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
  .syne { font-family: 'Syne', sans-serif; }

  /* ── Blob animations ── */
  @keyframes blobA { 0%,100%{transform:translate(0,0) scale(1);} 33%{transform:translate(40px,-30px) scale(1.08);} 66%{transform:translate(-20px,20px) scale(0.94);} }
  @keyframes blobB { 0%,100%{transform:translate(0,0) scale(1);} 40%{transform:translate(-50px,30px) scale(1.1);} 75%{transform:translate(25px,-20px) scale(0.92);} }
  @keyframes blobC { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(30px,40px) scale(1.05);} }
  .blob { position:absolute; border-radius:50%; filter:blur(80px); pointer-events:none; will-change:transform; }
  .blob-a { width:420px;height:420px;background:radial-gradient(circle,rgba(91,110,245,0.28),transparent 70%);top:-100px;left:-80px;animation:blobA 14s ease-in-out infinite; }
  .blob-b { width:360px;height:360px;background:radial-gradient(circle,rgba(168,85,247,0.22),transparent 70%);bottom:-60px;right:30px;animation:blobB 18s ease-in-out infinite; }
  .blob-c { width:240px;height:240px;background:radial-gradient(circle,rgba(34,211,238,0.16),transparent 70%);top:45%;left:35%;animation:blobC 22s ease-in-out infinite; }

  /* ── Particles ── */
  .particle { position:absolute; border-radius:50%; background:rgba(255,255,255,0.45); pointer-events:none; animation:pf linear infinite; will-change:transform,opacity; }
  @keyframes pf { 0%{transform:translateY(100vh) scale(0);opacity:0;} 8%{opacity:0.7;} 92%{opacity:0.25;} 100%{transform:translateY(-8vh) scale(1.1);opacity:0;} }

  /* ── Floating doc cards ── */
  @keyframes fc1 { 0%,100%{transform:translateY(0px) rotate(-3deg);} 50%{transform:translateY(-13px) rotate(-1deg);} }
  @keyframes fc2 { 0%,100%{transform:translateY(0px) rotate(4deg);}  50%{transform:translateY(-10px) rotate(2deg);} }
  @keyframes fc3 { 0%,100%{transform:translateY(0px) rotate(-1.5deg);} 50%{transform:translateY(-16px) rotate(1deg);} }
  @keyframes fc4 { 0%,100%{transform:translateY(0px) rotate(5deg);}  50%{transform:translateY(-8px) rotate(3deg);} }

  /* ── Scan line ── */
  @keyframes scan { 0%{top:8%;opacity:0;} 5%{opacity:1;} 95%{opacity:1;} 100%{top:92%;opacity:0;} }
  .scan-line { animation:scan 3s ease-in-out infinite; }

  /* ── Cursor blink ── */
  @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0;} }
  .cursor { animation:blink 0.75s step-end infinite; }

  /* ── Fade-up entrance ── */
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
  .fu  { animation:fadeUp 0.5s ease forwards; opacity:0; }
  .d1  { animation-delay:0.07s; }
  .d2  { animation-delay:0.16s; }
  .d3  { animation-delay:0.25s; }
  .d4  { animation-delay:0.34s; }
  .d5  { animation-delay:0.43s; }
  .d6  { animation-delay:0.52s; }

  /* ── Input ── */
  .ai-input {
    width:100%;
    background:rgba(255,255,255,0.04);
    border:1px solid var(--edge);
    border-radius:13px;
    padding:14px 14px 14px 44px;
    color:var(--text);
    font-family:'DM Sans',sans-serif;
    font-size:0.97rem;
    outline:none;
    transition:border-color 0.2s,background 0.2s,box-shadow 0.2s;
    -webkit-appearance:none;
    appearance:none;
  }
  .ai-input::placeholder { color:var(--muted); }
  .ai-input:focus {
    border-color:var(--accent);
    background:rgba(124,132,255,0.06);
    box-shadow:0 0 0 3px rgba(124,132,255,0.14);
  }
  .ai-input.error {
    border-color:#f87171;
    box-shadow:0 0 0 3px rgba(248,113,113,0.14);
  }

  /* ── CTA Button ── */
  .ai-btn {
    width:100%; padding:15px; border:none; border-radius:13px;
    background:linear-gradient(135deg,var(--glow-a),var(--glow-b));
    color:#fff; font-family:'Syne',sans-serif; font-size:1rem; font-weight:700;
    letter-spacing:0.025em; cursor:pointer; position:relative; overflow:hidden;
    transition:transform 0.18s,box-shadow 0.18s; touch-action:manipulation;
  }
  .ai-btn:hover:not(:disabled) { transform:scale(1.02) translateY(-1px); box-shadow:0 10px 32px rgba(91,110,245,0.42); }
  .ai-btn:active:not(:disabled) { transform:scale(0.975); }
  .ai-btn:disabled { opacity:0.6; cursor:not-allowed; }
  .ai-btn::after { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,0.14),transparent); pointer-events:none; }

  /* ── Glass card ── */
  .glass { background:rgba(11,11,22,0.78); backdrop-filter:blur(26px); -webkit-backdrop-filter:blur(26px); border:1px solid var(--edge); }

  /* ── Doc badge ── */
  .doc-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:100px; border:1px solid rgba(255,255,255,0.09); background:rgba(255,255,255,0.04); font-size:0.68rem; color:var(--muted); white-space:nowrap; }

  /* ── Stat mini ── */
  .stat-mini { background:rgba(255,255,255,0.04); border:1px solid var(--edge); border-radius:11px; padding:10px 13px; flex:1; min-width:0; }

  /* ── Feature grid ── */
  .feat-grid { display:grid; grid-template-columns:1fr 1fr; gap:7px; }
  .feat-item { display:flex; align-items:center; gap:8px; padding:7px 9px; background:rgba(255,255,255,0.03); border:1px solid var(--edge); border-radius:9px; }

  /* ── Thin divider ── */
  .divider { height:1px; background:linear-gradient(90deg,transparent,var(--edge),transparent); }

  /* ── Spin loader ── */
  @keyframes spin { to{transform:rotate(360deg);} }
  .spin { animation:spin 0.75s linear infinite; }

  /* ── Password strength ── */
  .strength-bar { height:3px; border-radius:2px; transition:width 0.4s ease, background 0.4s ease; }

  /* ══════════════════════════════════════════════
     RESPONSIVE BREAKPOINTS
  ══════════════════════════════════════════════ */

  @media (min-width:1440px) {
    .reg-root    { padding:0; }
    .left-panel  { padding:40px 48px 40px 64px !important; }
    .right-panel { padding:32px 64px 32px 40px !important; }
    .form-inner  { padding:44px 56px !important; }
    .form-title  { font-size:2.1rem !important; }
  }

  @media (max-width:1024px) and (min-width:769px) {
    .left-panel  { padding:28px 28px 28px 36px !important; flex:0 0 44% !important; }
    .right-panel { flex:0 0 56% !important; padding:20px 28px 20px 24px !important; }
    .form-inner  { padding:32px 32px !important; }
    .form-title  { font-size:1.7rem !important; }
    .feat-grid   { grid-template-columns:1fr 1fr; }
    .stat-mini   { padding:8px 10px !important; }
  }

  @media (max-width:768px) and (min-width:481px) {
    html,body { overflow-y:auto !important; }
    .reg-root    { flex-direction:column !important; min-height:100vh !important; height:auto !important; overflow:visible !important; }
    .left-panel  { display:flex !important; flex:none !important; width:100% !important; padding:28px 32px 24px !important; flex-direction:column !important; justify-content:flex-start !important; overflow:visible !important; }
    .left-extras { display:none !important; }
    .right-panel { flex:none !important; width:100% !important; padding:0 24px 40px !important; align-items:center !important; }
    .right-panel .accent-divider { display:none !important; }
    .form-inner  { padding:28px 24px !important; border-radius:20px !important; }
    .form-title  { font-size:1.6rem !important; }
    .floating-cards { display:none !important; }
    .feat-grid   { grid-template-columns:1fr 1fr 1fr !important; }
  }

  @media (max-width:480px) {
    html,body { overflow-y:auto !important; }
    .reg-root    { flex-direction:column !important; min-height:100vh !important; height:auto !important; overflow:visible !important; padding:0 !important; }
    .left-panel  { display:none !important; }
    .right-panel { flex:none !important; width:100% !important; min-height:100vh !important; padding:20px 16px 32px !important; align-items:center !important; justify-content:flex-start !important; }
    .right-panel .accent-divider { display:none !important; }
    .form-inner  { padding:24px 18px !important; border-radius:18px !important; }
    .form-title  { font-size:1.4rem !important; }
    .mobile-brand { display:flex !important; }
    .ai-input    { font-size:16px !important; }
    .ai-btn      { padding:16px !important; font-size:1rem !important; }
  }
`;

/* ═══════════════════════════════════
   useWindowSize hook
═══════════════════════════════════ */
const useWindowSize = () => {
    const [size, setSize] = useState({
        w: typeof window !== "undefined" ? window.innerWidth : 1280,
        h: typeof window !== "undefined" ? window.innerHeight : 800,
    });
    useEffect(() => {
        const handle = () => setSize({ w: window.innerWidth, h: window.innerHeight });
        window.addEventListener("resize", handle, { passive: true });
        return () => window.removeEventListener("resize", handle);
    }, []);
    return size;
};

/* ═══════════════════════════════════
   SVG Icon
═══════════════════════════════════ */
const Icon = ({ d, size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
);
const IC = {
    user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z",
    email: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm16 2l-8 5-8-5",
    lock: "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4",
    eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
    eyeOff: "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22",
    phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.22 1.18 2 2 0 012.22 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.56-.56a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z",
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
};

/* ═══════════════════════════════════
   Particles
═══════════════════════════════════ */
const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    size: Math.random() * 1.8 + 0.4,
    left: Math.random() * 100,
    delay: Math.random() * 18,
    dur: Math.random() * 14 + 11,
}));
const Particles = () => (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        {PARTICLES.map(p => (
            <div key={p.id} className="particle" style={{ width: p.size, height: p.size, left: `${p.left}%`, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`, opacity: 0.3 }} />
        ))}
    </div>
);

/* ═══════════════════════════════════
   Typing text
═══════════════════════════════════ */
const PHRASES = ["Join DocIntel Today...", "Start Processing Documents...", "AI-Powered Extraction...", "Automate Your Workflow...", "Unlock Document Intelligence..."];
const TypingText = () => {
    const [pi, setPi] = useState(0);
    const [txt, setTxt] = useState("");
    const [del, setDel] = useState(false);
    useEffect(() => {
        const p = PHRASES[pi];
        let t;
        if (!del && txt.length < p.length) t = setTimeout(() => setTxt(p.slice(0, txt.length + 1)), 58);
        else if (!del) t = setTimeout(() => setDel(true), 1500);
        else if (del && txt.length > 0) t = setTimeout(() => setTxt(txt.slice(0, -1)), 30);
        else { setDel(false); setPi(i => (i + 1) % PHRASES.length); }
        return () => clearTimeout(t);
    }, [txt, del, pi]);
    return (
        <span style={{ color: "var(--accent)", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.02em" }}>
            {txt}<span className="cursor">|</span>
        </span>
    );
};

/* ═══════════════════════════════════
   Animated counter
═══════════════════════════════════ */
const useCounter = (target, dur = 1500) => {
    const [count, setCount] = useState(0);
    const [started, setStarted] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) setStarted(true); }, { threshold: 0.2 });
        if (ref.current) ob.observe(ref.current);
        return () => ob.disconnect();
    }, [started]);
    useEffect(() => {
        if (!started) return;
        let s = 0;
        const step = target / (dur / 16);
        const t = setInterval(() => { s += step; if (s >= target) { setCount(target); clearInterval(t); } else setCount(Math.floor(s)); }, 16);
        return () => clearInterval(t);
    }, [started, target, dur]);
    return { count, ref };
};
const StatMini = ({ target, suffix, label }) => {
    const { count, ref } = useCounter(target);
    return (
        <div ref={ref} className="stat-mini">
            <div className="syne" style={{ fontWeight: 800, fontSize: "1.15rem", color: "var(--text)", lineHeight: 1 }}>{count.toLocaleString()}{suffix}</div>
            <div style={{ fontSize: "0.62rem", color: "var(--muted)", marginTop: 3, letterSpacing: "0.04em" }}>{label}</div>
        </div>
    );
};

/* ═══════════════════════════════════
   OCR Scan widget
═══════════════════════════════════ */
const STEPS = ["Upload", "Preprocess", "OCR", "AI Extract", "Done ✓"];
const ScanWidget = () => {
    const [active, setActive] = useState(0);
    useEffect(() => { const t = setInterval(() => setActive(a => (a + 1) % STEPS.length), 1200); return () => clearInterval(t); }, []);
    return (
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid var(--edge)", borderRadius: 11, padding: "10px 12px", position: "relative", overflow: "hidden" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 9 }}>
                {[82, 60, 74, 48].map((w, i) => <div key={i} style={{ height: 5, borderRadius: 3, width: `${w}%`, background: `rgba(255,255,255,${0.055 + i * 0.018})` }} />)}
            </div>
            <div className="scan-line" style={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,var(--glow-a),var(--glow-c),transparent)", boxShadow: "0 0 8px var(--glow-a)", zIndex: 2 }} />
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {STEPS.map((s, i) => (
                    <div key={s} style={{ padding: "2px 8px", borderRadius: 100, fontSize: "0.6rem", fontWeight: 700, fontFamily: "'Syne',sans-serif", letterSpacing: "0.02em", transition: "all 0.35s ease", background: i <= active ? "linear-gradient(135deg,var(--glow-a),var(--glow-b))" : "rgba(255,255,255,0.05)", color: i <= active ? "#fff" : "var(--muted)" }}>
                        {s}
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ═══════════════════════════════════
   Floating doc cards
═══════════════════════════════════ */
const FCARDS = [
    { name: "Invoice.pdf", icon: "📄", color: "#5b6ef5", anim: "fc1", delay: "0s", top: "10%", right: "3%" },
    { name: "Receipt.png", icon: "🧾", color: "#a855f7", anim: "fc2", delay: "0.9s", top: "30%", right: "0%" },
    { name: "Contract.pdf", icon: "📋", color: "#22d3ee", anim: "fc3", delay: "0.4s", top: "55%", right: "4%" },
    { name: "BizCard.jpg", icon: "💼", color: "#f59e0b", anim: "fc4", delay: "1.5s", top: "75%", right: "1%" },
];
const FloatingCards = () => (
    <div className="floating-cards">
        {FCARDS.map(c => (
            <div key={c.name} style={{ position: "absolute", top: c.top, right: c.right, animation: `${c.anim} 5s ease-in-out infinite`, animationDelay: c.delay, zIndex: 1, pointerEvents: "none" }}>
                <div style={{ background: "rgba(10,10,22,0.9)", backdropFilter: "blur(10px)", border: `1px solid ${c.color}40`, borderRadius: 9, padding: "5px 11px", display: "flex", alignItems: "center", gap: 6, boxShadow: `0 4px 14px ${c.color}20`, whiteSpace: "nowrap" }}>
                    <span style={{ fontSize: 12 }}>{c.icon}</span>
                    <span style={{ fontSize: "0.65rem", color: "var(--muted)" }}>{c.name}</span>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: c.color, boxShadow: `0 0 5px ${c.color}` }} />
                </div>
            </div>
        ))}
    </div>
);

/* ═══════════════════════════════════
   Feature data
═══════════════════════════════════ */
const FEATS = [
    { icon: "🔍", label: "Smart OCR" },
    { icon: "🤖", label: "AI Classification" },
    { icon: "📑", label: "Multi-page PDF" },
    { icon: "📊", label: "Table Detection" },
    { icon: "⚡", label: "Real-time AI" },
    { icon: "🌍", label: "Multi-language" },
];
const DOC_TYPES = ["Invoice", "Receipt", "Business Card", "Contract", "ID Card"];

/* ═══════════════════════════════════
   Tablet banner
═══════════════════════════════════ */
const TabletBanner = () => (
    <div style={{ marginBottom: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 30, height: 30, background: "linear-gradient(135deg,var(--glow-a),var(--glow-b))", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>⚡</div>
            <span className="syne" style={{ fontWeight: 700, fontSize: "0.9rem" }}>DocIntel</span>
        </div>
        <h2 className="syne" style={{ fontSize: "clamp(1.3rem,4vw,1.8rem)", fontWeight: 800, lineHeight: 1.2, marginBottom: 8 }}>
            AI‑Powered{" "}
            <span style={{ background: "linear-gradient(90deg,var(--glow-a),var(--glow-b),var(--glow-c))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Document Intelligence
            </span>{" "}Platform
        </h2>
        <p style={{ color: "var(--muted)", fontSize: "0.82rem", lineHeight: 1.6, marginBottom: 14, maxWidth: 560 }}>
            Extract, classify, and analyze documents automatically using OCR + AI — invoices, receipts, contracts, and more.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {FEATS.map(f => (
                <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--edge)", borderRadius: 8, fontSize: "0.72rem", color: "var(--text)" }}>
                    <span style={{ fontSize: 12 }}>{f.icon}</span>{f.label}
                </div>
            ))}
        </div>
    </div>
);

/* ═══════════════════════════════════
   Mobile brand header
═══════════════════════════════════ */
const MobileBrand = () => (
    <div className="mobile-brand" style={{ display: "none", flexDirection: "column", alignItems: "center", marginBottom: 20, textAlign: "center" }}>
        <div style={{ width: 48, height: 48, background: "linear-gradient(135deg,var(--glow-a),var(--glow-b))", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 10, boxShadow: "0 8px 24px rgba(91,110,245,0.35)" }}>⚡</div>
        <div className="syne" style={{ fontWeight: 800, fontSize: "1rem", marginBottom: 4 }}>DocIntel</div>
        <div style={{ color: "var(--muted)", fontSize: "0.75rem" }}>AI‑Powered Document Intelligence</div>
    </div>
);

/* ═══════════════════════════════════
   Password strength meter
═══════════════════════════════════ */
const getStrength = (pw) => {
    if (!pw) return { score: 0, label: "", color: "transparent" };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { score, label: "Weak", color: "#f87171", pct: "25%" };
    if (score <= 2) return { score, label: "Fair", color: "#fb923c", pct: "50%" };
    if (score <= 3) return { score, label: "Good", color: "#facc15", pct: "75%" };
    return { score, label: "Strong", color: "#4ade80", pct: "100%" };
};

const PasswordStrength = ({ password }) => {
    const s = getStrength(password);
    if (!password) return null;
    return (
        <div style={{ marginTop: 8 }}>
            <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                <div className="strength-bar" style={{ width: s.pct, background: s.color, height: "100%" }} />
            </div>
            <div style={{ marginTop: 4, fontSize: "0.68rem", color: s.color, fontWeight: 600 }}>{s.label} password</div>
        </div>
    );
};

/* ═══════════════════════════════════
   Register — main component
═══════════════════════════════════ */
const Register = () => {
    const navigate = useNavigate();
    const { w } = useWindowSize();

    /* ── original state ── */
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
    });

    const [errors, setErrors] = useState({});

    /* ── extra UI state (not sent to API) ── */
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pwMismatch, setPwMismatch] = useState(false);

    /* ── original redirect logic ── */
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) navigate("/");
    }, [navigate]);

    /* ── original handleChange ── */
    const validateField = useCallback((name, value) => {
        const v = (value || "").toString();
        let msg = "";
        if (name === "username") {
            const trimmed = v.trim();
            if (!trimmed) msg = "Username is required";
            // preserve existing allowed-char/length rule
            else if (!/^[A-Za-z0-9._-]{3,50}$/.test(trimmed)) msg = "Use 3–50 letters, numbers, ., _ or -";
            else if (!/[A-Za-z]/.test(trimmed)) msg = "Username must contain at least one letter"; // new: require a letter
            else if (/^\d+$/.test(trimmed)) msg = "Username cannot be only numbers"; // new: not purely numeric
            else if (/^(.+)\1+$/.test(trimmed)) msg = "Choose a less repetitive username"; // new: repeated pattern
            else {
                const low = trimmed.toLowerCase();
                const blacklist = ["qwerty", "asdf", "zxcvbn", "password", "admin", "test", "user", "123456", "111111"];
                if (blacklist.some(b => low.includes(b))) msg = "Choose a more meaningful username"; // new: common weak patterns
                else if (trimmed.length >= 8 && (trimmed.toLowerCase().match(/[aeiou]/g) || []).length < 2) msg = "Choose a more meaningful username"; // new: avoid vowel-less gibberish
            }
        }
        if (name === "email") {
            const trimmed = v.trim();
            if (!trimmed) msg = "Email is required";
            else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) msg = "Enter a valid email address";
        }
        if (name === "password") {
            if (!v) msg = "Password is required";
            else if (v.length < 8) msg = "Password must be at least 8 characters";
        }
        setErrors(prev => ({ ...prev, [name]: msg }));
        return msg === "";
    }, []);

    const handleChange = useCallback((e) => {
        const name = e.target.name;
        let value = e.target.value;

        // Prevent leading/trailing spaces for username and email
        if (name === "username" || name === "email") {
            value = value.replace(/^\s+|\s+$/g, "");
        }

        setFormData(f => ({ ...f, [name]: value }));
        validateField(name, value);
        if (name === "password") setPwMismatch(false);
    }, [validateField]);

    /* ── original handleSubmit (unchanged) ── */
    const handleSubmit = async (e) => {
        e.preventDefault();

        /* client-side confirm check — does not touch API logic */
        if (formData.password !== confirmPassword) {
            setPwMismatch(true);
            toast.error("Passwords do not match");
            return;
        }
        setPwMismatch(false);

        // Validate all fields
        const v1 = validateField("username", formData.username);
        const v2 = validateField("email", formData.email);
        const v3 = validateField("password", formData.password);

        if (!v1 || !v2 || !v3) {
            toast.error("Please fix validation errors before continuing");
            return;
        }

        try {
            setLoading(true);
            // Trim sensitive values before sending
            const payload = {
                username: (formData.username || "").toString().trim(),
                email: (formData.email || "").toString().trim(),
                password: formData.password,
            };

            await axiosInstance.post("/auth/register", payload);
            toast.success("Registration successful");
            navigate("/login");
        } catch (error) {
            toast.error(error?.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    /* breakpoint flags */
    const isMobile = w <= 480;
    const isTablet = w > 480 && w <= 768;
    const isLaptop = w > 768 && w <= 1024;
    const isDesktop = w > 1024;

    const rootStyle = {
        minHeight: "100vh",
        background: "linear-gradient(135deg,#06060a 0%,#0c0c1a 55%,#07070f 100%)",
        display: "flex",
        flexDirection: (isMobile || isTablet) ? "column" : "row",
        position: "relative",
        overflow: (isMobile || isTablet) ? "auto" : "hidden",
        ...(isDesktop && { height: "100vh" }),
    };

    /* shared label style */
    const labelStyle = {
        display: "block", marginBottom: 8, fontSize: "0.75rem",
        color: "var(--muted)", letterSpacing: "0.06em",
        textTransform: "uppercase", fontWeight: 500,
    };

    return (
        <>
            <style>{GLOBAL_STYLES}</style>

            <div className="reg-root" style={rootStyle}>
                {/* Blobs + particles */}
                <div className="blob blob-a" />
                <div className="blob blob-b" />
                <div className="blob blob-c" />
                <Particles />

                {/* ══════════ TABLET BANNER (481–768) ══════════ */}
                {isTablet && (
                    <div className="left-panel" style={{ padding: "28px 28px 20px", position: "relative", zIndex: 2 }}>
                        <TabletBanner />
                    </div>
                )}

                {/* ══════════ LEFT PANEL (≥769px) ══════════ */}
                {!isMobile && !isTablet && (
                    <div className="left-panel" style={{
                        flex: isLaptop ? "0 0 44%" : "0 0 48%",
                        display: "flex", flexDirection: "column", justifyContent: "center",
                        padding: isLaptop ? "28px 28px 28px 36px" : "36px 44px 36px 56px",
                        position: "relative", zIndex: 2, overflow: "hidden",
                    }}>
                        <FloatingCards />

                        {/* Logo */}
                        <div className="fu d1" style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18 }}>
                            <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,var(--glow-a),var(--glow-b))", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>⚡</div>
                            <span className="syne" style={{ fontWeight: 700, fontSize: "0.9rem", letterSpacing: "0.04em" }}>DocIntel</span>
                        </div>

                        {/* Typing */}
                        <div className="fu d1" style={{ marginBottom: 8 }}><TypingText /></div>

                        {/* Heading */}
                        <h1 className="syne fu d2" style={{ fontSize: `clamp(1.45rem,${isLaptop ? "2.1" : "2.4"}vw,2.2rem)`, fontWeight: 800, lineHeight: 1.18, marginBottom: 10, letterSpacing: "-0.01em" }}>
                            AI‑Powered{" "}
                            <span style={{ background: "linear-gradient(90deg,var(--glow-a),var(--glow-b),var(--glow-c))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                                Document Intelligence
                            </span>{" "}Platform
                        </h1>

                        {/* Description */}
                        <p className="fu d3" style={{ color: "var(--muted)", fontSize: "0.82rem", lineHeight: 1.65, marginBottom: 14, maxWidth: 400 }}>
                            Extract, classify, and analyze documents automatically using OCR + AI. Process invoices, receipts, forms, business cards, contracts, and PDFs with smart field detection.
                        </p>

                        {/* Feature grid */}
                        <div className="feat-grid fu d3" style={{ marginBottom: 12 }}>
                            {FEATS.map(f => (
                                <div key={f.label} className="feat-item">
                                    <span style={{ fontSize: 13 }}>{f.icon}</span>
                                    <span style={{ fontSize: "0.74rem", color: "var(--text)" }}>{f.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Scan widget */}
                        <div className="fu d4 left-extras" style={{ marginBottom: 10 }}><ScanWidget /></div>

                        {/* Doc type badges */}
                        <div className="fu d5 left-extras" style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: "0.6rem", color: "var(--muted)", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>Supported Document Types</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                {DOC_TYPES.map(t => (
                                    <div key={t} className="doc-badge">
                                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)", display: "inline-block", flexShrink: 0 }} />
                                        {t}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="fu d6" style={{ display: "flex", gap: 8 }}>
                            <StatMini target={50000} suffix="+" label="Docs Processed" />
                            <StatMini target={98} suffix="%" label="OCR Accuracy" />
                        </div>
                    </div>
                )}

                {/* ══════════ RIGHT PANEL — form ══════════ */}
                <div className="right-panel" style={{
                    flex: (isMobile || isTablet) ? "none" : (isLaptop ? "0 0 56%" : "0 0 52%"),
                    width: (isMobile || isTablet) ? "100%" : undefined,
                    display: "flex",
                    alignItems: (isMobile || isTablet) ? "flex-start" : "stretch",
                    justifyContent: "center",
                    position: "relative",
                    zIndex: 2,
                    padding: isMobile
                        ? "20px 16px 36px"
                        : isTablet
                            ? "0 24px 40px"
                            : isLaptop
                                ? "20px 28px 20px 20px"
                                : "28px 52px 28px 36px",
                }}>

                    {/* Accent divider (desktop only) — named class prevents mobile bug */}
                    {!isMobile && !isTablet && (
                        <div className="accent-divider" style={{ position: "absolute", left: 0, top: "8%", bottom: "8%", width: 1, background: "linear-gradient(180deg,transparent,var(--glow-a),var(--glow-b),transparent)", opacity: 0.28 }} />
                    )}

                    {/* Form card */}
                    <div className="glass form-inner fu d2" style={{
                        width: "100%",
                        maxWidth: isMobile ? 440 : isTablet ? 520 : "none",
                        margin: (isMobile || isTablet) ? "0 auto" : 0,
                        borderRadius: isMobile ? 18 : 24,
                        display: "flex", flexDirection: "column", justifyContent: "center",
                        padding: isMobile ? "24px 18px" : isTablet ? "28px 28px" : isLaptop ? "32px 36px" : "42px 48px",
                        overflowY: "auto",
                    }}>

                        {/* Mobile brand */}
                        {isMobile && <MobileBrand />}

                        {/* Header */}
                        <div style={{ marginBottom: isMobile ? 20 : 26, textAlign: "center" }}>
                            {!isMobile && (
                                <div style={{ width: 52, height: 52, background: "linear-gradient(135deg,var(--glow-a),var(--glow-b))", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 23, margin: "0 auto 14px", boxShadow: "0 8px 26px rgba(91,110,245,0.36)" }}>⚡</div>
                            )}
                            <h2 className="syne form-title" style={{ fontSize: isMobile ? "1.35rem" : isTablet ? "1.6rem" : "1.8rem", fontWeight: 800, marginBottom: 6 }}>Create Account</h2>
                            <p style={{ color: "var(--muted)", fontSize: isMobile ? "0.82rem" : "0.9rem" }}>Register to start using DocIntel</p>
                        </div>

                        {/* ── Form fields ── */}
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: isMobile ? 14 : 18 }}>

                            {/* Username */}
                            <div>
                                <label style={labelStyle}>Username</label>
                                <div style={{ position: "relative" }}>
                                    <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }}>
                                        <Icon d={IC.user} size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        name="username"
                                        placeholder="Choose a username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                        className={`ai-input${errors.username ? " error" : ""}`}
                                        autoComplete="username"
                                    />
                                </div>
                                {errors.username && (
                                    <div style={{ marginTop: 6, fontSize: "0.72rem", color: "#f87171", fontWeight: 600 }}>{errors.username}</div>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label style={labelStyle}>Email Address</label>
                                <div style={{ position: "relative" }}>
                                    <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }}>
                                        <Icon d={IC.email} size={16} />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="you@company.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className={`ai-input${errors.email ? " error" : ""}`}
                                        autoComplete="email"
                                    />
                                </div>
                                {errors.email && (
                                    <div style={{ marginTop: 6, fontSize: "0.72rem", color: "#f87171", fontWeight: 600 }}>{errors.email}</div>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label style={labelStyle}>Password</label>
                                <div style={{ position: "relative" }}>
                                    <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }}>
                                        <Icon d={IC.lock} size={16} />
                                    </div>
                                    <input
                                        type={showPw ? "text" : "password"}
                                        name="password"
                                        placeholder="Create a strong password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className={`ai-input${errors.password ? " error" : ""}`}
                                        style={{ paddingRight: 44 }}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw(v => !v)}
                                        aria-label={showPw ? "Hide password" : "Show password"}
                                        style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4, display: "flex", alignItems: "center" }}
                                    >
                                        <Icon d={showPw ? IC.eyeOff : IC.eye} size={16} />
                                    </button>
                                </div>
                                {/* Password strength meter */}
                                <PasswordStrength password={formData.password} />
                                {errors.password && (
                                    <div style={{ marginTop: 6, fontSize: "0.72rem", color: "#f87171", fontWeight: 600 }}>{errors.password}</div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label style={labelStyle}>Confirm Password</label>
                                <div style={{ position: "relative" }}>
                                    <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }}>
                                        <Icon d={IC.shield} size={16} />
                                    </div>
                                    <input
                                        type={showConfirm ? "text" : "password"}
                                        name="confirmPassword"
                                        placeholder="Re-enter your password"
                                        value={confirmPassword}
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value);
                                            setPwMismatch(false);
                                        }}
                                        required
                                        className={`ai-input${pwMismatch ? " error" : ""}`}
                                        style={{ paddingRight: 44 }}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(v => !v)}
                                        aria-label={showConfirm ? "Hide password" : "Show password"}
                                        style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4, display: "flex", alignItems: "center" }}
                                    >
                                        <Icon d={showConfirm ? IC.eyeOff : IC.eye} size={16} />
                                    </button>
                                </div>
                                {/* Match hint */}
                                {confirmPassword && formData.password && (
                                    <div style={{ marginTop: 5, fontSize: "0.68rem", fontWeight: 600, color: formData.password === confirmPassword ? "#4ade80" : "#f87171" }}>
                                        {formData.password === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                                    </div>
                                )}
                            </div>

                            {/* Submit */}
                            <button type="submit" disabled={loading} className="ai-btn" style={{ marginTop: isMobile ? 2 : 4 }}>
                                {loading ? (
                                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                                        <svg className="spin" width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                        </svg>
                                        Creating account...
                                    </span>
                                ) : (
                                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                        Create Account <span style={{ fontSize: 16 }}>→</span>
                                    </span>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="divider" style={{ margin: isMobile ? "16px 0 12px" : "22px 0 16px" }} />

                        {/* Login link */}
                        <p style={{ textAlign: "center", color: "var(--muted)", fontSize: isMobile ? "0.85rem" : "0.9rem" }}>
                            Already have an account?{" "}
                            <Link to="/login" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none", borderBottom: "1px solid rgba(124,132,255,0.28)", paddingBottom: 1 }}>
                                Login
                            </Link>
                        </p>

                        {/* Trust signals */}
                        <div style={{ marginTop: isMobile ? 12 : 16, display: "flex", justifyContent: "center", gap: isMobile ? 16 : 24, flexWrap: "wrap" }}>
                            {["🔒 Encrypted", "⚡ Fast", "🌍 GDPR Safe"].map(t => (
                                <span key={t} style={{ fontSize: "0.68rem", color: "var(--muted)", letterSpacing: "0.03em" }}>{t}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Register;