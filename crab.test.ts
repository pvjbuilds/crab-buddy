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

import { LINES, BUILDS } from './hooks/crab.ts'
test('the band caption: ten one-liners a mood, all different, short, said with certainty (Praj, 12 Oct)', () => {
  for (const m of [...ONE, ...BUILDS]) {
    const l = LINES[m]
    expect([m, l.length, new Set(l).size]).toEqual([m, 10, 10])
    for (const s of l) {
      expect(s.length <= 46 ? s : `${m}: too long: ${s}`).toBe(s)
      expect(/\bor\b/i.test(s) ? `${m}: says "or": ${s}` : s).toBe(s)
    }
  }
  // The five building scenes are one job, so they share one set.
  expect(LINES.saw).toBe(LINES.build)
})

import { stageArt, STATION } from './hooks/art.ts'
import type { Mood } from './types'
const MOODS = Object.keys(MEANING) as Mood[]

test('stage: every mood has a station on it, every roam stays on it, and the stage art is well-formed XML', () => {
  for (const m of MOODS) {
    expect(STATION[m] >= 0 && STATION[m] <= 1 ? m : `${m}: off the stage`).toBe(m)
    const svg = stageArt(m, 1, 0)
    const style = svg.match(/<style>([^]*?)<\/style>/)?.[1] ?? ''
    expect(style.includes('<') ? `${m}: < in the stage style` : m).toBe(m)
    for (const [, f] of svg.matchAll(/\* (-?[\d.]+)\)\)/g)) {
      // The walk-in names stations; the roam names offsets from this mood's station.
      const at = Number(f), ok = (at >= 0 && at <= 1) || (STATION[m] + at >= -.001 && STATION[m] + at <= 1.001)
      expect(ok ? m : `${m}: ${f} leaves the stage`).toBe(m)
    }
  }
})

// Praj, 12 Oct: the label pops up over the crab wherever it stands, and stays a moment after the pointer leaves.
test('stage: the label rides above the crab, shows on hover, and the crab keeps walking', () => {
  const tipOf = (m: Mood) => {
    const svg = stageArt(m, 0, STATION[m], 'What it means')
    const g = svg.match(/<g class="st-tip">([^]*?)<\/g>/)?.[1] ?? ''
    const r = g.match(/<rect x="(-?[\d.]+)" y="(-?[\d.]+)" width="([\d.]+)" height="([\d.]+)"/)
    return { svg, text: g.includes('What it means'), x: Number(r?.[1]), y: Number(r?.[2]), w: Number(r?.[3]), h: Number(r?.[4]) }
  }
  const right = tipOf('idle'), left = tipOf('gear')
  expect(right.text).toBe(true)
  // Above the head: the body starts at 10/30 x 41 = 13.67 px. Taller than 0.9.1's 12 px, which read squashed
  // (Praj, 12 Oct).
  expect([right.y, right.h > 12 && right.h <= 13.5]).toEqual([0, true])
  // On the right half the label ends at the crab's right edge, on the left half it starts at its left edge,
  // so it never runs off the stage.
  expect([right.x + right.w, left.x]).toEqual([52, 0])
  // Praj, 12 Oct (second pass): the crab never stops for the pointer; the label rides with it and stays 3 s
  // after the pointer leaves, then hides.
  expect(right.svg).not.toContain('paused')
  // ...and fades out over .2 s, like the rest of the animation.
  expect(right.svg).toContain('.st-tip{opacity:0;visibility:hidden;transition:opacity .2s 3s,visibility 0s 3.2s}')
  expect(right.svg).toContain('.st-at:hover .st-tip{opacity:1;visibility:visible;transition:none}')
  // Glyphs keep their own shape: only the spacing flexes to fit the pill (squashed glyphs read low-res, 12:32).
  expect(right.svg).toContain('lengthAdjust="spacing"')
  expect(right.svg).not.toContain('spacingAndGlyphs')
  expect(right.svg).toContain('font-size="11.5"')
  // Not crab orange: dark ink on a light pill, light ink on a dark pill in the dark theme.
  expect(right.svg).not.toContain('#D97757"/><text')
  expect(right.svg).toMatch(/@media \(prefers-color-scheme:dark\)\{\.st-bg\{fill:#[0-9a-f]{6}\}\.st-ink\{fill:#[0-9a-f]{6}\}\}/)
  expect(stageArt('idle', 0, 1, 'a & b').includes('a &amp; b')).toBe(true)
})

// Recording 12:24 (Praj): "A command faile" ran off the stage's right edge. The label picked its side from the
// mood's resting spot, while the crab was still walking in or wandering on the other half.
test('stage: the label switches sides with the crab, through the walk and the wander', () => {
  const tip = 'A command failed'
  const sides = (svg: string, name: string) =>
    new Set([...(svg.match(new RegExp(`@keyframes ${name}\\{([^]*?)\\}\\}`))?.[1] ?? '').matchAll(/translateX\((-?[\d.]+)px\)/g)].map(m => Number(m[1])))
  // Walking from the far right to gear (.1): right-anchored first, left-anchored on arrival.
  const walk = stageArt('gear', 0, 1, tip)
  const w = Number(walk.match(/<g class="st-tip">[^]*?width="([\d.]+)"/)?.[1])
  expect([...sides(walk, 'st-lw')].sort((a, b) => a - b)).toEqual([52 - w, 0])
  // idle rests at the far right and wanders to .25: the wander crosses the middle both ways.
  expect(sides(stageArt('idle', 0, 1, tip), 'st-lr').size).toBe(2)
  // A crab that stays on one half never moves its label.
  expect(stageArt('ask', 0, 1, tip)).not.toContain('st-lw')
})
