/**
 * LOCAL TASK LOADER
 * Loads ARC tasks from raw/ directory (downloaded via curl)
 */

const fs = require('fs');
const path = require('path');

const RAW_DIR = path.join(__dirname, 'raw');

function loadLocalTasks() {
  const tasks = [];

  if (!fs.existsSync(RAW_DIR)) {
    console.log('No raw/ directory found');
    return tasks;
  }

  const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.json'));

  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(RAW_DIR, file), 'utf8'));
      tasks.push({
        id: file.replace('.json', ''),
        category: 'training',
        train: data.train,
        test: data.test
      });
    } catch (e) {
      console.error(`Failed to load ${file}: ${e.message}`);
    }
  }

  return tasks;
}

module.exports = { loadLocalTasks };

if (require.main === module) {
  const tasks = loadLocalTasks();
  console.log(`Loaded ${tasks.length} local tasks`);
}
