import MainLayout from "../layouts/MainLayout";
import StatsOverview from "../components/stats/StatsOverview";
import RecentDocuments from "../components/stats/RecentDocuments";
import AnalyticsPanel from "../components/stats/AnalyticsPanel";

/* ═══════════════════════════════════════════════════
   DASHBOARD CSS — matches Login page design system
   (same tokens, fonts, animations, glass aesthetic)
═══════════════════════════════════════════════════ */
const DASHBOARD_STYLES = `
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

  *, *::before, *::after { box-sizing: border-box; }
  body {
    background: linear-gradient(135deg, #06060a 0%, #0c0c1a 55%, #07070f 100%) !important;
    color: var(--text) !important;
    font-family: 'DM Sans', sans-serif !important;
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
  }

  /* ── Ambient blobs ── */
  @keyframes dblobA { 0%,100%{transform:translate(0,0) scale(1);} 33%{transform:translate(50px,-35px) scale(1.07);} 66%{transform:translate(-25px,22px) scale(0.95);} }
  @keyframes dblobB { 0%,100%{transform:translate(0,0) scale(1);} 45%{transform:translate(-45px,28px) scale(1.09);} 80%{transform:translate(30px,-18px) scale(0.93);} }
  @keyframes dblobC { 0%,100%{transform:translate(0,0) scale(1);} 55%{transform:translate(28px,36px) scale(1.04);} }
  .db-blob { position:fixed; border-radius:50%; filter:blur(90px); pointer-events:none; will-change:transform; z-index:0; }
  .db-blob-a { width:480px; height:480px; background:radial-gradient(circle,rgba(91,110,245,0.2),transparent 70%);  top:-120px;  left:-100px; animation:dblobA 16s ease-in-out infinite; }
  .db-blob-b { width:380px; height:380px; background:radial-gradient(circle,rgba(168,85,247,0.16),transparent 70%); bottom:-80px; right:-60px;  animation:dblobB 20s ease-in-out infinite; }
  .db-blob-c { width:260px; height:260px; background:radial-gradient(circle,rgba(34,211,238,0.11),transparent 70%); top:40%;      left:40%;     animation:dblobC 24s ease-in-out infinite; }

  /* ── Fade-up entrance ── */
  @keyframes fadeUp { from{opacity:0;transform:translateY(18px);} to{opacity:1;transform:translateY(0);} }
  .fu  { animation:fadeUp 0.5s ease forwards; opacity:0; }
  .d1  { animation-delay:0.06s; }
  .d2  { animation-delay:0.14s; }
  .d3  { animation-delay:0.22s; }
  .d4  { animation-delay:0.30s; }
  .d5  { animation-delay:0.38s; }

  /* ── Dashboard page wrapper ── */
  .db-page {
    position: relative;
    z-index: 1;
    padding: 32px 28px 48px;
    display: flex;
    flex-direction: column;
    gap: 28px;
    min-height: 100%;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── Header row ── */
  .db-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 14px;
  }

  /* ── Breadcrumb / eyebrow ── */
  .db-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 11px;
    border-radius: 100px;
    border: 1px solid rgba(91,110,245,0.28);
    background: rgba(91,110,245,0.08);
    font-size: 0.68rem;
    color: var(--accent);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-family: 'Syne', sans-serif;
    margin-bottom: 10px;
  }
  .db-eyebrow-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 5px var(--accent);
    animation: dbPulse 2s ease-in-out infinite;
  }
  @keyframes dbPulse { 0%,100%{opacity:1;} 50%{opacity:0.35;} }

  /* ── Title ── */
  .db-title {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: clamp(1.6rem, 3vw, 2.2rem);
    line-height: 1.15;
    letter-spacing: -0.01em;
    color: var(--text);
    margin: 0 0 8px;
  }
  .db-title-gradient {
    background: linear-gradient(90deg, var(--glow-a), var(--glow-b), var(--glow-c));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* ── Subtitle ── */
  .db-subtitle {
    color: var(--muted);
    font-size: 0.9rem;
    line-height: 1.6;
    margin: 0;
  }

  /* ── Live badge (top-right of header) ── */
  .db-live-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border-radius: 12px;
    border: 1px solid var(--edge);
    background: rgba(255,255,255,0.03);
    backdrop-filter: blur(10px);
    font-size: 0.72rem;
    color: var(--muted);
    font-family: 'Syne', sans-serif;
    font-weight: 600;
    letter-spacing: 0.03em;
    white-space: nowrap;
    align-self: flex-start;
  }
  .db-live-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #4ade80;
    box-shadow: 0 0 7px #4ade80;
    animation: dbPulse 1.8s ease-in-out infinite;
    flex-shrink: 0;
  }

  /* ── Divider ── */
  .db-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--edge), transparent);
    margin: 0;
  }

  /* ── Section label ── */
  .db-section-label {
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-family: 'Syne', sans-serif;
    margin-bottom: 12px;
  }

  /* ── Content sections ── */
  .db-section { display: flex; flex-direction: column; gap: 12px; }

  /* ── Two-col grid for RecentDocs + Analytics ── */
  .db-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 20px;
  }
  .db-col-wide  { grid-column: span 2; }
  .db-col-narrow{ grid-column: span 1; }

  /* ── Glass wrapper — wraps child components to apply consistent glass styling ── */
  .db-glass {
    
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--edge);
    border-radius: 18px;
    overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .db-glass:hover {
    border-color: rgba(124,132,255,0.2);
    box-shadow: 0 4px 32px rgba(91,110,245,0.08);
  }

  /* ── Responsive ── */
  @media (max-width: 1279px) {
    .db-grid {
      grid-template-columns: 1fr 1fr;
    }
    .db-col-wide  { grid-column: span 2; }
    .db-col-narrow{ grid-column: span 2; }
  }
  @media (max-width: 767px) {
    .db-page { padding: 20px 14px 40px; gap: 20px; }
    .db-grid { grid-template-columns: 1fr; }
    .db-col-wide  { grid-column: span 1; }
    .db-col-narrow{ grid-column: span 1; }
    .db-title { font-size: 1.5rem; }
    .db-live-badge { display: none; }
  }
`;

