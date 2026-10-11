import { test, expect, mock } from 'claude-code/testing'
import { LINES } from './hooks/crab.ts'

test('the crab perches above the prompt and follows the turn: reading, a failed command, done', async ($, on) => {
  const clock = mock.clock(on, { now: new Date(2026, 9, 11, 14, 0).getTime() })
  let fail = false
  on('tool.call', () => (fail ? { isError: true, result: 'exit 1', text: 'exit 1' } : { result: {} }) as never)
  on('turn.complete', () => ({ text: 'ok' }) as never)
  on('turn.start', (_$$, e) => ({ turnId: (e as { turnId?: string }).turnId ?? 't1' }) as never)
  // A card is up, so the bar shows and the crab sits on it.
  on('ui.render', ($$, e) => { const { Box, Text } = $$.ui.resolve(e as never) as never as { Box: never; Text: never }; return h(Box, {}, h(Text, {}, 'card')) as never })
  on('session.start', () => ({ cwd: '/p' }) as never)
  await $.session.start({ source: 'startup', cwd: '/p' } as never)
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  const crab = async (surface: 'desktop' | 'terminal' = 'desktop') =>
    (await (await $.ui.mount({ plugin: 'crab-buddy', surface, component: 'AbovePrompt', props })).find({ type: 'Svg' }))?.props?.alt
  expect(await crab()).toBe('Claude crab: idle')
  await $.turn.start({ text: 'go', turnId: 't1' } as never)
  await $.tool.call({ tool: 'Read', file_path: '/x' } as never)
  // Each look holds 3 s before the next shows (Praj, 12 Oct: no flashing).
  await clock.advance(3_000)
  expect(await crab()).toBe('Claude crab: read')
  fail = true
  await $.tool.call({ tool: 'Bash', command: 'false' } as never)
  await clock.advance(3_000)
  expect(await crab()).toBe('Claude crab: debug')
  await $.turn.complete({ turnId: 't1', reason: 'answer', answer: 'ok', durationMs: 1, isAborted: false } as never)
  await clock.advance(3_000)
  expect(await crab()).toBe('Claude crab: done')
  await clock.advance(10_000)
  expect(await crab()).toBe('Claude crab: idle')
  expect(await crab('terminal')).toBeUndefined()
})


test('nothing to show: the crab still shows, whole, in the bar', async ($, on) => {
  on('ui.render', ($$, e) => { const { Box } = $$.ui.resolve(e as never) as never as { Box: never }; return h(Box, {}) as never })
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  const m = await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })
  expect((await m.find({ type: 'Svg' }))?.props?.alt).toBe('Claude crab: idle')
  expect(await m.find({ key: 'crab-buddy' })).toBeDefined()
  expect(await m.find({ key: 'crab-lines' })).toBeUndefined()
})

test('info up: the crab sits in flow beside it; floated, the band clipped or shrank it (11 Oct)', async ($, on) => {
  on('ui.render', ($$, e) => { const { Box, Text } = $$.ui.resolve(e as never) as never as { Box: never; Text: never }; return h(Box, {}, h(Text, {}, 'card')) as never })
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  const m = await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })
  expect(await m.find({ key: 'crab-buddy' })).toBeDefined()
})

test('the crab sits whole in the bar, beside the lines, one size up; no inner box of another colour (Praj, 11 Oct)', async ($, on) => {
  on('ui.render', ($$, e) => { const { Box, Text } = $$.ui.resolve(e as never) as never as { Box: never; Text: never }; return h(Box, {}, h(Text, {}, 'card')) as never })
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  const m = await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })
  // The only colour is the transcript's #151515, so no inner box shows against the bar.
  expect((await m.find({ key: 'crab-band' }))?.props?.backgroundColor).toBe('#151515')
  const svg = await m.find({ type: 'Svg' })
  expect([svg?.props?.width, svg?.props?.height]).toEqual([52, 41])
})

