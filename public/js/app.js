/**
 * app.js — Main bootstrap
 * Locket Web - Gold Edition
 */

const LocketApp = (() => {
  function onTabChange(tab) {
    if (tab === 'camera') LocketCamera.onTabActive();
    else LocketCamera.onTabLeave();

    if (tab === 'friends') LocketFriends.render();
    if (tab === 'history') LocketHistory.render();
    if (tab === 'profile') {
      LocketProfile.render();
      LocketWidget.update();
    }
  }

  function initSystemUI() {
    const settings = LocketState.get().adminSettings;
    const banner = document.getElementById('system-banner');
    const toast = document.getElementById('system-toast');
    if (settings.banner && banner) {
      banner.textContent = settings.banner;
      banner.classList.remove('hidden');
    }
    if (settings.systemNotification && toast) {
      toast.textContent = settings.systemNotification;
      toast.classList.remove('hidden');
      setTimeout(() => toast.classList.add('hidden'), 5000);
    }

    document.getElementById('btn-admin-login')?.addEventListener('click', () => {
      LocketUI.openModal('modal-admin-login');
    });

    document.getElementById('app-admin-login-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const email = document.getElementById('app-admin-email').value;
      const password = document.getElementById('app-admin-password').value;
      const result = LocketAuth.login(email, password);
      const err = document.getElementById('app-admin-error');
      if (result.ok) {
        window.location.href = '/admin/';
      } else {
        err.textContent = result.error;
        err.classList.remove('hidden');
      }
    });
  }

  function init() {
    initSystemUI();
    LocketUI.initModalCloses();
    LocketUI.initTabs(onTabChange);

    LocketCamera.init();
    LocketFriends.init();
    LocketHistory.init();
    LocketWidget.init();
    LocketProfile.init();
    LocketReactions.init();

    // Start on camera tab
    LocketCamera.onTabActive();

    // Simulate incoming lockets periodically (demo)
    setInterval(() => {
      if (Math.random() > 0.7) {
        LocketState.simulateIncomingLocket();
        LocketWidget.update();
        LocketCamera.renderFriendScroll();
        if (LocketUI.getActiveTab() === 'history') LocketHistory.render();
      }
    }, 45000);

    // First incoming after 8s for demo
    setTimeout(() => {
      LocketState.simulateIncomingLocket();
      LocketWidget.update();
      LocketCamera.renderFriendScroll();
      LocketUI.toast('Bạn bè vừa gửi Locket mới! ✦');
    }, 8000);

    console.log('Locket Web - Gold Edition ready ✦');
  }

  return { init, onTabChange };
})();

window.LocketApp = LocketApp;
document.addEventListener('DOMContentLoaded', LocketApp.init);