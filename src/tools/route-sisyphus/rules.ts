import {
  DEFAULT_HEURISTIC_COMPLEX_KEYWORDS,
  DEFAULT_HEURISTIC_LIGHT_KEYWORDS,
} from "./constants"

export interface RouteHeuristicRules {
  /**
   * Keywords that strongly indicate COMPLEX routing.
   */
  complex_keywords: string[]

  /**
   * Keywords that strongly indicate LIGHT routing.
   */
  light_keywords: string[]

  /**
   * LIGHT upper bound. Below this (and with other signals) can be LIGHT.
   */
  light_max_length: number

  /**
   * NORMAL upper bound. Above this becomes COMPLEX.
   */
  normal_max_length: number

  /**
   * If file path mentions >= this, treat as COMPLEX.
   */
  complex_min_file_paths: number

  /**
   * If file path mentions >= this, treat as at least NORMAL.
   */
  normal_min_file_paths: number

  /**
   * Enable explicit override tags (@low/@normal/@high) in user query.
   */
  enable_force_tags: boolean
}

export const DEFAULT_ROUTE_RULES: RouteHeuristicRules = {
  complex_keywords: [...DEFAULT_HEURISTIC_COMPLEX_KEYWORDS],
  light_keywords: [...DEFAULT_HEURISTIC_LIGHT_KEYWORDS],
  light_max_length: 400,
  normal_max_length: 900,
  complex_min_file_paths: 2,
  normal_min_file_paths: 1,
  enable_force_tags: true,
}

export function mergeRouteRules(
  base: RouteHeuristicRules,
  override?: Partial<RouteHeuristicRules>
): RouteHeuristicRules {
  if (!override) return base
  return {
    ...base,
    ...override,
    complex_keywords: override.complex_keywords ?? base.complex_keywords,
    light_keywords: override.light_keywords ?? base.light_keywords,
  }
}

