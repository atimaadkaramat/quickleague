const { test, describe } = require('node:test');
const assert = require('node:assert');
const { WindowMonitor } = require('../src/main/window-monitor');

describe('WindowMonitor', () => {
  test('returns false by default when RocketLeague is not the active window', () => {
    const monitor = new WindowMonitor({ targetProcess: 'RocketLeague' });
    // In headless or when RocketLeague is not running, must return false (fail-closed)
    monitor.setMockActive(false);
    assert.strictEqual(monitor.isRocketLeagueActive(), false);
  });

  test('returns true when RocketLeague is active', () => {
    const monitor = new WindowMonitor({ targetProcess: 'RocketLeague' });
    monitor.setMockActive(true);
    assert.strictEqual(monitor.isRocketLeagueActive(), true);
  });

  test('real query does not throw and returns boolean', () => {
    const monitor = new WindowMonitor({ targetProcess: 'NonExistentGameProcess12345' });
    monitor.setMockActive(null); // Real check
    const result = monitor.isRocketLeagueActive();
    assert.strictEqual(typeof result, 'boolean');
    assert.strictEqual(result, false); // Fail-closed when non-existent
  });
});
