import { useEffect, useState } from "react";

import axiosInstance from "../../api/axios";

import toast from "react-hot-toast";

import {
    AlertTriangle,
    Play,
    RefreshCw,
    RotateCcw,
    RotateCw,
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
    {
        key: "deskew",
        label: "Deskew",
        description: "Detect and correct skewed scans.",
    },
    {
        key: "denoise",
        label: "Denoise",
        description: "Reduce scan and camera noise.",
    },
    {
        key: "binarize",
        label: "Binarize",
        description: "Convert to high-contrast black and white.",
    },
    {
        key: "contrast_enhance",
        label: "Enhance Contrast",
        description: "Use CLAHE for faded documents.",
    },
    {
        key: "crop_borders",
        label: "Crop Borders",
        description: "Remove page edges and border noise.",
    },
];

const normalizePath = (path) =>
    String(path || "").replace(/\\/g, "/").replace(/^\/+/, "");

const joinUrl = (baseUrl, path) => {
    if (!path) {
        return "";
    }

    if (/^(https?:|blob:|data:)/.test(path)) {
        return path;
    }

    const normalizedPath = normalizePath(path);

    if (!baseUrl) {
        return `/${normalizedPath}`;
    }

    return `${String(baseUrl).replace(/\/+$/, "")}/${normalizedPath}`;
};

