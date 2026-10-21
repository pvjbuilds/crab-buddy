// The crab's vocabulary, one word per part, drawn from the real art: bun docs/glossary.ts writes docs/glossary.html.
// Rerun it after any change to moods, takes, stations or lines, so the take atlas shows what ships.
import { crabArt, stageArt, STATION } from '../hooks/art.ts'
import { MEANING, LINES, takes, BUILDS } from '../hooks/crab.ts'
import type { Mood } from '../types'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))
const version = JSON.parse(readFileSync(`${here}../.claude-plugin/plugin.json`, 'utf8')).version
const moods = Object.keys(MEANING) as Mood[]
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Each take's SVG shares one big style block; only the scene's beat rules differ. Ship the block once and each take's
// own part, and let the page put them back together, so 110 animated takes weigh tens of kB, not megabytes.
const split = (s: string) => {
  const a = s.indexOf('<style>'), b = s.indexOf('</style>') + 8
  return { open: s.slice(0, a), style: s.slice(a, b), rest: s.slice(b) }
}
const base = split(crabArt('doze')).style, cut = base.indexOf('@media')
const atlas = moods.flatMap(m => Array.from({ length: takes(m) }, (_, t) => {
  const p = split(crabArt(m, t))
  if (!p.style.startsWith(base.slice(0, cut))) throw new Error(`${m}${t}: style block no longer shared`)
  return [t ? `${m}${t}` : m, m, p.style.slice(cut, cut + p.style.length - base.length), p.rest]
}))
const open = split(crabArt('doze')).open

const WHEN: Record<Mood, string> = {
  idle: 'No turn running', think: 'A turn starts, or after a short tool', read: 'Read, Grep, Glob',
  build: 'Edit, Write, most Bash; first build scene', saw: 'Second build scene', type: 'Third build scene',
  paint: 'Fourth build scene', gear: 'Fifth build scene', test: 'A test command (pytest, npm test, plugin test…)',
  testp: 'Tests passed', testf: 'Tests failed', debug: 'A command failed', dizzy: 'Three failures in a row',
  fixed: 'Tests pass after a failure', done: 'The turn ended', doze: '10 min with nothing happening',
  night: 'Idle between midnight and 5 am', web: 'WebSearch, WebFetch', sub: 'A subagent (Agent, Task)',
  codex: 'Bash running codex or agy', git: 'git commit, git push', inst: 'npm/pip/brew/uv install',
  ask: 'A question or permission prompt waits on you', long: 'Turn past 5 min, alternating with the work',
  comp: 'A compaction really runs (not a vetoed one)',
}

