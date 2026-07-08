/**
 * profile.js — Profile screen, app icon, theme, who viewed, subscription
 */

const LocketProfile = (() => {
  const ICONS = [
    { id: 'gold', emoji: '✦', bg: 'linear-gradient(135deg,#1a1a00,#000)', border: true },
    { id: 'heart', emoji: '💛', bg: '#1C1C1E' },
    { id: 'camera', emoji: '📸', bg: '#1C1C1E' },
    { id: 'star', emoji: '⭐', bg: '#1C1C1E' },
    { id: 'sparkle', emoji: '✨', bg: 'linear-gradient(135deg,#2a1a00,#000)' },
    { id: 'classic', emoji: 'L', bg: '#FFD700', text: '#000' },
    { id: 'dark', emoji: 'L', bg: '#000', border: true },
    { id: 'neon', emoji: '💗', bg: 'linear-gradient(135deg,#1a0020,#000)' },
  ];

  const THEMES = [
    { id: 'classic', name: 'Dark Gold', swatch: 'linear-gradient(135deg,#FFD700,#000)' },
    { id: 'midnight', name: 'Midnight Purple', swatch: 'linear-gradient(135deg,#a78bfa,#0a0a12)' },
    { id: 'rose', name: 'Rose Gold', swatch: 'linear-gradient(135deg,#fb7185,#0d0808)' },
  ];

  function init() {
    render();
    renderIconPicker();
    renderThemePicker();

    document.querySelectorAll('.settings-row[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'app-icon') LocketUI.openModal('modal-app-icon');
        if (action === 'theme') LocketUI.openModal('modal-theme');
        if (action === 'who-viewed') openWhoViewed();
        if (action === 'subscription') LocketUI.openModal('modal-subscription');
      });
    });
  }

  function render() {
    const state = LocketState.get();
    document.getElementById('profile-name').textContent = state.user.name;
    document.getElementById('profile-avatar').textContent = state.user.avatar;
    const emailEl = document.getElementById('profile-email');
    if (emailEl) emailEl.textContent = state.user.email || '';
    document.getElementById('profile-friend-count').textContent =
      `${state.friends.length} bạn bè · Unlimited ✦`;
    document.getElementById('current-theme-label').textContent =
      (THEMES.find(t => t.id === state.settings.theme)?.name || 'Dark Gold') + ' →';

    applyTheme(state.settings.theme);
    applyAppIcon(state.settings.appIcon);
  }

  function renderIconPicker() {
    const picker = document.getElementById('icon-picker');
    const current = LocketState.get().settings.appIcon;

    picker.innerHTML = ICONS.map(ic => `
      <button class="icon-option ${ic.id === current ? 'active' : ''} ${ic.border ? 'gold-style' : ''}"
        data-icon="${ic.id}" style="background:${ic.bg};color:${ic.text || '#FFD700'}">
        ${ic.emoji}
      </button>
    `).join('');

    picker.querySelectorAll('.icon-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.icon;
        LocketState.update('settings.appIcon', id);
        picker.querySelectorAll('.icon-option').forEach(b => b.classList.toggle('active', b === btn));
        applyAppIcon(id);
        LocketUI.closeModal('modal-app-icon');
        LocketUI.toast('✦ App icon changed');
        LocketUI.haptic();
      });
    });
  }

  function renderThemePicker() {
    const picker = document.getElementById('theme-picker');
    const current = LocketState.get().settings.theme;

    picker.innerHTML = THEMES.map(t => `
      <button class="theme-option ${t.id === current ? 'active' : ''}" data-theme="${t.id}">
        <div class="theme-swatch" style="background:${t.swatch}"></div>
        <span>${t.name}</span>
      </button>
    `).join('');

    picker.querySelectorAll('.theme-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.theme;
        LocketState.update('settings.theme', id);
        picker.querySelectorAll('.theme-option').forEach(b => b.classList.toggle('active', b === btn));
        applyTheme(id);
        document.getElementById('current-theme-label').textContent =
          THEMES.find(t => t.id === id).name + ' →';
        LocketUI.closeModal('modal-theme');
        LocketUI.toast('Theme updated ✦');
      });
    });
  }

  function applyTheme(id) {
    document.body.classList.remove('theme-classic', 'theme-midnight', 'theme-rose');
    document.body.classList.add('theme-' + id);
  }

  function applyAppIcon(id) {
    const ic = ICONS.find(i => i.id === id) || ICONS[0];
    const fill = ic.text || '#FFD700';
    const bg = ic.id === 'classic' ? '#FFD700' : '#000000';
    const svg = [
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>",
      `<rect fill='${bg}' width='100' height='100' rx='22'/>`,
      `<text x='50' y='62' text-anchor='middle' font-size='44' fill='${fill}'>${ic.emoji}</text>`,
      '</svg>',
    ].join('');
    const link = document.getElementById('dynamic-favicon');
    if (link) link.href = 'data:image/svg+xml,' + encodeURIComponent(svg);

    const badge = document.getElementById('app-icon-badge');
    if (badge) {
      badge.textContent = ic.emoji.length === 1 ? ic.emoji : 'L';
      badge.style.background = ic.id === 'classic' ? '#FFD700' : '#1C1C1E';
      badge.style.color = ic.text || (ic.id === 'classic' ? '#000' : '#FFD700');
      badge.style.border = ic.border ? '2px solid #FFD700' : 'none';
    }
  }

  function openWhoViewed() {
    const viewers = LocketState.getAllViewersForUser();
    const list = document.getElementById('who-viewed-list');

    if (!viewers.length) {
      list.innerHTML = '<p class="text-center text-ios-label text-sm py-8">Chưa ai mở Locket của bạn</p>';
    } else {
      list.innerHTML = viewers.map(v => `
        <div class="viewer-row">
          <div class="viewer-avatar" style="color:${v.friend.color}">${v.friend.avatar}</div>
          <div class="flex-1">
            <p class="text-sm font-medium">${v.friend.name}</p>
            <p class="text-[10px] text-ios-label">${new Date(v.viewedAt).toLocaleString('vi-VN')}</p>
          </div>
          <img src="${v.locket.dataUrl}" class="w-10 h-10 rounded-lg object-cover" alt="">
        </div>
      `).join('');
    }

    LocketUI.openModal('modal-who-viewed');
  }

  return { init, render };
})();