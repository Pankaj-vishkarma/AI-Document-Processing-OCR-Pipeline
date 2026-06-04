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

const exportCards = [
    {
        title: "JSON Export",
        description: "Export extracted document data as structured JSON.",
        type: "json",
        icon: FileJson,
        iconBg: "bg-blue-50",
        iconColor: "text-blue-600",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
        title: "CSV Export",
        description: "Download OCR extraction results in CSV format.",
        type: "csv",
        icon: Download,
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
        title: "Excel Export",
        description: "Export document data as an Excel spreadsheet.",
        type: "excel",
        icon: FileSpreadsheet,
        iconBg: "bg-amber-50",
        iconColor: "text-amber-600",
        badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
        title: "ZIP Export",
        description: "Download all documents as a ZIP archive of JSON files.",
        type: "zip",
        icon: Archive,
        iconBg: "bg-purple-50",
        iconColor: "text-purple-600",
        badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    },
];

const ExportPanel = ({ selectedDocumentId }) => {
    const [loadingType, setLoadingType] = useState("");

    const handleExport = async (type) => {
        try {
            setLoadingType(type);
            const payload = { type };
            if (selectedDocumentId) {
                payload.document_ids = [selectedDocumentId];
            }
            const response = await axiosInstance.post("/export", payload, {
                responseType: "blob",
            });
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            const extension = type === "excel" ? "xlsx" : type;
            link.setAttribute("download", `documents.${extension}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success(`${type.toUpperCase()} exported`);
        } catch (error) {
            toast.error(
                error?.response?.data?.message ||
                "Export failed. Please ensure documents have been processed before exporting."
            );
        } finally {
            setLoadingType("");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">

            {/* Top Bar */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
                <div className="max-w-screen-xl mx-auto flex items-center justify-between h-16 gap-4">
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
                </div>
            </header>

            {/* Page Content */}
            <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

                {/* Page Title */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Export Center</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Export OCR and AI extracted document data in your preferred format.</p>
                    </div>
                    {selectedDocumentId && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 self-start sm:self-auto">
                            <span className="text-xs font-semibold text-blue-700">Exporting document #{selectedDocumentId}</span>
                        </div>
                    )}
                </div>

                {/* Export Cards */}
                <section>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Export Formats</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        {exportCards.map((card) => {
                            const Icon = card.icon;
                            const isLoading = loadingType === card.type;
                            const isAnyLoading = !!loadingType;

                            return (
                                <div
                                    key={card.type}
                                    className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                                >
                                    {/* Icon + badge */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`w-10 h-10 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center flex-shrink-0`}>
                                            <Icon size={18} />
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${card.badgeColor}`}>
                                            .{card.type === "excel" ? "xlsx" : card.type}
                                        </span>
                                    </div>

                                    {/* Title & description */}
                                    <h2 className="text-sm font-bold text-gray-900 mb-1">{card.title}</h2>
                                    <p className="text-xs text-gray-500 leading-relaxed flex-1">{card.description}</p>

                                    {/* Export button */}
                                    <button
                                        onClick={() => handleExport(card.type)}
                                        disabled={isLoading || isAnyLoading}
                                        className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        {isLoading ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Download size={14} />
                                        )}
                                        {isLoading ? "Exporting…" : "Export"}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Info Banner */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Before exporting</p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                Ensure all documents have been fully processed. Exports will only include data from completed documents.
                                {selectedDocumentId
                                    ? " You are exporting a single selected document."
                                    : " No document selected — all processed documents will be included."}
                            </p>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default ExportPanel;