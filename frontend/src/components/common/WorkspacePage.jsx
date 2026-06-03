const WORKSPACE_STYLES = `
  

  .ws-page, .ws-page * { box-sizing: border-box; }
  .ws-page {
    min-height: 100vh;
    background: var(--page-bg);
    color: var(--text);
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
  }
  .ws-page-container {
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    padding: 32px 28px 48px;
  }
  .ws-page-header { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:18px; margin-bottom:28px; }
  .ws-page-title { margin:0 0 10px; font-family: var(--font-display); font-weight:800; letter-spacing:-.02em; }
  .ws-page-subtitle { max-width:690px; margin:0; color:#cbd5e1; font-size:.95rem; line-height:1.7; }
  .ws-page h1, .ws-page h2, .ws-page h3, .ws-page h4 {
    font-family: var(--font-display);
    letter-spacing: -0.02em;
  }
  .ws-page h1 { color: #fff !important; font-size: clamp(1.8rem,3vw,2.4rem) !important; line-height: 1.08; }
  .ws-page h2 { color: #f8fafc !important; }
  .ws-page h3, .ws-page h4 { color: #e2e8f0 !important; }
  .ws-page .text-gray-900, .ws-page .text-slate-900, .ws-page .text-black { color: #f8fafc !important; }
  .ws-page .text-gray-800, .ws-page .text-slate-800,
  .ws-page .text-gray-700, .ws-page .text-slate-700,
  .ws-page .text-gray-600, .ws-page .text-slate-600 { color: #cbd5e1 !important; }
  .ws-page .text-gray-500, .ws-page .text-slate-500,
  .ws-page .text-gray-400, .ws-page .text-slate-400 { color: #94a3b8 !important; }

  .ws-page .bg-white {
    border-color: var(--border) !important;
    background: var(--surface) !important;
    box-shadow: var(--shadow-soft) !important;
    backdrop-filter: blur(20px);
  }
  .ws-page .bg-gray-50, .ws-page .bg-slate-50,
  .ws-page .bg-gray-100, .ws-page .bg-slate-100 {
    border-color: var(--border) !important;
    background: var(--surface-soft) !important;
  }
  .ws-page .bg-gray-200, .ws-page .bg-slate-200 { background: rgba(148,163,184,0.16) !important; }
  .ws-page .border-gray-100, .ws-page .border-slate-100,
  .ws-page .border-gray-200, .ws-page .border-slate-200,
  .ws-page .border-gray-300, .ws-page .border-slate-300 { border-color: rgba(148,163,184,0.18) !important; }
  .ws-page .hover\\:bg-gray-50:hover, .ws-page .hover\\:bg-slate-50:hover,
  .ws-page .hover\\:bg-gray-100:hover, .ws-page .hover\\:bg-slate-100:hover,
  .ws-page .hover\\:bg-gray-200:hover, .ws-page .hover\\:bg-slate-200:hover {
    background: rgba(255,255,255,0.09) !important;
  }

  .ws-page button, .ws-page label, .ws-page select { -webkit-tap-highlight-color: transparent; }
  .ws-page button {
    font-family: var(--font-display);
    letter-spacing: 0.01em;
    transition: transform .2s ease, box-shadow .2s ease, background .2s ease, border-color .2s ease;
  }
  .ws-page button:not(:disabled):hover { transform: translateY(-1px); }
  .ws-page button:focus-visible, .ws-page a:focus-visible,
  .ws-page input:focus-visible, .ws-page select:focus-visible {
    outline: 2px solid #60a5fa;
    outline-offset: 3px;
  }
  .ws-page .bg-black, .ws-page .bg-gray-900, .ws-page .bg-slate-900 {
    border-color: transparent !important;
    color: #fff !important;
    background: linear-gradient(135deg,#4f46e5,#2563eb) !important;
  }
  .ws-page button.bg-black:not(:disabled):hover, .ws-page button.bg-gray-900:not(:disabled):hover {
    box-shadow: 0 16px 30px rgba(79,70,229,0.28);
  }
  .ws-page button.border-black {
    border-color: rgba(59,130,246,0.36) !important;
    color: #bfdbfe !important;
    background: rgba(59,130,246,0.12) !important;
  }
  .ws-page button.border-black:not(:disabled):hover { background: rgba(59,130,246,0.22) !important; }
  .ws-page button.bg-blue-600 { background: linear-gradient(135deg,#4f46e5,#2563eb) !important; }
  .ws-page button.bg-green-600, .ws-page button.bg-emerald-500 { background: linear-gradient(135deg,#059669,#10b981) !important; }
  .ws-page button.bg-red-600, .ws-page button.bg-rose-500 { background: rgba(239,68,68,.82) !important; }
  .ws-page button.bg-amber-500 { background: rgba(217,119,6,.88) !important; }
  .ws-page input:not([type='checkbox']):not([type='range']):not([type='file']),
  .ws-page select, .ws-page textarea {
    border: 1px solid var(--border) !important;
    border-radius: 14px !important;
    color: var(--text) !important;
    background: var(--surface-soft) !important;
    outline: none;
    transition: border-color .2s ease, background .2s ease, box-shadow .2s ease;
  }
  .ws-page input:not([type='checkbox']):not([type='range']):focus,
  .ws-page select:focus, .ws-page textarea:focus {
    border-color: var(--accent) !important;
    background: var(--surface) !important;
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  .ws-page input::placeholder { color: var(--text-muted); }
  .ws-page option { color: var(--text); background: var(--surface); }
  .ws-page input[type='checkbox'], .ws-page input[type='range'] { accent-color: #4f46e5; }
  .ws-page table { border-collapse: collapse; }
  .ws-page thead { border-color: rgba(148,163,184,0.12) !important; background: rgba(255,255,255,0.03) !important; }
  .ws-page th {
    color: #94a3b8 !important;
    font-family: var(--font-display);
    font-size: .76rem !important;
    letter-spacing: .05em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .ws-page tbody tr { border-color: rgba(148,163,184,0.1) !important; transition: background .15s ease; }
  .ws-page tbody tr:hover { background: rgba(255,255,255,0.035) !important; }
  .ws-page td { color: #cbd5e1 !important; }
  .ws-page pre { color: #cbd5e1 !important; font-family: ui-monospace,SFMono-Regular,Menlo,monospace; font-size: .78rem; }

  .ws-page .bg-green-100, .ws-page .bg-emerald-50 { border-color: rgba(34,197,94,.25) !important; color: #bbf7d0 !important; background: rgba(34,197,94,.16) !important; }
  .ws-page .bg-blue-100 { border-color: rgba(59,130,246,.25) !important; color: #bfdbfe !important; background: rgba(59,130,246,.16) !important; }
  .ws-page .bg-red-100, .ws-page .bg-rose-50 { border-color: rgba(239,68,68,.25) !important; color: #fecaca !important; background: rgba(239,68,68,.16) !important; }
  .ws-page .bg-yellow-100, .ws-page .bg-amber-50 { border-color: rgba(245,158,11,.25) !important; color: #fde68a !important; background: rgba(245,158,11,.16) !important; }
  .ws-page .text-green-700, .ws-page .text-emerald-700 { color: #bbf7d0 !important; }
  .ws-page .text-blue-700 { color: #bfdbfe !important; }
  .ws-page .text-red-700, .ws-page .text-red-600 { color: #fecaca !important; }
  .ws-page .text-yellow-700, .ws-page .text-amber-700,
  .ws-page .text-amber-900, .ws-page .text-amber-950 { color: #fde68a !important; }

  .ws-dropzone { border-color: rgba(148,163,184,.35) !important; background: rgba(255,255,255,.025); }
  .ws-dropzone:hover { border-color: rgba(96,165,250,.55) !important; background: rgba(59,130,246,.06); }
  .ws-upload-item { background: rgba(255,255,255,.035); }
  .ws-progress-track { background: rgba(148,163,184,.16) !important; }
  .ws-progress-fill { background: linear-gradient(90deg,#4f46e5,#38bdf8) !important; }
  .ws-export-card { position: relative; overflow: hidden; transition: transform .2s ease,border-color .2s ease,box-shadow .2s ease; }
  .ws-export-card::before { content:''; position:absolute; inset:0 0 auto; height:3px; background: linear-gradient(90deg,#4f46e5,#22d3ee); opacity:.75; }
  .ws-export-card:hover { border-color: rgba(96,165,250,.4) !important; transform: translateY(-3px); box-shadow: 0 30px 64px rgba(0,0,0,.32) !important; }
  .ws-format-icon { background: rgba(59,130,246,.16) !important; color: #bfdbfe !important; border: 1px solid rgba(59,130,246,.26); }
  .ws-export-summary { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:18px 20px; border:1px solid rgba(148,163,184,.18); border-radius:18px; background:rgba(15,23,42,.72); box-shadow:0 20px 42px rgba(0,0,0,.18); backdrop-filter:blur(18px); }
  .ws-export-summary strong { display:block; color:#f8fafc; font-family: var(--font-display); font-size:.92rem; }
  .ws-export-summary span { color:#94a3b8; font-size:.82rem; }
  .ws-scope-chip { flex-shrink:0; padding:7px 12px; border:1px solid rgba(59,130,246,.28); border-radius:999px; color:#bfdbfe !important; background:rgba(59,130,246,.14); font-family: var(--font-display); font-size:.7rem !important; font-weight:700; letter-spacing:.06em; text-transform:uppercase; }
  .ws-workflow-hero { background: rgba(15,23,42,.82) !important; border-color: rgba(148,163,184,.18) !important; box-shadow: 0 24px 50px rgba(0,0,0,.24) !important; backdrop-filter: blur(20px); }
  .ws-workflow-hero > div > div:first-child > span { color: #bfdbfe !important; background: rgba(59,130,246,.12) !important; border-color: rgba(59,130,246,.28) !important; }
  .ws-stages { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
  .ws-stage { display:flex; align-items:center; gap:12px; padding:14px 16px; border:1px solid rgba(148,163,184,.16); border-radius:16px; color:#94a3b8; background:rgba(15,23,42,.62); }
  .ws-stage strong { display:grid; width:28px; height:28px; flex-shrink:0; place-items:center; border:1px solid rgba(59,130,246,.3); border-radius:50%; color:#bfdbfe; background:rgba(59,130,246,.14); font-family: var(--font-display); font-size:.72rem; }
  .ws-stage span { font-size:.8rem; font-weight:600; }
  .ws-page-strip { align-self: start; }
  .ws-viewer-stage { min-width: 0; }
  .ws-viewer-toolbar { position: sticky; bottom: 12px; z-index: 10; padding: 10px; border: 1px solid rgba(148,163,184,.18); border-radius: 16px; background: rgba(15,23,42,.9); backdrop-filter: blur(18px); box-shadow: 0 16px 32px rgba(0,0,0,.24); }
  .ws-data-panel { align-self: start; }
  .ws-review-actions { padding: 14px; border: 1px solid rgba(148,163,184,.16); border-radius: 18px; background: rgba(15,23,42,.62); backdrop-filter: blur(16px); }
  .ws-review-field { background: rgba(255,255,255,.035) !important; border-color: rgba(148,163,184,.18) !important; }
  .ws-review-field.ws-selected { border-color: rgba(34,197,94,.45) !important; background: rgba(34,197,94,.08) !important; }

  @media (min-width:1280px) {
    .ws-page-strip, .ws-data-panel { position: sticky; top: 20px; }
  }
  @media (max-width:1024px) {
    .ws-page-container { padding: 24px 20px 40px; }
  }
  @media (max-width:768px) {
    .ws-page-container { padding: 20px 16px 38px; }
    .ws-page h1 { font-size: 1.6rem !important; }
    .ws-page .rounded-3xl, .ws-page .rounded-4xl { border-radius: 18px; }
    .ws-page th, .ws-page td { padding-left: 14px !important; padding-right: 14px !important; }
    .ws-viewer-toolbar { position: static; }
    .ws-stages { grid-template-columns:1fr; gap:8px; }
    .ws-export-summary { align-items:flex-start; flex-direction:column; }
  }
  @media (prefers-reduced-motion:reduce) {
    .ws-page *, .ws-page *::before, .ws-page *::after { animation-duration:.01ms !important; transition-duration:.01ms !important; }
  }
`;

const WorkspacePage = ({ children }) => (
    <>
        <style>{WORKSPACE_STYLES}</style>
        <div className="ws-page">
            <div className="ws-page-container">
                {children}
            </div>
        </div>
    </>
);

export default WorkspacePage;
