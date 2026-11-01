const { test, describe } = require('node:test');
const assert = require('node:assert');
const { OverlayWindow } = require('../src/main/overlay-window');

describe('OverlayWindow', () => {
  test('initializes with default hidden state', () => {
    const overlay = new OverlayWindow();
    assert.strictEqual(overlay.isVisible(), false);
    assert.strictEqual(overlay.window, null);
  });
});
