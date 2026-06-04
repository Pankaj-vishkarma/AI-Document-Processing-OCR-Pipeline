import { AlertTriangle } from "lucide-react";

const ErrorState = ({ message }) => {

    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">

            <div className="w-24 h-24 rounded-3xl bg-red-100 flex items-center justify-center mb-6">

                <AlertTriangle
                    size={40}
                    className="text-red-600"
                />

            </div>

            <h2 className="text-2xl font-bold text-gray-900">
                Something went wrong
            </h2>

            <p className="text-gray-500 mt-3 max-w-md">
                {message}
            </p>

        </div>
    );
};

export default ErrorState;