import type { AgentConfig } from "@opencode-ai/sdk"
import type { BuiltinAgentName, AgentOverrideConfig, AgentOverrides, AgentFactory, AgentPromptMetadata } from "./types"
import type { CategoriesConfig, CategoryConfig, GitMasterConfig } from "../config/schema"
import { createSisyphusRouterAgent } from "./sisyphus-router"
import { createLowSisyphusAgent } from "./sisyphus-low"
import { createNormalSisyphusAgent } from "./sisyphus-normal"
import { createHighSisyphusAgent } from "./sisyphus-high"
import { createOracleAgent, ORACLE_PROMPT_METADATA } from "./oracle"
import { createLibrarianAgent, LIBRARIAN_PROMPT_METADATA } from "./librarian"
import { createExploreAgent, EXPLORE_PROMPT_METADATA } from "./explore"
import { createFrontendUiUxEngineerAgent, FRONTEND_PROMPT_METADATA } from "./frontend-ui-ux-engineer"
import { createDocumentWriterAgent, DOCUMENT_WRITER_PROMPT_METADATA } from "./document-writer"
import { createMultimodalLookerAgent, MULTIMODAL_LOOKER_PROMPT_METADATA } from "./multimodal-looker"
import { createMetisAgent } from "./metis"
import { createOrchestratorSisyphusAgent, orchestratorSisyphusAgent } from "./orchestrator-sisyphus"
import { createMomusAgent } from "./momus"
import { createAgentHandoffPlannerAgent } from "./agent-handoff-planner"
import { createAgentHandoffExecutorAgent } from "./agent-handoff-executor"
import type { AvailableAgent } from "./sisyphus-prompt-builder"
import { deepMerge } from "../shared"
import { DEFAULT_CATEGORIES } from "../tools/delegate-task/constants"
import { resolveMultipleSkills } from "../features/opencode-skill-loader/skill-content"

type AgentSource = AgentFactory | AgentConfig

const agentSources: Record<BuiltinAgentName, AgentSource> = {
  Sisyphus: createSisyphusRouterAgent,
  "Low Sisyphus": createLowSisyphusAgent,
  "Normal Sisyphus": createNormalSisyphusAgent,
  "High Sisyphus": createHighSisyphusAgent,
  oracle: createOracleAgent,
  librarian: createLibrarianAgent,
  explore: createExploreAgent,
  "frontend-ui-ux-engineer": createFrontendUiUxEngineerAgent,
  "document-writer": createDocumentWriterAgent,
  "multimodal-looker": createMultimodalLookerAgent,
  "Metis (Plan Consultant)": createMetisAgent,
  "Momus (Plan Reviewer)": createMomusAgent,
  "orchestrator-sisyphus": orchestratorSisyphusAgent,
  "agent-handoff-planner": createAgentHandoffPlannerAgent,
  "agent-handoff-executor": createAgentHandoffExecutorAgent,
}

/**
 * Metadata for each agent, used to build Sisyphus's dynamic prompt sections
 * (Delegation Table, Tool Selection, Key Triggers, etc.)
 */
const agentMetadata: Partial<Record<BuiltinAgentName, AgentPromptMetadata>> = {
  oracle: ORACLE_PROMPT_METADATA,
  librarian: LIBRARIAN_PROMPT_METADATA,
  explore: EXPLORE_PROMPT_METADATA,
  "frontend-ui-ux-engineer": FRONTEND_PROMPT_METADATA,
  "document-writer": DOCUMENT_WRITER_PROMPT_METADATA,
  "multimodal-looker": MULTIMODAL_LOOKER_PROMPT_METADATA,
}

function isFactory(source: AgentSource): source is AgentFactory {
  return typeof source === "function"
}

