# Hooks Configuration Guide

This guide explains how to configure and customize the hooks system for your project.

## Quick Start Configuration

### 1. Register Hooks in .claude/settings.json

Create or update `.claude/settings.json` in your project root:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/skill-activation-prompt.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|MultiEdit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/post-tool-use-tracker.sh"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Edit|MultiEdit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/skill-verification-guard.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Skill",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/skill-activation-tracker.sh"
          }
        ]
      }
    ]
  }
}
```

### 2. Install Dependencies

```bash
cd .claude/hooks
npm install
```

### 3. Set Execute Permissions

```bash
chmod +x .claude/hooks/*.sh
```

## Customization Options

### Project Structure Detection

By default, hooks detect these directory patterns:

**Frontend:** `frontend/`, `client/`, `web/`, `app/`, `ui/`
**Backend:** `backend/`, `server/`, `api/`, `src/`, `services/`
**Database:** `database/`, `prisma/`, `migrations/`
**Monorepo:** `packages/*`, `examples/*`

#### Adding Custom Directory Patterns

Edit `.claude/hooks/post-tool-use-tracker.sh`, function `detect_repo()`:

```bash
case "$repo" in
    # Add your custom directories here
    my-custom-service)
        echo "$repo"
        ;;
    admin-panel)
        echo "$repo"
        ;;
    # ... existing patterns
esac
```

### Build Command Detection

The hooks auto-detect build commands based on:
1. Presence of `package.json` with "build" script
2. Package manager (pnpm > npm > yarn)
3. Special cases (Prisma schemas)

#### Customizing Build Commands

Edit `.claude/hooks/post-tool-use-tracker.sh`, function `get_build_command()`:

```bash
# Add custom build logic
if [[ "$repo" == "my-service" ]]; then
    echo "cd $repo_path && make build"
    return
fi
```

### TypeScript Configuration

Hooks automatically detect:
- `tsconfig.json` for standard TypeScript projects
- `tsconfig.app.json` for Vite/React projects

#### Custom TypeScript Configs

Edit `.claude/hooks/post-tool-use-tracker.sh`, function `get_tsc_command()`:

```bash
if [[ "$repo" == "my-service" ]]; then
    echo "cd $repo_path && npx tsc --project tsconfig.build.json --noEmit"
    return
fi
```

### Error Handling Reminders

Configure file category detection in `.claude/hooks/error-handling-reminder.ts`:

```typescript
function getFileCategory(filePath: string): 'backend' | 'frontend' | 'database' | 'other' {
    // Add custom patterns
    if (filePath.includes('/my-custom-dir/')) return 'backend';
    // ... existing patterns
}
```

### Error Threshold Configuration

Change when to recommend the auto-error-resolver agent.

Edit `.claude/hooks/stop-build-check-enhanced.sh`:

```bash
# Default is 5 errors - change to your preference
if [[ $total_errors -ge 10 ]]; then  # Now requires 10+ errors
    # Recommend agent
fi
```

## AI Provider Configuration (v2.0)

### Activation Modes

Set in `.claude/skills/skill-rules.json`:

```json
{
    "settings": {
        "skill_activation_mode": "disabled",
        "conservativeness": "balanced"
    }
}
```

| Mode | Behavior |
|------|----------|
| `disabled` | Regex-only (default, v1.0 behavior) |
| `fallback` | AI first, regex on failure |
| `ai-only` | Pure AI, no fallback |

### Provider Selection

Auto-detected from environment, or force with `SKILL_AI_PROVIDER`:

```bash
export SKILL_AI_PROVIDER=gemini  # gemini|openai|anthropic|ollama
```

### Conservativeness

Controls suggestion aggressiveness in AI mode:

```bash
export SKILL_CONSERVATIVENESS=balanced  # strict|balanced|aggressive
```

### PreToolUse Guard

The `skill-verification-guard` hook analyzes code being edited:

```bash
# Soft-block: block first edit with suggestions, allow second
export PRETOOLUSE_SOFT_BLOCK=false

# Skip mandatory skill enforcement
export SKIP_MANDATORY_SKILLS=false

# Skip AI analysis in PreToolUse
export SKIP_PRETOOLUSE_AI=false

# Detailed debug logging
export SKILL_GUARD_DEBUG=false
```

### Debug Mode

```bash
export DEBUG_SKILLS=1  # Show AI classification details in stderr
```

## Environment Variables

### AI Provider Variables

```bash
# Force specific provider
SKILL_AI_PROVIDER=gemini|openai|anthropic|ollama

# Provider API keys (auto-detection uses these)
GEMINI_API_KEY=your-key
OPENAI_API_KEY=your-key
ANTHROPIC_API_KEY=your-key

# OpenAI/Azure customization
OPENAI_BASE_URL=https://your-endpoint.openai.azure.com
OPENAI_MODEL=gpt-4o-mini

# Ollama customization
OLLAMA_MODEL=llama3.2
OLLAMA_BASE_URL=http://localhost:11434
```

### Global Environment Variables

Set in your shell profile (`.bashrc`, `.zshrc`, etc.):

```bash
# Disable error handling reminders
export SKIP_ERROR_REMINDER=1

# Custom project directory (if not using default)
export CLAUDE_PROJECT_DIR=/path/to/your/project
```

### Per-Session Environment Variables

Set before starting Claude Code:

```bash
SKIP_ERROR_REMINDER=1 claude-code
```

## Hook Execution Order

Stop hooks run in the order specified in `settings.json`:

```json
"Stop": [
  {
    "hooks": [
      { "command": "...formatter.sh" },    // Runs FIRST
      { "command": "...build-check.sh" },  // Runs SECOND
      { "command": "...reminder.sh" }      // Runs THIRD
    ]
  }
]
```

**Why this order matters:**
1. Format files first (clean code)
2. Then check for errors
3. Finally show reminders

## Selective Hook Enabling

You don't need all hooks. Choose what works for your project:

### Minimal Setup (Skill Activation Only)

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/skill-activation-prompt.sh"
          }
        ]
      }
    ]
  }
}
```

### Build Checking Only (No Formatting)

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|MultiEdit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/post-tool-use-tracker.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/stop-build-check-enhanced.sh"
          }
        ]
      }
    ]
  }
}
```

> Note: A Prettier formatting Stop hook is not included in this showcase. If you have your own formatter hook, register it as a Stop hook using the same pattern as the build-check example above.

## Cache Management

### Cache Location

```
$CLAUDE_PROJECT_DIR/.claude/tsc-cache/[session_id]/
```

### Manual Cache Cleanup

```bash
# Remove all cached data
rm -rf $CLAUDE_PROJECT_DIR/.claude/tsc-cache/*

# Remove specific session
rm -rf $CLAUDE_PROJECT_DIR/.claude/tsc-cache/[session-id]
```

### Automatic Cleanup

The build-check hook automatically cleans up session cache on successful builds.

## Troubleshooting Configuration

### Hook Not Executing

1. **Check registration:** Verify hook is in `.claude/settings.json`
2. **Check permissions:** Run `chmod +x .claude/hooks/*.sh`
3. **Check path:** Ensure `$CLAUDE_PROJECT_DIR` is set correctly
4. **Check TypeScript:** Run `cd .claude/hooks && npx tsc` to check for errors

### False Positive Detections

**Issue:** Hook triggers for files it shouldn't

**Solution:** Add skip conditions in the relevant hook:

```bash
# In post-tool-use-tracker.sh
if [[ "$file_path" =~ /generated/ ]]; then
    exit 0  # Skip generated files
fi
```

### Performance Issues

**Issue:** Hooks are slow

**Solutions:**
1. Limit TypeScript checks to changed files only
2. Use faster package managers (pnpm > npm)
3. Add more skip conditions

### Debugging Hooks

Add debug output to any hook:

```bash
# At the top of the hook script
set -x  # Enable debug mode

# Or add specific debug lines
echo "DEBUG: file_path=$file_path" >&2
echo "DEBUG: repo=$repo" >&2
```

View hook execution in Claude Code's logs.

## Advanced Configuration

### Custom Hook Event Handlers

You can create your own hooks for other events:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/my-custom-bash-guard.sh"
          }
        ]
      }
    ]
  }
}
```

### Monorepo Configuration

For monorepos with multiple packages:

```bash
# In post-tool-use-tracker.sh, detect_repo()
case "$repo" in
    packages)
        # Get the package name
        local package=$(echo "$relative_path" | cut -d'/' -f2)
        if [[ -n "$package" ]]; then
            echo "packages/$package"
        else
            echo "$repo"
        fi
        ;;
esac
```

### Docker/Container Projects

If your build commands need to run in containers:

```bash
# In post-tool-use-tracker.sh, get_build_command()
if [[ "$repo" == "api" ]]; then
    echo "docker-compose exec api npm run build"
    return
fi
```

## Best Practices

1. **Start minimal** - Enable hooks one at a time
2. **Test thoroughly** - Make changes and verify hooks work
3. **Document customizations** - Add comments to explain custom logic
4. **Version control** - Commit `.claude/` directory to git
5. **Team consistency** - Share configuration across team

## See Also

- [README.md](./README.md) - Hooks overview
- [../../README.md](../../README.md) - Project overview and quick start
