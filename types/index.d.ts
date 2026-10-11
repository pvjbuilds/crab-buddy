export type Mood =
  | 'idle' | 'think' | 'read' | 'build' | 'test' | 'testp' | 'testf' | 'debug' | 'done' | 'doze'
  | 'web' | 'sub' | 'codex' | 'git' | 'inst' | 'ask' | 'long' | 'comp' | 'dizzy' | 'fixed' | 'night'
  | 'saw' | 'type' | 'paint' | 'gear'
export type Crab = { mood: Mood; until: number; fails: number; testFailed: boolean; turnAt: number | null; lastActive: number }

declare module 'claude-code' {
  interface PluginState {
    'crab-buddy': { crab: Crab; look: { mood: Mood; take: number; at: number; log: string[] }; lines: Record<string, string>; light: boolean }
  }
}
