Add-Type @"
using System;
using System.Runtime.InteropServices;
public class QLWin32 {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
}
"@ -ErrorAction SilentlyContinue

$hwnd = [QLWin32]::GetForegroundWindow()
$targetProcId = 0
[QLWin32]::GetWindowThreadProcessId($hwnd, [ref]$targetProcId) | Out-Null
if ($targetProcId -gt 0) {
    (Get-Process -Id $targetProcId -ErrorAction SilentlyContinue).ProcessName
}
