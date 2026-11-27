import { test, expect, mock } from 'claude-code/testing'
import { LINES } from './hooks/crab.ts'
import { stageArt as sa, STATION as ST } from './hooks/art.ts'

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
  // Each look holds a 14 s scene (8 s until 20 Nov 2026) before the next shows (Praj, 12 Oct: no flashing).
  await clock.advance(14_000)
  expect(await crab()).toBe('Claude crab: read')
  fail = true
  await $.tool.call({ tool: 'Bash', command: 'false' } as never)
  await clock.advance(3_000)
  expect(await crab()).toBe('Claude crab: debug')
  await $.turn.complete({ turnId: 't1', reason: 'answer', answer: 'ok', durationMs: 1, isAborted: false } as never)
  await clock.advance(3_000)
  expect(await crab()).toBe('Claude crab: done')
  await clock.advance(14_000)
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
  // No colour of its own: the app's band card shows through, gray like the other plugins' rows (Praj, 16 Nov).
  expect((await m.find({ key: 'crab-band' }))?.props?.backgroundColor).toBeUndefined()
  // On the stage the crab itself is still drawn 52×41.
  expect(String((await m.find({ type: 'Svg' }))?.props?.source)).toContain('width="52" height="41"')
})

// Live check 22:07, 11 Oct: 0.4.7's floated fill still covered the crab and the lines in the app (the
// lift boxes did not lift them). Nothing floats now: the fill is the crab's and the lines' own parent,
// so they paint over it in plain document order.
test('the band card shows through: no paint, the crab and the lines inside the fill, nothing floated', async ($, on) => {
  on('ui.render', ($$, e) => { const { Box, Text } = $$.ui.resolve(e as never) as never as { Box: never; Text: never }; return h(Box, {}, h(Text, {}, 'card')) as never })
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  const m = await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })
  const band = await m.find({ key: 'crab-band' }) as never as El
  expect(band.props?.key).toBe('crab-band')
  // 16 Nov (Praj): the transcript-colour fill (11 Oct) read as a dark strip under 2.1.325's gray per-plugin rows.
  expect(band.props?.backgroundColor).toBeUndefined()
  const [fill] = kids(band)
  const p = fill?.props ?? {}
  expect([p.key, p.backgroundColor, p.marginTop, p.marginBottom, p.marginLeft, p.marginRight])
    .toEqual(['crab-fill', undefined, undefined, undefined, undefined, undefined])
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
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 50 } as never
  await $.session.start({ source: 'startup', cwd: '/p' } as never)
  await $.turn.start({ text: 'go', turnId: 't1' } as never)
  await $.tool.call({ tool: 'Read', file_path: '/x' } as never)
  await clock.advance(14_000)
  // On the stage the label is in the crab's own art.
  const wide = await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props: { ...(props as object), bodyColumns: 108 } as never })
  expect(String((await wide.find({ type: 'Svg' }))?.props?.source)).toContain('Reading and searching files')
  const m = await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })
  // Narrow band: the crab's keyed Box is the hover scope; the label inside it carries no key of its own.
  const tip = kids(await m.find({ key: 'crab-buddy' }) as never as El).find(k => k.props?.position === 'absolute')
  // Hidden until the pointer is on the crab, then floated over the lines without moving them.
  expect([tip?.props?.position, tip?.props?.display, (tip as { hover?: { display?: string } })?.hover?.display]).toEqual(['absolute', 'none', 'flex'])
  expect(JSON.stringify(tip)).toContain('Reading and searching files')
})

test('the crab stands at the bottom right, right on the prompt box, however many lines sit beside it (Praj, 12 Oct)', async ($, on) => {
  on('ui.render', ($$, e) => { const { Box, Text } = $$.ui.resolve(e as never) as never as { Box: never; Text: never }; return h(Box, {}, h(Text, {}, 'a'), h(Text, {}, 'b'), h(Text, {}, 'c')) as never })
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  const m = await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })
  const [fill] = kids(await m.find({ key: 'crab-band' }) as never as El)
  expect(fill?.props?.alignItems).toBe('flex-end')
  expect(kids(fill).at(-1)?.props?.key).toBe('crab-buddy')
})

test('idle moves on to its next take after 42 s, still idle (Praj, 12 Oct)', async ($, on) => {
  const clock = mock.clock(on, { now: new Date(2026, 9, 11, 14, 0).getTime() })
  on('ui.render', ($$, e) => { const { Box, Text } = $$.ui.resolve(e as never) as never as { Box: never; Text: never }; return h(Box, {}, h(Text, {}, 'card')) as never })
  on('session.start', () => ({ cwd: '/p' }) as never)
  await $.session.start({ source: 'startup', cwd: '/p' } as never)
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  const svg = async () => (await (await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })).find({ type: 'Svg' }))?.props
  const a = await svg()
  await clock.advance(42_000)
  const b = await svg()
  expect([a?.alt, b?.alt]).toEqual(['Claude crab: idle', 'Claude crab: idle'])
  expect(a?.source).not.toBe(b?.source)
})

// 21 Oct (Astra): each take change restarted the take's clock, so after the first scene a take was cut at 8 s,
// before its second beat at ~10 s.
test('a long look plays every take a full 14 s scene, not just the first', async ($, on) => {
  const clock = mock.clock(on, { now: new Date(2026, 9, 11, 14, 0).getTime() })
  on('session.start', () => ({ cwd: '/p' }) as never)
  on('turn.start', () => ({ turnId: 't1' }) as never)
  on('ui.render', ($$, e) => { const { Box } = $$.ui.resolve(e as never) as never as { Box: never }; return h(Box, {}) as never })
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  const svg = async () => (await (await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })).find({ type: 'Svg' }))?.props
  await $.session.start({ source: 'startup', cwd: '/p' } as never)
  await $.turn.start({ text: 'go', turnId: 't1' } as never)
  await clock.advance(15_000)
  const second = await svg()
  await clock.advance(12_000)
  const later = await svg()
  await clock.advance(2_000)
  const third = await svg()
  expect([second?.alt, later?.alt, third?.alt]).toEqual(['Claude crab: think', 'Claude crab: think', 'Claude crab: think'])
  expect(later?.source).toBe(second?.source)
  expect(third?.source).not.toBe(second?.source)
})

