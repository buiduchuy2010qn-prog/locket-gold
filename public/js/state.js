/**
 * state.js — Central state management + localStorage persistence
 * Locket Web Gold Edition
 */

const LocketState = (() => {
  const STORAGE_KEY = 'locket_gold_v1';

  const defaultState = {
    user: { name: 'Bùi Đức Huy', avatar: 'H', isGold: true },
    friends: [
      { id: 'f1', name: 'Minh Anh', avatar: 'M', color: '#FF6B6B', hasNew: true },
      { id: 'f2', name: 'Tuấn Kiệt', avatar: 'T', color: '#4ECDC4', hasNew: false },
      { id: 'f3', name: 'Lan Chi', avatar: 'L', color: '#A78BFA', hasNew: true },
      { id: 'f4', name: 'Đức Phát', avatar: 'Đ', color: '#FBBF24', hasNew: false },
      { id: 'f5', name: 'Hà My', avatar: 'H', color: '#F472B6', hasNew: false },
    ],
    lockets: [], // { id, type:'photo'|'video', dataUrl, caption, senderId, recipientIds, viewers[], createdAt }
    settings: {
      theme: 'classic',
      appIcon: 'gold',
      widgetFrame: 'gold',
      flash: false,
      facingMode: 'user',
      videoDuration: 5,
      sendToAll: true,
      selectedRecipients: [],
    },
    viewers: {}, // locketId -> [{ friendId, viewedAt }]
  };

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...defaultState, ...JSON.parse(raw), user: { ...defaultState.user, ...JSON.parse(raw).user } };
    } catch (_) { /* ignore */ }
    return structuredClone(defaultState);
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) { /* quota */ }
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
    state.friends.push({
      id, name, avatar: name.charAt(0).toUpperCase(),
      color: colors[state.friends.length % colors.length],
      hasNew: false,
    });
    save();
    return id;
  }

  function addLocket({ type, dataUrl, caption, senderId, recipientIds }) {
    const locket = {
      id: 'l' + Date.now(),
      type,
      dataUrl,
      caption: caption || '',
      senderId: senderId || 'me',
      recipientIds: recipientIds || state.friends.map(f => f.id),
      createdAt: new Date().toISOString(),
    };
    state.lockets.unshift(locket);
    state.viewers[locket.id] = [];
    save();
    return locket;
  }

  function addViewer(locketId, friendId) {
    if (!state.viewers[locketId]) state.viewers[locketId] = [];
    const exists = state.viewers[locketId].find(v => v.friendId === friendId);
    if (!exists) {
      state.viewers[locketId].push({ friendId, viewedAt: new Date().toISOString() });
      save();
    }
  }

  function simulateIncomingLocket() {
    const friend = state.friends[Math.floor(Math.random() * state.friends.length)];
    const canvas = document.createElement('canvas');
    canvas.width = 400; canvas.height = 500;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 400, 500);
    grad.addColorStop(0, friend.color);
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 500);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(friend.name, 200, 250);
    ctx.font = '14px system-ui';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(new Date().toLocaleTimeString('vi-VN'), 200, 290);

    const locket = addLocket({
      type: 'photo',
      dataUrl: canvas.toDataURL('image/jpeg', 0.8),
      caption: ['Miss you! 💛', 'Hôm nay vui quá', '✨ Gold moment', ''][Math.floor(Math.random() * 4)],
      senderId: friend.id,
      recipientIds: ['me'],
    });
    friend.hasNew = true;
    save();
    return locket;
  }

  function getFriend(id) {
    if (id === 'me') return { ...state.user, id: 'me' };
    return state.friends.find(f => f.id === id);
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
    get, update, save, addFriend, addLocket, addViewer,
    simulateIncomingLocket, getFriend, groupLocketsByDate,
    getAllViewersForUser, getLatestFriendLocket,
  };
})();