type Term = [term: string, what: string, say: string, code: string]
const GROUPS: [string, string, Term[]][] = [
  ['places', 'Where things are on screen', [
    ['band', 'The strip Crab Buddy draws right above the prompt box. Crab height, never taller.', 'the band is too tall; band colour', '<code>register.tsx</code> · <code>ui.render</code> AbovePrompt · box <code>crab-fill</code> (never rename: other mods find the band by it)'],
    ['caption', 'Left half of the band: two one-liners, the newest on top in full colour, the one before it dimmer. It scrolls down like a terminal.', 'top line, second line, caption colour', '<code>crab-text</code> box · <code>look.log</code> (2 lines)'],
    ['status lines', 'Other plugins\' status lines, drawn in the band above the caption instead of piling up in the footer.', 'other mods\' lines', '<code>lines</code> atom · <code>setLine()</code> · <code>FOOTER</code> (exceptions kept in the footer)'],
    ['stage', 'Right half of the band (desktop app). The crab walks across it.', 'stage width, stage edge', '<code>stageArt()</code> in <code>art.ts</code>'],
    ['station', 'The crab\'s spot on the stage for a mood: 0 is the stage\'s left end, 1 the right edge by the prompt.', 'move read\'s station left', '<code>STATION</code> in <code>art.ts</code>'],
    ['corner', 'Fallback when the window is too narrow for a stage: the crab sits in the corner and does not walk.', 'corner mode', '<code>register.tsx</code>, narrow branch'],
    ['label', 'The pill over the crab\'s head while the pointer is on it. Shows the mood\'s meaning; stays 3 s after the pointer leaves.', 'hover label, tip', '<code>MEANING</code> · <code>.st-tip</code>'],
  ]],
  ['acting', 'What the crab does', [
    ['mood', 'What Claude is doing, as one of 25 ids (think, read, build, test…). Tool calls and turn events pick it.', 'the test mood', '<code>Mood</code> in <code>types</code> · <code>classify()</code>, <code>step()</code>, <code>shown()</code> in <code>crab.ts</code>'],
    ['look', 'What the band shows right now: a mood, one of its takes and the caption. A <b>switch</b> is the look changing.', 'the look switches too often', '<code>look</code> atom · <code>show()</code> in <code>register.tsx</code>'],
    ['take', 'One version of a mood. Take 0 carries the mood\'s plain name (<code>think</code>), the others a number (<code>think1</code> to <code>think8</code>). Busy moods have 9, each build scene 2, the rest 4. See the atlas below.', 'think5 is my favourite; drop read7', 'take 0: <code>LOOK</code> · others: <code>TAKE</code> · CSS <code>.cb-think5</code> · count: <code>takes()</code>'],
    ['scene', 'The 14 s a take plays for: work, a beat, more work, a second beat. Then the next take.', 'scene length; a longer scene', '<code>SCENE</code> in <code>crab.ts</code> and <code>14s</code> in <code>scene()</code>, <code>art.ts</code>: change both'],
    ['work loop', 'The take\'s own short motion, repeating inside the scene: the hammer swing every 4 s, the saw every 0.5 s.', 'think5\'s work loop is too fast', 'the take\'s CSS rules, <code>.cb-&lt;take&gt;</code> in <code>art.ts</code>'],
    ['beat', 'A short break where the whole crab moves: hop, admire, turn, stretch, shimmy or tilt. Two per scene, at about 4.8–6.2 s and 10.1–11.5 s. A take always gets the same pair, picked from its id.', 'bigger beats; one beat per scene; no turn beat', '<code>BEATS</code>, <code>WINDOW</code>, <code>scene()</code> in <code>art.ts</code>'],
    ['emote', 'The tiny icon over the crab\'s shoulder during a beat: bang (!), note (♪), spark, ask (?), love (heart), sweat (drop).', 'no hearts on test; bigger emotes', '<code>EMOTE</code> in <code>art.ts</code>'],
    ['glum moods', 'testf, debug, dizzy, long, ask. Their emotes are only sweat, ask or bang, never a heart.', 'make long glum too', '<code>GLUM</code> in <code>art.ts</code>'],
    ['prop', 'A thing on the crab\'s body or claw: magnifier, flask, coffee cup.', 'bigger magnifier', 'first slot of a <code>LOOK</code>/<code>TAKE</code> entry · <code>.cb-pr</code>'],
    ['set', 'A thing standing beside the crab: the wall, laptop, easel, gears.', 'move the laptop closer', 'second slot ("beside") of a <code>LOOK</code>/<code>TAKE</code> entry'],
    ['claw height', 'Where the front claw rests for a take (14 is resting).', 'raise the claw', 'third slot of a <code>LOOK</code>/<code>TAKE</code> entry'],
    ['build scene', 'One of the five moods a build rotates through, 14 s each: <code>build</code> (hammer and wall), <code>saw</code>, <code>type</code> (laptop), <code>paint</code>, <code>gear</code>.', 'swap the order of build scenes', '<code>BUILDS</code> in <code>crab.ts</code>'],
    ['lap', 'One pass through the five build scenes (70 s). Lap 2 plays each scene\'s take 1: weld, drill, blueprint, sweep, crane. So 10 scenes, 140 s, before one repeats.', 'a third lap', '<code>take()</code> in <code>crab.ts</code>'],
    ['walk-in', 'The sideways scuttle from where the crab stands to the new look\'s station. The whole stage takes 4.8 s; never under 0.8 s.', 'faster walk-in', '<code>walkFor()</code> in <code>art.ts</code>'],
    ['roam', 'A slow drift about the station on a long loop: idle 80 s, think 24 s, read 32 s, web 12 s, done 10 s, long 40 s. Paint walks right once.', 'idle roams too far', '<code>ROAM</code> in <code>art.ts</code>'],
    ['stage extras', 'Stage-wide effects behind the crab: the brick wall (build), paint stripe (paint), confetti (fixed), footprints (walk-in), the trip (testf), mini crabs (sub), and by web take the rings (antenna) or the sea and its curl (surf). Hidden under reduce motion.', 'more confetti; no footprints', '<code>stageArt()</code>, <code>.st-fx</code>'],
    ['walking takes', 'Takes that walk their legs the whole time: inst, codex, think3, done2.', 'make read walk', '<code>WALKS</code> in <code>art.ts</code>'],
    ['terminal crab', 'The block-character crab in a terminal. One look per mood, a frame every 150 ms. No takes, scenes, beats or stage there.', 'the terminal crab', '<code>term.tsx</code> · <code>LOOKS</code>, <code>FRAME</code>'],
  ]],
  ['clocks', 'Timing', [
    ['dwell', '8 s. The least time a look stays before a new mood replaces it. "Slow the switching" usually means this.', 'dwell 5 s', '<code>DWELL</code> in <code>register.tsx</code>'],
    ['cut', 'Looks that break through the dwell at once: debug, dizzy, testf, testp, fixed, done, ask, comp.', 'let read cut in', '<code>CUT</code> in <code>register.tsx</code>'],
    ['hold', '5 s. How long a result look (an error, a test result, fixed) and done stay before the crab moves on.', 'hold done longer', '<code>HOLD</code>, <code>DONE</code> in <code>crab.ts</code>'],
    ['calm take', '42 s. Idle, doze and night keep a take for three scenes.', 'idle changes take too often', '<code>CALM</code> in <code>crab.ts</code>'],
    ['long turn', 'Past 5 min, a turn alternates the long look with the work, 8 s each.', 'long kicks in at 10 min', '<code>LONG</code>, <code>SWAP</code> in <code>crab.ts</code>'],
    ['doze / night owl', 'Doze after 10 min with nothing happening. Night owl replaces idle between midnight and 5 am, local time.', 'doze after 20 min', '<code>DOZE</code>, <code>localHour()</code> in <code>crab.ts</code>'],
    ['tick', 'Every second the band re-checks which look is due. Animation itself is pure CSS and costs no hook calls.', '', '<code>$.clock.every(1_000)</code> in <code>register.tsx</code>'],
  ]],
  ['words', 'Text', [
    ['one-liner', 'A caption line. Ten per mood, fifteen for the busy moods; all build scenes share one list. Picked by the moment the mood came up.', 'add five one-liners to git', '<code>LINES</code>, <code>BUILD_LINES</code> in <code>crab.ts</code>'],
    ['meaning', 'The plain description on the hover label. Said with certainty: no "or".', 'reword the meaning of codex', '<code>MEANING</code> in <code>crab.ts</code>'],
  ]],
]