test('the caption: the newest one-liner in full text colour, alone or beside other lines and cards (Praj, 14 Oct)', async ($, on) => {
  let card = false
  on('ui.render', ($$, e) => { const { Box, Text } = $$.ui.resolve(e as never) as never as { Box: never; Text: never }; return (card ? h(Box, {}, h(Text, {}, 'card')) : h(Box, {})) as never })
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  const mount = () => $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })
  const left = async () => kids(await (await mount()).find({ key: 'crab-text' }) as never as El)
  const [cap] = await left()
  // Before anything happens: idle's first line.
  expect([cap?.props?.color, cap?.children]).toEqual(['text', ['Waiting for your next idea.']])
  card = true
  const withCard = await left()
  expect(JSON.stringify(withCard.at(-1))).toContain('Waiting for your next idea.')
})

// Praj, 12 Oct: on Windows the desktop app was light while Claude Code's own theme setting said dark, so a
// band painted by that setting stayed dark. The desktop resolves theme keys by the app's own theme (live
// probe 10:58: userMessageBackground is the transcript, #151515 dark and #fcfcfb light), so no hex is drawn.
// The hover label: on Windows the desktop draws its own pill under a hover Box and keeps only the text colour
// (Praj's photos, 12 Oct 11:15 and 11:31), so on the stage the label is drawn inside the crab's own SVG instead
// (interactive, so CSS :hover works) and rides above its head; a narrow band keeps a Box label in theme keys.
test('theme: every colour the band paints is a theme key; the stage label lives in the crab art, the narrow label in theme keys', async ($, on) => {
  mock.clock(on, { now: new Date(2026, 9, 11, 14, 0).getTime() })
  on('config.list', () => ({ value: [{ key: 'theme', label: 'Theme', kind: 'choice', value: 'dark', provider: { kind: 'engine' } }] }) as never)
  on('session.start', () => ({ cwd: '/p' }) as never)
  on('ui.render', ($$, e) => { const { Box, Text } = $$.ui.resolve(e as never) as never as { Box: never; Text: never }; return h(Box, {}, h(Text, {}, 'card')) as never })
  await $.session.start({ source: 'startup', cwd: '/p' } as never)
  const at = async (bodyColumns: number) => $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props: { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns } as never })
  for (const cols of [80, 50]) {
    const colours: string[] = []
    const walk = (e: El) => { for (const k of ['backgroundColor', 'color']) if (typeof e.props?.[k] === 'string') colours.push(e.props[k] as string); kids(e).forEach(walk) }
    walk(await (await at(cols)).drawn() as never as El)
    expect(colours.filter(c => c.startsWith('#'))).toEqual([])
  }
  const wide = await at(80)
  expect(kids(await wide.find({ key: 'crab-buddy' }) as never as El).some(k => k.props?.position === 'absolute')).toBe(false)
  expect((await wide.find({ type: 'Svg' }))?.props?.isInteractive).toBe(true)
  expect(String((await wide.find({ type: 'Svg' }))?.props?.source)).toContain('Idle: waiting for your message')
  const tip = kids(await (await at(50)).find({ key: 'crab-buddy' }) as never as El).find(k => k.props?.position === 'absolute')
  expect([tip?.props?.backgroundColor, kids(tip)[0]?.props?.color]).toEqual(['userMessageBackground', 'text'])
})

// Praj, 12 Oct: rapid changes flashed by too fast to read. Each look stays at least 3 s (8 s since 13:05), then the crab jumps
// to whatever is current; the caption scrolls like a terminal, newest on top, the one before it dimmer below.
// Praj, 14 Oct: both lines show beside other lines too (a status line above them hid the older one), newest in white.
// 20 Nov 2026: neither side was wrong; Praj asked that every scene play through ("cut off midway"), so a routine
// look holds one full 14 s scene, not 8 s. The times below moved with it; at 28.5 s building is on its third scene.
test('no flashing: a look holds a full 14 s scene, repeats keep their take, and the caption scrolls down a line at a time', async ($, on) => {
  const clock = mock.clock(on, { now: new Date(2026, 9, 11, 14, 0).getTime() })
  on('session.start', () => ({ cwd: '/p' }) as never)
  on('tool.call', () => ({ result: {} }) as never)
  on('turn.start', () => ({ turnId: 't1' }) as never)
  on('ui.render', ($$, e) => { const { Box, Text } = $$.ui.resolve(e as never) as never as { Box: never; Text: never }; return h(Box, {}, h(Text, {}, 'card')) as never })
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  const band = async () => { const m = await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props }); return { svg: (await m.find({ type: 'Svg' }))?.props, text: kids(await m.find({ key: 'crab-text' }) as never as El) } }
  await $.session.start({ source: 'startup', cwd: '/p' } as never)
  await $.turn.start({ text: 'go', turnId: 't1' } as never)
  await clock.advance(13_000)
  await $.tool.call({ tool: 'Read', file_path: '/a' } as never)
  await clock.advance(1_000)
  const a = await band()
  expect(a.svg?.alt).toBe('Claude crab: read')
  await clock.advance(500)
  await $.tool.call({ tool: 'Read', file_path: '/b' } as never)
  await $.tool.call({ tool: 'Edit', file_path: '/c' } as never)
  const b = await band()
  // Half a second in: still the same read, same take.
  expect([b.svg?.alt, b.svg?.source === a.svg?.source]).toEqual(['Claude crab: read', true])
  await clock.advance(13_000)
  expect((await band()).svg?.alt).toBe('Claude crab: read')
  await clock.advance(1_000)
  const c = await band()
  // 28.5 s into the turn: building has moved on to its third scene, the laptop.
  expect(c.svg?.alt).toBe('Claude crab: type')
  // A one-liner from each job, newest on top; the plain meaning stays on the hover label.
  const [top, below] = c.text.slice(-2).map(t => [t.props?.color, (t.children as string[])[0]])
  expect([top[0], LINES.build.includes(top[1] as string), below[0], LINES.read.includes(below[1] as string)]).toEqual(['text', true, 'subtle', true])
})

