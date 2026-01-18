export const HOOK_NAME = "handoff-detection" as const

export const HANDOFF_DETECTION_TAG_OPEN = "<handoff-detection>"
export const HANDOFF_DETECTION_TAG_CLOSE = "</handoff-detection>"

// Handoff trigger conditions
export const HANDOFF_TRIGGERS = {
  // Time-based triggers
  IDLE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  SESSION_DURATION: 4 * 60 * 60 * 1000, // 4 hours

  // Activity-based triggers
  INACTIVITY_PERIOD: 10 * 60 * 1000, // 10 minutes of no activity

  // Explicit triggers
  EXPLICIT_COMMANDS: new Set([
    "/handoff",
    "/switch-platform",
    "/pause-work",
    "/transfer-context",
  ]),

  // Context-based triggers
  HIGH_COMPLEXITY_TASKS: new Set([
    "architecture-review",
    "security-audit",
    "performance-optimization",
    "multi-system-integration",
  ]),
} as const

// Platform transition priorities
export const PLATFORM_PRIORITIES = {
  CLAUDE_CODE: 1,
  CURSOR: 2,
  OPENCODE: 3,
} as const

// Handoff states
export const HANDOFF_STATES = {
  DETECTED: "detected",
  PREPARING: "preparing",
  READY: "ready",
  TRANSFERRING: "transferring",
  COMPLETED: "completed",
  FAILED: "failed",
} as const