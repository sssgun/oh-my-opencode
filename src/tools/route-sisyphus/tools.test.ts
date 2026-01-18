import { describe, test, expect } from "bun:test"
import { route_sisyphus } from "./tools"

describe("route_sisyphus tool", () => {
  test("returns JSON string with required fields", async () => {
    // #given
    const ctx = {} as any

    // #when
    const out = await route_sisyphus.execute({ query: "Explain createBuiltinAgents" } as any, ctx)

    // #then
    const parsed = JSON.parse(out)
    expect(["Low Sisyphus", "Normal Sisyphus", "High Sisyphus"]).toContain(parsed.agent)
    expect(["LIGHT", "NORMAL", "COMPLEX"]).toContain(parsed.complexity)
    expect(typeof parsed.reason).toBe("string")
  })

  test("caches repeated queries", async () => {
    // #given
    const ctx = {} as any
    const q = "Explain createBuiltinAgents"

    // #when
    const a = await route_sisyphus.execute({ query: q } as any, ctx)
    const b = await route_sisyphus.execute({ query: q } as any, ctx)

    // #then
    expect(a).toBe(b)
  })
})