// Praj, 12 Oct 13:05: looks still swapped every 2-4 s. A routine look holds 8 s; a test result, a question, the
// turn's end or a squish cuts straight in, so the trip and the confetti land on their moment.
// 20 Nov 2026: 8 s became one full 14 s scene (Praj: animations "cut off midway"); neither side was wrong.
test('a routine look holds a full 14 s scene, but a test result cuts straight in', async ($, on) => {
  const clock = mock.clock(on, { now: new Date(2026, 9, 11, 14, 0).getTime() })
  let fail = false
  on('session.start', () => ({ cwd: '/p' }) as never)
  on('tool.call', () => (fail ? { isError: true, result: 'exit 1', text: 'exit 1' } : { result: {} }) as never)
  on('turn.start', () => ({ turnId: 't1' }) as never)
  on('ui.render', ($$, e) => { const { Box } = $$.ui.resolve(e as never) as never as { Box: never }; return h(Box, {}) as never })
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  const alt = async () => (await (await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })).find({ type: 'Svg' }))?.props?.alt
  await $.session.start({ source: 'startup', cwd: '/p' } as never)
  await $.turn.start({ text: 'go', turnId: 't1' } as never)
  await $.tool.call({ tool: 'Read', file_path: '/a' } as never)
  await clock.advance(13_000)
  expect(await alt()).toBe('Claude crab: think')
  await clock.advance(1_000)
  expect(await alt()).toBe('Claude crab: read')
  fail = true
  await $.tool.call({ tool: 'Bash', command: 'pytest' } as never)
  expect(await alt()).toBe('Claude crab: testf')
})

// 12 Oct 13:15: an engine "ask" is settled by the mode first; in auto mode the classifier approves it unseen, and
// the crab held up its "?" sign for nobody. It asks only when a permission dialog really opens.
test('the crab holds up its question only when you are really asked', async ($, on) => {
  mock.clock(on, { now: new Date(2026, 9, 11, 14, 0).getTime() })
  on('session.start', () => ({ cwd: '/p' }) as never)
  on('turn.start', () => ({ turnId: 't1' }) as never)
  on('tool.check', () => ({ decision: 'ask' }) as never)
  on('classic.PermissionRequest', () => ({}) as never)
  on('ui.render', ($$, e) => { const { Box } = $$.ui.resolve(e as never) as never as { Box: never }; return h(Box, {}) as never })
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  const alt = async () => (await (await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })).find({ type: 'Svg' }))?.props?.alt
  await $.session.start({ source: 'startup', cwd: '/p' } as never)
  await $.turn.start({ text: 'go', turnId: 't1' } as never)
  await $.tool.check({ tool: 'Bash', input: { command: 'ls' } } as never)
  expect(await alt()).toBe('Claude crab: think')
  await $.classic.PermissionRequest({ tool_name: 'Bash', tool_input: { command: 'ls' } } as never)
  expect(await alt()).toBe('Claude crab: ask')
})

// Praj, 12 Oct: the crab gets the right half of the band to move in; the caption keeps the left half.
// Live probe 10:58: an SVG whose markup is width="100%" with no viewBox, drawn wider than its Box, is capped
// to the Box, and a percentage inside it is the drawn width; a numeric markup width squashed the crab.
test('stage: on a wide band the crab moves in the right half; on a narrow one it stands as before', async ($, on) => {
  on('ui.render', ($$, e) => { const { Box } = $$.ui.resolve(e as never) as never as { Box: never }; return h(Box, {}) as never })
  const at = async (bodyColumns: number) => {
    const m = await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props: { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns } as never })
    return { box: (await m.find({ key: 'crab-buddy' }))?.props, svg: (await m.find({ type: 'Svg' }))?.props }
  }
  const wide = await at(108)
  expect([wide.box?.width, wide.svg?.width, wide.svg?.height, wide.svg?.isInteractive]).toEqual(['50%', 2000, 41, true])
  expect(String(wide.svg?.source)).toMatch(/^<svg[^>]*width="100%"[^>]*>/)
  expect(String(wide.svg?.source).match(/^<svg[^>]*>/)?.[0]).not.toContain('viewBox')
  const narrow = await at(50)
  expect([narrow.box?.width, narrow.svg?.width, narrow.svg?.height]).toEqual([undefined, 52, 41])
})

test('stage: a new look walks on from where the crab has wandered to, never from its old spot', async ($, on) => {
  const clock = mock.clock(on, { now: new Date(2026, 9, 11, 14, 0).getTime() })
  on('session.start', () => ({ cwd: '/p' }) as never)
  on('turn.start', () => ({ turnId: 't1' }) as never)
  on('ui.render', ($$, e) => { const { Box } = $$.ui.resolve(e as never) as never as { Box: never }; return h(Box, {}) as never })
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 108 } as never
  const src = async () => String((await (await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })).find({ type: 'Svg' }))?.props?.source)
  await $.session.start({ source: 'startup', cwd: '/p' } as never)
  // 30 s into idle's 80 s wander it rests at its 30% to 45% stop (1 - .4). Its next take, at 42 s, walks it home.
  await clock.advance(30_000)
  await $.turn.start({ text: 'go', turnId: 't1' } as never)
  await clock.advance(1_000)
  expect(await src()).toContain('@keyframes st-go{0%{transform:translateX(calc((100% - 52px) * 0.6))}100%{transform:translateX(calc((100% - 52px) * 0.85))}}')
})

