/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   UI LOADER - Dynamic Layout Management                                   ║
 * ║   Adaptive interfaces for every context                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import defaultLayout from './layouts/default.js';
import minimalLayout from './layouts/minimal.js';
import immersiveLayout from './layouts/immersive.js';

// Layout registry
const layouts = {
    default: defaultLayout,
    minimal: minimalLayout,
    immersive: immersiveLayout
};

// Active layout state
let activeLayout = null;
let layoutHistory = [];

/**
 * Load UI layout based on preferences
 */
export function loadUI(preferences = {}) {
    const layoutName = preferences.layout || 'default';
    const layout = layouts[layoutName] || layouts.default;

    // Track layout history
    if (activeLayout && activeLayout.name !== layout.name) {
        layoutHistory.push({
            from: activeLayout.name,
            to: layout.name,
            timestamp: Date.now()
        });
    }

    activeLayout = layout;

    // Initialize layout with preferences
    layout.init && layout.init(preferences);

    return {
        name: layout.name,
        render: (data) => layout.display(data, preferences),
        update: (data) => layout.update && layout.update(data, preferences),
        destroy: () => layout.destroy && layout.destroy(),
        getState: () => layout.getState && layout.getState()
    };
}

/**
 * Register a custom layout
 */
export function registerLayout(name, layout) {
    if (!layout.display) {
        throw new Error('Layout must have a display method');
    }
    layouts[name] = {
        name,
        ...layout
    };
    return true;
}

/**
 * Get available layouts
 */
export function getLayouts() {
    return Object.keys(layouts).map(key => ({
        id: key,
        name: layouts[key].name,
        description: layouts[key].description || ''
    }));
}

/**
 * Switch layout dynamically
 */
export function switchLayout(layoutName, preferences = {}) {
    if (!layouts[layoutName]) {
        console.warn(`Layout '${layoutName}' not found, using default`);
        layoutName = 'default';
    }

    // Destroy current layout
    if (activeLayout && activeLayout.destroy) {
        activeLayout.destroy();
    }

    return loadUI({ ...preferences, layout: layoutName });
}

/**
 * Get layout history
 */
export function getLayoutHistory() {
    return [...layoutHistory];
}

/**
 * Preload layouts for faster switching
 */
export function preloadLayouts(layoutNames) {
    const preloaded = [];
    for (const name of layoutNames) {
        if (layouts[name] && layouts[name].preload) {
            layouts[name].preload();
            preloaded.push(name);
        }
    }
    return preloaded;
}

/**
 * Update dashboard - Creates a snapshot of current state for WebSocket broadcast
 */
export function updateDashboard(userId, context = {}) {
    // Import dependencies lazily to avoid circular imports
    const dashboardData = {
        type: 'dashboard_update',
        userId,
        timestamp: Date.now(),
        layout: activeLayout?.name || 'default',
        data: {
            // Core state
            context: {
                userId,
                ...context
            },
            // Layout info
            ui: {
                activeLayout: activeLayout?.name,
                availableLayouts: Object.keys(layouts),
                history: layoutHistory.slice(-5)
            }
        }
    };

    return dashboardData;
}

export default {
    loadUI,
    registerLayout,
    getLayouts,
    switchLayout,
    getLayoutHistory,
    preloadLayouts,
    updateDashboard,
    layouts
};
