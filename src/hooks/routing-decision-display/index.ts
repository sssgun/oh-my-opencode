import type { PluginInput } from "@opencode-ai/plugin"
import type { RoutingDecisionDisplayHookInput, RoutingDecisionDisplayHookOutput } from "./types"
import { HOOK_NAME } from "./constants"
import { log } from "../../shared/logger"
import type { RouteDecision } from "../../tools/route-sisyphus/types"

function extractRoutingDecisionFromMessage(messageText: string): RouteDecision | null {
  try {
    // Look for JSON objects in the message that contain routing decision
    // Match complete JSON objects (balanced braces)
    const jsonRegex = /\{(?:[^{}]|{(?:[^{}]|{[^{}]*})*})*\}/g
    const matches = messageText.match(jsonRegex)

    if (!matches) return null

    for (const match of matches) {
      try {
        const parsed = JSON.parse(match)

        // Validate it looks like a RouteDecision
        if (
          typeof parsed === 'object' &&
          parsed !== null &&
          typeof parsed.agent === 'string' &&
          typeof parsed.complexity === 'string' &&
          typeof parsed.confidence === 'string' &&
          typeof parsed.reason === 'string'
        ) {
          return parsed as RouteDecision
        }
      } catch {
        // Skip invalid JSON
        continue
      }
    }

    return null
  } catch {
    return null
  }
}

function formatRoutingInfo(decision: RouteDecision): string {
  return `\n\n---\n## 🔄 Automatic Routing Analysis

**Query Complexity**: ${decision.complexity}
**Selected Agent**: ${decision.agent}
**Confidence**: ${decision.confidence}

**Routing Logic**: ${decision.reason}

*This task was automatically routed for optimal performance and cost efficiency.*`
}

export function createRoutingDecisionDisplayHook(ctx: PluginInput) {
  return {
    "chat.message": async (
      input: RoutingDecisionDisplayHookInput,
      output: RoutingDecisionDisplayHookOutput
    ): Promise<void> => {
      const parts = output.parts

      // Find the part that contains both route_sisyphus and delegate_task calls
      let targetPartIndex = -1
      let combinedMessageText = ""

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        if (part.type === "text" && part.text) {
          combinedMessageText += part.text + "\n"
          if (part.text.includes('route_sisyphus') && part.text.includes('delegate_task')) {
            targetPartIndex = i
          }
        }
      }

      combinedMessageText = combinedMessageText.trim()

      // Only process messages that contain delegate_task calls
      if (!combinedMessageText.includes('delegate_task')) {
        return
      }

      // Check if this is a router delegation (contains route_sisyphus call before delegate_task)
      if (!combinedMessageText.includes('route_sisyphus')) {
        return
      }

      log(`[${HOOK_NAME}] Detected router delegation`, {
        sessionID: input.sessionID,
      })

      // Extract routing decision from the message
      const routingDecision = extractRoutingDecisionFromMessage(combinedMessageText)

      if (!routingDecision) {
        log(`[${HOOK_NAME}] Could not extract routing decision from message`, {
          sessionID: input.sessionID,
        })
        return
      }

      // Add routing information to the target part (or first text part if no specific target)
      const routingInfo = formatRoutingInfo(routingDecision)
      const partToModify = targetPartIndex >= 0 ? targetPartIndex : output.parts.findIndex((p) => p.type === "text" && p.text)

      if (partToModify >= 0 && output.parts[partToModify].text) {
        output.parts[partToModify].text += routingInfo
      }

      log(`[${HOOK_NAME}] Added routing information`, {
        sessionID: input.sessionID,
        agent: routingDecision.agent,
        complexity: routingDecision.complexity,
      })
    },
  }
}