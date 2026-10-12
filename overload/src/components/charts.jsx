// Concentric progress rings (Eat) and the countdown ring (rest timer).
export function Rings({ rings, size = 232, stroke = 14, children }) {
  const c = size / 2;
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        {rings.map((r, i) => {
          const circ = 2 * Math.PI * r.r;
          const p = Math.min(Math.max(r.pct, 0), 1);
          return (
            <g key={i}>
              <circle cx={c} cy={c} r={r.r} fill="none" stroke="#E8E0D2" strokeWidth={stroke} />
              {p > 0 && (
                <circle
                  cx={c}
                  cy={c}
                  r={r.r}
                  fill="none"
                  stroke={r.color}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={circ * (1 - p)}
                  style={{ transition: 'stroke-dashoffset .7s cubic-bezier(.2,.8,.2,1), stroke .3s' }}
                />
              )}
            </g>
          );
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function RestRing({ fraction, seconds, size = 120, stroke = 9 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const f = Math.min(Math.max(fraction, 0), 1);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8E0D2" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#5E7A5E"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - f)}
          style={{ transition: 'stroke-dashoffset .3s linear' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-mono text-[34px] leading-none text-sage-dark tabular-nums">{seconds}</span>
      </div>
    </div>
  );
}
