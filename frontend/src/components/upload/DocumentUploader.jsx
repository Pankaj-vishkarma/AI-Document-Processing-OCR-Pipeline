import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText, Loader2, CheckCircle2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useUploadQueue } from "../../context/UploadQueueContext";
import axiosInstance from "../../api/axios";

const DOCUMENT_TYPE_OPTIONS = [
    "Invoice",
    "Receipt",
    "Business Card",
    "Bank Statement",
    "Form",
    "ID Card",
    "Contract",
    "Report",
    "Handwritten Note",
    "Whiteboard",
    "Table/Spreadsheet",
];

const UPLOAD_STAGES = [
    "Uploading",
    "PDF Processing",
    "OCR Scan",
    "Classification",
    "Ready",
];

/* ── status badge helper ─────────────────────────────────────── */
const statusBadge = (status) => {
    switch (status) {
        case "processing":
            return "bg-blue-50 text-blue-700 border border-blue-200 animate-pulse";
        case "completed":
            return "bg-emerald-50 text-emerald-700 border border-emerald-200";
        case "uploading":
            return "bg-blue-50 text-blue-700 border border-blue-200";
        case "failed":
            return "bg-red-50 text-red-700 border border-red-200";
        default:
            return "bg-amber-50 text-amber-700 border border-amber-200";
    }
};

const confidenceBadge = (score) => {
    if (score >= 0.8) return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    if (score >= 0.5) return "bg-amber-50 text-amber-700 border border-amber-200";
    return "bg-red-50 text-red-700 border border-red-200";
};

