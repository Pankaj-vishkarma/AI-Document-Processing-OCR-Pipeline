import { useEffect, useState } from "react";

import {
    FileText,
    Eye,
    RefreshCw,
    CheckCircle2,
} from "lucide-react";

import toast from "react-hot-toast";

import axiosInstance from "../../api/axios";

import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc =
    `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDFViewer = () => {

    const [documents, setDocuments] = useState([]);

    const [selectedDocument, setSelectedDocument] = useState(null);

    const [loading, setLoading] = useState(false);

    const [numPages, setNumPages] = useState(null);

    const [pageNumber, setPageNumber] = useState(1);

    const onDocumentLoadSuccess = ({ numPages }) => {

        setNumPages(numPages);
    };

    const fetchDocuments = async () => {

        try {

            setLoading(true);

            const response = await axiosInstance.get("/documents");

            const docs = response.data.documents || [];

            setDocuments(docs);

            if (docs.length > 0) {
                setSelectedDocument(docs[0]);
            }

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
        <div className="space-y-8">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                <div>

                    <h1 className="text-4xl font-bold text-gray-900">
                        PDF Viewer
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Preview uploaded documents and OCR results.
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

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

                    <div className="p-6 border-b border-gray-100">

                        <h2 className="text-2xl font-bold text-gray-900">
                            Documents
                        </h2>

                    </div>

                    <div className="max-h-[700px] overflow-y-auto">

                        {loading ? (

                            <div className="p-6 text-gray-500">
                                Loading documents...
                            </div>

                        ) : documents.length === 0 ? (

                            <div className="p-6 text-gray-500">
                                No documents found
                            </div>

                        ) : (

                            documents.map((document) => (

                                <button
                                    key={document.id}
                                    onClick={() => {

                                        setSelectedDocument(document);

                                        setPageNumber(1);
                                    }}
                                    className={`
                    w-full text-left p-5 border-b border-gray-100 transition
                    ${selectedDocument?.id === document.id
                                            ? "bg-black text-white"
                                            : "hover:bg-gray-50"
                                        }
                  `}
                                >

                                    <div className="flex items-center gap-4">

                                        <div
                                            className={`
                        w-12 h-12 rounded-xl flex items-center justify-center
                        ${selectedDocument?.id === document.id
                                                    ? "bg-white/10"
                                                    : "bg-gray-100"
                                                }
                      `}
                                        >

                                            <FileText size={22} />

                                        </div>

                                        <div>

                                            <h3 className="font-semibold">
                                                {document.original_filename}
                                            </h3>

                                            <p
                                                className={`
                          text-sm mt-1
                          ${selectedDocument?.id === document.id
                                                        ? "text-gray-300"
                                                        : "text-gray-500"
                                                    }
                        `}
                                            >
                                                {document.status}
                                            </p>

                                        </div>

                                    </div>

                                </button>
                            ))
                        )}

                    </div>

                </div>

                <div className="xl:col-span-2 space-y-6">

                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">

                        <div className="flex items-center gap-3 mb-6">

                            <Eye size={24} />

                            <h2 className="text-2xl font-bold text-gray-900">
                                Document Preview
                            </h2>

                        </div>

                        <div className="h-[700px] rounded-3xl border border-gray-200 overflow-hidden bg-gray-100">

                            {selectedDocument ? (

                                <div className="grid grid-cols-1 lg:grid-cols-[120px_1fr] h-full">

                                    {selectedDocument.file_type === "pdf" &&
                                        numPages > 0 && (

                                            <div className="border-r border-gray-200 bg-white overflow-y-auto p-3 space-y-3">

                                                {Array.from(
                                                    new Array(numPages),
                                                    (_, index) => (

                                                        <button
                                                            key={index}
                                                            onClick={() =>
                                                                setPageNumber(
                                                                    index + 1
                                                                )
                                                            }
                                                            className={`
                                        w-full rounded-2xl overflow-hidden border transition
                                        ${pageNumber ===
                                                                    index + 1
                                                                    ? "border-black"
                                                                    : "border-gray-200"
                                                                }
                                    `}
                                                        >

                                                            <div className="bg-gray-50 p-2 flex justify-between items-center">

                                                                <span className="text-xs font-medium">

                                                                    Page {index + 1}

                                                                </span>

                                                                <CheckCircle2
                                                                    size={14}
                                                                    className="text-green-600"
                                                                />

                                                            </div>

                                                            <div className="bg-white flex justify-center py-2">

                                                                <Document
                                                                    file={`${import.meta.env.VITE_UPLOAD_BASE_URL}/${selectedDocument.filename}`}
                                                                >

                                                                    <Page
                                                                        pageNumber={
                                                                            index + 1
                                                                        }
                                                                        width={80}
                                                                    />

                                                                </Document>

                                                            </div>

                                                        </button>
                                                    )
                                                )}

                                            </div>
                                        )}

                                    <div className="overflow-auto flex items-center justify-center p-6">

                                        {selectedDocument.file_type ===
                                            "pdf" ? (

                                            <Document
                                                file={`${import.meta.env.VITE_UPLOAD_BASE_URL}/${selectedDocument.filename}`}
                                                onLoadSuccess={
                                                    onDocumentLoadSuccess
                                                }
                                            >

                                                <Page
                                                    pageNumber={
                                                        pageNumber
                                                    }
                                                    width={700}
                                                />

                                            </Document>

                                        ) : (

                                            <img
                                                src={`${import.meta.env.VITE_UPLOAD_BASE_URL}/${selectedDocument.filename}`}
                                                alt="Preview"
                                                className="max-h-full rounded-2xl object-contain"
                                            />

                                        )}

                                    </div>

                                </div>

                            ) : (

                                <div className="h-full flex items-center justify-center text-gray-500">

                                    Select a document

                                </div>
                            )}

                        </div>

                    </div>


                    {selectedDocument?.file_type === "pdf" && numPages > 1 && (

                        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-wrap items-center justify-center gap-4">

                            <button
                                disabled={pageNumber <= 1}
                                onClick={() =>
                                    setPageNumber(
                                        (prev) => prev - 1
                                    )
                                }
                                className="bg-black text-white px-4 py-2 rounded-xl disabled:opacity-40"
                            >
                                Previous
                            </button>

                            <span className="font-medium">

                                Page {pageNumber} of {numPages}

                            </span>

                            <input
                                type="number"
                                min={1}
                                max={numPages}
                                value={pageNumber}
                                onChange={(e) => {

                                    const value =
                                        Number(
                                            e.target.value
                                        );

                                    if (
                                        value >= 1 &&
                                        value <= numPages
                                    ) {

                                        setPageNumber(
                                            value
                                        );
                                    }
                                }}
                                className="w-24 bg-gray-100 rounded-xl px-4 py-2 outline-none text-center"
                            />

                            <button
                                disabled={
                                    pageNumber >= numPages
                                }
                                onClick={() =>
                                    setPageNumber(
                                        (prev) => prev + 1
                                    )
                                }
                                className="bg-black text-white px-4 py-2 rounded-xl disabled:opacity-40"
                            >
                                Next
                            </button>

                        </div>
                    )}

                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">

                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            OCR Text
                        </h2>

                        <div className="bg-gray-50 rounded-2xl p-5 min-h-[250px] whitespace-pre-wrap text-gray-700">

                            {selectedDocument?.ocr_text ||
                                "OCR text not available"}

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default PDFViewer;