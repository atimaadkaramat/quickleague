/**
 * Rate limiter designed to protect players from Rocket League's
 * in-game "Chat disabled for 3 seconds" lock.
 */

class RateLimiter {
  constructor(options = {}) {
    this.maxMessages = options.maxMessages || 3;
    this.windowMs = options.windowMs || 3000;
    this.timestamps = [];
  }

  cleanOldTimestamps() {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);
  }

  canSend() {
    this.cleanOldTimestamps();
    return this.timestamps.length < this.maxMessages;
  }

  recordSend() {
    this.cleanOldTimestamps();
    this.timestamps.push(Date.now());
  }

  getRemainingCooldown() {
    this.cleanOldTimestamps();
    if (this.timestamps.length < this.maxMessages) {
      return 0;
    }
    const oldestInWindow = this.timestamps[0];
    const elapsed = Date.now() - oldestInWindow;
    return Math.max(0, this.windowMs - elapsed);
  }
}

module.exports = {
  RateLimiter
};
