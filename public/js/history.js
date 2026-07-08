/**
 * history.js — History grid, date groups, detail modal, monthly recap
 */

const LocketHistory = (() => {
  let recapInterval = null;

  function init() {
    document.getElementById('btn-monthly-recap')?.addEventListener('click', openMonthlyRecap);
    render();
  }

  function render() {
    const container = document.getElementById('history-content');
    if (!container) return;

    const groups = LocketState.groupLocketsByDate();
    const keys = Object.keys(groups);

    if (!keys.length) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-64 text-ios-label">
          <span class="text-4xl mb-3">📸</span>
          <p class="text-sm">Chưa có Locket nào</p>
          <p class="text-xs mt-1">Chụp ảnh từ tab Camera</p>
        </div>`;
      return;
    }

    container.innerHTML = keys.map(label => `
      <h3 class="history-section-title">${label}</h3>
      <div class="history-grid">
        ${groups[label].map(l => historyItemHTML(l)).join('')}
      </div>
    `).join('');

    container.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => openDetail(item.dataset.id));
    });
  }

  function historyItemHTML(l) {
    const isVideo = l.type === 'video';
    return `
      <div class="history-item" data-id="${l.id}">
        ${isVideo
          ? `<video src="${l.dataUrl}" muted></video><span class="video-badge">▶</span>`
          : `<img src="${l.dataUrl}" alt="" loading="lazy">`}
      </div>`;
  }

  function openDetail(id) {
    const locket = LocketState.get().lockets.find(l => l.id === id);
    if (!locket) return;

    const sender = LocketState.getFriend(locket.senderId);
    const img = document.getElementById('detail-img');
    const vid = document.getElementById('detail-video');

    img.classList.add('hidden');
    vid.classList.add('hidden');

    if (locket.type === 'video') {
      vid.src = locket.dataUrl;
      vid.classList.remove('hidden');
      vid.play();
    } else {
      img.src = locket.dataUrl;
      img.classList.remove('hidden');
    }

    document.getElementById('detail-caption').textContent = locket.caption || '(Không có caption)';
    document.getElementById('detail-meta').textContent =
      `${sender?.name || 'Unknown'} · ${new Date(locket.createdAt).toLocaleString('vi-VN')}`;

    // Who viewed (Gold)
    const viewers = LocketState.get().viewers[locket.id] || [];
    const viewersEl = document.getElementById('detail-viewers');
    if (locket.senderId === 'me' && viewers.length) {
      viewersEl.innerHTML = `
        <p class="text-xs text-gold font-semibold mb-2 mt-2">✦ Who Viewed</p>
        ${viewers.map(v => {
          const f = LocketState.getFriend(v.friendId);
          return `<div class="viewer-row">
            <div class="viewer-avatar" style="color:${f?.color}">${f?.avatar || '?'}</div>
            <div><p class="text-sm font-medium">${f?.name}</p>
            <p class="text-[10px] text-ios-label">${new Date(v.viewedAt).toLocaleString('vi-VN')}</p></div>
          </div>`;
        }).join('')}`;
    } else {
      viewersEl.innerHTML = locket.senderId === 'me'
        ? '<p class="text-xs text-ios-label mt-2">Chưa ai xem</p>'
        : '';
    }

    // Mark as viewed if incoming
    if (locket.senderId !== 'me') {
      const friend = LocketState.getFriend(locket.senderId);
      if (friend) friend.hasNew = false;
      LocketState.save();
      LocketCamera.renderFriendScroll();
    }

    LocketUI.openModal('modal-detail');
  }

  function openMonthlyRecap() {
    const lockets = LocketState.get().lockets.filter(l => {
      const d = new Date(l.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    if (!lockets.length) {
      LocketUI.toast('Chưa có Locket nào trong tháng này');
      return;
    }

    const slides = document.getElementById('recap-slides');
    slides.innerHTML = lockets.slice(0, 12).map((l, i) => `
      <div class="recap-slide ${i === 0 ? 'active' : ''}">
        <img src="${l.dataUrl}" alt="">
      </div>
    `).join('');

    document.getElementById('recap-month').textContent =
      new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

    LocketUI.openModal('modal-recap');
    let idx = 0;
    const allSlides = slides.querySelectorAll('.recap-slide');
    clearInterval(recapInterval);
    recapInterval = setInterval(() => {
      allSlides[idx]?.classList.remove('active');
      idx = (idx + 1) % allSlides.length;
      allSlides[idx]?.classList.add('active');
    }, 2000);
  }

  return { init, render, openDetail };
})();