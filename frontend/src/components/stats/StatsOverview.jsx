import { useEffect, useState } from "react";
import { FileText, CheckCircle2, AlertCircle, Clock3 } from "lucide-react";
import axiosInstance from "../../api/axios";
import toast from "react-hot-toast";

const STATS_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');

  .so-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 18px;
  }

  .so-card {
    position: relative;
    padding: 22px 24px;
    border-radius: 22px;
    border: 1px solid rgba(148, 163, 184, 0.18);
    background: rgba(15, 23, 42, 0.78);
    backdrop-filter: blur(18px);
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.22s ease, border-color 0.22s ease;
    cursor: default;
    box-shadow: 0 22px 60px rgba(0, 0, 0, 0.22);
  }
  .so-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    border-radius: 22px 22px 0 0;
    opacity: 0;
    transition: opacity 0.22s ease;
  }
  .so-card.blue::before  { background: linear-gradient(90deg, #5b6ef5, #818cf8); }
  .so-card.green::before { background: linear-gradient(90deg, #22c55e, #7dd3fc); }
  .so-card.amber::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
  .so-card.red::before   { background: linear-gradient(90deg, #ef4444, #f87171); }

  .so-card:hover { transform: translateY(-3px); }
  .so-card:hover::before { opacity: 1; }
  .so-card.blue:hover  { border-color: rgba(91, 110, 245, 0.4); box-shadow: 0 20px 54px rgba(91, 110, 245, 0.14); }
  .so-card.green:hover { border-color: rgba(34, 197, 94, 0.35); box-shadow: 0 20px 54px rgba(34, 197, 94, 0.12); }
  .so-card.amber:hover { border-color: rgba(245, 158, 11, 0.35); box-shadow: 0 20px 54px rgba(245, 158, 11, 0.12); }
  .so-card.red:hover   { border-color: rgba(239, 68, 68, 0.35); box-shadow: 0 20px 54px rgba(239, 68, 68, 0.12); }

  .so-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 18px;
  }

  .so-label {
    font-size: 0.78rem;
    font-weight: 600;
    color: #cbd5e1;
    font-family: 'DM Sans', sans-serif;
  }

  .so-icon-wrap {
    width: 42px; height: 42px;
    border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .so-icon-wrap.blue  { background: rgba(91, 110, 245, 0.16); color: #c7d2fe; }
  .so-icon-wrap.green { background: rgba(34, 197, 94, 0.16); color: #bbf7d0; }
  .so-icon-wrap.amber { background: rgba(245, 158, 11, 0.16); color: #fde68a; }
  .so-icon-wrap.red   { background: rgba(239, 68, 68, 0.16); color: #fecaca; }

  .so-value {
    font-weight: 800;
    font-size: 2rem;
    line-height: 1;
    color: #ffffff;
    margin-bottom: 8px;
  }

  .so-sub {
    font-size: 0.76rem;
    font-weight: 500;
    color: #94a3b8;
  }
  .so-sub.blue  { color: #bfdbfe; }
  .so-sub.green { color: #86efac; }
  .so-sub.amber { color: #fcd34d; }
  .so-sub.red   { color: #fca5a5; }

  /* Skeleton */
  .so-skeleton {
    padding: 22px 24px;
    border-radius: 22px;
    border: 1px solid rgba(148, 163, 184, 0.18);
    background: rgba(255, 255, 255, 0.04);
  }
  .so-skel-bar {
    border-radius: 8px;
    background: rgba(148, 163, 184, 0.14);
    animation: soShimmer 1.6s ease-in-out infinite;
  }
  @keyframes soShimmer { 0%,100%{opacity:0.5;} 50%{opacity:1;} }

  @media (max-width: 1100px) {
    .so-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 520px) {
    .so-grid { grid-template-columns: 1fr; }
    .so-value { font-size: 1.8rem; }
  }
`;

const CARDS_CONFIG = [
  { key: "total_documents", title: "Total Documents", icon: FileText, color: "blue", sub: "All time" },
  { key: "completed_documents", title: "Completed", icon: CheckCircle2, color: "green", sub: "Successfully processed" },
  { key: "processing_documents", title: "Processing", icon: Clock3, color: "amber", sub: "Currently running" },
  { key: "failed_documents", title: "Failed", icon: AlertCircle, color: "red", sub: "Needs review" },
];

const StatsOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/stats");
      setStats(response.data.stats);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  return (
    <>
      <style>{STATS_STYLES}</style>
      <div className="so-grid">
        {loading
          ? CARDS_CONFIG.map((c) => (
            <div key={c.key} className="so-skeleton">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <div className="so-skel-bar" style={{ height: 12, width: 100 }} />
                <div className="so-skel-bar" style={{ height: 40, width: 40, borderRadius: 11 }} />
              </div>
              <div className="so-skel-bar" style={{ height: 32, width: 64, marginBottom: 8 }} />
              <div className="so-skel-bar" style={{ height: 10, width: 90 }} />
            </div>
          ))
          : CARDS_CONFIG.map((c) => {
            const Icon = c.icon;
            const value = stats?.[c.key] ?? 0;
            return (
              <div key={c.key} className={`so-card ${c.color}`}>
                <div className="so-card-top">
                  <span className="so-label">{c.title}</span>
                  <div className={`so-icon-wrap ${c.color}`}>
                    <Icon size={18} />
                  </div>
                </div>
                <div className="so-value">{value.toLocaleString()}</div>
                <div className={`so-sub ${c.color}`}>{c.sub}</div>
              </div>
            );
          })}
      </div>
    </>
  );
};

export default StatsOverview;