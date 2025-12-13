/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   MODULE ROUTER - Intelligent AI Node Selection                           ║
 * ║   Routes to Sigil (all) and Research (trusted only)                       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { sigilAI } from '../nodes/sigil-ai.js';
import { researchNode } from '../nodes/research-node.js';

// Registry of all AI nodes
export const aiNodes = [sigilAI, researchNode];

// Node capability mapping
const nodeCapabilities = {
    sigil: {
        name: 'Sigil',
        capabilities: ['mystical', 'encryption', 'transformation', 'secrets'],
        priority: 1,
        trustedOnly: false
    },
    researchnode: {
        name: 'ResearchNode',
        capabilities: ['research', 'discovery', 'simulation', 'science', 'strategy'],
        priority: 2,
        trustedOnly: true
    }
};

// Routing metrics
const routingMetrics = {
    totalRoutes: 0,
    byNode: {},
    errors: 0,
    avgLatency: 0,
    trustedRoutes: 0
};

/**
 * Register a new AI node
 */
export function registerNode(node, capabilities = {}) {
    if (!node.name || !node.process) {
        throw new Error('Node must have name and process method');
    }

    aiNodes.push(node);
    nodeCapabilities[node.name.toLowerCase()] = {
        name: node.name,
        capabilities: capabilities.capabilities || [],
        priority: capabilities.priority || 5,
        trustedOnly: capabilities.trustedOnly || false
    };

    return true;
}

/**
 * Route to all registered modules (respects trusted access)
 */
export async function routeModules(filteredData, userContext) {
    const results = [];
    const startTime = Date.now();
    const isTrusted = userContext.trusted === true;

    for (const node of aiNodes) {
        const nodeMeta = nodeCapabilities[node.name.toLowerCase()];

        // Skip trusted-only nodes for non-trusted users
        if (nodeMeta?.trustedOnly && !isTrusted) {
            continue;
        }

        try {
            const nodeStart = Date.now();
            const res = await node.process(filteredData, userContext);
            const nodeLatency = Date.now() - nodeStart;

            results.push({
                node: node.name,
                output: res,
                latency: nodeLatency,
                success: true,
                trusted: nodeMeta?.trustedOnly || false
            });

            // Update metrics
            routingMetrics.byNode[node.name] = routingMetrics.byNode[node.name] || { calls: 0, errors: 0 };
            routingMetrics.byNode[node.name].calls++;

        } catch (err) {
            console.error(`Error in module ${node.name}:`, err);

            results.push({
                node: node.name,
                output: null,
                error: err.message,
                success: false
            });

            routingMetrics.errors++;
            routingMetrics.byNode[node.name] = routingMetrics.byNode[node.name] || { calls: 0, errors: 0 };
            routingMetrics.byNode[node.name].errors++;
        }
    }

    // Update overall metrics
    routingMetrics.totalRoutes++;
    if (isTrusted) routingMetrics.trustedRoutes++;

    const totalLatency = Date.now() - startTime;
    routingMetrics.avgLatency = (routingMetrics.avgLatency * (routingMetrics.totalRoutes - 1) + totalLatency) / routingMetrics.totalRoutes;

    return results;
}

/**
 * Route to specific node by name
 */
export async function routeToNode(nodeName, filteredData, userContext) {
    const node = aiNodes.find(n => n.name.toLowerCase() === nodeName.toLowerCase());

    if (!node) {
        return {
            node: nodeName,
            output: null,
            error: `Node '${nodeName}' not found`,
            success: false
        };
    }

    // Check trusted access
    const nodeMeta = nodeCapabilities[nodeName.toLowerCase()];
    if (nodeMeta?.trustedOnly && !userContext.trusted) {
        return {
            node: nodeName,
            output: null,
            error: 'This node requires trusted access',
            locked: true,
            success: false
        };
    }

    try {
        const startTime = Date.now();
        const res = await node.process(filteredData, userContext);

        return {
            node: node.name,
            output: res,
            latency: Date.now() - startTime,
            success: true
        };
    } catch (err) {
        return {
            node: node.name,
            output: null,
            error: err.message,
            success: false
        };
    }
}

/**
 * Route based on intent/capability matching
 */
export async function routeByCapability(capability, filteredData, userContext) {
    const matchingNodes = [];
    const isTrusted = userContext.trusted === true;

    for (const [name, meta] of Object.entries(nodeCapabilities)) {
        // Skip trusted-only nodes for non-trusted users
        if (meta.trustedOnly && !isTrusted) continue;

        if (meta.capabilities.includes(capability)) {
            const node = aiNodes.find(n => n.name.toLowerCase() === name);
            if (node) {
                matchingNodes.push({ node, priority: meta.priority });
            }
        }
    }

    if (matchingNodes.length === 0) {
        return {
            capability,
            output: null,
            error: `No accessible node found for capability '${capability}'`,
            success: false
        };
    }

    // Sort by priority and route to best match
    matchingNodes.sort((a, b) => a.priority - b.priority);
    const bestNode = matchingNodes[0].node;

    return routeToNode(bestNode.name, filteredData, userContext);
}

/**
 * Parallel routing to multiple nodes
 */
export async function routeParallel(nodeNames, filteredData, userContext) {
    const promises = nodeNames.map(name => routeToNode(name, filteredData, userContext));
    return Promise.all(promises);
}

/**
 * Sequential routing with chaining
 */
export async function routeChain(nodeNames, initialData, userContext) {
    let currentData = initialData;
    const results = [];

    for (const name of nodeNames) {
        const result = await routeToNode(name, currentData, userContext);
        results.push(result);

        if (!result.success) {
            break;
        }

        // Chain output to next input
        currentData = {
            ...currentData,
            chainedFrom: name,
            chainedOutput: result.output
        };
    }

    return {
        chain: nodeNames,
        results,
        finalOutput: results[results.length - 1]?.output,
        success: results.every(r => r.success)
    };
}

/**
 * Get routing metrics
 */
export function getRoutingMetrics() {
    return { ...routingMetrics };
}

/**
 * List available nodes (filtered by trust level)
 */
export function listNodes(userContext = {}) {
    const isTrusted = userContext.trusted === true;

    return Object.entries(nodeCapabilities)
        .filter(([_, meta]) => !meta.trustedOnly || isTrusted)
        .map(([key, meta]) => ({
            id: key,
            name: meta.name,
            capabilities: meta.capabilities,
            priority: meta.priority,
            trustedOnly: meta.trustedOnly
        }));
}

/**
 * Check if user can access a node
 */
export function canAccess(nodeName, userContext) {
    const meta = nodeCapabilities[nodeName.toLowerCase()];
    if (!meta) return false;
    if (meta.trustedOnly && !userContext.trusted) return false;
    return true;
}

export default {
    aiNodes,
    routeModules,
    routeToNode,
    routeByCapability,
    routeParallel,
    routeChain,
    registerNode,
    getRoutingMetrics,
    listNodes,
    canAccess
};
