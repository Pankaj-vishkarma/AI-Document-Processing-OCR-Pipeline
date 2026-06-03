import { useEffect, useState } from "react";
import axiosInstance from "../../api/axios";
import toast from "react-hot-toast";
import {
    AlertTriangle,
    Play,
    RefreshCw,
    RotateCcw,
    RotateCw,
    Loader2,
    ImageIcon,
} from "lucide-react";

const defaultOptions = {
    deskew: true,
    denoise: true,
    binarize: true,
    contrast_enhance: true,
    crop_borders: true,
    rotation_angle: 0,
};

const optionFields = [
    { key: "deskew", label: "Deskew", description: "Detect and correct skewed scans." },
    { key: "denoise", label: "Denoise", description: "Reduce scan and camera noise." },
    { key: "binarize", label: "Binarize", description: "Convert to high-contrast black and white." },
    { key: "contrast_enhance", label: "Enhance Contrast", description: "Use CLAHE for faded documents." },
    { key: "crop_borders", label: "Crop Borders", description: "Remove page edges and border noise." },
];

const normalizePath = (path) =>
    String(path || "").replace(/\\/g, "/").replace(/^\/+/, "");

const joinUrl = (baseUrl, path) => {
    if (!path) return "";
    if (/^(https?:|blob:|data:)/.test(path)) return path;
    const normalizedPath = normalizePath(path);
    if (!baseUrl) return `/${normalizedPath}`;
    return `${String(baseUrl).replace(/\/+$/, "")}/${normalizedPath}`;
};

const toImagePath = (path) => {
    if (!path) return "";
    if (/^(https?:|blob:|data:)/.test(path)) return path;
    return normalizePath(path).startsWith("/")
        ? normalizePath(path)
        : `/${normalizePath(path)}`;
};

const buildComparisonStyle = (split) => ({
    clipPath: `inset(0 ${100 - split}% 0 0)`,
});

