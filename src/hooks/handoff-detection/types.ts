import type { CrossPlatformContext } from "../../shared/cross-platform-context"

export interface HandoffDetectionHookInput {
  sessionID: string
  agent?: string
  model?: { providerID: string; modelID: string }
  messageID?: string
  timestamp: number
}

export interface HandoffDetectionHookOutput {
  message: Record<string, unknown>
  parts: Array<{ type: string; text?: string; [key: string]: unknown }>
}

export interface HandoffTrigger {
  type: 'idle' | 'session' | 'explicit' | 'complexity' | 'manual'
  reason: string
  confidence: number // 0-1
  metadata?: Record<string, unknown>
}

export interface HandoffContext {
  sessionId: string
  trigger: HandoffTrigger
  timestamp: string
  currentWorkState: {
    activeFiles: string[]
    recentChanges: string[]
    currentTask?: string
    completionStatus?: string
  }
  targetPlatforms: Array<'claude-code' | 'cursor' | 'opencode'>
  priority: 'low' | 'normal' | 'high' | 'critical'
}

export interface HandoffPreparationResult {
  success: boolean
  context?: CrossPlatformContext
  planningDocuments?: string[]
  error?: string
  estimatedDuration: number // in milliseconds
}

export interface HandoffDetectionResult {
  shouldTrigger: boolean
  trigger?: HandoffTrigger
  confidence: number
  reason: string
  recommendedPlatforms?: Array<'claude-code' | 'cursor' | 'opencode'>
}