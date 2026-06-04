import React from "react";

//import { Link } from "react-router-dom";

class AppErrorBoundary extends React.Component {

    constructor(props) {

        super(props);

        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {

        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {

        console.error("Application error boundary caught an error", error, errorInfo);
    }

    handleReload = () => {

        window.location.reload();
    };

    render() {

        if (this.state.hasError) {

            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
                    <div className="max-w-xl w-full bg-white border border-gray-200 rounded-4xl shadow-xl p-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 text-red-600 text-2xl font-bold mb-5">
                            !
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Something went wrong
                        </h1>
                        <p className="mt-3 text-gray-600">
                            The application hit an unexpected error. Reload the page or return to the dashboard.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                type="button"
                                onClick={this.handleReload}
                                className="px-5 py-3 rounded-xl bg-black text-white font-medium hover:opacity-90 transition"
                            >
                                Reload
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    window.location.href = "/";
                                }}
                                className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
                            >
                                Go to dashboard
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default AppErrorBoundary;