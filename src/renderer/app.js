const { ipcRenderer } = require('electron');

let currentConfig = null;
let activeCategoryId = null;

// ================= DOM Elements =================
const categoryListEl = document.getElementById('category-list');
const categoryCountEl = document.getElementById('category-count');
const categoryNameInput = document.getElementById('category-name-input');
const categoryMetaText = document.getElementById('category-meta-text');
const channelSelect = document.getElementById('channel-select');
const hotkeyBtn = document.getElementById('hotkey-btn');
const btnDeleteCategory = document.getElementById('btn-delete-category');
const poolChipsEl = document.getElementById('pool-chips');
const btnAddPoolPhrase = document.getElementById('btn-add-pool-phrase');
const slotsEditorEl = document.getElementById('slots-editor');
const modeCornerBtn = document.getElementById('mode-corner');
const modeRadialBtn = document.getElementById('mode-radial');
const btnImport = document.getElementById('btn-import');
const btnExport = document.getElementById('btn-export');
const btnNewCategory = document.getElementById('btn-new-category');
const toastEl = document.getElementById('toast');

// ================= Initialization =================
async function init() {
  currentConfig = await ipcRenderer.invoke('config:get');
  if (currentConfig.categories && currentConfig.categories.length > 0) {
    activeCategoryId = currentConfig.categories[0].id;
  }
  renderUI();
  setupEventListeners();
  setupGamepadPolling();
}

function showToast(message, duration = 2500) {
  toastEl.textContent = message;
  toastEl.classList.remove('hidden');
  setTimeout(() => {
    toastEl.classList.add('hidden');
  }, duration);
}

function autoSave() {
  ipcRenderer.invoke('config:save', currentConfig);
}

// ================= Rendering =================
function renderUI() {
  if (!currentConfig) return;

  // Categories Sidebar
  categoryListEl.innerHTML = '';
  categoryCountEl.textContent = currentConfig.categories.length;

  currentConfig.categories.forEach((cat) => {
    const item = document.createElement('div');
    item.className = `category-nav-item ${cat.id === activeCategoryId ? 'active' : ''}`;
    item.innerHTML = `
      <span>${escapeHtml(cat.name)}</span>
      <span class="category-nav-hotkey">${cat.hotkey || 'Num'}</span>
    `;
    item.addEventListener('click', () => {
      activeCategoryId = cat.id;
      renderUI();
    });
    categoryListEl.appendChild(item);
  });

  // HUD Mode
  if (currentConfig.hudMode === 'radial') {
    modeRadialBtn.classList.add('active');
    modeCornerBtn.classList.remove('active');
  } else {
    modeCornerBtn.classList.add('active');
    modeRadialBtn.classList.remove('active');
  }

  // Active Category Details
  const activeCat = currentConfig.categories.find((c) => c.id === activeCategoryId);
  if (!activeCat) {
    return;
  }

  categoryNameInput.value = activeCat.name;
  categoryMetaText.textContent = `${activeCat.hotkey || 'Key'} activates this category in match.`;
  channelSelect.value = activeCat.channel || 'all';
  hotkeyBtn.textContent = activeCat.hotkey || 'None';

  // Random Pool Chips
  poolChipsEl.innerHTML = '';
  const pool = activeCat.randomPool || [];
  pool.forEach((phrase, idx) => {
    const chip = document.createElement('div');
    chip.className = 'pool-chip';
    chip.innerHTML = `
      <span>${escapeHtml(phrase)}</span>
      <span class="chip-remove" data-idx="${idx}">&times;</span>
    `;
    poolChipsEl.appendChild(chip);
  });

  // Slots 1 to 9
  slotsEditorEl.innerHTML = '';
  const slots = activeCat.slots || [];
  for (let i = 1; i <= 9; i++) {
    const slot = slots.find((s) => s.slot === i) || { slot: i, text: '' };
    const row = document.createElement('div');
    row.className = 'slot-item';
    row.innerHTML = `
      <div class="slot-num-badge">${i}</div>
      <input type="text" class="slot-input" maxlength="120" value="${escapeHtml(slot.text)}" placeholder="Type custom phrase (e.g. Nice block!)..." data-slot="${i}" />
      <div class="char-counter" id="counter-${i}">${slot.text.length}/120</div>
    `;
    slotsEditorEl.appendChild(row);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ================= Event Listeners =================
function setupEventListeners() {
  // Category Name change
  categoryNameInput.addEventListener('input', (e) => {
    const activeCat = currentConfig.categories.find((c) => c.id === activeCategoryId);
    if (activeCat) {
      activeCat.name = e.target.value.trim() || 'Untitled Category';
      renderUI();
      autoSave();
    }
  });

  // Channel Change
  channelSelect.addEventListener('change', (e) => {
    const activeCat = currentConfig.categories.find((c) => c.id === activeCategoryId);
    if (activeCat) {
      activeCat.channel = e.target.value;
      autoSave();
      showToast(`Channel updated: ${activeCat.channel === 'team' ? 'Team Chat (Y)' : 'All Chat (T)'}`);
    }
  });

  // Mode Switchers
  modeCornerBtn.addEventListener('click', () => {
    currentConfig.hudMode = 'corner';
    renderUI();
    autoSave();
    showToast('Overlay style set to Corner Box');
  });

  modeRadialBtn.addEventListener('click', () => {
    currentConfig.hudMode = 'radial';
    renderUI();
    autoSave();
    showToast('Overlay style set to Radial Wheel');
  });

  // Slots input change & paste limit detection
  slotsEditorEl.addEventListener('input', (e) => {
    if (e.target.classList.contains('slot-input')) {
      const slotNum = parseInt(e.target.dataset.slot, 10);
      const text = e.target.value;
      const counterEl = document.getElementById(`counter-${slotNum}`);
      if (counterEl) {
        counterEl.textContent = `${text.length}/120`;
      }

      const activeCat = currentConfig.categories.find((c) => c.id === activeCategoryId);
      if (activeCat) {
        let existingSlot = activeCat.slots.find((s) => s.slot === slotNum);
        if (!existingSlot) {
          existingSlot = { slot: slotNum, text: '' };
          activeCat.slots.push(existingSlot);
        }
        existingSlot.text = text;
        autoSave();
      }
    }
  });

  slotsEditorEl.addEventListener('paste', (e) => {
    if (e.target.classList.contains('slot-input')) {
      const pastedData = (e.clipboardData || window.clipboardData).getData('text');
      if (pastedData && pastedData.length > 120) {
        showToast('Pasted text exceeds 120 characters and was truncated.');
      }
    }
  });

  // Remove pool phrase
  poolChipsEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('chip-remove')) {
      const idx = parseInt(e.target.dataset.idx, 10);
      const activeCat = currentConfig.categories.find((c) => c.id === activeCategoryId);
      if (activeCat && activeCat.randomPool) {
        activeCat.randomPool.splice(idx, 1);
        renderUI();
        autoSave();
      }
    }
  });

  // Add pool phrase
  btnAddPoolPhrase.addEventListener('click', () => {
    const phrase = prompt('Enter a phrase for the random pool (max 120 chars):');
    if (phrase && phrase.trim().length > 0) {
      const trimmed = phrase.trim().slice(0, 120);
      const activeCat = currentConfig.categories.find((c) => c.id === activeCategoryId);
      if (activeCat) {
        if (!activeCat.randomPool) activeCat.randomPool = [];
        activeCat.randomPool.push(trimmed);
        renderUI();
        autoSave();
        showToast('Phrase added to pool');
      }
    }
  });

  // New Category
  btnNewCategory.addEventListener('click', () => {
    const catNum = currentConfig.categories.length + 1;
    const newCat = {
      id: `cat_${Date.now()}`,
      name: `Category ${catNum}`,
      channel: 'all',
      hotkey: `Numpad${Math.min(catNum, 9)}`,
      slots: [
        { slot: 1, text: 'Take the shot!' },
        { slot: 2, text: 'Defending.' },
        { slot: 3, text: 'Great pass!' }
      ],
      randomPool: ['Calculated.', 'Nice shot!']
    };
    currentConfig.categories.push(newCat);
    activeCategoryId = newCat.id;
    renderUI();
    autoSave();
    showToast('New category created');
  });

  // Delete Category
  btnDeleteCategory.addEventListener('click', () => {
    if (currentConfig.categories.length <= 1) {
      alert('You must keep at least one category.');
      return;
    }
    const activeCat = currentConfig.categories.find((c) => c.id === activeCategoryId);
    if (confirm(`Delete "${activeCat.name}"?`)) {
      currentConfig.categories = currentConfig.categories.filter((c) => c.id !== activeCategoryId);
      activeCategoryId = currentConfig.categories[0].id;
      renderUI();
      autoSave();
      showToast('Category deleted');
    }
  });

  // Export
  btnExport.addEventListener('click', async () => {
    const activeCat = currentConfig.categories.find((c) => c.id === activeCategoryId);
    if (!activeCat) return;

    const res = await ipcRenderer.invoke('pack:export', activeCat.name);
    if (res.success) {
      showToast(`Exported "${activeCat.name}" pack successfully!`);
    } else if (res.error) {
      alert(`Export Failed: ${res.error}`);
    }
  });

  // Import with Error Handling
  btnImport.addEventListener('click', async () => {
    const res = await ipcRenderer.invoke('pack:import');
    if (res.success && res.category) {
      currentConfig = await ipcRenderer.invoke('config:get');
      activeCategoryId = res.category.id;
      renderUI();
      showToast(`Imported "${res.category.name}" successfully!`);
    } else if (res.error) {
      alert(`Import Failed: ${res.error}`);
    }
  });
}

