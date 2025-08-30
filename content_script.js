(function () {
  'use strict';

  // プレイヤー固定機能に特化（position: sticky ベース）。
  const TOP_OFFSET_FALLBACK = 56;
  let applied = false;

  const log = (...args) => console.log('[ytpp]', ...args);

  function mastheadHeight() {
    const m = document.getElementById('masthead-container') || document.querySelector('ytd-masthead');
    if (!m) return TOP_OFFSET_FALLBACK;
    const h = m.getBoundingClientRect().height;
    return h > 0 ? Math.round(h) : TOP_OFFSET_FALLBACK;
  }

  function findVisiblePlayerContainer() {
    // 現在の構造で視認性のある候補を広めに拾い、最も大きい要素を選ぶ
    const selectors = [
      '#player-theater-container',
      '#player-full-bleed-container',
      '#player',
      '#player-container',
      'ytd-player',
      'ytd-watch-flexy #player-container',
      'ytd-watch-flexy #player'
    ];
    const candidates = new Set();
    selectors.forEach(s => document.querySelectorAll(s).forEach(el => candidates.add(el)));
    // videoタグから遡るフォールバック
    const v = document.querySelector('video.html5-main-video');
    if (v) {
      let p = v.parentElement;
      while (p && p !== document.body) {
        if (p.id === 'player' || p.id === 'player-container' || p.tagName === 'YTD-PLAYER' || p.classList.contains('html5-video-player')) {
          candidates.add(p);
          break;
        }
        p = p.parentElement;
      }
    }
    let best = null;
    let bestArea = 0;
    candidates.forEach(el => {
      const r = el.getBoundingClientRect();
      const area = Math.max(0, r.width) * Math.max(0, r.height);
      if (area > bestArea && r.width > 200 && r.height > 100 && r.bottom > 0 && r.right > 0) {
        best = el;
        bestArea = area;
      }
    });
    return best;
  }

  function applySticky() {
    if (applied) return;
    const container = findVisiblePlayerContainer();
    if (!container) {
      // 遅延ロード対策で再試行
      setTimeout(applySticky, 800);
      return;
    }

    // 上部オフセットをCSSカスタムプロパティに設定
    const top = mastheadHeight();
    container.style.setProperty('--ytpp-top-offset', `${top}px`);
    // 幅はレイアウトに任せる（stickyは元の文脈で動作させる）
    container.classList.add('ytpp-sticky');

    // スクロールイベントでtopを追従（mastheadの高さ変動対応）
    const onResize = () => {
      container.style.setProperty('--ytpp-top-offset', `${mastheadHeight()}px`);
    };
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('yt-action', onResize, { passive: true });

    // 画面遷移時にクリーンアップできるように保存
    container.dataset.ytppBound = '1';
    applied = true;
    log('sticky applied on', container);
  }

  function clearSticky() {
    const el = document.querySelector('.ytpp-sticky');
    if (el) {
      el.classList.remove('ytpp-sticky');
      el.style.removeProperty('--ytpp-top-offset');
      delete el.dataset.ytppBound;
    }
    applied = false;
  }

  // SPA遷移対応
  window.addEventListener('yt-navigate-finish', () => {
    clearSticky();
    if (location.pathname === '/watch') {
      setTimeout(applySticky, 600);
    }
  });

  // 初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(applySticky, 600));
  } else {
    setTimeout(applySticky, 600);
  }

  // デバッグユーティリティ（簡素）
  window.ytppDebug = () => {
    const el = document.querySelector('.ytpp-sticky');
    log('applied:', applied, 'stickyEl:', el);
    if (el) log('rect:', el.getBoundingClientRect());
  };
})();