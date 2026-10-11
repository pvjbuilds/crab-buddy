import { test, expect } from 'claude-code/testing'
import { classify } from './hooks/crab.ts'

test('a tool call picks the crab mood from the tool and, for Bash, the command', () => {
  expect(classify('Read', {})).toBe('read')
  expect(classify('Grep', {})).toBe('read')
  expect(classify('Edit', {})).toBe('build')
  expect(classify('Write', {})).toBe('build')
  expect(classify('WebSearch', {})).toBe('web')
  expect(classify('WebFetch', {})).toBe('web')
  expect(classify('Agent', {})).toBe('sub')
  expect(classify('AskUserQuestion', {})).toBe('ask')
  expect(classify('Bash', { command: 'claude plugin test .' })).toBe('test')
  expect(classify('Bash', { command: 'python3 -m pytest -q tests' })).toBe('test')
  expect(classify('Bash', { command: 'codex exec -o out.md < /dev/null' })).toBe('codex')
  expect(classify('Bash', { command: 'git add -A && git commit -m x' })).toBe('git')
  expect(classify('Bash', { command: 'brew install jq' })).toBe('inst')
  expect(classify('Bash', { command: 'uv pip install rich' })).toBe('inst')
  expect(classify('Bash', { command: 'ls -la' })).toBe('build')
  expect(classify('mcp__x__thing', {})).toBe('think')
})

import { step, shown, setLine, START } from './hooks/crab.ts'
import type { Crab } from './types'

const S = 1000, M = 60_000
// 2026-10-11 14:00 local time, so the night-owl hours stay out of the way unless a test asks for them.
const T0 = new Date(2026, 9, 11, 14, 0).getTime()
const run = (...evs: [number, Parameters<typeof step>[1]][]) =>
  evs.reduce<Crab>((c, [at, ev]) => step(c, ev, T0 + at), START)

test('a turn: thinking, then the tool it runs, then done for 5 s, then idle', () => {
  const c = run([0, { kind: 'turnStart' }], [S, { kind: 'tool', mood: 'read' }], [2 * S, { kind: 'toolEnd', mood: 'read', isError: false }])
  expect(shown(step(START, { kind: 'turnStart' }, T0), T0)).toBe('think')
  expect(shown(c, T0 + 3 * S)).toBe('read')
  const done = step(c, { kind: 'turnEnd' }, T0 + 4 * S)
  expect(shown(done, T0 + 6 * S)).toBe('done')
  expect(shown(done, T0 + 8 * S)).toBe('done')
  expect(shown(done, T0 + 10 * S)).toBe('idle')
})

test('failures: debug for 5 s, the third in a row is dizzy, a success resets the count', () => {
  const fail = { kind: 'toolEnd', mood: 'build', isError: true } as const
  const one = run([0, { kind: 'turnStart' }], [S, fail])
  expect(shown(one, T0 + 2 * S)).toBe('debug')
  expect(shown(one, T0 + 6 * S)).toBe('think')
  const three = run([0, { kind: 'turnStart' }], [S, fail], [2 * S, fail], [3 * S, fail])
  expect(shown(three, T0 + 4 * S)).toBe('dizzy')
  const reset = step(step(three, { kind: 'toolEnd', mood: 'build', isError: false }, T0 + 9 * S), fail, T0 + 10 * S)
  expect(shown(reset, T0 + 11 * S)).toBe('debug')
})

test('tests: running, then failed, then fixed when the next run passes, then plain passed', () => {
  const t = (at: number, isError: boolean): [number, Parameters<typeof step>[1]][] =>
    [[at, { kind: 'tool', mood: 'test' }], [at + S, { kind: 'toolEnd', mood: 'test', isError }]]
  const started = run([0, { kind: 'turnStart' }], [S, { kind: 'tool', mood: 'test' }])
  expect(shown(started, T0 + 2 * S)).toBe('test')
  expect(shown(run([0, { kind: 'turnStart' }], ...t(S, true)), T0 + 3 * S)).toBe('testf')
  expect(shown(run([0, { kind: 'turnStart' }], ...t(S, true), ...t(10 * S, false)), T0 + 12 * S)).toBe('fixed')
  expect(shown(run([0, { kind: 'turnStart' }], ...t(S, true), ...t(10 * S, false), ...t(20 * S, false)), T0 + 22 * S)).toBe('testp')
})

test('a turn past 5 minutes shows the long-turn sweat, but a failure still wins', () => {
  const c = run([0, { kind: 'turnStart' }], [S, { kind: 'tool', mood: 'build' }])
  expect(shown(c, T0 + 4 * M + 10 * S)).toBe('build')
  // Past 5 minutes it takes turns: 8 s of sweat, 8 s of the work itself, so a long session keeps its flavour.
  expect(shown(c, T0 + 5 * M + S)).toBe('long')
  expect(shown(c, T0 + 5 * M + 9 * S)).toBe('build')
  expect(shown(c, T0 + 5 * M + 17 * S)).toBe('long')
  const f = step(c, { kind: 'toolEnd', mood: 'build', isError: true }, T0 + 6 * M)
  expect(shown(f, T0 + 6 * M + S)).toBe('debug')
})

test('a long build cycles five scenes, 10 s each: hammer, saw, laptop, paint, gears (Praj, 12 Oct)', () => {
  const c = run([0, { kind: 'turnStart' }], [S, { kind: 'tool', mood: 'build' }])
  expect([0, 1, 2, 3, 4, 5].map(k => shown(c, T0 + S + k * 10 * S))).toEqual(['build', 'saw', 'type', 'paint', 'gear', 'build'])
})

