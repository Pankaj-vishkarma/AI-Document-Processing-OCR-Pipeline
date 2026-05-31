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
        <div className="space-y-6">

            <div
                {...getRootProps()}
                className={`
          border-2 border-dashed rounded-3xl p-12
          transition-all duration-300 cursor-pointer
          bg-white shadow-sm
          ${isDragActive
                        ? "border-black bg-gray-50"
                        : "border-gray-300"
                    }
        `}
            >

                <input {...getInputProps()} />

                <div className="flex flex-col items-center justify-center text-center">

                    <div className="w-20 h-20 rounded-3xl bg-black text-white flex items-center justify-center mb-6">

                        <UploadCloud size={36} />

                    </div>

                    <h3 className="text-2xl font-bold text-gray-900">
                        Drag & Drop Documents
                    </h3>

                    <p className="text-gray-500 mt-3 max-w-lg">
                        Upload invoices, receipts, PDFs, IDs, and scanned documents for OCR processing.
                    </p>

                    <p className="text-sm text-gray-400 mt-4">
                        Supported formats: PDF, JPG, JPEG, PNG, WEBP, BMP, TIFF
                    </p>

                    <p className="text-sm text-gray-400">
                        Maximum file size: 20 MB
                    </p>

                    <p className="text-sm text-gray-400">
                        Maximum files per batch: 50
                    </p>

                </div>

            </div>

            {files.length > 0 && (

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">

                    <div className="flex items-center justify-between mb-6">

                        <h3 className="text-2xl font-bold text-gray-900">
                            Upload Queue
                        </h3>

                        <div className="flex items-center gap-3">

                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition"
                            >
                                {uploading ? "Uploading..." : "Start Upload"}
                            </button>

                            <button
                                onClick={handleExtractAll}
                                disabled={batchProcessing}
                                className="bg-gray-100 text-black px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
                            >
                                {batchProcessing ? "Extracting..." : "Extract All"}
                            </button>

                        </div>

                    </div>

                    <div className="space-y-4">

                        {showLowConfidenceWarning && (

                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">

                                <p className="font-semibold">
                                    Low confidence document detected
                                </p>

                                <p className="text-sm mt-1">
                                    Please confirm the document type or select the correct type before continuing.
                                </p>

                            </div>

                        )}

                        {files.map((item, index) => (

                            <div
                                key={index}
                                className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-4 rounded-2xl border border-gray-100"
                            >

                                <div className="flex items-center gap-4">

                                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">

                                        <FileText size={22} />

                                    </div>

                                    <div>

                                        <h4 className="font-semibold text-gray-900">
                                            {item.file.name}
                                        </h4>

                                        <p className="text-sm text-gray-500">
                                            {(item.file.size / 1024).toFixed(2)} KB
                                        </p>

                                        {item.document && (

                                            <div className="flex items-center gap-2 mt-3 flex-wrap">

                                                <span className="px-3 py-1 rounded-full bg-black text-white text-xs font-medium">

                                                    {item.document.document_type ||
                                                        "Unknown"}

                                                </span>

                                                {item.document
                                                    .confidence_score && (

                                                        <span
                                                            className={`
                        px-3 py-1 rounded-full text-xs font-medium
                        ${item.document
                                                                    .confidence_score >=
                                                                    0.8
                                                                    ? "bg-green-100 text-green-700"
                                                                    : item.document
                                                                        .confidence_score >=
                                                                        0.5
                                                                        ? "bg-yellow-100 text-yellow-700"
                                                                        : "bg-red-100 text-red-700"
                                                                }
                    `}
                                                        >

                                                            {Math.round(
                                                                item.document
                                                                    .confidence_score *
                                                                100
                                                            )}
                                                            %

                                                        </span>
                                                    )}

                                                {item.document?.confidence_score !== undefined &&
                                                    item.document?.confidence_score !== null &&
                                                    item.document.confidence_score < 0.7 && (

                                                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                                                            Low confidence, review type
                                                        </span>

                                                    )}

                                            </div>
                                        )}

                                    </div>

                                </div>

                                <div className="flex items-center gap-4">

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
                                            className="bg-gray-100 rounded-xl px-3 py-2 text-sm outline-none"
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

                                    <div>

                                        <span
                                            className={`
        px-4 py-2 rounded-full text-sm font-medium
        ${processingIds.includes(
                                                item.document?.id
                                            )
                                                    ? "bg-blue-100 text-blue-700 animate-pulse"
                                                    : item.status ===
                                                        "completed"
                                                        ? "bg-green-100 text-green-700"
                                                        : item.status ===
                                                            "uploading"
                                                            ? "bg-blue-100 text-blue-700"
                                                            : "bg-yellow-100 text-yellow-700"
                                                }
    `}
                                        >

                                            {processingIds.includes(
                                                item.document?.id
                                            )
                                                ? "Processing..."
                                                : getProcessingStep(
                                                    item.status
                                                )}

                                        </span>

                                        {item.status === "uploading" && (
                                            <div className="flex items-center gap-2 text-blue-600 mt-2">

                                                <Loader2 className="animate-spin" size={18} />

                                                <span className="text-sm font-medium">
                                                    Uploading
                                                </span>

                                            </div>
                                        )}

                                        {item.status === "completed" && (
                                            <div className="flex items-center gap-2 text-green-600 mt-2">

                                                <CheckCircle2 size={18} />

                                                <span className="text-sm font-medium">
                                                    Completed
                                                </span>

                                            </div>
                                        )}

                                    </div>

                                    <div className="flex items-center gap-3 flex-wrap">

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
                                            className="bg-gray-100 text-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
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
                                            className="bg-black text-white px-5 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-40"
                                        >
                                            Extract
                                        </button>

                                    </div>

                                </div>

                            </div>
                        ))}

                    </div>

                </div>
            )}

        </div>
    );
};

export default DocumentUploader;
