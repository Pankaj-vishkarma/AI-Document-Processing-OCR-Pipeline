import {
    LayoutDashboard,
    Upload,
    FileText,
    Layers,
    BarChart3,
    FileSearch,
    LogOut,
    Download,
    LayoutTemplate
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ mobileOpen, setMobileOpen }) => {

    const navigate = useNavigate();

    const { logout } = useAuth();

    const menus = [
        {
            name: "Dashboard",
            icon: LayoutDashboard,
            path: "/",
        },
        {
            name: "Upload",
            icon: Upload,
            path: "/upload",
        },
        {
            name: "Library",
            icon: FileText,
            path: "/library",
        },
        {
            name: "Batch",
            icon: Layers,
            path: "/batch",
        },
        {
            name: "PDF Viewer",
            icon: FileSearch,
            path: "/pdf-viewer",
        },
        {
            name: "Statistics",
            icon: BarChart3,
            path: "/stats",
        },
        {
            name: "Export",
            icon: Download,
            path: "/export",
        },
        {
            name: "Templates",
            icon: LayoutTemplate,
            path: "/templates",
        },
    ];

    const handleLogout = () => {

        logout();

        navigate("/login");
    };

    return (
        <>
            <div
                className={`
          fixed inset-0 bg-black/50 z-40 lg:hidden
          ${mobileOpen ? "block" : "hidden"}
        `}
                onClick={() => setMobileOpen(false)}
            />

            <aside
                className={`
          fixed lg:static top-0 left-0 z-50
          h-screen w-[280px]
          bg-black text-white
          border-r border-white/10
          transform transition-transform duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
            >
                <div className="h-full flex flex-col">

                    <div className="px-6 py-8 border-b border-white/10">

                        <h1 className="text-2xl font-bold leading-tight">
                            AI Document
                            <br />
                            Processing
                        </h1>

                        <p className="text-sm text-gray-400 mt-2">
                            OCR & Extraction Platform
                        </p>

                    </div>

                    <nav className="flex-1 p-4 space-y-2">

                        {menus.map((menu) => {

                            const Icon = menu.icon;

                            return (
                                <NavLink
                                    key={menu.path}
                                    to={menu.path}
                                    onClick={() => setMobileOpen(false)}
                                    className={({ isActive }) =>
                                        `
                    flex items-center gap-3
                    px-4 py-3 rounded-xl
                    transition-all duration-200
                    ${isActive
                                            ? "bg-white text-black"
                                            : "hover:bg-white/10 text-gray-300"
                                        }
                  `
                                    }
                                >
                                    <Icon size={20} />

                                    <span className="font-medium">
                                        {menu.name}
                                    </span>

                                </NavLink>
                            );
                        })}

                    </nav>

                    <div className="p-4 border-t border-white/10">

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 bg-white text-black py-3 rounded-xl font-semibold hover:opacity-90 transition"
                        >
                            <LogOut size={18} />
                            Logout
                        </button>

                    </div>

                </div>

            </aside>
        </>
    );
};

export default Sidebar;