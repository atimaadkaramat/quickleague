const { test, describe } = require('node:test');
const assert = require('node:assert');
const { InputSimulator } = require('../src/main/input-simulator');

describe('InputSimulator', () => {
  test('handles double quotes and special characters safely', async () => {
    const simulator = new InputSimulator({ dryRun: true });
    const complexText = 'He said: "Nice shot! [Calculated] 100% {pass}"';
    const result = await simulator.sendChat(complexText, 'team');

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.text, complexText);
    assert.strictEqual(result.channel, 'team');
  });

  test('ignores empty or null input gracefully', async () => {
    const simulator = new InputSimulator({ dryRun: true });
    const res1 = await simulator.sendChat('', 'all');
    const res2 = await simulator.sendChat(null, 'all');

    assert.strictEqual(res1, undefined);
    assert.strictEqual(res2, undefined);
  });
});
