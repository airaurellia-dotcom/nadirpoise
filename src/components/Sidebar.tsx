import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Zap,
  ShieldCheck,
  Settings,
  X,
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

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({ isMobileOpen, onCloseMobile }: SidebarProps) {
  const { state } = useAppState();
  const location = useLocation();

  const navItems = NAV_BY_PERSONA[state.persona];

  // Close drawer on Escape key
  useEffect(() => {
    if (!isMobileOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseMobile();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isMobileOpen]);

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
              onClick={onCloseMobile}
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

      {/* Mobile drawer — slides in from the left */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${
          isMobileOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!isMobileOpen}
      >
        {/* Scrim */}
        <div
          className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${
            isMobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={onCloseMobile}
        />

        {/* Drawer panel */}
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={`absolute inset-y-0 left-0 h-full w-[280px] border-r border-[#334155]/15 bg-white shadow-xl transition-transform duration-300 ease-out ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <button
            onClick={onCloseMobile}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-sm text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
          {sidebarContent}
        </aside>
      </div>
    </>
  );
}
