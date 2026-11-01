# QuickLeague 🚀⚽

> **Custom Rocket League Quick Chat Desktop Utility**  
> Send custom tactical callouts, banter, and team messages mid-game without scripting and with complete anti-cheat safety.

---

## 📖 Overview

Rocket League provides a built-in quick chat system, but does not allow customizing phrases in-game. Typing custom messages manually mid-match requires opening text chat (`T` or `Y`), typing the phrase, and hitting `Enter`—which leaves your car completely vulnerable.

**QuickLeague** solves this problem. It is a lightweight, zero-latency Windows desktop utility built for Rocket League players that lets you organize, customize, and trigger tailored quick chats mid-match via **Numpad double-taps** or **controller wheel combos**.

---

## ✨ Features

- 🛡️ **100% Anti-Cheat Safe**: Zero DLL injection, zero memory reading, and zero DirectX hooking. All keystrokes use native Windows OS `SendInput` with micro-delay jitter, strictly indistinguishable from physical typing.
- 🎯 **Foreground Protection**: Hotkeys and keystrokes will only simulate chat when `RocketLeague.exe` is the active, focused window—preventing accidental typing in Discord or your browser.
- 🔢 **Double-Tap Numpad Selection**:
  - Tap `Numpad 1–9` to open the HUD and prime a category.
  - Tap `1–9` to fire a specific phrase.
  - Tap `Numpad 0` (the thumb key) to fire a random phrase from that category pool.
- 🎮 **Controller Support**: Trigger a 4-way radial quick chat menu using `Right Stick Click [R3] + D-Pad` without interfering with Rocket League's native D-Pad chats.
- 🖥️ **Non-Activating Transparent HUD**: Minimalist, semi-transparent overlay window (`WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_NOACTIVATE`) that never steals focus from the game.
- ⏱️ **In-Game Rate Limit & Anti-Spam Guard**:
  - Enforces Rocket League's strict 120-character limit per phrase.
  - Built-in 3-second cooldown tracker after 3 rapid messages to match Rocket League's chat throttle and avoid warnings.
- 📦 **Shareable Chat Packs (`.rlchat`)**: Export and import your custom quick chat configurations as shareable JSON files with a single click.
- 📦 **Zero Dependencies Portable App**: Run directly as a single portable `.exe` or install via standard Windows setup.

---

## 🗂️ Pre-Loaded Starter Categories

QuickLeague comes out-of-the-box with 4 tactical and banter categories:
1. **Teammate Whiffs** (Sarcastic & constructive team responses)
2. **My Mistakes** (Accountability & recovery callouts)
3. **Opponent Banter** (Mind games & clean banter)
4. **Compliments & GG** (Good sportsmanship, hype, and post-match chats)

---

## 🛠️ Tech Stack & Architecture

- **Runtime**: [Electron](https://www.electronjs.org/) & [Node.js](https://nodejs.org/)
- **UI**: Grounded dark-mode gaming interface (Vanilla HTML5 / Modern CSS / ES6)
- **Overlay Window**: Topmost, click-through, non-activating layered overlay
- **Packaging**: [electron-builder](https://www.electron.build/) (NSIS installer & single portable `.exe`)
- **Testing**: Node.js built-in test runner (`node --test`)

---

## 🚀 Getting Started

### Prerequisites

- **Windows 10 / 11** (64-bit)
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (bundled with Node.js)

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/atimaadkaramat/quickleague.git
cd quickleague
npm install
```

### Running Locally

```bash
npm start
```

### Running Tests

```bash
npm test
```

### Building Executables

Create a standalone portable executable:
```bash
npm run build:portable
```

Create a Windows installer (`.exe` setup):
```bash
npm run build:installer
```

Generated binaries will be located in the `dist/` directory.

---

## ⚙️ Configuration & `.rlchat` Format

Configurations and custom chat packs are stored locally in JSON format (`.rlchat`):

```json
{
  "version": "1.0.0",
  "name": "Custom Competitive Pack",
  "author": "Player1",
  "categories": [
    {
      "id": "teammate-whiffs",
      "name": "Teammate Whiffs",
      "hotkey": "Num1",
      "channel": "team",
      "phrases": [
        "Calculated.",
        "Nice block! Keep your chin up.",
        "Rotating back post!"
      ]
    }
  ]
}
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
