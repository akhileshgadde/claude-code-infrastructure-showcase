#!/bin/bash
set -e

# Read stdin first (before any sourcing that might consume it)
INPUT=$(cat)

# Source bashrc to pick up API keys
if [ -f ~/.bashrc ]; then
    source ~/.bashrc </dev/null 2>/dev/null || true
fi

cd "$CLAUDE_PROJECT_DIR/.claude/hooks"
echo "$INPUT" | npx tsx skill-verification-guard.ts
