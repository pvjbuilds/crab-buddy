# Crab Buddy: an animated pixel-art crab for Claude Code

[![Version](https://img.shields.io/github/v/release/pvjbuilds/crab-buddy?label=version&color=D97757)](https://github.com/pvjbuilds/crab-buddy/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-1D9E75)](LICENSE)
[![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-D97757)](#install-update-remove)
[![Cost: 0 tokens](https://img.shields.io/badge/cost-0%20tokens-378ADD)](#faq)

**A Claude Code plugin that puts the orange Claude crab just above your prompt and has it act
out what Claude is doing.** It reads with a magnifier while Claude reads files, hammers while
files change, cheers when tests pass, sweats through a long turn and dozes off when you step
away. It works in the Claude Code desktop app and in the terminal, in light and dark themes,
and it costs **0 tokens**.

![Crab Buddy walking across its stage above the prompt: thinking, reading with a magnifier, hammering while a brick wall grows, a green check for passing tests, and done, leaving footprints between spots. A caption on the left scrolls one-liners, the newest such as 'All green. Happy crab.' in full colour and the one before dimmer under it](docs/hero.png)

```bash
claude plugin marketplace add pvjbuilds/crab-buddy
claude plugin install crab-buddy@crab-buddy
```

Start a new session and the crab is there.

## Why

A long agent turn is a wall of tool calls. Crab Buddy turns it into something you can read
from across the room: one glance tells you whether Claude is thinking, reading, building,
testing, stuck on a failure or waiting for you. It is a status light with a personality, and
it never spends a token or touches the network.

## Screenshots

### Desktop app

| Dark theme | Light theme |
|---|---|
| ![Claude Code desktop app, dark theme: the crab hammers on the right half of the band above the prompt box, laying a brick wall as it goes. The caption on the left shows 'Hammering out the changes.' in full colour and 'Skimming code at crab speed.' dimmer below it.](docs/app-dark.png) | ![Claude Code desktop app, light theme: the same crab and caption on the app's light background.](docs/app-light.png) |

### Terminal

| Dark theme | Light theme |
|---|---|
| ![Claude Code in a dark terminal: the crab, drawn in block characters, builds a brick wall just above the prompt box while Claude edits a file.](docs/terminal-dark.png) | ![Claude Code in a light terminal: the same block-character crab above the prompt box.](docs/terminal-light.png) |

### Every take

110 takes across 25 moods, each labelled with the name the [glossary](#glossary) uses for it.

![A grid of all 110 takes, each labelled: idle to idle3, think to think8 (a lightbulb, chess, gears, a chalkboard, a puzzle), read to read8 (magnifier, book, newspaper, telescope, file drawer, map), ten build scenes (hammer and wall, welding, saw, drill, laptop, blueprint, paint roller, broom, gears, crane), test to test8 (flask, checklist, stopwatch, thermometer, scales, microscope, progress bar), test results, debug, dizzy, fixed, done, doze, night owl, web, subagent, another model, git, install, ask, long turn and compacting.](docs/takes.png)

## Features

- **25 moods, 110 takes.** Thinking, reading, testing and long turns have nine takes each;
  a long build runs ten scenes before one repeats. The first take is picked by the moment the
  mood began, so two test runs in a row rarely look the same.
- **Scenes, not loops.** Each take plays as a 14-second scene: the crab works, stops for a
  beat (a hop, a stretch, a look back at its work) with a little emote, works on, then takes
  a second, different beat.
- **Nothing flashes.** A look holds at least 8 seconds before the next mood replaces it.
  Results that matter (an error, a test result, a question for you, done) cut straight in.
- **A caption with personality.** Ten to fifteen one-liners per mood ("Close, but no
  seaweed.", "Git it done.") scroll down like a terminal, newest on top. Point at the crab to
  see the plain meaning.
- **A stage, not a corner.** In the desktop app the crab owns the right half of the band. It
  walks to a spot for each mood, leaves footprints, wanders while idle, scuttles home when
  done and curls up at the right edge to doze. In a narrow window it falls back to the corner.
- **Honest.** Compacting shows only when a compaction really runs; the "?" only when you are
  really asked something.
- **Desktop and terminal.** The desktop app gets smooth CSS animation. The terminal gets the
  welcome-screen crab in block characters, animated by the terminal itself.
- **Light and dark themes.** In the desktop app the band follows the app's theme the moment
  you switch it. It respects "reduce motion".
- **Zero cost.** No model calls, no network, no file writes. It runs on Claude Code's plugin
  hooks.

## What each mood means

| What Claude is doing | What the crab does |
|---|---|
| Thinking | Sways, plays chess, sketches on a chalkboard, fits a puzzle, gets an idea |
| Reading or searching files | Magnifier, book, newspaper, telescope, file drawer, scanner, map |
| Editing files or running commands | Builds a wall, saws, types, paints, turns gears; then welds, drills, drafts a blueprint, sweeps up, runs a crane (a new scene every 14 s) |
| Running tests | Flask, checklist, stopwatch, thermometer, scales, microscope, a progress bar; cheers on a pass, trips on a fail |
| A command failed | An exclamation mark; three failures in a row and it gets dizzy |
| Tests pass again after a failure | Confetti across the whole stage |
| Searching the web | Globe, surfboard or wifi waves |
| A subagent is working | A mini crab carries a box |
| Another model is working (Codex, Gemini) | Hands a parcel to a robot |
| Committing or pushing with git | Rocket, stamp or a commit graph |
| Installing a package | A parcel drops in |
| Waiting for your reply | A question mark |
| A turn past 5 minutes | Coffee, an hourglass, a fan, a snack, a racing clock, a draining battery, a treadmill |
| Compacting the conversation | Squashes flat, only once a compaction really runs |
| Done | Jumps, dances or bows |
| Idle, then dozing after 10 minutes | Fidgets, then sleeps; between midnight and 5 am it's a night owl |

## Install, update, remove

Tested on Claude Code 2.1.296.

```bash
# install
claude plugin marketplace add pvjbuilds/crab-buddy
claude plugin install crab-buddy@crab-buddy

# update
claude plugin marketplace update crab-buddy
claude plugin update crab-buddy@crab-buddy

# remove
claude plugin uninstall crab-buddy@crab-buddy
```

The crab shows in sessions started after an install or update.

## FAQ

**Does it cost tokens or slow Claude down?** No. It makes no model calls and no network
requests. The animation is CSS in the desktop app and the terminal's own frame clock in a
terminal, so nothing runs per frame in Claude Code.

**Does it work with my other plugins?** Yes. Other plugins' status lines move into the crab's
band, so they show in one place instead of piling up in the footer. Turn Crab Buddy off and
they go back to the footer.

**Which platforms?** It has been checked in the desktop app on macOS and Windows and in macOS
terminals. It uses nothing platform-specific, so it should run wherever Claude Code's plugin
hooks run.

**Can it keep still?** In the desktop app, turn on "reduce motion" in your OS and the crab
stops moving; the caption keeps working.

**Can I change how it behaves?** Yes, it is MIT. Fork it, and use the [glossary](#glossary)
to name the part you want changed, to yourself or to your coding agent.

## Good to know

- **The caption always shows two lines.** The newest in full text colour, the one before it
  dimmer, whether or not other plugins' lines sit beside it.
- **In the terminal, a theme change shows in the next session.** The terminal theme is read
  when a session starts.
- **The band is tuned for 100% app zoom.** At other zoom levels the app may leave a thin
  line at the band's edge.

## Glossary

One word for each part of the crab, so a change can be asked for in one sentence ("make
think5's work loop slower", "dwell 5 s", "no hearts on test"). The full version, with every
term's place in the code, a scene timeline and a live atlas of all 110 takes, is
**[the glossary page](https://pvjbuilds.github.io/crab-buddy/glossary.html)**
([source](docs/glossary.html), regenerated by `bun docs/glossary.ts`).

| Term | What it is |
|---|---|
| **band** | The strip right above the prompt box. Crab height, never taller. |
| **caption** | The two one-liners on the band's left, newest on top. |
| **stage** | The band's right half, where the crab walks (desktop app). |
| **station** | The crab's spot on the stage for a mood, 0 (left) to 1 (right). |
| **mood** | What Claude is doing, one of 25 ids: `think`, `read`, `build`, `test`… |
| **take** | One version of a mood: `think`, `think1` … `think8`. |
| **look** | The mood and take on screen right now. |
| **scene** | The 14 s a take plays: work, a beat, work, another beat. |
| **work loop** | The take's own repeating motion, such as the hammer swing. |
| **beat** | A break in the scene where the whole crab hops, admires, turns, stretches, shimmies or tilts. |
| **emote** | The tiny icon over its shoulder during a beat: !, ♪, spark, ?, heart, sweat. |
| **prop / set / stage extra** | On the crab / beside it / across the whole stage (wall, stripe, confetti, footprints). |
| **build scene / lap** | The five moods a build rotates through; a lap is one pass, and the second lap plays their second takes. |
| **dwell / hold** | 8 s, the least a look stays / 5 s, how long a result shows. |
| **one-liner / meaning** | A caption line / the plain text on hover. |

## For AI agents

If a user asks you to install, check, remove or change Crab Buddy, here is everything you
need.

| | |
|---|---|
| What it is | A Claude Code plugin (a hooks module with a UI render). Its own one-plugin marketplace. |
| Plugin id | `crab-buddy@crab-buddy` |
| Install | `claude plugin marketplace add pvjbuilds/crab-buddy`, then `claude plugin install crab-buddy@crab-buddy` |
| Check it installed | `claude plugin list` shows `crab-buddy@crab-buddy` as enabled |
| Takes effect | In the next new session; the current session is unchanged |
| Remove | `claude plugin uninstall crab-buddy@crab-buddy` |
| Cost and access | No model calls, no network, no file writes. Reads Claude Code's `theme` setting at session start. |
| Side effect | Other plugins' status lines draw in the crab's band instead of the footer |
| Vocabulary | Map the user's words to code with the [glossary](#glossary); `docs/glossary.html` names the constant behind every term |

Code map:

| File | Holds |
|---|---|
| `hooks/crab.ts` | Pure mood logic: `classify` (tool call to mood), `step`, `shown`, `take`, `MEANING`, `LINES` |
| `hooks/art.ts` | Desktop SVG art: `LOOK` (take 0), `TAKE` (the rest), `BEATS`, `EMOTE`, `STATION`, `ROAM`, `stageArt` |
| `hooks/term.tsx` | Terminal art in quadrant block characters |
| `hooks/register.tsx` | The hooks: tool calls, turns and compaction set the mood; the `AbovePrompt` render draws the band; `DWELL`, `CUT` |
| `CONTEXT.md` | Design decisions and the current state |

Before claiming a change works, run the checks below. After a change to the art, rebuild the
images with `bun docs/shots/make.ts` and look at them.

## Develop

```bash
claude plugin validate .
claude plugin test .
bun docs/shots/make.ts   # README images, social card and glossary (needs Chrome and ffmpeg)
```

To see edits live without reinstalling, start Claude Code with `claude --plugin-dir .` from
this folder; edits reload at the end of each turn.

## Changelog

See [Releases](https://github.com/pvjbuilds/crab-buddy/releases). Recent:

- **0.10.0**: scenes, not loops; 110 takes; ten build scenes; compacting only when real.
- **0.9.5**: both caption lines always show, newest in full text colour.
- **0.9.4**: the "?" follows real permission dialogs only.
- **0.9.3**: stage extras (wall, paint stripe, confetti, footprints, the trip) and a calmer pace.

## License

MIT, for the code in this repository.

Crab Buddy is a fan project. It is not made, endorsed or supported by Anthropic. Claude,
Claude Code and the Claude crab character are Anthropic's; the crab here is drawn after the
one on Claude Code's welcome screen.
