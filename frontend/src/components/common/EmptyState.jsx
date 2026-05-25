import { FileSearch } from "lucide-react";

const EmptyState = ({
    title,
    description,
}) => {

    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">

            <div className="w-24 h-24 rounded-3xl bg-gray-100 flex items-center justify-center mb-6">

                <FileSearch
                    size={40}
                    className="text-gray-500"
                />

            </div>

            <h2 className="text-2xl font-bold text-gray-900">

                {title}

            </h2>

            <p className="text-gray-500 mt-3 max-w-md">

                {description}

            </p>

        </div>
    );
};

export default EmptyState;