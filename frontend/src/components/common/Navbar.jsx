import { Menu } from "lucide-react";

const Navbar = ({ setMobileOpen }) => {

    return (
        <header className="h-[80px] bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">

            <div className="flex items-center gap-4">

                <button
                    onClick={() => setMobileOpen(true)}
                    className="lg:hidden"
                >
                    <Menu size={26} />
                </button>

                <div>

                    <h2 className="text-2xl font-bold text-gray-900">
                        Dashboard
                    </h2>

                    <p className="text-sm text-gray-500">
                        AI Document Processing Platform
                    </p>

                </div>

            </div>

        </header>
    );
};

export default Navbar;