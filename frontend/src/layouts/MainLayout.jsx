import { useState } from "react";

import Sidebar from "../components/common/Sidebar";
import Navbar from "../components/common/Navbar";

const MainLayout = ({ children }) => {

    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="flex bg-[#f9fafb]">

            <Sidebar
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />

            <div className="flex-1 min-h-screen overflow-hidden">

                <Navbar setMobileOpen={setMobileOpen} />

                <main className="p-4 lg:p-8 overflow-x-hidden">
                    {children}
                </main>

            </div>

        </div>
    );
};

export default MainLayout;