# QuickLeague v1.0 — Technical Design Document

**Date:** 2026-11-01  
**Project:** QuickLeague (Custom Rocket League Quick Chat Utility)  
**Status:** Approved & Finalized  

---

## 1. Intent and The "Why"
Rocket League provides a built-in quick chat system for tactical communication and reactions. However, Psyonix/Epic Games does not permit in-game customization of quick chat lines. Players wishing to send tailored messages, sarcastic banter, or motivational callouts currently must open in-game text chat (`T` for all chat or `Y` for team chat), manually type the sentence, and press `Enter`—which is impossible mid-match without giving up car control.

While technical users have built private AutoHotkey (AHK) scripts to simulate this, everyday players lack scripting knowledge. **QuickLeague** bridges this gap: a clean, lightweight, dark-mode Windows desktop application that lets players customize, organize, and trigger dynamic quick chats mid-match without any scripting, while guaranteeing complete safety from game bans.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Accessible Configuration:** Non-tech-savvy users download a portable `.exe`, launch it, and immediately have pre-loaded starter chat packs (*Teammate Whiffs*, *My Mistakes*, *Opponent Banter*, *Compliments & GG*) ready to play.
- **Two-Step Chat Selection (Double-Tap Numpad):** 
  - Tapping a Numpad key (e.g. `Numpad 1`) primes that category and displays the HUD.
  - The subsequent Numpad press (`1–9`) fires that specific phrase.
  - Pressing `Numpad 0` (the large thumb key) fires a random phrase from that category's pool.
