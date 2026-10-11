// The crab for terminals (Praj, 12 Oct: "terminal friendly as well, for its wider appeal"). A Client module:
// the terminal runs its frame clock, so the crab moves with no hook call per frame. Drawn in quadrant blocks,
// two by two pixels a cell, on the welcome screen's own crab, with one-cell props beside and above it.
import type { ClientModule } from 'claude-code'
import type { Mood } from '../types'

export const COLS = 14, ROWS = 3, FRAME = 150

type Cell = { ch: string, fg?: string, bg?: string }
type Rect = [x: number, y: number, w: number, h: number, c: string]
type Glyph = [cx: number, cy: number, ch: string, c: string]
type Look = { dx?: number, dy?: number, eyes?: number | 'shut', legs?: boolean, claw?: boolean, squish?: boolean, px?: Rect[], ch?: Glyph[] }

const O = '#D97757', G = '#8E929A', B = '#7A4A26', Y = '#F5C542', RED = '#E24B4A', GRN = '#1D9E75', BLU = '#378ADD'
const BR = '#B5532F', BR2 = '#93401F', WH = '#F4F3EE', DIM = '#9A9890', WOOD = '#C8A165', SKY = '#85B7EB'

// The welcome screen's crab, one character a pixel: 18×5, at cells 5-13. Eyes are holes the terminal shows through.
const CRAB = ['...############...', '...##.######.##...', '.################.', '...############...', '....#.#....#.#....']
const STEP = '...#.#......#.#...'
const QUAD = ' ▗▖▄▝▐▞▟▘▚▌▙▀▜▛█'

const on = (f: number, n: number, k: number) => f % n < k
// Props stand left of the crab (cells 0-4) or in its two free top corners (cells 5 and 13 of the top row).
const LOOKS: Record<Mood, (f: number) => Look> = {
  idle: f => { const t = f % 24; return { dy: t >= 12 && t < 15 ? 1 : 0, eyes: t === 20 ? 'shut' : t >= 8 && t < 11 ? -1 : 0 } },
  think: f => ({ eyes: on(f, 8, 4) ? -1 : 1, ch: [[3, 0, '·', DIM], ...(f % 8 > 1 ? [[2, 0, '•', DIM] as Glyph] : []), ...(f % 8 > 3 ? [[1, 0, '●', DIM] as Glyph] : [])] }),
  read: f => ({ eyes: on(f, 4, 2) ? -1 : 1, ch: [[on(f, 8, 4) ? 3 : 4, 1, '◎', G]] }),
  build: f => ({ dy: f % 4 === 2 ? 1 : 0, px: [[1, 5, 4, 1, BR], [5, 5, 4, 1, BR2], ...(f % 16 >= 4 ? [[1, 4, 4, 1, BR2] as Rect] : []), ...(f % 16 >= 8 ? [[5, 4, 4, 1, BR] as Rect] : []), ...(f % 16 >= 12 ? [[3, 3, 4, 1, BR2] as Rect] : []),
    [8, f % 4 < 2 ? 0 : 2, 2, 1, G], [9, f % 4 < 2 ? 1 : 3, 1, 2, B]], ch: f % 4 === 2 ? [[0, 1, '·', WH]] : [] }),
  saw: f => ({ px: [[0, 4, 9, 1, WOOD], [1, 5, 1, 1, B], [7, 5, 1, 1, B], [on(f, 2, 1) ? 1 : 3, 3, 5, 1, G], [on(f, 2, 1) ? 6 : 8, 3, 1, 1, B]], ch: f % 2 ? [[2, 2, '·', WOOD]] : [] }),
  type: f => ({ legs: on(f, 2, 1), px: [[1, 0, 7, 4, '#2C2C2A'], [0, 4, 9, 1, G], ...(f % 8 >= 2 ? [[2, 1, 3, 1, GRN] as Rect] : []), ...(f % 8 >= 4 ? [[2, 2, 4, 1, BLU] as Rect] : []), ...(f % 8 >= 6 ? [[2, 3, 2, 1, '#EF9F27'] as Rect] : []), ...(on(f, 2, 1) ? [[6, 3, 1, 1, WH] as Rect] : [])] }),
  paint: f => { const h = 1 + Math.floor((f % 12) / 2); return { px: [[1, 0, 6, 6, '#4A4A48'], [1, 6 - h, 6, h, BLU], [7, Math.max(0, 5 - h), 2, 2, WH]] } },
  gear: f => ({ dy: f % 2, ch: [[2, 1, on(f, 2, 1) ? '┼' : '╳', G], [3, 0, on(f, 2, 1) ? '╳' : '┼', Y]] }),
  test: f => ({ claw: on(f, 4, 2), ch: [[13, 0, '…', DIM]] }),
  testp: f => ({ claw: true, ch: on(f, 4, 3) ? [[13, 0, '✓', GRN]] : [] }),
  testf: f => ({ claw: true, ch: on(f, 4, 3) ? [[13, 0, '✗', RED]] : [] }),
  debug: f => ({ dx: on(f, 2, 1) ? 0 : 1, ch: on(f, 4, 2) ? [[13, 0, '!', '#EF9F27']] : [] }),
  done: f => ({ dy: on(f, 4, 2) ? 0 : 1, claw: on(f, 4, 2), ch: [[13, 0, '✓', GRN]] }),
  doze: f => ({ eyes: 'shut', dy: on(f, 16, 8) ? 0 : 1, ch: [[13, 0, on(f, 8, 4) ? 'z' : 'Z', DIM]] }),
  web: f => ({ ch: [[2, 1, '·', G], ...(f % 6 >= 2 ? [[3, 1, '∙', G] as Glyph] : []), ...(f % 6 >= 4 ? [[4, 1, '•', G] as Glyph] : []), [0, 1, '◍', RED]] }),
  sub: f => { const x = [1, 2, 3, 2][Math.floor(f / 2) % 4]; return { ch: [[x, 2, '▟', O], [x + 1, 2, '▙', O]] } },
  codex: f => ({ legs: on(f, 2, 1), ch: [[4 - (Math.floor(f / 2) % 5), 1, '▣', B]] }),
  git: f => ({ ch: [[2, 1, '│', G], [2, 2, '│', G], [2, 0, '▕', G], [3, 0, on(f, 2, 1) ? '▶' : '▷', GRN]] }),
  inst: f => ({ legs: on(f, 2, 1), ch: [[3, on(f, 4, 2) ? 1 : 2, '▣', B]] }),
  ask: f => ({ claw: on(f, 4, 2), ch: on(f, 4, 3) ? [[13, 0, '?', BLU]] : [] }),
  long: f => ({ legs: on(f, 2, 1), ch: [[5, f % 3, '•', SKY]] }),
  comp: f => ({ squish: on(f, 4, 2) }),
  dizzy: f => ({ dx: on(f, 4, 2) ? 0 : 1, ch: [[on(f, 2, 1) ? 5 : 13, 0, '✶', Y]] }),
  fixed: f => ({ dy: on(f, 4, 2) ? 0 : 1, ch: [[1, f % 3, '•', GRN], [3, (f + 1) % 3, '•', Y], [13, 0, on(f, 2, 1) ? '✓' : ' ', GRN]] }),
  night: f => ({ dy: on(f, 16, 8) ? 0 : 1, ch: [[2, 0, '☾', '#FAC775'], ...(on(f, 6, 3) ? [[0, 1, '·', WH] as Glyph] : []), ...(on(f + 3, 6, 3) ? [[4, 0, '·', WH] as Glyph] : [])] }),
}

