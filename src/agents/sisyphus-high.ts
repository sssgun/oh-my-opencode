import type { AgentConfig } from "@opencode-ai/sdk"
import { createSisyphusAgent } from "./sisyphus"
import type { AvailableAgent, AvailableSkill } from "./sisyphus-prompt-builder"

const DEFAULT_MODEL = "anthropic/claude-opus-4-5"

export function createHighSisyphusAgent(
  model?: string,
  availableAgents?: AvailableAgent[],
  availableToolNames?: string[],
  availableSkills?: AvailableSkill[]
): AgentConfig {
  const base = createSisyphusAgent(model ?? DEFAULT_MODEL, availableAgents, availableToolNames, availableSkills)
  return {
    ...base,
    description:
      "High Sisyphus - max-capability Sisyphus for complex tasks. Uses premium model.",
    mode: "all" as const,
    color: "#0EA5E9",
    // OpenCode permission schema is extensible (tool names are dynamic),
    // but SDK typing is conservative. Keep runtime keys, cast for TS.
    permission: {
      ...(base.permission ?? {}),
      call_omo_agent: "deny",
      delegate_task: "allow",
    } as AgentConfig["permission"],
  }
}

export const highSisyphusAgent = createHighSisyphusAgent()

