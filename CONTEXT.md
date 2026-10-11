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
- 2026-10-12: Each look holds at least 3 s (no flashing); done and test results last 5 s so
  the hold can never swallow them. A repeat of the same mood keeps its take.
- 2026-10-12: The caption is a log of one-liners (`LINES`, ten a mood, no "or"), newest on top:
  two lines when the crab is alone, one beside other lines and cards. The hover keeps `MEANING`.
- 2026-10-12: Light theme: no dark paint; the theme is read at session start only.
- 2026-10-12: Night owl uses the host's local hour.
- 2026-10-11: Every other plugin's status line is drawn in the band, not the footer;
  `handoff-wait` (the maintainer's cache clock) is the one exception kept in the footer.
- Calibrated, not derived: the band's bottom margin `1.16` matches a 18.5 px line height
  (dark theme, 100% app zoom). Larger text leaves a thin line below; lower it.
- An SVG `<style>` is parsed as XML: a `<` even inside a CSS comment drops every later rule.
  A test guards it.

## Current state

2026-10-12: v0.8.0. 31 tests pass. Live in the maintainer's desktop app: 0.5.0 motion confirmed;
0.6.0 takes and 0.7.0/0.8.0 hold, caption and theme not yet seen live. Light theme never seen live.
