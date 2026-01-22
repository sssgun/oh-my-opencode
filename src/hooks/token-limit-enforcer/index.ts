import type { PluginInput } from "@opencode-ai/plugin"
import type { Message, Part } from "@opencode-ai/sdk"
import { log } from "../../shared"

interface MessageWithParts {
  info: Message
  parts: Part[]
}

type MessagesTransformHook = {
  "experimental.chat.messages.transform"?: (
    input: Record<string, never>,
    output: { messages: MessageWithParts[] }
  ) => Promise<void>
}

interface TokenLimitEnforcerOptions {
  maxTokens?: number
  charsPerToken?: number
  preserveRecentMessages?: number
}

// Claude Opus 4.5의 실제 토큰 제한
const DEFAULT_MAX_TOKENS = 256_000
const DEFAULT_CHARS_PER_TOKEN = 4
const DEFAULT_PRESERVE_RECENT = 3

function estimateTokens(text: string, charsPerToken: number = DEFAULT_CHARS_PER_TOKEN): number {
  return Math.ceil(text.length / charsPerToken)
}

function getMessageText(message: any): string {
  const parts = message.parts || []
  return parts
    .filter((part: any) => part.type === "text" && "text" in part && part.text)
    .map((part: any) => part.text)
    .join("\n")
}

function truncateMessageText(message: any, maxTokens: number, charsPerToken: number): boolean {
  const parts = message.parts || []
  const textParts = parts.filter((part: any) => part.type === "text" && "text" in part && part.text)

  for (const part of textParts) {
    const text = part.text
    const currentTokens = estimateTokens(text, charsPerToken)

    if (currentTokens > maxTokens) {
      // 텍스트를 토큰 제한에 맞게 자름
      const maxChars = maxTokens * charsPerToken
      const truncatedText = text.slice(0, maxChars) +
        "\n\n[Message truncated due to token limit]"

      part.text = truncatedText
      return true
    }
  }

  return false
}

export function createTokenLimitEnforcerHook(
  ctx: PluginInput,
  options: TokenLimitEnforcerOptions = {}
): MessagesTransformHook {
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS
  const charsPerToken = options.charsPerToken ?? DEFAULT_CHARS_PER_TOKEN
  const preserveRecentMessages = options.preserveRecentMessages ?? DEFAULT_PRESERVE_RECENT

  return {
    "experimental.chat.messages.transform": async (_input, output) => {
      const { messages } = output

      if (messages.length === 0) return

      // 전체 메시지의 토큰 수 계산
      let totalTokens = 0
      const messageTokens: Array<{ index: number; tokens: number; text: string }> = []

      for (let i = 0; i < messages.length; i++) {
        const message = messages[i] as any
        const text = getMessageText(message)
        const tokens = estimateTokens(text, charsPerToken)

        totalTokens += tokens
        messageTokens.push({ index: i, tokens, text })
      }

      if (totalTokens > maxTokens) {
        log("[token-limit-enforcer] Token limit exceeded, applying truncation", {
          totalTokens,
          maxTokens,
          messageCount: messages.length
        })
      }

      // 토큰 제한을 초과하지 않으면 그대로 반환
      if (totalTokens <= maxTokens) {
        return
      }

      // 메시지가 너무 적으면 truncation하지 않음
      if (messages.length <= preserveRecentMessages) {
        log("[token-limit-enforcer] Cannot truncate: too few messages to preserve recent ones", {
          messageCount: messages.length,
          preserveRecentMessages
        })
        return
      }

      // 토큰 제한 초과 시 처리
      const tokensToReduce = totalTokens - maxTokens
      let reducedTokens = 0
      let truncatedCount = 0

      // 1. 최근 메시지들은 preserve
      const safeToTruncate = messages.length - preserveRecentMessages

      // 2. 오래된 메시지부터 truncate - 필요한 만큼 반복
      for (let i = 0; i < safeToTruncate && reducedTokens < tokensToReduce; i++) {
        const message = messages[i] as any
        let originalTokens = messageTokens[i].tokens

        // 현재 메시지를 한 번만 truncate
        const remainingTokensNeeded = tokensToReduce - reducedTokens
        const maxTokensForMessage = Math.max(50, originalTokens - remainingTokensNeeded)
        const truncated = truncateMessageText(message, maxTokensForMessage, charsPerToken)

        if (truncated) {
          const newText = getMessageText(message)
          const newTokens = estimateTokens(newText, charsPerToken)
          reducedTokens += originalTokens - newTokens
          truncatedCount++
        }
      }

      // 3. 여전히 부족하면 메시지 제거
      if (reducedTokens < tokensToReduce) {
        const remainingToReduce = tokensToReduce - reducedTokens
        let removedTokens = 0
        let removedCount = 0

        // 오래된 메시지부터 제거 (index가 큰 것부터)
        for (let i = safeToTruncate - 1; i >= 0 && removedTokens < remainingToReduce; i--) {
          const tokens = messageTokens[i].tokens
          removedTokens += tokens
          removedCount++

          log("[token-limit-enforcer] Removing old message", {
            index: i,
            tokens,
            cumulativeRemoved: removedTokens
          })

          // 메시지 제거 (배열에서 제거)
          messages.splice(i, 1)
          messageTokens.splice(i, 1)
        }

        log("[token-limit-enforcer] Removed old messages", {
          removedCount,
          totalRemovedTokens: removedTokens
        })
      }

      // 최종 토큰 수 재계산 (남은 메시지들만)
      const finalTotalTokens = messages.reduce((sum, message) => sum + estimateTokens(getMessageText(message as any), charsPerToken), 0)

      log("[token-limit-enforcer] Final token count", {
        originalTotal: totalTokens,
        finalTotal: finalTotalTokens,
        reduced: totalTokens - finalTotalTokens,
        truncatedCount,
        remainingMessages: messages.length
      })
    }
  }
}