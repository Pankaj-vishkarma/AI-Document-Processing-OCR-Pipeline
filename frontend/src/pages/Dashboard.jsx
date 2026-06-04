import MainLayout from "../layouts/MainLayout";
import StatsOverview from "../components/stats/StatsOverview";
import RecentDocuments from "../components/stats/RecentDocuments";
import AnalyticsPanel from "../components/stats/AnalyticsPanel";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 font-sans">

        {/* Top Bar */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
          <div className="max-w-screen-xl mx-auto flex items-center justify-between h-16 gap-4">
            {/* Left */}
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

            {/* Right */}
            <button
              onClick={() => navigate("/upload")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm font-semibold shadow-sm whitespace-nowrap"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 16 12 12 8 16" />
                <line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
              </svg>
              Upload Document
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

          {/* Page Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
              <p className="text-sm text-gray-500 mt-0.5">AI-powered OCR extraction — monitor, process and analyse your documents.</p>
            </div>
          </div>

          {/* Key Metrics */}
          <section>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Key Metrics</p>
            <StatsOverview />
          </section>

          {/* Analytics */}
          <section>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Analytics &amp; Insights</p>
            <AnalyticsPanel />
          </section>

          {/* Recent Activity */}
          <section>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Recent Activity</p>
            <RecentDocuments />
          </section>

        </main>
      </div>
    </MainLayout>
  );
};

export default Dashboard;