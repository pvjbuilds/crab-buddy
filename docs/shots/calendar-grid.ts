// S14 review sheet: bun docs/shots/calendar-grid.ts [output.html]
// Open the output in Chromium: transparent stage, dark/light toggle, frozen beats and reduced-motion pose.
import { crabArt } from '../../hooks/art.ts'
import { writeFileSync } from 'node:fs'
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const looks = ['friday', 'weekend', 'sundayNight'] as const
const times = [0, 3, 6, 9, 12.6, 'still'] as const
let rows = ''
for (const look of looks) for (let scene = 0; scene < 7; scene++) {
  const key = `${look === 'friday' ? 'F' : look === 'weekend' ? 'W' : 'S'}${scene}`
  const svg = crabArt('idle', 4 + scene, look)
  const cells = times.map((time, i) => {
    const art = time === 'still' ? svg.replaceAll('@media (prefers-reduced-motion:reduce)', '@media all') : svg
    return `<div class="frame f${i}"><small>${time === 'still' ? 'reduced motion' : `${time} s`}</small>${art}${art.replace('width="38" height="30"', 'width="114" height="90"')}</div>`
  }).join('')
  // Each scene gets a document: SVG style rules cannot leak into another scene in the grid.
  const doc = `<style>body{margin:0;font:12px sans-serif;color:#8E929A;display:flex;gap:16px}.frame{width:130px;flex-shrink:0}small{display:block;margin-bottom:4px}svg{display:block}svg:first-of-type{width:52px;height:41px;margin-bottom:8px}${times.map((t, i) => typeof t === 'number' ? `.f${i} svg *{animation-play-state:paused!important;animation-delay:-${t}s!important}` : '').join('')}</style>${cells}`
  rows += `<section><b>${key} · ${look} · take ${4 + scene}</b><iframe title="${key} frame strip" srcdoc="${esc(doc)}"></iframe></section>`
}
const output = process.argv[2] ?? '/tmp/crab-s14-grid.html'
writeFileSync(output, `<!doctype html><meta charset="utf-8"><title>S14 calendar scenes</title><style>body{font:14px sans-serif;background:#151515;color:#C3CBD6;padding:20px}body.light{background:#fcfcfb;color:#1F1E1D}header{position:sticky;top:0;padding:10px;background:inherit;z-index:1}section{border-top:1px solid #8E929A;padding:12px 0}iframe{display:block;border:0;width:900px;height:170px;margin-top:8px}button{font:inherit}</style><header>S14 · 52 × 41 actual size, enlarged beneath · <button onclick="document.body.classList.toggle('light')">Toggle light / dark</button></header>${rows}`)
console.log(output)
