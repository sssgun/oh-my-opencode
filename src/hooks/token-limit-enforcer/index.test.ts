import { describe, it, expect, mock } from "bun:test"
import { createTokenLimitEnforcerHook } from "./index"

const mockCtx = {
  directory: "/test",
  client: {},
} as any

describe("token-limit-enforcer hook", () => {
  it("should not truncate when under token limit", async () => {
    const hook = createTokenLimitEnforcerHook(mockCtx, { maxTokens: 10000, preserveRecentMessages: 0 })

    const messages = [
      {
        info: { role: "user" },
        parts: [{ type: "text", text: "Short message" }]
      },
      {
        info: { role: "assistant" },
        parts: [{ type: "text", text: "Short response" }]
      }
    ]

    const input = {}
    const output = { messages }

    await hook["experimental.chat.messages.transform"]?.(input, output)
    expect(output.messages).toHaveLength(2)
    expect((output.messages[0].parts[0] as any).text).toBe("Short message")
  })

  it("should truncate long messages when over token limit", async () => {
    const hook = createTokenLimitEnforcerHook(mockCtx, { maxTokens: 150, preserveRecentMessages: 1 })

    // 긴 메시지를 만들어서 토큰 제한 초과
    const longMessage = "A".repeat(1000) // 대략 250토큰 정도
    const messages = [
      {
        info: { role: "user" },
        parts: [{ type: "text", text: longMessage }]
      },
      {
        info: { role: "assistant" },
        parts: [{ type: "text", text: "Short response" }]
      }
    ]

    const input = {}
    const output = { messages }

    await hook["experimental.chat.messages.transform"]?.(input, output)

    // 토큰 제한 초과로 인해 truncation 시도 후 메시지 제거가 발생할 수 있음
    expect(output.messages.length).toBeGreaterThan(0)
    expect(output.messages.length).toBeLessThanOrEqual(2)

    // 남은 메시지가 최근 메시지인지 확인 (preserveRecentMessages = 1)
    expect((output.messages[0].parts[0] as any).text).toBe("Short response")
  })

  it("should remove old messages when truncation insufficient", async () => {
    const hook = createTokenLimitEnforcerHook(mockCtx, { maxTokens: 30, preserveRecentMessages: 1 })

    const messages = [
      {
        info: { role: "user" },
        parts: [{ type: "text", text: "A".repeat(500) }] // 매우 긴 메시지
      },
      {
        info: { role: "assistant" },
        parts: [{ type: "text", text: "A".repeat(500) }] // 매우 긴 메시지
      },
      {
        info: { role: "user" },
        parts: [{ type: "text", text: "Recent message" }] // 최근 메시지 (보존)
      }
    ]

    const input = {}
    const output = { messages }

    await hook["experimental.chat.messages.transform"]?.(input, output)

    // 최근 메시지만 남아있어야 함
    expect(output.messages.length).toBeGreaterThanOrEqual(1)
    expect((output.messages[output.messages.length - 1].parts[0] as any).text).toBe("Recent message")
  })

  it("should handle non-text parts gracefully", async () => {
    const hook = createTokenLimitEnforcerHook(mockCtx, { maxTokens: 100 })

    const messages = [
      {
        info: { role: "user" },
        parts: [
          { type: "text", text: "Text message" },
          { type: "tool_use", callID: "123" } // tool part
        ]
      }
    ]

    const input = {}
    const output = { messages }

    await hook["experimental.chat.messages.transform"]?.(input, output)

    expect(output.messages).toHaveLength(1)
    expect(output.messages[0].parts).toHaveLength(2)
  })
})