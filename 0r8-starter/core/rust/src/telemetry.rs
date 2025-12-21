//! ORBOS Telemetry - System Observation
//!
//! Real-time metrics, logging, and system monitoring.

use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use std::sync::{Arc, RwLock};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

/// Metric types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MetricValue {
    Counter(u64),
    Gauge(f64),
    Histogram(Vec<f64>),
    Timer(Duration),
}

/// Single metric point
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Metric {
    pub name: String,
    pub value: MetricValue,
    pub timestamp: u64,
    pub labels: Vec<(String, String)>,
}

impl Metric {
    pub fn counter(name: impl Into<String>, value: u64) -> Self {
        Self {
            name: name.into(),
            value: MetricValue::Counter(value),
            timestamp: now_unix(),
            labels: Vec::new(),
        }
    }

    pub fn gauge(name: impl Into<String>, value: f64) -> Self {
        Self {
            name: name.into(),
            value: MetricValue::Gauge(value),
            timestamp: now_unix(),
            labels: Vec::new(),
        }
    }

    pub fn timer(name: impl Into<String>, duration: Duration) -> Self {
        Self {
            name: name.into(),
            value: MetricValue::Timer(duration),
            timestamp: now_unix(),
            labels: Vec::new(),
        }
    }

    pub fn with_label(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.labels.push((key.into(), value.into()));
        self
    }
}

/// Log levels
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum Level {
    Trace = 0,
    Debug = 1,
    Info = 2,
    Warn = 3,
    Error = 4,
}

/// Log entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    pub level: Level,
    pub message: String,
    pub timestamp: u64,
    pub module: String,
    pub fields: Vec<(String, String)>,
}

impl LogEntry {
    pub fn new(level: Level, message: impl Into<String>) -> Self {
        Self {
            level,
            message: message.into(),
            timestamp: now_unix(),
            module: String::new(),
            fields: Vec::new(),
        }
    }

    pub fn with_module(mut self, module: impl Into<String>) -> Self {
        self.module = module.into();
        self
    }

    pub fn with_field(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.fields.push((key.into(), value.into()));
        self
    }
}

/// Telemetry collector
pub struct Telemetry {
    metrics: Arc<RwLock<VecDeque<Metric>>>,
    logs: Arc<RwLock<VecDeque<LogEntry>>>,
    max_entries: usize,
    min_level: Level,
}

impl Telemetry {
    pub fn new() -> Self {
        Self {
            metrics: Arc::new(RwLock::new(VecDeque::new())),
            logs: Arc::new(RwLock::new(VecDeque::new())),
            max_entries: 10000,
            min_level: Level::Info,
        }
    }

    pub fn with_level(mut self, level: Level) -> Self {
        self.min_level = level;
        self
    }

    /// Record metric
    pub fn record(&self, metric: Metric) {
        let mut metrics = self.metrics.write().unwrap();
        metrics.push_back(metric);
        while metrics.len() > self.max_entries {
            metrics.pop_front();
        }
    }

    /// Log message
    pub fn log(&self, entry: LogEntry) {
        if entry.level < self.min_level {
            return;
        }

        let mut logs = self.logs.write().unwrap();
        logs.push_back(entry);
        while logs.len() > self.max_entries {
            logs.pop_front();
        }
    }

    /// Convenience loggers
    pub fn trace(&self, msg: impl Into<String>) {
        self.log(LogEntry::new(Level::Trace, msg));
    }

    pub fn debug(&self, msg: impl Into<String>) {
        self.log(LogEntry::new(Level::Debug, msg));
    }

    pub fn info(&self, msg: impl Into<String>) {
        self.log(LogEntry::new(Level::Info, msg));
    }

    pub fn warn(&self, msg: impl Into<String>) {
        self.log(LogEntry::new(Level::Warn, msg));
    }

    pub fn error(&self, msg: impl Into<String>) {
        self.log(LogEntry::new(Level::Error, msg));
    }

    /// Get recent metrics
    pub fn recent_metrics(&self, count: usize) -> Vec<Metric> {
        let metrics = self.metrics.read().unwrap();
        metrics.iter().rev().take(count).cloned().collect()
    }

    /// Get recent logs
    pub fn recent_logs(&self, count: usize) -> Vec<LogEntry> {
        let logs = self.logs.read().unwrap();
        logs.iter().rev().take(count).cloned().collect()
    }

    /// Get metrics by name
    pub fn get_metric(&self, name: &str) -> Vec<Metric> {
        let metrics = self.metrics.read().unwrap();
        metrics.iter().filter(|m| m.name == name).cloned().collect()
    }

    /// Get logs by level
    pub fn get_logs_by_level(&self, level: Level) -> Vec<LogEntry> {
        let logs = self.logs.read().unwrap();
        logs.iter().filter(|l| l.level == level).cloned().collect()
    }

    /// Calculate average for gauge metric
    pub fn average(&self, name: &str) -> Option<f64> {
        let metrics = self.get_metric(name);
        let gauges: Vec<f64> = metrics
            .iter()
            .filter_map(|m| match &m.value {
                MetricValue::Gauge(v) => Some(*v),
                _ => None,
            })
            .collect();

        if gauges.is_empty() {
            None
        } else {
            Some(gauges.iter().sum::<f64>() / gauges.len() as f64)
        }
    }
}

impl Default for Telemetry {
    fn default() -> Self {
        Self::new()
    }
}

/// Timer helper for measuring durations
pub struct Timer {
    start: Instant,
    name: String,
}

impl Timer {
    pub fn new(name: impl Into<String>) -> Self {
        Self {
            start: Instant::now(),
            name: name.into(),
        }
    }

    pub fn elapsed(&self) -> Duration {
        self.start.elapsed()
    }

    pub fn elapsed_us(&self) -> u64 {
        self.start.elapsed().as_micros() as u64
    }

    pub fn elapsed_ms(&self) -> u64 {
        self.start.elapsed().as_millis() as u64
    }

    pub fn to_metric(&self) -> Metric {
        Metric::timer(&self.name, self.elapsed())
    }
}

fn now_unix() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_telemetry_logging() {
        let t = Telemetry::new().with_level(Level::Debug);

        t.info("Test message");
        t.debug("Debug message");
        t.trace("Trace message"); // Should be filtered

        let logs = t.recent_logs(10);
        assert_eq!(logs.len(), 2);
    }

    #[test]
    fn test_timer() {
        let timer = Timer::new("test_op");
        std::thread::sleep(std::time::Duration::from_millis(10));
        assert!(timer.elapsed_ms() >= 10);
    }
}
