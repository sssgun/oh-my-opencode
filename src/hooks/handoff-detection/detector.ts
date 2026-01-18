import { HANDOFF_TRIGGERS } from "./constants"
import type { HandoffTrigger, HandoffDetectionResult } from "./types"
import { log } from "../../shared"

/**
 * Session activity tracker
 */
class SessionTracker {
  private static sessions = new Map<string, {
    lastActivity: number
    startTime: number
    messageCount: number
    toolUsage: string[]
    currentTask?: string
  }>()

  static updateActivity(sessionId: string, activity: {
    timestamp: number
    messageId?: string
    agent?: string
    hasTools?: boolean
  }) {
    const session = this.sessions.get(sessionId) || {
      lastActivity: 0,
      startTime: Date.now(),
      messageCount: 0,
      toolUsage: [],
    }

    session.lastActivity = activity.timestamp
    session.messageCount++

    if (activity.hasTools) {
      session.toolUsage.push(activity.agent || 'unknown')
    }

    this.sessions.set(sessionId, session)
  }

  static getSessionState(sessionId: string) {
    return this.sessions.get(sessionId)
  }

  static getAllSessions() {
    return Array.from(this.sessions.entries())
  }

  static cleanupOldSessions(maxAge: number = 24 * 60 * 60 * 1000) { // 24 hours
    const now = Date.now()
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > maxAge) {
        this.sessions.delete(sessionId)
      }
    }
  }
}

/**
 * Detect explicit handoff commands in message text
 */
export function detectExplicitHandoff(text: string): HandoffTrigger | null {
  const lowerText = text.toLowerCase()

  for (const command of HANDOFF_TRIGGERS.EXPLICIT_COMMANDS) {
    if (lowerText.includes(command)) {
      return {
        type: 'explicit',
        reason: `Explicit handoff command: ${command}`,
        confidence: 1.0,
        metadata: { command },
      }
    }
  }

  return null
}

/**
 * Detect idle-based handoff triggers
 */
export function detectIdleHandoff(sessionId: string, currentTime: number): HandoffTrigger | null {
  const session = SessionTracker.getSessionState(sessionId)

  if (!session) {
    return null
  }

  const idleTime = currentTime - session.lastActivity

  // Check for extended idle periods
  if (idleTime > HANDOFF_TRIGGERS.IDLE_TIMEOUT) {
    return {
      type: 'idle',
      reason: `Session idle for ${(idleTime / 60000).toFixed(1)} minutes`,
      confidence: Math.min(idleTime / (HANDOFF_TRIGGERS.IDLE_TIMEOUT * 2), 1.0),
      metadata: { idleTime, lastActivity: session.lastActivity },
    }
  }

  // Check for short-term inactivity
  if (idleTime > HANDOFF_TRIGGERS.INACTIVITY_PERIOD) {
    return {
      type: 'idle',
      reason: `Short-term inactivity: ${(idleTime / 60000).toFixed(1)} minutes`,
      confidence: 0.6,
      metadata: { idleTime, lastActivity: session.lastActivity },
    }
  }

  return null
}

/**
 * Detect session duration-based triggers
 */
export function detectSessionHandoff(sessionId: string, currentTime: number): HandoffTrigger | null {
  const session = SessionTracker.getSessionState(sessionId)

  if (!session) {
    return null
  }

  const sessionDuration = currentTime - session.startTime

  if (sessionDuration > HANDOFF_TRIGGERS.SESSION_DURATION) {
    return {
      type: 'session',
      reason: `Long session duration: ${(sessionDuration / 3600000).toFixed(1)} hours`,
      confidence: Math.min(sessionDuration / (HANDOFF_TRIGGERS.SESSION_DURATION * 1.5), 1.0),
      metadata: { sessionDuration, startTime: session.startTime },
    }
  }

  return null
}

/**
 * Detect complexity-based triggers from agent and task analysis
 */
export function detectComplexityHandoff(text: string, agent?: string): HandoffTrigger | null {
  const lowerText = text.toLowerCase()

  // Check for high-complexity task indicators
  for (const task of HANDOFF_TRIGGERS.HIGH_COMPLEXITY_TASKS) {
    if (lowerText.includes(task.replace('-', ' ')) || lowerText.includes(task)) {
      return {
        type: 'complexity',
        reason: `High-complexity task detected: ${task}`,
        confidence: 0.8,
        metadata: { taskType: task, detectedIn: 'content' },
      }
    }
  }

  // Check agent-based complexity
  if (agent === 'oracle') {
    return {
      type: 'complexity',
      reason: 'Oracle agent invoked for complex analysis',
      confidence: 0.7,
      metadata: { agent, reason: 'architectural analysis' },
    }
  }

  return null
}

/**
 * Main handoff detection function
 */
export function detectHandoffTrigger(
  sessionId: string,
  text: string,
  options: {
    timestamp: number
    agent?: string
    hasTools?: boolean
    messageId?: string
  }
): HandoffDetectionResult {
  // Update session activity
  SessionTracker.updateActivity(sessionId, {
    timestamp: options.timestamp,
    messageId: options.messageId,
    agent: options.agent,
    hasTools: options.hasTools,
  })

  // Clean up old sessions periodically
  SessionTracker.cleanupOldSessions()

  const results: HandoffTrigger[] = []

  // Check for explicit commands (highest priority)
  const explicit = detectExplicitHandoff(text)
  if (explicit) {
    results.push(explicit)
  }

  // Check for complexity-based triggers
  const complexity = detectComplexityHandoff(text, options.agent)
  if (complexity) {
    results.push(complexity)
  }

  // Check for session-based triggers
  const sessionTrigger = detectSessionHandoff(sessionId, options.timestamp)
  if (sessionTrigger) {
    results.push(sessionTrigger)
  }

  // Check for idle-based triggers
  const idleTrigger = detectIdleHandoff(sessionId, options.timestamp)
  if (idleTrigger) {
    results.push(idleTrigger)
  }

  if (results.length === 0) {
    return {
      shouldTrigger: false,
      confidence: 0,
      reason: 'No handoff triggers detected',
    }
  }

  // Select the highest confidence trigger
  const bestTrigger = results.reduce((best, current) =>
    current.confidence > best.confidence ? current : best
  )

  // Determine recommended platforms based on trigger type
  const recommendedPlatforms = getRecommendedPlatforms(bestTrigger)

  log(`[handoff-detection] Trigger detected: ${bestTrigger.type} (${bestTrigger.confidence.toFixed(2)})`, {
    sessionId,
    reason: bestTrigger.reason,
    platforms: recommendedPlatforms,
  })

  return {
    shouldTrigger: bestTrigger.confidence > 0.5, // Threshold for triggering
    trigger: bestTrigger,
    confidence: bestTrigger.confidence,
    reason: bestTrigger.reason,
    recommendedPlatforms,
  }
}

/**
 * Get recommended platforms based on trigger type
 */
function getRecommendedPlatforms(trigger: HandoffTrigger): Array<'claude-code' | 'cursor' | 'opencode'> {
  switch (trigger.type) {
    case 'explicit':
      // For explicit commands, support all platforms
      return ['claude-code', 'cursor', 'opencode']

    case 'complexity':
      // Complex tasks work well in Claude Code for analysis
      return ['claude-code', 'cursor']

    case 'session':
      // Long sessions benefit from fresh environment
      return ['claude-code', 'cursor']

    case 'idle':
      // Idle sessions can be resumed in any platform
      return ['claude-code', 'cursor', 'opencode']

    default:
      return ['claude-code', 'cursor']
  }
}