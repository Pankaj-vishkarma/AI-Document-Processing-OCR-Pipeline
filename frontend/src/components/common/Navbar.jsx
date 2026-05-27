import { Menu } from "lucide-react";

/* ══════════════════════════════════════════════════
   NAVBAR STYLES — matches Login page design system
══════════════════════════════════════════════════ */
const NAVBAR_STYLES = `
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

  .nb-root {
    height: 68px;
    background: rgba(6,6,10,0.88);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-bottom: 1px solid var(--edge);
    display: flex;
    align-items: center;
    padding: 0 28px;
    position: sticky;
    top: 0;
    z-index: 100;
    font-family: 'DM Sans', sans-serif;
    -webkit-font-smoothing: antialiased;
    gap: 14px;
  }

  /* subtle top gradient accent line */
  .nb-root::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--glow-a), var(--glow-b), var(--glow-c), transparent);
    opacity: 0.45;
    pointer-events: none;
  }

  .nb-syne { font-family: 'Syne', sans-serif; }

  /* ── Hamburger button (hidden on desktop, shown on mobile/tablet) ── */
  .nb-menu-btn {
    display: none;
    width: 38px; height: 38px;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--edge);
    border-radius: 10px;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--muted);
    transition: background 0.18s, color 0.18s, border-color 0.18s;
    flex-shrink: 0;
  }
  .nb-menu-btn:hover {
    background: rgba(124,132,255,0.1);
    border-color: var(--accent);
    color: var(--text);
  }

  /* ── Page title block ── */
  .nb-title-wrap { display: flex; flex-direction: column; }

  .nb-page-title {
    font-weight: 800;
    font-size: 1.15rem;
    color: var(--text);
    line-height: 1.1;
    letter-spacing: -0.01em;
  }

  .nb-page-sub {
    font-size: 0.68rem;
    color: var(--muted);
    letter-spacing: 0.03em;
    margin-top: 2px;
  }

  /* ── Responsive ── */

  /* Tablet: show hamburger, shrink title slightly */
  @media (max-width: 1024px) {
    .nb-menu-btn { display: flex; }
    .nb-root { padding: 0 20px; }
    .nb-page-title { font-size: 1.05rem; }
  }

  /* Mobile: tighter padding, hide subtitle */
  @media (max-width: 480px) {
    .nb-root { padding: 0 14px; height: 60px; }
    .nb-page-title { font-size: 1rem; }
    .nb-page-sub { display: none; }
    .nb-menu-btn { width: 34px; height: 34px; border-radius: 9px; }
  }
`;

/* ══════════════════════════════════════════════════
   NAVBAR
══════════════════════════════════════════════════ */
const Navbar = ({ setMobileOpen, pageTitle = "Dashboard", pageSubtitle = "AI Document Processing Platform" }) => {
    return (
        <>
            <style>{NAVBAR_STYLES}</style>

            <header className="nb-root">

                {/* Hamburger — only visible on tablet/mobile */}
                <button
                    className="nb-menu-btn"
                    onClick={() => setMobileOpen?.(true)}
                    aria-label="Open sidebar"
                >
                    <Menu size={18} />
                </button>

                {/* Page title + subtitle */}
                <div className="nb-title-wrap">
                    <h2 className="nb-syne nb-page-title">{pageTitle}</h2>
                    <p className="nb-page-sub">{pageSubtitle}</p>
                </div>

            </header>
        </>
    );
};

export default Navbar;