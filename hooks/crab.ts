import type { Mood, Profile, Trait, ProjectMemory } from '../types'

export type Season = 'friday' | 'weekend' | 'sundayNight' | 'christmas' | 'newYear'
const SEASONS: readonly Season[] = ['friday', 'weekend', 'sundayNight', 'christmas', 'newYear']
export function season(now: number, force?: string): Season | undefined {
  if (SEASONS.includes(force as Season)) return force as Season
  const d = new Date(now), month = d.getMonth(), day = d.getDate(), weekday = d.getDay(), hour = d.getHours()
  if (month === 11 && day >= 18 && day <= 30) return 'christmas'
  if ((month === 11 && day === 31) || (month === 0 && day <= 7)) return 'newYear'
  if (weekday === 5 && hour >= 16) return 'friday'
  if (weekday === 6 || (weekday === 0 && hour < 18)) return 'weekend'
  if (weekday === 0) return 'sundayNight'
}
export const SEASON_LINES: Record<Season, readonly string[]> = {
  friday: ['Friday has entered the chat.', 'The weekend is within claw reach.', 'Nearly beach time.', 'Friday has cleared its schedule.', 'One claw on the weekend.', 'The crab has weekend plans.', 'Friday feels good on this shell.', 'The end of the week has arrived.'],
  weekend: ['The crab is not supposed to be here.', 'This was meant to be a day off.', 'Weekend shift? Nobody told the crab.', 'The break has been briefly postponed.', 'Leisure is pending approval.', 'The crab has logged a weekend shift.', 'The beach filed a missing crab report.', 'This shell was promised a break.'],
  sundayNight: ['Monday is rehearsing its entrance.', 'Tomorrow has filed itself as Monday.', 'Tomorrow looks suspiciously familiar.', 'Monday is approaching at normal speed.', 'The week has some nerve.', 'Getting ready for the inevitable.', 'Sunday has checked the forecast: Monday.', 'Monday sent a meeting invite.'],
  christmas: ['The crab has hung the lights.', 'A little shell holiday cheer.', 'Snow is falling on the shoreline.', 'The festive claws are ready.', 'The crab checked the nice list.', 'A small hat, a big occasion.', 'Seasonal cheer, served sideways.', 'The shell is feeling festive.'],
  newYear: ['A fresh year, same sideways walk.', 'The crab brought a sparkler.', 'A toast to the next lap.', 'New year, freshly polished claws.', 'The party hat is regulation size.', 'A bright start from the shoreline.', 'The calendar gets a fresh page.', 'Confetti belongs in every shell.'],
}
export function pickLine(mood: Mood, now: number, s?: Season, t?: number): string {
  if (s && calendarTake(mood, s) && t !== undefined && t >= baseTakes(mood) && t < takes(mood, s) && now % 4 === 0) {
    const lines = CALENDAR_LINES[s as CalendarLook][t - baseTakes(mood)]
    return lines[Math.floor(now / 4) % lines.length]
  }
  if (s && (s === 'christmas' || s === 'newYear' || mood === 'idle' || mood === 'doze' || mood === 'done') && now % 4 === 0) return SEASON_LINES[s][Math.floor(now / 4) % SEASON_LINES[s].length]
  return LINES[mood][now % LINES[mood].length]
}
// Captions travel with props, including scene zero's original set. Generic season lines name no props.
export type CalendarLook = 'friday' | 'weekend' | 'sundayNight'
export const CALENDAR_LINES: Record<CalendarLook, readonly (readonly string[])[]> = {
  friday: [
    ['Clock says: nearly beach time.', 'Friday calls for a tiny drink.'],
    ['The laptop has heard enough.', 'Closed lid. Open evening.'],
    ['Five ticks. No loose ends.', 'The week is fully loaded.'],
    ['Out of office. Still sideways.', 'The sign handles replies now.'],
    ['The disco has one employee.', 'Tiny dance. Full commitment.'],
    ['Pizza is the closing ceremony.', 'One slice. Excellent meeting.'],
    ['That envelope can meet Monday.', 'Unread has left the building.'],
  ],
  weekend: [
    ['The deck chair can wait, apparently.', 'The cooler is gathering dust.'],
    ['The sandcastle passed inspection.', 'The sea submitted a revision.'],
    ['One fish. Huge personal news.', 'The fishing trip has receipts.'],
    ['The kite has taken the lead.', 'The wind has strong opinions.'],
    ['The ball gets the last word.', 'Three bounces count as exercise.'],
    ['The alarm clock has been overruled.', 'The blanket has seniority.'],
    ['The game respects the tiny claw.', 'One button. Several achievements.'],
  ],
  sundayNight: [
    ['The alarm clock looks smug.', 'The calendar has some nerve.'],
    ['The shirt is ready. The crab is not.', 'Steam leaves. Monday stays.'],
    ['Three alarms. One reluctant crab.', 'The backup alarm has a backup.'],
    ['The inbox has been busy alone.', 'Forty-seven can wait a moment.'],
    ['The weekend battery has one bar.', 'Poking the battery changed nothing.'],
    ['Lunch is ready ahead of morale.', 'The lunch box believes in tomorrow.'],
    ['The blanket buys seven seconds.', 'Monday remains outside the blanket.'],
  ],
}
export function lineFitsScene(line: string, mood: Mood, s?: Season, t = 0): boolean {
  for (const [look, scenes] of Object.entries(CALENDAR_LINES)) for (let i = 0; i < scenes.length; i++) {
    if (scenes[i].includes(line)) return s === look && calendarTake(mood, s) && t === baseTakes(mood) + i
  }
  return true
}
// A pet is costume on the current look; it never enters the state machine.
export const PET_LINES = [
  'Hehe, that tickles.', 'Gentle claws, happy crab.', 'Shell scratches accepted.',
  'You found the happy spot.', 'Tiny crab, big feelings.', 'A little pat goes a long way.',
  'My shell needed that.', 'Purring sideways.', 'Claws up for kindness.', 'One happy little crustacean.',
]
export const PET_RARE = 'I have adopted you. Pay in snacks.'
export function petLine(seed: number): string {
  return seed % 25 === 0 ? PET_RARE : PET_LINES[seed % 10]
}

