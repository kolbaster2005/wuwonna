export default function HeroIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 480 400" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* мягкая тень-подложка */}
      <ellipse cx="250" cy="360" rx="190" ry="18" fill="#14171a" opacity="0.06" />

      {/* стопка книг */}
      <rect x="60" y="270" width="150" height="26" rx="5" fill="#e7e5e2" />
      <rect x="70" y="246" width="130" height="26" rx="5" fill="#d8e8d3" />
      <rect x="55" y="222" width="145" height="26" rx="5" fill="#14171a" />
      <rect x="55" y="222" width="145" height="6" rx="3" fill="#2f7a3d" />

      {/* горшок с растением */}
      <path d="M95 222 L85 190 A22 22 0 0 1 155 190 L145 222 Z" fill="#fafaf9" stroke="#e7e5e2" strokeWidth="2" />
      <path
        d="M120 190 C110 160 90 150 78 152 C82 168 96 184 120 190 Z"
        fill="#2f7a3d"
      />
      <path
        d="M120 190 C126 155 148 138 164 138 C162 158 146 182 120 190 Z"
        fill="#3a8f49"
      />
      <path d="M120 190 C118 165 122 148 130 132" stroke="#256330" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* ноутбук */}
      <g transform="translate(178,120)">
        <rect x="0" y="0" width="230" height="150" rx="10" fill="#14171a" />
        <rect x="10" y="10" width="210" height="130" rx="4" fill="#fafaf9" />
        {/* чек-лист на экране */}
        {[0, 1, 2, 3].map((i) => (
          <g key={i} transform={`translate(24, ${30 + i * 26})`}>
            <circle cx="0" cy="0" r="8" fill="#eef4ec" stroke="#2f7a3d" strokeWidth="1.5" />
            <path d="M-3.5 0 L-1 2.5 L4 -3" stroke="#2f7a3d" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="18" y="-3" width="150" height="6" rx="3" fill="#e7e5e2" />
          </g>
        ))}
        <path d="M-14 150 L244 150 L262 172 L-32 172 Z" fill="#e7e5e2" />
        <rect x="-14" y="148" width="258" height="4" rx="2" fill="#d8d5d0" />
      </g>

      {/* ручка */}
      <g transform="translate(150,300) rotate(-18)">
        <rect x="0" y="0" width="120" height="9" rx="4.5" fill="#14171a" />
        <rect x="105" y="0" width="18" height="9" rx="4.5" fill="#2f7a3d" />
      </g>

      {/* кофейная кружка */}
      <g transform="translate(330,262)">
        <rect x="0" y="10" width="62" height="50" rx="8" fill="#2f7a3d" />
        <path d="M62 20 h14 a14 14 0 0 1 0 28 h-14 Z" fill="none" stroke="#2f7a3d" strokeWidth="6" />
        <ellipse cx="31" cy="10" rx="31" ry="7" fill="#256330" />
      </g>
    </svg>
  )
}
