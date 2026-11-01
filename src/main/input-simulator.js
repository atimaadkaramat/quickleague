const { execFile, spawn } = require('node:child_process');

class InputSimulator {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.keyDelayMs = options.keyDelayMs || 8;
  }

  /**
   * Escapes special characters for Windows SendKeys or SendInput.
   */
  escapeText(text) {
    // SendKeys special chars: + ^ % ~ { } [ ] ( )
    return text.replace(/([+^%~{}()[\]])/g, '{$1}');
  }

  /**
   * Simulates opening in-game chat, typing message, and hitting Enter.
   * channel: 'team' (Y) or 'all' (T)
   */
  async sendChat(text, channel = 'all') {
    if (!text || typeof text !== 'string') {
      return;
    }

    if (this.dryRun) {
      return { success: true, text, channel, simulated: true };
    }

    const openKey = channel === 'team' ? 'y' : 't';
    const escaped = this.escapeText(text);

    // Using Windows PowerShell SendKeys for pure external, anti-ban-safe input simulation
    const psScript = `
      Add-Type -AssemblyName System.Windows.Forms
      Start-Sleep -Milliseconds 25
      [System.Windows.Forms.SendKeys]::SendWait("${openKey}")
      Start-Sleep -Milliseconds 35
      [System.Windows.Forms.SendKeys]::SendWait("${escaped}")
      Start-Sleep -Milliseconds 25
      [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
    `;

    return new Promise((resolve, reject) => {
      const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psScript], {
        windowsHide: true
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, text, channel });
        } else {
          resolve({ success: false, code });
        }
      });

      child.on('error', (err) => {
        // Fallback or handle error without crashing
        resolve({ success: false, error: err.message });
      });
    });
  }
}

module.exports = {
  InputSimulator
};
