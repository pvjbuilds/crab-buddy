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

// A held look cuts through the band's dwell (register.tsx CUT), so it can never be skipped.
const HOLD = 5_000
const DONE = 5_000
const LONG = 5 * 60_000
const DOZE = 10 * 60_000
const SWAP = 8_000
// Building is most of a turn, so it rotates five scenes, 14 s each, counted from the turn's start (Praj, 12 Oct; 10 s
// switched too often, 40% longer).
// The 5 s retime tick moves it on; each switch redraws the crab once.
export const BUILDS = ['build', 'saw', 'type', 'paint', 'gear'] as const satisfies readonly Mood[]
const SCENE = 14_000
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
// millisecond the mood began, so two test runs in a row seldom match; then the next take every 14 s. Idle,
// doze and night owl hold a take 42 s, past idle's own 30 s fidget loop. A held mood (done, a test result)
// lasts under 14 s, so it never switches mid-gag.
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

const BUILD_LINES = [
  'Hammering out the changes.', 'Building it, brick by brick.', 'Writing code with both claws.',
  'Under construction. Hard hat on.', 'Making edits. Sawdust everywhere.', 'Typing faster than a crab can scuttle.',
  'Running commands, claws crossed.', 'Shaping your code into place.', 'Measure twice, edit once.', 'Gears turning, files changing.',
] as const

/** The band caption: ten one-liners a mood, one picked at random each time the mood comes up (Praj, 12 Oct:
 *  "more fun to read, keeps the user on screen"). The hover label keeps the plain MEANING. No "or". */
export const LINES: Record<Mood, readonly string[]> = {
  idle: ['Waiting for your next idea.', 'Claws ready. Your move.', 'Just crabbing around until you type.', 'Sand between my toes, eyes on the prompt.',
    'Ready when you are.', 'Polishing my shell while I wait.', 'Say the word and I scuttle.', 'Listening to the waves. And your keys.',
    'Nothing to do. Living the crab life.', 'All quiet on the shoreline.'],
  think: ['Thinking it through, sideways.', 'Hmm. Clicking claws in thought.', 'Connecting the dots…', 'Weighing it up, claw by claw.',
    'Brain in motion, legs at rest.', 'Plotting the next move.', 'Deep in thought. Do not poke the crab.', 'Considering every angle. Crabs have many.',
    'Cooking up a plan.', 'One sec, an idea is surfacing.'],
  read: ['Reading your files so you don\'t have to.', 'Skimming code at crab speed.', 'Nose in the source.', 'Digging through files like sand.',
    'Hunting for the right line.', 'Reading the fine print.', 'Searching every nook and cranny.', 'Taking notes with a claw.',
    'Getting to know your codebase.', 'Turning pages, turning over rocks.'],
  build: BUILD_LINES, saw: BUILD_LINES, type: BUILD_LINES, paint: BUILD_LINES, gear: BUILD_LINES,
  test: ['Running the tests. Claws crossed.', 'Moment of truth: tests running.', 'Putting the code through its paces.', 'Checking the work before you do.',
    'Tests running. Holding my breath.', 'Poking the code to see if it squeaks.', 'Let\'s see what breaks.', 'Science time: running the experiment.',
    'Testing, testing, one two three.', 'Waiting on the verdict.'],
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
  ask: ['Waiting for your reply.', 'Your input needed.', 'Quick question for you.', 'Over to you for a decision.',
    'Need a hand here.', 'Tapping a claw, awaiting your answer.', 'Your call.', 'Help me choose.',
    'A question awaits you.', 'Paused until you answer.'],
  long: ['Long task. Coffee break for the crab.', 'Still going. Big job.', 'A marathon, not a sprint.', 'This one takes a while.',
    'Hang tight, still working.', 'Deep in the weeds.', 'Time flies when you\'re coding.', 'Persistence pays off.',
    'Worth the wait. Probably.', 'Still at it. Sweating a little.'],
  comp: ['Compacting the conversation.', 'Squeezing the chat to fit.', 'Packing light for the road ahead.', 'Summarizing what we\'ve done.',
    'Making room for more.', 'Tidying up the context.', 'Folding the memories neatly.', 'Shrinking the transcript.',
    'Condensing, not forgetting.', 'Spring cleaning the context.'],
}
