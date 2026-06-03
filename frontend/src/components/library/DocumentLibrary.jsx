import { useEffect, useMemo, useState } from "react";
import {
    Search, Trash2, FileText, RefreshCw,
    LayoutGrid, List, CheckSquare,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axios";
import { useUploadQueue } from "../../context/UploadQueueContext";

/* ── helpers ─────────────────────────────────────────────────── */
const statusBadge = (status) => {
    switch (status) {
        case "completed": return "bg-emerald-50 text-emerald-700 border border-emerald-200";
        case "processing": return "bg-blue-50 text-blue-700 border border-blue-200 animate-pulse";
        case "failed": return "bg-red-50 text-red-700 border border-red-200";
        case "approved": return "bg-purple-50 text-purple-700 border border-purple-200";
        default: return "bg-amber-50 text-amber-700 border border-amber-200";
    }
};

const confColor = (score) => {
    if (score == null) return "text-gray-400";
    if (score >= 0.8) return "text-emerald-600 font-semibold";
    if (score >= 0.5) return "text-amber-600 font-semibold";
    return "text-red-600 font-semibold";
};

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
    const { removeDocumentsByIds } = useUploadQueue();

    /* ── API (unchanged) ──────────────────────────────────────── */
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

    const handleDelete = (documentId) => setPendingDelete({ documentIds: [documentId] });

    const handleConfirmDelete = async () => {
        if (!pendingDelete) return;

        try {
            await Promise.all(
                pendingDelete.documentIds.map((id) =>
                    axiosInstance.delete(`/documents/${id}`)
                )
            );

            // Remove deleted documents from uploadQueue localStorage
            removeDocumentsByIds(pendingDelete.documentIds);
            const storedQueue =
                JSON.parse(localStorage.getItem("uploadQueue")) || [];

            const updatedQueue = storedQueue.filter(
                (item) =>
                    !pendingDelete.documentIds.includes(item.document?.id)
            );

            localStorage.setItem(
                "uploadQueue",
                JSON.stringify(updatedQueue)
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
            toast.error(
                error?.response?.data?.message || "Delete failed"
            );
        }
    };
    const filteredDocuments = useMemo(() => {
        return documents.filter((doc) => {
            const matchesSearch = doc.original_filename?.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter ? doc.status === statusFilter : true;
            const matchesType = typeFilter ? doc.document_type === typeFilter : true;
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
        setCurrentPage((p) => Math.min(p, totalPages));
    }, [totalPages]);

    const availableTypes = useMemo(() => {
        return Array.from(
            new Set(documents.map((d) => d.document_type).filter(Boolean))
        ).sort();
    }, [documents]);

    const handleBulkDelete = () => {
        if (selectedDocuments.length === 0) { toast.error("Select documents first"); return; }
        setPendingDelete({ documentIds: selectedDocuments });
    };

    const toggleSelect = (id) => {
        setSelectedDocuments((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    /* ── shared select classes ────────────────────────────────── */
    const selectCls = "text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none pr-8";

    /* ── render ──────────────────────────────────────────────── */
    return (
        <div className="flex flex-col gap-5">

            {/* Search bar */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3">
                <div className="relative">
                    <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search documents..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
                {/* Left */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className={selectCls}
                        >
                            <option value="">All Status</option>
                            <option value="uploaded">Uploaded</option>
                            <option value="processing">Processing</option>
                            <option value="completed">Completed</option>
                            <option value="approved">Approved</option>
                            <option value="failed">Failed</option>
                        </select>
                        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                        </span>
                    </div>

                    <div className="relative">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className={selectCls}
                        >
                            <option value="">All Types</option>
                            {availableTypes.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                        </span>
                    </div>

                    <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-semibold transition-colors"
                    >
                        <Trash2 size={15} />
                        Bulk Delete
                    </button>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchDocuments}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors"
                    >
                        <RefreshCw size={15} />
                        Refresh
                    </button>

                    {/* View toggles */}
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setViewMode("table")}
                            className={`w-9 h-9 flex items-center justify-center transition-colors
                ${viewMode === "table"
                                    ? "bg-blue-600 text-white"
                                    : "bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`}
                        >
                            <List size={17} />
                        </button>
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`w-9 h-9 flex items-center justify-center transition-colors border-l border-gray-200
                ${viewMode === "grid"
                                    ? "bg-blue-600 text-white"
                                    : "bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`}
                        >
                            <LayoutGrid size={17} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Pagination info */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-500">
                    Showing{" "}
                    <span className="font-semibold text-gray-700">
                        {filteredDocuments.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                        {" "}–{" "}
                        {Math.min(currentPage * pageSize, filteredDocuments.length)}
                    </span>
                    {" "}of{" "}
                    <span className="font-semibold text-gray-700">{filteredDocuments.length}</span>
                    {" "}documents
                </p>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>
                    <span className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* ── TABLE VIEW ─────────────────────────────────────────── */}
            {viewMode === "table" ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[780px] border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    {["Select", "Document", "Type", "Status", "Confidence", "Created", ""].map((h) => (
                                        <th
                                            key={h}
                                            className={`px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap ${h === "" ? "text-right" : "text-left"}`}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-16 text-gray-400 text-sm">
                                            Loading documents…
                                        </td>
                                    </tr>
                                ) : filteredDocuments.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-16 text-gray-400 text-sm">
                                            No documents found
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedDocuments.map((doc) => (
                                        <tr
                                            key={doc.id}
                                            className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                                        >
                                            {/* Select */}
                                            <td className="px-5 py-4">
                                                <button
                                                    onClick={() => toggleSelect(doc.id)}
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors
                            ${selectedDocuments.includes(doc.id)
                                                            ? "bg-blue-600 text-white border-blue-600"
                                                            : "bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600"}`}
                                                >
                                                    <CheckSquare size={15} />
                                                </button>
                                            </td>

                                            {/* Document */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                                                        <FileText size={17} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 truncate max-w-[220px]">
                                                            {doc.original_filename}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-0.5">{doc.file_type}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Type */}
                                            <td className="px-5 py-4 text-sm text-gray-600">{doc.document_type || "N/A"}</td>

                                            {/* Status */}
                                            <td className="px-5 py-4">
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusBadge(doc.status)}`}>
                                                    {doc.status}
                                                </span>
                                            </td>

                                            {/* Confidence */}
                                            <td className={`px-5 py-4 text-sm ${confColor(doc.confidence_score)}`}>
                                                {doc.confidence_score
                                                    ? `${Math.round(doc.confidence_score * 100)}%`
                                                    : "N/A"}
                                            </td>

                                            {/* Created */}
                                            <td className="px-5 py-4 text-sm text-gray-500">
                                                {new Date(doc.created_at).toLocaleDateString()}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => navigate(`/review/${doc.id}`)}
                                                        className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 flex items-center justify-center transition-colors"
                                                        title="Review"
                                                    >
                                                        <FileText size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(doc.id)}
                                                        className="w-8 h-8 rounded-lg bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 flex items-center justify-center transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            ) : (

                /* ── GRID VIEW ────────────────────────────────────────── */
                <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4">
                    {loading ? (
                        <div className="col-span-full text-center py-16 text-gray-400 text-sm bg-white rounded-2xl border border-gray-200">
                            Loading documents…
                        </div>
                    ) : filteredDocuments.length === 0 ? (
                        <div className="col-span-full text-center py-16 text-gray-400 text-sm bg-white rounded-2xl border border-gray-200">
                            No documents found
                        </div>
                    ) : (
                        paginatedDocuments.map((doc) => (
                            <div
                                key={doc.id}
                                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5 flex flex-col"
                            >
                                {/* Card top row */}
                                <div className="flex items-start justify-between">
                                    <button
                                        onClick={() => toggleSelect(doc.id)}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors
                      ${selectedDocuments.includes(doc.id)
                                                ? "bg-blue-600 text-white border-blue-600"
                                                : "bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600"}`}
                                    >
                                        <CheckSquare size={15} />
                                    </button>
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusBadge(doc.status)}`}>
                                        {doc.status}
                                    </span>
                                </div>

                                {/* Icon */}
                                <div className="flex justify-center my-5">
                                    <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <FileText size={32} />
                                    </div>
                                </div>

                                {/* Name & type */}
                                <p className="text-sm font-bold text-gray-900 break-words leading-snug mb-0.5">
                                    {doc.original_filename}
                                </p>
                                <p className="text-xs text-gray-400">{doc.file_type}</p>

                                {/* Badges */}
                                <div className="flex flex-wrap gap-2 mt-3">
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                        {doc.document_type || "Unknown"}
                                    </span>
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                                        {doc.confidence_score
                                            ? `${Math.round(doc.confidence_score * 100)}%`
                                            : "N/A"}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => navigate(`/review/${doc.id}`)}
                                        className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                                    >
                                        Review
                                    </button>
                                    <button
                                        onClick={() => handleDelete(doc.id)}
                                        className="w-9 h-9 rounded-lg bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 flex items-center justify-center transition-colors flex-shrink-0"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ── DELETE MODAL ──────────────────────────────────────── */}
            {pendingDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Confirm Deletion</h2>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            {pendingDelete.documentIds.length > 1
                                ? `Delete ${pendingDelete.documentIds.length} selected documents? This action cannot be undone.`
                                : "Delete this document? This action cannot be undone."}
                        </p>
                        <div className="flex items-center justify-end gap-3 mt-6">
                            <button
                                onClick={() => setPendingDelete(null)}
                                className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-sm transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default DocumentLibrary;