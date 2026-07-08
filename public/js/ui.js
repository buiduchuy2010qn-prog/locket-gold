/**
 * ui.js — Shared UI helpers: tabs, modals, toast
 */

const LocketUI = (() => {
  let activeTab = 'camera';
  let toastTimer;

  function initTabs(onChange) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab, onChange));
    });

    document.getElementById('btn-top-search')?.addEventListener('click', () => switchTab('friends', onChange));
    document.getElementById('btn-top-profile')?.addEventListener('click', () => switchTab('profile', onChange));

    document.querySelectorAll('.tab-btn').forEach(b => {
      if (!b.classList.contains('active')) b.classList.add('text-gray-500');
    });
  }

  function switchTab(tab, onChange) {
    if (activeTab === tab) return;
    activeTab = tab;

    document.querySelectorAll('.tab-btn').forEach(b => {
      const on = b.dataset.tab === tab;
      b.classList.toggle('active', on);
      b.classList.toggle('text-yellow-400', on);
      b.classList.toggle('text-gray-500', !on);
    });
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.dataset.screen === tab));

    // Show/hide friend scroll bar
    const friendsBar = document.getElementById('friends-bar');
    if (friendsBar) friendsBar.classList.toggle('hidden', tab !== 'camera');

    onChange?.(tab);
  }

  function getActiveTab() { return activeTab; }

  function openModal(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.add('hidden'); }
    if (!document.querySelector('.modal:not(.hidden)')) document.body.style.overflow = '';
  }

  function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    document.body.style.overflow = '';
  }

  function initModalCloses() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.querySelector('.modal-backdrop')?.addEventListener('click', () => modal.classList.add('hidden'));
      modal.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
          modal.classList.add('hidden');
          if (!document.querySelector('.modal:not(.hidden)')) document.body.style.overflow = '';
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

  function haptic() {
    navigator.vibrate?.(10);
  }

  return {
    initTabs, switchTab, getActiveTab,
    openModal, closeModal, closeAllModals, initModalCloses,
    toast, haptic,
  };
})();