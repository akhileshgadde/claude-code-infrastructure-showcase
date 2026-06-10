/**
 * Shared JSON extraction from LLM responses.
 * Handles both markdown code blocks and direct JSON.
 */

/**
 * Extract JSON from an LLM response string.
 * Tries markdown code block first, then direct JSON match.
 * Returns null if no valid JSON found.
 */
export function parseLLMJson(text: string): any | null {
    if (!text) return null;

    try {
        // Try markdown code block first: ```json ... ```
        const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
            return JSON.parse(codeBlockMatch[1]);
        }

        // Try direct JSON object match
        const directMatch = text.match(/\{[\s\S]*\}/);
        if (directMatch) {
            return JSON.parse(directMatch[0]);
        }
    } catch {
        // JSON parse failed
    }

    return null;
}
