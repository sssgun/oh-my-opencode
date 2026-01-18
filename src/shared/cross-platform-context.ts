/**
 * Cross-Platform Context Manager
 *
 * Handles context translation and preservation between different IDE platforms:
 * - OpenCode (primary)
 * - Claude Code
 * - Cursor
 */

export interface PlatformContext {
  platform: 'opencode' | 'claude-code' | 'cursor' | 'unknown';
  version: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

export interface FileContext {
  path: string;
  content?: string;
  cursorPosition?: {
    line: number;
    column: number;
  };
  isModified: boolean;
  isOpen: boolean;
}

export interface GitContext {
  branch: string;
  status: {
    staged: string[];
    modified: string[];
    untracked: string[];
    deleted: string[];
  };
  recentCommits: Array<{
    hash: string;
    message: string;
    timestamp: string;
  }>;
}

export interface ProcessContext {
  pid?: number;
  command: string;
  workingDirectory: string;
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  environment: Record<string, string>;
}

export interface ToolContext {
  name: string;
  state: Record<string, unknown>;
  configuration: Record<string, unknown>;
}

export interface CrossPlatformContext {
  platform: PlatformContext;
  files: FileContext[];
  git: GitContext;
  processes: ProcessContext[];
  tools: ToolContext[];
  environment: {
    nodeVersion?: string;
    npmVersion?: string;
    os: string;
    shell: string;
    workingDirectory: string;
    environmentVariables: Record<string, string>;
  };
  metadata: {
    handoffReason?: string;
    priority?: 'low' | 'normal' | 'high' | 'critical';
    tags?: string[];
    notes?: string;
  };
}

/**
 * Platform-specific context translators
 */
export class ContextTranslator {
  /**
   * Translate OpenCode context to Claude Code format
   */
  static toClaudeCode(context: CrossPlatformContext): Record<string, unknown> {
    return {
      version: '1.0',
      platform: 'claude-code',
      timestamp: context.platform.timestamp,
      session: {
        id: context.platform.sessionId,
        user: context.platform.userId,
      },
      workspace: {
        root: context.environment.workingDirectory,
        git: context.git,
      },
      files: context.files.map(file => ({
        path: file.path,
        content: file.content,
        cursor: file.cursorPosition,
        state: file.isOpen ? 'open' : 'closed',
        modified: file.isModified,
      })),
      processes: context.processes.map(proc => ({
        command: proc.command,
        cwd: proc.workingDirectory,
        status: proc.status,
        env: proc.environment,
      })),
      tools: context.tools.reduce((acc, tool) => {
        acc[tool.name] = {
          config: tool.configuration,
          state: tool.state,
        };
        return acc;
      }, {} as Record<string, unknown>),
      metadata: context.metadata,
    };
  }

  /**
   * Translate OpenCode context to Cursor format
   */
  static toCursor(context: CrossPlatformContext): Record<string, unknown> {
    return {
      version: '1.0',
      platform: 'cursor',
      timestamp: context.platform.timestamp,
      session: {
        id: context.platform.sessionId,
        user: context.platform.userId,
      },
      project: {
        root: context.environment.workingDirectory,
        type: this.detectProjectType(context),
      },
      editor: {
        openFiles: context.files.filter(f => f.isOpen).map(f => ({
          path: f.path,
          cursor: f.cursorPosition,
          content: f.content,
        })),
        modifiedFiles: context.files.filter(f => f.isModified).map(f => f.path),
      },
      git: context.git,
      terminal: {
        processes: context.processes.map(proc => ({
          command: proc.command,
          directory: proc.workingDirectory,
          status: proc.status,
        })),
      },
      extensions: context.tools.map(tool => ({
        name: tool.name,
        config: tool.configuration,
        state: tool.state,
      })),
      metadata: context.metadata,
    };
  }

  /**
   * Detect project type from context
   */
  private static detectProjectType(context: CrossPlatformContext): string {
    const root = context.environment.workingDirectory;

    // Check for common project markers
    if (context.files.some(f => f.path.includes('package.json'))) {
      return 'node';
    }
    if (context.files.some(f => f.path.includes('requirements.txt') || f.path.includes('pyproject.toml'))) {
      return 'python';
    }
    if (context.files.some(f => f.path.includes('Cargo.toml'))) {
      return 'rust';
    }
    if (context.files.some(f => f.path.includes('go.mod'))) {
      return 'go';
    }

    return 'unknown';
  }