export function buildAgent(
  source: AgentSource,
  model?: string,
  categories?: CategoriesConfig,
  gitMasterConfig?: GitMasterConfig
): AgentConfig {
  const base = isFactory(source) ? source(model) : source
  const categoryConfigs: Record<string, CategoryConfig> = categories
    ? { ...DEFAULT_CATEGORIES, ...categories }
    : DEFAULT_CATEGORIES

  const agentWithCategory = base as AgentConfig & { category?: string; skills?: string[]; variant?: string }
  if (agentWithCategory.category) {
    const categoryConfig = categoryConfigs[agentWithCategory.category]
    if (categoryConfig) {
      if (!base.model) {
        base.model = categoryConfig.model
      }
      if (base.temperature === undefined && categoryConfig.temperature !== undefined) {
        base.temperature = categoryConfig.temperature
      }
      if (base.variant === undefined && categoryConfig.variant !== undefined) {
        base.variant = categoryConfig.variant
      }
    }
  }

  if (agentWithCategory.skills?.length) {
    const { resolved } = resolveMultipleSkills(agentWithCategory.skills, { gitMasterConfig })
    if (resolved.size > 0) {
      const skillContent = Array.from(resolved.values()).join("\n\n")
      base.prompt = skillContent + (base.prompt ? "\n\n" + base.prompt : "")
    }
  }

  return base
}

/**
 * Creates OmO-specific environment context (time, timezone, locale).
 * Note: Working directory, platform, and date are already provided by OpenCode's system.ts,
 * so we only include fields that OpenCode doesn't provide to avoid duplication.
 * See: https://github.com/code-yeongyu/oh-my-opencode/issues/379
 */
export function createEnvContext(): string {
  const now = new Date()
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const locale = Intl.DateTimeFormat().resolvedOptions().locale

  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })

  return `
<omo-env>
  Current time: ${timeStr}
  Timezone: ${timezone}
  Locale: ${locale}
</omo-env>`
}

function mergeAgentConfig(
  base: AgentConfig,
  override: AgentOverrideConfig
): AgentConfig {
  const { prompt_append, ...rest } = override
  const merged = deepMerge(base, rest as Partial<AgentConfig>)

  if (prompt_append && merged.prompt) {
    merged.prompt = merged.prompt + "\n" + prompt_append
  }

  return merged
}

