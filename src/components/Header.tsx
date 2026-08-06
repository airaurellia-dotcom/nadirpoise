import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/schedule", label: "Schedule" },
  { to: "/stress-test", label: "Stress Test" },
  { to: "/archive", label: "Archive" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-glass-border bg-bg-base/80 backdrop-blur-xl">
      <div className="mx-auto flex h-nav max-w-6xl items-center justify-between px-4">
        {/* Logo area — Stag + NadirPoise */}
        <NavLink to="/" className="group flex items-center gap-2.5">
          {/* Stag head SVG logo */}
          <svg
            width="26"
            height="26"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="transition-transform duration-300 group-hover:scale-110"
          >
            {/* Stag head */}
            <path
              d="M50 8L56 28L72 18L62 34L80 32L66 42L84 50L64 50L74 62L54 52L54 72L46 72L46 52L26 62L36 50L16 50L34 42L20 32L38 34L28 18L44 28Z"
              fill="currentColor"
              className="text-accent-teal"
              opacity="0.9"
            />
            {/* Eyes */}
            <circle cx="45" cy="38" r="3.5" fill="var(--color-bg-base)" />
            <circle cx="55" cy="38" r="3.5" fill="var(--color-bg-base)" />
            {/* Antler detail */}
            <path
              d="M38 18L42 8L48 14"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="text-accent-teal/70"
            />
            <path
              d="M62 18L58 8L52 14"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="text-accent-teal/70"
            />
          </svg>
          <span className="text-sm font-semibold tracking-wide text-text-primary">
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