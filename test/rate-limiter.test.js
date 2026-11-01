const { test, describe } = require('node:test');
const assert = require('node:assert');
const { RateLimiter } = require('../src/main/rate-limiter');

describe('RateLimiter', () => {
  test('allows up to 3 messages in rapid succession', () => {
    const limiter = new RateLimiter({ maxMessages: 3, windowMs: 3000 });

    assert.strictEqual(limiter.canSend(), true);
    limiter.recordSend();

    assert.strictEqual(limiter.canSend(), true);
    limiter.recordSend();

    assert.strictEqual(limiter.canSend(), true);
    limiter.recordSend();

    // 4th message should be blocked
    assert.strictEqual(limiter.canSend(), false);
    assert.ok(limiter.getRemainingCooldown() > 0);
  });

  test('resets permission after the time window expires', async () => {
    const limiter = new RateLimiter({ maxMessages: 3, windowMs: 100 });

    limiter.recordSend();
    limiter.recordSend();
    limiter.recordSend();
    assert.strictEqual(limiter.canSend(), false);

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 150));

    assert.strictEqual(limiter.canSend(), true);
    assert.strictEqual(limiter.getRemainingCooldown(), 0);
  });

  test('calculates correct remaining cooldown time', () => {
    const limiter = new RateLimiter({ maxMessages: 1, windowMs: 2000 });
    limiter.recordSend();

    const remaining = limiter.getRemainingCooldown();
    assert.ok(remaining > 1800 && remaining <= 2000);
  });
});
