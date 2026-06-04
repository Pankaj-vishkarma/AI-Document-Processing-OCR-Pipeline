import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import UploadPage from "../pages/UploadPage";
import LibraryPage from "../pages/LibraryPage";
import ReviewPage from "../pages/ReviewPage";
import BatchPage from "../pages/BatchPage";
import ExportPage from "../pages/ExportPage";
import PDFViewerPage from "../pages/PDFViewerPage";
import StatsPage from "../pages/StatsPage";
import GlobalLoader from "../components/common/GlobalLoader";
import TemplatesPage from "../pages/TemplatesPage";
import PreprocessingPage from "../pages/PreprocessingPage";
import NotFoundPage from "../pages/NotFound";

import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {

    const { user, loading } = useAuth();

    if (loading) {
        return <GlobalLoader />;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    return children;
};

const AppRoutes = () => {

    return (
        <BrowserRouter>

            <Routes>

                <Route path="/login" element={<Login />} />

                <Route path="/register" element={<Register />} />

                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/upload"
                    element={
                        <ProtectedRoute>
                            <UploadPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/library"
                    element={
                        <ProtectedRoute>
                            <LibraryPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/review"
                    element={
                        <ProtectedRoute>
                            <ReviewPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/review/:documentId"
                    element={
                        <ProtectedRoute>
                            <ReviewPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/batch"
                    element={
                        <ProtectedRoute>
                            <BatchPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/export"
                    element={
                        <ProtectedRoute>
                            <ExportPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/pdf-viewer"
                    element={
                        <ProtectedRoute>
                            <PDFViewerPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/stats"
                    element={
                        <ProtectedRoute>
                            <StatsPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/templates"
                    element={
                        <ProtectedRoute>
                            <TemplatesPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/preprocessing"
                    element={
                        <ProtectedRoute>
                            <PreprocessingPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="*"
                    element={<NotFoundPage />}
                />

            </Routes>

        </BrowserRouter>
    );
};

export default AppRoutes;
