import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

export default function AppShell() {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const toggleMobileDrawer = () => setMobileDrawerOpen((prev) => !prev);
  const closeMobileDrawer = () => setMobileDrawerOpen(false);

  return (
    <div className="flex min-h-screen bg-bg-base">
      {/* Sidebar - fixed on md+, mobile drawer controlled from AppShell */}
      <Sidebar isMobileOpen={mobileDrawerOpen} onCloseMobile={closeMobileDrawer} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col md:ml-[260px]">
        <TopNavbar onToggleMobile={toggleMobileDrawer} />
        <main className="flex-1 px-4 py-5 md:px-6 md:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
