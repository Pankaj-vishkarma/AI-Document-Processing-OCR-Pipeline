import { Link } from "react-router-dom";

const NotFoundPage = () => {

    return (
        <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_#f8fafc,_#eef2ff_45%,_#e2e8f0)] px-6">
            <div className="max-w-xl w-full bg-white border border-gray-200 rounded-[2rem] shadow-xl p-8 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-gray-500">
                    404
                </p>
                <h1 className="mt-4 text-4xl font-bold text-gray-900">
                    Page not found
                </h1>
                <p className="mt-3 text-gray-600">
                    The route you opened does not exist. Use the navigation below to return to the app.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        to="/"
                        className="px-5 py-3 rounded-xl bg-black text-white font-medium hover:opacity-90 transition"
                    >
                        Go home
                    </Link>
                    <Link
                        to="/library"
                        className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
                    >
                        Open library
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;