import MainLayout from "../layouts/MainLayout";
import DocumentLibrary from "../components/library/DocumentLibrary";

const LibraryPage = () => {
  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Document Library</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage uploaded and processed documents. Search, filter, and review extractions.
            </p>
          </div>
          <DocumentLibrary />
        </div>
      </div>
    </MainLayout>
  );
};

export default LibraryPage;