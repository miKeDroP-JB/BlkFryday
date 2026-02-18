import fs from 'fs';
import path from 'path';
import type { AgentManifest } from '@blk/shared';

/**
 * Load agent manifest from JSON file
 */
export function loadManifest(manifestPath: string): AgentManifest {
  const raw = fs.readFileSync(manifestPath, 'utf8');
  return JSON.parse(raw) as AgentManifest;
}

/**
 * Resolve the full path to a plugin's entry file
 */
export function resolvePluginPath(manifest: AgentManifest, pluginDir: string): string {
  return path.resolve(pluginDir, manifest.entry);
}

/**
 * Get path to plugins directory
 */
export function getPluginsDir(): string {
  return path.resolve(__dirname, '../plugins');
}

/**
 * List all available plugins
 */
export function listPlugins(): string[] {
  const pluginsDir = getPluginsDir();
  if (!fs.existsSync(pluginsDir)) return [];

  return fs.readdirSync(pluginsDir).filter(name => {
    const manifestPath = path.join(pluginsDir, name, 'manifest.json');
    return fs.existsSync(manifestPath);
  });
}

/**
 * Load a plugin by name
 */
export function loadPlugin(pluginName: string): { manifest: AgentManifest; entryPath: string } {
  const pluginDir = path.join(getPluginsDir(), pluginName);
  const manifestPath = path.join(pluginDir, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Plugin not found: ${pluginName}`);
  }

  const manifest = loadManifest(manifestPath);
  const entryPath = resolvePluginPath(manifest, pluginDir);

  return { manifest, entryPath };
}

// CLI test
if (require.main === module) {
  console.log('Available plugins:', listPlugins());

  const plugins = listPlugins();
  if (plugins.length > 0) {
    const { manifest, entryPath } = loadPlugin(plugins[0]);
    console.log('Loaded manifest:', manifest);
    console.log('Entry path:', entryPath);
  }
}
