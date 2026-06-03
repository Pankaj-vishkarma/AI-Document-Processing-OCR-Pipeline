import { useEffect, useState } from "react";
import { FileText, CheckCircle2, AlertCircle, Clock3 } from "lucide-react";
import axiosInstance from "../../api/axios";
import toast from "react-hot-toast";

const CARDS_CONFIG = [
  {
    key: "total_documents",
    title: "Total Documents",
    icon: FileText,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    valueBorder: "border-blue-200",
    sub: "All time",
    subColor: "text-blue-600",
  },
  {
    key: "completed_documents",
    title: "Completed",
    icon: CheckCircle2,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    valueBorder: "border-emerald-200",
    sub: "Successfully processed",
    subColor: "text-emerald-600",
  },
  {
    key: "processing_documents",
    title: "Processing",
    icon: Clock3,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    valueBorder: "border-amber-200",
    sub: "Currently running",
    subColor: "text-amber-600",
  },
  {
    key: "failed_documents",
    title: "Failed",
    icon: AlertCircle,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
    valueBorder: "border-red-200",
    sub: "Needs review",
    subColor: "text-red-600",
  },
];

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="h-3 w-28 bg-gray-200 rounded-full" />
      <div className="w-10 h-10 bg-gray-100 rounded-xl" />
    </div>
    <div className="h-9 w-16 bg-gray-200 rounded-lg mb-2" />
    <div className="h-3 w-24 bg-gray-100 rounded-full" />
  </div>
);

const StatsOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/stats");
      setStats(response.data.stats);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {loading
        ? CARDS_CONFIG.map((c) => <SkeletonCard key={c.key} />)
        : CARDS_CONFIG.map((c) => {
          const Icon = c.icon;
          const value = stats?.[c.key] ?? 0;
          return (
            <div
              key={c.key}
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-sm font-semibold text-gray-600">{c.title}</span>
                <div className={`w-10 h-10 rounded-xl ${c.iconBg} ${c.iconColor} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={18} />
                </div>
              </div>
              <div className="text-4xl font-extrabold text-gray-900 mb-1 tracking-tight">
                {value.toLocaleString()}
              </div>
              <div className={`text-xs font-medium ${c.subColor}`}>{c.sub}</div>
            </div>
          );
        })}
    </div>
  );
};

export default StatsOverview;