import { useCallback, useState } from "react";

import { useDropzone } from "react-dropzone";

import {
    UploadCloud,
    FileText,
    Loader2,
    CheckCircle2,
} from "lucide-react";

import toast from "react-hot-toast";

import axiosInstance from "../../api/axios";

const DocumentUploader = () => {

    const [files, setFiles] = useState([]);

    const [processingIds, setProcessingIds] =
        useState([]);

    const [uploading, setUploading] = useState(false);

    const onDrop = useCallback((acceptedFiles) => {

        const formatted = acceptedFiles.map((file) => ({
            file,
            status: "pending",
        }));

        setFiles((prev) => [...prev, ...formatted]);

    }, []);


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

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
    });

    const handleUpload = async () => {

        try {

            setUploading(true);

            const updatedFiles = [...files];

            for (let index = 0; index < updatedFiles.length; index++) {

                const current = updatedFiles[index];

                const formData = new FormData();

                formData.append("file", current.file);

                updatedFiles[index].status = "uploading";

                setFiles([...updatedFiles]);

                const response = await axiosInstance.post(
                    "/upload",
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );

                updatedFiles[index].status = "completed";

                updatedFiles[index].document =
                    response.data.document;

                setFiles([...updatedFiles]);
            }

            toast.success("Documents uploaded successfully");


        } catch (error) {

            toast.error(
                error?.response?.data?.message || "Upload failed"
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

            const documentIds =
                files
                    .filter(
                        (item) =>
                            item.document?.id
                    )
                    .map(
                        (item) =>
                            item.document.id
                    );

            if (
                documentIds.length === 0
            ) {

                toast.error(
                    "No uploaded documents found"
                );

                return;
            }

            await axiosInstance.post(
                "/extract/batch",
                {
                    document_ids:
                        documentIds,
                }
            );

            toast.success(
                "Batch extraction started"
            );

        } catch (error) {

            toast.error(
                error?.response?.data?.message ||
                "Batch extraction failed"
            );
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
                                className="bg-gray-100 text-black px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
                            >
                                Extract All
                            </button>

                        </div>

                    </div>

                    <div className="space-y-4">

                        {files.map((item, index) => (

                            <div
                                key={index}
                                className="flex items-center justify-between p-4 rounded-2xl border border-gray-100"
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

                                            <option value="Invoice">
                                                Invoice
                                            </option>

                                            <option value="Receipt">
                                                Receipt
                                            </option>

                                            <option value="Business Card">
                                                Business Card
                                            </option>

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
                        ))}

                    </div>

                </div>
            )}

        </div>
    );
};

export default DocumentUploader;
