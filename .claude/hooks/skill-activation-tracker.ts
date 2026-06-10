#!/usr/bin/env node
/**
 * PostToolUse Hook - Skill Activation Tracker
 *
 * Fires when the Skill tool is used. Clears the activated skill from
 * mandatory_pending and pretooluse_pending in session state, preventing
 * unnecessary blocking after a skill has been activated.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface SessionState {
    skills_used: string[];
    mandatory_pending: string[];
    last_updated: string;
    files_verified?: string[];
    ai_suggested_skills?: string[];
    files_analyzed_by_ai?: string[];
    pretooluse_pending?: string[];
}

interface HookInput {
    session_id: string;
    tool_name: string;
    tool_input: {
        skill?: string;
    };
    tool_result?: string;
}

function main() {
    try {
        const input = readFileSync(0, 'utf-8');
        const data: HookInput = JSON.parse(input);

        // Only handle Skill tool
        if (data.tool_name !== 'Skill') {
            process.exit(0);
        }

        const skillName = data.tool_input.skill;
        if (!skillName) {
            process.exit(0);
        }

        // Load session state
        const projectDir = process.env.CLAUDE_PROJECT_DIR || '.';
        const sessionFile = join(projectDir, '.claude', 'hooks', 'state',
                                `skills-used-${data.session_id}.json`);

        if (!existsSync(sessionFile)) {
            process.exit(0);
        }

        const state: SessionState = JSON.parse(readFileSync(sessionFile, 'utf-8'));
        let stateModified = false;

        // Remove skill from mandatory_pending
        if (state.mandatory_pending && state.mandatory_pending.length > 0) {
            const before = state.mandatory_pending.length;
            state.mandatory_pending = state.mandatory_pending.filter(s => s !== skillName);

            if (state.mandatory_pending.length < before) {
                stateModified = true;
                if (process.env.DEBUG_SKILLS === '1') {
                    console.error(`[Skill Tracker] Removed "${skillName}" from mandatory_pending`);
                    console.error(`[Skill Tracker] Remaining mandatory: ${state.mandatory_pending.length > 0 ? state.mandatory_pending.join(', ') : '(none)'}`);
                }
            }
        }

        // Remove from pretooluse_pending
        if (state.pretooluse_pending && state.pretooluse_pending.length > 0) {
            const before = state.pretooluse_pending.length;
            state.pretooluse_pending = state.pretooluse_pending.filter(s => s !== skillName);

            if (state.pretooluse_pending.length < before) {
                stateModified = true;
                if (process.env.DEBUG_SKILLS === '1') {
                    console.error(`[Skill Tracker] Removed "${skillName}" from pretooluse_pending`);
                }
            }
        }

        // Save if modified
        if (stateModified) {
            state.last_updated = new Date().toISOString();
            writeFileSync(sessionFile, JSON.stringify(state, null, 2));
        }

        process.exit(0);
    } catch (err) {
        if (process.env.DEBUG_SKILLS === '1') {
            console.error('[Skill Tracker] Error:', err);
        }
        process.exit(0);
    }
}

main();
