import { useState } from 'react'
import { MAX_PLAYERS } from '../game/constants'
import { Btn, Line } from './Crt'

export function SetupScreen({
  onStart,
  onBlip,
}: {
  onStart: (names: string[]) => void
  onBlip: () => void
}) {
  const [count, setCount] = useState(1)
  const [names, setNames] = useState<string[]>(['', '', '', ''])

  const setName = (i: number, v: string) =>
    setNames((prev) => prev.map((n, j) => (j === i ? v.slice(0, 12) : n)))

  return (
    <div className="stack">
      <Line className="center inv-line">LEMONSVILLE BUSINESS LICENCE</Line>
      <Line />
      <Line>HOW MANY PEOPLE WILL PLAY?</Line>
      <div className="row">
        {Array.from({ length: MAX_PLAYERS }, (_, i) => i + 1).map((n) => (
          <Btn
            key={n}
            kind={count === n ? 'primary' : 'normal'}
            onClick={() => {
              onBlip()
              setCount(n)
            }}
          >
            {n}
          </Btn>
        ))}
      </div>
      <Line />
      <Line>WHAT ARE THEIR NAMES?</Line>
      {Array.from({ length: count }, (_, i) => (
        <label className="field" key={i}>
          <span className="field-label">STAND {i + 1}</span>
          <input
            className="field-input field-input-name"
            value={names[i]}
            placeholder={`PLAYER ${i + 1}`}
            onChange={(e) => setName(i, e.target.value)}
            maxLength={12}
          />
        </label>
      ))}
      <Line />
      <Line className="dim">EVERY STAND OPENS WITH $2.00 IN THE TIN.</Line>
      <Line />
      <div className="row center">
        <Btn kind="primary" onClick={() => onStart(names.slice(0, count))}>
          OPEN FOR BUSINESS
        </Btn>
      </div>
    </div>
  )
}