// 20 Nov 2026 (Praj: the crab "disappears for half a second, reappears on the rightmost side"): a calendar look
// that came on mid-wander redrew the crab from where its look began, so it jumped back across the stage.
test('stage: Friday coming on mid-wander walks on from where the crab stands, never from its old spot', async ($, on) => {
  const clock = mock.clock(on, { now: new Date(2026, 10, 20, 15, 59, 30).getTime() })
  on('session.start', () => ({ cwd: '/p' }) as never)
  on('ui.render', ($$, e) => { const { Box } = $$.ui.resolve(e as never) as never as { Box: never }; return h(Box, {}) as never })
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 108 } as never
  const src = async () => String((await (await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })).find({ type: 'Svg' }))?.props?.source)
  await $.session.start({ source: 'startup', cwd: '/p' } as never)
  // 30 s into idle's 80 s wander it rests at 1 - .4; Friday starts at 16:00 on the 1 s tick.
  await clock.advance(30_000)
  expect(await src()).toContain('@keyframes st-go{0%{transform:translateX(calc((100% - 52px) * 0.6))}100%{transform:translateX(calc((100% - 52px) * 1))}}')
})

test('stage: a new look scuttles in from where the last one stood; a new take of the same look stays put', async ($, on) => {
  const clock = mock.clock(on, { now: new Date(2026, 9, 11, 14, 0).getTime() })
  on('session.start', () => ({ cwd: '/p' }) as never)
  on('tool.call', () => ({ result: {} }) as never)
  on('turn.start', () => ({ turnId: 't1' }) as never)
  on('ui.render', ($$, e) => { const { Box } = $$.ui.resolve(e as never) as never as { Box: never }; return h(Box, {}) as never })
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 108 } as never
  const src = async () => String((await (await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })).find({ type: 'Svg' }))?.props?.source)
  await $.session.start({ source: 'startup', cwd: '/p' } as never)
  // Idle stands at the right end, by the prompt, and walks nowhere.
  expect(await src()).not.toContain('st-go')
  await $.turn.start({ text: 'go', turnId: 't1' } as never)
  await clock.advance(3_000)
  // Thinking: from idle's spot at the right end to think's, a little to the left.
  expect(await src()).toContain('@keyframes st-go{0%{transform:translateX(calc((100% - 52px) * 1))}100%{transform:translateX(calc((100% - 52px) * 0.85))}}')
  // Thinking walks in (.8 s), then sways left; 12.5 s in it rests at its 45% to 55% stop of 24 s (.85 - .3).
  await clock.advance(9_500)
  await $.tool.call({ tool: 'Read', file_path: '/a' } as never)
  // Reading shows once thinking has played its full 14 s scene (20 Nov 2026; it was 8 s), 14 s into the turn, the
  // same 55% stop.
  await clock.advance(1_500)
  expect(await src()).toContain('0%{transform:translateX(calc((100% - 52px) * 0.55))}100%{transform:translateX(calc((100% - 52px) * 0.65))}')
})

test('compacting shows only when a compaction really runs: a vetoed one never squishes the crab (Praj, 16 Oct)', async ($, on) => {
  mock.clock(on, { now: new Date(2026, 9, 11, 14, 0).getTime() })
  on('session.start', () => ({ cwd: '/p' }) as never)
  on('turn.start', () => ({ turnId: 't1' }) as never)
  on('ui.render', ($$, e) => { const { Box } = $$.ui.resolve(e as never) as never as { Box: never }; return h(Box, {}) as never })
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  const alt = async () => (await (await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })).find({ type: 'Svg' }))?.props?.alt
  // Core: the settings PreCompact gate runs first; a block leaves the conversation as it is.
  let gate: { block?: string } = {}
  const msgs = [{ role: 'user', text: 'hi', toolUses: [] }]
  const seen: unknown[] = []
  on('classic.PreCompact', () => gate as never)
  on('session.compact', async (_$$, e) => {
    const r = await $.classic.PreCompact({ hook_event_name: 'PreCompact', trigger: (e as { trigger: string }).trigger, custom_instructions: null } as never)
    seen.push(await alt())
    return ((r as { block?: string }).block ? { skip: 'held mid-task' } : { messages: msgs }) as never
  })
  await $.session.start({ source: 'startup', cwd: '/p' } as never)
  await $.turn.start({ text: 'go', turnId: 't1' } as never)
  gate = { block: 'mid-task' }
  await $.session.compact({ trigger: 'auto', messages: msgs } as never)
  expect(seen).toEqual(['Claude crab: think'])
  expect(await alt()).toBe('Claude crab: think')
  gate = {}
  await $.session.compact({ trigger: 'auto', messages: msgs } as never)
  expect(seen[1]).toBe('Claude crab: comp')
})

// 0.12.0 S0 (Praj, 16 Nov): a standalone crab merges with the chat (the 11 Oct paint, transcript colour); when other
// plugins draw beside it the app's gray rows show and the paint would be a dark strip.
test('company decides the paint: alone the band is the transcript colour, beside other plugins it is unpainted', async ($, on) => {
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  on('ui.render', ($$, e) => { const { Box } = $$.ui.resolve(e as never) as never as { Box: never }; return h(Box, {}) as never })
  const alone = await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })
  const band = await alone.find({ key: 'crab-band' }) as never as El
  expect(band.props?.backgroundColor).toBe('userMessageBackground')
  const [fill] = kids(band)
  expect([fill?.props?.key, fill?.props?.backgroundColor, fill?.props?.marginTop, fill?.props?.paddingTop, fill?.props?.marginBottom, fill?.props?.paddingBottom, fill?.props?.marginLeft, fill?.props?.paddingLeft, fill?.props?.marginRight, fill?.props?.paddingRight])
    .toEqual(['crab-fill', 'userMessageBackground', -2, 2, -1.16, 1.16, -2, 2, -2, 2])
})

