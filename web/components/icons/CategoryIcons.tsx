// Shared category SVG icons — used across landing page, auth, and any label/pill context.
// Pure SVG — works in both Server and Client components.

// Belleza: a gender-neutral beautiful face avatar — symmetrical, clean, elegant.
// One unified illustration: head → face skin → features, all contributing to a single face.
export function BellezaIcon({size = 88}: {size?: number}) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      {/* Head silhouette — the outer shape doubles as neutral rounded hair */}
      <ellipse cx="36" cy="35" rx="24" ry="29" fill="#db2777"/>

      {/* Face skin */}
      <ellipse cx="36" cy="41" rx="19" ry="22" fill="#fce7f3"/>

      {/* Cheek blush — soft circles inside face bounds */}
      <ellipse cx="24" cy="47" rx="5.5" ry="3.5" fill="#f9a8d4" opacity="0.55"/>
      <ellipse cx="48" cy="47" rx="5.5" ry="3.5" fill="#f9a8d4" opacity="0.55"/>

      {/* Eyebrows — gently arched, neutral weight */}
      <path d="M21 31 Q27 28 32 30" stroke="#9d174d" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      <path d="M40 30 Q45 28 51 31" stroke="#9d174d" strokeWidth="2.2" strokeLinecap="round" fill="none"/>

      {/* Left eye — almond path: upper arc then lower arc, meeting at corners */}
      <path d="M21 36 Q27 32 33 36 Q27 40 21 36 Z" fill="#be185d"/>
      <circle cx="27" cy="36" r="2.2" fill="#3b0022"/>
      <circle cx="28.2" cy="34.6" r="1.1" fill="white"/>

      {/* Right eye */}
      <path d="M39 36 Q45 32 51 36 Q45 40 39 36 Z" fill="#be185d"/>
      <circle cx="45" cy="36" r="2.2" fill="#3b0022"/>
      <circle cx="46.2" cy="34.6" r="1.1" fill="white"/>

      {/* Nose — barely-there curved shadow, reads clearly at large sizes */}
      <path d="M34 45 C33 47 33.5 49 36 49.5 C38.5 49 39 47 38 45"
        stroke="#f9a8d4" strokeWidth="1.4" fill="none" strokeLinecap="round"/>

      {/* Upper lip — Cupid's bow (two arches meeting at center dip) */}
      <path d="M26 52 Q31 48 36 50 Q41 48 46 52" fill="#ec4899"/>
      {/* Lower lip — single full arch below the lip line */}
      <path d="M26 52 Q36 61 46 52 Z" fill="#f472b6"/>
      {/* Lip centre highlight */}
      <path d="M30 55.5 Q36 58.5 42 55.5" stroke="white" strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.3"/>

      {/* Sparkle accent — top-right, signals beauty/glamour */}
      <path d="M59 5 L60.2 8.8 L64 8.8 L61 11 L62.2 14.8 L59 12.5 L55.8 14.8 L57 11 L54 8.8 L57.8 8.8 Z"
        fill="#f9a8d4" opacity="0.9"/>
    </svg>
  );
}

// Bienestar: a single lotus flower drawn with natural bezier petal curves — serenity, spa, wellness.
export function BienestarIcon({size = 88}: {size?: number}) {
  // One petal path pointing straight up from center (36, 42).
  // Using two cubic beziers: left edge (center → tip) then right edge (tip → center).
  const cx = 36, cy = 42;
  const outerPetal = `M${cx} ${cy} C${cx - 9} ${cy} ${cx - 11} ${cy - 17} ${cx} ${cy - 21} C${cx + 11} ${cy - 17} ${cx + 9} ${cy} ${cx} ${cy} Z`;
  const innerPetal = `M${cx} ${cy} C${cx - 5} ${cy} ${cx - 6} ${cy - 10} ${cx} ${cy - 13} C${cx + 6} ${cy - 10} ${cx + 5} ${cy} ${cx} ${cy} Z`;

  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      {/* 5 outer petals at 72° intervals */}
      {[0, 72, 144, 216, 288].map(a => (
        <path key={a} d={outerPetal} fill="#4ade80" transform={`rotate(${a},${cx},${cy})`}/>
      ))}
      {/* 5 inner petals offset 36° — fill the gaps between outer petals */}
      {[36, 108, 180, 252, 324].map(a => (
        <path key={a} d={innerPetal} fill="#86efac" transform={`rotate(${a},${cx},${cy})`}/>
      ))}
      {/* Petal centre veins */}
      {[0, 72, 144, 216, 288].map(a => (
        <line
          key={a}
          x1={cx} y1={cy} x2={cx} y2={cy - 19}
          stroke="white" strokeWidth="0.9" strokeLinecap="round" opacity="0.28"
          transform={`rotate(${a},${cx},${cy})`}
        />
      ))}
      {/* Flower centre — layered circles for depth */}
      <circle cx={cx} cy={cy} r="8" fill="#22c55e"/>
      <circle cx={cx} cy={cy} r="5" fill="#16a34a"/>
      <circle cx={cx} cy={cy} r="2.5" fill="#15803d"/>
      {/* Water surface line — grounds the flower on still water */}
      <path d="M7 66 Q21.5 62 36 66 Q50.5 70 65 66" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.55"/>
    </svg>
  );
}

export function MascotasIcon({size = 88}: {size?: number}) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      {/* Toe pads outer */}
      <ellipse cx="20" cy="34" rx="8.5" ry="7.5" fill="#fbbf24"/>
      <ellipse cx="36" cy="27" rx="9" ry="8" fill="#fbbf24"/>
      <ellipse cx="52" cy="34" rx="8.5" ry="7.5" fill="#fbbf24"/>
      {/* Toe pads inner */}
      <ellipse cx="20" cy="34" rx="5.5" ry="4.5" fill="#d97706"/>
      <ellipse cx="36" cy="27" rx="6" ry="5" fill="#d97706"/>
      <ellipse cx="52" cy="34" rx="5.5" ry="4.5" fill="#d97706"/>
      {/* Main pad */}
      <ellipse cx="36" cy="50" rx="18" ry="16" fill="#fbbf24"/>
      <ellipse cx="36" cy="51" rx="12" ry="10.5" fill="#d97706"/>
      {/* Heart inside pad */}
      <path d="M31 49 C31 46 33.5 44.5 36 47.5 C38.5 44.5 41 46 41 49 C41 52 36 56 36 56 C36 56 31 52 31 49 Z" fill="#ef4444"/>
      {/* Trailing mini paw (top-right) */}
      <ellipse cx="60" cy="14" rx="4.5" ry="4" fill="#fde68a" opacity="0.75"/>
      <circle cx="56" cy="8" r="2.5" fill="#fde68a" opacity="0.65"/>
      <circle cx="64" cy="8.5" r="2" fill="#fde68a" opacity="0.55"/>
      {/* Sparkle (top-left) */}
      <path d="M12 16 L13.2 19.6 L17 19.6 L14.1 21.8 L15.2 25.4 L12 23.2 L8.8 25.4 L9.9 21.8 L7 19.6 L10.8 19.6 Z" fill="#fde68a" opacity="0.85"/>
    </svg>
  );
}

/** Returns the matching category SVG icon at the given size. */
export function getCatIcon(id: string, size = 88) {
  if (id === "belleza")   return <BellezaIcon   size={size}/>;
  if (id === "bienestar") return <BienestarIcon size={size}/>;
  if (id === "mascotas")  return <MascotasIcon  size={size}/>;
  return null;
}
