import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Zap,
  ShieldCheck,
  Settings,
  X,
  Menu,
} from "lucide-react";
import StagIcon from "./StagIcon";
import { useAppState } from "../context/AppContext";
import type { Persona } from "../types";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard & Fleet Roster", icon: <LayoutDashboard size={16} /> },
  { to: "/schedule", label: "Circadian Schedule", icon: <Calendar size={16} /> },
  { to: "/stress-test", label: "AI Stress Test", icon: <Zap size={16} /> },
  { to: "/dispatch", label: "Dispatch Gate & Voice Override", icon: <ShieldCheck size={16} /> },
  { to: "/settings", label: "System Settings", icon: <Settings size={16} /> },
];

const NAV_BY_PERSONA: Record<Persona, NavItem[]> = {
  shift_manager: ALL_NAV_ITEMS,
  employee: ALL_NAV_ITEMS.filter((n) => n.to === "/dashboard" || n.to === "/schedule"),
  auditor: ALL_NAV_ITEMS.filter((n) => n.to === "/dashboard" || n.to === "/dispatch" || n.to === "/settings"),
};

export default function Sidebar() {
  const { state } = useAppState();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = NAV_BY_PERSONA[state.persona];

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Branding */}
      <div className="flex items-center gap-3 border-b border-[#334155]/15 px-5 py-4">
        <StagIcon size={28} />
        <div>
          <h1 className="font-heading text-sm font-bold tracking-tight text-text-primary">
            NadirPoise
          </h1>
          <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-text-muted">
            NexaGlobal Terminal (24/7)
          </p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.to === "/dashboard"
              ? location.pathname === "/dashboard"
              : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard"}
              onClick={() => setMobileOpen(false)}
              className={`sidebar-nav-item ${isActive ? "active" : ""}`}
            >
              <span className="shrink-0 text-current opacity-70">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer status badges */}
      <div className="border-t border-[#334155]/15 px-5 py-3 space-y-2">
        <div className="flex items-center gap-2 text-[10px] text-text-muted">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-fatigue-green" />
          <span>NASA POWER API: Connected</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-text-muted">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-fatigue-green" />
          <span>JS Rules Engine: Active</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] border-r border-[#334155]/15 bg-white md:flex md:flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="btn-chrome fixed left-3 top-3 z-50 flex h-8 w-8 items-center justify-center rounded-sm md:hidden"
        aria-label="Open navigation menu"
      >
        <Menu size={16} />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative h-screen w-[260px] animate-slide-up border-r border-[#334155]/15 bg-white shadow-lg">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-sm text-text-muted hover:bg-bg-hover hover:text-text-primary"
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}