const calendarTake = (m: Mood, s?: Season) => (s === 'weekend' && (m === 'idle' || m === 'doze' || m === 'done')) || ((s === 'friday' || s === 'sundayNight') && (m === 'idle' || m === 'done'))

const TEST = /\b(pytest|jest|vitest|unittest|rspec|phpunit|plugin test|(npm|pnpm|yarn|bun|go|cargo|deno|playwright|dotnet|mvn|gradle|gradlew|swift|make) test)\b/
// Commands that only look: every step of the chain is one of these, and nothing is written with `>`.
const LOOK = /^(cd|ls|tree|pwd|cat|head|tail|less|wc|file|stat|which|echo|grep|rg|fd|find|jq|diff|sed -n|git (status|log|diff|show|blame))\b/
const reads = (cmd: string) => !/(?<![0-9&])>/.test(cmd) && cmd.split(/&&|\|\||;|\|/).every(s => LOOK.test(s.trim()))
const INSTALL = /\b((npm|pnpm|yarn|bun) (i|install|add)|pip3? install|uv (add|pip install|tool install)|brew install)\b/

/** The mood a main-loop tool call starts. */
export function classify(tool: string, args: Record<string, unknown>): Mood {
  if (/^(EnterPlanMode|ExitPlanMode|TodoWrite)$/.test(tool) || /work_state/i.test(tool)) return 'plan'
  if (tool === 'Skill') return 'skill'
  if (/^mcp__/i.test(tool)) return /browser|chrome|playwright|computer[-_]use/i.test(tool) ? 'browse' : 'mcp'
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
  if (/\bgit\s+(pull|fetch|merge|rebase|checkout|switch|stash)\b/.test(cmd)) return 'sync'
  if (/\b(docker|kubectl|vercel)\b|\bgh\s+(pr\s+create|release)\b|\bfly\s+deploy\b|\bnpm\s+publish\b/.test(cmd)) return 'ship'
  if (/^\s*playwright-cli\b/.test(cmd)) return 'browse'
  if (INSTALL.test(cmd)) return 'inst'
  if (reads(cmd)) return 'read'
  return 'build'
}

