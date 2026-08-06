import { NavLink } from "react-router-dom";
import StagIcon from "./StagIcon";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/schedule", label: "Schedule" },
  { to: "/stress-test", label: "Stress Test" },
  { to: "/employee", label: "Employee" },
  { to: "/archive", label: "Archive" },
];

export default function Header() {
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

        {/* Navigation tabs — warm paper style */}
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
    </header>
  );
}