import { describe, expect, test } from "bun:test"
import { createRoutingDecisionDisplayHook } from "./index"

describe("routing-decision-display hook", () => {
  function createMockPluginInput() {
    return {
      directory: "/tmp/test",
      client: {},
    } as Parameters<typeof createRoutingDecisionDisplayHook>[0]
  }

  describe("chat.message handler", () => {
    test("should ignore messages without delegate_task", async () => {
      // #given - hook and message without delegate_task
      const hook = createRoutingDecisionDisplayHook(createMockPluginInput())
      const output = {
        parts: [{ type: "text", text: "Just a regular message about coding" }],
      }

      // #when
      await hook["chat.message"](
        { sessionID: "test-session", messageID: "test-message" },
        output
      )

      // #then - message should remain unchanged
      expect(output.parts[0].text).toBe("Just a regular message about coding")
    })

    test("should ignore delegate_task calls without route_sisyphus", async () => {
      // #given - hook and delegate_task message without route_sisyphus
      const hook = createRoutingDecisionDisplayHook(createMockPluginInput())
      const output = {
        parts: [{ type: "text", text: 'delegate_task({ description: "test", prompt: "test", subagent_type: "Low Sisyphus" })' }],
      }

      // #when
      await hook["chat.message"](
        { sessionID: "test-session", messageID: "test-message" },
        output
      )

      // #then - message should remain unchanged
      expect(output.parts[0].text).toBe('delegate_task({ description: "test", prompt: "test", subagent_type: "Low Sisyphus" })')
    })

    test("should add routing information for router delegations", async () => {
      // #given - hook and router delegation message
      const hook = createRoutingDecisionDisplayHook(createMockPluginInput())
      const routingDecision = {
        agent: "High Sisyphus",
        complexity: "COMPLEX",
        confidence: "high",
        reason: "Query involves multiple complex tasks requiring expert analysis",
        signals: { wordCount: 150, technicalTerms: 8 }
      }
      const originalMessage = `route_sisyphus({ query: "Implement a full-stack web app" })
${JSON.stringify(routingDecision)}

delegate_task({
  description: "route: Implement web app",
  prompt: "Implement a full-stack web app",
  subagent_type: "${routingDecision.agent}",
  run_in_background: false,
  skills: null
})`

      const output = {
        parts: [{ type: "text", text: originalMessage }],
      }

      // #when
      await hook["chat.message"](
        { sessionID: "test-session", messageID: "test-message" },
        output
      )

      // #then - routing information should be added
      expect(output.parts[0].text).toContain("## 🔄 Automatic Routing Analysis")
      expect(output.parts[0].text).toContain("**Query Complexity**: COMPLEX")
      expect(output.parts[0].text).toContain("**Selected Agent**: High Sisyphus")
      expect(output.parts[0].text).toContain("**Confidence**: high")
      expect(output.parts[0].text).toContain("Query involves multiple complex tasks requiring expert analysis")
    })

    test("should handle malformed JSON gracefully", async () => {
      // #given - hook and message with malformed JSON
      const hook = createRoutingDecisionDisplayHook(createMockPluginInput())
      const originalMessage = `route_sisyphus({ query: "test" })
{ invalid json }

delegate_task({
  description: "route: test",
  prompt: "test",
  subagent_type: "Low Sisyphus"
})`

      const output = {
        parts: [{ type: "text", text: originalMessage }],
      }

      // #when
      await hook["chat.message"](
        { sessionID: "test-session", messageID: "test-message" },
        output
      )

      // #then - message should remain unchanged due to parsing failure
      expect(output.parts[0].text).toBe(originalMessage)
    })

    test("should handle messages with multiple text parts", async () => {
      // #given - hook and message with multiple parts
      const hook = createRoutingDecisionDisplayHook(createMockPluginInput())
      const routingDecision = {
        agent: "Normal Sisyphus",
        complexity: "NORMAL",
        confidence: "medium",
        reason: "Query has moderate complexity"
      }
      const output = {
        parts: [
          { type: "text", text: "First part" },
          { type: "text", text: `route_sisyphus call\n${JSON.stringify(routingDecision)}\ndelegate_task call` },
          { type: "text", text: "Third part" }
        ],
      }

      // #when
      await hook["chat.message"](
        { sessionID: "test-session", messageID: "test-message" },
        output
      )

      // #then - routing information should be added to the part containing routing calls
      expect(output.parts[0].text).toBe("First part")
      expect(output.parts[1].text).toContain("## 🔄 Automatic Routing Analysis")
      expect(output.parts[1].text).toContain("**Query Complexity**: NORMAL")
      expect(output.parts[2].text).toBe("Third part")
    })
  })
})