/// <reference types="chrome" />
import { RedirectRule, StorageData } from '../types';

const ALL_RESOURCE_TYPES = [
    'main_frame',
    'sub_frame',
    'stylesheet',
    'script',
    'image',
    'font',
    'object',
    'xmlhttprequest',
    'ping',
    'media',
    'websocket',
    'other',
] as chrome.declarativeNetRequest.ResourceType[];

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Checks if the destination URL contains the source pattern as a substring.
 * e.g., source = "http://hello/" and dest = "http://hello.google.com/"
 * "http://hello" is a prefix of "http://hello.google.com"
 */
function isSubstringOverlap(source: string, dest: string): boolean {
    const normalizedSource = source.replace(/\/+$/, '');
    const normalizedDest = dest.replace(/\/+$/, '');
    return normalizedDest.includes(normalizedSource);
}

/**
 * Checks if the destination URL itself matches the source regex pattern.
 * If so, the redirect would fire again on the destination — a recursive loop.
 */
function destinationMatchesRegex(sourceRegex: string, dest: string): boolean {
    try {
        return new RegExp(sourceRegex).test(dest);
    } catch {
        return false;
    }
}

/**
 * Wraps a regex pattern to exclude a specific destination URL using a negative lookahead.
 * e.g., pattern="http://abc/*" dest="http://abc.g.b.com/"
 * → "(?!http:\/\/abc\.g\.b\.com\/)http://abc/*"
 * This prevents the rule from firing when the URL is already the destination.
 */
function buildRegexWithExclusion(sourceRegex: string, dest: string): string {
    return '(?!' + escapeRegex(dest) + ')' + sourceRegex;
}

/**
 * When a regex source ends with a path wildcard (e.g. /*, /.*)
 * and the destination has no explicit back-references, automatically
 * rewrite into a capture-group form so the URL path is preserved.
 *
 * Example:
 *   source="http://abc/*"  dest="http://abc.g.b.com/"
 *   → regexFilter="http://abc/(.*)"
 *   → regexSubstitution="http://abc.g.b.com/\1"
 *   Result: http://abc/b/c/d → http://abc.g.b.com/b/c/d
 */
function autoAddPathCapture(
    sourceRegex: string,
    dest: string,
): { regexFilter: string; regexSubstitution: string } | null {
    // Respect explicit user back-references (\0-\9)
    if (/\\[0-9]/.test(dest)) return null;

    // Match trailing path wildcards: /* /+ /.* /.+ /(.*) /(.+)
    const m = sourceRegex.match(/^([\s\S]*?)(\/?\*\+?|\/(\.[*+]|\(\.[*+]\)))$/);
    if (!m) return null;

    const base = m[1]; // prefix before the wildcard
    const destBase = dest.endsWith('/') ? dest : dest + '/';

    return {
        regexFilter: base + '/(.*)',
        regexSubstitution: destBase + '\\1',
    };
}

/**
 * Detect graph-based redirect cycles (A→B→C→A).
 */
function detectCycles(rules: RedirectRule[]): Set<string> {
    const graph = new Map<string, string>();
    const cycledIds = new Set<string>();

    for (const rule of rules) {
        if (!rule.enabled) continue;
        graph.set(rule.sourceUrl, rule.destinationUrl);
    }

    for (const rule of rules) {
        if (!rule.enabled) continue;
        const visited = new Set<string>();
        let current: string | undefined = rule.sourceUrl;

        while (current && !visited.has(current)) {
            visited.add(current);
            current = graph.get(current);
        }

        if (current && visited.has(current)) {
            // Found a cycle — mark all rules involved
            for (const r of rules) {
                if (visited.has(r.sourceUrl)) {
                    cycledIds.add(r.id);
                }
            }
        }
    }

    return cycledIds;
}

/**
 * Convert user rules to declarativeNetRequest dynamic rules.
 */
