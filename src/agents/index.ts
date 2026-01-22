import type { AgentConfig } from "@opencode-ai/sdk"
import { sisyphusRouterAgent } from "./sisyphus-router"
import { lowSisyphusAgent } from "./sisyphus-low"
import { normalSisyphusAgent } from "./sisyphus-normal"
import { highSisyphusAgent } from "./sisyphus-high"
import { createOracleAgent } from "./oracle"
import { createLibrarianAgent } from "./librarian"
import { createExploreAgent } from "./explore"
import { createMultimodalLookerAgent } from "./multimodal-looker"
import { createMetisAgent } from "./metis"
import { createMomusAgent } from "./momus"
import { agentHandoffPlannerAgent } from "./agent-handoff-planner"
import { agentHandoffExecutorAgent } from "./agent-handoff-executor"

export const builtinAgents: Record<string, AgentConfig> = {
  Sisyphus: sisyphusRouterAgent,
  "Low Sisyphus": lowSisyphusAgent,
  "Normal Sisyphus": normalSisyphusAgent,
  "High Sisyphus": highSisyphusAgent,
  oracle: createOracleAgent("openai/gpt-5.2"),
  librarian: createLibrarianAgent("opencode/glm-4.7-free"),
  explore: createExploreAgent("opencode/grok-code"),
  "multimodal-looker": createMultimodalLookerAgent("google/gemini-3-flash"),
  "Metis (Plan Consultant)": createMetisAgent("anthropic/claude-sonnet-4-5"),
  "Momus (Plan Reviewer)": createMomusAgent("anthropic/claude-sonnet-4-5"),
  "agent-handoff-planner": agentHandoffPlannerAgent,
  "agent-handoff-executor": agentHandoffExecutorAgent,
}

export * from "./types"
export { createBuiltinAgents } from "./utils"
export type { AvailableAgent } from "./dynamic-agent-prompt-builder"
