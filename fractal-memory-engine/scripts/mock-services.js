#!/usr/bin/env node
/**
 * Mock services for benchmarking without Docker
 * Simulates all Fractal Memory Engine services
 */

const http = require('http');

const services = [
  { port: 8888, name: 'Gateway', codename: 'THE NEXUS' },
  { port: 8000, name: 'Orchestrator', codename: 'THE CONDUCTOR' },
  { port: 8020, name: 'Ritual Engine', codename: 'THE HABIT LOOP' },
  { port: 8021, name: 'External Tether', codename: 'THE BRIDGES' },
  { port: 8030, name: 'Intent Grid', codename: 'THE SIGNAL HIGHWAY' },
  { port: 8031, name: 'Lexicon Engine', codename: 'THE LANGUAGE FORGE' },
  { port: 8032, name: 'Voice Loop', codename: 'THE BREATH' },
  { port: 8033, name: 'Supervisor', codename: 'THE WATCHER' },
  { port: 8040, name: 'Event Bus', codename: 'THE NERVOUS SYSTEM' }
];

const servers = [];

for (const svc of services) {
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Simulate realistic processing time (0.5-2ms)
    const delay = Math.random() * 1.5 + 0.5;

    setTimeout(() => {
      if (req.url === '/health') {
        res.end(JSON.stringify({
          status: 'healthy',
          service: svc.name.toLowerCase().replace(' ', '-'),
          codename: svc.codename,
          timestamp: new Date().toISOString()
        }));
      } else if (req.url === '/trigger') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          res.end(JSON.stringify({
            status: 'processed',
            service: svc.name,
            latencyMs: delay,
            timestamp: new Date().toISOString()
          }));
        });
      } else if (req.url === '/publish') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          res.end(JSON.stringify({
            status: 'published',
            eventId: `evt_${Date.now()}`,
            timestamp: new Date().toISOString()
          }));
        });
      } else if (req.url === '/status') {
        res.end(JSON.stringify({
          service: svc.name,
          codename: svc.codename,
          status: 'operational',
          metrics: {
            requests: Math.floor(Math.random() * 10000),
            avgLatencyMs: delay
          }
        }));
      } else {
        res.end(JSON.stringify({ path: req.url, method: req.method }));
      }
    }, delay);
  });

  server.listen(svc.port, () => {
    console.log(`  ✓ ${svc.name} (${svc.codename}) on :${svc.port}`);
  });

  servers.push(server);
}

console.log('');
console.log('═══════════════════════════════════════════════════════════════════════════');
console.log('  MOCK SERVICES RUNNING - Press Ctrl+C to stop');
console.log('═══════════════════════════════════════════════════════════════════════════');
console.log('');

process.on('SIGINT', () => {
  console.log('\nShutting down mock services...');
  servers.forEach(s => s.close());
  process.exit(0);
});
