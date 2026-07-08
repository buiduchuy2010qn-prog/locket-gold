/**
 * ui.js — Tabs (mobile bottom + desktop top/sidebar), modals, toast
 */

const LocketUI = (() => {
  let activeTab = 'camera';
  let toastTimer;

  /** Bind all tab buttons: .tab-btn, .sidebar-tab */
  function initTabs(onChange) {
    document.querySelectorAll('.tab-btn[data-tab], .sidebar-tab[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab, onChange));
    });

    document.getElementById('btn-top-search')?.addEventListener('click', () => switchTab('friends', onChange));
    document.getElementById('btn-top-profile')?.addEventListener('click', () => switchTab('profile', onChange));
  }

  function setActiveNav(tab) {
    document.querySelectorAll('.tab-btn[data-tab]').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    document.querySelectorAll('.sidebar-tab[data-tab]').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
  }

  function switchTab(tab, onChange) {
    if (activeTab === tab) return;
    activeTab = tab;
    setActiveNav(tab);
    document.querySelectorAll('.screen').forEach(s => {
      s.classList.toggle('active', s.dataset.screen === tab);
    });
    onChange?.(tab);
  }

  function getActiveTab() { return activeTab; }

  function openModal(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('hidden'); document.body.classList.add('overflow-hidden'); }
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
    if (!document.querySelector('.modal:not(.hidden)')) document.body.classList.remove('overflow-hidden');
  }

  function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    document.body.classList.remove('overflow-hidden');
  }

  function initModalCloses() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.querySelector('.modal-backdrop')?.addEventListener('click', () => {
        modal.classList.add('hidden');
        if (!document.querySelector('.modal:not(.hidden)')) document.body.classList.remove('overflow-hidden');
      });
      modal.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
          modal.classList.add('hidden');
          if (!document.querySelector('.modal:not(.hidden)')) document.body.classList.remove('overflow-hidden');
        });
      });
    });
  }

  function toast(msg, duration = 2500) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), duration);
  }

  function haptic() { navigator.vibrate?.(10); }

  return {
    initTabs, switchTab, getActiveTab, setActiveNav,
    openModal, closeModal, closeAllModals, initModalCloses,
    toast, haptic,
  };
})();