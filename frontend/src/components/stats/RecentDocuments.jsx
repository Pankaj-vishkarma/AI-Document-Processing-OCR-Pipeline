import { useEffect, useState } from "react";
import axiosInstance from "../../api/axios";
import toast from "react-hot-toast";

const RD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@400;500&display=swap');

  .rd-wrap {
    padding: 22px 24px 24px;
    font-family: 'DM Sans', sans-serif;
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
    color: #0F172A;
    margin: 0 0 3px;
  }
  .rd-sub {
    font-size: 0.75rem;
    color: #94A3B8;
    margin: 0;
  }

  .rd-filters {
    display: flex;
    gap: 5px;
    flex-shrink: 0;
    flex-wrap: wrap;
  }
  .rd-filter-btn {
    font-size: 0.68rem;
    font-weight: 600;
    font-family: 'Syne', sans-serif;
    letter-spacing: 0.03em;
    padding: 4px 12px;
    border-radius: 20px;
    border: 1px solid #E8ECF4;
    background: #F8FAFC;
    color: #64748B;
    cursor: pointer;
    transition: all 0.18s;
  }
  .rd-filter-btn:hover {
    border-color: #C7CEFA;
    color: #4A52C9;
    background: #EEF0FD;
  }
  .rd-filter-btn.active {
    background: #EEF0FD;
    border-color: #C7CEFA;
    color: #4A52C9;
  }

  .rd-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .rd-row {
    display: flex;
    align-items: center;
    gap: 13px;
    padding: 11px 13px;
    border-radius: 11px;
    border: 1px solid #F1F5F9;
    background: #F8FAFC;
    transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
  }
  .rd-row:hover {
    background: #F1F5F9;
    border-color: #E2E8F0;
    box-shadow: 0 2px 8px rgba(15,23,42,0.04);
  }

  .rd-file-icon {
    width: 36px; height: 36px;
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .rd-file-icon.blue   { background: #EEF0FD; color: #4A52C9; }
  .rd-file-icon.green  { background: #DCFCE7; color: #16a34a; }
  .rd-file-icon.amber  { background: #FEF3C7; color: #d97706; }
  .rd-file-icon.red    { background: #FEE2E2; color: #dc2626; }

  .rd-meta { flex: 1; min-width: 0; }
  .rd-name {
    font-size: 0.82rem;
    font-weight: 500;
    color: #0F172A;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 2px;
  }
  .rd-type {
    font-size: 0.7rem;
    color: #94A3B8;
    text-transform: capitalize;
  }

  .rd-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

  .rd-badge {
    font-size: 0.68rem;
    font-weight: 600;
    font-family: 'Syne', sans-serif;
    letter-spacing: 0.03em;
    padding: 3px 10px;
    border-radius: 20px;
    text-transform: capitalize;
  }
  .rd-badge.completed  { background: #DCFCE7; color: #16a34a;  border: 1px solid #BBF7D0; }
  .rd-badge.failed     { background: #FEE2E2; color: #dc2626;  border: 1px solid #FECACA; }
  .rd-badge.processing { background: #FEF3C7; color: #d97706;  border: 1px solid #FDE68A; }
  .rd-badge.default    { background: #EEF0FD; color: #4A52C9;  border: 1px solid #C7CEFA; }

  .rd-empty, .rd-loading {
    padding: 32px 0;
    text-align: center;
    color: #94A3B8;
    font-size: 0.82rem;
  }

  .rd-skel-row {
    display: flex;
    align-items: center;
    gap: 13px;
    padding: 11px 13px;
    border-radius: 11px;
    border: 1px solid #F1F5F9;
    background: #F8FAFC;
  }
  .rd-skel-bar {
    border-radius: 5px;
    background: #E2E8F0;
    animation: rdShimmer 1.6s ease-in-out infinite;
  }
  @keyframes rdShimmer { 0%,100%{opacity:0.6} 50%{opacity:1} }
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