import { useEffect, useState } from "react";

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

import toast from "react-hot-toast";

import axiosInstance from "../../api/axios";

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

                toast.error(
                    error?.response?.data?.message || "Failed to load analytics"
                );

            } finally {

                setLoading(false);
            }
        };

        fetchStats();

    }, []);

    const data = Object.entries(stats?.document_types || {})
        .map(([name, value]) => ({
            name,
            value,
        }))
        .sort((left, right) => right.value - left.value);

    const colors = ["#ffffff", "#d1d5db", "#9ca3af", "#4b5563", "#6b7280"];

    return (
        <div className="bg-black text-white rounded-3xl p-6 h-full">

            <div className="mb-6">

                <h3 className="text-2xl font-bold">
                    Document Analytics
                </h3>

                <p className="text-gray-400 mt-1">
                    OCR classification insights
                </p>

            </div>

            <div className="h-75">

                {loading ? (

                    <div className="h-full flex items-center justify-center text-gray-400">
                        Loading analytics...
                    </div>

                ) : data.length === 0 ? (

                    <div className="h-full flex items-center justify-center text-gray-400">
                        No document type data yet.
                    </div>

                ) : (

                    <ResponsiveContainer width="100%" height="100%">

                        <PieChart>

                            <Pie
                                data={data}
                                dataKey="value"
                                outerRadius={100}
                                label
                            >

                                {data.map((entry, index) => (

                                    <Cell
                                        key={entry.name}
                                        fill={colors[index % colors.length]}
                                    />

                                ))}

                            </Pie>

                            <Tooltip />

                        </PieChart>

                    </ResponsiveContainer>

                )}

            </div>

        </div>
    );
};

export default AnalyticsPanel;