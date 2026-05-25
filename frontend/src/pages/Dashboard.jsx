import MainLayout from "../layouts/MainLayout";

import StatsOverview from "../components/stats/StatsOverview";

import RecentDocuments from "../components/stats/RecentDocuments";

import AnalyticsPanel from "../components/stats/AnalyticsPanel";

const Dashboard = () => {

  return (
    <MainLayout>

      <div className="space-y-8">

        <div>

          <h1 className="text-4xl font-bold text-gray-900">
            Welcome Back 👋
          </h1>

          <p className="text-gray-500 mt-2">
            AI-powered OCR extraction dashboard.
          </p>

        </div>

        <StatsOverview />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          <div className="xl:col-span-2">

            <RecentDocuments />

          </div>

          <AnalyticsPanel />

        </div>

      </div>

    </MainLayout>
  );
};

export default Dashboard;