test('idle: dozes after 10 minutes; between 00:00 and 05:00 local time it is the night owl', () => {
  const c = run([0, { kind: 'turnStart' }], [S, { kind: 'turnEnd' }])
  expect(shown(c, T0 + 9 * M)).toBe('idle')
  expect(shown(c, T0 + 11 * M)).toBe('doze')
  const night = new Date(2026, 9, 11, 1, 15).getTime() // 01:15 local
  expect(shown(step(START, { kind: 'turnEnd' }, night), night + 10 * S)).toBe('night')
})

test('asking and compacting hold until the next event says otherwise', () => {
  const asked = run([0, { kind: 'turnStart' }], [S, { kind: 'ask' }])
  expect(shown(asked, T0 + 3 * M)).toBe('ask')
  expect(shown(step(asked, { kind: 'toolEnd', mood: 'ask', isError: false }, T0 + 3 * M), T0 + 3 * M)).toBe('think')
  const comp = step(START, { kind: 'compact' }, T0)
  expect(shown(comp, T0 + M)).toBe('comp')
  expect(shown(step(comp, { kind: 'compactEnd' }, T0 + M), T0 + M)).toBe('idle')
})

import { crabArt } from './hooks/art.ts'

test('every mood draws its own crab, with no hole in the drawing', () => {
  const moods = ['idle', 'think', 'read', 'build', 'test', 'testp', 'testf', 'debug', 'done', 'doze', 'web', 'sub', 'codex', 'git', 'inst', 'ask', 'long', 'comp', 'dizzy', 'fixed', 'night', 'saw', 'type', 'paint', 'gear'] as const
  const arts = moods.map(m => crabArt(m))
  arts.forEach((a, i) => {
    expect(a).toContain(`cb-${moods[i]}`)
    expect(a).not.toContain('undefined')
  })
  expect(new Set(arts).size).toBe(moods.length)
  // Each build scene draws its own set beside the crab, not just a new class name.
  for (const m of ['saw', 'type', 'paint', 'gear'] as const) expect(crabArt(m).length).toBeGreaterThan(crabArt('think').length + 300)
  // The idle crab carries the three fidgets (yawn, wave, side-step) on one 30 s CSS loop.
  expect(crabArt('idle')).toContain('cb-yawn')
  expect(crabArt('idle')).toContain('cb-side')
})

test('status lines: one per plugin, the newest text wins, an empty text removes it, order kept', () => {
  let l = setLine({}, 'rule-guard', '🛡 Rule guard held 1')
  l = setLine(l, 'handoff-wait', '🔥 Cache warm · 58m left')
  l = setLine(l, 'rule-guard', '🛡 Rule guard held 2')
  expect(Object.values(l)).toEqual(['🛡 Rule guard held 2', '🔥 Cache warm · 58m left'])
  expect(setLine(l, 'handoff-wait', undefined)).toEqual({ 'rule-guard': '🛡 Rule guard held 2' })
})

test('every motion tweens at the screen rate; only the typing cursor blinks hard, like a real one (Praj, 12 Oct)', () => {
  const css = crabArt('idle')
  // steps() flips between two poses a few times a second; a smooth timing draws every frame in between.
  expect(css.match(/steps\(\d+\)/g)).toEqual(['steps(1)'])
  expect(css).toMatch(/\.cb-type \.cb-cu\{animation:cb-bl \.8s steps\(1\)/)
})

import { take, TAKES } from './hooks/crab.ts'
// Every mood that had one take; the build moods are already five scenes of their own.
const ONE = ['idle', 'think', 'read', 'test', 'testp', 'testf', 'debug', 'done', 'doze', 'web', 'sub', 'codex', 'git', 'inst', 'ask', 'long', 'comp', 'dizzy', 'fixed', 'night'] as const

test('four takes a mood: the first picked by the moment it began, the next every 10 s, idle ones every 30 s (Praj, 12 Oct)', () => {
  expect(TAKES).toBe(4)
  const at = (ms: number) => ({ ...START, lastActive: T0 + ms })
  // Two test runs a moment apart do not open on the same take.
  expect(new Set([0, 1, 2, 3].map(ms => take(at(ms), T0 + ms, 'test'))).size).toBe(4)
  expect([0, 9, 10, 20, 30, 40].map(s => take(at(0), T0 + s * S, 'think'))).toEqual([0, 0, 1, 2, 3, 0])
  // Idle, doze and night owl hold a take 30 s: idle's own fidget loop is 30 s long.
  expect([0, 29, 30, 60].map(s => take(at(0), T0 + s * S, 'idle'))).toEqual([0, 0, 1, 2])
  expect(take(at(1), T0 + 50 * S, 'saw')).toBe(0)
})

test('every mood draws four different takes, each with its own motion (Praj, 12 Oct)', () => {
  for (const m of ONE) {
    const arts = [0, 1, 2, 3].map(t => crabArt(m, t))
    expect(new Set(arts).size).toBe(4)
    for (const t of [1, 2, 3]) {
      expect(arts[t]).toMatch(new RegExp(`class="cb cb-${m}${t}[" ]`))
      expect(arts[t]).toContain(`.cb-${m}${t} `)
      expect(arts[t]).not.toContain('undefined')
    }
  }
})

import { MEANING } from './hooks/crab.ts'
test('the hover labels say what happens with certainty: no "or" (Praj, 12 Oct)', () => {
  for (const text of Object.values(MEANING)) expect(text).not.toMatch(/\bor\b/i)
  expect(MEANING.build).toBe('Editing files and running commands')
})

test('the art is well-formed XML: no stray < inside the style, which the SVG parser reads as a tag', () => {
  for (const m of ONE) for (const t of [0, 1, 2, 3]) {
    const css = crabArt(m, t).match(/<style>([\s\S]*)<\/style>/)?.[1] ?? ''
    expect(css).not.toContain('<')
  }
})
