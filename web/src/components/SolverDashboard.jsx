/**
 * SOLVER DASHBOARD COMPONENT
 * ═══════════════════════════════════════════════════════════════════
 * Real-time monitoring and control panel for UnlimitedSolver
 * ═══════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback } from 'react';

export default function SolverDashboard() {
  const [policy, setPolicy] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch current state
  const fetchState = useCallback(async () => {
    try {
      const [policyRes, metricsRes] = await Promise.all([
        fetch('/api/solver?action=policy'),
        fetch('/api/solver?action=metrics')
      ]);

      setPolicy(await policyRes.json());
      setMetrics(await metricsRes.json());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll for updates
  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, [fetchState]);

  // Update policy parameter
  const updatePolicy = async (key, value) => {
    try {
      const res = await fetch('/api/solver', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      });
      const data = await res.json();
      setPolicy(prev => ({ ...prev, policy: data.currentPolicy }));
    } catch (err) {
      setError(err.message);
    }
  };

  // Reset to defaults
  const resetPolicy = async () => {
    try {
      await fetch('/api/solver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-policy' })
      });
      fetchState();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="p-4">Loading solver dashboard...</div>;
  }

  return (
    <div className="p-4 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">
        🧠 UnlimitedSolver Dashboard
        <span className="text-sm font-normal ml-2 text-gray-400">v3 META_HORIZON</span>
      </h1>

      {error && (
        <div className="bg-red-900 border border-red-500 p-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Safety Policy Controls */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4 text-yellow-400">⚡ Safety Policy</h2>

          <PolicySlider
            label="Max Complexity Jump"
            value={policy?.policy?.MAX_COMPLEXITY_JUMP || 2}
            min={1}
            max={10}
            onChange={(v) => updatePolicy('MAX_COMPLEXITY_JUMP', v)}
          />

          <PolicySlider
            label="Max Chain Length"
            value={policy?.policy?.MAX_CHAIN_LENGTH || 5}
            min={1}
            max={20}
            onChange={(v) => updatePolicy('MAX_CHAIN_LENGTH', v)}
          />

          <PolicySlider
            label="Strategies per Generation"
            value={policy?.policy?.MAX_STRATEGIES_PER_GENERATION || 500}
            min={10}
            max={2000}
            step={10}
            onChange={(v) => updatePolicy('MAX_STRATEGIES_PER_GENERATION', v)}
          />

          <PolicySlider
            label="Validation Budget (ms)"
            value={policy?.policy?.VALIDATION_TIME_BUDGET_MS || 300}
            min={50}
            max={1000}
            step={50}
            onChange={(v) => updatePolicy('VALIDATION_TIME_BUDGET_MS', v)}
          />

          <div className="flex gap-2 mt-4">
            <button
              onClick={resetPolicy}
              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
            >
              Reset Defaults
            </button>
          </div>

          {policy?.modified && (
            <div className="mt-2 text-yellow-500 text-sm">
              ⚠️ Policy modified from defaults
            </div>
          )}
        </div>

        {/* Toggle Controls */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4 text-green-400">🔧 Toggles</h2>

          <PolicyToggle
            label="Human Oversight Required"
            value={policy?.policy?.HUMAN_OVERSIGHT_REQUIRED}
            onChange={(v) => updatePolicy('HUMAN_OVERSIGHT_REQUIRED', v)}
          />

          <PolicyToggle
            label="Development Mode"
            value={policy?.policy?.DEVELOPMENT_MODE}
            onChange={(v) => updatePolicy('DEVELOPMENT_MODE', v)}
          />

          <PolicyToggle
            label="Verbose Logging"
            value={policy?.policy?.LOG_LEVEL === 'verbose'}
            onChange={(v) => updatePolicy('LOG_LEVEL', v ? 'verbose' : 'info')}
          />

          <PolicyToggle
            label="Log Strategy Progress"
            value={policy?.policy?.LOG_STRATEGY_PROGRESS}
            onChange={(v) => updatePolicy('LOG_STRATEGY_PROGRESS', v)}
          />

          <PolicyToggle
            label="Flow Sync Monitor"
            value={policy?.policy?.ENABLE_FLOW_SYNC_MONITOR}
            onChange={(v) => updatePolicy('ENABLE_FLOW_SYNC_MONITOR', v)}
          />

          <PolicyToggle
            label="Warn on Large Jumps"
            value={policy?.policy?.WARN_ON_LARGE_JUMPS}
            onChange={(v) => updatePolicy('WARN_ON_LARGE_JUMPS', v)}
          />
        </div>

        {/* Metrics */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4 text-blue-400">📊 Metrics</h2>

          <MetricCard label="Active Solvers" value={metrics?.activeSolvers || 0} />
          <MetricCard label="Total Runs" value={metrics?.summary?.totalRuns || 0} />
          <MetricCard
            label="Avg Time"
            value={`${(metrics?.summary?.recentAvgTime || 0).toFixed(0)}ms`}
          />
          <MetricCard
            label="Success Rate"
            value={`${((metrics?.summary?.recentSuccessRate || 0) * 100).toFixed(1)}%`}
          />

          {metrics?.summary?.hierarchyUsage && (
            <div className="mt-4">
              <div className="text-sm text-gray-400 mb-2">Hierarchy Usage:</div>
              {Object.entries(metrics.summary.hierarchyUsage).map(([h, count]) => (
                <div key={h} className="flex justify-between text-sm">
                  <span className="text-gray-300">{h}</span>
                  <span className="text-green-400">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent History */}
      {metrics?.history?.length > 0 && (
        <div className="mt-6 bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4 text-purple-400">📜 Recent Runs</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400">
                  <th className="p-2">Time</th>
                  <th className="p-2">Task</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Strategy</th>
                  <th className="p-2">Duration</th>
                </tr>
              </thead>
              <tbody>
                {metrics.history.slice(-10).reverse().map((m, i) => (
                  <tr key={i} className="border-t border-gray-700">
                    <td className="p-2 text-gray-400">
                      {new Date(m.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-2">{m.taskId || 'unknown'}</td>
                    <td className="p-2">
                      {m.success ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="text-red-400">✗</span>
                      )}
                    </td>
                    <td className="p-2 text-gray-300">{m.strategy || '-'}</td>
                    <td className="p-2 text-gray-400">{m.timeMs}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Slider Component
function PolicySlider({ label, value, min, max, step = 1, onChange }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-300">{label}</span>
        <span className="text-white font-mono">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
}

// Toggle Component
function PolicyToggle({ label, value, onChange }) {
  return (
    <div className="flex justify-between items-center mb-3">
      <span className="text-gray-300 text-sm">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-colors ${
          value ? 'bg-green-600' : 'bg-gray-600'
        }`}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full transform transition-transform ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

// Metric Card Component
function MetricCard({ label, value }) {
  return (
    <div className="flex justify-between items-center mb-2 p-2 bg-gray-700 rounded">
      <span className="text-gray-300 text-sm">{label}</span>
      <span className="text-white font-mono text-lg">{value}</span>
    </div>
  );
}