const CONFUSED: [string, string][] = [
  ['mood vs look vs take', 'A <b>mood</b> is what Claude is doing. A <b>take</b> is one way the crab acts it. The <b>look</b> is the mood and take on screen right now.'],
  ['scene vs build scene', 'Every take plays as a 14 s <b>scene</b>. A <b>build scene</b> is one of the five moods a build rotates through (build, saw, type, paint, gear).'],
  ['beat vs work loop', 'The <b>work loop</b> is the take\'s own repeating motion. A <b>beat</b> is the break from it, twice per scene, the same six moves for every take.'],
  ['prop vs set vs stage extra', 'A <b>prop</b> is on the crab, a <b>set</b> stands beside it, a <b>stage extra</b> spans the whole stage behind it.'],
  ['dwell vs hold vs scene', '<b>Dwell</b> (8 s): the least a look stays. <b>Hold</b> (5 s): how long a result shows. <b>Scene</b> (14 s): how long one take plays before the next.'],
  ['animation', 'Too vague on its own. Say which: the take, its work loop, a beat, an emote, the walk-in or a stage extra.'],
]

const ASK: [string, string][] = [
  ['Make <b>think5\'s work loop</b> slower.', 'One take\'s CSS rule: <code>.cb-think5</code> in <code>art.ts</code>.'],
  ['Make the <b>beats</b> bigger, or keep one <b>beat</b> per scene.', '<code>BEATS</code> or <code>WINDOW</code> in <code>art.ts</code>.'],
  ['<b>Dwell</b> 5 s instead of 8.', '<code>DWELL</code> in <code>register.tsx</code>.'],
  ['Move <b>read\'s station</b> left.', '<code>STATION.read</code> in <code>art.ts</code>.'],
  ['Add five <b>one-liners</b> to git.', '<code>LINES.git</code> in <code>crab.ts</code>.'],
  ['A new <b>take</b> for web: a fishing rod.', 'A <code>TAKE</code> entry, its CSS and the count in <code>takes()</code>.'],
  ['A new <b>mood</b> for a deploy.', 'The <code>Mood</code> type, <code>classify()</code>, <code>MEANING</code>, <code>LINES</code>, <code>STATION</code>, <code>LOOK</code> and <code>term.tsx</code>.'],
]

