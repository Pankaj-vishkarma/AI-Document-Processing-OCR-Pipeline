import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import StatsOverview from "../components/stats/StatsOverview";
import RecentDocuments from "../components/stats/RecentDocuments";
import AnalyticsPanel from "../components/stats/AnalyticsPanel";
import { useNavigate } from "react-router-dom";



const DASHBOARD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .db-page-bg {
    min-height: 100vh;
    background: radial-gradient(circle at top left, rgba(91,110,245,0.18), transparent 24%),
                radial-gradient(circle at 90% 10%, rgba(34,211,238,0.14), transparent 20%),
                linear-gradient(180deg, #070b18 0%, #0e172c 100%);
    color: #e2e8f0;
    font-family: 'DM Sans', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .db-page {
    padding: 32px 28px 48px;
    max-width: 1280px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 28px;
    font-family: 'DM Sans', sans-serif;
  }

  .db-topbar {
    background: rgba(15, 23, 42, 0.88);
    border: 1px solid rgba(148, 163, 184, 0.18);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
    backdrop-filter: blur(18px);
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .db-topbar-left { display: flex; align-items: center; gap: 14px; }

  .db-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: 999px;
    border: 1px solid rgba(59, 130, 246, 0.25);
    background: rgba(59, 130, 246, 0.12);
    font-size: 0.72rem;
    color: #bfdbfe;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-family: 'Syne', sans-serif;
  }
  .db-eyebrow-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #60a5fa;
    animation: dbPulse 2s ease-in-out infinite;
  }
  @keyframes dbPulse { 0%,100%{opacity:1;} 50%{opacity:0.35;} }

  .db-app-name {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 0.9rem;
    color: #f8fafc;
  }

  .db-topbar-right { display: flex; align-items: center; gap: 12px; }

  .db-live-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 16px;
    border-radius: 14px;
    border: 1px solid rgba(34, 197, 94, 0.25);
    background: rgba(34, 197, 94, 0.12);
    font-size: 0.75rem;
    color: #d1fae5;
    font-family: 'Syne', sans-serif;
    font-weight: 600;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }
  .db-live-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #4ade80;
    box-shadow: 0 0 8px rgba(34, 197, 94, 0.35);
    animation: dbPulse 1.8s ease-in-out infinite;
    flex-shrink: 0;
  }

  .db-icon-btn {
    width: 36px; height: 36px;
    border-radius: 12px;
    border: 1px solid rgba(148, 163, 184, 0.2);
    background: rgba(255, 255, 255, 0.05);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: #cbd5e1;
    transition: all 0.18s ease;
  }
  .db-icon-btn:hover {
    border-color: rgba(148, 163, 184, 0.35);
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
  }

  .db-upload-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 11px 18px;
    border-radius: 14px;
    border: none;
    background: linear-gradient(135deg, #4f46e5, #2563eb);
    font-size: 0.8rem;
    font-weight: 600;
    color: #ffffff;
    font-family: 'Syne', sans-serif;
    letter-spacing: 0.02em;
    cursor: pointer;
    white-space: nowrap;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .db-upload-btn:hover {
    box-shadow: 0 16px 30px rgba(79, 70, 229, 0.28);
    transform: translateY(-1px);
  }

  .db-page {
    padding: 32px 28px 48px;
    display: flex;
    flex-direction: column;
    gap: 28px;
    font-family: 'DM Sans', sans-serif;
  }

  .db-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 18px;
  }

  .db-title {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: clamp(1.8rem, 3vw, 2.4rem);
    line-height: 1.08;
    letter-spacing: -0.02em;
    color: #ffffff;
    margin: 0 0 10px;
  }
  .db-title-gradient {
    background: linear-gradient(90deg, #7c3aed, #38bdf8, #22d3ee);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .db-subtitle {
    color: #cbd5e1;
    font-size: 0.95rem;
    line-height: 1.7;
    margin: 0;
    max-width: 690px;
  }

  @keyframes fadeUp { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
  .fu  { animation:fadeUp 0.45s ease forwards; opacity:0; }
  .d1  { animation-delay:0.05s; }
  .d2  { animation-delay:0.12s; }
  .d3  { animation-delay:0.19s; }
  .d4  { animation-delay:0.26s; }
  .d5  { animation-delay:0.33s; }

  .db-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.25), transparent);
  }

  .db-section-label {
    font-size: 0.7rem;
    font-weight: 700;
    color: #94a3b8;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    font-family: 'Syne', sans-serif;
    margin-bottom: 14px;
  }

  .db-section { display: flex; flex-direction: column; gap: 16px; }

  .db-grid {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 20px;
  }
  .db-col-wide   { grid-column: span 8; }
  .db-col-narrow { grid-column: span 4; }

  .db-card {
    background: rgba(15, 23, 42, 0.80);
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 24px 50px rgba(0, 0, 0, 0.24);
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  }
  .db-card:hover {
    border-color: rgba(148, 163, 184, 0.30);
    box-shadow: 0 30px 70px rgba(0, 0, 0, 0.30);
    transform: translateY(-1px);
  }

  @media (max-width: 1100px) {
    .db-grid { grid-template-columns: 1fr 1fr; }
    .db-col-wide   { grid-column: span 2; }
    .db-col-narrow { grid-column: span 2; }
  }
  @media (max-width: 700px) {
    .db-page { padding: 20px 16px 38px; gap: 22px; }
    .db-grid { grid-template-columns: 1fr; }
    .db-col-wide, .db-col-narrow { grid-column: span 1; }
    .db-title { font-size: 1.6rem; }
  }

  @media (max-width: 768px) {
    .db-topbar {
      padding: 14px 18px;
      flex-direction: column;
      align-items: stretch;
      gap: 14px;
    }

    .db-topbar-left,
    .db-topbar-right {
      width: 100%;
    }

    .db-topbar-right {
      justify-content: flex-start;
      flex-wrap: wrap;
      gap: 12px;
    }
  }

  @media (max-width: 480px) {
    .db-topbar-right {
      flex-direction: column;
    }

    .db-live-badge,
    .db-upload-btn {
      width: 100%;
      justify-content: center;
    }
  }
