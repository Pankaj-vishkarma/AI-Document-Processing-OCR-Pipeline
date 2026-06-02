import { useEffect, useState } from "react";
import { FileText, CheckCircle2, AlertCircle, Clock3 } from "lucide-react";
import axiosInstance from "../../api/axios";
import toast from "react-hot-toast";

const STATS_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');

  .so-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
  }

  .so-card {
    position: relative;
    padding: 20px 22px;
    border-radius: 14px;
    border: 1px solid #E8ECF4;
    background: #ffffff;
    overflow: hidden;
    transition: border-color 0.22s, transform 0.2s, box-shadow 0.22s;
    cursor: default;
  }
  .so-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    border-radius: 14px 14px 0 0;
    opacity: 0;
    transition: opacity 0.22s;
  }
  .so-card.blue::before  { background: linear-gradient(90deg, #5b6ef5, #818cf8); }
  .so-card.green::before { background: linear-gradient(90deg, #16a34a, #4ade80); }
  .so-card.amber::before { background: linear-gradient(90deg, #d97706, #fbbf24); }
  .so-card.red::before   { background: linear-gradient(90deg, #dc2626, #f87171); }

  .so-card:hover { transform: translateY(-3px); }
  .so-card:hover::before { opacity: 1; }
  .so-card.blue:hover  { border-color: #C7CEFA; box-shadow: 0 8px 28px rgba(91,110,245,0.10); }
  .so-card.green:hover { border-color: #BBF7D0; box-shadow: 0 8px 28px rgba(22,163,74,0.08); }
  .so-card.amber:hover { border-color: #FDE68A; box-shadow: 0 8px 28px rgba(217,119,6,0.08); }
  .so-card.red:hover   { border-color: #FECACA; box-shadow: 0 8px 28px rgba(220,38,38,0.08); }

  .so-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .so-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #64748B;
    font-family: 'DM Sans', sans-serif;
  }

  .so-icon-wrap {
    width: 40px; height: 40px;
    border-radius: 11px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .so-icon-wrap.blue  { background: #EEF0FD; color: #4A52C9; }
  .so-icon-wrap.green { background: #DCFCE7; color: #16a34a; }
  .so-icon-wrap.amber { background: #FEF3C7; color: #d97706; }
  .so-icon-wrap.red   { background: #FEE2E2; color: #dc2626; }

  .so-value {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 2rem;
    line-height: 1;
    color: #0F172A;
    margin-bottom: 6px;
  }

  .so-sub {
    font-size: 0.7rem;
    font-weight: 500;
    font-family: 'DM Sans', sans-serif;
  }
  .so-sub.blue  { color: #4A52C9; }
  .so-sub.green { color: #16a34a; }
  .so-sub.amber { color: #d97706; }
  .so-sub.red   { color: #dc2626; }

  /* Skeleton */
  .so-skeleton {
    padding: 20px 22px;
    border-radius: 14px;
    border: 1px solid #E8ECF4;
    background: #ffffff;
  }
  .so-skel-bar {
    border-radius: 6px;
    background: #F1F5F9;
    animation: soShimmer 1.6s ease-in-out infinite;
  }
  @keyframes soShimmer { 0%,100%{opacity:0.6;} 50%{opacity:1;} }

  @media (max-width: 1100px) {
    .so-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 520px) {
    .so-grid { grid-template-columns: 1fr; }
    .so-value { font-size: 1.7rem; }
  }
`;

const CARDS_CONFIG = [
  { key: "total_documents",      title: "Total Documents", icon: FileText,     color: "blue",  sub: "All time" },
  { key: "completed_documents",  title: "Completed",       icon: CheckCircle2, color: "green", sub: "Successfully processed" },
  { key: "processing_documents", title: "Processing",      icon: Clock3,       color: "amber", sub: "Currently running" },
  { key: "failed_documents",     title: "Failed",          icon: AlertCircle,  color: "red",   sub: "Needs review" },
];

const StatsOverview = () => {
  const [stats, setStats]     = useState(null);
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
              const Icon  = c.icon;
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