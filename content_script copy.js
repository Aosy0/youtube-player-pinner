(function () {
  'use-strict';

  // --- マテリアルアイコンのスタイルシートを注入 ---
  function injectMaterialIcons() {
    if (document.getElementById('material-icons-font')) return;
    const link = document.createElement('link');
    link.id = 'material-icons-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
    document.head.appendChild(link);
  }
  injectMaterialIcons();

  // --- グローバル変数 ---
  let playerElement = null;
  let lastUrl = location.href;
  let isExtensionEnabled = true;

  // --- 設定 ---
  const PIN_POSITION_TOP = 56; // ヘッダーの高さ
  const STORAGE_KEY = 'youtubePlayerPinnerEnabled';

  // --- ON/OFF状態管理 ---
  function saveState() {
    localStorage.setItem(STORAGE_KEY, isExtensionEnabled);
  }

  function loadState() {
    const savedState = localStorage.getItem(STORAGE_KEY);
    isExtensionEnabled = (savedState === null) ? true : (savedState === 'true');
  }

  // ▼▼▼【新しいロジック】▼▼▼
  // --- プレイヤーのスタイルを更新する ---
  function updatePlayerStyle() {
    if (!playerElement) return;

    // 拡張機能が有効な場合、stickyスタイルを適用
    if (isExtensionEnabled) {
      // シアターモードやフルスクリーンでは固定しない
      const isTheater = document.querySelector('ytd-watch-flexy[theater]');
      const isFullscreen = document.querySelector('ytd-watch-flexy[fullscreen]');
      if (isTheater || isFullscreen) {
        // stickyを解除
        playerElement.style.position = '';
        playerElement.style.top = '';
        playerElement.style.zIndex = '';
      } else {
        // 通常モードの時だけ固定する
        playerElement.style.position = 'sticky';
        playerElement.style.top = `${PIN_POSITION_TOP}px`;
        playerElement.style.zIndex = '999'; // zIndexも必要
      }
    } else {
      // 拡張機能が無効な場合、すべてのスタイルを解除
      playerElement.style.position = '';
      playerElement.style.top = '';
      playerElement.style.zIndex = '';
    }
  }

  // ▼▼▼【重要】メニュー項目ロジックの修正 ▼▼▼
  function injectSettingsMenuItem() {
    if (document.getElementById('player-pinner-menu-item')) return;
    const settingsMenu = document.querySelector('.ytp-panel-menu');
    if (!settingsMenu) return;
    const menuItem = document.createElement('div');
    menuItem.className = 'ytp-menuitem';
    menuItem.id = 'player-pinner-menu-item';
    const icon = document.createElement('div');
    icon.className = 'ytp-menuitem-icon';
    const materialIcon = document.createElement('span');
    materialIcon.className = 'material-icons';
    materialIcon.textContent = 'push_pin';
    icon.appendChild(materialIcon);
    const label = document.createElement('div');
    label.className = 'ytp-menuitem-label';
    label.textContent = 'プレーヤーを固定';
    const content = document.createElement('div');
    content.className = 'ytp-menuitem-content';
    const toggle = document.createElement('div');
    toggle.className = 'ytp-menuitem-toggle-checkbox';
    content.appendChild(toggle);
    menuItem.appendChild(icon);
    menuItem.appendChild(label);
    menuItem.appendChild(content);
    menuItem.setAttribute('role', 'menuitemcheckbox');
    menuItem.setAttribute('aria-checked', isExtensionEnabled.toString());
    menuItem.addEventListener('click', (event) => {
      event.stopPropagation();
      isExtensionEnabled = !isExtensionEnabled;
      saveState();
      menuItem.setAttribute('aria-checked', isExtensionEnabled.toString());
      // ★ スタイルを即時更新
      updatePlayerStyle();
    });
    settingsMenu.appendChild(menuItem);
  }

  // --- 初期化と監視ロジック ---
  function initialize() {
    playerElement = document.querySelector('#player.ytd-watch-flexy');
    if (playerElement) {
      updatePlayerStyle(); // 初期スタイルを適用
    }
    // ★ シアターモードの切り替えなどを監視して追従
    const flexy = document.querySelector('ytd-watch-flexy');
    if (flexy) {
      // theater属性やfullscreen属性の変更を監視
      const resizeObserver = new ResizeObserver(updatePlayerStyle);
      resizeObserver.observe(flexy);
    }
  }

  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(initialize, 1000);
    }
    if (document.querySelector('.ytp-settings-menu') && !document.getElementById('player-pinner-menu-item')) {
      setTimeout(injectSettingsMenuItem, 100);
    }
  });

  loadState();
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(initialize, 1000);

})();