const termRows = GROUPS.map(([id, title, rows]) => `
  <section id="${id}"><h2>${title}</h2>
  <div class="wrap"><table class="terms"><thead><tr><th>Term</th><th>What it is</th><th>Say it like</th><th>Lives in</th></tr></thead><tbody>
  ${rows.map(([t, w, s, c]) => `<tr data-q="${esc((t + ' ' + w + ' ' + s).toLowerCase())}"><td class="t">${t}</td><td>${w}</td><td class="say">${s ? `“${s}”` : ''}</td><td class="code">${c}</td></tr>`).join('')}
  </tbody></table></div></section>`).join('')

const moodRows = moods.map(m => `<tr data-q="${m} ${esc(MEANING[m].toLowerCase())}"><td class="t"><code>${m}</code></td><td>${esc(MEANING[m])}</td><td>${WHEN[m]}</td><td class="n">${takes(m)}</td><td class="n">${STATION[m]}</td><td class="n">${LINES[m].length}</td></tr>`).join('')

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Crab Buddy Glossary</title>
<meta name="description" content="The words for every part of Crab Buddy's animated crab: band, stage, station, mood, look, take, scene, beat, emote, dwell and more, each with where it lives in the code.">
<style>
:root{--bg:#faf9f5;--panel:#f0eee6;--ink:#1f1e1d;--sub:#5e5d59;--line:#dedcd2;--accent:#c4613f;--code:#ebe8de;--band:#fcfcfb}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#1f1e1d;--panel:#262624;--ink:#ececea;--sub:#a8a7a2;--line:#3a3936;--accent:#e08a68;--code:#30302e;--band:#151515}}
:root[data-theme="dark"]{--bg:#1f1e1d;--panel:#262624;--ink:#ececea;--sub:#a8a7a2;--line:#3a3936;--accent:#e08a68;--code:#30302e;--band:#151515}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 -apple-system,BlinkMacSystemFont,"Helvetica Neue",sans-serif;-webkit-font-smoothing:antialiased}
main{max-width:1080px;margin:0 auto;padding:32px 16px 64px}
h1{font-size:28px;margin:0 0 4px}h2{font-size:19px;margin:40px 0 10px;padding-top:8px;border-top:1px solid var(--line)}
.lead{color:var(--sub);margin:0 0 20px;max-width:720px}
nav{display:flex;flex-wrap:wrap;gap:6px 14px;margin:0 0 18px;font-size:14px}nav a{color:var(--accent);text-decoration:none}
code{font:12.5px ui-monospace,Menlo,monospace;background:var(--code);padding:1px 4px;border-radius:4px}
input{width:100%;max-width:420px;font:inherit;padding:8px 12px;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--ink)}
.wrap{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:14px}th{text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--sub);font-weight:600}
th,td{padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}td.t{font-weight:600;white-space:nowrap}td.say{color:var(--sub);font-style:italic}
td.code{font-size:13px;color:var(--sub)}td.n{text-align:right;font-variant-numeric:tabular-nums}
table.terms td:nth-child(2){min-width:260px}table.terms td.code{min-width:220px}
.mock{background:var(--band);border:1px solid var(--line);border-radius:10px 10px 0 0;display:flex;align-items:flex-end;gap:12px;height:57px;padding:8px 12px 0}
.mock .cap{flex:1;min-width:0;white-space:nowrap;overflow:hidden;font-size:13.5px;line-height:18.5px;padding-bottom:4px}
.mock .cap div+div{color:var(--sub)}.mock .stage{width:50%;height:41px;flex-shrink:0;outline:1px dashed var(--accent);outline-offset:2px}.mock .stage svg{display:block}
.prompt{border:1px solid var(--line);border-top:0;border-radius:0 0 10px 10px;height:40px;background:var(--panel);color:var(--sub);font-size:13px;display:flex;align-items:center;padding:0 14px}
.keys{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px 18px;margin:12px 0 0;font-size:14px}.keys b{color:var(--accent)}
.timeline{position:relative;height:56px;margin:16px 0 4px;background:var(--panel);border-radius:8px}
.timeline span{position:absolute;top:0;bottom:0;display:flex;align-items:center;justify-content:center;font-size:12px;border-radius:6px}
.timeline .w{background:transparent;color:var(--sub)}.timeline .b{background:var(--accent);color:#fff;font-weight:600}
.ticks{position:relative;height:18px;font-size:11px;color:var(--sub)}.ticks span{position:absolute;transform:translateX(-50%);white-space:nowrap}.ticks span:first-child{transform:none}.ticks span:last-child{transform:translateX(-100%)}
.pairs{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:10px}.pair{background:var(--panel);border-radius:8px;padding:10px 14px}.pair h3{margin:0 0 4px;font-size:14px}
.pair p{margin:0;font-size:14px;color:var(--sub)}.pair b{color:var(--ink)}
.atlas{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:8px}
figure{margin:0;background:var(--band);border:1px solid var(--line);border-radius:8px;padding:6px 4px 4px;text-align:center}
figure img{width:95px;height:75px;image-rendering:pixelated}figcaption{font:12px ui-monospace,Menlo,monospace;color:var(--sub)}
.row-h{grid-column:1/-1;margin:12px 0 0;font-size:13px;color:var(--sub)}.row-h b{color:var(--ink)}
[hidden]{display:none!important}footer{margin-top:48px;font-size:13px;color:var(--sub)}
</style></head><body><main>
<h1>Crab Buddy glossary</h1>
<p class="lead">One word for each part of the crab, so a change can be asked for in one sentence. Each term says what it is, how to say it, and where it lives in the code. Version ${version}. Regenerate with <code>bun docs/glossary.ts</code>.</p>
<nav><a href="#map">The map</a><a href="#scene-anatomy">A scene, second by second</a><a href="#places">Places</a><a href="#acting">Acting</a><a href="#clocks">Timing</a><a href="#words">Text</a><a href="#confused">Easy to mix up</a><a href="#ask">How to ask</a><a href="#moods">All 25 moods</a><a href="#atlas">Take atlas</a></nav>
<input id="q" type="search" placeholder="Filter terms and moods: beat, dwell, station…" aria-label="Filter terms and moods">

<section id="map"><h2>The map</h2>
<div class="mock"><div class="cap"><div>Hammering out the changes.</div><div>Skimming code at crab speed.</div></div><div class="stage">${stageArt('build', 0, STATION.read)}</div></div>
<div class="prompt">Reply to Claude…</div>
<div class="keys"><div><b>band</b>: the whole strip</div><div><b>caption</b>: the two lines, left</div><div><b>stage</b>: the dashed half, right</div><div><b>station</b>: where the crab stops on it</div><div><b>set</b>: the wall beside the crab</div><div><b>stage extra</b>: the bricks rising</div></div>
</section>

<section id="scene-anatomy"><h2>A scene, second by second</h2>
<p class="lead">Every take plays as a 14 s scene. The work loop runs throughout; the whole crab breaks for two beats, each with an emote.</p>
<div class="timeline">
<span class="w" style="left:0;width:34%">work loop</span><span class="b" style="left:34%;width:10%">beat 1</span>
<span class="w" style="left:44%;width:28%">work loop</span><span class="b" style="left:72%;width:10%">beat 2</span><span class="w" style="left:82%;width:18%">work</span></div>
<div class="ticks"><span style="left:0">0 s</span><span style="left:34%">4.8 s</span><span style="left:44%">6.2 s</span><span style="left:72%">10.1 s</span><span style="left:82%">11.5 s</span><span style="left:100%">14 s, next take</span></div>
</section>

${termRows}

<section id="confused"><h2>Easy to mix up</h2><div class="pairs">
${CONFUSED.map(([h, p]) => `<div class="pair"><h3>${h}</h3><p>${p}</p></div>`).join('')}
</div></section>

<section id="ask"><h2>How to ask for a change</h2>
<p class="lead">Name the <b>part</b>, then the <b>mood or take</b>, then the change. One term is enough to find the code.</p>
<div class="wrap"><table><thead><tr><th>Say</th><th>What changes</th></tr></thead><tbody>
${ASK.map(([s, c]) => `<tr><td>${s}</td><td class="code">${c}</td></tr>`).join('')}
</tbody></table></div></section>

<section id="moods"><h2>All 25 moods</h2>
<div class="wrap"><table><thead><tr><th>Mood</th><th>Meaning (hover label)</th><th>Shows when</th><th>Takes</th><th>Station</th><th>Lines</th></tr></thead><tbody>${moodRows}</tbody></table></div>
<p class="lead">Build scenes rotate in this order: ${BUILDS.map(b => `<code>${b}</code>`).join(' → ')}.</p></section>

<section id="atlas"><h2>Take atlas</h2>
<p class="lead">Every take, live, with the name to use for it. Take 0 has the mood's plain name.</p>
<div class="atlas" id="atlas-grid"></div></section>

<footer>Crab Buddy is a fan project, not made or endorsed by Anthropic. Generated from <code>hooks/art.ts</code> and <code>hooks/crab.ts</code>.</footer>
</main>
<script>
const OPEN=${JSON.stringify(open)},BASE=${JSON.stringify(base)},CUT=${cut},T=${JSON.stringify(atlas)};
const grid=document.getElementById('atlas-grid');let last='';
for(const [id,m,sc,rest] of T){
  if(m!==last){const h=document.createElement('div');h.className='row-h';h.dataset.q=m;h.innerHTML='<b>'+m+'</b>';grid.append(h);last=m}
  const f=document.createElement('figure');f.dataset.q=id+' '+m;
  const img=new Image();img.alt=id;img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(OPEN+BASE.slice(0,CUT)+sc+BASE.slice(CUT)+rest);
  const c=document.createElement('figcaption');c.textContent=id;f.append(img,c);grid.append(f)}
const q=document.getElementById('q');
q.addEventListener('input',()=>{const v=q.value.trim().toLowerCase();
  for(const el of document.querySelectorAll('[data-q]'))el.hidden=!!v&&!el.dataset.q.includes(v)});
</script></body></html>
`
writeFileSync(`${here}glossary.html`, html)
console.log(`docs/glossary.html: ${atlas.length} takes, ${(html.length / 1024).toFixed(0)} kB`)
