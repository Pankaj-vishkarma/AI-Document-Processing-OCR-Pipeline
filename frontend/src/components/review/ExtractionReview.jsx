import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axios";
import { toPublicAssetUrl } from "../../utils/assetUrl";
import EditableObjectArrayTable from "./EditableObjectArrayTable";
import {
    CheckCircle2,
    RotateCcw,
    XCircle,
    Loader2,
    Download,
    Trash2,
    ShieldCheck,
    Image as ImageIcon,
    FileText,
} from "lucide-react";

/* ─── status badge helper (matches design system) ─── */
const statusBadge = (status) => {
    const s = status?.toLowerCase();
    if (s === "completed" || s === "approved")
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    if (s === "failed" || s === "rejected")
        return "bg-red-50 text-red-700 border border-red-200";
    if (s === "processing")
        return "bg-amber-50 text-amber-700 border border-amber-200";
    return "bg-blue-50 text-blue-700 border border-blue-200";
};

const ExtractionReview = () => {
    const { documentId } = useParams();
    const navigate = useNavigate();

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
    const assetBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");
    const uploadBaseUrl = import.meta.env.VITE_UPLOAD_BASE_URL || assetBaseUrl;

    const [document, setDocument] = useState(null);
    const [reviewDocuments, setReviewDocuments] = useState([]);
    const isFailed = document?.status === "failed";
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [formData, setFormData] = useState({});
    const [selectedOCR, setSelectedOCR] = useState(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const imageRef = useRef(null);
    const [imageSize, setImageSize] = useState({
        naturalWidth: 1,
        naturalHeight: 1,
        renderedWidth: 1,
        renderedHeight: 1,
    });

    const isLowConfidence =
        document?.confidence_score !== undefined &&
        document?.confidence_score !== null &&
        document.confidence_score < 0.7;

    const updateImageSize = () => {
        if (!imageRef.current) return;
        setImageSize({
            naturalWidth: imageRef.current.naturalWidth || 1,
            naturalHeight: imageRef.current.naturalHeight || 1,
            renderedWidth: imageRef.current.clientWidth || 1,
            renderedHeight: imageRef.current.clientHeight || 1,
        });
    };

    const fetchDocument = async () => {
        if (!documentId) return;
        const requestedDocumentId = documentId;
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/documents/${documentId}`);
            if (requestedDocumentId === documentId) {
                setDocument(response.data.document);
                setFormData(response.data.document.extracted_data || {});
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to load document");
        } finally {
            setLoading(false);
        }
    };

    const fetchReviewDocuments = async () => {
        try {
            setLoading(true);
            const queueResponse = await axiosInstance.get("/review/queue");
            let documents = queueResponse.data?.documents || [];
            if (documents.length === 0) {
                const documentsResponse = await axiosInstance.get("/documents", {
                    params: { page: 1, limit: 1000 },
                });
                documents = documentsResponse.data?.documents || [];
            }
            setReviewDocuments(documents);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to load documents");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (documentId) {
            setDocument(null);
            setFormData({});
            fetchDocument();
        } else {
            setDocument(null);
            setFormData({});
            fetchReviewDocuments();
        }
    }, [documentId]);

    useEffect(() => {
        setImageLoaded(false);
        setSelectedOCR(null);
    }, [documentId]);

    useEffect(() => {
        window.addEventListener("resize", updateImageSize);
        return () => window.removeEventListener("resize", updateImageSize);
    }, []);

    const handleExtract = async () => {
        if (!documentId) { toast.error("Select a document first"); return; }
        try {
            setProcessing(true);
            await axiosInstance.post("/extract", { document_id: documentId });
            toast.success("Extraction completed");
            fetchDocument();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Extraction failed");
        } finally {
            setProcessing(false);
        }
    };

    const handleApprove = async () => {
        if (!documentId) { toast.error("Select a document first"); return; }
        try {
            await axiosInstance.post(`/review/${documentId}/approve`, {
                reviewed_by: "User",
                notes: "Approved from frontend",
            });
            toast.success("Document approved");
            fetchDocument();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Approve failed");
        }
    };

    const handleReject = async () => {
        if (!documentId) { toast.error("Select a document first"); return; }
        try {
            await axiosInstance.post(`/review/${documentId}/reject`, {
                reviewed_by: "User",
                notes: "Rejected from frontend",
            });
            toast.success("Document rejected");
            fetchDocument();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Reject failed");
        }
    };

    const handleSaveFields = async () => {
        if (!documentId) { toast.error("Select a document first"); return; }
        try {
            await axiosInstance.put(`/documents/${documentId}/fields`, {
                extracted_data: formData,
            });
            toast.success("Fields updated successfully");
            fetchDocument();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to update fields");
        }
    };

    const handleExport = async () => {
        try {
            const response = await axiosInstance.post(
                "/export",
                { type: "json", document_ids: [documentId] },
                { responseType: "blob" }
            );
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = window.document.createElement("a");
            link.href = url;
            link.download = "document-export.json";
            window.document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Export completed");
        } catch (error) {
            toast.error(error?.response?.data?.message || "Export failed");
        }
    };

    const handleDelete = async () => {
        if (!documentId) { toast.error("Select a document first"); return; }
        try {
            await axiosInstance.delete(`/documents/${documentId}`);
            toast.success("Document deleted");
            navigate("/library");
        } catch (error) {
            toast.error(error?.response?.data?.message || "Delete failed");
        }
    };

    const handleRetry = async () => {
        if (!documentId) { toast.error("Select a document first"); return; }
        try {
            await axiosInstance.post(`/review/${documentId}/retry`);
            toast.success("Retry processing started");
            fetchDocument();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Retry failed");
        }
    };

    const handleChange = (key, value) => {
        setFormData({ ...formData, [key]: value });
    };

    /* ─── Loading state ─── */
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 size={28} className="animate-spin text-blue-600" />
                    <p className="text-sm text-gray-500">Loading document…</p>
                </div>
            </div>
        );
    }

    /* ─── Queue / no document selected ─── */
    if (!documentId) {
        return (
            <div className="min-h-screen bg-gray-50 font-sans">

                {/* Top Bar */}
                <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-screen-xl mx-auto flex items-center justify-between h-16 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                    </svg>
                                </div>
                                <span className="font-bold text-gray-900 text-sm tracking-tight">DocuSense OCR</span>
                            </div>
                            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-semibold text-emerald-700">Live · AI Engine Running</span>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Document Review</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Select a document to review OCR extraction and AI processed fields.</p>
                    </div>

                    <section>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Review Queue</p>
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[640px]">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-widest">Document</th>
                                            <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                            <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-widest">Review</th>
                                            <th className="text-right px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-widest">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reviewDocuments.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="py-16 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <FileText size={24} className="text-gray-300" />
                                                        <p className="text-sm text-gray-400">No documents available for review</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            reviewDocuments.map((item) => (
                                                <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                                    <td className="px-5 py-4">
                                                        <p className="text-sm font-semibold text-gray-900 break-all">{item.original_filename}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5 capitalize">{item.document_type || "Unknown"}</p>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusBadge(item.status)}`}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusBadge(item.review_status)}`}>
                                                            {item.review_status || "pending_review"}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <button
                                                            onClick={() => navigate(`/review/${item.id}`)}
                                                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm whitespace-nowrap"
                                                        >
                                                            Open Review
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        );
    }

    /* ─── Document review detail view ─── */
    return (
        <div className="min-h-screen bg-gray-50 font-sans">

            {/* Top Bar */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
                <div className="max-w-screen-xl mx-auto flex items-center justify-between h-16 gap-3">
                    {/* Left */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                            </div>
                            <span className="font-bold text-gray-900 text-sm tracking-tight">DocuSense OCR</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 flex-shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-semibold text-emerald-700">Live · AI Engine Running</span>
                        </div>
                    </div>

                    {/* Right: action buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Extract */}
                        <button
                            onClick={handleExtract}
                            disabled={processing}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors text-gray-700 text-sm font-semibold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            {processing ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                            <span className="hidden sm:inline">Extract OCR</span>
                        </button>
                        {/* Approve */}
                        <button
                            onClick={handleApprove}
                            disabled={isFailed}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 transition-colors text-white text-sm font-semibold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            <CheckCircle2 size={13} />
                            <span className="hidden sm:inline">Approve</span>
                        </button>
                        {/* Reject */}
                        <button
                            onClick={handleReject}
                            disabled={isFailed}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors text-white text-sm font-semibold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            <XCircle size={13} />
                            <span className="hidden sm:inline">Reject</span>
                        </button>
                        {/* Export */}
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm font-semibold shadow-sm whitespace-nowrap"
                        >
                            <Download size={13} />
                            <span className="hidden sm:inline">Export</span>
                        </button>
                        {/* Delete */}
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors text-red-600 text-sm font-semibold shadow-sm whitespace-nowrap"
                        >
                            <Trash2 size={13} />
                            <span className="hidden sm:inline">Delete</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">

                {/* Page Title */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Document Review</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Review OCR extraction and AI processed fields.</p>
                </div>

                {/* Failed banner */}
                {isFailed && (
                    <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-800">This document failed processing</p>
                                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                                    Approve, reject, and field edits are disabled until the document is retried and processed successfully.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main 2-col grid */}
                <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">

                    {/* ── Left: Document Preview ── */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-sm font-bold text-gray-900">Document Preview</h2>
                                <p className="text-xs text-gray-500 mt-0.5">OCR bounding boxes and extraction regions</p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <ImageIcon size={13} className="text-gray-400" />
                                <span className="text-xs font-semibold text-gray-500">
                                    {document?.ocr_coordinates?.length || 0} regions
                                </span>
                            </div>
                        </div>

                        <div className="p-4 flex flex-col gap-4">
                            {document ? (
                                <>
                                    {/* Image viewer */}
                                    <div className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden min-h-64 sm:min-h-80 xl:min-h-[480px] flex items-center justify-center p-3">
                                        <div className="relative inline-block max-w-full">
                                            <img
                                                ref={imageRef}
                                                src={(() => {
                                                    const isPdf = document?.file_type?.toLowerCase() === "pdf";
                                                    if (!isPdf && document?.upload_path) {
                                                        return toPublicAssetUrl(document.upload_path, "uploads", uploadBaseUrl);
                                                    }
                                                    if (document?.processed_path) {
                                                        return toPublicAssetUrl(document.processed_path, "processed", assetBaseUrl);
                                                    }
                                                    return toPublicAssetUrl(document.upload_path || document.filename, "uploads", uploadBaseUrl);
                                                })()}
                                                alt="Document"
                                                onLoad={() => { setImageLoaded(true); updateImageSize(); }}
                                                className="block max-w-full max-h-[520px] object-contain rounded-lg"
                                            />

                                            {imageLoaded && document?.ocr_coordinates?.map((item, index) => {
                                                const rect = item.rect_bbox;
                                                if (!rect) return null;
                                                const scaleX = imageSize.renderedWidth / imageSize.naturalWidth;
                                                const scaleY = imageSize.renderedHeight / imageSize.naturalHeight;
                                                return (
                                                    <div
                                                        key={index}
                                                        onClick={() => setSelectedOCR(index)}
                                                        title={item.text}
                                                        className={`absolute border-2 cursor-pointer transition-all duration-200 ${selectedOCR === index
                                                                ? "border-emerald-500 bg-emerald-500/20"
                                                                : item.confidence >= 0.8
                                                                    ? "border-emerald-400 bg-emerald-400/10"
                                                                    : item.confidence >= 0.5
                                                                        ? "border-amber-400 bg-amber-400/10"
                                                                        : "border-red-400 bg-red-400/10"
                                                            }`}
                                                        style={{
                                                            left: `${rect.x * scaleX}px`,
                                                            top: `${rect.y * scaleY}px`,
                                                            width: `${rect.width * scaleX}px`,
                                                            height: `${rect.height * scaleY}px`,
                                                        }}
                                                    >
                                                        <div className="absolute -top-6 left-0 bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap shadow-sm">
                                                            {item.text}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Meta grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {/* Filename */}
                                        <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
                                            <p className="text-xs text-gray-500 mb-1">Filename</p>
                                            <p className="text-sm font-semibold text-gray-900 break-all leading-snug">{document.original_filename}</p>
                                        </div>

                                        {/* Status */}
                                        <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
                                            <p className="text-xs text-gray-500 mb-1.5">Status</p>
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusBadge(document.status)}`}>
                                                {document.status}
                                            </span>
                                        </div>

                                        {/* Type */}
                                        <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
                                            <p className="text-xs text-gray-500 mb-1">Type</p>
                                            <p className="text-sm font-semibold text-gray-900 capitalize">{document.document_type || "Unknown"}</p>
                                        </div>

                                        {/* Confidence */}
                                        <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3 col-span-2 md:col-span-1">
                                            <p className="text-xs text-gray-500 mb-1.5">Confidence</p>
                                            {document.confidence_score ? (
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${document.confidence_score >= 0.8
                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                        : document.confidence_score >= 0.5
                                                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                            : "bg-red-50 text-red-700 border border-red-200"
                                                    }`}>
                                                    <ShieldCheck size={12} />
                                                    {Math.round(document.confidence_score * 100)}%
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">N/A</span>
                                            )}
                                            {isLowConfidence && (
                                                <p className="text-xs text-amber-700 mt-2 leading-relaxed">
                                                    Confirm document type before approving.
                                                </p>
                                            )}
                                        </div>

                                        {/* Review Status */}
                                        <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
                                            <p className="text-xs text-gray-500 mb-1.5">Review Status</p>
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusBadge(document.review_status)}`}>
                                                {document.review_status || "pending"}
                                            </span>
                                        </div>

                                        {/* Created */}
                                        <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
                                            <p className="text-xs text-gray-500 mb-1">Created At</p>
                                            <p className="text-xs font-semibold text-gray-900">{new Date(document.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="min-h-64 flex flex-col items-center justify-center gap-2 text-gray-400">
                                    <ImageIcon size={28} className="text-gray-300" />
                                    <p className="text-sm">No document selected</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Right: Extracted Fields ── */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-shrink-0">
                            <div>
                                <h2 className="text-sm font-bold text-gray-900">Extracted Fields</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Editable OCR extracted values</p>
                            </div>
                            <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full flex-shrink-0">
                                {Object.keys(formData).length} fields
                            </span>
                        </div>

                        {/* Scrollable field list */}
                        <div className="p-4 flex flex-col gap-3 overflow-y-auto xl:max-h-[560px] flex-1">
                            {Object.keys(formData).length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
                                    <FileText size={24} className="text-gray-300" />
                                    <p className="text-sm">No extracted fields found</p>
                                </div>
                            ) : (
                                Object.entries(formData).map(([key, value], index) => {
                                    const isObjectArray =
                                        Array.isArray(value) &&
                                        value.length > 0 &&
                                        typeof value[0] === "object";

                                    return (
                                        <div
                                            key={key}
                                            onClick={() => setSelectedOCR(index)}
                                            className={`rounded-xl border p-4 transition-all duration-200 cursor-pointer ${selectedOCR === index
                                                    ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100"
                                                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-2.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-widest">{key}</label>
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase tracking-widest">OCR Field</span>
                                            </div>

                                            {isObjectArray ? (
                                                <EditableObjectArrayTable
                                                    rows={value}
                                                    onChange={(newRows) => handleChange(key, newRows)}
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={value || ""}
                                                    onChange={(e) => handleChange(key, e.target.value)}
                                                    disabled={isFailed}
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all disabled:cursor-not-allowed disabled:opacity-60"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Save / Retry buttons */}
                        <div className="p-4 border-t border-gray-100 flex flex-col gap-2.5 flex-shrink-0">
                            <button
                                onClick={handleSaveFields}
                                disabled={isFailed}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm font-semibold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Save Changes
                            </button>
                            <button
                                onClick={handleRetry}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors text-gray-700 text-sm font-semibold"
                            >
                                <RotateCcw size={14} />
                                Retry Processing
                            </button>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default ExtractionReview;