- **Radial Wheel (Controller Mode):** Dedicated combo (`Right Stick Click [R3] + D-Pad`) activates the 4-way radial wheel without interfering with Rocket League's native D-Pad quick chats.
- **Key Swallowing During Selection:** While the menu is open, the selection Numpad keystroke is swallowed by the low-level hook so it never triggers in-game vehicle actions or camera swivel.
- **Channel Routing:** Independent per-category configuration to route chats to Team Chat (`Y`) or All Chat (`T`).
- **Rocket League Anti-Spam Protection:** 
  - Chat input fields capped at 120 characters max (Rocket League's hard limit).
  - Built-in 3-second cooldown guard after 3 rapid messages, matching the game's rate limiter with a visual HUD countdown.
- **HUD Dismissal & Audio:** 3-second auto-close timeout if no phrase is selected (or `Esc` to cancel), with an optional subtle audio cue on HUD open.
- **Shareable Chat Packs:** Single-click Export and Import of `.rlchat` (JSON) files to share packs with friends.
- **Distribution:** Portable single `.exe` (double-click and run, zero dependencies) plus optional Windows installer.

### Non-Goals
- **No In-Game Memory Reading:** Will not hook into Rocket League's memory or DirectX pipeline (e.g., reading score, ball position, or match state).
- **No Multi-Profile Switching in v1.0:** v1.0 uses a single active profile, relying on `.rlchat` Import/Export to switch packs.
- **No Cloud Account or Online Server:** 100% local, offline utility.

### Anti-Goals (Critical Constraints)
- **NO ANTI-CHEAT BANS (Safety Priority #1):**
  - Rocket League utilizes anti-cheat and process integrity monitoring. QuickLeague must **never** inject DLLs, open game process handles for memory inspection/writing, or hook into DirectX.
  - All input simulation occurs strictly externally at the Windows OS level (`SendInput`), indistinguishable from a user typing on a physical keyboard.
  - The transparent HUD overlay is an external borderless layered window (`WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_NOACTIVATE | WS_EX_TOPMOST`) that never steals window focus from the game.
  - Keystrokes are only emitted when `RocketLeague.exe` is the active, focused foreground window.

---

## 3. Evaluated Approaches & Selection

### Approach 1: Tauri (Rust Core + Web Frontend) — **SELECTED**
- **Architecture:** Rust backend handles low-level Windows APIs (global keyboard hook `WH_KEYBOARD_LL`, XInput controller polling, and `SendInput`), while lightweight HTML/CSS/JS (WebView2) powers both the desktop manager and the transparent HUD overlay.
- **Pros:**
  - Ultra-fast native performance with minimal memory footprint (~25 MB RAM).
  - Modern web styling enables authentic, responsive gaming UI without clumsy third-party XAML skins.
  - Rust crates (`windows-rs`, `rdev` / `winapi`) provide safe, direct access to standard Windows input APIs.
  - Small executable footprint (~12–15 MB).
- **Cons:** Requires Windows 10/11 with WebView2 (standard on almost all modern Windows gaming machines).

### Approach 2: C# / .NET 8 (WPF Native Windows App)
- **Architecture:** Standard C# desktop app with WPF.
- **Pros:** Mature Windows native libraries for XInput and SendInput.
- **Cons:** Complex and rigid styling in XAML to achieve modern gaming dark-mode polish; larger installer if self-contained runtime is bundled.

### Approach 3: Python (PyQt / Tkinter + PyInstaller)
- **Pros:** Quick scripting.
- **Cons:** Sluggish startup, large bundle size (~80+ MB), frequent antivirus false positives, and clunky transparent overlay window handling.

**Decision:** Approach 1 (Tauri) was selected for its performance, lightweight footprint, and flexible UI capabilities.

---

## 4. System Architecture & Components

```
+-------------------------------------------------------------------------+
|                              QUICKLEAGUE                                |
|                                                                         |
|  +------------------------+             +----------------------------+  |
|  |  Desktop Manager UI    |             |  In-Game HUD Overlay       |  |
|  |  - Category List       |             |  - Corner Box (Numpad 0-9) |  |
|  |  - Phrase Slots 1-9    |             |  - Radial Wheel (4-Way)    |  |
|  |  - Big Key 0 Random    |             |  - Non-activating / Topmost|  |
|  |  - Import / Export     |             |  - Click-through & Hidden  |  |
|  |  - Rate-limit Visual   |             |  - Auto-close (3s timeout) |  |
|  +-----------+------------+             +--------------^-------------+  |
|              |                                         |                |
|              v                                         |                |
|  +-----------------------------------------------------+-------------+  |
|  |                    Rust Backend Engine                            |  |
|  |  - Active Window Monitor (GetForegroundWindow -> RocketLeague.exe)|  |
|  |  - Low-level Keyboard Hook (WH_KEYBOARD_LL with key swallowing)   |  |
|  |  - XInput Polling (Right Stick Click + D-Pad combo detection)     |  |
|  |  - State Machine: Idle -> Category Primed -> Trigger / Send       |  |
|  |  - Rate-Limit Guard (3 messages / 3-sec cooldown tracker)         |  |
|  |  - Keystroke Simulator (SendInput with micro-delay jitter)        |  |
|  |  - Config Store (%APPDATA%/QuickLeague/config.json)               |  |
|  +-------------------------------------+-----------------------------+  |
+----------------------------------------|--------------------------------+
                                         | Windows SendInput API
                                         v
                         +-------------------------------+
                         |   Rocket League Game Window   |
                         |  (Press T/Y -> Type -> Enter) |
                         +-------------------------------+
```

### Component Details

#### A. Input Listening & State Machine
1. **Idle State:** 
   - Background keyboard hook monitors for category double-tap trigger (`Numpad 1–4`).
   - XInput poller checks for `Right Stick Click + D-Pad`.
2. **Primed State:**
   - Active window verification: If foreground window is not Rocket League, trigger is ignored.
   - If Rocket League is active: Overlay window becomes visible in the chosen style (Corner Box or Radial Wheel) showing slots and phrases.
   - Selective Key Swallowing active: The hook intercepts and swallows `Numpad 0–9` and `Esc` so no in-game vehicle actions trigger.
   - 3-second auto-dismiss timer starts. If no key is pressed within 3 seconds, or if `Esc` is tapped, HUD hides and returns to Idle without sending anything.
3. **Trigger / Send State:**
   - If user presses `1–9`: Selected slot's text is loaded.
   - If user presses `0` (or `Down` on 4-way): A random phrase is selected from the category's random pool.
   - Rate Limit Check: If 3 messages have already been sent in the last 3 seconds, chat is suppressed and the HUD shows a brief cooldown timer.
   - HUD immediately hides.
   - Simulator executes:
     1. Press `T` (All Chat) or `Y` (Team Chat) based on category routing.
     2. Wait 20ms.
     3. Type message string using standard Unicode `KEYEVENTF_UNICODE` events with 4–10ms humanized micro-delays between characters.
     4. Wait 15ms.
     5. Press `Enter` (Virtual Key `VK_RETURN`).

#### B. Transparent Overlay Window
- Window attributes: `WS_EX_TOPMOST | WS_EX_TRANSPARENT | WS_EX_LAYERED | WS_EX_NOACTIVATE`.
- When displayed, Windows sends all clicks and keyboard focus straight through to Rocket League without interrupting driving, boosting, or steering.

#### C. Pack Import & Export Specification (`.rlchat`)
- Standard JSON schema containing:
  - `name`: String
  - `author`: String (optional)
  - `version`: String
  - `categories`: Array of objects:
    - `id`: String
    - `name`: String
    - `channel`: `"team"` | `"all"`
    - `hotkey`: String (e.g. `"Numpad1"`)
    - `slots`: Array of `{ slot: number, text: string }` (1–9)
    - `random_pool`: Array of strings

---

## 5. What is Left to the Builder
- Selection of specific frontend styling setup (Vanilla HTML/CSS with dark utility theme).
- Audio synthesis/playback implementation for the optional HUD toggle sound.
- Bundling configuration for creating both the portable standalone `.exe` and the optional NSIS installer.

---
