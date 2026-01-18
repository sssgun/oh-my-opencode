import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { SHOW_ROUTING_DECISION_TOOL_NAME } from "./constants"
import type { ShowRoutingDecisionArgs } from "./types"
import { route_sisyphus } from "../route-sisyphus/tools"
import type { RouteDecision } from "../route-sisyphus/types"

function formatRoutingDecision(decision: RouteDecision): string {
  const { agent, complexity, confidence, reason, signals } = decision

  let output = `## 🔄 Routing Decision Analysis

**Query Complexity**: ${complexity}
**Recommended Agent**: ${agent}
**Confidence Level**: ${confidence}

**Routing Reason**:
${reason}

`

  if (signals) {
    output += `**Analysis Signals**:
${Object.entries(signals)
  .map(([key, value]) => `- **${key}**: ${String(value)}`)
  .join('\n')}

`
  }

  // Add agent mapping explanation
  const agentMapping = {
    "Low Sisyphus": "LIGHT tasks - cost-effective, fast responses",
    "Normal Sisyphus": "NORMAL tasks - balanced performance and cost",
    "High Sisyphus": "COMPLEX tasks - maximum capability, higher cost"
  }

  output += `**Agent Selection Guide**:
- **Low Sisyphus**: ${agentMapping["Low Sisyphus"]}
- **Normal Sisyphus**: ${agentMapping["Normal Sisyphus"]}
- **High Sisyphus**: ${agentMapping["High Sisyphus"]}

*This query would be routed to **${agent}** for optimal performance and cost efficiency.*`

  return output
}

export function createShowRoutingDecisionTool(): ToolDefinition {
  return tool({
    description:
      "Display detailed routing decision analysis for a user query. Shows complexity assessment, recommended agent, confidence level, and analysis signals.",
    args: {
      query: tool.schema.string().describe("The user query to analyze for routing decisions"),
    },
    execute: async (args: ShowRoutingDecisionArgs): Promise<string> => {
      try {
        // Call the existing route_sisyphus tool to get the decision
        const routeResult = await route_sisyphus.execute({ query: args.query })

        // Parse the JSON result
        const decision: RouteDecision = JSON.parse(routeResult)

        // Format and return the user-friendly display
        return formatRoutingDecision(decision)
      } catch (error) {
        return `❌ Error analyzing routing decision: ${error instanceof Error ? error.message : String(error)}

Please ensure the routing system is properly configured.`
      }
    },
  })
}

export const show_routing_decision: ToolDefinition = createShowRoutingDecisionTool()