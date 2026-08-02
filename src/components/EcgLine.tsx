/**
 * A thin animated ECG/heartbeat trace — a small medical motif used as a
 * decorative divider under headers. Purely visual, no data.
 */
export function EcgLine({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 40"
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0 20 H90 L102 20 L110 4 L120 36 L130 20 L140 20 L150 8 L158 20 H340"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-ecg"
      />
    </svg>
  );
}
