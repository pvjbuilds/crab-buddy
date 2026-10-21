// The crab from Claude's new-session screen, drawn on the 30×28 grid of _shared/crab.ts (crabBody), with
// one prop and one CSS motion per mood. Pure CSS, run by the compositor: no redraws while it plays.
// Approved in two previews on 11 Oct 2026 (9 base states + 14 extras). Every motion eases at the screen
// rate (Praj, 12 Oct: "butter smooth"); only the typing cursor blinks hard, like a real one. Classes carry
// a cb- prefix so they never meet the handoff crab's `.run` rules if a surface inlines both.
import type { Mood } from '../types'

const O = '#D97757', I = '#1F1E1D', G = '#8E929A', B = '#7A4A26', Y = '#F5C542', CREAM = '#E8DCC8', DIM = '#9A9890'
const r = (x: number, y: number, w: number, h: number, c: string) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`
const g = (cls: string, body: string) => `<g class="${cls}">${body}</g>`

const CSS = `<style>
.cb g{transform-box:fill-box}
@keyframes cb-bob{50%{transform:translateY(1px)}}@keyframes cb-st{50%{transform:translateY(-1px)}}
@keyframes cb-bl{50%{opacity:.15}}@keyframes cb-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
.cb-walk .cb-la{animation:cb-st .4s ease-in-out infinite}.cb-walk .cb-lb{animation:cb-st .4s ease-in-out infinite -.2s}
.cb-idle .cb-bd{animation:cb-bob 2s ease-in-out infinite}
.cb-idle .cb-ey{transform-origin:50% 50%;animation:cb-blink 4s infinite,cb-sqz 30s infinite}
.cb-idle .cb-mo{transform-origin:50% 0;transform:scaleY(0);animation:cb-yawn 30s infinite}
.cb-idle .cb-ar{animation:cb-hi 30s ease-in-out infinite}.cb-idle .cb-all{animation:cb-side 30s infinite}
@keyframes cb-yawn{0%,8%,16%,100%{transform:scaleY(0)}10%,14%{transform:scaleY(1)}}@keyframes cb-sqz{10%,14%{transform:scaleY(.4)}}
@keyframes cb-hi{0%,40%,42%,44%,46%,100%{transform:translateY(0)}41%,43%,45%{transform:translateY(-4px)}}
@keyframes cb-side{0%,70%,82%,100%{transform:translateX(0)}74%{transform:translateX(-2px)}78%{transform:translateX(-4px)}}
.cb-think .cb-ey{animation:cb-look 2s ease-in-out infinite}.cb-think .cb-all{transform-origin:50% 100%;animation:cb-sway 2s ease-in-out infinite}
@keyframes cb-look{30%{transform:translateX(-1px)}60%{transform:translateX(1px)}}@keyframes cb-sway{50%{transform:rotate(-4deg)}}
.cb-read .cb-ey{animation:cb-scan 1.2s ease-in-out infinite}.cb-read .cb-pr{animation:cb-mag 1.2s ease-in-out infinite}
@keyframes cb-scan{50%{transform:translateX(1px)}}@keyframes cb-mag{50%{transform:translate(-2px,1px)}}
.cb-build .cb-ey{transform:translateX(-1px)}.cb-build .cb-rl{animation:cb-rl 4s linear infinite}.cb-build .cb-rl g{animation:cb-scan .6s ease-in-out infinite}
.cb-build .cb-hm{animation:cb-hm 4s linear infinite}.cb-build .cb-hm g{transform-origin:50% 100%;animation:cb-swing 4s ease-in-out infinite}
.cb-build .cb-b1{animation:cb-b1 4s linear infinite}.cb-build .cb-b2{animation:cb-b2 4s linear infinite}.cb-build .cb-b3{animation:cb-b3 4s linear infinite}
.cb-build .cb-du{animation:cb-du 4s linear infinite}
.cb-saw .cb-ey,.cb-type .cb-ey,.cb-paint .cb-ey,.cb-gear .cb-ey{transform:translateX(-1px)}
.cb-saw .cb-sw{animation:cb-saw .5s ease-in-out infinite}@keyframes cb-saw{50%{transform:translateX(-2px)}}
.cb-saw .cb-sd{animation:cb-fall 1s ease-in infinite}.cb-saw .cb-sd2{animation:cb-fall 1s ease-in infinite -.5s}
@keyframes cb-fall{0%{transform:translateY(0);opacity:1}100%{transform:translateY(5px);opacity:0}}
.cb-type .cb-ar{animation:cb-st .25s ease-in-out infinite}.cb-type .cb-cu{animation:cb-bl .8s steps(1) infinite}
.cb-type .cb-l1{animation:cb-b1 3s linear infinite}.cb-type .cb-l2{animation:cb-b2 3s linear infinite}.cb-type .cb-l3{animation:cb-b3 3s linear infinite}
.cb-paint .cb-pf{transform-origin:50% 100%;animation:cb-coat 6s linear infinite}@keyframes cb-coat{0%{transform:scaleY(0)}85%,100%{transform:scaleY(1)}}
.cb-paint .cb-ro{animation:cb-roll 1.2s ease-in-out infinite}@keyframes cb-roll{50%{transform:translateY(-6px)}}
.cb-gear .cb-g1{transform-origin:50% 50%;animation:cb-spin 1.2s linear infinite}.cb-gear .cb-g2{transform-origin:50% 50%;animation:cb-spin 1.2s linear infinite reverse}
.cb-gear .cb-bd{animation:cb-bob .6s ease-in-out infinite}
@keyframes cb-rl{0%,22%{opacity:1}25%,100%{opacity:0}}@keyframes cb-hm{0%,22%{opacity:0}25%,90%{opacity:1}92%,100%{opacity:0}}
@keyframes cb-swing{0%{transform:rotate(10deg)}33%{transform:rotate(-118deg)}40%{transform:rotate(10deg)}53%{transform:rotate(-118deg)}60%{transform:rotate(10deg)}73%{transform:rotate(-118deg)}80%,100%{transform:rotate(10deg)}}
@keyframes cb-b1{0%,38%{opacity:0}40%,100%{opacity:1}}@keyframes cb-b2{0%,58%{opacity:0}60%,100%{opacity:1}}@keyframes cb-b3{0%,78%{opacity:0}80%,100%{opacity:1}}
@keyframes cb-du{0%,31%,36%,51%,56%,71%,76%,100%{opacity:0}33%,53%,73%{opacity:1}}
.cb-test .cb-ar,.cb-testp .cb-ar,.cb-testf .cb-ar{animation:cb-arm 1s ease-in-out infinite}@keyframes cb-arm{50%{transform:translateY(-3px)}}
.cb-testp .cb-pr,.cb-testf .cb-pr{animation:cb-bl .5s ease-in-out 3}
.cb-debug .cb-all{animation:cb-jit .25s ease-in-out infinite}.cb-debug .cb-pr{animation:cb-bl .5s ease-in-out infinite}
@keyframes cb-jit{25%{transform:translateX(-1px)}75%{transform:translateX(1px)}}
.cb-done .cb-all{animation:cb-jump .8s cubic-bezier(.3,.7,.4,1) 2}.cb-done .cb-ar{transform:translateY(-4px)}
@keyframes cb-jump{0%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
.cb-doze{opacity:.55}.cb-doze .cb-bd,.cb-night .cb-all{animation:cb-bob 4s ease-in-out infinite}
.cb-z{font:7px sans-serif;fill:#9A9890;animation:cb-zz 3s ease-out infinite}
@keyframes cb-zz{0%{opacity:0;transform:translate(0,0)}30%{opacity:1}100%{opacity:0;transform:translate(4px,-7px)}}
.cb-web .cb-dot{animation:cb-bl .6s ease-in-out infinite}.cb-web .cb-wv{animation:cb-bl 1.2s ease-in-out infinite -.3s}
.cb-sub .cb-mini{animation:cb-trot 2.4s ease-in-out infinite}@keyframes cb-trot{50%{transform:translateX(-4px)}}
.cb-codex .cb-pr{animation:cb-hand 1.8s ease-in infinite}
@keyframes cb-hand{0%,20%{transform:translate(0,0);opacity:1}70%{transform:translate(7px,-3px);opacity:0}100%{opacity:0}}
.cb-git .cb-fl{transform-origin:0 50%;animation:cb-wave .5s ease-in-out infinite}@keyframes cb-wave{50%{transform:skewY(-14deg) scaleX(.85)}}
.cb-inst .cb-all{animation:cb-bob .4s ease-in-out infinite}
.cb-ask .cb-pr{animation:cb-bl 1s ease-in-out infinite}.cb-ask .cb-ar{animation:cb-up .5s ease-in-out infinite}@keyframes cb-up{50%{transform:translateY(-4px)}}
.cb-long .cb-pr{animation:cb-drip 1.3s ease-in infinite}@keyframes cb-drip{0%{transform:translateY(0);opacity:1}100%{transform:translateY(6px);opacity:0}}
.cb-comp .cb-all{transform-origin:50% 100%;animation:cb-sq 1.4s ease-in-out infinite}@keyframes cb-sq{50%{transform:scale(1.18,.68)}}
.cb-dizzy .cb-pr{transform-origin:50% 50%;animation:cb-spin 1.2s linear infinite}.cb-dizzy .cb-all{transform-origin:50% 100%;animation:cb-sw 1.2s ease-in-out infinite}
@keyframes cb-spin{to{transform:rotate(360deg)}}@keyframes cb-sw{25%{transform:rotate(-6deg)}75%{transform:rotate(6deg)}}
.cb-fixed .cb-pr rect{animation:cb-cf 1.4s linear infinite}.cb-fixed .cb-pr rect:nth-child(2){animation-delay:-.4s}
.cb-fixed .cb-pr rect:nth-child(3){animation-delay:-.9s}.cb-fixed .cb-pr rect:nth-child(4){animation-delay:-.6s}
.cb-fixed .cb-all{animation:cb-jump .8s ease-out infinite}
@keyframes cb-cf{0%{transform:translateY(-6px);opacity:1}100%{transform:translateY(8px);opacity:0}}
.cb-night .cb-moon{animation:cb-bl 3s ease-in-out infinite}
/* Three more takes a mood (Praj, 12 Oct), class cb-MOODn; take 0 is the mood class above. */
.cb-idle1 .cb-bd{animation:cb-bob 2s ease-in-out infinite}.cb-idle1 .cb-n1{animation:cb-zz 2.4s ease-out infinite}.cb-idle1 .cb-n2{animation:cb-zz 2.4s ease-out infinite -1.2s}
.cb-idle2 .cb-bd{transform-origin:50% 100%;animation:cb-tall 4s ease-in-out infinite}.cb-idle2 .cb-ey{transform-origin:50% 50%;animation:cb-squint 4s ease-in-out infinite}.cb-idle2 .cb-ar{animation:cb-reach 4s ease-in-out infinite}
@keyframes cb-tall{40%,60%{transform:scaleY(1.12)}}@keyframes cb-squint{40%,60%{transform:scaleY(.3)}}@keyframes cb-reach{40%,60%{transform:translateY(-6px)}}
.cb-idle3 .cb-bf{animation:cb-fly 4s ease-in-out infinite}.cb-idle3 .cb-wg{transform-origin:50% 50%;animation:cb-flap .3s ease-in-out infinite}.cb-idle3 .cb-ey{animation:cb-look 4s ease-in-out infinite}
@keyframes cb-fly{0%,100%{transform:translate(0,0)}25%{transform:translate(3px,-3px)}50%{transform:translate(6px,1px)}75%{transform:translate(2px,3px)}}@keyframes cb-flap{50%{transform:scaleX(.3)}}
.cb-think1 .cb-pr{animation:cb-glow 2s ease-in-out infinite}.cb-think1 .cb-ey{transform:translateY(-1px)}@keyframes cb-glow{0%,100%{opacity:.25}50%{opacity:1}}
.cb-think2 .cb-ar{animation:cb-tap 1s ease-in-out infinite}.cb-think2 .cb-ey{transform:translate(-1px,-1px)}
.cb-think2 .cb-d1{animation:cb-bl 1.5s ease-in-out infinite}.cb-think2 .cb-d2{animation:cb-bl 1.5s ease-in-out infinite -.5s}.cb-think2 .cb-d3{animation:cb-bl 1.5s ease-in-out infinite -1s}
@keyframes cb-tap{0%,100%{transform:translate(0,0)}30%,50%{transform:translate(-3px,-2px)}40%{transform:translate(-3px,-3px)}}
.cb-think3 .cb-all{animation:cb-pace 4s ease-in-out infinite}@keyframes cb-pace{0%,100%{transform:translateX(0)}50%{transform:translateX(-5px)}}
.cb-read1 .cb-ey{transform:translate(-1px,1px)}.cb-read1 .cb-pg{transform-origin:0 50%;animation:cb-flip 2s ease-in-out infinite}@keyframes cb-flip{0%,40%{transform:scaleX(1)}60%,100%{transform:scaleX(-1)}}
.cb-read2 .cb-sc{transform-origin:50% 0;animation:cb-unroll 3s ease-out infinite}.cb-read2 .cb-ey{animation:cb-down 3s ease-in-out infinite}
@keyframes cb-unroll{0%{transform:scaleY(.1)}70%,100%{transform:scaleY(1)}}@keyframes cb-down{0%{transform:translateY(-1px)}70%,100%{transform:translateY(1px)}}
.cb-read3 .cb-bd{animation:cb-bob 1.6s ease-in-out infinite}.cb-read3 .cb-ey{animation:cb-scan 1.2s ease-in-out infinite}.cb-read3 .cb-hl{animation:cb-hl 2.4s ease-in-out infinite}
@keyframes cb-hl{0%{transform:translateY(0)}33%{transform:translateY(2px)}66%,100%{transform:translateY(4px)}}
.cb-test1 .cb-ey{transform:translateX(-1px)}.cb-test1 .cb-bu1{animation:cb-rise 1.4s ease-in infinite}.cb-test1 .cb-bu2{animation:cb-rise 1.4s ease-in infinite -.7s}
@keyframes cb-rise{0%{transform:translateY(0);opacity:1}100%{transform:translateY(-9px);opacity:0}}
.cb-test2 .cb-ar{animation:cb-arm 1s ease-in-out infinite}.cb-test2 .cb-ey{transform:translateX(-1px)}
.cb-test2 .cb-k1{animation:cb-b1 3s linear infinite}.cb-test2 .cb-k2{animation:cb-b2 3s linear infinite}.cb-test2 .cb-k3{animation:cb-b3 3s linear infinite}
.cb-test3 .cb-hd{transform-origin:50% 100%;animation:cb-spin 2s linear infinite}.cb-test3 .cb-la{animation:cb-st .5s ease-in-out infinite}
.cb-testp1 .cb-tk{transform-origin:50% 50%;animation:cb-pop 1.6s ease-out infinite}.cb-testp1 .cb-all{animation:cb-jump .8s cubic-bezier(.3,.7,.4,1) infinite}
@keyframes cb-pop{0%{transform:scale(0)}40%{transform:scale(1.2)}60%,100%{transform:scale(1)}}
.cb-testp2 .cb-gl{animation:cb-glow 1s ease-in-out infinite}.cb-testp2 .cb-bd{animation:cb-bob .5s ease-in-out infinite}
.cb-testp3 .cb-pr{transform-origin:50% 50%;animation:cb-twinkle 1.2s ease-in-out infinite}@keyframes cb-twinkle{50%{transform:scale(1.25) rotate(15deg)}}
.cb-testf1 .cb-rd{animation:cb-glow 1s ease-in-out infinite}.cb-testf1 .cb-ey{transform:translateY(1px)}
.cb-testf2 .cb-bd{animation:cb-bob 3s ease-in-out infinite}.cb-testf2 .cb-ey{transform:translateY(1px)}
.cb-testf2 .cb-r1{animation:cb-fall .8s ease-in infinite}.cb-testf2 .cb-r2{animation:cb-fall .8s ease-in infinite -.3s}.cb-testf2 .cb-r3{animation:cb-fall .8s ease-in infinite -.55s}
.cb-testf3 .cb-bd{animation:cb-jit .6s ease-in-out infinite}.cb-testf3 .cb-x{animation:cb-bl 1s ease-in-out infinite}
.cb-debug1 .cb-bug{animation:cb-crawl 2s ease-in-out infinite}.cb-debug1 .cb-ey{animation:cb-crawl2 2s ease-in-out infinite}.cb-debug1 .cb-ar{animation:cb-up 1s ease-in-out infinite}
@keyframes cb-crawl{0%,100%{transform:translateX(0)}50%{transform:translateX(5px)}}@keyframes cb-crawl2{0%,100%{transform:translateX(-1px)}50%{transform:translateX(0)}}
.cb-debug2 .cb-pr{transform-origin:50% 100%;animation:cb-turn .6s ease-in-out infinite}.cb-debug2 .cb-ey{transform:translateX(1px)}@keyframes cb-turn{50%{transform:rotate(-40deg)}}
.cb-debug3 .cb-mg{animation:cb-search 2.4s ease-in-out infinite}.cb-debug3 .cb-ey{animation:cb-look 2.4s ease-in-out infinite}
@keyframes cb-search{0%,100%{transform:translate(0,0)}33%{transform:translate(3px,-2px)}66%{transform:translate(1px,2px)}}
.cb-dizzy1 .cb-ey rect{transform-box:fill-box;animation:cb-circ .6s linear infinite}.cb-dizzy1 .cb-ey rect+rect{animation-delay:-.3s}
.cb-dizzy1 .cb-all{transform-origin:50% 100%;animation:cb-sw 1.6s ease-in-out infinite}
@keyframes cb-circ{0%,100%{transform:translate(0,0)}25%{transform:translate(1px,-1px)}50%{transform:translate(0,-2px)}75%{transform:translate(-1px,-1px)}}
.cb-dizzy2 .cb-bi1{animation:cb-orbit 1.6s linear infinite}.cb-dizzy2 .cb-bi2{animation:cb-orbit 1.6s linear infinite -.8s}.cb-dizzy2 .cb-all{transform-origin:50% 100%;animation:cb-sw 2s ease-in-out infinite}
@keyframes cb-orbit{0%,100%{transform:translate(-7px,0)}25%{transform:translate(0,-3px)}50%{transform:translate(7px,0)}75%{transform:translate(0,2px)}}
.cb-dizzy3 .cb-all{transform-origin:50% 100%;animation:cb-tip 2.4s ease-in-out infinite}.cb-dizzy3 .cb-pr{transform-origin:50% 50%;animation:cb-spin 1s linear infinite}
@keyframes cb-tip{0%,100%{transform:rotate(0)}40%,55%{transform:rotate(18deg)}70%{transform:rotate(-5deg)}}
.cb-fixed1 .cb-all{animation:cb-jump .8s ease-out infinite}.cb-fixed1 .cb-s1{animation:cb-burst 1.2s ease-out infinite}
.cb-fixed1 .cb-s2{animation:cb-burst 1.2s ease-out infinite -.4s}.cb-fixed1 .cb-s3{animation:cb-burst 1.2s ease-out infinite -.8s}
@keyframes cb-burst{0%{transform:translateY(4px) scaleY(.2);opacity:0}30%{opacity:1}100%{transform:translateY(-3px) scaleY(1);opacity:0}}
.cb-fixed2 .cb-fw,.cb-fixed2 .cb-fw2{transform-origin:50% 50%;animation:cb-fw 1.4s ease-out infinite}.cb-fixed2 .cb-fw2{animation-delay:-.7s}.cb-fixed2 .cb-ey{transform:translateY(-1px)}
@keyframes cb-fw{0%{transform:scale(.1);opacity:1}70%{opacity:1}100%{transform:scale(1.2);opacity:0}}
.cb-fixed3 .cb-ar,.cb-fixed3 .cb-pr{animation:cb-up 1s ease-in-out infinite}.cb-fixed3 .cb-sp{animation:cb-bl .6s ease-in-out infinite}
.cb-done1 .cb-fg{transform-origin:0 50%;animation:cb-wave .6s ease-in-out infinite}.cb-done1 .cb-bd{animation:cb-bob .8s ease-in-out infinite}
.cb-done2 .cb-all{transform-origin:50% 100%;animation:cb-dance .8s ease-in-out infinite}.cb-done2 .cb-ar{animation:cb-up .4s ease-in-out infinite}
@keyframes cb-dance{25%{transform:translateX(-2px) rotate(-5deg)}75%{transform:translateX(2px) rotate(5deg)}}
.cb-done3 .cb-all{transform-origin:50% 100%;animation:cb-bow 2s ease-in-out infinite}.cb-done3 .cb-pr{animation:cb-bl .8s ease-in-out infinite}
@keyframes cb-bow{0%,20%,80%,100%{transform:scale(1,1)}40%,60%{transform:scale(1.06,.85)}}
.cb-doze1,.cb-doze2,.cb-doze3{opacity:.55}
.cb-doze1 .cb-bd{animation:cb-bob 4s ease-in-out infinite}.cb-doze1 .cb-bb{transform-origin:0 0;animation:cb-bub 3s ease-in infinite}
@keyframes cb-bub{0%{transform:scale(.3);opacity:1}80%{transform:scale(1.8);opacity:1}85%,100%{transform:scale(2);opacity:0}}
.cb-doze2 .cb-bd{transform-origin:50% 100%;animation:cb-breathe 3s ease-in-out infinite}@keyframes cb-breathe{50%{transform:scaleY(1.06)}}
.cb-doze3 .cb-bd{animation:cb-bob 4s ease-in-out infinite}.cb-doze3 .cb-sh{animation:cb-hop 2.4s linear infinite}
@keyframes cb-hop{0%{transform:translate(-2px,6px);opacity:0}15%{opacity:1}50%{transform:translate(3px,-1px)}85%{opacity:1}100%{transform:translate(8px,6px);opacity:0}}
.cb-night1 .cb-all,.cb-night2 .cb-all,.cb-night3 .cb-all{animation:cb-bob 4s ease-in-out infinite}
.cb-night1 .cb-ln{animation:cb-flick 1.2s ease-in-out infinite}@keyframes cb-flick{0%,100%{opacity:1}30%{opacity:.6}50%{opacity:.9}70%{opacity:.5}}
.cb-night2 .cb-ey{transform:translate(-1px,-1px)}.cb-night2 .cb-t1{animation:cb-bl 1.6s ease-in-out infinite}
.cb-night2 .cb-t2{animation:cb-bl 1.6s ease-in-out infinite -.5s}.cb-night2 .cb-t3{animation:cb-bl 1.6s ease-in-out infinite -1.1s}
.cb-night3 .cb-ss{animation:cb-shoot 3s ease-in infinite}.cb-night3 .cb-ey{animation:cb-look 3s ease-in-out infinite}
@keyframes cb-shoot{0%{transform:translate(0,0);opacity:0}10%{opacity:1}60%{transform:translate(-26px,8px);opacity:0}100%{opacity:0}}
.cb-web1 .cb-p1{animation:cb-glow 1.8s ease-in-out infinite}.cb-web1 .cb-p2{animation:cb-glow 1.8s ease-in-out infinite -.6s}
.cb-web1 .cb-p3{animation:cb-glow 1.8s ease-in-out infinite -1.2s}.cb-web1 .cb-ey{transform:translateX(-1px)}
.cb-web2 .cb-all{transform-origin:50% 100%;animation:cb-surf 1.6s ease-in-out infinite}.cb-web2 .cb-wa{animation:cb-trot 1.6s ease-in-out infinite}
@keyframes cb-surf{0%,100%{transform:rotate(-4deg) translateY(0)}50%{transform:rotate(4deg) translateY(-2px)}}
.cb-web3 .cb-a1{animation:cb-glow 1.2s ease-in-out infinite}.cb-web3 .cb-a2{animation:cb-glow 1.2s ease-in-out infinite -.4s}
.cb-sub1 .cb-mini{animation:cb-trot 2.4s ease-in-out infinite}
.cb-sub2 .cb-mini{animation:cb-bob .8s ease-in-out infinite}.cb-sub2 .cb-s1{animation:cb-glow 1s ease-in-out infinite}.cb-sub2 .cb-s2{animation:cb-glow 1s ease-in-out infinite -.5s}
.cb-sub3 .cb-m1{animation:cb-hop2 .6s ease-in-out infinite}.cb-sub3 .cb-m2{animation:cb-hop2 .6s ease-in-out infinite -.3s}.cb-sub3 .cb-ar{animation:cb-up .6s ease-in-out infinite}
@keyframes cb-hop2{50%{transform:translateY(-3px)}}
.cb-codex1 .cb-ey{transform:translateX(1px)}.cb-codex1 .cb-tk{transform-origin:50% 0;animation:cb-talk .3s ease-in-out infinite}
.cb-codex1 .cb-w1{animation:cb-glow 1s ease-in-out infinite}.cb-codex1 .cb-w2{animation:cb-glow 1s ease-in-out infinite -.5s}@keyframes cb-talk{50%{transform:scaleY(.2)}}
.cb-codex2 .cb-pc{animation:cb-pass 1.6s ease-in-out infinite}.cb-codex2 .cb-re{animation:cb-bl 2s ease-in-out infinite}@keyframes cb-pass{0%,100%{transform:translateX(0)}50%{transform:translateX(-4px)}}
.cb-codex3 .cb-q1{animation:cb-alt 2.4s linear infinite}.cb-codex3 .cb-q2{animation:cb-alt 2.4s linear infinite -1.2s}@keyframes cb-alt{0%,45%{opacity:1}50%,100%{opacity:0}}
.cb-git1 .cb-rk{animation:cb-launch 2.4s ease-in infinite}.cb-git1 .cb-fm{animation:cb-bl .2s ease-in-out infinite}.cb-git1 .cb-ey{transform:translate(-1px,-1px)}
@keyframes cb-launch{0%,20%{transform:translateY(0);opacity:1}80%{transform:translateY(-16px);opacity:1}100%{transform:translateY(-16px);opacity:0}}
.cb-git2 .cb-stp{animation:cb-stamp 1.6s ease-in-out infinite}.cb-git2 .cb-mk{animation:cb-ink 1.6s linear infinite}
@keyframes cb-stamp{0%,30%,100%{transform:translateY(0)}45%,55%{transform:translateY(5px)}}@keyframes cb-ink{0%,44%{opacity:0}46%,100%{opacity:1}}
.cb-git3 .cb-k1{animation:cb-b1 3s linear infinite}.cb-git3 .cb-k2{animation:cb-b2 3s linear infinite}.cb-git3 .cb-k3{animation:cb-b3 3s linear infinite}
.cb-inst1 .cb-pa{animation:cb-drop 3s ease-out infinite}.cb-inst1 .cb-ey{transform:translate(-1px,-1px)}
@keyframes cb-drop{0%{transform:translateY(-6px);opacity:0}15%{opacity:1}70%,90%{transform:translateY(8px);opacity:1}100%{transform:translateY(8px);opacity:0}}
.cb-inst2 .cb-fl2{transform-origin:0 50%;animation:cb-fill 3s ease-in-out infinite}.cb-inst2 .cb-ar{animation:cb-arm 1s ease-in-out infinite}
@keyframes cb-fill{0%{transform:scaleX(0)}85%,100%{transform:scaleX(1)}}
.cb-inst3 .cb-lid{transform-origin:0 100%;animation:cb-lid 2s ease-in-out infinite}.cb-inst3 .cb-sp2{animation:cb-peek 2s linear infinite}
@keyframes cb-lid{0%,40%,100%{transform:translateY(0) rotate(0)}55%,75%{transform:translateY(-4px) rotate(-20deg)}}@keyframes cb-peek{0%,45%,90%,100%{opacity:0}55%,80%{opacity:1}}
.cb-ask1 .cb-qb{transform-origin:100% 100%;animation:cb-pulse 1.2s ease-in-out infinite}@keyframes cb-pulse{50%{transform:scale(1.1)}}
.cb-ask2 .cb-la{animation:cb-st .3s ease-in-out infinite}.cb-ask2 .cb-all{transform-origin:50% 100%;animation:cb-tilt 2s ease-in-out infinite}
.cb-ask2 .cb-e1{animation:cb-bl 1.2s ease-in-out infinite}.cb-ask2 .cb-e2{animation:cb-bl 1.2s ease-in-out infinite -.4s}.cb-ask2 .cb-e3{animation:cb-bl 1.2s ease-in-out infinite -.8s}
@keyframes cb-tilt{0%,100%{transform:rotate(0)}30%,70%{transform:rotate(-7deg)}}
.cb-ask3 .cb-sg{animation:cb-up .9s ease-in-out infinite}
.cb-long1 .cb-ar,.cb-long1 .cb-pr{animation:cb-sip 3s ease-in-out infinite}.cb-long1 .cb-stm{animation:cb-steam 1.8s ease-out infinite}
@keyframes cb-sip{0%,30%,80%,100%{transform:translate(0,0)}45%,65%{transform:translate(-5px,2px)}}@keyframes cb-steam{0%{transform:translateY(0);opacity:0}30%{opacity:.8}100%{transform:translateY(-4px);opacity:0}}
.cb-long2 .cb-ht{transform-origin:50% 100%;animation:cb-drain 4s linear infinite}.cb-long2 .cb-hb{transform-origin:50% 100%;animation:cb-coat 4s linear infinite}
.cb-long2 .cb-hs{animation:cb-bl .4s ease-in-out infinite}.cb-long2 .cb-la{animation:cb-st .5s ease-in-out infinite}@keyframes cb-drain{0%{transform:scaleY(1)}90%,100%{transform:scaleY(0)}}
.cb-long3 .cb-ar{animation:cb-wipe 2s ease-in-out infinite}.cb-long3 .cb-fly{animation:cb-fling 2s ease-out infinite}
@keyframes cb-wipe{0%,20%,80%,100%{transform:translate(0,0)}40%,60%{transform:translate(-4px,-6px)}}@keyframes cb-fling{0%,55%{transform:translate(0,0);opacity:0}60%{opacity:1}100%{transform:translate(6px,6px);opacity:0}}
.cb-comp1 .cb-sl{transform-origin:0 100%;animation:cb-close 2.4s ease-in-out infinite}.cb-comp1 .cb-ar{animation:cb-arm 2.4s ease-in-out infinite}
@keyframes cb-close{0%,10%{transform:rotate(-70deg)}50%,90%{transform:rotate(0)}100%{transform:rotate(-70deg)}}
.cb-comp2 .cb-stk{transform-origin:50% 100%;animation:cb-shrink 3s ease-in-out infinite}.cb-comp2 .cb-ey{transform:translateX(-1px)}
@keyframes cb-shrink{0%,10%{transform:scaleY(1)}70%,90%{transform:scaleY(.3)}100%{transform:scaleY(1)}}
.cb-comp3 .cb-pl{animation:cb-press 2s ease-in-out infinite}.cb-comp3 .cb-bx{transform-origin:50% 100%;animation:cb-squash 2s ease-in-out infinite}
@keyframes cb-press{50%{transform:translateY(12px)}}@keyframes cb-squash{50%{transform:scaleY(.6)}}
/* Five more takes for the looks a long task shows most, and a second take a build scene (Praj, 16 Oct). */
.cb-think4 .cb-ey{transform:translate(-1px,1px)}.cb-think4 .cb-pn{animation:cb-mv 3s ease-in-out infinite}.cb-think4 .cb-ar{animation:cb-tap 3s ease-in-out infinite}
@keyframes cb-mv{0%,40%{transform:translate(0,0)}55%{transform:translate(2px,-3px)}70%,100%{transform:translate(4px,0)}}
.cb-think5 .cb-pr{transform-origin:50% 50%;animation:cb-spin 3s linear infinite}.cb-think5 .cb-ey{animation:cb-look 3s ease-in-out infinite}
.cb-think6 .cb-c1{animation:cb-b1 4s linear infinite}.cb-think6 .cb-c2{animation:cb-b2 4s linear infinite}.cb-think6 .cb-c3{animation:cb-b3 4s linear infinite}
.cb-think6 .cb-ey{transform:translate(-1px,-1px)}.cb-think6 .cb-bd{animation:cb-bob 2s ease-in-out infinite}
.cb-think7 .cb-pz{animation:cb-fit 3s ease-in-out infinite}.cb-think7 .cb-ey{transform:translateX(-1px)}
@keyframes cb-fit{0%,15%,100%{transform:translate(-2px,-5px) rotate(20deg)}55%,85%{transform:translate(0,0) rotate(0)}}
.cb-think8 .cb-x1{animation:cb-alt 3s linear infinite}.cb-think8 .cb-x2{animation:cb-alt 3s linear infinite -1.5s}.cb-think8 .cb-ar{animation:cb-up 1.5s ease-in-out infinite}
.cb-read4 .cb-np{animation:cb-shake 2.4s ease-in-out infinite}.cb-read4 .cb-ey{animation:cb-scan 1.6s ease-in-out infinite}
@keyframes cb-shake{0%,70%,80%,100%{transform:translateY(0)}75%{transform:translateY(-1px)}}
.cb-read5 .cb-pr{transform-origin:0 100%;animation:cb-sweep 4s ease-in-out infinite}.cb-read5 .cb-ey{transform:translate(1px,-1px)}
@keyframes cb-sweep{0%,100%{transform:rotate(0)}50%{transform:rotate(-12deg)}}
.cb-read6 .cb-dr{animation:cb-open 3s ease-in-out infinite}.cb-read6 .cb-cd{animation:cb-peek 3s linear infinite}.cb-read6 .cb-ey{transform:translate(-1px,1px)}
@keyframes cb-open{0%,15%,100%{transform:translateX(0)}35%,80%{transform:translateX(-2px)}}
.cb-read7 .cb-bm{animation:cb-beam 1.6s ease-in-out infinite alternate}.cb-read7 .cb-ey{animation:cb-down 1.6s ease-in-out infinite alternate}
@keyframes cb-beam{to{transform:translateY(10px)}}
.cb-read8 .cb-pin{animation:cb-pin 2.4s ease-in infinite}.cb-read8 .cb-ey{transform:translate(-1px,1px)}
@keyframes cb-pin{0%{transform:translateY(-6px);opacity:0}30%{opacity:1}50%,90%{transform:translateY(0);opacity:1}100%{transform:translateY(0);opacity:0}}
.cb-test4 .cb-th{transform-origin:50% 100%;animation:cb-coat 3s ease-in-out infinite}.cb-test4 .cb-ey{transform:translateX(-1px)}
.cb-test5 .cb-bal{transform-origin:50% 0;animation:cb-sw 2s ease-in-out infinite}.cb-test5 .cb-ey{animation:cb-look 2s ease-in-out infinite}
.cb-test6 .cb-pk{animation:cb-poke 1.2s ease-in-out infinite}.cb-test6 .cb-jl{transform-origin:50% 100%;animation:cb-wob 1.2s ease-in-out infinite}
@keyframes cb-poke{0%,100%{transform:translateX(0)}40%{transform:translateX(-2px)}}
@keyframes cb-wob{0%,35%,100%{transform:scale(1,1)}45%{transform:scale(.88,1.1)}60%{transform:scale(1.08,.92)}75%{transform:scale(.97,1.03)}}
.cb-test7 .cb-lt{animation:cb-glow 1.4s ease-in-out infinite}.cb-test7 .cb-all{animation:cb-lean 3s ease-in-out infinite}.cb-test7 .cb-ey{transform:translate(-1px,-1px)}
@keyframes cb-lean{0%,100%{transform:translateX(0)}40%,70%{transform:translateX(-2px)}}
.cb-test8 .cb-pb{transform-origin:0 50%;animation:cb-fill 4s ease-in-out infinite}.cb-test8 .cb-ar{animation:cb-arm 1s ease-in-out infinite}.cb-test8 .cb-ey{transform:translate(-1px,1px)}
.cb-long4 .cb-pr{transform-origin:50% 100%;animation:cb-fan .4s ease-in-out infinite}.cb-long4 .cb-dp{animation:cb-drip 1.3s ease-in infinite}
@keyframes cb-fan{50%{transform:rotate(-25deg)}}
.cb-long5 .cb-sn{transform-origin:0 50%;animation:cb-bite 3s ease-in-out infinite}.cb-long5 .cb-cr{animation:cb-fall 1s ease-in infinite}.cb-long5 .cb-ey{transform:translateY(-1px)}
@keyframes cb-bite{0%{transform:scaleX(1)}90%{transform:scaleX(.35)}100%{transform:scaleX(1)}}
.cb-long6 .cb-mh{transform-origin:50% 100%;animation:cb-spin 1s linear infinite}.cb-long6 .cb-hh{transform-origin:0 50%;animation:cb-spin 6s linear infinite}.cb-long6 .cb-ey{transform:translate(-1px,-1px)}
.cb-long7 .cb-bt{transform-origin:50% 100%;animation:cb-drain 5s ease-in infinite}.cb-long7 .cb-bd{animation:cb-bob 2.5s ease-in-out infinite}.cb-long7 .cb-ey{transform:translateY(1px)}
.cb-long8 .cb-tm{animation:cb-belt .5s linear infinite}.cb-long8 .cb-bd{animation:cb-bob .5s ease-in-out infinite}.cb-long8 .cb-pr{animation:cb-drip 1s ease-in infinite}
.cb-long8 .cb-la{animation:cb-st .25s ease-in-out infinite}.cb-long8 .cb-lb{animation:cb-st .25s ease-in-out infinite -.12s}@keyframes cb-belt{to{transform:translateX(-8px)}}
.cb-build1 .cb-wg2{animation:cb-glow .4s ease-in-out infinite}.cb-build1 .cb-sk1{animation:cb-rise .6s ease-out infinite}
.cb-build1 .cb-sk2{animation:cb-rise .6s ease-out infinite -.2s}.cb-build1 .cb-sk3{animation:cb-rise .6s ease-out infinite -.4s}
.cb-saw1 .cb-dl{animation:cb-jit .15s ease-in-out infinite}.cb-saw1 .cb-ds{animation:cb-fall .8s ease-in infinite}.cb-saw1 .cb-ey{transform:translateX(-1px)}
.cb-type1 .cb-pc3{animation:cb-write 3s ease-in-out infinite}.cb-type1 .cb-ey{transform:translate(-1px,1px)}
.cb-type1 .cb-p1{animation:cb-b1 3s linear infinite}.cb-type1 .cb-p2{animation:cb-b2 3s linear infinite}.cb-type1 .cb-p3{animation:cb-b3 3s linear infinite}
@keyframes cb-write{0%,100%{transform:translate(0,0)}33%{transform:translate(-1px,3px)}66%{transform:translate(0,5px)}}
.cb-paint1 .cb-brm{transform-origin:50% 0;animation:cb-brush 1s ease-in-out infinite}.cb-paint1 .cb-pf1{animation:cb-puff 1s ease-out infinite}.cb-paint1 .cb-pf2{animation:cb-puff 1s ease-out infinite -.5s}
@keyframes cb-brush{50%{transform:rotate(14deg)}}@keyframes cb-puff{0%{transform:translate(0,0);opacity:.9}100%{transform:translate(-3px,-3px);opacity:0}}
.cb-gear1 .cb-cab{transform-origin:50% 0;animation:cb-cable 3s ease-in-out infinite}.cb-gear1 .cb-blk{animation:cb-hoist 3s ease-in-out infinite}
.cb-gear1 .cb-ey{transform:translate(-1px,-1px)}.cb-gear1 .cb-ar{animation:cb-arm 3s ease-in-out infinite}
@keyframes cb-cable{0%,100%{transform:scaleY(1)}50%{transform:scaleY(3)}}@keyframes cb-hoist{0%,100%{transform:translateY(0)}50%{transform:translateY(8px)}}
@media (prefers-reduced-motion:reduce){.cb *{animation:none!important}}
</style>`

const MINI_BODY = r(7, 10, 16, 12, O) + r(3, 14, 4, 4, O) + r(23, 14, 4, 4, O) + r(9, 12, 2, 2, I) + r(19, 12, 2, 2, I) + r(7, 22, 2, 4, O) + r(11, 22, 2, 4, O) + r(17, 22, 2, 4, O) + r(21, 22, 2, 4, O)
const MINI = g('cb-mini', `<g style="transform-box:view-box" transform="translate(-7,17) scale(.4)">${MINI_BODY}</g>`)
const TICK = r(12, 3, 2, 2, '#1D9E75') + r(14, 5, 2, 2, '#1D9E75') + r(16, 3, 2, 2, '#1D9E75') + r(18, 1, 2, 2, '#1D9E75')

// Build: measure the wall with a ruler, then three hammer strikes, one new brick after each (Praj, 11 Oct).
// The wall stands left of the crab; the back claw holds the tools; the hammer pivots on its handle's foot.
const BR = '#B5532F', BR2 = '#93401F'
const BUILD = r(-5, 24, 4, 2, BR) + r(-1, 24, 4, 2, BR2)
  + g('cb-b1', r(-5, 22, 4, 2, BR2)) + g('cb-b2', r(-1, 22, 4, 2, BR)) + g('cb-b3', r(-3, 20, 4, 2, BR2))
  + g('cb-rl', g('', r(-5, 16, 9, 2, Y) + r(-4, 16, 1, 1, B) + r(-2, 16, 1, 1, B) + r(0, 16, 1, 1, B) + r(2, 16, 1, 1, B)))
  + g('cb-hm', g('', r(4, 9, 1, 7, B) + r(2, 7, 5, 2, G) + r(2, 7, 1, 2, '#5F636B')))
  + g('cb-du', r(-6, 18, 1, 1, '#E8DCC8') + r(0, 17, 1, 1, '#E8DCC8'))

// Four more build scenes, so a long build is not one hammer loop (Praj, 12 Oct). Each stands left of the
// crab, in the wall's spot, with the front claw on the tool.
const SAW = r(-6, 19, 9, 2, '#C8A165') + r(-5, 21, 1, 5, B) + r(1, 21, 1, 5, B) + r(-2, 19, 1, 1, B)
  + g('cb-sw', r(-4, 17, 7, 2, '#B4B2A9') + r(-4, 18, 7, 1, G) + r(3, 16, 2, 3, B))
  + g('cb-sd', r(-2, 21, 1, 1, '#E8DCC8')) + g('cb-sd2', r(-1, 21, 1, 1, '#E8DCC8'))
const LAPTOP = r(-6, 11, 8, 8, '#2C2C2A') + r(-6, 19, 10, 1, '#B4B2A9') + r(-6, 20, 10, 1, B) + r(-5, 21, 1, 5, B) + r(2, 21, 1, 5, B)
  + g('cb-l1', r(-5, 12, 5, 1, '#1D9E75')) + g('cb-l2', r(-4, 14, 5, 1, '#378ADD')) + g('cb-l3', r(-4, 16, 3, 1, '#EF9F27'))
  + g('cb-cu', r(0, 16, 1, 1, '#F4F3EE'))
const PAINT = r(-6, 6, 6, 20, '#4A4A48') + g('cb-pf', r(-6, 6, 6, 20, '#378ADD'))
  + g('cb-ro', r(-1, 12, 2, 5, '#F4F3EE') + r(1, 14, 2, 1, G) + r(2, 14, 1, 5, B))
const GEAR = g('cb-g1', r(-4, 15, 5, 5, G) + r(-3, 13, 3, 2, '#B4B2A9') + r(-3, 20, 3, 2, G) + r(-6, 16, 2, 3, G) + r(1, 16, 2, 3, G) + r(-2, 17, 1, 1, I))
  + g('cb-g2', r(-4, 8, 3, 3, Y) + r(-3, 6, 1, 2, B) + r(-3, 11, 1, 2, Y) + r(-6, 9, 2, 1, Y) + r(-1, 9, 2, 1, Y))

// [prop drawn on the body, extra drawn beside the crab, claw height (14 = resting)]
const LOOK: Partial<Record<Mood, [string, string?, number?]>> = {
  read: [r(25, 6, 4, 1, G) + r(24, 7, 1, 3, G) + r(29, 7, 1, 3, G) + r(25, 10, 4, 1, G) + r(25, 7, 4, 3, 'rgba(169,214,245,.6)') + r(24, 11, 2, 3, B), '', 10],
  build: ['', BUILD],
  saw: ['', SAW],
  type: ['', LAPTOP],
  paint: ['', PAINT],
  gear: ['', GEAR],
  testp: [TICK],
  fixed: [r(6, 2, 2, 2, '#1D9E75') + r(12, 0, 2, 2, Y) + r(19, 2, 2, 2, '#378ADD') + r(24, 1, 2, 2, '#D4537E')],
  testf: [r(12, 2, 2, 2, '#E24B4A') + r(14, 4, 2, 2, '#E24B4A') + r(16, 2, 2, 2, '#E24B4A') + r(12, 6, 2, 2, '#E24B4A') + r(16, 6, 2, 2, '#E24B4A')],
  debug: [r(14, 1, 2, 5, '#EF9F27') + r(14, 7, 2, 2, '#EF9F27')],
  web: [r(14, 4, 1, 6, G) + g('cb-dot', r(13, 2, 3, 2, '#E24B4A')) + g('cb-wv', r(10, 1, 1, 2, G) + r(18, 1, 1, 2, G))],
  sub: ['', MINI],
  codex: [r(24, 7, 5, 4, B) + r(26, 7, 1, 4, Y), '', 10],
  git: [r(26, 2, 1, 12, G) + g('cb-fl', r(27, 2, 4, 3, '#1D9E75'))],
  inst: [r(9, 4, 12, 6, B) + r(14, 4, 2, 6, Y)],
  ask: [r(13, 1, 4, 1, '#378ADD') + r(17, 2, 1, 2, '#378ADD') + r(15, 4, 2, 1, '#378ADD') + r(15, 5, 1, 2, '#378ADD') + r(15, 8, 1, 1, '#378ADD'), '', 10],
  long: [r(5, 8, 1, 1, '#85B7EB') + r(4, 9, 3, 2, '#85B7EB')],
  dizzy: [r(9, 4, 2, 2, Y) + r(19, 4, 2, 2, Y) + r(14, 1, 2, 2, Y) + r(14, 7, 2, 2, Y)],
  night: [r(6, 6, 18, 3, '#3C3489') + r(9, 4, 12, 2, '#3C3489') + r(13, 2, 6, 2, '#3C3489') + r(19, 1, 3, 3, '#F4F3EE'), g('cb-moon', r(-3, 2, 3, 3, '#FAC775') + r(-4, 3, 1, 2, '#FAC775'))],
}
// The three extra takes of each mood (Praj, 12 Oct): a prop on the body, a set beside it, a claw height.
const GRN = '#1D9E75', RED = '#E24B4A', BLU = '#378ADD', WH = '#F4F3EE', LG = '#B4B2A9', DK = '#2C2C2A', ORG = '#EF9F27'
const PINK = '#D4537E', SKY = '#85B7EB', WOOD = '#C8A165', GLASS = 'rgba(200,220,235,.35)'
const mini = (cls: string, x: number, y: number, s: number) => g(cls, `<g style="transform-box:view-box" transform="translate(${x},${y}) scale(${s})">${r(7, 10, 16, 12, O) + r(3, 14, 4, 4, O) + r(23, 14, 4, 4, O) + r(9, 12, 2, 2, I) + r(19, 12, 2, 2, I) + r(7, 22, 2, 4, O) + r(11, 22, 2, 4, O) + r(17, 22, 2, 4, O) + r(21, 22, 2, 4, O)}</g>`)
const note = (x: number, y: number) => r(x + 1, y, 1, 3, WH) + r(x, y + 3, 2, 2, WH) + r(x + 2, y, 1, 1, WH)
const LIGHT = (lit: 0 | 2, c: string, cls: string) => r(-5, 6, 6, 16, DK) + r(-3, 22, 2, 4, G)
  + [0, 1, 2].map(k => k === lit ? g(cls, r(-4, 7 + 5 * k, 4, 4, c)) : r(-4, 7 + 5 * k, 4, 4, '#3a3a38')).join('')
const BUG = r(-4, 23, 3, 2, '#639922') + r(-5, 22, 1, 1, LG) + r(-1, 22, 1, 1, LG) + r(-5, 25, 1, 1, LG) + r(-1, 25, 1, 1, LG)
const ROBOT = r(-6, 10, 7, 6, G) + g('cb-re', r(-5, 12, 2, 2, SKY) + r(-2, 12, 2, 2, SKY)) + r(-3, 8, 1, 2, G) + r(-5, 16, 5, 6, LG) + r(-5, 22, 1, 4, G) + r(-2, 22, 1, 4, G)
// The web takes' globe and water beside the crab; on the stage they give way to the stage's own (stageArt).
const WEB_GLOBE = r(-4, 10, 6, 8, BLU) + r(-5, 11, 8, 6, BLU) + g('cb-p1', r(-4, 11, 3, 2, GRN)) + g('cb-p2', r(-1, 13, 3, 3, GRN)) + g('cb-p3', r(-4, 15, 2, 2, GRN)) + r(-2, 18, 2, 2, G) + r(-4, 20, 6, 1, G)
const WEB_WAVE = r(-6, 27, 38, 1, BLU) + g('cb-wa', r(-6, 22, 6, 5, BLU) + r(-5, 20, 3, 2, BLU) + r(-4, 19, 2, 1, WH))
const bird = (cls: string) => g(cls, r(14, 3, 1, 1, WH) + r(15, 4, 1, 1, WH) + r(16, 3, 1, 1, WH))

const TAKE: Record<string, [string, string?, number?]> = {
  idle1: [r(14, 17, 2, 2, I) + g('cb-n1', note(24, 5)) + g('cb-n2', note(27, 3))],
  idle2: [''],
  idle3: ['', g('cb-bf', g('cb-wg', r(-5, 6, 2, 2, Y) + r(-2, 6, 2, 2, Y)) + r(-3, 6, 1, 3, B))],
  think1: [r(13, 1, 4, 4, Y) + r(14, 5, 2, 2, G)],
  think2: [g('cb-d1', r(10, 5, 2, 2, DIM)) + g('cb-d2', r(14, 4, 2, 2, DIM)) + g('cb-d3', r(18, 3, 2, 2, DIM))],
  think3: [''],
  read1: ['', r(-5, 14, 4, 6, WH) + r(-1, 14, 4, 6, CREAM) + r(-4, 16, 2, 1, G) + r(-4, 18, 2, 1, G) + r(0, 16, 2, 1, G) + g('cb-pg', r(-1, 14, 4, 6, WH))],
  read2: ['', r(-5, 8, 8, 2, B) + g('cb-sc', r(-4, 10, 6, 12, CREAM) + r(-3, 12, 4, 1, G) + r(-3, 15, 3, 1, G) + r(-3, 18, 4, 1, G))],
  read3: [r(8, 11, 4, 1, G) + r(18, 11, 4, 1, G) + r(12, 11, 6, 1, G) + r(8, 12, 4, 3, 'rgba(169,214,245,.35)') + r(18, 12, 4, 3, 'rgba(169,214,245,.35)'),
    r(-5, 12, 7, 9, WH) + r(-4, 14, 5, 1, G) + r(-4, 16, 4, 1, G) + r(-4, 18, 5, 1, G) + g('cb-hl', r(-4, 14, 5, 1, 'rgba(245,197,66,.6)'))],
  test1: ['', r(-3, 10, 3, 4, GLASS) + r(-5, 14, 7, 8, GLASS) + r(-5, 17, 7, 5, GRN) + g('cb-bu1', r(-3, 17, 1, 1, WH)) + g('cb-bu2', r(-1, 18, 1, 1, WH))],
  test2: ['', r(-5, 9, 8, 13, B) + r(-4, 11, 6, 10, WH) + r(-2, 8, 2, 2, G) + r(-1, 12, 3, 1, G) + r(-1, 15, 3, 1, G) + r(-1, 18, 3, 1, G)
    + g('cb-k1', r(-3, 12, 1, 1, GRN)) + g('cb-k2', r(-3, 15, 1, 1, GRN)) + g('cb-k3', r(-3, 18, 1, 1, GRN))],
  test3: ['', r(-4, 11, 3, 2, G) + r(-5, 13, 7, 7, WH) + g('cb-hd', r(-2, 14, 1, 3, I)) + r(-2, 16, 1, 1, RED)],
  testp1: ['', g('cb-tk', r(-6, 15, 2, 2, GRN) + r(-4, 17, 2, 2, GRN) + r(-2, 15, 2, 2, GRN) + r(0, 13, 2, 2, GRN) + r(2, 11, 2, 2, GRN))],
  testp2: ['', LIGHT(2, GRN, 'cb-gl')],
  testp3: [r(14, 0, 2, 2, Y) + r(12, 2, 6, 2, Y) + r(13, 4, 4, 2, Y) + r(12, 6, 2, 1, Y) + r(16, 6, 2, 1, Y), '', 10],
  testf1: ['', LIGHT(0, RED, 'cb-rd')],
  testf2: [r(9, 1, 12, 3, G) + r(11, 0, 8, 1, G) + g('cb-r1', r(11, 5, 1, 2, BLU)) + g('cb-r2', r(15, 5, 1, 2, BLU)) + g('cb-r3', r(19, 5, 1, 2, BLU))],
  testf3: ['', g('cb-x', r(-5, 12, 2, 2, RED) + r(-1, 12, 2, 2, RED) + r(-3, 14, 2, 2, RED) + r(-5, 16, 2, 2, RED) + r(-1, 16, 2, 2, RED))],
  debug1: ['', g('cb-bug', BUG)],
  debug2: [r(26, 6, 2, 6, G) + r(25, 4, 4, 2, G) + r(25, 3, 1, 1, G) + r(28, 3, 1, 1, G), '', 12],
  debug3: ['', BUG + g('cb-mg', r(-5, 15, 5, 1, G) + r(-6, 16, 1, 4, G) + r(0, 16, 1, 4, G) + r(-5, 20, 5, 1, G) + r(-5, 16, 5, 4, 'rgba(169,214,245,.45)') + r(1, 20, 1, 1, B) + r(2, 21, 1, 1, B))],
  dizzy1: [''],
  dizzy2: [bird('cb-bi1') + bird('cb-bi2')],
  dizzy3: [r(12, 3, 6, 1, LG) + r(17, 4, 1, 2, LG) + r(13, 6, 5, 1, LG) + r(13, 5, 1, 1, LG)],
  fixed1: ['', r(-4, 21, 3, 3, Y) + r(-5, 24, 2, 2, Y) + g('cb-s1', r(-3, 12, 1, 4, PINK)) + g('cb-s2', r(-1, 11, 1, 4, BLU)) + g('cb-s3', r(1, 13, 1, 3, GRN))],
  fixed2: ['', g('cb-fw', r(-2, 6, 2, 2, Y) + r(-2, 2, 2, 2, ORG) + r(-2, 10, 2, 2, ORG) + r(-6, 6, 2, 2, ORG) + r(2, 6, 2, 2, ORG) + r(-5, 3, 1, 1, PINK) + r(1, 3, 1, 1, PINK) + r(-5, 10, 1, 1, PINK) + r(1, 10, 1, 1, PINK))
    + g('cb-fw2', r(27, 2, 2, 2, Y) + r(27, -1, 2, 2, BLU) + r(27, 5, 2, 2, BLU) + r(24, 2, 2, 2, BLU) + r(30, 2, 2, 2, BLU))],
  fixed3: [r(23, 3, 6, 4, Y) + r(24, 7, 4, 1, Y) + r(25, 8, 2, 2, Y) + r(24, 10, 4, 1, Y) + r(22, 4, 1, 2, Y) + r(29, 4, 1, 2, Y) + g('cb-sp', r(21, 1, 1, 1, WH) + r(30, 1, 1, 1, WH)), '', 10],
  done1: ['', r(-3, 8, 1, 18, G) + g('cb-fg', r(-2, 8, 2, 2, WH) + r(0, 8, 2, 2, G) + r(2, 8, 2, 2, WH) + r(-2, 10, 2, 2, G) + r(0, 10, 2, 2, WH) + r(2, 10, 2, 2, G)), 10],
  done2: ['', '', 10],
  done3: [r(4, 6, 1, 1, Y) + r(26, 4, 1, 1, Y) + r(15, 2, 1, 1, Y)],
  doze1: [r(9, 6, 12, 4, BLU) + r(18, 4, 4, 2, BLU) + r(22, 5, 2, 2, WH) + g('cb-bb', r(14, 16, 3, 3, 'rgba(169,214,245,.6)'))],
  doze2: [r(5, 16, 20, 6, '#534AB7') + r(5, 16, 20, 1, '#AFA9EC')],
  doze3: ['', r(-6, 20, 8, 1, WOOD) + r(-6, 23, 8, 1, WOOD) + r(-5, 19, 1, 7, WOOD) + r(0, 19, 1, 7, WOOD)
    + g('cb-sh', r(-6, 12, 4, 3, WH) + r(-3, 12, 2, 2, G) + r(-5, 15, 1, 1, G) + r(-3, 15, 1, 1, G))],
  night1: ['', r(-3, 6, 1, 2, G) + r(-5, 8, 5, 1, G) + g('cb-ln', r(-6, 7, 7, 9, 'rgba(250,199,117,.15)') + r(-4, 9, 3, 5, '#FAC775')) + r(-5, 14, 5, 1, G)],
  night2: ['', r(1, 13, 2, 2, G) + r(-1, 11, 3, 2, G) + r(-3, 9, 3, 2, LG) + r(-5, 7, 3, 2, LG) + r(-1, 15, 1, 11, B) + r(-3, 22, 1, 4, B) + r(1, 22, 1, 4, B)
    + g('cb-t1', r(-4, 1, 1, 1, WH)) + g('cb-t2', r(1, -1, 1, 1, WH)) + g('cb-t3', r(4, 3, 1, 1, WH))],
  night3: ['', r(4, 2, 1, 1, G) + r(-4, 6, 1, 1, G) + g('cb-ss', r(24, 0, 2, 2, '#FAC775') + r(26, 0, 3, 1, 'rgba(250,199,117,.5)'))],
  web1: ['', WEB_GLOBE],
  web2: [r(4, 26, 22, 1, WOOD), WEB_WAVE],
  web3: [r(14, 5, 2, 5, G) + r(14, 4, 2, 1, RED) + g('cb-a1', r(11, 3, 1, 1, SKY) + r(12, 2, 6, 1, SKY) + r(18, 3, 1, 1, SKY)) + g('cb-a2', r(9, 1, 1, 1, SKY) + r(10, 0, 10, 1, SKY) + r(20, 1, 1, 1, SKY))],
  sub1: ['', g('cb-mini', mini('', -7, 17, .4) + r(-5, 18, 5, 3, B) + r(-3, 18, 1, 3, Y))],
  sub2: [r(24, 6, 3, 4, G) + r(25, 4, 1, 2, G), mini('cb-mini', -7, 17, .4) + g('cb-s1', r(1, 19, 1, 2, SKY)) + g('cb-s2', r(2, 18, 1, 4, SKY)), 10],
  sub3: ['', mini('cb-m1', -7, 19, .28) + mini('cb-m2', -2, 19, .28)],
  codex1: [r(24, 4, 3, 7, DK) + r(25, 5, 1, 1, SKY) + g('cb-tk', r(14, 17, 3, 2, I)) + g('cb-w1', r(28, 4, 1, 3, SKY)) + g('cb-w2', r(30, 3, 1, 5, SKY)), '', 10],
  codex2: ['', ROBOT + g('cb-pc', r(1, 17, 3, 3, B) + r(2, 17, 1, 3, Y))],
  codex3: [g('cb-q2', r(18, 1, 8, 4, WH) + r(19, 5, 1, 1, WH) + r(20, 3, 1, 1, G) + r(22, 3, 1, 1, G) + r(24, 3, 1, 1, G)),
    ROBOT + g('cb-q1', r(-6, 2, 7, 4, WH) + r(-3, 6, 1, 1, WH) + r(-5, 4, 1, 1, G) + r(-3, 4, 1, 1, G) + r(-1, 4, 1, 1, G))],
  git1: ['', r(-5, 24, 7, 2, G) + g('cb-rk', r(-3, 14, 3, 6, WH) + r(-2, 12, 1, 2, RED) + r(-2, 15, 1, 1, BLU) + r(-4, 18, 1, 2, RED) + r(0, 18, 1, 2, RED) + g('cb-fm', r(-3, 20, 3, 2, ORG) + r(-2, 22, 1, 1, Y)))],
  git2: ['', r(-6, 24, 9, 2, WH) + g('cb-mk', r(-4, 24, 4, 1, GRN)) + g('cb-stp', r(-3, 13, 2, 4, B) + r(-4, 12, 4, 1, B) + r(-5, 17, 6, 2, RED))],
  git3: ['', r(-4, 7, 1, 17, G) + r(-5, 21, 3, 3, GRN) + g('cb-k1', r(-5, 16, 3, 3, GRN)) + g('cb-k2', r(-5, 11, 3, 3, GRN)) + g('cb-k3', r(-5, 6, 3, 3, Y))],
  inst1: ['', g('cb-pa', r(-5, 4, 8, 2, PINK) + r(-6, 6, 10, 1, PINK) + r(-6, 7, 1, 4, LG) + r(3, 7, 1, 4, LG) + r(-4, 11, 5, 4, B) + r(-2, 11, 1, 4, Y))],
  inst2: ['', r(-6, 6, 10, 4, G) + r(-5, 7, 8, 2, DK) + g('cb-fl2', r(-5, 7, 8, 2, GRN))],
  inst3: ['', r(-5, 18, 8, 6, B) + r(-2, 18, 2, 6, Y) + g('cb-lid', r(-6, 16, 9, 2, '#8A5A30')) + g('cb-sp2', r(-3, 12, 1, 1, Y) + r(1, 11, 1, 1, Y) + r(-5, 13, 1, 1, Y))],
  ask1: ['', g('cb-qb', r(-6, 6, 8, 8, WH) + r(1, 13, 2, 1, WH) + r(2, 14, 1, 1, WH) + r(-4, 8, 3, 1, BLU) + r(-2, 9, 1, 1, BLU) + r(-3, 10, 1, 1, BLU) + r(-3, 12, 1, 1, BLU))],
  ask2: [r(9, 2, 12, 5, WH) + r(12, 7, 2, 1, WH) + g('cb-e1', r(11, 4, 2, 1, G)) + g('cb-e2', r(14, 4, 2, 1, G)) + g('cb-e3', r(17, 4, 2, 1, G))],
  ask3: ['', g('cb-sg', r(-2, 12, 1, 14, B) + r(-6, 3, 10, 9, WH) + r(-3, 4, 4, 1, BLU) + r(1, 5, 1, 2, BLU) + r(-1, 7, 2, 1, BLU) + r(-1, 8, 1, 1, BLU) + r(-1, 10, 1, 1, BLU))],
  long1: [r(25, 8, 4, 5, WH) + r(29, 9, 1, 3, WH) + r(25, 8, 4, 1, B) + g('cb-stm', r(26, 5, 1, 2, LG) + r(28, 3, 1, 2, LG)), '', 12],
  long2: ['', r(-6, 8, 8, 1, B) + r(-6, 21, 8, 1, B) + r(-5, 9, 6, 5, GLASS) + r(-3, 14, 2, 2, GLASS) + r(-5, 16, 6, 5, GLASS)
    + g('cb-ht', r(-5, 10, 6, 4, Y)) + g('cb-hs', r(-3, 14, 1, 3, Y)) + g('cb-hb', r(-5, 17, 6, 4, Y))],
  long3: [g('cb-fly', r(24, 6, 1, 1, SKY) + r(23, 7, 3, 2, SKY))],
  comp1: ['', r(-6, 16, 9, 8, B) + r(-6, 19, 9, 1, '#5A3418') + r(-4, 14, 3, 2, PINK) + g('cb-sl', r(-6, 13, 9, 3, '#8A5A30') + r(-3, 11, 2, 2, G))],
  comp2: ['', g('cb-stk', r(-5, 6, 8, 18, WH) + r(-5, 9, 8, 1, LG) + r(-5, 13, 8, 1, LG) + r(-5, 17, 8, 1, LG) + r(-5, 21, 8, 1, LG))],
  comp3: ['', r(-6, 4, 1, 22, G) + r(2, 4, 1, 22, G) + r(-6, 3, 9, 2, G) + g('cb-bx', r(-5, 16, 7, 10, B)) + g('cb-pl', r(-5, 6, 7, 2, LG) + r(-2, 5, 1, 1, G))],
  think4: ['', r(-6, 24, 2, 2, WH) + r(-4, 24, 2, 2, DK) + r(-2, 24, 2, 2, WH) + r(0, 24, 2, 2, DK)
    + g('cb-pn', r(-5, 17, 2, 2, LG) + r(-5, 19, 2, 3, LG) + r(-6, 22, 4, 2, LG))],
  think5: [r(13, 2, 4, 4, G) + r(14, 0, 2, 2, G) + r(14, 6, 2, 2, G) + r(11, 3, 2, 2, G) + r(17, 3, 2, 2, G) + r(14, 3, 2, 2, I)],
  think6: ['', r(-6, 5, 10, 10, '#3B4A3F') + r(-6, 15, 10, 1, WOOD) + r(-5, 16, 1, 10, WOOD) + r(2, 16, 1, 10, WOOD)
    + g('cb-c1', r(-5, 7, 4, 1, WH)) + g('cb-c2', r(-4, 10, 6, 1, WH)) + g('cb-c3', r(-5, 12, 3, 1, Y))],
  think7: ['', r(-6, 14, 4, 6, BLU) + r(-2, 16, 1, 2, BLU) + g('cb-pz', r(-1, 14, 4, 2, Y) + r(0, 16, 3, 2, Y) + r(-1, 18, 4, 2, Y))],
  think8: [g('cb-x1', r(13, 1, 4, 1, DIM) + r(17, 2, 1, 2, DIM) + r(15, 4, 2, 1, DIM) + r(15, 5, 1, 2, DIM) + r(15, 8, 1, 1, DIM))
    + g('cb-x2', r(14, 0, 2, 6, Y) + r(14, 7, 2, 2, Y))],
  read4: ['', g('cb-np', r(-6, 9, 10, 11, CREAM) + r(-5, 10, 8, 2, G) + r(-5, 13, 3, 3, LG) + r(-1, 13, 3, 1, G) + r(-1, 15, 3, 1, G) + r(-5, 17, 8, 1, G))],
  read5: [r(25, 7, 3, 3, G) + r(27, 5, 3, 3, LG) + r(29, 3, 3, 2, G), '', 10],
  read6: ['', g('cb-cd', r(-5, 7, 5, 3, WH)) + r(-6, 10, 8, 16, B) + r(-6, 17, 8, 1, '#5A3418') + g('cb-dr', r(-6, 11, 8, 5, '#8A5A30') + r(-3, 13, 2, 1, Y))],
  read7: ['', r(-5, 9, 7, 11, WH) + r(-4, 11, 5, 1, G) + r(-4, 13, 4, 1, G) + r(-4, 15, 5, 1, G) + r(-4, 17, 3, 1, G)
    + g('cb-bm', r(-6, 9, 9, 1, 'rgba(29,158,117,.8)'))],
  read8: ['', r(-6, 14, 10, 9, CREAM) + r(-5, 16, 2, 1, BLU) + r(-3, 17, 3, 1, BLU) + r(0, 18, 3, 1, BLU) + r(-6, 21, 10, 2, '#9CC08A')
    + g('cb-pin', r(-2, 8, 3, 3, RED) + r(-1, 11, 1, 3, G))],
  test4: ['', r(-3, 6, 3, 15, GLASS) + r(-4, 20, 5, 5, RED) + g('cb-th', r(-2, 8, 1, 13, RED)) + r(1, 9, 1, 1, G) + r(1, 12, 1, 1, G) + r(1, 15, 1, 1, G)],
  test5: ['', r(-2, 10, 1, 14, G) + r(-5, 24, 7, 2, G)
    + g('cb-bal', r(-6, 9, 9, 1, G) + r(-5, 10, 1, 3, LG) + r(1, 10, 1, 3, LG) + r(-6, 13, 3, 1, LG) + r(0, 13, 3, 1, LG) + r(-6, 12, 2, 1, Y) + r(1, 12, 1, 1, GRN))],
  test6: ['', g('cb-jl', r(-6, 17, 7, 9, '#7FC8A9') + r(-5, 18, 2, 2, 'rgba(255,255,255,.5)')) + g('cb-pk', r(1, 20, 4, 1, B))],
  test7: ['', r(-6, 24, 8, 2, G) + r(0, 12, 2, 12, G) + r(-5, 19, 6, 1, DK) + r(-4, 18, 4, 1, SKY) + r(-4, 9, 3, 7, LG) + r(-4, 7, 3, 2, G)
    + r(-3, 16, 1, 2, G) + g('cb-lt', r(-3, 22, 2, 1, Y))],
  test8: ['', r(-6, 20, 10, 4, G) + r(-5, 21, 8, 2, DK) + g('cb-pb', r(-5, 21, 8, 2, GRN))],
  long4: [r(26, 9, 1, 5, B) + r(24, 4, 5, 5, PINK) + r(25, 5, 3, 3, '#E88AAB'), g('cb-dp', r(5, 8, 1, 1, SKY) + r(4, 9, 3, 2, SKY)), 10],
  long5: [g('cb-sn', r(12, 16, 6, 1, '#E8B04A') + r(12, 17, 6, 1, '#7BA05B') + r(12, 18, 6, 1, RED) + r(12, 19, 6, 1, '#E8B04A'))
    + g('cb-cr', r(14, 21, 1, 1, '#E8B04A') + r(16, 22, 1, 1, '#E8B04A'))],
  long6: ['', r(-5, 4, 8, 8, WH) + r(-6, 5, 1, 6, G) + r(3, 5, 1, 6, G) + r(-5, 3, 8, 1, G) + r(-5, 12, 8, 1, G)
    + g('cb-mh', r(-2, 5, 1, 3, I)) + g('cb-hh', r(-2, 8, 3, 1, I))],
  long7: ['', r(-5, 9, 7, 15, G) + r(-4, 10, 5, 13, DK) + r(-3, 8, 3, 1, G) + g('cb-bt', r(-4, 10, 5, 13, GRN))],
  long8: [r(5, 8, 1, 1, SKY) + r(4, 9, 3, 2, SKY), r(-5, 13, 1, 13, G) + r(-5, 13, 6, 1, G) + r(-6, 26, 38, 1, G)
    + g('cb-tm', r(-6, 26, 2, 1, LG) + r(2, 26, 2, 1, LG) + r(10, 26, 2, 1, LG) + r(18, 26, 2, 1, LG) + r(26, 26, 2, 1, LG) + r(34, 26, 2, 1, LG))],
  build1: [r(8, 11, 14, 3, DK) + r(8, 11, 14, 1, '#5F636B'), r(-6, 15, 7, 11, G) + r(-6, 20, 7, 1, '#5F636B') + g('cb-wg2', r(-2, 19, 3, 1, ORG))
    + r(1, 17, 4, 2, DK) + r(0, 17, 1, 1, LG) + g('cb-sk1', r(-1, 15, 1, 1, Y)) + g('cb-sk2', r(1, 14, 1, 1, ORG)) + g('cb-sk3', r(-3, 16, 1, 1, Y))],
  saw1: ['', r(-6, 12, 5, 14, WOOD) + r(-4, 15, 2, 2, B) + r(-4, 20, 2, 2, B)
    + g('cb-dl', r(0, 15, 5, 3, ORG) + r(2, 18, 2, 3, DK) + r(-2, 16, 2, 1, LG) + r(-1, 16, 1, 1, G)) + g('cb-ds', r(-2, 18, 1, 1, CREAM))],
  type1: ['', r(-6, 10, 9, 13, '#2F5E9E') + r(-6, 14, 9, 1, '#4A78B8') + r(-6, 18, 9, 1, '#4A78B8') + r(-3, 10, 1, 13, '#4A78B8')
    + g('cb-p1', r(-5, 12, 6, 1, WH)) + g('cb-p2', r(-5, 12, 1, 8, WH)) + g('cb-p3', r(-5, 19, 6, 1, WH)) + g('cb-pc3', r(2, 13, 1, 5, Y) + r(2, 18, 1, 1, I))],
  paint1: ['', g('cb-brm', r(1, 6, 1, 15, B) + r(-1, 21, 5, 4, WOOD) + r(-1, 21, 5, 1, '#8A5A30')) + g('cb-pf1', r(-4, 24, 1, 1, LG)) + g('cb-pf2', r(-6, 23, 2, 1, LG))],
  gear1: ['', r(-5, 2, 2, 24, Y) + r(-5, 6, 2, 1, '#B8941F') + r(-5, 12, 2, 1, '#B8941F') + r(-5, 18, 2, 1, '#B8941F') + r(-6, 2, 10, 2, Y)
    + g('cb-cab', r(2, 4, 1, 4, G)) + g('cb-blk', r(1, 8, 3, 1, G) + r(0, 9, 5, 4, BR))],
}
const WALKS: ReadonlySet<string> = new Set(['inst', 'codex', 'think3', 'done2'])

// A take is a 14 s scene, as long as it holds, not one short loop (Praj, 16 Oct): the crab works, breaks for a beat
// at ~5 s with an emote over its shoulder, works on, and takes another beat at ~10 s. The beats move the whole crab
// (its tools stay put); each take draws its own pair from its name. The dozing crab sleeps through.
const BEATS: Record<string, [number, string][]> = {
  hop: [[.2, 'translateY(-3px)'], [.4, 'none'], [.6, 'translateY(-3px)'], [.8, 'none']],
  admire: [[.25, 'translateX(2px) rotate(4deg)'], [.75, 'translateX(2px) rotate(4deg)']],
  turn: [[.15, 'scaleX(-1)'], [.8, 'scaleX(-1)']],
  stretch: [[.3, 'scale(1.06,.88)'], [.6, 'scale(.96,1.1)']],
  shimmy: [[.15, 'translateX(-1px)'], [.3, 'translateX(1px)'], [.45, 'translateX(-1px)'], [.6, 'translateX(1px)'], [.75, 'none']],
  tilt: [[.25, 'rotate(-7deg)'], [.75, 'rotate(-7deg)']],
}
const EMOTE = {
  bang: r(4, 1, 2, 5, Y) + r(4, 7, 2, 2, Y),
  note: r(5, 2, 1, 4, WH) + r(3, 5, 3, 2, WH) + r(6, 2, 2, 1, WH),
  spark: r(5, 2, 1, 5, Y) + r(3, 4, 5, 1, Y),
  ask: r(4, 2, 3, 1, DIM) + r(7, 3, 1, 2, DIM) + r(5, 5, 2, 1, DIM) + r(5, 6, 1, 1, DIM) + r(5, 8, 1, 1, DIM),
  love: r(3, 3, 2, 2, PINK) + r(6, 3, 2, 2, PINK) + r(3, 5, 5, 2, PINK) + r(4, 7, 3, 1, PINK) + r(5, 8, 1, 1, PINK),
  sweat: r(5, 3, 1, 1, SKY) + r(4, 4, 3, 2, SKY),
}
const GLUM: ReadonlySet<Mood> = new Set(['testf', 'debug', 'dizzy', 'long', 'ask'])
const WINDOW = [[34, 44], [72, 82]] as const
function scene(mood: Mood, key: string): { css: string, wrap: (body: string) => string } {
  if (mood === 'doze') return { css: '', wrap: b => b }
  // ponytail: string hash plus one avalanche step; neighbours (think4, think5) otherwise shared their high bits.
  let h = [...key].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7)
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0; h = (h ^ (h >>> 16)) >>> 0
  const names = Object.keys(BEATS), faces = (GLUM.has(mood) ? ['sweat', 'ask', 'bang'] : Object.keys(EMOTE)) as (keyof typeof EMOTE)[]
  const pick = [names[h % 6], names[(h % 6 + 1 + (h >>> 4) % 5) % 6]]
  const face = [faces[(h >>> 8) % faces.length], faces[((h >>> 8) + 1) % faces.length]]
  let css = ''
  WINDOW.forEach(([a, b], i) => {
    const at = (f: number) => +(a + f * (b - a)).toFixed(1)
    css += `.cb-act${i + 1}{transform-origin:50% 100%;animation:cb-k-${pick[i]}-${i + 1} 14s ease-in-out infinite}`
      + `@keyframes cb-k-${pick[i]}-${i + 1}{0%,${a}%,${b}%,100%{transform:none}${BEATS[pick[i]].map(([f, tf]) => `${at(f)}%{transform:${tf}}`).join('')}}`
      + `.cb-em${i + 1}{opacity:0;animation:cb-e${i + 1} 14s ease-in-out infinite}@keyframes cb-e${i + 1}{0%,${a}%,${b}%,100%{opacity:0}${a + 2}%,${b - 2}%{opacity:1}}`
  })
  return { css, wrap: b => `${g('cb-act1', g('cb-act2', b))}${g('cb-em1', EMOTE[face[0]])}${g('cb-em2', EMOTE[face[1]])}` }
}

/** One standalone SVG of the crab acting out take `t` of `mood` (0 is the mood's first look). */
export function crabArt(mood: Mood, t = 0): string {
  const key = t ? `${mood}${t}` : mood
  const [prop = '', beside = '', armY = 14] = (t ? TAKE[key] : LOOK[mood]) ?? []
  const eyes = mood === 'doze' ? r(9, 14, 2, 1, I) + r(19, 14, 2, 1, I) : r(9, 12, 2, 2, I) + r(19, 12, 2, 2, I)
  const mouth = key === 'idle' ? g('cb-mo', r(13, 17, 4, 3, I)) : ''
  const z = key === 'doze' ? '<text class="cb-z" x="24" y="8">z</text>' : ''
  const sc = scene(mood, key)
  // The scene's beats join the one style block, ahead of the reduced-motion rule that stills them too.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="30" viewBox="-6 -2 38 30" shape-rendering="crispEdges">${CSS.replace('@media', `${sc.css}@media`)}`
    + `<g class="cb cb-${key}${WALKS.has(key) ? ' cb-walk' : ''}">${beside}${sc.wrap(`<g class="cb-all"><g class="cb-bd">${r(7, 10, 16, 12, O) + r(3, 14, 4, 4, O)}`
    + `${g('cb-ey', eyes)}${mouth}${g('cb-ar', r(23, armY, 4, 4, O))}${g('cb-pr', prop)}</g>`
    + `${g('cb-la', r(7, 22, 2, 4, O) + r(17, 22, 2, 4, O))}${g('cb-lb', r(11, 22, 2, 4, O) + r(21, 22, 2, 4, O))}</g>`)}${z}</g></svg>`
}

// The stage (Praj, 12 Oct): the right half of the band, the crab 52×41 inside it. The markup is width="100%" with no
// viewBox, so user units are CSS px and a percentage is the drawn width (live probe 10:58; a numeric width squashed
// the crab). Each mood has a station across it, 0 the stage's left end and 1 its right, beside the prompt; a new look
// scuttles there sideways from the last one's, and some moods roam about their station.
export const STATION: Record<Mood, number> = {
  idle: 1, think: .85, read: .65, build: .9, saw: .7, type: .5, paint: .3, gear: .1, test: .5, testp: .5, testf: .5,
  debug: .35, dizzy: .35, fixed: .5, done: 1, doze: 1, night: 1, web: .7, sub: .6, codex: .6, git: .4, inst: .55, ask: 1,
  long: .5, comp: 1,
}
// [cycle in s, keyframe stops as [percent, offset from the station], 1 to play once and hold the last stop];
// every stop stays inside the stage.
const ROAM: Partial<Record<Mood, [number, [string, number][], 1?]>> = {
  idle: [80, [['0%,15%', 0], ['30%,45%', -.4], ['60%,72%', -.75], ['90%,100%', 0]]],
  think: [24, [['0%,10%', 0], ['45%,55%', -.3], ['90%,100%', 0]]],
  read: [32, [['0%', 0], ['50%', -.25], ['100%', 0]]],
  web: [12, [['0%', 0], ['50%', -.35], ['100%', 0]]],
  done: [10, [['0%', 0], ['45%,55%', -.8], ['100%', 0]]],
  long: [40, [['0%', 0], ['50%', -.2], ['100%', 0]]],
  dizzy: [2.4, [['0%,100%', 0], ['25%', -.04], ['75%', .04]]],
  // Walks right while it paints, leaving the stripe behind (Praj, 12 Oct).
  paint: [16, [['0%', 0], ['100%', .4]], 1],
  // Trips, slides back, gets up (Praj, 12 Oct).
  testf: [2.4, [['0%,30%', 0], ['75%,100%', -.18]], 1],
}
const W = 52
const x = (f: number) => `translateX(calc((100% - ${W}px) * ${+f.toFixed(3)}))`
// Seconds to walk from `from` to `to`: the whole stage in 4.8 s, never under .8 s; 0 when already there. Half
// 0.9.2's speed, and every roam cycle doubled with it (Praj, 12 Oct: the scuttling felt restless).
const walkFor = (from: number, to: number) => Math.abs(from - to) > .001 ? Math.max(.8, 4.8 * Math.abs(from - to)) : 0
// CSS ease-in-out (cubic-bezier(.42,0,.58,1)): how far along at progress u, solved by bisection.
function ease(u: number) {
  let a = 0, b = 1
  for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (3 * m * (1 - m) ** 2 * .42 + 3 * m * m * (1 - m) * .58 + m ** 3 < u) a = m; else b = m }
  const m = (a + b) / 2
  return 3 * m * m * (1 - m) + m ** 3
}
// The u in 0..1 where ease(u) = p, by bisection: when the crab reaches a fraction p of its walk.
function uAt(p: number) {
  let a = 0, b = 1
  for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (ease(m) < p) a = m; else b = m }
  return (a + b) / 2
}
// n marks evenly spaced from f0 to f1, each timed to when a walk from f0 (starting at `start`, `dur` s long) passes it.
const trail = (n: number, f0: number, f1: number, start: number, dur: number) =>
  Array.from({ length: n }, (_, k) => ({ f: f0 + (f1 - f0) * (k + .5) / n, t: start + dur * uAt((k + .5) / n) }))

