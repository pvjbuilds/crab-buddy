import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'
import type { Crab, Mood, Trait, ProjectMemory } from '../types'
import { classify, step, shown, take, takes, setLine, tally, START, MEANING, LINES, season, pickLine, lineFitsScene, trait, traitLine, projectKey, greeting, PROFILE } from './crab.ts'
import type { CrabEvent, Season } from './crab.ts'
import { crabArt, stageArt, where, STATION } from './art.ts'
import { COLS, ROWS } from './term.tsx'

const crab = atom({ plugin: 'crab-buddy', key: 'crab' } as const, START)
// What the crab acts out, which take, since when, the caption log (newest first) and the stage spot it walks
// in from. `seed` is the crab's lastActive when the look came up, so the take clock keeps counting from there.
type Look = { mood: Mood; take: number; at: number; log: string[]; from?: number; seed?: number; season?: Season; year?: number; trait?: Trait; n?: { subs: number; files: number } }
const look = atom({ plugin: 'crab-buddy', key: 'look' } as const, { mood: 'idle', take: 0, at: 0, log: [], from: 1 } as Look)
// Rapid changes flashed by too fast to read (Praj, 12 Oct): a look stays at least this long, then the crab
// jumps to whatever is current. The same mood keeps its take until the take's own clock moves it on.
// 8 s, not 3 (Praj, 12 Oct 13:05: still swapped every 2-4 s). A held look (an error, a test result, done), a
// question or a squish cuts straight in: a 5 s hold would vanish inside the dwell, and the trip lands on its moment.
const DWELL = 8_000
const CUT: ReadonlySet<Mood> = new Set(['debug', 'dizzy', 'testf', 'testp', 'fixed', 'done', 'ask', 'comp'])
// Where the crab stands now, mid-walk or mid-wander: a new look walks on from here, never from the old spot,
// which snapped the crab back across the stage (Praj, 12 Oct). The first look is timed from the session's start.
let began = 0
// Whether the app frosts its panels over a backdrop a look set: the band's card is glass then.
let frosted = false
const here = (x: Look, now: number) => (x.at || began) > 0 ? where(x.mood, x.from ?? STATION[x.mood], (now - (x.at || began)) / 1000, x.take) : STATION[x.mood]
// Every plugin's status line, by plugin, drawn in the crab's bar instead of the footer's "+1" overflow.
const lines = atom({ plugin: 'crab-buddy', key: 'lines' } as const, {} as Record<string, string>)
// Whether another plugin draws a row in the band (0.12.0 S15). The app asks each plugin for its own row, so the
// crab's own `rest` no longer shows company; the band's arrangement (AbovePromptList) does.
const company = atom({ plugin: 'crab-buddy', key: 'company' } as const, false)

