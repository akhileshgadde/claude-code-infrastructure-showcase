#!/bin/bash
set -e

# Read stdin FIRST before sourcing bashrc (bashrc can consume stdin)
INPUT=$(cat)

# Skip if disabled
if [ "$SESSION_DOCS_ENABLED" = "false" ]; then
    exit 0
fi

# Source bashrc to ensure GEMINI_API_KEY is available
if [ -f ~/.bashrc ]; then
    source ~/.bashrc </dev/null 2>/dev/null || true
fi

cd "$CLAUDE_PROJECT_DIR/.claude/hooks"
echo "$INPUT" | npx tsx session-doc-updater.ts