import type { Crab, Tally } from '../types'

export type CrabEvent =
  | { kind: 'turnStart' | 'turnEnd' | 'ask' | 'compact' | 'compactEnd' }
  | { kind: 'tool'; mood: Mood }
  // `file` is set for an edit tool only (Edit, Write, MultiEdit, NotebookEdit): '' when the call names none.
  | { kind: 'toolEnd'; mood: Mood; isError: boolean; file?: string; command?: boolean }

export const ZERO: Tally = { subs: 0, edits: 0, files: [], testRuns: 0, testOk: null, took: 0 }
export const PROFILE: Profile = { edits: 0, reads: 0, green: 0, red: 0, web: 0, subs: 0, failedCommands: 0, fixes: 0, ships: 0 }
export const START: Crab = { profile: PROFILE, mood: 'idle', until: 0, fails: 0, testFailed: false, turnAt: null, lastActive: 0, n: ZERO }

// A held look cuts through the band's dwell (register.tsx CUT), so it can never be skipped.
const HOLD = 5_000
const DONE = 5_000
const LONG = 5 * 60_000
const DOZE = 10 * 60_000
// Building is most of a turn, so it rotates five scenes, 14 s each, counted from the turn's start (Praj, 12 Oct; 10 s
// switched too often, 40% longer).
// The 5 s retime tick moves it on; each switch redraws the crab once.
export const BUILDS = ['build', 'saw', 'type', 'paint', 'gear'] as const satisfies readonly Mood[]
const SCENE = 14_000
// The long-turn sweat and the work swap one full scene each (Praj, 20 Nov 2026: 8 s cut scenes midway).
const SWAP = SCENE
// The night owl keeps the person's own clock: the host's local hour.
const localHour = (now: number) => new Date(now).getHours()
// Moods that only last while their tool runs; after it Claude is thinking again.
const BRIEF: ReadonlySet<Mood> = new Set(['ask', 'sub', 'codex', 'git', 'inst', 'test', 'sync', 'ship', 'skill', 'plan', 'mcp'])

/** The counts after a tool ended: an edit that worked counts, a test run counts with its result, a subagent frees its slot. */
function count(n: Tally, ev: Extract<CrabEvent, { kind: 'toolEnd' }>): Tally {
  if (ev.mood === 'sub') return { ...n, subs: Math.max(0, n.subs - 1) }
  if (ev.mood === 'test') return { ...n, testRuns: n.testRuns + 1, testOk: !ev.isError }
  if (ev.file !== undefined && !ev.isError) return { ...n, edits: n.edits + 1, files: ev.file && !n.files.includes(ev.file) ? [...n.files, ev.file] : n.files }
  return n
}

/** The closing caption: what this turn really did, every zero left out. Undefined when there is nothing to count. */
export function tally(c: Crab): string | undefined {
  const { edits, files, testRuns, testOk, took } = c.n
  if (!edits && !testRuns) return undefined
  const plural = (k: number, w: string) => `${k} ${w}${k === 1 ? '' : 's'}`
  const parts = [
    edits && `${plural(edits, 'edit')}${files.length ? ` in ${plural(files.length, 'file')}` : ''}`,
    testRuns && `tests ${testOk ? 'green' : 'red'}${testRuns > 1 ? ` (${testRuns} runs)` : ''}`,
    took >= 1_000 && (took < 60_000 ? `${Math.round(took / 1_000)} s` : `${Math.round(took / 60_000)} min`),
  ].filter(Boolean)
  return `Done: ${parts.join(', ')}.`
}

