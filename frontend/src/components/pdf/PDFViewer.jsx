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
import { toPublicAssetUrl } from "../../utils/assetUrl";

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
        () => pages.find((page) => page.page === pageNumber) || pages[0],
        [pages, pageNumber]
    );
    const totalPages = pages.length || selectedDocument?.total_pages || 1;
    const isFailed = selectedDocument?.status === "failed";
    const selectedPdfUrl = selectedDocument
        ? toPublicAssetUrl(
            selectedDocument.upload_path || selectedDocument.filename,
            "uploads",
            uploadBaseUrl
        )
        : "";

    const updateImageSize = () => {
        if (!imageRef.current) return;
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
            const response = await axiosInstance.get("/documents", {
                params: { page: 1, limit: 1000 },
            });
            const pdfDocuments =
                response.data.documents?.filter(
                    (document) => document.file_type?.toLowerCase() === "pdf"
                ) || [];
            setDocuments(pdfDocuments);
            if (pdfDocuments.length > 0 && !selectedDocument) {
                setSelectedDocument(pdfDocuments[0]);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to fetch PDF documents");
        } finally {
            setLoading(false);
        }
    };

    const fetchPdfData = async (documentId) => {
        if (!documentId) return;
        try {
            setViewerLoading(true);
            const response = await axiosInstance.get(`/documents/${documentId}/pdf`);
            setPdfData(response.data);
            const firstPage = response.data.pages?.[0]?.page || 1;
            setPageNumber(firstPage);
            setJumpValue(String(firstPage));
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to load PDF viewer data");
            setPdfData(null);
        } finally {
            setViewerLoading(false);
        }
    };

    useEffect(() => { fetchDocuments(); }, []);
    useEffect(() => { if (selectedDocument?.id) fetchPdfData(selectedDocument.id); }, [selectedDocument?.id]);
    useEffect(() => { setJumpValue(String(pageNumber)); }, [pageNumber]);
    useEffect(() => {
        window.addEventListener("resize", updateImageSize);
        return () => window.removeEventListener("resize", updateImageSize);
    }, []);

    const handleExtract = async () => {
        if (!selectedDocument?.id) { toast.error("Select a PDF first"); return; }
        try {
            setExtracting(true);
            await axiosInstance.post("/extract", { document_id: selectedDocument.id });
            toast.success("PDF extraction completed");
            await fetchDocuments();
            await fetchPdfData(selectedDocument.id);
        } catch (error) {
            toast.error(error?.response?.data?.message || "PDF extraction failed");
        } finally {
            setExtracting(false);
        }
    };

    const goToPage = (page) => {
        const nextPage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
        setPageNumber(nextPage);
    };

    const handleJump = () => { goToPage(jumpValue); };

    const renderValue = (value) => {
        if (value && typeof value === "object") return JSON.stringify(value, null, 2);
        return value || "N/A";
    };

    const currentPageImageUrl = currentPage?.processed_path
        ? toPublicAssetUrl(currentPage.processed_path, "processed", assetBaseUrl)
        : "";

    const scaleX = imageSize.renderedWidth / imageSize.naturalWidth;
    const scaleY = imageSize.renderedHeight / imageSize.naturalHeight;

    return (
        <div className="min-h-screen bg-gray-50 font-sans">

            {/* Top Bar */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
                <div className="max-w-screen-xl mx-auto flex items-center justify-between h-16 gap-4">
                    {/* Left */}
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

                    {/* Right actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchDocuments}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors text-gray-700 text-sm font-semibold shadow-sm whitespace-nowrap"
                        >
                            <RefreshCw size={14} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <button
                            onClick={handleExtract}
                            disabled={extracting || !selectedDocument || isFailed}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm font-semibold shadow-sm whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {extracting ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                            <span className="hidden sm:inline">Extract OCR</span>
                            <span className="sm:hidden">Extract</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Page Content */}
            <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">

                {/* Page Title */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">PDF Viewer</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Page-level OCR, bounding boxes, extracted data, and merged document output.</p>
                </div>

                {/* Document Selector */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                        Select PDF
                    </label>
                    <select
                        value={selectedDocument?.id || ""}
                        onChange={(event) => {
                            const document = documents.find(
                                (item) => item.id === Number(event.target.value)
                            );
                            setSelectedDocument(document || null);
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 font-medium outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                    >
                        <option value="">Choose PDF document</option>
                        {documents.map((document) => (
                            <option key={document.id} value={document.id}>
                                {document.original_filename}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Main 3-column grid */}
                <div className="grid grid-cols-1 xl:grid-cols-[200px_1fr_340px] gap-6">

                    {/* Pages Sidebar */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h2 className="text-sm font-bold text-gray-900">Pages</h2>
                            {pages.length > 0 && (
                                <p className="text-xs text-gray-500 mt-0.5">{pages.length} page{pages.length !== 1 ? "s" : ""}</p>
                            )}
                        </div>

                        {/* Mobile: horizontal scroll, Desktop: vertical scroll */}
                        <div className="xl:max-h-[720px] xl:overflow-y-auto">
                            <div className="flex xl:flex-col gap-3 p-3 overflow-x-auto xl:overflow-x-visible">
                                {loading || viewerLoading ? (
                                    <div className="py-12 flex justify-center w-full">
                                        <Loader2 size={20} className="animate-spin text-gray-400" />
                                    </div>
                                ) : pages.length === 0 ? (
                                    <div className="py-10 flex flex-col items-center gap-2 text-center w-full px-4">
                                        <FileText size={24} className="text-gray-300" />
                                        <p className="text-xs text-gray-400">No page data available</p>
                                    </div>
                                ) : (
                                    pages.map((page) => (
                                        <button
                                            key={page.page}
                                            onClick={() => goToPage(page.page)}
                                            className={`flex-shrink-0 xl:flex-shrink w-[120px] xl:w-full text-left rounded-xl border overflow-hidden transition-all duration-150 ${
                                                pageNumber === page.page
                                                    ? "border-blue-600 ring-2 ring-blue-100"
                                                    : "border-gray-200 hover:border-gray-300"
                                            }`}
                                        >
                                            <div className="px-3 py-2 bg-gray-50 flex items-center justify-between gap-1.5">
                                                <span className="text-xs font-semibold text-gray-800">P.{page.page}</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                                    page.extraction_status === "completed"
                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                        : "bg-amber-50 text-amber-700 border border-amber-200"
                                                }`}>
                                                    {page.extraction_status === "completed" ? "Done" : "Pending"}
                                                </span>
                                            </div>
                                            <div className="h-24 bg-white flex items-center justify-center p-1">
                                                {page.processed_path ? (
                                                    <img
                                                        src={toPublicAssetUrl(page.processed_path, "processed", assetBaseUrl)}
                                                        alt={`Page ${page.page}`}
                                                        className="max-h-full max-w-full object-contain rounded"
                                                    />
                                                ) : selectedPdfUrl ? (
                                                    <Document file={selectedPdfUrl}>
                                                        <Page
                                                            pageNumber={page.page}
                                                            width={100}
                                                            renderTextLayer={false}
                                                            renderAnnotationLayer={false}
                                                        />
                                                    </Document>
                                                ) : (
                                                    <FileText size={24} className="text-gray-300" />
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* PDF Viewer Center */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 flex flex-col gap-4">
                        {/* Viewer Area */}
                        <div className="min-h-[320px] sm:min-h-[480px] xl:min-h-[680px] bg-gray-50 rounded-xl border border-gray-100 overflow-auto flex items-center justify-center p-4">
                            {!selectedDocument ? (
                                <div className="flex flex-col items-center gap-3 text-center">
                                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                                        <FileText size={22} className="text-gray-400" />
                                    </div>
                                    <p className="text-sm text-gray-400 font-medium">Select a PDF to view</p>
                                </div>
                            ) : viewerLoading ? (
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 size={24} className="animate-spin text-blue-600" />
                                    <p className="text-xs text-gray-400">Loading page...</p>
                                </div>
                            ) : currentPageImageUrl ? (
                                <div className="relative inline-block max-w-full">
                                    <img
                                        ref={imageRef}
                                        src={currentPageImageUrl}
                                        alt={`Page ${pageNumber}`}
                                        onLoad={updateImageSize}
                                        className="block max-w-full max-h-[640px] object-contain rounded-lg shadow-sm"
                                    />
                                    {currentPage?.ocr_coordinates?.map((item, index) => {
                                        const rect = item.rect_bbox;
                                        if (!rect) return null;
                                        return (
                                            <div
                                                key={index}
                                                title={item.text}
                                                className="absolute border-2 border-emerald-500 bg-emerald-500/10"
                                                style={{
                                                    left: `${rect.x * scaleX}px`,
                                                    top: `${rect.y * scaleY}px`,
                                                    width: `${rect.width * scaleX}px`,
                                                    height: `${rect.height * scaleY}px`,
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            ) : (
                                <Document file={selectedPdfUrl}>
                                    <Page
                                        pageNumber={pageNumber}
                                        width={680}
                                        renderTextLayer={false}
                                        renderAnnotationLayer={false}
                                    />
                                </Document>
                            )}
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                            <button
                                disabled={pageNumber <= 1}
                                onClick={() => goToPage(pageNumber - 1)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                            >
                                <ArrowLeft size={14} />
                                <span className="hidden sm:inline">Previous</span>
                            </button>

                            <span className="text-sm font-medium text-gray-600 px-1">
                                Page <span className="font-bold text-gray-900">{pageNumber}</span> of <span className="font-bold text-gray-900">{totalPages}</span>
                            </span>

                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min={1}
                                    max={totalPages}
                                    value={jumpValue}
                                    onChange={(event) => setJumpValue(event.target.value)}
                                    onKeyDown={(event) => { if (event.key === "Enter") handleJump(); }}
                                    className="w-16 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none text-center text-sm font-medium focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                                />
                                <button
                                    onClick={handleJump}
                                    className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                                >
                                    Go
                                </button>
                            </div>

                            <button
                                disabled={pageNumber >= totalPages}
                                onClick={() => goToPage(pageNumber + 1)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                            >
                                <span className="hidden sm:inline">Next</span>
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Extracted Data Panel */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h2 className="text-sm font-bold text-gray-900">Page Extracted Data</h2>
                            <p className="text-xs text-gray-500 mt-0.5">OCR results for current page</p>
                        </div>

                        <div className="p-4 flex flex-col gap-3 xl:max-h-[680px] xl:overflow-y-auto">
                            {isFailed ? (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                    <h3 className="text-sm font-bold text-amber-800">Processing failed</h3>
                                    <p className="mt-1.5 text-xs leading-relaxed text-amber-700">
                                        OCR text and extracted field data are hidden because this document failed processing. Please retry or review the document status.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">OCR Text</p>
                                        <p className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                                            {currentPage?.ocr_text || "No OCR text for this page"}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Extracted Fields</p>
                                        <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed overflow-x-auto">
                                            {renderValue(currentPage?.extracted_data)}
                                        </pre>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                                            <p className="text-xs text-gray-500 mb-1">Regions</p>
                                            <p className="text-lg font-bold text-gray-900">{currentPage?.total_text_regions || 0}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                                            <p className="text-xs text-gray-500 mb-1">Tables</p>
                                            <p className="text-lg font-bold text-gray-900">{currentPage?.total_tables || 0}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Document Summary */}
                <section>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Document Summary</p>
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">

                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                {
                                    label: "Pages",
                                    val: `${summary.completed_pages || 0} / ${summary.total_pages || totalPages}`,
                                },
                                { label: "Text Regions", val: summary.total_text_regions || 0 },
                                { label: "Tables", val: summary.total_tables || 0 },
                                {
                                    label: "Status",
                                    val: selectedDocument?.status || "N/A",
                                    badge: true,
                                    status: selectedDocument?.status,
                                },
                            ].map(({ label, val, badge, status }) => (
                                <div key={label} className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
                                    <div className="text-xs text-gray-500 mb-1">{label}</div>
                                    {badge ? (
                                        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                                            status === "completed"
                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                : status === "failed"
                                                ? "bg-red-50 text-red-700 border border-red-200"
                                                : status === "processing"
                                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                : "bg-blue-50 text-blue-700 border border-blue-200"
                                        }`}>
                                            {val}
                                        </span>
                                    ) : (
                                        <div className="text-lg font-bold text-gray-900">{val}</div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-gray-100" />

                        {/* Merged Data */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Cross-page Merged Data</p>
                                <pre className="whitespace-pre-wrap text-sm text-gray-800 max-h-64 overflow-y-auto leading-relaxed">
                                    {renderValue(summary.merged_data)}
                                </pre>
                            </div>
                            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Merged Tables</p>
                                <pre className="whitespace-pre-wrap text-sm text-gray-800 max-h-64 overflow-y-auto leading-relaxed">
                                    {renderValue(summary.merged_tables)}
                                </pre>
                            </div>
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
};

export default PDFViewer;