// Live check 22:07, 11 Oct: 0.4.7's floated fill still covered the crab and the lines in the app (the
// lift boxes did not lift them). Nothing floats now: the fill is the crab's and the lines' own parent,
// so they paint over it in plain document order.
test('the bar reads #151515 edge to edge, with the crab and the lines inside the fill, nothing floated', async ($, on) => {
  on('ui.render', ($$, e) => { const { Box, Text } = $$.ui.resolve(e as never) as never as { Box: never; Text: never }; return h(Box, {}, h(Text, {}, 'card')) as never })
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  const m = await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })
  const band = await m.drawn() as never as El
  expect(band.props?.key).toBe('crab-band')
  // The app zeroes vertical margins down a single-child chain, but stops at a Box with a background.
  expect(band.props?.backgroundColor).toBe('#151515')
  const [fill] = kids(band)
  // Into the card's padding ((40px - 1lh)/2, 8px), with the same padding back so the content stays put.
  // Overshoot above and sideways is clipped; below, it would scroll the band, so the bottom is exact.
  const p = fill?.props ?? {}
  expect([p.key, p.backgroundColor, p.marginTop, p.paddingTop, p.marginBottom, p.paddingBottom, p.marginLeft, p.paddingLeft, p.marginRight, p.paddingRight])
    .toEqual(['crab-fill', '#151515', -2, 2, -1.16, 1.16, -2, 2, -2, 2])
  const [text, buddy] = kids(fill)
  // Only the crab's hover label floats; the fill, the lines and the crab stay in flow.
  expect(JSON.stringify([band.props, p, text, kids(buddy)[0]])).not.toContain('"position"')
  expect([text?.props?.key, buddy?.props?.key]).toEqual(['crab-text', 'crab-buddy'])
  expect(JSON.stringify(buddy)).toContain('"type":"Svg"')
})

type El = { type?: string; props?: Record<string, unknown>; children?: unknown[] }
const kids = (e: El | undefined): El[] => (e?.children ?? []).filter((k): k is El => typeof k === 'object' && k !== null)

test('hovering the crab shows what its current animation means (Praj, 12 Oct)', async ($, on) => {
  const clock = mock.clock(on, { now: new Date(2026, 9, 11, 14, 0).getTime() })
  on('ui.render', ($$, e) => { const { Box, Text } = $$.ui.resolve(e as never) as never as { Box: never; Text: never }; return h(Box, {}, h(Text, {}, 'card')) as never })
  on('tool.call', () => ({ result: {} }) as never)
  on('turn.start', () => ({ turnId: 't1' }) as never)
  on('session.start', () => ({ cwd: '/p' }) as never)
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  await $.session.start({ source: 'startup', cwd: '/p' } as never)
  await $.turn.start({ text: 'go', turnId: 't1' } as never)
  await $.tool.call({ tool: 'Read', file_path: '/x' } as never)
  await clock.advance(3_000)
  const m = await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })
  // The crab's keyed Box is the hover scope; the label inside it carries no key of its own.
  const tip = kids(await m.find({ key: 'crab-buddy' }) as never as El).find(k => k.props?.position === 'absolute')
  // Hidden until the pointer is on the crab, then floated over the lines without moving them.
  expect([tip?.props?.position, tip?.props?.display, (tip as { hover?: { display?: string } })?.hover?.display]).toEqual(['absolute', 'none', 'flex'])
  expect(JSON.stringify(tip)).toContain('Reading and searching files')
})

test('the crab stands at the bottom right, right on the prompt box, however many lines sit beside it (Praj, 12 Oct)', async ($, on) => {
  on('ui.render', ($$, e) => { const { Box, Text } = $$.ui.resolve(e as never) as never as { Box: never; Text: never }; return h(Box, {}, h(Text, {}, 'a'), h(Text, {}, 'b'), h(Text, {}, 'c')) as never })
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  const m = await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })
  const [fill] = kids(await m.drawn() as never as El)
  expect(fill?.props?.alignItems).toBe('flex-end')
  expect(kids(fill).at(-1)?.props?.key).toBe('crab-buddy')
})

test('idle moves on to its next take after 30 s, still idle (Praj, 12 Oct)', async ($, on) => {
  const clock = mock.clock(on, { now: new Date(2026, 9, 11, 14, 0).getTime() })
  on('ui.render', ($$, e) => { const { Box, Text } = $$.ui.resolve(e as never) as never as { Box: never; Text: never }; return h(Box, {}, h(Text, {}, 'card')) as never })
  on('session.start', () => ({ cwd: '/p' }) as never)
  await $.session.start({ source: 'startup', cwd: '/p' } as never)
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  const svg = async () => (await (await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })).find({ type: 'Svg' }))?.props
  const a = await svg()
  await clock.advance(30_000)
  const b = await svg()
  expect([a?.alt, b?.alt]).toEqual(['Claude crab: idle', 'Claude crab: idle'])
  expect(a?.source).not.toBe(b?.source)
})

