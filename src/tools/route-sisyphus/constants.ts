import type { RouteDecision, RouteAgentName, RouteComplexity } from "./types"

export const ROUTE_TOOL_NAME = "route_sisyphus" as const

export const DEFAULT_HEURISTIC_COMPLEX_KEYWORDS = [
  "architecture",
  "design",
  "refactor",
  "migration",
  "multi-step",
  "multi step",
  "orchestrator",
  "orchestration",
  "sisyphus-orchestrator",
  "performance",
  "security",
  "threat",
  "vulnerability",
  "optimiz",
  "benchmark",
  "race condition",
  "deadlock",
  "ci",
  "pipeline",
  "release",
  "deploy",
  "rollout",
  "breaking change",
  "schema",
  "zod",
] as const

export const DEFAULT_HEURISTIC_LIGHT_KEYWORDS = [
  "what is",
  "what does",
  "explain",
  "where is",
  "how to",
  "typo",
  "rename",
  "format",
  "lint",
  "docs",
  "readme",
] as const

export const DEFAULT_COMPLEX_DECISION: RouteDecision = {
  agent: "High Sisyphus",
  complexity: "COMPLEX",
  confidence: "low",
  reason: "Fallback to High Sisyphus (safe default).",
}

export function agentFromComplexity(complexity: RouteComplexity): RouteAgentName {
  if (complexity === "LIGHT") return "Low Sisyphus"
  if (complexity === "NORMAL") return "Normal Sisyphus"
  return "High Sisyphus"
}

