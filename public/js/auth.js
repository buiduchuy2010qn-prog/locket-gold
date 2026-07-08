/**
 * auth.js — Admin authentication (demo, localStorage session)
 */

const LocketAuth = (() => {
  const SESSION_KEY = 'locket_admin_session';
  const ADMIN = {
    email: 'buiduchuy2010qn@gmail.com',
    password: 'duchuy2010',
    name: 'Admin',
  };

  function login(email, password) {
    const e = email.trim().toLowerCase();
    const p = password;
    if (e === ADMIN.email.toLowerCase() && p === ADMIN.password) {
      const session = {
        email: ADMIN.email,
        name: ADMIN.name,
        loggedInAt: new Date().toISOString(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return { ok: true, session };
    }
    return { ok: false, error: 'Email hoặc mật khẩu không đúng' };
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function isLoggedIn() {
    try {
      return !!localStorage.getItem(SESSION_KEY);
    } catch (_) { return false; }
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }

  function requireAdmin() {
    if (!isLoggedIn()) {
      window.location.href = '/admin/';
      return false;
    }
    return true;
  }

  return { login, logout, isLoggedIn, getSession, requireAdmin, ADMIN };
})();