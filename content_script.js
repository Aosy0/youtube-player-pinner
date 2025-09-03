(function () {
  'use strict';

  // --- グローバル変数 ---
  let state = {
    isApplied: false,
    playerEl: null,
    resizeTimeout: null,
  };
  let observers = {
    header: null,
    style: null,
    url: null,
  };
  const originalStyles = new Map();

  const log = (...args) => console.log('%c[ytpp]', 'color: cyan; font-weight: bold;', ...args);

  // --- ユーティリティ関数 ---
  function findFirstVisible(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.clientHeight > 0) return element;
    }
    return null;
  }

  function getHeaderHeight() {
    const header = findFirstVisible(['#masthead-container', 'ytd-masthead', '#masthead']);
    return header ? header.getBoundingClientRect().height : 56;
  }

  function updateTopOffset() {
    document.documentElement.style.setProperty('--ytpp-top-offset', `${getHeaderHeight()}px`);
  }

  // --- スタイル修正関数 ---
  function unlockAllParents(element) {
    let parent = element.parentElement;
    while (parent && parent.tagName !== 'HTML') {
      const style = getComputedStyle(parent);

      const hasBadOverflow = style.overflow !== 'visible';
      const hasBadContain = style.contain === 'strict' || style.contain === 'paint' || style.contain === 'layout';
      const hasBadTransform = style.transform !== 'none';

      if (hasBadOverflow || hasBadContain || hasBadTransform) {
        if (!originalStyles.has(parent)) {
          originalStyles.set(parent, {
            overflow: parent.style.overflow,
            contain: parent.style.contain,
            transform: parent.style.transform,
          });
        }
        parent.style.setProperty('overflow', 'visible', 'important');
        parent.style.setProperty('contain', 'none', 'important');
        parent.style.setProperty('transform', 'none', 'important');
      }
      parent = parent.parentElement;
    }
  }

  function restoreAllParents() {
    for (const [element, original] of originalStyles.entries()) {
      element.style.overflow = original.overflow;
      element.style.contain = original.contain;
      element.style.transform = original.transform;
    }
    originalStyles.clear();
  }

  // --- メイン処理 ---
  function applyStickySetup() {
    if (state.isApplied) return;
    const player = findFirstVisible(['#player.ytd-watch-flexy', '#player-container-inner', 'ytd-player']);
    if (!player) return;

    log('Applying CSS Sticky solution...');
    state.isApplied = true;
    state.playerEl = player;

    updateTopOffset();
    unlockAllParents(player);
    player.classList.add('ytpp-sticky-player');
    startObservers(player);

    log('Sticky solution applied successfully.');
  }

  function cleanup() {
    if (!state.isApplied) return;
    log('Cleaning up...');

    stopObservers();
    if (state.playerEl) {
      state.playerEl.classList.remove('ytpp-sticky-player');
    }
    restoreAllParents();
    document.documentElement.style.removeProperty('--ytpp-top-offset');

    state = { isApplied: false, playerEl: null, resizeTimeout: null };
  }

  // --- 監視ロジック ---
  function startObservers(player) {
    const header = findFirstVisible(['#masthead-container', 'ytd-masthead', '#masthead']);
    if (header) {
      observers.header = new ResizeObserver(updateTopOffset);
      observers.header.observe(header);
    }

    const layoutRoot = document.querySelector('ytd-page-manager') || document.body;
    observers.style = new MutationObserver(() => unlockAllParents(player));
    observers.style.observe(layoutRoot, { attributes: true, subtree: true, attributeFilter: ['style'] });
  }

  function stopObservers() {
    Object.values(observers).forEach(observer => {
      if (observer) observer.disconnect();
    });
  }

  // --- 初期化とイベントハンドラ ---
  function init() {
    const readyCheck = setInterval(() => {
      if (findFirstVisible(['#player.ytd-watch-flexy', '#player-container-inner', 'ytd-player'])) {
        clearInterval(readyCheck);
        applyStickySetup();
      }
    }, 500);
    setTimeout(() => clearInterval(readyCheck), 10000);
  }

  function handleResize() {
    clearTimeout(state.resizeTimeout);
    state.resizeTimeout = setTimeout(() => {
      log('Resize detected. Re-initializing...');
      cleanup();
      init();
    }, 300);
  }

  // URL変更の監視
  let lastUrl = location.href;
  observers.url = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      log('URL changed. Re-initializing...');
      cleanup();
      if (location.pathname === '/watch') {
        init();
      }
    }
  });
  observers.url.observe(document.body, { childList: true, subtree: true });

  // 実行開始
  window.addEventListener('resize', handleResize);
  if (location.pathname === '/watch') {
    init();
  }
})();