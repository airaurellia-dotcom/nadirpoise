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
    <header className="sticky top-0 z-50 border-b border-glass-border bg-bg-base/80 backdrop-blur-xl">
      <div className="mx-auto flex h-nav max-w-6xl items-center justify-between px-4">
        {/* Logo area — Stag + NadirPoise */}
        <NavLink to="/" className="group flex items-center gap-2.5">
          <StagIcon size={26} />
          <span className="font-heading text-sm font-bold tracking-wide text-text-primary">
            Nadir<wbr />Poise
          </span>
        </NavLink>

        {/* Navigation tabs — glass effect */}
        <nav className="flex items-center gap-1 rounded-xl border border-glass-border bg-glass-bg p-0.5 backdrop-blur-md">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-bg-elevated text-text-primary shadow-sm"
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