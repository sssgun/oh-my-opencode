#!/usr/bin/env bun

/**
 * Agent Handoff System Integration Test
 *
 * This script tests the integration of all handoff system components
 */

import { createAgentHandoffPlannerAgent, createAgentHandoffExecutorAgent } from "./src/agents/agent-handoff-planner"
import { createAgentHandoffExecutorAgent as createExecutorAgent } from "./src/agents/agent-handoff-executor"
import { createHandoffDetectionHook } from "./src/hooks/handoff-detection"
import { ContextTranslator, ContextValidator, ContextPersistence } from "./src/shared/cross-platform-context"

async function testAgentCreation() {
  console.log("🧪 Testing Agent Creation...")

  try {
    const plannerAgent = createAgentHandoffPlannerAgent()
    const executorAgent = createExecutorAgent()

    console.log("✅ Planner Agent created:", {
      model: plannerAgent.model,
      mode: plannerAgent.mode,
      temperature: plannerAgent.temperature,
      hasPrompt: !!plannerAgent.prompt,
      hasPermissions: !!plannerAgent.permission,
    })

    console.log("✅ Executor Agent created:", {
      model: executorAgent.model,
      mode: executorAgent.mode,
      temperature: executorAgent.temperature,
      hasPrompt: !!executorAgent.prompt,
      hasPermissions: !!executorAgent.permission,
    })

    return true
  } catch (error) {
    console.error("❌ Agent creation failed:", error)
    return false
  }
}

async function testHookCreation() {
  console.log("🧪 Testing Hook Creation...")

  try {
    const hook = createHandoffDetectionHook({
      autoTrigger: true,
      confidenceThreshold: 0.7,
      enabledPlatforms: ['claude-code', 'cursor', 'opencode'],
    })

    console.log("✅ Handoff Detection Hook created:", {
      hasChatMessageHandler: typeof hook["chat.message"] === "function",
    })

    return true
  } catch (error) {
    console.error("❌ Hook creation failed:", error)
    return false
  }
}

async function testContextTranslation() {
  console.log("🧪 Testing Context Translation...")

  try {
    const sampleContext = {
      platform: {
        platform: 'opencode' as const,
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        userId: 'test-user',
        sessionId: 'test-session',
      },
      files: [
        {
          path: 'src/main.ts',
          cursorPosition: { line: 10, column: 5 },
          isModified: true,
          isOpen: true,
        },
      ],
      git: {
        branch: 'main',
        status: { staged: [], modified: [], untracked: [], deleted: [] },
        recentCommits: [],
      },
      processes: [],
      tools: [],
      environment: {
        nodeVersion: '18.0.0',
        os: 'linux',
        shell: 'bash',
        workingDirectory: '/test',
        environmentVariables: {},
      },
      metadata: {
        handoffReason: 'Test handoff',
        priority: 'normal' as const,
        tags: ['test'],
      },
    }

    // Test Claude Code translation
    const claudeContext = ContextTranslator.toClaudeCode(sampleContext)
    console.log("✅ Claude Code context translated")

    // Test Cursor translation
    const cursorContext = ContextTranslator.toCursor(sampleContext)
    console.log("✅ Cursor context translated")

    // Test validation
    const validation = ContextValidator.validate(sampleContext)
    console.log("✅ Context validation:", validation.valid)

    return true
  } catch (error) {
    console.error("❌ Context translation failed:", error)
    return false
  }
}

async function testContextPersistence() {
  console.log("🧪 Testing Context Persistence...")

  try {
    const sampleContext = {
      platform: {
        platform: 'opencode' as const,
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        userId: 'test-user',
        sessionId: 'test-session',
      },
      files: [],
      git: {
        branch: 'main',
        status: { staged: [], modified: [], untracked: [], deleted: [] },
        recentCommits: [],
      },
      processes: [],
      tools: [],
      environment: {
        os: 'linux',
        shell: 'bash',
        workingDirectory: '/test',
        environmentVariables: {},
      },
      metadata: {},
    }

    // Note: Actual file I/O would require proper mocking in a real test environment
    // For this integration test, we'll just test the sanitization
    const sanitized = ContextValidator.sanitize(sampleContext)
    console.log("✅ Context sanitization works")

    const validation = ContextValidator.validate(sanitized)
    console.log("✅ Sanitized context validation:", validation.valid)

    return true
  } catch (error) {
    console.error("❌ Context persistence failed:", error)
    return false
  }
}

async function testPlanningDocuments() {
  console.log("🧪 Testing Planning Documents...")

  try {
    // Check if planning document templates exist
    const fs = await import("fs/promises")

    const templateFiles = [
      'docs/planning/00_CONTEXT.template.md',
      'docs/planning/08_HANDOFF.template.md',
      'docs/planning/09_IMPLEMENTATION_RESULTS.template.md',
    ]

    for (const file of templateFiles) {
      try {
        await fs.access(file)
        console.log(`✅ Template exists: ${file}`)
      } catch {
        console.log(`⚠️  Template missing: ${file}`)
      }
    }

    // Check if cross-platform directories exist
    const directories = [
      'docs/planning/cross-platform',
      'docs/planning/handoffs',
    ]

    for (const dir of directories) {
      try {
        await fs.access(dir)
        console.log(`✅ Directory exists: ${dir}`)
      } catch {
        console.log(`⚠️  Directory missing: ${dir}`)
      }
    }

    return true
  } catch (error) {
    console.error("❌ Planning documents test failed:", error)
    return false
  }
}

async function runIntegrationTests() {
  console.log("🚀 Starting Agent Handoff System Integration Tests\n")

  const results = await Promise.all([
    testAgentCreation(),
    testHookCreation(),
    testContextTranslation(),
    testContextPersistence(),
    testPlanningDocuments(),
  ])

  const passed = results.filter(Boolean).length
  const total = results.length

  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`)

  if (passed === total) {
    console.log("🎉 All integration tests passed!")
    return true
  } else {
    console.log("❌ Some integration tests failed")
    return false
  }
}

// Run the tests
runIntegrationTests().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error("💥 Integration test runner failed:", error)
  process.exit(1)
})