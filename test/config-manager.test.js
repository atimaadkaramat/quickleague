const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { ConfigManager } = require('../src/main/config-manager');
const { DEFAULT_CONFIG } = require('../src/shared/defaults');

describe('ConfigManager', () => {
  let tempDir;
  let testConfigPath;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ql-test-'));
    testConfigPath = path.join(tempDir, 'config.json');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('loads default config when file does not exist', () => {
    const manager = new ConfigManager(testConfigPath);
    const config = manager.loadConfig();

    assert.strictEqual(config.appName, 'QuickLeague');
    assert.strictEqual(config.version, '1.0.0');
    assert.strictEqual(config.hudMode, 'corner');
    assert.ok(Array.isArray(config.categories));
    assert.strictEqual(config.categories.length, 4);

    // Verify default starter categories
    const names = config.categories.map((c) => c.name);
    assert.ok(names.includes('Teammate Whiffs'));
    assert.ok(names.includes('My Mistakes'));
    assert.ok(names.includes('Opponent Banter'));
    assert.ok(names.includes('Compliments & GG'));

    // Config file should be created automatically
    assert.ok(fs.existsSync(testConfigPath));
  });

  test('validates phrase lengths and enforces 120 character limit', () => {
    const manager = new ConfigManager(testConfigPath);
    const longPhrase = 'A'.repeat(150);

    assert.throws(() => {
      manager.validatePhrase(longPhrase);
    }, /120 characters/);

    const validPhrase = manager.validatePhrase('B'.repeat(120));
    assert.strictEqual(validPhrase.length, 120);
  });

  test('saves and reloads custom configuration', () => {
    const manager = new ConfigManager(testConfigPath);
    const config = manager.loadConfig();

    config.hudMode = 'radial';
    config.categories[0].name = 'Custom Category';
    config.categories[0].slots[0].text = 'Nice shot!';

    manager.saveConfig(config);

    const reloaded = new ConfigManager(testConfigPath).loadConfig();
    assert.strictEqual(reloaded.hudMode, 'radial');
    assert.strictEqual(reloaded.categories[0].name, 'Custom Category');
    assert.strictEqual(reloaded.categories[0].slots[0].text, 'Nice shot!');
  });

  test('exports and imports .rlchat pack cleanly', () => {
    const manager = new ConfigManager(testConfigPath);
    manager.loadConfig();

    const exportPath = path.join(tempDir, 'whiffs.rlchat');
    manager.exportPack(exportPath, 'Teammate Whiffs');

    assert.ok(fs.existsSync(exportPath));
    const raw = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
    assert.strictEqual(raw.format, 'quickleague-pack');
    assert.strictEqual(raw.version, '1.0.0');
    assert.strictEqual(raw.category.name, 'Teammate Whiffs');

    // Import into fresh manager
    const newConfigPath = path.join(tempDir, 'new-config.json');
    const freshManager = new ConfigManager(newConfigPath);
    freshManager.loadConfig();

    const importedCategory = freshManager.importPack(exportPath);
    assert.strictEqual(importedCategory.name, 'Teammate Whiffs (Imported)');
  });

  test('gracefully recovers from corrupt config file', () => {
    fs.writeFileSync(testConfigPath, '{ corrupt json !!!');
    const manager = new ConfigManager(testConfigPath);
    const config = manager.loadConfig();

    assert.strictEqual(config.appName, 'QuickLeague');
    assert.strictEqual(config.categories.length, 4);
  });
});