// A look with a backdrop (a BackdropKit theme) frosts the app's panels, the band's card included: the transcript-colour
// paint then stands on the glass as a solid block while the rows beside it show the scene through.
test('a frosted backdrop decides the paint too: over the glass the crab alone is unpainted, with glass off it is painted', async ($, on) => {
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  on('ui.render', ($$, e) => { const { Box } = $$.ui.resolve(e as never) as never as { Box: never }; return h(Box, {}) as never })
  const paint = async () => {
    const m = await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })
    const band = await m.find({ key: 'crab-band' }) as never as El
    return [band.props?.backgroundColor, kids(band)[0]?.props?.backgroundColor]
  }
  // The app asks every plugin to draw a look's scene, which is how the crab hears of one: it answers nothing itself.
  const scene = (glass: { blur: number; opacity: number } | false) =>
    $.ui.mount({ plugin: 'low-orbit', surface: 'desktop', component: 'Backdrop', props: { scene: 'orbit', plugin: 'low-orbit', glass } as never })
  expect(await paint()).toEqual(['userMessageBackground', 'userMessageBackground'])
  await scene({ blur: 16, opacity: 0.6 })
  expect(await paint()).toEqual([undefined, undefined])
  await scene(false)
  expect(await paint()).toEqual(['userMessageBackground', 'userMessageBackground'])
})

test('company decides the paint: another plugin\'s card beside the crab means no paint at all', async ($, on) => {
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  on('ui.render', ($$, e) => { const { Box, Text } = $$.ui.resolve(e as never) as never as { Box: never; Text: never }; return h(Box, {}, h(Text, {}, 'other mod')) as never })
  const m = await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })
  const band = await m.find({ key: 'crab-band' }) as never as El
  expect(band.props?.backgroundColor).toBeUndefined()
  expect([kids(band)[0]?.props?.backgroundColor, kids(band)[0]?.props?.marginTop, kids(band)[0]?.props?.paddingBottom]).toEqual([undefined, undefined, undefined])
})

// 0.12.0 S15 (Praj, 19 Nov, live in his main setup: the progress-bar row above the crab showed cut in half). The app
// now asks each plugin for its own row, so another mod's card never reaches the crab's `rest`: the crab thought it was
// alone, painted dark and reached 2 up over the row above. Company is read from the band's arrangement instead.
const ROW_PROPS = { hasSurvey: false, isCollapsed: false, isWorking: false, maxRows: 12, bodyColumns: 80 }
const rowOf = (plugin: string) => ({ plugin, tree: { type: 'Box', props: {}, children: [] } })
test('company from the band: another plugin\'s row in the band means no paint and no reach, though the crab\'s own row is alone', async ($, on) => {
  const clock = mock.clock(on, { now: new Date(2026, 10, 19, 1, 0).getTime() })
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  on('ui.render', ($$, e) => { if ((e as { component: string }).component === 'AbovePromptList') return { type: 'Box', props: {}, children: [] } as never; const { Box } = $$.ui.resolve(e as never) as never as { Box: never }; return h(Box, {}) as never })
  await $.ui.render({ surface: 'desktop', component: 'AbovePromptList', props: { ...ROW_PROPS, rows: [rowOf('progress-bar'), rowOf('crab-buddy')] } } as never)
  await clock.advance(10)
  const m = await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })
  const band = await m.find({ key: 'crab-band' }) as never as El
  expect(band.props?.backgroundColor).toBeUndefined()
  const [fill] = kids(band)
  expect([fill?.props?.backgroundColor, fill?.props?.marginTop, fill?.props?.paddingTop, fill?.props?.marginBottom]).toEqual([undefined, undefined, undefined, undefined])
})

test('company from the band: with only the crab\'s row it paints again, and the arrangement passes through untouched', async ($, on) => {
  const clock = mock.clock(on, { now: new Date(2026, 10, 19, 1, 0).getTime() })
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  on('ui.render', ($$, e) => { if ((e as { component: string }).component === 'AbovePromptList') return { type: 'Box', props: {}, children: [] } as never; const { Box } = $$.ui.resolve(e as never) as never as { Box: never }; return h(Box, {}) as never })
  const list = (rows: unknown[]) => $.ui.render({ surface: 'desktop', component: 'AbovePromptList', props: { ...ROW_PROPS, rows } } as never)
  await list([rowOf('ponytail'), rowOf('crab-buddy')])
  await clock.advance(10)
  await list([rowOf('crab-buddy')])
  await clock.advance(10)
  const m = await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })
  const band = await m.find({ key: 'crab-band' }) as never as El
  expect(band.props?.backgroundColor).toBe('userMessageBackground')
  expect(kids(band)[0]?.props?.marginTop).toBe(-2)
})

// 0.12.0 S1: a crab error must never disturb a real tool call, turn or compaction.
test('a crab that throws still lets the tool call through, untouched', async ($, on) => {
  on('tool.call', () => ({ result: { ok: 1 } }) as never)
  // The crab's own clock read fails: whatever it does with the call must not reach the call.
  on('clock.now', () => { throw new Error('boom') })
  const r = await $.tool.call({ tool: 'Bash', command: 'ls' } as never) as { result?: { ok?: number } }
  expect(r.result?.ok).toBe(1)
})

test('a crab that throws still lets a permission request and a compaction through', async ($, on) => {
  on('classic.PermissionRequest', () => ({ ok: 1 }) as never)
  on('clock.now', () => { throw new Error('boom') })
  const r = await $.classic.PermissionRequest({ tool_name: 'Bash' } as never) as { ok?: number }
  expect(r.ok).toBe(1)
})

