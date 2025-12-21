/**
 * SENSOR INTEGRATION HUB
 * ======================
 * Central hub for all data sources, IoT devices, and metrics
 * Feeds the learning engine with real-time user data
 *
 * "See everything. Miss nothing."
 */

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════
// SENSOR TYPES
// ═══════════════════════════════════════════════════════════════

const SENSOR_TYPES = {
    BIOMETRIC: 'biometric',      // Heart rate, stress, etc.
    ENVIRONMENT: 'environment',   // Temperature, light, noise
    DEVICE: 'device',            // Mouse, keyboard, screen
    CALENDAR: 'calendar',        // Schedule, meetings
    COMMUNICATION: 'communication', // Email, messages
    CODE: 'code',                // Git activity, IDE
    BROWSER: 'browser',          // Web activity
    SYSTEM: 'system',            // CPU, memory, network
    VOICE: 'voice',              // Voice commands, tone
    CUSTOM: 'custom'             // User-defined sensors
};

// ═══════════════════════════════════════════════════════════════
// BASE SENSOR CLASS
// ═══════════════════════════════════════════════════════════════

class Sensor {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.type = config.type;
        this.enabled = config.enabled !== false;
        this.pollInterval = config.pollInterval || 5000;
        this.lastReading = null;
        this.lastUpdate = null;
        this.readings = [];
        this.maxReadings = config.maxReadings || 100;
    }

    // Override in subclasses
    async read() {
        throw new Error('read() must be implemented');
    }

    // Record a reading
    record(value, metadata = {}) {
        const reading = {
            value,
            timestamp: Date.now(),
            metadata
        };

        this.lastReading = reading;
        this.lastUpdate = Date.now();
        this.readings.push(reading);

        // Keep readings bounded
        if (this.readings.length > this.maxReadings) {
            this.readings = this.readings.slice(-this.maxReadings);
        }

        return reading;
    }

    // Get recent readings
    getRecent(count = 10) {
        return this.readings.slice(-count);
    }

    // Get average value
    getAverage(window = 10) {
        const recent = this.getRecent(window);
        if (recent.length === 0) return null;

        const values = recent.map(r => r.value).filter(v => typeof v === 'number');
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
    }

    // Detect anomalies
    detectAnomaly(value) {
        const avg = this.getAverage(20);
        if (avg === null) return false;

        const stdDev = this.getStdDev(20);
        return Math.abs(value - avg) > stdDev * 2;
    }

    getStdDev(window = 20) {
        const recent = this.getRecent(window);
        const values = recent.map(r => r.value).filter(v => typeof v === 'number');
        if (values.length < 2) return 0;

        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
        return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
    }
}

// ═══════════════════════════════════════════════════════════════
// BUILT-IN SENSORS
// ═══════════════════════════════════════════════════════════════

class SystemSensor extends Sensor {
    constructor() {
        super({
            id: 'system',
            name: 'System Monitor',
            type: SENSOR_TYPES.SYSTEM,
            pollInterval: 5000
        });
    }

    async read() {
        const os = require('os');

        const cpuUsage = os.loadavg()[0] / os.cpus().length * 100;
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const memUsage = ((totalMem - freeMem) / totalMem) * 100;
        const uptime = os.uptime();

        return this.record({
            cpu: Math.round(cpuUsage * 100) / 100,
            memory: Math.round(memUsage * 100) / 100,
            uptime,
            platform: os.platform(),
            arch: os.arch()
        });
    }
}

class ActivitySensor extends Sensor {
    constructor() {
        super({
            id: 'activity',
            name: 'User Activity',
            type: SENSOR_TYPES.DEVICE,
            pollInterval: 1000
        });

        this.lastActivity = Date.now();
        this.keystrokes = 0;
        this.commands = 0;
    }

    recordKeystroke() {
        this.keystrokes++;
        this.lastActivity = Date.now();
    }

    recordCommand() {
        this.commands++;
        this.lastActivity = Date.now();
    }

    async read() {
        const now = Date.now();
        const idleTime = now - this.lastActivity;

        const reading = this.record({
            keystrokes: this.keystrokes,
            commands: this.commands,
            idleTime,
            isIdle: idleTime > 300000, // 5 minutes
            activityLevel: this.calculateActivityLevel()
        });

        // Reset counters
        this.keystrokes = 0;
        this.commands = 0;

        return reading;
    }

