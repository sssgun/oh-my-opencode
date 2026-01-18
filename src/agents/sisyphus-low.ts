import type { AgentConfig } from "@opencode-ai/sdk"
import { createSisyphusAgent } from "./sisyphus"
import type { AvailableAgent, AvailableSkill } from "./sisyphus-prompt-builder"

const DEFAULT_MODEL = "opencode/grok-code"

export function createLowSisyphusAgent(
  model?: string,
  availableAgents?: AvailableAgent[],
  availableToolNames?: string[],
  availableSkills?: AvailableSkill[]
): AgentConfig {
  const base = createSisyphusAgent(model ?? DEFAULT_MODEL, availableAgents, availableToolNames, availableSkills)
  return {
    ...base,
    description:
      "Low Sisyphus - cost-optimized Sisyphus for light tasks. Same behaviors, cheaper model.",
    mode: "all" as const,
    color: "#06B6D4",
    // OpenCode permission schema is extensible (tool names are dynamic),
    // but SDK typing is conservative. Keep runtime keys, cast for TS.
    permission: {
      ...(base.permission ?? {}),
      call_omo_agent: "deny",
      delegate_task: "allow",
    } as AgentConfig["permission"],
  }
}

export const lowSisyphusAgent = createLowSisyphusAgent()