// The render reads only `look`, so the crab redraws when its mood or take changes and never in between.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function show($: any, c: Crab, now: number) {
  const was = await read($, look)
  const m = shown(c, now)
  const s = season(now, await $.env.get('CRAB_SEASON').catch(() => undefined))
  const date = new Date(now), year = date.getFullYear() + (date.getMonth() === 11 && date.getDate() === 31 ? 1 : 0)
  const learned = trait(c.profile ?? PROFILE)
  if (learned !== was.trait) await update($, look, x => ({ ...x, trait: learned }))
  if (s !== was.season || (s === 'newYear' && year !== was.year)) {
    await update($, look, x => {
      const t = take({ ...c, lastActive: x.seed ?? c.lastActive }, now, x.mood, s)
      const line = pickLine(x.mood, now, s, t)
      const log = takes(x.mood, s) > takes(x.mood)
        ? [line, ...x.log.filter(l => l !== line && lineFitsScene(l, x.mood, s, t))].slice(0, 2) : x.log
      return { ...x, season: s, year, take: t, log }
    })
  }
  // The stage's real counts (running subagents, files edited) ride in the look; the art redraws only when a count
  // the current look draws changes, never in between.
  const n = { subs: c.n.subs, files: c.n.files.length }
  if (m === was.mood && ((m === 'sub' && n.subs !== was.n?.subs) || (m === 'build' && n.files !== was.n?.files))) {
    await update($, look, x => ({ ...x, n, at: now, from: here(x, now) }))
    return
  }
  if (now - was.at < DWELL && (m === was.mood || !CUT.has(m))) return
  if (m === was.mood) {
    // A repeat (Read after Read) restarts lastActive, which would re-pick the take on every call. The look's own
    // seed, not `at`: `at` moves with each take, which cut every take after the first at 8 s (21 Oct).
    const t = take({ ...c, lastActive: was.seed ?? c.lastActive }, now, m, s)
    if (t !== was.take) await update($, look, x => {
      const line = pickLine(m, now, s, t)
      const log = takes(m, s) > takes(m)
        ? [line, ...x.log.filter(l => l !== line && lineFitsScene(l, m, s, t))].slice(0, 2) : x.log
      return { ...x, take: t, seed: x.seed ?? c.lastActive, at: now, from: here(x, now), n, log }
    })
    return
  }
  const t = take(c, now, m, s)
  // A one-liner picked by the millisecond the mood came up; the caption scrolls down one line.
  // A session count gets one slot in four; otherwise done keeps its turn tally and other looks their one-liner.
  const line = traitLine(m, now, c.profile ?? PROFILE) || (m === 'done' && tally(c)) || pickLine(m, now, s, t)
  await update($, look, x => ({ mood: m, take: t, at: now, seed: c.lastActive, season: s, year, trait: learned, from: here(x, now), n, log: [line, ...x.log.filter(l => l !== line)].slice(0, 2) }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function apply($: any, ev: CrabEvent) {
  const now = await $.clock.now()
  await show($, await update($, crab, x => step(x, ev, now)), now)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function retime($: any) {
  await show($, await read($, crab), await $.clock.now())
}

// The maintainer's cache clock, renamed from handoff-wait (Praj, 24 Oct).
const FOOTER: ReadonlySet<string> = new Set(['cache'])

// An empty band: nothing drawn, or a Box with no children.
const isEmpty = (n: unknown) => {
  const kids = (n as { children?: unknown } | null)?.children
  return !n || kids == null || (Array.isArray(kids) && kids.every(k => k == null || k === false))
}

// Subagents' own turns and tools stay out: the main loop's Agent call already shows the mini crab.
const isSub = (e: unknown) => typeof (e as { agentId?: unknown }).agentId === 'string'

// A crab error never disturbs a real tool call, permission dialog or compaction (0.12.0): a hook that throws is
// skipped by the engine anyway, and this `.catch` registration makes it say so by running the rest in its place.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const through = (_$: any, e: any, next: (e: any) => any) => next(e)

// Stored data is untrusted (including older versions). Copy only the declared counters.
function projectRecord(value: unknown): ProjectMemory | undefined {
  if (!value || typeof value !== 'object') return
  const p = value as ProjectMemory
  if (p.v !== 1 || ![p.sessions, p.lastAt, p.green, p.red, p.edits].every(n => Number.isSafeInteger(n) && n >= 0)) return
  return { v: 1, sessions: p.sessions, lastAt: p.lastAt, green: p.green, red: p.red, edits: p.edits,
    ...(typeof p.lastTrait === 'string' && ['tester', 'builder', 'reader', 'surfer', 'manager', 'fixer'].includes(p.lastTrait) ? { lastTrait: p.lastTrait } : {}) }
}

// One snapshot at session start. Totals are base + session counts, so turns never double-count.
let memory: { key: string; base: ProjectMemory; oldest: { key: string; lastAt: number }[] } | undefined
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function remember($: any, now: number) {
  if (!memory) return
  try {
    const { key, base, oldest } = memory, p = (await read($, crab)).profile ?? PROFILE
    const learned = trait(p)
    await $.store.set(key, { v: 1, sessions: base.sessions + 1, lastAt: now,
      ...(learned ? { lastTrait: learned } : {}), green: base.green + p.green, red: base.red + p.red, edits: base.edits + p.edits })
    // Compare every timestamp, including this project: the host clock may have moved back.
    const candidates = [...oldest, { key, lastAt: now }].sort((a, b) => a.lastAt - b.lastAt || a.key.localeCompare(b.key))
    while (candidates.length > 200) {
      const dropped = candidates.shift()!
      await $.store.delete(dropped.key)
      const index = oldest.findIndex(p => p.key === dropped.key)
      if (index >= 0) oldest.splice(index, 1)
    }
  } catch { memory = undefined }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const now = await $.clock.now()
    await update($, crab, c => ({ ...c, lastActive: now }))
    began = now
    memory = undefined
    let welcome: string | undefined
    // env failure disables persistence too. No store error reaches the session or its caption.
    if (await $.env.get('CRAB_MEMORY').catch(() => 'off') !== 'off') {
      try {
        const key = projectKey(e.cwd), stored = projectRecord(await $.store.get(key))
        const keys: string[] = await $.store.keys()
        const oldest: { key: string; lastAt: number }[] = []
        for (const other of keys.filter(k => k.startsWith('p:') && k !== key)) {
          const record = projectRecord(await $.store.get(other))
          oldest.push({ key: other, lastAt: record?.lastAt ?? 0 })
        }
        oldest.sort((a, b) => a.lastAt - b.lastAt || a.key.localeCompare(b.key))
        memory = { key, base: stored ?? { v: 1, sessions: 0, lastAt: 0, green: 0, red: 0, edits: 0 }, oldest }
        welcome = greeting(stored, now)
      } catch { memory = undefined }
    }
    await show($, await read($, crab), now)
    if (welcome) await update($, look, x => ({ ...x, log: [welcome!] }))
    // Timed moods (done, a test result, doze, night owl, long turn) change with no event; 1 s also ends a dwell on time.
    $.clock.every(1_000, () => retime($))
    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    if (!isSub(e)) await apply($, { kind: 'turnStart' })
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const r = await next(e)
    if (!isSub(e)) {
      await apply($, { kind: 'turnEnd' })
      await remember($, await $.clock.now())
    }
    return r
  })

  on('tool.call', async ($, e, next) => {
    if (isSub(e)) return next(e)
    const m = classify(String(e.tool), e as never as Record<string, unknown>)
    await apply($, { kind: 'tool', mood: m })
    const r = await next(e)
    // An edit tool names its file ('' when it names none); other tools carry none.
    const file = /^(Edit|Write|MultiEdit|NotebookEdit)$/.test(String(e.tool)) ? String((e as { file_path?: unknown; notebook_path?: unknown }).file_path ?? (e as { notebook_path?: unknown }).notebook_path ?? '') : undefined
    await apply($, { kind: 'toolEnd', mood: m, isError: r.isError === true, file, command: e.tool === 'Bash' })
    return r
  }).catch(through)

  // A permission dialog opened: the crab holds up a question mark until the call goes on. Not `tool.check`'s ask,
  // which the mode settles after it: auto mode's classifier approved most unseen, and the "?" showed for nobody (12 Oct).
  on('classic.PermissionRequest', async ($, e, next) => {
    if (typeof (e as { agent_id?: unknown }).agent_id !== 'string') await apply($, { kind: 'ask' })
    return next(e)
  }).catch(through)

  // A precompute runs unseen in the background, and a subagent's compaction is its own: neither squishes the crab.
  // No 🦀 emoji: the real crab squishes right beside the line (Praj, 11 Oct). The bar line doubles as a trace: Praj saw no squish on 11 Oct's auto compaction; line but no squish = drawing,
  // neither = the hook never fired.
  // The squish waits for the settings PreCompact hooks: one that blocks (Praj's compact_gate.py holds auto-compaction
  // mid-task) leaves the conversation as it is, and the crab squished for nothing (Praj, 16 Oct).
  let armed: string | undefined, squished = false
  on('session.compact', async ($, e, next) => {
    if (e.trigger === 'precompute' || isSub(e)) return next(e)
    armed = e.trigger
    try { return await next(e) } finally {
      armed = undefined
      if (squished) {
        squished = false
        await apply($, { kind: 'compactEnd' })
        await update($, lines, l => setLine(l, 'crab-buddy', undefined))
      }
    }
  }).catch(through)
  on('classic.PreCompact', async ($, e, next) => {
    const r = await next(e)
    if (armed && !r.block && !r.preventContinuation) {
      squished = true
      await apply($, { kind: 'compact' })
      await update($, lines, l => setLine(l, 'crab-buddy', `Compacting (${armed})`))
    }
    return r
  }).catch(through)

  // Cache warm stays in the footer, beside the model name, and not again in the bar (Praj, 11 Oct).
  // Status lines move into the crab's bar: all of them in one glance, no plugin names, no "+1" (Praj, 11 Oct).
  // Not passed on, so the footer stays empty; with crab-buddy off they fall back to the footer.
  on('ui.status', async ($, e, next) => {
    const who = next.origin.plugin
    if (FOOTER.has(who)) return next(e)
    await update($, lines, l => setLine(l, who, e.text))
    // Cleared below too: a resumed session re-pins the footer lines it had before the restart.
    return next({ ...e, text: undefined })
  }).catch(through)

  // Heard, never changed: the rows pass on exactly as they came. Drawing may not write state, so a change is written
  // a moment later from a timer, its own event; the crab's row then redraws once with or without its paint.
  // A look is another plugin's (a BackdropKit theme): it is heard of as the app asks every plugin to draw its scene,
  // and never answered here. Glass off, the panels stay as they are, and so does the paint.
  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    const now = e.props.glass !== false
    if (now !== frosted) {
      frosted = now
      $.ui.invalidate('ui.render')
    }
    return next(e)
  })

  on('ui.render', { component: 'AbovePromptList' }, async ($, e, next) => {
    const others = e.props.rows.some(r => r.plugin !== 'crab-buddy')
    if (others !== await read($, company)) $.clock.after(0, () => update($, company, () => others))
    return next(e)
  }).catch(through)

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const rest = await next(e)
    if (e.props.hasSurvey) return rest
    const { mood: m, take: t, log: seen, from, n, season: s, year, trait: learned } = await read($, look)
    // The caption log, newest on top; before the first change, the mood's first line.
    const matching = seen.filter(line => lineFitsScene(line, m, s, t))
    const log = matching.length ? matching : [LINES[m][0]]
    // Footer-owned lines never draw here, even one a 0.2.0 session left in the atom.
    const ls = Object.entries(await read($, lines)).filter(([who]) => !FOOTER.has(who))
    const { Box, Svg, Text, Client } = $.ui.resolve(e) as ReturnType<typeof $.ui.resolve> & { Svg: never; Client: never }
    const row = ls.length > 0 && (
      <Box key="crab-lines" flexDirection="row" flexWrap="wrap" columnGap={3}>
        {ls.map(([who, text]) => <Text key={who} color="text">{text}</Text>)}
      </Box>
    )
    // Company: a status line, another plugin's content beneath, or another plugin's row in the band (Praj, 19 Nov: the
    // dark paint reached up over the progress-bar row above and cut it in half).
    const info = !!row || !isEmpty(rest) || await read($, company)
    // Terminal: the welcome-screen crab in quadrant blocks, at the band's bottom right, three rows tall; the
    // terminal animates it (./term.tsx). Too narrow for it beside the lines, the lines keep the room.
    // By surface, not by table: the terminal's table answers Svg too, drawn as an empty fragment.
    if (e.surface !== 'desktop') {
      if (e.surface !== 'terminal' || e.props.bodyColumns < COLS + 24) return row ? <Box flexDirection="column">{row}{rest}</Box> : rest
      return (
        <Box key="crab-band" flexDirection="row" alignItems="flex-end" columnGap={2}>
          <Box key="crab-text" flexDirection="column" flexGrow={1} flexShrink={1}>
            {row}
            {info && rest}
          </Box>
          <Client key="crab-term" module="./term.tsx" props={{ mood: m, take: t, ...(s ? { season: s } : {}) }} width={COLS} height={ROWS} />
        </Box>
      )
    }
    // The crab is in flow at the bar's right, beside the lines: floated, the band clipped it or shrank it to
    // its slot (0.4.3). 52×41: one size up, art ratio 38:30 (Praj, 11 Oct).
    // Paint by company (Praj, 16 Nov): alone in the band the crab merges with the chat, the transcript colour by theme
    // key (the 11 Oct look, 0.11.1). Since 2.1.325 other plugins' rows sit on the app's gray band card, where that
    // paint showed as a dark strip, so with company (`info`: a status line or another plugin's content) it is dropped.
    // The fill reaches into the card's padding ((40px - 1lh)/2 x 8px; margin units .5lh and ch) with the same padding
    // back, so the content stays put; the bottom stops at the padding's edge: 1.16 x .5lh = (40px - 1lh)/2 at lh 18.5.
    // ponytail: 1.16 is calibrated to lh 18.5: larger text leaves a grey line below (lower it), smaller lets the bar scroll.
    // The narrow label still floats over the caption, so it keeps a theme-key background either way.
    const bg = 'userMessageBackground'
    // Over a frosted backdrop the paint stands on the glass card as a solid block: dropped, as with company.
    const paint = info || frosted ? undefined : bg
    const reach = info ? {} : { marginTop: -2, paddingTop: 2, marginBottom: -1.16, paddingBottom: 1.16, marginLeft: -2, paddingLeft: 2, marginRight: -2, paddingRight: 2 }
    const stage = e.props.bodyColumns >= 60
    return (
      <Box key="crab-band" flexDirection="row" backgroundColor={paint}>
        {/* The crab stands at the bottom right, right on the prompt box, however many lines sit beside it (Praj, 12 Oct). */}
        <Box key="crab-fill" flexDirection="row" alignItems="flex-end" columnGap={2} flexGrow={1} backgroundColor={paint} {...reach}>
          <Box key="crab-text" flexDirection="column" flexGrow={1} flexShrink={1}>
            {row}
            {info && rest}
            {/* Crab alone in the band: its caption fills the left, so the bar is never an empty strip (Praj, 12 Oct). */}
            {/* Both lines always, newest on top in full text colour, the one before dimmer (Praj, 14 Oct: beside a
                status line the older one was dropped, which read as the line hiding it). */}
            {log.map((l, i) => <Text key={l} color={i === 0 ? 'text' : 'subtle'} wrap="truncate-end">{l}</Text>)}
          </Box>
          {/* The right half is the crab's stage (Praj, 12 Oct). The Svg asks for more than the half and is capped to it.
              Under 60 columns the half is too small to walk in, and the crab stands as before. */}
          <Box key="crab-buddy" flexShrink={0} width={stage ? '50%' : undefined}>
            {/* On the stage the label is part of the crab's art, over its head wherever it stands; interactive, so
                the art sees the pointer. On Windows a hover Box got the desktop's own pill, which kept only the text
                colour (Praj's photos, 12 Oct). */}
            {stage
              ? <Svg source={stageArt(m, t, from ?? STATION[m], MEANING[m], n, s, year, learned)} alt={`Claude crab: ${m}`} width={2000} height={41} isInteractive />
              : <Svg source={crabArt(m, t, s, year, learned)} alt={`Claude crab: ${m}`} width={52} height={41} />}
            {/* Narrow band, crab in the corner: the label floats left of it in the band's own colours, top row. */}
            {!stage && <Box position="absolute" top={0} right={8} display="none" hover={{ display: 'flex' }}
              backgroundColor={bg} paddingX={1}>
              <Text color="text" wrap="truncate-end">{MEANING[m]}</Text>
            </Box>}
          </Box>
        </Box>
      </Box>
    )
  })
}
