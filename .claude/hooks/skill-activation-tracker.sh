#!/bin/bash
cd "$CLAUDE_PROJECT_DIR/.claude/hooks" && cat | npx tsx skill-activation-tracker.ts
