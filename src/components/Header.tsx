import { NavLink, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import StagIcon from "./StagIcon";
import { useAppState } from "../context/AppContext";
import { PERSONA_LABELS, type Persona } from "../types";

const ALL_NAV_ITEMS = [
  { to: "/", label: "Dashboard" },
  { to: "/schedule", label: "Schedule" },
  { to: "/stress-test", label: "Stress Test" },
  { to: "/employee", label: "Employee" },
  { to: "/archive", label: "Archive" },
] as const;

/** Which nav items each persona can see */
const NAV_BY_PERSONA: Record<Persona, typeof ALL_NAV_ITEMS[number][]> = {
  shift_manager: [...ALL_NAV_ITEMS],
  employee: ALL_NAV_ITEMS.filter((n) => n.to === "/" || n.to === "/employee"),
  auditor: ALL_NAV_ITEMS.filter((n) => n.to === "/archive"),
};

/** Route to navigate to when persona is selected */
const PERSONA_ROUTE: Record<Persona, string> = {
  shift_manager: "/",
  employee: "/employee",
  auditor: "/archive",
};

const PERSONA_ICONS: Record<Persona, string> = {
  shift_manager: "⚙",
  employee: "👤",
  auditor: "✓",
};

const PERSONAS: Persona[] = ["shift_manager", "employee", "auditor"];

export default function Header() {
  const { state, setPersona } = useAppState();
  const navigate = useNavigate();
  const { persona } = state;
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

  function handlePersonaSelect(p: Persona) {
    setPersona(p);
    setDropdownOpen(false);
    navigate(PERSONA_ROUTE[p]);
  }

  const navItems = NAV_BY_PERSONA[persona];

  return (
    <header className="sticky top-0 z-50 border-b border-[#334155]/15 bg-[#F8F6F0]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-nav max-w-6xl items-center justify-between px-4">
        {/* Logo area — Stag + NadirPoise */}
        <NavLink to="/" className="group flex items-center gap-2.5">
          <StagIcon size={26} />
          <span className="font-heading text-sm font-bold tracking-wide text-text-primary">
            Nadir<wbr />Poise
          </span>
        </NavLink>

        {/* Persona Switcher + Navigation — warm paper style */}
        <div className="flex items-center gap-3">
          {/* Persona Switcher Dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="btn-chrome flex items-center gap-2 rounded-sm px-3 py-1.5 text-[11px] font-medium"
            >
              <span>{PERSONA_ICONS[persona]}</span>
              <span className="max-w-[160px] truncate sm:max-w-[220px]">
                {PERSONA_LABELS[persona]}
              </span>
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`shrink-0 text-text-muted transition-transform duration-150 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-[280px] animate-fade-in rounded-sm border border-[#334155]/15 bg-white py-1 shadow-[4px_4px_0px_0px_rgba(30,41,59,0.12)]">
                <p className="px-3 pb-1 pt-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                  Switch Perspective
                </p>
                {PERSONAS.map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePersonaSelect(p)}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left text-xs transition-colors duration-150 ${
                      persona === p
                        ? "bg-bg-elevated text-text-primary"
                        : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                    }`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-[#334155]/15 bg-white text-xs">
                      {PERSONA_ICONS[p]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{PERSONA_LABELS[p]}</p>
                      <p className="text-[10px] text-text-muted">
                        {p === "shift_manager"
                          ? "Full operational access"
                          : p === "employee"
                            ? "Personal circadian view"
                            : "Archive & compliance"}
                      </p>
                    </div>
                    {persona === p && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0 text-rose"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation tabs */}
          <nav className="flex items-center gap-1 rounded-sm border border-[#334155]/15 bg-white p-0.5 shadow-[2px_2px_0px_0px_rgba(30,41,59,0.08)]">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `rounded-sm px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-bg-elevated text-text-primary shadow-[1px_1px_0px_0px_rgba(30,41,59,0.08)]"
                      : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}