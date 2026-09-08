import { useMemo } from 'react'
import type { DayConditions } from '../game/types'

/**
 * Cel-shaded lemonade stand: flat colour, one hard shadow per form, one bold
 * outline, light coming from the upper right. Everything is plain geometry so
 * the whole scene stays legible at any size.
 */

const INK = '#33234f'

interface Mood {
  skyTop: string
  skyBottom: string
  hillFar: string
  hillNear: string
  ground: string
  groundShade: string
  /** Painted over the whole scene to tie the palette together. */
  wash: string
  washOpacity: number
  shadow: number
}

const MOODS: Record<string, Mood> = {
  sunny: {
    skyTop: '#3AA9F5',
    skyBottom: '#BFEAFF',
    hillFar: '#7FD1A6',
    hillNear: '#5CBF83',
    ground: '#86DE68',
    groundShade: '#4FA83D',
    wash: '#FFE9A8',
    washOpacity: 0.1,
    shadow: 0.28,
  },
  cloudy: {
    skyTop: '#7C93B8',
    skyBottom: '#C6D3E2',
    hillFar: '#8FB5A2',
    hillNear: '#6E9C82',
    ground: '#7FC46A',
    groundShade: '#4E8B54',
    wash: '#9FB3CE',
    washOpacity: 0.22,
    shadow: 0.12,
  },
  hot: {
    skyTop: '#F2792B',
    skyBottom: '#FFD68A',
    hillFar: '#D8A25C',
    hillNear: '#B77F42',
    ground: '#D9C25E',
    groundShade: '#A38B36',
    wash: '#FF9E3D',
    washOpacity: 0.2,
    shadow: 0.34,
  },
  storm: {
    skyTop: '#231B3D',
    skyBottom: '#4C4370',
    hillFar: '#3C4463',
    hillNear: '#2E3550',
    ground: '#4A6B52',
    groundShade: '#2F4838',
    wash: '#2A2350',
    washOpacity: 0.34,
    shadow: 0.08,
  },
}

const SHIRTS = ['#FF5D8F', '#2EC4B6', '#FFB627', '#8E7DFF', '#FF7A29', '#4FC3F7']
const SKINS = ['#FFCDA8', '#E0A87C', '#B87A54', '#7C4F32']
const HAIR = ['#5A3B2E', '#1F1B24', '#C97B3C', '#8E6BA8']
const MAX_WALKERS = 6

