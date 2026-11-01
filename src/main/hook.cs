using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace QuickLeagueHook
{
    class Program
    {
        private const int WH_KEYBOARD_LL = 13;
        private const int WM_KEYDOWN = 0x0100;
        private const int WM_SYSKEYDOWN = 0x0104;

        private delegate IntPtr LowLevelKeyboardProc(int nCode, IntPtr wParam, IntPtr lParam);
        private static LowLevelKeyboardProc _proc = HookCallback;
        private static IntPtr _hookID = IntPtr.Zero;
        private static bool _allowAnyWindow = false;

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelKeyboardProc lpfn, IntPtr hMod, uint dwThreadId);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool UnhookWindowsHookEx(IntPtr hhk);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr GetModuleHandle(string lpModuleName);

        [DllImport("user32.dll")]
        private static extern IntPtr GetForegroundWindow();

        [DllImport("user32.dll")]
        private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

        static void Main(string[] args)
        {
            if (args.Length > 0 && args[0] == "--allow-any-window")
            {
                _allowAnyWindow = true;
            }

            Console.WriteLine("HOOK_READY");
            Console.Out.Flush();

            _hookID = SetHook(_proc);
            Application.Run();
            UnhookWindowsHookEx(_hookID);
        }

        private static IntPtr SetHook(LowLevelKeyboardProc proc)
        {
            using (Process curProcess = Process.GetCurrentProcess())
            using (ProcessModule curModule = curProcess.MainModule)
            {
                return SetWindowsHookEx(WH_KEYBOARD_LL, proc, GetModuleHandle(curModule.ModuleName), 0);
            }
        }

        private static bool IsRocketLeagueForeground()
        {
            if (_allowAnyWindow) return true;

            try
            {
                IntPtr hwnd = GetForegroundWindow();
                if (hwnd == IntPtr.Zero) return false;

                uint pid = 0;
                GetWindowThreadProcessId(hwnd, out pid);
                if (pid == 0) return false;

                Process p = Process.GetProcessById((int)pid);
                return p.ProcessName.IndexOf("RocketLeague", StringComparison.OrdinalIgnoreCase) >= 0;
            }
            catch
            {
                return false;
            }
        }

        private static IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam)
        {
            if (nCode >= 0 && (wParam == (IntPtr)WM_KEYDOWN || wParam == (IntPtr)WM_SYSKEYDOWN))
            {
                int vkCode = Marshal.ReadInt32(lParam);
                Keys key = (Keys)vkCode;

                // Check if key is Numpad 0-9 or Escape
                bool isNumpad = key >= Keys.NumPad0 && key <= Keys.NumPad9;
                bool isEscape = key == Keys.Escape;

                if (isNumpad || isEscape)
                {
                    if (IsRocketLeagueForeground())
                    {
                        string keyName = key.ToString(); // e.g. "NumPad1", "NumPad0", "Escape"
                        // Standardize to NumpadX
                        if (keyName.StartsWith("NumPad", StringComparison.OrdinalIgnoreCase))
                        {
                            keyName = "Numpad" + keyName.Substring(6);
                        }

                        Console.WriteLine("KEY:" + keyName);
                        Console.Out.Flush();
                    }
                }
            }

            return CallNextHookEx(_hookID, nCode, wParam, lParam);
        }
    }
}
