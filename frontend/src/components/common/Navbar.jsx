import { Menu } from "lucide-react";

const Navbar = ({ setMobileOpen, pageTitle = "Dashboard", pageSubtitle = "AI Document Processing Platform" }) => {
  return (
    <header className="sticky top-0 z-40 h-14 sm:h-16 bg-white border-b border-gray-200 flex items-center gap-3 px-4 sm:px-6 flex-shrink-0">

      {/* Hamburger — mobile & tablet only */}
      <button
        onClick={() => setMobileOpen?.(true)}
        aria-label="Open sidebar"
        className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 hover:border-gray-300 hover:text-blue-600 transition-colors duration-150 flex-shrink-0"
      >
        <Menu size={16} strokeWidth={2} />
      </button>

      {/* Page title + subtitle */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight leading-tight truncate">
          {pageTitle}
        </h2>
        <p className="hidden sm:block text-[10px] font-semibold text-gray-400 uppercase tracking-widest leading-none truncate">
          {pageSubtitle}
        </p>
      </div>

    </header>
  );
};

export default Navbar;