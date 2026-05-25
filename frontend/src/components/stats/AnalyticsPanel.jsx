import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const AnalyticsPanel = () => {

    const data = [
        {
            name: "Invoices",
            value: 40,
        },
        {
            name: "Receipts",
            value: 30,
        },
        {
            name: "Business Cards",
            value: 20,
        },
        {
            name: "Others",
            value: 10,
        },
    ];

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

            <div className="h-[300px]">

                <ResponsiveContainer width="100%" height="100%">

                    <PieChart>

                        <Pie
                            data={data}
                            dataKey="value"
                            outerRadius={100}
                            label
                        >

                            <Cell fill="#ffffff" />
                            <Cell fill="#d1d5db" />
                            <Cell fill="#9ca3af" />
                            <Cell fill="#4b5563" />

                        </Pie>

                        <Tooltip />

                    </PieChart>

                </ResponsiveContainer>

            </div>

        </div>
    );
};

export default AnalyticsPanel;