import { HANDOFF_DETECTION_TAG_OPEN, HANDOFF_DETECTION_TAG_CLOSE } from "./constants"
import type { HandoffContext, HandoffPreparationResult } from "./types"
import { ContextPersistence, type CrossPlatformContext } from "../../shared/cross-platform-context"
import { log } from "../../shared"

/**
 * Execute handoff preparation
 */
export async function executeHandoffPreparation(
  context: HandoffContext
): Promise<HandoffPreparationResult> {
  const startTime = Date.now()

  try {
    log(`[handoff-detection] Starting handoff preparation`, {
      sessionId: context.sessionId,
      trigger: context.trigger.type,
      platforms: context.targetPlatforms,
    })

    // Gather current work state
    const workState = await gatherWorkState(context)

    // Create cross-platform context
    const crossPlatformContext = await createCrossPlatformContext(context, workState)

    // Generate planning documents
    const planningDocuments = await generatePlanningDocuments(context, crossPlatformContext)

    // Save context files
    const contextFiles = await saveContextFiles(crossPlatformContext, context)

    // Save handoff state
    await ContextPersistence.saveHandoff(crossPlatformContext, context.trigger.reason)

    const duration = Date.now() - startTime

    log(`[handoff-detection] Handoff preparation completed`, {
      sessionId: context.sessionId,
      duration,
      documents: planningDocuments.length,
      contextFiles: contextFiles.length,
    })

    return {
      success: true,
      context: crossPlatformContext,
      planningDocuments,
      estimatedDuration: duration,
    }

  } catch (error) {
    const duration = Date.now() - startTime

    log(`[handoff-detection] Handoff preparation failed`, {
      sessionId: context.sessionId,
      error: error instanceof Error ? error.message : String(error),
      duration,
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      estimatedDuration: duration,
    }
  }
}

/**
 * Gather current work state from the environment
 */
async function gatherWorkState(context: HandoffContext): Promise<{
  openFiles: Array<{ path: string; cursor?: { line: number; column: number } }>
  gitStatus: any
  activeProcesses: any[]
  recentChanges: string[]
}> {
  // This would integrate with actual tools to gather real state
  // For now, return mock data based on context
  return {
    openFiles: context.currentWorkState.activeFiles.map(path => ({
      path,
      cursor: { line: 1, column: 1 }, // Mock cursor position
    })),
    gitStatus: {
      branch: 'main',
      status: {
        staged: [],
        modified: context.currentWorkState.recentChanges,
        untracked: [],
        deleted: [],
      },
      recentCommits: [],
    },
    activeProcesses: [],
    recentChanges: context.currentWorkState.recentChanges,
  }
}

/**
 * Create cross-platform context from work state
 */
async function createCrossPlatformContext(
  handoffContext: HandoffContext,
  workState: any
): Promise<CrossPlatformContext> {
  const context: CrossPlatformContext = {
    platform: {
      platform: 'opencode',
      version: '1.0.0',
      timestamp: handoffContext.timestamp,
      userId: 'current-user',
      sessionId: handoffContext.sessionId,
    },
    files: workState.openFiles.map((file: any) => ({
      path: file.path,
      cursorPosition: file.cursor,
      isModified: workState.recentChanges.includes(file.path),
      isOpen: true,
    })),
    git: workState.gitStatus,
    processes: workState.activeProcesses.map((proc: any) => ({
      command: proc.command,
      workingDirectory: proc.cwd || process.cwd(),
      status: proc.status || 'running',
      startTime: new Date().toISOString(),
      environment: {},
    })),
    tools: [], // Would be populated by actual tool state
    environment: {
      nodeVersion: process.version,
      os: process.platform,
      shell: process.env.SHELL || 'bash',
      workingDirectory: process.cwd(),
      environmentVariables: process.env as Record<string, string>,
    },
    metadata: {
      handoffReason: handoffContext.trigger.reason,
      priority: handoffContext.priority,
      tags: ['handoff', handoffContext.trigger.type],
      notes: `Handoff triggered by: ${handoffContext.trigger.reason}`,
    },
  }

  return context
}

/**
 * Generate planning documents for handoff
 */
async function generatePlanningDocuments(
  context: HandoffContext,
  crossPlatformContext: CrossPlatformContext
): Promise<string[]> {
  const documents: string[] = []

  // This would use templates to generate actual planning documents
  // For now, return mock document paths
  const mockDocuments = [
    'docs/planning/00_CONTEXT.md',
    'docs/planning/08_HANDOFF.md',
    'docs/planning/09_IMPLEMENTATION_RESULTS.md',
  ]

  documents.push(...mockDocuments)

  log(`[handoff-detection] Generated planning documents`, {
    sessionId: context.sessionId,
    documents,
  })

  return documents
}

/**
 * Save context files for cross-platform compatibility
 */
async function saveContextFiles(
  context: CrossPlatformContext,
  handoffContext: HandoffContext
): Promise<string[]> {
  const savedFiles: string[] = []

  try {
    // Save OpenCode context
    const opencodePath = await ContextPersistence.save(context, 'docs/planning/cross-platform/opencode-context.json')
    savedFiles.push(opencodePath)

    // Save Claude Code compatible context
    const claudePath = await ContextPersistence.save({
      ...context,
      platform: { ...context.platform, platform: 'claude-code' },
    }, 'docs/planning/cross-platform/claude-code-context.json')
    savedFiles.push(claudePath)

    // Save Cursor compatible context
    const cursorPath = await ContextPersistence.save({
      ...context,
      platform: { ...context.platform, platform: 'cursor' },
    }, 'docs/planning/cross-platform/cursor-context.json')
    savedFiles.push(cursorPath)

    log(`[handoff-detection] Saved context files`, {
      sessionId: handoffContext.sessionId,
      files: savedFiles,
    })

  } catch (error) {
    log(`[handoff-detection] Failed to save context files`, {
      sessionId: handoffContext.sessionId,
      error: error instanceof Error ? error.message : String(error),
    })
  }

  return savedFiles
}

/**
 * Format handoff detection result for user display
 */
export function formatHandoffDetectionMessage(
  result: { shouldTrigger: boolean; reason: string; confidence: number; recommendedPlatforms?: string[] }
): string {
  if (!result.shouldTrigger) {
    return ''
  }

  const platforms = result.recommendedPlatforms?.join(', ') || 'available platforms'

  return `${HANDOFF_DETECTION_TAG_OPEN}
🤝 **Handoff Trigger Detected**

**Reason**: ${result.reason}
**Confidence**: ${(result.confidence * 100).toFixed(0)}%
**Recommended Platforms**: ${platforms}

The system has detected conditions suitable for cross-platform handoff. Planning documents and context preservation are being prepared automatically.

To proceed with handoff:
1. Review the generated planning documents in \`docs/planning/\`
2. Choose your target platform (${platforms})
3. Load the appropriate context file from \`docs/planning/cross-platform/\`

${HANDOFF_DETECTION_TAG_CLOSE}`
}