import { useEffect, useMemo, useRef, useState } from 'react'
import { MAX_SIGNS, SIGN_COST } from '../game/constants'
import { dollars } from '../game/engine'
import type { DayConditions, Decision, Player } from '../game/types'
import { Btn, Line } from './Crt'
import { Scene } from './Scene'

const clampInt = (v: string, max: number) => {
  const n = Math.floor(Number(v.replace(/[^0-9]/g, '')))
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(n, max)
}

export function DecideScreen({
  player,
  conditions,
  playerCount,
  onSubmit,
  onBlip,
  onReject,
}: {
  player: Player
  conditions: DayConditions
  playerCount: number
  onSubmit: (d: Decision) => void
  onBlip: () => void
  onReject: () => void
}) {
  // App remounts this per player per day, so plain initial state is the reset.
  const [glasses, setGlasses] = useState('0')
  const [signs, setSigns] = useState('0')
  const [price, setPrice] = useState('5')
  const first = useRef<HTMLInputElement>(null)

  useEffect(() => {
    first.current?.focus()
  }, [])

  const d: Decision = {
    glasses: clampInt(glasses, 9999),
    signs: clampInt(signs, MAX_SIGNS),
    price: clampInt(price, 100),
  }

  const lemonadeCost = d.glasses * conditions.costPerGlass
  const signCost = d.signs * SIGN_COST
  const total = lemonadeCost + signCost
  const left = player.assets - total

  const error = useMemo(() => {
    if (signCost > player.assets) return 'YOU CANNOT AFFORD THAT MANY SIGNS.'
    if (total > player.assets) return "YOU DON'T HAVE ENOUGH MONEY TO MAKE THAT MANY GLASSES."
    if (d.glasses === 0) return 'YOU MUST MAKE AT LEAST ONE GLASS.'
    return null
  }, [signCost, total, player.assets, d.glasses])

  const submit = () => {
    if (error) {
      onReject()
      return
    }
    onBlip()
    onSubmit(d)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return
    const form = e.currentTarget.closest('.stack')
    const inputs = Array.from(form?.querySelectorAll('input') ?? [])
    const i = inputs.indexOf(e.target as HTMLInputElement)
    if (i >= 0 && i < inputs.length - 1) inputs[i + 1].focus()
    else submit()
  }

  return (
    <div className="stack">
      <Line className="center inv-line">
        {playerCount > 1 ? `${player.name} - DAY ${conditions.day}` : `DAY ${conditions.day}`}
      </Line>
      <Scene conditions={{ ...conditions, storm: false }} price={d.price} />
      <Line>
        ASSETS <span className="money">{dollars(player.assets)}</span> &middot; LEMONADE COSTS{' '}
        {conditions.costPerGlass}&#162; A GLASS
      </Line>
      <Line />

      <label className="field" onKeyDown={onKey}>
        <span className="field-label">GLASSES TO MAKE</span>
        <input
          ref={first}
          className="field-input"
          inputMode="numeric"
          value={glasses}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setGlasses(e.target.value)}
        />
        <span className="field-note">{dollars(lemonadeCost)}</span>
      </label>

      <label className="field" onKeyDown={onKey}>
        <span className="field-label">SIGNS AT 15&#162;</span>
        <input
          className="field-input"
          inputMode="numeric"
          value={signs}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setSigns(e.target.value)}
        />
        <span className="field-note">{dollars(signCost)}</span>
      </label>

      <label className="field" onKeyDown={onKey}>
        <span className="field-label">PRICE IN CENTS</span>
        <input
          className="field-input"
          inputMode="numeric"
          value={price}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setPrice(e.target.value)}
        />
        <span className="field-note">{d.price}&#162;</span>
      </label>

      <Line>
        TODAY&apos;S OUTLAY <span className="money">{dollars(total)}</span> &middot; LEFT IN TIN{' '}
        <span className={left < 0 ? 'warn' : 'money'}>{dollars(left)}</span>
      </Line>
      {error && <Line className="warn">{error}</Line>}
      <div className="row center">
        <Btn kind="primary" onClick={submit} disabled={!!error}>
          SELL LEMONADE
        </Btn>
      </div>
    </div>
  )
}
