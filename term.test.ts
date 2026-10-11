import { test, expect } from 'claude-code/testing'
import { frame, COLS, ROWS } from './hooks/term.tsx'

const text = (m: Parameters<typeof frame>[0], f: number) => frame(m, f).map(r => r.map(c => c.ch).join(''))

test('the terminal crab is Claude Code\'s own welcome-screen crab, at the right of its box', () => {
  expect([COLS, ROWS]).toEqual([14, 3])
  expect(text('idle', 0)).toEqual(['      ▐▛███▜▌ ', '     ▝▜█████▛▘', '       ▘▘ ▝▝  '])
  expect(frame('idle', 0)[1][6].fg).toBe('#D97757')
})

test('every mood draws its own frames in one-cell glyphs, and moves', () => {
  const moods = ['idle', 'think', 'read', 'build', 'test', 'testp', 'testf', 'debug', 'done', 'doze', 'web', 'sub', 'codex', 'git', 'inst', 'ask', 'long', 'comp', 'dizzy', 'fixed', 'night', 'saw', 'type', 'paint', 'gear'] as const
  for (const m of moods) {
    const frames = Array.from({ length: 24 }, (_, f) => text(m, f).join('\n'))
    for (const fr of frames) for (const row of fr.split('\n')) expect([...row].length).toBe(COLS)
    expect(new Set(frames).size).toBeGreaterThan(1)
  }
  // Moods tell apart at a glance, not only by motion.
  expect(new Set(moods.map(m => text(m, 2).join('\n'))).size).toBeGreaterThan(20)
})

type El = { type?: string; props?: Record<string, unknown>; children?: unknown[] }
const kids = (e: El | undefined): El[] => (e?.children ?? []).filter((k): k is El => typeof k === 'object' && k !== null)
const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never

test('in a terminal the crab stands at the bottom right of the band, the lines at its left (Praj, 12 Oct)', async ($, on) => {
  on('ui.render', ($$, e) => { const { Box, Text } = $$.ui.resolve(e as never) as never as { Box: never; Text: never }; return h(Box, {}, h(Text, {}, 'a'), h(Text, {}, 'b')) as never })
  const m = await $.ui.mount({ plugin: 'crab-buddy', surface: 'terminal', component: 'AbovePrompt', props })
  const band = await m.drawn() as never as El
  expect([band.props?.key, band.props?.alignItems]).toEqual(['crab-band', 'flex-end'])
  const crab = kids(band).at(-1)
  expect([crab?.type, crab?.props?.key, (crab?.props?.props as { mood?: string })?.mood]).toEqual(['Client', 'crab-term', 'idle'])
  // The terminal runs the crab's frame clock itself: it moves with no hook call per frame.
  const at = async () => JSON.stringify(await m.drawn({ in: 'crab-term' }))
  const first = await at()
  expect(first).toContain('▐▛███▜▌')
  const seen = new Set([first])
  for (let i = 0; i < 24; i++) { await m.advance(150); seen.add(await at()) }
  expect(seen.size).toBeGreaterThan(1)
})

test('a terminal too narrow for the crab keeps the lines and drops the crab', async ($, on) => {
  on('ui.render', ($$, e) => { const { Box, Text } = $$.ui.resolve(e as never) as never as { Box: never; Text: never }; return h(Box, {}, h(Text, {}, 'a')) as never })
  const m = await $.ui.mount({ plugin: 'crab-buddy', surface: 'terminal', component: 'AbovePrompt', props: { ...(props as object), bodyColumns: 30 } as never })
  expect(await m.find({ key: 'crab-term' })).toBeUndefined()
  expect(JSON.stringify(await m.drawn())).toContain('"a"')
})
