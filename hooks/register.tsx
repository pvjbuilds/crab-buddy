import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'
import type { Crab, Mood } from '../types'
import { classify, step, shown, take, setLine, START, MEANING, LINES } from './crab.ts'
import type { CrabEvent } from './crab.ts'
import { crabArt, stageArt, STATION } from './art.ts'
import { COLS, ROWS } from './term.tsx'

const crab = atom({ plugin: 'crab-buddy', key: 'crab' } as const, START)
// What the crab acts out, which take, since when, the caption log (newest first) and the stage station it walks
// in from (the last mood's).
type Look = { mood: Mood; take: number; at: number; log: string[]; from?: number }
const look = atom({ plugin: 'crab-buddy', key: 'look' } as const, { mood: 'idle', take: 0, at: 0, log: [], from: 1 } as Look)
// Rapid changes flashed by too fast to read (Praj, 12 Oct): a look stays at least this long, then the crab
// jumps to whatever is current. The same mood keeps its take until the take's own clock moves it on.
const DWELL = 3_000
// Every plugin's status line, by plugin, drawn in the crab's bar instead of the footer's "+1" overflow.
const lines = atom({ plugin: 'crab-buddy', key: 'lines' } as const, {} as Record<string, string>)

// The render reads only `look`, so the crab redraws when its mood or take changes and never in between.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function show($: any, c: Crab, now: number) {
  const was = await read($, look)
  if (now - was.at < DWELL) return
  const m = shown(c, now)
  if (m === was.mood) {
    // A repeat (Read after Read) restarts lastActive, which would re-pick the take on every call.
    const t = take({ ...c, lastActive: was.at }, now, m)
    if (t !== was.take) await update($, look, x => ({ ...x, take: t, at: now, from: STATION[m] }))
    return
  }
  const t = take(c, now, m)
  // A one-liner picked by the millisecond the mood came up; the caption scrolls down one line.
  const line = LINES[m][now % LINES[m].length]
  await update($, look, x => ({ mood: m, take: t, at: now, from: STATION[x.mood], log: [line, ...x.log.filter(l => l !== line)].slice(0, 2) }))
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

const FOOTER: ReadonlySet<string> = new Set(['handoff-wait'])

// An empty band: nothing drawn, or a Box with no children.
const isEmpty = (n: unknown) => {
  const kids = (n as { children?: unknown } | null)?.children
  return !n || kids == null || (Array.isArray(kids) && kids.every(k => k == null || k === false))
}

