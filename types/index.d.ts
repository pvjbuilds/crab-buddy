export type Mood =
  | 'idle' | 'think' | 'read' | 'build' | 'test' | 'testp' | 'testf' | 'debug' | 'done' | 'doze'
  | 'web' | 'sub' | 'codex' | 'git' | 'inst' | 'ask' | 'long' | 'comp' | 'dizzy' | 'fixed' | 'night'
  | 'saw' | 'type' | 'paint' | 'gear'
  | 'browse' | 'mcp' | 'plan' | 'skill' | 'sync' | 'ship'
/** What really happened this turn (0.12.0): shown on the stage and in the closing caption, never invented. */
export type Tally = { subs: number; edits: number; files: string[]; testRuns: number; testOk: boolean | null; took: number }
export type Trait = 'tester' | 'builder' | 'reader' | 'surfer' | 'manager' | 'fixer'
export type Profile = { edits: number; reads: number; green: number; red: number; web: number; subs: number; failedCommands: number; fixes: number; ships: number }
export type ProjectMemory = { v: 1; sessions: number; lastAt: number; lastTrait?: string; green: number; red: number; edits: number }
export type Crab = { profile: Profile; mood: Mood; until: number; fails: number; testFailed: boolean; turnAt: number | null; lastActive: number; n: Tally }

declare module 'claude-code' {
  interface PluginState {
    'crab-buddy': { crab: Crab; look: { mood: Mood; take: number; at: number; log: string[]; from?: number; seed?: number; season?: 'friday' | 'weekend' | 'sundayNight' | 'christmas' | 'newYear'; year?: number; trait?: Trait; n?: { subs: number; files: number } }; lines: Record<string, string>; company: boolean }
  }
}
