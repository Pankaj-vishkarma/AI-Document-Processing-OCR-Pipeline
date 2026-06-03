import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axios";
import {
    Download, FileText, Filter, Loader2,
    Play, Plus, RefreshCw, UploadCloud,
} from "lucide-react";

const exportOptions = ["csv", "excel", "json", "zip"];

/* ── helpers ─────────────────────────────────────────────────── */
const statusBadge = (status) => {
    switch (status) {
        case "completed":
        case "approved": return "bg-emerald-50 text-emerald-700 border border-emerald-200";
        case "processing": return "bg-blue-50 text-blue-700 border border-blue-200 animate-pulse";
        case "failed": return "bg-red-50 text-red-700 border border-red-200";
        default: return "bg-amber-50 text-amber-700 border border-amber-200";
    }
};

/* shared input / select */
const inputCls = "w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors";
const selectCls = "w-full text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none cursor-pointer";

const BatchDashboard = () => {
    const [documents, setDocuments] = useState([]);
    const [batches, setBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState("");
    const [batchDetails, setBatchDetails] = useState(null);
    const [selectedDocs, setSelectedDocs] = useState([]);
    const [batchName, setBatchName] = useState("");
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState("");
    const [exportType, setExportType] = useState("csv");
    const [filterNeedsReview, setFilterNeedsReview] = useState(false);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [uploadQueue, setUploadQueue] = useState([]);
    const [uploading, setUploading] = useState(false);

    /* ── dropzone (logic unchanged) ──────────────────────────── */
    const onDrop = useCallback((acceptedFiles) => {
        const nextFiles = acceptedFiles.slice(0, 50).map((file) => ({
            file, status: "queued", progress: 0, document: null,
        }));
        setUploadQueue((prev) => [...prev, ...nextFiles].slice(0, 50));
    }, []);

    const addFilesToQueue = (files) => {
        const nextFiles = Array.from(files).slice(0, 50).map((file) => ({
            file, status: "queued", progress: 0, document: null,
        }));
        setUploadQueue((prev) => [...prev, ...nextFiles].slice(0, 50));
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, multiple: true, maxFiles: 50,
    });

    /* ── API calls (logic unchanged) ─────────────────────────── */
    const fetchDocuments = async () => {
        try {
            const response = await axiosInstance.get("/documents", { params: { page: 1, limit: 1000 } });
            setDocuments(response.data.documents || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to fetch documents");
        }
    };

    const fetchTemplates = async () => {
        try {
            const response = await axiosInstance.get("/templates");
            setTemplates(response.data.templates || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to fetch templates");
        }
    };

    const fetchBatches = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get("/batches");
            const nextBatches = response.data.batches || [];
            setBatches(nextBatches);
            if (nextBatches.length > 0 && !selectedBatchId) setSelectedBatchId(nextBatches[0].id);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to fetch batches");
        } finally {
            setLoading(false);
        }
    };

    const fetchBatchDetails = async (batchId) => {
        if (!batchId) { setBatchDetails(null); return; }
        try {
            const response = await axiosInstance.get(`/batches/${batchId}`);
            setBatchDetails(response.data);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to fetch batch details");
        }
    };

    useEffect(() => { fetchDocuments(); fetchTemplates(); fetchBatches(); }, []);
    useEffect(() => { if (selectedBatchId) fetchBatchDetails(selectedBatchId); }, [selectedBatchId]);

    useEffect(() => {
        const activeStatus =
            batchDetails?.batch?.status === "processing" ||
            batchDetails?.batch?.status === "queued";
        if (!selectedBatchId || !activeStatus) return undefined;
        const interval = window.setInterval(() => {
            fetchBatches();
            fetchBatchDetails(selectedBatchId);
        }, 2500);
        return () => window.clearInterval(interval);
    }, [selectedBatchId, batchDetails?.batch?.status]);

    const handleSelect = (id) => {
        setSelectedDocs((prev) =>
            prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
        );
    };

    const uploadQueuedFiles = async () => {
        if (uploadQueue.length === 0) return [];
        if (uploadQueue.length > 50) { toast.error("Maximum 50 documents per batch"); return []; }
        try {
            setUploading(true);
            const uploadedIds = [];
            for (let i = 0; i < uploadQueue.length; i++) {
                const item = uploadQueue[i];
                if (item.document?.id) { uploadedIds.push(item.document.id); continue; }
                setUploadQueue((prev) => prev.map((q, qi) => qi === i ? { ...q, status: "uploading", progress: 20 } : q));
                const formData = new FormData();
                formData.append("file", item.file);
                const response = await axiosInstance.post("/upload", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                    onUploadProgress: (e) => {
                        const progress = Math.round((e.loaded * 100) / (e.total || 1));
                        setUploadQueue((prev) => prev.map((q, qi) => qi === i ? { ...q, progress } : q));
                    },
                });
                uploadedIds.push(response.data.document.id);
                setUploadQueue((prev) => prev.map((q, qi) =>
                    qi === i ? { ...q, status: "uploaded", progress: 100, document: response.data.document } : q
                ));
            }
            await fetchDocuments();
            return uploadedIds;
        } finally {
            setUploading(false);
        }
    };

    const handleCreateBatch = async () => {
        if (!batchName.trim()) { toast.error("Batch name required"); return; }
        try {
            setCreating(true);
            const uploadedIds = await uploadQueuedFiles();
            const documentIds = [...new Set([...selectedDocs, ...uploadedIds])];
            if (documentIds.length === 0) { toast.error("Select or upload at least one document"); return; }
            if (documentIds.length > 50) { toast.error("Maximum 50 documents per batch"); return; }
            const response = await axiosInstance.post("/batches", {
                batch_name: batchName,
                document_ids: documentIds,
                template_name: selectedTemplate || undefined,
            });
            toast.success("Batch created successfully");
            setBatchName(""); setSelectedDocs([]); setUploadQueue([]);
            setSelectedBatchId(response.data.batch.id);
            await fetchBatches();
            await fetchBatchDetails(response.data.batch.id);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Batch creation failed");
        } finally {
            setCreating(false);
        }
    };

    const handleProcessBatch = async () => {
        if (!selectedBatchId) { toast.error("Select a batch first"); return; }
        try {
            setProcessing(true);
            await axiosInstance.post(`/batches/${selectedBatchId}/process`);
            toast.success("Batch processing queued");
            await fetchBatches();
            await fetchBatchDetails(selectedBatchId);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Batch processing failed");
        } finally {
            setProcessing(false);
        }
    };

    const handleApplyTemplate = async () => {
        if (!selectedBatchId) { toast.error("Select a batch first"); return; }
        if (!selectedTemplate) { toast.error("Select a template"); return; }
        try {
            await axiosInstance.post(`/batches/${selectedBatchId}/template`, { template_name: selectedTemplate });
            toast.success("Template applied to batch");
            fetchBatchDetails(selectedBatchId);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Template apply failed");
        }
    };

    const handleExportBatch = async () => {
        if (!selectedBatchId) { toast.error("Select a batch first"); return; }
        try {
            const response = await axiosInstance.get(`/export/batch/${selectedBatchId}`, {
                params: { type: exportType }, responseType: "blob",
            });
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `batch-${selectedBatchId}.${exportType === "excel" ? "xlsx" : exportType}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("Batch export downloaded");
        } catch (error) {
            toast.error(error?.response?.data?.message || "Batch export failed");
        }
    };

    /* ── derived data (logic unchanged) ──────────────────────── */
    const summary = batchDetails?.summary || {
        total_documents: 0, processed_documents: 0, successful_documents: 0,
        needs_review_documents: 0, failed_documents: 0, completion_percentage: 0,
    };
    const detailDocuments = batchDetails?.documents || [];
    const visibleDocuments = useMemo(
        () => filterNeedsReview ? batchDetails?.needs_review || [] : detailDocuments,
        [filterNeedsReview, batchDetails, detailDocuments]
    );
    const comparisonRows = batchDetails?.comparison_rows || [];
    const comparisonFields = batchDetails?.comparison_fields || [];

    /* ── render ──────────────────────────────────────────────── */
    return (
        <div className="flex flex-col gap-8">

            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Batch Processing</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Bulk upload, process, review, compare, and export document batches.
                    </p>
                </div>
                <button
                    onClick={() => {
                        fetchDocuments(); fetchBatches();
                        if (selectedBatchId) fetchBatchDetails(selectedBatchId);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors self-start sm:self-auto"
                >
                    <RefreshCw size={15} />
                    Refresh
                </button>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">

                {/* ── LEFT: Create Batch ───────────────────────────── */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-5">
                    <h2 className="text-base font-bold text-gray-900">Create Batch</h2>

                    {/* Drop zone */}
                    <div
                        {...getRootProps()}
                        className={`rounded-xl border-2 border-dashed p-8 cursor-pointer text-center transition-colors
              ${isDragActive
                                ? "border-blue-400 bg-blue-50"
                                : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white"}`}
                    >
                        <input {...getInputProps()} />
                        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                            <UploadCloud size={22} />
                        </div>
                        <p className="text-sm font-semibold text-gray-800">Drag documents here or select files</p>
                        <p className="text-xs text-gray-400 mt-1">Up to 50 documents per batch</p>
                    </div>

                    {/* Select folder */}
                    <label className="flex items-center justify-center gap-2 w-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-lg cursor-pointer transition-colors">
                        Select Folder
                        <input
                            type="file"
                            multiple
                            webkitdirectory=""
                            directory=""
                            className="hidden"
                            onChange={(e) => { addFilesToQueue(e.target.files || []); e.target.value = ""; }}
                        />
                    </label>

                    {/* Upload queue */}
                    {uploadQueue.length > 0 && (
                        <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
                            {uploadQueue.map((item, index) => (
                                <div key={`${item.file.name}-${index}`} className="border border-gray-100 rounded-xl p-3">
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <span className="text-xs font-medium text-gray-800 truncate flex-1">{item.file.name}</span>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${statusBadge(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600 rounded-full transition-all duration-300"
                                            style={{ width: `${item.progress}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Batch name */}
                    <input
                        type="text"
                        value={batchName}
                        onChange={(e) => setBatchName(e.target.value)}
                        placeholder="Batch name"
                        className={inputCls}
                    />

                    {/* Template select */}
                    <div className="relative">
                        <select
                            value={selectedTemplate}
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                            className={selectCls}
                        >
                            <option value="">No template</option>
                            {templates.map((t) => (
                                <option key={t.name} value={t.name}>{t.name.replace("_", " ")}</option>
                            ))}
                        </select>
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                        </span>
                    </div>

                    {/* Existing documents */}
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                            Or select existing documents
                        </p>
                        <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
                            {documents.map((doc) => (
                                <label
                                    key={doc.id}
                                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <div className="min-w-0 flex-1 mr-3">
                                        <span className="block text-sm font-semibold text-gray-900 truncate">
                                            {doc.original_filename}
                                        </span>
                                        <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge(doc.status)}`}>
                                            {doc.status}
                                        </span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={selectedDocs.includes(doc.id)}
                                        onChange={() => handleSelect(doc.id)}
                                        className="w-4 h-4 accent-blue-600 flex-shrink-0"
                                    />
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Create button */}
                    <button
                        onClick={handleCreateBatch}
                        disabled={creating || uploading}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-sm transition-colors"
                    >
                        {creating || uploading
                            ? <><Loader2 size={15} className="animate-spin" /> {uploading ? "Uploading…" : "Creating…"}</>
                            : <><Plus size={15} /> Create Batch</>}
                    </button>
                </div>

                {/* ── RIGHT: Batch Results ─────────────────────────── */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-5">
                    <h2 className="text-base font-bold text-gray-900">Batch Results Dashboard</h2>

                    {/* Batch selector */}
                    <div className="relative">
                        <select
                            value={selectedBatchId}
                            onChange={(e) => setSelectedBatchId(e.target.value)}
                            className={selectCls}
                        >
                            <option value="">Select batch</option>
                            {batches.map((batch) => (
                                <option key={batch.id} value={batch.id}>{batch.batch_name}</option>
                            ))}
                        </select>
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                        </span>
                    </div>

                    {loading && !batchDetails ? (
                        <p className="text-sm text-gray-400">Loading batches…</p>
                    ) : !batchDetails ? (
                        <p className="text-sm text-gray-400">No batch selected</p>
                    ) : (
                        <div className="flex flex-col gap-5">

                            {/* Summary stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                {[
                                    ["Total", summary.total_documents, "text-gray-900"],
                                    ["Processed", summary.processed_documents, "text-blue-600"],
                                    ["Successful", summary.successful_documents, "text-emerald-600"],
                                    ["Needs Review", summary.needs_review_documents, "text-amber-600"],
                                    ["Failed", summary.failed_documents, "text-red-600"],
                                ].map(([label, value, color]) => (
                                    <div key={label} className="bg-gray-50 rounded-xl border border-gray-100 px-3 py-3">
                                        <p className="text-xs text-gray-500 mb-1">{label}</p>
                                        <p className={`text-2xl font-extrabold tracking-tight ${color}`}>{value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Progress bar */}
                            <div>
                                <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1.5">
                                    <span>Progress</span>
                                    <span>{summary.completion_percentage}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                        style={{ width: `${summary.completion_percentage}%` }}
                                    />
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={handleProcessBatch}
                                    disabled={processing}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-sm transition-colors"
                                >
                                    {processing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                                    Process Batch
                                </button>

                                <button
                                    onClick={() => setFilterNeedsReview((prev) => !prev)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-colors
                    ${filterNeedsReview
                                            ? "bg-amber-50 border-amber-200 text-amber-700"
                                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                                >
                                    <Filter size={14} />
                                    {filterNeedsReview ? "Show All" : "Needs Review"}
                                </button>

                                {/* Export select + button grouped */}
                                <div className="flex items-center gap-1.5">
                                    <div className="relative">
                                        <select
                                            value={exportType}
                                            onChange={(e) => setExportType(e.target.value)}
                                            className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors appearance-none cursor-pointer"
                                        >
                                            {exportOptions.map((opt) => (
                                                <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                                            ))}
                                        </select>
                                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleExportBatch}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors"
                                    >
                                        <Download size={14} />
                                        Export
                                    </button>
                                </div>

                                <button
                                    onClick={handleApplyTemplate}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors"
                                >
                                    Apply Template
                                </button>
                            </div>

                            {/* Document list */}
                            <div className="rounded-xl border border-gray-100 overflow-hidden">
                                <div className="max-h-72 overflow-y-auto">
                                    {visibleDocuments.length === 0 ? (
                                        <p className="p-4 text-sm text-gray-400">No documents for this filter</p>
                                    ) : (
                                        visibleDocuments.map((doc) => (
                                            <div
                                                key={doc.id}
                                                className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                                                        <FileText size={15} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                                            {doc.original_filename}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            Confidence: {doc.confidence_score ?? "N/A"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize flex-shrink-0 ${statusBadge(doc.status)}`}>
                                                    {doc.status}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>

            {/* ── Batch Comparison table ────────────────────────────── */}
            {batchDetails && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100">
                        <h2 className="text-base font-bold text-gray-900">Batch Comparison</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    {["filename", "status", "document_type", "confidence_score", ...comparisonFields].map((field) => (
                                        <th
                                            key={field}
                                            className="text-left px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                                        >
                                            {field}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonRows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4 + comparisonFields.length}
                                            className="text-center py-12 text-sm text-gray-400"
                                        >
                                            No comparison data available
                                        </td>
                                    </tr>
                                ) : (
                                    comparisonRows.map((row) => (
                                        <tr key={row.document_id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                            {["filename", "status", "document_type", "confidence_score", ...comparisonFields].map((field) => (
                                                <td key={field} className="px-5 py-3.5 text-sm text-gray-700 align-top">
                                                    {field === "status" ? (
                                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusBadge(row[field])}`}>
                                                            {row[field] ?? "N/A"}
                                                        </span>
                                                    ) : (
                                                        row[field] ?? "N/A"
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </div>
    );
};

export default BatchDashboard;