// ================= Gamepad Support (R3 + D-Pad) =================
let lastButtonState = {};

function setupGamepadPolling() {
  function pollGamepad() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of gamepads) {
      if (!gp) continue;

      // Standard Gamepad Mapping:
      // Button 11: Right Stick Click (R3)
      // Button 12: D-Pad Up
      // Button 13: D-Pad Down
      // Button 14: D-Pad Left
      // Button 15: D-Pad Right
      const r3Pressed = gp.buttons[11] && gp.buttons[11].pressed;
      if (r3Pressed) {
        if (gp.buttons[12] && gp.buttons[12].pressed && !lastButtonState.up) {
          ipcRenderer.invoke('gamepad:trigger', 'Numpad1');
        } else if (gp.buttons[15] && gp.buttons[15].pressed && !lastButtonState.right) {
          ipcRenderer.invoke('gamepad:trigger', 'Numpad2');
        } else if (gp.buttons[14] && gp.buttons[14].pressed && !lastButtonState.left) {
          ipcRenderer.invoke('gamepad:trigger', 'Numpad3');
        } else if (gp.buttons[13] && gp.buttons[13].pressed && !lastButtonState.down) {
          ipcRenderer.invoke('gamepad:trigger', 'Numpad4');
        }
      }

      lastButtonState = {
        up: gp.buttons[12] && gp.buttons[12].pressed,
        down: gp.buttons[13] && gp.buttons[13].pressed,
        left: gp.buttons[14] && gp.buttons[14].pressed,
        right: gp.buttons[15] && gp.buttons[15].pressed
      };
    }
    requestAnimationFrame(pollGamepad);
  }

  requestAnimationFrame(pollGamepad);
}

document.addEventListener('DOMContentLoaded', init);
