import MainLayout from "../layouts/MainLayout";
import BatchDashboard from "../components/batch/BatchDashboard";

const BatchPage = () => {
  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BatchDashboard />
        </div>
      </div>
    </MainLayout>
  );
};

export default BatchPage;