// 0.12.0 S3, end to end: edits during a turn become bricks while building, and the closing caption is the tally.
test('honest numbers in the band: bricks equal files edited, and the turn ends with its tally as the newest caption', async ($, on) => {
  const clock = mock.clock(on, { now: new Date(2026, 9, 11, 14, 0).getTime() })
  on('tool.call', () => ({ result: {} }) as never)
  on('turn.complete', () => ({ text: 'ok' }) as never)
  on('turn.start', (_$$, e) => ({ turnId: (e as { turnId?: string }).turnId ?? 't1' }) as never)
  on('ui.render', ($$, e) => { const { Box, Text } = $$.ui.resolve(e as never) as never as { Box: never; Text: never }; return h(Box, {}, h(Text, {}, 'card')) as never })
  on('session.start', () => ({ cwd: '/p' }) as never)
  await $.session.start({ source: 'startup', cwd: '/p' } as never)
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  const band = async () => JSON.stringify(await (await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })).drawn())
  await $.turn.start({ text: 'go', turnId: 't1' } as never)
  await $.tool.call({ tool: 'Edit', file_path: '/a.ts' } as never)
  await $.tool.call({ tool: 'Write', file_path: '/b.ts' } as never)
  await $.tool.call({ tool: 'Edit', file_path: '/a.ts' } as never)
  // The wall is build's first take of its first scene: 140 s in, once the five scenes have each played both takes.
  // 20 Nov 2026: 9 s became 141 s, since a look now holds a full 14 s scene and the first build scene went by under
  // thinking; neither side was wrong.
  await clock.advance(141_000)
  // 2 files, 3 edits: two bricks on the wall.
  expect((await band()).match(/class=\\"st-bk\\"/g)?.length).toBe(2)
  await $.turn.complete({ turnId: 't1', reason: 'answer', answer: 'ok', durationMs: 1, isAborted: false } as never)
  await clock.advance(1_000)
  expect(await band()).toContain('Done: 3 edits in 2 files, 2 min.')
})

test('honest numbers in the band: a second running subagent adds a mini crab without waiting for a new look', async ($, on) => {
  const clock = mock.clock(on, { now: new Date(2026, 9, 11, 14, 0).getTime() })
  // The subagents stay running until released.
  const held: (() => void)[] = []
  on('tool.call', async () => { await new Promise<void>(r => held.push(r)); return { result: {} } as never })
  on('turn.start', (_$$, e) => ({ turnId: (e as { turnId?: string }).turnId ?? 't1' }) as never)
  on('ui.render', ($$, e) => { const { Box, Text } = $$.ui.resolve(e as never) as never as { Box: never; Text: never }; return h(Box, {}, h(Text, {}, 'card')) as never })
  on('session.start', () => ({ cwd: '/p' }) as never)
  await $.session.start({ source: 'startup', cwd: '/p' } as never)
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  const minis = async () => JSON.stringify(await (await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })).drawn()).match(/class=\\"st-mc\\"/g)?.length
  await $.turn.start({ text: 'go', turnId: 't1' } as never)
  const a = $.tool.call({ tool: 'Agent' } as never)
  // The mini crabs ride sub's first take, back up 56 s in (four 14 s takes). 20 Nov 2026: was 9 s, before a look held
  // a full 14 s scene, which moved the first take shown; neither side was wrong.
  await clock.advance(57_000)
  expect(await minis()).toBe(1)
  const b = $.tool.call({ tool: 'Agent' } as never)
  await clock.advance(1_000)
  expect(await minis()).toBe(2)
  held.forEach(r => r()); await Promise.all([a, b])
})

// 0.12.0 S4: the test switch. CRAB_SEASON forces a calendar look; unset it is off and the date decides.
test('CRAB_SEASON forces a calendar look in the band, on any date', async ($, on) => {
  const clock = mock.clock(on, { now: new Date(2026, 10, 18, 12, 0).getTime() })
  mock.env(on, { CRAB_SEASON: 'christmas' })
  on('session.start', () => ({ cwd: '/p' }) as never)
  on('ui.render', ($$, e) => { const { Box, Text } = $$.ui.resolve(e as never) as never as { Box: never; Text: never }; return h(Box, {}, h(Text, {}, 'card')) as never })
  await $.session.start({ source: 'startup', cwd: '/p' } as never)
  // The 1 s tick dresses the look; the render only reads it.
  await clock.advance(1_000)
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  const m = await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })
  const svg = String((await m.find({ type: 'Svg' }))?.props?.source)
  expect(svg).not.toBe(sa('idle', 0, ST.idle, 'Idle: waiting for your message', { subs: 0, files: 0 }))
  expect(svg.startsWith('<svg')).toBe(true)
  expect(String((await m.find({ type: 'Svg' }))?.props?.alt)).toBe('Claude crab: idle')
})

test('CRAB_SEASON unset: no calendar look on an ordinary Wednesday noon', async ($, on) => {
  mock.clock(on, { now: new Date(2026, 10, 18, 12, 0).getTime() })
  on('ui.render', ($$, e) => { const { Box, Text } = $$.ui.resolve(e as never) as never as { Box: never; Text: never }; return h(Box, {}, h(Text, {}, 'card')) as never })
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  const m = await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })
  // Idle with no season, exactly what the art draws plain (the walk-in is from the idle station).
  expect(String((await m.find({ type: 'Svg' }))?.props?.source)).toBe(sa('idle', 0, ST.idle, 'Idle: waiting for your message', { subs: 0, files: 0 }))
})

