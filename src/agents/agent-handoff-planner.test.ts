import { describe, expect, test } from "bun:test"
import { createAgentHandoffPlannerAgent, agentHandoffPlannerAgent } from "./agent-handoff-planner"

describe("Agent Handoff Planner", () => {
  describe("createAgentHandoffPlannerAgent", () => {
    test("should create agent with default model", () => {
      // #given - default creation

      // #when
      const agent = createAgentHandoffPlannerAgent()

      // #then - should have correct configuration
      expect(agent).toBeDefined()
      expect(agent.model).toBe("anthropic/claude-opus-4-5")
      expect(agent.mode).toBe("subagent")
      expect(agent.temperature).toBe(0.1)
      expect(agent.description).toContain("Planning agent for generating handoff documents")
      expect(agent.prompt).toContain("You are the Agent Handoff Planner")
    })

    test("should create agent with custom model", () => {
      // #given - custom model
      const customModel = "openai/gpt-5.2"

      // #when
      const agent = createAgentHandoffPlannerAgent(customModel)

      // #then - should use custom model
      expect(agent.model).toBe(customModel)
      expect(agent.mode).toBe("subagent")
    })

    test("should have proper tool restrictions", () => {
      // #given - agent with restrictions

      // #when
      const agent = createAgentHandoffPlannerAgent()

      // #then - should have file system access permissions
      expect(agent.permission).toBeDefined()
      expect(agent.permission).toHaveProperty("read", "deny")
      expect(agent.permission).toHaveProperty("grep", "deny")
      expect(agent.permission).toHaveProperty("glob", "deny")
      expect(agent.permission).toHaveProperty("write", "deny")
      expect(agent.permission).toHaveProperty("shell", "deny")
      expect(agent.permission).toHaveProperty("list_dir", "deny")
    })

    test("should have thinking configuration", () => {
      // #given - agent with thinking config

      // #when
      const agent = createAgentHandoffPlannerAgent()

      // #then - should have thinking enabled
      expect(agent.thinking).toBeDefined()
      expect((agent.thinking as any)?.type).toBe("enabled")
      expect((agent.thinking as any)?.budgetTokens).toBe(16000)
    })

    test("should have comprehensive system prompt", () => {
      // #given - agent with system prompt

      // #when
      const agent = createAgentHandoffPlannerAgent()

      // #then - system prompt should contain key elements
      expect(agent.prompt).toContain("Agent Handoff Planner")
      expect(agent.prompt).toContain("planning documents")
      expect(agent.prompt).toContain("cross-platform context")
      expect(agent.prompt).toContain("docs/planning/")
      expect(agent.prompt).toContain("OpenCode, Claude Code, Cursor")
    })
  })

  describe("agentHandoffPlannerAgent (default instance)", () => {
    test("should be properly configured default instance", () => {
      // #given - default agent instance

      // #when - using the exported default instance

      // #then - should have correct default configuration
      expect(agentHandoffPlannerAgent).toBeDefined()
      expect(agentHandoffPlannerAgent.model).toBe("anthropic/claude-opus-4-5")
      expect(agentHandoffPlannerAgent.mode).toBe("subagent")
      expect(agentHandoffPlannerAgent.temperature).toBe(0.1)
    })

    test("should be equivalent to createAgentHandoffPlannerAgent()", () => {
      // #given - default instance vs factory function

      // #when
      const factoryAgent = createAgentHandoffPlannerAgent()

      // #then - should be equivalent
      expect(agentHandoffPlannerAgent.model).toBe(factoryAgent.model)
      expect(agentHandoffPlannerAgent.mode).toBe(factoryAgent.mode)
      expect(agentHandoffPlannerAgent.temperature).toBe(factoryAgent.temperature)
      expect(agentHandoffPlannerAgent.description).toBe(factoryAgent.description)
      expect(agentHandoffPlannerAgent.prompt).toBe(factoryAgent.prompt)
    })
  })

  describe("AgentPromptMetadata", () => {
    test("should export metadata for Sisyphus integration", () => {
      // #given - importing the metadata
      const { AGENT_HANDOFF_PLANNER_PROMPT_METADATA } = require("./agent-handoff-planner")

      // #when - checking metadata structure

      // #then - should have correct metadata structure
      expect(AGENT_HANDOFF_PLANNER_PROMPT_METADATA).toBeDefined()
      expect(AGENT_HANDOFF_PLANNER_PROMPT_METADATA.category).toBe("utility")
      expect(AGENT_HANDOFF_PLANNER_PROMPT_METADATA.cost).toBe("CHEAP")
      expect(AGENT_HANDOFF_PLANNER_PROMPT_METADATA.promptAlias).toBe("Agent Handoff Planner")

      // Should have triggers
      expect(AGENT_HANDOFF_PLANNER_PROMPT_METADATA.triggers).toBeDefined()
      expect(AGENT_HANDOFF_PLANNER_PROMPT_METADATA.triggers.length).toBeGreaterThan(0)
      expect(AGENT_HANDOFF_PLANNER_PROMPT_METADATA.triggers[0]).toHaveProperty("domain")
      expect(AGENT_HANDOFF_PLANNER_PROMPT_METADATA.triggers[0]).toHaveProperty("trigger")

      // Should have useWhen conditions
      expect(AGENT_HANDOFF_PLANNER_PROMPT_METADATA.useWhen).toBeDefined()
      expect(AGENT_HANDOFF_PLANNER_PROMPT_METADATA.useWhen.length).toBeGreaterThan(0)

      // Should have avoidWhen conditions
      expect(AGENT_HANDOFF_PLANNER_PROMPT_METADATA.avoidWhen).toBeDefined()
      expect(AGENT_HANDOFF_PLANNER_PROMPT_METADATA.avoidWhen.length).toBeGreaterThan(0)
    })
  })

  describe("Integration with Agent System", () => {
    test("should be compatible with AgentConfig interface", () => {
      // #given - agent configuration
      const agent = createAgentHandoffPlannerAgent()

      // #when - checking interface compatibility

      // #then - should have all required AgentConfig properties
      expect(agent).toHaveProperty("description")
      expect(agent).toHaveProperty("mode")
      expect(agent).toHaveProperty("model")
      expect(agent).toHaveProperty("temperature")
      expect(agent).toHaveProperty("permission")
      expect(agent).toHaveProperty("prompt")
      expect(agent).toHaveProperty("thinking")
    })

    test("should have reasonable token budget", () => {
      // #given - agent with thinking configuration

      // #when
      const agent = createAgentHandoffPlannerAgent()

      // #then - token budget should be reasonable for planning tasks
      expect((agent.thinking as any)?.budgetTokens).toBeGreaterThan(10000)
      expect((agent.thinking as any)?.budgetTokens).toBeLessThan(100000)
    })

    test("should have appropriate temperature for planning tasks", () => {
      // #given - agent temperature setting

      // #when
      const agent = createAgentHandoffPlannerAgent()

      // #then - temperature should be low for consistent planning
      expect(agent.temperature).toBeGreaterThanOrEqual(0)
      expect(agent.temperature).toBeLessThanOrEqual(0.3)
    })
  })

  describe("Error handling and edge cases", () => {
    test("should handle undefined model parameter", () => {
      // #given - undefined model parameter

      // #when
      const agent = createAgentHandoffPlannerAgent(undefined)

      // #then - should use default model
      expect(agent.model).toBe("anthropic/claude-opus-4-5")
    })

    test("should handle empty string model parameter", () => {
      // #given - empty string model parameter

      // #when
      const agent = createAgentHandoffPlannerAgent("")

      // #then - should use the empty string as model
      expect(agent.model).toBe("")
    })

    test("should have stable configuration across calls", () => {
      // #given - multiple calls to factory function

      // #when
      const agent1 = createAgentHandoffPlannerAgent()
      const agent2 = createAgentHandoffPlannerAgent()

      // #then - should produce identical configurations
      expect(agent1.model).toBe(agent2.model)
      expect(agent1.mode).toBe(agent2.mode)
      expect(agent1.temperature).toBe(agent2.temperature)
      expect(agent1.prompt).toBe(agent2.prompt)
    })
  })
})