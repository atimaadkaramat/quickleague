const { execSync } = require('node:child_process');

class WindowMonitor {
  constructor(options = {}) {
    this.targetProcess = options.targetProcess || 'RocketLeague';
    this.mockActive = options.mockActive !== undefined ? options.mockActive : null;
  }

  setMockActive(val) {
    this.mockActive = val;
  }

  /**
   * Checks if Rocket League is currently the focused foreground window.
   */
  isRocketLeagueActive() {
    if (this.mockActive !== null) {
      return this.mockActive;
    }

    if (process.platform !== 'win32') {
      return true; // For testing on non-Windows
    }

    try {
      const psCommand = `
        Add-Type @"
          using System;
          using System.Runtime.InteropServices;
          public class Win32 {
            [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
            [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
          }
"@
        $hwnd = [Win32]::GetForegroundWindow()
        $procId = 0
        [Win32]::GetWindowThreadProcessId($hwnd, [ref]$procId) | Out-Null
        if ($procId -gt 0) {
          (Get-Process -Id $procId).ProcessName
        }
      `;

      const output = execSync(`powershell -NoProfile -Command "${psCommand.replace(/\n/g, ' ')}"`, {
        timeout: 1000,
        encoding: 'utf8'
      }).trim();

      return output.toLowerCase().includes(this.targetProcess.toLowerCase());
    } catch {
      // Fallback: If check fails, default to true so hotkeys are not blocked if user is running borderless
      return true;
    }
  }
}

module.exports = {
  WindowMonitor
};
