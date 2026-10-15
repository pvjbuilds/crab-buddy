// The README shots, drawn from the real art: bun docs/shots/make.ts (needs Chrome and ffmpeg).
// Writes docs/app-dark.png, docs/app-light.png, docs/takes.png (every take, named), docs/social.png and the animated docs/hero.png
// (80 frames, 8 fps), and rebuilds docs/glossary.html.
import { stageArt, STATION, crabArt } from '../../hooks/art.ts'
import { LINES, MEANING, takes } from '../../hooks/crab.ts'
import '../glossary.ts'
import { chromium } from 'playwright-core'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const docs = fileURLToPath(new URL('..', import.meta.url)), FPS = 8, SCENE = 2000
const T = {
  dark: { outer: '#262624', win: '#1f1e1d', bar: '#1f1e1d', line: '#3a3936', bubble: '#2f2e2c', ink: '#ececea', mono: '#a8a7a2', band: '#151515', text: '#ececea', subtle: '#8a8984', prompt: '#30302e', pline: '#3f3e3b', ph: '#8a8984' },
  light: { outer: '#e8e6dc', win: '#faf9f5', bar: '#f0eee6', line: '#dedcd2', bubble: '#f0eee6', ink: '#1f1e1d', mono: '#5e5d59', band: '#fcfcfb', text: '#1f1e1d', subtle: '#8a8984', prompt: '#ffffff', pline: '#d6d4ca', ph: '#8a8984' },
}
const font = `-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif`
const band = (c: typeof T.dark, mood: Parameters<typeof stageArt>[0], lines: string[]) => `
  <div class="band" style="background:${c.band}">
    <div class="cap">${lines.map((l, i) => `<div style="color:${i ? c.subtle : c.text}">${l}</div>`).join('')}</div>
    <div class="stage">${stageArt(mood, 0)}</div>
  </div>`
const css = (c: typeof T.dark) => `
  *{box-sizing:border-box;margin:0}
  body{zoom:2;font-family:${font};background:${c.outer};width:736px;height:371px;padding:28px 28px 0;-webkit-font-smoothing:antialiased}
  .win{background:${c.win};border:1px solid ${c.line};border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.18)}
  .bar{background:${c.bar};height:34px;border-bottom:1px solid ${c.line};display:flex;align-items:center;padding-left:13px;gap:8px;font-size:12.5px;color:${c.mono}}
  .dot{width:11px;height:11px;border-radius:50%}
  .body{padding:20px 18px 18px}
  .q{margin-left:auto;width:fit-content;background:${c.bubble};color:${c.ink};padding:10px 14px;border-radius:12px;font-size:14px}
  .a{color:${c.ink};font-size:14px;margin:18px 8px 0}
  .t{color:${c.ink};font-size:13px;margin:6px 8px 0;display:flex;align-items:center;gap:6px}
  .t i{width:6px;height:6px;border-radius:50%;background:#2c9f73;display:inline-block}
  .t b{font-weight:600}.t code{font:12px ui-monospace,Menlo,monospace;color:${c.mono}}
  .band{display:flex;align-items:flex-end;gap:12px;padding:4px 8px 0;margin-top:12px;border-radius:8px 8px 0 0;height:48px}
  .cap{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:13.5px;line-height:18.5px;padding-bottom:4px}
  .stage{width:50%;height:41px;flex-shrink:0}.stage svg{display:block}
  .p{background:${c.prompt};border:1px solid ${c.pline};border-radius:12px;height:46px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;color:${c.ph};font-size:14px}
  .p span{font-size:12px}`
const app = (k: keyof typeof T) => {
  const c = T[k]
  return `<!doctype html><meta charset="utf-8"><style>${css(c)}</style><div class="win">
  <div class="bar"><span class="dot" style="background:#ff5f57"></span><span class="dot" style="background:#febc2e"></span><span class="dot" style="background:#28c840"></span><span style="margin-left:14px">Fix the failing date test</span></div>
  <div class="body">
    <div class="q">The date test fails on leap years. Can you fix it?</div>
    <div class="a">Reading the date helpers first, then fixing the leap-year branch.</div>
    <div class="t"><i></i><b>Read</b><code>src/date.ts</code></div>
    <div class="t"><i></i><b>Edit</b><code>src/date.ts</code></div>
    <div class="t"><i></i><b>Bash</b><code>npm test -- date</code></div>
    ${band(c, 'build', ['Hammering out the changes.', 'Skimming code at crab speed.'])}
    <div class="p">Reply to Claude…<span>Opus · Auto</span></div>
  </div></div>`
}
const moods = ['think', 'read', 'build', 'testp', 'done'] as const
const lines = [LINES.think[0], LINES.read[1], LINES.build[0], LINES.testp[0], LINES.done[0]]
const scenes = moods.map((m, i) => {
  const prev = moods[(i + moods.length - 1) % moods.length]
  return { svg: stageArt(m, 0, STATION[prev]), cap: [lines[i], lines[(i + lines.length - 1) % lines.length]] }
})
const html = `<!doctype html><meta charset="utf-8"><style>
  *{margin:0;box-sizing:border-box}body{width:560px;height:57px;background:#151515;-webkit-font-smoothing:antialiased;
  font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",sans-serif}
  .band{display:flex;align-items:flex-end;gap:12px;height:57px;padding:8px 12px 0}
  .cap{flex:1;min-width:0;white-space:nowrap;overflow:hidden;font-size:13.5px;line-height:18.5px;padding-bottom:4px}
  .cap div:first-child{color:#ececea}.cap div+div{color:#8a8984}
  .stage{width:50%;height:41px;flex-shrink:0}.stage svg{display:block}
</style><div class="band"><div class="cap" id="c"></div><div class="stage" id="s"></div></div>
<script>const S=${JSON.stringify(scenes)};window.show=i=>{s.innerHTML=S[i].svg;c.innerHTML=S[i].cap.map(l=>'<div>'+l+'</div>').join('')}</script>`

