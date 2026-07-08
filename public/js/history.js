/**
 * history.js — History grid, date filter, detail modal, monthly recap
 */

const LocketHistory = (() => {
  let recapInterval = null;
  let activeFilter = 'all';

  const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
  ];

  function init() {
    renderFilters();
    $('btn-monthly-recap')?.addEventListener('click', openMonthlyRecap);
    render();
  }

  function $(id) { return document.getElementById(id); }

  function renderFilters() {
    const wrap = $('history-filters');
    if (!wrap) return;
    wrap.innerHTML = FILTERS.map(f => `
      <button type="button" class="filter-chip ${f.id === activeFilter ? 'active' : ''}" data-filter="${f.id}">${f.label}</button>
    `).join('');

    wrap.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        activeFilter = chip.dataset.filter;
        wrap.querySelectorAll('.filter-chip').forEach(c => c.classList.toggle('active', c === chip));
        render();
        LocketUI.haptic();
      });
    });
  }

  /** Filter lockets by date chip */
  function filterLockets(lockets) {
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now - 86400000).toDateString();
    const weekAgo = now - 7 * 86400000;

    return lockets.filter(l => {
      const d = new Date(l.createdAt);
      switch (activeFilter) {
        case 'today': return d.toDateString() === today;
        case 'yesterday': return d.toDateString() === yesterday;
        case 'week': return d >= weekAgo;
        case 'month': return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        default: return true;
      }
    });
  }

  function render() {
    const container = $('history-content');
    if (!container) return;

    const filtered = filterLockets(LocketState.get().lockets);

    if (!filtered.length) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-56 text-zinc-500 mt-8">
          <i class="fa-solid fa-images text-4xl mb-3 opacity-40"></i>
          <p class="text-sm">${activeFilter === 'all' ? 'Chưa có Locket nào' : 'Không có Locket trong khoảng này'}</p>
        </div>`;
      return;
    }

    const groups = {};
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now - 86400000).toDateString();

    filtered.forEach(l => {
      const d = new Date(l.createdAt);
      const ds = d.toDateString();
      let label;
      if (ds === today) label = 'Today';
      else if (ds === yesterday) label = 'Yesterday';
      else if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) label = 'This Month';
      else label = d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long' });

      if (!groups[label]) groups[label] = [];
      groups[label].push(l);
    });

    container.innerHTML = Object.keys(groups).map(label => `
      <h3 class="history-section-title">${label}</h3>
      <div class="history-grid">${groups[label].map(l => historyItemHTML(l)).join('')}</div>
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
          ? `<video src="${l.dataUrl}" muted></video><span class="video-badge"><i class="fa-solid fa-play"></i></span>`
          : `<img src="${l.dataUrl}" alt="" loading="lazy">`}
      </div>`;
  }

  function openDetail(id) {
    const locket = LocketState.get().lockets.find(l => l.id === id);
    if (!locket) return;

    const sender = LocketState.getFriend(locket.senderId);
    const img = $('detail-img');
    const vid = $('detail-video');
    img.classList.add('hidden');
    vid.classList.add('hidden');

    if (locket.type === 'video') {
      vid.src = locket.dataUrl; vid.classList.remove('hidden'); vid.play();
    } else {
      img.src = locket.dataUrl; img.classList.remove('hidden');
    }

    $('detail-caption').textContent = locket.caption || '(Không có caption)';
    $('detail-meta').textContent = `${sender?.name || '?'} · ${new Date(locket.createdAt).toLocaleString('vi-VN')}`;

    const viewers = LocketState.get().viewers[locket.id] || [];
    const viewersEl = $('detail-viewers');
    if (locket.senderId === 'me' && viewers.length) {
      viewersEl.innerHTML = `
        <p class="text-xs text-gold font-bold mb-2">✦ Who Viewed</p>
        ${viewers.map(v => {
          const f = LocketState.getFriend(v.friendId);
          return `<div class="viewer-row">
            <div class="viewer-avatar" style="color:${f?.color}">${f?.avatar || '?'}</div>
            <div><p class="text-sm font-medium">${f?.name}</p>
            <p class="text-[10px] text-zinc-500">${new Date(v.viewedAt).toLocaleString('vi-VN')}</p></div>
          </div>`;
        }).join('')}`;
    } else {
      viewersEl.innerHTML = locket.senderId === 'me' ? '<p class="text-xs text-zinc-500">Chưa ai xem</p>' : '';
    }

    if (locket.senderId !== 'me') {
      const friend = LocketState.getFriend(locket.senderId);
      if (friend) { friend.hasNew = false; LocketState.save(); }
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

    if (!lockets.length) { LocketUI.toast('Chưa có Locket trong tháng này'); return; }

    const slides = $('recap-slides');
    slides.innerHTML = lockets.slice(0, 15).map((l, i) => `
      <div class="recap-slide ${i === 0 ? 'active' : ''}"><img src="${l.dataUrl}" alt=""></div>
    `).join('');

    $('recap-month').textContent = new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
    LocketUI.openModal('modal-recap');

    let idx = 0;
    const allSlides = slides.querySelectorAll('.recap-slide');
    clearInterval(recapInterval);
    recapInterval = setInterval(() => {
      allSlides[idx]?.classList.remove('active');
      idx = (idx + 1) % allSlides.length;
      allSlides[idx]?.classList.add('active');
    }, 1800);
  }

  return { init, render, openDetail };
})();