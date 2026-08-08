import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

export default function AppShell() {
  return (
    <div className="flex min-h-screen bg-bg-base">
      {/* Sidebar - fixed on md+, hidden on mobile */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col md:ml-[260px]">
        <TopNavbar />
        <main className="flex-1 px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}