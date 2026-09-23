/**
 * Static fallback for the 3D scene (server-rendered, zero JS). Used for first
 * paint, low-power devices, Save-Data, no WebGL — and as the reduced-motion
 * still. Glossy red cells in soft focus, drawn in SVG.
 */
export function StaticCell({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden bg-paper ${className}`}>
      <svg
        className="absolute -right-[26vw] -top-[4vh] h-[78vw] w-[78vw] md:-right-[8vmax] md:top-[6vh] md:h-[70vmax] md:w-[70vmax]"
        viewBox="0 0 400 400"
        role="presentation"
      >
        <defs>
          <radialGradient id="sc-body" cx="38%" cy="32%" r="75%">
            <stop offset="0" stopColor="#ff6b7a" />
            <stop offset="0.35" stopColor="#ef0f26" />
            <stop offset="0.75" stopColor="#a8000f" />
            <stop offset="1" stopColor="#3a0006" />
          </radialGradient>
          <radialGradient id="sc-dimple" cx="55%" cy="60%" r="60%">
            <stop offset="0" stopColor="#7c000d" />
            <stop offset="0.7" stopColor="#c8061c" />
            <stop offset="1" stopColor="#e5162c" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sc-pallor" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#ffe4e7" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffe4e7" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sc-spec" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <filter id="sc-soft" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id="sc-softer" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>
        <g transform="rotate(-28 200 200)" filter="url(#sc-soft)">
          <ellipse cx="200" cy="200" rx="160" ry="118" fill="url(#sc-body)" />
          <ellipse cx="206" cy="210" rx="92" ry="60" fill="url(#sc-dimple)" />
          <ellipse cx="204" cy="206" rx="70" ry="44" fill="url(#sc-pallor)" />
          <ellipse cx="150" cy="140" rx="70" ry="22" fill="url(#sc-spec)" transform="rotate(-10 150 140)" />
        </g>
      </svg>
      <div
        className="absolute left-[6vw] top-[62vh] hidden h-[22vmax] w-[22vmax] rounded-full opacity-80 md:block"
        style={{ background: 'radial-gradient(circle at 35% 30%, #ff7a88, #e3000f 45%, #7a000c 80%)', filter: 'blur(28px)' }}
      />
      <div
        className="absolute left-[38vw] top-[-6vh] h-[12vmax] w-[12vmax] rounded-full opacity-60"
        style={{ background: 'radial-gradient(circle at 35% 30%, #ff8a96, #e3000f 50%, #6a000b)', filter: 'blur(22px)' }}
      />
    </div>
  )
}
