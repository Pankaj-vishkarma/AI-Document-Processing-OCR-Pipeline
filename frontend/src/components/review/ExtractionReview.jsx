import { useEffect, useRef, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

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
    Image as ImageIcon,
} from "lucide-react";

const ExtractionReview = () => {

    const { documentId } = useParams();

    const navigate = useNavigate();

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

    const assetBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");

    const [document, setDocument] = useState(null);

    const [
        reviewDocuments,
        setReviewDocuments,
    ] = useState([]);

    const [loading, setLoading] = useState(false);

    const [processing, setProcessing] = useState(false);

    const [formData, setFormData] = useState({});

    const [
        selectedOCR,
        setSelectedOCR,
    ] = useState(null);

    const [
        imageLoaded,
        setImageLoaded,
    ] = useState(false);

    const imageRef = useRef(null);

    const [
        imageSize,
        setImageSize,
    ] = useState({
        naturalWidth: 1,
        naturalHeight: 1,
        renderedWidth: 1,
        renderedHeight: 1,
    });

    const updateImageSize = () => {

        if (!imageRef.current) {
            return;
        }

        setImageSize({
            naturalWidth: imageRef.current.naturalWidth || 1,
            naturalHeight: imageRef.current.naturalHeight || 1,
            renderedWidth: imageRef.current.clientWidth || 1,
            renderedHeight: imageRef.current.clientHeight || 1,
        });
    };

    const fetchDocument = async () => {

        if (!documentId) {
            return;
        }

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

    const fetchReviewDocuments = async () => {

        try {

            setLoading(true);

            const queueResponse = await axiosInstance.get(
                "/review/queue"
            );

            let documents =
                queueResponse.data?.documents || [];

            if (documents.length === 0) {

                const documentsResponse =
                    await axiosInstance.get(
                        "/documents"
                    );

                documents =
                    documentsResponse.data
                        ?.documents || [];
            }

            setReviewDocuments(documents);

        } catch (error) {

            toast.error(
                error?.response?.data?.message ||
                "Failed to load documents"
            );

        } finally {

            setLoading(false);
        }
    };

    useEffect(() => {

        if (documentId) {
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

        return () => {
            window.removeEventListener("resize", updateImageSize);
        };

    }, []);

    const handleExtract = async () => {

        if (!documentId) {
            toast.error("Select a document first");
            return;
        }

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

        if (!documentId) {
            toast.error("Select a document first");
            return;
        }

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

        if (!documentId) {
            toast.error("Select a document first");
            return;
        }

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

        if (!documentId) {
            toast.error("Select a document first");
            return;
        }

        try {

            await axiosInstance.put(
                `/documents/${documentId}/fields`,
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

        if (!documentId) {
            toast.error("Select a document first");
            return;
        }

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

        if (!documentId) {
            toast.error("Select a document first");
            return;
        }

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

    if (!documentId) {

        return (
            <div className="space-y-8">

                <div>

                    <h1 className="text-4xl font-bold text-gray-900">
                        Document Review
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Select a document to review OCR extraction and AI processed fields.
                    </p>

                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[760px]">

                            <thead className="bg-gray-50 border-b border-gray-100">

                                <tr>

                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                                        Document
                                    </th>

                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                                        Status
                                    </th>

                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                                        Review
                                    </th>

                                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">
                                        Action
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {reviewDocuments.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="4"
                                            className="text-center py-16 text-gray-500"
                                        >
                                            No documents available for review
                                        </td>

                                    </tr>

                                ) : (

                                    reviewDocuments.map((item) => (

                                        <tr
                                            key={item.id}
                                            className="border-b border-gray-100 hover:bg-gray-50 transition"
                                        >

                                            <td className="px-6 py-5">

                                                <div>

                                                    <h3 className="font-semibold text-gray-900 break-all">
                                                        {item.original_filename}
                                                    </h3>

                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {item.document_type || "Unknown"}
                                                    </p>

                                                </div>

                                            </td>

                                            <td className="px-6 py-5 text-gray-700">
                                                {item.status}
                                            </td>

                                            <td className="px-6 py-5 text-gray-700">
                                                {item.review_status || "pending_review"}
                                            </td>

                                            <td className="px-6 py-5 text-right">

                                                <button
                                                    onClick={() =>
                                                        navigate(
                                                            `/review/${item.id}`
                                                        )
                                                    }
                                                    className="bg-black text-white px-5 py-3 rounded-xl font-semibold hover:opacity-90 transition"
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

            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">

                    <div className="flex items-center justify-between mb-6">

                        <div>

                            <h2 className="text-2xl font-bold text-gray-900">
                                Document Preview
                            </h2>

                            <p className="text-sm text-gray-500 mt-1">
                                OCR bounding boxes and extraction regions
                            </p>

                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-500">

                            <ImageIcon size={18} />

                            OCR Regions:
                            {" "}
                            {document?.ocr_coordinates?.length || 0}

                        </div>

                    </div>

                    {document ? (

                        <div className="space-y-6">

                            <div className="bg-gray-100 rounded-3xl overflow-hidden min-h-[700px] flex items-center justify-center">

                                <div className="relative inline-block max-w-full">

                                    <img
                                        ref={imageRef}
                                        src={
                                            document.processed_path
                                                ? `${assetBaseUrl}/${document.processed_path}`
                                                : `${import.meta.env.VITE_UPLOAD_BASE_URL}/${document.filename}`
                                        }
                                        alt="Document"
                                        onLoad={() => {
                                            setImageLoaded(true);
                                            updateImageSize();
                                        }}
                                        className="block max-w-full max-h-[700px] object-contain"
                                    />

                                    {imageLoaded &&
                                        document?.ocr_coordinates?.map(
                                            (
                                                item,
                                                index
                                            ) => {

                                                const rect =
                                                    item.rect_bbox;

                                                if (!rect) {
                                                    return null;
                                                }

                                                const scaleX =
                                                    imageSize.renderedWidth /
                                                    imageSize.naturalWidth;

                                                const scaleY =
                                                    imageSize.renderedHeight /
                                                    imageSize.naturalHeight;

                                                return (

                                                    <div
                                                        key={index}
                                                        onClick={() =>
                                                            setSelectedOCR(
                                                                index
                                                            )
                                                        }
                                                        title={item.text}
                                                        className={`
                                            absolute border-2 cursor-pointer transition-all duration-200
                                            ${selectedOCR === index
                                                                ? "border-green-500 bg-green-500/20"
                                                                : item.confidence >= 0.8
                                                                    ? "border-green-400 bg-green-400/10"
                                                                    : item.confidence >= 0.5
                                                                        ? "border-yellow-400 bg-yellow-400/10"
                                                                        : "border-red-400 bg-red-400/10"
                                                            }
                                        `}
                                                        style={{
                                                            left: `${rect.x * scaleX}px`,
                                                            top: `${rect.y * scaleY}px`,
                                                            width: `${rect.width * scaleX}px`,
                                                            height: `${rect.height * scaleY}px`,
                                                        }}
                                                    >

                                                        <div className="absolute -top-7 left-0 bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">

                                                            {item.text}

                                                        </div>

                                                    </div>
                                                );
                                            }
                                        )}

                                </div>

                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

                                <div className="bg-gray-50 rounded-2xl p-4">

                                    <p className="text-sm text-gray-500">
                                        Filename
                                    </p>

                                    <h3 className="font-semibold text-gray-900 mt-2 break-all">

                                        {document.original_filename}

                                    </h3>

                                </div>

                                <div className="bg-gray-50 rounded-2xl p-4">

                                    <p className="text-sm text-gray-500">
                                        Status
                                    </p>

                                    <span className="inline-block mt-2 px-4 py-2 rounded-full bg-black text-white text-sm">

                                        {document.status}

                                    </span>

                                </div>

                                <div className="bg-gray-50 rounded-2xl p-4">

                                    <p className="text-sm text-gray-500">
                                        Type
                                    </p>

                                    <h3 className="font-semibold text-gray-900 mt-2">

                                        {document.document_type || "Unknown"}

                                    </h3>

                                </div>

                                <div className="bg-gray-50 rounded-2xl p-4">

                                    <p className="text-sm text-gray-500">
                                        Confidence
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

                                <div className="bg-gray-50 rounded-2xl p-4">

                                    <p className="text-sm text-gray-500">
                                        Review Status
                                    </p>

                                    <span className="inline-block mt-2 px-4 py-2 rounded-full bg-gray-200 text-gray-800 text-sm">

                                        {document.review_status}

                                    </span>

                                </div>

                                <div className="bg-gray-50 rounded-2xl p-4">

                                    <p className="text-sm text-gray-500">
                                        Created At
                                    </p>

                                    <h3 className="font-semibold text-gray-900 mt-2 text-sm">

                                        {new Date(
                                            document.created_at
                                        ).toLocaleString()}

                                    </h3>

                                </div>

                            </div>

                        </div>

                    ) : (

                        <div className="h-[500px] flex items-center justify-center text-gray-500">

                            No document selected

                        </div>
                    )}

                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">

                    <div className="flex items-center justify-between mb-6">

                        <div>

                            <h2 className="text-2xl font-bold text-gray-900">
                                Extracted Fields
                            </h2>

                            <p className="text-sm text-gray-500 mt-1">
                                Editable OCR extracted values
                            </p>

                        </div>

                        <div className="text-sm text-gray-500">

                            Total Fields:
                            {" "}
                            {Object.keys(formData).length}

                        </div>

                    </div>

                    <div className="space-y-5 max-h-[850px] overflow-y-auto pr-2">

                        {Object.keys(formData).length === 0 ? (

                            <div className="text-gray-500">
                                No extracted fields found
                            </div>

                        ) : (

                            Object.entries(formData).map(
                                (
                                    [key, value],
                                    index
                                ) => (

                                    <div
                                        key={key}
                                        onClick={() =>
                                            setSelectedOCR(
                                                index
                                            )
                                        }
                                        className={`
                                border rounded-2xl p-4 transition-all duration-200
                                ${selectedOCR === index
                                                ? "border-green-500 bg-green-50"
                                                : "border-gray-200 bg-white"
                                            }
                            `}
                                    >

                                        <div className="flex items-center justify-between mb-3">

                                            <label className="block text-sm font-semibold text-gray-700">

                                                {key}

                                            </label>

                                            <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700">

                                                OCR Field

                                            </span>

                                        </div>

                                        <input
                                            type="text"
                                            value={value || ""}
                                            onChange={(e) =>
                                                handleChange(
                                                    key,
                                                    e.target.value
                                                )
                                            }
                                            className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                                        />

                                    </div>
                                )
                            )
                        )}

                    </div>

                    <div className="mt-8 space-y-4">

                        <button
                            onClick={handleSaveFields}
                            className="w-full bg-black text-white py-4 rounded-2xl font-semibold hover:opacity-90 transition"
                        >
                            Save Changes
                        </button>

                        <button
                            onClick={handleRetry}
                            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-semibold hover:opacity-90 transition"
                        >
                            Retry Processing
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default ExtractionReview;
