review_mode: solo:claude (2026-10-12, set at setup; the maintainer may change it)

# Shared Project Contract

**Read at entry:** [Project](#project), [Current state](#current-state) and the relevant
[Decisions](#decisions-and-assumptions) before substantive work. If your machine-level
instructions name a cross-project rules file, read it too.

**Verify** before claiming a change works: `claude plugin validate . < /dev/null` and
`claude plugin test .` (all tests pass). A change to the art is also checked by eye: build the
mood grid in Chromium and freeze the animations at a few moments.

**Review:** solo, Claude. Behaviour changes go test-first.

**Update this file** when a decision is made or the state moves. Keep it short.

## Project

crab-buddy: a Claude Code plugin (a mod: a hooks module with a UI render) that draws the orange
Claude crab above the prompt and acts out what the session is doing. No model calls, 0 tokens.

- `hooks/register.tsx`: the hooks. Tool calls, turns and compaction set the mood; the
  `AbovePrompt` render draws the band; other plugins' status lines move into the band.
- `hooks/crab.ts`: pure state: `classify` (tool → mood), `step`, `shown`, `take`, `MEANING`
  (the hover and caption text).
- `hooks/art.ts`: desktop art, SVG with CSS animation, four takes per mood.
- `hooks/term.tsx`: terminal art in quadrant block characters, animated by the terminal.
- `*.test.ts`: engine tests (`claude-code/testing`).
- `.claude-plugin/marketplace.json`: the repo is its own one-plugin marketplace.

## Decisions and assumptions

- 2026-10-12: Name stays crab-buddy; "claude-" names are reserved by Claude Code's validator.
- 2026-10-12: Shipped alone. The maintainer's other mods depend on their own setup.
- 2026-10-12: Each look holds at least 3 s, 8 s since 13:05 (no flashing); done and test results last 5 s so
  the hold can never swallow them. A repeat of the same mood keeps its take.
- 2026-10-12: The caption is a log of one-liners (`LINES`, ten a mood, no "or"), newest on top. The hover keeps `MEANING`.
- 2026-10-14 (0.9.5): Both caption lines always show, beside other lines and cards too, newest in `text` (white in
  dark), the older in `subtle`. Beside a status line the older one used to be dropped, which read as the line hiding it.
- 2026-10-16 (0.10.0): Compacting shows only when a compaction really runs. The squish waits for `classic.PreCompact`:
  a settings PreCompact hook that blocks (Praj's `compact_gate.py` holds auto-compaction mid-task) used to leave the
  crab squishing near the threshold for nothing.
- 2026-10-16 (0.10.0): Busy looks (think, read, test, long) have nine takes; each build scene a second take on the
  build's second lap (weld, drill, blueprint, sweep, crane), so ten scenes before one repeats. Five more caption
  lines for each. No new moods, so the terminal and hover labels are unchanged.
- 2026-10-16 (0.10.0): Every take is a 14 s scene, not one short loop: two beats (hop, admire, turn, stretch,
  shimmy, tilt) at ~5 s and ~10 s, each with an emote, picked per take from a hash of its name. Doze sleeps through.
- 2026-10-16: The crab's band stays crab height; 0.9.6's full-width status row is parked in `git stash`.
- 2026-10-12 (0.9.0): Desktop band paints the theme key `userMessageBackground`, never a hex. The old
  read of the CLI `theme` setting ignored the desktop app's own appearance, so light mode on Windows
  (and Mac) got a dark band. Keys follow the app live; hex, names and keys are the only accepted
  colours (CSS functions are refused).
- 2026-10-12 (0.9.1): Hover label is crab orange #D97757 with #1F1E1D text in every theme. `text` on
  `inverseText` read fine on the Mac but was unreadable on Windows in both themes (Praj's photos).
- 2026-10-12 (0.9.1): A new look or take walks on from where the crab stands now (`where()`: the walk,
  then the wander, with CSS ease-in-out solved in code), never from the old mood's spot, which snapped it
  back. Walks take 2.4 s per full stage (min .4 s); the wander starts after the walk.
- 2026-10-12 (0.9.0): Stage: on a band of 60+ columns the crab's Box is `width="50%"` and the SVG has
  markup `width="100%"` with no viewBox (Svg prop width 2000, capped by the Box). A numeric markup
  width scales the crab. Position is `translateX(calc((100% - 52px) * f))` with `transform-box:view-box`;
  `STATION` gives each mood its f, `ROAM` the idle/think/read/web/done/long/dizzy wanders, and a mood
  change walks in from the last station over 1.2 s. Under 60 columns: the 52x41 corner crab.
- 2026-10-12: Night owl uses the host's local hour.
- 2026-10-12: README images are previews rendered from the plugin's own art (`crabArt`, `frame`, `LINES`) in
  Chromium, not live captures: a live session shows the maintainer's other mods in the band. Topics picked by
  GitHub topic counts; Jev's ranking of them was mostly in its unsure band.
- 2026-10-11: Every other plugin's status line is drawn in the band, not the footer;
  `handoff-wait` (the maintainer's cache clock) is the one exception kept in the footer.
- 2026-10-12: Stage hover never stops the crab. The label rides with it, stays 3 s after the
  pointer leaves, and uses theme ink (dark on light, light on dark) instead of crab orange.
  A label pinned where the pointer entered was dropped: CSS can't freeze it without drifting.
  It fades out over .2 s. Text keeps natural glyph widths (11.5 px, `lengthAdjust="spacing"`), because
  `spacingAndGlyphs` stretched it. Known limit: a new look redraws the whole SVG, which cuts the label
  instantly, with no fade (recorded 12:35).
- 2026-10-12 (after 0.9.2): Stage extras: a failed test trips the crab and it slides back; a fix throws confetti
  across the stage; every walk leaves fading footprints; build lays a brick wall leftward; paint walks right
  leaving a stripe; subagents send two mini crabs across; web surfs a scrolling wave. Every extra sits under
  `.st-fx`, hidden for reduced motion. Calmer pacing (Praj, 12:55, "feels like ocd"): a take or build scene holds
  14 s (was 10), idle/doze/night 42 s (was 30); walks and wanders run at half speed (whole stage 4.8 s). The trip and
  the dizzy wobble keep their pace. A take change walks idle home, so it reaches only its first wander stop.
- 2026-10-21 (0.11.0, after Praj saw "a dashed line, not water"): web's stage extras go by take. Surf (web2) rides
  a 12 px rolling sea that scrolls left, 6 px up, in front of a breaking curl with spray; antenna (web) sends three
  rings; globe (web1) turns a big globe on a stand, which stays (still) under reduced motion. The old strip drew
  under every take, and its pattern tiles were not anchored to the strip, so a solid line sat over foam dashes. The
  stage drops the crab's own small globe and wave (`WEB_GLOBE`, `WEB_WAVE`); the narrow band keeps them. Fixed in
  the same release (audit with Astra): takes ran 8 s after the first (the take clock restarted on each change; the
  look now keeps its `seed`); Bash reads (`cat`, `grep`, `sed -n`, `ls`, `git log`...) show reading, not building;
  reduced motion stills the walk-in, wander and label swaps too, in a rule last in the style; sub's trotting
  minis only on its first take.
  Look hold (Praj, 13:05, "switches every 2-4 s"): a routine look (think, read, edit, web) holds 8 s, was 3. A held
  look (debug, dizzy, test results, done), a question or a squish cuts straight in, so none vanishes inside the dwell.
- 2026-10-12 (after 0.9.3): The ask look follows `classic.PermissionRequest` (a dialog really opened), not `tool.check`'s
  ask, which the mode settles after it: in auto mode the classifier approved most calls unseen and the crab held up
  its "?" sign (the "blue ? box") for nobody. AskUserQuestion still asks through `classify`.
- Calibrated, not derived: the band's bottom margin `1.16` matches a 18.5 px line height
  (dark theme, 100% app zoom). Larger text leaves a thin line below; lower it.
- An SVG `<style>` is parsed as XML: a `<` even inside a CSS comment drops every later rule.
  A test guards it.

- 2026-10-16: The glossary (`docs/glossary.html`) is the vocabulary for asking for changes: band, caption, stage, station,
  mood, look, take, scene, work loop, beat, emote, prop, set, stage extra, build scene, lap, dwell, cut, hold. Use its
  words in code comments, tests and commits; add a term there when a new part is named.

## Current state

2026-10-21: v0.11.0 (web by take, real surf; 8 s take clock, Bash reads, reduced motion, doubled minis fixed), 47 tests pass; rendered in Chromium dark and light, with and without reduced motion. Not yet seen live.
2026-10-16: v0.10.0 (compacting only when real; nine takes for busy looks, ten build scenes; 14 s scenes with beats), 46 tests pass. README rewritten for reach (badges, why, FAQ, glossary, every-take sheet `docs/takes.png`, social card `docs/social.png`); `docs/glossary.html` (from `bun docs/glossary.ts`, served on GitHub Pages) is the shared vocabulary for change requests. `bun docs/shots/make.ts` rebuilds all images and the glossary.
2026-10-14: v0.9.5 (two caption lines always, newest in full text colour), 43 tests pass; seen live in dark and light (02:10-02:12).
2026-10-12: v0.9.4 (the "?" follows real permission dialogs only), 43 tests pass. v0.9.3 (stage extras: trip, confetti, footprints, wall, paint stripe, mini crabs, wave; calmer pacing: 8 s look hold, 14 s takes, half-speed walks); extras seen live in dark (13:01-13:05), all in Chromium dark and light. v0.9.2 (the crab keeps walking on hover, theme-ink label rides with it and fades out); seen live in dark and light. v0.9.1 (no snap-back, readable hover label). v0.9.0 band confirmed light on Windows (Praj's photos). Seen live in the maintainer's Mac desktop
app as a renamed dev mod: band fill matched the transcript in dark (#151515) and light (#fcfcfb); the crab
walked between stations. Not yet seen on Windows. README images still show 0.8.0's corner crab.
