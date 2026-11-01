const { execSync } = require('node:child_process');
const path = require('node:path');

class WindowMonitor {
  constructor(options = {}) {
    this.targetProcess = options.targetProcess || 'RocketLeague';
    this.mockActive = options.mockActive !== undefined ? options.mockActive : null;
    this.scriptPath = path.join(__dirname, 'check-active.ps1');
  }

  setMockActive(val) {
    this.mockActive = val;
  }

  /**
   * Checks if Rocket League is currently the focused foreground window.
   * Fail-closed: returns false if not active or detection fails.
   */
  isRocketLeagueActive() {
    if (this.mockActive !== null) {
      return this.mockActive;
    }

    if (process.platform !== 'win32') {
      return false; // Fail closed on non-Windows
    }

    try {
      const output = execSync(
        `powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${this.scriptPath}"`,
        {
          timeout: 800,
          encoding: 'utf8',
          windowsHide: true
        }
      ).trim();

      if (!output) {
        return false;
      }

      return output.toLowerCase().includes(this.targetProcess.toLowerCase());
    } catch {
      // Fail closed to prevent typing into other applications
      return false;
    }
  }
}

module.exports = {
  WindowMonitor
};