export function CelScene({
  conditions,
  price,
  traffic = 0,
  variant = 'full',
}: {
  conditions: DayConditions
  price?: number
  /** How busy the street is, 0 to 1. Drives how many people walk on. */
  traffic?: number
  variant?: 'full' | 'strip'
}) {
  const { weather, heatWave, streetCrew, storm } = conditions
  const key = storm ? 'storm' : weather
  const m = MOODS[key] ?? MOODS.sunny
  const daylight = !storm && weather !== 'cloudy'

  const walkers = useMemo(() => {
    const busy = Math.max(0, Math.min(1, traffic))
    // In a downpour nobody stops; at most one soul hurries past.
    const count = storm ? (busy > 0 ? 1 : 0) : Math.round(busy * MAX_WALKERS)
    return Array.from({ length: count }, (_, i) => ({
      i,
      // Alternating sides, and a queue spot short of the counter.
      fromLeft: i % 2 === 0,
      stop: i % 2 === 0 ? 168 - (i >> 1) * 36 : 472 + (i >> 1) * 36,
      delay: i * (storm ? 1.1 : 2.3),
      duration: storm ? 4.5 : 11 + (i % 3),
      shirt: SHIRTS[i % SHIRTS.length],
      skin: SKINS[(i * 3) % SKINS.length],
      hair: HAIR[(i * 5) % HAIR.length],
    }))
  }, [traffic, storm])

  return (
    <svg
      className={`cel ${variant === 'strip' ? 'cel-strip' : ''} ${storm ? 'is-storm' : ''} ${heatWave ? 'is-heat' : ''}`}
      viewBox="0 0 640 300"
      role="img"
      aria-label={`${weather} day at the lemonade stand`}
      preserveAspectRatio={variant === 'strip' ? 'xMidYMax slice' : 'xMidYMid meet'}
    >
      <defs>
        <linearGradient id="cel-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={m.skyTop} />
          <stop offset="100%" stopColor={m.skyBottom} />
        </linearGradient>
        <clipPath id="cel-awning">
          <path d="M168 110 H472 V152 q-19 20 -38 0 q-19 20 -38 0 q-19 20 -38 0 q-19 20 -38 0 q-19 20 -38 0 q-19 20 -38 0 q-19 20 -38 0 q-19 20 -38 0 Z" />
        </clipPath>
        <clipPath id="cel-jug">
          <rect x="286" y="170" width="58" height="50" rx="9" />
        </clipPath>
        <clipPath id="cel-frame">
          <rect x="0" y="0" width="640" height="300" />
        </clipPath>
      </defs>

      <g clipPath="url(#cel-frame)">
        <rect width="640" height="300" fill="url(#cel-sky)" />

        {/* --- sky --------------------------------------------------- */}
        {daylight ? (
          <g className="cel-sun">
            <g className="cel-rays" style={{ transformOrigin: '536px 68px' }}>
              {Array.from({ length: 12 }, (_, i) => (
                <rect
                  key={i}
                  x="532"
                  y="8"
                  width="8"
                  height="26"
                  rx="4"
                  fill={heatWave ? '#FFF3C4' : '#FFE27A'}
                  opacity="0.9"
                  transform={`rotate(${i * 30} 536 68)`}
                />
              ))}
            </g>
            <circle cx="536" cy="68" r={heatWave ? 46 : 38} fill="#FFD93D" />
            <path
              d={`M536 ${68 - (heatWave ? 46 : 38)} a${heatWave ? 46 : 38} ${heatWave ? 46 : 38} 0 0 0 0 ${(heatWave ? 46 : 38) * 2} a${heatWave ? 46 : 38} ${heatWave ? 46 : 38} 0 0 0 0 -${(heatWave ? 46 : 38) * 2} Z`}
              fill="#F5B62B"
              opacity="0.55"
            />
            <circle cx="536" cy="68" r={heatWave ? 46 : 38} fill="none" stroke={INK} strokeWidth="4" />
          </g>
        ) : (
          <g className="cel-clouds">
            {[
              { x: 120, y: 62, s: 1.1 },
              { x: 380, y: 44, s: 0.85 },
              { x: 540, y: 78, s: 1 },
            ].map((c, i) => (
              <g key={i} transform={`translate(${c.x} ${c.y}) scale(${c.s})`}>
                <path
                  d="M-62 18 a26 26 0 0 1 12 -48 a34 34 0 0 1 62 -12 a28 28 0 0 1 46 22 a22 22 0 0 1 -6 38 Z"
                  fill={storm ? '#5A5480' : '#F3F7FF'}
                  stroke={INK}
                  strokeWidth="4"
                  strokeLinejoin="round"
                />
                <path
                  d="M-62 18 h114 a22 22 0 0 0 6 -18 q-60 14 -120 0 Z"
                  fill={storm ? '#443E68' : '#D5E2F5'}
                />
              </g>
            ))}
          </g>
        )}

        {/* --- land -------------------------------------------------- */}
        <path d="M0 214 q90 -46 190 -14 q120 38 240 -8 q120 -44 210 6 V300 H0 Z" fill={m.hillFar} />
        <path d="M0 236 q120 -32 250 -2 q140 32 260 -10 q80 -24 130 4 V300 H0 Z" fill={m.hillNear} />
        <g stroke={INK} strokeWidth="4" strokeLinejoin="round">
          {[52, 96, 566, 610].map((x, i) => (
            <g key={x}>
              <rect x={x - 4} y={228 - (i % 2) * 8} width="8" height="26" fill="#8A5A2B" />
              <circle cx={x} cy={216 - (i % 2) * 8} r={22 - (i % 2) * 3} fill={m.hillFar} />
              <path
                d={`M${x} ${194 - (i % 2) * 8} a${22 - (i % 2) * 3} ${22 - (i % 2) * 3} 0 0 1 0 ${(22 - (i % 2) * 3) * 2} Z`}
                fill={m.hillNear}
                stroke="none"
                opacity="0.65"
              />
            </g>
          ))}
        </g>
        <rect x="0" y="252" width="640" height="48" fill={m.ground} />
        <rect x="0" y="252" width="640" height="8" fill={m.groundShade} opacity="0.5" />
        <rect x="0" y="248" width="640" height="5" fill={INK} opacity="0.35" />

        {/* --- the stand --------------------------------------------- */}
        <g stroke={INK} strokeWidth="4" strokeLinejoin="round">
          <ellipse cx="320" cy="286" rx="150" ry="13" fill={INK} opacity={m.shadow} stroke="none" />

          <rect x="192" y="150" width="16" height="98" fill="#C98A4B" />
          <rect x="432" y="150" width="16" height="98" fill="#C98A4B" />
          <rect x="192" y="150" width="6" height="98" fill="#9A6435" stroke="none" />
          <rect x="432" y="150" width="6" height="98" fill="#9A6435" stroke="none" />

          {/* counter */}
          <rect x="182" y="214" width="276" height="18" rx="5" fill="#E0A867" />
          <rect x="190" y="232" width="260" height="52" fill="#C98A4B" />
          <rect x="190" y="232" width="14" height="52" fill="#9A6435" stroke="none" />

          {/* hand-painted sign board */}
          <rect x="212" y="238" width="216" height="40" rx="5" fill="#FFF6DC" />
          <rect x="212" y="266" width="216" height="12" rx="5" fill="#EBDCB4" stroke="none" />
          <text className="cel-sign" x="320" y="258" textAnchor="middle">
            LEMONADE
          </text>
          {price !== undefined && (
            <text className="cel-price" x="320" y="274" textAnchor="middle">
              {price}&#162; A GLASS
            </text>
          )}

          {/* jug of lemonade */}
          <g>
            <path d="M344 182 q22 6 0 26" fill="none" stroke={INK} strokeWidth="9" />
            <path d="M344 182 q22 6 0 26" fill="none" stroke="#DFF6FF" strokeWidth="4" />
            <rect x="286" y="170" width="58" height="50" rx="9" fill="#EAF9FF" />
            <g clipPath="url(#cel-jug)">
              <rect x="286" y="186" width="58" height="34" fill="#FFD93D" stroke="none" />
              <rect x="286" y="186" width="58" height="5" fill="#F5B62B" stroke="none" />
              <g fill="#FFFFFF" opacity="0.85" stroke="none">
                <rect x="296" y="192" width="11" height="11" rx="2" transform="rotate(-14 301 197)" />
                <rect x="318" y="200" width="10" height="10" rx="2" transform="rotate(12 323 205)" />
              </g>
              <rect x="286" y="170" width="12" height="50" fill="#FFFFFF" opacity="0.5" stroke="none" />
            </g>
            <rect x="286" y="170" width="58" height="50" rx="9" fill="none" />
            <rect x="282" y="164" width="66" height="10" rx="5" fill="#DFF6FF" />
          </g>

          {/* stack of cups and a bowl of lemons */}
          <g>
            <path d="M226 214 l4 -22 h20 l4 22 Z" fill="#FFF6DC" />
            <path d="M226 200 h28" stroke={INK} strokeWidth="3" />
            <ellipse cx="392" cy="210" rx="30" ry="9" fill="#DFF6FF" />
            <circle cx="380" cy="203" r="10" fill="#FFE45E" />
            <circle cx="398" cy="200" r="11" fill="#FFE45E" />
            <path d="M390 194 a11 11 0 0 1 15 10" fill="none" stroke="#F5C518" strokeWidth="5" />
          </g>

          {/* awning */}
          <g>
            <path
              d="M168 110 H472 V152 q-19 20 -38 0 q-19 20 -38 0 q-19 20 -38 0 q-19 20 -38 0 q-19 20 -38 0 q-19 20 -38 0 q-19 20 -38 0 q-19 20 -38 0 Z"
              fill="#FF6B6B"
            />
            <g clipPath="url(#cel-awning)" stroke="none">
              {Array.from({ length: 8 }, (_, i) => (
                <rect key={i} x={168 + i * 38} y="106" width="19" height="70" fill="#FFF6DC" />
              ))}
              <rect x="168" y="106" width="304" height="14" fill={INK} opacity="0.16" />
            </g>
            <path
              d="M168 110 H472 V152 q-19 20 -38 0 q-19 20 -38 0 q-19 20 -38 0 q-19 20 -38 0 q-19 20 -38 0 q-19 20 -38 0 q-19 20 -38 0 q-19 20 -38 0 Z"
              fill="none"
            />
            <rect x="160" y="100" width="320" height="14" rx="7" fill="#E0A867" />
          </g>
        </g>

        {/* --- the street ------------------------------------------- */}
        {walkers.map((w) => (
          <g
            key={w.i}
            className={`cel-walker ${w.fromLeft ? 'from-left' : 'from-right'} ${storm ? 'is-hurrying' : ''}`}
            style={{
              // Custom properties feed the keyframes, so one animation
              // serves every figure on either side of the stand.
              ['--stop' as string]: `${w.stop}px`,
              animationDelay: `${w.delay}s`,
              animationDuration: `${w.duration}s`,
            }}
          >
            <g className="cel-bob">
              <ellipse cx="0" cy="290" rx="20" ry="6" fill={INK} opacity={m.shadow * 0.7} />
              <g stroke={INK} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
                <g className="cel-legs">
                  <line className="leg-a" x1="-6" y1="272" x2="-11" y2="288" stroke={INK} />
                  <line className="leg-b" x1="6" y1="272" x2="11" y2="288" stroke={INK} />
                </g>
                <rect x="-15" y="232" width="30" height="44" rx="13" fill={w.shirt} />
                {heatWave && !storm && (
                  <g className="cel-fan">
                    <rect x="16" y="238" width="16" height="5" rx="2" fill="#FFF6DC" />
                  </g>
                )}
                <circle cx="0" cy="220" r="16" fill={w.skin} />
                <path d="M-16 217 a16 16 0 0 1 32 0 q-16 -10 -32 0 Z" fill={w.hair} />
                <g fill={INK} stroke="none">
                  <circle cx={w.fromLeft ? 3 : -3} cy="222" r="2.2" />
                  <circle cx={w.fromLeft ? 10 : -10} cy="222" r="2.2" />
                </g>
                <path
                  d={`M${w.fromLeft ? 2 : -2} 230 q${w.fromLeft ? 5 : -5} 4 ${w.fromLeft ? 9 : -9} 0`}
                  fill="none"
                  stroke={INK}
                  strokeWidth="2.5"
                />
                {storm && (
                  <g>
                    <path d="M-26 196 a26 26 0 0 1 52 0 Z" fill="#2EC4B6" />
                    <line x1="0" y1="196" x2="0" y2="228" />
                  </g>
                )}
              </g>
            </g>
          </g>
        ))}

        {/* --- road works -------------------------------------------- */}
        {streetCrew && (
          <g stroke={INK} strokeWidth="4" strokeLinejoin="round">
            {[68, 572].map((x) => (
              <g key={x}>
                <path d={`M${x - 18} 288 L${x} 240 L${x + 18} 288 Z`} fill="#FF7A29" />
                <path d={`M${x - 11} 270 h22`} stroke="#FFF6DC" strokeWidth="7" />
                <rect x={x - 24} y="286" width="48" height="10" rx="3" fill="#FF7A29" />
              </g>
            ))}
          </g>
        )}

        {/* --- weather overlays -------------------------------------- */}
        {storm && (
          <>
            <g className="cel-rain" stroke="#CFE6FF" strokeWidth="3" strokeLinecap="round" opacity="0.75">
              {Array.from({ length: 40 }, (_, i) => {
                const x = (i * 71) % 660
                const y = (i * 53) % 300
                return <line key={i} x1={x} y1={y} x2={x - 7} y2={y + 22} />
              })}
            </g>
            <polygon
              className="cel-bolt"
              points="470,20 424,120 456,120 428,206 512,96 472,96 506,20"
              fill="#FFF3A8"
              stroke={INK}
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <rect className="cel-flash" width="640" height="300" fill="#FFFFFF" />
          </>
        )}

        {heatWave && (
          <g className="cel-shimmer" stroke="#FFE9A8" strokeWidth="4" fill="none" opacity="0.5">
            {[262, 274, 286].map((y) => (
              <path key={y} d={`M-20 ${y} q22 -9 44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0`} />
            ))}
          </g>
        )}

        <rect width="640" height="300" fill={m.wash} opacity={m.washOpacity} />
      </g>
    </svg>
  )
}
