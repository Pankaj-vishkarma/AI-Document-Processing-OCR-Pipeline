import {
    LayoutDashboard,
    Upload,
    FileText,
    Layers,
    BarChart3,
    FileSearch,
    LogOut,
    Download,
    LayoutTemplate,
    SlidersHorizontal,
    ClipboardCheck,
    ChevronRight,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/* ═══════════════════════════════════════════════════
   SIDEBAR CSS — matches Login page design system
═══════════════════════════════════════════════════ */
const SIDEBAR_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
    --ink:    #06060a;
    --edge:   rgba(255,255,255,0.08);
    --glow-a: #5b6ef5;
    --glow-b: #a855f7;
    --glow-c: #22d3ee;
    --text:   #e8e8f0;
    --muted:  #8888a8;
    --accent: #7c84ff;
  }

  /* ── Sidebar shell ── */
  .sb-shell {
    position: fixed;
    top: 0; left: 0;
    height: 100vh;
    width: 268px;
    background: linear-gradient(160deg, #08080f 0%, #0b0b18 60%, #070710 100%);
    border-right: 1px solid var(--edge);
    display: flex;
    flex-direction: column;
    z-index: 50;
    overflow: hidden;
    font-family: 'DM Sans', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Ambient glow blobs inside sidebar ── */
  @keyframes sbBlobA { 0%,100%{transform:translate(0,0);} 50%{transform:translate(18px,-24px);} }
  @keyframes sbBlobB { 0%,100%{transform:translate(0,0);} 50%{transform:translate(-14px,20px);} }
  .sb-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(54px);
    pointer-events: none;
    will-change: transform;
  }
  .sb-blob-a {
    width: 200px; height: 200px;
    background: radial-gradient(circle, rgba(91,110,245,0.18), transparent 70%);
    top: -60px; left: -40px;
    animation: sbBlobA 12s ease-in-out infinite;
  }
  .sb-blob-b {
    width: 160px; height: 160px;
    background: radial-gradient(circle, rgba(168,85,247,0.14), transparent 70%);
    bottom: 60px; right: -30px;
    animation: sbBlobB 16s ease-in-out infinite;
  }

  /* ── Logo section ── */
  .sb-logo {
    padding: 22px 20px 18px;
    border-bottom: 1px solid var(--edge);
    position: relative;
    flex-shrink: 0;
  }
  .sb-logo-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;
  }
  .sb-logo-icon {
    width: 34px; height: 34px;
    background: linear-gradient(135deg, var(--glow-a), var(--glow-b));
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
    box-shadow: 0 4px 16px rgba(91,110,245,0.35);
    flex-shrink: 0;
  }
  .sb-logo-name {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 1.05rem;
    color: var(--text);
    letter-spacing: 0.02em;
  }
  .sb-logo-sub {
    font-size: 0.7rem;
    color: var(--muted);
    letter-spacing: 0.04em;
    padding-left: 44px;
  }

  /* ── Status pill ── */
  .sb-status {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 9px;
    border-radius: 100px;
    border: 1px solid rgba(91,110,245,0.28);
    background: rgba(91,110,245,0.08);
    font-size: 0.62rem;
    color: var(--accent);
    font-weight: 600;
    letter-spacing: 0.04em;
    margin-top: 10px;
    font-family: 'Syne', sans-serif;
  }
  .sb-status-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 5px var(--accent);
    animation: sbPulse 2s ease-in-out infinite;
  }
  @keyframes sbPulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }

  /* ── Section label ── */
  .sb-section-label {
    font-size: 0.6rem;
    font-weight: 700;
    color: var(--muted);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 14px 20px 6px;
    font-family: 'Syne', sans-serif;
  }

  /* ── Nav items ── */
  .sb-nav {
    flex: 1;
    overflow-y: auto;
    padding: 8px 10px;
    scrollbar-width: none;
  }
  .sb-nav::-webkit-scrollbar { display: none; }

  .sb-link {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 10px 12px;
    border-radius: 11px;
    margin-bottom: 2px;
    text-decoration: none;
    color: var(--muted);
    font-size: 0.88rem;
    font-weight: 500;
    transition: background 0.18s, color 0.18s, box-shadow 0.18s;
    position: relative;
    cursor: pointer;
    border: 1px solid transparent;
  }
  .sb-link:hover {
    background: rgba(255,255,255,0.05);
    color: var(--text);
    border-color: var(--edge);
  }
  .sb-link.active {
    background: linear-gradient(135deg, rgba(91,110,245,0.18), rgba(168,85,247,0.12));
    color: var(--text);
    border-color: rgba(91,110,245,0.3);
    box-shadow: 0 2px 12px rgba(91,110,245,0.12);
  }
  .sb-link.active .sb-link-icon {
    color: var(--accent);
  }
  .sb-link.active .sb-active-dot {
    opacity: 1;
  }
  .sb-link-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px; height: 30px;
    border-radius: 8px;
    background: rgba(255,255,255,0.04);
    flex-shrink: 0;
    transition: background 0.18s, color 0.18s;
    color: var(--muted);
  }
  .sb-link:hover .sb-link-icon {
    background: rgba(255,255,255,0.07);
    color: var(--text);
  }
  .sb-link.active .sb-link-icon {
    background: rgba(91,110,245,0.18);
  }
  .sb-link-label {
    flex: 1;
    font-family: 'DM Sans', sans-serif;
  }
  .sb-active-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 6px var(--accent);
    opacity: 0;
    transition: opacity 0.18s;
    flex-shrink: 0;
  }
  .sb-chevron {
    opacity: 0;
    transition: opacity 0.18s, transform 0.18s;
    color: var(--muted);
    flex-shrink: 0;
  }
  .sb-link:hover .sb-chevron {
    opacity: 1;
    transform: translateX(2px);
  }

  /* ── Divider ── */
  .sb-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--edge), transparent);
    margin: 6px 10px;
  }

  /* ── Footer ── */
  .sb-footer {
    padding: 12px 10px 16px;
    border-top: 1px solid var(--edge);
    flex-shrink: 0;
  }
  .sb-logout {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 11px 16px;
    border-radius: 11px;
    border: 1px solid rgba(248,113,113,0.22);
    background: rgba(248,113,113,0.07);
    color: #f87171;
    font-family: 'Syne', sans-serif;
    font-size: 0.88rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    cursor: pointer;
    transition: background 0.18s, border-color 0.18s, box-shadow 0.18s, transform 0.15s;
  }
  .sb-logout:hover {
    background: rgba(248,113,113,0.13);
    border-color: rgba(248,113,113,0.42);
    box-shadow: 0 4px 16px rgba(248,113,113,0.16);
    transform: translateY(-1px);
  }
  .sb-logout:active { transform: scale(0.975); }

  /* ── Mobile overlay ── */
  .sb-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(3px);
    z-index: 40;
  }

  /* ── Slide-in transition ── */
  .sb-slide-enter  { transform: translateX(-100%); }
  .sb-slide-active { transform: translateX(0);    transition: transform 0.28s cubic-bezier(0.32,0.72,0,1); }

  /* ── Responsive ── */
  @media (max-width: 1023px) {
    .sb-shell {
      transform: translateX(-100%);
      transition: transform 0.28s cubic-bezier(0.32,0.72,0,1);
    }
    .sb-shell.sb-open {
      transform: translateX(0);
    }
  }
  @media (min-width: 1024px) {
    .sb-shell {
      position: sticky !important;
      transform: translateX(0) !important;
    }
    .sb-overlay { display: none !important; }
  }