  /**
   * Translate from Claude Code format to OpenCode
   */
  static fromClaudeCode(claudeContext: Record<string, unknown>): CrossPlatformContext {
    const context = claudeContext as any;

    return {
      platform: {
        platform: 'claude-code',
        version: context.version || '1.0',
        timestamp: context.timestamp || new Date().toISOString(),
        userId: context.session?.user,
        sessionId: context.session?.id,
      },
      files: (context.files || []).map((file: any) => ({
        path: file.path,
        content: file.content,
        cursorPosition: file.cursor,
        isModified: file.modified || false,
        isOpen: file.state === 'open',
      })),
      git: context.workspace?.git || {
        branch: 'main',
        status: { staged: [], modified: [], untracked: [], deleted: [] },
        recentCommits: [],
      },
      processes: (context.processes || []).map((proc: any) => ({
        command: proc.command,
        workingDirectory: proc.cwd,
        status: proc.status || 'unknown',
        startTime: new Date().toISOString(),
        environment: proc.env || {},
      })),
      tools: Object.entries(context.tools || {}).map(([name, tool]: [string, any]) => ({
        name,
        configuration: tool.config || {},
        state: tool.state || {},
      })),
      environment: {
        nodeVersion: undefined,
        npmVersion: undefined,
        os: process.platform,
        shell: process.env.SHELL || 'bash',
        workingDirectory: context.workspace?.root || process.cwd(),
        environmentVariables: process.env as Record<string, string>,
      },
      metadata: context.metadata || {},
    };
  }

  /**
   * Translate from Cursor format to OpenCode
   */
  static fromCursor(cursorContext: Record<string, unknown>): CrossPlatformContext {
    const context = cursorContext as any;

    return {
      platform: {
        platform: 'cursor',
        version: context.version || '1.0',
        timestamp: context.timestamp || new Date().toISOString(),
        userId: context.session?.user,
        sessionId: context.session?.id,
      },
      files: [
        ...(context.editor?.openFiles || []).map((file: any) => ({
          path: file.path,
          content: file.content,
          cursorPosition: file.cursor,
          isModified: false,
          isOpen: true,
        })),
        ...(context.editor?.modifiedFiles || []).map((path: string) => ({
          path,
          isModified: true,
          isOpen: false,
        })),
      ],
      git: context.git || {
        branch: 'main',
        status: { staged: [], modified: [], untracked: [], deleted: [] },
        recentCommits: [],
      },
      processes: (context.terminal?.processes || []).map((proc: any) => ({
        command: proc.command,
        workingDirectory: proc.directory,
        status: proc.status || 'unknown',
        startTime: new Date().toISOString(),
        environment: {},
      })),
      tools: (context.extensions || []).map((ext: any) => ({
        name: ext.name,
        configuration: ext.config || {},
        state: ext.state || {},
      })),
      environment: {
        nodeVersion: undefined,
        npmVersion: undefined,
        os: process.platform,
        shell: process.env.SHELL || 'bash',
        workingDirectory: context.project?.root || process.cwd(),
        environmentVariables: process.env as Record<string, string>,
      },
      metadata: context.metadata || {},
    };
  }
}

/**
 * Context validation utilities
 */
export class ContextValidator {
  /**
   * Validate context integrity
   */
  static validate(context: CrossPlatformContext): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required platform object
    if (!context.platform) {
      errors.push('Platform information is required');
      return { valid: false, errors };
    }

    // Required platform fields
    if (!context.platform.platform) {
      errors.push('Platform type is required');
    }
    if (!context.platform.timestamp) {
      errors.push('Platform timestamp is required');
    }

    // Validate file contexts
    context.files.forEach((file, index) => {
      if (!file.path) {
        errors.push(`File ${index}: path is required`);
      }
    });

    // Validate git context
    if (!context.git.branch) {
      errors.push('Git branch is required');
    }

