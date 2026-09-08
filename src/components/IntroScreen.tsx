import { useState } from 'react'
import { Btn, Line } from './Crt'

/** A paragraph, optionally led by the name of the thing it describes. */
interface Entry {
  term?: string
  text: string
}

interface Page {
  title: string
  entries: Entry[]
}

const PAGES: Page[] = [
  {
    title: 'WELCOME TO LEMONSVILLE',
    entries: [
      {
        text: 'YOU HAVE A CARD TABLE, A PITCHER AND A CORNER OF THE STREET. WHAT YOU MAKE OF THEM IS ENTIRELY YOUR OWN AFFAIR.',
      },
      {
        text: 'LEMONS, SUGAR, ICE AND CUPS ALL COST MONEY. A GLASS STARTS AT 2 CENTS TO MAKE AND GETS DEARER AS THE SUMMER WEARS ON.',
      },
      { text: 'YOU OPEN WITH $2.00 IN THE TIN. WHOEVER ENDS THE SUMMER RICHEST WINS.' },
    ],
  },
  {
    title: 'WHAT YOU DECIDE',
    entries: [
      { text: 'EACH MORNING YOU SET THREE THINGS:' },
      { term: 'GLASSES', text: 'HOW MANY TO MAKE TODAY.' },
      { term: 'SIGNS', text: 'HOW MANY TO PUT UP, AT 15 CENTS EACH. THE FOURTH SIGN HELPS A LOT LESS THAN THE FIRST.' },
      { term: 'PRICE', text: 'WHAT TO CHARGE A GLASS. ASK TOO MUCH AND NOBODY STOPS.' },
      {
        text: 'EVERY GLASS IS MADE FRESH. WHAT YOU DO NOT SELL IS POURED AWAY, SO MAKE WHAT THE DAY WILL ACTUALLY TAKE.',
      },
    ],
  },
  {
    title: 'READ THE SKY',
    entries: [
      { term: 'SUNNY', text: 'STEADY TRADE AND NO SURPRISES.' },
      { term: 'HOT AND DRY', text: 'A BIGGER CROWD, AND THEY WILL PAY MORE FOR A COLD GLASS. A HEAT WAVE IS BETTER STILL.' },
      {
        term: 'CLOUDY',
        text: 'FEWER BUYERS ABOUT, AND THE DAY MAY TURN INTO A THUNDERSTORM THAT RUINS EVERY GLASS YOU MADE.',
      },
      { text: 'THE FORECAST COMES BEFORE YOU BUY. THE STORM DOES NOT.' },
    ],
  },
  {
    title: 'READ THE STREET TOO',
    entries: [
      {
        term: 'STREET CREWS',
        text: 'THE ROAD IS DUG UP AND THE TRAFFIC GOES WITH IT. THEY OFTEN STAY A SECOND DAY.',
      },
      {
        term: 'SUMMER FAIR',
        text: 'HALF THE TOWN COMES PAST YOUR STAND, AND THEY ARE OUT TO SPEND.',
      },
      {
        term: 'RIVAL STAND',
        text: 'SOMEBODY SETS UP ON THE NEXT CORNER AND TAKES A SHARE OF THE STREET UNTIL THEY MOVE ON.',
      },
      { text: 'ALL OF IT IS ANNOUNCED BEFORE YOU COMMIT. GOOD LUCK!' },
    ],
  },
]

export function IntroScreen({ onDone }: { onDone: () => void }) {
  const [page, setPage] = useState(0)
  const last = page === PAGES.length - 1
  const { title, entries } = PAGES[page]

  return (
    <div className="stack">
      <Line className="center inv-line">HOW TO RUN A LEMONADE STAND</Line>
      <Line />
      <Line className="center accent">{title}</Line>
      <Line />

      {entries.map((e, i) => (
        <p className="intro-entry" key={i}>
          {e.term && <span className="intro-term">{e.term}</span>}
          {e.text}
        </p>
      ))}

      <Line />
      <div className="row center">
        {page > 0 && <Btn onClick={() => setPage(page - 1)}>BACK</Btn>}
        <Btn kind="primary" onClick={() => (last ? onDone() : setPage(page + 1))}>
          {last ? 'START' : 'MORE'}
        </Btn>
        <Line className="dim">
          {page + 1} OF {PAGES.length}
        </Line>
      </div>
    </div>
  )
}