/** One frame of `mood`: ROWS rows of COLS cells. Pure, so tests read it as text. */
export function frame(mood: Mood, f: number): Cell[][] {
  const look = (LOOKS[mood] ?? LOOKS.idle)(f)
  const W = COLS * 2, H = ROWS * 2
  const px: (string | undefined)[][] = Array.from({ length: H }, () => Array(W).fill(undefined))
  const put = (x: number, y: number, c: string) => { if (x >= 0 && x < W && y >= 0 && y < H) px[y][x] = c }
  for (const [x, y, w, h, c] of look.px ?? []) for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c)
  const eyes = look.eyes ?? 0
  const rows = CRAB.map((r, y) => {
    // Eyes: holes at 5 and 12, shifted a pixel to look aside, filled when shut.
    if (y === 1) r = [...r].map((_, x) => (x < 3 || x > 14 || (eyes !== 'shut' && (x === 5 + eyes || x === 12 + eyes)) ? '.' : '#')).join('')
    if (y === 4 && look.legs) r = STEP
    if (look.claw && y === 1) r = r.slice(0, 15) + '##.'
    if (look.claw && y === 2) r = '.##############...'
    return r
  })
  const drawn = look.squish ? [rows[0], rows[1], rows[2], rows[4]] : rows
  const top = (look.squish ? 1 : 0) + (look.dy ?? 0)
  drawn.forEach((r, y) => [...r].forEach((c, x) => { if (c === '#') put(10 + (look.dx ?? 0) + x, top + y, O) }))
  const cells: Cell[][] = Array.from({ length: ROWS }, (_, cy) => Array.from({ length: COLS }, (_, cx) => {
    const q = [px[cy * 2][cx * 2], px[cy * 2][cx * 2 + 1], px[cy * 2 + 1][cx * 2], px[cy * 2 + 1][cx * 2 + 1]]
    const n = new Map<string, number>()
    for (const c of q) if (c) n.set(c, (n.get(c) ?? 0) + 1)
    const [a, b] = [...n.entries()].sort((p, r) => r[1] - p[1]).map(e => e[0])
    if (!a) return { ch: ' ' }
    const mask = q.reduce((m, c, i) => (c === a ? m | (8 >> i) : m), 0)
    return b ? { ch: QUAD[mask], fg: a, bg: b } : { ch: QUAD[mask], fg: a }
  }))
  for (const [cx, cy, ch, c] of look.ch ?? []) if (cells[cy]?.[cx]) cells[cy][cx] = { ch, fg: c }
  return cells
}

type State = { f: number }

// One Text per run of like-coloured cells: a row is a handful of runs, not fourteen elements.
const Crab: ClientModule<{ mood: Mood }, State> = (props, surface) => {
  if (surface.state === undefined) {
    surface.every(FRAME, () => surface.setState({ f: (surface.state?.f ?? 0) + 1 }))
    surface.setState({ f: 0 })
  }
  const { Box, Text } = surface.elements
  const rows = frame(props.mood, surface.state?.f ?? 0)
  return (
    <Box flexDirection="column">
      {rows.map((row, y) => {
        const runs: Cell[] = []
        for (const c of row) {
          const last = runs.at(-1)
          if (last && last.fg === c.fg && last.bg === c.bg) last.ch += c.ch
          else runs.push({ ...c })
        }
        return <Box key={`r${y}`} flexDirection="row">{runs.map((r, i) => <Text key={`c${i}`} color={r.fg} backgroundColor={r.bg} wrap="truncate">{r.ch}</Text>)}</Box>
      })}
    </Box>
  )
}
export default Crab
