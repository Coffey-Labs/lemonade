import { useMemo } from 'react'
import type { DayConditions } from '../game/types'

const PALETTE: Record<string, string> = {
  r: '#d24b3e', // awning red
  w: '#f2f6ff', // awning white
  n: '#8a5a2b', // timber
  N: '#5e3c1c', // timber shadow
  y: '#e0a92b', // lemon shade
  Y: '#f7de5a', // lemon highlight
  g: '#9aa6bd', // cloud grey
  G: '#5f6b85', // storm grey
  k: '#20263a',
  c: '#7fd4ff',
  o: '#f08a24',
  e: '#5fae4a',
}

const CELL = 8
const COLS = 40
const ROWS = 22

/** Body of the stand, 28 cells wide. The awning above it is generated. */
const STAND = [
  '   N       yyyyy       N    ',
  '   N      yYYYYYy      N    ',
  '   N      yYYYYYyy     N    ',
  '   N      yYYYYYy      N    ',
  '   N       yyyyy       N    ',
  '   nnnnnnnnnnnnnnnnnnnnn    ',
  '   nwwwwwwwwwwwwwwwwwwwn    ',
  '   nwwwwwwwwwwwwwwwwwwwn    ',
  '   nwwwwwwwwwwwwwwwwwwwn    ',
  '   nwwwwwwwwwwwwwwwwwwwn    ',
  '   N                   N    ',
  '   N                   N    ',
]

const STAND_X = 6
const AWNING_Y = 5
const STAND_Y = 8
/** Each awning row is symmetric about the counter, and one wider than the last. */
const AWNING_ROWS: [number, number][] = [
  [5, 21],
  [4, 22],
  [3, 23],
]

interface Rect {
  x: number
  y: number
  w: number
  fill: string
}

/** Turn a character grid into horizontal runs so the SVG stays small. */
function runs(rows: string[], ox: number, oy: number): Rect[] {
  const out: Rect[] = []
  rows.forEach((row, ry) => {
    let x = 0
    while (x < row.length) {
      const ch = row[x]
      if (ch === ' ' || !PALETTE[ch]) {
        x++
        continue
      }
      let w = 1
      while (row[x + w] === ch) w++
      out.push({ x: ox + x, y: oy + ry, w, fill: PALETTE[ch] })
      x += w
    }
  })
  return out
}

/** A filled circle, quantised to the pixel grid. */
function disc(cx: number, cy: number, r: number, fill: string): Rect[] {
  const out: Rect[] = []
  for (let y = -r; y <= r; y++) {
    const half = Math.floor(Math.sqrt(Math.max(0, r * r - y * y)))
    out.push({ x: cx - half, y: cy + y, w: half * 2 + 1, fill })
  }
  return out
}

/** Red and white stripes that line up vertically from row to row. */
function awning(): Rect[] {
  const out: Rect[] = []
  AWNING_ROWS.forEach(([from, to], row) => {
    for (let col = from; col <= to; col++) {
      out.push({
        x: STAND_X + col,
        y: AWNING_Y + row,
        w: 1,
        fill: (col >> 1) % 2 === 0 ? PALETTE.r : PALETTE.w,
      })
    }
  })
  return out
}

function cloud(cx: number, cy: number, fill: string): Rect[] {
  return [
    ...disc(cx, cy, 2, fill),
    ...disc(cx - 3, cy + 1, 2, fill),
    ...disc(cx + 3, cy + 1, 2, fill),
    { x: cx - 6, y: cy + 2, w: 13, fill },
    { x: cx - 5, y: cy + 3, w: 11, fill },
  ]
}

export function Scene({ conditions, price }: { conditions: DayConditions; price?: number }) {
  const { weather, heatWave, streetCrew, storm } = conditions

  const sky = useMemo(() => {
    if (storm) return ['#2b3350', '#3d4468']
    if (weather === 'cloudy') return ['#5b6b93', '#8fa0c4']
    if (weather === 'hot') return heatWave ? ['#c9541f', '#f0a13a'] : ['#e07a24', '#f5c164']
    return ['#2f7fd8', '#8fd0f5']
  }, [weather, heatWave, storm])

  const rects: Rect[] = []

  if (storm) {
    rects.push(...cloud(10, 4, PALETTE.G), ...cloud(24, 3, PALETTE.G), ...cloud(33, 5, PALETTE.G))
  } else if (weather === 'cloudy') {
    rects.push(...cloud(9, 4, PALETTE.g), ...cloud(26, 3, PALETTE.g), ...cloud(34, 6, PALETTE.g))
  } else {
    const sunX = weather === 'hot' ? 32 : 33
    const sunR = weather === 'hot' ? 5 : 3
    rects.push(...disc(sunX, 5, sunR, heatWave ? '#fff3b0' : PALETTE.Y))
    if (weather === 'sunny') rects.push(...cloud(9, 3, PALETTE.w))
  }

  rects.push(...awning(), ...runs(STAND, STAND_X, STAND_Y))

  // Grass line under the stand.
  rects.push({ x: 0, y: ROWS - 1, w: COLS, fill: PALETTE.e })
  rects.push({ x: 0, y: ROWS - 2, w: COLS, fill: '#6fc258' })

  if (streetCrew) {
    // A pair of road cones and a barrier where the customers used to walk.
    for (const cx of [2, 36]) {
      rects.push(
        { x: cx, y: ROWS - 5, w: 1, fill: PALETTE.o },
        { x: cx - 1, y: ROWS - 4, w: 3, fill: PALETTE.o },
        { x: cx - 1, y: ROWS - 3, w: 3, fill: PALETTE.o },
        { x: cx - 2, y: ROWS - 2, w: 5, fill: '#3a3f52' },
      )
    }
  }

  return (
    <svg
      className={`scene ${storm ? 'is-storm' : ''} ${heatWave ? 'is-heat' : ''}`}
      viewBox={`0 0 ${COLS * CELL} ${ROWS * CELL}`}
      role="img"
      aria-label={`${weather} day at the lemonade stand`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={sky[0]} />
          <stop offset="100%" stopColor={sky[1]} />
        </linearGradient>
      </defs>
      <rect width={COLS * CELL} height={ROWS * CELL} fill="url(#sky)" />

      {heatWave && (
        <g className="shimmer" opacity="0.35">
          {[13, 15, 17].map((y) => (
            <rect key={y} x={0} y={y * CELL} width={COLS * CELL} height={CELL / 2} fill="#ffd9a0" />
          ))}
        </g>
      )}

      {rects.map((r, i) => (
        <rect
          key={i}
          x={r.x * CELL}
          y={r.y * CELL}
          width={r.w * CELL}
          height={CELL}
          fill={r.fill}
          shapeRendering="crispEdges"
        />
      ))}

      {storm && (
        <>
          <g className="rain">
            {Array.from({ length: 26 }, (_, i) => (
              <rect
                key={i}
                x={((i * 37) % (COLS * CELL))}
                y={((i * 53) % 120) + 40}
                width={2}
                height={10}
                fill="#bcd8ff"
                opacity="0.75"
              />
            ))}
          </g>
          <polygon className="bolt" points="212,40 188,96 208,96 192,148 232,84 210,84 228,40" fill="#fff3a8" />
        </>
      )}

      <text className="stand-sign" x={156} y={price === undefined ? 132 : 125} textAnchor="middle">
        LEMONADE
      </text>
      {price !== undefined && (
        <text className="stand-price" x={156} y={137} textAnchor="middle">
          {price}&#162; A GLASS
        </text>
      )}
    </svg>
  )
}