    // Validate environment
    if (!context.environment.workingDirectory) {
      errors.push('Working directory is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitize context for security
   */
  static sanitize(context: CrossPlatformContext): CrossPlatformContext {
    const sanitized = { ...context };

    // Ensure required platform object exists and has required fields
    if (!sanitized.platform) {
      sanitized.platform = {
        platform: 'unknown',
        version: '0.0.0',
        timestamp: new Date().toISOString(),
      };
    } else {
      // Ensure required platform fields exist
      if (!sanitized.platform.platform) {
        sanitized.platform.platform = 'unknown';
      }
      if (!sanitized.platform.version) {
        sanitized.platform.version = '0.0.0';
      }
      if (!sanitized.platform.timestamp) {
        sanitized.platform.timestamp = new Date().toISOString();
      }
    }

    // Ensure required objects exist
    if (!sanitized.environment) {
      sanitized.environment = {
        os: 'unknown',
        shell: 'bash',
        workingDirectory: '/tmp',
        environmentVariables: {},
      };
    }

    // Ensure other required arrays/objects exist
    sanitized.files = sanitized.files || [];
    sanitized.git = sanitized.git || {
      branch: 'main',
      status: { staged: [], modified: [], untracked: [], deleted: [] },
      recentCommits: [],
    };
    sanitized.processes = sanitized.processes || [];
    sanitized.tools = sanitized.tools || [];
    sanitized.metadata = sanitized.metadata || {};

    // Remove sensitive environment variables
    const sensitiveKeys = ['password', 'secret', 'key', 'token', 'auth'];
    sanitized.environment.environmentVariables = Object.fromEntries(
      Object.entries(sanitized.environment.environmentVariables || {})
        .filter(([key]) =>
          !sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))
        )
    );

    // Sanitize process environments
    sanitized.processes = sanitized.processes.map(proc => ({
      ...proc,
      environment: Object.fromEntries(
        Object.entries(proc.environment || {})
          .filter(([key]) =>
            !sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))
          )
      ),
    }));

    return sanitized;
  }
}

/**
 * Context persistence utilities
 */
export class ContextPersistence {
  private static readonly CONTEXT_DIR = 'docs/planning/cross-platform';
  private static readonly HANDOFF_DIR = 'docs/planning/handoffs';

  /**
   * Save context to file
   */
  static async save(context: CrossPlatformContext, filename?: string): Promise<string> {
    // Sanitize context first to ensure required fields exist
    const sanitized = ContextValidator.sanitize(context);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultFilename = `${sanitized.platform.platform}-context-${timestamp}.json`;
    const filepath = filename || `${this.CONTEXT_DIR}/${defaultFilename}`;

    // Ensure directory exists
    await this.ensureDirectory(this.CONTEXT_DIR);

    // Validate sanitized context
    const validation = ContextValidator.validate(sanitized);

    if (!validation.valid) {
      throw new Error(`Context validation failed: ${validation.errors.join(', ')}`);
    }

    // Write to file
    const fs = await import('fs/promises');
    await fs.writeFile(filepath, JSON.stringify(sanitized, null, 2), 'utf-8');

    return filepath;
  }

  /**
   * Load context from file
   */
  static async load(filepath: string): Promise<CrossPlatformContext> {
    const fs = await import('fs/promises');
    const content = await fs.readFile(filepath, 'utf-8');
    const rawContext = JSON.parse(content) as Partial<CrossPlatformContext>;

    // Sanitize loaded context to ensure required fields exist
    const context = ContextValidator.sanitize(rawContext as CrossPlatformContext);

    // Validate sanitized context
    const validation = ContextValidator.validate(context);
    if (!validation.valid) {
      throw new Error(`Loaded context validation failed: ${validation.errors.join(', ')}`);
    }

    return context;
  }

  /**
   * Save handoff state
   */
  static async saveHandoff(context: CrossPlatformContext, reason: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}.json`;
    const filepath = `${this.HANDOFF_DIR}/${filename}`;

    await this.ensureDirectory(this.HANDOFF_DIR);

    const handoffState = {
      timestamp,
      reason,
      context,
    };

    const fs = await import('fs/promises');
    await fs.writeFile(filepath, JSON.stringify(handoffState, null, 2), 'utf-8');

    return filepath;
  }

  /**
   * List available handoffs
   */
  static async listHandoffs(): Promise<Array<{ filename: string; timestamp: string; reason: string }>> {
    try {
      const fs = await import('fs/promises');
      const files = await fs.readdir(this.HANDOFF_DIR);

      const handoffs = await Promise.all(
        files
          .filter(f => f.endsWith('.json'))
          .map(async (filename) => {
            try {
              const content = await fs.readFile(`${this.HANDOFF_DIR}/${filename}`, 'utf-8');
              const handoff = JSON.parse(content);
              return {
                filename,
                timestamp: handoff.timestamp || new Date().toISOString(),
                reason: handoff.reason || 'Unknown reason',
              };
            } catch {
              return null;
            }
          })
      );

      return handoffs
        .filter((item): item is { filename: string; timestamp: string; reason: string } => item !== null)
        .sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    } catch {
      return [];
    }
  }

  private static async ensureDirectory(dir: string): Promise<void> {
    const fs = await import('fs/promises');
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
}