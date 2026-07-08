/**
 * admin.js — Admin Panel logic
 * Locket Web - Gold Edition
 */

(() => {
  const PANEL_TITLES = {
    dashboard: 'Dashboard',
    users: 'Quản lý Users',
    lockets: 'Quản lý Lockets',
    gold: 'Quản lý Gold',
    settings: 'Settings',
  };

  const $ = id => document.getElementById(id);

  // ─── Init ───
  function init() {
    if (LocketAuth.isLoggedIn()) showAdmin();
    else showLogin();

    $('login-form')?.addEventListener('submit', handleLogin);
    $('btn-logout')?.addEventListener('click', handleLogout);
    $('btn-save-settings')?.addEventListener('click', saveSettings);

    document.querySelectorAll('.admin-nav-btn[data-panel]').forEach(btn => {
      btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
    });
  }

  function showLogin() {
    $('login-screen')?.classList.remove('hidden');
    $('admin-app')?.classList.add('hidden');
  }

  function showAdmin() {
    $('login-screen')?.classList.add('hidden');
    $('admin-app')?.classList.remove('hidden');
    const session = LocketAuth.getSession();
    if ($('admin-user-email')) $('admin-user-email').textContent = session?.email || '';
    renderAll();
  }

  function handleLogin(e) {
    e.preventDefault();
    const email = $('login-email').value;
    const password = $('login-password').value;
    const result = LocketAuth.login(email, password);
    const errEl = $('login-error');
    if (result.ok) {
      errEl.classList.add('hidden');
      showAdmin();
    } else {
      errEl.textContent = result.error;
      errEl.classList.remove('hidden');
    }
  }

  function handleLogout() {
    LocketAuth.logout();
    showLogin();
    $('login-email').value = '';
    $('login-password').value = '';
  }

  function switchPanel(panel) {
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.admin-nav-btn[data-panel]').forEach(b => b.classList.remove('active'));
    $(`panel-${panel}`)?.classList.add('active');
    document.querySelector(`[data-panel="${panel}"]`)?.classList.add('active');
    $('panel-title').textContent = PANEL_TITLES[panel] || panel;
    renderPanel(panel);
  }

  function renderAll() {
    renderDashboard();
    renderUsers();
    renderLockets();
    renderGold();
    renderSettingsForm();
  }

  function renderPanel(panel) {
    if (panel === 'dashboard') renderDashboard();
    if (panel === 'users') renderUsers();
    if (panel === 'lockets') renderLockets();
    if (panel === 'gold') renderGold();
    if (panel === 'settings') renderSettingsForm();
  }

  // ─── Dashboard ───
  function renderDashboard() {
    const s = LocketState.getStats();
    $('stats-grid').innerHTML = `
      <div class="stat-card"><div class="num">${s.totalUsers}</div><div class="label">Tổng Users</div></div>
      <div class="stat-card"><div class="num">${s.todayLockets}</div><div class="label">Lockets hôm nay</div></div>
      <div class="stat-card"><div class="num">${s.todayVideos}</div><div class="label">Video hôm nay</div></div>
      <div class="stat-card"><div class="num">${s.goldUsers}</div><div class="label">Gold Users</div></div>
      <div class="stat-card"><div class="num">${s.totalLockets}</div><div class="label">Tổng Lockets</div></div>
      <div class="stat-card"><div class="num">${s.bannedUsers}</div><div class="label">Banned</div></div>
    `;
    $('dashboard-metrics').innerHTML = `
      <tr><td>Active Users</td><td>${s.activeUsers}</td><td><span class="badge badge-active">OK</span></td></tr>
      <tr><td>Photos hôm nay</td><td>${s.todayPhotos}</td><td><span class="badge badge-gold">Photo</span></td></tr>
      <tr><td>Tổng Videos</td><td>${s.totalVideos}</td><td><span class="badge badge-gold">Video</span></td></tr>
      <tr><td>Gold Members</td><td>${s.goldUsers} / ${s.totalUsers}</td><td><span class="badge badge-gold">✦ Gold</span></td></tr>
    `;
  }

  // ─── Users ───
  function renderUsers() {
    const users = LocketState.get().users;
    $('users-count').textContent = `${users.length} users · ${users.filter(u => u.isBanned).length} banned`;
    $('users-table').innerHTML = users.map(u => `
      <tr>
        <td><strong>${u.avatar}</strong> ${u.name}</td>
        <td class="text-zinc-400">${u.email}</td>
        <td>${u.isGold ? '<span class="badge badge-gold">Gold ✦</span>' : '<span class="badge badge-free">Free</span>'}</td>
        <td>${u.isBanned ? '<span class="badge badge-banned">Banned</span>' : '<span class="badge badge-active">Active</span>'}</td>
        <td class="text-zinc-500 text-xs">${fmtDate(u.joinedAt)}</td>
        <td>
          <button class="admin-action-btn ${u.isBanned ? '' : 'danger'}" data-ban="${u.id}">
            ${u.isBanned ? 'Unban' : 'Ban'}
          </button>
        </td>
      </tr>
    `).join('');

    $('users-table').querySelectorAll('[data-ban]').forEach(btn => {
      btn.addEventListener('click', () => {
        LocketState.toggleBanUser(btn.dataset.ban);
        renderUsers();
        renderDashboard();
      });
    });
  }

  // ─── Lockets ───
  function renderLockets() {
    const lockets = LocketState.get().lockets;
    $('lockets-count').textContent = `${lockets.length} lockets`;
    if (!lockets.length) {
      $('lockets-table').innerHTML = '<tr><td colspan="6" class="text-center text-zinc-500 py-8">Chưa có Locket nào</td></tr>';
      return;
    }
    $('lockets-table').innerHTML = lockets.map(l => {
      const sender = LocketState.getFriend(l.senderId);
      return `
        <tr>
          <td>${l.dataUrl ? `<img src="${l.dataUrl}" class="locket-thumb" alt="">` : '—'}</td>
          <td><span class="badge ${l.type === 'video' ? 'badge-gold' : 'badge-free'}">${l.type}</span></td>
          <td>${sender?.name || l.senderId}</td>
          <td class="text-zinc-400 max-w-[200px] truncate">${l.caption || '—'}</td>
          <td class="text-zinc-500 text-xs">${fmtDate(l.createdAt)}</td>
          <td><button class="admin-action-btn danger" data-delete="${l.id}">Xóa</button></td>
        </tr>
      `;
    }).join('');

    $('lockets-table').querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Xóa Locket này?')) {
          LocketState.deleteLocket(btn.dataset.delete);
          renderLockets();
          renderDashboard();
        }
      });
    });
  }

  // ─── Gold ───
  function renderGold() {
    const users = LocketState.get().users;
    $('gold-table').innerHTML = users.map(u => `
      <tr>
        <td><strong>${u.avatar}</strong> ${u.name}</td>
        <td class="text-zinc-400">${u.email}</td>
        <td>${u.isGold
          ? '<span class="badge badge-gold"><i class="fa-solid fa-crown"></i> Gold Active</span>'
          : '<span class="badge badge-free">Free Plan</span>'}</td>
        <td>
          <button class="admin-action-btn" data-gold="${u.id}">
            ${u.isGold ? 'Thu hồi Gold' : 'Cấp Gold ✦'}
          </button>
        </td>
      </tr>
    `).join('');

    $('gold-table').querySelectorAll('[data-gold]').forEach(btn => {
      btn.addEventListener('click', () => {
        LocketState.toggleGoldUser(btn.dataset.gold);
        renderGold();
        renderUsers();
        renderDashboard();
      });
    });
  }

  // ─── Settings ───
  function renderSettingsForm() {
    const s = LocketState.get().adminSettings;
    $('setting-banner').value = s.banner || '';
    $('setting-notification').value = s.systemNotification || '';
  }

  function saveSettings() {
    LocketState.update('adminSettings.banner', $('setting-banner').value);
    LocketState.update('adminSettings.systemNotification', $('setting-notification').value);
    const saved = $('settings-saved');
    saved.classList.remove('hidden');
    setTimeout(() => saved.classList.add('hidden'), 2500);
  }

  function fmtDate(iso) {
    return new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  document.addEventListener('DOMContentLoaded', init);
})();