export function createBuiltinAgents(
  disabledAgents: BuiltinAgentName[] = [],
  agentOverrides: AgentOverrides = {},
  directory?: string,
  systemDefaultModel?: string,
  categories?: CategoriesConfig,
  gitMasterConfig?: GitMasterConfig
): Record<string, AgentConfig> {
  // Normalize alias keys (e.g. "Low-Sisyphus") to canonical builtin names.
  // Canonical keys always win; aliases are only used as fallback.
  const normalizedOverrides: AgentOverrides = { ...agentOverrides }
  if (!normalizedOverrides["Low Sisyphus"] && normalizedOverrides["Low-Sisyphus"]) {
    normalizedOverrides["Low Sisyphus"] = normalizedOverrides["Low-Sisyphus"]
  }
  if (!normalizedOverrides["Normal Sisyphus"] && normalizedOverrides["Normal-Sisyphus"]) {
    normalizedOverrides["Normal Sisyphus"] = normalizedOverrides["Normal-Sisyphus"]
  }
  if (!normalizedOverrides["High Sisyphus"] && normalizedOverrides["High-Sisyphus"]) {
    normalizedOverrides["High Sisyphus"] = normalizedOverrides["High-Sisyphus"]
  }
  if (!normalizedOverrides["High Sisyphus"] && normalizedOverrides["Hihg-Sisyphus"]) {
    normalizedOverrides["High Sisyphus"] = normalizedOverrides["Hihg-Sisyphus"]
  }

  const result: Record<string, AgentConfig> = {}
  const availableAgents: AvailableAgent[] = []

  const mergedCategories = categories
    ? { ...DEFAULT_CATEGORIES, ...categories }
    : DEFAULT_CATEGORIES

  for (const [name, source] of Object.entries(agentSources)) {
    const agentName = name as BuiltinAgentName

    if (agentName === "Sisyphus") continue
    if (agentName === "Low Sisyphus") continue
    if (agentName === "Normal Sisyphus") continue
    if (agentName === "High Sisyphus") continue
    if (agentName === "orchestrator-sisyphus") continue
    if (disabledAgents.includes(agentName)) continue

    const override = normalizedOverrides[agentName]
    const model = override?.model

    let config = buildAgent(source, model, mergedCategories, gitMasterConfig)

    if (agentName === "librarian" && directory && config.prompt) {
      const envContext = createEnvContext()
      config = { ...config, prompt: config.prompt + envContext }
    }

    if (override) {
      config = mergeAgentConfig(config, override)
    }

    result[name] = config

    const metadata = agentMetadata[agentName]
    if (metadata) {
      availableAgents.push({
        name: agentName,
        description: config.description ?? "",
        metadata,
      })
    }
  }

  if (!disabledAgents.includes("Sisyphus")) {
    const sisyphusOverride = normalizedOverrides["Sisyphus"]
    // NOTE: The router must stay cheap by default to achieve cost savings.
    // Users can still override via plugin config `agents.Sisyphus.model`.
    const sisyphusModel = sisyphusOverride?.model

    let sisyphusConfig = createSisyphusRouterAgent(sisyphusModel)

    if (sisyphusOverride) {
      sisyphusConfig = mergeAgentConfig(sisyphusConfig, sisyphusOverride)
    }

    result["Sisyphus"] = sisyphusConfig
  }

  if (!disabledAgents.includes("Low Sisyphus")) {
    const lowOverride = normalizedOverrides["Low Sisyphus"]
    const lowModel = lowOverride?.model

    let lowConfig = createLowSisyphusAgent(lowModel, availableAgents)
    if (directory && lowConfig.prompt) {
      const envContext = createEnvContext()
      lowConfig = { ...lowConfig, prompt: lowConfig.prompt + envContext }
    }
    if (lowOverride) {
      lowConfig = mergeAgentConfig(lowConfig, lowOverride)
    }
    result["Low Sisyphus"] = lowConfig
  }

  if (!disabledAgents.includes("Normal Sisyphus")) {
    const normalOverride = normalizedOverrides["Normal Sisyphus"]
    const normalModel = normalOverride?.model

    let normalConfig = createNormalSisyphusAgent(normalModel, availableAgents)
    if (directory && normalConfig.prompt) {
      const envContext = createEnvContext()
      normalConfig = { ...normalConfig, prompt: normalConfig.prompt + envContext }
    }
    if (normalOverride) {
      normalConfig = mergeAgentConfig(normalConfig, normalOverride)
    }
    result["Normal Sisyphus"] = normalConfig
  }

  if (!disabledAgents.includes("High Sisyphus")) {
    const highOverride = normalizedOverrides["High Sisyphus"]
    const highModel = highOverride?.model

    let highConfig = createHighSisyphusAgent(highModel, availableAgents)
    if (directory && highConfig.prompt) {
      const envContext = createEnvContext()
      highConfig = { ...highConfig, prompt: highConfig.prompt + envContext }
    }
    if (highOverride) {
      highConfig = mergeAgentConfig(highConfig, highOverride)
    }
    result["High Sisyphus"] = highConfig
  }

  if (!disabledAgents.includes("orchestrator-sisyphus")) {
    const orchestratorOverride = agentOverrides["orchestrator-sisyphus"]
    const orchestratorModel = orchestratorOverride?.model ?? systemDefaultModel
    let orchestratorConfig = createOrchestratorSisyphusAgent({
      model: orchestratorModel,
      availableAgents,
    })

    if (orchestratorOverride) {
      orchestratorConfig = mergeAgentConfig(orchestratorConfig, orchestratorOverride)
    }

    result["orchestrator-sisyphus"] = orchestratorConfig
  }

  return result
}