const PreprocessingPreview = () => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
    const assetBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");

    const [documents, setDocuments] = useState([]);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [originalImage, setOriginalImage] = useState("");
    const [processedImage, setProcessedImage] = useState("");
    const [resolutionInfo, setResolutionInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [comparisonSplit, setComparisonSplit] = useState(50);
    const isFailed = selectedDocument?.status === "failed";
    const [options, setOptions] = useState(defaultOptions);

    const fetchDocuments = async () => {
        try {
            const response = await axiosInstance.get("/documents", {
                params: { page: 1, limit: 1000 },
            });
            setDocuments(response.data?.documents || []);
        } catch (error) {
            toast.error("Failed to load documents");
        }
    };

    useEffect(() => { fetchDocuments(); }, []);

    const handleDocumentSelect = (documentId) => {
        const document = documents.find((item) => item.id === Number(documentId));
        setSelectedDocument(document || null);
        setOriginalImage("");
        setProcessedImage("");
        setResolutionInfo(null);
        setComparisonSplit(50);
        if (document?.preprocessing_options) {
            setOptions({ ...defaultOptions, ...document.preprocessing_options });
        } else {
            setOptions(defaultOptions);
        }
        if (document?.id) {
            axiosInstance
                .get(`/preprocess/source/${document.id}`)
                .then((response) => {
                    setOriginalImage(joinUrl(assetBaseUrl, toImagePath(response.data?.source_image)));
                })
                .catch((error) => {
                    setOriginalImage("");
                    toast.error(error?.response?.data?.message || "Failed to load original image");
                });
        }
    };

    const handlePreview = async () => {
        if (!selectedDocument) { toast.error("Select a document"); return; }
        try {
            setLoading(true);
            const response = await axiosInstance.post("/preprocess/preview", {
                document_id: selectedDocument.id,
                options,
            });
            if (response.data?.original_image) {
                setOriginalImage(joinUrl(assetBaseUrl, toImagePath(response.data.original_image)));
            }
            setProcessedImage(joinUrl(assetBaseUrl, toImagePath(response.data?.processed_image)));
            setResolutionInfo(response.data?.resolution || null);
            toast.success("Preview generated");
        } catch (error) {
            toast.error(error?.response?.data?.message || "Preview failed. Make sure the selected document is valid for preprocessing.");
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async () => {
        if (!selectedDocument) { toast.error("Select a document"); return; }
        try {
            setLoading(true);
            const response = await axiosInstance.post("/preprocess/apply", {
                document_id: selectedDocument.id,
                options,
            });
            if (response.data?.original_image) {
                setOriginalImage(joinUrl(assetBaseUrl, toImagePath(response.data.original_image)));
            }
            setProcessedImage(joinUrl(assetBaseUrl, toImagePath(response.data?.processed_image)));
            setResolutionInfo(response.data?.resolution || null);
            toast.success("Preprocessing saved");
        } catch (error) {
            toast.error(error?.response?.data?.message || "Apply failed. Please verify the document and try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleReprocess = async () => {
        if (!selectedDocument) { toast.error("Select a document"); return; }
        try {
            setLoading(true);
            const response = await axiosInstance.post("/preprocess/reprocess", {
                document_id: selectedDocument.id,
                options,
            });
            if (response.data?.original_image) {
                setOriginalImage(joinUrl(assetBaseUrl, toImagePath(response.data.original_image)));
            }
            setProcessedImage(joinUrl(assetBaseUrl, toImagePath(response.data?.processed_image)));
            setResolutionInfo(response.data?.resolution || null);
            toast.success(response.data?.message || "OCR reprocessed");
        } catch (error) {
            toast.error(error?.response?.data?.message || "Reprocess failed. Please check the document or options and try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        if (!selectedDocument) { toast.error("Select a document"); return; }
        try {
            setLoading(true);
            const response = await axiosInstance.post("/preprocess/reset", {
                document_id: selectedDocument.id,
            });
            if (response.data?.original_image) {
                setOriginalImage(joinUrl(assetBaseUrl, toImagePath(response.data.original_image)));
            } else {
                setOriginalImage("");
            }
            setProcessedImage("");
            setResolutionInfo(null);
            setComparisonSplit(50);
            setOptions(defaultOptions);
            toast.success("Preprocessing reset");
        } catch (error) {
            toast.error(error?.response?.data?.message || "Reset failed");
        } finally {
            setLoading(false);
        }
    };

    const processedImageUrl = processedImage;

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

                    {/* Right: action buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePreview}
                            disabled={loading || isFailed}
                            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors text-gray-700 text-sm font-semibold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                            <span className="hidden sm:inline">Preview</span>
                        </button>
                        <button
                            onClick={handleApply}
                            disabled={loading || isFailed}
                            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 transition-colors text-white text-sm font-semibold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            <Play size={14} />
                            <span className="hidden sm:inline">Apply</span>
                        </button>
                        <button
                            onClick={handleReprocess}
                            disabled={loading || isFailed}
                            className="hidden sm:flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 transition-colors text-white text-sm font-semibold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            <RotateCw size={14} />
                            <span className="hidden sm:inline">Reprocess OCR</span>
                        </button>
                        <button
                            onClick={handleReset}
                            disabled={loading || isFailed}
                            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-white border border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors text-red-600 text-sm font-semibold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            <RotateCcw size={14} />
                            <span className="hidden sm:inline">Reset</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">

                {/* Page Title */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Preprocessing Preview</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Compare original vs preprocessed output before OCR, tune cleanup steps, then re-run OCR.</p>
                </div>

                {/* Mobile-only Reprocess button (hidden in header on mobile) */}
                <div className="sm:hidden">
                    <button
                        onClick={handleReprocess}
                        disabled={loading || isFailed}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 transition-colors text-white text-sm font-semibold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <RotateCw size={14} />
                        Reprocess OCR
                    </button>
                </div>

                {/* Resolution Warning */}
                {resolutionInfo?.warning && (
                    <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle size={16} className="text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-amber-800">Low-resolution warning</p>
                                <p className="text-xs text-amber-700 mt-1 leading-relaxed">{resolutionInfo.warning}</p>
                                <p className="text-xs font-semibold text-amber-600 mt-2 uppercase tracking-widest">
                                    {resolutionInfo.width} × {resolutionInfo.height}
                                    {resolutionInfo.dpi ? ` · ${resolutionInfo.dpi} DPI` : ""}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Document Selector */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                        Select Document
                    </label>
                    <select
                        value={selectedDocument?.id || ""}
                        onChange={(event) => handleDocumentSelect(event.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 font-medium outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                    >
                        <option value="">Choose document</option>
                        {documents.map((document) => (
                            <option key={document.id} value={document.id}>
                                {document.original_filename}
                            </option>
                        ))}
                    </select>

                    {selectedDocument && (
                        <div className="mt-4 flex flex-col gap-3">
                            {/* Status badges */}
                            <div className="flex flex-wrap gap-2">
                                <span className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize ${selectedDocument.status === "completed"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : selectedDocument.status === "failed"
                                            ? "bg-red-50 text-red-700 border-red-200"
                                            : selectedDocument.status === "processing"
                                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                                : "bg-blue-50 text-blue-700 border-blue-200"
                                    }`}>
                                    {selectedDocument.status || "uploaded"}
                                </span>
                                <span className="text-xs font-semibold px-3 py-1 rounded-full border bg-gray-50 text-gray-600 border-gray-200 uppercase">
                                    {selectedDocument.file_type || "file"}
                                </span>
                                {selectedDocument.preprocessed_path && (
                                    <span className="text-xs font-semibold px-3 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                                        Saved preprocessing available
                                    </span>
                                )}
                            </div>

                            {/* Failed warning */}
                            {isFailed && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                    <p className="text-sm font-bold text-amber-800">Cannot preprocess a failed document</p>
                                    <p className="mt-1 text-xs text-amber-700 leading-relaxed">
                                        This document has failed processing. Select another document or retry processing from the review queue.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Image Panels */}
                <section>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Image Preview</p>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

                        {/* Original Image */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-bold text-gray-900">Original Image</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">Source document as uploaded.</p>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                                    <ImageIcon size={14} className="text-gray-400" />
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="h-64 sm:h-80 xl:h-96 flex items-center justify-center overflow-hidden rounded-xl bg-gray-50 border border-gray-100">
                                    {originalImage ? (
                                        <img
                                            src={originalImage}
                                            alt="Original"
                                            className="h-full w-full object-contain"
                                        />
                                    ) : selectedDocument ? (
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            <Loader2 size={20} className="animate-spin" />
                                            <p className="text-xs">Loading original image…</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            <ImageIcon size={24} className="text-gray-300" />
                                            <p className="text-xs">Select a document to preview</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Before / After Comparison */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-bold text-gray-900">Before / After Preview</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">Drag the slider to compare original and preprocessed.</p>
                                </div>
                                <div className="flex gap-1.5">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase tracking-widest">Before</span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-widest">After</span>
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="relative h-64 sm:h-80 xl:h-96 overflow-hidden rounded-xl bg-gray-50 border border-gray-100">
                                    {selectedDocument ? (
                                        <>
                                            {originalImage ? (
                                                <img
                                                    src={originalImage}
                                                    alt="Original comparison"
                                                    className="absolute inset-0 h-full w-full object-contain bg-gray-50"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-gray-400">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Loader2 size={20} className="animate-spin" />
                                                        <p className="text-xs">Loading…</p>
                                                    </div>
                                                </div>
                                            )}

                                            {processedImageUrl ? (
                                                <div
                                                    className="absolute inset-0 overflow-hidden"
                                                    style={buildComparisonStyle(comparisonSplit)}
                                                >
                                                    <img
                                                        src={processedImageUrl}
                                                        alt="Processed comparison"
                                                        className="h-full w-full object-contain bg-gray-50"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50/90">
                                                    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm text-center">
                                                        <p className="text-xs font-semibold text-gray-500">Click Preview to generate comparison</p>
                                                    </div>
                                                </div>
                                            )}

                                            {processedImageUrl && (
                                                <div
                                                    className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.12)]"
                                                    style={{ left: `${comparisonSplit}%` }}
                                                />
                                            )}

                                            {/* Slider control */}
                                            <div className="absolute inset-x-3 bottom-3 rounded-xl bg-white/90 backdrop-blur px-4 py-2.5 shadow-sm border border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest shrink-0">Split</span>
                                                    <input
                                                        type="range"
                                                        min={0}
                                                        max={100}
                                                        value={comparisonSplit}
                                                        onChange={(event) => setComparisonSplit(Number(event.target.value))}
                                                        className="w-full accent-blue-600"
                                                    />
                                                    <span className="text-xs font-bold text-gray-900 shrink-0 w-9 text-right">{comparisonSplit}%</span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            <div className="flex flex-col items-center gap-2 text-gray-400">
                                                <ImageIcon size={24} className="text-gray-300" />
                                                <p className="text-xs">Select a document</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Preprocessing Options */}
                <section>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Preprocessing Options</p>
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-5">

                        <p className="text-xs text-gray-500">Choose the cleanup steps applied before OCR runs on this document.</p>

                        {/* Toggle options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {optionFields.map((item) => (
                                <label
                                    key={item.key}
                                    className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 px-4 py-3.5 cursor-pointer transition-all duration-150"
                                >
                                    <div className="min-w-0">
                                        <span className="block text-sm font-semibold text-gray-800">{item.label}</span>
                                        <span className="block text-xs text-gray-500 mt-0.5 leading-relaxed">{item.description}</span>
                                    </div>
                                    <div className="relative flex-shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(options[item.key])}
                                            onChange={(event) =>
                                                setOptions((previous) => ({
                                                    ...previous,
                                                    [item.key]: event.target.checked,
                                                }))
                                            }
                                            className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 rounded-full border border-gray-300 bg-white peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors" />
                                        <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-gray-300 peer-checked:bg-white peer-checked:translate-x-4 transition-all duration-200 shadow-sm" />
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div className="border-t border-gray-100" />

                        {/* Manual Rotation */}
                        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                                    <RotateCw size={14} className="text-gray-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900">Manual Rotation</h3>
                                    <p className="text-xs text-gray-500">Use when auto-deskew misses a tilted document.</p>
                                </div>
                            </div>
                            <input
                                type="range"
                                min={-180}
                                max={180}
                                value={options.rotation_angle}
                                onChange={(event) =>
                                    setOptions((previous) => ({
                                        ...previous,
                                        rotation_angle: Number(event.target.value),
                                    }))
                                }
                                className="w-full accent-blue-600"
                            />
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-400">−180°</span>
                                <span className="text-xs font-bold text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-1">
                                    {options.rotation_angle}°
                                </span>
                                <span className="text-xs text-gray-400">+180°</span>
                            </div>
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
};

export default PreprocessingPreview;