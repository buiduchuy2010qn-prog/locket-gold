/**
 * camera.js — Camera screen
 * - Live preview + sample image fallback
 * - Photo capture with shutter animation
 * - Video recording up to 60s with REC overlay + countdown 00:00 / 01:00
 * - Camera Roll upload (Gold)
 * - Emoji rain on send
 */

const LocketCamera = (() => {
  const MAX_VIDEO_SEC = 60;

  let stream = null;
  let mode = 'photo';
  let facingMode = 'user';
  let usingSample = false;
  let mediaRecorder = null;
  let recordChunks = [];
  let recordTimer = null;
  let recordTick = null;
  let recordSeconds = 0;
  let captureData = null;

  const els = {};

  function $(id) { return document.getElementById(id); }

  function cacheEls() {
    ['camera-video', 'camera-sample', 'capture-preview', 'preview-media-img', 'preview-media-video',
     'caption-input', 'caption-count', 'btn-shutter', 'btn-flash', 'btn-flip',
     'btn-retake', 'btn-send', 'btn-recipients', 'library-input', 'flash-overlay',
     'rec-overlay', 'rec-timer', 'camera-friends-scroll'
    ].forEach(id => { els[id] = $(id); });
  }

  /** Format seconds as MM:SS */
  function fmtTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  /** Try live camera; fall back to sample image */
  async function startCamera() {
    try {
      if (stream) stopCamera();
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      els['camera-video'].srcObject = stream;
      els['camera-video'].classList.remove('hidden');
      els['camera-sample'].classList.add('hidden');
      usingSample = false;
    } catch (_) {
      usingSample = true;
      els['camera-video'].classList.add('hidden');
      els['camera-sample'].classList.remove('hidden');
    }
  }

  function stopCamera() {
    stream?.getTracks().forEach(t => t.stop());
    stream = null;
    if (els['camera-video']) els['camera-video'].srcObject = null;
  }

  function renderFriendScroll() {
    const container = els['camera-friends-scroll'];
    if (!container) return;
    container.innerHTML = LocketState.get().friends.map(f => `
      <button class="friend-avatar-btn" data-friend="${f.id}" type="button">
        <div class="friend-avatar-ring ${f.hasNew ? 'has-new' : ''}">
          <div class="avatar-placeholder" style="color:${f.color}">${f.avatar}</div>
        </div>
        <span class="friend-avatar-name">${f.name.split(' ').pop()}</span>
      </button>
    `).join('');

    container.querySelectorAll('.friend-avatar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const friend = LocketState.getFriend(btn.dataset.friend);
        if (friend?.hasNew) {
          const locket = LocketState.get().lockets.find(l => l.senderId === friend.id);
          if (locket) LocketHistory.openDetail(locket.id);
        }
      });
    });
  }

  function init() {
    cacheEls();
    renderFriendScroll();

    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        mode = btn.dataset.mode;
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b === btn));
        els['btn-shutter'].classList.toggle('video-mode', mode === 'video');
        if (LocketUI.getActiveTab() === 'camera' && !usingSample) startCamera();
      });
    });

    els['btn-flash']?.addEventListener('click', () => {
      const on = !LocketState.get().settings.flash;
      LocketState.update('settings.flash', on);
      els['btn-flash'].classList.toggle('active', on);
      LocketUI.haptic();
    });

    els['btn-flip']?.addEventListener('click', async () => {
      facingMode = facingMode === 'user' ? 'environment' : 'user';
      LocketState.update('settings.facingMode', facingMode);
      await startCamera();
      LocketUI.haptic();
    });

    els['btn-shutter']?.addEventListener('click', handleShutter);
    els['library-input']?.addEventListener('change', handleLibraryUpload);

    els['caption-input']?.addEventListener('input', () => {
      els['caption-count'].textContent = `${els['caption-input'].value.length}/300`;
    });

    els['btn-retake']?.addEventListener('click', hidePreview);
    els['btn-send']?.addEventListener('click', sendLocket);
    els['btn-recipients']?.addEventListener('click', () => LocketUI.openModal('modal-recipients'));

    $('btn-confirm-recipients')?.addEventListener('click', () => {
      const all = document.querySelector('input[name="recipient"][value="all"]')?.checked;
      LocketState.update('settings.sendToAll', all);
      if (!all) {
        const selected = [...document.querySelectorAll('#recipient-list input:checked')].map(i => i.value);
        LocketState.update('settings.selectedRecipients', selected);
      }
      updateRecipientLabel();
      LocketUI.closeModal('modal-recipients');
    });

    populateRecipientList();
    updateRecipientLabel();
  }

  function populateRecipientList() {
    const list = $('recipient-list');
    if (!list) return;
    list.innerHTML = LocketState.get().friends.map(f => `
      <label class="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
        <input type="checkbox" value="${f.id}" class="recipient-check accent-yellow-400">
        <span>${f.name}</span>
      </label>
    `).join('');
  }

  function updateRecipientLabel() {
    const s = LocketState.get().settings;
    if (!els['btn-recipients']) return;
    els['btn-recipients'].textContent = s.sendToAll
      ? 'Gửi cho: Tất cả bạn bè ▾'
      : `Gửi cho: ${s.selectedRecipients.length} người ▾`;
  }

  async function handleShutter() {
    LocketUI.haptic();
    if (mode === 'photo') capturePhoto();
    else toggleVideoRecord();
  }

  /** Shutter snap animation */
  function animateShutter() {
    const btn = els['btn-shutter'];
    btn.classList.add('snap');
    setTimeout(() => btn.classList.remove('snap'), 350);
  }

  function capturePhoto() {
    animateShutter();

    if (LocketState.get().settings.flash) {
      els['flash-overlay'].classList.add('flash-active');
      setTimeout(() => els['flash-overlay'].classList.remove('flash-active'), 280);
    }

    let dataUrl;
    if (usingSample) {
      dataUrl = els['camera-sample'].src;
    } else {
      const video = els['camera-video'];
      if (!video.videoWidth) { LocketUI.toast('Camera chưa sẵn sàng'); return; }
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    }

    captureData = { type: 'photo', dataUrl };
    showPreview(dataUrl, 'photo');
  }

  function toggleVideoRecord() {
    const btn = els['btn-shutter'];

    if (mediaRecorder?.state === 'recording') {
      stopRecording();
      return;
    }

    if (usingSample) {
      LocketUI.toast('Cần camera thật để quay video. Dùng Upload Library (Gold).');
      return;
    }
    if (!stream) { LocketUI.toast('Camera chưa sẵn sàng'); return; }

    recordChunks = [];
    recordSeconds = 0;
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';

    mediaRecorder = new MediaRecorder(stream, { mimeType: mime });
    mediaRecorder.ondataavailable = e => { if (e.data.size) recordChunks.push(e.data); };
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordChunks, { type: mime });
      captureData = { type: 'video', dataUrl: URL.createObjectURL(blob) };
      showPreview(captureData.dataUrl, 'video');
      hideRecUI();
    };

    mediaRecorder.start(200);
    btn.classList.add('recording');
    els['rec-overlay'].classList.remove('hidden');
    updateRecTimer();

    recordTick = setInterval(() => {
      recordSeconds++;
      updateRecTimer();
      if (recordSeconds >= MAX_VIDEO_SEC) stopRecording();
    }, 1000);
  }

  function updateRecTimer() {
    if (els['rec-timer']) {
      els['rec-timer'].textContent = `${fmtTime(recordSeconds)} / ${fmtTime(MAX_VIDEO_SEC)}`;
    }
  }

  function stopRecording() {
    clearInterval(recordTick);
    recordTick = null;
    if (mediaRecorder?.state === 'recording') mediaRecorder.stop();
    els['btn-shutter']?.classList.remove('recording');
  }

  function hideRecUI() {
    els['rec-overlay']?.classList.add('hidden');
    recordSeconds = 0;
    updateRecTimer();
  }

  function handleLibraryUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = () => {
      captureData = { type: isVideo ? 'video' : 'photo', dataUrl: reader.result };
      showPreview(reader.result, isVideo ? 'video' : 'photo');
      LocketUI.toast('✦ Đã tải từ Camera Roll (Gold)');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function showPreview(url, type) {
    const img = els['preview-media-img'];
    const vid = els['preview-media-video'];
    img.classList.add('hidden');
    vid.classList.add('hidden');
    if (type === 'video') {
      vid.src = url; vid.classList.remove('hidden'); vid.play();
    } else {
      img.src = url; img.classList.remove('hidden');
    }
    els['capture-preview'].classList.remove('hidden');
    els['caption-input'].value = '';
    els['caption-count'].textContent = '0/300';
  }

  function hidePreview() {
    els['capture-preview'].classList.add('hidden');
    captureData = null;
    els['preview-media-video']?.pause();
  }

  function sendLocket() {
    if (!captureData) return;
    const settings = LocketState.get().settings;
    const recipients = settings.sendToAll
      ? LocketState.get().friends.map(f => f.id)
      : settings.selectedRecipients;

    if (!recipients.length) {
      LocketUI.toast('Chọn ít nhất 1 người nhận');
      return;
    }

    const locket = LocketState.addLocket({
      type: captureData.type,
      dataUrl: captureData.dataUrl,
      caption: els['caption-input'].value.trim(),
      senderId: 'me',
      recipientIds: recipients,
    });

    recipients.forEach((fid, i) => {
      setTimeout(() => LocketState.addViewer(locket.id, fid), 1500 + i * 1200);
    });

    hidePreview();

    // Emoji rain on send ✦
    const emojis = ['💛', '✨', '📸', '💫', '❤️'];
    emojis.forEach((em, i) => {
      setTimeout(() => LocketReactions.rain(em, 12), i * 200);
    });

    LocketUI.toast('Locket sent! ✦');
    LocketUI.haptic();
    LocketHistory.render();
    LocketWidget.update();
    renderFriendScroll();
  }

  function onTabActive() {
    startCamera();
    renderFriendScroll();
  }

  function onTabLeave() {
    stopCamera();
    hidePreview();
    if (mediaRecorder?.state === 'recording') stopRecording();
    hideRecUI();
    els['btn-shutter']?.classList.remove('recording');
  }

  return { init, onTabActive, onTabLeave, renderFriendScroll, populateRecipientList };
})();