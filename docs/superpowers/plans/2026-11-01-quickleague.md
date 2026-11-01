# QuickLeague v1.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and package QuickLeague v1.0, a standalone, anti-ban-safe custom quick chat desktop utility for Rocket League with double-tap Numpad selection, controller integration, and shareable presets.

**Architecture:** Electron desktop application utilizing a multi-window architecture: a clean dark-mode configuration window and a transparent, click-through, non-activating overlay window (`WS_EX_TRANSPARENT | WS_EX_NOACTIVATE`). Background input listener tracks foreground focus (`RocketLeague.exe`), coordinates double-tap Numpad and controller triggers, and emits external humanized Windows keystrokes via `SendInput`.

**Tech Stack:** Node.js, Electron, Vanilla HTML5 / CSS3 (Grounded Dark Gaming Utility Theme), Vitest / Node test runner, electron-builder.

**Spec:** [docs/superpowers/specs/2026-11-01-quickleague-design.md](file:///f:/Rocket%20Chat/docs/superpowers/specs/2026-11-01-quickleague-design.md)

---

## Global Constraints
- Anti-Ban Safety: 100% external Windows OS input simulation only. No DLL injection, no DirectX hooking, no memory reading.
- Foreground Protection: Keystrokes are strictly fired only when `RocketLeague.exe` is the active foreground window.
- Character Limit: All custom phrases enforce a hard 120-character maximum limit.
- Rate Limiting: 3-second cooldown guard after 3 messages sent in rapid succession, with HUD countdown.
- Window Non-Activation: Overlay window must never steal input or focus from Rocket League (`focusable: false`, click-through).
- Offline-First: 100% local operation with zero server or cloud dependencies.

## Review Focus
1. Rapid Spamming: Sending 4+ quick chats rapidly -> rate limiter must safely throttle the 4th message and display a 3s cooldown without typing stray characters.
2. Background App Switching: User Alt-Tabs to Discord/browser -> hotkeys must not simulate chat keystrokes outside Rocket League.
3. Long Phrase Input: User pastes a 150+ character string into phrase slot -> input must truncate at 120 characters and alert cleanly.
4. Auto-Dismissal: User opens category HUD with Numpad 1 but takes no further action -> HUD must auto-close after 3 seconds and return cleanly to Idle.
5. Corrupt `.rlchat` File: User attempts to import an invalid JSON file -> app must show an error dialog without crashing or wiping existing presets.

---

### Task 1: Project Scaffolding & Configuration Store
**Files:**
- Create: `package.json`
- Create: `src/main/config-manager.js`
- Create: `src/shared/defaults.js`
- Test: `test/config-manager.test.js`

**Interfaces:**
- Consumes: Node `fs`, `path`, `os`
- Produces: `ConfigManager.loadConfig(): Config`, `ConfigManager.saveConfig(config: Config): void`, `ConfigManager.exportPack(path: string): void`, `ConfigManager.importPack(filePath: string): Config`

- [ ] **Step 1: Write failing unit test for `ConfigManager`**
  Assert default categories load correctly (*Teammate Whiffs*, *My Mistakes*, *Opponent Banter*, *Compliments & GG*), phrase length validates at <= 120 characters, and export/import generates valid `.rlchat` JSON schema.
- [ ] **Step 2: Run test to verify it fails**
  Run: `npm test`
  Expected: FAIL (modules not found)
- [ ] **Step 3: Implement `defaults.js` and `config-manager.js`**
  Implement starter presets and robust JSON schema loader/saver with error-handling for corrupt files.
- [ ] **Step 4: Run test to verify it passes**
  Run: `npm test`
  Expected: PASS
- [ ] **Step 5: Commit**
  ```bash
  git add package.json src/ shared/ test/
  git commit -m "feat: implement configuration manager and starter presets"
  ```

---

### Task 2: Keystroke Simulator & Anti-Spam Rate Limiter
**Files:**
- Create: `src/main/input-simulator.js`
- Create: `src/main/rate-limiter.js`
- Test: `test/rate-limiter.test.js`

**Interfaces:**
- Consumes: Windows User32 `SendInput` / Node Windows bridge
- Produces: `RateLimiter.canSend(): boolean`, `RateLimiter.recordSend(): void`, `InputSimulator.sendChat(text: string, channel: 'team' | 'all'): Promise<void>`

- [ ] **Step 1: Write failing unit test for `RateLimiter`**
  Assert 3 messages within 3 seconds are permitted; 4th call returns `false` with remaining cooldown milliseconds.
- [ ] **Step 2: Run test to verify it fails**
  Run: `npm test`
  Expected: FAIL
- [ ] **Step 3: Implement `RateLimiter` and `InputSimulator`**
  Implement rate-limiter cooldown tracking and external keystroke sequence: Open chat (`Y` or `T`) -> 20ms delay -> type characters with 6ms humanized jitter -> 15ms delay -> `Enter`.
- [ ] **Step 4: Run test to verify it passes**
  Run: `npm test`
  Expected: PASS
- [ ] **Step 5: Commit**
  ```bash
  git add src/main/ test/
  git commit -m "feat: implement keystroke simulator and rate limiter"
  ```

---

### Task 3: Active Window Monitor & Input Hook State Machine
**Files:**
- Create: `src/main/window-monitor.js`
- Create: `src/main/state-machine.js`
- Test: `test/state-machine.test.js`

**Interfaces:**
- Consumes: `ConfigManager`, `RateLimiter`, `InputSimulator`
- Produces: `StateMachine.handleKey(key: string): StateAction`, `WindowMonitor.isRocketLeagueActive(): boolean`

- [ ] **Step 1: Write failing test for `StateMachine`**
  Assert transition from `IDLE` -> `PRIMED` on Category key; assert subsequent `1-9` emits phrase action; assert `0` emits random pool action; assert 3s timeout returns to `IDLE`.
- [ ] **Step 2: Run test to verify it fails**
  Run: `npm test`
  Expected: FAIL
- [ ] **Step 3: Implement `StateMachine` and `WindowMonitor`**
  Implement active window verification (`GetForegroundWindow` matching `RocketLeague.exe`) and double-tap Numpad state machine.
- [ ] **Step 4: Run test to verify it passes**
  Run: `npm test`
  Expected: PASS
- [ ] **Step 5: Commit**
  ```bash
  git add src/main/ test/
  git commit -m "feat: implement state machine and active window monitor"
  ```

---

### Task 4: In-Game Transparent Overlay HUD
**Files:**
- Create: `src/overlay/overlay.html`
- Create: `src/overlay/overlay.css`
- Create: `src/overlay/overlay.js`
- Create: `src/main/overlay-window.js`

**Interfaces:**
- Consumes: Electron `BrowserWindow` with `transparent: true`, `frame: false`, `alwaysOnTop: true`, `focusable: false`
- Produces: `OverlayWindow.showPrimedCategory(categoryData: object, layout: 'corner' | 'radial'): void`, `OverlayWindow.hide(): void`

- [ ] **Step 1: Create non-activating transparent window manager**
  Configure window with `WS_EX_TRANSPARENT | WS_EX_NOACTIVATE` via Electron window options.
- [ ] **Step 2: Build Corner Box (Numpad 0-9) layout**
  Render clean, high-contrast overlay showing slots 1–9 and wide 0 key for Random.
- [ ] **Step 3: Build Radial Wheel (4-Way) layout**
  Render 4-directional wheel with stick direction callouts.
- [ ] **Step 4: Verify click-through and non-focus behavior**
  Verify window does not steal cursor focus or keyboard focus from active background window.
- [ ] **Step 5: Commit**
  ```bash
  git add src/overlay/ src/main/overlay-window.js
  git commit -m "feat: implement transparent in-game HUD overlay"
  ```

---

### Task 5: Desktop Configuration App UI
**Files:**
- Create: `src/renderer/index.html`
- Create: `src/renderer/styles.css`
- Create: `src/renderer/app.js`
- Create: `src/main/main.js`

**Interfaces:**
- Consumes: IPC communication with Main process (`config:get`, `config:save`, `pack:import`, `pack:export`)
- Produces: Complete dark-mode gaming utility user interface

- [ ] **Step 1: Build Categories sidebar & HUD mode switcher**
  Implement clean category navigation, category addition/deletion, and Corner/Radial toggle.
- [ ] **Step 2: Build Phrase Slots editor & Random Pool manager**
  Implement slots 1–9 inputs with 120-character counter, channel selector (`Team (Y)` vs `All (T)`), and pool editor.
- [ ] **Step 3: Implement Import & Export UI flows**
  Connect `Import Pack (.rlchat)` and `Export Pack` dialogs with confirmation notifications.
- [ ] **Step 4: Wire IPC handlers in `main.js`**
  Connect UI events to `ConfigManager` and `StateMachine`.
- [ ] **Step 5: Commit**
  ```bash
  git add src/renderer/ src/main/
  git commit -m "feat: implement desktop manager user interface and IPC"
  ```

---

### Task 6: Packaging & Distribution
**Files:**
- Modify: `package.json`
- Create: `electron-builder.json`
- Create: `README.md`

**Interfaces:**
- Consumes: `electron-builder`
- Produces: Standalone portable `QuickLeague.exe` and optional Windows NSIS installer

- [ ] **Step 1: Configure electron-builder for portable Windows target**
  Set target to `portable` and `nsis` with clean metadata and desktop icons.
- [ ] **Step 2: Build portable binary**
  Run build script and verify executable runs without installation.
- [ ] **Step 3: Write comprehensive user guide and anti-ban documentation**
  Document how to run, default keybinds, controller combo (`R3 + D-Pad`), and explain the safe external architecture.
- [ ] **Step 4: Commit**
  ```bash
  git add electron-builder.json package.json README.md
  git commit -m "chore: configure packaging and write documentation"
  ```
