/**
 * BULK ARC LOADER - Direct raw downloads
 * Bypasses API rate limits by going straight to raw.githubusercontent.com
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, 'data', 'bulk_dataset.json');

// Known ARC training task IDs (first 100 for quick testing)
const TRAINING_IDS = [
  '007bbfb7', '00d62c1b', '017c7c7b', '025d127b', '045e512c', '0520fde7',
  '05269061', '05f2a901', '06df4c85', '08ed6ac7', '09629e4f', '0962bcdd',
  '0a938d79', '0b148d64', '0ca9ddb6', '0d3d703e', '0dfd9992', '0e206a2e',
  '10fcaaa3', '11852cab', '1190e5a7', '137eaa0f', '150deff5', '178fcbfb',
  '1a07d186', '1b2d62fb', '1b60fb0c', '1bfc4729', '1c786137', '1cf80156',
  '1e0a9b12', '1e32b0e9', '1f0c79e5', '1f642eb9', '1f85a75f', '1fad071e',
  '2013d3e2', '2204b7a8', '22168020', '22233c11', '2281f1f4', '228f6490',
  '23581191', '239be575', '23b5c85d', '253bf280', '25d487eb', '25d8a9c8',
  '25ff71a9', '264363fd', '272f95fa', '27a28665', '28bf18c6', '28e73c20',
  '29623171', '29c11459', '29ec7d0e', '2bcee788', '2bee17df', '2c608aff',
  '2dc579da', '2dd70a9a', '2dee498d', '31aa019c', '321b1fc6', '32597951',
  '3345333e', '3428a4f5', '3618c87e', '3631a71a', '363442ee', '36d67576',
  '36fdfd69', '3906de3d', '39a8645d', '39e1d7f9', '3aa6fb7a', '3ac3eb23',
  '3af2c5a8', '3bd67248', '3bdb4ada', '3befdf3e', '3c9b0459', '3de23699',
  '3e980e27', '3eda0437', '3f7978a0', '40853293', '4093f84a', '41e4d17e',
  '4258a5f9', '4290ef0e', '42918530', '4347f46a', '444801d8', '44d8ac46',
  '44f52bb0', '4522001f', '4612dd53'
];

// More task IDs for extended testing
const EXTENDED_IDS = [
  '46442a0e', '469497ad', '46f33fce', '47c1f68c', '484b58aa', '48d8fb45',
  '4938f0c2', '496994bd', '49d1d64f', '4be741c5', '4c4377d9', '4c5c2cf0',
  '50846271', '508bd3b6', '50cb2852', '5117e062', '5168d44c', '539a4f51',
  '543a7ed5', '54d82841', '54d9e175', '5521c0d9', '5582e5ca', '5614dbcf',
  '56dc2b01', '56ff96f3', '57aa92db', '5ad4f10b', '5b6cbef5', '5bd6f4ac',
  '5c0a986e', '5c2c9af4', '5daaa586', '60b61512', '6150a2bd', '623ea044',
  '62c24649', '6430c8c4', '6455b5f5', '6773b310', '67385a82', '67a3c6ac',
  '67e8384a', '681b3aeb', '6855a6e4', '68b16354', '6936e2df', '694f12f3',
  '6a1e5592', '6aa20dc0', '6ad5a9c7', '6b9890af', '6c434453', '6cdd2623',
  '6cf79266', '6d0160f0', '6d0aefbc', '6d58a25d', '6d75e8bb', '6e02f1e3',
  '6e19193c', '6e82a1ae', '6ecd11f4', '6f8cd79b', '6fa7a44f', '72322fa7'
];

class BulkLoader {
  constructor() {
    this.tasks = [];
  }

  fetchJSON(url) {
    return new Promise((resolve, reject) => {
      const req = https.get(url, { timeout: 10000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Parse error: ${e.message}`));
          }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
    });
  }

  async fetchTask(taskId, category = 'training') {
    const url = `https://raw.githubusercontent.com/fchollet/ARC-AGI/master/data/${category}/${taskId}.json`;
    try {
      const data = await this.fetchJSON(url);
      return {
        id: taskId,
        category,
        train: data.train,
        test: data.test
      };
    } catch (e) {
      console.error(`Failed to fetch ${taskId}: ${e.message}`);
      return null;
    }
  }

  loadFromCache() {
    if (fs.existsSync(CACHE_FILE)) {
      try {
        const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
        this.tasks = data.tasks;
        console.log(`Loaded ${this.tasks.length} tasks from cache`);
        return true;
      } catch (e) {
        console.error('Cache load failed:', e.message);
      }
    }
    return false;
  }

  saveToCache() {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify({
      tasks: this.tasks,
      timestamp: new Date().toISOString()
    }));
    console.log(`Saved ${this.tasks.length} tasks to cache`);
  }

  async load(options = {}) {
    const { useCache = true, extended = false, limit = null } = options;

    if (useCache && this.loadFromCache()) {
      return this.tasks;
    }

    const ids = extended ? [...TRAINING_IDS, ...EXTENDED_IDS] : TRAINING_IDS;
    const toFetch = limit ? ids.slice(0, limit) : ids;

    console.log(`Fetching ${toFetch.length} tasks...`);

    // Fetch in parallel batches
    const BATCH_SIZE = 5;
    for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
      const batch = toFetch.slice(i, i + BATCH_SIZE);
      const promises = batch.map(id => this.fetchTask(id));
      const results = await Promise.all(promises);

      for (const task of results) {
        if (task) this.tasks.push(task);
      }

      process.stdout.write(`\rProgress: ${Math.min(i + BATCH_SIZE, toFetch.length)}/${toFetch.length}`);

      // Small delay between batches
      await new Promise(r => setTimeout(r, 200));
    }

    console.log('\nFetch complete');
    this.saveToCache();
    return this.tasks;
  }

  getTask(id) {
    return this.tasks.find(t => t.id === id);
  }

  sample(n) {
    return [...this.tasks].sort(() => Math.random() - 0.5).slice(0, n);
  }
}

module.exports = BulkLoader;

// CLI
if (require.main === module) {
  const loader = new BulkLoader();
  const args = process.argv.slice(2);
  const extended = args.includes('--extended');
  const noCache = args.includes('--no-cache');
  const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null;

  loader.load({ useCache: !noCache, extended, limit }).then(tasks => {
    console.log(`\nLoaded ${tasks.length} tasks`);
  });
}
