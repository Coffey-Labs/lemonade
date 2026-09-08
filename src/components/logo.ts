/** 4x5 block letters, drawn the way you would on graph paper. */
const GLYPHS: Record<string, string[]> = {
  L: ['#...', '#...', '#...', '#...', '####'],
  E: ['####', '#...', '###.', '#...', '####'],
  M: ['#..#', '####', '####', '#..#', '#..#'],
  O: ['####', '#..#', '#..#', '#..#', '####'],
  N: ['#..#', '##.#', '#.##', '#..#', '#..#'],
  A: ['####', '#..#', '####', '#..#', '#..#'],
  D: ['###.', '#..#', '#..#', '#..#', '###.'],
  S: ['####', '#...', '####', '...#', '####'],
  T: ['####', '.#..', '.#..', '.#..', '.#..'],
  ' ': ['....', '....', '....', '....', '....'],
}

export function bannerRows(word: string): string[] {
  const rows = ['', '', '', '', '']
  for (const ch of word.toUpperCase()) {
    const g = GLYPHS[ch] ?? GLYPHS[' ']
    for (let r = 0; r < 5; r++) rows[r] += (rows[r] ? ' ' : '') + g[r]
  }
  return rows.map((r) => r.replace(/#/g, '█').replace(/\./g, ' '))
}
