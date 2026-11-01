const { ipcRenderer } = require('electron');

let countdownInterval = null;
let cooldownInterval = null;

function renderCategory(category, hudMode = 'corner', timeoutMs = 3000) {
  // Hide cooldown if showing
  document.getElementById('cooldown-banner').classList.add('hidden');

  const cornerBox = document.getElementById('corner-box');
  const radialWheel = document.getElementById('radial-wheel');

  if (hudMode === 'radial') {
    cornerBox.classList.add('hidden');
    radialWheel.classList.remove('hidden');

    document.getElementById('wheel-title').textContent = category.name || 'CATEGORY';
    document.getElementById('wheel-channel').textContent = (category.channel || 'all').toUpperCase();

    const slots = category.slots || [];
    document.getElementById('wheel-slot-1').textContent = (slots.find((s) => s.slot === 1) || {}).text || '---';
    document.getElementById('wheel-slot-2').textContent = (slots.find((s) => s.slot === 2) || {}).text || '---';
    document.getElementById('wheel-slot-3').textContent = (slots.find((s) => s.slot === 3) || {}).text || '---';
    document.getElementById('wheel-slot-0').textContent = '[Random Pool]';
  } else {
    radialWheel.classList.add('hidden');
    cornerBox.classList.remove('hidden');

    document.getElementById('category-title').textContent = category.name || 'CATEGORY';
    document.getElementById('channel-badge').textContent =
      category.channel === 'team' ? 'TEAM CHAT (Y)' : 'ALL CHAT (T)';

    const slotsContainer = document.getElementById('slots-list');
    slotsContainer.innerHTML = '';

    const slots = category.slots || [];
    slots.slice(0, 9).forEach((s) => {
      if (!s.text) return;
      const row = document.createElement('div');
      row.className = 'slot-row';
      row.innerHTML = `
        <span class="key-badge">[${s.slot}]</span>
        <span class="slot-text">${escapeHtml(s.text)}</span>
      `;
      slotsContainer.appendChild(row);
    });
  }

  // Handle countdown animation
  const progressBar = document.getElementById('countdown-progress');
  const timerLabel = document.getElementById('countdown-timer');

  progressBar.style.transition = 'none';
  progressBar.style.width = '100%';
  setTimeout(() => {
    progressBar.style.transition = `width ${timeoutMs}ms linear`;
    progressBar.style.width = '0%';
  }, 20);

  let secondsLeft = Math.ceil(timeoutMs / 1000);
  if (timerLabel) timerLabel.textContent = `${secondsLeft}s`;

  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    secondsLeft -= 1;
    if (secondsLeft > 0 && timerLabel) {
      timerLabel.textContent = `${secondsLeft}s`;
    } else {
      clearInterval(countdownInterval);
    }
  }, 1000);

  document.body.classList.remove('hidden');
}

function showCooldown(remainingMs) {
  const cooldownBanner = document.getElementById('cooldown-banner');
  const cooldownTime = document.getElementById('cooldown-time');
  const cornerBox = document.getElementById('corner-box');
  const radialWheel = document.getElementById('radial-wheel');

  cornerBox.classList.add('hidden');
  radialWheel.classList.add('hidden');
  cooldownBanner.classList.remove('hidden');
  document.body.classList.remove('hidden');

  let remainingSec = (remainingMs / 1000).toFixed(1);
  cooldownTime.textContent = `${remainingSec}s`;

  if (cooldownInterval) clearInterval(cooldownInterval);
  const startTime = Date.now();
  cooldownInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const left = Math.max(0, (remainingMs - elapsed) / 1000);
    cooldownTime.textContent = `${left.toFixed(1)}s`;
    if (left <= 0) {
      clearInterval(cooldownInterval);
      hideHUD();
    }
  }, 100);
}

function hideHUD() {
  document.body.classList.add('hidden');
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  if (cooldownInterval) {
    clearInterval(cooldownInterval);
    cooldownInterval = null;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

ipcRenderer.on('hud:show', (event, data) => {
  renderCategory(data.category, data.hudMode, data.timeoutMs || 3000);
});

ipcRenderer.on('hud:cooldown', (event, data) => {
  showCooldown(data.remainingMs || 3000);
});

ipcRenderer.on('hud:hide', () => {
  hideHUD();
});
