import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { ROUTE_TOOL_NAME } from "./constants"
import { routeWithStrategy } from "./router"
import { DEFAULT_ROUTE_RULES, mergeRouteRules, type RouteHeuristicRules } from "./rules"
import type { RouteDecision, RouteStrategy } from "./types"

const CACHE_MAX = 200

function normalizeKey(query: string): string {
  return query.trim().replace(/\s+/g, " ").slice(0, 2000)
}

export function createRouteSisyphusTool(input?: {
  strategy?: RouteStrategy
  rules?: Partial<RouteHeuristicRules>
}): ToolDefinition {
  const strategy: RouteStrategy = input?.strategy ?? "hybrid"
  const rules = mergeRouteRules(DEFAULT_ROUTE_RULES, input?.rules)

  const cache = new Map<string, string>()

  function cacheGet(key: string): string | undefined {
    const v = cache.get(key)
    if (v === undefined) return undefined
    // LRU-ish: refresh insertion order
    cache.delete(key)
    cache.set(key, v)
    return v
  }

  function cacheSet(key: string, value: string): void {
    cache.set(key, value)
    if (cache.size > CACHE_MAX) {
      const first = cache.keys().next().value as string | undefined
      if (first) cache.delete(first)
    }
  }

  return tool({
    description:
      "Route a user request to 'Low Sisyphus' (cheap), 'Normal Sisyphus' (mid), or 'High Sisyphus' (expensive). " +
      "Deterministic; supports config-injected heuristics and safe tier bump when confidence is low.",
    args: {
      query: tool.schema.string().describe("User request text to route"),
    },
    execute: async (args): Promise<string> => {
      try {
        const key = normalizeKey(args.query)
        const cached = cacheGet(key)
        if (cached) return cached

        const decision: RouteDecision = await routeWithStrategy({
          query: args.query,
          strategy,
          rules,
        })
        // Keep it machine-readable for Router agent consumption.
        const out = JSON.stringify(decision)
        cacheSet(key, out)
        return out
      } catch (e) {
        return JSON.stringify({
          agent: "High Sisyphus",
          complexity: "COMPLEX",
          confidence: "low",
          reason: `route_sisyphus failed: ${e instanceof Error ? e.message : String(e)}`,
        })
      }
    },
  })
}

export const route_sisyphus: ToolDefinition = createRouteSisyphusTool()

export const ROUTE_SISYPHUS_TOOL_NAME = ROUTE_TOOL_NAME

