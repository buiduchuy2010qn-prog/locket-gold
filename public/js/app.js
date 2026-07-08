/**
 * app.js — Main bootstrap
 * Locket Web - Gold Edition
 */

const LocketApp = (() => {
  function onTabChange(tab) {
    if (tab === 'camera') LocketCamera.onTabActive();
    else LocketCamera.onTabLeave();

    if (tab === 'friends') LocketFriends.render();
    if (tab === 'history') LocketHistory.render();
    if (tab === 'profile') {
      LocketProfile.render();
      LocketWidget.update();
    }
  }

  function init() {
    LocketUI.initModalCloses();
    LocketUI.initTabs(onTabChange);

    LocketCamera.init();
    LocketFriends.init();
    LocketHistory.init();
    LocketWidget.init();
    LocketProfile.init();
    LocketReactions.init();

    // Start on camera tab
    LocketCamera.onTabActive();

    // Simulate incoming lockets periodically (demo)
    setInterval(() => {
      if (Math.random() > 0.7) {
        LocketState.simulateIncomingLocket();
        LocketWidget.update();
        LocketCamera.renderFriendScroll();
        if (LocketUI.getActiveTab() === 'history') LocketHistory.render();
      }
    }, 45000);

    // First incoming after 8s for demo
    setTimeout(() => {
      LocketState.simulateIncomingLocket();
      LocketWidget.update();
      LocketCamera.renderFriendScroll();
      LocketUI.toast('Bạn bè vừa gửi Locket mới! ✦');
    }, 8000);

    console.log('Locket Web - Gold Edition ready ✦');
  }

  return { init, onTabChange };
})();

window.LocketApp = LocketApp;
document.addEventListener('DOMContentLoaded', LocketApp.init);