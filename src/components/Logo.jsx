export function LogoMark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-label="swarnamaala.in">
      <defs>
        <linearGradient id="crm-logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F4B942" />
          <stop offset="0.55" stopColor="#D97757" />
          <stop offset="1" stopColor="#C4623F" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="45" height="45" rx="13" fill="url(#crm-logo-grad)" />
      <text
        x="24"
        y="25"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="26"
        fontWeight="700"
        fill="#fff"
      >
        S
      </text>
    </svg>
  );
}

export default function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <LogoMark />
      <span style={{ fontWeight: 800, fontSize: 18 }}>
        swarnamaala<span style={{ color: "var(--terracotta)" }}>.in</span>
      </span>
    </div>
  );
}
