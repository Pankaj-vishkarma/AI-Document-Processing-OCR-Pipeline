import { useEffect, useState } from "react";

import toast from "react-hot-toast";

import axiosInstance from "../../api/axios";

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";

const StatisticsDashboard = () => {

    const [stats, setStats] = useState(null);

    const [loading, setLoading] = useState(false);

    const fetchStats = async () => {

        try {

            setLoading(true);

            const response = await axiosInstance.get("/stats");

            setStats(response.data.stats);

        } catch (error) {

            toast.error(
                error?.response?.data?.message || "Failed to fetch stats"
            );

        } finally {

            setLoading(false);
        }
    };

    useEffect(() => {

        fetchStats();

    }, []);

    const pieData = [
        {
            name: "Completed",
            value: stats?.completed_documents || 0,
        },
        {
            name: "Processing",
            value: stats?.processing_documents || 0,
        },
        {
            name: "Failed",
            value: stats?.failed_documents || 0,
        },
    ];

    const typeData = Object.entries(stats?.document_types || {})
        .map(([name, count]) => ({
            name,
            count,
        }))
        .sort((left, right) => right.count - left.count);

    const totalDocuments = stats?.total_documents || 0;

    const completionRate = totalDocuments
        ? ((stats?.completed_documents || 0) / totalDocuments) * 100
        : 0;

    const processingRate = totalDocuments
        ? ((stats?.processing_documents || 0) / totalDocuments) * 100
        : 0;

    const COLORS = [
        "#111111",
        "#6b7280",
        "#d1d5db",
    ];

    return (
        <div className="space-y-8">

            <div>

                <h1 className="text-4xl font-bold text-gray-900">
                    Statistics & Analytics
                </h1>

                <p className="text-gray-500 mt-2">
                    OCR processing insights and AI extraction analytics.
                </p>

            </div>

            {loading ? (

                <div className="text-gray-500">
                    Loading analytics...
                </div>

            ) : (

                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">

                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                Total Documents
                            </h2>

                            <h3 className="text-6xl font-bold text-black">
                                {stats?.total_documents || 0}
                            </h3>

                        </div>

                        <div className="bg-black text-white rounded-3xl p-6">

                            <h2 className="text-2xl font-bold mb-6">
                                Completion Rate
                            </h2>

                            <h3 className="text-6xl font-bold">
                                {completionRate.toFixed(1)}%
                            </h3>

                        </div>

                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">

                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                Processing Rate
                            </h2>

                            <h3 className="text-6xl font-bold text-black">
                                {processingRate.toFixed(1)}%
                            </h3>

                        </div>

                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">

                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                Processing Overview
                            </h2>

                            <div className="h-87.5">

                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >

                                    <PieChart>

                                        <Pie
                                            data={pieData}
                                            dataKey="value"
                                            outerRadius={120}
                                            label
                                        >

                                            {pieData.map((entry, index) => (

                                                <Cell
                                                    key={entry.name}
                                                    fill={
                                                        COLORS[index % COLORS.length]
                                                    }
                                                />
                                            ))}

                                        </Pie>

                                        <Tooltip />

                                    </PieChart>

                                </ResponsiveContainer>

                            </div>

                        </div>

                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">

                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                Document Types
                            </h2>

                            <div className="h-87.5">

                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >

                                    <BarChart data={typeData}>

                                        <CartesianGrid strokeDasharray="3 3" />

                                        <XAxis dataKey="name" />

                                        <YAxis />

                                        <Tooltip />

                                        <Bar
                                            dataKey="count"
                                            fill="#111111"
                                            radius={[10, 10, 0, 0]}
                                        />

                                    </BarChart>

                                </ResponsiveContainer>

                            </div>

                        </div>

                    </div>

                </>
            )}

        </div>
    );
};

export default StatisticsDashboard;