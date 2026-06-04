import { useEffect, useState } from "react";
import axiosInstance from "../../api/axios";
import toast from "react-hot-toast";

const FILTERS = ["All", "Completed", "Failed", "Processing"];

const statusConfig = {
    completed: {
        badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        icon: "bg-emerald-50 text-emerald-600",
    },
    failed: {
        badge: "bg-red-50 text-red-700 border border-red-200",
        icon: "bg-red-50 text-red-600",
    },
    processing: {
        badge: "bg-amber-50 text-amber-700 border border-amber-200",
        icon: "bg-amber-50 text-amber-600",
    },
    default: {
        badge: "bg-blue-50 text-blue-700 border border-blue-200",
        icon: "bg-blue-50 text-blue-600",
    },
};

const getStatusConfig = (status) =>
    statusConfig[status?.toLowerCase()] ?? statusConfig.default;

const FileIcon = ({ status }) => {
    const { icon } = getStatusConfig(status);
    return (
        <div className={`w-9 h-9 rounded-xl ${icon} flex items-center justify-center flex-shrink-0`}>
            <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
            </svg>
        </div>
    );
};

const SkeletonRow = () => (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 animate-pulse">
        <div className="w-9 h-9 rounded-xl bg-gray-200 flex-shrink-0" />
        <div className="flex-1 min-w-0">
            <div className="h-3 w-2/3 bg-gray-200 rounded-full mb-2" />
            <div className="h-2.5 w-1/3 bg-gray-100 rounded-full" />
        </div>
        <div className="h-6 w-20 bg-gray-200 rounded-full" />
    </div>
);

const RecentDocuments = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("All");

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get("/documents", {
                params: { page: 1, limit: 5 },
            });
            setDocuments(response.data.documents || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to fetch documents");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDocuments(); }, []);

    const filtered =
        filter === "All"
            ? documents
            : documents.filter((d) => d.status?.toLowerCase() === filter.toLowerCase());

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-5 border-b border-gray-100">
                <div>
                    <h3 className="text-base font-bold text-gray-900">Recent Documents</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Latest uploaded documents</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {FILTERS.map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors
                ${filter === f
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-800"
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="p-4 flex flex-col gap-2">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 text-sm">No documents found</div>
                ) : (
                    filtered.map((doc) => {
                        const { badge } = getStatusConfig(doc.status);
                        return (
                            <div
                                key={doc.id}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all duration-150 cursor-default"
                            >
                                <FileIcon status={doc.status} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">
                                        {doc.original_filename}
                                    </div>
                                    <div className="text-xs text-gray-500 capitalize mt-0.5">
                                        {doc.document_type || "Unknown"}
                                    </div>
                                </div>
                                <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize flex-shrink-0 ${badge}`}>
                                    {doc.status || "unknown"}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default RecentDocuments;