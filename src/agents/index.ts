import type { AgentConfig } from "@opencode-ai/sdk"
import { sisyphusRouterAgent } from "./sisyphus-router"
import { lowSisyphusAgent } from "./sisyphus-low"
import { normalSisyphusAgent } from "./sisyphus-normal"
import { highSisyphusAgent } from "./sisyphus-high"
import { oracleAgent } from "./oracle"
import { librarianAgent } from "./librarian"
import { exploreAgent } from "./explore"
import { frontendUiUxEngineerAgent } from "./frontend-ui-ux-engineer"
import { documentWriterAgent } from "./document-writer"
import { multimodalLookerAgent } from "./multimodal-looker"
import { metisAgent } from "./metis"
import { orchestratorSisyphusAgent } from "./orchestrator-sisyphus"
import { momusAgent } from "./momus"

export const builtinAgents: Record<string, AgentConfig> = {
  Sisyphus: sisyphusRouterAgent,
  "Low Sisyphus": lowSisyphusAgent,
  "Normal Sisyphus": normalSisyphusAgent,
  "High Sisyphus": highSisyphusAgent,
  oracle: oracleAgent,
  librarian: librarianAgent,
  explore: exploreAgent,
  "frontend-ui-ux-engineer": frontendUiUxEngineerAgent,
  "document-writer": documentWriterAgent,
  "multimodal-looker": multimodalLookerAgent,
  "Metis (Plan Consultant)": metisAgent,
  "Momus (Plan Reviewer)": momusAgent,
  "orchestrator-sisyphus": orchestratorSisyphusAgent,
}

export * from "./types"
export { createBuiltinAgents } from "./utils"
export type { AvailableAgent } from "./sisyphus-prompt-builder"
