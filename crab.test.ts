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
  // Reading through Bash is reading, not building (21 Oct): a look shows only what really happens.
  expect(classify('Bash', { command: 'ls -la' })).toBe('read')
  expect(classify('Bash', { command: 'cd ~/x && grep -n foo a.ts | head -20' })).toBe('read')
  expect(classify('Bash', { command: "sed -n 1,40p hooks/crab.ts" })).toBe('read')
  expect(classify('Bash', { command: 'rg -l term 2>/dev/null; git log --oneline -3' })).toBe('read')
  expect(classify('Bash', { command: "sed -i '' s/a/b/ x.ts" })).toBe('build')
  expect(classify('Bash', { command: 'cat a > b' })).toBe('build')
  expect(classify('Bash', { command: 'ls && bun run build' })).toBe('build')
  // 0.12.0 S2: an unknown mcp__ tool is now 'mcp' (was 'think'); the old expectation was the stale side.
  expect(classify('mcp__x__thing', {})).toBe('mcp')
  expect(classify('SomethingNew', {})).toBe('think')
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
  // 14 s scenes from the turn's start: 250 s in is scene 17, the laptop (17 % 5 = 2); 309 s in is scene 22, too.
  expect(shown(c, T0 + 4 * M + 10 * S)).toBe('type')
  // Past 5 minutes it takes turns: one 14 s scene of sweat, one of the work itself, so a long session keeps its flavour.
  // 20 Nov 2026: neither side was wrong; Praj asked for each scene to play through ("cycled quicker than I would
  // like"), so the swap went from 8 s to a full scene.
  expect(shown(c, T0 + 5 * M + S)).toBe('long')
  expect(shown(c, T0 + 5 * M + 9 * S)).toBe('long')
  expect(shown(c, T0 + 5 * M + 15 * S)).toBe('type')
  expect(shown(c, T0 + 5 * M + 29 * S)).toBe('long')
  const f = step(c, { kind: 'toolEnd', mood: 'build', isError: true }, T0 + 6 * M)
  expect(shown(f, T0 + 6 * M + S)).toBe('debug')
})

test('a long build cycles five scenes, 14 s each: hammer, saw, laptop, paint, gears (Praj, 12 Oct: 40% longer than 10 s)', () => {
  const c = run([0, { kind: 'turnStart' }], [S, { kind: 'tool', mood: 'build' }])
  expect([0, 1, 2, 3, 4, 5].map(k => shown(c, T0 + S + k * 14 * S))).toEqual(['build', 'saw', 'type', 'paint', 'gear', 'build'])
})

