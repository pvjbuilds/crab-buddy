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
  const band = await m.find({ key: 'crab-band' }) as never as El
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

// 0.12.0 S4: one glyph of costume in the terminal, a hat cell, no more.
test('the terminal wears one costume glyph under a season, nothing under none', () => {
  const cells = (s?: 'friday') => frame('idle', 0, s).flat().map(c => c.ch + (c.fg ?? '')).join('')
  const plain = cells()
  for (const s of ['friday', 'weekend', 'sundayNight', 'christmas', 'newYear'] as const) {
    const a = frame('idle', 0, s).flat(), b = frame('idle', 0).flat()
    const changed = a.filter((c, i) => c.ch !== b[i].ch || c.fg !== b[i].fg).length
    expect([s, changed]).toEqual([s, 1])
  }
  expect(cells()).toBe(plain)
})

// 0.12.0 S6: think, read, test and build have a second terminal take, picked by the desktop's own take index.
const grid = (m: Parameters<typeof frame>[0], f: number, tk?: number) => frame(m, f, undefined, tk).map(r => r.map(c => c.ch + (c.fg ?? '')).join('')).join('|')

test('think, read, test and build each have a second terminal take; odd take indices pick it', () => {
  for (const m of ['think', 'read', 'test', 'build'] as const) {
    const a = Array.from({ length: 24 }, (_, f) => grid(m, f, 0)), b = Array.from({ length: 24 }, (_, f) => grid(m, f, 1))
    expect([m, a.join('#') === b.join('#')]).toEqual([m, false])
    expect(new Set(b).size).toBeGreaterThan(1)
    // Same cells and one-cell glyphs.
    for (const fr of Array.from({ length: 24 }, (_, f) => frame(m, f, undefined, 1))) {
      expect(fr.length).toBe(ROWS)
      for (const row of fr) { expect(row.length).toBe(COLS); for (const c of row) expect([...c.ch].length).toBe(1) }
    }
    // Take 2 is the first take again, take 3 the second: the parity decides.
    for (let f = 0; f < 24; f++) { expect(grid(m, f, 2)).toBe(grid(m, f, 0)); expect(grid(m, f, 3)).toBe(grid(m, f, 1)) }
  }
})

test('other moods and no take given keep the one terminal loop', () => {
  for (const m of ['idle', 'done', 'web', 'testp'] as const) for (let f = 0; f < 24; f++) expect(grid(m, f, 1)).toBe(grid(m, f))
  for (const m of ['think', 'read', 'test', 'build'] as const) for (let f = 0; f < 24; f++) expect(grid(m, f)).toBe(grid(m, f, 0))
})

test('the terminal Client gets the look\'s take, so it draws the same take as the desktop', async ($, on) => {
  on('ui.render', ($$, e) => { const { Box, Text } = $$.ui.resolve(e as never) as never as { Box: never; Text: never }; return h(Box, {}, h(Text, {}, 'a')) as never })
  const m = await $.ui.mount({ plugin: 'crab-buddy', surface: 'terminal', component: 'AbovePrompt', props })
  const band = await m.find({ key: 'crab-band' }) as never as El
  const p = kids(band).at(-1)?.props?.props as { take?: number }
  expect(p.take).toBe(0)
})

test('the second takes are pinned: odd take = second look, even = first', () => {
  const rows = (m: Parameters<typeof frame>[0], tk: number) => frame(m, 4, undefined, tk).map(r => r.map(c => c.ch).join(''))
  expect(rows('think', 1)[0]).toBe('   ?  ▐█▜██▛▌ ')
  expect(rows('think', 0)[0]).toBe(' ●•·  ▐█▜██▛▌ ')
  expect(rows('read', 1)[1]).toBe('  ▤▪ ▝▜█████▛▘')
  expect(rows('read', 0)[1]).toBe('    ◎▝▜█████▛▘')
  expect(rows('build', 1)).toEqual(['      ▐▛███▜▌ ', '    ▌▝▜█████▛▘', '▝▀▄▄▘ ▝▝   ▘▘ '])
  expect(rows('build', 0)[2]).toBe('▝▀▚▄▖  ▘▘ ▝▝  ')
  expect(rows('test', 1)[0]).toBe('      ▗▄▄▄▄▄··')
})
