/**
 * StateMachine governing QuickLeague quick chat workflow:
 * IDLE -> PRIMED -> SEND / DISMISS
 */

class StateMachine {
  constructor(config, options = {}) {
    this.config = config;
    this.state = 'IDLE'; // 'IDLE' | 'PRIMED'
    this.primedCategory = null;
    this.dismissTimer = null;
    this.autoDismissMs = options.autoDismissMs || (config.autoDismissSeconds ? config.autoDismissSeconds * 1000 : 3000);
    this.onStateChange = options.onStateChange || null;
  }

  updateConfig(newConfig) {
    this.config = newConfig;
    if (newConfig.autoDismissSeconds) {
      this.autoDismissMs = newConfig.autoDismissSeconds * 1000;
    }
  }

  getState() {
    return this.state;
  }

  getPrimedCategory() {
    return this.primedCategory;
  }

  clearTimer() {
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
  }

  resetToIdle(reason = 'timeout') {
    this.clearTimer();
    this.state = 'IDLE';
    this.primedCategory = null;
    if (this.onStateChange) {
      this.onStateChange({ state: 'IDLE', reason });
    }
  }

  handleKey(key) {
    const normalizedKey = key ? key.trim() : '';

    // ================= State: IDLE =================
    if (this.state === 'IDLE') {
      const matchedCategory = this.config.categories.find(
        (c) => c.hotkey && c.hotkey.toLowerCase() === normalizedKey.toLowerCase()
      );

      if (matchedCategory) {
        this.state = 'PRIMED';
        this.primedCategory = matchedCategory;

        this.clearTimer();
        this.dismissTimer = setTimeout(() => {
          this.resetToIdle('timeout');
        }, this.autoDismissMs);

        return {
          type: 'SHOW_HUD',
          category: matchedCategory,
          hudMode: this.config.hudMode || 'corner',
          swallow: true
        };
      }

      return { type: 'PASSTHROUGH', swallow: false };
    }

    // ================= State: PRIMED =================
    if (this.state === 'PRIMED') {
      // Cancellation
      if (normalizedKey.toLowerCase() === 'escape') {
        this.resetToIdle('cancelled');
        return { type: 'HIDE_HUD', reason: 'cancelled', swallow: true };
      }

      // Slot 0 (Random Quote from Pool)
      if (normalizedKey === 'Numpad0' || normalizedKey === '0') {
        const pool = this.primedCategory.randomPool || [];
        const randomText = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : '';
        const channel = this.primedCategory.channel || 'all';
        const category = this.primedCategory;

        this.resetToIdle('completed');
        return {
          type: 'SEND_CHAT',
          text: randomText,
          channel,
          category,
          swallow: true
        };
      }

      // Slot 1-9 check
      const match = normalizedKey.match(/^(?:Numpad)?([1-9])$/i);
      if (match) {
        const slotNum = parseInt(match[1], 10);
        const slot = (this.primedCategory.slots || []).find((s) => s.slot === slotNum);
        const text = slot ? slot.text : '';
        const channel = this.primedCategory.channel || 'all';
        const category = this.primedCategory;

        this.resetToIdle('completed');

        if (text && text.trim().length > 0) {
          return {
            type: 'SEND_CHAT',
            text: text.trim(),
            channel,
            category,
            swallow: true
          };
        } else {
          return { type: 'HIDE_HUD', reason: 'empty_slot', swallow: true };
        }
      }

      // Any other key cancels
      this.resetToIdle('other_key');
      return { type: 'HIDE_HUD', reason: 'other_key', swallow: false };
    }

    return { type: 'PASSTHROUGH', swallow: false };
  }
}

module.exports = {
  StateMachine
};
