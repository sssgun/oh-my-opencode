import { describe, test, expect } from "bun:test"
import { routeHybrid } from "./router"

describe("route-sisyphus (OpenAI integration)", () => {
  test.skip("OpenAI routing dependency removed; kept for historical context", async () => {
    const decision = await routeHybrid({ query: "test" })
    expect(decision).toBeDefined()
  })
})

