import { useEffect, useMemo, useState } from "react";

import {
    Search,
    Trash2,
    FileText,
    RefreshCw,
    LayoutGrid,
    List,
    CheckSquare,
} from "lucide-react";

import toast from "react-hot-toast";

import { useNavigate } from "react-router-dom";

import axiosInstance from "../../api/axios";

const DocumentLibrary = () => {

    const [documents, setDocuments] = useState([]);

    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");

    const [viewMode, setViewMode] =
        useState("table");

    const [statusFilter, setStatusFilter] =
        useState("");

    const [typeFilter, setTypeFilter] =
        useState("");

    const [selectedDocuments, setSelectedDocuments] =
        useState([]);

    const navigate = useNavigate();

    const fetchDocuments = async () => {

        try {

            setLoading(true);

            const response = await axiosInstance.get("/documents");

            setDocuments(response.data.documents || []);

        } catch (error) {

            toast.error(
                error?.response?.data?.message || "Failed to fetch documents"
            );

        } finally {

            setLoading(false);
        }
    };

    useEffect(() => {

        fetchDocuments();

    }, []);

    const handleDelete = async (documentId) => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this document?"
        );

        if (!confirmDelete) return;

        try {

            await axiosInstance.delete(`/documents/${documentId}`);

            toast.success("Document deleted successfully");

            fetchDocuments();

        } catch (error) {

            toast.error(
                error?.response?.data?.message || "Delete failed"
            );
        }
    };

    const filteredDocuments = useMemo(() => {

        return documents.filter((document) => {

            const matchesSearch =
                document.original_filename
                    ?.toLowerCase()
                    .includes(
                        search.toLowerCase()
                    );

            const matchesStatus =
                statusFilter
                    ? document.status ===
                    statusFilter
                    : true;

            const matchesType =
                typeFilter
                    ? document.document_type ===
                    typeFilter
                    : true;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesType
            );
        });

    }, [
        documents,
        search,
        statusFilter,
        typeFilter,
    ]);

    const handleBulkDelete =
        async () => {

            if (
                selectedDocuments.length ===
                0
            ) {

                toast.error(
                    "Select documents first"
                );

                return;
            }

            const confirmDelete =
                window.confirm(
                    "Delete selected documents?"
                );

            if (!confirmDelete) return;

            try {

                await Promise.all(
                    selectedDocuments.map(
                        (documentId) =>
                            axiosInstance.delete(
                                `/documents/${documentId}`
                            )
                    )
                );

                toast.success(
                    "Selected documents deleted"
                );

                setSelectedDocuments([]);

                fetchDocuments();

            } catch (error) {

                toast.error(
                    error?.response?.data
                        ?.message ||
                    "Bulk delete failed"
                );
            }
        };

    const getStatusStyles = (status) => {

        switch (status) {

            case "completed":
                return "bg-green-100 text-green-700";

            case "processing":
                return "bg-blue-100 text-blue-700";

            case "failed":
                return "bg-red-100 text-red-700";

            case "approved":
                return "bg-purple-100 text-purple-700";

            default:
                return "bg-yellow-100 text-yellow-700";
        }
    };

    return (
        <div className="space-y-8">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                <div>

                    <h1 className="text-4xl font-bold text-gray-900">
                        Document Library
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Manage uploaded and processed documents.
                    </p>

                </div>

                <button
                    onClick={fetchDocuments}
                    className="flex items-center justify-center gap-2 bg-black text-white px-5 py-3 rounded-xl font-medium hover:opacity-90 transition"
                >
                    <RefreshCw size={18} />

                    Refresh

                </button>

            </div>

            <div className="bg-white rounded-3xl p-4 lg:p-6 shadow-sm border border-gray-100">

                <div className="relative">

                    <Search
                        size={20}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                        type="text"
                        placeholder="Search documents..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-gray-100 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-black"
                    />

                </div>

            </div>

            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">

                <div className="flex flex-wrap gap-3">

                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(
                                e.target.value
                            )
                        }
                        className="bg-white border border-gray-200 rounded-2xl px-4 py-3 outline-none"
                    >

                        <option value="">
                            All Status
                        </option>

                        <option value="uploaded">
                            Uploaded
                        </option>

                        <option value="processing">
                            Processing
                        </option>

                        <option value="completed">
                            Completed
                        </option>

                        <option value="approved">
                            Approved
                        </option>

                        <option value="failed">
                            Failed
                        </option>

                    </select>

                    <select
                        value={typeFilter}
                        onChange={(e) =>
                            setTypeFilter(
                                e.target.value
                            )
                        }
                        className="bg-white border border-gray-200 rounded-2xl px-4 py-3 outline-none"
                    >

                        <option value="">
                            All Types
                        </option>

                        <option value="Invoice">
                            Invoice
                        </option>

                        <option value="Receipt">
                            Receipt
                        </option>

                        <option value="Business Card">
                            Business Card
                        </option>

                    </select>

                    <button
                        onClick={handleBulkDelete}
                        className="bg-red-600 text-white px-5 py-3 rounded-2xl font-medium hover:opacity-90 transition flex items-center gap-2"
                    >

                        <Trash2 size={18} />

                        Bulk Delete

                    </button>

                </div>

                <div className="flex items-center gap-3">

                    <button
                        onClick={() =>
                            setViewMode("table")
                        }
                        className={`
                w-12 h-12 rounded-2xl flex items-center justify-center
                ${viewMode === "table"
                                ? "bg-black text-white"
                                : "bg-white border border-gray-200 text-gray-700"
                            }
            `}
                    >

                        <List size={20} />

                    </button>

                    <button
                        onClick={() =>
                            setViewMode("grid")
                        }
                        className={`
                w-12 h-12 rounded-2xl flex items-center justify-center
                ${viewMode === "grid"
                                ? "bg-black text-white"
                                : "bg-white border border-gray-200 text-gray-700"
                            }
            `}
                    >

                        <LayoutGrid size={20} />

                    </button>

                </div>

            </div>

            {viewMode === "table" ? (

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[900px]">

                            <thead className="bg-gray-50 border-b border-gray-100">

                                <tr>

                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                                        Select
                                    </th>

                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                                        Document
                                    </th>

                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                                        Type
                                    </th>

                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                                        Status
                                    </th>

                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                                        Confidence
                                    </th>

                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                                        Created
                                    </th>

                                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">
                                        Action
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {loading ? (

                                    <tr>

                                        <td
                                            colSpan="7"
                                            className="text-center py-16 text-gray-500"
                                        >
                                            Loading documents...
                                        </td>

                                    </tr>

                                ) : filteredDocuments.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="7"
                                            className="text-center py-16 text-gray-500"
                                        >
                                            No documents found
                                        </td>

                                    </tr>

                                ) : (

                                    filteredDocuments.map((document) => (

                                        <tr
                                            key={document.id}
                                            className="border-b border-gray-100 hover:bg-gray-50 transition"
                                        >

                                            <td className="px-6 py-5">

                                                <button
                                                    onClick={() => {

                                                        if (
                                                            selectedDocuments.includes(
                                                                document.id
                                                            )
                                                        ) {

                                                            setSelectedDocuments(
                                                                prev =>
                                                                    prev.filter(
                                                                        id =>
                                                                            id !==
                                                                            document.id
                                                                    )
                                                            );

                                                        } else {

                                                            setSelectedDocuments(
                                                                prev => [
                                                                    ...prev,
                                                                    document.id,
                                                                ]
                                                            );
                                                        }
                                                    }}
                                                    className={`
                                            w-10 h-10 rounded-xl flex items-center justify-center
                                            ${selectedDocuments.includes(
                                                        document.id
                                                    )
                                                            ? "bg-black text-white"
                                                            : "bg-gray-100 text-gray-500"
                                                        }
                                        `}
                                                >

                                                    <CheckSquare size={18} />

                                                </button>

                                            </td>

                                            <td className="px-6 py-5">

                                                <div className="flex items-center gap-4">

                                                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">

                                                        <FileText size={22} />

                                                    </div>

                                                    <div>

                                                        <h3 className="font-semibold text-gray-900">
                                                            {document.original_filename}
                                                        </h3>

                                                        <p className="text-sm text-gray-500">
                                                            {document.file_type}
                                                        </p>

                                                    </div>

                                                </div>

                                            </td>

                                            <td className="px-6 py-5 text-gray-700">

                                                {document.document_type || "N/A"}

                                            </td>

                                            <td className="px-6 py-5">

                                                <span
                                                    className={`
                                            px-4 py-2 rounded-full text-sm font-medium
                                            ${getStatusStyles(document.status)}
                                        `}
                                                >
                                                    {document.status}
                                                </span>

                                            </td>

                                            <td className="px-6 py-5 text-gray-700">

                                                {document.confidence_score || "N/A"}

                                            </td>

                                            <td className="px-6 py-5 text-gray-700">

                                                {new Date(document.created_at).toLocaleDateString()}

                                            </td>

                                            <td className="px-6 py-5 text-right">

                                                <button
                                                    onClick={() => navigate(`/review/${document.id}`)}
                                                    className="w-10 h-10 rounded-xl bg-black text-white hover:opacity-90 transition inline-flex items-center justify-center mr-3"
                                                >
                                                    <FileText size={18} />
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(document.id)}
                                                    className="w-10 h-10 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition inline-flex items-center justify-center"
                                                >
                                                    <Trash2 size={18} />
                                                </button>

                                            </td>

                                        </tr>
                                    ))
                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            ) : (

                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">

                    {loading ? (

                        <div className="col-span-full bg-white rounded-3xl p-12 text-center text-gray-500 border border-gray-100">

                            Loading documents...

                        </div>

                    ) : filteredDocuments.length === 0 ? (

                        <div className="col-span-full bg-white rounded-3xl p-12 text-center text-gray-500 border border-gray-100">

                            No documents found

                        </div>

                    ) : (

                        filteredDocuments.map((document) => (

                            <div
                                key={document.id}
                                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition"
                            >

                                <div className="flex items-start justify-between">

                                    <button
                                        onClick={() => {

                                            if (
                                                selectedDocuments.includes(
                                                    document.id
                                                )
                                            ) {

                                                setSelectedDocuments(
                                                    prev =>
                                                        prev.filter(
                                                            id =>
                                                                id !==
                                                                document.id
                                                        )
                                                );

                                            } else {

                                                setSelectedDocuments(
                                                    prev => [
                                                        ...prev,
                                                        document.id,
                                                    ]
                                                );
                                            }
                                        }}
                                        className={`
                                w-10 h-10 rounded-xl flex items-center justify-center
                                ${selectedDocuments.includes(
                                            document.id
                                        )
                                                ? "bg-black text-white"
                                                : "bg-gray-100 text-gray-500"
                                            }
                            `}
                                    >

                                        <CheckSquare size={18} />

                                    </button>

                                    <span
                                        className={`
                                px-4 py-2 rounded-full text-sm font-medium
                                ${getStatusStyles(document.status)}
                            `}
                                    >

                                        {document.status}

                                    </span>

                                </div>

                                <div className="mt-6 flex items-center justify-center">

                                    <div className="w-24 h-24 rounded-3xl bg-gray-100 flex items-center justify-center">

                                        <FileText size={42} />

                                    </div>

                                </div>

                                <div className="mt-6">

                                    <h3 className="font-bold text-lg text-gray-900 break-all">

                                        {document.original_filename}

                                    </h3>

                                    <p className="text-sm text-gray-500 mt-2">

                                        {document.file_type}

                                    </p>

                                </div>

                                <div className="mt-5 flex flex-wrap gap-2">

                                    <span className="px-3 py-1 rounded-full bg-black text-white text-xs font-medium">

                                        {document.document_type || "Unknown"}

                                    </span>

                                    <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">

                                        {document.confidence_score || "N/A"}

                                    </span>

                                </div>

                                <div className="mt-6 flex items-center gap-3">

                                    <button
                                        onClick={() => navigate(`/review/${document.id}`)}
                                        className="flex-1 bg-black text-white py-3 rounded-2xl font-medium hover:opacity-90 transition"
                                    >
                                        Review
                                    </button>

                                    <button
                                        onClick={() => handleDelete(document.id)}
                                        className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 hover:bg-red-200 transition flex items-center justify-center"
                                    >
                                        <Trash2 size={20} />
                                    </button>

                                </div>

                            </div>
                        ))
                    )}

                </div>
            )}

        </div>
    );
};

export default DocumentLibrary;