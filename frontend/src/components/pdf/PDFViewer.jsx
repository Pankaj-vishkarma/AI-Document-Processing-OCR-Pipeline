import { useEffect, useMemo, useRef, useState } from "react";

import {
    ArrowLeft,
    ArrowRight,
    FileText,
    Loader2,
    RefreshCw,
    RotateCcw,
} from "lucide-react";

import toast from "react-hot-toast";

import axiosInstance from "../../api/axios";

import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc =
    new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

const PDFViewer = () => {

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

    const assetBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");

    const uploadBaseUrl = import.meta.env.VITE_UPLOAD_BASE_URL || assetBaseUrl;

    const [documents, setDocuments] = useState([]);

    const [selectedDocument, setSelectedDocument] = useState(null);

    const [pdfData, setPdfData] = useState(null);

    const [loading, setLoading] = useState(false);

    const [viewerLoading, setViewerLoading] = useState(false);

    const [extracting, setExtracting] = useState(false);

    const [pageNumber, setPageNumber] = useState(1);

    const [jumpValue, setJumpValue] = useState("1");

    const imageRef = useRef(null);

    const [imageSize, setImageSize] = useState({
        naturalWidth: 1,
        naturalHeight: 1,
        renderedWidth: 1,
        renderedHeight: 1,
    });

    const pages = pdfData?.pages || [];

    const summary = pdfData?.summary || {};

    const currentPage = useMemo(
        () =>
            pages.find(
                (page) => page.page === pageNumber
            ) || pages[0],
        [pages, pageNumber]
    );

    const totalPages =
        pages.length ||
        selectedDocument?.total_pages ||
        1;

    const selectedPdfUrl = selectedDocument
        ? `${uploadBaseUrl}/${selectedDocument.filename}`
        : "";

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

    const fetchDocuments = async () => {

        try {

            setLoading(true);

            const response = await axiosInstance.get("/documents");

            const pdfDocuments =
                response.data.documents?.filter(
                    (document) =>
                        document.file_type?.toLowerCase() ===
                        "pdf"
                ) || [];

            setDocuments(pdfDocuments);

            if (
                pdfDocuments.length > 0 &&
                !selectedDocument
            ) {

                setSelectedDocument(pdfDocuments[0]);
            }

        } catch (error) {

            toast.error(
                error?.response?.data?.message ||
                "Failed to fetch PDF documents"
            );

        } finally {

            setLoading(false);
        }
    };

    const fetchPdfData = async (documentId) => {

        if (!documentId) {
            return;
        }

        try {

            setViewerLoading(true);

            const response = await axiosInstance.get(
                `/documents/${documentId}/pdf`
            );

            setPdfData(response.data);

            const firstPage =
                response.data.pages?.[0]?.page || 1;

            setPageNumber(firstPage);

            setJumpValue(String(firstPage));

        } catch (error) {

            toast.error(
                error?.response?.data?.message ||
                "Failed to load PDF viewer data"
            );

            setPdfData(null);

        } finally {

            setViewerLoading(false);
        }
    };

    useEffect(() => {

        fetchDocuments();

    }, []);

    useEffect(() => {

        if (selectedDocument?.id) {
            fetchPdfData(selectedDocument.id);
        }

    }, [selectedDocument?.id]);

    useEffect(() => {

        setJumpValue(String(pageNumber));

    }, [pageNumber]);

    useEffect(() => {

        window.addEventListener("resize", updateImageSize);

        return () => {
            window.removeEventListener("resize", updateImageSize);
        };

    }, []);

    const handleExtract = async () => {

        if (!selectedDocument?.id) {
            toast.error("Select a PDF first");
            return;
        }

        try {

            setExtracting(true);

            await axiosInstance.post("/extract", {
                document_id: selectedDocument.id,
            });

            toast.success("PDF extraction completed");

            await fetchDocuments();

            await fetchPdfData(selectedDocument.id);

        } catch (error) {

            toast.error(
                error?.response?.data?.message ||
                "PDF extraction failed"
            );

        } finally {

            setExtracting(false);
        }
    };

    const goToPage = (page) => {

        const nextPage = Math.min(
            Math.max(Number(page) || 1, 1),
            totalPages
        );

        setPageNumber(nextPage);
    };

    const handleJump = () => {

        goToPage(jumpValue);
    };

    const renderValue = (value) => {

        if (
            value &&
            typeof value === "object"
        ) {

            return JSON.stringify(value, null, 2);
        }

        return value || "N/A";
    };

    const currentPageImageUrl = currentPage?.processed_path
        ? `${assetBaseUrl}/${currentPage.processed_path}`
        : "";

    const scaleX =
        imageSize.renderedWidth / imageSize.naturalWidth;

    const scaleY =
        imageSize.renderedHeight / imageSize.naturalHeight;

    return (
        <div className="space-y-6">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                <div>

                    <h1 className="text-4xl font-bold text-gray-900">
                        PDF Viewer
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Page-level OCR, bounding boxes, extracted data, and merged document output.
                    </p>

                </div>

                <div className="flex flex-wrap gap-3">

                    <button
                        onClick={fetchDocuments}
                        className="flex items-center justify-center gap-2 bg-gray-100 text-black px-5 py-3 rounded-xl font-medium hover:bg-gray-200 transition"
                    >
                        <RefreshCw size={18} />
                        Refresh
                    </button>

                    <button
                        onClick={handleExtract}
                        disabled={
                            extracting ||
                            !selectedDocument
                        }
                        className="flex items-center justify-center gap-2 bg-black text-white px-5 py-3 rounded-xl font-medium hover:opacity-90 transition disabled:opacity-40"
                    >
                        {extracting ? (
                            <Loader2
                                size={18}
                                className="animate-spin"
                            />
                        ) : (
                            <RotateCcw size={18} />
                        )}
                        Extract OCR
                    </button>

                </div>

            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">

                <label className="block text-sm font-medium text-gray-600 mb-3">
                    Select PDF
                </label>

                <select
                    value={selectedDocument?.id || ""}
                    onChange={(event) => {
                        const document = documents.find(
                            (item) =>
                                item.id ===
                                Number(event.target.value)
                        );

                        setSelectedDocument(document || null);
                    }}
                    className="w-full bg-gray-100 rounded-2xl px-4 py-4 outline-none"
                >
                    <option value="">
                        Choose PDF document
                    </option>

                    {documents.map((document) => (
                        <option
                            key={document.id}
                            value={document.id}
                        >
                            {document.original_filename}
                        </option>
                    ))}
                </select>

            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[180px_1fr_360px] gap-6">

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

                    <div className="px-4 py-4 border-b border-gray-100">
                        <h2 className="font-bold text-gray-900">
                            Pages
                        </h2>
                    </div>

                    <div className="max-h-[760px] overflow-y-auto p-3 space-y-3">

                        {loading || viewerLoading ? (

                            <div className="py-12 flex justify-center">
                                <Loader2 className="animate-spin" />
                            </div>

                        ) : pages.length === 0 ? (

                            <div className="text-sm text-gray-500 p-3">
                                No page data available
                            </div>

                        ) : (

                            pages.map((page) => (

                                <button
                                    key={page.page}
                                    onClick={() =>
                                        goToPage(page.page)
                                    }
                                    className={`w-full text-left rounded-2xl border overflow-hidden transition ${pageNumber === page.page
                                        ? "border-black"
                                        : "border-gray-200 hover:border-gray-400"
                                        }`}
                                >
                                    <div className="px-3 py-2 bg-gray-50 flex items-center justify-between gap-2">
                                        <span className="text-xs font-semibold text-gray-800">
                                            Page {page.page}
                                        </span>
                                        <span className={`text-[10px] px-2 py-1 rounded-full ${page.extraction_status === "completed"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-yellow-100 text-yellow-700"
                                            }`}>
                                            {page.extraction_status}
                                        </span>
                                    </div>

                                    <div className="h-28 bg-white flex items-center justify-center">
                                        {page.processed_path ? (
                                            <img
                                                src={`${assetBaseUrl}/${page.processed_path}`}
                                                alt={`Page ${page.page}`}
                                                className="max-h-full max-w-full object-contain"
                                            />
                                        ) : selectedPdfUrl ? (
                                            <Document file={selectedPdfUrl}>
                                                <Page
                                                    pageNumber={page.page}
                                                    width={110}
                                                    renderTextLayer={false}
                                                    renderAnnotationLayer={false}
                                                />
                                            </Document>
                                        ) : (
                                            <FileText size={28} />
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                </div>

                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">

                    <div className="min-h-[760px] bg-gray-100 rounded-3xl overflow-auto flex items-center justify-center p-4">

                        {!selectedDocument ? (

                            <div className="text-gray-500">
                                Select a PDF
                            </div>

                        ) : viewerLoading ? (

                            <Loader2 className="animate-spin" />

                        ) : currentPageImageUrl ? (

                            <div className="relative inline-block max-w-full">
                                <img
                                    ref={imageRef}
                                    src={currentPageImageUrl}
                                    alt={`Page ${pageNumber}`}
                                    onLoad={updateImageSize}
                                    className="block max-w-full max-h-[720px] object-contain"
                                />

                                {currentPage?.ocr_coordinates?.map(
                                    (item, index) => {

                                        const rect = item.rect_bbox;

                                        if (!rect) {
                                            return null;
                                        }

                                        return (
                                            <div
                                                key={index}
                                                title={item.text}
                                                className="absolute border-2 border-green-500 bg-green-500/10"
                                                style={{
                                                    left: `${rect.x * scaleX}px`,
                                                    top: `${rect.y * scaleY}px`,
                                                    width: `${rect.width * scaleX}px`,
                                                    height: `${rect.height * scaleY}px`,
                                                }}
                                            />
                                        );
                                    }
                                )}
                            </div>

                        ) : (

                            <Document file={selectedPdfUrl}>
                                <Page
                                    pageNumber={pageNumber}
                                    width={760}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                />
                            </Document>
                        )}

                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-3">

                        <button
                            disabled={pageNumber <= 1}
                            onClick={() =>
                                goToPage(pageNumber - 1)
                            }
                            className="bg-black text-white px-4 py-2 rounded-xl disabled:opacity-40 inline-flex items-center gap-2"
                        >
                            <ArrowLeft size={16} />
                            Previous
                        </button>

                        <span className="font-medium">
                            Page {pageNumber} of {totalPages}
                        </span>

                        <input
                            type="number"
                            min={1}
                            max={totalPages}
                            value={jumpValue}
                            onChange={(event) =>
                                setJumpValue(event.target.value)
                            }
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    handleJump();
                                }
                            }}
                            className="w-24 bg-gray-100 rounded-xl px-4 py-2 outline-none text-center"
                        />

                        <button
                            onClick={handleJump}
                            className="bg-gray-900 text-white px-4 py-2 rounded-xl"
                        >
                            Jump
                        </button>

                        <button
                            disabled={pageNumber >= totalPages}
                            onClick={() =>
                                goToPage(pageNumber + 1)
                            }
                            className="bg-black text-white px-4 py-2 rounded-xl disabled:opacity-40 inline-flex items-center gap-2"
                        >
                            Next
                            <ArrowRight size={16} />
                        </button>

                    </div>

                </div>

                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">

                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        Page Extracted Data
                    </h2>

                    <div className="space-y-4 max-h-[760px] overflow-y-auto">

                        <div className="bg-gray-50 rounded-2xl p-4">
                            <p className="text-sm text-gray-500">
                                OCR Text
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                                {currentPage?.ocr_text ||
                                    "No OCR text for this page"}
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-4">
                            <p className="text-sm text-gray-500">
                                Extracted Fields
                            </p>
                            <pre className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                                {renderValue(
                                    currentPage?.extracted_data
                                )}
                            </pre>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 rounded-2xl p-4">
                                <p className="text-sm text-gray-500">
                                    Regions
                                </p>
                                <p className="mt-2 font-semibold">
                                    {currentPage?.total_text_regions || 0}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-2xl p-4">
                                <p className="text-sm text-gray-500">
                                    Tables
                                </p>
                                <p className="mt-2 font-semibold">
                                    {currentPage?.total_tables || 0}
                                </p>
                            </div>
                        </div>

                    </div>

                </div>

            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">

                <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Document Summary
                </h2>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-2xl p-4">
                        <p className="text-sm text-gray-500">
                            Pages
                        </p>
                        <p className="mt-2 font-semibold">
                            {summary.completed_pages || 0} / {summary.total_pages || totalPages}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-4">
                        <p className="text-sm text-gray-500">
                            Text Regions
                        </p>
                        <p className="mt-2 font-semibold">
                            {summary.total_text_regions || 0}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-4">
                        <p className="text-sm text-gray-500">
                            Tables
                        </p>
                        <p className="mt-2 font-semibold">
                            {summary.total_tables || 0}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-4">
                        <p className="text-sm text-gray-500">
                            Status
                        </p>
                        <p className="mt-2 font-semibold">
                            {selectedDocument?.status || "N/A"}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-2xl p-4">
                        <p className="text-sm text-gray-500 mb-2">
                            Cross-page Merged Data
                        </p>
                        <pre className="whitespace-pre-wrap text-sm text-gray-800 max-h-[300px] overflow-y-auto">
                            {renderValue(summary.merged_data)}
                        </pre>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4">
                        <p className="text-sm text-gray-500 mb-2">
                            Merged Tables
                        </p>
                        <pre className="whitespace-pre-wrap text-sm text-gray-800 max-h-[300px] overflow-y-auto">
                            {renderValue(summary.merged_tables)}
                        </pre>
                    </div>
                </div>

            </div>

        </div>
    );
};

export default PDFViewer;
