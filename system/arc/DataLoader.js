/**
 * ARC-AGI DATA LOADER
 * Fetches and caches the full 800-task dataset
 *
 * THE SIMULATION CONSUMES ALL DATA
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(__dirname, 'data');
const CACHE_FILE = path.join(CACHE_DIR, 'full_dataset.json');

class DataLoader {
  constructor() {
    this.tasks = [];
    this.categories = {
      training: [],
      evaluation: []
    };
  }

  async fetchJSON(url) {
    return new Promise((resolve, reject) => {
      https.get(url, { headers: { 'User-Agent': '0RB-System' } }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
  }

  async fetchTaskList(category) {
    const url = `https://api.github.com/repos/fchollet/ARC-AGI/contents/data/${category}`;
    console.log(`Fetching ${category} task list...`);
    const files = await this.fetchJSON(url);
    return files.filter(f => f.name.endsWith('.json')).map(f => ({
      id: f.name.replace('.json', ''),
      url: f.download_url,
      category
    }));
  }

  async fetchTask(taskInfo) {
    const data = await this.fetchJSON(taskInfo.url);
    return {
      id: taskInfo.id,
      category: taskInfo.category,
      train: data.train,
      test: data.test
    };
  }

  async loadFromCache() {
    if (fs.existsSync(CACHE_FILE)) {
      console.log('Loading from cache...');
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      this.tasks = data.tasks;
      this.categories = data.categories;
      return true;
    }
    return false;
  }

  saveToCache() {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify({
      tasks: this.tasks,
      categories: this.categories,
      timestamp: new Date().toISOString()
    }, null, 2));
    console.log(`Saved ${this.tasks.length} tasks to cache`);
  }

  async fetchAll(options = { useCache: true, limit: null }) {
    // Try cache first
    if (options.useCache && await this.loadFromCache()) {
      console.log(`Loaded ${this.tasks.length} tasks from cache`);
      return this.tasks;
    }

    // Fetch task lists
    const trainingList = await this.fetchTaskList('training');
    const evaluationList = await this.fetchTaskList('evaluation');

    console.log(`Found ${trainingList.length} training + ${evaluationList.length} evaluation tasks`);

    const allTasks = [...trainingList, ...evaluationList];
    const toFetch = options.limit ? allTasks.slice(0, options.limit) : allTasks;

    console.log(`Fetching ${toFetch.length} tasks...`);

    // Fetch in batches to avoid rate limiting
    const BATCH_SIZE = 10;
    const DELAY_MS = 500;

    for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
      const batch = toFetch.slice(i, i + BATCH_SIZE);
      const promises = batch.map(t => this.fetchTask(t).catch(e => {
        console.error(`Failed to fetch ${t.id}: ${e.message}`);
        return null;
      }));

      const results = await Promise.all(promises);

      for (const task of results) {
        if (task) {
          this.tasks.push(task);
          this.categories[task.category].push(task.id);
        }
      }

      console.log(`Progress: ${Math.min(i + BATCH_SIZE, toFetch.length)}/${toFetch.length}`);

      if (i + BATCH_SIZE < toFetch.length) {
        await new Promise(r => setTimeout(r, DELAY_MS));
      }
    }

    // Save to cache
    this.saveToCache();

    return this.tasks;
  }

  getTask(id) {
    return this.tasks.find(t => t.id === id);
  }

  getByCategory(category) {
    return this.tasks.filter(t => t.category === category);
  }

  // Split dataset for train/validate/holdout
  split(trainRatio = 0.6, validateRatio = 0.2) {
    const shuffled = [...this.tasks].sort(() => Math.random() - 0.5);
    const trainEnd = Math.floor(shuffled.length * trainRatio);
    const validateEnd = trainEnd + Math.floor(shuffled.length * validateRatio);

    return {
      train: shuffled.slice(0, trainEnd),
      validate: shuffled.slice(trainEnd, validateEnd),
      holdout: shuffled.slice(validateEnd)
    };
  }

  // Get quick sample for fast testing
  sample(n = 50) {
    const shuffled = [...this.tasks].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  }
}

module.exports = DataLoader;

// CLI usage
if (require.main === module) {
  const loader = new DataLoader();
  const args = process.argv.slice(2);
  const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null;
  const noCache = args.includes('--no-cache');

  loader.fetchAll({ useCache: !noCache, limit }).then(tasks => {
    console.log(`\nLoaded ${tasks.length} ARC tasks`);
    console.log(`Training: ${loader.categories.training.length}`);
    console.log(`Evaluation: ${loader.categories.evaluation.length}`);
  }).catch(console.error);
}
