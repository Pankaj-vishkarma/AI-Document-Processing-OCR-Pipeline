import { useEffect, useState } from "react";

import axiosInstance from "../../api/axios";

import toast from "react-hot-toast";

const TemplatesPanel = () => {

    const [templates, setTemplates] =
        useState([]);

    const fetchTemplates =
        async () => {

            try {

                const response =
                    await axiosInstance.get(
                        "/templates"
                    );

                setTemplates(
                    response.data.templates || []
                );

            } catch (error) {

                toast.error(
                    error?.response?.data?.message ||
                    "Failed to fetch templates"
                );
            }
        };

    useEffect(() => {

        fetchTemplates();

    }, []);

    return (
        <div className="space-y-8">

            <div>

                <h1 className="text-4xl font-bold text-gray-900">
                    Extraction Templates
                </h1>

                <p className="text-gray-500 mt-2">
                    Available OCR extraction schemas.
                </p>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                {templates.map((template) => (

                    <div
                        key={template}
                        className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
                    >

                        <h2 className="text-2xl font-bold text-gray-900 capitalize">

                            {template.replace("_", " ")}

                        </h2>

                        <p className="text-gray-500 mt-3">

                            OCR extraction schema template

                        </p>

                    </div>
                ))}

            </div>

        </div>
    );
};

export default TemplatesPanel;