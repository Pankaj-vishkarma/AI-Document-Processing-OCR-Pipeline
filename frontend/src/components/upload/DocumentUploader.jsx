import { useCallback, useState } from "react";

import { useDropzone } from "react-dropzone";

import {
    UploadCloud,
    FileText,
    Loader2,
    CheckCircle2,
    Trash2,
} from "lucide-react";

import toast from "react-hot-toast";

import axiosInstance from "../../api/axios";

const DU_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500&display=swap');

  .du-container { display: flex; flex-direction: column; gap: 24px; }
  .du-drop-zone { border: 2px dashed rgba(148, 163, 184, 0.4); border-radius: 24px; padding: 48px 32px; transition: all 0.3s ease; cursor: pointer; background: rgba(15, 23, 42, 0.70); box-shadow: 0 24px 50px rgba(0, 0, 0, 0.24); backdrop-filter: blur(18px); text-align: center; }
  .du-drop-zone.drag-active { border-color: rgba(59, 130, 246, 0.5); background: rgba(59, 130, 246, 0.08); box-shadow: 0 24px 60px rgba(59, 130, 246, 0.15); }
  .du-drop-zone:hover { border-color: rgba(148, 163, 184, 0.5); box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28); }
  .du-drop-icon { width: 64px; height: 64px; border-radius: 20px; background: rgba(59, 130, 246, 0.16); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: #60a5fa; }
  .du-drop-title { font-family: 'Syne', sans-serif; font-size: 1.3rem; font-weight: 700; color: #ffffff; margin: 0 0 10px; }
  .du-drop-subtitle { color: #cbd5e1; font-size: 0.95rem; margin: 0 0 16px; line-height: 1.6; }
  .du-drop-hint { font-size: 0.82rem; color: #94a3b8; margin: 8px 0 0 0; line-height: 1.5; }
  .du-queue-section { background: rgba(15, 23, 42, 0.80); border: 1px solid rgba(148, 163, 184, 0.18); border-radius: 24px; box-shadow: 0 24px 50px rgba(0, 0, 0, 0.24); backdrop-filter: blur(20px); overflow: hidden; }
  .du-queue-header { padding: 24px 26px; border-bottom: 1px solid rgba(148, 163, 184, 0.12); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
  .du-queue-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1.1rem; color: #f8fafc; margin: 0; }
  .du-btn-group { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .du-btn-primary { display: inline-flex; align-items: center; gap: 8px; padding: 11px 20px; border-radius: 14px; border: none; background: linear-gradient(135deg, #4f46e5, #2563eb); font-size: 0.8rem; font-weight: 600; color: #ffffff; font-family: 'Syne', sans-serif; letter-spacing: 0.02em; cursor: pointer; transition: all 0.2s ease; }
  .du-btn-primary:hover:not(:disabled) { box-shadow: 0 16px 30px rgba(79, 70, 229, 0.28); transform: translateY(-1px); }
  .du-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .du-btn-secondary { display: inline-flex; align-items: center; gap: 8px; padding: 11px 20px; border-radius: 14px; border: 1px solid rgba(148, 163, 184, 0.25); background: rgba(255, 255, 255, 0.06); font-size: 0.8rem; font-weight: 600; color: #e2e8f0; font-family: 'Syne', sans-serif; letter-spacing: 0.02em; cursor: pointer; transition: all 0.2s ease; }
  .du-btn-secondary:hover:not(:disabled) { border-color: rgba(148, 163, 184, 0.4); background: rgba(255, 255, 255, 0.10); }
  .du-btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
  .du-btn-sm { padding: 8px 12px; font-size: 0.75rem; display: inline-flex; align-items: center; justify-content: center; }
  .du-queue-content { padding: 20px 26px; display: flex; flex-direction: column; gap: 12px; }
  .du-warning { border-radius: 18px; border: 1px solid rgba(217, 119, 6, 0.25); background: rgba(217, 119, 6, 0.12); padding: 14px 16px; }
  .du-warning-title { font-weight: 600; color: #fde68a; font-family: 'Syne', sans-serif; margin: 0 0 4px; font-size: 0.9rem; }
  .du-warning-text { font-size: 0.85rem; color: #cbd5e1; margin: 0; }
  .du-file-row { display: flex; flex-direction: column; gap: 12px; padding: 16px 18px; border-radius: 18px; border: 1px solid rgba(148, 163, 184, 0.14); background: rgba(255, 255, 255, 0.04); transition: all 0.2s ease; }
  .du-file-row:hover { border-color: rgba(148, 163, 184, 0.25); background: rgba(255, 255, 255, 0.08); }
  .du-file-header { display: flex; align-items: flex-start; gap: 14px; }
  .du-file-icon { width: 40px; height: 40px; border-radius: 14px; background: rgba(59, 130, 246, 0.16); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #bfdbfe; }
  .du-file-info { flex: 1; min-width: 0; }
  .du-file-name { font-weight: 600; color: #f8fafc; font-size: 0.95rem; margin: 0 0 3px; word-break: break-word; }
  .du-file-size { font-size: 0.82rem; color: #94a3b8; margin: 0; }
  .du-file-badges { display: flex; align-items: center; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
  .du-badge { display: inline-flex; align-items: center; padding: 5px 12px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; font-family: 'Syne', sans-serif; border: 1px solid transparent; }
  .du-badge-type { background: rgba(59, 130, 246, 0.18); color: #bfdbfe; border: 1px solid rgba(59, 130, 246, 0.30); }
  .du-badge-confidence-high { background: rgba(34, 197, 94, 0.16); color: #bbf7d0; border: 1px solid rgba(34, 197, 94, 0.25); }
  .du-badge-confidence-med { background: rgba(245, 158, 11, 0.16); color: #fde68a; border: 1px solid rgba(245, 158, 11, 0.25); }
  .du-badge-confidence-low { background: rgba(239, 68, 68, 0.16); color: #fecaca; border: 1px solid rgba(239, 68, 68, 0.25); }
  .du-badge-warning { background: rgba(245, 158, 11, 0.16); color: #fde68a; border: 1px solid rgba(245, 158, 11, 0.25); }
  .du-file-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .du-file-select { background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(148, 163, 184, 0.20); color: #e2e8f0; padding: 8px 12px; border-radius: 12px; font-size: 0.82rem; cursor: pointer; transition: all 0.2s ease; font-family: 'DM Sans', sans-serif; }
  .du-file-select:hover { border-color: rgba(148, 163, 184, 0.35); background: rgba(255, 255, 255, 0.12); }
  .du-file-select option { background: #0e172c; color: #f8fafc; }
  .du-status-badge { display: inline-flex; align-items: center; padding: 7px 14px; border-radius: 999px; font-size: 0.78rem; font-weight: 600; font-family: 'Syne', sans-serif; white-space: nowrap; }
  .du-status-processing { background: rgba(59, 130, 246, 0.16); color: #bfdbfe; animation: duPulse 1.5s ease-in-out infinite; }
  @keyframes duPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
  .du-status-completed { background: rgba(34, 197, 94, 0.16); color: #bbf7d0; }
  .du-status-uploading { background: rgba(59, 130, 246, 0.16); color: #bfdbfe; }
  .du-status-pending { background: rgba(245, 158, 11, 0.16); color: #fde68a; }
  .du-status-failed { background: rgba(239, 68, 68, 0.16); color: #fecaca; }
  .du-icon-btn { width: 36px; height: 36px; border-radius: 12px; border: 1px solid rgba(148, 163, 184, 0.20); background: rgba(255, 255, 255, 0.06); display: flex; align-items: center; justify-content: center; cursor: pointer; color: #cbd5e1; transition: all 0.2s ease; flex-shrink: 0; }
  .du-icon-btn:hover:not(:disabled) { border-color: rgba(148, 163, 184, 0.35); background: rgba(255, 255, 255, 0.12); color: #ffffff; }
  .du-icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  @media (max-width: 1024px) { .du-drop-zone { padding: 40px 24px; } }
  @media (max-width: 768px) { .du-container { gap: 20px; } .du-drop-zone { padding: 32px 20px; } .du-drop-icon { width: 56px; height: 56px; } .du-drop-title { font-size: 1.1rem; } .du-queue-header { flex-direction: column; align-items: stretch; gap: 14px; } .du-btn-group { width: 100%; justify-content: space-between; } .du-btn-primary, .du-btn-secondary { flex: 1; justify-content: center; } .du-file-row { gap: 14px; } .du-file-actions { width: 100%; justify-content: space-between; } .du-file-select { flex: 1; min-width: 120px; } }
  @media (max-width: 480px) { .du-drop-zone { padding: 28px 16px; } .du-drop-icon { width: 48px; height: 48px; } .du-drop-title { font-size: 1rem; } .du-queue-header { padding: 18px 16px; } .du-queue-content { padding: 16px 16px; } .du-btn-primary, .du-btn-secondary { width: 100%; font-size: 0.75rem; padding: 10px 16px; } .du-file-row { padding: 14px 14px; } .du-file-header { gap: 12px; } .du-file-icon { width: 36px; height: 36px; } .du-file-actions { gap: 8px; } .du-icon-btn { width: 32px; height: 32px; } }
`;

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

const DocumentUploader = () => {

    const [files, setFiles] = useState([]);

    const [processingIds, setProcessingIds] =
        useState([]);

    const [uploading, setUploading] = useState(false);

    const [batchProcessing, setBatchProcessing] = useState(false);

    const [showLowConfidenceWarning, setShowLowConfidenceWarning] =
        useState(false);

    const onDrop = useCallback(
        (acceptedFiles, fileRejections) => {

            const MAX_FILES = 50;

            fileRejections.forEach(({ file, errors }) => {

                errors.forEach((error) => {

                    if (error.code === "file-invalid-type") {

                        toast.error(
                            `${file.name}: Only PDF and image files are allowed`
                        );
                    }

                    if (error.code === "file-too-large") {

                        toast.error(
                            `${file.name}: Maximum size is 20MB`
                        );
                    }
                });
            });

            // Maximum files validation
            const remainingSlots =
                MAX_FILES - files.length;

            if (remainingSlots <= 0) {

                toast.error(
                    `Maximum ${MAX_FILES} files are allowed`
                );

                return;
            }

            if (
                acceptedFiles.length >
                remainingSlots
            ) {

                toast.error(
                    `Only ${remainingSlots} more file(s) can be added`
                );

                acceptedFiles =
                    acceptedFiles.slice(
                        0,
                        remainingSlots
                    );
            }

            const formatted = acceptedFiles.map((file) => ({
                file,
                status: "pending",
            }));

            setFiles((prev) => {

                const uniqueFiles = formatted.filter(
                    (item) => {

                        const isDuplicate =
                            prev.some(
                                (existingItem) =>
                                    existingItem.file.name ===
                                    item.file.name &&
                                    existingItem.file.size ===
                                    item.file.size
                            );

                        return !isDuplicate;
                    }
                );

                if (
                    uniqueFiles.length <
                    formatted.length
                ) {

                    toast.error(
                        "Duplicate file(s) skipped"
                    );
                }

                return [
                    ...prev,
                    ...uniqueFiles,
                ];
            });
        },
        [files]
    );


    const getProcessingStep = (status) => {

        switch (status) {

            case "uploaded":
                return "Queued";

            case "processing":
                return "OCR Processing";

            case "completed":
                return "Extraction Completed";

            case "failed":
                return "Failed";

            default:
                return "Queued";
        }
    };

    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

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

    const handleRemoveDocument = (index) => {
        const documentItem = files[index];

        if (!documentItem) {
            return;
        }

        if (documentItem.status === "uploading") {
            return;
        }

        const needsConfirmation =
            documentItem.status === "uploaded" ||
            documentItem.status === "completed";

        if (
            needsConfirmation &&
            !window.confirm(
                "This document has already been uploaded or extracted. Remove it from the queue?"
            )
        ) {
            return;
        }

        setFiles((prev) =>
            prev.filter((_, itemIndex) => itemIndex !== index)
        );
    };

    const handleUpload = async () => {

        try {

            if (files.length === 0) {

                toast.error(
                    "Please select at least one document"
                );

                return;
            }

            setUploading(true);
            setShowLowConfidenceWarning(false);

            const updatedFiles = [...files];

            const allowedTypes = [
                "application/pdf",
                "image/jpeg",
                "image/png",
                "image/webp",
                "image/bmp",
                "image/tiff",
            ];

            let successCount = 0;
            let failedCount = 0;

            for (let index = 0; index < updatedFiles.length; index++) {

                const current = updatedFiles[index];

                // Skip already uploaded/completed files
                if (
                    current.status === "uploaded" ||
                    current.status === "completed"
                ) {
                    continue;
                }

                // Empty file validation
                if (current.file.size === 0) {

                    toast.error(
                        `${current.file.name} is empty and cannot be uploaded`
                    );

                    updatedFiles[index].status = "failed";

                    setFiles([...updatedFiles]);

                    failedCount++;

                    continue;
                }

                // File type validation
                if (
                    !allowedTypes.includes(
                        current.file.type
                    )
                ) {

                    toast.error(
                        `${current.file.name} is not a supported file type`
                    );

                    updatedFiles[index].status = "failed";

                    setFiles([...updatedFiles]);

                    failedCount++;

                    continue;
                }

                try {

                    const formData = new FormData();

                    formData.append(
                        "file",
                        current.file
                    );

                    updatedFiles[index].status =
                        "uploading";

                    setFiles([...updatedFiles]);

                    const response =
                        await axiosInstance.post(
                            "/upload",
                            formData,
                            {
                                headers: {
                                    "Content-Type":
                                        "multipart/form-data",
                                },
                            }
                        );

                    updatedFiles[index].status =
                        "uploaded";

                    updatedFiles[index].document =
                        response.data.document;

                    if (
                        response.data.document
                            ?.confidence_score !==
                        undefined &&
                        response.data.document
                            ?.confidence_score !==
                        null &&
                        response.data.document
                            .confidence_score < 0.7
                    ) {
                        setShowLowConfidenceWarning(
                            true
                        );
                    }

                    successCount++;

                    setFiles([...updatedFiles]);

                } catch (error) {

                    updatedFiles[index].status =
                        "failed";

                    failedCount++;

                    setFiles([...updatedFiles]);

                    toast.error(
                        error?.response?.data
                            ?.message ||
                        `${current.file.name} upload failed`
                    );
                }
            }

            if (
                successCount > 0 &&
                failedCount > 0
            ) {

                toast.success(
                    `${successCount} uploaded successfully, ${failedCount} failed`
                );

            } else if (
                successCount > 0
            ) {

                toast.success(
                    `${successCount} document(s) uploaded successfully`
                );

            } else if (
                failedCount > 0
            ) {

                toast.error(
                    `${failedCount} document(s) failed to upload`
                );
            }

        } catch (error) {

            toast.error(
                error?.response?.data?.message ||
                "Upload failed"
            );

        } finally {

            setUploading(false);
        }
    };

    const handleExtract = async (
        documentId
    ) => {

        try {

            if (!documentId) {

                toast.error(
                    "Document not uploaded yet"
                );

                return;
            }

            setProcessingIds((prev) => [
                ...prev,
                documentId,
            ]);

            await axiosInstance.post(
                "/extract",
                {
                    document_id: documentId,
                }
            );

            setFiles((prev) =>
                prev.map((item) => {
                    if (item.document?.id === documentId) {
                        return {
                            ...item,
                            status: "completed",
                        };
                    }

                    return item;
                })
            );

            toast.success(
                "Extraction completed"
            );

        } catch (error) {

            toast.error(
                error?.response?.data?.message ||
                "Extraction failed"
            );

        } finally {

            setProcessingIds((prev) =>
                prev.filter(
                    (id) => id !== documentId
                )
            );
        }
    };


    const handleExtractAll = async () => {

        try {

            const extractableDocuments = files.filter(
                (item) =>
                    item.document?.id &&
                    item.status !== "completed"
            );

            if (extractableDocuments.length === 0) {

                const hasUploadedDocuments = files.some(
                    (item) => item.document?.id
                );

                if (hasUploadedDocuments) {
                    toast.success(
                        "All documents have already been extracted."
                    );
                } else {
                    toast.error(
                        "No uploaded documents found"
                    );
                }

                return;
            }

            const documentIds = extractableDocuments.map(
                (item) => item.document.id
            );

            setBatchProcessing(true);
            setProcessingIds((prev) => [
                ...new Set([...prev, ...documentIds]),
            ]);

            const response = await axiosInstance.post(
                "/extract/batch",
                {
                    document_ids: documentIds,
                }
            );

            const processedDocuments =
                response.data?.processed_documents || [];

            if (processedDocuments.length > 0) {
                setFiles((prev) =>
                    prev.map((item) => {
                        const documentId = item.document?.id;
                        const processedDocument = processedDocuments.find(
                            (entry) => entry.document_id === documentId
                        );

                        if (!processedDocument) {
                            return item;
                        }

                        return {
                            ...item,
                            status:
                                processedDocument.status === "completed"
                                    ? "completed"
                                    : "failed",
                        };
                    })
                );
            }

            toast.success("Batch extraction completed");

        } catch (error) {

            toast.error(
                error?.response?.data?.message ||
                "Batch extraction failed"
            );
        } finally {

            setBatchProcessing(false);
            setProcessingIds([]);
        }
    };


    const handleTypeOverride =
        async (
            documentId,
            documentType
        ) => {

            try {

                await axiosInstance.patch(
                    `/documents/${documentId}`,
                    {
                        document_type:
                            documentType,
                    }
                );

                await axiosInstance.post(
                    "/extract",
                    {
                        document_id: documentId,
                        document_type: documentType,
                    }
                );

                setFiles((prev) =>
                    prev.map((item) => {

                        if (
                            item.document?.id ===
                            documentId
                        ) {

                            return {
                                ...item,
                                document: {
                                    ...item.document,
                                    document_type:
                                        documentType,
                                },
                            };
                        }

                        return item;
                    })
                );

                toast.success(
                    "Document type updated"
                );

            } catch (error) {

                toast.error(
                    error?.response?.data
                        ?.message ||
                    "Update failed"
                );
            }
        };

    return (
        <>
            <style>{DU_STYLES}</style>
            <div className="du-container">

                <div
                    {...getRootProps()}
                    className={`du-drop-zone ${isDragActive ? "drag-active" : ""}`}
                >

                    <input {...getInputProps()} />

                    <div className="du-drop-icon">
                        <UploadCloud size={36} />
                    </div>

                    <h3 className="du-drop-title">
                        Drag & Drop Documents
                    </h3>

                    <p className="du-drop-subtitle">
                        Upload invoices, receipts, PDFs, IDs, and scanned documents for OCR processing.
                    </p>

                    <p className="du-drop-hint">
                        Supported formats: PDF, JPG, JPEG, PNG, WEBP, BMP, TIFF
                    </p>
                    <p className="du-drop-hint">
                        Maximum file size: 20 MB · Maximum files per batch: 50
                    </p>

                </div>

                {files.length > 0 && (

                    <div className="du-queue-section">

                        <div className="du-queue-header">

                            <h3 className="du-queue-title">
                                Upload Queue ({files.length})
                            </h3>

                            <div className="du-btn-group">

                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="du-btn-primary"
                                >
                                    {uploading ? "Uploading..." : "Start Upload"}
                                </button>

                                <button
                                    onClick={handleExtractAll}
                                    disabled={batchProcessing}
                                    className="du-btn-secondary"
                                >
                                    {batchProcessing ? "Extracting..." : "Extract All"}
                                </button>

                            </div>

                        </div>

                        <div className="du-queue-content">

                            {showLowConfidenceWarning && (

                                <div className="du-warning">

                                    <p className="du-warning-title">
                                        Low confidence document detected
                                    </p>

                                    <p className="du-warning-text">
                                        Please confirm the document type or select the correct type before continuing.
                                    </p>

                                </div>

                            )}

                            {files.map((item, index) => (

                                <div
                                    key={index}
                                    className="du-file-row"
                                >

                                    <div className="du-file-header">

                                        <div className="du-file-icon">
                                            <FileText size={20} />
                                        </div>

                                        <div className="du-file-info">

                                            <h4 className="du-file-name">
                                                {item.file.name}
                                            </h4>

                                            <p className="du-file-size">
                                                {(item.file.size / 1024).toFixed(2)} KB
                                            </p>

                                            {item.document && (

                                                <div className="du-file-badges">

                                                    <span className="du-badge du-badge-type">

                                                        {item.document.document_type ||
                                                            "Unknown"}

                                                    </span>

                                                    {item.document
                                                        .confidence_score && (

                                                            <span
                                                                className={`du-badge ${item.document
                                                                    .confidence_score >=
                                                                    0.8
                                                                    ? "du-badge-confidence-high"
                                                                    : item.document
                                                                        .confidence_score >=
                                                                        0.5
                                                                        ? "du-badge-confidence-med"
                                                                        : "du-badge-confidence-low"
                                                                }`}
                                                            >

                                                                {Math.round(
                                                                    item.document
                                                                        .confidence_score *
                                                                    100
                                                                )}%

                                                            </span>
                                                        )}

                                                    {item.document?.confidence_score !== undefined &&
                                                        item.document?.confidence_score !== null &&
                                                        item.document.confidence_score < 0.7 && (

                                                            <span className="du-badge du-badge-warning">
                                                                Low confidence, review type
                                                            </span>

                                                        )}

                                                </div>
                                            )}

                                        </div>

                                    </div>

                                    <div className="du-file-actions">

                                        {item.document && (

                                            <select
                                                value={
                                                    item.document
                                                        .document_type || ""
                                                }
                                                onChange={(e) =>
                                                    handleTypeOverride(
                                                        item.document.id,
                                                        e.target.value
                                                    )
                                                }
                                                className="du-file-select"
                                            >

                                                <option value="">
                                                    Select Type
                                                </option>

                                                {DOCUMENT_TYPE_OPTIONS.map((option) => (

                                                    <option
                                                        key={option}
                                                        value={option}
                                                    >
                                                        {option}
                                                    </option>

                                                ))}

                                            </select>
                                        )}

                                        <span className={`du-status-badge du-status-${processingIds.includes(item.document?.id) ? "processing" : item.status === "completed" ? "completed" : item.status === "uploading" ? "uploading" : "pending"}`}>

                                            {processingIds.includes(
                                                item.document?.id
                                            )
                                                ? "Processing..."
                                                : getProcessingStep(
                                                    item.status
                                                )}

                                        </span>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleRemoveDocument(
                                                    index
                                                )
                                            }
                                            disabled={
                                                item.status ===
                                                "uploading"
                                            }
                                            title="Remove Document"
                                            className="du-icon-btn"
                                        >
                                            <Trash2 size={16} />
                                        </button>

                                        <button
                                            onClick={() =>
                                                handleExtract(
                                                    item.document?.id
                                                )
                                            }
                                            disabled={!item.document}
                                            className="du-btn-primary du-btn-sm"
                                        >
                                            Extract
                                        </button>

                                    </div>

                                </div>
                            ))}

                        </div>

                    </div>
                )}

            </div>
        </>
    );
};

export default DocumentUploader;
