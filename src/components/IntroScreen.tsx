import { useState } from 'react'
import { Btn, Line } from './Crt'

const PAGES: string[][] = [
  [
    'HI! WELCOME TO LEMONSVILLE, CALIFORNIA!',
    '',
    'IN THIS SMALL TOWN YOU ARE IN CHARGE OF',
    'RUNNING YOUR OWN LEMONADE STAND. YOU CAN',
    'COMPETE WITH AS MANY OTHER PEOPLE AS YOU',
    'WISH, BUT HOW MUCH PROFIT YOU MAKE IS UP',
    'TO YOU. IF YOU MAKE THE MOST MONEY,',
    "YOU'RE THE WINNER!",
    '',
    'TO MAKE LEMONADE YOU WILL NEED LEMONS,',
    'SUGAR, ICE AND PAPER CUPS. THE COST OF A',
    'GLASS STARTS AT 2 CENTS AND CLIMBS AS',
    'THE SUMMER WEARS ON.',
  ],
  [
    'EACH DAY YOU DECIDE THREE THINGS:',
    '',
    '  1. HOW MANY GLASSES TO MAKE',
    '  2. HOW MANY SIGNS TO PUT UP',
    '     (15 CENTS EACH)',
    '  3. WHAT TO CHARGE PER GLASS',
    '',
    'SIGNS BRING CUSTOMERS, BUT THE FOURTH',
    'SIGN HELPS A LOT LESS THAN THE FIRST.',
    '',
    'WATCH THE WEATHER. A HOT DAY IS WORTH',
    'MORE GLASSES AND A HIGHER PRICE. A',
    'CLOUDY DAY MIGHT TURN INTO A STORM AND',
    'RUIN EVERY GLASS YOU MADE.',
    '',
    'YOU START WITH $2.00. GOOD LUCK!',
  ],
]

export function IntroScreen({ onDone }: { onDone: () => void }) {
  const [page, setPage] = useState(0)
  const last = page === PAGES.length - 1

  return (
    <div className="stack">
      <Line className="center inv-line">HOW TO RUN A LEMONADE STAND</Line>
      <Line />
      {PAGES[page].map((t, i) => (
        <Line key={i}>{t}</Line>
      ))}
      <Line />
      <div className="row center">
        {page > 0 && <Btn onClick={() => setPage(page - 1)}>BACK</Btn>}
        <Btn kind="primary" onClick={() => (last ? onDone() : setPage(page + 1))}>
          {last ? 'START' : 'MORE'}
        </Btn>
        <Line className="dim">
          PAGE {page + 1} OF {PAGES.length}
        </Line>
      </div>
    </div>
  )
}
