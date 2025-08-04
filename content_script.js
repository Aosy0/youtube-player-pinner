(function () {
  'use-strict';

  const STORAGE_KEY = 'youtubeCombinedStickyEnabled';
  let isEnabled = false;

  // --- 状態管理 ---
  function saveState() {
    chrome.storage.local.set({ [STORAGE_KEY]: isEnabled });
  }

  function applyState() {
    // ページレイアウトの親要素にデータ属性を付与してCSSを有効化
    const flexyElement = document.querySelector('ytd-watch-flexy');
    if (flexyElement) {
      flexyElement.dataset.combinedStickyEnabled = isEnabled;
    }

    const menuItem = document.getElementById('combined-sticky-menu-item');
    if (menuItem) {
      menuItem.setAttribute('aria-checked', isEnabled);
    }
  }

  // --- UI作成 & 挿入 ---
  function injectMaterialIcons() {
    if (document.getElementById('material-icons-font')) return;
    const link = document.createElement('link');
    link.id = 'material-icons-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
    document.head.appendChild(link);
  }

  function injectSettingsMenuItem() {
    if (document.getElementById('combined-sticky-menu-item')) return;
    const settingsMenu = document.querySelector('.ytp-panel-menu');
    if (!settingsMenu) return;

    injectMaterialIcons();
    const menuItem = document.createElement('div');
    menuItem.className = 'ytp-menuitem';
    menuItem.id = 'combined-sticky-menu-item';

    const iconContainer = document.createElement('div');
    iconContainer.className = 'ytp-menuitem-icon';
    const icon = document.createElement('span');
    icon.className = 'material-icons';
    icon.textContent = 'view_quilt'; // 機能を表すアイコンに変更
    iconContainer.appendChild(icon);

    const label = document.createElement('div');
    label.className = 'ytp-menuitem-label';
    label.textContent = 'プレーヤーと関連動画を固定'; // 機能名ラベル

    const content = document.createElement('div');
    content.className = 'ytp-menuitem-content';
    const toggle = document.createElement('div');
    toggle.className = 'ytp-menuitem-toggle-checkbox';
    content.appendChild(toggle);

    menuItem.appendChild(iconContainer);
    menuItem.appendChild(label);
    menuItem.appendChild(content);

    menuItem.setAttribute('role', 'menuitemcheckbox');
    menuItem.setAttribute('aria-checked', isEnabled.toString());

    menuItem.addEventListener('click', (event) => {
      event.stopPropagation();
      isEnabled = !isEnabled;
      saveState();
      applyState();
    });

    settingsMenu.appendChild(menuItem);
  }

  // --- 初期化処理 ---
  async function initialize() {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    isEnabled = data[STORAGE_KEY] === undefined ? false : data[STORAGE_KEY];
    applyState();

    const observer = new MutationObserver(() => {
      if (document.querySelector('.ytp-panel-menu') && !document.getElementById('combined-sticky-menu-item')) {
        injectSettingsMenuItem();
      }
      if (document.querySelector('ytd-watch-flexy')) {
        applyState();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

})();