import { projectKey } from './hooks/crab.ts'
const memoryTime = new Date(2026, 10, 18, 12).getTime()
const finishMemoryTurn = async ($: any) => $.turn.complete({ turnId: 't1', reason: 'answer', answer: 'ok', durationMs: 1, isAborted: false })
const memoryBand = async ($: any) => JSON.stringify(await (await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props: { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } })).drawn())
const memoryCore = (on: any) => {
  on('session.start', () => ({ cwd: '/memory-project' }))
  on('turn.start', () => ({ turnId: 't1' }))
  on('turn.complete', () => ({ text: 'ok' }))
  on('tool.call', () => ({ result: {} }))
  on('ui.render', ($: any, e: any) => { const { Box } = $.ui.resolve(e); return h(Box, {}) })
}

test('project memory reads once at start, greets first, writes one private counter record per main turn without double counting', async ($, on) => {
  mock.clock(on, { now: memoryTime }); mock.env(on, {})
  const key = projectKey('/memory-project')
  memoryCore(on)
  const gets: string[] = [], sets: any[] = []
  on('store.get', { key }, async (_$, e, next) => { gets.push(e.key); return next(e) })
  on('store.set', { key }, async (_$, e, next) => { sets.push(e); return next(e) })
  mock.store(on, { [key]: { v: 1, sessions: 6, lastAt: 1, green: 12, red: 2, edits: 42, lastTrait: 'builder' } })
  await $.session.start({ cwd: '/memory-project' } as never)
  expect(await memoryBand($)).toContain('Session 7 on this project. Welcome back.')
  expect(sets.length).toBe(0)
  await $.turn.start({ text: 'private prompt', turnId: 't1' } as never)
  await $.tool.call({ tool: 'Edit', file_path: '/private/name' } as never)
  await $.tool.call({ tool: 'Bash', command: 'npm test' } as never)
  await finishMemoryTurn($)
  await $.turn.start({ text: 'again', turnId: 't1' } as never)
  await $.tool.call({ tool: 'Edit', file_path: '/private/name' } as never)
  await finishMemoryTurn($)
  expect(gets).toEqual([key])
  expect(sets.length).toBe(2)
  expect(sets[1]).toEqual({ key, value: { v: 1, sessions: 7, lastAt: memoryTime, green: 13, red: 2, edits: 44 } })
  expect(JSON.stringify(sets)).not.toMatch(/private|memory-project|prompt/)
  await $.turn.complete({ agentId: 'child' } as never)
  expect(sets.length).toBe(2)
})

test('new project keeps the normal first caption and writes versioned counters', async ($, on) => {
  mock.clock(on, { now: memoryTime }); mock.env(on, {}); memoryCore(on)
  let stored: unknown
  on('store.set', { key: projectKey('/memory-project') }, async (_$, e, next) => { stored = e.value; return next(e) })
  mock.store(on)
  await $.session.start({ cwd: '/memory-project' } as never)
  expect(await memoryBand($)).toContain(LINES.idle[0])
  await finishMemoryTurn($)
  expect(stored).toEqual({ v: 1, sessions: 1, lastAt: memoryTime, green: 0, red: 0, edits: 0 })
})

test('CRAB_MEMORY off never touches the store', async ($, on) => {
  mock.clock(on, { now: memoryTime }); mock.env(on, { CRAB_MEMORY: 'off' }); memoryCore(on)
  let calls = 0
  for (const event of ['store.get', 'store.set', 'store.keys', 'store.delete'] as const) on(event, () => { calls++; throw new Error('disabled') })
  await $.session.start({ cwd: '/memory-project' } as never); await finishMemoryTurn($)
  expect(calls).toBe(0)
  expect(await memoryBand($)).not.toContain('Welcome back')
})

for (const event of ['store.get', 'store.set', 'store.keys', 'store.delete'] as const) test(`${event} failure is silent and turns still finish`, async ($, on) => {
  mock.clock(on, { now: memoryTime }); mock.env(on, {})
  let thrown = 0
  on('store.*', (_$, e, next) => {
    if (next.event === event) { thrown++; throw new Error('private store failure') }
    return next(e)
  })
  mock.store(on, Object.fromEntries(Array.from({ length: 200 }, (_, i) => [`p:${i}`, { v: 1, sessions: 1, lastAt: i, green: 0, red: 0, edits: 0 }])))
  memoryCore(on)
  await $.session.start({ cwd: '/memory-project' } as never)
  expect((await finishMemoryTurn($) as any).text).toBe('ok')
  expect(thrown).toBe(1)
  await finishMemoryTurn($)
  expect(thrown).toBe(1) // failure disables memory for the rest of this session
  expect(await memoryBand($)).not.toContain('private store failure')
})

test('project memory prunes the oldest lastAt at 200 and leaves unrelated keys alone', async ($, on) => {
  mock.clock(on, { now: memoryTime }); mock.env(on, {})
  const deleted: string[] = []
  let keys: string[] = []
  on('store.*', async (_$, e, next) => {
    if (next.is('store.delete', e)) deleted.push(e.key)
    const result = await next(e)
    if (next.event === 'store.keys') keys = (result as { value: string[] }).value
    return result
  })
  mock.store(on, { unrelated: 'keep', ...Object.fromEntries(Array.from({ length: 200 }, (_, i) => [`p:${i}`, { v: 1, sessions: 1, lastAt: 200 - i, green: 0, red: 0, edits: 0 }])) })
  memoryCore(on)
  await $.session.start({ cwd: '/memory-project' } as never); await finishMemoryTurn($)
  await $.session.start({ cwd: '/memory-project' } as never)
  expect(keys.filter(k => k.startsWith('p:')).length).toBe(200)
  expect(deleted).toEqual(['p:199'])
  expect(keys).not.toContain('p:199')
  expect(keys).toContain('unrelated')
})

