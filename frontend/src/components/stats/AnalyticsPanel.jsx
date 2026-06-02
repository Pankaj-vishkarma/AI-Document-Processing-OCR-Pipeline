import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis } from "recharts";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axios";

const AP_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@400;500&display=swap');

  .ap-wrap {
    padding: 24px 26px 26px;
    font-family: 'DM Sans', sans-serif;
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-height: 100%;
  }

  .ap-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }
  .ap-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 1.1rem;
    color: #f8fafc;
    margin: 0 0 4px;
  }
  .ap-sub {
    font-size: 0.78rem;
    color: #cbd5e1;
    margin: 0;
  }
  .ap-badge {
    font-size: 0.68rem;
    font-weight: 700;
    font-family: 'Syne', sans-serif;
    letter-spacing: 0.04em;
    padding: 6px 12px;
    border-radius: 999px;
    background: rgba(59, 130, 246, 0.16);
    border: 1px solid rgba(59, 130, 246, 0.30);
    color: #bfdbfe;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .ap-chart-row {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 20px;
    align-items: start;
  }

  .ap-line-card {
    padding: 18px 20px 20px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(148, 163, 184, 0.14);
  }
  .ap-chart-title {
    font-size: 0.92rem;
    color: #e2e8f0;
    font-weight: 700;
    margin-bottom: 14px;
    font-family: 'Syne', sans-serif;
  }

  /* Donut */
  .ap-donut-section {
    padding: 18px 20px 20px;
    border-radius: 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-height: 100%;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(148, 163, 184, 0.14);
  }
  .ap-donut-wrap {
    flex-shrink: 0;
    padding: 16px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(148, 163, 184, 0.14);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .ap-legend {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .ap-legend-item {
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: 0.72rem;
    color: #cbd5e1;
  }
  .ap-legend-dot {
    width: 9px; height: 9px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .ap-legend-name {
    flex: 1;
    text-transform: capitalize;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #e2e8f0;
  }
  .ap-legend-val {
    font-weight: 700;
    color: #f8fafc;
    font-size: 0.71rem;
    font-family: 'Syne', sans-serif;
  }

  /* Divider */
  .ap-divider {
    height: 1px;
    background: rgba(148, 163, 184, 0.12);
  }

  /* Progress bars */
  .ap-bars-section { display: flex; flex-direction: column; gap: 12px; }
  .ap-bar-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  .ap-bar-label { font-size: 0.74rem; color: #cbd5e1; }
  .ap-bar-val   { font-size: 0.74rem; font-weight: 700; color: #f8fafc; font-family: 'Syne', sans-serif; }
  .ap-track {
    height: 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    overflow: hidden;
  }
  .ap-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
  }

  /* Quick stats */
  .ap-quick-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .ap-qs-item {
    padding: 14px 16px;
    border-radius: 18px;
    border: 1px solid rgba(148, 163, 184, 0.14);
    background: rgba(255, 255, 255, 0.04);
  }
  .ap-qs-label {
    font-size: 0.72rem;
    color: #94a3b8;
    margin-bottom: 6px;
  }
  .ap-qs-val {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 1rem;
    color: #f8fafc;
  }

  .ap-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    font-size: 0.85rem;
    text-align: center;
  }

  .ap-skel {
    border-radius: 12px;
    background: rgba(148, 163, 184, 0.14);
    animation: apShimmer 1.6s ease-in-out infinite;
  }
  @keyframes apShimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }

  .ap-tooltip {
    background: rgba(15, 23, 42, 0.96);
    border: 1px solid rgba(71, 85, 105, 0.28);
    border-radius: 12px;
    padding: 9px 12px;
    font-size: 0.75rem;
    color: #f8fafc;
    font-family: 'DM Sans', sans-serif;
  }

  @media (max-width: 1100px) {
    .ap-chart-row {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }
  @media (max-width: 768px) {
    .ap-chart-row {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 520px) {
    .ap-header {
      flex-direction: column;
      gap: 12px;
    }
    .ap-badge {
      align-self: flex-start;
    }
  }
`;

const PALETTE = ["#5b6ef5", "#16a34a", "#d97706", "#dc2626", "#8b5cf6", "#0891b2"];

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="ap-tooltip">
            <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{payload[0].name}</span>
            {" — "}
            <span>{payload[0].value}</span>
        </div>
    );
};

const AnalyticsPanel = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await axiosInstance.get("/stats");
                setStats(response.data.stats);
            } catch (error) {
                toast.error(error?.response?.data?.message || "Failed to load analytics");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const data = Object.entries(stats?.document_types || {})
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const total = data.reduce((s, d) => s + d.value, 0);

    const lineData = [
        { name: "Completed", value: stats?.completed_documents || 0 },
        { name: "Processing", value: stats?.processing_documents || 0 },
        { name: "Failed", value: stats?.failed_documents || 0 },
        { name: "Approved", value: stats?.approved_documents || 0 },
    ];

    return (
        <>
            <style>{AP_STYLES}</style>
            <div className="ap-wrap">

                <div className="ap-header">
                    <div>
                        <h3 className="ap-title">Document Analytics</h3>
                        <p className="ap-sub">OCR classification insights</p>
                    </div>
                    <span className="ap-badge">This month</span>
                </div>

                {loading ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                            <div className="ap-skel" style={{ width: 100, height: 100, borderRadius: "50%", flexShrink: 0 }} />
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                                {[80, 65, 55, 45].map((w, i) => (
                                    <div key={i} className="ap-skel" style={{ height: 11, width: `${w}%` }} />
                                ))}
                            </div>
                        </div>
                        <div className="ap-divider" />
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {[90, 75].map((w, i) => (
                                <div key={i}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                                        <div className="ap-skel" style={{ height: 10, width: 100 }} />
                                        <div className="ap-skel" style={{ height: 10, width: 36 }} />
                                    </div>
                                    <div className="ap-skel" style={{ height: 6, width: "100%", borderRadius: 3 }} />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : data.length === 0 ? (
                    <div className="ap-empty">No document type data yet.</div>
                ) : (
                    <>
                        {/* 2-column: Line chart left + Donut analytics right */}
                        <div className="ap-chart-row">
                            {/* Line chart on left */}
                            <div className="ap-line-card">
                                <div className="ap-chart-title">Processing overview</div>
                                <ResponsiveContainer width="100%" height={240}>
                                    <LineChart data={lineData} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
                                        <CartesianGrid stroke="rgba(148,163,184,0.18)" strokeDasharray="4 4" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={3} dot={{ fill: '#38bdf8', r: 4 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Donut + legend on right */}
                            <div className="ap-donut-section ">
                                <div className="ap-donut-wrap" style={{ width: "100%", height: 240 }}>
                                    <ResponsiveContainer width={120} height={120}>
                                        <PieChart>
                                            <Pie
                                                data={data}
                                                dataKey="value"
                                                innerRadius={28}
                                                outerRadius={46}
                                                paddingAngle={3}
                                                startAngle={90}
                                                endAngle={-270}
                                            >
                                                {data.map((entry, index) => (
                                                    <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="ap-legend">
                                    {data.slice(0, 5).map((entry, i) => (
                                        <div key={entry.name} className="ap-legend-item">
                                            <div className="ap-legend-dot" style={{ background: PALETTE[i % PALETTE.length] }} />
                                            <span className="ap-legend-name">{entry.name}</span>
                                            <span className="ap-legend-val">
                                                {total ? `${Math.round((entry.value / total) * 100)}%` : entry.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="ap-divider" />

                        {/* Accuracy bars */}
                        <div className="ap-bars-section">
                            <div>
                                <div className="ap-bar-top">
                                    <span className="ap-bar-label">OCR accuracy</span>
                                    <span className="ap-bar-val">98.2%</span>
                                </div>
                                <div className="ap-track">
                                    <div className="ap-fill" style={{ width: "98%", background: "#5b6ef5" }} />
                                </div>
                            </div>
                            <div>
                                <div className="ap-bar-top">
                                    <span className="ap-bar-label">Avg. confidence</span>
                                    <span className="ap-bar-val">94.7%</span>
                                </div>
                                <div className="ap-track">
                                    <div className="ap-fill" style={{ width: "95%", background: "#16a34a" }} />
                                </div>
                            </div>
                        </div>

                        <div className="ap-divider" />

                        {/* Quick stats */}
                        <div className="ap-quick-grid">
                            <div className="ap-qs-item">
                                <div className="ap-qs-label">Total docs</div>
                                <div className="ap-qs-val">{total.toLocaleString()}</div>
                            </div>
                            <div className="ap-qs-item">
                                <div className="ap-qs-label">Types found</div>
                                <div className="ap-qs-val">{data.length}</div>
                            </div>
                            <div className="ap-qs-item">
                                <div className="ap-qs-label">Top type</div>
                                <div className="ap-qs-val" style={{ fontSize: "0.78rem", textTransform: "capitalize" }}>
                                    {data[0]?.name || "—"}
                                </div>
                            </div>
                            <div className="ap-qs-item">
                                <div className="ap-qs-label">Avg. time</div>
                                <div className="ap-qs-val">1.4s</div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default AnalyticsPanel;