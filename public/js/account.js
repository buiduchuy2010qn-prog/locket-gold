/**
 * account.js — Login & Register screens
 * Locket Web - Gold Edition
 */

const LocketAccount = (() => {
  let appInitialized = false;

  function $(id) { return document.getElementById(id); }

  function showAuth(mode = 'login') {
    $('auth-gate')?.classList.remove('hidden');
    $('main-app')?.classList.add('hidden');
    switchAuthPanel(mode);
  }

  function showApp() {
    $('auth-gate')?.classList.add('hidden');
    $('main-app')?.classList.remove('hidden');
    if (!appInitialized) {
      LocketApp.boot();
      appInitialized = true;
    } else {
      LocketProfile.render();
      LocketCamera.renderFriendScroll();
    }
  }

  function switchAuthPanel(mode) {
    const isLogin = mode === 'login';
    $('panel-login')?.classList.toggle('hidden', !isLogin);
    $('panel-login')?.classList.toggle('active', isLogin);
    $('panel-register')?.classList.toggle('hidden', isLogin);
    $('panel-register')?.classList.toggle('active', !isLogin);
    clearErrors();
  }

  function clearErrors() {
    ['login-error', 'register-error'].forEach(id => {
      const el = $(id);
      if (el) {
        el.textContent = '';
        el.classList.add('hidden');
      }
    });
  }

  function showError(id, msg) {
    const el = $(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  function init() {
    $('btn-show-register')?.addEventListener('click', () => switchAuthPanel('register'));
    $('btn-show-login')?.addEventListener('click', () => switchAuthPanel('login'));

    $('form-login')?.addEventListener('submit', e => {
      e.preventDefault();
      clearErrors();
      const result = LocketAuth.userLogin(
        $('login-email').value,
        $('login-password').value
      );
      if (result.ok) {
        showApp();
        LocketUI?.toast?.(`Chào mừng ${result.user.name}! ✦`);
      } else {
        showError('login-error', result.error);
      }
    });

    $('form-register')?.addEventListener('submit', e => {
      e.preventDefault();
      clearErrors();
      const result = LocketAuth.userRegister(
        $('register-name').value,
        $('register-email').value,
        $('register-password').value,
        $('register-confirm').value
      );
      if (result.ok) {
        showApp();
        LocketUI?.toast?.(`Đăng ký thành công! Chào ${result.user.name} ✦`);
      } else {
        showError('register-error', result.error);
      }
    });

    $('btn-logout')?.addEventListener('click', handleLogout);

    // Khôi phục session hoặc hiện màn đăng nhập
    const user = LocketAuth.restoreUserSession();
    if (user) {
      showApp();
    } else {
      showAuth('login');
    }
  }

  function handleLogout() {
    LocketCamera.onTabLeave?.();
    LocketAuth.userLogout();
    LocketUI.closeAllModals?.();

    ['login-email', 'login-password', 'register-name', 'register-email',
     'register-password', 'register-confirm'].forEach(id => {
      const el = $(id);
      if (el) el.value = '';
    });

    showAuth('login');
    LocketUI?.toast?.('Đã đăng xuất');
  }

  return { init, showAuth, showApp, handleLogout };
})();