import { describe, test, expect } from "bun:test"
import { routeHeuristic, routeHybrid } from "./router"
import { DEFAULT_ROUTE_RULES } from "./rules"

describe("route-sisyphus", () => {
  describe("heuristic", () => {
    test("routes obvious complex requests to High Sisyphus", () => {
      // #given
      const query =
        "Refactor the routing architecture across src/index.ts and src/agents/utils.ts, add tests, and ensure compatibility."

      // #when
      const decision = routeHeuristic(query)

      // #then
      expect(decision.agent).toBe("High Sisyphus")
      expect(decision.complexity).toBe("COMPLEX")
      expect(["high", "medium", "low"]).toContain(decision.confidence)
    })

    test("routes simple explanation requests to Low Sisyphus", () => {
      // #given
      const query = "What does createBuiltinAgents do?"

      // #when
      const decision = routeHeuristic(query)

      // #then
      expect(decision.agent).toBe("Low Sisyphus")
      expect(decision.complexity).toBe("LIGHT")
    })

    test("routes multi-file mentions to High Sisyphus", () => {
      // #given
      const query =
        "Update src/index.ts and src/config/schema.ts and also adjust docs/cli-guide.md accordingly."

      // #when
      const decision = routeHeuristic(query)

      // #then
      expect(decision.agent).toBe("High Sisyphus")
      expect(decision.complexity).toBe("COMPLEX")
    })

    test("routes ambiguous requests to Normal Sisyphus", () => {
      // #given
      const query = "Add better routing for Sisyphus and adjust a couple of files."

      // #when
      const decision = routeHeuristic(query)

      // #then
      expect(decision.agent).toBe("Normal Sisyphus")
      expect(decision.complexity).toBe("NORMAL")
    })

    test("supports explicit override hints (@low/@normal/@high)", () => {
      // #given / #when / #then
      expect(routeHeuristic("Explain this quickly @low").agent).toBe("Low Sisyphus")
      expect(routeHeuristic("Please handle this @normal").agent).toBe("Normal Sisyphus")
      expect(routeHeuristic("This needs deep work @high").agent).toBe("High Sisyphus")
    })

    test("accepts config-injected rules (e.g., disable force tags)", () => {
      // #given
      const rules = { ...DEFAULT_ROUTE_RULES, enable_force_tags: false }

      // #when
      const decision = routeHeuristic("Explain this quickly @low", rules)

      // #then - @low should be ignored when force tags disabled
      expect(decision.signals?.forcedAgent ?? null).toBeNull()
    })
  })

  describe("hybrid", () => {
    test("bumps to safer tier when heuristic confidence is low", async () => {
      // #given
      const lowConfidenceLight = "Explain what does this do? also update something maybe"

      // #when
      const decision = await routeHybrid({ query: lowConfidenceLight })

      // #then - should not stay at Low when uncertain
      expect(["Normal Sisyphus", "High Sisyphus"]).toContain(decision.agent)
    })
  })
})

