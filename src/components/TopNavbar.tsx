import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  LogOut,
  User,
  Check,
} from "lucide-react";
import { useAppState } from "../context/AppContext";
import { PERSONA_DEFAULT_ROUTE, PERSONA_DESCRIPTIONS } from "../types";
import type { Persona } from "../types";

const BREADCRUMB_MAP: Record<string, string> = {
  "/dashboard": "Dashboard / Fleet Fatigue Index",
  "/schedule": "Schedule / Circadian Generator",
  "/stress-test": "Stress Test / 5-Persona Simulation",
  "/dispatch": "Dispatch / Gate & Voice Override",
  "/archive": "Archive / Proof Receipts",
  "/settings": "Settings / System Configuration",
  "/employee": "Employee / Personal Circadian View",
};

function getBreadcrumb(pathname: string): string {
  // Check exact match first
  if (BREADCRUMB_MAP[pathname]) return BREADCRUMB_MAP[pathname];
  // Check prefix matches
  const prefix = Object.keys(BREADCRUMB_MAP).find((k) => pathname.startsWith(k));
  return prefix ? BREADCRUMB_MAP[prefix] : "Dashboard / Fleet Fatigue Index";
}

const PERSONA_COLORS: Record<Persona, string> = {
  shift_manager: "bg-rose",
  employee: "bg-chrome-dark",
  auditor: "bg-brass",
};

const PERSONA_LIST: Persona[] = ["shift_manager", "employee", "auditor"];

export default function TopNavbar() {
  const { state, login, logout } = useAppState();
  const { user, persona } = state;
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [dropdownOpen]);

  const breadcrumb = getBreadcrumb(location.pathname);

  // Derive initials from display name
  const initials = user
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  const handleSwitchRole = (p: Persona) => {
    login(p);
    setDropdownOpen(false);
    navigate(PERSONA_DEFAULT_ROUTE[p]);
  };

  const handleSignOut = () => {
    logout();
    setDropdownOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#334155]/15 bg-white/95 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-secondary">
            {breadcrumb}
          </span>
        </div>

        {/* User Profile Card */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="btn-chrome flex items-center gap-2.5 rounded-sm px-3 py-1.5 text-xs font-medium"
          >
            <span className={`flex h-6 w-6 items-center justify-center rounded-sm text-[10px] font-bold text-white ${PERSONA_COLORS[persona]}`}>
              {initials}
            </span>
            <div className="flex flex-col items-start text-left">
              <span className="text-[11px] font-medium leading-tight text-text-primary">
                {user?.displayName ?? "User"}
              </span>
              <span className="text-[9px] leading-tight text-text-muted">
                {user?.role ?? ""}
              </span>
            </div>
            <ChevronDown
              size={12}
              className={`shrink-0 text-text-muted transition-transform duration-150 ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-[260px] animate-fade-in rounded-sm border border-[#334155]/15 bg-white py-1.5 shadow-[4px_4px_0px_0px_rgba(30,41,59,0.12)]">
              {/* Current user header */}
              <div className="flex items-center gap-3 border-b border-[#334155]/10 px-3 pb-2 mb-1">
                <span className={`flex h-8 w-8 items-center justify-center rounded-sm text-xs font-bold text-white ${PERSONA_COLORS[persona]}`}>
                  {initials}
                </span>
                <div>
                  <p className="text-xs font-medium text-text-primary">{user?.displayName}</p>
                  <p className="text-[10px] text-text-muted">{user?.role}</p>
                  <p className="text-[9px] text-text-muted/60">{user?.email}</p>
                </div>
              </div>

              {/* Switch Perspective */}
              <p className="px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                Switch Perspective
              </p>
              {PERSONA_LIST.map((p) => (
                <button
                  key={p}
                  onClick={() => handleSwitchRole(p)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-xs transition-colors duration-150 ${
                    persona === p
                      ? "bg-bg-elevated text-text-primary"
                      : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                  }`}
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-[10px] font-bold text-white ${PERSONA_COLORS[p]}`}>
                    <User size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {p === "shift_manager" ? "Shift Manager (Full Access)" :
                       p === "employee" ? "Frontline Staff (Amir Hassan)" :
                       "Safety Auditor"}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {PERSONA_DESCRIPTIONS[p]}
                    </p>
                  </div>
                  {persona === p && (
                    <Check size={12} className="shrink-0 text-rose" />
                  )}
                </button>
              ))}

              {/* Divider + Sign Out */}
              <div className="mt-1 border-t border-[#334155]/10 pt-1">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs text-text-secondary transition-colors duration-150 hover:bg-verd-reject-bg hover:text-verd-reject"
                >
                  <LogOut size={14} />
                  <span className="font-medium">Sign Out / Back to Landing Page</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}