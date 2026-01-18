import {
  DEFAULT_COMPLEX_DECISION,
  agentFromComplexity,
} from "./constants"
import type {
  RouteConfidence,
  RouteDecision,
  RouteStrategy,
} from "./types"
import { DEFAULT_ROUTE_RULES, type RouteHeuristicRules } from "./rules"

function normalize(text: string): string {
  return text.trim().replace(/\s+/g, " ")
}

function extractForcedAgent(
  lower: string,
  rules: RouteHeuristicRules
): "Low Sisyphus" | "Normal Sisyphus" | "High Sisyphus" | null {
  // Explicit user override hints (quality > autonomy). Keep it simple and deterministic.
  if (!rules.enable_force_tags) return null
  if (/(^|\s)@low(\s|$)/.test(lower)) return "Low Sisyphus"
  if (/(^|\s)@normal(\s|$)/.test(lower)) return "Normal Sisyphus"
  if (/(^|\s)@high(\s|$)/.test(lower)) return "High Sisyphus"
  return null
}

function countFilePathMentions(text: string): number {
  // coarse: matches "src/...", ".opencode/...", ".sisyphus/...", "docs/...", etc.
  const matches = text.match(/(?:^|\s)(?:\.{0,2}\/)?(?:src|docs|script|assets|dist|configs|\.sisyphus|\.opencode)\/[^\s"'`]+/g)
  return matches?.length ?? 0
}

function confidenceFromSignals(input: {
  hasStrongComplexSignal: boolean
  hasStrongLightSignal: boolean
  hasMultiActionSignal: boolean
  hasMediumSignal: boolean
  filePathMentions: number
  length: number
  rules: RouteHeuristicRules
}): RouteConfidence {
  if (input.hasStrongComplexSignal) return "high"
  if (
    input.hasStrongLightSignal &&
    !input.hasMultiActionSignal &&
    !input.hasMediumSignal &&
    input.filePathMentions <= 1 &&
    input.length < input.rules.light_max_length
  ) {
    return "high"
  }
  // Keep confidence thresholds conservative and monotonic; allow tuning via length/path thresholds.
  if (
    input.filePathMentions >= Math.max(3, input.rules.complex_min_file_paths) ||
    input.length >= Math.max(1200, input.rules.normal_max_length + 300)
  ) {
    return "high"
  }
  if (
    input.filePathMentions >= Math.max(2, input.rules.normal_min_file_paths + 1) ||
    input.length >= Math.max(700, input.rules.normal_max_length - 200)
  ) {
    return "medium"
  }
  return "low"
}

export function routeHeuristic(
  query: string,
  rules: RouteHeuristicRules = DEFAULT_ROUTE_RULES
): RouteDecision {
  const q = normalize(query)
  const lower = q.toLowerCase()
  const forcedAgent = extractForcedAgent(lower, rules)
  const length = q.length
  const filePathMentions = countFilePathMentions(q)

  const hasMultiActionSignal =
    /\b(and|also|plus|then)\b/.test(lower) &&
    /\b(update|change|fix|add|implement|refactor|migrate|remove)\b/.test(lower)

  const hasMediumSignal =
    /\b(couple of files|few files|multiple files)\b/.test(lower) ||
    filePathMentions >= rules.normal_min_file_paths ||
    (length >= rules.light_max_length && length < rules.normal_max_length)

  const hasStrongComplexSignal =
    rules.complex_keywords.some((k) => lower.includes(k.toLowerCase())) ||
    filePathMentions >= rules.complex_min_file_paths ||
    length >= 1200

  const hasStrongLightSignal =
    rules.light_keywords.some((k) => lower.includes(k.toLowerCase())) &&
    filePathMentions < rules.normal_min_file_paths &&
    length < rules.light_max_length

  const confidence = confidenceFromSignals({
    hasStrongComplexSignal,
    hasStrongLightSignal,
    hasMultiActionSignal,
    hasMediumSignal,
    filePathMentions,
    length,
    rules,
  })

  const complexity: "LIGHT" | "NORMAL" | "COMPLEX" =
    hasStrongComplexSignal
      ? "COMPLEX"
      : hasStrongLightSignal
      ? "LIGHT"
      : // ambiguous middle bucket
      length >= rules.normal_max_length || filePathMentions >= rules.complex_min_file_paths
      ? "COMPLEX"
      : hasMediumSignal || length >= rules.light_max_length || filePathMentions >= rules.normal_min_file_paths
      ? "NORMAL"
      : "LIGHT"

  return {
    agent: forcedAgent ?? agentFromComplexity(complexity),
    complexity,
    confidence,
    reason:
      complexity === "COMPLEX"
        ? "Heuristic signals indicate multi-step/cross-cutting or high-complexity work."
        : complexity === "NORMAL"
        ? "Heuristic signals indicate an ambiguous/mid-complexity request; route to Normal to preserve quality."
        : "Heuristic signals indicate a small, direct request suitable for a lighter model.",
    signals: {
      length,
      filePathMentions,
      hasStrongComplexSignal,
      hasStrongLightSignal,
      hasMultiActionSignal,
      hasMediumSignal,
      forcedAgent,
    },
  }
}

export async function routeHybrid(input: {
  query: string
  rules?: RouteHeuristicRules
}): Promise<RouteDecision> {
  const heuristic = routeHeuristic(input.query, input.rules)
  // Dependency-free fallback: if heuristic is uncertain, prefer safer/stronger model tier.
  if (heuristic.confidence === "high") return { ...heuristic, reason: `Hybrid: ${heuristic.reason}` }
  if (heuristic.agent === "Low Sisyphus") {
    return {
      agent: "Normal Sisyphus",
      complexity: "NORMAL",
      confidence: "low",
      reason: "Hybrid: heuristic not confident; bump to Normal to preserve quality.",
      signals: heuristic.signals,
    }
  }
  if (heuristic.agent === "Normal Sisyphus") {
    return {
      agent: "High Sisyphus",
      complexity: "COMPLEX",
      confidence: "low",
      reason: "Hybrid: heuristic not confident; bump to High (safe).",
      signals: heuristic.signals,
    }
  }
  return { ...DEFAULT_COMPLEX_DECISION, reason: "Hybrid: heuristic not confident; default to High.", signals: heuristic.signals }
}

export async function routeWithStrategy(input: {
  query: string
  strategy: RouteStrategy
  rules?: RouteHeuristicRules
}): Promise<RouteDecision> {
  switch (input.strategy) {
    case "heuristic":
      return routeHeuristic(input.query, input.rules)
    case "hybrid":
      return await routeHybrid({ query: input.query, rules: input.rules })
    default:
      return routeHeuristic(input.query, input.rules)
  }
}

