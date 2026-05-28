import { useCallback, useEffect, useMemo, useState } from "react";

import { useDropzone } from "react-dropzone";

import toast from "react-hot-toast";

import axiosInstance from "../../api/axios";

import {
    Download,
    FileText,
    Filter,
    Loader2,
    Play,
    Plus,
    RefreshCw,
    UploadCloud,
} from "lucide-react";

const exportOptions = ["csv", "excel", "json", "zip"];

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

    const onDrop = useCallback((acceptedFiles) => {

        const nextFiles = acceptedFiles.slice(0, 50).map((file) => ({
            file,
            status: "queued",
            progress: 0,
            document: null,
        }));

        setUploadQueue((prev) => [
            ...prev,
            ...nextFiles,
        ].slice(0, 50));

    }, []);

    const addFilesToQueue = (files) => {

        const nextFiles = Array.from(files).slice(0, 50).map((file) => ({
            file,
            status: "queued",
            progress: 0,
            document: null,
        }));

        setUploadQueue((prev) => [
            ...prev,
            ...nextFiles,
        ].slice(0, 50));
    };

    const {
        getRootProps,
        getInputProps,
        isDragActive,
    } = useDropzone({
        onDrop,
        multiple: true,
        maxFiles: 50,
    });

    const fetchDocuments = async () => {

        try {

            const response = await axiosInstance.get("/documents", {
                params: {
                    page: 1,
                    limit: 1000,
                },
            });

            setDocuments(response.data.documents || []);

        } catch (error) {

            toast.error(
                error?.response?.data?.message ||
                "Failed to fetch documents"
            );
        }
    };

    const fetchTemplates = async () => {

        try {

            const response = await axiosInstance.get("/templates");

            setTemplates(response.data.templates || []);

        } catch (error) {

            toast.error(
                error?.response?.data?.message ||
                "Failed to fetch templates"
            );
        }
    };

    const fetchBatches = async () => {

        try {

            setLoading(true);

            const response = await axiosInstance.get("/batches");

            const nextBatches = response.data.batches || [];

            setBatches(nextBatches);

            if (
                nextBatches.length > 0 &&
                !selectedBatchId
            ) {

                setSelectedBatchId(nextBatches[0].id);
            }

        } catch (error) {

            toast.error(
                error?.response?.data?.message ||
                "Failed to fetch batches"
            );

        } finally {

            setLoading(false);
        }
    };

    const fetchBatchDetails = async (batchId) => {

        if (!batchId) {
            setBatchDetails(null);
            return;
        }

        try {

            const response = await axiosInstance.get(
                `/batches/${batchId}`
            );

            setBatchDetails(response.data);

        } catch (error) {

            toast.error(
                error?.response?.data?.message ||
                "Failed to fetch batch details"
            );
        }
    };

    useEffect(() => {

        fetchDocuments();
        fetchTemplates();
        fetchBatches();

    }, []);

    useEffect(() => {

        if (selectedBatchId) {
            fetchBatchDetails(selectedBatchId);
        }

    }, [selectedBatchId]);

    useEffect(() => {

        const activeStatus =
            batchDetails?.batch?.status === "processing" ||
            batchDetails?.batch?.status === "queued";

        if (!selectedBatchId || !activeStatus) {
            return undefined;
        }

        const interval = window.setInterval(() => {
            fetchBatches();
            fetchBatchDetails(selectedBatchId);
        }, 2500);

        return () => window.clearInterval(interval);

    }, [
        selectedBatchId,
        batchDetails?.batch?.status,
    ]);

    const handleSelect = (id) => {

        setSelectedDocs((prev) =>
            prev.includes(id)
                ? prev.filter((docId) => docId !== id)
                : [...prev, id]
        );
    };

    const uploadQueuedFiles = async () => {

        if (uploadQueue.length === 0) {
            return [];
        }

        if (uploadQueue.length > 50) {
            toast.error("Maximum 50 documents per batch");
            return [];
        }

        try {

            setUploading(true);

            const uploadedIds = [];

            for (let index = 0; index < uploadQueue.length; index++) {

                const item = uploadQueue[index];

                if (item.document?.id) {
                    uploadedIds.push(item.document.id);
                    continue;
                }

                setUploadQueue((prev) =>
                    prev.map((queued, queuedIndex) =>
                        queuedIndex === index
                            ? {
                                ...queued,
                                status: "uploading",
                                progress: 20,
                            }
                            : queued
                    )
                );

                const formData = new FormData();

                formData.append("file", item.file);

                const response = await axiosInstance.post(
                    "/upload",
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                        onUploadProgress: (progressEvent) => {
                            const progress = Math.round(
                                (progressEvent.loaded * 100) /
                                (progressEvent.total || 1)
                            );

                            setUploadQueue((prev) =>
                                prev.map((queued, queuedIndex) =>
                                    queuedIndex === index
                                        ? {
                                            ...queued,
                                            progress,
                                        }
                                        : queued
                                )
                            );
                        },
                    }
                );

                uploadedIds.push(response.data.document.id);

                setUploadQueue((prev) =>
                    prev.map((queued, queuedIndex) =>
                        queuedIndex === index
                            ? {
                                ...queued,
                                status: "uploaded",
                                progress: 100,
                                document: response.data.document,
                            }
                            : queued
                    )
                );
            }

            await fetchDocuments();

            return uploadedIds;

        } finally {

            setUploading(false);
        }
    };

    const handleCreateBatch = async () => {

        if (!batchName.trim()) {
            toast.error("Batch name required");
            return;
        }

        try {

            setCreating(true);

            const uploadedIds = await uploadQueuedFiles();

            const documentIds = [
                ...new Set([
                    ...selectedDocs,
                    ...uploadedIds,
                ]),
            ];

            if (documentIds.length === 0) {
                toast.error("Select or upload at least one document");
                return;
            }

            if (documentIds.length > 50) {
                toast.error("Maximum 50 documents per batch");
                return;
            }

            const response = await axiosInstance.post("/batches", {
                batch_name: batchName,
                document_ids: documentIds,
                template_name: selectedTemplate || undefined,
            });

            toast.success("Batch created successfully");

            setBatchName("");
            setSelectedDocs([]);
            setUploadQueue([]);
            setSelectedBatchId(response.data.batch.id);

            await fetchBatches();
            await fetchBatchDetails(response.data.batch.id);

        } catch (error) {

            toast.error(
                error?.response?.data?.message ||
                "Batch creation failed"
            );

        } finally {

            setCreating(false);
        }
    };

    const handleProcessBatch = async () => {

        if (!selectedBatchId) {
            toast.error("Select a batch first");
            return;
        }

        try {

            setProcessing(true);

            await axiosInstance.post(
                `/batches/${selectedBatchId}/process`
            );

            toast.success("Batch processing queued");

            await fetchBatches();
            await fetchBatchDetails(selectedBatchId);

        } catch (error) {

            toast.error(
                error?.response?.data?.message ||
                "Batch processing failed"
            );

        } finally {

            setProcessing(false);
        }
    };

    const handleApplyTemplate = async () => {

        if (!selectedBatchId) {
            toast.error("Select a batch first");
            return;
        }

        if (!selectedTemplate) {
            toast.error("Select a template");
            return;
        }

        try {

            await axiosInstance.post(
                `/batches/${selectedBatchId}/template`,
                {
                    template_name: selectedTemplate,
                }
            );

            toast.success("Template applied to batch");

            fetchBatchDetails(selectedBatchId);

        } catch (error) {

            toast.error(
                error?.response?.data?.message ||
                "Template apply failed"
            );
        }
    };

    const handleExportBatch = async () => {

        if (!selectedBatchId) {
            toast.error("Select a batch first");
            return;
        }

        try {

            const response = await axiosInstance.get(
                `/export/batch/${selectedBatchId}`,
                {
                    params: {
                        type: exportType,
                    },
                    responseType: "blob",
                }
            );

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

            toast.error(
                error?.response?.data?.message ||
                "Batch export failed"
            );
        }
    };

    const summary =
        batchDetails?.summary || {
            total_documents: 0,
            processed_documents: 0,
            successful_documents: 0,
            needs_review_documents: 0,
            failed_documents: 0,
            completion_percentage: 0,
        };

    const detailDocuments =
        batchDetails?.documents || [];

    const visibleDocuments = useMemo(
        () =>
            filterNeedsReview
                ? batchDetails?.needs_review || []
                : detailDocuments,
        [
            filterNeedsReview,
            batchDetails,
            detailDocuments,
        ]
    );

    const comparisonRows =
        batchDetails?.comparison_rows || [];

    const comparisonFields =
        batchDetails?.comparison_fields || [];

    const statusClass = (status) => {
        if (status === "completed" || status === "approved") {
            return "bg-green-100 text-green-700";
        }
        if (status === "processing") {
            return "bg-blue-100 text-blue-700";
        }
        if (status === "failed") {
            return "bg-red-100 text-red-700";
        }
        return "bg-yellow-100 text-yellow-700";
    };

    return (
        <div className="space-y-8">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900">
                        Batch Processing
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Bulk upload, process, review, compare, and export document batches.
                    </p>
                </div>
                <button
                    onClick={() => {
                        fetchDocuments();
                        fetchBatches();
                        if (selectedBatchId) {
                            fetchBatchDetails(selectedBatchId);
                        }
                    }}
                    className="bg-black text-white px-5 py-3 rounded-xl font-medium inline-flex items-center gap-2"
                >
                    <RefreshCw size={18} />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 mb-5">
                        Create Batch
                    </h2>

                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-3xl p-8 cursor-pointer transition ${isDragActive
                            ? "border-black bg-gray-50"
                            : "border-gray-300"
                            }`}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center text-center">
                            <UploadCloud size={34} />
                            <p className="font-semibold mt-3">
                                Drag documents here or select files
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                Up to 50 documents per batch
                            </p>
                        </div>
                    </div>

                    <label className="mt-3 inline-flex items-center justify-center w-full bg-gray-100 text-black px-5 py-3 rounded-xl font-medium cursor-pointer hover:bg-gray-200 transition">
                        Select Folder
                        <input
                            type="file"
                            multiple
                            webkitdirectory=""
                            directory=""
                            className="hidden"
                            onChange={(event) => {
                                addFilesToQueue(event.target.files || []);
                                event.target.value = "";
                            }}
                        />
                    </label>

                    {uploadQueue.length > 0 && (
                        <div className="mt-5 space-y-3 max-h-65 overflow-y-auto">
                            {uploadQueue.map((item, index) => (
                                <div
                                    key={`${item.file.name}-${index}`}
                                    className="border border-gray-100 rounded-2xl p-4"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="font-medium text-sm break-all">
                                            {item.file.name}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {item.status}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-3">
                                        <div
                                            className="h-full bg-black"
                                            style={{
                                                width: `${item.progress}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-6 space-y-4">
                        <input
                            type="text"
                            value={batchName}
                            onChange={(event) =>
                                setBatchName(event.target.value)
                            }
                            placeholder="Batch name"
                            className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none"
                        />

                        <select
                            value={selectedTemplate}
                            onChange={(event) =>
                                setSelectedTemplate(event.target.value)
                            }
                            className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none"
                        >
                            <option value="">
                                No template
                            </option>
                            {templates.map((template) => (
                                <option
                                    key={template.name}
                                    value={template.name}
                                >
                                    {template.name.replace("_", " ")}
                                </option>
                            ))}
                        </select>

                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-3">
                                Or select existing documents
                            </p>
                            <div className="space-y-3 max-h-65 overflow-y-auto">
                                {documents.map((document) => (
                                    <label
                                        key={document.id}
                                        className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 cursor-pointer"
                                    >
                                        <span>
                                            <span className="block font-semibold text-gray-900">
                                                {document.original_filename}
                                            </span>
                                            <span className="block text-sm text-gray-500">
                                                {document.status}
                                            </span>
                                        </span>
                                        <input
                                            type="checkbox"
                                            checked={selectedDocs.includes(document.id)}
                                            onChange={() =>
                                                handleSelect(document.id)
                                            }
                                            className="w-5 h-5"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleCreateBatch}
                            disabled={creating || uploading}
                            className="w-full bg-black text-white py-4 rounded-2xl font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-40"
                        >
                            {creating || uploading ? (
                                <Loader2
                                    className="animate-spin"
                                    size={18}
                                />
                            ) : (
                                <Plus size={18} />
                            )}
                            Create Batch
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 mb-5">
                        Batch Results Dashboard
                    </h2>

                    <select
                        value={selectedBatchId}
                        onChange={(event) =>
                            setSelectedBatchId(event.target.value)
                        }
                        className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none mb-5"
                    >
                        <option value="">
                            Select batch
                        </option>
                        {batches.map((batch) => (
                            <option
                                key={batch.id}
                                value={batch.id}
                            >
                                {batch.batch_name}
                            </option>
                        ))}
                    </select>

                    {loading && !batchDetails ? (
                        <div className="text-gray-500">
                            Loading batches...
                        </div>
                    ) : !batchDetails ? (
                        <div className="text-gray-500">
                            No batch selected
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                                {[
                                    ["Total", summary.total_documents],
                                    ["Processed", summary.processed_documents],
                                    ["Successful", summary.successful_documents],
                                    ["Needs Review", summary.needs_review_documents],
                                    ["Failed", summary.failed_documents],
                                ].map(([label, value]) => (
                                    <div
                                        key={label}
                                        className="bg-gray-50 rounded-2xl p-4"
                                    >
                                        <p className="text-sm text-gray-500">
                                            {label}
                                        </p>
                                        <p className="text-2xl font-bold mt-2">
                                            {value}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span>
                                        Progress
                                    </span>
                                    <span>
                                        {summary.completion_percentage}%
                                    </span>
                                </div>
                                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-black"
                                        style={{
                                            width: `${summary.completion_percentage}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={handleProcessBatch}
                                    disabled={processing}
                                    className="bg-black text-white px-5 py-3 rounded-xl font-medium inline-flex items-center gap-2 disabled:opacity-40"
                                >
                                    {processing ? (
                                        <Loader2
                                            className="animate-spin"
                                            size={18}
                                        />
                                    ) : (
                                        <Play size={18} />
                                    )}
                                    Process Batch
                                </button>

                                <button
                                    onClick={() =>
                                        setFilterNeedsReview((prev) => !prev)
                                    }
                                    className="bg-gray-100 text-black px-5 py-3 rounded-xl font-medium inline-flex items-center gap-2"
                                >
                                    <Filter size={18} />
                                    {filterNeedsReview
                                        ? "Show All"
                                        : "Needs Review"}
                                </button>

                                <select
                                    value={exportType}
                                    onChange={(event) =>
                                        setExportType(event.target.value)
                                    }
                                    className="bg-gray-100 rounded-xl px-4 py-3 outline-none"
                                >
                                    {exportOptions.map((option) => (
                                        <option
                                            key={option}
                                            value={option}
                                        >
                                            {option.toUpperCase()}
                                        </option>
                                    ))}
                                </select>

                                <button
                                    onClick={handleExportBatch}
                                    className="border border-black text-black px-5 py-3 rounded-xl font-medium inline-flex items-center gap-2"
                                >
                                    <Download size={18} />
                                    Export Batch
                                </button>

                                <button
                                    onClick={handleApplyTemplate}
                                    className="bg-gray-900 text-white px-5 py-3 rounded-xl font-medium"
                                >
                                    Apply Template
                                </button>
                            </div>

                            <div className="border border-gray-100 rounded-2xl overflow-hidden">
                                <div className="max-h-90 overflow-y-auto">
                                    {visibleDocuments.length === 0 ? (
                                        <div className="p-5 text-gray-500">
                                            No documents for this filter
                                        </div>
                                    ) : (
                                        visibleDocuments.map((document) => (
                                            <div
                                                key={document.id}
                                                className="flex items-center justify-between gap-4 p-4 border-b border-gray-100"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <FileText size={20} />
                                                    <div className="min-w-0">
                                                        <p className="font-semibold truncate">
                                                            {document.original_filename}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            Confidence: {document.confidence_score ?? "N/A"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClass(document.status)}`}>
                                                    {document.status}
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

            {batchDetails && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 mb-5">
                        Batch Comparison
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-225">
                            <thead className="bg-gray-50">
                                <tr>
                                    {[
                                        "filename",
                                        "status",
                                        "document_type",
                                        "confidence_score",
                                        ...comparisonFields,
                                    ].map((field) => (
                                        <th
                                            key={field}
                                            className="text-left px-4 py-3 text-sm font-semibold text-gray-700"
                                        >
                                            {field}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonRows.map((row) => (
                                    <tr
                                        key={row.document_id}
                                        className="border-b border-gray-100"
                                    >
                                        {[
                                            "filename",
                                            "status",
                                            "document_type",
                                            "confidence_score",
                                            ...comparisonFields,
                                        ].map((field) => (
                                            <td
                                                key={field}
                                                className="px-4 py-3 text-sm text-gray-700 align-top"
                                            >
                                                {row[field] ?? "N/A"}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </div>
    );
};

export default BatchDashboard;