export function step(c: Crab, ev: CrabEvent, now: number): Crab {
  // Older hot-reloaded state has no profile yet. Never mutate the shared zero object.
  let profile = c.profile ?? PROFILE
  if (ev.kind === 'tool' && ev.mood === 'sub') profile = { ...profile, subs: profile.subs + 1 }
  if (ev.kind === 'toolEnd') {
    profile = { ...profile }
    if (ev.command && ev.isError) profile.failedCommands++
    if (ev.mood === 'test') {
      if (ev.isError) profile.red++
      else { profile.green++; if (c.testFailed) profile.fixes++ }
    }
    if (!ev.isError) {
      if (ev.file !== undefined) profile.edits++
      if (ev.mood === 'read') profile.reads++
      if (ev.mood === 'web') profile.web++
      if (ev.mood === 'ship') profile.ships++
    }
  }
  c = { ...c, profile }
  switch (ev.kind) {
    case 'turnStart': return { ...c, mood: 'think', until: 0, turnAt: now, lastActive: now, n: ZERO }
    case 'turnEnd': return { ...c, mood: 'done', until: now + DONE, turnAt: null, lastActive: now, n: { ...c.n, took: c.turnAt === null ? 0 : now - c.turnAt } }
    case 'tool': return { ...c, mood: ev.mood, until: 0, lastActive: now, n: ev.mood === 'sub' ? { ...c.n, subs: c.n.subs + 1 } : c.n }
    case 'ask': return { ...c, mood: 'ask', until: 0, lastActive: now }
    case 'compact': return { ...c, mood: 'comp', until: 0, lastActive: now }
    case 'compactEnd': return { ...c, mood: c.turnAt === null ? 'idle' : 'think', until: 0, lastActive: now }
    case 'toolEnd': {
      c = { ...c, n: count(c.n, ev) }
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
    // Past 5 minutes the sweat takes turns with the work, a 14 s scene each, so a long turn keeps its flavour (Praj, 11 Oct).
    const over = now - c.turnAt - LONG
    if (over > 0 && Math.floor(over / SWAP) % 2 === 0 && (busy === 'think' || busy === 'read' || busy === 'build')) return 'long'
    return busy === 'build' ? BUILDS[Math.floor((now - c.turnAt) / SCENE) % BUILDS.length] : busy
  }
  if (localHour(now) < 5) return 'night'
  return now - c.lastActive >= DOZE ? 'doze' : 'idle'
}

// Every other mood has four takes (Praj, 12 Oct: "3 more options to each state"), the busiest nine (16 Oct). The first is picked by the
// millisecond the mood began, so two test runs in a row seldom match; then the next take every 14 s. Idle,
// doze and night owl hold a take 42 s, past idle's own 30 s fidget loop. A held mood (done, a test result)
// lasts under 14 s, so it never switches mid-gag.
const CALM: ReadonlySet<Mood> = new Set(['idle', 'doze', 'night'])
// The looks a long task shows most get five more takes (Praj, 16 Oct: "quite repetitive").
const BUSY: ReadonlySet<Mood> = new Set(['think', 'read', 'test', 'long'])
const isBuild = (m: Mood) => (BUILDS as readonly Mood[]).includes(m)

/** How many takes `mood` has: each build scene has a second, for the build's second lap. */
const NEW_MOODS: ReadonlySet<Mood> = new Set(['browse', 'mcp', 'plan', 'skill', 'sync', 'ship'])
const baseTakes = (mood: Mood) => isBuild(mood) || NEW_MOODS.has(mood) ? 2 : BUSY.has(mood) ? 9 : 4
export const takes = (mood: Mood, s?: Season) => baseTakes(mood) + (calendarTake(mood, s) ? 7 : 0)

const SLOT = 3 * SCENE
const mod7 = (n: number) => ((n % 7) + 7) % 7
// A civil day number, independent of UTC offset and 23/25-hour DST days.
const dayNumber = (d: Date) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000)
const dayStart = (day: number) => {
  const d = new Date(day * 86_400_000)
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()).getTime()
}
function shuffledDay(day: number): number[] {
  let seed = day >>> 0
  const order = [0, 1, 2, 3, 4, 5, 6]
  for (let i = 6; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    const j = Math.floor(seed / 0x100000000 * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}
function dayOrder(day: number): number[] {
  const order = shuffledDay(day), midnight = dayStart(day)
  const first = mod7(Math.floor(midnight / SLOT)), last = mod7(Math.floor((midnight - 1) / SLOT))
  const prev = shuffledDay(day - 1)
  // Yesterday is either raw or rotated once. Most days need no further look-back.
  // Follow only possible collision chains; no state, clock history or random source is involved.
  if (order[first] === prev[last] || order[first] === prev[(last + 1) % 7]) {
    if (order[first] === dayOrder(day - 1)[last]) order.push(order.shift()!)
  }
  return order
}
export function calendarScene(now: number): number {
  return dayOrder(dayNumber(new Date(now)))[mod7(Math.floor(now / SLOT))]
}

/** Which of its takes `mood` plays at `now`. A build scene changes take with each lap of the five, so a long build
 *  shows ten scenes before one repeats (Praj, 16 Oct: weld, drill, blueprint, sweep, crane). */
export function take(c: Crab, now: number, mood: Mood, s?: Season): number {
  if (calendarTake(mood, s) && (mood === 'done' || Math.floor(Math.max(0, now - c.lastActive) / (3 * SCENE)) % 2 === 1)) return baseTakes(mood) + calendarScene(now)
  if (isBuild(mood)) return c.turnAt === null ? 0 : Math.floor((now - c.turnAt) / (SCENE * BUILDS.length)) % 2
  const held = Math.max(0, now - c.lastActive)
  return (c.lastActive + Math.floor(held / (CALM.has(mood) ? 3 * SCENE : SCENE))) % baseTakes(mood)
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
  browse: 'Driving a browser and the screen',
  mcp: 'Using a connected tool',
  plan: 'Planning the work',
  skill: 'Loading a skill',
  sync: 'Syncing branches with git',
  ship: 'Shipping: deploys and pull requests',
  ask: 'Waiting for your reply',
  long: 'This turn has run past 5 min',
  comp: 'Compacting the conversation',
}

const BUILD_LINES = [
  'Hammering out the changes.', 'Building it, brick by brick.', 'Writing code with both claws.',
  'Under construction. Hard hat on.', 'Making edits. Sawdust everywhere.', 'Typing faster than a crab can scuttle.',
  'Running commands, claws crossed.', 'Shaping your code into place.', 'Measure twice, edit once.', 'Gears turning, files changing.',
  'Welding the pieces together.', 'Drilling into the details.', 'Drafting the blueprint.', 'Sweeping up after the edits.',
  'Craning the next block into place.',
] as const

/** The band caption: ten one-liners a mood, one picked at random each time the mood comes up (Praj, 12 Oct:
 *  "more fun to read, keeps the user on screen"). The hover label keeps the plain MEANING. No "or". */
export const LINES: Record<Mood, readonly string[]> = {
  idle: ['Waiting for your next idea.', 'Claws ready. Your move.', 'Just crabbing around until you type.', 'Sand between my toes, eyes on the prompt.',
    'Ready when you are.', 'Polishing my shell while I wait.', 'Say the word and I scuttle.', 'Listening to the waves. And your keys.',
    'Nothing to do. Living the crab life.', 'All quiet on the shoreline.'],
  think: ['Thinking it through, sideways.', 'Hmm. Clicking claws in thought.', 'Connecting the dots…', 'Weighing it up, claw by claw.',
    'Brain in motion, legs at rest.', 'Plotting the next move.', 'Deep in thought. Do not poke the crab.', 'Considering every angle. Crabs have many.',
    'Cooking up a plan.', 'One sec, an idea is surfacing.', 'Mulling it over on the seafloor.',
    'Moving the pieces around in my head.', 'Sketching the plan on the board.', 'Fitting the puzzle together.', 'Aha! Something just clicked.'],
  read: ['Reading your files so you don\'t have to.', 'Skimming code at crab speed.', 'Nose in the source.', 'Digging through files like sand.',
    'Hunting for the right line.', 'Reading the fine print.', 'Searching every nook and cranny.', 'Taking notes with a claw.',
    'Getting to know your codebase.', 'Turning pages, turning over rocks.', 'Catching up on the code news.',
    'Scanning the horizon for clues.', 'Flipping through the file drawer.', 'Scanning line by line.', 'Mapping out the codebase.'],
  build: BUILD_LINES, saw: BUILD_LINES, type: BUILD_LINES, paint: BUILD_LINES, gear: BUILD_LINES,
  test: ['Running the tests. Claws crossed.', 'Moment of truth: tests running.', 'Putting the code through its paces.', 'Checking the work before you do.',
    'Tests running. Holding my breath.', 'Poking the code to see if it squeaks.', 'Let\'s see what breaks.', 'Science time: running the experiment.',
    'Testing, testing, one two three.', 'Waiting on the verdict.', 'Taking the code\'s temperature.',
    'Weighing the results.', 'Poking it to see if it wobbles.', 'Under the microscope.', 'Progress bar filling up.'],
  testp: ['All green. Happy crab.', 'Tests pass! Claws in the air.', 'Green across the board.', 'Nailed it. Every test passes.',
    'Passing with flying colours.', 'The tests approve.', 'Clean run. Not a single failure.', 'Gold star for this code.',
    'Everything checks out.', 'Tests pass. Doing a little dance.'],
  testf: ['A test failed. On it.', 'Red light. Something broke.', 'Not quite. A test said no.', 'Failure found. Better now than later.',
    'A test caught something.', 'Back to the drawing board, briefly.', 'Red results. Rolling up my sleeves.', 'That didn\'t pass. Investigating.',
    'The tests found a bug. Good tests.', 'Close, but no seaweed.'],
  debug: ['That command failed. Fixing it.', 'Oops. Error spotted, fix incoming.', 'Something went sideways. Crab-style.', 'Hit a snag. Untangling it.',
    'Error message received. Reading it.', 'A bump in the road.', 'Bug-hunting season is open.', 'Not what we expected. Adjusting.',
    'Wrench out. Fixing the error.', 'Every error is a clue.'],
  dizzy: ['Three fails in a row. Seeing stars.', 'Head spinning, still trying.', 'Tough one. Not giving up.', 'Round and round we go.',
    'Third time was not the charm.', 'Dizzy, but determined.', 'This bug is putting up a fight.', 'Shaking it off. Trying again.',
    'Stubborn bug, more stubborn crab.', 'Regrouping after a rough patch.'],
  fixed: ['Fixed! Tests pass again.', 'Back in the green.', 'Bug squashed.', 'From red to green. Victory.',
    'Comeback complete.', 'Problem solved. Confetti time.', 'That bug never stood a chance.', 'Broken, then fixed. Classic.',
    'Tests are happy again.', 'Redemption arc complete.'],
  done: ['Done! Your turn.', 'All finished. Take a look.', 'Wrapped up. Ready for review.', 'Mission complete.',
    'That\'s a wrap.', 'Job done. Taking a bow.', 'Finished. What\'s next?', 'Done and dusted.',
    'Ta-da!', 'Over to you, captain.'],
  doze: ['Zzz… wake me with a message.', 'Napping. Type to wake me.', 'Dreaming of clean code.', 'Ten quiet minutes. Crab nap.',
    'Resting my claws.', 'Counting sheep, then crabs.', 'Asleep, but still here.', 'Snoozing on the sand.',
    'Shh. The crab is sleeping.', 'Recharging. Say hi anytime.'],
  night: ['Up late? Me too.', 'Night owl mode: on.', 'Burning the midnight oil.', 'The moon is out. So are we.',
    'Late-night coding crew.', 'Stars out, code in.', 'Quiet hours, good focus.', 'Midnight snack: a few more lines.',
    'The best bugs come out at night.', 'Remember to sleep sometime.'],
  web: ['Searching the web for answers.', 'Surfing the internet.', 'Asking the internet.', 'Out on the web, fetching facts.',
    'Checking the docs online.', 'Casting a net on the web.', 'Browsing so you don\'t have to.', 'Looking it up.',
    'Catching a wave of results.', 'Reading the web, page by page.'],
  sub: ['Sent a helper crab on an errand.', 'A subagent is on it.', 'Delegating to a tiny crab.', 'Teamwork: a helper is working.',
    'Mini crab dispatched.', 'Many claws make light work.', 'A helper is digging in.', 'Crab squad assembled.',
    'Splitting the work with a helper.', 'Waiting on the helper\'s report.'],
  codex: ['Another model is working.', 'Calling in a second opinion.', 'Phoning a friend.', 'Handing off to another model.',
    'Two brains on this one.', 'A colleague model is typing.', 'Outsourcing the heavy lifting.', 'Another model has the ball.',
    'Waiting on the other model.', 'Collaborating across models.'],
  git: ['Committing your changes.', 'Shipping it with git.', 'Saving progress to history.', 'Stamped and committed.',
    'Pushing to the remote.', 'Into the history books.', 'Git it done.', 'Launching your commits.',
    'Another dot on the commit graph.', 'Changes saved for posterity.'],
  inst: ['Installing a package.', 'Unboxing a new tool.', 'Delivery arriving.', 'Adding a dependency.',
    'Fetching packages.', 'New tools for the toolbox.', 'Download in progress.', 'Setting things up.',
    'Package incoming.', 'Stocking up on supplies.'],
  browse: ['Steering through the browser.', 'Pointer at the ready.', 'Clicking through the screen.', 'Navigating one page at a time.', 'A claw on the controls.', 'Taking the scenic route online.', 'Following the cursor.', 'Screen duty for this crab.', 'Scuttling across the page.', 'Driving the browser.'],
  mcp: ['Plugging in a connected tool.', 'A cable between claws.', 'Calling a connected helper.', 'Tools connected. Crab ready.', 'Reaching out through a tool.', 'Making a connection.', 'The socket is occupied.', 'Connected and working.', 'Sending a signal down the line.', 'Another tool joins the crew.'],
  plan: ['Ticking boxes on the plan.', 'Laying out the next steps.', 'Clipboard in claw.', 'Charting the course.', 'A plan is taking shape.', 'Sorting the work ahead.', 'One box at a time.', 'Putting the steps in order.', 'Planning the next scuttle.', 'The checklist is growing.'],
  skill: ['Opening the skill book.', 'A little knowledge incoming.', 'Turning to the right page.', 'Loading a new trick.', 'Cracking open the manual.', 'A skill is on its way.', 'Reading the glowing pages.', 'Learning the next move.', 'Book open, claws ready.', 'A fresh skill for the job.'],
  sync: ['Bringing branches together.', 'Fetching the latest changes.', 'Aligning the branches.', 'Pulling in the updates.', 'Git branches on the move.', 'Merging paths through the code.', 'Switching tracks with git.', 'Tidying the branch pile.', 'Rebasing with both claws.', 'A fresh branch is ready.'],
  ship: ['Rolling the crate uphill.', 'Getting this ready to ship.', 'Deploying with steady claws.', 'A release is on the ramp.', 'Pull request coming through.', 'Packing up the changes.', 'Launching the next release.', 'The cargo is moving.', 'Pushing toward the launch.', 'Shipping in crab style.'],
  ask: ['Waiting for your reply.', 'Your input needed.', 'Quick question for you.', 'Over to you for a decision.',
    'Need a hand here.', 'Tapping a claw, awaiting your answer.', 'Your call.', 'Help me choose.',
    'A question awaits you.', 'Paused until you answer.'],
  long: ['Long task. Coffee break for the crab.', 'Still going. Big job.', 'A marathon, not a sprint.', 'This one takes a while.',
    'Hang tight, still working.', 'Deep in the weeds.', 'Time flies when you\'re coding.', 'Persistence pays off.',
    'Worth the wait. Probably.', 'Still at it. Sweating a little.', 'Fanning myself. Long one.',
    'Snack break, still on it.', 'The clock keeps ticking.', 'Running low, still running.', 'Jogging through a long task.'],
  comp: ['Compacting the conversation.', 'Squeezing the chat to fit.', 'Packing light for the road ahead.', 'Summarizing what we\'ve done.',
    'Making room for more.', 'Tidying up the context.', 'Folding the memories neatly.', 'Shrinking the transcript.',
    'Condensing, not forgetting.', 'Spring cleaning the context.'],
}


/** Eligible activity with the largest share (same denominator); strict > preserves tie order. */
export function trait(p: Profile): Trait | undefined {
  const kinds: [Trait, number, number][] = [
    ['tester', p.green + p.red, 5], ['builder', p.edits, 15], ['reader', p.reads, 30],
    ['surfer', p.web, 8], ['manager', p.subs, 5], ['fixer', p.fixes, 3],
  ]
  let best: Trait | undefined, count = -1
  for (const [name, n, minimum] of kinds) if (n >= minimum && n > count) { best = name; count = n }
  return best
}

// Counts are interpolated at selection, never invented or retained as session text.
export const TRAIT_LINES: Record<Trait, readonly ((p: Profile) => string)[]> = {
  tester: [
    p => `${p.green} green runs. Goggles on for tests.`,
    p => `This session logged ${p.red} red runs.`,
    p => `${p.green + p.red} runs through the test bench.`,
    p => `The crab counted ${p.green} green runs.`,
    p => `Goggles witnessed ${p.red} red runs.`,
    p => `Session tally: ${p.green} green, ${p.red} red.`,
  ],
  builder: [
    p => `${p.edits} edits. Back to the workbench.`,
    p => `Hard hat earned with ${p.edits} edits.`,
    p => `This shell has witnessed ${p.edits} edits.`,
    p => `Session construction log: ${p.edits} edits.`,
    p => `${p.edits} edits under this hard hat.`,
    p => `The crab counted ${p.edits} file edits.`,
  ],
  reader: [
    p => `${p.reads} reads. Glasses on the shell.`,
    p => `These glasses witnessed ${p.reads} reads.`,
    p => `The crab counted ${p.reads} reading calls.`,
    p => `Session reading log: ${p.reads} reads.`,
    p => `${p.reads} reads behind these glasses.`,
    p => `The reading desk logged ${p.reads} reads.`,
  ],
  surfer: [
    p => `${p.web} web calls through this headset.`,
    p => `The antenna counted ${p.web} web calls.`,
    p => `Session surf log: ${p.web} web calls.`,
    p => `${p.web} web calls. Headset on the shell.`,
    p => `The crab logged ${p.web} web calls.`,
    p => `Headset tally: ${p.web} web calls.`,
  ],
  manager: [
    p => `${p.subs} subagents started. Reach for the whistle.`,
    p => `The crab has started ${p.subs} subagents.`,
    p => `Session team log: ${p.subs} subagents.`,
    p => `${p.subs} subagents under this whistle.`,
    p => `The whistle witnessed ${p.subs} subagents.`,
    p => `The team desk logged ${p.subs} subagents.`,
  ],
  fixer: [
    p => `${p.fixes} fixes. Plaster on the shell.`,
    p => `This session earned ${p.fixes} fixes.`,
    p => `Red to green: ${p.fixes} fixes.`,
    p => `The crab counted ${p.fixes} fixes.`,
    p => `${p.fixes} fixes behind this plaster.`,
    p => `Session repair log: ${p.fixes} fixes.`,
  ],
}
export function traitLine(m: Mood, now: number, p: Profile): string | undefined {
  const name = trait(p)
  if (!name || !['idle', 'done', 'think'].includes(m) || now % 4 !== 0) return
  const ls = TRAIT_LINES[name]
  return ls[Math.floor(now / 4) % ls.length](p)
}

/** Same small 31-based string hash as the art's scene and pet seeds. No path leaves this function. */
export function projectKey(cwd: string): string {
  return 'p:' + [...cwd].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7).toString(36)
}
export function greeting(p: ProjectMemory | undefined, seed: number): string | undefined {
  if (!p || p.sessions < 1) return
  const ls = [`Session ${p.sessions + 1} on this project. Welcome back.`]
  if (Object.hasOwn(TRAIT_LINES, p.lastTrait ?? '')) ls.push(`Back to the ${p.lastTrait}’s bench.`)
  // Aggregated green/red counters cannot tell which result happened last.
  if (p.green > 0 && p.red === 0) ls.push('Last time here the tests ended green.')
  return ls[seed % ls.length]
}