`;

/* ═══════════════════════════════════
   Sidebar component
═══════════════════════════════════ */
const Sidebar = ({ mobileOpen, setMobileOpen }) => {

    /* ── original logic — untouched ── */
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

    /* split menus into two visual groups */
    const primaryMenus = menus.slice(0, 5);   /* Dashboard → PDF Viewer */
    const secondaryMenus = menus.slice(5);        /* Export → Review       */

    return (
        <>
            <style>{SIDEBAR_STYLES}</style>

            {/* ── Mobile overlay ── */}
            {mobileOpen && (
                <div
                    className="sb-overlay"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* ── Sidebar shell ── */}
            <aside className={`sb-shell${mobileOpen ? " sb-open" : ""}`}>

                {/* Ambient blobs */}
                <div className="sb-blob sb-blob-a" />
                <div className="sb-blob sb-blob-b" />

                {/* ── Logo ── */}
                <div className="sb-logo">
                    <div className="sb-logo-row">
                        <div className="sb-logo-icon">⚡</div>
                        <span className="sb-logo-name">DocIntel</span>
                    </div>
                    <div className="sb-logo-sub">OCR &amp; Extraction Platform</div>
                    <div className="sb-status">
                        <span className="sb-status-dot" />
                        AI Engine Active
                    </div>
                </div>

                {/* ── Navigation ── */}
                <nav className="sb-nav">

                    {/* Primary group */}
                    <div className="sb-section-label">Main</div>
                    {primaryMenus.map((menu) => {
                        const Icon = menu.icon;
                        return (
                            <NavLink
                                key={menu.path}
                                to={menu.path}
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) =>
                                    `sb-link${isActive ? " active" : ""}`
                                }
                            >
                                <span className="sb-link-icon">
                                    <Icon size={15} />
                                </span>
                                <span className="sb-link-label">{menu.name}</span>
                                <span className="sb-active-dot" />
                                <ChevronRight size={13} className="sb-chevron" />
                            </NavLink>
                        );
                    })}

                    <div className="sb-divider" />

                    {/* Secondary group */}
                    <div className="sb-section-label">Tools</div>
                    {secondaryMenus.map((menu) => {
                        const Icon = menu.icon;
                        return (
                            <NavLink
                                key={menu.path}
                                to={menu.path}
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) =>
                                    `sb-link${isActive ? " active" : ""}`
                                }
                            >
                                <span className="sb-link-icon">
                                    <Icon size={15} />
                                </span>
                                <span className="sb-link-label">{menu.name}</span>
                                <span className="sb-active-dot" />
                                <ChevronRight size={13} className="sb-chevron" />
                            </NavLink>
                        );
                    })}

                </nav>

                {/* ── Footer / Logout ── */}
                <div className="sb-footer">
                    <button className="sb-logout" onClick={handleLogout}>
                        <LogOut size={15} />
                        Logout
                    </button>
                </div>

            </aside>
        </>
    );
};

export default Sidebar;