/**
 * Lightweight inline SVG icons (no external dependency, RTL-safe, tree-shaken).
 * `ServiceIcon` maps the backend category `icon` key to a glyph.
 */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = (props: P) => ({
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

/* ── Service icons (keys come from ServiceCategory.icon) ─────────────── */
export const icons = {
  home: (p: P) => (
    <svg {...base(p)}><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9" /><path d="M9 20v-6h6v6" /></svg>
  ),
  droplet: (p: P) => (
    <svg {...base(p)}><path d="M12 2.7c2.6 3 6 6.4 6 10.3a6 6 0 1 1-12 0c0-3.9 3.4-7.3 6-10.3Z" /></svg>
  ),
  hammer: (p: P) => (
    <svg {...base(p)}><path d="m14 10-9.3 9.3a1.4 1.4 0 0 1-2-2L12 8" /><path d="m17.5 13.5 3-3" /><path d="M14.5 6.5 18 3l3 3-3.5 3.5-3-3Z" /><path d="m9.5 10.5 4-4" /></svg>
  ),
  wrench: (p: P) => (
    <svg {...base(p)}><path d="M14.7 6.3a4 4 0 0 0-5.2 5.2L3 18l3 3 6.5-6.5a4 4 0 0 0 5.2-5.2l-2.4 2.4-2.8-2.8 2.4-2.4Z" /></svg>
  ),
  truck: (p: P) => (
    <svg {...base(p)}><path d="M2 6h11v9H2z" /><path d="M13 9h4l3 3v3h-7" /><circle cx="6.5" cy="17.5" r="1.6" /><circle cx="16.5" cy="17.5" r="1.6" /></svg>
  ),
  leaf: (p: P) => (
    <svg {...base(p)}><path d="M11 20A7 7 0 0 1 4 13c0-5 4.5-8.5 16-9-1 9-4 14-9 14-2.4 0-4-1.6-4-4 0-3 3-5 7-6" /></svg>
  ),
  sparkles: (p: P) => (
    <svg {...base(p)}><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" /><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" /></svg>
  ),
  forklift: (p: P) => (
    <svg {...base(p)}><circle cx="6" cy="18" r="2" /><circle cx="13" cy="18" r="2" /><path d="M8 18h3" /><path d="M4 18V7h6v8" /><path d="M10 9h4l3 4v5" /><path d="M19 16V4M19 4h-4" /></svg>
  ),
} as const;

export type ServiceIconKey = keyof typeof icons;

export function ServiceIcon({ name, ...props }: { name: string } & P) {
  const Glyph = icons[(name as ServiceIconKey)] ?? icons.home;
  return <Glyph {...props} />;
}

/* ── UI icons ────────────────────────────────────────────────────────── */
export const Phone = (p: P) => (
  <svg {...base(p)}><path d="M5 3h3l1.5 4.5L7.5 9a12 12 0 0 0 5.5 5.5l1.5-2L19 18v3a1 1 0 0 1-1 1A16 16 0 0 1 3 5a1 1 0 0 1 1-1Z" /></svg>
);
export const WhatsApp = (p: P) => (
  <svg {...base({ strokeWidth: 0, fill: "currentColor", ...p })}><path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.02ZM12.04 20.1a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23a8.2 8.2 0 0 1 5.82 2.42 8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.55.13-.16.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.55-1.34-.76-1.83-.2-.48-.4-.42-.55-.43h-.47c-.16 0-.42.06-.64.31-.22.25-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.17 1.69 2.58 4.1 3.62.57.25 1.02.39 1.37.5.57.18 1.1.16 1.51.1.46-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" /></svg>
);
export const Menu = (p: P) => (
  <svg {...base(p)}><path d="M4 6h16M4 12h16M4 18h16" /></svg>
);
export const Close = (p: P) => (
  <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const ArrowRight = (p: P) => (
  <svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const Check = (p: P) => (
  <svg {...base(p)}><path d="M20 6 9 17l-5-5" /></svg>
);
export const MapPin = (p: P) => (
  <svg {...base(p)}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
);
export const Mail = (p: P) => (
  <svg {...base(p)}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>
);
export const Clock = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const Star = (p: P) => (
  <svg {...base({ fill: "currentColor", strokeWidth: 0, ...p })}><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 18.9 6.1 21l1.2-6.5L2.5 9.9l6.6-.9 2.9-6Z" /></svg>
);
export const Shield = (p: P) => (
  <svg {...base(p)}><path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z" /><path d="m9 12 2 2 4-4" /></svg>
);
export const Clock24 = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 8v4l2.5 1.5" /></svg>
);
export const Wallet = (p: P) => (
  <svg {...base(p)}><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" /><path d="M16 14h2" /></svg>
);
