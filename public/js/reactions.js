/**
 * reactions.js — Emoji reactions with rain animation (Gold)
 */

const LocketReactions = (() => {
  function init() {
    document.querySelectorAll('.reaction-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const emoji = btn.dataset.emoji;
        rain(emoji);
        LocketUI.toast(`Đã gửi ${emoji}`);
        LocketUI.haptic();
      });
    });
  }

  function rain(emoji, count = 24) {
    const container = document.getElementById('emoji-rain');
    if (!container) return;

    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      el.className = 'emoji-particle';
      el.textContent = emoji;
      el.style.left = Math.random() * 100 + '%';
      el.style.animationDuration = (2 + Math.random() * 2) + 's';
      el.style.animationDelay = (Math.random() * 0.8) + 's';
      el.style.fontSize = (20 + Math.random() * 20) + 'px';
      container.appendChild(el);
      setTimeout(() => el.remove(), 4500);
    }
  }

  return { init, rain };
})();