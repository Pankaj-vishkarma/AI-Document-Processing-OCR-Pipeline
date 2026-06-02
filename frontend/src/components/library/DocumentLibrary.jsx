import { useEffect, useMemo, useState } from "react";

import {
    Search,
    Trash2,
    FileText,
    RefreshCw,
    LayoutGrid,
    List,
    CheckSquare,
} from "lucide-react";

import toast from "react-hot-toast";

import { useNavigate } from "react-router-dom";

import axiosInstance from "../../api/axios";

const DL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500&display=swap');

  .dl-container { display: flex; flex-direction: column; gap: 24px; }

  /* ── Search bar ── */
  .dl-search-card { background: rgba(15,23,42,0.80); border: 1px solid rgba(148,163,184,0.18); border-radius: 24px; padding: 20px 24px; box-shadow: 0 24px 50px rgba(0,0,0,0.24); backdrop-filter: blur(20px); }
  .dl-search-wrap { position: relative; }
  .dl-search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #64748b; pointer-events: none; }
  .dl-search-input { width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(148,163,184,0.18); border-radius: 16px; padding: 14px 16px 14px 48px; color: #f8fafc; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; outline: none; transition: all 0.2s ease; }
  .dl-search-input::placeholder { color: #64748b; }
  .dl-search-input:focus { border-color: rgba(59,130,246,0.5); background: rgba(59,130,246,0.06); box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }

  /* ── Toolbar ── */
  .dl-toolbar { display: flex; flex-direction: column; gap: 14px; }
  .dl-toolbar-left { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
  .dl-toolbar-right { display: flex; align-items: center; gap: 10px; }
  @media (min-width: 1280px) { .dl-toolbar { flex-direction: row; align-items: center; justify-content: space-between; } }

  /* ── Selects ── */
  .dl-select { background: rgba(15,23,42,0.80); border: 1px solid rgba(148,163,184,0.18); border-radius: 14px; padding: 11px 16px; color: #e2e8f0; font-family: 'DM Sans', sans-serif; font-size: 0.88rem; outline: none; cursor: pointer; transition: all 0.2s ease; backdrop-filter: blur(10px); appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 36px; }
  .dl-select:hover { border-color: rgba(148,163,184,0.35); }
  .dl-select option { background: #0e172c; color: #f8fafc; }

  /* ── Buttons ── */
  .dl-btn-primary { display: inline-flex; align-items: center; gap: 8px; padding: 11px 20px; border-radius: 14px; border: none; background: linear-gradient(135deg, #4f46e5, #2563eb); font-size: 0.82rem; font-weight: 600; color: #ffffff; font-family: 'Syne', sans-serif; letter-spacing: 0.02em; cursor: pointer; transition: all 0.2s ease; }
  .dl-btn-primary:hover { box-shadow: 0 16px 30px rgba(79,70,229,0.28); transform: translateY(-1px); }
  .dl-btn-danger { display: inline-flex; align-items: center; gap: 8px; padding: 11px 20px; border-radius: 14px; border: none; background: rgba(239,68,68,0.16); color: #fca5a5; font-size: 0.82rem; font-weight: 600; font-family: 'Syne', sans-serif; letter-spacing: 0.02em; cursor: pointer; transition: all 0.2s ease; border: 1px solid rgba(239,68,68,0.25); }
  .dl-btn-danger:hover { background: rgba(239,68,68,0.25); border-color: rgba(239,68,68,0.4); }
  .dl-icon-toggle { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; border: 1px solid rgba(148,163,184,0.18); background: rgba(15,23,42,0.80); color: #94a3b8; }
  .dl-icon-toggle.active { background: linear-gradient(135deg, #4f46e5, #2563eb); color: #ffffff; border-color: transparent; box-shadow: 0 8px 20px rgba(79,70,229,0.3); }
  .dl-icon-toggle:hover:not(.active) { border-color: rgba(148,163,184,0.35); color: #e2e8f0; }

  /* ── Pagination info ── */
  .dl-pagination-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px; }
  .dl-pagination-info { font-family: 'DM Sans', sans-serif; font-size: 0.88rem; color: #94a3b8; }
  .dl-pagination-btns { display: flex; align-items: center; gap: 8px; }
  .dl-page-btn { padding: 8px 16px; border-radius: 12px; border: 1px solid rgba(148,163,184,0.18); background: rgba(15,23,42,0.80); color: #e2e8f0; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; cursor: pointer; transition: all 0.2s ease; }
  .dl-page-btn:hover:not(:disabled) { border-color: rgba(148,163,184,0.35); background: rgba(255,255,255,0.08); }
  .dl-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .dl-page-current { padding: 8px 16px; border-radius: 12px; background: rgba(59,130,246,0.14); border: 1px solid rgba(59,130,246,0.25); color: #bfdbfe; font-family: 'Syne', sans-serif; font-size: 0.82rem; font-weight: 600; }

  /* ── Table ── */
  .dl-table-card { background: rgba(15,23,42,0.80); border: 1px solid rgba(148,163,184,0.18); border-radius: 24px; box-shadow: 0 24px 50px rgba(0,0,0,0.24); backdrop-filter: blur(20px); overflow: hidden; }
  .dl-table-scroll { overflow-x: auto; }
  .dl-table { width: 100%; min-width: 800px; border-collapse: collapse; }
  .dl-thead { background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(148,163,184,0.12); }
  .dl-th { text-align: left; padding: 16px 20px; font-family: 'Syne', sans-serif; font-size: 0.78rem; font-weight: 700; color: #94a3b8; letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap; }
  .dl-th-right { text-align: right; }
  .dl-tr { border-bottom: 1px solid rgba(148,163,184,0.08); transition: background 0.15s ease; }
  .dl-tr:last-child { border-bottom: none; }
  .dl-tr:hover { background: rgba(255,255,255,0.03); }
  .dl-td { padding: 16px 20px; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; color: #cbd5e1; vertical-align: middle; }
  .dl-td-right { text-align: right; }
  .dl-empty-row td { text-align: center; padding: 64px 20px; color: #64748b; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; }

  /* ── Doc name cell ── */
  .dl-doc-cell { display: flex; align-items: center; gap: 14px; }
  .dl-doc-icon { width: 44px; height: 44px; border-radius: 14px; background: rgba(59,130,246,0.16); display: flex; align-items: center; justify-content: center; color: #bfdbfe; flex-shrink: 0; }
  .dl-doc-name { font-weight: 600; color: #f8fafc; font-size: 0.9rem; margin: 0 0 3px; word-break: break-word; }
  .dl-doc-type-text { font-size: 0.8rem; color: #64748b; margin: 0; }

  /* ── Select checkbox button ── */
  .dl-check-btn { width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1px solid rgba(148,163,184,0.18); background: rgba(255,255,255,0.04); color: #64748b; transition: all 0.2s ease; }
  .dl-check-btn.selected { background: linear-gradient(135deg, #4f46e5, #2563eb); color: #ffffff; border-color: transparent; }
  .dl-check-btn:hover:not(.selected) { border-color: rgba(148,163,184,0.35); color: #e2e8f0; }

  /* ── Status badges ── */
  .dl-status { display: inline-flex; align-items: center; padding: 5px 14px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; font-family: 'Syne', sans-serif; border: 1px solid transparent; white-space: nowrap; }
  .dl-status-completed { background: rgba(34,197,94,0.16); color: #bbf7d0; border-color: rgba(34,197,94,0.25); }
  .dl-status-processing { background: rgba(59,130,246,0.16); color: #bfdbfe; border-color: rgba(59,130,246,0.25); animation: dlPulse 1.5s ease-in-out infinite; }
  .dl-status-failed { background: rgba(239,68,68,0.16); color: #fecaca; border-color: rgba(239,68,68,0.25); }
  .dl-status-approved { background: rgba(168,85,247,0.16); color: #e9d5ff; border-color: rgba(168,85,247,0.25); }
  .dl-status-default { background: rgba(245,158,11,0.16); color: #fde68a; border-color: rgba(245,158,11,0.25); }
  @keyframes dlPulse { 0%,100% { opacity:1; } 50% { opacity:0.65; } }

  /* ── Action icon buttons ── */
  .dl-action-btn { width: 38px; height: 38px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; border: none; transition: all 0.2s ease; }
  .dl-action-view { background: rgba(59,130,246,0.16); color: #bfdbfe; border: 1px solid rgba(59,130,246,0.25); margin-right: 8px; }
  .dl-action-view:hover { background: rgba(59,130,246,0.28); }
  .dl-action-delete { background: rgba(239,68,68,0.14); color: #fca5a5; border: 1px solid rgba(239,68,68,0.22); }
  .dl-action-delete:hover { background: rgba(239,68,68,0.25); }

  /* ── Grid view ── */
  .dl-grid { display: grid; grid-template-columns: 1fr; gap: 18px; }
  @media (min-width: 768px) { .dl-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1536px) { .dl-grid { grid-template-columns: repeat(3, 1fr); } }

  .dl-grid-card { background: rgba(15,23,42,0.80); border: 1px solid rgba(148,163,184,0.18); border-radius: 24px; padding: 22px; box-shadow: 0 24px 50px rgba(0,0,0,0.24); backdrop-filter: blur(20px); transition: all 0.2s ease; }
  .dl-grid-card:hover { border-color: rgba(148,163,184,0.30); box-shadow: 0 28px 60px rgba(0,0,0,0.32); transform: translateY(-2px); }
  .dl-grid-card-top { display: flex; align-items: flex-start; justify-content: space-between; }
  .dl-grid-icon-wrap { display: flex; align-items: center; justify-content: center; margin: 22px 0; }
  .dl-grid-icon { width: 80px; height: 80px; border-radius: 24px; background: rgba(59,130,246,0.16); display: flex; align-items: center; justify-content: center; color: #bfdbfe; }
  .dl-grid-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1rem; color: #f8fafc; margin: 0 0 4px; word-break: break-word; }
  .dl-grid-filetype { font-size: 0.82rem; color: #64748b; margin: 0; }
  .dl-grid-badges { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
  .dl-badge-type { display: inline-flex; align-items: center; padding: 5px 12px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; font-family: 'Syne', sans-serif; background: rgba(59,130,246,0.18); color: #bfdbfe; border: 1px solid rgba(59,130,246,0.30); }
  .dl-badge-conf { display: inline-flex; align-items: center; padding: 5px 12px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; font-family: 'Syne', sans-serif; background: rgba(148,163,184,0.12); color: #94a3b8; border: 1px solid rgba(148,163,184,0.20); }
  .dl-grid-actions { display: flex; align-items: center; gap: 10px; margin-top: 18px; }
  .dl-grid-review-btn { flex: 1; padding: 12px; border-radius: 14px; border: none; background: linear-gradient(135deg, #4f46e5, #2563eb); color: #ffffff; font-family: 'Syne', sans-serif; font-size: 0.82rem; font-weight: 600; letter-spacing: 0.02em; cursor: pointer; transition: all 0.2s ease; }
  .dl-grid-review-btn:hover { box-shadow: 0 12px 24px rgba(79,70,229,0.28); transform: translateY(-1px); }
  .dl-grid-del-btn { width: 44px; height: 44px; border-radius: 14px; border: 1px solid rgba(239,68,68,0.22); background: rgba(239,68,68,0.12); color: #fca5a5; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; flex-shrink: 0; }
  .dl-grid-del-btn:hover { background: rgba(239,68,68,0.22); }

  .dl-empty-grid { background: rgba(15,23,42,0.80); border: 1px solid rgba(148,163,184,0.18); border-radius: 24px; padding: 64px 24px; text-align: center; color: #64748b; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; grid-column: 1 / -1; }

  /* ── Delete modal ── */
  .dl-modal-overlay { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.65); padding: 16px; backdrop-filter: blur(4px); }
  .dl-modal { width: 100%; max-width: 440px; background: rgba(15,23,42,0.96); border: 1px solid rgba(148,163,184,0.18); border-radius: 24px; padding: 28px; box-shadow: 0 40px 80px rgba(0,0,0,0.5); backdrop-filter: blur(24px); }
  .dl-modal-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1.3rem; color: #f8fafc; margin: 0 0 12px; }
  .dl-modal-text { font-family: 'DM Sans', sans-serif; font-size: 0.93rem; color: #94a3b8; line-height: 1.65; margin: 0; }
  .dl-modal-actions { display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-top: 24px; }
  .dl-modal-cancel { padding: 11px 20px; border-radius: 14px; border: 1px solid rgba(148,163,184,0.25); background: rgba(255,255,255,0.06); color: #e2e8f0; font-family: 'Syne', sans-serif; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
  .dl-modal-cancel:hover { border-color: rgba(148,163,184,0.4); background: rgba(255,255,255,0.10); }
  .dl-modal-confirm { padding: 11px 20px; border-radius: 14px; border: none; background: rgba(239,68,68,0.85); color: #ffffff; font-family: 'Syne', sans-serif; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
  .dl-modal-confirm:hover { background: rgba(239,68,68,1); box-shadow: 0 8px 20px rgba(239,68,68,0.3); }

  /* ── Confidence in table ── */
  .dl-conf-high { color: #bbf7d0; }
  .dl-conf-med { color: #fde68a; }
  .dl-conf-low { color: #fca5a5; }
  .dl-conf-na { color: #64748b; }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .dl-th, .dl-td { padding: 14px 14px; }
    .dl-toolbar-left { gap: 8px; }
    .dl-select, .dl-btn-primary, .dl-btn-danger { font-size: 0.8rem; padding: 10px 14px; }
    .dl-pagination-bar { flex-direction: column; align-items: flex-start; }
  }
  @media (max-width: 480px) {
    .dl-toolbar-left { width: 100%; }
    .dl-select { flex: 1; min-width: 110px; }
    .dl-btn-danger { width: 100%; justify-content: center; }
    .dl-grid-card { padding: 18px; }
  }
`;

const DocumentLibrary = () => {

    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState("table");
    const [statusFilter, setStatusFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [selectedDocuments, setSelectedDocuments] = useState([]);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const navigate = useNavigate();

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get("/documents", {
                params: { page: 1, limit: 1000 },
            });
            setDocuments(response.data.documents || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to fetch documents");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDocuments(); }, []);

    const handleDelete = (documentId) => {
        setPendingDelete({ documentIds: [documentId] });
    };

    const handleConfirmDelete = async () => {
        if (!pendingDelete) return;
        try {
            await Promise.all(
                pendingDelete.documentIds.map((documentId) =>
                    axiosInstance.delete(`/documents/${documentId}`)
                )
            );
            toast.success(
                pendingDelete.documentIds.length > 1
                    ? "Selected documents deleted successfully"
                    : "Document deleted successfully"
            );
            setSelectedDocuments([]);
            setPendingDelete(null);
            fetchDocuments();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Delete failed");
        }
    };

    const filteredDocuments = useMemo(() => {
        return documents.filter((document) => {
            const matchesSearch = document.original_filename
                ?.toLowerCase()
                .includes(search.toLowerCase());
            const matchesStatus = statusFilter ? document.status === statusFilter : true;
            const matchesType = typeFilter ? document.document_type === typeFilter : true;
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [documents, search, statusFilter, typeFilter]);

    useEffect(() => { setCurrentPage(1); }, [search, statusFilter, typeFilter, viewMode]);

    const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / pageSize));

    const paginatedDocuments = filteredDocuments.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    useEffect(() => {
        setCurrentPage((page) => Math.min(page, totalPages));
    }, [totalPages]);

    const availableTypes = useMemo(() => {
        return Array.from(
            new Set(documents.map((document) => document.document_type).filter(Boolean))
        ).sort();
    }, [documents]);

    const handleBulkDelete = async () => {
        if (selectedDocuments.length === 0) {
            toast.error("Select documents first");
            return;
        }
        setPendingDelete({ documentIds: selectedDocuments });
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "completed": return "dl-status dl-status-completed";
            case "processing": return "dl-status dl-status-processing";
            case "failed": return "dl-status dl-status-failed";
            case "approved": return "dl-status dl-status-approved";
            default: return "dl-status dl-status-default";
        }
    };

    const getConfClass = (score) => {
        if (!score && score !== 0) return "dl-conf-na";
        if (score >= 0.8) return "dl-conf-high";
        if (score >= 0.5) return "dl-conf-med";
        return "dl-conf-low";
    };

    const toggleSelect = (id) => {
        setSelectedDocuments((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    return (
        <>
            <style>{DL_STYLES}</style>
            <div className="dl-container">

                {/* Search */}
                <div className="dl-search-card">
                    <div className="dl-search-wrap">
                        <Search size={20} className="dl-search-icon" />
                        <input
                            type="text"
                            placeholder="Search documents..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="dl-search-input"
                        />
                    </div>
                </div>

                {/* Toolbar */}
                <div className="dl-toolbar">
                    <div className="dl-toolbar-left">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="dl-select"
                        >
                            <option value="">All Status</option>
                            <option value="uploaded">Uploaded</option>
                            <option value="processing">Processing</option>
                            <option value="completed">Completed</option>
                            <option value="approved">Approved</option>
                            <option value="failed">Failed</option>
                        </select>

                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="dl-select"
                        >
                            <option value="">All Types</option>
                            {availableTypes.map((documentType) => (
                                <option key={documentType} value={documentType}>
                                    {documentType}
                                </option>
                            ))}
                        </select>

                        <button onClick={handleBulkDelete} className="dl-btn-danger">
                            <Trash2 size={16} />
                            Bulk Delete
                        </button>
                    </div>

                    <div className="dl-toolbar-right">
                        <button
                            onClick={fetchDocuments}
                            className="dl-btn-primary"
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </button>

                        <button
                            onClick={() => setViewMode("table")}
                            className={`dl-icon-toggle ${viewMode === "table" ? "active" : ""}`}
                        >
                            <List size={20} />
                        </button>

                        <button
                            onClick={() => setViewMode("grid")}
                            className={`dl-icon-toggle ${viewMode === "grid" ? "active" : ""}`}
                        >
                            <LayoutGrid size={20} />
                        </button>
                    </div>
                </div>

                {/* Pagination info */}
                <div className="dl-pagination-bar">
                    <div className="dl-pagination-info">
                        Showing{" "}
                        {filteredDocuments.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                        {" "}to{" "}
                        {Math.min(currentPage * pageSize, filteredDocuments.length)}
                        {" "}of {filteredDocuments.length} documents
                    </div>
                    <div className="dl-pagination-btns">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="dl-page-btn"
                        >
                            Previous
                        </button>
                        <span className="dl-page-current">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="dl-page-btn"
                        >
                            Next
                        </button>
                    </div>
                </div>

                {/* Table View */}
                {viewMode === "table" ? (
                    <div className="dl-table-card">
                        <div className="dl-table-scroll">
                            <table className="dl-table">
                                <thead className="dl-thead">
                                    <tr>
                                        <th className="dl-th">Select</th>
                                        <th className="dl-th">Document</th>
                                        <th className="dl-th">Type</th>
                                        <th className="dl-th">Status</th>
                                        <th className="dl-th">Confidence</th>
                                        <th className="dl-th">Created</th>
                                        <th className="dl-th dl-th-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr className="dl-empty-row">
                                            <td colSpan="7">Loading documents...</td>
                                        </tr>
                                    ) : filteredDocuments.length === 0 ? (
                                        <tr className="dl-empty-row">
                                            <td colSpan="7">No documents found</td>
                                        </tr>
                                    ) : (
                                        paginatedDocuments.map((document) => (
                                            <tr key={document.id} className="dl-tr">
                                                <td className="dl-td">
                                                    <button
                                                        onClick={() => toggleSelect(document.id)}
                                                        className={`dl-check-btn ${selectedDocuments.includes(document.id) ? "selected" : ""}`}
                                                    >
                                                        <CheckSquare size={16} />
                                                    </button>
                                                </td>

                                                <td className="dl-td">
                                                    <div className="dl-doc-cell">
                                                        <div className="dl-doc-icon">
                                                            <FileText size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="dl-doc-name">{document.original_filename}</p>
                                                            <p className="dl-doc-type-text">{document.file_type}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="dl-td">{document.document_type || "N/A"}</td>

                                                <td className="dl-td">
                                                    <span className={getStatusClass(document.status)}>
                                                        {document.status}
                                                    </span>
                                                </td>

                                                <td className={`dl-td ${getConfClass(document.confidence_score)}`}>
                                                    {document.confidence_score
                                                        ? `${Math.round(document.confidence_score * 100)}%`
                                                        : "N/A"}
                                                </td>

                                                <td className="dl-td">
                                                    {new Date(document.created_at).toLocaleDateString()}
                                                </td>

                                                <td className="dl-td dl-td-right">
                                                    <button
                                                        onClick={() => navigate(`/review/${document.id}`)}
                                                        className="dl-action-btn dl-action-view"
                                                    >
                                                        <FileText size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(document.id)}
                                                        className="dl-action-btn dl-action-delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                ) : (

                    /* Grid View */
                    <div className="dl-grid">
                        {loading ? (
                            <div className="dl-empty-grid">Loading documents...</div>
                        ) : filteredDocuments.length === 0 ? (
                            <div className="dl-empty-grid">No documents found</div>
                        ) : (
                            paginatedDocuments.map((document) => (
                                <div key={document.id} className="dl-grid-card">
                                    <div className="dl-grid-card-top">
                                        <button
                                            onClick={() => toggleSelect(document.id)}
                                            className={`dl-check-btn ${selectedDocuments.includes(document.id) ? "selected" : ""}`}
                                        >
                                            <CheckSquare size={16} />
                                        </button>
                                        <span className={getStatusClass(document.status)}>
                                            {document.status}
                                        </span>
                                    </div>

                                    <div className="dl-grid-icon-wrap">
                                        <div className="dl-grid-icon">
                                            <FileText size={38} />
                                        </div>
                                    </div>

                                    <div>
                                        <p className="dl-grid-name">{document.original_filename}</p>
                                        <p className="dl-grid-filetype">{document.file_type}</p>
                                    </div>

                                    <div className="dl-grid-badges">
                                        <span className="dl-badge-type">
                                            {document.document_type || "Unknown"}
                                        </span>
                                        <span className="dl-badge-conf">
                                            {document.confidence_score
                                                ? `${Math.round(document.confidence_score * 100)}%`
                                                : "N/A"}
                                        </span>
                                    </div>

                                    <div className="dl-grid-actions">
                                        <button
                                            onClick={() => navigate(`/review/${document.id}`)}
                                            className="dl-grid-review-btn"
                                        >
                                            Review
                                        </button>
                                        <button
                                            onClick={() => handleDelete(document.id)}
                                            className="dl-grid-del-btn"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {pendingDelete && (
                    <div className="dl-modal-overlay">
                        <div className="dl-modal">
                            <h2 className="dl-modal-title">Confirm Deletion</h2>
                            <p className="dl-modal-text">
                                {pendingDelete.documentIds.length > 1
                                    ? `Delete ${pendingDelete.documentIds.length} selected documents? This action cannot be undone.`
                                    : "Delete this document? This action cannot be undone."}
                            </p>
                            <div className="dl-modal-actions">
                                <button
                                    onClick={() => setPendingDelete(null)}
                                    className="dl-modal-cancel"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    className="dl-modal-confirm"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </>
    );
};

export default DocumentLibrary;