function convertRulesToDNR(rules: RedirectRule[]): chrome.declarativeNetRequest.Rule[] {
    const dnrRules: chrome.declarativeNetRequest.Rule[] = [];
    const cycledIds = detectCycles(rules);

    for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        if (!rule.enabled || cycledIds.has(rule.id)) continue;

        const ruleId = i + 1; // DNR IDs must be >= 1

        if (rule.matchType === 'regex') {
            // Try to auto-detect path-preserving intent (e.g. http://abc/* → http://abc.g.b.com/)
            const pathCapture = autoAddPathCapture(rule.sourceUrl, rule.destinationUrl);

            if (pathCapture) {
                // Path-preserving mode: use regexSubstitution so /b/c/d is kept
                // Cycle check: does dest match the NEW capture-group regex?
                const hasOverlap = destinationMatchesRegex(pathCapture.regexFilter, rule.destinationUrl);
                const regexFilter = hasOverlap
                    ? buildRegexWithExclusion(pathCapture.regexFilter, rule.destinationUrl)
                    : pathCapture.regexFilter;

                dnrRules.push({
                    id: ruleId,
                    priority: 1,
                    action: {
                        type: 'redirect' as chrome.declarativeNetRequest.RuleActionType,
                        redirect: { regexSubstitution: pathCapture.regexSubstitution },
                    },
                    condition: {
                        regexFilter,
                        resourceTypes: ALL_RESOURCE_TYPES,
                    },
                });
            } else {
                // Plain regex redirect (user may include \1 back-refs themselves)
                const hasRegexOverlap = destinationMatchesRegex(rule.sourceUrl, rule.destinationUrl);
                const regexFilter = hasRegexOverlap
                    ? buildRegexWithExclusion(rule.sourceUrl, rule.destinationUrl)
                    : rule.sourceUrl;

                const redirectAction = /\\[0-9]/.test(rule.destinationUrl)
                    ? { regexSubstitution: rule.destinationUrl }
                    : { url: rule.destinationUrl };

                dnrRules.push({
                    id: ruleId,
                    priority: 1,
                    action: {
                        type: 'redirect' as chrome.declarativeNetRequest.RuleActionType,
                        redirect: redirectAction,
                    },
                    condition: {
                        regexFilter,
                        resourceTypes: ALL_RESOURCE_TYPES,
                    },
                });
            }
        } else {
            // "contains" match type
            const hasOverlap = isSubstringOverlap(rule.sourceUrl, rule.destinationUrl);

            if (hasOverlap) {
                // Use regex with negative lookahead to prevent recursive matching
                // e.g., source="http://hello/" dest="http://hello.google.com/"
                // → matches http://hello/ but NOT when already http://hello.google.com/
                const normalizedSource = rule.sourceUrl.replace(/\/+$/, '');
                const normalizedDest = rule.destinationUrl.replace(/\/+$/, '');
                const suffix = normalizedDest.slice(normalizedSource.length);
                const regexFilter = suffix
                    ? escapeRegex(normalizedSource) + '(?!' + escapeRegex(suffix) + ')'
                    : escapeRegex(normalizedSource);

                dnrRules.push({
                    id: ruleId,
                    priority: 1,
                    action: {
                        type: 'redirect' as chrome.declarativeNetRequest.RuleActionType,
                        redirect: { url: rule.destinationUrl },
                    },
                    condition: {
                        regexFilter,
                        resourceTypes: ALL_RESOURCE_TYPES,
                    },
                });
            } else {
                // Simple URL filter — no overlap risk
                dnrRules.push({
                    id: ruleId,
                    priority: 1,
                    action: {
                        type: 'redirect' as chrome.declarativeNetRequest.RuleActionType,
                        redirect: { url: rule.destinationUrl },
                    },
                    condition: {
                        urlFilter: rule.sourceUrl,
                        resourceTypes: ALL_RESOURCE_TYPES,
                    },
                });
            }
        }
    }

    return dnrRules;
}

/**
 * Sync rules from storage to declarativeNetRequest.
 */
async function syncRules() {
    try {
        const data = await chrome.storage.sync.get({ rules: [], globalEnabled: true }) as StorageData;

        // If globally disabled, remove all rules
        if (!data.globalEnabled) {
            const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
            if (existingRules.length > 0) {
                await chrome.declarativeNetRequest.updateDynamicRules({
                    removeRuleIds: existingRules.map((r) => r.id),
                });
            }
            console.log('[URL Redirect] All rules cleared (globally disabled)');
            return;
        }

        const newRules = convertRulesToDNR(data.rules);

        // Remove all existing dynamic rules and add new ones
        const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: existingRules.map((r) => r.id),
            addRules: newRules,
        });

        console.log(`[URL Redirect] Synced ${newRules.length} redirect rules`);
    } catch (error) {
        console.error('[URL Redirect] Failed to sync rules:', error);
    }
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && (changes.rules || changes.globalEnabled)) {
        syncRules();
    }
});

// Sync on install/update
chrome.runtime.onInstalled.addListener(() => {
    syncRules();
});

// Sync on startup
chrome.runtime.onStartup.addListener(() => {
    syncRules();
});

// Initial sync
syncRules();
