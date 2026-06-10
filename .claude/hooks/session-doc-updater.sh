#!/bin/bash
set -e

# Read stdin FIRST before sourcing bashrc (bashrc can consume stdin)
INPUT=$(cat)

# Skip if disabled
if [ "$SESSION_DOCS_ENABLED" = "false" ]; then
    exit 0
fi

# Skip silently if not running under Claude Code
if [ -z "$CLAUDE_PROJECT_DIR" ]; then
    exit 0
fi

# Source bashrc to ensure GEMINI_API_KEY is available
if [ -f ~/.bashrc ]; then
    source ~/.bashrc </dev/null 2>/dev/null || true
fi

# Source .env for API keys (reliable path for macOS/zsh users)
if [ -f "$CLAUDE_PROJECT_DIR/.claude/hooks/.env" ]; then
    set -a
    source "$CLAUDE_PROJECT_DIR/.claude/hooks/.env" 2>/dev/null || true
    set +a
fi

# Fail safe if dependencies are missing
if ! command -v npx >/dev/null 2>&1 || [ ! -d "$CLAUDE_PROJECT_DIR/.claude/hooks/node_modules" ]; then
    echo "claude hooks: dependencies not installed - run: cd .claude/hooks && npm install" >&2
    exit 0
fi

cd "$CLAUDE_PROJECT_DIR/.claude/hooks"
echo "$INPUT" | npx tsx session-doc-updater.ts
