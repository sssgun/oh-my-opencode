export type RouteComplexity = "LIGHT" | "NORMAL" | "COMPLEX"

export type RouteAgentName = "Low Sisyphus" | "Normal Sisyphus" | "High Sisyphus"

export type RouteConfidence = "high" | "medium" | "low"

export type RouteStrategy = "heuristic" | "llm" | "hybrid"

export interface RouteDecision {
  agent: RouteAgentName
  complexity: RouteComplexity
  confidence: RouteConfidence
  reason: string
  signals?: Record<string, unknown>
}

export interface RouterEnv {
  /**
   * Enable verbose routing logs (for debugging). Default: off
   */
  ROUTER_DEBUG?: string
}

