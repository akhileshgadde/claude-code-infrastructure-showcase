#!/bin/bash
set -e

# Read stdin first (before any sourcing that might consume it)
INPUT=$(cat)

# Skip silently if not running under Claude Code
if [ -z "$CLAUDE_PROJECT_DIR" ]; then
    exit 0
fi

# Source bashrc to pick up API keys
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
echo "$INPUT" | npx tsx skill-verification-guard.ts
