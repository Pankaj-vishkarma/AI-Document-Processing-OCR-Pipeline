import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axios";

const AP_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@400;500&display=swap');

  .ap-wrap {
    padding: 22px 24px 24px;
    font-family: 'DM Sans', sans-serif;
    display: flex;
    flex-direction: column;
    gap: 18px;
    height: 100%;
  }

  .ap-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }
  .ap-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 1rem;
    color: #0F172A;
    margin: 0 0 3px;
  }
  .ap-sub {
    font-size: 0.75rem;
    color: #94A3B8;
    margin: 0;
  }
  .ap-badge {
    font-size: 0.65rem;
    font-weight: 700;
    font-family: 'Syne', sans-serif;
    letter-spacing: 0.04em;
    padding: 3px 10px;
    border-radius: 20px;
    background: #EEF0FD;
    border: 1px solid #C7CEFA;
    color: #4A52C9;
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* Donut */
  .ap-donut-section {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .ap-donut-wrap { flex-shrink: 0; }

  .ap-legend {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 7px;
    min-width: 0;
  }
  .ap-legend-item {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 0.72rem;
    color: #64748B;
  }
  .ap-legend-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .ap-legend-name {
    flex: 1;
    text-transform: capitalize;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #475569;
  }
  .ap-legend-val {
    font-weight: 700;
    color: #0F172A;
    font-size: 0.73rem;
    font-family: 'Syne', sans-serif;
  }

  /* Divider */
  .ap-divider {
    height: 1px;
    background: #F1F5F9;
  }

  /* Progress bars */
  .ap-bars-section { display: flex; flex-direction: column; gap: 10px; }
  .ap-bar-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
  }
  .ap-bar-label { font-size: 0.72rem; color: #64748B; }
  .ap-bar-val   { font-size: 0.72rem; font-weight: 700; color: #0F172A; font-family: 'Syne', sans-serif; }
  .ap-track {
    height: 6px;
    border-radius: 3px;
    background: #F1F5F9;
    overflow: hidden;
  }
  .ap-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
  }

  /* Quick stats */
  .ap-quick-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .ap-qs-item {
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid #F1F5F9;
    background: #F8FAFC;
  }
  .ap-qs-label {
    font-size: 0.67rem;
    color: #94A3B8;
    margin-bottom: 4px;
  }
  .ap-qs-val {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 1rem;
    color: #0F172A;
  }

  .ap-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94A3B8;
    font-size: 0.82rem;
    text-align: center;
  }

  .ap-skel {
    border-radius: 7px;
    background: #F1F5F9;
    animation: apShimmer 1.6s ease-in-out infinite;
  }
  @keyframes apShimmer { 0%,100%{opacity:0.6} 50%{opacity:1} }

  .ap-tooltip {
    background: #0F172A;
    border: 1px solid #1E293B;
    border-radius: 9px;
    padding: 7px 11px;
    font-size: 0.73rem;
    color: #F8FAFC;
    font-family: 'DM Sans', sans-serif;
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
                        {/* Donut + legend */}
                        <div className="ap-donut-section">
                            <div className="ap-donut-wrap" style={{ width: 100, height: 100 }}>
                                <ResponsiveContainer width={100} height={100}>
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