test('the caption: two one-liners when the crab is alone, one beside other lines and cards (Praj, 12 Oct)', async ($, on) => {
  let card = false
  on('ui.render', ($$, e) => { const { Box, Text } = $$.ui.resolve(e as never) as never as { Box: never; Text: never }; return (card ? h(Box, {}, h(Text, {}, 'card')) : h(Box, {})) as never })
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  const mount = () => $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })
  const left = async () => kids(await (await mount()).find({ key: 'crab-text' }) as never as El)
  const [cap] = await left()
  // Before anything happens: idle's first line.
  expect([cap?.props?.color, cap?.children]).toEqual(['inactive', ['Waiting for your next idea.']])
  card = true
  const withCard = await left()
  expect(JSON.stringify(withCard.at(-1))).toContain('Waiting for your next idea.')
})

test('light theme: no dark paint, the band keeps the app own colour; dark keeps #151515', async ($, on) => {
  mock.clock(on, { now: new Date(2026, 9, 11, 14, 0).getTime() })
  let theme = 'light'
  on('config.list', () => ({ value: [{ key: 'theme', label: 'Theme', kind: 'choice', value: theme, provider: { kind: 'engine' } }] }) as never)
  on('session.start', () => ({ cwd: '/p' }) as never)
  on('ui.render', ($$, e) => { const { Box, Text } = $$.ui.resolve(e as never) as never as { Box: never; Text: never }; return h(Box, {}, h(Text, {}, 'card')) as never })
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  const band = async () => JSON.stringify(await (await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })).drawn())
  await $.session.start({ source: 'startup', cwd: '/p' } as never)
  expect(await band()).not.toContain('#151515')
  theme = 'dark'
  await $.session.start({ source: 'startup', cwd: '/p' } as never)
  expect(await band()).toContain('#151515')
})

// Praj, 12 Oct: rapid changes flashed by too fast to read. Each look stays at least 3 s, then the crab jumps
// to whatever is current; the caption scrolls like a terminal, newest on top, the one before it dimmer below.
test('no flashing: a look holds 3 s, repeats keep their take, and the caption scrolls down a line at a time', async ($, on) => {
  const clock = mock.clock(on, { now: new Date(2026, 9, 11, 14, 0).getTime() })
  on('session.start', () => ({ cwd: '/p' }) as never)
  on('tool.call', () => ({ result: {} }) as never)
  on('turn.start', () => ({ turnId: 't1' }) as never)
  on('ui.render', ($$, e) => { const { Box } = $$.ui.resolve(e as never) as never as { Box: never }; return h(Box, {}) as never })
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  const band = async () => { const m = await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props }); return { svg: (await m.find({ type: 'Svg' }))?.props, text: kids(await m.find({ key: 'crab-text' }) as never as El) } }
  await $.session.start({ source: 'startup', cwd: '/p' } as never)
  await $.turn.start({ text: 'go', turnId: 't1' } as never)
  await clock.advance(3_000)
  await $.tool.call({ tool: 'Read', file_path: '/a' } as never)
  const a = await band()
  expect(a.svg?.alt).toBe('Claude crab: read')
  await clock.advance(500)
  await $.tool.call({ tool: 'Read', file_path: '/b' } as never)
  await $.tool.call({ tool: 'Edit', file_path: '/c' } as never)
  const b = await band()
  // Half a second in: still the same read, same take.
  expect([b.svg?.alt, b.svg?.source === a.svg?.source]).toEqual(['Claude crab: read', true])
  await clock.advance(3_000)
  const c = await band()
  expect(c.svg?.alt).toBe('Claude crab: build')
  // A one-liner from each job, newest on top; the plain meaning stays on the hover label.
  const [top, below] = c.text.map(t => [t.props?.color, (t.children as string[])[0]])
  expect([top[0], LINES.build.includes(top[1] as string), below[0], LINES.read.includes(below[1] as string)]).toEqual(['inactive', true, 'subtle', true])
})
