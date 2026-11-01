# 🚀 QuickLeague

**QuickLeague** is an anti-ban-safe, customizable quick-chat desktop utility for **Rocket League**.

Rocket League does not natively permit custom quick-chat sentences. Technical players previously automated this with private AutoHotkey scripts—pressing `T` or `Y`, typing sentences, and hitting `Enter`. **QuickLeague** brings this power to every player through a clean, dark-mode desktop interface: no scripting required.

---

## ✨ Features

- **🎮 Anti-Ban Safe by Architecture:** 100% external Windows OS input simulation (`SendInput`). QuickLeague **never** injects DLLs, hooks DirectX, or reads game memory.
- **⚡ Double-Tap Numpad Workflow:** 
  - Tap `Numpad 1` to prime Category 1 (the transparent HUD pops up).
  - Tap `Numpad 1–9` to immediately type and send that specific phrase.
  - Tap `Numpad 0` (the large thumb key) to fire a random quote from that category's pool.
  - Tap `Esc` (or wait 3 seconds) to dismiss without sending anything.
- **🛡️ Built-in Anti-Spam Protection:** Rocket League locks chat for 3 seconds if 3 messages are sent in rapid succession. QuickLeague tracks this limit and enforces a 3-second cooldown guard so stray keystrokes never interfere with your driving.
- **🎯 Dynamic Routing:** Route each category independently to **Team Chat (`Y`)** or **All Chat (`T`)**.
- **📦 Shareable Chat Packs (`.rlchat`):** One-click Export and Import to share your custom phrases with teammates on Discord.
- **🎨 Two HUD Overlay Styles:** Choose between the classic top-left **Corner Box** (optimized for Numpad 0–9) and the circular **Radial Wheel** (4-way directional).
- **🕹️ Controller Support:** Trigger the 4-way radial wheel using `Right Stick Click [R3] + D-Pad` without clashing with Rocket League's native quick chats.
- **⚡ Pre-loaded Starter Packs:** Comes out of the box with *Teammate Whiffs*, *My Mistakes*, *Opponent Banter*, and *Compliments & GG*.

---

## 🔒 Anti-Ban Guarantee

> **Why is QuickLeague safe from game bans?**
>
> 1. **Zero Memory Reading or Injection:** QuickLeague does not attach a debugger, open process handles, or hook into `RocketLeague.exe`.
> 2. **External Input:** Messages are sent through standard Windows OS input events (`SendInput`) with humanized micro-delays between characters—indistinguishable from a player typing on a physical keyboard.
> 3. **Non-Activating Overlay:** The transparent in-game HUD uses native Windows layered click-through flags (`WS_EX_TRANSPARENT | WS_EX_NOACTIVATE | WS_EX_TOPMOST`), so it never steals focus or control from your car.
> 4. **Active Window Check:** Keystrokes are strictly fired only when Rocket League is the active foreground window.

---

## 🚀 Getting Started

### Option 1: Standalone Portable Exe (Recommended)
1. Download `QuickLeague-Portable-1.0.0.exe` from the Releases page.
2. Double-click to launch (no installation or admin rights required).
3. Customize your categories or use the built-in starter phrases.
4. Launch Rocket League and tap `Numpad 1` to open your quick chat menu!

### Option 2: Running from Source
Prerequisites: [Node.js](https://nodejs.org/) (v18+)

```bash
# Clone the repository
git clone https://github.com/atimaadkaramat/quickleague.git
cd quickleague

# Install dependencies
npm install

# Start the desktop app
npm start

# Run unit tests
npm test

# Build portable .exe
npm run build:portable
```

---

## ⌨️ Default Key Controls

| Action | Key / Input |
|---|---|
| **Category 1 (Teammate Whiffs)** | `Numpad 1` |
| **Category 2 (My Mistakes)** | `Numpad 2` |
| **Category 3 (Opponent Banter)** | `Numpad 3` |
| **Category 4 (Compliments & GG)** | `Numpad 4` |
| **Specific Phrase Selection** | `Numpad 1` through `9` (while HUD is open) |
| **Random Quote from Pool** | `Numpad 0` (while HUD is open) |
| **Cancel / Dismiss HUD** | `Escape` or wait 3s |
| **Controller Radial Trigger** | `Right Stick Click (R3) + D-Pad` |

---

## 📄 License
MIT License. Created by [atimaadkaramat](https://github.com/atimaadkaramat).
