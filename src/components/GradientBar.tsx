/** Shared 5-hue gradient strip used as a decorative accent across pages. */
export const SPECTRUM_GRADIENT =
  "linear-gradient(90deg, oklch(0.62 0.18 20), oklch(0.7 0.16 90), oklch(0.62 0.15 160), oklch(0.58 0.16 250), oklch(0.55 0.18 320))";

export function GradientBar({ className = "" }: { className?: string }) {
  return (
    <div
      className={className}
      style={{ background: SPECTRUM_GRADIENT }}
    />
  );
}
