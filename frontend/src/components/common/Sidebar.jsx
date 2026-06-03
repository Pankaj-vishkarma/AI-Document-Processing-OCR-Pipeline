import {
  LayoutDashboard,
  Upload,
  FileText,
  Layers,
  FileSearch,
  LogOut,
  Download,
  SlidersHorizontal,
  ClipboardCheck,
  ChevronRight,
  X,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menus = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    { name: "Upload", icon: Upload, path: "/upload" },
    { name: "Library", icon: FileText, path: "/library" },
    { name: "Batch", icon: Layers, path: "/batch" },
    { name: "PDF Viewer", icon: FileSearch, path: "/pdf-viewer" },
    { name: "Export", icon: Download, path: "/export" },
    { name: "Preprocessing", icon: SlidersHorizontal, path: "/preprocessing" },
    { name: "Review", icon: ClipboardCheck, path: "/review" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const primaryMenus = menus.slice(0, 5);
  const secondaryMenus = menus.slice(5);

  const NavItem = ({ menu }) => {
    const Icon = menu.icon;
    return (
      <NavLink
        to={menu.path}
        onClick={() => setMobileOpen(false)}
        className={({ isActive }) =>
          [
            "group flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all duration-150 cursor-pointer text-sm font-medium no-underline",
            isActive
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-200",
          ].join(" ")
        }
      >
        {({ isActive }) => (
          <>
            <span className={[
              "w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 transition-colors duration-150",
              isActive
                ? "bg-blue-100 text-blue-600"
                : "text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-600",
            ].join(" ")}>
              <Icon size={15} strokeWidth={2} />
            </span>
            <span className="flex-1 leading-none">{menu.name}</span>
            {isActive
              ? <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
              : <ChevronRight size={13} strokeWidth={2} className="text-gray-300 flex-shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-150" />
            }
          </>
        )}
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed top-[64px] left-0 right-0 bottom-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar shell */}
      <aside className={[
        /* layout */
        "fixed left-0 w-64 z-[9999] flex flex-col dfdfdfdfdfdfd h-full",
        /* mobile positioning: below navbar (64px) */
        "top-0 h-[calc(100vh-64px)]",
        /* visuals */
        "bg-white border-r border-gray-200",
        /* mobile slide */
        "transition-transform duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        /* desktop: always visible, sticky, full height */
        "lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen",
      ].join(" ")}>

        {/* ── Logo + Close Button ── */}
        <div className="flex-shrink-0 px-4 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between gap-2.5 mb-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 tracking-tight leading-none">DocuSense OCR</p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-none">Extraction Platform</p>
              </div>
            </div>
            {/* Close button (mobile/tablet only) */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-150 flex-shrink-0"
              aria-label="Close sidebar"
            >
              <X size={20} strokeWidth={2} />
            </button>
          </div>

          {/* Status pill */}
          <div className="flex items-center gap-1.5 mt-3 px-2.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 self-start w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <span className="text-[10px] font-semibold text-emerald-700 leading-none">AI Engine Active</span>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">

          {/* Primary group */}
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-1 pb-2">Main</p>
          {primaryMenus.map((menu) => (
            <NavItem key={menu.path} menu={menu} />
          ))}

          {/* Divider */}
          <div className="h-px bg-gray-100 my-3 mx-1" />

          {/* Secondary group */}
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pb-2">Tools</p>
          {secondaryMenus.map((menu) => (
            <NavItem key={menu.path} menu={menu} />
          ))}
        </nav>

        {/* ── Footer / Logout ── */}
        <div className="flex-shrink-0 px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 hover:border-red-300 transition-colors duration-150"
          >
            <LogOut size={15} strokeWidth={2} />
            Logout
          </button>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;