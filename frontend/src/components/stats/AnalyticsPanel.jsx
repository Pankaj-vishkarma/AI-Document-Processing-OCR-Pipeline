import { useEffect, useState } from "react";
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    LineChart, Line, CartesianGrid, XAxis, YAxis,
} from "recharts";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axios";

const PALETTE = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg text-xs text-gray-800 font-medium">
            <span className="capitalize">{payload[0].name}</span>
            {" — "}
            <span className="font-bold">{payload[0].value}</span>
        </div>
    );
};

const SkeletonBlock = ({ className }) => (
    <div className={`bg-gray-100 rounded-lg animate-pulse ${className}`} />
);

const AnalyticsPanel = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await axiosInstance.get("/stats");
                setStats(response.data.stats);
            } catch (error) {
                toast.error(error?.response?.data?.message || "Failed to load analytics");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const data = Object.entries(stats?.document_types || {})
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const total = data.reduce((s, d) => s + d.value, 0);

    const lineData = [
        { name: "Completed", value: stats?.completed_documents || 0 },
        { name: "Processing", value: stats?.processing_documents || 0 },
        { name: "Failed", value: stats?.failed_documents || 0 },
        { name: "Approved", value: stats?.approved_documents || 0 },
    ];

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div>
                    <h3 className="text-base font-bold text-gray-900">Document Analytics</h3>
                    <p className="text-sm text-gray-500 mt-0.5">OCR classification insights</p>
                </div>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                    This month
                </span>
            </div>

            <div className="p-6 flex flex-col gap-6">
                {loading ? (
                    <div className="flex flex-col gap-5">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <SkeletonBlock className="h-64 w-full" />
                            <SkeletonBlock className="h-64 w-full" />
                        </div>
                        <div className="flex flex-col gap-3">
                            <SkeletonBlock className="h-4 w-full" />
                            <SkeletonBlock className="h-4 w-5/6" />
                        </div>
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                        No document type data yet.
                    </div>
                ) : (
                    <>
                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* Line Chart */}
                            <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
                                <p className="text-sm font-bold text-gray-700 mb-4">Processing Overview</p>
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={lineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "#9ca3af", fontSize: 11 }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "#9ca3af", fontSize: 11 }}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#2563eb"
                                            strokeWidth={2.5}
                                            dot={{ fill: "#2563eb", r: 4, strokeWidth: 0 }}
                                            activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Donut + Legend */}
                            <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 flex flex-col gap-4">
                                <div className="flex justify-center">
                                    <ResponsiveContainer width={160} height={160}>
                                        <PieChart>
                                            <Pie
                                                data={data}
                                                dataKey="value"
                                                innerRadius={42}
                                                outerRadius={68}
                                                paddingAngle={3}
                                                startAngle={90}
                                                endAngle={-270}
                                            >
                                                {data.map((entry, index) => (
                                                    <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Legend */}
                                <div className="flex flex-col gap-2">
                                    {data.slice(0, 5).map((entry, i) => (
                                        <div key={entry.name} className="flex items-center gap-2 text-sm">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                style={{ background: PALETTE[i % PALETTE.length] }}
                                            />
                                            <span className="flex-1 text-gray-600 capitalize truncate">{entry.name}</span>
                                            <span className="font-bold text-gray-900 text-xs">
                                                {total ? `${Math.round((entry.value / total) * 100)}%` : entry.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-100" />

                        {/* Progress Bars */}
                        <div className="flex flex-col gap-4">
                            {[
                                { label: "OCR accuracy", val: "98.2%", pct: 98, color: "bg-blue-500" },
                                { label: "Avg. confidence", val: "94.7%", pct: 95, color: "bg-emerald-500" },
                            ].map(({ label, val, pct, color }) => (
                                <div key={label}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-600">{label}</span>
                                        <span className="text-sm font-bold text-gray-900">{val}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${color} transition-all duration-700`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-100" />

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { label: "Total docs", val: total.toLocaleString() },
                                { label: "Types found", val: data.length },
                                {
                                    label: "Top type",
                                    val: data[0]?.name || "—",
                                    small: true,
                                },
                                { label: "Avg. time", val: "1.4s" },
                            ].map(({ label, val, small }) => (
                                <div key={label} className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
                                    <div className="text-xs text-gray-500 mb-1">{label}</div>
                                    <div className={`font-bold text-gray-900 ${small ? "text-sm capitalize" : "text-lg"}`}>
                                        {val}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AnalyticsPanel;