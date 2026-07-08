/**
 * camera.js — Camera, photo/video capture, library upload, send flow
 */

const LocketCamera = (() => {
  let stream = null;
  let mode = 'photo';
  let facingMode = 'user';
  let mediaRecorder = null;
  let recordChunks = [];
  let recordTimer = null;
  let captureData = null; // { type, dataUrl|blob }

  const els = {};

  function cacheEls() {
    ['camera-video', 'capture-preview', 'preview-media-img', 'preview-media-video',
     'caption-input', 'caption-count', 'btn-shutter', 'btn-flash', 'btn-flip',
     'btn-retake', 'btn-send', 'btn-recipients', 'library-input', 'flash-overlay',
     'video-duration-wrap', 'video-duration', 'video-duration-label', 'camera-friends-scroll'
    ].forEach(id => { els[id] = document.getElementById(id); });
  }

  async function startCamera() {
    try {
      if (stream) stopCamera();
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: mode === 'video',
      });
      els['camera-video'].srcObject = stream;
    } catch (err) {
      LocketUI.toast('Không truy cập được camera. Dùng Upload Library (Gold).');
      showPlaceholder();
    }
  }

  function showPlaceholder() {
    const v = els['camera-video'];
    v.style.background = 'linear-gradient(135deg, #1C1C1E, #2C2C2E)';
  }

  function stopCamera() {
    stream?.getTracks().forEach(t => t.stop());
    stream = null;
    els['camera-video'].srcObject = null;
  }

  function renderFriendScroll() {
    const state = LocketState.get();
    const container = els['camera-friends-scroll'];
    container.innerHTML = state.friends.map(f => `
      <button class="friend-avatar-btn" data-friend="${f.id}" type="button">
        <div class="friend-avatar-ring ${f.hasNew ? 'has-new' : ''}">
          <div class="avatar-placeholder" style="background:${f.color}22;color:${f.color}">${f.avatar}</div>
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

    // Mode switch
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        mode = btn.dataset.mode;
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b === btn));
        els['btn-shutter'].classList.toggle('video-mode', mode === 'video');
        els['video-duration-wrap'].classList.toggle('hidden', mode !== 'video');
        if (LocketUI.getActiveTab() === 'camera') startCamera();
      });
    });

    // Video duration
    els['video-duration']?.addEventListener('input', e => {
      const v = e.target.value;
      els['video-duration-label'].textContent = v + 's';
      LocketState.update('settings.videoDuration', parseInt(v, 10));
    });

    // Flash
    els['btn-flash']?.addEventListener('click', () => {
      const on = !LocketState.get().settings.flash;
      LocketState.update('settings.flash', on);
      els['btn-flash'].classList.toggle('active', on);
      LocketUI.haptic();
    });

    // Flip
    els['btn-flip']?.addEventListener('click', async () => {
      facingMode = facingMode === 'user' ? 'environment' : 'user';
      LocketState.update('settings.facingMode', facingMode);
      await startCamera();
      LocketUI.haptic();
    });

    // Shutter
    els['btn-shutter']?.addEventListener('click', handleShutter);

    // Library upload (Gold)
    els['library-input']?.addEventListener('change', handleLibraryUpload);

    // Caption counter
    els['caption-input']?.addEventListener('input', () => {
      els['caption-count'].textContent = `${els['caption-input'].value.length}/300`;
    });

    // Retake / Send
    els['btn-retake']?.addEventListener('click', hidePreview);
    els['btn-send']?.addEventListener('click', sendLocket);
    els['btn-recipients']?.addEventListener('click', () => LocketUI.openModal('modal-recipients'));

    // Recipients confirm
    document.getElementById('btn-confirm-recipients')?.addEventListener('click', () => {
      const all = document.querySelector('input[name="recipient"][value="all"]').checked;
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
    const list = document.getElementById('recipient-list');
    if (!list) return;
    list.innerHTML = LocketState.get().friends.map(f => `
      <label class="flex items-center gap-3 px-4 py-3 border-b border-ios-separator">
        <input type="checkbox" value="${f.id}" class="accent-gold recipient-check">
        <span>${f.name}</span>
      </label>
    `).join('');

    document.querySelector('input[name="recipient"][value="all"]')?.addEventListener('change', e => {
      document.querySelectorAll('.recipient-check').forEach(c => { c.disabled = e.target.checked; });
    });
  }

  function updateRecipientLabel() {
    const s = LocketState.get().settings;
    els['btn-recipients'].textContent = s.sendToAll
      ? 'Gửi cho: Tất cả bạn bè ▾'
      : `Gửi cho: ${s.selectedRecipients.length} người ▾`;
  }

  async function handleShutter() {
    LocketUI.haptic();
    if (mode === 'photo') await capturePhoto();
    else await toggleVideoRecord();
  }

  async function capturePhoto() {
    const video = els['camera-video'];
    if (!video.videoWidth) {
      LocketUI.toast('Camera chưa sẵn sàng');
      return;
    }

    if (LocketState.get().settings.flash) {
      const flash = els['flash-overlay'];
      flash.classList.add('flash-active');
      setTimeout(() => flash.classList.remove('flash-active'), 300);
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    captureData = { type: 'photo', dataUrl };
    showPreview(dataUrl, 'photo');
  }

  async function toggleVideoRecord() {
    const btn = els['btn-shutter'];
    if (mediaRecorder?.state === 'recording') {
      mediaRecorder.stop();
      btn.classList.remove('recording');
      clearTimeout(recordTimer);
      return;
    }

    if (!stream) { LocketUI.toast('Camera chưa sẵn sàng'); return; }

    recordChunks = [];
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
    mediaRecorder = new MediaRecorder(stream, { mimeType: mime });
    mediaRecorder.ondataavailable = e => { if (e.data.size) recordChunks.push(e.data); };
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordChunks, { type: mime });
      const url = URL.createObjectURL(blob);
      captureData = { type: 'video', blob, dataUrl: url };
      showPreview(url, 'video');
    };

    const duration = LocketState.get().settings.videoDuration * 1000;
    mediaRecorder.start();
    btn.classList.add('recording');
    LocketUI.toast(`Đang quay... (tối đa ${duration / 1000}s)`);
    recordTimer = setTimeout(() => {
      if (mediaRecorder?.state === 'recording') {
        mediaRecorder.stop();
        btn.classList.remove('recording');
      }
    }, duration);
  }

  function handleLibraryUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = () => {
      captureData = { type: isVideo ? 'video' : 'photo', dataUrl: reader.result };
      showPreview(reader.result, isVideo ? 'video' : 'photo');
      LocketUI.toast('✦ Đã tải từ thư viện (Gold)');
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
      vid.src = url;
      vid.classList.remove('hidden');
      vid.play();
    } else {
      img.src = url;
      img.classList.remove('hidden');
    }
    els['capture-preview'].classList.remove('hidden');
    els['caption-input'].value = '';
    els['caption-count'].textContent = '0/300';
  }

  function hidePreview() {
    els['capture-preview'].classList.add('hidden');
    captureData = null;
    els['preview-media-video'].pause();
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

    // Simulate viewers after delay (Gold: Who Viewed)
    recipients.forEach((fid, i) => {
      setTimeout(() => LocketState.addViewer(locket.id, fid), 2000 + i * 1500);
    });

    hidePreview();
    LocketUI.toast('Đã gửi Locket! ✦');
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
    if (mediaRecorder?.state === 'recording') mediaRecorder.stop();
    els['btn-shutter']?.classList.remove('recording');
  }

  return { init, onTabActive, onTabLeave, renderFriendScroll, populateRecipientList };
})();