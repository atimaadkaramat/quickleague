const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { DEFAULT_CONFIG } = require('../shared/defaults');

const MAX_PHRASE_LENGTH = 120;

class ConfigManager {
  constructor(customPath = null) {
    if (customPath) {
      this.configPath = customPath;
    } else {
      const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
      const dir = path.join(appData, 'QuickLeague');
      this.configPath = path.join(dir, 'config.json');
    }
  }

  ensureDirectoryExists(filePath) {
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
    }
  }

  validatePhrase(phrase) {
    if (typeof phrase !== 'string') {
      throw new Error('Phrase must be a string');
    }
    if (phrase.length > MAX_PHRASE_LENGTH) {
      throw new Error(`Phrase exceeds maximum of ${MAX_PHRASE_LENGTH} characters`);
    }
    return phrase;
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.categories)) {
          return parsed;
        }
      }
    } catch {
      // Graceful fallback on corrupt file
    }

    // Default initialization
    const initialConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    this.saveConfig(initialConfig);
    return initialConfig;
  }

  saveConfig(config) {
    if (!config || typeof config !== 'object') {
      throw new Error('Invalid config object');
    }
    this.ensureDirectoryExists(this.configPath);
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf8');
  }

  exportPack(exportPath, categoryName) {
    const config = this.loadConfig();
    const category = config.categories.find((c) => c.name === categoryName);
    if (!category) {
      throw new Error(`Category "${categoryName}" not found`);
    }

    const pack = {
      format: 'quickleague-pack',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      category: {
        name: category.name,
        channel: category.channel,
        slots: category.slots,
        randomPool: category.randomPool
      }
    };

    this.ensureDirectoryExists(exportPath);
    fs.writeFileSync(exportPath, JSON.stringify(pack, null, 2), 'utf8');
    return pack;
  }

  importPack(packPath) {
    if (!fs.existsSync(packPath)) {
      throw new Error(`Pack file not found: ${packPath}`);
    }

    const raw = fs.readFileSync(packPath, 'utf8');
    const pack = JSON.parse(raw);

    if (pack.format !== 'quickleague-pack' || !pack.category) {
      throw new Error('Invalid .rlchat pack file format');
    }

    const config = this.loadConfig();
    const newCategory = {
      id: `cat_imported_${Date.now()}`,
      name: `${pack.category.name} (Imported)`,
      channel: pack.category.channel || 'all',
      hotkey: `Numpad${(config.categories.length % 9) + 1}`,
      slots: pack.category.slots || [],
      randomPool: pack.category.randomPool || []
    };

    config.categories.push(newCategory);
    this.saveConfig(config);
    return newCategory;
  }
}

module.exports = {
  ConfigManager,
  MAX_PHRASE_LENGTH
};
