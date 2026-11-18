// The README GIF: bun docs/shots/hero-gif.ts (needs Chrome and ffmpeg). Six looks, ~13 s, drawn from the real stage art:
// think, build, tests pass, a new mood (browse), a calendar look (Christmas), and a pet (pointer on the crab, then a press).
import { stageArt, STATION } from '../../hooks/art.ts'
import { LINES, MEANING } from '../../hooks/crab.ts'
import { chromium } from 'playwright-core'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const docs = fileURLToPath(new URL('..', import.meta.url)), FPS = 8
type Scene = { mood: Parameters<typeof stageArt>[0], take: number, secs: number, cap: string[], season?: 'christmas', prev?: number, pet?: boolean }
const scenes: Scene[] = [
  { mood: 'think', take: 1, secs: 1.5, cap: [LINES.think[0], LINES.idle[0]] },
  { mood: 'build', take: 0, secs: 2, cap: [LINES.build[0], LINES.think[0]], prev: STATION.think },
  { mood: 'testp', take: 0, secs: 1.5, cap: [LINES.testp[0], LINES.build[0]], prev: STATION.build },
  { mood: 'browse', take: 0, secs: 1.5, cap: ['Driving a browser and the screen.', LINES.testp[0]], prev: STATION.testp },
  { mood: 'idle', take: 0, secs: 2, cap: ['It is nearly Christmas.', 'Driving a browser and the screen.'], season: 'christmas', prev: STATION.browse },
  { mood: 'done', take: 0, secs: 6, cap: [LINES.done[0], 'It is nearly Christmas.'], prev: STATION.idle, pet: true },
]
const html = `<!doctype html><meta charset="utf-8"><style>
  *{margin:0;box-sizing:border-box}body{width:800px;height:57px;background:#151515;-webkit-font-smoothing:antialiased;font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",sans-serif}
  .band{display:flex;align-items:flex-end;gap:12px;height:57px;padding:8px 12px 0}
  .cap{flex:1;min-width:0;white-space:nowrap;overflow:hidden;font-size:13.5px;line-height:18.5px;padding-bottom:4px}
  .cap div:first-child{color:#ececea}.cap div+div{color:#8a8984}
  .stage{width:50%;height:41px;flex-shrink:0}.stage svg{display:block}
</style><div class="band"><div class="cap" id="c"></div><div class="stage" id="s"></div></div>`
const b = await chromium.launch({ channel: 'chrome' })
const p = await b.newPage({ viewport: { width: 800, height: 57 }, deviceScaleFactor: 2 })
await p.setContent(html)
const frames = mkdtempSync(`${tmpdir()}/crab-gif-`)
let n = 0
for (const sc of scenes) {
  const svg = stageArt(sc.mood, sc.take, sc.prev ?? STATION[sc.mood], MEANING[sc.mood], undefined, sc.season, 2026)
  await p.evaluate(([s, c]) => { (document.getElementById('s') as HTMLElement).innerHTML = s; (document.getElementById('c') as HTMLElement).innerHTML = c.map(l => '<div>' + l + '</div>').join('') }, [svg, sc.cap] as const)
  const t0 = Date.now()
  for (let f = 0; f < sc.secs * FPS; f++) {
    const wait = t0 + (f * 1000) / FPS - Date.now()
    if (wait > 0) await p.waitForTimeout(wait)
    if (sc.pet && f >= 24) {
      // The crab wanders slowly, so the pointer follows it: on the crab (wave), pressed at f 30 (hop and bubble), released at 36.
      const r = await p.evaluate(() => { const e = document.querySelector('.st-zc')!.getBoundingClientRect(); return { x: e.x + e.width / 2, y: e.y + e.height / 2 } })
      await p.mouse.move(r.x, r.y)
      if (f === 30) await p.mouse.down()
      if (f === 36) await p.mouse.up()
    }
    await p.screenshot({ path: `${frames}/f${String(n++).padStart(3, '0')}.png` })
  }
}
await b.close()
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', `${frames}/f%03d.png`, '-vf', 'scale=800:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=none', '-loop', '0', `${docs}hero.gif`])
console.log('docs/hero.gif', n, 'frames')
