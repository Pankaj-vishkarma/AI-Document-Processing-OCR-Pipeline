import { useEffect, useState } from "react";

import axiosInstance from "../../api/axios";

import toast from "react-hot-toast";

const RecentDocuments = () => {

    const [documents, setDocuments] = useState([]);

    const [loading, setLoading] = useState(false);

    const fetchDocuments = async () => {

        try {

            setLoading(true);

            const response = await axiosInstance.get("/documents", {
                params: {
                    page: 1,
                    limit: 5,
                },
            });

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

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">

            <div className="flex items-center justify-between mb-6">

                <div>

                    <h3 className="text-2xl font-bold text-gray-900">
                        Recent Documents
                    </h3>

                    <p className="text-gray-500 mt-1">
                        Latest uploaded documents
                    </p>

                </div>

            </div>

            <div className="space-y-4">

                {loading ? (

                    <div className="text-gray-500">
                        Loading...
                    </div>

                ) : documents.length === 0 ? (

                    <div className="text-gray-500">
                        No documents found
                    </div>

                ) : (

                    documents.map((document) => (

                        <div
                            key={document.id}
                            className="flex items-center justify-between p-4 rounded-2xl bg-gray-50"
                        >

                            <div>

                                <h4 className="font-semibold text-gray-900">
                                    {document.original_filename}
                                </h4>

                                <p className="text-sm text-gray-500">
                                    {document.document_type || "Unknown"}
                                </p>

                            </div>

                            <span
                                className={`
                  px-4 py-2 rounded-full text-sm font-medium
                  ${document.status === "completed"
                                        ? "bg-green-100 text-green-700"
                                        : document.status === "failed"
                                            ? "bg-red-100 text-red-700"
                                            : "bg-yellow-100 text-yellow-700"
                                    }
                `}
                            >
                                {document.status}
                            </span>

                        </div>
                    ))
                )}

            </div>

        </div>
    );
};

export default RecentDocuments;