import type { ReactNode } from "react";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

export function Eyebrow({
  children,
  tone = "ember",
}: {
  children: ReactNode;
  tone?: "ember" | "light";
}) {
  const color = tone === "light" ? "text-sand-deep" : "text-ember";
  return (
    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${color}`}>
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  tone = "dark",
  align = "left",
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  tone?: "dark" | "light";
  align?: "left" | "center";
}) {
  const light = tone === "light";
  return (
    <div className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      {eyebrow ? <Eyebrow tone={light ? "light" : "ember"}>{eyebrow}</Eyebrow> : null}
      <h2
        className={`mt-3 font-display text-3xl leading-tight font-medium sm:text-4xl ${
          light ? "text-paper" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {intro ? (
        <p className={`mt-4 text-base leading-relaxed sm:text-lg ${light ? "text-sand" : "text-ink-soft"}`}>
          {intro}
        </p>
      ) : null}
    </div>
  );
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors";

export const buttonStyles = {
  primary: `${buttonBase} bg-ember text-white hover:bg-ember-deep`,
  secondary: `${buttonBase} border border-ink/20 text-ink hover:border-ink/40 hover:bg-sand`,
  light: `${buttonBase} bg-paper text-ink hover:bg-sand`,
};

export function CheckIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M5 10.5l3.2 3.2L15 6.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
