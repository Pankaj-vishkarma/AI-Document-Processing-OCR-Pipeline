import {
    FileJson,
    FileSpreadsheet,
    Download,
    Archive,
    Loader2,
} from "lucide-react";

import { useState } from "react";

import toast from "react-hot-toast";

import axiosInstance from "../../api/axios";

const ExportPanel = () => {

    const [loadingType, setLoadingType] = useState("");

    const handleExport = async (type) => {

        try {

            setLoadingType(type);

            const response = await axiosInstance.post(
                "/export",
                {
                    type,
                },
                {
                    responseType: "blob",
                }
            );

            const blob = new Blob([response.data]);

            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = url;

            const extension =
                type === "excel"
                    ? "xlsx"
                    : type;

            link.setAttribute(
                "download",
                `documents.${extension}`
            );

            document.body.appendChild(link);

            link.click();

            link.remove();

            toast.success(`${type.toUpperCase()} exported`);

        } catch (error) {

            toast.error(
                error?.response?.data?.message || "Export failed"
            );

        } finally {

            setLoadingType("");
        }
    };

    const exportCards = [
        {
            title: "JSON Export",
            description:
                "Export extracted document data as JSON.",
            type: "json",
            icon: FileJson,
        },
        {
            title: "CSV Export",
            description:
                "Download OCR extraction results in CSV format.",
            type: "csv",
            icon: Download,
        },
        {
            title: "Excel Export",
            description:
                "Export document data as Excel spreadsheet.",
            type: "excel",
            icon: FileSpreadsheet,
        },
        {
            title: "ZIP Export",
            description:
                "Download all documents as a ZIP archive of JSON files.",
            type: "zip",
            icon: Archive,
        },
    ];

    return (
        <div className="space-y-8">

            <div>

                <h1 className="text-4xl font-bold text-gray-900">
                    Export Center
                </h1>

                <p className="text-gray-500 mt-2">
                    Export OCR and AI extracted document data.
                </p>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {exportCards.map((card) => {

                    const Icon = card.icon;

                    const isLoading =
                        loadingType === card.type;

                    return (
                        <div
                            key={card.type}
                            className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100"
                        >

                            <div className="w-16 h-16 rounded-2xl bg-black text-white flex items-center justify-center mb-6">

                                <Icon size={32} />

                            </div>

                            <h2 className="text-2xl font-bold text-gray-900">
                                {card.title}
                            </h2>

                            <p className="text-gray-500 mt-3 leading-relaxed">
                                {card.description}
                            </p>

                            <button
                                onClick={() =>
                                    handleExport(card.type)
                                }
                                disabled={isLoading}
                                className="mt-8 w-full bg-black text-white py-4 rounded-2xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
                            >

                                {isLoading ? (
                                    <Loader2
                                        className="animate-spin"
                                        size={18}
                                    />
                                ) : (
                                    <Download size={18} />
                                )}

                                Export

                            </button>

                        </div>
                    );
                })}

            </div>

        </div>
    );
};

export default ExportPanel;