type ClaudeCodeSessionState = {
  subagentSessions: Set<string>
  mainSessionID: string | undefined
  sessionAgentMap: Map<string, string>
}

const GLOBAL_KEY = "__ohMyOpenCode_claudeCodeSessionState"
const globalState = (globalThis as unknown as Record<string, ClaudeCodeSessionState>)[GLOBAL_KEY] ?? {
  subagentSessions: new Set<string>(),
  mainSessionID: undefined,
  sessionAgentMap: new Map<string, string>(),
}

;(globalThis as unknown as Record<string, ClaudeCodeSessionState>)[GLOBAL_KEY] = globalState

export const subagentSessions = globalState.subagentSessions

export function setMainSession(id: string | undefined) {
  globalState.mainSessionID = id
}

export function getMainSessionID(): string | undefined {
  return globalState.mainSessionID
}

const sessionAgentMap = globalState.sessionAgentMap

/**
 * Test-only helper to ensure deterministic module state across Bun test workers.
 */
export function __resetSessionStateForTests(): void {
  globalState.mainSessionID = undefined
  globalState.subagentSessions.clear()
  globalState.sessionAgentMap.clear()
}

/**
 * @deprecated Use __resetSessionStateForTests instead
 */
export const _resetForTesting = __resetSessionStateForTests

export function setSessionAgent(sessionID: string, agent: string): void {
  if (!sessionAgentMap.has(sessionID)) {
    sessionAgentMap.set(sessionID, agent)
  }
}

export function updateSessionAgent(sessionID: string, agent: string): void {
  sessionAgentMap.set(sessionID, agent)
}

export function getSessionAgent(sessionID: string): string | undefined {
  return sessionAgentMap.get(sessionID)
}

export function clearSessionAgent(sessionID: string): void {
  sessionAgentMap.delete(sessionID)
}
