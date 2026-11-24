export default function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="0.5" y="0.5" width="47" height="47" rx="13" fill="#111827" />
      <rect x="0.5" y="0.5" width="47" height="47" rx="13" stroke="#D97706" strokeOpacity="0.35" />
      <text
        x="24"
        y="18"
        textAnchor="middle"
        fill="#FFFFFF"
        fontFamily="Arial, sans-serif"
        fontSize="11"
        fontWeight="700"
        letterSpacing="0.5"
      >
        406
      </text>
      <path
        d="M9 36.5 H39"
        stroke="#F7F8F6"
        strokeOpacity="0.55"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M10 33 L20 26 L27 30 L37 21"
        stroke="#D97706"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M32 21 H37 V26" stroke="#D97706" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
