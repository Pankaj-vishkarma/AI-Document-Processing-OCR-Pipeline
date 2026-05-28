import { useEffect, useState } from "react";

import {
    FileText,
    CheckCircle2,
    AlertCircle,
    Clock3,
} from "lucide-react";

import axiosInstance from "../../api/axios";

import toast from "react-hot-toast";

const StatsOverview = () => {

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

    const cards = [
        {
            title: "Total Documents",
            value: stats?.total_documents || 0,
            icon: FileText,
            bg: "bg-blue-100",
            text: "text-blue-700",
        },
        {
            title: "Completed",
            value: stats?.completed_documents || 0,
            icon: CheckCircle2,
            bg: "bg-green-100",
            text: "text-green-700",
        },
        {
            title: "Processing",
            value: stats?.processing_documents || 0,
            icon: Clock3,
            bg: "bg-yellow-100",
            text: "text-yellow-700",
        },
        {
            title: "Failed",
            value: stats?.failed_documents || 0,
            icon: AlertCircle,
            bg: "bg-red-100",
            text: "text-red-700",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

            {loading ? (

                cards.map((card) => (
                    <div
                        key={card.title}
                        className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 animate-pulse"
                    >
                        <div className="flex items-center justify-between">
                            <div className="space-y-4">
                                <div className="h-4 w-32 rounded-full bg-gray-200" />
                                <div className="h-10 w-20 rounded-2xl bg-gray-200" />
                            </div>
                            <div className="w-16 h-16 rounded-2xl bg-gray-200" />
                        </div>
                    </div>
                ))

            ) : (

                cards.map((card) => {

                    const Icon = card.icon;

                    return (
                        <div
                            key={card.title}
                            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
                        >

                            <div className="flex items-center justify-between">

                                <div>

                                    <p className="text-sm text-gray-500">
                                        {card.title}
                                    </p>

                                    <h2 className="text-4xl font-bold mt-4 text-gray-900">

                                        {loading ? "..." : card.value}

                                    </h2>

                                </div>

                                <div
                                    className={`
                  w-16 h-16 rounded-2xl
                  flex items-center justify-center
                  ${card.bg}
                `}
                                >

                                    <Icon
                                        size={30}
                                        className={card.text}
                                    />

                                </div>

                            </div>

                        </div>
                    );
                }))}

        </div>
    );
};

export default StatsOverview;