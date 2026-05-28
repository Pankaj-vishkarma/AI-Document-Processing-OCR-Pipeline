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
                        key={template.name}
                        className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
                    >

                        <h2 className="text-2xl font-bold text-gray-900 capitalize">

                            {template.name.replace("_", " ")}

                        </h2>

                        <p className="text-gray-500 mt-3">
                            Extracts {template.field_count} field{template.field_count === 1 ? "" : "s"}.
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">

                            {(template.fields || []).slice(0, 6).map((field) => (

                                <span
                                    key={field}
                                    className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                                >
                                    {field}
                                </span>

                            ))}

                        </div>

                    </div>
                ))}

            </div>

        </div>
    );
};

export default TemplatesPanel;