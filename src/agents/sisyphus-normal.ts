import type { AgentConfig } from "@opencode-ai/sdk"
import { createSisyphusAgent } from "./sisyphus"
import type { AvailableAgent, AvailableSkill } from "./dynamic-agent-prompt-builder"

const DEFAULT_MODEL = "anthropic/claude-sonnet-4-5"

export function createNormalSisyphusAgent(
  model?: string,
  availableAgents?: AvailableAgent[],
  availableToolNames?: string[],
  availableSkills?: AvailableSkill[]
): AgentConfig {
  const base = createSisyphusAgent(model ?? DEFAULT_MODEL, availableAgents, availableToolNames, availableSkills)
  return {
    ...base,
    description:
      "Normal Sisyphus - balanced Sisyphus for mid-complexity tasks. Trades cost vs quality between Low and High.",
    mode: "all" as const,
    color: "#22C55E",
    // OpenCode permission schema is extensible (tool names are dynamic),
    // but SDK typing is conservative. Keep runtime keys, cast for TS.
    permission: {
      ...(base.permission ?? {}),
      call_omo_agent: "deny",
      delegate_task: "allow",
    } as AgentConfig["permission"],
  }
}

export const normalSisyphusAgent = createNormalSisyphusAgent()

