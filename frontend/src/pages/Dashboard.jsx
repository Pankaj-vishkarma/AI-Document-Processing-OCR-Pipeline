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
    background: #F4F6FB;
    min-height: 100vh;
    font-family: 'DM Sans', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .db-topbar {
    background: #ffffff;
    border-bottom: 1px solid #E8ECF4;
    padding: 0 28px;
    height: 58px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .db-topbar-left { display: flex; align-items: center; gap: 12px; }

  .db-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 100px;
    border: 1px solid #C7CEFA;
    background: #EEF0FD;
    font-size: 0.68rem;
    color: #4A52C9;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-family: 'Syne', sans-serif;
  }
  .db-eyebrow-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: #5b6ef5;
    animation: dbPulse 2s ease-in-out infinite;
  }
  @keyframes dbPulse { 0%,100%{opacity:1;} 50%{opacity:0.35;} }

  .db-app-name {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 0.85rem;
    color: #1a1a2e;
  }

  .db-topbar-right { display: flex; align-items: center; gap: 8px; }

  .db-live-badge {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 6px 13px;
    border-radius: 10px;
    border: 1px solid #BBF7D0;
    background: #F0FDF4;
    font-size: 0.72rem;
    color: #166534;
    font-family: 'Syne', sans-serif;
    font-weight: 600;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }
  .db-live-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #16a34a;
    box-shadow: 0 0 6px #16a34a;
    animation: dbPulse 1.8s ease-in-out infinite;
    flex-shrink: 0;
  }

  .db-icon-btn {
    width: 36px; height: 36px;
    border-radius: 10px;
    border: 1px solid #E8ECF4;
    background: #ffffff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: #6B7280;
    transition: all 0.18s;
  }
  .db-icon-btn:hover {
    border-color: #C7CEFA;
    background: #EEF0FD;
    color: #4A52C9;
  }

  .db-upload-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 9px 16px;
    border-radius: 11px;
    border: none;
    background: #5b6ef5;
    font-size: 0.78rem;
    font-weight: 600;
    color: #ffffff;
    font-family: 'Syne', sans-serif;
    letter-spacing: 0.02em;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
  }
  .db-upload-btn:hover {
    background: #4A5CE4;
    box-shadow: 0 4px 16px rgba(91,110,245,0.35);
    transform: translateY(-1px);
  }

  .db-avatar {
    width: 36px; height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, #EEF0FD, #E5D9FD);
    border: 1px solid #C7CEFA;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 12px;
    color: #4A52C9;
    cursor: pointer;
  }

  .db-page {
    padding: 28px 28px 48px;
    display: flex;
    flex-direction: column;
    gap: 26px;
    font-family: 'DM Sans', sans-serif;
  }

  .db-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 14px;
  }

  .db-title {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: clamp(1.6rem, 3vw, 2.1rem);
    line-height: 1.15;
    letter-spacing: -0.01em;
    color: #0F172A;
    margin: 0 0 8px;
  }
  .db-title-gradient {
    background: linear-gradient(90deg, #5b6ef5, #a855f7, #22d3ee);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .db-subtitle {
    color: #64748B;
    font-size: 0.88rem;
    line-height: 1.6;
    margin: 0;
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
    background: linear-gradient(90deg, transparent, #D1D8EF, transparent);
  }

  .db-section-label {
    font-size: 0.65rem;
    font-weight: 700;
    color: #94A3B8;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-family: 'Syne', sans-serif;
    margin-bottom: 12px;
  }

  .db-section { display: flex; flex-direction: column; gap: 12px; }

  .db-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 18px;
  }
  .db-col-wide   { grid-column: span 2; }
  .db-col-narrow { grid-column: span 1; }

  .db-card {
    background: #ffffff;
    border: 1px solid #E8ECF4;
    border-radius: 16px;
    overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .db-card:hover {
    border-color: #C7CEFA;
    box-shadow: 0 4px 24px rgba(91,110,245,0.08);
  }

  @media (max-width: 1100px) {
    .db-grid { grid-template-columns: 1fr 1fr; }
    .db-col-wide   { grid-column: span 2; }
    .db-col-narrow { grid-column: span 2; }
  }
  @media (max-width: 700px) {
    .db-page { padding: 18px 14px 40px; gap: 20px; }
    .db-grid { grid-template-columns: 1fr; }
    .db-col-wide, .db-col-narrow { grid-column: span 1; }
    .db-title { font-size: 1.5rem; }
  }

  @media (max-width: 768px) {
  .db-topbar {
    height: auto;
    padding: 12px 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .db-topbar-left,
  .db-topbar-right {
    width: 100%;
  }

  .db-topbar-right {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
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
                👋
              </h1>
              <p className="db-subtitle">
                AI-powered OCR extraction dashboard — monitor, process and analyze your documents.
              </p>
            </div>
          </div>

          <div className="db-divider fu d2" />

          <div className="db-section fu d3">
            <div className="db-section-label">Overview</div>
            <StatsOverview />
          </div>

          <div className="db-divider fu d4" />

          <div className="db-section fu d5">
            <div className="db-section-label">Activity &amp; Insights</div>
            <div className="db-grid">
              <div className="db-col-wide db-card">
                <RecentDocuments />
              </div>
              <div className="db-col-narrow db-card">
                <AnalyticsPanel />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;