test('the second lap of a build plays five new scenes: weld, drill, blueprint, sweep, crane (Praj, 16 Oct)', () => {
  const c = run([0, { kind: 'turnStart' }], [S, { kind: 'tool', mood: 'build' }])
  const at = (k: number) => { const now = T0 + S + k * 14 * S, m = shown(c, now); return `${m}${take(c, now, m) || ''}` }
  expect([...Array(11).keys()].map(at)).toEqual(['build', 'saw', 'type', 'paint', 'gear', 'build1', 'saw1', 'type1', 'paint1', 'gear1', 'build'])
  for (const m of BUILDS) {
    expect(takes(m)).toBe(2)
    expect(crabArt(m, 1)).not.toBe(crabArt(m, 0))
    expect(crabArt(m, 1)).toMatch(new RegExp(`class="cb cb-${m}1[" ]`))
    expect(crabArt(m, 1)).toContain(`.cb-${m}1 `)
  }
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
  const drawn = (a: string) => a.replace(/<style>[\s\S]*<\/style>/, '').replace(/<g class="cb-em[12]">[\s\S]*?<\/g>/g, '').length
  for (const m of ['saw', 'type', 'paint', 'gear'] as const) expect(drawn(crabArt(m))).toBeGreaterThan(drawn(crabArt('think')) + 300)
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

import { take, takes } from './hooks/crab.ts'
// Every mood that had one take; the build moods are already five scenes of their own.
const ONE = ['idle', 'think', 'read', 'test', 'testp', 'testf', 'debug', 'done', 'doze', 'web', 'sub', 'codex', 'git', 'inst', 'ask', 'long', 'comp', 'dizzy', 'fixed', 'night'] as const

test('takes a mood: nine for the busy looks, four for the rest; the first picked by the moment it began, the next every 14 s, idle ones every 42 s (Praj, 16 Oct)', () => {
  expect(ONE.filter(m => takes(m) === 9)).toEqual(['think', 'read', 'test', 'long'])
  expect(ONE.filter(m => takes(m) !== 9).every(m => takes(m) === 4)).toBe(true)
  const at = (ms: number) => ({ ...START, lastActive: T0 + ms })
  // Two test runs a moment apart do not open on the same take.
  expect(new Set([0, 1, 2, 3].map(ms => take(at(ms), T0 + ms, 'test'))).size).toBe(4)
  expect([0, 13, 14, 28, 42, 56, 126].map(s => take(at(0), T0 + s * S, 'think'))).toEqual([0, 0, 1, 2, 3, 4, 0])
  expect([0, 14, 42, 56].map(s => take(at(0), T0 + s * S, 'web'))).toEqual([0, 1, 3, 0])
  // Idle, doze and night owl hold a take three times as long.
  expect([0, 41, 42, 84].map(s => take(at(0), T0 + s * S, 'idle'))).toEqual([0, 0, 1, 2])
  expect(take(at(1), T0 + 50 * S, 'saw')).toBe(0)
})

test('every mood draws all its takes, each different, with its own motion (Praj, 12 Oct; nine for the busy looks, 16 Oct)', () => {
  for (const m of ONE) {
    const arts = [...Array(takes(m)).keys()].map(t => crabArt(m, t))
    expect([m, new Set(arts).size]).toEqual([m, takes(m)])
    for (const t of [...Array(takes(m)).keys()].slice(1)) {
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
  for (const m of [...ONE, ...BUILDS]) for (const t of [...Array(takes(m)).keys()]) {
    const css = crabArt(m, t).match(/<style>([\s\S]*)<\/style>/)?.[1] ?? ''
    expect(css).not.toContain('<')
  }
})

import { LINES, BUILDS } from './hooks/crab.ts'
// Five more lines for the looks a long task shows most, one for each new take or scene (Praj, 16 Oct).
const BUSY = new Set<string>(['think', 'read', 'test', 'long', 'build', 'saw', 'type', 'paint', 'gear'])
test('the band caption: ten one-liners a mood, fifteen for the busy ones, all different, short, said with certainty (Praj, 12 Oct)', () => {
  for (const m of [...ONE, ...BUILDS]) {
    const l = LINES[m]
    const n = BUSY.has(m) ? 15 : 10
    expect([m, l.length, new Set(l).size]).toEqual([m, n, n])
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

// Praj, 27 Nov: the label sat in a pill over the crab's head, and the pet's jump went up under it ("the text sort
// of clips the crab top part"). Both captions now stand beside the crab as a speech bubble with a pixel tail:
// on its left when it stands on the right half, on its right on the left half. These replace the 12 Oct tests that
// put the label above the head; those tests matched the old design, which Praj replaced.
// A caption's two sides, as drawn: `l` stands left of the crab, `r` right of it; the side not in use is parked.
const PARK = -9999
const sidesOf = (svg: string, cls: 'st-tip' | 'st-pet') => {
  const from = svg.indexOf(`<g class="${cls}">`), to = cls === 'st-tip' ? svg.indexOf('<g class="st-pet">') : svg.lastIndexOf('</svg>')
  return svg.slice(from, to).split('<g class="st-s').slice(1).map(chunk => {
    const rects = [...chunk.matchAll(/<rect x="(-?[\d.]+)" y="(-?[\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)].map(m => m.slice(1).map(Number))
    const text = chunk.match(/<text x="(-?[\d.]+)"[^>]*textLength="([\d.]+)"/)!.slice(1).map(Number)
    const anims = [...chunk.matchAll(/<g class="(st-[lp]b-[wr][lr])">/g)].map(m => m[1])
    return { side: chunk[0], parked: chunk.startsWith(`${chunk[0]}" style="transform:translateX(${PARK}px)"`), rects, text, anims,
      left: Math.min(...rects.map(r => r[0])), right: Math.max(...rects.map(r => r[0] + r[2])),
      top: Math.min(...rects.map(r => r[1])), bottom: Math.max(...rects.map(r => r[1] + r[3])) }
  })
}
const showing = (svg: string, cls: 'st-tip' | 'st-pet') => sidesOf(svg, cls).filter(s => !s.parked)

test('stage: the label stands beside the crab at eye level, never over its head, and shows on hover', () => {
  const right = stageArt('idle', 0, STATION.idle, 'What it means'), left = stageArt('gear', 0, STATION.gear, 'What it means')
  const [r] = showing(right, 'st-tip'), [l] = showing(left, 'st-tip')
  expect([showing(right, 'st-tip').length, r.side, showing(left, 'st-tip').length, l.side]).toEqual([1, 'l', 1, 'r'])
  // Clear of the crab's body, which spans x 5.5 to 46 of its 52 px box (tail tips included).
  expect([r.right <= 5.5, l.left >= 46]).toEqual([true, true])
  // At eye level (the eyes sit at y 19.2 to 21.9) and inside the 41 px band.
  for (const s of [r, l]) expect([s.top <= 19.2, s.bottom >= 21.9, s.top >= 0, s.bottom <= 41]).toEqual([true, true, true, true])
  expect(right.includes('What it means')).toBe(true)
  // Praj, 12 Oct (second pass): the crab never stops for the pointer; the label rides with it and stays 3 s
  // after the pointer leaves, then fades out over .2 s.
  expect(right).not.toContain('paused')
  expect(right).toContain('.st-tip{opacity:0;visibility:hidden;transition:opacity .2s 3s,visibility 0s 3.2s}')
  expect(right).toContain('.st-at:hover .st-tip{opacity:1;visibility:visible;transition:none}')
  // Glyphs keep their own shape: only the spacing flexes to fit (squashed glyphs read low-res, 12:32).
  expect(right).toContain('lengthAdjust="spacing"')
  expect(right).not.toContain('spacingAndGlyphs')
  expect(right).toContain('font-size="11.5"')
  // Not crab orange: dark ink on a light bubble, light ink on a dark one in the dark theme, with a grey border.
  expect(right).not.toContain('#D97757"/><text')
  expect(right).toMatch(/@media \(prefers-color-scheme:dark\)\{\.st-bg\{fill:#[0-9a-f]{6}\}\.st-ink\{fill:#[0-9a-f]{6}\}\.st-bd\{fill:#[0-9a-f]{6}\}\}/)
  expect(stageArt('idle', 0, 1, 'a & b').includes('a &amp; b')).toBe(true)
})

// Recording 12:24 (Praj): "A command faile" ran off the stage's right edge. The caption must follow the crab's half
// through the walk and the wander, with exactly one side showing at every moment.
test('stage: the label switches sides with the crab, through the walk and the wander', () => {
  const tip = 'A command failed'
  // Each side's offset at u% of a clock: its parking plus the step-end keyframes of that clock's animation.
  const offsets = (svg: string, anim: string | undefined) => {
    const k = anim ? [...(svg.match(new RegExp(`@keyframes ${anim}\\{([^]*?)\\}\\}`))?.[1] ?? '').matchAll(/(\d+)%\{transform:translateX\((-?\d+)px\)/g)].map(m => [Number(m[1]), Number(m[2])]) : []
    return (u: number) => k.filter(([p]) => p <= u).at(-1)?.[1] ?? 0
  }
  const seen = (svg: string, clock: 'w' | 'r') => {
    const ss = sidesOf(svg, 'st-tip'), out = new Set<string>()
    for (let u = 0; u <= 100; u++) {
      const up = ss.filter(s => (s.parked ? PARK : 0) + offsets(svg, s.anims.find(a => a.endsWith(clock + s.side)))(u) === 0)
      expect(up.length).toBe(1)
      out.add(up[0].side)
    }
    return [...out].sort()
  }
  // Walking from the far right to gear (.1): left of the crab first, right of it on arrival.
  expect(seen(stageArt('gear', 0, 1, tip), 'w')).toEqual(['l', 'r'])
  // idle rests at the far right and wanders to .25: the wander crosses the middle both ways.
  expect(seen(stageArt('idle', 0, 1, tip), 'r')).toEqual(['l', 'r'])
  // A crab that stays on one half draws one side only, and never moves it.
  expect(sidesOf(stageArt('ask', 0, 1, tip), 'st-tip').map(s => s.side)).toEqual(['l'])
  expect(stageArt('ask', 0, 1, tip)).not.toMatch(/st-lb-[wr][lr]/)
})

import { where } from './hooks/art.ts'
// This runner has no toBeCloseTo; the same check as toBeCloseTo(v, 3).
const near = (a: number, b: number) => expect(Math.abs(a - b) < .0005 ? b : `${a} is not ${b}`).toBe(b)
// Praj, 12 Oct: on a failed test the crab trips once, slides back and gets up; it does not loop.
test('stage: testf trips once and holds its last stop', () => {
  expect(where('testf', .5, 0)).toBe(.5)
  near(where('testf', .5, 10), .32)
  near(where('testf', .5, 30), .32)
  const svg = stageArt('testf', 0, .5)
  expect(svg).toContain('@keyframes st-trip')
  expect(svg).toContain('1 forwards')
  const idle = stageArt('idle', 0, 1)
  expect(idle).toContain('infinite')
  expect(idle).not.toContain('st-trip')
})

// Praj, 12 Oct: a fix throws confetti across the whole stage.
test('stage: fixed throws confetti across the stage', () => {
  const xs = [...stageArt('fixed', 0, .5).matchAll(/<rect x="(-?[\d.]+)%"[^>]*class="st-cf"/g)].map(m => Number(m[1]))
  expect(xs.length).toBe(18)
  expect(new Set(xs).size).toBe(18)
  expect(xs.every(v => v > 0 && v < 100)).toBe(true)
  expect(stageArt('done', 0, 1)).not.toContain('st-cf')
})

// Praj, 12 Oct: the walk-in leaves a trail of footprints that fade, laid down as the crab passes.
test('stage: the walk-in leaves footprints in step with the crab', () => {
  const ts = [...stageArt('gear', 0, 1).matchAll(/<g class="st-fp" style="[^"]*animation-delay:([\d.]+)s"/g)].map(m => Number(m[1]))
  expect(ts.length).toBe(13)
  expect(ts.every((t, i) => i === 0 || t > ts[i - 1])).toBe(true)
  // Half speed (Praj, 12 Oct): the whole stage takes 4.8 s, so gear's walk from 1 takes 4.32 s.
  expect([ts[0] > 0, ts[12] < 4.32, ts[12] > 2.16]).toEqual([true, true, true])
  expect(stageArt('ask', 0, 1)).not.toContain('st-fp')
})

// Praj, 12 Oct: props that use the whole stage, not just the crab's spot.
test('stage: build lays a wall, paint leaves a stripe, sub sends minis, web surfs a wave', () => {
  const build = stageArt('build')
  const bk = [...build.matchAll(/class="st-bk" style="animation-delay:([\d.]+)s"/g)].map(m => Number(m[1]))
  expect([bk.length, bk[18] < 10]).toEqual([19, true])
  near(where('paint', .3, 20), .7)
  expect(stageArt('paint', 0, .3).match(/class="st-sp"/g)?.length).toBe(40)
  expect(stageArt('sub', 0, .6).match(/class="st-mc"/g)?.length).toBe(2)
  // Only the first take sends them: the others draw their own minis, which doubled up (21 Oct).
  for (const t of [1, 2, 3]) expect(stageArt('sub', t, .6)).not.toContain('st-mc')
  // Web (21 Oct: a thin strip under every take read as a dashed line): only the surf take rides a sea. One water:
  // a low band rolling left, and swells that rise out of it ahead of the crab, lift it as they pass under, break
  // and sink behind; each next swell bigger than the last (Praj, 21 Oct, live: a separate curl over a tiled sea
  // read as two waves). The antenna take sends rings, the globe take turns a big globe.
  const [antenna, globe, surf, arcs] = [0, 1, 2, 3].map(t => stageArt('web', t, .7))
  expect([antenna, globe, arcs].some(w => w.includes('st-sea'))).toBe(false)
  const sea = surf.match(/<pattern id="st-sea" y="([\d.]+)"[^]*?<rect x="0" y="([\d.]+)"[^>]*fill="url\(#st-sea\)"/)
  expect([sea?.[1], sea?.[2]]).toEqual(['35', '35'])
  expect(surf).toMatch(/@keyframes st-sea\{100%\{transform:translateX\(-\d+px\)\}\}/)
  expect(surf).not.toContain('st-curl')
  // Swells in the order they pass under the crab, each bigger, and the crab rides highest on the biggest.
  const sw = [...surf.matchAll(/<g class="st-sw" style="animation-delay:(-?[\d.]+)s"><g class="st-sy"><g transform="translate\(0,41\) scale\(1,([\d.]+)\)/g)]
    .map(m => ({ peak: ((2.4 + Number(m[1])) % 4.8 + 4.8) % 4.8, size: Number(m[2]) })).sort((a, b) => a.peak - b.peak)
  expect(sw.length).toBe(3)
  expect(sw[0].size < sw[1].size && sw[1].size < sw[2].size).toBe(true)
  const ride = [...surf.matchAll(/([\d.]+)%\{transform:translateY\((-?[\d.]+)px\)/g)].map(m => ({ at: Number(m[1]) * .048, y: Number(m[2]) }))
  const top = ride.reduce((a, b) => b.y < a.y ? b : a)
  expect(Math.abs(top.at - sw[2].peak) < .3).toBe(true)
  // Surfing, the crab holds its spot on the curl while the sea runs past; a wander dragged the curl away over a
  // sea going the other way, two waves (Praj, 21 Oct, live). The other takes still wander, and where() agrees.
  expect([surf.includes('.st-in{animation'), antenna.includes('.st-in{animation')]).toEqual([false, true])
  expect([where('web', .7, 6, 2), where('web', .7, 6, 0) < .7]).toEqual([.7, true])
  expect([antenna.match(/class="st-pg"/g)?.length, globe.includes('st-globe')]).toEqual([3, true])
  // The globe is the take's prop, not an extra: with reduced motion it stays, standing still.
  expect([globe.includes('<g class="st-fx"><g class="st-globe">'), globe.includes('@media (prefers-reduced-motion:reduce){.st-globe *{animation:none}}')]).toEqual([false, true])
  // The stage draws its own water and globe, so the crab's small ones stay out; the narrow band keeps them.
  expect([surf.includes('class="cb-wa"'), globe.includes('class="cb-p1"')]).toEqual([false, false])
  expect([crabArt('web', 2).includes('class="cb-wa"'), crabArt('web', 1).includes('class="cb-p1"')]).toEqual([true, true])
  // Reduced motion: no extras, and the crab stands still at its station, label too (21 Oct: it still walked).
  // Last in the style, so no later rule of the same weight starts a motion again.
  for (const m of MOODS) for (const t of [0, 2]) for (const from of [0, STATION[m]]) {
    const svg = stageArt(m, t, from, 'What it means')
    const still = svg.match(/@media \(prefers-reduced-motion:reduce\)\{\.st-fx\{display:none\}([^{]*)\{animation:none\}\.st-tr\{transform:none\}\}<\/style>/)?.[1]
    // The captions' side switches move too (st-lb-* the label, st-pb-* the pet line).
    const moving = [...new Set([...svg.matchAll(/\.(st-(?:tr|go|in|[lp]b-[wr][lr]))\{animation:/g)].map(m => m[1]))]
    expect([m, t, still?.split(',').sort()]).toEqual([m, t, ['.st-tr', ...moving.filter(c => c !== 'st-tr').map(c => `.${c}`)].sort()])
  }
  for (const m of ['idle', 'ask'] as Mood[]) expect(stageArt(m, 0, 1)).not.toMatch(/st-bk|st-sp|st-mc|st-sea|st-pg|st-globe|st-cf/)
})

test('every take plays as a 14 s scene: work, a beat at ~5 s, work, another beat at ~10 s, each take its own pair (Praj, 16 Oct)', () => {
  const beats = (art: string) => [...new Set(art.match(/cb-k-[a-z]+-[12]/g) ?? [])]
  for (const m of [...ONE, ...BUILDS].filter(m => m !== 'doze')) {
    const art = crabArt(m, 0)
    expect([m, beats(art).length]).toEqual([m, 2])
    expect(art).toMatch(/\.cb-act1\{transform-origin:50% 100%;animation:cb-k-[a-z]+-1 14s ease-in-out infinite\}/)
    const [one, two] = beats(art)
    expect(one.slice(0, -2)).not.toBe(two.slice(0, -2))
  }
  // The pairs vary across a mood's takes, and the dozing crab sleeps through.
  expect(new Set([...Array(takes('think')).keys()].map(t => beats(crabArt('think', t)).join())).size).toBeGreaterThanOrEqual(5)
  expect(beats(crabArt('doze', 0))).toEqual([])
})

// 0.12.0 S1: more test runners count as tests.
test('more test runners show the test look: playwright, dotnet, mvn, gradle, swift, rspec, phpunit, make', () => {
  for (const cmd of ['npx playwright test', 'dotnet test', 'mvn test', './gradlew test', 'gradle test', 'swift test', 'bundle exec rspec spec/', 'rspec', 'vendor/bin/phpunit', 'make test'])
    expect([cmd, classify('Bash', { command: cmd })]).toEqual([cmd, 'test'])
  // Near misses stay what they were.
  for (const cmd of ['echo mvn tests are slow > notes.txt', 'git log --oneline', 'xpytest-helper --go'])
    expect(classify('Bash', { command: cmd })).not.toBe('test')
})

// 0.12.0 S2: six moods for tools that showed "Thinking" (PLAN S2). Browse before mcp; Bash test detection stays first.
test('new moods: browse, mcp, plan, skill, sync, ship', () => {
  for (const t of ['mcp__Claude_Browser__navigate', 'mcp__claude-in-chrome__computer', 'mcp__computer-use__app_click', 'mcp__plugin_playwright__browser_click'])
    expect([t, classify(t, {})]).toEqual([t, 'browse'])
  expect(classify('Bash', { command: 'playwright-cli -s=a open http://localhost:3000' })).toBe('browse')
  for (const t of ['mcp__google-sheets__sheets_read', 'mcp__Apify__call-actor'])
    expect([t, classify(t, {})]).toEqual([t, 'mcp'])
  for (const t of ['EnterPlanMode', 'ExitPlanMode', 'TodoWrite', 'mcp__plugin_claude-mem_mcp-search__work_state_write', 'mcp__x__work_state_read'])
    expect([t, classify(t, {})]).toEqual([t, 'plan'])
  expect(classify('Skill', { skill: 'tdd' })).toBe('skill')
  for (const c of ['git pull', 'git fetch origin', 'git merge main', 'git rebase main', 'git checkout -b x', 'git switch main', 'git stash pop'])
    expect([c, classify('Bash', { command: c })]).toEqual([c, 'sync'])
  for (const c of ['docker build .', 'kubectl apply -f x.yaml', 'gh pr create --fill', 'gh release create v1', 'vercel --prod', 'fly deploy', 'npm publish'])
    expect([c, classify('Bash', { command: c })]).toEqual([c, 'ship'])
  // Existing looks keep their place: tests stay first in Bash, commit and push stay git, unknown tools still think.
  expect(classify('Bash', { command: 'npm test && git pull' })).toBe('test')
  expect(classify('Bash', { command: 'git commit -m x && git push' })).toBe('git')
  expect(classify('SomethingNew', {})).toBe('think')
  // Browser-looking names that are not tools stay out: a plain Bash that merely mentions chrome.
  expect(classify('Bash', { command: 'echo chrome > a.txt' })).toBe('build')
})

test('brief moods: after sync, ship, skill, plan and mcp end, Claude is thinking again', () => {
  for (const m of ['sync', 'ship', 'skill', 'plan', 'mcp'] as const) {
    const c = step(step(START, { kind: 'turnStart' }, 0), { kind: 'tool', mood: m }, 1)
    expect(c.mood).toBe(m)
    expect(step(c, { kind: 'toolEnd', mood: m, isError: false }, 2).mood).toBe('think')
  }
})

// 0.12.0 S3: honest numbers. The stage shows only counts that really happened this turn.
import { tally } from './hooks/crab.ts'
import { stageArt as stage } from './hooks/art.ts'

const edit = (file: string, at: number) => [
  [at, { kind: 'tool', mood: 'build', file }], [at + 100, { kind: 'toolEnd', mood: 'build', isError: false, file }],
] as [number, Parameters<typeof step>[1]][]

test('the tally counts edits, unique files, test runs, running subagents; a new turn resets it', () => {
  const c = run([0, { kind: 'turnStart' }], ...edit('/a.ts', S), ...edit('/a.ts', 2 * S), ...edit('/b.ts', 3 * S),
    [4 * S, { kind: 'tool', mood: 'sub' }], [4 * S + 1, { kind: 'tool', mood: 'sub' }], [5 * S, { kind: 'toolEnd', mood: 'sub', isError: false }])
  expect([c.n.edits, c.n.files.length, c.n.subs]).toEqual([3, 2, 1])
  // A failed edit is not an edit; a tool end with no start never goes below zero.
  const f = run([0, { kind: 'turnStart' }], [S, { kind: 'toolEnd', mood: 'build', isError: true, file: '/x.ts' }], [2 * S, { kind: 'toolEnd', mood: 'sub', isError: false }])
  expect([f.n.edits, f.n.files.length, f.n.subs]).toEqual([0, 0, 0])
  // Bash building counts no edit: no file named.
  expect(run([0, { kind: 'turnStart' }], [S, { kind: 'toolEnd', mood: 'build', isError: false }]).n.edits).toBe(0)
  const next = step(c, { kind: 'turnStart' }, T0 + 9 * S)
  expect([next.n.edits, next.n.files.length, next.n.subs, next.n.testRuns]).toEqual([0, 0, 0, 0])
})

test('the tally counts test runs and keeps the last result; a sub that ends on error still frees its slot', () => {
  const c = run([0, { kind: 'turnStart' }], [S, { kind: 'tool', mood: 'test' }], [2 * S, { kind: 'toolEnd', mood: 'test', isError: true }],
    [3 * S, { kind: 'tool', mood: 'test' }], [4 * S, { kind: 'toolEnd', mood: 'test', isError: false }])
  expect([c.n.testRuns, c.n.testOk]).toEqual([2, true])
  const s = run([0, { kind: 'turnStart' }], [S, { kind: 'tool', mood: 'sub' }], [2 * S, { kind: 'toolEnd', mood: 'sub', isError: true }])
  expect(s.n.subs).toBe(0)
})

test('the closing caption is the tally, leaves out every zero, and a turn with nothing to count keeps the plain line', () => {
  const done = (...evs: [number, Parameters<typeof step>[1]][]) => step(run([0, { kind: 'turnStart' }], ...evs), { kind: 'turnEnd' }, T0 + 4 * M)
  const six = [1, 2, 3, 4, 5, 6].flatMap((i, k) => edit(i <= 3 ? '/a.ts' : i <= 5 ? '/b.ts' : '/c.ts', S + k * 1000))
  const t = (ok: boolean) => [[20 * S, { kind: 'tool', mood: 'test' }], [21 * S, { kind: 'toolEnd', mood: 'test', isError: !ok }]] as [number, Parameters<typeof step>[1]][]
  expect(tally(done(...six, ...t(true)))).toBe('Done: 6 edits in 3 files, tests green, 4 min.')
  expect(tally(done(...edit('/a.ts', S)))).toBe('Done: 1 edit in 1 file, 4 min.')
  expect(tally(done(...t(false)))).toBe('Done: tests red, 4 min.')
  expect(tally(done(...t(true), ...t(true)))).toBe('Done: tests green (2 runs), 4 min.')
  expect(tally(done([S, { kind: 'tool', mood: 'read' }]))).toBeUndefined()
  // Under a minute it says seconds.
  const quick = step(run([0, { kind: 'turnStart' }], ...edit('/a.ts', S)), { kind: 'turnEnd' }, T0 + 42 * S)
  expect(tally(quick)).toBe('Done: 1 edit in 1 file, 42 s.')
  // Before any turn ended there is no tally to read.
  expect(tally(START)).toBeUndefined()
})

test('stage: one mini crab per running subagent up to three; no count given keeps the old two', () => {
  const minis = (subs: number) => stage('sub', 0, .6, '', { subs, files: 0 }).match(/class="st-mc"/g)?.length ?? 0
  expect([1, 2, 3, 7].map(minis)).toEqual([1, 2, 3, 3])
  expect(stage('sub', 0, .6).match(/class="st-mc"/g)?.length).toBe(2)
})

test('stage: the wall has one brick per file edited this turn, up to the wall\'s size; no count given keeps the full wall', () => {
  const bricks = (files: number) => stage('build', 0, .9, '', { subs: 0, files }).match(/class="st-bk"/g)?.length ?? 0
  expect([0, 1, 5, 19, 40].map(bricks)).toEqual([0, 1, 5, 19, 19])
  expect(stage('build', 0, .9).match(/class="st-bk"/g)?.length).toBe(19)
})

test('the tally says 59 s, then 1 min exactly at a minute', () => {
  const at = (ms: number) => tally(step(run([0, { kind: 'turnStart' }], ...edit('/a.ts', S)), { kind: 'turnEnd' }, T0 + ms))
  expect([at(59 * S), at(60 * S)]).toEqual(['Done: 1 edit in 1 file, 59 s.', 'Done: 1 edit in 1 file, 1 min.'])
})

// 0.12.0 S4: calendar looks (PLAN S4). Costume, set dressing and extra lines; the mood and its hover meaning stay true.
import { season, SEASON_LINES, pickLine, lineFitsScene, CALENDAR_LINES } from './hooks/crab.ts'
const at = (y: number, mo: number, d: number, h = 12, mi = 0) => new Date(y, mo - 1, d, h, mi).getTime()

test('season(): friday from 16:00, weekend, sunday night from 18:00, christmas 18-30 Dec, new year 31 Dec to 7 Jan', () => {
  expect(season(at(2026, 11, 20, 15, 59))).toBeUndefined()           // Friday before 16:00
  expect(season(at(2026, 11, 20, 16, 0))).toBe('friday')
  expect(season(at(2026, 11, 20, 23, 59))).toBe('friday')
  expect(season(at(2026, 11, 21, 0, 0))).toBe('weekend')              // Saturday all day
  expect(season(at(2026, 11, 21, 23, 59))).toBe('weekend')
  expect(season(at(2026, 11, 22, 17, 59))).toBe('weekend')            // Sunday before 18:00
  expect(season(at(2026, 11, 22, 18, 0))).toBe('sundayNight')
  expect(season(at(2026, 11, 22, 23, 59))).toBe('sundayNight')
  expect(season(at(2026, 11, 23, 0, 0))).toBeUndefined()              // Monday
  expect(season(at(2026, 11, 18, 12))).toBeUndefined()                // a Wednesday
  // Christmas and New Year win over the weekday looks (18 Dec 2026 is a Friday, 19-20 Dec a weekend).
  expect(season(at(2026, 12, 17, 23, 59))).toBeUndefined()
  expect(season(at(2026, 12, 18, 17))).toBe('christmas')
  expect(season(at(2026, 12, 19, 12))).toBe('christmas')
  expect(season(at(2026, 12, 25, 9))).toBe('christmas')
  expect(season(at(2026, 12, 30, 23, 59))).toBe('christmas')
  expect(season(at(2026, 12, 31, 0, 0))).toBe('newYear')
  expect(season(at(2027, 1, 1, 12))).toBe('newYear')                  // a Friday: New Year wins
  expect(season(at(2027, 1, 7, 23, 59))).toBe('newYear')
  expect(season(at(2027, 1, 8, 9))).toBeUndefined()                   // Friday morning
  expect(season(at(2027, 1, 8, 16))).toBe('friday')
  // Diwali is skipped: early November (a Sunday afternoon is only the weekend look).
  expect(season(at(2026, 11, 8, 12))).toBe('weekend')
  expect(season(at(2026, 11, 4, 12))).toBeUndefined()
})

test('season(): a forced name wins, an unknown name is ignored (the test switch, default off)', () => {
  expect(season(at(2026, 11, 18, 12), 'christmas')).toBe('christmas')
  expect(season(at(2026, 11, 18, 12), 'sundayNight')).toBe('sundayNight')
  expect(season(at(2026, 11, 18, 12), 'nonsense')).toBeUndefined()
  expect(season(at(2026, 11, 18, 12), '')).toBeUndefined()
})

test('calendar lines: eight to ten a season, short, certain, no "or", all different, not shared with the working lines', () => {
  const working = new Set(Object.values(LINES).flat())
  for (const [s, ls] of Object.entries(SEASON_LINES)) {
    expect([s, ls.length >= 8 && ls.length <= 10]).toEqual([s, true])
    expect(new Set(ls).size).toBe(ls.length)
    for (const l of ls) { expect(l.length).toBeLessThanOrEqual(60); expect(l).not.toMatch(/ or /i); expect(working.has(l)).toBe(false) }
  }
  expect(Object.keys(SEASON_LINES).sort()).toEqual(['christmas', 'friday', 'newYear', 'sundayNight', 'weekend'])
})

test('pickLine: a calendar line about one time in four, the working line otherwise; never for a mood a season leaves alone', () => {
  let cal = 0
  for (let ms = 0; ms < 400; ms++) if (SEASON_LINES.friday.includes(pickLine('idle', ms, 'friday'))) cal++
  expect(cal).toBeGreaterThan(70); expect(cal).toBeLessThan(130)
  // Without a season it is exactly the old pick.
  for (const m of ['idle', 'think', 'done'] as const) expect(pickLine(m, 1234)).toBe(LINES[m][1234 % LINES[m].length])
  // Weekday looks touch idle, doze and done only; the working looks keep their own lines.
  for (let ms = 0; ms < 60; ms++) for (const m of ['think', 'build', 'test'] as const) expect(LINES[m]).toContain(pickLine(m, ms, 'sundayNight'))
  // Christmas lines may colour any mood.
  let xm = 0
  for (let ms = 0; ms < 400; ms++) if (SEASON_LINES.christmas.includes(pickLine('think', ms, 'christmas'))) xm++
  expect(xm).toBeGreaterThan(70)
})

// 17 Nov 2026: neither side was wrong; Praj asked for seven scenes per look.
test('takes and take: calendar moods gain seven scenes; costume looks add none', () => {
  expect([takes('idle'), takes('idle', 'friday'), takes('done', 'friday'), takes('doze', 'friday')]).toEqual([4, 11, 11, 4])
  expect([takes('doze', 'weekend'), takes('idle', 'sundayNight'), takes('doze', 'sundayNight')]).toEqual([11, 11, 4])
  expect([takes('idle', 'christmas'), takes('done', 'newYear'), takes('think', 'weekend')]).toEqual([4, 4, 9])
  const c = { ...START, lastActive: 0 }
  // `done` shows its calendar take every time; idle plays it on every second slot, 42 s each.
  expect(take(c, 1000, 'done', 'friday')).toBeGreaterThanOrEqual(4)
  const idleTakes = new Set([0, 1, 2, 3, 4, 5].map(k => take(c, k * 42_000, 'idle', 'weekend')))
  expect([...idleTakes].some(t => t >= 4)).toBe(true); expect([...idleTakes].every(t => t >= 0 && t < 11)).toBe(true)
  // No season, no change.
  expect(take(c, 1000, 'idle')).toBe(take(c, 1000, 'idle', undefined))
})

test('calendar art: every season draws every mood, each costume differs from the plain art, still well-formed, hover meaning untouched', () => {
  const MOODS = Object.keys(MEANING) as Mood[]
  for (const s of ['friday', 'weekend', 'sundayNight', 'christmas', 'newYear'] as const) {
    let differs = 0
    for (const m of MOODS) {
      const plain = crabArt(m, 0), dressed = crabArt(m, 0, s)
      expect(dressed.startsWith('<svg')).toBe(true)
      if (dressed !== plain) differs++
      const stageSvg = stage(m, 0, STATION[m], MEANING[m], undefined, s)
      expect(stageSvg).toContain(MEANING[m].replace(/&/g, '&amp;'))
    }
    // Christmas and New Year dress every mood; the weekday looks only the moods they own.
    expect([s, differs >= (s === 'christmas' || s === 'newYear' ? MOODS.length : 2)]).toEqual([s, true])
  }
  for (const m of ['think', 'build', 'test'] as const) expect(crabArt(m, 0, 'friday')).toBe(crabArt(m, 0))
})

// 0.12.0 S5, Layer A (pure CSS, pet and cursor). Layer B (a press reaching a hook) is blocked: see CONTEXT.md.
import { PET_LINES, PET_RARE, petLine } from './hooks/crab.ts'

test('pet lines: ten short ones and one rare, certain, no "or", none shared with the working or calendar lines', () => {
  const used = new Set([...Object.values(LINES).flat(), ...Object.values(SEASON_LINES).flat()])
  expect(PET_LINES.length).toBe(10)
  expect(new Set(PET_LINES).size).toBe(10)
  for (const l of [...PET_LINES, PET_RARE]) { expect(l.length).toBeLessThanOrEqual(34); expect(l).not.toMatch(/ or /i); expect(used.has(l)).toBe(false) }
  expect(PET_LINES).not.toContain(PET_RARE)
})

test('petLine: the rare line about one pet in 25, the others spread over all ten', () => {
  const picks = Array.from({ length: 2500 }, (_, i) => petLine(i))
  expect(picks.filter(l => l === PET_RARE).length).toBe(100)
  expect(new Set(picks.filter(l => l !== PET_RARE)).size).toBe(10)
  expect(petLine(7)).toBe(petLine(7))
})

test('stage: pointer zones make the eyes look, a near pointer sidesteps, the crab itself waves, a press hops; none stops the walk', () => {
  const svg = stage('idle', 0, 1, 'Idle: waiting for your message')
  // Invisible hover zones left and right of the crab (the eyes look that way), and one over the crab itself.
  expect(svg).toMatch(/class="st-zl"/); expect(svg).toMatch(/class="st-zr"/); expect(svg).toMatch(/class="st-zc"/)
  expect(svg).toMatch(/\.st-zl:hover/); expect(svg).toMatch(/\.st-zr:hover/); expect(svg).toMatch(/\.st-zc:hover/)
  // A press (:active) hops or squishes, and shows the pet line in a bubble that is hidden otherwise.
  expect(svg).toMatch(/:active/)
  expect(svg).toMatch(/class="st-pet"/)
  expect(PET_LINES.concat(PET_RARE).some(l => svg.includes(l))).toBe(true)
  expect(svg).toMatch(/\.st-pet\{[^}]*opacity:0/)
  // The walk and the wander still sit on their own groups; no hover rule touches `.st-at`'s own transform.
  expect(svg).toContain('class="st-at"')
  expect(svg).not.toMatch(/\.st-at:hover\{[^}]*transform/)
  expect(svg).not.toMatch(/animation-play-state/)
  // Zones are invisible and carry no fill that shows.
  expect(svg).toMatch(/\.st-zl,\.st-zr,\.st-zc\{[^}]*fill:transparent|\.st-z[lrc][^{]*\{[^}]*fill:transparent/)
})

test('stage: the pet effects are costume on the look: no mood changes, the label and hover meaning stay, and reduced motion stills them', () => {
  for (const m of Object.keys(MEANING) as Mood[]) {
    const svg = stage(m, 0, STATION[m], MEANING[m])
    expect(svg).toContain(MEANING[m].replace(/&/g, '&amp;'))
    expect(svg).toMatch(/@media \(prefers-reduced-motion:reduce\)[^]*st-z/)
  }
  // The bubble line is a property of the look, so it never changes while the look stands (no redraw needed).
  expect(stage('think', 2, .85, 'Thinking')).toBe(stage('think', 2, .85, 'Thinking'))
})

test('stage: pointer rules fire on the right pointer state, in the right direction, and stay still for reduced motion', () => {
  const svg = stage('think', 0, STATION.think, MEANING.think)
  // The bubble and the hop come from a press (:active); the wave and the sidestep from hovering.
  expect(svg).toContain('.st-zc:active~.st-pet{opacity:1')
  expect(svg).not.toContain('.st-zc:hover~.st-pet')
  expect(svg).toContain('.st-zc:active~.st-look .st-hop{')
  expect(svg).not.toContain('.st-zc:hover~.st-look .st-hop')
  expect(svg).toContain('.st-zc:hover~.st-look .st-wave{')
  // The bubble lingers 2.2 s after the press. Was 1.2 s until 17 Nov: neither side was wrong, Praj asked for a press
  // that pays off (live: "it jumps a little and very quick, nothing engaging"), and 1.2 s was too short to read.
  expect(svg).toContain('.st-pet{opacity:0;transition:opacity .15s 2.2s}')
  // The crab steps away from the pointer, and the eyes look toward it.
  expect(svg).toContain('.st-zl:hover~.st-look{transform:translateX(3px)}')
  expect(svg).toContain('.st-zr:hover~.st-look{transform:translateX(-3px)}')
  expect(svg).toContain('.st-zl:hover~.st-look .st-ey{transform:translateX(-1.5px)}')
  expect(svg).toContain('.st-zr:hover~.st-look .st-ey{transform:translateX(1.5px)}')
  // The zones must catch the pointer although they are transparent.
  expect(svg).toContain('.st-zl,.st-zr,.st-zc{fill:transparent;pointer-events:all}')
  // Reduced motion stills the wave and the hop too.
  const still = svg.slice(svg.indexOf('@media (prefers-reduced-motion:reduce){.st-pop{transform:none!important;transition:none!important}'))
  expect(still).toContain('.st-look .st-wave')
  expect(still).toContain('.st-look .st-hop')
})

// 0.12.0 S13 (Praj, 17 Nov, live: "it just pops up the caption... it jumps a little and very quick, nothing engaging").
// A press now squashes the crab while held; letting go springs it up with bounces, hearts fly out of its sides, and
// happy eyes linger. Still CSS only: a press cannot reach a hook.
test('pet: a press squashes the crab at its feet, and letting go springs it back with bounces and a jump', () => {
  const svg = stage('idle', 0, STATION.idle, MEANING.idle)
  // Held: wider and shorter, scaled about the feet so it never leaves the floor.
  const [, sx, sy] = svg.match(/\.st-zc:active~\.st-look \.st-hop\{transform:scale\(([\d.]+),([\d.]+)\)/)!
  expect(+sx).toBeGreaterThan(1); expect(+sy).toBeLessThan(.9)
  expect(svg).toMatch(/\.st-hop\{transform-origin:26px 38\.5px;/)
  // Released: the way back is a spring (a linear() curve that passes 1 and comes back more than once).
  const spring = (cls: string) => svg.match(new RegExp(`\\.${cls}\\{[^}]*transition:transform ([\\d.]+)s linear\\(([^)]*)\\)`))!
  const [, hopFor, hopCurve] = spring('st-hop')
  expect(+hopFor).toBeGreaterThanOrEqual(.7)
  expect(hopCurve.split(',').filter(v => parseFloat(v) > 1).length).toBeGreaterThanOrEqual(2)
  // The jump is its own group: it sinks a little while held and overshoots upward by at least 4 px on release.
  const [, down] = svg.match(/\.st-zc:active~\.st-look \.st-jmp\{transform:translateY\(([\d.]+)px\)/)!
  const peak = Math.max(...spring('st-jmp')[2].split(',').map(v => parseFloat(v)))
  expect(+down * (peak - 1)).toBeGreaterThanOrEqual(4)
  // The squash itself lands fast, so a quick click still shows it.
  expect(svg).toMatch(/\.st-zc:active~\.st-look \.st-hop\{[^}]*transition:transform \.0\ds/)
  expect(svg).toContain('<g class="st-look"><g class="st-perk"><g class="st-jmp"><g class="st-hop">')
})

test('pet: happy eyes and a blush show from the press and linger; the open eyes hide meanwhile', () => {
  const svg = stage('think', 0, STATION.think, MEANING.think)
  expect(svg).toMatch(/<g class="st-joy">.*?<path[^>]*>.*?<path[^>]*>/)
  expect(svg).toMatch(/\.st-joy\{opacity:0;transition:opacity 0s 1\.4s\}/)
  expect(svg).toContain('.st-zc:active~.st-look .st-joy{opacity:1;transition:none}')
  expect(svg).toContain('.st-zc:active~.st-look .st-ey{opacity:0;transition:none}')
  expect(svg).toMatch(/\.st-ey\{transition:transform \.15s ease-out,opacity 0s 1\.4s\}/)
  expect(svg).not.toMatch(/\.st-zc:hover~\.st-look \.st-joy/)
})

test('pet: hearts wait at the sides of the crab on a press, fly out on release, and stream while it is held', () => {
  const svg = stage('idle', 0, STATION.idle, MEANING.idle)
  const burst = svg.match(/<g class="st-hb">(.*?)<\/g><g class="st-hs">/)![1]
  expect(burst.match(/class="st-h\d"/g)!.length).toBeGreaterThanOrEqual(5)
  // At rest they are parked away and invisible; a press snaps them to the crab, visible, with no transition.
  expect(svg).toMatch(/\.st-hb>\*\{opacity:0;[^}]*transition:transform [\d.]+s [^}]*,opacity/)
  expect(svg).toMatch(/\.st-zc:active~\.st-look \.st-hb>\*\{opacity:1;transform:scale\(\.6\);transition:none\}/)
  for (const k of [1, 2, 3, 4, 5]) expect(svg).toMatch(new RegExp(`\\.st-h${k}\\{transform:translate\\(-?[\\d.]+px,-?[\\d.]+px\\)`))
  // Nothing of the burst may rise into the caption lane (the top 13.67 px): start y plus the travel stays below it.
  const marks = [...burst.matchAll(/<g class="st-h(\d)"><rect x="[-\d.]+" y="([\d.]+)"/g)]
  expect(marks.length).toBe(5)
  for (const [, k, y] of marks) {
    const dy = +svg.match(new RegExp(`\\.st-h${k}\\{transform:translate\\(-?[\\d.]+px,(-?[\\d.]+)px\\)`))![1]
    expect(+y + dy).toBeGreaterThanOrEqual(14.5)
  }
  // No transform attribute on them: the CSS transform would replace it and drop them at the stage corner.
  expect(burst).not.toContain('transform=')
  // Held past a moment, more hearts rise in a loop; they start only on a press, never on hover.
  expect(svg).toMatch(/\.st-zc:active~\.st-look \.st-hs>\*\{animation:st-rise [\d.]+s ease-out \.35s infinite/)
  expect(svg).toContain('.st-hs>*{opacity:0}')
  expect(svg).not.toMatch(/:hover[^{,]*\.st-h[bs]/)
})

test('pet: at a station on the edge of the stage, the hearts flying outward stop inside the crab box', () => {
  const ends = (svg: string) => [1, 2, 3, 4, 5].map(k => {
    const x = +svg.match(new RegExp(`<g class="st-h${k}"><rect x="([\\d.]+)"`))![1]
    return x + +svg.match(new RegExp(`\\.st-h${k}\\{transform:translate\\((-?[\\d.]+)px`))![1]
  })
  // Idle stands at the right edge (station 1): nothing ends past the 52 px box. In the middle they fly wide.
  expect(STATION.idle).toBe(1)
  expect(Math.max(...ends(stage('idle', 0, 1, MEANING.idle)))).toBeLessThanOrEqual(49)  // a mark's first rect, at most 3 px wide
  expect(Math.min(...ends(stage('idle', 0, 1, MEANING.idle)))).toBeLessThan(-5)
  const mid = (Object.keys(STATION) as Mood[]).find(m => STATION[m] > .2 && STATION[m] < .8)!
  expect(Math.max(...ends(stage(mid, 0, STATION[mid], MEANING[mid])))).toBeGreaterThan(55)
  const left = (Object.keys(STATION) as Mood[]).find(m => STATION[m] < .05)
  if (left) expect(Math.min(...ends(stage(left, 0, STATION[left], MEANING[left])))).toBeGreaterThanOrEqual(0)
})

test('pet: the pointer arriving on the crab makes it perk up once and look up; reduced motion keeps all of it still', () => {
  const svg = stage('idle', 0, STATION.idle, MEANING.idle)
  expect(svg).toMatch(/\.st-zc:hover~\.st-look \.st-perk\{animation:st-perk \.5s ease-out\}/)
  expect(svg).toMatch(/@keyframes st-perk\{/)
  expect(svg).toContain('.st-zc:hover~.st-look .st-ey{transform:translateY(-1px)}')
  expect(svg).toContain('.st-zc{cursor:pointer}')
  // Held, it purrs; only a press starts the purr, never a hover.
  expect(svg).toMatch(/\.st-zc:active~\.st-look \.st-perk\{animation:st-purr /)
  expect(svg).not.toMatch(/:hover~\.st-look \.st-perk\{animation:st-purr/)
  const still = svg.slice(svg.indexOf('@media (prefers-reduced-motion:reduce){.st-pop{transform:none!important;transition:none!important}'))
  for (const cls of ['.st-look .st-jmp', '.st-look .st-perk', '.st-look .st-hs>*', '.st-look .st-hb>*']) expect(still).toContain(cls)
})

// 0.12.0 S8: the string lights ran 100 px of a stage that is wider; they must span the whole width, with bulbs.
test('christmas: string lights span the full stage width, have bulbs, blink, and stand still under reduced motion', () => {
  const xmas = stage('idle', 0, STATION.idle, MEANING.idle, undefined, 'christmas', 2026)
  expect(xmas).toContain('class="st-lt"')
  expect(xmas).toMatch(/<rect class="st-lt" width="100%"/)
  expect(xmas).toContain('<pattern')
  expect(xmas).toMatch(/@media \(prefers-reduced-motion:reduce\)[^]*\.st-lt[^}]*animation:none/)
  for (const s of [undefined, 'friday', 'weekend', 'sundayNight', 'newYear'] as const)
    expect(stage('idle', 0, STATION.idle, MEANING.idle, undefined, s, 2026)).not.toContain('st-lt')
})

// 0.12.0 S8: the Sunday-night calendar page read as an "L" in Chromium; it must read MON. 17 Nov 11:10: the pixel M
// with a tiny "ON" beside it stuck out past the SUN page, so MON is now set in SUN's letters (the old pixel
// expectations were the stale side).
test('sundayNight: the calendar page reads MON in the same letters as SUN', () => {
  for (const m of ['idle', 'done'] as const) {
    // 17 Nov 2026: neither side was wrong; Praj asked for seven scenes per look.
    const svg = crabArt(m, 4, 'sundayNight')
    expect(svg).toMatch(/class="cb-mon-page"><text x="-4.7" y="19" font-family="sans-serif" font-size="3.3"[^>]*>MON<\/text>/)
    expect(svg).not.toContain('>ON</text>')
  }
})

// 0.12.0 S8: seen in Chromium, light theme: white costume pieces (hat brim, pompom, snow, chair seat, page) vanished.
test('calendar costume and set pieces never use the near-white, which disappears on the light theme', () => {
  const white = (svg: string) => (svg.match(/#F4F3EE/g) ?? []).length
  for (const s of ['friday', 'weekend', 'sundayNight', 'christmas', 'newYear'] as const) for (const m of ['idle', 'done', 'doze'] as const) {
    const idx = takes(m, s) - 1
    // The season may add pieces but no near-white one: no more than the mood's own ordinary takes already have.
    const own = Math.max(...Array.from({ length: idx }, (_, t) => white(crabArt(m, t))))
    expect([s, m, white(crabArt(m, idx, s, 2027)) <= own]).toEqual([s, m, true])
  }
})

test('the weekend chair seat is not near-white and the wire of the christmas lights spans the stage too', () => {
  // 17 Nov 2026: neither side was wrong; Praj asked for seven scenes per look.
  expect(crabArt('doze', 4, 'weekend')).not.toMatch(/y="18" width="6" height="1" fill="#F4F3EE"/)
  expect(stage('idle', 0, STATION.idle, MEANING.idle, undefined, 'christmas', 2026)).toContain('<rect width="100%" height="9" fill="url(#st-lw)"/>')
})

// One caption at a time (Praj, 17 Nov, live: the hover label and the pet bubble showed together). Since 27 Nov the
// label steps aside while the pet line shows, and each bubble is sized to its own text: covering the label made the
// pet bubble as wide as the label, with a wide empty gap after a short pet line ("uneven padding that really is not a
// good UX", Praj, 27 Nov). This replaces the 17 Nov test that required the pet bubble to cover the label; that
// design is the side that changed, not the code.
test('one caption at a time: the label steps aside for the pet line, which sits on the same side', () => {
  for (const m of Object.keys(STATION) as Mood[]) {
    const svg = stage(m, 0, STATION[m], MEANING[m])
    expect([m, showing(svg, 'st-pet').map(s => s.side)]).toEqual([m, showing(svg, 'st-tip').map(s => s.side)])
    expect(svg).toContain('<g class="st-tip"><g class="st-tq">')
    expect(svg.indexOf('<g class="st-pet">')).toBeGreaterThan(svg.indexOf('<g class="st-tip">'))
  }
  const svg = stage('idle', 0, 1, MEANING.idle)
  // Hidden at once on a press, back only once the pet line has faded (it lingers 2.2 s, then fades in .15 s).
  expect(svg).toContain('.st-zc:active~.st-tip .st-tq{opacity:0;transition:none}')
  expect(svg).toContain('.st-tq{transition:opacity .15s 2.35s}')
  expect(svg).toContain('.st-pet{opacity:0;transition:opacity .15s 2.2s}')
  expect(svg).toContain('.st-zc:active~.st-pet{opacity:1;transition:none}')
})

// The bubble's body, without its four-pixel tail (on the crab's side), and the text's padding on each side.
const pads = (s: ReturnType<typeof sidesOf>[number]) => {
  const [l, r] = s.side === 'l' ? [s.left, s.right - 4] : [s.left + 4, s.right]
  return [+(s.text[0] - l).toFixed(2), +(r - s.text[0] - s.text[1]).toFixed(2)]
}
test('captions: six pixels of padding on both sides of every label and pet line', () => {
  const seen = new Set<string>()
  for (const m of Object.keys(STATION) as Mood[]) for (const t of [0, 2]) for (const from of [0, 1]) {
    const svg = stage(m, t, from, MEANING[m])
    for (const cls of ['st-tip', 'st-pet'] as const) for (const s of sidesOf(svg, cls)) expect([m, cls, pads(s)]).toEqual([m, cls, [6, 6]])
    seen.add(svg.match(/<g class="st-pet">[^]*?lengthAdjust="spacing">([^<]*)</)![1])
  }
  // A short pet line gets a short bubble, not the label's width.
  const [tip] = showing(stage('idle', 0, 1, MEANING.idle), 'st-tip')
  const short = PET_LINES.find(l => l.length < 20)!
  expect(seen.size).toBeGreaterThan(5)
  expect(short).toBeTruthy()
  for (let from = 0; from <= 1; from += .01) {
    const svg = stage('idle', 0, +from.toFixed(2), MEANING.idle)
    if (!svg.includes(`>${short}</text>`)) continue
    const [pet] = showing(svg, 'st-pet')
    expect(pet.right - pet.left).toBeLessThan(tip.right - tip.left)
    break
  }
})

// Widths measured in Chromium at 11.5 px sans-serif (Helvetica on macOS; Arial on Windows has the same metrics),
// 27 Nov. The old guess was up to 3.5 px off, which showed as a gap at one end of the line.
test('captions: the text width matches the font as measured, within 1.5 px', () => {
  const measured: [string, number][] = [['Idle: waiting for your message', 152.77], ['Thinking', 43.47], ['Running tests', 70.32],
    ['A command failed: fixing it', 134.23], ['Another model is working: Codex, Gemini', 211.57], ['Committing and pushing with git', 163]]
  for (const [text, px] of measured) {
    const [s] = showing(stage('idle', 0, 1, text), 'st-tip')
    expect([text, Math.abs(s.text[1] - px) <= 1.5]).toEqual([text, true])
  }
})

// Authored acting: scene props belong to the selected look, with quiet, visible stills.
test('Friday calendar takes watch five, drop shades and sip; only done tosses a briefcase', () => {
  for (const m of ['idle', 'done'] as const) {
    const svg = crabArt(m, 4, 'friday')
    for (const cls of ['cb-clock', 'cb-clock-hand', 'cb-shades', 'cb-sip', 'cb-straw']) expect(svg).toContain(`class="${cls}"`)
    expect(svg.includes('class="cb-briefcase"')).toBe(m === 'done')
    expect(crabArt(m, 0, 'friday')).not.toContain('class="cb-clock"')
  }
})
test('Sunday calendar takes flip SUN to MON, hold a glance, sigh and set a ringing alarm', () => {
  for (const m of ['idle', 'done'] as const) {
    const svg = crabArt(m, 4, 'sundayNight')
    for (const cls of ['cb-calendar', 'cb-sun-page', 'cb-mon-page', 'cb-sigh', 'cb-alarm', 'cb-alarm-hand']) expect(svg).toContain(`class="${cls}"`)
    expect(svg).toContain('>SUN</text>'); expect(svg).toContain('>MON</text>')
    expect(svg).toContain('36%,44%{transform:translateX(-2px)}') // 1.12 s of disbelief
  }
})
test('weekend calendar takes share shades, a cooler, deck chair and a slow sip, including doze', () => {
  for (const m of ['idle', 'doze', 'done'] as const) {
    const svg = crabArt(m, 4, 'weekend')
    for (const cls of ['cb-shades', 'cb-cooler', 'cb-chair', 'cb-sip']) expect(svg).toContain(`class="${cls}"`)
    expect(svg).toContain('class="cb-recline"')
    expect(svg).not.toContain('cb-em1')
  }
})
test('New Year separates year and hat and done launches two rising bursting fireworks', () => {
  const idle = crabArt('idle', 0, 'newYear', 2027)
  // 17 Nov 11:10: at y 12 the year still sat under idle's prop in Chromium; it stands in the top-left corner now.
  expect(idle).toContain('<text class="cb-year" x="-5.5" y="5"')
  expect(idle).toContain('class="cb-party-hat"')
  const done = crabArt('done', 0, 'newYear', 2027)
  expect(done.match(/class="cb-rocket"/g)?.length).toBe(2)
  expect(done.match(/class="cb-firework"/g)?.length).toBe(2)
  expect(done).toContain('animation-delay:5s')
})
test('Christmas done has the same full width wire and bulbs as idle, below the caption lane', () => {
  for (const m of ['idle', 'done'] as const) {
    const svg = stage(m, 0, STATION[m], '', undefined, 'christmas')
    expect(svg).toContain('<g transform="translate(0,14)"><defs><pattern id="st-lw"')
    expect(svg).toContain('<rect class="st-lt" width="100%"')
  }
})
test('six second takes have distinct scenes, keeping the first takes', () => {
  for (const [m, cls] of [['browse', 'cb-scrollbar'], ['mcp', 'cb-sockets'], ['plan', 'cb-pinboard'], ['skill', 'cb-scroll'], ['sync', 'cb-arrows'], ['ship', 'cb-parachute']] as const) {
    expect(crabArt(m, 1)).toContain(`class="${cls}"`)
    expect(crabArt(m, 0)).not.toContain(`class="${cls}"`)
    expect(crabArt(m, 1)).not.toContain('class="cb-motion"')
  }
})
test('test results hold the claw and result for .8 s before moving or blinking', () => {
  for (const m of ['testp', 'testf'] as const) {
    const svg = crabArt(m, 0)
    expect(svg).toContain(`.cb-${m} .cb-ar{animation:cb-result-arm 14s`)
    expect(svg).toContain(`.cb-${m} .cb-pr{animation:none}`)
    expect(svg).toContain('0%,5.72%{transform:none}')
  }
  expect(stage('testf', 0, .5)).toContain('0%,40%{transform:none}')
})
test('authored scenes keep props visible with every new animation stopped for reduced motion', () => {
  const svgs = [
    ...(['friday', 'sundayNight', 'weekend'] as const).flatMap(s => (['idle', 'done'] as const).flatMap(m => Array.from({ length: 7 }, (_, i) => crabArt(m, 4 + i, s)))),
    ...Array.from({ length: 7 }, (_, i) => crabArt('doze', 4 + i, 'weekend')), crabArt('idle', 0, 'newYear', 2027), crabArt('done', 0, 'newYear'),
    ...(['browse', 'mcp', 'plan', 'skill', 'sync', 'ship'] as const).map(m => crabArt(m, 1)),
  ]
  for (const svg of svgs) {
    expect(svg).toContain('@media (prefers-reduced-motion:reduce){.cb *{animation:none!important}}')
    expect(svg).toContain('.cb-authored *{animation:none!important}')
    expect(svg).toContain('.cb-authored .cb-sun-page{display:none}')
    expect(svg).toContain('.cb-authored .cb-shades{transform:none}')
  }
})

test('authored rect geometry fits the 52 by 41 box below its 13.67 px caption lane', () => {
  const svgs = [
    ...(['friday', 'sundayNight', 'weekend'] as const).flatMap(s => (['idle', 'done'] as const).flatMap(m => Array.from({ length: 7 }, (_, i) => crabArt(m, 4 + i, s)))),
    ...Array.from({ length: 7 }, (_, i) => crabArt('doze', 4 + i, 'weekend')), crabArt('idle', 0, 'newYear', 2027), crabArt('done', 0, 'newYear'),
    ...(['browse', 'mcp', 'plan', 'skill', 'sync', 'ship'] as const).map(m => crabArt(m, 1)),
  ]
  for (const svg of svgs) for (const rect of svg.matchAll(/<rect x="(-?[\d.]+)" y="(-?[\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)) {
    const [x, y, w, h] = rect.slice(1).map(Number)
    // The art's own box (viewBox -6 -2 38 30). A y >= 8 floor here squashed the holiday hats to two rows (17 Nov,
    // the orchestrator's brief was wrong, not the hats): a hat stands on the head, above y 8.
    expect([x >= -6, x + w <= 32, y >= -2, y + h <= 28]).toEqual([true, true, true, true])
  }
})
test('Friday last tick and shades share the release; failed-test stage holds for .8 s', () => {
  const svg = crabArt('idle', 4, 'friday')
  expect(svg).toContain('72%,100%{transform:rotate(0)}')
  expect(svg).toContain('72%,100%{transform:none;opacity:1}')
  expect(where('testf', .5, .8)).toBe(.5)
  const failed = stage('testf', 0, .5)
  expect(failed).toContain('.st-roam .cb:not(.cb-walk) .cb-la{animation:cb-st .4s ease-in-out 0.8s')
})
test('result first takes also hold the walk-in for .8 s, with where matching the delayed walk', () => {
  for (const m of ['testp', 'testf'] as const) {
    expect(where(m, 0, .8, 0)).toBe(0)
    expect(where(m, 0, 1.2, 0)).toBeGreaterThan(0)
    expect(stage(m, 0, 0)).toContain('0%,25%{transform:translateX(calc((100% - 52px) * 0))}')
  }
})

import { PROFILE, trait, traitLine, TRAIT_LINES, projectKey, greeting } from './hooks/crab.ts'
import type { Profile, Trait } from './types'

test('session profile survives turns and counts successful work, test results, fixes and failures', () => {
  let c = step(START, { kind: 'turnStart' }, 0)
  const end = (mood: Mood, isError = false, file?: string, command = false) => {
    c = step(c, { kind: 'tool', mood }, 1)
    c = step(c, { kind: 'toolEnd', mood, isError, file, command }, 2)
  }
  end('build', false, '/private/a'); end('build', false, '/private/a'); end('build', true, '/b')
  end('read'); end('web'); end('sub'); end('build', true, undefined, true)
  end('test', true, undefined, true)
  c = step(step(c, { kind: 'turnEnd' }, 3), { kind: 'turnStart' }, 4)
  end('test', false, undefined, true); end('test', false, undefined, true)
  end('ship'); end('ship', true, undefined, true)
  expect(c.profile).toEqual({ edits: 2, reads: 1, green: 2, red: 1, web: 1, subs: 1, failedCommands: 3, fixes: 1, ships: 1 })
  expect(START.profile).toEqual(PROFILE)
  expect(JSON.stringify(c.profile)).not.toContain('/private')
})

test('trait thresholds use activity shares, with ties in tester builder reader surfer manager fixer order', () => {
  const cases: [Trait, Partial<Profile>, Partial<Profile>][] = [
    ['tester', { green: 4 }, { green: 4, red: 1 }], ['builder', { edits: 14 }, { edits: 15 }],
    ['reader', { reads: 29 }, { reads: 30 }], ['surfer', { web: 7 }, { web: 8 }],
    ['manager', { subs: 4 }, { subs: 5 }], ['fixer', { fixes: 2 }, { fixes: 3 }],
  ]
  for (const [name, below, enough] of cases) {
    expect(trait({ ...PROFILE, ...below })).toBeUndefined()
    expect(trait({ ...PROFILE, ...enough })).toBe(name)
  }
  const p = { ...PROFILE, green: 30, edits: 30, reads: 30, web: 30, subs: 30, fixes: 30 }
  for (const [name, field] of [['tester', 'green'], ['builder', 'edits'], ['reader', 'reads'], ['surfer', 'web'], ['manager', 'subs'], ['fixer', 'fixes']] as const) {
    expect(trait(p)).toBe(name); p[field] = 0
  }
  expect(trait({ ...PROFILE, green: 5, edits: 16 })).toBe('builder')
})

test('trait captions have six to eight templates, use only actual profile counts, one pick in four in idle done think', () => {
  const p = { ...PROFILE, edits: 47, reads: 53, green: 19, red: 11, web: 23, subs: 13, fixes: 7 }
  const allowed = new Set(Object.values(p).map(String).concat(String(p.green + p.red)))
  for (const name of Object.keys(TRAIT_LINES) as Trait[]) {
    expect(TRAIT_LINES[name].length >= 6 && TRAIT_LINES[name].length <= 8).toBe(true)
    for (const template of TRAIT_LINES[name]) {
      const line = template(p)
      expect(line.match(/\d+/g)?.length).toBeGreaterThan(0)
      for (const n of line.match(/\d+/g) ?? []) expect(allowed.has(n)).toBe(true)
    }
  }
  const builder = { ...PROFILE, edits: 47 }
  for (const mood of ['idle', 'done', 'think'] as const) {
    expect(Array.from({ length: 400 }, (_, i) => traitLine(mood, i, builder)).filter(Boolean).length).toBe(100)
  }
  for (const mood of MOODS.filter(m => !['idle', 'done', 'think'].includes(m))) expect(traitLine(mood, 0, builder)).toBeUndefined()
  expect(traitLine('idle', 0, PROFILE)).toBeUndefined()
})

test('trait items draw only in idle and done, calendar hats take precedence, hover meaning stays', () => {
  for (const name of Object.keys(TRAIT_LINES) as Trait[]) for (const m of MOODS) {
    for (let t = 0; t < takes(m); t++) {
      const svg = crabArt(m, t, undefined, undefined, name)
      expect(svg.includes(`class="cb-trait cb-trait-${name}"`)).toBe(m === 'idle' || m === 'done')
    }
    for (const s of ['christmas', 'newYear'] as const) {
      // Festive costume takes precedence over session accessories.
      expect(crabArt(m, 0, s, 2027, name).includes('class="cb-trait ')).toBe(false)
    }
    expect(stage(m, 0, STATION[m], MEANING[m], undefined, undefined, undefined, name)).toContain(MEANING[m])
  }
})

test('project identity hashes cwd without retaining paths, greetings use stored counters and trait', () => {
  expect(projectKey('/secret/project')).toMatch(/^p:[a-z0-9]+$/)
  expect(projectKey('/secret/project')).toBe(projectKey('/secret/project'))
  expect(projectKey('/elsewhere')).not.toBe(projectKey('/secret/project'))
  const p = { v: 1 as const, sessions: 6, lastAt: 0, green: 12, red: 2, edits: 42, lastTrait: 'builder' }
  expect(greeting(p, 0)).toBe('Session 7 on this project. Welcome back.')
  expect(greeting(p, 1)).toBe('Back to the builder’s bench.')
  expect(greeting(undefined, 0)).toBeUndefined()
})

// S14: all calendar scenes share the wall clock, without randomness or rapid repeats.
test('calendar slots: seven unique scenes per cycle, stable inside a slot, idle alternates base and calendar', () => {
  const c = { ...START, lastActive: 0 }
  const start = Math.ceil(at(2026, 11, 21, 12) / 42_000)
  for (const s of ['friday', 'weekend', 'sundayNight'] as const) {
    const seq = Array.from({ length: 28 }, (_, i) => take(c, (start + i) * 42_000, 'done', s))
    for (let i = 0; i < 21; i++) {
      expect(new Set(seq.slice(i, i + 7)).size).toBe(7)
      expect(seq[i]).toBeGreaterThanOrEqual(4); expect(seq[i]).toBeLessThan(11)
      expect(seq[i]).toBe(seq[i + 7])
      expect(take({ ...c, lastActive: 123 }, (start + i) * 42_000 + 40_000, 'done', s)).toBe(seq[i])
      const idle = take(c, (start + i) * 42_000, 'idle', s)
      if ((start + i) % 2) expect(idle).toBe(seq[i]); else expect(idle).toBeLessThan(4)
    }
    expect(new Set(seq.filter((_, i) => (start + i) % 2 === 1).slice(0, 7)).size).toBe(7)
  }
})
test('calendar shuffle: local days change the order, midnight never repeats, independent of call order', () => {
  const c = { ...START, lastActive: 0 }, orders = new Set<string>()
  for (let d = 1; d <= 90; d++) {
    const midnight = at(2026, 11, d, 0)
    const firstSlot = Math.ceil(midnight / 42_000)
    const seq = Array.from({ length: 7 }, (_, i) => take(c, (firstSlot + i) * 42_000, 'done', 'weekend'))
    orders.add(seq.join(','))
    expect(take(c, midnight, 'done', 'weekend')).not.toBe(take(c, midnight - 1, 'done', 'weekend'))
    const last = take(c, midnight - 1, 'done', 'weekend')
    expect(take(c, midnight, 'done', 'weekend')).not.toBe(last)
    expect(seq).toEqual(Array.from({ length: 7 }, (_, i) => take(c, (firstSlot + i) * 42_000, 'done', 'weekend')))
  }
  expect(orders.size).toBeGreaterThan(20)
})
const CALENDAR_PROPS = {
  friday: ['laptop', 'week-bar', 'ooo', 'disco', 'pizza', 'envelope'],
  weekend: ['sandcastle', 'fishing', 'kite', 'ball', 'blanket', 'game'],
  sundayNight: ['ironing', 'alarm-stack', 'inbox', 'battery', 'lunchbox', 'monday'],
} as const
test('calendar art: six new scenes per look have distinct props and authored body, eye and claw acting', () => {
  for (const s of ['friday', 'weekend', 'sundayNight'] as const) for (const m of (s === 'weekend' ? ['idle', 'done', 'doze'] : ['idle', 'done']) as Mood[]) {
    const svgs = Array.from({ length: 7 }, (_, i) => crabArt(m, 4 + i, s))
    expect(new Set(svgs).size).toBe(7)
    for (let i = 1; i <= 6; i++) {
      const svg = svgs[i]
      expect(svg).toContain(`class="cb-${CALENDAR_PROPS[s][i - 1]}"`)
      expect(svg).toContain('cb-authored')
      for (const part of ['cb-bd', 'cb-ey', 'cb-ar']) expect(svg).toContain(`.${part}{animation:`)
      expect(svg).toContain('14s ease-in-out infinite')
      expect(svg).not.toContain('#F4F3EE')
      for (const rect of svg.matchAll(/<rect x="[^"]+" y="(-?[\d.]+)"/g)) expect(Number(rect[1])).toBeGreaterThanOrEqual(8)
      for (const text of svg.matchAll(/<text([^>]*)>/g)) expect(text[1]).toContain('font-family="sans-serif"')
    }
  }
})
test('calendar captions: two distinct short lines for each new scene, deterministic and exclusive to its props', () => {
  const all = new Set<string>()
  for (const s of ['friday', 'weekend', 'sundayNight'] as const) {
    for (let t = 5; t <= 10; t++) {
      const lines = new Set(Array.from({ length: 80 }, (_, n) => pickLine('idle', n * 4, s, t)))
      expect(lines.size).toBe(2)
      for (const line of lines) {
        expect(all.has(line)).toBe(false); all.add(line)
        expect(line.length).toBeLessThanOrEqual(60); expect(line).not.toMatch(/\bor\b/i)
        for (let other = 4; other <= 10; other++) if (other !== t) {
          for (let n = 0; n < 8; n++) expect(pickLine('idle', n * 4, s, other)).not.toBe(line)
        }
        expect(pickLine('idle', 0, s, 0)).not.toBe(line)
      }
    }
    for (const line of SEASON_LINES[s]) expect(line).not.toMatch(/deck chair|cooler|alarm clock|calendar|drink|tie|clock/i)
    for (let n = 0; n < 32; n++) expect(pickLine('idle', n * 4, s, 5)).toBe(pickLine('idle', n * 4, s, 5))
  }
})

test('calendar caption history: prop lines are discarded on a different scene, base take, mood or season', () => {
  for (const s of ['friday', 'weekend', 'sundayNight'] as const) for (let i = 0; i < 7; i++) for (const line of CALENDAR_LINES[s][i]) {
    expect(lineFitsScene(line, 'idle', s, 4 + i)).toBe(true)
    expect(lineFitsScene(line, 'done', s, 4 + i)).toBe(true)
    expect(lineFitsScene(line, 'doze', s, 4 + i)).toBe(s === 'weekend')
    expect(lineFitsScene(line, 'idle', s, 0)).toBe(false)
    expect(lineFitsScene(line, 'read', s, 4 + i)).toBe(false)
    expect(lineFitsScene(line, 'idle', undefined, 4 + i)).toBe(false)
    for (let j = 0; j < 7; j++) if (j !== i) expect(lineFitsScene(line, 'idle', s, 4 + j)).toBe(false)
  }
  expect(lineFitsScene('Friday has entered the chat.', 'read')).toBe(true)
})