test('session trait flows to idle and done art and a quarter of captions, with terminal props unchanged', async ($, on) => {
  const clock = mock.clock(on, { now: memoryTime }); mock.env(on, { CRAB_MEMORY: 'off' }); memoryCore(on)
  await $.session.start({ cwd: '/memory-project' } as never)
  await $.turn.start({ text: 'build', turnId: 't1' } as never)
  for (let i = 0; i < 15; i++) await $.tool.call({ tool: 'Edit', file_path: '/a' } as never)
  await finishMemoryTurn($)
  expect(await memoryBand($)).toContain('cb-trait-builder')
  expect(await memoryBand($)).toContain('15 edits')
  await clock.advance(9_000)
  expect(await memoryBand($)).toContain('cb-trait-builder')
  const m = await $.ui.mount({ plugin: 'crab-buddy', surface: 'terminal', component: 'AbovePrompt', props: { hasSurvey: false, bodyColumns: 80 } as never })
  const terminal = kids(await m.find({ key: 'crab-band' }) as El).at(-1)
  expect((terminal?.props?.props as any).trait).toBeUndefined()
})

// 20 Nov 2026 (Praj: animations "cut off midway"): a trait earned mid-look waits for the look's next take; a redraw
// for it alone restarted the scene.
test('a trait earned mid-look waits for the next take, then shows', async ($, on) => {
  const clock = mock.clock(on, { now: memoryTime }); mock.env(on, { CRAB_MEMORY: 'off' }); memoryCore(on)
  await $.session.start({ cwd: '/memory-project' } as never)
  await clock.advance(1_000)
  const before = await memoryBand($)
  for (let i = 0; i < 15; i++) await $.tool.call({ tool: 'Edit', file_path: '/a' } as never)
  await clock.advance(1_000)
  expect(await memoryBand($)).toBe(before)
  await clock.advance(42_000)
  expect(await memoryBand($)).toContain('cb-trait-builder')
})

test('a returning project greeting is first even when the session opens at night', async ($, on) => {
  const now = new Date(2026, 10, 18, 1).getTime()
  mock.clock(on, { now }); mock.env(on, {})
  mock.store(on, { [projectKey('/memory-project')]: { v: 1, sessions: 6, lastAt: 1, green: 12, red: 0, edits: 42 } })
  memoryCore(on)
  await $.session.start({ cwd: '/memory-project' } as never)
  expect(await memoryBand($)).toContain('Session 7 on this project. Welcome back.')
  expect(await memoryBand($)).toContain('Claude crab: night')
  const m = await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props: { hasSurvey: false, bodyColumns: 80 } as never })
  expect(kids(await m.find({ key: 'crab-text' }) as El)[0]?.children?.[0]).toBe('Session 7 on this project. Welcome back.')
})

test('a session earned trait is stored with counters and malformed project data is ignored', async ($, on) => {
  mock.clock(on, { now: memoryTime }); mock.env(on, {})
  let stored: any
  on('store.set', { key: projectKey('/memory-project') }, async (_$, e, next) => { stored = e.value; return next(e) })
  mock.store(on, { [projectKey('/memory-project')]: { v: 1, sessions: 'bad', lastTrait: 'private prompt' } })
  memoryCore(on)
  await $.session.start({ cwd: '/memory-project' } as never)
  expect(await memoryBand($)).not.toContain('Welcome back')
  await $.turn.start({ text: 'tests', turnId: 't1' } as never)
  for (let i = 0; i < 5; i++) await $.tool.call({ tool: 'Bash', command: 'npm test' } as never)
  await finishMemoryTurn($)
  expect(stored).toEqual({ v: 1, sessions: 1, lastAt: memoryTime, green: 5, red: 0, edits: 0, lastTrait: 'tester' })
})

test('pruning follows lastAt even if the clock moved back and the current project is oldest', async ($, on) => {
  mock.clock(on, { now: memoryTime }); mock.env(on, {})
  const deleted: string[] = []
  on('store.delete', { key: projectKey('/memory-project') }, async (_$, e, next) => { deleted.push(e.key); return next(e) })
  mock.store(on, Object.fromEntries(Array.from({ length: 200 }, (_, i) => [`p:${i}`, { v: 1, sessions: 1, lastAt: memoryTime + i + 1, green: 0, red: 0, edits: 0 }])))
  memoryCore(on)
  await $.session.start({ cwd: '/memory-project' } as never); await finishMemoryTurn($)
  expect(deleted).toEqual([projectKey('/memory-project')])
})

// S14: a running idle look changes scenes without a mood event; its caption must follow.
import { take as calendarTakeForTest, START as calendarStart, CALENDAR_LINES as sceneCaptions } from './hooks/crab.ts'
test('calendar scene changes refresh the caption and remove lines belonging to the previous prop', async ($, on) => {
  const start = new Date(2026, 10, 21, 12).getTime()
  const clock = mock.clock(on, { now: start })
  mock.env(on, { CRAB_SEASON: 'weekend' })
  on('session.start', () => ({ cwd: '/p' }) as never)
  on('ui.render', ($$, e) => { const { Box, Text } = $$.ui.resolve(e as never) as never as { Box: never; Text: never }; return h(Box, {}, h(Text, {}, 'card')) as never })
  await $.session.start({ source: 'startup', cwd: '/p' } as never)
  const props = { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80 } as never
  let elapsed = 0, saw = new Set<string>()
  for (let i = 0; i < 14; i++) {
    await clock.advance(42_000); elapsed += 42_000
    const t = calendarTakeForTest({ ...calendarStart, lastActive: start }, start + elapsed, 'idle', 'weekend')
    const mount = await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props })
    for (let scene = 0; scene < 7; scene++) for (const line of sceneCaptions.weekend[scene]) {
      const captions = kids(await mount.find({ key: 'crab-text' }) as El).flatMap(child => child.children ?? [])
      const present = captions.includes(line)
      if (present) { expect(t).toBe(4 + scene); saw.add(line) }
    }
  }
  expect(saw.size).toBeGreaterThanOrEqual(6)
})
