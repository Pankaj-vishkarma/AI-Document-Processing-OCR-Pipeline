import { useEffect, useState } from "react";
import axiosInstance from "../../api/axios";
import toast from "react-hot-toast";

const RD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@400;500&display=swap');

  .rd-wrap {
    padding: 24px 26px 26px;
    font-family: 'DM Sans', sans-serif;
    background: rgba(15, 23, 42, 0.80);
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 24px;
    backdrop-filter: blur(18px);
    box-shadow: 0 22px 48px rgba(0, 0, 0, 0.22);
  }

  .rd-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 18px;
    gap: 12px;
    flex-wrap: wrap;
  }

  .rd-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 1rem;
    color: #f8fafc;
    margin: 0 0 4px;
  }
  .rd-sub {
    font-size: 0.78rem;
    color: #cbd5e1;
    margin: 0;
  }

  .rd-filters {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
    flex-wrap: wrap;
  }
  .rd-filter-btn {
    font-size: 0.7rem;
    font-weight: 600;
    font-family: 'Syne', sans-serif;
    letter-spacing: 0.03em;
    padding: 6px 14px;
    border-radius: 999px;
    border: 1px solid rgba(148, 163, 184, 0.18);
    background: rgba(255, 255, 255, 0.04);
    color: #cbd5e1;
    cursor: pointer;
    transition: all 0.18s ease;
  }
  .rd-filter-btn:hover {
    border-color: rgba(148, 163, 184, 0.35);
    color: #ffffff;
    background: rgba(255, 255, 255, 0.08);
  }
  .rd-filter-btn.active {
    background: rgba(59, 130, 246, 0.18);
    border-color: rgba(59, 130, 246, 0.35);
    color: #eff6ff;
  }

  .rd-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .rd-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    border-radius: 18px;
    border: 1px solid rgba(148, 163, 184, 0.14);
    background: rgba(255, 255, 255, 0.04);
    transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
  }
  .rd-row:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(148, 163, 184, 0.28);
    box-shadow: 0 14px 32px rgba(0, 0, 0, 0.14);
  }

  .rd-file-icon {
    width: 40px; height: 40px;
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .rd-file-icon.blue   { background: rgba(59, 130, 246, 0.15); color: #bfdbfe; }
  .rd-file-icon.green  { background: rgba(34, 197, 94, 0.15); color: #bbf7d0; }
  .rd-file-icon.amber  { background: rgba(245, 158, 11, 0.15); color: #fde68a; }
  .rd-file-icon.red    { background: rgba(239, 68, 68, 0.15); color: #fecaca; }

  .rd-meta { flex: 1; min-width: 0; }
  .rd-name {
    font-size: 0.86rem;
    font-weight: 500;
    color: #f8fafc;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 3px;
  }
  .rd-type {
    font-size: 0.72rem;
    color: #94a3b8;
    text-transform: capitalize;
  }

  .rd-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

  .rd-badge {
    font-size: 0.68rem;
    font-weight: 600;
    font-family: 'Syne', sans-serif;
    letter-spacing: 0.03em;
    padding: 5px 12px;
    border-radius: 999px;
    text-transform: capitalize;
  }
  .rd-badge.completed  { background: rgba(34, 197, 94, 0.16); color: #bbf7d0;  border: 1px solid rgba(34, 197, 94, 0.24); }
  .rd-badge.failed     { background: rgba(239, 68, 68, 0.16); color: #fecaca;  border: 1px solid rgba(239, 68, 68, 0.24); }
  .rd-badge.processing { background: rgba(245, 158, 11, 0.16); color: #fde68a;  border: 1px solid rgba(245, 158, 11, 0.24); }
  .rd-badge.default    { background: rgba(59, 130, 246, 0.14); color: #bfdbfe;  border: 1px solid rgba(59, 130, 246, 0.24); }

  .rd-empty, .rd-loading {
    padding: 32px 0;
    text-align: center;
    color: #94a3b8;
    font-size: 0.84rem;
  }

  .rd-skel-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    border-radius: 18px;
    border: 1px solid rgba(148, 163, 184, 0.14);
    background: rgba(255, 255, 255, 0.04);
  }
  .rd-skel-bar {
    border-radius: 8px;
    background: rgba(148, 163, 184, 0.16);
    animation: rdShimmer 1.6s ease-in-out infinite;
  }
  @keyframes rdShimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }
`;

const FileIcon = ({ status }) => {
    const cls =
        status === "completed" ? "green" :
            status === "failed" ? "red" :
                status === "processing" ? "amber" : "blue";

    return (
        <div className={`rd-file-icon ${cls}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
            </svg>
        </div>
    );
};

const FILTERS = ["All", "Completed", "Failed", "Processing"];

const RecentDocuments = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("All");

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get("/documents", {
                params: { page: 1, limit: 5 },
            });
            setDocuments(response.data.documents || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to fetch documents");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDocuments(); }, []);

    const filtered =
        filter === "All"
            ? documents
            : documents.filter((d) => d.status?.toLowerCase() === filter.toLowerCase());

    const getBadgeClass = (status) => {
        const s = status?.toLowerCase();
        if (s === "completed") return "completed";
        if (s === "failed") return "failed";
        if (s === "processing") return "processing";
        return "default";
    };

    return (
        <>
            <style>{RD_STYLES}</style>
            <div className="rd-wrap">
                <div className="rd-header">
                    <div>
                        <h3 className="rd-title">Recent Documents</h3>
                        <p className="rd-sub">Latest uploaded documents</p>
                    </div>
                    <div className="rd-filters">
                        {FILTERS.map((f) => (
                            <button
                                key={f}
                                className={`rd-filter-btn${filter === f ? " active" : ""}`}
                                onClick={() => setFilter(f)}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="rd-list">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="rd-skel-row">
                                <div className="rd-skel-bar" style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                    <div className="rd-skel-bar" style={{ height: 11, width: "65%", marginBottom: 6 }} />
                                    <div className="rd-skel-bar" style={{ height: 9, width: "35%" }} />
                                </div>
                                <div className="rd-skel-bar" style={{ height: 22, width: 72, borderRadius: 20 }} />
                            </div>
                        ))
                    ) : filtered.length === 0 ? (
                        <div className="rd-empty">No documents found</div>
                    ) : (
                        filtered.map((doc) => (
                            <div key={doc.id} className="rd-row">
                                <FileIcon status={doc.status} />
                                <div className="rd-meta">
                                    <div className="rd-name">{doc.original_filename}</div>
                                    <div className="rd-type">{doc.document_type || "Unknown"}</div>
                                </div>
                                <div className="rd-right">
                                    <span className={`rd-badge ${getBadgeClass(doc.status)}`}>
                                        {doc.status || "unknown"}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default RecentDocuments;