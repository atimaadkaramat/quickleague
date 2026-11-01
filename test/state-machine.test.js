const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const { StateMachine } = require('../src/main/state-machine');
const { DEFAULT_CONFIG } = require('../src/shared/defaults');

describe('StateMachine', () => {
  let stateMachine;
  let config;

  beforeEach(() => {
    config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    stateMachine = new StateMachine(config, {
      autoDismissMs: 100 // fast for tests
    });
  });

  test('starts in IDLE state', () => {
    assert.strictEqual(stateMachine.getState(), 'IDLE');
    assert.strictEqual(stateMachine.getPrimedCategory(), null);
  });

  test('transitions to PRIMED when category hotkey is pressed', () => {
    const action = stateMachine.handleKey('Numpad1');

    assert.strictEqual(stateMachine.getState(), 'PRIMED');
    assert.strictEqual(action.type, 'SHOW_HUD');
    assert.strictEqual(action.category.name, 'Teammate Whiffs');
    assert.strictEqual(action.swallow, true);
  });

  test('fires specific slot on second keypress (Double-Tap Numpad workflow)', () => {
    // 1st press: Primes Category 1
    stateMachine.handleKey('Numpad1');
    assert.strictEqual(stateMachine.getState(), 'PRIMED');

    // 2nd press: Numpad 1 sends Slot 1
    const action = stateMachine.handleKey('Numpad1');
    assert.strictEqual(stateMachine.getState(), 'IDLE');
    assert.strictEqual(action.type, 'SEND_CHAT');
    assert.strictEqual(action.channel, 'team');
    assert.strictEqual(action.text, 'Nice block! (Wait, which net was that?)');
    assert.strictEqual(action.swallow, true);
  });

  test('fires random quote when Numpad 0 is pressed', () => {
    stateMachine.handleKey('Numpad1');
    const action = stateMachine.handleKey('Numpad0');

    assert.strictEqual(stateMachine.getState(), 'IDLE');
    assert.strictEqual(action.type, 'SEND_CHAT');
    assert.ok(action.text.length > 0);
    assert.ok(config.categories[0].randomPool.includes(action.text));
  });

  test('cancels and returns to IDLE when Escape is pressed', () => {
    stateMachine.handleKey('Numpad2');
    assert.strictEqual(stateMachine.getState(), 'PRIMED');

    const action = stateMachine.handleKey('Escape');
    assert.strictEqual(stateMachine.getState(), 'IDLE');
    assert.strictEqual(action.type, 'HIDE_HUD');
    assert.strictEqual(action.reason, 'cancelled');
  });

  test('auto-dismisses after timeout', async () => {
    stateMachine.handleKey('Numpad1');
    assert.strictEqual(stateMachine.getState(), 'PRIMED');

    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.strictEqual(stateMachine.getState(), 'IDLE');
  });
});
