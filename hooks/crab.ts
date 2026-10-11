import type { Mood } from '../types'

const TEST = /\b(pytest|jest|vitest|unittest|plugin test|(npm|pnpm|yarn|bun|go|cargo|deno) test)\b/
const INSTALL = /\b((npm|pnpm|yarn|bun) (i|install|add)|pip3? install|uv (add|pip install|tool install)|brew install)\b/

/** The mood a main-loop tool call starts. */
export function classify(tool: string, args: Record<string, unknown>): Mood {
  if (tool === 'AskUserQuestion') return 'ask'
  if (tool === 'Agent' || tool === 'Task') return 'sub'
  if (/^(WebSearch|WebFetch)$/.test(tool)) return 'web'
  if (/^(Read|Grep|Glob|LS)$/.test(tool)) return 'read'
  if (/^(Edit|Write|MultiEdit|NotebookEdit)$/.test(tool)) return 'build'
  if (tool !== 'Bash') return 'think'
  const cmd = typeof args.command === 'string' ? args.command : ''
  if (TEST.test(cmd)) return 'test'
  if (/(^|[\s;&|/])(codex|agy)\s/.test(cmd)) return 'codex'
  if (/\bgit (commit|push)\b/.test(cmd)) return 'git'
  if (INSTALL.test(cmd)) return 'inst'
  return 'build'
}

import type { Crab } from '../types'

export type CrabEvent =
  | { kind: 'turnStart' | 'turnEnd' | 'ask' | 'compact' | 'compactEnd' }
  | { kind: 'tool'; mood: Mood }
  | { kind: 'toolEnd'; mood: Mood; isError: boolean }

export const START: Crab = { mood: 'idle', until: 0, fails: 0, testFailed: false, turnAt: null, lastActive: 0 }

// A held look outlasts the band's 3 s dwell plus its 1 s tick, so it can never be skipped.
const HOLD = 5_000
const DONE = 5_000
const LONG = 5 * 60_000
const DOZE = 10 * 60_000
const SWAP = 8_000
// Building is most of a turn, so it rotates five scenes, 10 s each, counted from the turn's start (Praj, 12 Oct).
// The 5 s retime tick moves it on; each switch redraws the crab once.
export const BUILDS = ['build', 'saw', 'type', 'paint', 'gear'] as const satisfies readonly Mood[]
const SCENE = 10_000
// The night owl keeps the person's own clock: the host's local hour.
const localHour = (now: number) => new Date(now).getHours()
// Moods that only last while their tool runs; after it Claude is thinking again.
const BRIEF: ReadonlySet<Mood> = new Set(['ask', 'sub', 'codex', 'git', 'inst', 'test'])

export function step(c: Crab, ev: CrabEvent, now: number): Crab {
  switch (ev.kind) {
    case 'turnStart': return { ...c, mood: 'think', until: 0, turnAt: now, lastActive: now }
    case 'turnEnd': return { ...c, mood: 'done', until: now + DONE, turnAt: null, lastActive: now }
    case 'tool': return { ...c, mood: ev.mood, until: 0, lastActive: now }
    case 'ask': return { ...c, mood: 'ask', until: 0, lastActive: now }
    case 'compact': return { ...c, mood: 'comp', until: 0, lastActive: now }
    case 'compactEnd': return { ...c, mood: c.turnAt === null ? 'idle' : 'think', until: 0, lastActive: now }
    case 'toolEnd': {
      const isTest = ev.mood === 'test'
      if (ev.isError) {
        const fails = c.fails + 1
        return { ...c, fails, testFailed: isTest || c.testFailed, mood: isTest ? 'testf' : fails >= 3 ? 'dizzy' : 'debug', until: now + HOLD, lastActive: now }
      }
      if (isTest) return { ...c, fails: 0, testFailed: false, mood: c.testFailed ? 'fixed' : 'testp', until: now + HOLD, lastActive: now }
      return { ...c, fails: 0, mood: BRIEF.has(ev.mood) ? 'think' : ev.mood, until: 0, lastActive: now }
    }
  }
}

/** What the crab acts out at `now`. */
export function shown(c: Crab, now: number): Mood {
  if (c.until > now || c.mood === 'comp') return c.mood
  if (c.turnAt !== null) {
    const busy = c.until ? 'think' : c.mood
    // Past 5 minutes the sweat takes turns with the work, 8 s each, so a long turn keeps its flavour (Praj, 11 Oct).
    const over = now - c.turnAt - LONG
    if (over > 0 && Math.floor(over / SWAP) % 2 === 0 && (busy === 'think' || busy === 'read' || busy === 'build')) return 'long'
    return busy === 'build' ? BUILDS[Math.floor((now - c.turnAt) / SCENE) % BUILDS.length] : busy
  }
  if (localHour(now) < 5) return 'night'
  return now - c.lastActive >= DOZE ? 'doze' : 'idle'
}

// Every other mood has four takes (Praj, 12 Oct: "3 more options to each state"). The first is picked by the
// millisecond the mood began, so two test runs in a row seldom match; then the next take every 10 s. Idle,
// doze and night owl hold a take 30 s: idle's own fidget loop runs 30 s. A held mood (done, a test result)
// lasts under 10 s, so it never switches mid-gag.
export const TAKES = 4
const CALM: ReadonlySet<Mood> = new Set(['idle', 'doze', 'night'])

/** Which of its takes `mood` plays at `now`: 0 for the build scenes, which rotate on their own. */
export function take(c: Crab, now: number, mood: Mood): number {
  if ((BUILDS as readonly Mood[]).includes(mood)) return 0
  const held = Math.max(0, now - c.lastActive)
  return (c.lastActive + Math.floor(held / (CALM.has(mood) ? 3 * SCENE : SCENE))) % TAKES
}

/** The status lines by plugin after `who` set `text`; an empty text takes its line away. */
export function setLine(l: Record<string, string>, who: string, text: string | undefined): Record<string, string> {
  if (!text) return Object.fromEntries(Object.entries(l).filter(([k]) => k !== who))
  return { ...l, [who]: text }
}

/** What each animation means, shown when the pointer is on the crab. Said with certainty, no "or" (Praj, 12 Oct). */
export const MEANING: Record<Mood, string> = {
  idle: 'Idle: waiting for your message',
  think: 'Thinking',
  read: 'Reading and searching files',
  build: 'Editing files and running commands',
  saw: 'Editing files and running commands',
  type: 'Editing files and running commands',
  paint: 'Editing files and running commands',
  gear: 'Editing files and running commands',
  test: 'Running tests',
  testp: 'Tests passed',
  testf: 'Tests failed',
  debug: 'A command failed: fixing it',
  dizzy: 'Three failures in a row',
  fixed: 'Tests pass again after a failure',
  done: 'Turn finished',
  doze: 'Dozing: nothing happened for 10 min',
  night: 'Night owl: between midnight and 5 am',
  web: 'Searching and reading the web',
  sub: 'A subagent is working',
  codex: 'Another model is working: Codex, Gemini',
  git: 'Committing and pushing with git',
  inst: 'Installing a package',
  ask: 'Waiting for your reply',
  long: 'This turn has run past 5 min',
  comp: 'Compacting the conversation',
}