/** Where the crab stands (0 to 1) `s` seconds into a look of `mood` that walked in from `from`: the walk, then the wander. */
export function where(mood: Mood, from: number, s: number): number {
  const to = STATION[mood], d = walkFor(from, to), roam = ROAM[mood]
  if (s < d) return from + (to - from) * ease(s / d)
  if (!roam) return to
  if (roam[2] && s - d >= roam[0]) return to + roam[1][roam[1].length - 1][1]
  const p = (s - d) % roam[0] / roam[0] * 100
  const stops = roam[1].flatMap(([ps, v]) => ps.split(',').map(q => [parseFloat(q), v] as const)).sort((a, b) => a[0] - b[0])
  const i = stops.findIndex(([q]) => q >= p), [q1, v1] = stops[Math.max(i, 0)], [q0, v0] = stops[Math.max(i - 1, 0)]
  return to + (q1 > q0 ? v0 + (v1 - v0) * ease((p - q0) / (q1 - q0)) : v1)
}

// A letter's width in ems, for sizing the label's pill without measuring (measured in Chromium at 11.5 px, 12:35:
// 4.9 to 6.9 px a letter by text). ponytail: Helvetica-ish classes; the pill's spacing absorbs the rest.
const em = (c: string) => /[ijl.,:;'|!I]/.test(c) ? .23 : /[ftr ]/.test(c) ? .3 : /[mwMW]/.test(c) ? .83 : /[A-Z]/.test(c) ? .68 : .54

// Web on the stage (21 Oct: one thin strip under every take read as a dashed line, not water). In stage px, the
// crab's box 52×41 at the origin; the pieces that ride with the crab are drawn in its box.
const DEEP = '#2A6DB8', SEA_P = 32, SEA_H = 12
// The surf take's sea: a sine swell 32 px long, foam on the crests, a deep band below. The pattern starts where the
// strip does, so the crests sit on top: unanchored tiles drew a solid line over dashes of foam.
const SEA = (() => {
  let tile = ''
  for (let x = 0; x < SEA_P; x++) {
    const top = Math.round(5.5 - 3.5 * Math.sin(2 * Math.PI * x / SEA_P))
    tile += r(x, top, 1, SEA_H - top, BLU) + r(x, top, 1, 1, top <= 3 ? WH : SKY) + r(x, SEA_H - 3, 1, 3, DEEP)
  }
  tile += r(6, 3, 1, 1, WH) + r(11, 3, 1, 1, WH) + r(20, 9, 3, 1, SKY) + r(27, 8, 2, 1, SKY)
  return `<defs><pattern id="st-sea" y="${41 - SEA_H}" width="${SEA_P}" height="${SEA_H}" patternUnits="userSpaceOnUse">${tile}</pattern></defs>`
    + `<g class="st-sea"><rect x="0" y="${41 - SEA_H}" width="200%" height="${SEA_H}" fill="url(#st-sea)"/></g>`
})()
// The breaking wave behind the surfer: its back, the lip pitching over the crab's tail, the tube under it, the face
// it rides down, and spray off the lip.
const CURL = (() => {
  const back = [35, 32, 29, 27, 25, 23, 22, 21, 20, 19, 19, 18, 18, 18, 18, 18, 19]
  let c = back.map((t, k) => r(k - 22, t, 1, 41 - t, BLU) + r(k - 22, t, 1, 1, WH)).join('')
  c += r(-5, 19, 3, 2, BLU) + r(-5, 19, 3, 1, WH) + r(-2, 20, 2, 2, BLU) + r(-2, 20, 2, 1, WH) + r(0, 21, 2, 3, WH) + r(1, 24, 1, 1, WH)
  c += r(-5, 21, 5, 20, DEEP) + r(0, 24, 3, 17, DEEP)
  for (let x = 3; x < 14; x++) { const t = 26 + Math.round((x - 3) * .35); c += r(x, t, 1, 41 - t, BLU) + r(x, t, 1, 1, SKY) }
  c += r(-14, 26, 4, 1, SKY) + r(-9, 31, 3, 1, SKY) + r(-18, 33, 3, 1, SKY)
  c += [[2, 18], [5, 20], [0, 16]].map(([x, y], k) => g(`st-spr st-spr${k}`, r(x, y, 1, 1, WH))).join('')
  return g('st-curl', c)
})()
const SURF_CSS = `.st-sea{animation:st-sea 1.6s linear infinite}@keyframes st-sea{100%{transform:translateX(-${SEA_P}px)}}`
  + '.st-curl{animation:st-swell 1.6s ease-in-out infinite}@keyframes st-swell{50%{transform:translateY(1px)}}'
  + '.st-spr{animation:st-spr 1s ease-out infinite}.st-spr1{animation-delay:-.33s}.st-spr2{animation-delay:-.66s}'
  + '@keyframes st-spr{0%{transform:translate(0,0);opacity:1}100%{transform:translate(3px,-5px);opacity:0}}'
  // The surfer rides 6 px up, on the water, rising and falling with the swell.
  + '.st-tr{transform:translateY(-6px);animation:st-ride 1.6s ease-in-out infinite}@keyframes st-ride{50%{transform:translateY(-8px)}}'
// The antenna take: three rings out of the antenna's tip.
const PING = [0, -.6, -1.2].map(d => `<circle cx="28" cy="6.8" r="18" fill="none" stroke-width="1.5" vector-effect="non-scaling-stroke" class="st-pg" style="animation-delay:${d}s"/>`).join('')
const PING_CSS = '.st-pg{stroke:#85B7EB;transform-box:fill-box;transform-origin:50% 50%;animation:st-pg 1.8s ease-out infinite}'
  + '@keyframes st-pg{0%{transform:scale(.1);opacity:1}100%{transform:scale(1);opacity:0}}@media (prefers-color-scheme:light){.st-pg{stroke:#378ADD}}'
// The globe take: a globe on a stand at the crab's left, its land turning, a satellite on its orbit.
const GLOBE = (() => {
  const land = r(0, 3, 4, 3, GRN) + r(1, 6, 2, 4, GRN) + r(9, 2, 5, 4, GRN) + r(10, 6, 3, 2, GRN) + r(12, 9, 3, 3, GRN) + r(5, 11, 3, 2, GRN)
  return g('st-globe', '<defs><clipPath id="st-gc"><circle cx="-11" cy="22" r="8"/></clipPath></defs>'
    + `<circle cx="-11" cy="22" r="8" fill="${BLU}"/>`
    + `<g clip-path="url(#st-gc)"><g class="st-land"><g transform="translate(-19,14)">${land}</g><g transform="translate(-3,14)">${land}</g></g></g>`
    + `<circle cx="-11" cy="22" r="8" fill="none" stroke="${SKY}" stroke-width="1"/>` + r(-12, 30, 2, 5, G) + r(-16, 35, 10, 2, B)
    + g('st-orb', r(-12, 12, 2, 2, WH)))
})()
const GLOBE_CSS = '.st-land{animation:st-land 3s linear infinite}@keyframes st-land{100%{transform:translateX(-16px)}}'
  + '.st-orb{animation:st-orb 2.4s linear infinite}@keyframes st-orb{0%,100%{transform:translate(-10px,8px)}25%{transform:translate(0,-1px)}50%{transform:translate(10px,8px)}75%{transform:translate(0,17px)}}'
  + '@media (prefers-reduced-motion:reduce){.st-globe *{animation:none}}'

/** The crab acting out take `t` of `mood` on the stage, walking in from `from` (0 to 1), then wandering; `tip` shows
 *  over its head while the pointer is on it (the Svg must be drawn interactive for :hover). */
export function stageArt(mood: Mood, t = 0, from = STATION[mood], tip = ''): string {
  const to = STATION[mood], d = walkFor(from, to), go = d > 0, roam = ROAM[mood]
  let crab = crabArt(mood, t).replace('width="38" height="30"', `width="${W}" height="41"`)
  if (mood === 'web') crab = crab.replace(WEB_GLOBE, '').replace(WEB_WAVE, '')
  const steps = Math.ceil(d / .2), once = !!roam?.[2], legs = once ? Math.round(roam![0] / .4) : 'infinite'
  const css = '.st-at,.st-in{transform-box:view-box}'
    + `.st-at{transform:${x(to)}}`
    + (go ? `.st-go{animation:st-go ${+d.toFixed(2)}s ease-in-out}@keyframes st-go{0%{transform:${x(from)}}100%{transform:${x(to)}}}`
      + `.st-go .cb:not(.cb-walk) .cb-la{animation:cb-st .2s ease-in-out ${steps}}.st-go .cb:not(.cb-walk) .cb-lb{animation:cb-st .2s ease-in-out ${steps} -.1s}` : '')
    // The wander waits for the walk in, so the crab never jumps between the two.
    + (roam ? `.st-in{animation:st-r ${roam[0]}s ease-in-out ${+d.toFixed(2)}s ${once ? '1 forwards' : 'infinite'}}@keyframes st-r{${roam[1].map(([p, v]) => `${p}{transform:${x(v)}}`).join('')}}`
      + `.st-roam .cb:not(.cb-walk) .cb-la{animation:cb-st .4s ease-in-out ${+d.toFixed(2)}s ${legs}}.st-roam .cb:not(.cb-walk) .cb-lb{animation:cb-st .4s ease-in-out ${+(d + .2).toFixed(2)}s ${legs}}` : '')
    // The crab faces right, so it pitches forward over its front foot at (40, 38).
    + (mood === 'testf' ? `.st-tr{transform-box:view-box;transform-origin:0 0;animation:st-trip 2.4s ease-in-out ${+d.toFixed(2)}s 1 both}`
      + '@keyframes st-trip{0%,15%{transform:none}30%,75%{transform:translate(40px,38px) rotate(24deg) translate(-40px,-38px)}100%{transform:none}}' : '')
    // Pointer on the crab: the label shows over its head and rides with it; the crab keeps walking. The label
    // stays 3 s after the pointer leaves, then fades out in .2 s (Praj, 12 Oct: a pause stopped the crab, a quick
    // pass lost it).
    + '.st-tip{opacity:0;visibility:hidden;transition:opacity .2s 3s,visibility 0s 3.2s}.st-at:hover .st-tip{opacity:1;visibility:visible;transition:none}'
    // Dark ink on a light pill, light ink on a dark pill: crab orange read poorly (Praj, 12 Oct).
    + '.st-bg{fill:#f0eee6}.st-ink{fill:#1f1e1d}@media (prefers-color-scheme:dark){.st-bg{fill:#3a3936}.st-ink{fill:#f0eee6}}'
  // Stage-wide extras, drawn behind the crab (Praj, 12 Oct).
  let fx = '', fxCss = ''
  if (mood === 'fixed') {
    // A fix throws confetti across the whole stage, three falls.
    for (let i = 0; i < 18; i++) fx += `<rect x="${((i + .5) / 18 * 100 + ((i * 7) % 5 - 2)).toFixed(1)}%" y="-4" width="${i % 2 ? 3 : 2}" height="${i % 2 ? 2 : 3}" fill="${[Y, PINK, BLU, GRN, ORG][i % 5]}" class="st-cf" style="animation-delay:${(i * .29 % 1.6).toFixed(2)}s"/>`
    fxCss += '.st-cf{transform-box:fill-box;transform-origin:50% 50%;animation:st-cf 1.6s linear 3 both}@keyframes st-cf{0%{transform:translateY(0) rotate(0)}100%{transform:translateY(46px) rotate(360deg)}}'
  }
  if (go) {
    // Footprints along the walk-in, each laid as the crab passes, then fading (Praj, 12 Oct).
    trail(Math.max(2, Math.round(Math.abs(to - from) * 14)), from, to, 0, d).forEach(({ f, t }, k) => {
      const [a, b] = k % 2 ? [22, 36] : [17, 31]
      fx += `<g class="st-fp" style="transform:${x(f)};animation-delay:${t.toFixed(2)}s">${[a, b].map(v => `<rect x="${v}" y="39" width="3" height="1.5" fill="${G}"/>`).join('')}</g>`
    })
    fxCss += '.st-fp{transform-box:view-box;opacity:0;animation:st-fp 2.2s ease-in both}@keyframes st-fp{0%{opacity:0}5%{opacity:.6}100%{opacity:0}}'
  }
  if (mood === 'paint' && !t) {
    // The stripe behind it, each mark laid as the crab passes.
    trail(40, to, to + .4, d, roam![0]).forEach(({ f, t }) => fx += `<g class="st-sp" style="transform:${x(f)};animation-delay:${t.toFixed(2)}s">${r(4, 37, 14, 2.5, BLU)}</g>`)
    fxCss += '.st-sp{transform-box:view-box;animation:st-sp .3s ease-out both}@keyframes st-sp{0%{opacity:0}100%{opacity:1}}'
  }
  if (mood === 'sub' && !t) {
    // Two mini crabs trot the whole stage, half a lap apart.
    for (const delay of [0, -7]) fx += `<g class="st-mc" style="animation-delay:${delay}s"><g class="st-mb"><g transform="translate(0,28) scale(.4)">${MINI_BODY}</g></g></g>`
    fxCss += '.st-mc{transform-box:view-box;animation:st-mc 14s linear infinite}@keyframes st-mc{0%{transform:translateX(-14px)}100%{transform:translateX(100%)}}'
      + '.st-mb{animation:st-mb .3s ease-in-out infinite}@keyframes st-mb{50%{transform:translateY(-1px)}}'
  }
  // What rides with the crab, behind it: build's wall, web's curl, rings and globe.
  let rides = ''
  if (mood === 'web' && t === 2) { fx += SEA; rides = g('st-fx', CURL); fxCss += SURF_CSS }
  if (mood === 'web' && t === 0) { rides = g('st-fx', PING); fxCss += PING_CSS }
  // The globe is the take's prop, so reduced motion keeps it, still.
  if (mood === 'web' && t === 1) { rides = GLOBE; fxCss += GLOBE_CSS }
  // Build lays a wall leftward, course by course.
  if (mood === 'build' && !t) {
    const bricks = [...Array.from({ length: 10 }, (_, k) => [-2 - (k + 1) * 9, 34.5]), ...Array.from({ length: 9 }, (_, k) => [-6.5 - (k + 1) * 9, 30])]
    rides = g('st-fx', bricks.map(([bx, by], j) => `<rect x="${bx}" y="${by}" width="8" height="4" fill="${j % 2 ? BR2 : BR}" class="st-bk" style="animation-delay:${(d + .3 + j * .45).toFixed(2)}s"/>`).join(''))
    fxCss += '.st-bk{animation:st-bk .25s ease-out both}@keyframes st-bk{0%{opacity:0;transform:translateY(-6px)}100%{opacity:1;transform:none}}'
  }
  // The label, in the art's clear top 13.67 px; it ends at the crab's right edge on the right half of the stage
  // and starts at its left edge on the left half, so it never runs off. 13.5 tall: 12 read squashed (Praj, 12 Oct).
  // Only the spacing flexes to fit: stretched glyphs read squat and low-res (recording 12:30).
  const tw = +[...tip].reduce((t, c) => t + em(c) * 11.5, 0).toFixed(1), w = Math.round(tw + 8), side = (f: number) => f >= .5 ? W - w : 0, lx = side(to)
  // The crab crosses the middle while it walks in or wanders, so the label switches sides with it on the same clocks
  // (recording 12:24: "A command faile" ran off the right edge). Offsets from the resting side, held between steps.
  const swap = (name: string, at: (u: number) => number, clock: string) => {
    const k: string[] = []
    let was = NaN
    for (let i = 0; i <= 100; i++) {
      const v = side(at(i / 100)) - lx
      if (v !== was || i === 100) k.push(`${i}%{transform:translateX(${v}px)}`), was = v
    }
    return k.some(f => !f.includes('(0px)')) ? { css: `.${name}{animation:${name} ${clock}}@keyframes ${name}{${k.join('')}}`, name } : undefined
  }
  const lw = tip && go ? swap('st-lw', u => where(mood, from, d * u), `${+d.toFixed(2)}s step-end`) : undefined
  const lr = tip && roam ? swap('st-lr', u => where(mood, from, d + roam[0] * u), `${roam[0]}s step-end ${+d.toFixed(2)}s ${once ? '1 forwards' : 'infinite'}`) : undefined
  const wrap = (g: string) => [lr, lw].reduce((a, l) => l ? `<g class="${l.name}">${a}</g>` : a, g)
  const label = tip ? wrap(`<g class="st-tip"><rect x="${lx}" y="0" width="${w}" height="13.5" rx="3" class="st-bg"/>`
    + `<text x="${lx + 4}" y="10.6" font-family="sans-serif" font-size="11.5" text-rendering="geometricPrecision" class="st-ink" textLength="${tw}" lengthAdjust="spacing">`
    + `${tip.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text></g>`) : ''
  // Reduced motion: no extras, and the crab stands at its station without walking, wandering or riding; last, so
  // no later rule of the same weight starts a motion again (21 Oct: the walk-in and wander still played).
  const moving = ['.st-tr', go && '.st-go', roam && '.st-in', lw && '.st-lw', lr && '.st-lr'].filter(Boolean).join()
  const still = `@media (prefers-reduced-motion:reduce){.st-fx{display:none}${moving}{animation:none}.st-tr{transform:none}}`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="41"><style>${css}${fxCss}${lw?.css ?? ''}${lr?.css ?? ''}${still}</style>${fx ? g('st-fx', fx) : ''}`
    + `<g class="st-at${go ? ' st-go' : ''}${roam ? ' st-roam' : ''}"><g class="st-in"><rect width="${W}" height="41" fill="transparent"/>${rides}<g class="st-tr">${crab}</g>${label}</g></g></svg>`
}
