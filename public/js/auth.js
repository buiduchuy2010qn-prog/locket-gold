/**
 * auth.js — User + Admin authentication (localStorage session)
 * Locket Web - Gold Edition
 */

const LocketAuth = (() => {
  const USER_SESSION_KEY = 'locket_user_session';
  const ADMIN_SESSION_KEY = 'locket_admin_session';

  const ADMIN = {
    email: 'buiduchuy2010qn@gmail.com',
    password: 'duchuy2010',
    name: 'Admin',
  };

  /** Demo password hash — không dùng cho production */
  function hashPassword(password) {
    return btoa(unescape(encodeURIComponent(`${password}:locket_gold_salt`)));
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  // ─── User auth ───

  function userRegister(name, email, password, confirmPassword) {
    const displayName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!displayName || displayName.length < 2) {
      return { ok: false, error: 'Tên hiển thị phải có ít nhất 2 ký tự' };
    }
    if (!validateEmail(normalizedEmail)) {
      return { ok: false, error: 'Email không hợp lệ' };
    }
    if (!password || password.length < 6) {
      return { ok: false, error: 'Mật khẩu phải có ít nhất 6 ký tự' };
    }
    if (password !== confirmPassword) {
      return { ok: false, error: 'Mật khẩu xác nhận không khớp' };
    }
    if (LocketState.findUserByEmail(normalizedEmail)) {
      return { ok: false, error: 'Email đã được đăng ký' };
    }

    const user = LocketState.registerUser({
      name: displayName,
      email: normalizedEmail,
      passwordHash: hashPassword(password),
    });

    const session = createUserSession(user);
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
    return { ok: true, session, user };
  }

  function userLogin(email, password) {
    const normalizedEmail = email.trim().toLowerCase();

    if (!validateEmail(normalizedEmail)) {
      return { ok: false, error: 'Email không hợp lệ' };
    }
    if (!password) {
      return { ok: false, error: 'Vui lòng nhập mật khẩu' };
    }

    const user = LocketState.findUserByEmail(normalizedEmail);
    if (!user) {
      return { ok: false, error: 'Email hoặc mật khẩu không đúng' };
    }
    if (user.isBanned) {
      return { ok: false, error: 'Tài khoản đã bị khóa. Liên hệ Admin.' };
    }

    const storedHash = user.password || hashPassword(ADMIN.password);
    const inputHash = hashPassword(password);

    // Admin default account
    const isAdminAccount = normalizedEmail === ADMIN.email.toLowerCase();
    const passwordOk = user.password
      ? user.password === inputHash
      : isAdminAccount && password === ADMIN.password;

    if (!passwordOk) {
      return { ok: false, error: 'Email hoặc mật khẩu không đúng' };
    }

    // Migrate legacy admin user without stored password
    if (!user.password && isAdminAccount) {
      LocketState.setUserPassword(user.id, hashPassword(ADMIN.password));
    }

    LocketState.setActiveUser(user);
    const session = createUserSession(user);
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
    return { ok: true, session, user };
  }

  function createUserSession(user) {
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      loggedInAt: new Date().toISOString(),
    };
  }

  function userLogout() {
    localStorage.removeItem(USER_SESSION_KEY);
  }

  function isUserLoggedIn() {
    try {
      return !!localStorage.getItem(USER_SESSION_KEY);
    } catch (_) {
      return false;
    }
  }

  function getUserSession() {
    try {
      const raw = localStorage.getItem(USER_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  /** Khôi phục user từ session khi reload trang */
  function restoreUserSession() {
    const session = getUserSession();
    if (!session?.userId) return null;

    const user = LocketState.findUserById(session.userId);
    if (!user || user.isBanned) {
      userLogout();
      return null;
    }

    LocketState.setActiveUser(user);
    return user;
  }

  // ─── Admin auth ───

  function adminLogin(email, password) {
    const e = email.trim().toLowerCase();
    if (e === ADMIN.email.toLowerCase() && password === ADMIN.password) {
      const session = {
        email: ADMIN.email,
        name: ADMIN.name,
        loggedInAt: new Date().toISOString(),
      };
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      return { ok: true, session };
    }
    return { ok: false, error: 'Email hoặc mật khẩu Admin không đúng' };
  }

  function adminLogout() {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }

  function isAdminLoggedIn() {
    try {
      return !!localStorage.getItem(ADMIN_SESSION_KEY);
    } catch (_) {
      return false;
    }
  }

  function getAdminSession() {
    try {
      const raw = localStorage.getItem(ADMIN_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function requireAdmin() {
    if (!isAdminLoggedIn()) {
      window.location.href = '/admin/';
      return false;
    }
    return true;
  }

  return {
    hashPassword,
    userRegister,
    userLogin,
    userLogout,
    isUserLoggedIn,
    getUserSession,
    restoreUserSession,
    adminLogin,
    adminLogout,
    isAdminLoggedIn,
    getAdminSession,
    requireAdmin,
    ADMIN,
    // Aliases cho admin.js
    login: adminLogin,
    logout: adminLogout,
    isLoggedIn: isAdminLoggedIn,
    getSession: getAdminSession,
  };
})();