`;

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const displayName = user?.profile?.username || "there";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <MainLayout>
      <style>{DASHBOARD_STYLES}</style>
      <div className="db-page-bg">

        <div className="db-topbar">
          <div className="db-topbar-left">
            <div className="db-eyebrow">
              <span className="db-eyebrow-dot" />
              AI Dashboard
            </div>
            <span className="db-app-name">DocuSense OCR</span>
          </div>

          <div className="db-topbar-right">
            <div className="db-live-badge">
              <span className="db-live-dot" />
              Live · AI Engine Running
            </div>
            <button
              className="db-upload-btn"
              onClick={() => navigate("/upload")}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="16 16 12 12 8 16" />
                <line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
              </svg>
              Upload Document
            </button>
          </div>
        </div>

        <div className="db-page">
          <div className="db-header fu d1">
            <div>
              <h1 className="db-title">
                Welcome Back{" "}
                <span className="db-title-gradient">{displayName}</span>{" "}
              </h1>
              <p className="db-subtitle">
                AI-powered OCR extraction dashboard — monitor, process and analyze your documents.
              </p>
            </div>
          </div>

          <div className="db-divider fu d2" />

          <div className="db-section fu d3">
            <div className="db-section-label">Analytics &amp; Insights</div>
            <div className="db-card">
              <AnalyticsPanel />
            </div>
          </div>

          <div className="db-divider fu d4" />

          <div className="db-section fu d5">
            <div className="db-section-label">Key Metrics</div>
            <StatsOverview />
          </div>

          <div className="db-divider fu d5" />

          <div className="db-section fu d5">
            <div className="db-section-label">Recent Activity</div>
            <div className="db-card">
              <RecentDocuments />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;