    calculateActivityLevel() {
        const recent = this.getRecent(6); // Last 30 seconds at 5s intervals
        if (recent.length === 0) return 'unknown';

        const totalKeystrokes = recent.reduce((sum, r) => sum + (r.value.keystrokes || 0), 0);
        const totalCommands = recent.reduce((sum, r) => sum + (r.value.commands || 0), 0);

        if (totalKeystrokes > 100 || totalCommands > 10) return 'high';
        if (totalKeystrokes > 20 || totalCommands > 3) return 'medium';
        if (totalKeystrokes > 0 || totalCommands > 0) return 'low';
        return 'idle';
    }
}

class TimeSensor extends Sensor {
    constructor() {
        super({
            id: 'time',
            name: 'Time Context',
            type: SENSOR_TYPES.ENVIRONMENT,
            pollInterval: 60000 // Once per minute
        });
    }

    async read() {
        const now = new Date();
        const hour = now.getHours();

        let timeOfDay, productivity, focusWindow;

        if (hour >= 5 && hour < 9) {
            timeOfDay = 'early_morning';
            productivity = 0.7;
            focusWindow = true;
        } else if (hour >= 9 && hour < 12) {
            timeOfDay = 'morning';
            productivity = 1.0;
            focusWindow = true;
        } else if (hour >= 12 && hour < 14) {
            timeOfDay = 'midday';
            productivity = 0.6;
            focusWindow = false;
        } else if (hour >= 14 && hour < 17) {
            timeOfDay = 'afternoon';
            productivity = 0.9;
            focusWindow = true;
        } else if (hour >= 17 && hour < 21) {
            timeOfDay = 'evening';
            productivity = 0.7;
            focusWindow = false;
        } else {
            timeOfDay = 'night';
            productivity = 0.4;
            focusWindow = false;
        }

        return this.record({
            hour,
            minute: now.getMinutes(),
            dayOfWeek: now.getDay(),
            timeOfDay,
            productivity,
            focusWindow,
            isWeekend: now.getDay() === 0 || now.getDay() === 6
        });
    }
}

class ContextSensor extends Sensor {
    constructor() {
        super({
            id: 'context',
            name: 'Work Context',
            type: SENSOR_TYPES.CODE,
            pollInterval: 10000
        });

        this.currentProject = null;
        this.currentFile = null;
        this.gitBranch = null;
        this.recentFiles = [];
    }

    setProject(project) {
        this.currentProject = project;
    }

    setFile(file) {
        this.currentFile = file;
        if (!this.recentFiles.includes(file)) {
            this.recentFiles.unshift(file);
            this.recentFiles = this.recentFiles.slice(0, 10);
        }
    }

    setBranch(branch) {
        this.gitBranch = branch;
    }