const DocumentUploader = () => {
    const {
        queue: files,
        setQueue: setFiles,
        addQueueItems,
        updateQueueItem,
        removeQueueItem,
    } = useUploadQueue();
    const [processingIds, setProcessingIds] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [batchProcessing, setBatchProcessing] = useState(false);
    const [showLowConfidenceWarning, setShowLowConfidenceWarning] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});

    /* ── dropzone ───────────────────────────────────────────────── */
    const onDrop = useCallback(
        (acceptedFiles, fileRejections) => {
            const MAX_FILES = 50;

            fileRejections.forEach(({ file, errors }) => {
                errors.forEach((error) => {
                    if (error.code === "file-invalid-type")
                        toast.error(`${file.name}: Only PDF and image files are allowed`);
                    if (error.code === "file-too-large")
                        toast.error(`${file.name}: Maximum size is 20MB`);
                });
            });

            const remainingSlots = MAX_FILES - files.length;
            if (remainingSlots <= 0) {
                toast.error(`Maximum ${MAX_FILES} files are allowed`);
                return;
            }
            if (acceptedFiles.length > remainingSlots) {
                toast.error(`Only ${remainingSlots} more file(s) can be added`);
                acceptedFiles = acceptedFiles.slice(0, remainingSlots);
            }

            const formatted = acceptedFiles.map((file) => ({
                id: crypto.randomUUID(),
                file,
                status: "pending",
            }));

            setFiles((prev) => {
                const uniqueFiles = formatted.filter(
                    (item) =>
                        !prev.some(
                            (e) => e.file.name === item.file.name && e.file.size === item.file.size
                        )
                );
                if (uniqueFiles.length < formatted.length) toast.error("Duplicate file(s) skipped");
                return [...prev, ...uniqueFiles];
            });
        },
        [files]
    );

    const getProcessingStep = (status) => {
        switch (status) {
            case "uploaded": return "Queued";
            case "processing": return "OCR Processing";
            case "completed": return "Extraction Completed";
            case "failed": return "Failed";
            default: return "Queued";
        }
    };

    const MAX_FILE_SIZE = 20 * 1024 * 1024;

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "application/pdf": [".pdf"],
            "image/jpeg": [".jpg", ".jpeg"],
            "image/png": [".png"],
            "image/webp": [".webp"],
            "image/bmp": [".bmp"],
            "image/tiff": [".tif", ".tiff"],
        },
        maxSize: MAX_FILE_SIZE,
        multiple: true,
    });

    /* ── handlers (logic unchanged) ────────────────────────────── */
    const handleRemoveDocument = (index) => {
        const documentItem = files[index];
        if (!documentItem) return;
        if (documentItem.status === "uploading") return;
        const needsConfirmation =
            documentItem.status === "uploaded" || documentItem.status === "completed";
        if (
            needsConfirmation &&
            !window.confirm(
                "This document has already been uploaded or extracted. Remove it from the queue?"
            )
        )
            return;
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        try {
            if (files.length === 0) { toast.error("Please select at least one document"); return; }
            setUploading(true);
            setShowLowConfidenceWarning(false);
            const updatedFiles = [...files];
            const allowedTypes = [
                "application/pdf", "image/jpeg", "image/png", "image/webp", "image/bmp", "image/tiff",
            ];
            let successCount = 0, failedCount = 0;

            for (let index = 0; index < updatedFiles.length; index++) {
                const current = updatedFiles[index];
                if (current.status === "uploaded" || current.status === "completed") continue;

                if (!current.file) {
                    continue;
                }

                if (current.file.size === 0) {
                    toast.error(`${current.file.name} is empty and cannot be uploaded`);
                    updatedFiles[index].status = "failed";
                    setFiles([...updatedFiles]);
                    failedCount++;
                    continue;
                }
                if (!allowedTypes.includes(current.file.type)) {
                    toast.error(`${current.file.name} is not a supported file type`);
                    updatedFiles[index].status = "failed";
                    setFiles([...updatedFiles]);
                    failedCount++;
                    continue;
                }

                try {
                    const formData = new FormData();
                    formData.append("file", current.file);
                    updatedFiles[index].status = "uploading";
                    setFiles([...updatedFiles]);

                    setUploadProgress((prev) => ({
                        ...prev,
                        [current.id]: 0,
                    }));

                    const progressInterval = setInterval(() => {
                        setUploadProgress((prev) => {
                            const currentStage = prev[current.id] ?? 0;

                            if (currentStage >= 3) {
                                clearInterval(progressInterval);
                                return prev;
                            }

                            return {
                                ...prev,
                                [current.id]: currentStage + 1,
                            };
                        });
                    }, 1200);

                    const response = await axiosInstance.post("/upload", formData, {
                        headers: { "Content-Type": "multipart/form-data" },
                    });

                    clearInterval(progressInterval);

                    setUploadProgress((prev) => ({
                        ...prev,
                        [current.id]: 4,
                    }));

                    updatedFiles[index].status = "uploaded";
                    updatedFiles[index].document = response.data.document;
                    updatedFiles[index].name = current.file.name;
                    updatedFiles[index].size = current.file.size;

                    if (
                        response.data.document?.confidence_score !== undefined &&
                        response.data.document?.confidence_score !== null &&
                        response.data.document.confidence_score < 0.7
                    ) {
                        setShowLowConfidenceWarning(true);
                    }
                    successCount++;
                    setFiles([...updatedFiles]);
                } catch (error) {
                    clearInterval(progressInterval);

                    setUploadProgress((prev) => ({
                        ...prev,
                        [current.id]: -1,
                    }));
                    updatedFiles[index].status = "failed";
                    failedCount++;
                    setFiles([...updatedFiles]);
                    toast.error(
                        error?.response?.data?.message || `${current.file.name} upload failed`
                    );
                }
            }

            if (successCount > 0 && failedCount > 0)
                toast.success(`${successCount} uploaded successfully, ${failedCount} failed`);
            else if (successCount > 0)
                toast.success(`${successCount} document(s) uploaded successfully`);
            else if (failedCount > 0)
                toast.error(`${failedCount} document(s) failed to upload`);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleExtract = async (documentId) => {
        try {
            if (!documentId) { toast.error("Document not uploaded yet"); return; }
            setProcessingIds((prev) => [...prev, documentId]);
            await axiosInstance.post("/extract", { document_id: documentId });
            setFiles((prev) =>
                prev.map((item) =>
                    item.document?.id === documentId ? { ...item, status: "completed" } : item
                )
            );
            toast.success("Extraction completed");
        } catch (error) {
            setFiles((prev) =>
                prev.map((item) =>
                    item.document?.id === documentId
                        ? {
                            ...item,
                            status: "failed",
                            document: {
                                ...item.document,
                                status: "failed",
                            },
                        }
                        : item
                )
            );

            toast.error(
                error?.response?.data?.message || "Extraction failed"
            );
        } finally {
            setProcessingIds((prev) => prev.filter((id) => id !== documentId));
        }
    };

    const handleExtractAll = async () => {
        try {
            const extractableDocuments = files.filter(
                (item) => item.document?.id && item.status !== "completed"
            );
            if (extractableDocuments.length === 0) {
                const hasUploadedDocuments = files.some((item) => item.document?.id);
                if (hasUploadedDocuments) toast.success("All documents have already been extracted.");
                else toast.error("No uploaded documents found");
                return;
            }
            const documentIds = extractableDocuments.map((item) => item.document.id);
            setBatchProcessing(true);
            setProcessingIds((prev) => [...new Set([...prev, ...documentIds])]);

            const response = await axiosInstance.post("/extract/batch", { document_ids: documentIds });
            const processedDocuments = response.data?.processed_documents || [];

            if (processedDocuments.length > 0) {
                setFiles((prev) =>
                    prev.map((item) => {
                        const documentId = item.document?.id;
                        const processedDocument = processedDocuments.find(
                            (entry) => entry.document_id === documentId
                        );
                        if (!processedDocument) return item;
                        return {
                            ...item,
                            status: processedDocument.status === "completed" ? "completed" : "failed",
                        };
                    })
                );
            }
            toast.success("Batch extraction completed");
        } catch (error) {
            toast.error(error?.response?.data?.message || "Batch extraction failed");
        } finally {
            setBatchProcessing(false);
            setProcessingIds([]);
        }
    };

    const handleTypeOverride = async (documentId, documentType) => {
        try {
            await axiosInstance.patch(`/documents/${documentId}`, { document_type: documentType });
            await axiosInstance.post("/extract", { document_id: documentId, document_type: documentType });
            setFiles((prev) =>
                prev.map((item) =>
                    item.document?.id === documentId
                        ? { ...item, document: { ...item.document, document_type: documentType } }
                        : item
                )
            );
            toast.success("Document type updated");
        } catch (error) {
            toast.error(error?.response?.data?.message || "Update failed");
        }
    };

    const handleRetryExtraction = async (documentId) => {
        try {
            if (!documentId) {
                toast.error("Document not found");
                return;
            }

            setProcessingIds((prev) => [...prev, documentId]);

            await axiosInstance.patch(
                `/documents/${documentId}/status`,
                {
                    status: "uploaded",
                }
            );

            setFiles((prev) =>
                prev.map((item) =>
                    item.document?.id === documentId
                        ? {
                            ...item,
                            status: "uploaded",
                            document: {
                                ...item.document,
                                status: "uploaded",
                            },
                        }
                        : item
                )
            );

            await axiosInstance.post("/extract", {
                document_id: documentId,
            });

            setFiles((prev) =>
                prev.map((item) =>
                    item.document?.id === documentId
                        ? {
                            ...item,
                            status: "completed",
                            document: {
                                ...item.document,
                                status: "completed",
                            },
                        }
                        : item
                )
            );

            toast.success("Document reprocessed successfully");
        } catch (error) {

            setFiles((prev) =>
                prev.map((item) =>
                    item.document?.id === documentId
                        ? {
                            ...item,
                            status: "failed",
                            document: {
                                ...item.document,
                                status: "failed",
                            },
                        }
                        : item
                )
            );

            toast.error(
                error?.response?.data?.message ||
                "Retry extraction failed"
            );
        } finally {
            setProcessingIds((prev) =>
                prev.filter((id) => id !== documentId)
            );
        }
    };

    /* ── render ─────────────────────────────────────────────────── */
    return (
        <div className="flex flex-col gap-6">

            {/* Drop Zone */}
            <div
                {...getRootProps()}
                className={`rounded-2xl border-2 border-dashed p-10 sm:p-14 text-center cursor-pointer transition-all duration-200
          ${isDragActive
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
            >
                <input {...getInputProps()} />

                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-5 text-blue-600">
                    <UploadCloud size={30} />
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">Drag &amp; Drop Documents</h3>
                <p className="text-sm text-gray-500 mb-3 max-w-md mx-auto leading-relaxed">
                    Upload invoices, receipts, PDFs, IDs, and scanned documents for OCR processing.
                </p>
                <p className="text-xs text-gray-400">
                    Supported: PDF, JPG, JPEG, PNG, WEBP, BMP, TIFF files
                </p>
            </div>

            {/* Queue */}
            {files.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

                    {/* Queue Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-5 border-b border-gray-100">
                        <h3 className="text-base font-bold text-gray-900">
                            Upload Queue <span className="text-gray-400 font-semibold">({files.length})</span>
                        </h3>
                        <div className="flex gap-3 flex-wrap">
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white text-sm font-semibold shadow-sm"
                            >
                                {uploading && <Loader2 size={14} className="animate-spin" />}
                                {uploading ? "Uploading…" : "Start Upload"}
                            </button>
                            <button
                                onClick={handleExtractAll}
                                disabled={batchProcessing}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 text-sm font-semibold"
                            >
                                {batchProcessing && <Loader2 size={14} className="animate-spin" />}
                                {batchProcessing ? "Extracting…" : "Extract All"}
                            </button>
                        </div>
                    </div>

                    {/* Queue Body */}
                    <div className="p-4 flex flex-col gap-3">

                        {/* Low-confidence warning */}
                        {showLowConfidenceWarning && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                                <p className="text-sm font-semibold text-amber-800 mb-0.5">
                                    Low confidence document detected
                                </p>
                                <p className="text-xs text-amber-700">
                                    Please confirm the document type or select the correct type before continuing.
                                </p>
                            </div>
                        )}

                        {/* File rows */}
                        {files.map((item, index) => {
                            const isProcessing = processingIds.includes(item.document?.id);
                            const displayStatus = isProcessing ? "processing" : item.status;

                            return (
                                <div
                                    key={index}
                                    className="flex flex-col gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white transition-all duration-150"
                                >
                                    {/* File header */}
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                                            <FileText size={17} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 break-words leading-snug">
                                                {item.file?.name || item.name || "Document"}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {item.file?.size
                                                    ? `${(item.file.size / 1024).toFixed(2)} KB`
                                                    : ""}
                                            </p>

                                            {/* Badges */}
                                            {item.document && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                                        {item.document.document_type || "Unknown"}
                                                    </span>

                                                    {item.document.confidence_score != null && (
                                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${confidenceBadge(item.document.confidence_score)}`}>
                                                            {Math.round(item.document.confidence_score * 100)}%
                                                        </span>
                                                    )}

                                                    {item.document.confidence_score != null &&
                                                        item.document.confidence_score < 0.7 && (
                                                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                                                Low confidence — review type
                                                            </span>
                                                        )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {(item.status === "uploading" || item.status === "uploaded") && (
                                        <div className="rounded-xl border border-gray-200 bg-white p-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {UPLOAD_STAGES.map((stage, stageIndex) => {
                                                    const currentStage = uploadProgress[item.id] ?? 0;

                                                    const completed = stageIndex < currentStage;
                                                    const active = stageIndex === currentStage;
                                                    const pending = stageIndex > currentStage;

                                                    return (
                                                        <div
                                                            key={stage}
                                                            className={`flex items-center gap-2 text-xs font-medium
                        ${completed
                                                                    ? "text-emerald-600"
                                                                    : active
                                                                        ? "text-blue-600"
                                                                        : "text-gray-400"
                                                                }`}
                                                        >
                                                            <div
                                                                className={`w-6 h-6 rounded-full flex items-center justify-center border
                            ${completed
                                                                        ? "bg-emerald-50 border-emerald-300"
                                                                        : active
                                                                            ? "bg-blue-50 border-blue-300 animate-pulse"
                                                                            : "bg-gray-50 border-gray-200"
                                                                    }`}
                                                            >
                                                                {completed ? "✓" : active ? "•" : ""}
                                                            </div>

                                                            <span>{stage}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions row */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        {item.document && (
                                            <select
                                                value={item.document.document_type || ""}
                                                onChange={(e) => handleTypeOverride(item.document.id, e.target.value)}
                                                className="flex-1 min-w-[140px] text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                            >
                                                <option value="">Select Type</option>
                                                {DOCUMENT_TYPE_OPTIONS.map((option) => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        )}

                                        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${statusBadge(displayStatus)}`}>
                                            {isProcessing ? "Processing…" : getProcessingStep(item.status)}
                                        </span>

                                        <button
                                            onClick={() =>
                                                (item.status === "failed" ||
                                                    item.document?.status === "failed")
                                                    ? handleRetryExtraction(item.document?.id)
                                                    : handleExtract(item.document?.id)
                                            }
                                            disabled={
                                                !item.document ||
                                                processingIds.includes(item.document?.id)
                                            }
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white text-xs font-semibold"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <Loader2 size={12} className="animate-spin" />
                                                    Processing
                                                </>
                                            ) : (item.status === "failed" ||
                                                item.document?.status === "failed") ? (
                                                <>
                                                    <Loader2 size={12} />
                                                    Retry Extraction
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 size={12} />
                                                    Extract
                                                </>
                                            )}
                                        </button>

                                        {item.status === "pending" && (
                                            <button
                                                onClick={() => handleRemoveDocument(index)}
                                                title="Remove Document"
                                                className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 flex items-center justify-center text-gray-400 transition-colors flex-shrink-0"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentUploader;