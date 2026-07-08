/**
 * state.js — Central state + localStorage
 * Locket Web - Gold Edition (with Admin data)
 */

const LocketState = (() => {
  const STORAGE_KEY = 'locket_gold_v3';

  const defaultState = {
    user: { id: 'u1', name: 'Bùi Đức Huy', email: 'buiduchuy2010qn@gmail.com', avatar: 'H', isGold: true },
    friends: [
      { id: 'f1', name: 'Minh Anh', avatar: 'M', color: '#FF6B6B', hasNew: true },
      { id: 'f2', name: 'Tuấn Kiệt', avatar: 'T', color: '#4ECDC4', hasNew: false },
      { id: 'f3', name: 'Lan Chi', avatar: 'L', color: '#A78BFA', hasNew: true },
      { id: 'f4', name: 'Đức Phát', avatar: 'Đ', color: '#FBBF24', hasNew: false },
      { id: 'f5', name: 'Hà My', avatar: 'H', color: '#F472B6', hasNew: false },
    ],
    // Demo users for Admin panel
    users: [
      { id: 'u1', name: 'Bùi Đức Huy', email: 'buiduchuy2010qn@gmail.com', avatar: 'H', isGold: true, isBanned: false, joinedAt: '2025-01-15T08:00:00Z', password: null },
      { id: 'u2', name: 'Minh Anh', email: 'minhanh@gmail.com', avatar: 'M', isGold: true, isBanned: false, joinedAt: '2025-03-02T10:00:00Z' },
      { id: 'u3', name: 'Tuấn Kiệt', email: 'tuankiet@gmail.com', avatar: 'T', isGold: false, isBanned: false, joinedAt: '2025-04-10T12:00:00Z' },
      { id: 'u4', name: 'Lan Chi', email: 'lanchi@gmail.com', avatar: 'L', isGold: true, isBanned: false, joinedAt: '2025-05-20T09:00:00Z' },
      { id: 'u5', name: 'Đức Phát', email: 'ducphat@gmail.com', avatar: 'Đ', isGold: false, isBanned: true, joinedAt: '2025-06-01T14:00:00Z' },
      { id: 'u6', name: 'Hà My', email: 'hamy@gmail.com', avatar: 'H', isGold: false, isBanned: false, joinedAt: '2025-07-01T11:00:00Z' },
      { id: 'u7', name: 'Quốc Bảo', email: 'quocbao@gmail.com', avatar: 'Q', isGold: true, isBanned: false, joinedAt: '2026-01-10T08:00:00Z' },
      { id: 'u8', name: 'Thanh Tâm', email: 'thanhtam@gmail.com', avatar: 'T', isGold: false, isBanned: false, joinedAt: '2026-02-14T16:00:00Z' },
    ],
    lockets: [],
    viewers: {},
    settings: {
      theme: 'classic', appIcon: 'gold', widgetFrame: 'gold',
      flash: false, facingMode: 'user', sendToAll: true, selectedRecipients: [],
    },
    adminSettings: {
      banner: '✦ Locket Gold Edition — Chia sẻ khoảnh khắc không giới hạn',
      systemNotification: 'Chào mừng đến Locket Web Gold!',
    },
  };

  let state = load();

  function load() {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      // Migrate v2 → v3
      if (!raw) {
        const legacy = localStorage.getItem('locket_gold_v2');
        if (legacy) {
          localStorage.setItem(STORAGE_KEY, legacy);
          raw = legacy;
        }
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...defaultState, ...parsed,
          user: { ...defaultState.user, ...parsed.user },
          adminSettings: { ...defaultState.adminSettings, ...parsed.adminSettings },
          users: parsed.users?.length ? parsed.users : defaultState.users,
        };
      }
    } catch (_) { /* ignore */ }
    return JSON.parse(JSON.stringify(defaultState));
  }

  function findUserByEmail(email) {
    const e = email.trim().toLowerCase();
    return state.users.find(u => u.email.toLowerCase() === e);
  }

  function findUserById(id) {
    return state.users.find(u => u.id === id);
  }

  function setActiveUser(user) {
    state.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || user.name.charAt(0).toUpperCase(),
      isGold: user.isGold !== false,
    };
    save();
    return state.user;
  }

  function setUserPassword(userId, passwordHash) {
    const u = state.users.find(x => x.id === userId);
    if (u) {
      u.password = passwordHash;
      save();
    }
  }

  function registerUser({ name, email, passwordHash }) {
    const id = 'u' + Date.now();
    const user = {
      id,
      name,
      email: email.toLowerCase(),
      password: passwordHash,
      avatar: name.charAt(0).toUpperCase(),
      isGold: true,
      isBanned: false,
      joinedAt: new Date().toISOString(),
    };
    state.users.push(user);
    setActiveUser(user);
    return user;
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { /* quota */ }
  }

  function get() { return state; }

  function update(path, value) {
    const keys = path.split('.');
    let obj = state;
    for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
    obj[keys[keys.length - 1]] = value;
    save();
    return state;
  }

  function addFriend(name) {
    const id = 'f' + Date.now();
    const colors = ['#FF6B6B', '#4ECDC4', '#A78BFA', '#FBBF24', '#F472B6', '#34D399'];
    state.friends.push({ id, name, avatar: name.charAt(0).toUpperCase(), color: colors[state.friends.length % colors.length], hasNew: false });
    save();
    return id;
  }

  function addLocket({ type, dataUrl, caption, senderId, recipientIds }) {
    const locket = {
      id: 'l' + Date.now(), type, dataUrl,
      caption: caption || '', senderId: senderId || 'me',
      recipientIds: recipientIds || state.friends.map(f => f.id),
      createdAt: new Date().toISOString(),
    };
    state.lockets.unshift(locket);
    state.viewers[locket.id] = [];
    save();
    return locket;
  }

  function deleteLocket(id) {
    state.lockets = state.lockets.filter(l => l.id !== id);
    delete state.viewers[id];
    save();
  }

  function addViewer(locketId, friendId) {
    if (!state.viewers[locketId]) state.viewers[locketId] = [];
    if (!state.viewers[locketId].find(v => v.friendId === friendId)) {
      state.viewers[locketId].push({ friendId, viewedAt: new Date().toISOString() });
      save();
    }
  }

  function toggleBanUser(userId) {
    const u = state.users.find(x => x.id === userId);
    if (u) { u.isBanned = !u.isBanned; save(); }
    return u;
  }

  function toggleGoldUser(userId) {
    const u = state.users.find(x => x.id === userId);
    if (u) { u.isGold = !u.isGold; save(); }
    return u;
  }

  function getStats() {
    const today = new Date().toDateString();
    const todayLockets = state.lockets.filter(l => new Date(l.createdAt).toDateString() === today);
    return {
      totalUsers: state.users.length,
      activeUsers: state.users.filter(u => !u.isBanned).length,
      goldUsers: state.users.filter(u => u.isGold).length,
      bannedUsers: state.users.filter(u => u.isBanned).length,
      totalLockets: state.lockets.length,
      todayLockets: todayLockets.length,
      todayPhotos: todayLockets.filter(l => l.type === 'photo').length,
      todayVideos: todayLockets.filter(l => l.type === 'video').length,
      totalVideos: state.lockets.filter(l => l.type === 'video').length,
    };
  }

  function simulateIncomingLocket() {
    const friend = state.friends[Math.floor(Math.random() * state.friends.length)];
    const canvas = document.createElement('canvas');
    canvas.width = 400; canvas.height = 500;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 400, 500);
    grad.addColorStop(0, friend.color); grad.addColorStop(1, '#000');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 400, 500);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 32px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(friend.name, 200, 250);
    const locket = addLocket({
      type: 'photo', dataUrl: canvas.toDataURL('image/jpeg', 0.8),
      caption: ['Miss you! 💛', 'Hôm nay vui quá', '✨ Gold moment', ''][Math.floor(Math.random() * 4)],
      senderId: friend.id, recipientIds: ['me'],
    });
    friend.hasNew = true; save();
    return locket;
  }

  function getFriend(id) {
    if (id === 'me') return { ...state.user, id: 'me' };
    return state.friends.find(f => f.id === id);
  }

  function getUserById(id) {
    if (id === 'me') return state.users.find(u => u.email === state.user.email) || state.users[0];
    const friend = state.friends.find(f => f.id === id);
    if (friend) return state.users.find(u => u.name === friend.name);
    return state.users.find(u => u.id === id);
  }

  function groupLocketsByDate() {
    const groups = {};
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now - 86400000).toDateString();
    state.lockets.forEach(l => {
      const d = new Date(l.createdAt);
      const ds = d.toDateString();
      let label;
      if (ds === today) label = 'Today';
      else if (ds === yesterday) label = 'Yesterday';
      else if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) label = 'This Month';
      else label = d.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
      if (!groups[label]) groups[label] = [];
      groups[label].push(l);
    });
    return groups;
  }

  function getAllViewersForUser() {
    const result = [];
    state.lockets.filter(l => l.senderId === 'me').forEach(l => {
      (state.viewers[l.id] || []).forEach(v => {
        const friend = getFriend(v.friendId);
        if (friend) result.push({ ...v, friend, locket: l });
      });
    });
    return result.sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt));
  }

  function getLatestFriendLocket() {
    return state.lockets.find(l => l.senderId !== 'me') || null;
  }

  return {
    get, update, save, addFriend, addLocket, deleteLocket, addViewer,
    toggleBanUser, toggleGoldUser, getStats,
    simulateIncomingLocket, getFriend, getUserById, groupLocketsByDate,
    getAllViewersForUser, getLatestFriendLocket,
    findUserByEmail, findUserById, setActiveUser, setUserPassword, registerUser,
  };
})();