    async read() {
        return this.record({
            project: this.currentProject,
            file: this.currentFile,
            branch: this.gitBranch,
            recentFiles: this.recentFiles,
            filesActive: this.recentFiles.length
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// SENSOR HUB
// ═══════════════════════════════════════════════════════════════

class SensorHub extends EventEmitter {
    constructor() {
        super();

        this.sensors = new Map();
        this.running = false;
        this.pollTimers = new Map();

        // Aggregated data
        this.snapshot = {};
        this.history = [];
        this.maxHistory = 1000;

        // Initialize built-in sensors
        this.initBuiltinSensors();
    }

    initBuiltinSensors() {
        this.register(new SystemSensor());
        this.register(new ActivitySensor());
        this.register(new TimeSensor());
        this.register(new ContextSensor());
    }

    // Register a sensor
    register(sensor) {
        this.sensors.set(sensor.id, sensor);
        this.emit('sensor-registered', sensor);
        return this;
    }

    // Unregister a sensor
    unregister(sensorId) {
        const sensor = this.sensors.get(sensorId);
        if (sensor) {
            this.stopPolling(sensorId);
            this.sensors.delete(sensorId);
            this.emit('sensor-unregistered', sensor);
        }
        return this;
    }

    // Get sensor by ID
    get(sensorId) {
        return this.sensors.get(sensorId);
    }

    // Start all sensors
    start() {
        if (this.running) return;

        this.running = true;

        for (const [id, sensor] of this.sensors) {
            if (sensor.enabled) {
                this.startPolling(id);
            }
        }

        this.emit('hub-started');
    }

    // Stop all sensors
    stop() {
        this.running = false;

        for (const id of this.pollTimers.keys()) {
            this.stopPolling(id);
        }

        this.emit('hub-stopped');
    }

    // Start polling a sensor
    startPolling(sensorId) {
        const sensor = this.sensors.get(sensorId);
        if (!sensor) return;

        // Initial read
        this.readSensor(sensorId);

        // Set up interval
        const timer = setInterval(() => {
            this.readSensor(sensorId);
        }, sensor.pollInterval);

        this.pollTimers.set(sensorId, timer);
    }

    // Stop polling a sensor
    stopPolling(sensorId) {
        const timer = this.pollTimers.get(sensorId);
        if (timer) {
            clearInterval(timer);
            this.pollTimers.delete(sensorId);
        }
    }

    // Read a single sensor
    async readSensor(sensorId) {
        const sensor = this.sensors.get(sensorId);
        if (!sensor) return null;

        try {
            const reading = await sensor.read();
            this.snapshot[sensorId] = reading;
            this.emit('reading', { sensorId, reading });

            // Check for anomalies
            if (typeof reading.value === 'number' && sensor.detectAnomaly(reading.value)) {
                this.emit('anomaly', { sensorId, reading });
            }

            return reading;
        } catch (err) {
            this.emit('error', { sensorId, error: err });
            return null;
        }
    }

    // Read all sensors
    async readAll() {
        const readings = {};

        for (const [id, sensor] of this.sensors) {
            if (sensor.enabled) {
                readings[id] = await this.readSensor(id);
            }
        }

        // Store in history
        this.history.push({
            timestamp: Date.now(),
            readings
        });

        if (this.history.length > this.maxHistory) {
            this.history = this.history.slice(-this.maxHistory);
        }

        return readings;
    }

    // Get current snapshot
    getSnapshot() {
        return { ...this.snapshot };
    }

    // Get aggregated insights
    getInsights() {
        const system = this.snapshot.system?.value || {};
        const activity = this.snapshot.activity?.value || {};
        const time = this.snapshot.time?.value || {};
        const context = this.snapshot.context?.value || {};

        return {
            systemLoad: system.cpu > 80 ? 'high' : system.cpu > 50 ? 'medium' : 'low',
            memoryPressure: system.memory > 80,
            userState: activity.isIdle ? 'idle' : activity.activityLevel,
            focusTime: time.focusWindow,
            productivity: time.productivity,
            workContext: {
                project: context.project,
                branch: context.branch,
                activeFiles: context.filesActive
            },
            recommendations: this.generateRecommendations()
        };
    }

    // Generate context-aware recommendations
    generateRecommendations() {
        const recommendations = [];
        const system = this.snapshot.system?.value || {};
        const activity = this.snapshot.activity?.value || {};
        const time = this.snapshot.time?.value || {};

        if (system.memory > 80) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                message: 'High memory usage detected. Consider closing unused applications.'
            });
        }

        if (activity.isIdle && time.focusWindow) {
            recommendations.push({
                type: 'productivity',
                priority: 'medium',
                message: 'Optimal focus time detected. Ready to start a deep work session?'
            });
        }

        if (!time.focusWindow && activity.activityLevel === 'high') {
            recommendations.push({
                type: 'wellbeing',
                priority: 'low',
                message: 'Consider taking a break - it\'s outside optimal focus hours.'
            });
        }

        return recommendations;
    }

    // Create custom sensor
    createCustomSensor(config) {
        const sensor = new Sensor({
            ...config,
            type: SENSOR_TYPES.CUSTOM
        });

        // Allow custom read function
        if (config.readFn) {
            sensor.read = async () => {
                const value = await config.readFn();
                return sensor.record(value);
            };
        }

        this.register(sensor);
        return sensor;
    }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

module.exports = {
    SensorHub,
    Sensor,
    SystemSensor,
    ActivitySensor,
    TimeSensor,
    ContextSensor,
    SENSOR_TYPES
};
