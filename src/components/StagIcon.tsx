/** Reusable stag-antler SVG icon — the NadirPoise brand motif */

interface StagIconProps {
  size?: number;
  className?: string;
  variant?: "default" | "watermark" | "glyph";
}

export default function StagIcon({ size = 26, className = "", variant = "default" }: StagIconProps) {
  const opacity = variant === "watermark" ? 0.12 : variant === "glyph" ? 0.4 : 0.9;
  const accentClass = variant === "watermark" ? "text-chrome/30" : "text-accent-teal";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform duration-300 ${className}`}
      style={{ opacity }}
    >
      {/* Stag head / antlers */}
      <path
        d="M50 8L56 28L72 18L62 34L80 32L66 42L84 50L64 50L74 62L54 52L54 72L46 72L46 52L26 62L36 50L16 50L34 42L20 32L38 34L28 18L44 28Z"
        fill="currentColor"
        className={accentClass}
      />
      {/* Eyes */}
      <circle cx="45" cy="38" r="3.5" fill="currentColor" className="text-bg-base" />
      <circle cx="55" cy="38" r="3.5" fill="currentColor" className="text-bg-base" />
      {/* Antler tines */}
      <path
        d="M38 18L42 8L48 14"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className={`${accentClass} opacity-70`}
      />
      <path
        d="M62 18L58 8L52 14"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className={`${accentClass} opacity-70`}
      />
      {/* Crown detail */}
      <path
        d="M44 28L50 22L56 28"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className={`${accentClass} opacity-50`}
      />
    </svg>
  );
}