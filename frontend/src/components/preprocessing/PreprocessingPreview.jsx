import { useEffect, useState } from "react";

import axiosInstance from "../../api/axios";

import toast from "react-hot-toast";

import {
    RefreshCw,
    RotateCw,
} from "lucide-react";

const PreprocessingPreview = () => {

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

    const assetBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");

    const [documents, setDocuments] =
        useState([]);

    const [
        selectedDocument,
        setSelectedDocument,
    ] = useState(null);

    const [
        processedImage,
        setProcessedImage,
    ] = useState("");

    const [loading, setLoading] =
        useState(false);

    const [options, setOptions] =
        useState({
            deskew: true,
            denoise: true,
            binarize: true,
            contrast_enhance: true,
            crop_borders: true,
            rotation_angle: 0,
        });

    const fetchDocuments =
        async () => {

            try {

                const response =
                    await axiosInstance.get(
                        "/documents"
                    );

                setDocuments(
                    response.data
                        ?.documents || []
                );

            } catch (error) {

                toast.error(
                    "Failed to load documents"
                );
            }
        };

    useEffect(() => {

        fetchDocuments();

    }, []);

    const handlePreview =
        async () => {

            if (
                !selectedDocument
            ) {

                toast.error(
                    "Select a document"
                );

                return;
            }

            try {

                setLoading(true);

                const response =
                    await axiosInstance.post(
                        "/preprocess/preview",
                        {
                            document_id:
                                selectedDocument.id,
                            options,
                        }
                    );

                setProcessedImage(
                    response.data
                        ?.processed_image
                );

                toast.success(
                    "Preview generated"
                );

            } catch (error) {

                toast.error(
                    error?.response?.data
                        ?.message ||
                    "Preview failed"
                );

            } finally {

                setLoading(false);
            }
        };

    const handleApply =
        async () => {

            if (
                !selectedDocument
            ) {

                toast.error(
                    "Select a document"
                );

                return;
            }

            try {

                setLoading(true);

                await axiosInstance.post(
                    "/preprocess/apply",
                    {
                        document_id:
                            selectedDocument.id,
                        options,
                    }
                );

                toast.success(
                    "Preprocessing applied"
                );

            } catch (error) {

                toast.error(
                    error?.response?.data
                        ?.message ||
                    "Apply failed"
                );

            } finally {

                setLoading(false);
            }
        };

    const handleReset =
        async () => {

            if (
                !selectedDocument
            ) {

                toast.error(
                    "Select a document"
                );

                return;
            }

            try {

                setLoading(true);

                await axiosInstance.post(
                    "/preprocess/reset",
                    {
                        document_id:
                            selectedDocument.id,
                    }
                );

                setProcessedImage("");

                setOptions({
                    deskew: true,
                    denoise: true,
                    binarize: true,
                    contrast_enhance: true,
                    crop_borders: true,
                    rotation_angle: 0,
                });

                toast.success(
                    "Preprocessing reset"
                );

            } catch (error) {

                toast.error(
                    error?.response?.data
                        ?.message ||
                    "Reset failed"
                );

            } finally {

                setLoading(false);
            }
        };

    return (

        <div className="space-y-8">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                <div>

                    <h1 className="text-4xl font-bold text-gray-900">
                        Preprocessing Preview
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Configure image preprocessing before OCR extraction.
                    </p>

                </div>

                <div className="flex flex-wrap gap-3">

                    <button
                        onClick={handlePreview}
                        disabled={loading}
                        className="bg-black text-white px-5 py-3 rounded-2xl font-semibold flex items-center gap-2 hover:opacity-90 transition"
                    >

                        <RefreshCw
                            size={18}
                            className={
                                loading
                                    ? "animate-spin"
                                    : ""
                            }
                        />

                        Preview

                    </button>

                    <button
                        onClick={handleApply}
                        disabled={loading}
                        className="bg-green-600 text-white px-5 py-3 rounded-2xl font-semibold hover:opacity-90 transition"
                    >
                        Apply
                    </button>

                    <button
                        onClick={handleReset}
                        disabled={loading}
                        className="bg-red-600 text-white px-5 py-3 rounded-2xl font-semibold hover:opacity-90 transition"
                    >
                        Reset
                    </button>

                </div>

            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">

                <label className="block text-sm font-medium text-gray-600 mb-3">

                    Select Document

                </label>

                <select
                    value={
                        selectedDocument?.id || ""
                    }
                    onChange={(e) => {

                        const document =
                            documents.find(
                                (doc) =>
                                    doc.id ===
                                    Number(
                                        e.target.value
                                    )
                            );

                        setSelectedDocument(
                            document
                        );

                        setProcessedImage("");

                    }}
                    className="w-full bg-gray-100 rounded-2xl px-4 py-4 outline-none"
                >

                    <option value="">
                        Choose document
                    </option>

                    {documents.map(
                        (document) => (

                            <option
                                key={
                                    document.id
                                }
                                value={
                                    document.id
                                }
                            >

                                {
                                    document.original_filename
                                }

                            </option>
                        )
                    )}

                </select>

            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">

                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Original Image
                    </h2>

                    <div className="h-[500px] bg-gray-100 rounded-3xl overflow-hidden flex items-center justify-center">

                        {selectedDocument ? (

                            <img
                                src={`${import.meta.env.VITE_UPLOAD_BASE_URL}/${selectedDocument.filename}`}
                                alt="Original"
                                className="w-full h-full object-contain"
                            />

                        ) : (

                            <div className="text-gray-500">
                                Select a document
                            </div>
                        )}

                    </div>

                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">

                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Processed Preview
                    </h2>

                    <div className="h-[500px] bg-gray-100 rounded-3xl overflow-hidden flex items-center justify-center">

                        {processedImage ? (

                            <img
                                src={`${assetBaseUrl}/${processedImage}`}
                                alt="Processed"
                                className="w-full h-full object-contain"
                            />

                        ) : (

                            <div className="text-gray-500">
                                Generate preview
                            </div>
                        )}

                    </div>

                </div>

            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">

                <h2 className="text-2xl font-bold text-gray-900 mb-8">
                    Preprocessing Options
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                    {[
                        {
                            key: "deskew",
                            label: "Deskew",
                        },
                        {
                            key: "denoise",
                            label: "Denoise",
                        },
                        {
                            key: "binarize",
                            label: "Binarize",
                        },
                        {
                            key: "contrast_enhance",
                            label: "Enhance Contrast",
                        },
                        {
                            key: "crop_borders",
                            label: "Crop Borders",
                        },
                    ].map((item) => (

                        <label
                            key={item.key}
                            className="flex items-center justify-between bg-gray-50 rounded-2xl px-5 py-4 cursor-pointer"
                        >

                            <span className="font-medium text-gray-700">

                                {item.label}

                            </span>

                            <input
                                type="checkbox"
                                checked={
                                    options[
                                    item.key
                                    ]
                                }
                                onChange={(
                                    e
                                ) =>
                                    setOptions(
                                        (
                                            prev
                                        ) => ({
                                            ...prev,
                                            [item.key]:
                                                e
                                                    .target
                                                    .checked,
                                        })
                                    )
                                }
                                className="w-5 h-5"
                            />

                        </label>
                    ))}

                </div>

                <div className="mt-10">

                    <div className="flex items-center gap-3 mb-4">

                        <RotateCw
                            size={20}
                        />

                        <h3 className="text-lg font-semibold text-gray-900">

                            Rotation Angle

                        </h3>

                    </div>

                    <input
                        type="range"
                        min={-180}
                        max={180}
                        value={
                            options.rotation_angle
                        }
                        onChange={(e) =>
                            setOptions(
                                (
                                    prev
                                ) => ({
                                    ...prev,
                                    rotation_angle:
                                        Number(
                                            e
                                                .target
                                                .value
                                        ),
                                })
                            )
                        }
                        className="w-full"
                    />

                    <p className="mt-3 text-sm text-gray-500">

                        Current Rotation:
                        {" "}
                        {
                            options.rotation_angle
                        }
                        °

                    </p>

                </div>

            </div>

        </div>
    );
};

export default PreprocessingPreview;
