(function() {
  'use strict';

  if (window._x_extension_selection_quick_actions_2026_unique_) {
    return;
  }
  window._x_extension_selection_quick_actions_2026_unique_ = true;

  const INTENT = globalThis.LumnoSelectionIntent || {};
  if (typeof INTENT.classifySelection !== 'function') {
    return;
  }

  const ENABLED_STORAGE_KEY = '_x_extension_selection_quick_actions_enabled_2026_unique_';
  const LANGUAGE_STORAGE_KEY = '_x_extension_language_2024_unique_';
  const LANGUAGE_MESSAGES_STORAGE_KEY = '_x_extension_language_messages_2024_unique_';
  const HOST_ID = '_x_extension_selection_quick_actions_host_2026_unique_';
  const HIGH_DELAY_MS = 300;
  const MEDIUM_DELAY_MS = 460;
  const POINTER_CONFIRM_DISTANCE_PX = 52;
  const DOT_DISMISS_MS = 2200;
  const CHIP_DISMISS_MS = 3600;
  const providerStorageRuntime = globalThis.LumnoSettings &&
    typeof globalThis.LumnoSettings.createProviderStorageRuntime === 'function'
    ? globalThis.LumnoSettings.createProviderStorageRuntime(chrome)
    : null;
  const storageArea = providerStorageRuntime
    ? providerStorageRuntime.area
    : (chrome && chrome.storage && chrome.storage.sync
        ? chrome.storage.sync
        : (chrome && chrome.storage ? chrome.storage.local : null));
  const storageAreaName = providerStorageRuntime ? providerStorageRuntime.name : (storageArea && storageArea === (chrome && chrome.storage ? chrome.storage.sync : null)
    ? 'sync'
    : 'local');

  let enabled = false;
  let languageMode = 'system';
  let localeMessages = null;
  let showTimer = null;
  let dismissTimer = null;
  let requestSequence = 0;
  let pointerPosition = { x: 0, y: 0 };
  let currentCandidate = null;
  let contextMenuCandidate = null;
  let host = null;
  let shadow = null;
  let surface = null;
  let mainButton = null;
  let mainLabel = null;
  let moreButton = null;
  let menu = null;
  let status = null;

  const ACTION_COPY = Object.freeze({
    ask: ['selection_quick_action_ask', 'Ask AI'],
    translate: ['selection_quick_action_translate', 'Translate'],
    explain: ['selection_quick_action_explain', 'Explain'],
    summarize: ['selection_quick_action_summarize', 'Summarize'],
    search: ['selection_quick_action_search', 'Research'],
    calculate: ['selection_quick_action_calculate', 'Convert']
  });
  const ACTION_ICONS = Object.freeze({
    ask: 'ri-sparkling-2-line',
    translate: 'ri-translate-2',
    explain: 'ri-lightbulb-line',
    summarize: 'ri-file-list-3-line',
    search: 'ri-search-line',
    calculate: 'ri-calculator-line'
  });

  function getMessage(key, fallback) {
    if (localeMessages && localeMessages[key] && localeMessages[key].message) {
      return localeMessages[key].message;
    }
    try {
      const value = chrome.i18n && chrome.i18n.getMessage
        ? chrome.i18n.getMessage(key)
        : '';
      return value || fallback;
    } catch (e) {
      return fallback;
    }
  }

  function normalizeLocale(value) {
    const raw = String(value || '').replace(/_/g, '-').toLowerCase();
    if (raw.startsWith('zh-tw') || raw.startsWith('zh-hk') || raw.includes('hant')) {
      return 'zh-TW';
    }
    if (raw.startsWith('zh')) {
      return 'zh-CN';
    }
    if (raw.startsWith('ja')) {
      return 'ja';
    }
    return 'en';
  }

  function getCurrentLocale() {
    if (languageMode && languageMode !== 'system') {
      return normalizeLocale(languageMode);
    }
    try {
      if (chrome.i18n && typeof chrome.i18n.getUILanguage === 'function') {
        return normalizeLocale(chrome.i18n.getUILanguage());
      }
    } catch (e) {
      // Fall through to navigator language.
    }
    return normalizeLocale(navigator.language || 'en');
  }

  function getActionLabel(action) {
    const copy = ACTION_COPY[action] || ACTION_COPY.ask;
    return getMessage(copy[0], copy[1]);
  }

  function clearTimers() {
    if (showTimer) {
      window.clearTimeout(showTimer);
      showTimer = null;
    }
    if (dismissTimer) {
      window.clearTimeout(dismissTimer);
      dismissTimer = null;
    }
  }

  function hideSurface(options) {
    clearTimers();
    currentCandidate = null;
    requestSequence += 1;
    if (!host) {
      return;
    }
    host.dataset.visible = 'false';
    if (!options || options.immediate !== false) {
      host.hidden = true;
    } else {
      window.setTimeout(() => {
        if (host && host.dataset.visible !== 'true') {
          host.hidden = true;
        }
      }, 160);
    }
  }

  function isEditableElement(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }
    return Boolean(element.closest(
      'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="textbox"], .monaco-editor, .CodeMirror'
    ));
  }

  function isInsideCode(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }
    return Boolean(element.closest('code, pre, samp, kbd, .highlight, .syntax-highlight'));
  }

  function isSensitiveElement(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }
    return Boolean(element.closest(
      'input[type="password"], [autocomplete="current-password"], [autocomplete="new-password"], [autocomplete^="cc-"], [data-sensitive="true"]'
    ));
  }

  function getRangeElement(range) {
    const node = range && range.commonAncestorContainer;
    if (!node) {
      return null;
    }
    return node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  }

  function getRangeRect(range) {
    if (!range) {
      return null;
    }
    let rect = range.getBoundingClientRect();
    if (rect && rect.width <= 0 && rect.height <= 0) {
      const rects = range.getClientRects();
      rect = rects && rects.length > 0 ? rects[rects.length - 1] : rect;
    }
    if (!rect || !Number.isFinite(rect.left) || !Number.isFinite(rect.bottom)) {
      return null;
    }
    return {
      bottom: rect.bottom,
      left: rect.left,
      right: rect.right,
      top: rect.top
    };
  }

  function isSelectionStillCurrent(candidate) {
    if (!candidate || !window.getSelection) {
      return false;
    }
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount <= 0) {
      return false;
    }
    return INTENT.normalizeText(selection.toString()) === candidate.classification.text;
  }

  function getPointerDistance(candidate) {
    const dx = Number(pointerPosition.x) - Number(candidate.pointerX);
    const dy = Number(pointerPosition.y) - Number(candidate.pointerY);
    return Math.sqrt((dx * dx) + (dy * dy));
  }

  function handleMenuKeydown(event) {
    if (!menu || menu.hidden) {
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      hideSurface();
      return;
    }
    const buttons = Array.from(menu.querySelectorAll('button:not(:disabled)'));
    if (buttons.length === 0) {
      return;
    }
    const currentIndex = Math.max(0, buttons.indexOf(event.target));
    const columns = menu.dataset.complete === 'true' ? 3 : buttons.length;
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % buttons.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
    } else if (event.key === 'ArrowDown') {
      nextIndex = (currentIndex + columns) % buttons.length;
    } else if (event.key === 'ArrowUp') {
      nextIndex = (currentIndex - columns + buttons.length) % buttons.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = buttons.length - 1;
    } else {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    buttons[nextIndex].focus();
  }

  function ensureSurface() {
    if (host && host.isConnected) {
      return;
    }
    host = document.createElement('div');
    host.id = HOST_ID;
    host.hidden = true;
    host.dataset.visible = 'false';
    shadow = host.attachShadow({ mode: 'closed' });

    const iconStyles = document.createElement('link');
    iconStyles.rel = 'stylesheet';
    iconStyles.href = chrome.runtime.getURL('assets/remixicon/fonts/remixicon.css');
    shadow.appendChild(iconStyles);

    const style = document.createElement('style');
    style.textContent = `
      :host {
        all: initial;
        position: fixed;
        z-index: 2147483647;
        display: block;
        color-scheme: light dark;
        font-family: "Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      :host([hidden]) { display: none; }
      .lumno-selection-surface {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 2px;
        padding: 3px;
        border: 1px solid light-dark(rgba(15, 23, 42, 0.12), rgba(255, 255, 255, 0.16));
        border-radius: 12px;
        background: light-dark(rgba(255, 255, 255, 0.97), rgba(24, 24, 27, 0.97));
        color: light-dark(#172033, #f4f4f5);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
        opacity: 0;
        transform: translateY(-3px) scale(0.96);
        transition: opacity 140ms ease, transform 160ms ease;
        box-sizing: border-box;
      }
      :host([data-visible="true"]) .lumno-selection-surface {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      button {
        appearance: none;
        border: 0;
        margin: 0;
        padding: 0 9px;
        min-height: 30px;
        border-radius: 9px;
        background: transparent;
        color: inherit;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        font: 500 12px/1 "Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        white-space: nowrap;
        cursor: pointer;
      }
      button:hover, button:focus-visible {
        background: light-dark(rgba(37, 99, 235, 0.09), rgba(96, 165, 250, 0.14));
        outline: none;
      }
      button:focus-visible {
        box-shadow: inset 0 0 0 2px light-dark(rgba(37, 99, 235, 0.55), rgba(96, 165, 250, 0.65));
      }
      button:disabled { opacity: 0.56; cursor: default; }
      .lumno-selection-main[data-icon-only="true"] {
        width: 30px;
        padding: 0;
      }
      .lumno-selection-main[data-icon-only="true"] .lumno-selection-label { display: none; }
      .lumno-selection-logo { width: 17px; height: 17px; display: block; }
      .lumno-selection-more { width: 26px; padding: 0; }
      .lumno-selection-menu {
        display: flex;
        align-items: center;
        gap: 2px;
      }
      .lumno-selection-menu[data-complete="true"] {
        display: grid;
        grid-template-columns: repeat(3, max-content);
      }
      .lumno-selection-menu[hidden], .lumno-selection-more[hidden], .lumno-selection-main[hidden] { display: none; }
      .lumno-selection-menu i { font-size: 15px; }
      .lumno-selection-status {
        padding: 0 8px;
        font: 500 12px/1 "Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        white-space: nowrap;
      }
      .lumno-selection-status[hidden] { display: none; }
      @media (prefers-reduced-motion: reduce) {
        .lumno-selection-surface { transition: none; }
      }
    `;
    shadow.appendChild(style);

    surface = document.createElement('div');
    surface.className = 'lumno-selection-surface';
    surface.setAttribute('role', 'group');

    mainButton = document.createElement('button');
    mainButton.type = 'button';
    mainButton.className = 'lumno-selection-main';
    const logo = document.createElement('img');
    logo.className = 'lumno-selection-logo';
    logo.alt = '';
    logo.src = chrome.runtime.getURL('assets/images/lumno.png');
    mainLabel = document.createElement('span');
    mainLabel.className = 'lumno-selection-label';
    mainButton.append(logo, mainLabel);

    moreButton = document.createElement('button');
    moreButton.type = 'button';
    moreButton.className = 'lumno-selection-more';
    moreButton.innerHTML = '<i class="ri-icon ri-arrow-down-s-line" aria-hidden="true"></i>';
    moreButton.setAttribute('aria-haspopup', 'menu');

    menu = document.createElement('div');
    menu.className = 'lumno-selection-menu';
    menu.hidden = true;
    menu.setAttribute('role', 'menu');

    status = document.createElement('span');
    status.className = 'lumno-selection-status';
    status.hidden = true;
    status.setAttribute('role', 'status');

    surface.append(mainButton, moreButton, menu, status);
    shadow.appendChild(surface);
    (document.documentElement || document.body).appendChild(host);

    surface.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    menu.addEventListener('keydown', handleMenuKeydown);
    surface.addEventListener('pointerenter', () => {
      if (dismissTimer) {
        window.clearTimeout(dismissTimer);
        dismissTimer = null;
      }
    });
    surface.addEventListener('pointerleave', () => {
      if (currentCandidate) {
        scheduleDismiss(currentCandidate.mode === 'high' ? CHIP_DISMISS_MS : DOT_DISMISS_MS);
      }
    });
    mainButton.addEventListener('click', () => {
      if (!currentCandidate) {
        return;
      }
      if (currentCandidate.mode === 'medium') {
        renderMenu();
        return;
      }
      sendSelectionAction(currentCandidate.classification.action);
    });
    moreButton.addEventListener('click', renderMenu);
  }

  function positionSurface(rect) {
    if (!host || !surface || !rect) {
      return;
    }
    host.style.left = '8px';
    host.style.top = '8px';
    window.requestAnimationFrame(() => {
      if (!host || host.hidden) {
        return;
      }
      const bounds = surface.getBoundingClientRect();
      const viewportWidth = Math.max(320, window.innerWidth || document.documentElement.clientWidth || 0);
      const viewportHeight = Math.max(240, window.innerHeight || document.documentElement.clientHeight || 0);
      const left = Math.min(
        viewportWidth - bounds.width - 8,
        Math.max(8, rect.right - Math.min(32, bounds.width / 2))
      );
      const fitsBelow = rect.bottom + bounds.height + 10 <= viewportHeight;
      const top = fitsBelow
        ? rect.bottom + 8
        : Math.max(8, rect.top - bounds.height - 8);
      host.style.left = `${Math.round(left)}px`;
      host.style.top = `${Math.round(top)}px`;
    });
  }

  function scheduleDismiss(delay) {
    if (dismissTimer) {
      window.clearTimeout(dismissTimer);
    }
    dismissTimer = window.setTimeout(() => hideSurface({ immediate: false }), delay);
  }

  function renderCandidate(candidate, mode) {
    ensureSurface();
    currentCandidate = { ...candidate, mode };
    const action = candidate.classification.action;
    const label = getActionLabel(action);
    host.hidden = false;
    host.dataset.visible = 'false';
    mainButton.hidden = false;
    mainButton.disabled = false;
    mainButton.dataset.iconOnly = mode === 'medium' ? 'true' : 'false';
    mainButton.setAttribute('aria-label', mode === 'medium'
      ? getMessage('selection_quick_action_open_menu', '使用 Lumno 处理所选文字')
      : label);
    mainLabel.textContent = label;
    moreButton.hidden = mode !== 'high';
    moreButton.disabled = false;
    moreButton.setAttribute('aria-label', getMessage('selection_quick_action_more', '更多操作'));
    moreButton.setAttribute('aria-expanded', 'false');
    menu.hidden = true;
    menu.replaceChildren();
    status.hidden = true;
    status.textContent = '';
    positionSurface(candidate.rect);
    const renderedCandidate = currentCandidate;
    window.requestAnimationFrame(() => {
      if (host && currentCandidate === renderedCandidate) {
        host.dataset.visible = 'true';
      }
    });
    scheduleDismiss(mode === 'high' ? CHIP_DISMISS_MS : DOT_DISMISS_MS);
  }

  function buildMenuAction(action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('role', 'menuitem');
    button.dataset.intent = action;
    const icon = document.createElement('i');
    icon.className = `ri-icon ${ACTION_ICONS[action] || ACTION_ICONS.ask}`;
    icon.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.textContent = getActionLabel(action);
    button.append(icon, label);
    button.addEventListener('click', () => sendSelectionAction(action));
    return button;
  }

  function renderMenu(options) {
    if (!currentCandidate || !host) {
      return;
    }
    const primary = currentCandidate.classification.action;
    const complete = Boolean(options && options.complete);
    const actions = complete
      ? [primary, ...INTENT.ACTIONS.filter((action) => action !== primary)]
      : [primary];
    if (!complete && primary !== 'ask') {
      actions.push('ask');
    }
    if (!complete && primary !== 'search') {
      actions.push('search');
    }
    mainButton.hidden = true;
    moreButton.hidden = true;
    moreButton.setAttribute('aria-expanded', 'true');
    menu.dataset.complete = complete ? 'true' : 'false';
    menu.replaceChildren(...actions.slice(0, complete ? INTENT.ACTIONS.length : 3).map(buildMenuAction));
    menu.hidden = false;
    status.hidden = true;
    positionSurface(currentCandidate.rect);
    scheduleDismiss(CHIP_DISMISS_MS);
    if (complete && options && options.focusFirst) {
      window.requestAnimationFrame(() => {
        const firstAction = menu && menu.querySelector('button:not(:disabled)');
        if (firstAction) {
          firstAction.focus();
        }
      });
    }
  }

  function renderSendingStatus() {
    if (!host || !currentCandidate) {
      return;
    }
    mainButton.hidden = true;
    moreButton.hidden = true;
    menu.hidden = true;
    status.textContent = getMessage('selection_quick_action_sending', '正在后台打开…');
    status.hidden = false;
    positionSurface(currentCandidate.rect);
  }

  function renderFailureStatus() {
    ensureSurface();
    if (!host) {
      return;
    }
    host.hidden = false;
    host.dataset.visible = 'true';
    mainButton.hidden = true;
    moreButton.hidden = true;
    menu.hidden = true;
    status.textContent = getMessage('selection_quick_action_failed', '发送失败，请重试');
    status.hidden = false;
    scheduleDismiss(2200);
  }

  function sendSelectionAction(action) {
    const candidate = currentCandidate;
    if (!candidate || !isSelectionStillCurrent(candidate)) {
      hideSurface();
      return;
    }
    renderSendingStatus();
    try {
      chrome.runtime.sendMessage({
        action: 'runSelectionQuickAction',
        intent: action,
        locale: getCurrentLocale(),
        text: candidate.classification.text
      }, (response) => {
        if (chrome.runtime && chrome.runtime.lastError) {
          renderFailureStatus();
          return;
        }
        if (!response || response.ok === false) {
          renderFailureStatus();
        }
      });
      window.setTimeout(() => hideSurface({ immediate: false }), 900);
    } catch (e) {
      renderFailureStatus();
    }
  }

  function buildCandidate(selection, pointerEvent, options) {
    if (!selection || selection.isCollapsed || selection.rangeCount <= 0) {
      return null;
    }
    const range = selection.getRangeAt(0);
    const element = getRangeElement(range);
    const rect = getRangeRect(range);
    if (!element || !rect || host && element === host) {
      return null;
    }
    const editable = isEditableElement(element);
    const sensitive = isSensitiveElement(element);
    const classification = INTENT.classifySelection(selection.toString(), {
      editable,
      insideCode: isInsideCode(element),
      pageLanguage: document.documentElement && document.documentElement.lang,
      sensitive,
      uiLanguage: getCurrentLocale()
    });
    const explicit = Boolean(options && options.explicit);
    const maxLength = Number(INTENT.MAX_SELECTION_LENGTH) || 2400;
    if (!classification.text || classification.text.length > maxLength || editable || sensitive) {
      return null;
    }
    if (!explicit && (classification.suppressed || classification.confidence === 'low')) {
      return null;
    }
    const effectiveClassification = explicit && classification.confidence === 'low'
      ? Object.freeze({ ...classification, action: 'ask', confidence: 'medium', suppressed: false })
      : classification;
    return {
      classification: effectiveClassification,
      pointerX: Number(pointerEvent && pointerEvent.clientX) || pointerPosition.x,
      pointerY: Number(pointerEvent && pointerEvent.clientY) || pointerPosition.y,
      rect
    };
  }

  function openExplicitMenu() {
    hideSurface();
    if (!enabled || !window.getSelection) {
      return { ok: false, reason: enabled ? 'selection-unavailable' : 'selection-quick-actions-disabled' };
    }
    const candidate = buildCandidate(window.getSelection(), null, { explicit: true });
    if (!candidate) {
      return { ok: false, reason: 'selection-unavailable' };
    }
    ensureSurface();
    currentCandidate = { ...candidate, mode: 'explicit' };
    host.hidden = false;
    host.dataset.visible = 'false';
    renderMenu({ complete: true, focusFirst: true });
    window.requestAnimationFrame(() => {
      if (host && currentCandidate) {
        host.dataset.visible = 'true';
      }
    });
    return { ok: true };
  }

  function runExplicitContextMenuAction(action, expectedText) {
    hideSurface();
    if (!enabled || !INTENT.ACTIONS.includes(action)) {
      return { ok: false, reason: enabled ? 'selection-action-invalid' : 'selection-quick-actions-disabled' };
    }
    const current = window.getSelection
      ? buildCandidate(window.getSelection(), null, { explicit: true })
      : null;
    const cached = contextMenuCandidate &&
      Date.now() - contextMenuCandidate.capturedAt <= 15000
      ? contextMenuCandidate.candidate
      : null;
    const candidate = current || cached;
    contextMenuCandidate = null;
    const expected = INTENT.normalizeText(expectedText);
    if (!candidate || (expected && candidate.classification.text !== expected)) {
      return { ok: false, reason: 'selection-unavailable' };
    }
    ensureSurface();
    currentCandidate = { ...candidate, mode: 'explicit' };
    host.hidden = false;
    host.dataset.visible = 'true';
    sendSelectionAction(action);
    return { ok: true };
  }

  function evaluateSelection(pointerEvent) {
    hideSurface();
    if (!enabled || !window.getSelection) {
      return;
    }
    const candidate = buildCandidate(window.getSelection(), pointerEvent);
    if (!candidate) {
      return;
    }
    const sequence = ++requestSequence;
    currentCandidate = candidate;
    const initialHigh = candidate.classification.confidence === 'high';
    showTimer = window.setTimeout(() => {
      showTimer = null;
      if (sequence !== requestSequence || !enabled || !isSelectionStillCurrent(candidate)) {
        return;
      }
      const behaviorConfirmed = getPointerDistance(candidate) <= POINTER_CONFIRM_DISTANCE_PX;
      if (initialHigh && behaviorConfirmed) {
        renderCandidate(candidate, 'high');
        return;
      }
      if (initialHigh) {
        showTimer = window.setTimeout(() => {
          showTimer = null;
          if (sequence === requestSequence && enabled && isSelectionStillCurrent(candidate)) {
            renderCandidate(candidate, 'medium');
          }
        }, MEDIUM_DELAY_MS - HIGH_DELAY_MS);
        return;
      }
      renderCandidate(candidate, 'medium');
    }, initialHigh ? HIGH_DELAY_MS : MEDIUM_DELAY_MS);
  }

  function handlePointerUp(event) {
    pointerPosition = { x: event.clientX, y: event.clientY };
    if (event.button !== 0 || !enabled ||
        (host && event.composedPath && event.composedPath().includes(host))) {
      return;
    }
    window.setTimeout(() => evaluateSelection(event), 0);
  }

  function handlePointerMove(event) {
    pointerPosition = { x: event.clientX, y: event.clientY };
  }

  function handlePointerDown(event) {
    if (!host || !event.composedPath || !event.composedPath().includes(host)) {
      hideSurface();
    }
  }

  function handleSelectionChange() {
    if (!currentCandidate || !window.getSelection) {
      return;
    }
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      hideSurface();
    }
  }

  function hydrateSettings() {
    if (!storageArea || typeof storageArea.get !== 'function') {
      return;
    }
    storageArea.get([
      ENABLED_STORAGE_KEY,
      LANGUAGE_STORAGE_KEY,
      LANGUAGE_MESSAGES_STORAGE_KEY
    ], (result) => {
      if (chrome.runtime && chrome.runtime.lastError) {
        return;
      }
      enabled = Boolean(result && result[ENABLED_STORAGE_KEY] === true);
      languageMode = result && result[LANGUAGE_STORAGE_KEY]
        ? String(result[LANGUAGE_STORAGE_KEY])
        : 'system';
      const payload = result && result[LANGUAGE_MESSAGES_STORAGE_KEY];
      localeMessages = payload && payload.messages ? payload.messages : null;
      if (!enabled) {
        hideSurface();
      }
    });
  }

  document.addEventListener('pointerup', handlePointerUp, true);
  document.addEventListener('pointermove', handlePointerMove, true);
  document.addEventListener('pointerdown', handlePointerDown, true);
  document.addEventListener('selectionchange', handleSelectionChange, true);
  document.addEventListener('contextmenu', (event) => {
    const candidate = window.getSelection
      ? buildCandidate(window.getSelection(), event, { explicit: true })
      : null;
    contextMenuCandidate = candidate
      ? { candidate, capturedAt: Date.now() }
      : null;
  }, true);
  document.addEventListener('copy', hideSurface, true);
  document.addEventListener('scroll', hideSurface, true);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      hideSurface();
    }
  }, true);

  if (chrome && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      if (!request) {
        return;
      }
      if (request.action === 'openSelectionQuickActionsMenu') {
        sendResponse(openExplicitMenu());
        return;
      }
      if (request.action === 'runSelectionContextMenuAction') {
        sendResponse(runExplicitContextMenuAction(request.intent, request.expectedText));
      }
    });
  }

  if (chrome && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (providerStorageRuntime
        ? !providerStorageRuntime.isActiveAreaName(areaName)
        : areaName !== storageAreaName) {
        return;
      }
      if (changes[ENABLED_STORAGE_KEY]) {
        enabled = changes[ENABLED_STORAGE_KEY].newValue === true;
        if (!enabled) {
          hideSurface();
        }
      }
      if (changes[LANGUAGE_STORAGE_KEY] || changes[LANGUAGE_MESSAGES_STORAGE_KEY]) {
        hydrateSettings();
      }
    });
  }

  hydrateSettings();
})();