// Subagents' own turns and tools stay out: the main loop's Agent call already shows the mini crab.
const isSub = (e: unknown) => typeof (e as { agentId?: unknown }).agentId === 'string'

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const now = await $.clock.now()
    await update($, crab, c => ({ ...c, lastActive: now }))
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
    if (!isSub(e)) await apply($, { kind: 'turnEnd' })
    return r
  })

  on('tool.call', async ($, e, next) => {
    if (isSub(e)) return next(e)
    const m = classify(String(e.tool), e as never as Record<string, unknown>)
    await apply($, { kind: 'tool', mood: m })
    const r = await next(e)
    await apply($, { kind: 'toolEnd', mood: m, isError: r.isError === true })
    return r
  })

  // The engine settled on asking you: the crab holds up a question mark until the call goes on.
  on('tool.check', async ($, e, next) => {
    const r = await next(e)
    if (r.decision === 'ask' && !isSub(e)) await apply($, { kind: 'ask' })
    return r
  })

  // A precompute runs unseen in the background, and a subagent's compaction is its own: neither squishes the crab.
  // No 🦀 emoji: the real crab squishes right beside the line (Praj, 11 Oct). The bar line doubles as a trace: Praj saw no squish on 11 Oct's auto compaction; line but no squish = drawing,
  // neither = the hook never fired.
  on('session.compact', async ($, e, next) => {
    if (e.trigger === 'precompute' || isSub(e)) return next(e)
    await apply($, { kind: 'compact' })
    await update($, lines, l => setLine(l, 'crab-buddy', `Compacting (${e.trigger})`))
    try { return await next(e) } finally {
      await apply($, { kind: 'compactEnd' })
      await update($, lines, l => setLine(l, 'crab-buddy', undefined))
    }
  })

  // Cache warm stays in the footer, beside the model name, and not again in the bar (Praj, 11 Oct).
  // Status lines move into the crab's bar: all of them in one glance, no plugin names, no "+1" (Praj, 11 Oct).
  // Not passed on, so the footer stays empty; with crab-buddy off they fall back to the footer.
  on('ui.status', async ($, e, next) => {
    const who = next.origin.plugin
    if (FOOTER.has(who)) return next(e)
    await update($, lines, l => setLine(l, who, e.text))
    // Cleared below too: a resumed session re-pins the footer lines it had before the restart.
    return next({ ...e, text: undefined })
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const rest = await next(e)
    if (e.props.hasSurvey) return rest
    const { mood: m, take: t, log: seen, from } = await read($, look)
    // The caption log, newest on top; before the first change, the mood's first line.
    const log = seen.length ? seen : [LINES[m][0]]
    // Footer-owned lines never draw here, even one a 0.2.0 session left in the atom.
    const ls = Object.entries(await read($, lines)).filter(([who]) => !FOOTER.has(who))
    const { Box, Svg, Text, Client } = $.ui.resolve(e) as ReturnType<typeof $.ui.resolve> & { Svg: never; Client: never }
    const row = ls.length > 0 && (
      <Box key="crab-lines" flexDirection="row" flexWrap="wrap" columnGap={3}>
        {ls.map(([who, text]) => <Text key={who} color="text">{text}</Text>)}
      </Box>
    )
    const info = !!row || !isEmpty(rest)
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
          <Client key="crab-term" module="./term.tsx" props={{ mood: m }} width={COLS} height={ROWS} />
        </Box>
      )
    }
    // The crab is in flow at the bar's right, beside the lines: floated, the band clipped it or shrank it to
    // its slot (0.4.3). 52×41: one size up, art ratio 38:30 (Praj, 11 Oct).
    // The bar reads like the transcript (Praj, 11 Oct). Nothing floats: a floated fill painted over
    // the crab and the lines in the app (0.4.5-0.4.7; 0.4.7's lift boxes did not lift them, live check 22:07).
    //  - crab-fill is the crab's and the lines' own parent, so they paint over its fill in document order.
    //  - It reaches into the card's padding ((40px - 1lh)/2 x 8px; margin units .5lh and ch) with the same
    //    padding back, so the content stays put. The band clips overshoot above and sideways without
    //    scrolling; below, overshoot would scroll the band, so the bottom stops at the padding's edge:
    //    1.16 x .5lh = (40px - 1lh)/2 at the measured lh 18.5 (half a line left a 1.5px grey line, 22:24).
    //  - crab-band carries the same colour: the app zeroes vertical margins down a single-child chain from
    //    the root, and stops at a Box with a background.
    // ponytail: 1.16 is calibrated to lh 18.5: a larger text size leaves a grey line below (lower it), a smaller
    // one lets the bar scroll a pixel or two.
    // The transcript's colour by theme key, which the desktop resolves by the app's own theme: Claude Code's theme
    // setting can say dark while the app is light (Windows, Praj 12 Oct). Probe 10:58: #151515 dark, #fcfcfb light.
    const bg = 'userMessageBackground'
    const stage = e.props.bodyColumns >= 60
    return (
      <Box key="crab-band" flexDirection="row" backgroundColor={bg}>
        {/* The crab stands at the bottom right, right on the prompt box, however many lines sit beside it (Praj, 12 Oct). */}
        <Box key="crab-fill" flexDirection="row" alignItems="flex-end" columnGap={2} flexGrow={1} backgroundColor={bg}
          marginTop={-2} paddingTop={2} marginBottom={-1.16} paddingBottom={1.16} marginLeft={-2} paddingLeft={2} marginRight={-2} paddingRight={2}>
          <Box key="crab-text" flexDirection="column" flexGrow={1} flexShrink={1}>
            {row}
            {info && rest}
            {/* Crab alone in the band: its caption fills the left, so the bar is never an empty strip (Praj, 12 Oct). */}
            {/* Two lines when the crab is alone, the newest only beside other lines and cards (Praj, 12 Oct). */}
            {(info ? log.slice(0, 1) : log).map((l, i) => <Text key={l} color={i === 0 ? 'inactive' : 'subtle'} wrap="truncate-end">{l}</Text>)}
          </Box>
          {/* The right half is the crab's stage (Praj, 12 Oct). The Svg asks for more than the half and is capped to it.
              Under 60 columns the half is too small to walk in, and the crab stands as before. */}
          <Box key="crab-buddy" flexShrink={0} width={stage ? '50%' : undefined}>
            {stage
              ? <Svg source={stageArt(m, t, from ?? STATION[m])} alt={`Claude crab: ${m}`} width={2000} height={41} />
              : <Svg source={crabArt(m, t)} alt={`Claude crab: ${m}`} width={52} height={41} />}
            {/* Pointer on the crab: what this animation means, floated left over the lines so nothing moves (Praj, 12 Oct).
                Top row of the band, which clips anything placed outside it. */}
            <Box position="absolute" top={0} right={8} display="none" hover={{ display: 'flex' }}
              backgroundColor="text" paddingX={1}>
              <Text color="inverseText" wrap="truncate-end">{MEANING[m]}</Text>
            </Box>
          </Box>
        </Box>
      </Box>
    )
  })
}