const b = await chromium.launch({ channel: 'chrome' })
const p = await b.newPage({ viewport: { width: 1472, height: 743 } })
for (const k of ['dark', 'light'] as const) {
  await p.setContent(app(k)); await p.waitForTimeout(6000)
  await p.screenshot({ path: `${docs}app-${k}.png` })
}
// Every take with the name the glossary uses for it, eleven to a row.
const all = (Object.keys(MEANING) as (keyof typeof MEANING)[]).flatMap(m => Array.from({ length: takes(m) }, (_, t) => [m, t] as const))
const sheet = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#151515;display:grid;grid-template-columns:repeat(11,1fr);
  gap:4px;padding:10px;width:1100px;font:12px ui-monospace,Menlo,monospace;color:#8a8984}figure{margin:0;text-align:center}
  img{width:95px;height:75px;image-rendering:pixelated}</style>${all.map(([m, t]) =>
  `<figure><img src="data:image/svg+xml;base64,${btoa(crabArt(m, t))}"><figcaption>${t ? m + t : m}</figcaption></figure>`).join('')}`
const s = await b.newPage({ viewport: { width: 1100, height: 400 }, deviceScaleFactor: 2 })
await s.setContent(sheet); await s.waitForTimeout(2500)
await s.screenshot({ path: `${docs}takes.png`, fullPage: true })
// The social card GitHub shows when the repo link is shared (Settings → Social preview takes it by hand).
const card = `<!doctype html><meta charset="utf-8"><style>*{margin:0;box-sizing:border-box}body{width:1280px;height:640px;background:#151515;color:#ececea;
  font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",sans-serif;padding:80px 90px;display:flex;flex-direction:column;justify-content:space-between}
  h1{font-size:84px;letter-spacing:-.02em}p{font-size:34px;color:#a8a7a2;margin-top:18px;max-width:1000px;line-height:1.3}
  .row{display:flex;gap:28px;align-items:flex-end}.row img{width:190px;height:150px;image-rendering:pixelated}
  small{font-size:24px;color:#8a8984}</style><div><h1>Crab Buddy</h1><p>An animated pixel-art crab that acts out what Claude Code is doing, right above your prompt. 0 tokens.</p></div>
  <div class="row">${(['think', 'read', 'build', 'test', 'testp'] as const).map((m, i) => `<img src="data:image/svg+xml;base64,${btoa(crabArt(m, [5, 4, 0, 7, 1][i]))}">`).join('')}</div>
  <small>claude plugin install crab-buddy@crab-buddy</small>`
const sc = await b.newPage({ viewport: { width: 1280, height: 640 } })
await sc.setContent(card); await sc.waitForTimeout(2500)
await sc.screenshot({ path: `${docs}social.png` })
// The hero: five looks, 2 s each, the crab walking from one spot to the next.
const frames = mkdtempSync(`${tmpdir()}/crab-hero-`)
const h = await b.newPage({ viewport: { width: 560, height: 57 }, deviceScaleFactor: 2 })
await h.setContent(html)
let n = 0
for (let i = 0; i < scenes.length; i++) {
  await h.evaluate(k => (window as any).show(k), i)
  const t0 = Date.now()
  for (let f = 0; f < (SCENE / 1000) * FPS; f++) {
    const wait = t0 + (f * 1000) / FPS - Date.now()
    if (wait > 0) await h.waitForTimeout(wait)
    await h.screenshot({ path: `${frames}/f${String(n++).padStart(3, '0')}.png` })
  }
}
await b.close()
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', `${frames}/f%03d.png`, '-plays', '0', '-f', 'apng', `${docs}hero.png`])
console.log('docs/app-dark.png, docs/app-light.png, docs/takes.png, docs/social.png, docs/hero.png')