/* ═══════════════════════════════════
   Dashboard component
═══════════════════════════════════ */
const Dashboard = () => {
  return (
    <MainLayout>
      <style>{DASHBOARD_STYLES}</style>

      {/* Ambient background blobs */}
      <div className="db-blob db-blob-a" />
      <div className="db-blob db-blob-b" />
      <div className="db-blob db-blob-c" />

      <div className="db-page">

        {/* ── Header ── */}
        <div className="db-header fu d1">
          <div>
            {/* Eyebrow */}
            <div className="db-eyebrow">
              <span className="db-eyebrow-dot" />
              AI Dashboard
            </div>

            {/* Title */}
            <h1 className="db-title">
              Welcome Back{" "}
              <span className="db-title-gradient">DocIntel</span>{" "}
              👋
            </h1>

            {/* Subtitle */}
            <p className="db-subtitle">
              AI-powered OCR extraction dashboard — monitor, process and analyze your documents.
            </p>
          </div>

          {/* Live status badge */}
          <div className="db-live-badge">
            <span className="db-live-dot" />
            Live · AI Engine Running
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="db-divider fu d2" />

        {/* ── Stats Overview ── */}
        <div className="db-section fu d3">
          <div className="db-section-label">Overview</div>
          <StatsOverview />
        </div>

        {/* ── Divider ── */}
        <div className="db-divider fu d4" />

        {/* ── Two-col: Recent Documents + Analytics ── */}
        <div className="db-section fu d5">
          <div className="db-section-label">Activity &amp; Insights</div>
          <div className="db-grid">
            <div className="db-col-wide db-glass">
              <RecentDocuments />
            </div>
            <div className="db-col-narrow db-glass">
              <AnalyticsPanel />
            </div>
          </div>
        </div>

      </div>
    </MainLayout>
  );
};

export default Dashboard;