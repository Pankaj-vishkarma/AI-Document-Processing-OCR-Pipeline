import { useEffect, useState } from "react";

import { useParams } from "react-router-dom";

import toast from "react-hot-toast";

import axiosInstance from "../../api/axios";

import {
    CheckCircle2,
    RotateCcw,
    XCircle,
    Loader2,
    Download,
    Trash2,
    ShieldCheck,
} from "lucide-react";

const ExtractionReview = () => {

    const { documentId } = useParams();

    const [document, setDocument] = useState(null);

    const [loading, setLoading] = useState(false);

    const [processing, setProcessing] = useState(false);

    const [formData, setFormData] = useState({});

    const fetchDocument = async () => {

        try {

            setLoading(true);

            const response = await axiosInstance.get(
                `/documents/${documentId}`
            );

            setDocument(response.data.document);

            setFormData(
                response.data.document.extracted_data || {}
            );

        } catch (error) {

            toast.error(
                error?.response?.data?.message || "Failed to load document"
            );

        } finally {

            setLoading(false);
        }
    };

    useEffect(() => {

        fetchDocument();

    }, [documentId]);

    const handleExtract = async () => {

        try {

            setProcessing(true);

            await axiosInstance.post("/extract", {
                document_id: documentId,
            });

            toast.success("Extraction completed");

            fetchDocument();

        } catch (error) {

            toast.error(
                error?.response?.data?.message || "Extraction failed"
            );

        } finally {

            setProcessing(false);
        }
    };

    const handleApprove = async () => {

        try {

            await axiosInstance.post(
                `/review/${documentId}/approve`,
                {
                    reviewed_by: "User",
                    notes: "Approved from frontend",
                }
            );

            toast.success("Document approved");

            fetchDocument();

        } catch (error) {

            toast.error(
                error?.response?.data?.message || "Approve failed"
            );
        }
    };

    const handleReject = async () => {

        try {

            await axiosInstance.post(
                `/review/${documentId}/reject`,
                {
                    reviewed_by: "User",
                    notes: "Rejected from frontend",
                }
            );

            toast.success("Document rejected");

            fetchDocument();

        } catch (error) {

            toast.error(
                error?.response?.data?.message || "Reject failed"
            );
        }
    };

    const handleSaveFields = async () => {

        try {

            await axiosInstance.put(
                `/documents/${documentId}`,
                {
                    extracted_data: formData,
                }
            );

            toast.success("Fields updated successfully");

            fetchDocument();

        } catch (error) {

            toast.error(
                error?.response?.data?.message ||
                "Failed to update fields"
            );
        }
    };

    const handleExport = async () => {

        try {

            const response =
                await axiosInstance.post(
                    "/export",
                    {
                        type: "json",
                    },
                    {
                        responseType: "blob",
                    }
                );

            const blob = new Blob(
                [response.data]
            );

            const url =
                window.URL.createObjectURL(
                    blob
                );

            const link =
                document.createElement("a");

            link.href = url;

            link.download =
                "document-export.json";

            document.body.appendChild(
                link
            );

            link.click();

            link.remove();

            toast.success(
                "Export completed"
            );

        } catch (error) {

            toast.error(
                error?.response?.data
                    ?.message ||
                "Export failed"
            );
        }
    };

    const handleDelete = async () => {

        try {

            await axiosInstance.delete(
                `/documents/${documentId}`
            );

            toast.success(
                "Document deleted"
            );

            window.history.back();

        } catch (error) {

            toast.error(
                error?.response?.data
                    ?.message ||
                "Delete failed"
            );
        }
    };

    const handleRetry = async () => {

        try {

            await axiosInstance.post(
                `/review/${documentId}/retry`
            );

            toast.success("Retry processing started");

            fetchDocument();

        } catch (error) {

            toast.error(
                error?.response?.data?.message || "Retry failed"
            );
        }
    };

    const handleChange = (key, value) => {

        setFormData({
            ...formData,
            [key]: value,
        });
    };

    if (loading) {

        return (
            <div className="flex items-center justify-center h-[400px]">

                <Loader2
                    className="animate-spin"
                    size={40}
                />

            </div>
        );
    }

    return (
        <div className="space-y-8">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                <div>

                    <h1 className="text-4xl font-bold text-gray-900">
                        Document Review
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Review OCR extraction and AI processed fields.
                    </p>

                </div>

                <div className="flex flex-wrap gap-3">

                    <button
                        onClick={handleExtract}
                        disabled={processing}
                        className="bg-black text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2"
                    >

                        {processing ? (
                            <Loader2
                                className="animate-spin"
                                size={18}
                            />
                        ) : (
                            <RotateCcw size={18} />
                        )}

                        Extract OCR

                    </button>

                    <button
                        onClick={handleApprove}
                        className="bg-green-600 text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2"
                    >

                        <CheckCircle2 size={18} />

                        Approve

                    </button>

                    <button
                        onClick={handleReject}
                        className="bg-red-600 text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2"
                    >

                        <XCircle size={18} />

                        Reject

                    </button>

                    <button
                        onClick={handleExport}
                        className="bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2"
                    >

                        <Download size={18} />

                        Export

                    </button>

                    <button
                        onClick={handleDelete}
                        className="bg-gray-900 text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2"
                    >

                        <Trash2 size={18} />

                        Delete

                    </button>

                </div>

            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">

                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Document Information
                    </h2>

                    {document && (

                        <div className="space-y-5">

                            <div>

                                <p className="text-sm text-gray-500">
                                    Filename
                                </p>

                                <h3 className="font-semibold text-lg text-gray-900 mt-1">
                                    {document.original_filename}
                                </h3>

                            </div>

                            <div>

                                <p className="text-sm text-gray-500">
                                    Status
                                </p>

                                <span className="inline-block mt-2 px-4 py-2 rounded-full bg-black text-white text-sm">
                                    {document.status}
                                </span>

                            </div>

                            <div>

                                <p className="text-sm text-gray-500">
                                    Document Type
                                </p>

                                <h3 className="font-semibold text-lg text-gray-900 mt-1">
                                    {document.document_type || "Unknown"}
                                </h3>

                            </div>

                            <div>

                                <p className="text-sm text-gray-500">
                                    Confidence Score
                                </p>

                                <div className="mt-2">

                                    {document.confidence_score ? (

                                        <span
                                            className={`
                                            inline-flex items-center gap-2
                                            px-4 py-2 rounded-full text-sm font-medium
                                            ${document.confidence_score >= 0.8
                                                    ? "bg-green-100 text-green-700"
                                                    : document.confidence_score >= 0.5
                                                        ? "bg-yellow-100 text-yellow-700"
                                                        : "bg-red-100 text-red-700"
                                                }
                                        `}
                                        >

                                            <ShieldCheck size={16} />

                                            {Math.round(
                                                document.confidence_score * 100
                                            )}
                                            %

                                        </span>

                                    ) : (

                                        <span className="text-gray-500">
                                            N/A
                                        </span>
                                    )}

                                </div>

                            </div>

                            <div>

                                <p className="text-sm text-gray-500">
                                    Created At
                                </p>

                                <h3 className="font-semibold text-lg text-gray-900 mt-1">

                                    {new Date(
                                        document.created_at
                                    ).toLocaleString()}

                                </h3>

                            </div>

                            <div>

                                <p className="text-sm text-gray-500">
                                    Review Status
                                </p>

                                <span className="inline-block mt-2 px-4 py-2 rounded-full bg-gray-100 text-gray-800 text-sm">

                                    {document.review_status}

                                </span>

                            </div>

                        </div>
                    )}

                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">

                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Extracted Fields
                    </h2>

                    <div className="space-y-5">

                        {Object.keys(formData).length === 0 ? (

                            <div className="text-gray-500">
                                No extracted fields found
                            </div>

                        ) : (

                            Object.entries(formData).map(([key, value]) => (

                                <div key={key}>

                                    <label className="block text-sm font-medium text-gray-600 mb-2">

                                        {key}

                                    </label>

                                    <input
                                        type="text"
                                        value={value || ""}
                                        onChange={(e) =>
                                            handleChange(key, e.target.value)
                                        }
                                        className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                                    />

                                </div>
                            ))
                        )}

                    </div>

                    <button
                        onClick={handleSaveFields}
                        className="mt-8 w-full bg-black text-white py-4 rounded-2xl font-semibold hover:opacity-90 transition"
                    >
                        Save Changes
                    </button>

                    <button
                        onClick={handleRetry}
                        className="mt-8 w-full bg-gray-900 text-white py-4 rounded-2xl font-semibold hover:opacity-90 transition"
                    >
                        Retry Processing
                    </button>

                </div>

            </div>

        </div>
    );
};

export default ExtractionReview;