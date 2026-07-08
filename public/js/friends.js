/**
 * friends.js — Friends screen: search, unlimited friends (Gold)
 */

const LocketFriends = (() => {
  let searchQuery = '';

  function init() {
    document.getElementById('friends-search')?.addEventListener('input', e => {
      searchQuery = e.target.value.toLowerCase();
      render();
    });

    document.getElementById('btn-add-friend')?.addEventListener('click', () => {
      LocketUI.openModal('modal-add-friend');
      document.getElementById('new-friend-name').value = '';
    });

    document.getElementById('btn-confirm-add-friend')?.addEventListener('click', () => {
      const name = document.getElementById('new-friend-name').value.trim();
      if (!name) { LocketUI.toast('Nhập tên bạn bè'); return; }
      LocketState.addFriend(name);
      LocketUI.closeModal('modal-add-friend');
      LocketUI.toast(`Đã thêm ${name} ✦ Unlimited Friends`);
      render();
      LocketCamera.renderFriendScroll();
      LocketCamera.populateRecipientList();
      LocketProfile.render();
      LocketUI.haptic();
    });

    render();
  }

  function render() {
    const state = LocketState.get();
    const list = document.getElementById('friends-list');
    if (!list) return;

    const filtered = state.friends.filter(f =>
      f.name.toLowerCase().includes(searchQuery)
    );

    list.innerHTML = `
      <div class="flex items-center justify-between mb-2 px-1">
        <span class="text-sm text-ios-label">${filtered.length} bạn bè</span>
        <span class="text-[10px] text-gold font-semibold">∞ UNLIMITED</span>
      </div>
      ${filtered.map(f => `
        <div class="friend-row" data-friend="${f.id}">
          <div class="friend-row-avatar gold-border" style="background:${f.color}22;color:${f.color}">${f.avatar}</div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold truncate">${f.name}</p>
            <p class="text-xs text-ios-label">${f.hasNew ? 'Có Locket mới' : 'Bạn bè · Gold'}</p>
          </div>
          ${f.hasNew ? '<span class="w-2.5 h-2.5 rounded-full bg-gold shrink-0"></span>' : ''}
        </div>
      `).join('')}
    `;

    list.querySelectorAll('.friend-row').forEach(row => {
      row.addEventListener('click', () => {
        const locket = state.lockets.find(l => l.senderId === row.dataset.friend);
        if (locket) LocketHistory.openDetail(locket.id);
        else LocketUI.toast('Chưa có Locket từ bạn này');
      });
    });
  }

  return { init, render };
})();