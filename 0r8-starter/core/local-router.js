/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   LOCAL-FIRST ROUTER - Smart Model Selection                              ║
 * ║   "Local is default. Cloud is fallback."                                  ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Routes queries to the cheapest capable model:
 *   - 90% → Local Ollama (Mistral/Llama) - $0.00
 *   - 8%  → Cheap API (Haiku) - $0.001
 *   - 2%  → Premium API (Opus) - when Tournament escalates
 */

// Configuration
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const LOCAL_MODEL = process.env.LOCAL_MODEL || 'mistral';

// Routing thresholds
const ROUTE_LOCAL_THRESHOLD = parseFloat(process.env.ROUTE_LOCAL_THRESHOLD || '0.7');
const ROUTE_ESCALATE_THRESHOLD = parseFloat(process.env.ROUTE_ESCALATE_THRESHOLD || '0.9');

// Metrics
const routerMetrics = {
    total: 0,
    local: 0,
    cheap: 0,
    premium: 0,
    errors: 0,
    avgLatency: 0,
    costSaved: 0
};

// Complexity indicators (simple heuristics)
const COMPLEX_INDICATORS = [
    'analyze', 'compare', 'synthesize', 'evaluate', 'create strategy',
    'research', 'investigate', 'comprehensive', 'detailed analysis',
    'multi-step', 'complex', 'in-depth'
];

const SIMPLE_INDICATORS = [
    'what is', 'how to', 'define', 'list', 'simple', 'quick',
    'yes or no', 'true or false', 'short answer'
];

/**
 * Analyze query complexity (0.0 - 1.0)
 */
function analyzeComplexity(query) {
    const lowerQuery = query.toLowerCase();
    let score = 0.5; // Default medium

    // Check for simple indicators
    for (const indicator of SIMPLE_INDICATORS) {
        if (lowerQuery.includes(indicator)) {
            score -= 0.15;
        }
    }

    // Check for complex indicators
    for (const indicator of COMPLEX_INDICATORS) {
        if (lowerQuery.includes(indicator)) {
            score += 0.15;
        }
    }

    // Length factor (longer = potentially more complex)
    if (query.length > 500) score += 0.1;
    if (query.length > 1000) score += 0.1;
    if (query.length < 50) score -= 0.1;

    // Question depth (multiple questions = more complex)
    const questionCount = (query.match(/\?/g) || []).length;
    if (questionCount > 2) score += 0.1;

    return Math.max(0, Math.min(1, score));
}

/**
 * Determine route based on complexity
 */
function determineRoute(complexity) {
    if (complexity < ROUTE_LOCAL_THRESHOLD) {
        return 'local';
    } else if (complexity < ROUTE_ESCALATE_THRESHOLD) {
        return 'cheap';
    } else {
        return 'premium';
    }
}

/**
 * Query local Ollama model
 */
async function queryLocal(prompt, model = LOCAL_MODEL) {
    const startTime = Date.now();

    try {
        const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                prompt,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama error: ${response.status}`);
        }

        const data = await response.json();

        return {
            success: true,
            text: data.response,
            model,
            route: 'local',
            cost: 0,
            latency: Date.now() - startTime
        };
    } catch (err) {
        console.error('[LocalRouter] Ollama query failed:', err.message);
        return {
            success: false,
            error: err.message,
            route: 'local',
            latency: Date.now() - startTime
        };
    }
}

/**
 * Check if Ollama is available
 */
async function checkOllama() {
    try {
        const response = await fetch(`${OLLAMA_HOST}/api/tags`);
        if (response.ok) {
            const data = await response.json();
            return {
                available: true,
                models: data.models?.map(m => m.name) || []
            };
        }
    } catch (err) {
        // Ollama not running
    }

    return { available: false, models: [] };
}

/**
 * Main routing function
 * Returns the best response from the cheapest capable model
 */
export async function smartRoute(query, userContext = {}) {
    const startTime = Date.now();
    routerMetrics.total++;

    // Analyze complexity
    const complexity = analyzeComplexity(query);
    const route = determineRoute(complexity);

    // Check if user is trusted (may need premium access)
    const isTrusted = userContext.trusted === true;

    // For trusted users doing research, bump to premium
    const adjustedRoute = (isTrusted && route === 'cheap' && query.toLowerCase().includes('research'))
        ? 'premium'
        : route;

    let result;

    switch (adjustedRoute) {
        case 'local':
            // Try local first
            result = await queryLocal(query);

            if (result.success) {
                routerMetrics.local++;
                // Estimate cost saved vs premium API
                routerMetrics.costSaved += 0.05;
            } else {
                // Fallback to cheap API if local fails
                result = {
                    success: false,
                    error: 'Local model unavailable, would escalate to API',
                    route: 'local-failed',
                    wouldEscalateTo: 'cheap'
                };
            }
            break;

        case 'cheap':
            routerMetrics.cheap++;
            result = {
                success: true,
                route: 'cheap',
                escalate: true,
                model: 'claude-haiku',
                estimatedCost: 0.001,
                message: 'Query routed to cheap API tier'
            };
            break;

        case 'premium':
            routerMetrics.premium++;
            result = {
                success: true,
                route: 'premium',
                escalate: true,
                model: 'claude-opus',
                estimatedCost: 0.05,
                message: 'Query routed to premium API tier'
            };
            break;
    }

    // Update latency metrics
    const latency = Date.now() - startTime;
    routerMetrics.avgLatency = (routerMetrics.avgLatency * (routerMetrics.total - 1) + latency) / routerMetrics.total;

    return {
        ...result,
        complexity,
        originalRoute: route,
        latency
    };
}

/**
 * Get router metrics
 */
export function getRouterMetrics() {
    const total = routerMetrics.total || 1;
    return {
        ...routerMetrics,
        localPercent: ((routerMetrics.local / total) * 100).toFixed(1),
        cheapPercent: ((routerMetrics.cheap / total) * 100).toFixed(1),
        premiumPercent: ((routerMetrics.premium / total) * 100).toFixed(1)
    };
}

/**
 * Get available local models
 */
export async function getLocalModels() {
    return checkOllama();
}

/**
 * Estimate monthly cost based on query volume
 */
export function estimateMonthlyCost(queriesPerDay) {
    const monthly = queriesPerDay * 30;

    // Based on typical distribution
    const local = monthly * 0.90 * 0;        // 90% local = $0
    const cheap = monthly * 0.08 * 0.001;    // 8% cheap = $0.001 each
    const premium = monthly * 0.02 * 0.05;   // 2% premium = $0.05 each

    return {
        queriesPerDay,
        queriesPerMonth: monthly,
        breakdown: {
            local: { queries: Math.round(monthly * 0.90), cost: 0 },
            cheap: { queries: Math.round(monthly * 0.08), cost: cheap.toFixed(2) },
            premium: { queries: Math.round(monthly * 0.02), cost: premium.toFixed(2) }
        },
        totalMonthly: (local + cheap + premium).toFixed(2),
        costWithoutRouting: (monthly * 0.05).toFixed(2),
        savings: ((monthly * 0.05) - (local + cheap + premium)).toFixed(2)
    };
}

export default {
    smartRoute,
    getRouterMetrics,
    getLocalModels,
    estimateMonthlyCost,
    analyzeComplexity,
    determineRoute
};
