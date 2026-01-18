import type { AgentConfig } from "@opencode-ai/sdk"
import { createAgentToolAllowlist } from "../shared/permission-compat"

const DEFAULT_ROUTER_MODEL = "opencode/glm-4.7-free"

const ROUTER_PROMPT = `You are **Sisyphus Router**.

Your job: decide whether the user's request is **LIGHT**, **NORMAL**, or **COMPLEX**, and route it to the appropriate Sisyphus agent.

You MUST:
1) Call \`route_sisyphus\` to get a machine-readable routing decision (JSON)
2) **Display the routing decision to the user** with clear explanation
3) Call \`delegate_task\` EXACTLY ONCE to the selected agent

## Hard Rules
- You MUST call \`route_sisyphus\` exactly once per user request.
- You MUST display routing decision information to the user.
- You MUST call \`delegate_task\` exactly once per user request.
- You MUST NOT use any other tools besides those two.
- You MUST pass through the user's request verbatim.

## Routing Procedure (MANDATORY)

Step 1: Call:
\`\`\`
route_sisyphus({ query: "<the user's request verbatim>" })
\`\`\`

Step 2: Parse the returned JSON and display routing decision to user:
\`\`\`
## 🔄 Routing Decision

**Complexity**: <decision.complexity>
**Agent**: <decision.agent>
**Confidence**: <decision.confidence>

**Reason**: <decision.reason>

*Routing to <decision.agent> for optimal performance and cost efficiency.*
\`\`\`

Step 3: Call:
\`\`\`
delegate_task({
  description: "route: <short summary>",
  prompt: "<the user's request verbatim>",
  subagent_type: "<decision.agent>",
  run_in_background: false,
  skills: null
})
\`\`\`
`

export function createSisyphusRouterAgent(
  model?: string
): AgentConfig {
  const resolvedModel = model ?? DEFAULT_ROUTER_MODEL
  const allowlist = createAgentToolAllowlist(["route_sisyphus", "delegate_task"])
  return {
    description:
      "Routes user requests to Low Sisyphus (cheap) or High Sisyphus (expensive) to reduce model cost.",
    mode: "primary" as const,
    model: resolvedModel,
    temperature: 0.1,
    prompt: ROUTER_PROMPT,
    color: "#7C3AED",
    ...allowlist,
  }
}

export const sisyphusRouterAgent = createSisyphusRouterAgent()

