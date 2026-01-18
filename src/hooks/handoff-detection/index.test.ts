import { describe, expect, test, beforeEach, afterEach, mock } from "bun:test"
import { createHandoffDetectionHook } from "./index"
import { HANDOFF_DETECTION_TAG_OPEN, HANDOFF_DETECTION_TAG_CLOSE } from "./constants"

// Import functions for testing

describe("handoff-detection hook", () => {
  function createMockHookOptions() {
    return {
      autoTrigger: true,
      confidenceThreshold: 0.7,
      enabledPlatforms: ['claude-code', 'cursor', 'opencode'] as Array<'claude-code' | 'cursor' | 'opencode'>,
    }
  }

  // No mocks needed for basic functionality tests

  describe("hook creation", () => {
    test("should create hook with default options", () => {
      // #given - no options provided

      // #when
      const hook = createHandoffDetectionHook()

      // #then - hook should be created with defaults
      expect(hook).toBeDefined()
      expect(typeof hook["chat.message"]).toBe("function")
    })

    test("should create hook with custom options", () => {
      // #given - custom options
      const options = createMockHookOptions()

      // #when
      const hook = createHandoffDetectionHook(options)

      // #then - hook should be created with custom options
      expect(hook).toBeDefined()
    })
  })

  describe("chat.message handler", () => {
    test("should handle messages without crashing", async () => {
      // #given - hook and regular message
      const hook = createHandoffDetectionHook(createMockHookOptions())
      const output = {
        message: {},
        parts: [{ type: "text", text: "Just a regular message about implementing a feature" }],
      }

      // #when
      await hook["chat.message"](
        {
          sessionID: "test-session",
          messageID: "test-message",
          timestamp: Date.now(),
        },
        output
      )

      // #then - should complete without error
      expect(output.parts).toBeDefined()
    })

    test("should handle empty message gracefully", async () => {
      // #given - hook and empty message
      const hook = createHandoffDetectionHook(createMockHookOptions())
      const output = {
        message: {},
        parts: [],
      }

      // #when
      await hook["chat.message"](
        {
          sessionID: "test-session",
          messageID: "test-message",
          timestamp: Date.now(),
        },
        output
      )

      // #then - should not crash
      expect(output.parts).toEqual([])
    })

    test("should handle tool usage in message parts", async () => {
      // #given - hook and message with tool usage
      const hook = createHandoffDetectionHook(createMockHookOptions())
      const output = {
        message: {},
        parts: [
          { type: "text", text: "About to run some tools" },
          { type: "tool_use", name: "read_file" },
        ],
      }

      // #when
      await hook["chat.message"](
        {
          sessionID: "test-session",
          messageID: "test-message",
          timestamp: Date.now(),
        },
        output
      )

      // #then - should complete without error
      expect(output.parts).toHaveLength(2)
    })
  })
})