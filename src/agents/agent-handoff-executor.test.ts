import { describe, expect, test } from "bun:test"
import { createAgentHandoffExecutorAgent, agentHandoffExecutorAgent } from "./agent-handoff-executor"

describe("Agent Handoff Executor", () => {
  describe("createAgentHandoffExecutorAgent", () => {
    test("should create agent with default model", () => {
      // #given - default creation

      // #when
      const agent = createAgentHandoffExecutorAgent()

      // #then - should have correct configuration
      expect(agent).toBeDefined()
      expect(agent.model).toBe("anthropic/claude-sonnet-4-5")
      expect(agent.mode).toBe("subagent")
      expect(agent.temperature).toBe(0.1)
      expect(agent.description).toContain("Execution agent for resuming work")
      expect(agent.prompt).toContain("You are the Agent Handoff Executor")
    })

    test("should create agent with custom model", () => {
      // #given - custom model
      const customModel = "openai/gpt-5.2"

      // #when
      const agent = createAgentHandoffExecutorAgent(customModel)

      // #then - should use custom model
      expect(agent.model).toBe(customModel)
      expect(agent.mode).toBe("subagent")
    })

    test("should have comprehensive tool access", () => {
      // #given - agent with tool permissions

      // #when
      const agent = createAgentHandoffExecutorAgent()

      // #then - should have extensive tool access for execution
      expect(agent.permission).toBeDefined()
      expect(agent.permission).toHaveProperty("read", "deny")
      expect(agent.permission).toHaveProperty("grep", "deny")
      expect(agent.permission).toHaveProperty("glob", "deny")
      expect(agent.permission).toHaveProperty("write", "deny")
      expect(agent.permission).toHaveProperty("edit", "deny")
      expect(agent.permission).toHaveProperty("shell", "deny")
      expect(agent.permission).toHaveProperty("list_dir", "deny")
      expect(agent.permission).toHaveProperty("run_terminal_cmd", "deny")
      expect(agent.permission).toHaveProperty("delegate_task", "deny")
      expect(agent.permission).toHaveProperty("task", "deny")
    })

    test("should have thinking configuration", () => {
      // #given - agent with thinking config

      // #when
      const agent = createAgentHandoffExecutorAgent()

      // #then - should have thinking enabled
      expect(agent.thinking).toBeDefined()
      expect((agent.thinking as any)?.type).toBe("enabled")
      expect((agent.thinking as any)?.budgetTokens).toBe(16000)
    })

    test("should have execution-focused system prompt", () => {
      // #given - agent with system prompt

      // #when
      const agent = createAgentHandoffExecutorAgent()

      // #then - system prompt should contain execution elements
      expect(agent.prompt).toContain("Agent Handoff Executor")
      expect(agent.prompt).toContain("resuming work")
      expect(agent.prompt).toContain("planning documents")
      expect(agent.prompt).toContain("cross-platform context")
      expect(agent.prompt).toContain("docs/planning/")
    })
  })

  describe("agentHandoffExecutorAgent (default instance)", () => {
    test("should be properly configured default instance", () => {
      // #given - default agent instance

      // #when - using the exported default instance

      // #then - should have correct default configuration
      expect(agentHandoffExecutorAgent).toBeDefined()
      expect(agentHandoffExecutorAgent.model).toBe("anthropic/claude-sonnet-4-5")
      expect(agentHandoffExecutorAgent.mode).toBe("subagent")
      expect(agentHandoffExecutorAgent.temperature).toBe(0.1)
    })

    test("should be equivalent to createAgentHandoffExecutorAgent()", () => {
      // #given - default instance vs factory function

      // #when
      const factoryAgent = createAgentHandoffExecutorAgent()

      // #then - should be equivalent
      expect(agentHandoffExecutorAgent.model).toBe(factoryAgent.model)
      expect(agentHandoffExecutorAgent.mode).toBe(factoryAgent.mode)
      expect(agentHandoffExecutorAgent.temperature).toBe(factoryAgent.temperature)
      expect(agentHandoffExecutorAgent.description).toBe(factoryAgent.description)
      expect(agentHandoffExecutorAgent.prompt).toBe(factoryAgent.prompt)
    })
  })

  describe("AgentPromptMetadata", () => {
    test("should export metadata for Sisyphus integration", () => {
      // #given - importing the metadata
      const { AGENT_HANDOFF_EXECUTOR_PROMPT_METADATA } = require("./agent-handoff-executor")

      // #when - checking metadata structure

      // #then - should have correct metadata structure
      expect(AGENT_HANDOFF_EXECUTOR_PROMPT_METADATA).toBeDefined()
      expect(AGENT_HANDOFF_EXECUTOR_PROMPT_METADATA.category).toBe("utility")
      expect(AGENT_HANDOFF_EXECUTOR_PROMPT_METADATA.cost).toBe("CHEAP")
      expect(AGENT_HANDOFF_EXECUTOR_PROMPT_METADATA.promptAlias).toBe("Agent Handoff Executor")

      // Should have triggers
      expect(AGENT_HANDOFF_EXECUTOR_PROMPT_METADATA.triggers).toBeDefined()
      expect(AGENT_HANDOFF_EXECUTOR_PROMPT_METADATA.triggers.length).toBeGreaterThan(0)
      expect(AGENT_HANDOFF_EXECUTOR_PROMPT_METADATA.triggers[0]).toHaveProperty("domain")
      expect(AGENT_HANDOFF_EXECUTOR_PROMPT_METADATA.triggers[0]).toHaveProperty("trigger")

      // Should have useWhen conditions
      expect(AGENT_HANDOFF_EXECUTOR_PROMPT_METADATA.useWhen).toBeDefined()
      expect(AGENT_HANDOFF_EXECUTOR_PROMPT_METADATA.useWhen.length).toBeGreaterThan(0)

      // Should have avoidWhen conditions
      expect(AGENT_HANDOFF_EXECUTOR_PROMPT_METADATA.avoidWhen).toBeDefined()
      expect(AGENT_HANDOFF_EXECUTOR_PROMPT_METADATA.avoidWhen.length).toBeGreaterThan(0)
    })
  })

  describe("Integration with Agent System", () => {
    test("should be compatible with AgentConfig interface", () => {
      // #given - agent configuration
      const agent = createAgentHandoffExecutorAgent()

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

    test("should have sufficient token budget for execution tasks", () => {
      // #given - agent with thinking configuration

      // #when
      const agent = createAgentHandoffExecutorAgent()

      // #then - token budget should be adequate for complex execution tasks
      expect((agent.thinking as any)?.budgetTokens).toBeGreaterThan(10000)
      expect((agent.thinking as any)?.budgetTokens).toBeLessThan(100000)
    })

    test("should have low temperature for consistent execution", () => {
      // #given - agent temperature setting

      // #when
      const agent = createAgentHandoffExecutorAgent()

      // #then - temperature should be low for reliable execution
      expect(agent.temperature).toBeGreaterThanOrEqual(0)
      expect(agent.temperature).toBeLessThanOrEqual(0.3)
    })
  })

  describe("Tool permissions comparison", () => {
    test("should have broader tool access than planner agent", () => {
      // #given - both agents
      const plannerAgent = require("./agent-handoff-planner").createAgentHandoffPlannerAgent()
      const executorAgent = createAgentHandoffExecutorAgent()

      // #when - comparing tool permissions

      // #then - executor should have additional denied tools for execution
      const plannerPermissions = plannerAgent.permission || {}
      const executorPermissions = executorAgent.permission || {}

      // Executor should have all planner permissions plus additional ones
      expect(executorPermissions).toHaveProperty("edit", "deny")
      expect(executorPermissions).toHaveProperty("run_terminal_cmd", "deny")
      expect(executorPermissions).toHaveProperty("delegate_task", "deny")
      expect(executorPermissions).toHaveProperty("task", "deny")

      // Should include all planner permissions
      Object.keys(plannerPermissions).forEach(tool => {
        expect(executorPermissions).toHaveProperty(tool, "deny")
      })
    })
  })

  describe("Model selection rationale", () => {
    test("should use Sonnet model for faster execution", () => {
      // #given - model selection

      // #when
      const agent = createAgentHandoffExecutorAgent()

      // #then - should use Sonnet for speed vs Opus for planning
      expect(agent.model).toBe("anthropic/claude-sonnet-4-5")

      const plannerAgent = require("./agent-handoff-planner").createAgentHandoffPlannerAgent()
      expect(plannerAgent.model).toBe("anthropic/claude-opus-4-5")
    })
  })

  describe("Error handling and edge cases", () => {
    test("should handle undefined model parameter", () => {
      // #given - undefined model parameter

      // #when
      const agent = createAgentHandoffExecutorAgent(undefined)

      // #then - should use default model
      expect(agent.model).toBe("anthropic/claude-sonnet-4-5")
    })

    test("should handle empty string model parameter", () => {
      // #given - empty string model parameter

      // #when
      const agent = createAgentHandoffExecutorAgent("")

      // #then - should use the empty string as model
      expect(agent.model).toBe("")
    })

    test("should have stable configuration across calls", () => {
      // #given - multiple calls to factory function

      // #when
      const agent1 = createAgentHandoffExecutorAgent()
      const agent2 = createAgentHandoffExecutorAgent()

      // #then - should produce identical configurations
      expect(agent1.model).toBe(agent2.model)
      expect(agent1.mode).toBe(agent2.mode)
      expect(agent1.temperature).toBe(agent2.temperature)
      expect(agent1.prompt).toBe(agent2.prompt)
    })
  })
})