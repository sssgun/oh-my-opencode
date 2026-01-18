import { describe, expect, test, beforeEach, afterEach, mock } from "bun:test"
import {
  ContextTranslator,
  ContextValidator,
  ContextPersistence,
  type CrossPlatformContext,
} from "./cross-platform-context"

// Mock fs/promises
const mockReadFile = mock(async () => JSON.stringify({
  platform: { platform: 'opencode', version: '1.0' },
  files: [],
  git: { branch: 'main', status: { staged: [], modified: [], untracked: [], deleted: [] }, recentCommits: [] },
  processes: [],
  tools: [],
  environment: { nodeVersion: '18.0.0', os: 'linux', shell: 'bash', workingDirectory: '/test', environmentVariables: {} },
  metadata: {},
}))

const mockWriteFile = mock(async () => undefined)
const mockAccess = mock(async () => undefined)
const mockMkdir = mock(async () => undefined)
const mockReaddir = mock(async (...args: any[]) => ['handoff-1.json', 'handoff-2.json'])

mock.module("fs/promises", () => ({
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  access: mockAccess,
  mkdir: mockMkdir,
  readdir: mockReaddir,
}))

describe("Cross-Platform Context Manager", () => {
  let sampleContext: CrossPlatformContext

  beforeEach(() => {
    // Reset mocks
    mockReadFile.mockClear()
    mockWriteFile.mockClear()
    mockAccess.mockClear()
    mockMkdir.mockClear()
    mockReaddir.mockClear()

    // Create sample context for testing
    sampleContext = {
      platform: {
        platform: 'opencode',
        version: '1.0.0',
        timestamp: '2025-01-18T12:00:00.000Z',
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
        {
          path: 'package.json',
          isModified: false,
          isOpen: false,
        },
      ],
      git: {
        branch: 'main',
        status: {
          staged: ['src/main.ts'],
          modified: [],
          untracked: ['README.md'],
          deleted: [],
        },
        recentCommits: [
          {
            hash: 'abc123',
            message: 'Initial commit',
            timestamp: '2025-01-18T11:00:00.000Z',
          },
        ],
      },
      processes: [
        {
          command: 'npm run dev',
          workingDirectory: '/project',
          status: 'running',
          startTime: '2025-01-18T12:00:00.000Z',
          environment: { NODE_ENV: 'development' },
        },
      ],
      tools: [
        {
          name: 'read_file',
          configuration: { maxSize: 1000 },
          state: { lastUsed: '2025-01-18T12:00:00.000Z' },
        },
      ],
      environment: {
        nodeVersion: '18.17.0',
        os: 'linux',
        shell: 'bash',
        workingDirectory: '/home/user/project',
        environmentVariables: {
          PATH: '/usr/bin',
          HOME: '/home/user',
          SECRET_KEY: 'sensitive-data', // Should be sanitized
        },
      },
      metadata: {
        handoffReason: 'Switching to Claude Code for analysis',
        priority: 'high',
        tags: ['refactoring', 'architecture'],
        notes: 'Complex refactoring task in progress',
      },
    }
  })

  afterEach(() => {
    // Clean up if needed
  })

  describe("ContextTranslator", () => {
    describe("toClaudeCode", () => {
      test("should translate OpenCode context to Claude Code format", () => {
        // #given - OpenCode context

        // #when
        const claudeContext = ContextTranslator.toClaudeCode(sampleContext)

        // #then - should be in Claude Code format
        expect(claudeContext).toHaveProperty('version', '1.0')
        expect(claudeContext).toHaveProperty('platform', 'claude-code')
        expect(claudeContext).toHaveProperty('workspace')
        expect(claudeContext).toHaveProperty('files')
        expect(claudeContext).toHaveProperty('processes')
        expect(claudeContext).toHaveProperty('tools')
        expect(claudeContext).toHaveProperty('metadata')

        // Files should be translated
        expect((claudeContext as any).files).toHaveLength(2)
        expect((claudeContext as any).files[0]).toHaveProperty('path', 'src/main.ts')
        expect((claudeContext as any).files[0]).toHaveProperty('cursor')

        // Tools should be restructured
        expect((claudeContext as any).tools).toHaveProperty('read_file')
        expect((claudeContext as any).tools.read_file).toHaveProperty('config')
        expect((claudeContext as any).tools.read_file).toHaveProperty('state')
      })

      test("should handle empty context gracefully", () => {
        // #given - minimal context
        const minimalContext: CrossPlatformContext = {
          platform: {
            platform: 'opencode',
            version: '1.0.0',
            timestamp: '2025-01-18T12:00:00.000Z',
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

        // #when
        const claudeContext = ContextTranslator.toClaudeCode(minimalContext)

        // #then - should still translate correctly
        expect(claudeContext).toHaveProperty('version', '1.0')
        expect(claudeContext).toHaveProperty('files', [])
        expect(claudeContext).toHaveProperty('processes', [])
        expect(claudeContext).toHaveProperty('tools', {})
      })
    })

    describe("toCursor", () => {
      test("should translate OpenCode context to Cursor format", () => {
        // #given - OpenCode context

        // #when
        const cursorContext = ContextTranslator.toCursor(sampleContext)

        // #then - should be in Cursor format
        expect(cursorContext).toHaveProperty('version', '1.0')
        expect(cursorContext).toHaveProperty('platform', 'cursor')
        expect(cursorContext).toHaveProperty('project')
        expect(cursorContext).toHaveProperty('editor')
        expect(cursorContext).toHaveProperty('git')
        expect(cursorContext).toHaveProperty('terminal')
        expect(cursorContext).toHaveProperty('extensions')
        expect(cursorContext).toHaveProperty('metadata')

        // Project info should be included
        const project = (cursorContext as any).project
        expect(project?.root).toBe('/home/user/project')

        // Editor state should be translated
        expect((cursorContext as any).editor).toHaveProperty('openFiles')
        expect((cursorContext as any).editor).toHaveProperty('modifiedFiles')
        expect((cursorContext as any).editor.openFiles).toHaveLength(1) // Only open files
        expect((cursorContext as any).editor.modifiedFiles).toEqual(['src/main.ts'])
      })

      test("should detect project type from files", () => {
        // #given - context with package.json (Node.js project)
        const nodeContext = { ...sampleContext }
        nodeContext.files.push({
          path: 'package.json',
          isModified: false,
          isOpen: false,
        })

        // #when
        const cursorContext = ContextTranslator.toCursor(nodeContext)

        // #then - should detect node project type
        expect(cursorContext.project.type).toBe('node')
      })
    })

    describe("fromClaudeCode", () => {
      test("should translate Claude Code format to OpenCode context", () => {
        // #given - Claude Code format context
        const claudeFormat = {
          version: '1.0',
          platform: 'claude-code',
          timestamp: '2025-01-18T12:00:00.000Z',
          session: { id: 'session-123', user: 'test-user' },
          workspace: {
            root: '/project',
            git: sampleContext.git,
          },
          files: [
            { path: 'src/main.ts', cursor: { line: 5, column: 10 }, state: 'open', modified: true },
          ],
          processes: [
            { command: 'npm start', cwd: '/project', status: 'running', env: { PORT: '3000' } },
          ],
          tools: {
            grep: { config: { caseSensitive: false }, state: { enabled: true } },
          },
          metadata: { priority: 'high' },
        }

        // #when
        const opencodeContext = ContextTranslator.fromClaudeCode(claudeFormat)

        // #then - should be converted to OpenCode format
        expect(opencodeContext.platform.platform).toBe('claude-code')
        expect(opencodeContext.files).toHaveLength(1)
        expect(opencodeContext.files[0].path).toBe('src/main.ts')
        expect(opencodeContext.files[0].cursorPosition).toEqual({ line: 5, column: 10 })
        expect(opencodeContext.files[0].isOpen).toBe(true)
        expect(opencodeContext.processes).toHaveLength(1)
        expect(opencodeContext.tools).toHaveLength(1)
        expect(opencodeContext.tools[0].name).toBe('grep')
      })
    })

    describe("fromCursor", () => {
      test("should translate Cursor format to OpenCode context", () => {
        // #given - Cursor format context
        const cursorFormat = {
          version: '1.0',
          platform: 'cursor',
          timestamp: '2025-01-18T12:00:00.000Z',
          session: { id: 'session-456', user: 'cursor-user' },
          project: { root: '/workspace', type: 'typescript' },
          editor: {
            openFiles: [{ path: 'src/app.ts', cursor: { line: 1, column: 1 } }],
            modifiedFiles: ['src/utils.ts'],
          },
          git: sampleContext.git,
          terminal: {
            processes: [{ command: 'tsc --watch', directory: '/workspace', status: 'running' }],
          },
          extensions: [
            { name: 'typescript', config: { strict: true }, state: { version: '5.0' } },
          ],
          metadata: { notes: 'TypeScript project' },
        }

        // #when
        const opencodeContext = ContextTranslator.fromCursor(cursorFormat)

        // #then - should be converted to OpenCode format
        expect(opencodeContext.platform.platform).toBe('cursor')
        expect(opencodeContext.files).toHaveLength(2) // 1 open + 1 modified
        expect(opencodeContext.files[0].path).toBe('src/app.ts')
        expect(opencodeContext.files[0].isOpen).toBe(true)
        expect(opencodeContext.files[1].path).toBe('src/utils.ts')
        expect(opencodeContext.files[1].isModified).toBe(true)
        expect(opencodeContext.processes).toHaveLength(1)
        expect(opencodeContext.tools).toHaveLength(1)
        expect(opencodeContext.tools[0].name).toBe('typescript')
      })
    })
  })

  describe("ContextValidator", () => {
    describe("validate", () => {
      test("should validate correct context", () => {
        // #given - valid context

        // #when
        const result = ContextValidator.validate(sampleContext)

        // #then - should be valid
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

    test("should detect missing platform", () => {
      // #given - context without platform
      const invalidContext = { ...sampleContext } as any
      delete invalidContext.platform

      // #when
      const result = ContextValidator.validate(invalidContext as CrossPlatformContext)

      // #then - should be invalid
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Platform information is required')
    })

    test("should detect invalid file entries", () => {
      // #given - context with invalid file
      const invalidContext = { ...sampleContext } as any
      invalidContext.files[0] = { ...invalidContext.files[0] }
      delete invalidContext.files[0].path

      // #when
      const result = ContextValidator.validate(invalidContext as CrossPlatformContext)

      // #then - should be invalid
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('path is required'))).toBe(true)
    })

    test("should detect missing git branch", () => {
      // #given - context without git branch
      const invalidContext = { ...sampleContext } as any
      delete invalidContext.git.branch

      // #when
      const result = ContextValidator.validate(invalidContext as CrossPlatformContext)

      // #then - should be invalid
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Git branch is required')
    })

    test("should detect missing working directory", () => {
      // #given - context without working directory
      const invalidContext = { ...sampleContext } as any
      delete invalidContext.environment.workingDirectory

      // #when
      const result = ContextValidator.validate(invalidContext as CrossPlatformContext)

      // #then - should be invalid
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Working directory is required')
    })
    })

    describe("sanitize", () => {
      test("should remove sensitive environment variables", () => {
        // #given - context with sensitive environment variables

        // #when
        const sanitized = ContextValidator.sanitize(sampleContext)

        // #then - sensitive variables should be removed
        expect(sanitized.environment.environmentVariables).not.toHaveProperty('SECRET_KEY')
        expect(sanitized.environment.environmentVariables).toHaveProperty('PATH')
        expect(sanitized.environment.environmentVariables).toHaveProperty('HOME')
      })

      test("should sanitize process environments", () => {
        // #given - context with sensitive process environment
        const contextWithSensitiveProcess = { ...sampleContext }
        contextWithSensitiveProcess.processes[0].environment = {
          API_KEY: 'secret-key',
          DEBUG: 'true',
        }

        // #when
        const sanitized = ContextValidator.sanitize(contextWithSensitiveProcess)

        // #then - sensitive process variables should be removed
        expect(sanitized.processes[0].environment).not.toHaveProperty('API_KEY')
        expect(sanitized.processes[0].environment).toHaveProperty('DEBUG')
      })

      test("should preserve non-sensitive data", () => {
        // #given - context with normal data

        // #when
        const sanitized = ContextValidator.sanitize(sampleContext)

        // #then - non-sensitive data should be preserved
        expect(sanitized.platform).toEqual(sampleContext.platform)
        expect(sanitized.files).toEqual(sampleContext.files)
        expect(sanitized.git).toEqual(sampleContext.git)
        expect(sanitized.metadata).toEqual(sampleContext.metadata)
      })
    })
  })

  describe("ContextPersistence", () => {
    describe("save", () => {
      test("should save context to file", async () => {
        // #given - valid context and filename

        // #when
        const filepath = await ContextPersistence.save(sampleContext, 'test-context.json')

        // #then - should save to file
        expect(mockWriteFile).toHaveBeenCalledWith(
          'test-context.json',
          expect.any(String),
          'utf-8'
        )
        expect(filepath).toBe('test-context.json')

        // Verify the content contains expected data
        expect(mockWriteFile).toHaveBeenCalled()
        const call = mockWriteFile.mock.calls[0]
        if (call && call[1]) {
          const savedContent = JSON.parse(call[1] as string)
          expect(savedContent.platform.platform).toBe('opencode')
          expect(savedContent.platform.userId).toBe('test-user')
        }
      })

      test("should create directory if it doesn't exist", async () => {
        // #given - directory doesn't exist (mock will throw)
        mockAccess.mockRejectedValueOnce(new Error('Directory not found'))

        // #when
        await ContextPersistence.save(sampleContext)

        // #then - should create directory
        expect(mockMkdir).toHaveBeenCalledWith('docs/planning/cross-platform', { recursive: true })
      })

    test("should sanitize context before saving", async () => {
      // #given - context with missing optional fields
      const incompleteContext = {
        platform: { platform: 'opencode', version: '1.0.0', timestamp: '2025-01-18T12:00:00.000Z' },
        files: [],
        git: { branch: 'main', status: { staged: [], modified: [], untracked: [], deleted: [] }, recentCommits: [] },
        processes: [],
        tools: [],
        // missing environment and metadata
      } as any

      // #when
      await ContextPersistence.save(incompleteContext, 'incomplete-context.json')

        // #then - should save successfully with sanitized defaults
        expect(mockWriteFile).toHaveBeenCalled()
        const call = mockWriteFile.mock.calls[mockWriteFile.mock.calls.length - 1]
        if (call && call[1]) {
          expect(call[0]).toBe('incomplete-context.json')
          expect(call[1]).toContain('"environment"')
          expect(call[2]).toBe('utf-8')
        }
    })

      test("should sanitize context before saving", async () => {
        // #given - context with sensitive data

        // #when
        await ContextPersistence.save(sampleContext)

        // #then - should save sanitized version
        const savedContent = JSON.parse(mockWriteFile.mock.calls[0][1])
        expect(savedContent.environment.environmentVariables).not.toHaveProperty('SECRET_KEY')
      })
    })

    describe("load", () => {
      test("should load context from file", async () => {
        // #given - valid context file

        // #when
        const loadedContext = await ContextPersistence.load('test-context.json')

        // #then - should load and validate context
        expect(mockReadFile).toHaveBeenCalledWith('test-context.json', 'utf-8')
        expect(loadedContext.platform.platform).toBe('opencode')
      })

    test("should sanitize and validate loaded context", async () => {
      // #given - incomplete context in file (missing required fields)
      mockReadFile.mockResolvedValueOnce(JSON.stringify({
        platform: { platform: 'opencode' } // missing version, timestamp
      }))

      // #when
      const loadedContext = await ContextPersistence.load('incomplete-context.json')

      // #then - should load successfully with sanitized defaults
      expect(loadedContext.platform.platform).toBe('opencode')
      expect(loadedContext.platform.version).toBeDefined()
      expect(loadedContext.platform.timestamp).toBeDefined()
      expect(loadedContext.environment).toBeDefined()
      expect(loadedContext.metadata).toBeDefined()
    })
    })

    describe("saveHandoff", () => {
      test("should save handoff state", async () => {
        // #given - context and handoff reason

        // #when
        const filepath = await ContextPersistence.saveHandoff(sampleContext, 'Switching platforms')

        // #then - should save handoff state
        expect(mockWriteFile).toHaveBeenCalledWith(
          expect.stringContaining('docs/planning/handoffs/'),
          expect.stringContaining('"reason": "Switching platforms"'),
          'utf-8'
        )
        expect(filepath).toContain('docs/planning/handoffs/')
      })
    })

    describe("listHandoffs", () => {
      test("should list available handoffs", async () => {
        // #given - handoff files exist
        mockReadFile.mockImplementation(async (filepath) => {
          if (filepath.includes('handoff-1.json')) {
            return JSON.stringify({
              timestamp: '2025-01-18T10:00:00.000Z',
              reason: 'First handoff',
              context: sampleContext,
            })
          } else if (filepath.includes('handoff-2.json')) {
            return JSON.stringify({
              timestamp: '2025-01-18T11:00:00.000Z',
              reason: 'Second handoff',
              context: sampleContext,
            })
          }
          throw new Error('File not found')
        })

        // #when
        const handoffs = await ContextPersistence.listHandoffs()

        // #then - should return sorted list
        expect(handoffs).toHaveLength(2)
        expect(handoffs[0].reason).toBe('Second handoff') // Most recent first
        expect(handoffs[1].reason).toBe('First handoff')
        expect(handoffs[0].timestamp).toBe('2025-01-18T11:00:00.000Z')
      })

      test("should handle empty directory", async () => {
        // #given - no handoff files
        mockReaddir.mockResolvedValueOnce([])

        // #when
        const handoffs = await ContextPersistence.listHandoffs()

        // #then - should return empty array
        expect(handoffs).toEqual([])
      })

      test("should handle corrupt files gracefully", async () => {
        // #given - one corrupt file
        mockReadFile.mockRejectedValueOnce(new Error('Corrupt file'))

        // #when
        const handoffs = await ContextPersistence.listHandoffs()

        // #then - should skip corrupt files
        expect(handoffs).toHaveLength(1) // Only the valid file
      })
    })
  })
})