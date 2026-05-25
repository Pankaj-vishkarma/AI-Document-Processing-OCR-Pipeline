import { useEffect, useState } from "react";

import toast from "react-hot-toast";

import axiosInstance from "../../api/axios";

import {
    Layers,
    Loader2,
    Plus,
} from "lucide-react";

const BatchDashboard = () => {

    const [documents, setDocuments] = useState([]);

    const [batches, setBatches] = useState([]);

    const [selectedDocs, setSelectedDocs] = useState([]);

    const [batchName, setBatchName] = useState("");

    const [loading, setLoading] = useState(false);

    const [creating, setCreating] = useState(false);

    const fetchDocuments = async () => {

        try {

            const response = await axiosInstance.get("/documents");

            setDocuments(response.data.documents || []);

        } catch (error) {

            toast.error(
                error?.response?.data?.message || "Failed to fetch documents"
            );
        }
    };

    const fetchBatches = async () => {

        try {

            setLoading(true);

            const response = await axiosInstance.get("/batches");

            setBatches(response.data.batches || []);

        } catch (error) {

            toast.error(
                error?.response?.data?.message || "Failed to fetch batches"
            );

        } finally {

            setLoading(false);
        }
    };

    const handleBatchExtract = async (
        batchId
    ) => {

        try {

            const batchResponse =
                await axiosInstance.get(
                    `/batches/${batchId}`
                );

            const documents =
                batchResponse.data.documents || [];

            const documentIds =
                documents.map(
                    (document) => document.id
                );

            await axiosInstance.post(
                "/extract/batch",
                {
                    document_ids: documentIds,
                }
            );

            toast.success(
                "Batch extraction started"
            );

            fetchBatches();

        } catch (error) {

            toast.error(
                error?.response?.data?.message ||
                "Batch extraction failed"
            );
        }
    };

    const handleExportBatch = async (
        batchId
    ) => {

        try {

            const response =
                await axiosInstance.get(
                    `/export/batch/${batchId}`
                );

            console.log(response.data);

            toast.success(
                "Batch export generated"
            );

        } catch (error) {

            toast.error(
                error?.response?.data?.message ||
                "Batch export failed"
            );
        }
    };

    useEffect(() => {

        fetchDocuments();

        fetchBatches();

    }, []);

    const handleSelect = (id) => {

        if (selectedDocs.includes(id)) {

            setSelectedDocs(
                selectedDocs.filter((docId) => docId !== id)
            );

        } else {

            setSelectedDocs([...selectedDocs, id]);
        }
    };

    const handleCreateBatch = async () => {

        if (!batchName.trim()) {

            toast.error("Batch name required");

            return;
        }

        if (selectedDocs.length === 0) {

            toast.error("Select at least one document");

            return;
        }

        try {

            setCreating(true);

            await axiosInstance.post("/batches", {
                batch_name: batchName,
                document_ids: selectedDocs,
            });

            toast.success("Batch created successfully");

            setBatchName("");

            setSelectedDocs([]);

            fetchBatches();

        } catch (error) {

            toast.error(
                error?.response?.data?.message || "Batch creation failed"
            );

        } finally {

            setCreating(false);
        }
    };

    return (
        <div className="space-y-8">

            <div>

                <h1 className="text-4xl font-bold text-gray-900">
                    Batch Processing
                </h1>

                <p className="text-gray-500 mt-2">
                    Create and manage document processing batches.
                </p>

            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">

                    <div className="flex items-center gap-3 mb-6">

                        <Layers size={28} />

                        <h2 className="text-2xl font-bold text-gray-900">
                            Create Batch
                        </h2>

                    </div>

                    <div className="space-y-5">

                        <div>

                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                Batch Name
                            </label>

                            <input
                                type="text"
                                value={batchName}
                                onChange={(e) =>
                                    setBatchName(e.target.value)
                                }
                                placeholder="Enter batch name"
                                className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                            />

                        </div>

                        <div>

                            <label className="block text-sm font-medium text-gray-600 mb-3">
                                Select Documents
                            </label>

                            <div className="space-y-3 max-h-[350px] overflow-y-auto">

                                {documents.map((document) => (

                                    <div
                                        key={document.id}
                                        className="flex items-center justify-between p-4 rounded-2xl border border-gray-100"
                                    >

                                        <div>

                                            <h3 className="font-semibold text-gray-900">
                                                {document.original_filename}
                                            </h3>

                                            <p className="text-sm text-gray-500">
                                                {document.status}
                                            </p>

                                        </div>

                                        <input
                                            type="checkbox"
                                            checked={selectedDocs.includes(document.id)}
                                            onChange={() =>
                                                handleSelect(document.id)
                                            }
                                            className="w-5 h-5"
                                        />

                                    </div>
                                ))}

                            </div>

                        </div>

                        <button
                            onClick={handleCreateBatch}
                            disabled={creating}
                            className="w-full bg-black text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition"
                        >

                            {creating ? (
                                <Loader2
                                    className="animate-spin"
                                    size={18}
                                />
                            ) : (
                                <Plus size={18} />
                            )}

                            Create Batch

                        </button>

                    </div>

                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">

                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Existing Batches
                    </h2>

                    <div className="space-y-4">

                        {loading ? (

                            <div className="text-gray-500">
                                Loading batches...
                            </div>

                        ) : batches.length === 0 ? (

                            <div className="text-gray-500">
                                No batches found
                            </div>

                        ) : (

                            batches.map((batch) => (

                                <div
                                    key={batch.id}
                                    className="p-5 rounded-2xl border border-gray-100"
                                >

                                    <div className="flex items-center justify-between">

                                        <div>

                                            <h3 className="text-lg font-bold text-gray-900">
                                                {batch.batch_name}
                                            </h3>

                                            <p className="text-sm text-gray-500 mt-1">
                                                {batch.total_documents} documents
                                            </p>

                                        </div>

                                        <span className="px-4 py-2 rounded-full bg-black text-white text-sm">

                                            {batch.status}

                                        </span>

                                    </div>

                                    <div className="mt-5">

                                        <div className="flex justify-between text-sm mb-2">

                                            <span>Progress</span>

                                            <span>
                                                {batch.processed_documents}/
                                                {batch.total_documents}
                                            </span>

                                        </div>

                                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">

                                            <div
                                                className="h-full bg-black rounded-full"
                                                style={{
                                                    width: `${batch.total_documents > 0
                                                        ? (
                                                            (batch.processed_documents /
                                                                batch.total_documents) *
                                                            100
                                                        ).toFixed(0)
                                                        : 0
                                                        }%`,
                                                }}
                                            />

                                        </div>

                                    </div>

                                    <button
                                        onClick={() =>
                                            handleBatchExtract(batch.id)
                                        }
                                        className="mt-5 w-full bg-black text-white py-3 rounded-xl font-medium hover:opacity-90 transition"
                                    >
                                        Extract Batch
                                    </button>

                                    <button
                                        onClick={() =>
                                            handleExportBatch(batch.id)
                                        }
                                        className="mt-3 w-full border border-black text-black py-3 rounded-xl font-medium hover:bg-black hover:text-white transition"
                                    >
                                        Export Batch
                                    </button>

                                </div>
                            ))
                        )}

                    </div>

                </div>

            </div>

        </div>
    );
};

export default BatchDashboard;