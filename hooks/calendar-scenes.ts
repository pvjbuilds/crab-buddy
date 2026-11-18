// S14: six extra scenes per calendar look. Scene zero remains in art.ts.
// Rect geometry uses the same transparent -6 -2 38 30 stage; props start at y >= 8.
import type { CalendarLook } from './crab.ts'
const I = '#1F1E1D', G = '#8E929A', B = '#7A4A26', Y = '#F5C542'
const FUR = '#C3CBD6', SKY = '#85B7EB', BLUE = '#378ADD', GREEN = '#1D9E75', RED = '#E24B4A', PINK = '#D4537E', SAND = '#C8A165'
const r = (x: number, y: number, w: number, h: number, c: string) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`
const g = (cls: string, body: string) => `<g class="${cls}">${body}</g>`
const text = (x: number, y: number, size: number, body: string, color = I) => `<text x="${x}" y="${y}" font-family="sans-serif" font-size="${size}" fill="${color}">${body}</text>`
const clock = (x: number, y: number, size = 7) => r(x, y, size, size, BLUE) + r(x + 1, y + 1, size - 2, size - 2, FUR)
  + r(x + size / 2, y + 1, 1, size / 2, I) + r(x + size / 2, y + size / 2, 2, 1, I)
const laptop = r(24, 25, 7, 1, G) + g('cb-lid', r(24, 18, 7, 7, I) + r(25, 19, 5, 4, SKY))
const shades = g('cb-drop-shades', r(8, 12, 5, 3, I) + r(13, 12, 5, 1, I) + r(18, 12, 5, 3, I))
const puff = (x: number, y: number) => r(x, y, 2, 1, FUR) + r(x + 1, y - 1, 1, 3, FUR)
export type CalendarSceneArt = { key: string; prop: string; beside: string; css: string }
export function calendarSceneArt(look: CalendarLook, scene: number): CalendarSceneArt | undefined {
  if (scene < 1 || scene > 6) return
  const key = `${look === 'friday' ? 'F' : look === 'weekend' ? 'W' : 'S'}${scene}`
  let css = '.cb-authored .cb-all,.cb-authored .cb-bd{transform-origin:50% 100%}.cb-authored .cb-ar,.cb-authored .cb-ey{transform-origin:50% 50%}', prop = '', beside = ''
  const anim = (selector: string, name: string, frames: string, timing = 'ease-in-out') => {
    const id = `cb-s14-${key}-${name}`
    css += `.cb-authored ${selector}{animation:${id} 14s ${timing} infinite}@keyframes ${id}{${frames}}`
  }
  // Each action has anticipation, a held response (at least 5% = .7 s), and a final payoff.
  const act = (eyes: string, claw: string, body: string) => {
    anim('.cb-ey', 'eyes', eyes); anim('.cb-ar', 'claw', claw); anim('.cb-bd', 'body', body)
  }
  const glance = '0%,12%,100%{transform:none}18%,32%{transform:translateX(2px)}40%,54%{transform:translateX(-1px)}76%,92%{transform:translateY(-1px)}'
  const reach = '0%,16%,100%{transform:none}20%,28%{transform:translate(1px,1px)}34%,48%{transform:translate(3px,3px)}52%,62%{transform:translate(1px,1px)}78%,90%{transform:translateY(-3px)}'
  const tired = '0%,16%,36%,64%,100%{transform:none}20%,28%{transform:translateY(1px)}42%,52%{transform:translateX(1px)}78%,94%{transform:translateY(1px)}'
  const bob = '0%,16%,36%,64%,100%{transform:none}20%,28%{transform:translateY(1px)}42%,52%{transform:translateX(-1px)}78%,90%{transform:translateY(-2px)}'
  switch (key) {
    case 'F1': // glance -> slam -> two dusts -> shades
      beside = g('cb-laptop', laptop)
      prop = shades + g('cb-dust', puff(27, 19) + puff(29, 22))
      css += '.cb-lid{transform-origin:50% 100%}'
      anim('.cb-lid', 'slam', '0%,30%{transform:scaleY(1)}34%,100%{transform:scaleY(.12)}')
      anim('.cb-dust', 'dust', '0%,46%,57%,68%,100%{opacity:0;transform:none}49%,54%,60%,65%{opacity:1;transform:translateX(1px)}')
      anim('.cb-drop-shades', 'shades', '0%,72%{opacity:0;transform:translateY(-3px)}78%,100%{opacity:1;transform:none}')
      act(glance, '0%,24%,44%,70%,100%{transform:none}28%{transform:translateY(-1px)}34%,40%{transform:translate(3px,7px)}49%,54%,60%,65%{transform:translate(2px,2px) rotate(-12deg)}78%,90%{transform:translateY(-2px)}', bob)
      break
    case 'F2': // five days -> flash -> hop
      beside = g('cb-week-bar', r(-6, 19, 9, 5, I) + Array.from({ length: 5 }, (_, i) =>
        r(-5 + i * 1.4, 20, 1, 3, FUR) + g(`cb-day${i}`, r(-5 + i * 1.4, 20, 1, 3, GREEN))).join(''))
      for (let i = 0; i < 5; i++) anim(`.cb-day${i}`, `tick${i}`, `0%,${12 + i * 11}%{opacity:0}${17 + i * 11}%,100%{opacity:1}`, 'steps(1)')
      anim('.cb-week-bar', 'flash', '0%,64%,76%,100%{opacity:1}68%{opacity:.35}72%{opacity:1}')
      act('0%,10%,100%{transform:none}17%,25%{transform:translateX(-2px)}28%,36%{transform:translateX(-1.5px)}39%,47%{transform:translateX(-1px)}50%,58%{transform:translateX(-.5px)}61%,72%{transform:none}80%,92%{transform:translateY(-1px)}', reach, bob)
      anim('.cb-all', 'hop', '0%,74%,94%,100%{transform:none}76%{transform:translateY(1px)}80%,88%{transform:translateY(-3px)}92%{transform:translateY(1px)}')
      break
    case 'F3': // hang -> swing -> tiptoe -> look back
      beside = g('cb-ooo', r(29, 13, 1, 13, B) + g('cb-sign', r(23, 17, 8, 5, SAND) + text(23.3, 20.7, 3.1, 'OOO')))
      css += '.cb-sign{transform-origin:80% 0}'
      anim('.cb-sign', 'hang', '0%,16%{transform:translateY(3px)}24%,30%{transform:rotate(-10deg)}38%,44%{transform:rotate(8deg)}52%,58%{transform:rotate(-3deg)}64%,100%{transform:none}')
      act('0%,14%,100%{transform:none}20%,32%{transform:translateX(2px)}60%,70%{transform:translateX(-1px)}82%,94%{transform:translateX(2px)}', reach, bob)
      anim('.cb-all', 'tiptoe', '0%,62%,100%{transform:none}66%{transform:translate(-1px,-1px)}72%,94%{transform:translateX(-2px)}')
      anim('.cb-la', 'step', '0%,64%,76%,100%{transform:none}68%,73%{transform:translateY(-1px)}')
      break
    case 'F4': // lower ball -> floor lights -> dance, bigger last
      beside = g('cb-disco', g('cb-mirror', r(-2, 8, 1, 2, G) + r(-4, 10, 5, 1, G) + r(-5, 11, 7, 4, G) + r(-4, 15, 5, 1, G) + r(-4, 12, 2, 1, FUR) + r(-1, 14, 2, 1, FUR))
        + g('cb-lights', r(-4, 26, 2, 1, PINK) + r(6, 26, 2, 1, BLUE) + r(16, 26, 2, 1, Y) + r(26, 26, 2, 1, GREEN)))
      anim('.cb-mirror', 'lower', '0%,12%{transform:translateY(-5px)}24%,100%{transform:none}')
      anim('.cb-lights', 'sweep', '0%,24%{opacity:0;transform:none}30%,38%{opacity:1;transform:translateX(2px)}46%,54%{opacity:1;transform:translateX(-2px)}66%,76%{opacity:1;transform:translateX(3px)}86%,100%{opacity:1;transform:none}')
      act(glance, '0%,22%,100%{transform:none}30%,38%{transform:translateY(-2px) rotate(-8deg)}46%,54%{transform:translateY(1px)}76%,90%{transform:translateY(-4px) rotate(-15deg)}', bob)
      anim('.cb-all', 'dance', '0%,24%,100%{transform:none}30%,38%{transform:translateX(-1px) rotate(-3deg)}46%,54%{transform:translateX(1px) rotate(3deg)}76%,90%{transform:translateY(-2px) rotate(-5deg)}')
      break
    case 'F5': // box -> lid -> slice -> bite -> happy bob
      beside = g('cb-pizza', g('cb-pizza-box', r(23, 23, 8, 3, SAND) + g('cb-pizza-lid', r(23, 22, 8, 1, RED))))
      prop = g('cb-pizza-mouth', r(21, 17, 2, 1, I)) + g('cb-slice', r(24, 20, 5, 1, B) + r(24, 21, 4, 1, Y) + r(25, 22, 2, 1, Y) + g('cb-bite', r(26, 23, 1, 1, Y)) + r(25, 21, 1, 1, RED))
      css += '.cb-pizza-lid{transform-origin:50% 100%}'
      anim('.cb-pizza-box', 'arrive', '0%,10%{transform:translateX(7px);opacity:0}20%,100%{transform:none;opacity:1}')
      anim('.cb-pizza-lid', 'open', '0%,26%{transform:none}34%,100%{transform:translateY(-3px) rotate(-12deg)}')
      anim('.cb-slice', 'eat', '0%,36%{opacity:0;transform:none}42%,50%{opacity:1;transform:none}58%,84%{opacity:1;transform:translate(-5px,-4px)}94%,100%{opacity:0;transform:translate(-5px,-4px)}')
      anim('.cb-pizza-mouth', 'mouth', '0%,52%,90%,100%{opacity:0}58%,84%{opacity:1}')
      anim('.cb-bite', 'bite', '0%,62%{opacity:1}68%,100%{opacity:0}')
      act(glance, reach, '0%,16%,36%,70%,100%{transform:none}20%,28%{transform:translateY(1px)}56%,64%{transform:translateX(1px)}78%,86%{transform:translateY(-2px)}90%,96%{transform:translateY(-1px)}')
      break
    case 'F6': // land -> inspect -> avert eyes -> push away
      beside = g('cb-envelope', r(24, 20, 7, 5, FUR) + r(25, 21, 1, 1, G) + r(26, 22, 3, 1, G) + r(29, 21, 1, 1, G)
        + r(27, 18, 4, 3, RED) + text(27.5, 20.5, 2.8, '9', FUR))
      anim('.cb-envelope', 'reject', '0%,10%{transform:translateY(-5px);opacity:0}18%,64%{transform:none;opacity:1}76%,100%{transform:translateX(8px);opacity:0}')
      act('0%,12%,100%{transform:none}20%,34%{transform:translateX(2px)}44%,58%{transform:translateX(-2px)}78%,94%{transform:translateX(-1px)}', '0%,18%,56%,94%,100%{transform:none}20%,28%{transform:translateY(1px)}62%,68%{transform:translate(1px,5px)}76%,86%{transform:translate(4px,5px)}', bob)
      break
    case 'W1': // tip bucket -> build -> flag -> wave -> shrug
      beside = g('cb-sandcastle', r(-6, 25, 10, 2, SAND) + g('cb-tower1', r(-4, 22, 6, 3, SAND)) + g('cb-tower2', r(-4, 19, 5, 3, SAND) + r(-4, 18, 1, 1, SAND) + r(0, 18, 1, 1, SAND))
        + g('cb-corner', r(-5, 22, 1, 3, SAND)) + g('cb-flag', r(-2, 15, 1, 4, B) + r(-1, 15, 3, 2, RED))
        + g('cb-wave', r(-6, 25, 9, 2, SKY) + r(-5, 24, 3, 1, BLUE)))
      prop = g('cb-bucket', r(24, 20, 5, 5, BLUE) + r(23, 19, 7, 1, FUR))
      anim('.cb-bucket', 'tip', '0%,12%,100%{transform:none}20%,32%{transform:rotate(-35deg)}40%,92%{transform:translateY(1px)}')
      for (let i = 1; i <= 2; i++) anim(`.cb-tower${i}`, `build${i}`, `0%,${20 + i * 10}%{opacity:0;transform:translateY(2px)}${26 + i * 10}%,100%{opacity:1;transform:none}`)
      anim('.cb-flag', 'flag', '0%,54%{opacity:0;transform:translateY(2px)}60%,100%{opacity:1;transform:none}')
      anim('.cb-wave', 'wave', '0%,66%,100%{transform:translateX(-10px);opacity:0}74%,80%{transform:translateY(-2px);opacity:1}88%,94%{transform:none;opacity:.7}')
      anim('.cb-corner', 'wash', '0%,30%{opacity:0}36%,74%{opacity:1}80%,100%{opacity:0}')
      act(glance, reach, bob)
      anim('.cb-ar', 'shrug', '0%,12%,94%,100%{transform:none}20%,32%{transform:translateY(2px)}40%,52%{transform:translateY(-1px)}84%,90%{transform:translateY(-4px) rotate(-12deg)}')
      break
    case 'W2': // bob -> tug -> fish flips -> hold high
      beside = g('cb-fishing', r(28, 13, 1, 11, B) + r(29, 13, 2, 1, B) + r(30, 14, 1, 10, G)
        + r(24, 26, 8, 1, SKY) + g('cb-float', r(29, 23, 3, 2, RED)))
      prop = g('cb-fish', r(24, 12, 5, 3, SKY) + r(23, 11, 1, 5, BLUE) + r(28, 12, 1, 1, I))
      anim('.cb-float', 'bob', '0%,12%,32%,52%,100%{transform:none}20%,26%,40%,46%{transform:translateY(1px)}60%,68%{transform:translateY(2px)}78%,94%{transform:none}')
      anim('.cb-fish', 'catch', '0%,64%{opacity:0;transform:translateY(10px)}70%{opacity:1;transform:translateY(4px) rotate(-15deg)}78%,94%{opacity:1;transform:none}100%{opacity:0;transform:none}')
      act(glance, '0%,16%,100%{transform:none}20%,28%{transform:translateY(1px)}58%,64%{transform:translateY(3px)}74%,94%{transform:translateY(-4px)}', bob)
      break
    case 'W3': // swoop -> follow -> gust -> step
      beside = g('cb-kite', g('cb-kite-sail', r(26, 8, 1, 1, RED) + r(25, 9, 3, 1, RED) + r(24, 10, 5, 1, RED) + r(23, 11, 7, 1, Y) + r(24, 12, 5, 1, Y) + r(25, 13, 3, 1, Y) + r(26, 14, 1, 1, Y) + r(26, 8, 1, 7, B))
        + g('cb-kite-string', r(26, 15, 1, 4, G) + r(25, 19, 1, 3, G) + r(24, 22, 1, 2, G)))
      anim('.cb-kite-sail', 'swoop', '0%,10%,100%{transform:none}20%,30%{transform:translate(-2px,2px) rotate(-10deg)}42%,54%{transform:translate(1px,1px) rotate(8deg)}74%,88%{transform:translate(1px,-2px) rotate(12deg)}')
      anim('.cb-kite-string', 'taut', '0%,60%,100%{transform:none}72%,90%{transform:translateX(1px)}')
      act('0%,10%,100%{transform:none}20%,30%{transform:translate(1px,-1px)}42%,54%{transform:translate(2px,-1px)}74%,90%{transform:translate(2px,-2px)}', reach, bob)
      anim('.cb-all', 'gust', '0%,64%,100%{transform:none}68%{transform:translate(-1px,1px)}76%,92%{transform:translateX(2px)}')
      anim('.cb-lb', 'step', '0%,68%,84%,100%{transform:none}74%,80%{transform:translateY(-1px)}')
      break
    case 'W4': // bounce three times -> eyes up -> catch
      prop = g('cb-ball', r(25, 16, 5, 5, FUR) + r(25, 17, 2, 3, RED) + r(28, 16, 2, 2, BLUE) + r(27, 19, 2, 2, Y))
      anim('.cb-ball', 'bounce', '0%,10%,30%,50%,100%{transform:none}18%,24%{transform:translateY(-3px)}38%,44%{transform:translateY(-4px)}60%,70%{transform:translateY(-8px)}82%,94%{transform:translate(-2px,-1px)}')
      act('0%,10%,30%,50%,100%{transform:none}18%,24%,38%,44%{transform:translate(1px,-1px)}60%,72%{transform:translate(1px,-2px)}82%,94%{transform:translateX(1px)}', '0%,12%,32%,52%,100%{transform:none}18%,24%,38%,44%{transform:translateY(-2px)}60%,70%{transform:translateY(-4px)}82%,94%{transform:translate(1px,1px)}', bob)
      break
    case 'W5': // sleep -> ring -> silence -> sleep
      beside = g('cb-sleep-alarm', clock(24, 20))
      prop = g('cb-blanket', r(7, 17, 16, 6, BLUE) + r(8, 17, 14, 1, FUR)) + g('cb-sleep-z', text(3, 11, 4, 'z', G) + text(0, 15, 3, 'z', G))
      css += '.cb-sleep-alarm{transform-origin:50% 100%}'
      anim('.cb-sleep-alarm', 'ring', '0%,30%,52%,100%{transform:none}34%,40%{transform:rotate(-8deg)}44%,50%{transform:rotate(8deg)}')
      anim('.cb-sleep-z', 'sleep', '0%,24%,74%,100%{opacity:1}30%,66%{opacity:0}')
      act('0%,24%,76%,100%{transform:scaleY(.2)}32%,44%{transform:scaleY(.8)}54%,64%{transform:translateX(2px) scaleY(.5)}', '0%,28%,76%,100%{transform:none}32%{transform:translateY(-1px)}46%,58%{transform:translate(3px,7px)}64%,70%{transform:translateY(2px)}', '0%,22%,72%,100%{transform:none}30%,40%{transform:translateY(1px)}54%,64%{transform:translateX(1px)}80%,92%{transform:translateY(1px)}')
      css += '@media (prefers-reduced-motion:reduce){.cb-authored .cb-ey{transform:scaleY(.2)}}'
      break
    case 'W6': // mash -> stars -> fist pump
      beside = g('cb-game', r(24, 16, 7, 8, I) + r(25, 17, 5, 4, BLUE) + r(26, 24, 3, 1, G) + r(28, 22, 2, 1, RED)
        + g('cb-game-stars', r(26, 18, 1, 3, Y) + r(25, 19, 3, 1, Y) + r(29, 18, 1, 1, Y)))
      anim('.cb-game-stars', 'win', '0%,64%{opacity:0}72%,100%{opacity:1}')
      anim('.cb-game', 'flash', '0%,66%,80%,100%{opacity:1}70%{opacity:.4}74%{opacity:1}')
      act(glance, '0%,14%,100%{transform:none}20%,28%,38%,46%,56%,64%{transform:translate(3px,6px)}32%,50%{transform:translate(2px,4px)}78%,92%{transform:translateY(-4px)}', bob)
      break
    case 'S1': // iron twice -> steam -> shirt up -> sigh
      beside = g('cb-ironing', r(0, 24, 30, 1, SAND) + r(2, 25, 1, 2, G) + r(28, 25, 1, 2, G)
        + g('cb-shirt', r(24, 18, 5, 6, FUR) + r(23, 17, 2, 3, FUR) + r(28, 17, 2, 3, FUR) + r(22, 18, 1, 2, FUR) + r(30, 18, 1, 2, FUR))
        + g('cb-iron', r(22, 22, 7, 2, BLUE) + r(24, 20, 3, 2, G)) + g('cb-steam', puff(25, 18) + puff(28, 16)))
      anim('.cb-iron', 'press', '0%,12%,100%{transform:none}20%,28%{transform:translateX(-4px)}36%,44%{transform:none}52%,60%{transform:translateX(-4px)}68%,100%{transform:none}')
      anim('.cb-steam', 'steam', '0%,60%,82%,100%{opacity:0;transform:none}66%,74%{opacity:1;transform:translateY(-1px)}')
      anim('.cb-shirt', 'lift', '0%,76%,100%{transform:none}82%,94%{transform:translateY(-5px)}')
      act(glance, reach, '0%,12%,36%,64%,100%{transform:none}20%,28%,52%,60%{transform:translateX(-1px)}82%,90%{transform:translateY(-1px)}94%,99%{transform:translateY(1px)}')
      prop = g('cb-s14-sigh', puff(23, 17))
      anim('.cb-s14-sigh', 'sigh', '0%,88%,100%{opacity:0;transform:none}92%,97%{opacity:1;transform:translateX(2px)}')
      break
    case 'S2': // one, two, three -> all ring -> wince
      beside = g('cb-alarm-stack', g('cb-alarm1', clock(-5, 19, 8)) + g('cb-alarm2', clock(-4, 13, 7)) + g('cb-alarm3', clock(-3, 8, 5)))
      for (let i = 1; i <= 3; i++) anim(`.cb-alarm${i}`, `stack${i}`, `0%,${i * 18 - 8}%{opacity:0;transform:translateY(-2px)}${i * 18}%,100%{opacity:1;transform:none}`)
      css += '.cb-alarm-stack{transform-origin:50% 50%}'
      anim('.cb-alarm-stack', 'ring', '0%,66%,80%,100%{transform:none}70%{transform:rotate(-4deg)}74%{transform:rotate(4deg)}78%{transform:rotate(-2deg)}')
      act('0%,12%,100%{transform:none}18%,30%{transform:translateX(-2px)}36%,48%{transform:translate(-2px,-1px)}54%,64%{transform:translate(-2px,-2px)}78%,94%{transform:scaleY(.35)}', reach, tired)
      break
    case 'S3': // 3 -> 12 -> 47 -> widen -> slow close
      beside = g('cb-inbox', laptop + g('cb-inbox-badge', r(24, 17, 7, 4, RED)
        + g('cb-inbox-old cb-count3', text(26, 20.2, 3.2, '3', FUR)) + g('cb-inbox-old cb-count12', text(24.5, 20.2, 3.2, '12', FUR))
        + g('cb-count47', text(24.5, 20.2, 3.2, '47', FUR))))
      css += '.cb-lid{transform-origin:50% 100%}.cb-inbox-old{opacity:0}'
      anim('.cb-count3', 'three', '0%,26%{opacity:1}32%,100%{opacity:0}', 'steps(1)')
      anim('.cb-count12', 'twelve', '0%,26%{opacity:0}32%,50%{opacity:1}56%,100%{opacity:0}', 'steps(1)')
      anim('.cb-count47', 'many', '0%,50%{opacity:0}56%,100%{opacity:1}', 'steps(1)')
      anim('.cb-lid', 'close', '0%,68%{transform:scaleY(1)}88%,100%{transform:scaleY(.12)}')
      anim('.cb-inbox-badge', 'hide', '0%,76%{opacity:1}88%,100%{opacity:0}')
      act('0%,12%,100%{transform:none}18%,28%{transform:translateX(1px)}34%,48%{transform:translateX(2px)}58%,74%{transform:translateX(2px) scaleY(1.5)}88%,96%{transform:scaleY(.5)}', reach, tired)
      break
    case 'S4': // drain -> red blink -> poke -> still red
      beside = g('cb-battery', r(24, 19, 7, 5, I) + r(26, 18, 3, 1, G) + r(25, 20, 5, 3, FUR)
        + g('cb-red-bar', r(25, 22, 5, 1, RED)) + g('cb-charge2', r(25, 21, 5, 1, GREEN)) + g('cb-charge3', r(25, 20, 5, 1, GREEN)))
      css += '.cb-charge2,.cb-charge3{opacity:0}'
      anim('.cb-charge3', 'drain3', '0%,18%{opacity:1}24%,100%{opacity:0}', 'steps(1)')
      anim('.cb-charge2', 'drain2', '0%,38%{opacity:1}44%,100%{opacity:0}', 'steps(1)')
      anim('.cb-red-bar', 'blink', '0%,48%,60%,74%,88%,100%{opacity:1}54%{opacity:.2}68%{opacity:.2}82%{opacity:.2}')
      act('0%,12%,100%{transform:none}20%,32%{transform:translateX(1px)}46%,58%{transform:translateX(2px)}80%,94%{transform:scaleY(.5)}', '0%,16%,58%,92%,100%{transform:none}22%,30%{transform:translateY(1px)}64%,70%{transform:translate(3px,6px)}78%,86%{transform:translate(1px,4px)}', tired)
      break
    case 'S5': // fill -> shut -> pat -> moon
      beside = g('cb-lunchbox', r(24, 22, 7, 4, BLUE) + g('cb-lunch-lid', r(24, 21, 7, 1, FUR)) + g('cb-lunch-item', r(26, 19, 3, 2, Y))
        + g('cb-lunch-moon', r(-4, 10, 1, 3, Y) + r(-3, 9, 2, 1, Y) + r(-3, 13, 2, 1, Y)))
      anim('.cb-lunch-item', 'pack', '0%,12%{transform:translateY(-5px)}24%,100%{transform:translateY(4px)}')
      anim('.cb-lunch-lid', 'shut', '0%,34%{transform:translateY(-4px)}44%,100%{transform:none}')
      act('0%,12%,100%{transform:none}20%,34%{transform:translateX(2px)}48%,62%{transform:translate(2px,1px)}78%,94%{transform:translate(-2px,-2px)}', '0%,16%,90%,100%{transform:none}20%,28%{transform:translateY(1px)}48%,54%{transform:translate(3px,6px)}60%,66%{transform:translate(2px,4px)}78%,86%{transform:translateY(1px)}', tired)
      break
    case 'S6': // MON arrives -> blanket up -> peek -> MON stays
      beside = g('cb-monday', text(-5.7, 19, 3.8, 'MON', BLUE))
      prop = g('cb-hide-blanket', r(7, 12, 16, 9, BLUE) + r(8, 12, 14, 1, FUR))
      anim('.cb-monday', 'arrive', '0%,10%{transform:translateX(-9px);opacity:0}32%,100%{transform:none;opacity:1}')
      anim('.cb-hide-blanket', 'hide', '0%,32%,100%{transform:translateY(6px)}44%,62%{transform:none}72%,84%{transform:translateY(3px)}92%,98%{transform:none}')
      act('0%,12%,100%{transform:none}20%,32%{transform:translateX(-2px)}44%,62%{transform:scaleY(.2)}72%,84%{transform:translateX(-2px)}92%,98%{transform:scaleY(.2)}', '0%,16%,100%{transform:none}22%,30%{transform:translateY(1px)}44%,62%{transform:translate(-2px,-2px)}72%,84%{transform:translate(-1px,1px)}92%,98%{transform:translate(-2px,-2px)}', tired)
      css += '@media (prefers-reduced-motion:reduce){.cb-authored .cb-hide-blanket{transform:translateY(3px)}}'
      break
  }
  return { key, prop, beside, css }
}
