import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import { useAuth } from "../context/AuthContext";

/*
  ANIMATION KEYFRAMES ONLY — no UI styles, no layout, no colours.
  Everything visual is Tailwind utility classes.
*/
const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  body { font-family: 'Inter', sans-serif; }

  @keyframes blobA {
    0%,100% { transform: translate(0,0) scale(1); }
    33%      { transform: translate(40px,-30px) scale(1.08); }
    66%      { transform: translate(-20px,20px) scale(0.94); }
  }
  @keyframes blobB {
    0%,100% { transform: translate(0,0) scale(1); }
    40%     { transform: translate(-50px,30px) scale(1.1); }
    75%     { transform: translate(25px,-20px) scale(0.92); }
  }
  @keyframes blobC {
    0%,100% { transform: translate(0,0) scale(1); }
    50%     { transform: translate(30px,40px) scale(1.05); }
  }
  @keyframes fc1 {
    0%,100% { transform: translateY(0px) rotate(-3deg); }
    50%     { transform: translateY(-13px) rotate(-1deg); }
  }
  @keyframes fc2 {
    0%,100% { transform: translateY(0px) rotate(4deg); }
    50%     { transform: translateY(-10px) rotate(2deg); }
  }
  @keyframes fc3 {
    0%,100% { transform: translateY(0px) rotate(-1.5deg); }
    50%     { transform: translateY(-16px) rotate(1deg); }
  }
  @keyframes fc4 {
    0%,100% { transform: translateY(0px) rotate(5deg); }
    50%     { transform: translateY(-8px) rotate(3deg); }
  }
  @keyframes scanMove {
    0%   { top: 8%;  opacity: 0; }
    5%   { opacity: 1; }
    95%  { opacity: 1; }
    100% { top: 92%; opacity: 0; }
  }
  @keyframes blink {
    0%,100% { opacity: 1; }
    50%     { opacity: 0; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes floatUp {
    0%   { transform: translateY(100vh) scale(0); opacity: 0; }
    8%   { opacity: 0.45; }
    92%  { opacity: 0.15; }
    100% { transform: translateY(-8vh) scale(1.1); opacity: 0; }
  }
  @keyframes spinAnim { to { transform: rotate(360deg); } }

  .anim-blobA   { animation: blobA   14s ease-in-out infinite; }
  .anim-blobB   { animation: blobB   18s ease-in-out infinite; }
  .anim-blobC   { animation: blobC   22s ease-in-out infinite; }
  .anim-fc1     { animation: fc1     5s ease-in-out infinite; }
  .anim-fc2     { animation: fc2     5s ease-in-out infinite; animation-delay: 0.9s; }
  .anim-fc3     { animation: fc3     5s ease-in-out infinite; animation-delay: 0.4s; }
  .anim-fc4     { animation: fc4     5s ease-in-out infinite; animation-delay: 1.5s; }
  .anim-scan    { animation: scanMove 3s ease-in-out infinite; }
  .anim-blink   { animation: blink   0.75s step-end infinite; }
  .anim-spin    { animation: spinAnim 0.75s linear infinite; }
  .anim-fadeUp  { animation: fadeUp  0.5s ease forwards; opacity: 0; }
  .anim-particle{ animation: floatUp linear infinite; }
  .delay-1 { animation-delay: 0.07s; }
  .delay-2 { animation-delay: 0.16s; }
  .delay-3 { animation-delay: 0.25s; }
  .delay-4 { animation-delay: 0.34s; }
  .delay-5 { animation-delay: 0.43s; }
  .delay-6 { animation-delay: 0.52s; }
`;

/* ── SVG Icon ── */
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const IC = {
  email:  "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm16 2l-8 5-8-5",
  lock:   "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4",
  eye:    "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  eyeOff: "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22",
};

/* ── Particles ── */
const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  size: (Math.random() * 1.8 + 0.5).toFixed(1),
  left: (Math.random() * 96).toFixed(1),
  dur:  (Math.random() * 14 + 11).toFixed(1),
  delay:(Math.random() * 18).toFixed(1),
}));

const Particles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    {PARTICLES.map(p => (
      <div
        key={p.id}
        className="absolute rounded-full bg-blue-400/20 anim-particle"
        style={{
          width:  `${p.size}px`,
          height: `${p.size}px`,
          left:   `${p.left}%`,
          animationDuration:  `${p.dur}s`,
          animationDelay:     `${p.delay}s`,
        }}
      />
    ))}
  </div>
);

/* ── Typing text ── */
const PHRASES = [
  "AI Document Processing...",
  "Extracting Invoice Data...",
  "Analyzing PDF Content...",
  "Detecting Table Structure...",
  "Classifying Documents...",
];
const TypingText = () => {
  const [pi,  setPi]  = useState(0);
  const [txt, setTxt] = useState("");
  const [del, setDel] = useState(false);
  useEffect(() => {
    const p = PHRASES[pi];
    let t;
    if (!del && txt.length < p.length)      t = setTimeout(() => setTxt(p.slice(0, txt.length + 1)), 58);
    else if (!del)                           t = setTimeout(() => setDel(true), 1500);
    else if (del && txt.length > 0)          t = setTimeout(() => setTxt(txt.slice(0, -1)), 30);
    else { setDel(false); setPi(i => (i + 1) % PHRASES.length); }
    return () => clearTimeout(t);
  }, [txt, del, pi]);
  return (
    <span className="text-xs font-semibold text-blue-600 tracking-wide">
      {txt}<span className="anim-blink">|</span>
    </span>
  );
};

/* ── Animated counter ── */
const useCounter = (target, dur = 1500) => {
  const [count,   setCount]   = useState(0);
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

/* Statistics card */
const StatMini = ({ target, suffix, label }) => {
  const { count, ref } = useCounter(target);
  return (
    <div ref={ref} className="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl px-4 py-3">
      <div className="text-lg font-bold text-gray-900 leading-none">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
};

/* ── OCR Scan widget ── */
const STEPS = ["Upload", "Preprocess", "OCR", "AI Extract", "Done ✓"];
const ScanWidget = () => {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % STEPS.length), 1200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 relative overflow-hidden">
      {/* Fake text lines */}
      <div className="flex flex-col gap-1.5 mb-3">
        {[82, 60, 74, 48].map((w, i) => (
          <div key={i} className="h-1 rounded-full bg-blue-100"
            style={{ width: `${w}%`, opacity: 0.5 + i * 0.12 }} />
        ))}
      </div>
      {/* Scan line */}
      <div
        className="anim-scan absolute left-0 right-0 h-0.5 z-10"
        style={{ background: "linear-gradient(90deg,transparent,rgba(37,99,235,0.55),rgba(16,185,129,0.4),transparent)" }}
      />
      {/* Step badges */}
      <div className="flex flex-wrap gap-1 mt-1">
        {STEPS.map((s, i) => (
          <span
            key={s}
            className={`px-2 py-0.5 rounded-full font-semibold transition-all duration-300 ${
              i <= active
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-400"
            }`}
            style={{ fontSize: "0.6rem", letterSpacing: "0.02em" }}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ── Floating doc cards ── */
const FCARDS = [
  { name: "Invoice.pdf",  icon: "📄", anim: "anim-fc1", top: "10%", right: "3%" },
  { name: "Receipt.png",  icon: "🧾", anim: "anim-fc2", top: "30%", right: "0%" },
  { name: "Contract.pdf", icon: "📋", anim: "anim-fc3", top: "55%", right: "4%" },
  { name: "BizCard.jpg",  icon: "💼", anim: "anim-fc4", top: "75%", right: "1%" },
];
const FloatingCards = () => (
  <div className="hidden lg:block">
    {FCARDS.map(c => (
      <div
        key={c.name}
        className={`absolute pointer-events-none z-10 ${c.anim}`}
        style={{ top: c.top, right: c.right }}
      >
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-3 py-1.5 flex items-center gap-2 whitespace-nowrap">
          <span className="text-xs">{c.icon}</span>
          <span className="text-xs text-gray-500">{c.name}</span>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        </div>
      </div>
    ))}
  </div>
);

/* ── Feature + doc type data ── */
const FEATS = [
  { icon: "🔍", label: "Smart OCR" },
  { icon: "🤖", label: "AI Classification" },
  { icon: "📑", label: "Multi-page PDF" },
  { icon: "📊", label: "Table Detection" },
  { icon: "⚡", label: "Real-time AI" },
];
const DOC_TYPES = ["Invoice", "Receipt", "Business Card", "Contract", "ID Card"];

/* ═══════════════════════════════════
   Login — main component
═══════════════════════════════════ */
const Login = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading,  setLoading]  = useState(false);
  const [showPw,   setShowPw]   = useState(false);

  const handleChange = useCallback(
    (e) => setFormData(f => ({ ...f, [e.target.name]: e.target.value })),
    []
  );

  useEffect(() => { if (user) navigate("/"); }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axiosInstance.post("/auth/login", formData);
      login(response.data.token);
      toast.success("Login successful");
      navigate("/");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{KEYFRAMES}</style>

      {/*
        ROOT
        mobile  : single column, scroll
        md(768) : single column, scroll
        lg(1024): two columns side-by-side, full viewport height
      */}
      <div className="relative min-h-screen bg-gray-50 flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden">

        {/* ── Decorative blobs ── */}
        <div className="absolute rounded-full pointer-events-none blur-[90px] will-change-transform
                        w-96 h-96 -top-24 -left-16 anim-blobA
                        bg-[radial-gradient(circle,rgba(37,99,235,0.10),transparent_70%)]" />
        <div className="absolute rounded-full pointer-events-none blur-[90px] will-change-transform
                        w-80 h-80 -bottom-14 right-6 anim-blobB
                        bg-[radial-gradient(circle,rgba(37,99,235,0.07),transparent_70%)]" />
        <div className="absolute rounded-full pointer-events-none blur-[90px] will-change-transform
                        w-56 h-56 top-[45%] left-[35%] anim-blobC
                        bg-[radial-gradient(circle,rgba(16,185,129,0.06),transparent_70%)]" />

        <Particles />

        {/* ════════════════════════════════
            LEFT PANEL
            hidden on mobile (<lg)
            shown as full-width banner on md (tablet)
            shown as side panel on lg+
        ════════════════════════════════ */}
        <div className="
          hidden md:flex flex-col justify-center
          bg-white border-b lg:border-b-0 lg:border-r border-gray-200
          relative z-10 overflow-hidden
          w-full lg:w-[46%] xl:w-[44%]
          px-6 py-8 sm:px-10 lg:px-12 xl:px-16
        ">
          <FloatingCards />

          {/* Logo */}
          <div className="anim-fadeUp delay-1 flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm shadow-sm flex-shrink-0">
              ⚡
            </div>
            <span className="font-bold text-gray-900 text-sm tracking-tight">DocIntel</span>
          </div>

          {/* Typing */}
          <div className="anim-fadeUp delay-1 mb-2">
            <TypingText />
          </div>

          {/* Heading */}
          <h1 className="anim-fadeUp delay-2 font-bold tracking-tight text-gray-900 leading-tight mb-3
                         text-2xl lg:text-3xl xl:text-4xl">
            AI‑Powered{" "}
            <span className="text-blue-600">Document Intelligence</span>{" "}
            Platform
          </h1>

          {/* Description */}
          <p className="anim-fadeUp delay-3 text-sm text-gray-500 leading-relaxed mb-5 max-w-sm">
            Extract, classify, and analyze documents automatically using OCR + AI.
            Process invoices, receipts, forms, business cards, contracts, and PDFs with smart field detection.
          </p>

          {/* Feature grid — 2-col on lg, 3-col on md banner */}
          <div className="anim-fadeUp delay-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-2 mb-4">
            {FEATS.map(f => (
              <div key={f.label}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-2">
                <span className="text-sm">{f.icon}</span>
                <span className="text-xs text-gray-700 font-medium">{f.label}</span>
              </div>
            ))}
          </div>

          {/* Scan widget — hidden on md banner, shown on lg+ */}
          <div className="anim-fadeUp delay-4 hidden lg:block mb-4">
            <ScanWidget />
          </div>

          {/* Doc type badges — hidden on md banner */}
          <div className="anim-fadeUp delay-5 hidden lg:block mb-4">
            <p className="text-gray-400 uppercase tracking-widest mb-2" style={{ fontSize: "0.6rem" }}>
              Supported Document Types
            </p>
            <div className="flex flex-wrap gap-1.5">
              {DOC_TYPES.map(t => (
                <span key={t}
                  className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700
                             rounded-full text-xs font-semibold px-3 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Stats — hidden on md banner */}
          <div className="anim-fadeUp delay-6 hidden lg:flex gap-3">
            <StatMini target={50000} suffix="+" label="Docs Processed" />
            <StatMini target={98}    suffix="%" label="OCR Accuracy"   />
          </div>
        </div>

        {/* ════════════════════════════════
            RIGHT PANEL — form
            Full-width on mobile/tablet
            Right column on lg+
        ════════════════════════════════ */}
        <div className="
          flex-1 flex items-center justify-center relative z-10
          px-4 py-10 sm:px-8 md:px-12 lg:px-10 xl:px-16
          min-h-screen md:min-h-0
        ">

          {/* Subtle vertical divider — desktop only */}
          <div className="hidden lg:block absolute left-0 top-[8%] bottom-[8%] w-px
                          bg-gradient-to-b from-transparent via-gray-200 to-transparent opacity-80" />

          {/* Form card */}
          <div className="anim-fadeUp delay-2
                          w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-none
                          bg-white border border-gray-200 rounded-2xl shadow-sm
                          p-7 sm:p-10 lg:p-12 xl:p-14">

            {/* Mobile-only brand block (hidden on md+) */}
            <div className="flex flex-col items-center mb-6 md:hidden">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-xl mb-2.5 shadow-sm">
                ⚡
              </div>
              <div className="font-bold text-gray-900 text-base mb-1">DocIntel</div>
              <div className="text-xs text-gray-500">AI‑Powered Document Intelligence</div>
            </div>

            {/* Icon — shown on md+ */}
            <div className="hidden md:flex justify-center mb-5">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-xl shadow-sm">
                ⚡
              </div>
            </div>

            {/* Header text */}
            <div className="text-center mb-7">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-1.5">
                Welcome back
              </h2>
              <p className="text-sm text-gray-500">Sign in to your DocIntel account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Email */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <Icon d={IC.email} size={16} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 bg-white
                               text-sm text-gray-900 placeholder:text-gray-400
                               focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                               transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <Icon d={IC.lock} size={16} />
                  </div>
                  <input
                    type={showPw ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                    className="w-full h-12 pl-11 pr-12 rounded-xl border border-gray-200 bg-white
                               text-sm text-gray-900 placeholder:text-gray-400
                               focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                               transition-all"
                    style={{ fontSize: "max(16px, 0.875rem)" /* prevent iOS zoom */ }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400
                               hover:text-gray-600 transition-colors bg-transparent border-0
                               cursor-pointer p-1 flex items-center"
                  >
                    <Icon d={showPw ? IC.eyeOff : IC.eye} size={16} />
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                           disabled:opacity-60 disabled:cursor-not-allowed
                           text-white text-sm font-semibold rounded-lg shadow-sm transition-colors
                           flex items-center justify-center gap-2.5"
              >
                {loading ? (
                  <>
                    <svg className="anim-spin" width={17} height={17} viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>Sign In <span className="text-base">→</span></>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="border-t border-gray-100 my-6" />

            {/* Register link */}
            <p className="text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="text-blue-600 font-semibold hover:text-blue-700 transition-colors
                           underline underline-offset-2 decoration-blue-200 hover:decoration-blue-400"
              >
                Create account
              </Link>
            </p>

            {/* Trust signals */}
            <div className="flex items-center justify-center flex-wrap gap-5 mt-5">
              {["🔒 Encrypted", "⚡ Fast", "🌍 GDPR Safe"].map(t => (
                <span key={t} className="text-xs text-gray-400 tracking-wide">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;