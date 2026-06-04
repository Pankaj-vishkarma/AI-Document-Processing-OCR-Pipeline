import MainLayout from "../layouts/MainLayout";
import DocumentUploader from "../components/upload/DocumentUploader";

const UploadPage = () => {
  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Upload Documents</h1>
            <p className="text-sm text-gray-500 mt-1">
              Upload and process documents using AI-powered OCR extraction. Drag &amp; drop files or click to select.
            </p>
          </div>
          <DocumentUploader />
        </div>
      </div>
    </MainLayout>
  );
};

export default UploadPage;