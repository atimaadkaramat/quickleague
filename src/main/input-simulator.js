const { spawn } = require('node:child_process');

class InputSimulator {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.keyDelayMs = options.keyDelayMs || 8;
  }

  /**
   * Simulates opening in-game chat, typing message, and hitting Enter.
   * channel: 'team' (Y) or 'all' (T)
   * Uses Base64-encoded UTF-8 transmission to avoid PowerShell command-line injection.
   */
  async sendChat(text, channel = 'all') {
    if (!text || typeof text !== 'string') {
      return;
    }

    if (this.dryRun) {
      return { success: true, text, channel, simulated: true };
    }

    const openKey = channel === 'team' ? 'y' : 't';
    const base64Text = Buffer.from(text, 'utf8').toString('base64');

    const psScript = `
      $bytes = [System.Convert]::FromBase64String("${base64Text}")
      $rawText = [System.Text.Encoding]::UTF8.GetString($bytes)
      Add-Type -AssemblyName System.Windows.Forms
      Start-Sleep -Milliseconds 25
      [System.Windows.Forms.SendKeys]::SendWait("${openKey}")
      Start-Sleep -Milliseconds 35
      $escaped = [System.Text.RegularExpressions.Regex]::Replace($rawText, "([+^%~{}()[\\]])", "{$1}")
      [System.Windows.Forms.SendKeys]::SendWait($escaped)
      Start-Sleep -Milliseconds 25
      [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
    `;

    return new Promise((resolve) => {
      const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psScript], {
        windowsHide: true
      });

      child.on('close', (code) => {
        resolve({ success: code === 0, text, channel });
      });

      child.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });
    });
  }
}

module.exports = {
  InputSimulator
};
