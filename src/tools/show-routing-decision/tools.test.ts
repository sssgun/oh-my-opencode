import { describe, test, expect } from "bun:test"
import { show_routing_decision } from "./tools"

describe("show_routing_decision tool", () => {
  test("returns formatted routing decision analysis", async () => {
    // #given
    const ctx = {} as any

    // #when
    const result = await show_routing_decision.execute({ query: "Explain createBuiltinAgents" } as any, ctx)

    // #then
    expect(typeof result).toBe("string")
    expect(result).toContain("## 🔄 Routing Decision Analysis")
    expect(result).toContain("**Query Complexity**:")
    expect(result).toContain("**Recommended Agent**:")
    expect(result).toContain("**Confidence Level**:")
    expect(result).toContain("**Routing Reason**:")
    expect(result).toContain("**Agent Selection Guide**:")
  })

  test("handles complex queries appropriately", async () => {
    // #given
    const ctx = {} as any
    const complexQuery = "Implement a full-stack web application with authentication, database integration, and real-time features"

    // #when
    const result = await show_routing_decision.execute({ query: complexQuery } as any, ctx)

    // #then
    expect(result).toContain("Routing Decision Analysis")
    // The tool should still work even if it routes to High Sisyphus
  })

  test("handles simple queries appropriately", async () => {
    // #given
    const ctx = {} as any
    const simpleQuery = "What is 2+2?"

    // #when
    const result = await show_routing_decision.execute({ query: simpleQuery } as any, ctx)

    // #then
    expect(result).toContain("Routing Decision Analysis")
    // The tool should still work even if it routes to Low Sisyphus
  })

  test("handles empty query gracefully", async () => {
    // #given
    const ctx = {} as any

    // #when
    const result = await show_routing_decision.execute({ query: "" } as any, ctx)

    // #then
    expect(result).toContain("Routing Decision Analysis")
    // Should not crash on empty input
  })
})