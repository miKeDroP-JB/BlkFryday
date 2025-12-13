/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   MODULE ROUTER - Intelligent AI Node Selection                           ║
 * ║   Routes requests to optimal processing nodes                             ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { sigilAI } from '../nodes/sigil-ai.js';

// Registry of all AI nodes
export const aiNodes = [sigilAI];

// Node capability mapping
const nodeCapabilities = {
    sigil: {
        name: 'Sigil',
        capabilities: ['mystical', 'encryption', 'transformation', 'secrets'],
        priority: 1,
        async: true
    }
};

// Routing metrics
const routingMetrics = {
    totalRoutes: 0,
    byNode: {},
    errors: 0,
    avgLatency: 0
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
        async: capabilities.async !== false
    };

    return true;
}

/**
 * Route to all registered modules
 */
export async function routeModules(filteredData, userContext) {
    const results = [];
    const startTime = Date.now();

    for (const node of aiNodes) {
        try {
            const nodeStart = Date.now();
            const res = await node.process(filteredData, userContext);
            const nodeLatency = Date.now() - nodeStart;

            results.push({
                node: node.name,
                output: res,
                latency: nodeLatency,
                success: true
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

    for (const [name, meta] of Object.entries(nodeCapabilities)) {
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
            error: `No node found for capability '${capability}'`,
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
 * List available nodes
 */
export function listNodes() {
    return Object.entries(nodeCapabilities).map(([key, meta]) => ({
        id: key,
        name: meta.name,
        capabilities: meta.capabilities,
        priority: meta.priority
    }));
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
    listNodes
};
