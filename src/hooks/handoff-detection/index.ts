import { detectHandoffTrigger } from "./detector"
import { executeHandoffPreparation, formatHandoffDetectionMessage } from "./executor"
import { HOOK_NAME, HANDOFF_DETECTION_TAG_OPEN, HANDOFF_DETECTION_TAG_CLOSE } from "./constants"
import type {
  HandoffDetectionHookInput,
  HandoffDetectionHookOutput,
  HandoffContext,
} from "./types"
import { log } from "../../shared"

export * from "./detector"
export * from "./executor"
export * from "./constants"
export * from "./types"

export interface HandoffDetectionHookOptions {
  autoTrigger?: boolean
  confidenceThreshold?: number
  enabledPlatforms?: Array<'claude-code' | 'cursor' | 'opencode'>
}

export function createHandoffDetectionHook(options: HandoffDetectionHookOptions = {}) {
  const {
    autoTrigger = true,
    confidenceThreshold = 0.7,
    enabledPlatforms = ['claude-code', 'cursor', 'opencode'],
  } = options

  return {
    "chat.message": async (
      input: HandoffDetectionHookInput,
      output: HandoffDetectionHookOutput
    ): Promise<void> => {
      try {
        // Extract text content from message parts
        const textContent = extractTextContent(output.parts)

        if (!textContent) {
          return
        }

        // Detect handoff triggers
        const detectionResult = detectHandoffTrigger(
          input.sessionID,
          textContent,
          {
            timestamp: input.timestamp,
            agent: input.agent,
            hasTools: hasToolUsage(output.parts),
            messageId: input.messageID,
          }
        )

        // Check if we should trigger handoff
        if (!detectionResult.shouldTrigger || detectionResult.confidence < confidenceThreshold) {
          return
        }

        // Filter to enabled platforms
        const availablePlatforms = detectionResult.recommendedPlatforms?.filter(
          platform => enabledPlatforms.includes(platform)
        ) || []

        if (availablePlatforms.length === 0) {
          log(`[handoff-detection] No enabled platforms available for handoff`, {
            sessionId: input.sessionID,
            requestedPlatforms: detectionResult.recommendedPlatforms,
            enabledPlatforms,
          })
          return
        }

        log(`[handoff-detection] Handoff trigger activated`, {
          sessionId: input.sessionID,
          trigger: detectionResult.trigger?.type,
          confidence: detectionResult.confidence,
          platforms: availablePlatforms,
        })

        if (autoTrigger) {
          // Prepare handoff context
          const handoffContext: HandoffContext = {
            sessionId: input.sessionID,
            trigger: detectionResult.trigger!,
            timestamp: new Date(input.timestamp).toISOString(),
            currentWorkState: {
              activeFiles: [], // Would be populated by actual file tracking
              recentChanges: [], // Would be populated by git tracking
              currentTask: extractCurrentTask(textContent),
            },
            targetPlatforms: availablePlatforms,
            priority: detectionResult.confidence > 0.8 ? 'high' : 'normal',
          }

          // Execute handoff preparation asynchronously
          setImmediate(async () => {
            try {
              const result = await executeHandoffPreparation(handoffContext)

              if (result.success) {
                log(`[handoff-detection] Handoff preparation completed successfully`, {
                  sessionId: input.sessionID,
                  documents: result.planningDocuments?.length,
                  duration: result.estimatedDuration,
                })
              } else {
                log(`[handoff-detection] Handoff preparation failed`, {
                  sessionId: input.sessionID,
                  error: result.error,
                  duration: result.estimatedDuration,
                })
              }
            } catch (error) {
              log(`[handoff-detection] Handoff preparation error`, {
                sessionId: input.sessionID,
                error: error instanceof Error ? error.message : String(error),
              })
            }
          })
        }

        // Add handoff detection message to output
        const detectionMessage = formatHandoffDetectionMessage({
          shouldTrigger: true,
          reason: detectionResult.reason,
          confidence: detectionResult.confidence,
          recommendedPlatforms: availablePlatforms,
        })

        if (detectionMessage) {
          // Insert detection message at the beginning of the response
          const textPartIndex = output.parts.findIndex(part => part.type === 'text')
          if (textPartIndex >= 0) {
            output.parts[textPartIndex].text =
              detectionMessage + '\n\n' + (output.parts[textPartIndex].text || '')
          } else {
            output.parts.unshift({
              type: 'text',
              text: detectionMessage,
            })
          }
        }

      } catch (error) {
        log(`[handoff-detection] Hook execution error`, {
          sessionId: input.sessionID,
          error: error instanceof Error ? error.message : String(error),
        })

        // Don't modify output on error to avoid breaking the chat flow
      }
    },
  }
}

/**
 * Extract text content from message parts
 */
function extractTextContent(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter(part => part.type === 'text' && part.text)
    .map(part => part.text!)
    .join(' ')
}

/**
 * Check if message parts contain tool usage
 */
function hasToolUsage(parts: Array<{ type: string; [key: string]: unknown }>): boolean {
  return parts.some(part => part.type === 'tool_use' || part.type === 'tool_result')
}

/**
 * Extract current task from message content (simple heuristic)
 */
function extractCurrentTask(text: string): string | undefined {
  // Look for task-related keywords
  const taskIndicators = [
    'implementing',
    'working on',
    'fixing',
    'adding',
    'updating',
    'refactoring',
    'creating',
  ]

  const lowerText = text.toLowerCase()
  for (const indicator of taskIndicators) {
    if (lowerText.includes(indicator)) {
      // Extract a reasonable task description
      const words = text.split(' ').slice(0, 10)
      return words.join(' ').trim() + (words.length === 10 ? '...' : '')
    }
  }

  return undefined
}