/**
 * widget.js — iPhone widget preview + custom frames (Gold)
 */

const LocketWidget = (() => {
  const FRAMES = [
    { id: 'gold', label: '✦', class: 'frame-gold' },
    { id: 'classic', label: '◻', class: 'frame-classic' },
    { id: 'neon', label: '💗', class: 'frame-neon' },
    { id: 'minimal', label: '○', class: 'frame-minimal' },
    { id: 'polaroid', label: '📷', class: 'frame-polaroid' },
  ];

  function init() {
    renderFramePicker();

    document.getElementById('widget-preview')?.addEventListener('click', () => {
      LocketUI.switchTab('camera', window.LocketApp?.onTabChange);
      LocketUI.toast('Mở Camera từ Widget');
      LocketUI.haptic();
    });

    document.getElementById('widget-preview')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('widget-preview').click();
    });

    update();
  }

  function renderFramePicker() {
    const picker = document.getElementById('frame-picker');
    const current = LocketState.get().settings.widgetFrame;

    picker.innerHTML = FRAMES.map(f => `
      <button class="frame-option ${f.id === current ? 'active' : ''}" data-frame="${f.id}" title="${f.id}">
        ${f.label}
      </button>
    `).join('');

    picker.querySelectorAll('.frame-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.frame;
        LocketState.update('settings.widgetFrame', id);
        picker.querySelectorAll('.frame-option').forEach(b => b.classList.toggle('active', b === btn));
        applyFrame(id);
        LocketUI.toast('✦ Widget frame updated');
        LocketUI.haptic();
      });
    });

    applyFrame(current);
  }

  function applyFrame(id) {
    const frame = FRAMES.find(f => f.id === id) || FRAMES[0];
    const inner = document.getElementById('widget-frame');
    FRAMES.forEach(f => inner.classList.remove(f.class));
    inner.classList.add(frame.class);
  }

  function update() {
    const locket = LocketState.getLatestFriendLocket();
    const img = document.getElementById('widget-image');
    const empty = document.getElementById('widget-empty');
    const label = document.getElementById('widget-friend-name');

    if (locket) {
      const friend = LocketState.getFriend(locket.senderId);
      img.src = locket.dataUrl;
      img.classList.add('visible');
      empty.classList.add('hidden');
      label.textContent = friend?.name?.split(' ').pop() || '';
    } else {
      img.classList.remove('visible');
      empty.classList.remove('hidden');
      label.textContent = '';
    }

    applyFrame(LocketState.get().settings.widgetFrame);
  }

  return { init, update };
})();