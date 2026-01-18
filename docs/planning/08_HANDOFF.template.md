# 08_HANDOFF.md - Cross-Platform Handoff Instructions

## Current Work Interruption Point

### 📍 Exact Interruption Point: **{WORK_STATUS}**

**Interruption Time**: {HANDOFF_TIMESTAMP}
**Work State**: {WORK_STATE}
**Platform**: {CURRENT_PLATFORM}

---

## Files Being Modified and Changes

### ✅ Completed File Changes (Ready for Commit)

{CHANGED_FILES_LIST}

---

## Cross-Platform Context Preservation

### Platform Transition Readiness
**Source Platform**: {SOURCE_PLATFORM}
**Target Platforms**: {TARGET_PLATFORMS}
**Context Compatibility**: {CONTEXT_COMPATIBILITY}

### Preserved Context Files
- `docs/planning/cross-platform/opencode-context.json`
- `docs/planning/cross-platform/claude-code-context.json`
- `docs/planning/cross-platform/cursor-context.json`
- `docs/planning/handoffs/{TIMESTAMP}.json`

### Context Restoration Instructions

#### For Claude Code
1. Open planning documents in `docs/planning/`
2. Load context from `claude-code-context.json`
3. Execute `agent-handoff-executor` agent
4. Resume work from next planned items

#### For Cursor
1. Import planning files from `docs/planning/`
2. Load cursor-specific context
3. Run handoff executor agent
4. Continue from interruption point

#### For OpenCode
1. Context automatically available
2. Use `agent-handoff-executor` for resumption
3. All files and state preserved

---

## Next Agent Can Immediately Take Over Specific Instructions

### 🚀 Immediately Executable Tasks (Within 30 minutes)

#### 1. Context Validation
```bash
# Validate planning documents
cat docs/planning/00_CONTEXT.md
cat docs/planning/08_HANDOFF.md

# Check cross-platform context
ls docs/planning/cross-platform/
```

#### 2. Work Resumption
```bash
# Execute handoff executor agent
agent-handoff-executor
```

#### 3. State Verification
```bash
# Verify environment state
git status
# Check for active processes
ps aux | grep {PROJECT_NAME}
```

---

## Test/Validation Methods

### Automated Verification

#### Context Integrity Test
```bash
# Validate context files
bun run validate-context

# Test cross-platform compatibility
bun test cross-platform
```

#### Build Verification
```bash
# Type check
bun run typecheck

# Build validation
bun run build

# Test execution
bun test
```

### Manual Verification

#### Context Restoration Test
```bash
# Test context loading on target platform
load_context docs/planning/cross-platform/{platform}-context.json

# Verify state restoration
check_restored_state
```

---

## Important Notes and Prohibitions

### ⚠️ Mandatory Compliance

#### Technical Constraints
1. **Context Integrity**: Never modify context files manually
2. **Platform Compatibility**: Test on target platform before committing
3. **State Consistency**: Ensure atomic state transitions

#### Safety Rules
1. **Backup First**: Always backup before platform transitions
2. **Validation Required**: Never skip context validation
3. **Rollback Ready**: Maintain rollback capability

### 🚫 Prohibited Actions

1. **Manual Context Editing**: Never edit context files directly
2. **Cross-Platform Assumptions**: Don't assume compatibility without testing
3. **State Corruption**: Never interrupt during context preservation

### 🎯 Quality Gates

#### Pre-Handoff Checklist
- [ ] Context files generated successfully
- [ ] Planning documents complete
- [ ] Cross-platform compatibility verified
- [ ] Work state properly captured

#### Post-Handoff Checklist
- [ ] Context successfully restored
- [ ] Work can resume seamlessly
- [ ] No state corruption detected
- [ ] All processes functional

---

## Related File Paths and Function Names

### Core Implementation Files

#### Agent Handoff Planner
```
src/agents/agent-handoff-planner.ts
├── AGENT_HANDOFF_PLANNER_PROMPT_METADATA
└── createAgentHandoffPlannerAgent()
```

#### Agent Handoff Executor
```
src/agents/agent-handoff-executor.ts
├── AGENT_HANDOFF_EXECUTOR_PROMPT_METADATA
└── createAgentHandoffExecutorAgent()
```

#### Cross-Platform Context
```
src/shared/cross-platform-context.ts
├── CrossPlatformContext
└── ContextTranslation utilities
```

### Context Files
```
docs/planning/cross-platform/
├── opencode-context.json
├── claude-code-context.json
└── cursor-context.json

docs/planning/handoffs/
└── {TIMESTAMP}.json
```

---

## Emergency Contact and Support

### Problem Occurrence
1. **Immediate**: Validate context integrity
2. **Analysis**: Check platform compatibility
3. **Recovery**: Use backup context files

### Support Resources
- **Documentation**: All planning documents
- **Context Files**: Cross-platform context preservation
- **Recovery**: Automatic rollback capability

---

## Final State Summary

### ✅ Ready State
- **Context Quality**: Complete cross-platform preservation
- **Documentation**: Comprehensive handoff instructions
- **Compatibility**: Verified across all platforms
- **Safety**: Automatic backup and recovery

### 🎯 Next Agent Success Criteria
1. **Immediate Resumption**: Context loading within 5 minutes
2. **Seamless Transition**: No work interruption perceived
3. **Full Compatibility**: All features work on target platform

---

**Handoff Completion Time**: {HANDOFF_TIMESTAMP}
**Readiness Status**: ✅ **Ready for Cross-Platform Transition**