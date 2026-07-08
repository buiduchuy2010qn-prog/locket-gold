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

  function rain(emoji, count = 28) {
    const container = document.getElementById('emoji-rain');
    if (!container) return;

    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      el.className = 'emoji-particle';
      el.textContent = emoji;
      el.style.left = Math.random() * 100 + '%';
      el.style.animationDuration = (1.8 + Math.random() * 2.5) + 's';
      el.style.animationDelay = (Math.random() * 1) + 's';
      el.style.fontSize = (18 + Math.random() * 24) + 'px';
      container.appendChild(el);
      setTimeout(() => el.remove(), 5000);
    }
  }

  return { init, rain };
})();