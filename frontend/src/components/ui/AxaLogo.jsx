// AXA Official Logo — SVG recreated from brand identity
// Blue background + red diagonal slash + white AXA letters
export default function AxaLogo({ size = 44, className = '' }) {
  const h = Math.round(size * 0.85)
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 120 102"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Blue background */}
      <rect width="120" height="102" rx="6" fill="#00008F"/>

      {/* Red diagonal slash — from top-right area down to bottom-left */}
      <line
        x1="82" y1="8"
        x2="44" y2="94"
        stroke="#FF1721"
        strokeWidth="11"
        strokeLinecap="round"
      />

      {/* AXA white letters */}
      {/* Left A */}
      <path
        d="M5 88 L20 14 H28 L43 88 H35 L31.5 75 H16.5 L13 88 H5Z
           M18.5 65 H29.5 L24 36 L18.5 65Z"
        fill="white"
      />
      {/* X */}
      <path
        d="M42 88 L57 51 L42 14 H51 L60 32 L69 14 H78 L63 51 L78 88 H69 L60 70 L51 88 H42Z"
        fill="white"
      />
      {/* Right A */}
      <path
        d="M77 88 L92 14 H100 L115 88 H107 L103.5 75 H88.5 L85 88 H77Z
           M90.5 65 H101.5 L96 36 L90.5 65Z"
        fill="white"
      />
    </svg>
  )
}