const toImagePath = (path) => {
    if (!path) {
        return "";
    }

    if (/^(https?:|blob:|data:)/.test(path)) {
        return path;
    }

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

    const [options, setOptions] = useState(defaultOptions);

    const fetchDocuments = async () => {
        try {
            const response = await axiosInstance.get("/documents");

            setDocuments(response.data?.documents || []);
        } catch (error) {
            toast.error("Failed to load documents");
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const getProcessedImageUrl = () => {
        return processedImage;
    };

    const handleDocumentSelect = (documentId) => {
        const document = documents.find(
            (item) => item.id === Number(documentId)
        );

        setSelectedDocument(document || null);
        setOriginalImage("");
        setProcessedImage("");
        setResolutionInfo(null);
        setComparisonSplit(50);

        if (document?.preprocessing_options) {
            setOptions({
                ...defaultOptions,
                ...document.preprocessing_options,
            });
        } else {
            setOptions(defaultOptions);
        }

        if (document?.id) {
            axiosInstance
                .get(`/preprocess/source/${document.id}`)
                .then((response) => {
                    setOriginalImage(
                        joinUrl(
                            assetBaseUrl,
                            toImagePath(response.data?.source_image)
                        )
                    );
                })
                .catch((error) => {
                    setOriginalImage("");
                    toast.error(
                        error?.response?.data?.message ||
                        "Failed to load original image"
                    );
                });
        }
    };

    const handlePreview = async () => {
        if (!selectedDocument) {
            toast.error("Select a document");
            return;
        }

        try {
            setLoading(true);

            const response = await axiosInstance.post("/preprocess/preview", {
                document_id: selectedDocument.id,
                options,
            });

            if (response.data?.original_image) {
                setOriginalImage(
                    joinUrl(
                        assetBaseUrl,
                        toImagePath(response.data.original_image)
                    )
                );
            }

            setProcessedImage(joinUrl(assetBaseUrl, toImagePath(response.data?.processed_image)));
            setResolutionInfo(response.data?.resolution || null);

            toast.success("Preview generated");
        } catch (error) {
            toast.error(
                error?.response?.data?.message || "Preview failed"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async () => {
        if (!selectedDocument) {
            toast.error("Select a document");
            return;
        }

        try {
            setLoading(true);

            const response = await axiosInstance.post("/preprocess/apply", {
                document_id: selectedDocument.id,
                options,
            });

            if (response.data?.original_image) {
                setOriginalImage(
                    joinUrl(
                        assetBaseUrl,
                        toImagePath(response.data.original_image)
                    )
                );
            }

            setProcessedImage(joinUrl(assetBaseUrl, toImagePath(response.data?.processed_image)));
            setResolutionInfo(response.data?.resolution || null);

            toast.success("Preprocessing saved");
        } catch (error) {
            toast.error(error?.response?.data?.message || "Apply failed");
        } finally {
            setLoading(false);
        }
    };

    const handleReprocess = async () => {
        if (!selectedDocument) {
            toast.error("Select a document");
            return;
        }

        try {
            setLoading(true);

            const response = await axiosInstance.post(
                "/preprocess/reprocess",
                {
                    document_id: selectedDocument.id,
                    options,
                }
            );

            if (response.data?.original_image) {
                setOriginalImage(
                    joinUrl(
                        assetBaseUrl,
                        toImagePath(response.data.original_image)
                    )
                );
            }

            setProcessedImage(joinUrl(assetBaseUrl, toImagePath(response.data?.processed_image)));
            setResolutionInfo(response.data?.resolution || null);

            toast.success(response.data?.message || "OCR reprocessed");
        } catch (error) {
            toast.error(
                error?.response?.data?.message || "Reprocess failed"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        if (!selectedDocument) {
            toast.error("Select a document");
            return;
        }

        try {
            setLoading(true);

            await axiosInstance.post("/preprocess/reset", {
                document_id: selectedDocument.id,
            });

            setOriginalImage("");
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

    const processedImageUrl = getProcessedImageUrl();

    return (
        <div className="space-y-8">
            <div className="rounded-4xl bg-linear-to-r from-slate-950 via-slate-900 to-slate-800 text-white p-8 shadow-xl border border-white/10">
                <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
                    <div className="max-w-3xl space-y-3">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-200">
                            Screen 4
                        </span>

                        <h1 className="text-4xl lg:text-5xl font-black tracking-tight">
                            Preprocessing Preview
                        </h1>

                        <p className="text-slate-300 text-base lg:text-lg leading-7">
                            Compare original versus preprocessed output before OCR,
                            tune the image cleanup steps, then re-run OCR on the
                            processed image.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handlePreview}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            <RefreshCw
                                size={18}
                                className={loading ? "animate-spin" : ""}
                            />
                            Preview
                        </button>

                        <button
                            onClick={handleApply}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            <Play size={18} />
                            Apply
                        </button>

                        <button
                            onClick={handleReprocess}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 font-semibold text-white transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            <RotateCw size={18} />
                            Reprocess OCR
                        </button>

                        <button
                            onClick={handleReset}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-5 py-3 font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            <RotateCcw size={18} />
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {resolutionInfo?.warning ? (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-950 shadow-sm">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 shrink-0" size={20} />
                        <div>
                            <p className="font-semibold">Low-resolution warning</p>
                            <p className="mt-1 text-sm leading-6">
                                {resolutionInfo.warning}
                            </p>
                            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-amber-700">
                                {resolutionInfo.width} x {resolutionInfo.height}
                                {resolutionInfo.dpi ? ` • ${resolutionInfo.dpi} DPI` : ""}
                            </p>
                        </div>
                    </div>
                </div>
            ) : null}

            <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
                <label className="mb-3 block text-sm font-medium text-slate-600">
                    Select Document
                </label>

                <select
                    value={selectedDocument?.id || ""}
                    onChange={(event) => handleDocumentSelect(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 outline-none transition focus:border-slate-400"
                >
                    <option value="">Choose document</option>

                    {documents.map((document) => (
                        <option key={document.id} value={document.id}>
                            {document.original_filename}
                        </option>
                    ))}
                </select>

                {selectedDocument ? (
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        <span className="rounded-full bg-slate-100 px-3 py-2">
                            {selectedDocument.status || "uploaded"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-2">
                            {selectedDocument.file_type || "file"}
                        </span>
                        {selectedDocument.preprocessed_path ? (
                            <span className="rounded-full bg-emerald-50 px-3 py-2 text-emerald-700">
                                Saved preprocessing available
                            </span>
                        ) : null}
                    </div>
                ) : null}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">
                                Original Image
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Source document as uploaded.
                            </p>
                        </div>
                    </div>

                    <div className="flex h-125 items-center justify-center overflow-hidden rounded-3xl bg-slate-100">
                        {originalImage ? (
                            <img
                                src={originalImage}
                                alt="Original"
                                className="h-full w-full object-contain"
                            />
                        ) : selectedDocument ? (
                            <div className="text-slate-500">
                                Loading original image...
                            </div>
                        ) : (
                            <div className="text-slate-500">
                                Select a document
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">
                                Before / After Preview
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Drag the slider to compare the original and
                                preprocessed images.
                            </p>
                        </div>
                    </div>

                    <div className="relative h-125 overflow-hidden rounded-3xl bg-slate-100">
                        {selectedDocument ? (
                            <>
                                {originalImage ? (
                                    <img
                                        src={originalImage}
                                        alt="Original comparison"
                                        className="absolute inset-0 h-full w-full object-contain bg-slate-100"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-500">
                                        Loading original image...
                                    </div>
                                )}

                                {processedImageUrl ? (
                                    <div
                                        className="absolute inset-0 overflow-hidden"
                                        style={buildComparisonStyle(
                                            comparisonSplit
                                        )}
                                    >
                                        <img
                                            src={processedImageUrl}
                                            alt="Processed comparison"
                                            className="h-full w-full object-contain bg-slate-100"
                                        />
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100/90 text-slate-500">
                                        Generate preview
                                    </div>
                                )}

                                {processedImageUrl ? (
                                    <div
                                        className="absolute inset-y-0 w-1 bg-white/90 shadow-[0_0_0_1px_rgba(15,23,42,0.15)]"
                                        style={{ left: `${comparisonSplit}%` }}
                                    />
                                ) : null}

                                <div className="absolute left-4 top-4 rounded-full bg-slate-950/80 px-3 py-2 text-xs font-semibold text-white backdrop-blur">
                                    Before
                                </div>

                                <div className="absolute right-4 top-4 rounded-full bg-emerald-500/90 px-3 py-2 text-xs font-semibold text-white backdrop-blur">
                                    After
                                </div>

                                <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/90 p-4 shadow-lg backdrop-blur">
                                    <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                                        <span className="uppercase tracking-[0.2em] text-xs text-slate-500">
                                            Compare
                                        </span>
                                        <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            value={comparisonSplit}
                                            onChange={(event) =>
                                                setComparisonSplit(
                                                    Number(event.target.value)
                                                )
                                            }
                                            className="w-full"
                                        />
                                        <span className="min-w-13 text-right text-slate-900">
                                            {comparisonSplit}%
                                        </span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex h-full items-center justify-center text-slate-500">
                                Select a document
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
                <div className="mb-8 flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">
                            Preprocessing Options
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Choose the cleanup steps that will be applied before OCR.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {optionFields.map((item) => (
                        <label
                            key={item.key}
                            className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 transition hover:border-slate-300 hover:bg-slate-100"
                        >
                            <div>
                                <span className="block font-semibold text-slate-800">
                                    {item.label}
                                </span>
                                <span className="mt-1 block text-sm text-slate-500">
                                    {item.description}
                                </span>
                            </div>

                            <input
                                type="checkbox"
                                checked={Boolean(options[item.key])}
                                onChange={(event) =>
                                    setOptions((previous) => ({
                                        ...previous,
                                        [item.key]: event.target.checked,
                                    }))
                                }
                                className="h-5 w-5"
                            />
                        </label>
                    ))}
                </div>

                <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-4 flex items-center gap-3">
                        <RotateCw size={20} className="text-slate-700" />
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                                Manual Rotation
                            </h3>
                            <p className="text-sm text-slate-500">
                                Use this when auto-deskew misses a tilted document.
                            </p>
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
                        className="w-full"
                    />

                    <p className="mt-3 text-sm font-medium text-slate-600">
                        Current rotation: {options.rotation_angle}°
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PreprocessingPreview;