(function() {
  const panel = document.getElementById('_x_extension_settings_panel_2024_unique_');
  const optionsRoot = document.getElementById('_x_extension_options_root_2024_unique_');
  const pixelBlastMount = document.getElementById('_x_extension_settings_pixelblast_2026_unique_');
  const tabsRow = document.querySelector('._x_extension_settings_tabs_row_2024_unique_');
  const appearanceContent = document.querySelector('._x_extension_settings_content_2024_unique_[data-content="appearance"]');
  const themePicker = appearanceContent
    ? appearanceContent.querySelector('._x_extension_theme_picker_2024_unique_')
    : null;
  const themeButtons = themePicker ? Array.from(themePicker.querySelectorAll('._x_extension_theme_option_2024_unique_')) : [];
  const themeIndicator = themePicker ? themePicker.querySelector('._x_extension_theme_indicator_2024_unique_') : null;
  const tabButtons = Array.from(document.querySelectorAll('._x_extension_settings_tab_button_2024_unique_'));
  const tabContents = Array.from(document.querySelectorAll('._x_extension_settings_content_2024_unique_'));
  const tabsContainer = document.getElementById('_x_extension_settings_tabs_2024_unique_');
  const tabsIndicator = tabsContainer ? tabsContainer.querySelector('._x_extension_tabs_indicator_2024_unique_') : null;
  const settingsVersion = document.getElementById('_x_extension_settings_version_2024_unique_');
  const languageSelect = document.getElementById('_x_extension_language_select_2024_unique_');
  const recentModeSelect = document.getElementById('_x_extension_recent_mode_select_2024_unique_');
  const recentModeTabButtons = Array.from(document.querySelectorAll('button[data-recent-mode]'));
  const recentModeTabsWrap = document.getElementById('_x_extension_recent_mode_tabs_wrap_2024_unique_');
  const recentModeTabsIndicator = recentModeTabsWrap
    ? recentModeTabsWrap.querySelector('._x_extension_theme_indicator_2024_unique_')
    : null;
  const recentCountSelect = document.getElementById('_x_extension_recent_count_select_2024_unique_');
  const newtabWidthSelect = document.getElementById('_x_extension_newtab_width_select_2026_unique_');
  const newtabWidthTabsWrap = document.getElementById('_x_extension_newtab_width_tabs_wrap_2026_unique_');
  const newtabWidthTabButtons = Array.from(document.querySelectorAll('button[data-newtab-width]'));
  const newtabWidthTabsIndicator = newtabWidthTabsWrap
    ? newtabWidthTabsWrap.querySelector('._x_extension_theme_indicator_2024_unique_')
    : null;
  const overlaySizeTabButtons = Array.from(document.querySelectorAll('button[data-overlay-size]'));
  const overlaySizeTabsWrap = document.getElementById('_x_extension_overlay_size_tabs_wrap_2026_unique_');
  const overlaySizeTabsIndicator = overlaySizeTabsWrap
    ? overlaySizeTabsWrap.querySelector('._x_extension_theme_indicator_2024_unique_')
    : null;
  const siteSearchBuiltinTabsWrap = document.getElementById('_x_extension_site_search_builtin_tabs_wrap_2026_unique_');
  const siteSearchBuiltinTabButtons = Array.from(document.querySelectorAll('button[data-site-search-builtin-tab]'));
  const siteSearchBuiltinTabsIndicator = siteSearchBuiltinTabsWrap
    ? siteSearchBuiltinTabsWrap.querySelector('._x_extension_theme_indicator_2024_unique_')
    : null;
  const siteSearchBuiltinPanel = document.getElementById('_x_extension_site_search_builtin_panel_2026_unique_');
  const siteSearchAiPanel = document.getElementById('_x_extension_site_search_ai_panel_2026_unique_');
  const bookmarkCountSelect = document.getElementById('_x_extension_bookmark_count_select_2024_unique_');
  const bookmarkColumnsSelect = document.getElementById('_x_extension_bookmark_columns_select_2024_unique_');
  const bookmarkColumnsSelectWrap = bookmarkColumnsSelect
    ? bookmarkColumnsSelect.closest('._x_extension_select_wrap_2024_unique_')
    : null;
  const autoPipToggle = document.getElementById('_x_extension_auto_pip_toggle_2024_unique_');
  const documentPipToggle = document.getElementById('_x_extension_document_pip_toggle_2026_unique_');
  const pinnedTabRecoveryToggle = document.getElementById('_x_extension_pinned_tab_recovery_toggle_2026_unique_');
  const overlayTabQuickSwitchToggle = document.getElementById('_x_extension_overlay_tab_quick_switch_2024_unique_');
  const newtabWordmarkToggle = document.getElementById('_x_extension_newtab_wordmark_toggle_2026_unique_');
  const restrictedActionSelect = document.getElementById('_x_extension_restricted_action_select_2024_unique_');
  const searchResultPrioritySelect = document.getElementById('_x_extension_search_result_priority_select_2026_unique_');
  const syncStatus = document.getElementById('_x_extension_sync_status_2024_unique_');
  const syncStatusText = document.getElementById('_x_extension_sync_status_text_2024_unique_');
  const syncNowButton = document.getElementById('_x_extension_sync_now_2024_unique_');
  const syncExportButton = document.getElementById('_x_extension_sync_export_2024_unique_');
  const syncImportButton = document.getElementById('_x_extension_sync_import_2024_unique_');
  const syncImportInput = document.getElementById('_x_extension_sync_import_input_2024_unique_');
  const fallbackShortcutInput = document.getElementById('_x_extension_shortcuts_input_2024_unique_');
  const fallbackShortcutTokens = document.getElementById('_x_extension_shortcuts_tokens_2024_unique_');
  const fallbackShortcutWrap = document.querySelector('._x_extension_shortcuts_hotkey_wrap_2024_unique_');
  const restrictedActionSelectWrap = document.getElementById('_x_extension_restricted_action_tabs_wrap_2024_unique_');
  const restrictedActionTabButtons = Array.from(document.querySelectorAll('button[data-restricted-action]'));
  const restrictedActionTabsIndicator = restrictedActionSelectWrap
    ? restrictedActionSelectWrap.querySelector('._x_extension_theme_indicator_2024_unique_')
    : null;
  const searchResultPriorityTabsWrap = document.getElementById('_x_extension_search_result_priority_tabs_wrap_2026_unique_');
  const searchResultPriorityTabButtons = Array.from(document.querySelectorAll('button[data-search-result-priority]'));
  const searchResultPriorityTabsIndicator = searchResultPriorityTabsWrap
    ? searchResultPriorityTabsWrap.querySelector('._x_extension_theme_indicator_2024_unique_')
    : null;
  const clearShortcutButton = document.getElementById('_x_extension_clear_shortcut_2024_unique_');
  const resetShortcutButton = document.getElementById('_x_extension_reset_shortcut_2024_unique_');
  const shortcutsStatus = document.getElementById('_x_extension_shortcuts_status_2024_unique_');
  const openShortcutsPageButton = document.getElementById('_x_extension_open_shortcuts_page_2026_unique_');
  const customSelectWraps = Array.from(document.querySelectorAll('._x_extension_custom_select_2024_unique_'));
  const siteSearchCustomList = document.getElementById('_x_extension_site_search_custom_list_2024_unique_');
  const siteSearchBuiltinList = document.getElementById('_x_extension_site_search_builtin_list_2024_unique_');
  const siteSearchAiBuiltinList = document.getElementById('_x_extension_site_search_ai_builtin_list_2024_unique_');
  const siteSearchKeyInput = document.getElementById('_x_extension_site_search_key_2024_unique_');
  const siteSearchNameInput = document.getElementById('_x_extension_site_search_name_2024_unique_');
  const siteSearchTemplateInput = document.getElementById('_x_extension_site_search_template_2024_unique_');
  const siteSearchAliasInput = document.getElementById('_x_extension_site_search_alias_2024_unique_');
  const siteSearchForm = document.querySelector('._x_extension_settings_content_2024_unique_[data-content="shortcuts"] ._x_extension_shortcut_form_2024_unique_');
  const siteSearchFormTrigger = document.getElementById('_x_extension_site_search_expand_2024_unique_');
  const siteSearchAddButton = document.getElementById('_x_extension_site_search_add_2024_unique_');
  const siteSearchCancelButton = document.getElementById('_x_extension_site_search_cancel_2024_unique_');
  const siteSearchError = document.getElementById('_x_extension_site_search_error_2024_unique_');
  const builtinResetButton = document.getElementById('_x_extension_builtin_reset_2024_unique_');
  const customClearButton = document.getElementById('_x_extension_custom_clear_2024_unique_');
  const blacklistList = document.getElementById('_x_extension_blacklist_list_2026_unique_');
  const blacklistForm = document.getElementById('_x_extension_blacklist_form_2026_unique_');
  const blacklistFormTrigger = document.getElementById('_x_extension_blacklist_expand_2026_unique_');
  const blacklistClearButton = document.getElementById('_x_extension_blacklist_clear_2026_unique_');
  const blacklistUrlLabel = document.getElementById('_x_extension_blacklist_url_label_2026_unique_');
  const blacklistUrlPrefix = document.getElementById('_x_extension_blacklist_url_prefix_2026_unique_');
  const blacklistUrlInput = document.getElementById('_x_extension_blacklist_url_2026_unique_');
  const blacklistMatchExactInput = document.getElementById('_x_extension_blacklist_match_exact_2026_unique_');
  const blacklistMatchPrefixInput = document.getElementById('_x_extension_blacklist_match_prefix_2026_unique_');
  const blacklistMatchSuffixInput = document.getElementById('_x_extension_blacklist_match_suffix_2026_unique_');
  const blacklistMatchExactWrap = document.getElementById('_x_extension_blacklist_match_exact_wrap_2026_unique_');
  const blacklistMatchPrefixWrap = document.getElementById('_x_extension_blacklist_match_prefix_wrap_2026_unique_');
  const blacklistMatchSuffixWrap = document.getElementById('_x_extension_blacklist_match_suffix_wrap_2026_unique_');
  const blacklistAddButton = document.getElementById('_x_extension_blacklist_add_2026_unique_');
  const blacklistCancelButton = document.getElementById('_x_extension_blacklist_cancel_2026_unique_');
  const blacklistError = document.getElementById('_x_extension_blacklist_error_2026_unique_');
  const toastElement = document.getElementById('_x_extension_toast_2024_unique_');
  const confirmMask = document.getElementById('_x_extension_confirm_mask_2024_unique_');
  const confirmMessage = document.getElementById('_x_extension_confirm_message_2024_unique_');
  const confirmOk = document.getElementById('_x_extension_confirm_ok_2024_unique_');
  const confirmCancel = document.getElementById('_x_extension_confirm_cancel_2024_unique_');
  const confirmDialog = document.querySelector('._x_extension_confirm_dialog_2024_unique_');

  // 使用系统字体，避免外链字体依赖。
  if (!panel || themeButtons.length === 0 || tabButtons.length === 0) {
    return;
  }

  const storageArea = (chrome && chrome.storage && chrome.storage.sync)
    ? chrome.storage.sync
    : (chrome && chrome.storage ? chrome.storage.local : null);
  const localStorageArea = (chrome && chrome.storage && chrome.storage.local)
    ? chrome.storage.local
    : storageArea;
  const storageAreaName = storageArea
    ? (storageArea === (chrome && chrome.storage ? chrome.storage.sync : null) ? 'sync' : 'local')
    : null;
  const STORAGE_KEYS = globalThis.LumnoStorageKeys || {};
  const SEARCH_FAVICON_UTILS = globalThis.LumnoSearchFavicons || {};
  const SITE_SEARCH_PROVIDER_UTILS = globalThis.LumnoSiteSearchProviders || {};

  function getRiSvg(id, sizeClass) {
    const size = sizeClass || 'ri-size-12';
    return `<i class="ri-icon ${size} ${id}" aria-hidden="true"></i>`;
  }

  function normalizeHost(hostname) {
    const raw = String(hostname || '').trim().toLowerCase();
    if (!raw) {
      return '';
    }
    return raw.replace(/^www\./, '');
  }

  function getGoogleFaviconUrl(hostname) {
    if (SEARCH_FAVICON_UTILS.getGoogleFaviconUrl) {
      return SEARCH_FAVICON_UTILS.getGoogleFaviconUrl(hostname, {
        runtimeGetUrl: chrome && chrome.runtime && typeof chrome.runtime.getURL === 'function'
          ? chrome.runtime.getURL.bind(chrome.runtime)
          : null,
        size: 64
      });
    }
    const normalized = normalizeHost(hostname);
    if (!normalized) {
      return '';
    }
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(normalized)}&sz=64`;
  }

  function getProviderIconUrl(provider) {
    if (SEARCH_FAVICON_UTILS.getSiteSearchProviderIconUrl) {
      return SEARCH_FAVICON_UTILS.getSiteSearchProviderIconUrl(provider, {
        runtimeGetUrl: chrome && chrome.runtime && typeof chrome.runtime.getURL === 'function'
          ? chrome.runtime.getURL.bind(chrome.runtime)
          : null,
        size: 64
      });
    }
    if (provider && provider.icon) {
      return String(provider.icon).trim();
    }
    if (provider && provider.iconUrl) {
      return String(provider.iconUrl).trim();
    }
    return '';
  }

  function getSiteSearchIconCacheKey(provider) {
    if (SEARCH_FAVICON_UTILS.getSiteSearchProviderHost) {
      return SEARCH_FAVICON_UTILS.getSiteSearchProviderHost(provider);
    }
    if (!provider) {
      return '';
    }
    try {
      const template = String(provider.template || '').trim();
      if (!template) {
        return '';
      }
      const resolvedUrl = template.replace(/\{query\}/g, 'test');
      return normalizeHost(new URL(resolvedUrl).hostname);
    } catch (e) {
      return '';
    }
  }

  function ensureSiteSearchIconCacheLoaded() {
    if (siteSearchIconCacheLoadPromise) {
      return siteSearchIconCacheLoadPromise;
    }
    if (!localStorageArea) {
      siteSearchIconCacheLoaded = true;
      siteSearchIconCacheLoadPromise = Promise.resolve();
      return siteSearchIconCacheLoadPromise;
    }
    if (siteSearchIconCacheLoaded) {
      siteSearchIconCacheLoadPromise = Promise.resolve();
      return siteSearchIconCacheLoadPromise;
    }
    siteSearchIconCacheLoaded = true;
    siteSearchIconCacheLoadPromise = new Promise((resolve) => {
      localStorageArea.get([SITE_SEARCH_ICON_CACHE_STORAGE_KEY], (result) => {
        const items = Array.isArray(result && result[SITE_SEARCH_ICON_CACHE_STORAGE_KEY])
          ? result[SITE_SEARCH_ICON_CACHE_STORAGE_KEY]
          : [];
        items.forEach((item) => {
          if (!item || !item.key || !item.url) {
            return;
          }
          siteSearchIconCache.set(String(item.key), String(item.url));
        });
        resolve();
      });
    });
    return siteSearchIconCacheLoadPromise;
  }

  function scheduleSiteSearchIconCacheWrite() {
    if (!localStorageArea) {
      return;
    }
    if (siteSearchIconCacheWriteTimer !== null) {
      clearTimeout(siteSearchIconCacheWriteTimer);
    }
    siteSearchIconCacheWriteTimer = window.setTimeout(() => {
      siteSearchIconCacheWriteTimer = null;
      const entries = Array.from(siteSearchIconCache.entries()).map(([key, url]) => ({ key, url }));
      localStorageArea.set({ [SITE_SEARCH_ICON_CACHE_STORAGE_KEY]: entries }, () => {});
    }, 120);
  }

  function primeSiteSearchIconCache(provider) {
    const cacheKey = getSiteSearchIconCacheKey(provider);
    if (!cacheKey || siteSearchIconCache.has(cacheKey)) {
      return;
    }
    const iconUrl = getProviderIconUrl(provider);
    if (!iconUrl) {
      return;
    }
    siteSearchIconCache.set(cacheKey, iconUrl);
    scheduleSiteSearchIconCacheWrite();
  }

  function getCachedSiteSearchIconUrl(provider) {
    const explicitIcon = getProviderIconUrl(provider);
    if (explicitIcon) {
      const cacheKey = getSiteSearchIconCacheKey(provider);
      if (cacheKey && !siteSearchIconCache.has(cacheKey)) {
        siteSearchIconCache.set(cacheKey, explicitIcon);
        scheduleSiteSearchIconCacheWrite();
      }
      return explicitIcon;
    }
    const cacheKey = getSiteSearchIconCacheKey(provider);
    if (!cacheKey) {
      return '';
    }
    return siteSearchIconCache.get(cacheKey) || '';
  }

  const THEME_STORAGE_KEY = STORAGE_KEYS.THEME_STORAGE_KEY || '_x_extension_theme_mode_2024_unique_';
  const LANGUAGE_STORAGE_KEY = STORAGE_KEYS.LANGUAGE_STORAGE_KEY || '_x_extension_language_2024_unique_';
  const LANGUAGE_MESSAGES_STORAGE_KEY = STORAGE_KEYS.LANGUAGE_MESSAGES_STORAGE_KEY || '_x_extension_language_messages_2024_unique_';
  const RECENT_MODE_STORAGE_KEY = STORAGE_KEYS.RECENT_MODE_STORAGE_KEY || '_x_extension_recent_mode_2024_unique_';
  const RECENT_COUNT_STORAGE_KEY = STORAGE_KEYS.RECENT_COUNT_STORAGE_KEY || '_x_extension_recent_count_2024_unique_';
  const NEWTAB_WIDTH_MODE_STORAGE_KEY = STORAGE_KEYS.NEWTAB_WIDTH_MODE_STORAGE_KEY || '_x_extension_newtab_width_mode_2026_unique_';
  const OVERLAY_SIZE_MODE_STORAGE_KEY = STORAGE_KEYS.OVERLAY_SIZE_MODE_STORAGE_KEY || '_x_extension_overlay_size_mode_2026_unique_';
  const BOOKMARK_COUNT_STORAGE_KEY = STORAGE_KEYS.BOOKMARK_COUNT_STORAGE_KEY || '_x_extension_bookmark_count_2024_unique_';
  const BOOKMARK_COLUMNS_STORAGE_KEY = STORAGE_KEYS.BOOKMARK_COLUMNS_STORAGE_KEY || '_x_extension_bookmark_columns_2024_unique_';
  const AUTO_PIP_ENABLED_STORAGE_KEY = STORAGE_KEYS.AUTO_PIP_ENABLED_STORAGE_KEY || '_x_extension_auto_pip_enabled_2026_unique_';
  const DOCUMENT_PIP_ENABLED_STORAGE_KEY = STORAGE_KEYS.DOCUMENT_PIP_ENABLED_STORAGE_KEY || '_x_extension_document_pip_enabled_2026_unique_';
  const PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY = STORAGE_KEYS.PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY || '_x_extension_pinned_tab_recovery_enabled_2026_unique_';
  const OVERLAY_TAB_PRIORITY_STORAGE_KEY = STORAGE_KEYS.OVERLAY_TAB_PRIORITY_STORAGE_KEY || '_x_extension_overlay_tab_priority_2024_unique_';
  const NEWTAB_WORDMARK_VISIBLE_STORAGE_KEY = STORAGE_KEYS.NEWTAB_WORDMARK_VISIBLE_STORAGE_KEY || '_x_extension_newtab_wordmark_visible_2026_unique_';
  const RESTRICTED_ACTION_STORAGE_KEY = STORAGE_KEYS.RESTRICTED_ACTION_STORAGE_KEY || '_x_extension_restricted_action_2024_unique_';
  const SEARCH_RESULT_PRIORITY_STORAGE_KEY = STORAGE_KEYS.SEARCH_RESULT_PRIORITY_STORAGE_KEY || '_x_extension_search_result_priority_2026_unique_';
  const SITE_SEARCH_ICON_CACHE_STORAGE_KEY = STORAGE_KEYS.SITE_SEARCH_ICON_CACHE_STORAGE_KEY || '_x_extension_site_search_icon_cache_2026_unique_';
  const FALLBACK_SHORTCUT_STORAGE_KEY = STORAGE_KEYS.FALLBACK_SHORTCUT_STORAGE_KEY || '_x_extension_fallback_hotkey_2024_unique_';
  const SITE_SEARCH_STORAGE_KEY = STORAGE_KEYS.SITE_SEARCH_STORAGE_KEY || '_x_extension_site_search_custom_2024_unique_';
  const SITE_SEARCH_DISABLED_STORAGE_KEY = STORAGE_KEYS.SITE_SEARCH_DISABLED_STORAGE_KEY || '_x_extension_site_search_disabled_2024_unique_';
  const SEARCH_BLACKLIST_STORAGE_KEY = STORAGE_KEYS.SEARCH_BLACKLIST_STORAGE_KEY || '_x_extension_search_blacklist_2026_unique_';
  const BLACKLIST_UTILS = globalThis.LumnoBlacklistUtils || {};
  const STORAGE_MIGRATION_UTILS = globalThis.LumnoStorageMigration || {};
  const SETTINGS_UTILS = globalThis.LumnoSettings || {};
  const DEFAULT_SEARCH_ENGINE_STORAGE_KEY = STORAGE_KEYS.DEFAULT_SEARCH_ENGINE_STORAGE_KEY || '_x_extension_default_search_engine_2024_unique_';
  const SYNC_META_KEY = '_x_extension_sync_meta_2024_unique_';
  const SYNC_KEYS = [
    THEME_STORAGE_KEY,
    LANGUAGE_STORAGE_KEY,
    LANGUAGE_MESSAGES_STORAGE_KEY,
    RECENT_MODE_STORAGE_KEY,
    RECENT_COUNT_STORAGE_KEY,
    NEWTAB_WIDTH_MODE_STORAGE_KEY,
    OVERLAY_SIZE_MODE_STORAGE_KEY,
    BOOKMARK_COUNT_STORAGE_KEY,
    BOOKMARK_COLUMNS_STORAGE_KEY,
    AUTO_PIP_ENABLED_STORAGE_KEY,
    DOCUMENT_PIP_ENABLED_STORAGE_KEY,
    PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY,
    OVERLAY_TAB_PRIORITY_STORAGE_KEY,
    NEWTAB_WORDMARK_VISIBLE_STORAGE_KEY,
    RESTRICTED_ACTION_STORAGE_KEY,
    SEARCH_RESULT_PRIORITY_STORAGE_KEY,
    FALLBACK_SHORTCUT_STORAGE_KEY,
    SITE_SEARCH_STORAGE_KEY,
    SITE_SEARCH_DISABLED_STORAGE_KEY,
    SEARCH_BLACKLIST_STORAGE_KEY,
    DEFAULT_SEARCH_ENGINE_STORAGE_KEY
  ];
  const DEBUG_DUPLICATE_CUSTOM_KEY = 'dup';
  const isMacPlatform = String((navigator && navigator.platform) || '').toLowerCase().includes('mac');
  const FORCE_TEXT_KEYCAPS_ON_MAC = false;
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  let mediaListenerAttached = false;
  let defaultSiteSearchProviders = [];
  let customSiteSearchProviders = [];
  let disabledSiteSearchKeys = new Set();
  let toastTimer = null;
  let confirmResolver = null;
  let confirmOffset = { x: 0, y: 0 };
  let confirmClosingTimer = null;
  let bodyFixedSnapshot = null;
  let tooltipEl = null;
  let languageApplyRequestId = 0;
  let editingSiteSearchKey = null;
  let activePopconfirm = null;
  let siteSearchFormExpanded = false;
  let siteSearchRefreshSuppressUntil = 0;
  let siteSearchRefreshTimer = null;
  let siteSearchIconCacheLoaded = false;
  let siteSearchIconCacheLoadPromise = null;
  let siteSearchIconCacheWriteTimer = null;
  const siteSearchIconCache = new Map();
  let currentShortcutLabel = null;
  let isCapturingFallbackShortcut = false;
  let cancelCaptureOnMouseLeave = false;
  let fallbackCaptureStopTimer = null;
  let fallbackShortcutBaseWidth = 0;
  let isFallbackWidthReady = false;
  let searchBlacklistItems = [];

  const SETTINGS_PIXEL_BLAST_CONFIG = Object.freeze({
    color: '#B6BFE4',
    pixelSize: 3,
    patternScale: 2.5,
    patternDensity: 0.6,
    speed: 0.5,
    edgeFade: 0.25
  });

  function hexToRgbTriplet(hex) {
    const normalized = String(hex || '').trim().replace(/^#/, '');
    if (!/^[0-9a-f]{6}$/i.test(normalized)) {
      return [0.25098, 0.4902, 0.82745];
    }
    return [
      parseInt(normalized.slice(0, 2), 16) / 255,
      parseInt(normalized.slice(2, 4), 16) / 255,
      parseInt(normalized.slice(4, 6), 16) / 255
    ];
  }

  function createWebGLShader(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader) {
      return null;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      return shader;
    }
    gl.deleteShader(shader);
    return null;
  }

  function createWebGLProgram(gl, vertexSource, fragmentSource) {
    const vertexShader = createWebGLShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createWebGLShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) {
      if (vertexShader) {
        gl.deleteShader(vertexShader);
      }
      if (fragmentShader) {
        gl.deleteShader(fragmentShader);
      }
      return null;
    }
    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return null;
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return program;
    }
    gl.deleteProgram(program);
    return null;
  }

  function initSettingsPixelBlastBackground(mount) {
    if (!mount) {
      return null;
    }

    const canvas = document.createElement('canvas');
    mount.appendChild(canvas);

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false
    });

    if (!gl) {
      mount.removeChild(canvas);
      return null;
    }

    const vertexSource = `
      attribute vec2 aPosition;

      void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    const fragmentSource = `
      precision highp float;

      uniform vec3 uColor;
      uniform vec2 uResolution;
      uniform float uTime;
      uniform float uPixelSize;
      uniform float uScale;
      uniform float uDensity;
      uniform float uEdgeFade;

      float bayer2(vec2 value) {
        value = floor(value);
        return fract(value.x / 2.0 + value.y * value.y * 0.75);
      }

      float bayer4(vec2 value) {
        return bayer2(value * 0.5) * 0.25 + bayer2(value);
      }

      float bayer8(vec2 value) {
        return bayer4(value * 0.5) * 0.25 + bayer2(value);
      }

      float hash11(float value) {
        return fract(sin(value) * 43758.5453);
      }

      float vnoise(vec3 point) {
        vec3 ip = floor(point);
        vec3 fp = fract(point);
        float n000 = hash11(dot(ip + vec3(0.0, 0.0, 0.0), vec3(1.0, 57.0, 113.0)));
        float n100 = hash11(dot(ip + vec3(1.0, 0.0, 0.0), vec3(1.0, 57.0, 113.0)));
        float n010 = hash11(dot(ip + vec3(0.0, 1.0, 0.0), vec3(1.0, 57.0, 113.0)));
        float n110 = hash11(dot(ip + vec3(1.0, 1.0, 0.0), vec3(1.0, 57.0, 113.0)));
        float n001 = hash11(dot(ip + vec3(0.0, 0.0, 1.0), vec3(1.0, 57.0, 113.0)));
        float n101 = hash11(dot(ip + vec3(1.0, 0.0, 1.0), vec3(1.0, 57.0, 113.0)));
        float n011 = hash11(dot(ip + vec3(0.0, 1.0, 1.0), vec3(1.0, 57.0, 113.0)));
        float n111 = hash11(dot(ip + vec3(1.0, 1.0, 1.0), vec3(1.0, 57.0, 113.0)));
        vec3 smoothFactor = fp * fp * fp * (fp * (fp * 6.0 - 15.0) + 10.0);
        float x00 = mix(n000, n100, smoothFactor.x);
        float x10 = mix(n010, n110, smoothFactor.x);
        float x01 = mix(n001, n101, smoothFactor.x);
        float x11 = mix(n011, n111, smoothFactor.x);
        float y0 = mix(x00, x10, smoothFactor.y);
        float y1 = mix(x01, x11, smoothFactor.y);
        return mix(y0, y1, smoothFactor.z) * 2.0 - 1.0;
      }

      float fbm2(vec2 uv, float timeValue) {
        vec3 point = vec3(uv * uScale, timeValue);
        float amplitude = 1.0;
        float frequency = 1.0;
        float sum = 1.0;
        for (int i = 0; i < 5; ++i) {
          sum += amplitude * vnoise(point * frequency);
          frequency *= 1.25;
          amplitude *= 1.0;
        }
        return sum * 0.5 + 0.5;
      }

      float maskDiamond(vec2 pixelUv, float coverage) {
        float radius = sqrt(max(coverage, 0.0)) * 0.564;
        return step(abs(pixelUv.x - 0.49) + abs(pixelUv.y - 0.49), radius);
      }

      void main() {
        vec2 fragCoord = gl_FragCoord.xy - uResolution * 0.5;
        float aspectRatio = uResolution.x / max(uResolution.y, 1.0);

        vec2 pixelUv = fract(fragCoord / uPixelSize);
        float cellPixelSize = 8.0 * uPixelSize;
        vec2 cellId = floor(fragCoord / cellPixelSize);
        vec2 cellCoord = cellId * cellPixelSize;
        vec2 uv = cellCoord / uResolution * vec2(aspectRatio, 1.0);

        float base = fbm2(uv, uTime * 0.05);
        base = base * 0.5 - 0.65;

        float feed = base + (uDensity - 0.5) * 0.3;
        float bayer = bayer8(fragCoord / uPixelSize) - 0.5;
        float filled = step(0.5, feed + bayer);
        float alpha = maskDiamond(pixelUv, filled);

        if (uEdgeFade > 0.0) {
          vec2 normalized = gl_FragCoord.xy / uResolution;
          float edgeDistance = min(
            min(normalized.x, normalized.y),
            min(1.0 - normalized.x, 1.0 - normalized.y)
          );
          alpha *= smoothstep(0.0, uEdgeFade, edgeDistance);
        }

        gl_FragColor = vec4(uColor, alpha);
      }
    `;

    const program = createWebGLProgram(gl, vertexSource, fragmentSource);
    if (!program) {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      mount.removeChild(canvas);
      return null;
    }

    const positionLocation = gl.getAttribLocation(program, 'aPosition');
    const resolutionLocation = gl.getUniformLocation(program, 'uResolution');
    const timeLocation = gl.getUniformLocation(program, 'uTime');
    const colorLocation = gl.getUniformLocation(program, 'uColor');
    const pixelSizeLocation = gl.getUniformLocation(program, 'uPixelSize');
    const scaleLocation = gl.getUniformLocation(program, 'uScale');
    const densityLocation = gl.getUniformLocation(program, 'uDensity');
    const edgeFadeLocation = gl.getUniformLocation(program, 'uEdgeFade');

    if (
      positionLocation < 0 ||
      !resolutionLocation ||
      !timeLocation ||
      !colorLocation ||
      !pixelSizeLocation ||
      !scaleLocation ||
      !densityLocation ||
      !edgeFadeLocation
    ) {
      gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      mount.removeChild(canvas);
      return null;
    }

    const buffer = gl.createBuffer();
    if (!buffer) {
      gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      mount.removeChild(canvas);
      return null;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1
    ]), gl.STATIC_DRAW);

    gl.useProgram(program);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const color = hexToRgbTriplet(SETTINGS_PIXEL_BLAST_CONFIG.color);
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let rafId = 0;
    let startedAt = performance.now();
    let disposed = false;

    function resizeCanvas() {
      const width = Math.max(1, Math.round(window.innerWidth * Math.min(window.devicePixelRatio || 1, 1.75)));
      const height = Math.max(1, Math.round(window.innerHeight * Math.min(window.devicePixelRatio || 1, 1.75)));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      return { width, height };
    }

    function drawFrame(seconds) {
      if (disposed) {
        return;
      }
      const size = resizeCanvas();
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(resolutionLocation, size.width, size.height);
      gl.uniform1f(timeLocation, seconds * SETTINGS_PIXEL_BLAST_CONFIG.speed);
      gl.uniform3f(colorLocation, color[0], color[1], color[2]);
      gl.uniform1f(pixelSizeLocation, SETTINGS_PIXEL_BLAST_CONFIG.pixelSize * Math.min(window.devicePixelRatio || 1, 1.75));
      gl.uniform1f(scaleLocation, SETTINGS_PIXEL_BLAST_CONFIG.patternScale);
      gl.uniform1f(densityLocation, SETTINGS_PIXEL_BLAST_CONFIG.patternDensity);
      gl.uniform1f(edgeFadeLocation, SETTINGS_PIXEL_BLAST_CONFIG.edgeFade);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    function stopLoop() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }

    function tick(now) {
      rafId = 0;
      if (disposed || document.hidden || reducedMotionQuery.matches) {
        return;
      }
      drawFrame((now - startedAt) / 1000);
      rafId = requestAnimationFrame(tick);
    }

    function startLoop() {
      if (disposed || rafId || reducedMotionQuery.matches || document.hidden) {
        return;
      }
      rafId = requestAnimationFrame(tick);
    }

    function handleResize() {
      const elapsedSeconds = reducedMotionQuery.matches ? 0 : (performance.now() - startedAt) / 1000;
      drawFrame(elapsedSeconds);
    }

    function handleReducedMotionChange() {
      stopLoop();
      startedAt = performance.now();
      drawFrame(0);
      startLoop();
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        stopLoop();
        return;
      }
      if (reducedMotionQuery.matches) {
        drawFrame(0);
        return;
      }
      startedAt = performance.now();
      startLoop();
    }

    const resizeObserver = typeof ResizeObserver === 'function'
      ? new ResizeObserver(handleResize)
      : null;
    resizeObserver?.observe(mount);
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    drawFrame(0);
    startLoop();

    return () => {
      disposed = true;
      stopLoop();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      if (canvas.parentNode === mount) {
        mount.removeChild(canvas);
      }
    };
  }
  let blacklistFormExpanded = false;
  const fallbackSiteSearchProviders = [
    { key: 'yt', aliases: ['youtube'], name: 'YouTube', template: 'https://www.youtube.com/results?search_query={query}' },
    { key: 'bb', aliases: ['bilibili', 'bili'], name: 'Bilibili', template: 'https://search.bilibili.com/all?keyword={query}' },
    { key: 'gh', aliases: ['github'], name: 'GitHub', template: 'https://github.com/search?q={query}' },
    { key: 'gm', aliases: ['gemini'], name: 'Gemini', template: 'https://gemini.google.com/app', action: 'openAndSubmit', submitStrategy: 'geminiPrompt' },
    { key: 'so', aliases: ['baidu', 'bd'], name: 'Baidu', template: 'https://www.baidu.com/s?wd={query}' },
    { key: 'bi', aliases: ['bing'], name: 'Bing', template: 'https://www.bing.com/search?q={query}' },
    { key: 'gg', aliases: ['google'], name: 'Google', template: 'https://www.google.com/search?q={query}' },
    { key: 'zh', aliases: ['zhihu'], name: 'Zhihu', template: 'https://www.zhihu.com/search?q={query}' },
    { key: 'db', aliases: ['douban'], name: 'Douban', template: 'https://www.douban.com/search?q={query}' },
    { key: 'jj', aliases: ['juejin'], name: 'Juejin', template: 'https://juejin.cn/search?query={query}' },
    { key: 'tb', aliases: ['taobao'], name: 'Taobao', template: 'https://s.taobao.com/search?q={query}' },
    { key: 'tm', aliases: ['tmall'], name: 'Tmall', template: 'https://list.tmall.com/search_product.htm?q={query}' },
    { key: 'wx', aliases: ['weixin', 'wechat'], name: 'WeChat', template: 'https://weixin.sogou.com/weixin?query={query}' },
    { key: 'tw', aliases: ['twitter', 'x'], name: 'X', template: 'https://x.com/search?q={query}' },
    { key: 'rd', aliases: ['reddit'], name: 'Reddit', template: 'https://www.reddit.com/search/?q={query}' },
    { key: 'wk', aliases: ['wiki', 'wikipedia'], name: 'Wikipedia', template: 'https://en.wikipedia.org/wiki/Special:Search?search={query}' },
    { key: 'zw', aliases: ['zhwiki'], name: 'Wikipedia', template: 'https://zh.wikipedia.org/wiki/Special:Search?search={query}' }
  ];

  let currentMessages = null;
  let currentLanguageMode = 'system';
  let openCustomSelect = null;

  function normalizeBlacklistMatchModes(value, fallbackMode) {
    if (BLACKLIST_UTILS.normalizeMatchModes) {
      return BLACKLIST_UTILS.normalizeMatchModes(
        value,
        fallbackMode === undefined ? 'prefix' : fallbackMode
      );
    }
    return fallbackMode ? [fallbackMode] : [];
  }

  function normalizeBlacklistPattern(value, matchModes, fallbackMode) {
    if (BLACKLIST_UTILS.normalizePattern) {
      return BLACKLIST_UTILS.normalizePattern(
        value,
        matchModes,
        fallbackMode === undefined ? 'prefix' : fallbackMode
      );
    }
    return '';
  }

  function normalizeSearchBlacklistItems(items) {
    if (BLACKLIST_UTILS.normalizeItems) {
      return BLACKLIST_UTILS.normalizeItems(items, 'prefix');
    }
    return [];
  }

  function buildBlacklistItemKey(item) {
    if (BLACKLIST_UTILS.buildRuleKey) {
      return BLACKLIST_UTILS.buildRuleKey(item, 'prefix');
    }
    return '';
  }

  function migrateStorageIfNeeded(keys) {
    if (!storageArea || !chrome || !chrome.storage || !chrome.storage.local) {
      return;
    }
    if (storageArea === chrome.storage.local) {
      return;
    }
    chrome.storage.local.get(keys, (localResult) => {
      if (chrome.runtime && chrome.runtime.lastError) {
        console.warn('Lumno: failed to read local storage for migration.', chrome.runtime.lastError.message || chrome.runtime.lastError);
        return;
      }
      storageArea.get(keys, (syncResult) => {
        if (chrome.runtime && chrome.runtime.lastError) {
          console.warn('Lumno: failed to read sync storage for migration.', chrome.runtime.lastError.message || chrome.runtime.lastError);
          return;
        }
        const payload = STORAGE_MIGRATION_UTILS.buildMigrationPayload
          ? STORAGE_MIGRATION_UTILS.buildMigrationPayload(keys, localResult, syncResult, {
            skipKeys: [LANGUAGE_MESSAGES_STORAGE_KEY]
          })
          : null;
        if (!payload || Object.keys(payload).length === 0) {
          return;
        }
        storageArea.set(payload, () => {
          if (chrome.runtime && chrome.runtime.lastError) {
            console.warn('Lumno: failed to migrate local settings into sync storage.', chrome.runtime.lastError.message || chrome.runtime.lastError);
          }
        });
      });
    });
  }

  function getMessage(key, fallback) {
    if (currentMessages && Object.prototype.hasOwnProperty.call(currentMessages, key)) {
      const entry = currentMessages[key];
      if (entry && typeof entry.message === 'string') {
        return entry.message;
      }
    }
    if (currentLanguageMode !== 'system') {
      return fallback || '';
    }
    if (chrome && chrome.i18n && chrome.i18n.getMessage) {
      const message = chrome.i18n.getMessage(key);
      if (message) {
        return message;
      }
    }
    return fallback || '';
  }

  function formatTemplate(text, params) {
    return String(text || '').replace(/\{(\w+)\}/g, (match, key) => {
      if (params && Object.prototype.hasOwnProperty.call(params, key)) {
        return String(params[key]);
      }
      return match;
    });
  }

  function normalizeBookmarkCount(value) {
    const parsed = Number.parseInt(value, 10);
    if (parsed === 0 || parsed === 4 || parsed === 8 || parsed === 16 || parsed === 32) {
      return parsed;
    }
    return 8;
  }

  function normalizeRecentCount(value) {
    const parsed = Number.parseInt(value, 10);
    if (parsed === 0 || parsed === 4 || parsed === 8) {
      return parsed;
    }
    return 4;
  }

  function setBlacklistError(message) {
    if (!blacklistError) {
      return;
    }
    const text = String(message || '').trim();
    blacklistError.textContent = text;
    blacklistError.style.display = text ? 'block' : 'none';
  }

  function getBlacklistPatternInputValue(item) {
    if (BLACKLIST_UTILS.getPatternInputValue) {
      return BLACKLIST_UTILS.getPatternInputValue(item);
    }
    return '';
  }

  function setBlacklistFormExpanded(expanded) {
    blacklistFormExpanded = Boolean(expanded);
    if (blacklistForm) {
      blacklistForm.setAttribute('data-expanded', blacklistFormExpanded ? 'true' : 'false');
    }
    if (blacklistFormTrigger) {
      blacklistFormTrigger.setAttribute('aria-expanded', blacklistFormExpanded ? 'true' : 'false');
    }
    if (blacklistCancelButton) {
      blacklistCancelButton.style.display = blacklistFormExpanded ? 'inline-flex' : 'none';
      if (blacklistCancelButton.textContent) {
        blacklistCancelButton.textContent = getMessage('shortcuts_cancel', blacklistCancelButton.textContent);
      }
    }
    if (blacklistFormExpanded && blacklistUrlInput) {
      updateBlacklistInputPresentation();
      blacklistUrlInput.focus();
    }
  }

  function resetBlacklistForm() {
    if (blacklistUrlInput) {
      blacklistUrlInput.value = '';
    }
    if (blacklistAddButton) {
      blacklistAddButton.textContent = getMessage('blacklist_add', '添加到黑名单');
      blacklistAddButton.classList.add('_x_extension_shortcut_save_2024_unique_');
    }
    setBlacklistError('');
    if (blacklistMatchExactInput) {
      blacklistMatchExactInput.checked = false;
    }
    if (blacklistMatchPrefixInput) {
      blacklistMatchPrefixInput.checked = false;
    }
    if (blacklistMatchSuffixInput) {
      blacklistMatchSuffixInput.checked = true;
    }
    syncBlacklistMatchModeAvailability();
    updateBlacklistInputPresentation();
    setBlacklistFormExpanded(false);
  }

  function getBlacklistMatchModesFromForm() {
    return normalizeBlacklistMatchModes([
      blacklistMatchExactInput && blacklistMatchExactInput.checked ? 'exact' : '',
      blacklistMatchPrefixInput && blacklistMatchPrefixInput.checked ? 'prefix' : '',
      blacklistMatchSuffixInput && blacklistMatchSuffixInput.checked ? 'suffix' : ''
    ], null);
  }

  function syncBlacklistMatchModeAvailability(changedMode) {
    syncBlacklistModeSelection(
      {
        exact: blacklistMatchExactInput,
        prefix: blacklistMatchPrefixInput,
        suffix: blacklistMatchSuffixInput
      },
      changedMode,
      {
        exact: blacklistMatchExactWrap,
        prefix: blacklistMatchPrefixWrap,
        suffix: blacklistMatchSuffixWrap
      },
      (modes) => applyBlacklistInputPresentationToElements(
        blacklistUrlLabel,
        blacklistUrlPrefix,
        blacklistUrlInput,
        modes
      )
    );
  }

  function getBlacklistMatchModesSummary(modes) {
    const normalized = normalizeBlacklistMatchModes(modes);
    if (normalized.length === 0) {
      return getMessage('blacklist_match_unset', '未设置匹配方式');
    }
    return normalized.map((mode) => {
      if (mode === 'exact') {
        return getMessage('blacklist_match_exact', '当前页面');
      }
      if (mode === 'suffix') {
        return getMessage('blacklist_match_suffix', '整个网站');
      }
      return getMessage('blacklist_match_prefix', '当前站点路径');
    }).join(' / ');
  }

  function getBlacklistMatchBadgeConfig(modes) {
    const normalized = normalizeBlacklistMatchModes(modes);
    if (normalized.includes('exact')) {
      return {
        tone: 'exact',
        text: getMessage('blacklist_match_exact', '当前页面')
      };
    }
    if (normalized.includes('suffix')) {
      return {
        tone: 'suffix',
        text: getMessage('blacklist_match_suffix', '整个网站')
      };
    }
    return {
      tone: 'prefix',
      text: getMessage('blacklist_match_prefix', '当前站点路径')
    };
  }

  function formatBlacklistPatternForDisplay(item) {
    if (!item || !item.pattern) {
      return '';
    }
    const modes = normalizeBlacklistMatchModes(item.matchModes);
    if (modes.includes('suffix')) {
      return item.pattern;
    }
    return `http(s)://${item.pattern}`;
  }

  function getBlacklistInputConfig(modes) {
    const normalized = normalizeBlacklistMatchModes(modes);
    if (normalized.includes('exact')) {
      return {
        labelKey: 'blacklist_label_url',
        labelFallback: 'URL 规则',
        placeholderKey: 'blacklist_placeholder_exact',
        placeholderFallback: 'example.com/path',
        prefixText: 'http(s)://'
      };
    }
    if (normalized.includes('suffix')) {
      return {
        labelKey: 'blacklist_label_url',
        labelFallback: 'URL 规则',
        placeholderKey: 'blacklist_placeholder_domain',
        placeholderFallback: 'baidu.com',
        prefixText: ''
      };
    }
    return {
      labelKey: 'blacklist_label_url',
      labelFallback: 'URL 规则',
      placeholderKey: 'blacklist_placeholder_prefix',
      placeholderFallback: 'baidu.com 或 baidu.com/search',
      prefixText: 'http(s)://'
    };
  }

  function updateBlacklistInputPresentation() {
    const modes = getBlacklistMatchModesFromForm();
    applyBlacklistInputPresentationToElements(
      blacklistUrlLabel,
      blacklistUrlPrefix,
      blacklistUrlInput,
      modes
    );
    const config = getBlacklistInputConfig(modes);
    if (blacklistUrlLabel) {
      blacklistUrlLabel.setAttribute('data-i18n', config.labelKey);
    }
    if (blacklistUrlInput) {
      blacklistUrlInput.setAttribute('data-i18n-placeholder', config.placeholderKey);
    }
  }

  function applyBlacklistInputPresentationToElements(labelNode, prefixNode, inputNode, modes) {
    const config = getBlacklistInputConfig(modes);
    if (labelNode) {
      labelNode.textContent = getMessage(config.labelKey, config.labelFallback);
    }
    if (prefixNode) {
      prefixNode.textContent = config.prefixText;
      prefixNode.style.display = config.prefixText ? 'block' : 'none';
    }
    const affixNode = inputNode && inputNode.closest
      ? inputNode.closest('._x_extension_shortcut_input_affix_2026_unique_')
      : null;
    if (affixNode) {
      affixNode.setAttribute('data-has-prefix', config.prefixText ? 'true' : 'false');
    }
    if (inputNode) {
      inputNode.placeholder = getMessage(config.placeholderKey, config.placeholderFallback);
    }
  }

  function setInlineError(node, message) {
    if (!node) {
      return;
    }
    const text = String(message || '').trim();
    node.textContent = text;
    node.style.display = text ? 'block' : 'none';
  }

  function syncBlacklistModeSelection(modeInputs, changedMode, wrapMap, onAfterSync) {
    const changedInput = changedMode ? modeInputs[changedMode] : null;
    if (changedInput && changedInput.checked) {
      if (changedMode === 'exact') {
        if (modeInputs.prefix) modeInputs.prefix.checked = false;
        if (modeInputs.suffix) modeInputs.suffix.checked = false;
      }
      if (changedMode === 'prefix') {
        if (modeInputs.exact) modeInputs.exact.checked = false;
        if (modeInputs.suffix) modeInputs.suffix.checked = false;
      }
      if (changedMode === 'suffix') {
        if (modeInputs.exact) modeInputs.exact.checked = false;
        if (modeInputs.prefix) modeInputs.prefix.checked = false;
      }
    }
    const modes = normalizeBlacklistMatchModes([
      modeInputs.exact && modeInputs.exact.checked ? 'exact' : '',
      modeInputs.prefix && modeInputs.prefix.checked ? 'prefix' : '',
      modeInputs.suffix && modeInputs.suffix.checked ? 'suffix' : ''
    ], null);
    if (modeInputs.exact) {
      modeInputs.exact.checked = modes.includes('exact');
      modeInputs.exact.disabled = false;
    }
    if (modeInputs.prefix) {
      modeInputs.prefix.checked = modes.includes('prefix');
      modeInputs.prefix.disabled = false;
    }
    if (modeInputs.suffix) {
      modeInputs.suffix.checked = modes.includes('suffix');
      modeInputs.suffix.disabled = false;
    }
    Object.keys(wrapMap || {}).forEach((key) => {
      const wrap = wrapMap[key];
      if (wrap) {
        wrap.setAttribute('data-disabled', 'false');
      }
    });
    if (typeof onAfterSync === 'function') {
      onAfterSync(modes);
    }
    return modes;
  }

  function createBlacklistModeOption(textKey, fallback, tooltipKey, tooltipFallback) {
    const wrap = document.createElement('label');
    wrap.className = '_x_extension_blacklist_match_mode_2026_unique_';
    const input = document.createElement('input');
    input.type = 'checkbox';
    const text = document.createElement('span');
    text.textContent = getMessage(textKey, fallback);
    const hint = document.createElement('span');
    hint.className = '_x_extension_shortcut_hint_2024_unique_ _x_extension_tooltip_host_2024_unique_';
    hint.setAttribute('data-tooltip', getMessage(tooltipKey, tooltipFallback));
    hint.innerHTML = getRiSvg('ri-question-line', 'ri-size-14');
    wrap.appendChild(input);
    wrap.appendChild(text);
    wrap.appendChild(hint);
    return { wrap, input };
  }

  function buildBlacklistRuleDraft(inputValue, matchModes) {
    if (!Array.isArray(matchModes) || matchModes.length === 0) {
      return {
        error: getMessage('blacklist_error_match_mode', '请选择至少一种匹配方式')
      };
    }
    const pattern = normalizeBlacklistPattern(inputValue, matchModes, null);
    if (!pattern) {
      return {
        error: matchModes.includes('suffix')
          ? getMessage('blacklist_error_domain', '请输入网站域名')
          : getMessage('blacklist_error_url', '请输入站点域名或完整 URL')
      };
    }
    return {
      item: {
        pattern: pattern,
        matchModes: matchModes
      }
    };
  }

  function upsertBlacklistItems(nextItem, replacedRuleKey) {
    const nextKey = buildBlacklistItemKey(nextItem);
    return [{ pattern: nextItem.pattern, matchModes: nextItem.matchModes }].concat(
      searchBlacklistItems.filter((entry) => {
        const entryKey = buildBlacklistItemKey(entry);
        return entryKey !== replacedRuleKey && entryKey !== nextKey;
      })
    );
  }

  function persistBlacklistItems(nextItems, successMessage) {
    return saveSearchBlacklistItems(nextItems).then((savedItems) => {
      searchBlacklistItems = savedItems;
      renderSearchBlacklistList();
      notifyNewtabSectionsRefresh('recent');
      if (successMessage) {
        showToast(successMessage, false);
      }
      return savedItems;
    });
  }

  function normalizeBookmarkColumns(value) {
    const parsed = Number.parseInt(value, 10);
    if (parsed === 4 || parsed === 6 || parsed === 8) {
      return parsed;
    }
    return 4;
  }

  function normalizeNewtabWidthMode(value) {
    return value === 'standard' ? 'standard' : 'wide';
  }

  function normalizeOverlaySizeMode(value) {
    if (value === 'compact' || value === 'large') {
      return value;
    }
    return 'standard';
  }

  function updateBookmarkColumnsSelectVisibility(countValue) {
    if (!bookmarkColumnsSelectWrap) {
      return;
    }
    const parsed = Number.parseInt(countValue, 10);
    const shouldHide = Number.isFinite(parsed) ? parsed <= 0 : false;
    bookmarkColumnsSelectWrap.style.setProperty('display', shouldHide ? 'none' : 'inline-flex');
    bookmarkColumnsSelectWrap.setAttribute('aria-hidden', shouldHide ? 'true' : 'false');
  }

  function normalizeOverlayTabQuickSwitch(value) {
    if (SETTINGS_UTILS.normalizeOverlayTabQuickSwitch) {
      return SETTINGS_UTILS.normalizeOverlayTabQuickSwitch(value);
    }
    if (value === 'switchTabFirst') {
      return true;
    }
    if (value === 'newtabFirst') {
      return false;
    }
    if (value === false) {
      return false;
    }
    return true;
  }

  function normalizeNewtabWordmarkVisible(value) {
    return value !== false;
  }

  function normalizeAutoPipEnabled(value) {
    return value !== false;
  }

  function normalizeDocumentPipEnabled(value) {
    return value === true;
  }

  function normalizePinnedTabRecoveryEnabled(value) {
    return value === true;
  }

  function normalizeSearchResultPriority(value) {
    return value === 'search' ? 'search' : 'autocomplete';
  }

  function updateInlineTabsIndicator(wrapper, indicator, activeSelector) {
    if (!wrapper || !indicator) {
      return;
    }
    const activeButton = wrapper.querySelector(activeSelector);
    if (!activeButton) {
      indicator.style.width = '0px';
      return;
    }
    const containerRect = wrapper.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();
    const inset = 3;
    const offset = Math.round(buttonRect.left - containerRect.left - inset);
    indicator.style.width = `${Math.round(buttonRect.width)}px`;
    indicator.style.transform = `translateX(${offset}px)`;
  }

  function updateRecentModeTabsIndicator() {
    updateInlineTabsIndicator(
      recentModeTabsWrap,
      recentModeTabsIndicator,
      'button[data-recent-mode][data-active="true"]'
    );
  }

  function updateRestrictedActionTabsIndicator() {
    updateInlineTabsIndicator(
      restrictedActionSelectWrap,
      restrictedActionTabsIndicator,
      'button[data-restricted-action][data-active="true"]'
    );
  }

  function updateSearchResultPriorityTabsIndicator() {
    updateInlineTabsIndicator(
      searchResultPriorityTabsWrap,
      searchResultPriorityTabsIndicator,
      'button[data-search-result-priority][data-active="true"]'
    );
  }

  function updateOverlaySizeTabsIndicator() {
    updateInlineTabsIndicator(
      overlaySizeTabsWrap,
      overlaySizeTabsIndicator,
      'button[data-overlay-size][data-active="true"]'
    );
  }

  function updateSiteSearchBuiltinTabsIndicator() {
    updateInlineTabsIndicator(
      siteSearchBuiltinTabsWrap,
      siteSearchBuiltinTabsIndicator,
      'button[data-site-search-builtin-tab][data-active="true"]'
    );
  }

  function updateNewtabWidthTabsIndicator() {
    updateInlineTabsIndicator(
      newtabWidthTabsWrap,
      newtabWidthTabsIndicator,
      'button[data-newtab-width][data-active="true"]'
    );
  }

  function refreshAllTabsIndicators() {
    updateTabIndicator();
    updateThemeIndicator();
    updateNewtabWidthTabsIndicator();
    updateRecentModeTabsIndicator();
    updateOverlaySizeTabsIndicator();
    updateSiteSearchBuiltinTabsIndicator();
    updateRestrictedActionTabsIndicator();
    updateSearchResultPriorityTabsIndicator();
  }

  function scheduleTabsIndicatorsRefresh(framePasses) {
    const passes = Number.isFinite(framePasses) && framePasses > 0 ? Math.floor(framePasses) : 2;
    const run = (remaining) => {
      if (remaining <= 0) {
        refreshAllTabsIndicators();
        return;
      }
      requestAnimationFrame(() => run(remaining - 1));
    };
    run(passes);
  }

  function setRecentModeTabState(mode) {
    const nextMode = mode === 'most' ? 'most' : 'latest';
    recentModeTabButtons.forEach((button) => {
      const buttonMode = button.getAttribute('data-recent-mode') === 'most' ? 'most' : 'latest';
      const active = buttonMode === nextMode;
      button.setAttribute('data-active', active ? 'true' : 'false');
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    requestAnimationFrame(updateRecentModeTabsIndicator);
  }

  function setOverlaySizeTabState(mode) {
    const nextMode = normalizeOverlaySizeMode(mode);
    overlaySizeTabButtons.forEach((button) => {
      const buttonMode = normalizeOverlaySizeMode(button.getAttribute('data-overlay-size'));
      const active = buttonMode === nextMode;
      button.setAttribute('data-active', active ? 'true' : 'false');
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    requestAnimationFrame(updateOverlaySizeTabsIndicator);
  }

  function setSiteSearchBuiltinTabState(tabKey) {
    const nextTab = tabKey === 'ai' ? 'ai' : 'builtin';
    siteSearchBuiltinTabButtons.forEach((button) => {
      const buttonTab = button.getAttribute('data-site-search-builtin-tab') === 'ai' ? 'ai' : 'builtin';
      const active = buttonTab === nextTab;
      button.setAttribute('data-active', active ? 'true' : 'false');
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    if (siteSearchBuiltinPanel) {
      siteSearchBuiltinPanel.setAttribute('data-active', nextTab === 'builtin' ? 'true' : 'false');
    }
    if (siteSearchAiPanel) {
      siteSearchAiPanel.setAttribute('data-active', nextTab === 'ai' ? 'true' : 'false');
    }
    requestAnimationFrame(updateSiteSearchBuiltinTabsIndicator);
  }

  function setNewtabWidthTabState(mode) {
    const nextMode = normalizeNewtabWidthMode(mode);
    newtabWidthTabButtons.forEach((button) => {
      const buttonMode = normalizeNewtabWidthMode(button.getAttribute('data-newtab-width'));
      const active = buttonMode === nextMode;
      button.setAttribute('data-active', active ? 'true' : 'false');
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    requestAnimationFrame(updateNewtabWidthTabsIndicator);
  }

  function updateRecentModeTabsVisibility(countValue) {
    if (!recentModeTabsWrap) {
      return;
    }
    const parsed = Number.parseInt(countValue, 10);
    const shouldHide = Number.isFinite(parsed) ? parsed <= 0 : false;
    recentModeTabsWrap.style.setProperty('display', shouldHide ? 'none' : 'flex');
    recentModeTabsWrap.setAttribute('aria-hidden', shouldHide ? 'true' : 'false');
    if (!shouldHide) {
      requestAnimationFrame(() => {
        requestAnimationFrame(updateRecentModeTabsIndicator);
      });
    }
  }

  function setRestrictedActionTabState(action) {
    const nextAction = action === 'none' ? 'none' : 'default';
    restrictedActionTabButtons.forEach((button) => {
      const buttonAction = button.getAttribute('data-restricted-action') === 'none' ? 'none' : 'default';
      const active = buttonAction === nextAction;
      button.setAttribute('data-active', active ? 'true' : 'false');
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    requestAnimationFrame(updateRestrictedActionTabsIndicator);
  }

  function setSearchResultPriorityTabState(priority) {
    const nextPriority = normalizeSearchResultPriority(priority);
    searchResultPriorityTabButtons.forEach((button) => {
      const buttonPriority = normalizeSearchResultPriority(button.getAttribute('data-search-result-priority'));
      const active = buttonPriority === nextPriority;
      button.setAttribute('data-active', active ? 'true' : 'false');
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    requestAnimationFrame(updateSearchResultPriorityTabsIndicator);
  }

  function storageGet(area, keys) {
    return new Promise((resolve) => {
      if (!area) {
        resolve({});
        return;
      }
      area.get(keys, (result) => resolve(result || {}));
    });
  }

  function storageSet(area, payload) {
    return new Promise((resolve, reject) => {
      if (!area) {
        resolve();
        return;
      }
      area.set(payload, () => {
        if (chrome.runtime && chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message || 'storage set failed'));
          return;
        }
        resolve();
      });
    });
  }

  function storageRemove(area, key) {
    return new Promise((resolve, reject) => {
      if (!area) {
        resolve();
        return;
      }
      area.remove([key], () => {
        if (chrome.runtime && chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message || 'storage remove failed'));
          return;
        }
        resolve();
      });
    });
  }

  function notifyNewtabSectionsRefresh(section) {
    if (!chrome || !chrome.runtime || typeof chrome.runtime.sendMessage !== 'function') {
      return;
    }
    try {
      chrome.runtime.sendMessage(
        { action: 'lumno:newtab-refresh-sections', section: section || 'all' },
        () => {
          if (chrome.runtime && chrome.runtime.lastError) {
            return;
          }
        }
      );
    } catch (error) {
      // Ignore runtime messaging errors.
    }
  }

  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const key = node.getAttribute('data-i18n');
      if (!key) {
        return;
      }
      const fallback = node.textContent || '';
      const rawMessage = getMessage(key, fallback);
      const message = formatTemplate(rawMessage, { name: 'Lumno' });
      node.textContent = message;
      if (node.tagName === 'OPTION') {
        node.label = message;
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
      const key = node.getAttribute('data-i18n-placeholder');
      if (!key) {
        return;
      }
      const fallback = node.getAttribute('placeholder') || '';
      const message = getMessage(key, fallback);
      node.setAttribute('placeholder', message);
    });
    document.querySelectorAll('[data-i18n-tooltip]').forEach((node) => {
      const key = node.getAttribute('data-i18n-tooltip');
      if (!key) {
        return;
      }
      const fallback = node.getAttribute('data-tooltip') || '';
      const message = getMessage(key, fallback);
      node.setAttribute('data-tooltip', message);
      if (node.getAttribute('title')) {
        node.setAttribute('title', message);
      }
      if (node.getAttribute('aria-label')) {
        node.setAttribute('aria-label', message);
      }
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach((node) => {
      const key = node.getAttribute('data-i18n-aria-label');
      if (!key) {
        return;
      }
      const fallback = node.getAttribute('aria-label') || '';
      const message = getMessage(key, fallback);
      node.setAttribute('aria-label', message);
    });
    if (fallbackShortcutInput && fallbackShortcutTokens) {
      fallbackShortcutTokens.setAttribute('data-placeholder', fallbackShortcutInput.getAttribute('placeholder') || '');
      renderFallbackShortcutTokens(currentShortcutLabel || '');
    }
  }

  function ensureTooltipElement() {
    if (tooltipEl) {
      return tooltipEl;
    }
    tooltipEl = document.createElement('div');
    tooltipEl.className = '_x_extension_tooltip_2024_unique_';
    tooltipEl.setAttribute('data-show', 'false');
    document.body.appendChild(tooltipEl);
    return tooltipEl;
  }

  function showTooltipFor(target) {
    if (!target) {
      return;
    }
    const text = target.getAttribute('data-tooltip');
    if (!text) {
      return;
    }
    const el = ensureTooltipElement();
    const lines = String(text)
      .split('\n')
      .map((line) => line.trimEnd());
    el.replaceChildren();
    lines.forEach((line) => {
      const node = document.createElement('span');
      if (line === '────────') {
        node.className = '_x_extension_tooltip_divider_2026_unique_';
      } else {
        node.className = '_x_extension_tooltip_line_2026_unique_';
        node.textContent = line;
      }
      el.appendChild(node);
    });
    const rect = target.getBoundingClientRect();
    const tooltipRect = el.getBoundingClientRect();
    const spacing = 8;
    let top = rect.top - tooltipRect.height - spacing;
    let left = rect.left + (rect.width - tooltipRect.width) / 2;
    if (top < 8) {
      top = rect.bottom + spacing;
    }
    if (left < 8) {
      left = 8;
    }
    const maxLeft = window.innerWidth - tooltipRect.width - 8;
    if (left > maxLeft) {
      left = Math.max(8, maxLeft);
    }
    el.style.top = `${Math.round(top)}px`;
    el.style.left = `${Math.round(left)}px`;
    el.setAttribute('data-show', 'true');
  }

  function hideTooltip() {
    if (!tooltipEl) {
      return;
    }
    tooltipEl.setAttribute('data-show', 'false');
  }

  function initTooltips() {
    const nodes = Array.from(document.querySelectorAll('[data-tooltip]'));
    nodes.forEach((node) => {
      if (node.dataset.tooltipBound === 'true') {
        return;
      }
      node.dataset.tooltipBound = 'true';
      node.classList.add('_x_extension_tooltip_host_2024_unique_');
      node.addEventListener('mouseenter', () => showTooltipFor(node));
      node.addEventListener('mouseleave', hideTooltip);
      node.addEventListener('focus', () => showTooltipFor(node));
      node.addEventListener('blur', hideTooltip);
    });
  }

  function getCustomSelectElements(wrapper) {
    if (!wrapper) {
      return {};
    }
    const selectId = wrapper.getAttribute('data-select');
    const select = selectId ? document.getElementById(selectId) : wrapper.querySelector('select');
    const trigger = wrapper.querySelector('._x_extension_select_trigger_2024_unique_');
    const menu = wrapper.querySelector('._x_extension_select_menu_2024_unique_');
    return { select, trigger, menu };
  }

  function setCustomSelectActiveIndex(wrapper, nextIndex) {
    const { menu } = getCustomSelectElements(wrapper);
    if (!menu) {
      return;
    }
    const items = Array.from(menu.children);
    if (items.length === 0) {
      return;
    }
    let index = Number.isFinite(nextIndex) ? nextIndex : 0;
    if (index < 0) {
      index = items.length - 1;
    }
    if (index >= items.length) {
      index = 0;
    }
    wrapper.setAttribute('data-active-index', String(index));
    items.forEach((item, itemIndex) => {
      if (itemIndex === index) {
        item.setAttribute('data-active', 'true');
      } else {
        item.removeAttribute('data-active');
      }
    });
  }

  function getCustomSelectActiveIndex(wrapper) {
    if (!wrapper) {
      return 0;
    }
    const raw = wrapper.getAttribute('data-active-index');
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function closeCustomSelect() {
    if (!openCustomSelect) {
      return;
    }
    openCustomSelect.setAttribute('data-open', 'false');
    const trigger = openCustomSelect.querySelector('._x_extension_select_trigger_2024_unique_');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
    }
    openCustomSelect = null;
  }

  function setCustomSelectOpen(wrapper, nextOpen) {
    if (!wrapper) {
      return;
    }
    if (nextOpen) {
      if (openCustomSelect && openCustomSelect !== wrapper) {
        closeCustomSelect();
      }
      wrapper.setAttribute('data-open', 'true');
      const trigger = wrapper.querySelector('._x_extension_select_trigger_2024_unique_');
      if (trigger) {
        trigger.setAttribute('aria-expanded', 'true');
      }
      const { select, menu } = getCustomSelectElements(wrapper);
      if (select && menu) {
        const selectedIndex = select.selectedIndex >= 0 ? select.selectedIndex : 0;
        setCustomSelectActiveIndex(wrapper, selectedIndex);
      }
      requestAnimationFrame(() => updateCustomSelectMenuWidth(wrapper));
      openCustomSelect = wrapper;
    } else if (openCustomSelect === wrapper) {
      closeCustomSelect();
    }
  }

  function syncCustomSelectUI(select, wrapper) {
    if (!select || !wrapper) {
      return;
    }
    const { trigger, menu } = getCustomSelectElements(wrapper);
    if (!trigger || !menu) {
      return;
    }
    const selected = select.options[select.selectedIndex];
    const label = selected ? (selected.label || selected.textContent || '') : '';
    let labelEl = trigger.querySelector('._x_extension_select_label_2024_unique_');
    if (!labelEl) {
      labelEl = document.createElement('span');
      labelEl.className = '_x_extension_select_label_2024_unique_';
      trigger.insertBefore(labelEl, trigger.firstChild);
    }
    labelEl.textContent = label;
    Array.from(menu.children).forEach((item) => {
      const value = item.getAttribute('data-value');
      const isSelected = value === select.value;
      item.setAttribute('data-selected', isSelected ? 'true' : 'false');
      item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
  }

  function buildCustomSelectMenu(select, wrapper) {
    if (!select || !wrapper) {
      return;
    }
    const { menu } = getCustomSelectElements(wrapper);
    if (!menu) {
      return;
    }
    menu.innerHTML = '';
    Array.from(select.options).forEach((option) => {
      const item = document.createElement('div');
      item.className = '_x_extension_select_option_2024_unique_';
      item.setAttribute('role', 'option');
      item.setAttribute('data-value', option.value);
      item.textContent = option.label || option.textContent || '';
      item.addEventListener('click', () => {
        if (select.value !== option.value) {
          select.value = option.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
        syncCustomSelectUI(select, wrapper);
        setCustomSelectOpen(wrapper, false);
      });
      menu.appendChild(item);
    });
    syncCustomSelectUI(select, wrapper);
    updateCustomSelectMenuWidth(wrapper);
  }

  function refreshCustomSelects() {
    customSelectWraps.forEach((wrapper) => {
      const { select } = getCustomSelectElements(wrapper);
      if (!select) {
        return;
      }
      buildCustomSelectMenu(select, wrapper);
    });
    syncFallbackShortcutWrapWidth();
  }

  function syncFallbackShortcutWrapWidth() {
    if (!fallbackShortcutWrap || !restrictedActionSelectWrap) {
      return;
    }
    const width = Math.round(restrictedActionSelectWrap.getBoundingClientRect().width);
    if (!Number.isFinite(width) || width <= 0) {
      return;
    }
    fallbackShortcutBaseWidth = width;
    updateFallbackShortcutWrapWidthForContent();
  }

  function updateFallbackShortcutWrapWidthForContent() {
    if (!fallbackShortcutWrap) {
      return;
    }
    const fallbackBase = Math.max(120, Number.isFinite(fallbackShortcutBaseWidth) ? fallbackShortcutBaseWidth : 0);
    let nextWidth = fallbackBase || Math.round(fallbackShortcutWrap.getBoundingClientRect().width) || 180;
    if (fallbackShortcutTokens) {
      const tokenEls = Array.from(fallbackShortcutTokens.children || []);
      if (tokenEls.length > 0) {
        const style = window.getComputedStyle(fallbackShortcutTokens);
        const gap = Number.parseFloat(style.columnGap || style.gap) || 0;
        const paddingLeft = Number.parseFloat(style.paddingLeft) || 0;
        const paddingRight = Number.parseFloat(style.paddingRight) || 0;
        const contentWidth = tokenEls.reduce((sum, el) => sum + Math.ceil(el.getBoundingClientRect().width), 0)
          + Math.max(0, tokenEls.length - 1) * gap;
        const requiredWidth = Math.ceil(contentWidth + paddingLeft + paddingRight + 2);
        nextWidth = Math.max(nextWidth, requiredWidth);
      }
    }
    fallbackShortcutWrap.style.width = `${nextWidth}px`;
    if (!isFallbackWidthReady) {
      requestAnimationFrame(() => {
        isFallbackWidthReady = true;
        if (fallbackShortcutWrap) {
          fallbackShortcutWrap.setAttribute('data-width-ready', 'true');
        }
      });
    }
  }

  function updateCustomSelectMenuWidth(wrapper) {
    const { menu, trigger } = getCustomSelectElements(wrapper);
    if (!menu || !trigger) {
      return;
    }
    const triggerRect = trigger.getBoundingClientRect();
    const baseWidth = Math.round(triggerRect.width);
    if (!Number.isFinite(baseWidth) || baseWidth <= 0) {
      return;
    }
    menu.style.minWidth = `${baseWidth}px`;
    menu.style.width = `${baseWidth}px`;
    menu.style.right = '0';

    const menuStyle = window.getComputedStyle(menu);
    const padLeft = Number.parseFloat(menuStyle.paddingLeft) || 0;
    const padRight = Number.parseFloat(menuStyle.paddingRight) || 0;
    const availableWidth = Math.max(0, menu.clientWidth - padLeft - padRight);
    let needsExpand = false;
    Array.from(menu.children).forEach((item) => {
      if (item.scrollWidth > availableWidth + 1) {
        needsExpand = true;
      }
    });

    if (!needsExpand) {
      return;
    }

    let maxItemWidth = 0;
    Array.from(menu.children).forEach((item) => {
      if (item.scrollWidth > maxItemWidth) {
        maxItemWidth = item.scrollWidth;
      }
    });
    const naturalWidth = Math.ceil(maxItemWidth + padLeft + padRight);
    if (Number.isFinite(naturalWidth) && naturalWidth > baseWidth) {
      menu.style.width = `${naturalWidth}px`;
    }
  }

  function updateBuiltinResetTooltip() {
    if (!builtinResetButton) {
      return;
    }
    const text = getMessage('shortcuts_reset_builtin', '重置为初始列表');
    builtinResetButton.title = text;
    builtinResetButton.setAttribute('aria-label', text);
    builtinResetButton.setAttribute('data-tooltip', text);
  }

  function updateCustomClearTooltip() {
    if (!customClearButton) {
      return;
    }
    const text = getMessage('shortcuts_clear_custom', '清空自定义');
    customClearButton.title = text;
    customClearButton.setAttribute('aria-label', text);
    customClearButton.setAttribute('data-tooltip', text);
  }

  function updateBlacklistClearTooltip() {
    if (!blacklistClearButton) {
      return;
    }
    const text = getMessage('blacklist_clear', '清空黑名单');
    blacklistClearButton.title = text;
    blacklistClearButton.setAttribute('aria-label', text);
    blacklistClearButton.setAttribute('data-tooltip', text);
  }

  function showToast(message, isError) {
    if (!toastElement) {
      return;
    }
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    toastElement.textContent = message;
    if (isError) {
      toastElement.style.setProperty('background', 'rgba(153, 27, 27, 0.92)');
    } else {
      toastElement.style.removeProperty('background');
    }
    toastElement.setAttribute('data-show', 'true');
    toastTimer = setTimeout(() => {
      toastElement.setAttribute('data-show', 'false');
    }, 2200);
  }

  function setSyncButtonEnabled(button, enabled) {
    if (!button) {
      return;
    }
    button.setAttribute('data-disabled', enabled ? 'false' : 'true');
  }


  function formatSyncTime(timestamp) {
    if (!timestamp) {
      return '';
    }
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      return '';
    }
  }

  function updateSyncStatusText(statusKey, fallback, params) {
    if (!syncStatus) {
      return;
    }
    let statusStyle = '';
    let tooltipKey = 'sync_status_hint';
    if (statusKey === 'sync_status_ready' || statusKey === 'sync_status_done') {
      statusStyle = 'success';
      tooltipKey = 'sync_status_hint';
    } else if (statusKey === 'sync_status_failed' || statusKey === 'sync_status_failed_reason' || statusKey === 'sync_status_unavailable') {
      statusStyle = 'danger';
      tooltipKey = 'sync_status_unavailable_hint';
    }
    if (statusStyle) {
      syncStatus.setAttribute('data-status', statusStyle);
    } else {
      syncStatus.removeAttribute('data-status');
    }
    if (syncStatus.hasAttribute('data-i18n-tooltip')) {
      syncStatus.setAttribute('data-i18n-tooltip', tooltipKey);
    }
    syncStatus.setAttribute('data-tooltip', getMessage(tooltipKey, syncStatus.getAttribute('data-tooltip') || ''));
    const template = getMessage(statusKey, fallback);
    const target = syncStatusText || syncStatus;
    target.textContent = params ? formatTemplate(template, params) : template;
  }

  function updateSyncNowTooltip(timeText) {
    if (!syncNowButton) {
      return;
    }
    if (!timeText) {
      syncNowButton.setAttribute('data-tooltip', getMessage('sync_tooltip_default', '手动同步'));
      return;
    }
    const template = getMessage('sync_tooltip_last_manual', '最近导入/手动同步 {time}');
    syncNowButton.setAttribute('data-tooltip', formatTemplate(template, { time: timeText }));
    if (syncNowButton.matches(':hover') || syncNowButton.matches(':focus')) {
      showTooltipFor(syncNowButton);
    }
  }

  function refreshSyncStatus() {
    if (!syncStatus) {
      return;
    }
    if (!storageArea) {
      updateSyncStatusText('sync_status_unavailable', '同步不可用');
      setSyncButtonEnabled(syncNowButton, false);
      setSyncButtonEnabled(syncExportButton, false);
      setSyncButtonEnabled(syncImportButton, false);
      return;
    }
    if (storageAreaName !== 'sync') {
      updateSyncStatusText('sync_status_unavailable', '同步不可用');
      setSyncButtonEnabled(syncNowButton, false);
      setSyncButtonEnabled(syncExportButton, true);
      setSyncButtonEnabled(syncImportButton, true);
      return;
    }
    setSyncButtonEnabled(syncNowButton, true);
    setSyncButtonEnabled(syncExportButton, true);
    setSyncButtonEnabled(syncImportButton, true);
    updateSyncStatusText('sync_status_ready', '同步已开启');
    storageArea.get([SYNC_META_KEY], (result) => {
      const meta = result ? result[SYNC_META_KEY] : null;
      const lastSyncAt = meta && meta.lastSyncAt ? meta.lastSyncAt : '';
      updateSyncNowTooltip(lastSyncAt ? formatSyncTime(lastSyncAt) : '');
    });
  }

  function buildSyncPayload(result) {
    const data = {};
    SYNC_KEYS.forEach((key) => {
      if (typeof result[key] !== 'undefined') {
        data[key] = result[key];
      }
    });
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      data
    };
  }

  function downloadJson(filename, payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  /*
  function showConfirm(message, trigger) {
    if (!confirmMask || !confirmMessage || !confirmOk || !confirmCancel || !confirmDialog) {
      return Promise.resolve(false);
    }
    if (confirmClosingTimer) {
      clearTimeout(confirmClosingTimer);
      confirmClosingTimer = null;
    }
    confirmMessage.textContent = message;
    confirmMask.setAttribute('data-show', 'true');
    if (confirmDialog) {
      confirmDialog.style.removeProperty('transform');
      confirmDialog.style.removeProperty('opacity');
    }
    if (!bodyFixedSnapshot) {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      bodyFixedSnapshot = {
        position: document.body.style.position,
        top: document.body.style.top,
        left: document.body.style.left,
        right: document.body.style.right,
        width: document.body.style.width
      };
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.dataset._xScrollY = String(scrollY);
    }
    const rect = trigger && trigger.getBoundingClientRect ? trigger.getBoundingClientRect() : null;
    const centerX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const centerY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    const offsetX = centerX - window.innerWidth / 2;
    const offsetY = centerY - window.innerHeight / 2;
    confirmOffset = { x: offsetX, y: offsetY };
    confirmDialog.style.setProperty('transform', `translate(${offsetX}px, ${offsetY}px) scale(0.6)`);
    confirmDialog.style.setProperty('opacity', '0');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        confirmDialog.style.setProperty('transform', 'translate(0, 0) scale(1)');
        confirmDialog.style.setProperty('opacity', '1');
      });
    });
    return new Promise((resolve) => {
      confirmResolver = resolve;
    });
  }

  function closeConfirm(result) {
    if (!confirmMask) {
      return;
    }
    if (confirmDialog) {
      confirmDialog.style.setProperty('transform', `translate(${confirmOffset.x}px, ${confirmOffset.y}px) scale(0.6)`);
      confirmDialog.style.setProperty('opacity', '0');
    }
    confirmClosingTimer = setTimeout(() => {
      confirmMask.setAttribute('data-show', 'false');
      if (confirmDialog) {
        confirmDialog.style.removeProperty('transform');
        confirmDialog.style.removeProperty('opacity');
      }
      if (bodyFixedSnapshot) {
        const restoreY = Number.parseFloat(document.body.dataset._xScrollY || '0') || 0;
        document.body.style.position = bodyFixedSnapshot.position;
        document.body.style.top = bodyFixedSnapshot.top;
        document.body.style.left = bodyFixedSnapshot.left;
        document.body.style.right = bodyFixedSnapshot.right;
        document.body.style.width = bodyFixedSnapshot.width;
        bodyFixedSnapshot = null;
        delete document.body.dataset._xScrollY;
        window.scrollTo(0, restoreY);
      }
      confirmClosingTimer = null;
    }, 340);
    if (confirmResolver) {
      confirmResolver(result);
      confirmResolver = null;
    }
  }
  */

  function closeActivePopconfirm() {
    if (activePopconfirm) {
      activePopconfirm.setAttribute('data-open', 'false');
      activePopconfirm = null;
    }
  }

  function attachPopconfirm(trigger, messageKey, fallbackMessage, onConfirm) {
    if (!trigger || !trigger.parentNode) {
      return;
    }
    const wrap = document.createElement('div');
    wrap.className = '_x_extension_popconfirm_wrap_2024_unique_';
    const popconfirm = document.createElement('div');
    popconfirm.className = '_x_extension_popconfirm_2024_unique_';
    popconfirm.setAttribute('data-open', 'false');
    const popText = document.createElement('div');
    popText.className = '_x_extension_popconfirm_text_2024_unique_';
    popText.setAttribute('data-i18n', messageKey);
    popText.textContent = getMessage(messageKey, fallbackMessage);
    const popActions = document.createElement('div');
    popActions.className = '_x_extension_popconfirm_actions_2024_unique_';
    const popCancel = document.createElement('button');
    popCancel.className = '_x_extension_shortcut_secondary_2024_unique_';
    popCancel.setAttribute('data-i18n', 'confirm_cancel');
    popCancel.textContent = getMessage('confirm_cancel', '取消');
    const popOk = document.createElement('button');
    popOk.className = '_x_extension_shortcut_submit_2024_unique_ _x_extension_shortcut_submit_primary_2024_unique_ _x_extension_shortcut_save_2024_unique_';
    popOk.setAttribute('data-i18n', 'confirm_ok');
    popOk.textContent = getMessage('confirm_ok', '确认');
    popActions.appendChild(popCancel);
    popActions.appendChild(popOk);
    popconfirm.appendChild(popText);
    popconfirm.appendChild(popActions);
    const parent = trigger.parentNode;
    parent.insertBefore(wrap, trigger);
    wrap.appendChild(trigger);
    wrap.appendChild(popconfirm);

    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      if (activePopconfirm && activePopconfirm !== popconfirm) {
        closeActivePopconfirm();
      }
      const isOpen = popconfirm.getAttribute('data-open') === 'true';
      if (isOpen) {
        popconfirm.setAttribute('data-open', 'false');
        activePopconfirm = null;
      } else {
        popconfirm.setAttribute('data-open', 'true');
        activePopconfirm = popconfirm;
      }
    });

    popCancel.addEventListener('click', (event) => {
      event.stopPropagation();
      popconfirm.setAttribute('data-open', 'false');
      if (activePopconfirm === popconfirm) {
        activePopconfirm = null;
      }
    });

    popOk.addEventListener('click', (event) => {
      event.stopPropagation();
      popconfirm.setAttribute('data-open', 'false');
      if (activePopconfirm === popconfirm) {
        activePopconfirm = null;
      }
      if (typeof onConfirm === 'function') {
        onConfirm();
      }
    });
  }

  function removeSiteSearchItem(key, isBuiltin) {
    if (isBuiltin) {
      disabledSiteSearchKeys.add(key.toLowerCase());
      saveDisabledSiteSearchKeys(disabledSiteSearchKeys).then(() => {
        refreshSiteSearchProviders();
        if (editingSiteSearchKey === key) {
          resetSiteSearchForm();
        }
        showToast(getMessage('toast_removed', '已移除'), false);
      }).catch(() => {
        showToast(getMessage('toast_error', '操作失败，请重试'), true);
      });
      return;
    }
    customSiteSearchProviders = customSiteSearchProviders.filter((item) => String(item.key || '') !== key);
    saveCustomSiteSearchProviders(customSiteSearchProviders).then(() => {
      refreshSiteSearchProviders();
      if (editingSiteSearchKey === key) {
        resetSiteSearchForm();
      }
      showToast(getMessage('toast_removed', '已移除'), false);
    }).catch(() => {
      showToast(getMessage('toast_error', '操作失败，请重试'), true);
    });
  }

  function normalizeLocale(locale) {
    const raw = String(locale || '').trim();
    if (!raw) {
      return 'en';
    }
    const lower = raw.toLowerCase();
    if (lower.startsWith('zh')) {
      if (lower.includes('hk')) {
        return 'zh_HK';
      }
      if (lower.includes('tw') || lower.includes('mo') || lower.includes('hant')) {
        return 'zh_TW';
      }
      return 'zh_CN';
    }
    return 'en';
  }

  function getSystemLocale() {
    if (chrome && chrome.i18n && chrome.i18n.getUILanguage) {
      return normalizeLocale(chrome.i18n.getUILanguage());
    }
    return normalizeLocale(navigator.language || 'en');
  }

  function normalizeLanguageMode(mode) {
    const raw = String(mode || '').trim();
    if (!raw) {
      return 'system';
    }
    const lower = raw.toLowerCase();
    if (lower === 'system') {
      return 'system';
    }
    if (lower === 'en' || lower.startsWith('en-') || lower.startsWith('en_')) {
      return 'en';
    }
    if (lower === 'zh-hk' || lower === 'zh_hk') {
      return 'zh-TW';
    }
    if (lower === 'zh-tw' || lower === 'zh_tw' || lower === 'zh-mo' || lower === 'zh_mo' || lower.includes('hant')) {
      return 'zh-TW';
    }
    if (lower === 'zh-cn' || lower === 'zh_cn' || lower === 'zh-hans' || lower === 'zh_hans' || lower.startsWith('zh')) {
      return 'zh-CN';
    }
    return 'system';
  }

  function loadLocaleMessages(locale) {
    const normalized = normalizeLocale(locale);
    const localePath = chrome.runtime.getURL(`public/_locales/${normalized}/messages.json`);
    const fetchFromBackground = () => new Promise((resolve) => {
      if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
        resolve({});
        return;
      }
      chrome.runtime.sendMessage({ action: 'getLocaleMessages', locale: normalized }, (response) => {
        if (chrome.runtime && chrome.runtime.lastError) {
          resolve({});
          return;
        }
        resolve(response && response.messages ? response.messages : {});
      });
    });
    return fetch(localePath)
      .then((response) => {
        if (!response || !response.ok) {
          throw new Error('locale fetch failed');
        }
        return response.json();
      })
      .catch(() => fetchFromBackground());
  }

  function applyLanguageMode(mode, options) {
    const requestId = ++languageApplyRequestId;
    const normalizedMode = normalizeLanguageMode(mode);
    currentLanguageMode = normalizedMode;
    const targetLocale = normalizedMode === 'system' ? getSystemLocale() : normalizeLocale(normalizedMode);
    const shouldPersist = Boolean(options && options.persist);
    if (shouldPersist) {
      const payload = {
        [LANGUAGE_STORAGE_KEY]: normalizedMode
      };
      const localArea = chrome && chrome.storage ? chrome.storage.local : null;
      if (localArea) {
        localArea.set(payload);
      }
      if (storageArea) {
        storageArea.set(payload);
      }
    }
    loadLocaleMessages(targetLocale).then((messages) => {
      if (requestId !== languageApplyRequestId) {
        return;
      }
      currentMessages = messages || {};
      if (languageSelect) {
        languageSelect.value = normalizedMode;
        if (languageSelect.value !== normalizedMode) {
          languageSelect.value = 'system';
        }
      }
      applyI18n();
      refreshCustomSelects();
      scheduleTabsIndicatorsRefresh(2);
      setEditingState(editingSiteSearchKey);
      updateBuiltinResetTooltip();
      updateCustomClearTooltip();
      updateBlacklistClearTooltip();
      refreshSyncStatus();
      refreshShortcutsStatus();
      if (confirmCancel) confirmCancel.textContent = getMessage('confirm_cancel', '取消');
      if (confirmOk) confirmOk.textContent = getMessage('confirm_ok', '确认');
      renderSiteSearchList();
      renderSearchBlacklistList();
      updateBlacklistInputPresentation();
      setBlacklistFormExpanded(blacklistFormExpanded);
      if (shouldPersist) {
        if (!storageArea) {
          return;
        }
        const syncArea = chrome && chrome.storage ? chrome.storage.sync : null;
        if (storageArea !== syncArea) {
          storageArea.set({
            [LANGUAGE_MESSAGES_STORAGE_KEY]: {
              locale: targetLocale,
              messages: currentMessages
            }
          });
        }
      }
    });
  }

  function refreshShortcutsStatus() {
    if (!shortcutsStatus) return;
    shortcutsStatus.textContent = currentShortcutLabel || getMessage('settings_shortcuts_unset', '未设置');
  }

  function getDefaultFallbackShortcut() {
    return isMacPlatform ? 'Command+Shift+K' : 'Ctrl+Shift+K';
  }

  function isReservedBrowserShortcut(shortcut) {
    return false;
  }

  function normalizeShortcutKeyToken(rawKey) {
    const value = String(rawKey || '').trim();
    if (!value) {
      return '';
    }
    const lower = value.toLowerCase();
    const aliasMap = {
      tab: 'Tab',
      enter: 'Enter',
      return: 'Enter',
      esc: 'Escape',
      escape: 'Escape',
      space: 'Space',
      spacebar: 'Space',
      up: 'ArrowUp',
      down: 'ArrowDown',
      left: 'ArrowLeft',
      right: 'ArrowRight',
      comma: 'Comma',
      period: 'Period',
      slash: 'Slash',
      semicolon: 'Semicolon',
      quote: 'Quote',
      minus: 'Minus',
      plus: 'Plus',
      backslash: 'Backslash',
      backquote: 'Backquote',
      bracketleft: 'BracketLeft',
      bracketright: 'BracketRight'
    };
    if (aliasMap[lower]) {
      return aliasMap[lower];
    }
    if (/^f\d{1,2}$/.test(lower)) {
      return lower.toUpperCase();
    }
    if (value.length === 1) {
      const charMap = {
        ' ': 'Space',
        ',': 'Comma',
        '<': 'Comma',
        '.': 'Period',
        '>': 'Period',
        '/': 'Slash',
        '?': 'Slash',
        ';': 'Semicolon',
        ':': 'Semicolon',
        '\'': 'Quote',
        '"': 'Quote',
        '-': 'Minus',
        '_': 'Minus',
        '+': 'Plus',
        '\\': 'Backslash',
        '|': 'Backslash',
        '`': 'Backquote',
        '[': 'BracketLeft',
        '{': 'BracketLeft',
        ']': 'BracketRight',
        '}': 'BracketRight'
      };
      if (charMap[value]) {
        return charMap[value];
      }
      if (/^[a-z0-9]$/i.test(value)) {
        return value.toUpperCase();
      }
    }
    return '';
  }

  function getShortcutKeyTokenFromCode(rawCode) {
    const code = String(rawCode || '').trim();
    if (!code) {
      return '';
    }
    if (/^Key[A-Z]$/.test(code)) {
      return code.slice(3);
    }
    if (/^Digit[0-9]$/.test(code)) {
      return code.slice(5);
    }
    const codeMap = {
      Backquote: 'Backquote',
      Minus: 'Minus',
      Equal: 'Plus',
      BracketLeft: 'BracketLeft',
      BracketRight: 'BracketRight',
      Backslash: 'Backslash',
      Semicolon: 'Semicolon',
      Quote: 'Quote',
      Comma: 'Comma',
      Period: 'Period',
      Slash: 'Slash',
      Space: 'Space',
      Tab: 'Tab',
      Enter: 'Enter',
      Escape: 'Escape',
      ArrowUp: 'ArrowUp',
      ArrowDown: 'ArrowDown',
      ArrowLeft: 'ArrowLeft',
      ArrowRight: 'ArrowRight'
    };
    if (codeMap[code]) {
      return codeMap[code];
    }
    if (/^F\d{1,2}$/.test(code)) {
      return code;
    }
    return '';
  }

  function getShortcutKeyTokenFromEvent(event) {
    if (!event) {
      return '';
    }
    return getShortcutKeyTokenFromCode(event.code) || normalizeShortcutKeyToken(event.key);
  }

  function normalizeFallbackShortcut(value) {
    const text = String(value || '').trim();
    if (!text) {
      return '';
    }
    const parts = text
      .split('+')
      .map((token) => String(token || '').trim())
      .filter(Boolean);
    if (parts.length < 2) {
      return '';
    }
    const keyToken = normalizeShortcutKeyToken(parts.pop());
    if (!keyToken) {
      return '';
    }
    const modifierState = {
      ctrl: false,
      alt: false,
      shift: false,
      meta: false
    };
    for (const token of parts) {
      const lower = token.toLowerCase();
      if (lower === 'ctrl' || lower === 'control' || lower === 'macctrl') {
        modifierState.ctrl = true;
      } else if (lower === 'alt' || lower === 'option') {
        modifierState.alt = true;
      } else if (lower === 'shift') {
        modifierState.shift = true;
      } else if (lower === 'command' || lower === 'cmd' || lower === 'meta' || lower === 'super') {
        modifierState.meta = true;
      } else {
        return '';
      }
    }
    const hasModifier = modifierState.ctrl || modifierState.alt || modifierState.shift || modifierState.meta;
    if (!hasModifier) {
      return '';
    }
    const normalized = [];
    if (modifierState.ctrl) normalized.push('Ctrl');
    if (modifierState.alt) normalized.push('Alt');
    if (modifierState.shift) normalized.push('Shift');
    if (modifierState.meta) normalized.push('Command');
    normalized.push(keyToken);
    return normalized.join('+');
  }

  function buildShortcutFromEvent(event) {
    if (!event) {
      return '';
    }
    const key = String(event.key || '');
    if (!key || key === 'Shift' || key === 'Control' || key === 'Alt' || key === 'Meta' || key === 'AltGraph') {
      return '';
    }
    const keyToken = getShortcutKeyTokenFromEvent(event);
    if (!keyToken) {
      return '';
    }
    const modifiers = [];
    if (event.ctrlKey) modifiers.push('Ctrl');
    if (event.altKey) modifiers.push('Alt');
    if (event.shiftKey) modifiers.push('Shift');
    if (event.metaKey) modifiers.push('Command');
    if (modifiers.length === 0) {
      return '';
    }
    modifiers.push(keyToken);
    return modifiers.join('+');
  }

  function formatShortcutForDisplay(shortcut) {
    const normalized = normalizeFallbackShortcut(shortcut);
    if (!normalized) {
      return '';
    }
    if (!isMacPlatform) {
      return normalized;
    }
    const parts = normalized.split('+').filter(Boolean);
    if (parts.length === 0) {
      return normalized;
    }
    const keyToken = parts.pop();
    const modifierSymbols = [];
    parts.forEach((token) => {
      if (token === 'Ctrl') modifierSymbols.push('⌃');
      else if (token === 'Alt') modifierSymbols.push('⌥');
      else if (token === 'Shift') modifierSymbols.push('⇧');
      else if (token === 'Command') modifierSymbols.push('⌘');
    });
    const keyMap = {
      ArrowUp: '↑',
      ArrowDown: '↓',
      ArrowLeft: '←',
      ArrowRight: '→',
      Enter: '↩',
      Escape: '⎋',
      Tab: '⇥',
      Space: 'Space',
      Comma: ',',
      Period: '.',
      Slash: '/',
      Semicolon: ';',
      Quote: '\'',
      Minus: '-',
      Plus: '+',
      Backslash: '\\',
      Backquote: '`',
      BracketLeft: '[',
      BracketRight: ']'
    };
    const keyLabel = keyMap[keyToken] || keyToken;
    return `${modifierSymbols.join('')}${keyLabel}`;
  }

  function getShortcutDisplayTokens(shortcut) {
    const normalized = normalizeFallbackShortcut(shortcut);
    if (!normalized) {
      return [];
    }
    const shouldUseMacSymbols = isMacPlatform && !FORCE_TEXT_KEYCAPS_ON_MAC;
    const parts = normalized.split('+').filter(Boolean);
    if (parts.length === 0) {
      return [];
    }
    const keyToken = parts.pop();
    const tokens = [];
    parts.forEach((token) => {
      if (!shouldUseMacSymbols) {
        tokens.push(token === 'Command' ? 'Cmd' : token);
        return;
      }
      if (token === 'Ctrl') tokens.push('⌃');
      else if (token === 'Alt') tokens.push('⌥');
      else if (token === 'Shift') tokens.push('⇧');
      else if (token === 'Command') tokens.push('⌘');
    });
    const keyMapMac = {
      ArrowUp: '↑',
      ArrowDown: '↓',
      ArrowLeft: '←',
      ArrowRight: '→',
      Enter: '↩',
      Escape: '⎋',
      Tab: '⇥',
      Space: 'Space',
      Comma: ',',
      Period: '.',
      Slash: '/',
      Semicolon: ';',
      Quote: '\'',
      Minus: '-',
      Plus: '+',
      Backslash: '\\',
      Backquote: '`',
      BracketLeft: '[',
      BracketRight: ']'
    };
    const keyMapDefault = {
      ArrowUp: 'Up',
      ArrowDown: 'Down',
      ArrowLeft: 'Left',
      ArrowRight: 'Right',
      Escape: 'Esc',
      Comma: ',',
      Period: '.',
      Slash: '/',
      Semicolon: ';',
      Quote: '\'',
      Minus: '-',
      Plus: '+',
      Backslash: '\\',
      Backquote: '`',
      BracketLeft: '[',
      BracketRight: ']'
    };
    const keyLabel = shouldUseMacSymbols
      ? (keyMapMac[keyToken] || keyToken)
      : (keyMapDefault[keyToken] || keyToken);
    tokens.push(keyLabel);
    return tokens.map((token) => {
      const text = String(token || '');
      return text.length > 1 ? text.toUpperCase() : text;
    });
  }

  function renderFallbackShortcutTokens(shortcut, animate) {
    if (!fallbackShortcutTokens) {
      return;
    }
    const shouldAnimate = Boolean(animate);
    const tokens = getShortcutDisplayTokens(shortcut);
    fallbackShortcutTokens.innerHTML = '';
    const emptyPlaceholder = isCapturingFallbackShortcut
      ? (fallbackShortcutInput ? (fallbackShortcutInput.getAttribute('placeholder') || '') : '')
      : getMessage('settings_shortcuts_empty_state', '无');
    fallbackShortcutTokens.setAttribute('data-placeholder', emptyPlaceholder);
    if (tokens.length === 0) {
      fallbackShortcutTokens.setAttribute('data-empty', 'true');
      updateFallbackShortcutWrapWidthForContent();
      return;
    }
    fallbackShortcutTokens.setAttribute('data-empty', 'false');
    const pendingAnimatedTokens = [];
    tokens.forEach((label, index) => {
      const tokenEl = document.createElement('span');
      tokenEl.className = '_x_extension_shortcuts_hotkey_token_2024_unique_';
      const textLabel = String(label || '');
      if (textLabel.length > 1) {
        const minWidth = Math.max(17, Math.round(textLabel.length * 7.5 + 12));
        tokenEl.style.minWidth = `${minWidth}px`;
      }
      if (shouldAnimate) {
        tokenEl.style.animationDelay = `${index * 36}ms`;
        pendingAnimatedTokens.push(tokenEl);
      }
      tokenEl.textContent = label;
      fallbackShortcutTokens.appendChild(tokenEl);
    });
    if (shouldAnimate && pendingAnimatedTokens.length > 0) {
      requestAnimationFrame(() => {
        pendingAnimatedTokens.forEach((tokenEl) => {
          tokenEl.classList.add('_x_extension_shortcuts_hotkey_token_pop_2024_unique_');
        });
      });
    }
    updateFallbackShortcutWrapWidthForContent();
  }

  function setFallbackShortcutLabel(value, animate) {
    currentShortcutLabel = value || '';
    if (fallbackShortcutInput) {
      fallbackShortcutInput.value = '';
    }
    renderFallbackShortcutTokens(currentShortcutLabel, animate);
    updateFallbackShortcutResetVisibility();
    refreshShortcutsStatus();
  }

  function updateFallbackShortcutResetVisibility() {
    if (!resetShortcutButton) {
      return;
    }
    const normalizedCurrent = normalizeFallbackShortcut(currentShortcutLabel || '');
    const normalizedDefault = normalizeFallbackShortcut(getDefaultFallbackShortcut());
    const canReset = normalizedCurrent !== normalizedDefault;
    resetShortcutButton.setAttribute('data-can-reset', canReset ? 'true' : 'false');
    if (canReset) {
      resetShortcutButton.removeAttribute('disabled');
    } else {
      resetShortcutButton.setAttribute('disabled', 'disabled');
    }
  }

  function stopFallbackShortcutCapture() {
    if (fallbackCaptureStopTimer) {
      clearTimeout(fallbackCaptureStopTimer);
      fallbackCaptureStopTimer = null;
    }
    isCapturingFallbackShortcut = false;
    cancelCaptureOnMouseLeave = false;
    if (fallbackShortcutWrap) {
      fallbackShortcutWrap.removeAttribute('data-capturing');
    }
    if (fallbackShortcutInput && document.activeElement === fallbackShortcutInput) {
      fallbackShortcutInput.blur();
    }
    if (!currentShortcutLabel) {
      renderFallbackShortcutTokens('');
    }
  }

  function stopFallbackShortcutCaptureDeferred(delayMs) {
    if (fallbackCaptureStopTimer) {
      clearTimeout(fallbackCaptureStopTimer);
      fallbackCaptureStopTimer = null;
    }
    fallbackCaptureStopTimer = setTimeout(() => {
      fallbackCaptureStopTimer = null;
      stopFallbackShortcutCapture();
    }, Math.max(0, Number(delayMs) || 0));
  }

  function persistFallbackShortcut(value, onDone) {
    if (!storageArea) {
      if (typeof onDone === 'function') {
        onDone(true);
      }
      return;
    }
    storageArea.set({ [FALLBACK_SHORTCUT_STORAGE_KEY]: value }, () => {
      const ok = !(chrome.runtime && chrome.runtime.lastError);
      if (typeof onDone === 'function') {
        onDone(ok);
      }
    });
  }


  function loadCurrentShortcut() {
    const defaultShortcut = getDefaultFallbackShortcut();
    if (!chrome || !chrome.commands || typeof chrome.commands.getAll !== 'function') {
      setFallbackShortcutLabel(formatShortcutForDisplay(defaultShortcut) || defaultShortcut);
      return;
    }
    chrome.commands.getAll((commands) => {
      if (chrome.runtime && chrome.runtime.lastError) {
        setFallbackShortcutLabel(formatShortcutForDisplay(defaultShortcut) || defaultShortcut);
        return;
      }
      const items = Array.isArray(commands) ? commands : [];
      const command = items.find((item) => item && item.name === 'show-search');
      const shortcut = command && typeof command.shortcut === 'string'
        ? String(command.shortcut).trim()
        : '';
      const effectiveShortcut = shortcut || defaultShortcut;
      setFallbackShortcutLabel(formatShortcutForDisplay(effectiveShortcut) || effectiveShortcut);
    });
  }


  function setActiveTab(tabKey) {
    tabButtons.forEach((button) => {
      const isActive = button.getAttribute('data-tab') === tabKey;
      button.setAttribute('data-active', isActive ? 'true' : 'false');
    });
    tabContents.forEach((content) => {
      const isActive = content.getAttribute('data-content') === tabKey;
      content.setAttribute('data-active', isActive ? 'true' : 'false');
    });
    requestAnimationFrame(updateTabIndicator);
    if (tabKey === 'appearance') {
      requestAnimationFrame(() => {
        requestAnimationFrame(updateThemeIndicator);
        requestAnimationFrame(updateOverlaySizeTabsIndicator);
      });
    }
    if (tabKey === 'shortcuts') {
      requestAnimationFrame(() => {
        requestAnimationFrame(updateSiteSearchBuiltinTabsIndicator);
      });
    }
    if (tabKey === 'general') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          updateNewtabWidthTabsIndicator();
          updateRecentModeTabsIndicator();
          updateRestrictedActionTabsIndicator();
          updateSearchResultPriorityTabsIndicator();
          syncFallbackShortcutWrapWidth();
          updateFallbackShortcutWrapWidthForContent();
        });
      });
    }
    if (tabKey) {
      const nextHash = `#${tabKey}`;
      if (window.location.hash !== nextHash) {
        window.history.replaceState(null, '', nextHash);
      }
    }
  }

  function updateTabIndicator() {
    if (!tabsContainer || !tabsIndicator) return;
    const activeButton = tabButtons.find((button) => button.getAttribute('data-active') === 'true');
    if (!activeButton) return;
    const containerRect = tabsContainer.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();
    const inset = 4;
    const offset = Math.round(buttonRect.left - containerRect.left - inset);
    tabsIndicator.style.width = `${Math.round(buttonRect.width)}px`;
    tabsIndicator.style.transform = `translateX(${offset}px)`;
  }

  function updateTabsStickyVisualState() {
    if (!tabsRow) return;
    const stickyTop = parseFloat(window.getComputedStyle(tabsRow).top || '0') || 0;
    const isStuck = tabsRow.getBoundingClientRect().top <= stickyTop + 0.5;
    tabsRow.setAttribute('data-stuck', isStuck ? 'true' : 'false');
  }

  function resetPageScrollToDefault() {
    window.scrollTo({ top: 0, behavior: 'auto' });
    updateTabsStickyVisualState();
  }

  if (settingsVersion && chrome?.runtime?.getManifest) {
    const manifest = chrome.runtime.getManifest();
    if (manifest?.version) {
      settingsVersion.textContent = `v${manifest.version}`;
    }
  }

  function applyResolvedTheme(resolvedTheme) {
    document.body.setAttribute('data-theme', resolvedTheme);
    panel.setAttribute('data-theme', resolvedTheme);
  }

  function resolveTheme(mode) {
    if (mode === 'dark') {
      return 'dark';
    }
    if (mode === 'light') {
      return 'light';
    }
    return mediaQuery.matches ? 'dark' : 'light';
  }

  function updateThemeButtons(mode) {
    themeButtons.forEach((button) => {
      const isActive = button.getAttribute('data-mode') === mode;
      button.setAttribute('data-active', isActive ? 'true' : 'false');
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    requestAnimationFrame(updateThemeIndicator);
  }

  function updateThemeIndicator() {
    if (!themePicker || !themeIndicator) return;
    const activeButton = themeButtons.find((button) => button.getAttribute('data-active') === 'true');
    if (!activeButton) return;
    const containerRect = themePicker.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();
    const inset = 3;
    const offset = Math.round(buttonRect.left - containerRect.left - inset);
    themeIndicator.style.width = `${Math.round(buttonRect.width)}px`;
    themeIndicator.style.transform = `translateX(${offset}px)`;
  }

  function onMediaChange() {
    if (!storageArea) {
      return;
    }
    storageArea.get([THEME_STORAGE_KEY], (result) => {
      const mode = result[THEME_STORAGE_KEY] || 'system';
      if (mode === 'system') {
        applyResolvedTheme(resolveTheme(mode));
      }
    });
  }

  function setThemeMode(mode) {
    if (!storageArea) {
      return;
    }
    storageArea.set({ [THEME_STORAGE_KEY]: mode }, () => {
      updateThemeButtons(mode);
      applyResolvedTheme(resolveTheme(mode));
      if (mode === 'system' && !mediaListenerAttached) {
        mediaQuery.addEventListener('change', onMediaChange);
        mediaListenerAttached = true;
        return;
      }
      if (mode !== 'system' && mediaListenerAttached) {
        mediaQuery.removeEventListener('change', onMediaChange);
        mediaListenerAttached = false;
      }
    });
  }

  function getStoredThemeMode() {
    return new Promise((resolve) => {
      if (!storageArea) {
        resolve('system');
        return;
      }
      storageArea.get([THEME_STORAGE_KEY], (result) => {
        resolve((result && result[THEME_STORAGE_KEY]) || 'system');
      });
    });
  }

  async function initTheme() {
    let ready = false;
    const fallbackTimer = setTimeout(() => {
      if (ready) {
        return;
      }
      applyResolvedTheme(resolveTheme('system'));
      document.documentElement.setAttribute('data-theme-ready', 'true');
    }, 800);
    try {
      const storedMode = await getStoredThemeMode();
      updateThemeButtons(storedMode);
      applyResolvedTheme(resolveTheme(storedMode));
      if (storedMode === 'system' && !mediaListenerAttached) {
        mediaQuery.addEventListener('change', onMediaChange);
        mediaListenerAttached = true;
      }
      ready = true;
      clearTimeout(fallbackTimer);
      document.documentElement.setAttribute('data-theme-ready', 'true');
    } catch (e) {
      ready = true;
      clearTimeout(fallbackTimer);
      applyResolvedTheme(resolveTheme('system'));
      document.documentElement.setAttribute('data-theme-ready', 'true');
    }
  }

  initTheme();
  initSettingsPixelBlastBackground(pixelBlastMount);

  function playThemeOptionClickEffect(button) {
    if (!button) {
      return;
    }
    button.classList.remove('x-theme-clicking');
    void button.offsetWidth;
    button.classList.add('x-theme-clicking');
    window.setTimeout(() => {
      button.classList.remove('x-theme-clicking');
    }, 260);
  }

  themeButtons.forEach((button) => {
    button.addEventListener('click', function() {
      playThemeOptionClickEffect(button);
      setThemeMode(button.getAttribute('data-mode'));
    });
  });

  if (!storageArea) {
    applyLanguageMode('system');
  }
  initTooltips();

  function getInitialTabKey() {
    const hash = window.location.hash.replace('#', '').trim();
    if (!hash) {
      return 'general';
    }
    const match = tabButtons.find((button) => button.getAttribute('data-tab') === hash);
    return match ? hash : 'general';
  }

  tabButtons.forEach((button) => {
    button.addEventListener('click', function() {
      const tabKey = button.getAttribute('data-tab');
      const activeButton = tabButtons.find((item) => item.getAttribute('data-active') === 'true');
      const currentTabKey = activeButton ? activeButton.getAttribute('data-tab') : '';
      setActiveTab(tabKey);
      if (tabKey && tabKey !== currentTabKey) {
        resetPageScrollToDefault();
      }
      if (tabKey === 'shortcuts') {
        refreshSiteSearchProviders();
      }
    });
  });

  const initialTab = getInitialTabKey();
  setSiteSearchBuiltinTabState('builtin');
  setActiveTab(initialTab);
  if (initialTab === 'shortcuts') {
    refreshSiteSearchProviders();
  }
  scheduleTabsIndicatorsRefresh(2);
  if (document.fonts && typeof document.fonts.ready === 'object' && typeof document.fonts.ready.then === 'function') {
    document.fonts.ready.then(() => {
      scheduleTabsIndicatorsRefresh(2);
    });
  }
  window.addEventListener('scroll', updateTabsStickyVisualState, { passive: true });
  window.addEventListener('resize', updateTabsStickyVisualState);
  updateTabsStickyVisualState();
  window.addEventListener('resize', updateTabIndicator);
  window.addEventListener('resize', updateThemeIndicator);
  window.addEventListener('resize', updateNewtabWidthTabsIndicator);
  window.addEventListener('resize', updateRecentModeTabsIndicator);
  window.addEventListener('resize', updateOverlaySizeTabsIndicator);
  window.addEventListener('resize', updateSiteSearchBuiltinTabsIndicator);
  window.addEventListener('resize', updateRestrictedActionTabsIndicator);
  window.addEventListener('resize', updateSearchResultPriorityTabsIndicator);
  window.addEventListener('resize', syncFallbackShortcutWrapWidth);
  migrateStorageIfNeeded([
    THEME_STORAGE_KEY,
    LANGUAGE_STORAGE_KEY,
    LANGUAGE_MESSAGES_STORAGE_KEY,
    RECENT_MODE_STORAGE_KEY,
    RECENT_COUNT_STORAGE_KEY,
    BOOKMARK_COUNT_STORAGE_KEY,
    BOOKMARK_COLUMNS_STORAGE_KEY,
    NEWTAB_WIDTH_MODE_STORAGE_KEY,
    OVERLAY_SIZE_MODE_STORAGE_KEY,
    SEARCH_RESULT_PRIORITY_STORAGE_KEY,
    AUTO_PIP_ENABLED_STORAGE_KEY,
    DOCUMENT_PIP_ENABLED_STORAGE_KEY,
    PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY,
    OVERLAY_TAB_PRIORITY_STORAGE_KEY,
    FALLBACK_SHORTCUT_STORAGE_KEY,
    SITE_SEARCH_STORAGE_KEY,
    SITE_SEARCH_DISABLED_STORAGE_KEY,
    SEARCH_BLACKLIST_STORAGE_KEY,
    DEFAULT_SEARCH_ENGINE_STORAGE_KEY
  ]);
  refreshSyncStatus();

  function normalizeSiteSearchTemplate(template) {
    if (SITE_SEARCH_PROVIDER_UTILS.normalizeSiteSearchTemplate) {
      return SITE_SEARCH_PROVIDER_UTILS.normalizeSiteSearchTemplate(template);
    }
    if (!template) {
      return '';
    }
    return template
      .replace(/\{\{\{s\}\}\}/g, '{query}')
      .replace(/\{s\}/g, '{query}')
      .replace(/\{searchTerms\}/g, '{query}');
  }

  function isDuplicateTemplate(template, defaults) {
    const normalized = normalizeSiteSearchTemplate(String(template || '').trim());
    if (!normalized) {
      return false;
    }
    return (defaults || []).some((item) => normalizeSiteSearchTemplate(String(item.template || '').trim()) === normalized);
  }

  function normalizeAliases(input) {
    if (!input) {
      return [];
    }
    return Array.from(new Set(
      input
        .split(/[,，]/)
        .map((alias) => alias.trim())
        .filter(Boolean)
    ));
  }

  function setSiteSearchError(message) {
    if (!siteSearchError) {
      return;
    }
    if (!message) {
      siteSearchError.textContent = '';
      siteSearchError.style.display = 'none';
      return;
    }
    siteSearchError.textContent = message;
    siteSearchError.style.display = 'block';
  }

  function setSiteSearchFormExpanded(expanded) {
    siteSearchFormExpanded = Boolean(expanded);
    if (siteSearchForm) {
      siteSearchForm.setAttribute('data-expanded', siteSearchFormExpanded ? 'true' : 'false');
    }
    if (siteSearchFormTrigger) {
      siteSearchFormTrigger.setAttribute('aria-expanded', siteSearchFormExpanded ? 'true' : 'false');
    }
    if (siteSearchCancelButton) {
      siteSearchCancelButton.style.display = siteSearchFormExpanded ? 'inline-flex' : 'none';
      if (siteSearchCancelButton.textContent) {
        siteSearchCancelButton.textContent = getMessage('shortcuts_cancel', siteSearchCancelButton.textContent);
      }
    }
    if (siteSearchFormExpanded && siteSearchKeyInput) {
      siteSearchKeyInput.focus();
    }
  }

  function setEditingState(key) {
    editingSiteSearchKey = key;
    if (siteSearchAddButton) {
      siteSearchAddButton.textContent = key
        ? getMessage('shortcuts_save', '保存修改')
        : getMessage('shortcuts_add', '添加站内搜索');
      siteSearchAddButton.classList.add('_x_extension_shortcut_save_2024_unique_');
    }
  }

  function attachSaveButtonAnimation(button) {
    if (!button) {
      return;
    }
    button.addEventListener('click', () => {
      if (!button.classList.contains('_x_extension_shortcut_save_2024_unique_')) {
        return;
      }
      button.classList.remove('_x_extension_shortcut_save_pulse_2024_unique_');
      void button.offsetWidth;
      button.classList.add('_x_extension_shortcut_save_pulse_2024_unique_');
    });
    button.addEventListener('animationend', () => {
      button.classList.remove('_x_extension_shortcut_save_pulse_2024_unique_');
    });
  }

  function suspendSiteSearchRefresh(durationMs) {
    const now = Date.now();
    siteSearchRefreshSuppressUntil = Math.max(siteSearchRefreshSuppressUntil, now + durationMs);
  }

  if (languageSelect) {
    languageSelect.addEventListener('change', () => {
      const next = languageSelect.value || 'system';
      applyLanguageMode(next, { persist: true });
    });
  }

  if (recentCountSelect) {
    recentCountSelect.addEventListener('change', () => {
      const nextCount = normalizeRecentCount(recentCountSelect.value);
      updateRecentModeTabsVisibility(nextCount);
      if (!storageArea) {
        return;
      }
      storageArea.set({ [RECENT_COUNT_STORAGE_KEY]: nextCount });
      notifyNewtabSectionsRefresh('recent');
    });
  }
  if (newtabWidthSelect) {
    newtabWidthSelect.addEventListener('change', () => {
      const nextMode = normalizeNewtabWidthMode(newtabWidthSelect.value);
      setNewtabWidthTabState(nextMode);
      if (!storageArea) {
        return;
      }
      storageArea.set({ [NEWTAB_WIDTH_MODE_STORAGE_KEY]: nextMode });
      notifyNewtabSectionsRefresh('all');
    });
  }
  if (newtabWidthTabButtons.length > 0) {
    newtabWidthTabButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const nextMode = normalizeNewtabWidthMode(button.getAttribute('data-newtab-width'));
        setNewtabWidthTabState(nextMode);
        if (newtabWidthSelect) {
          newtabWidthSelect.value = nextMode;
        }
        if (!storageArea) {
          return;
        }
        storageArea.set({ [NEWTAB_WIDTH_MODE_STORAGE_KEY]: nextMode });
        notifyNewtabSectionsRefresh('all');
      });
    });
  }
  if (overlaySizeTabButtons.length > 0) {
    overlaySizeTabButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const nextMode = normalizeOverlaySizeMode(button.getAttribute('data-overlay-size'));
        setOverlaySizeTabState(nextMode);
        if (!storageArea) {
          return;
        }
        storageArea.set({ [OVERLAY_SIZE_MODE_STORAGE_KEY]: nextMode });
      });
    });
  }
  if (searchResultPrioritySelect) {
    searchResultPrioritySelect.addEventListener('change', () => {
      const nextPriority = normalizeSearchResultPriority(searchResultPrioritySelect.value);
      setSearchResultPriorityTabState(nextPriority);
      if (!storageArea) {
        return;
      }
      storageArea.set({ [SEARCH_RESULT_PRIORITY_STORAGE_KEY]: nextPriority });
    });
  }
  if (searchResultPriorityTabButtons.length > 0) {
    searchResultPriorityTabButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const nextPriority = normalizeSearchResultPriority(button.getAttribute('data-search-result-priority'));
        setSearchResultPriorityTabState(nextPriority);
        if (searchResultPrioritySelect) {
          searchResultPrioritySelect.value = nextPriority;
        }
        if (!storageArea) {
          return;
        }
        storageArea.set({ [SEARCH_RESULT_PRIORITY_STORAGE_KEY]: nextPriority });
      });
    });
  }
  if (recentModeSelect) {
    recentModeSelect.addEventListener('change', () => {
      const rawMode = recentModeSelect.value;
      const nextMode = rawMode === 'most' ? 'most' : 'latest';
      setRecentModeTabState(nextMode);
      if (!storageArea) {
        return;
      }
      storageArea.set({ [RECENT_MODE_STORAGE_KEY]: nextMode });
      notifyNewtabSectionsRefresh('recent');
    });
  }
  if (recentModeTabButtons.length > 0) {
    recentModeTabButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const nextMode = button.getAttribute('data-recent-mode') === 'most' ? 'most' : 'latest';
        setRecentModeTabState(nextMode);
        if (recentModeSelect) {
          recentModeSelect.value = nextMode;
        }
        if (!storageArea) {
          return;
        }
        storageArea.set({ [RECENT_MODE_STORAGE_KEY]: nextMode });
        notifyNewtabSectionsRefresh('recent');
      });
    });
  }
  if (blacklistAddButton) {
    blacklistAddButton.addEventListener('click', () => {
      if (!blacklistFormExpanded) {
        setBlacklistFormExpanded(true);
        return;
      }
      const matchModes = getBlacklistMatchModesFromForm();
      const draft = buildBlacklistRuleDraft(blacklistUrlInput && blacklistUrlInput.value, matchModes);
      if (!draft.item) {
        setBlacklistError(draft.error || '');
        return;
      }
      setBlacklistError('');
      persistBlacklistItems(
        upsertBlacklistItems(draft.item, ''),
        getMessage('toast_saved', '已保存')
      ).then(() => {
        resetBlacklistForm();
      }).catch(() => {
        showToast(getMessage('toast_error', '操作失败，请重试'), true);
      });
    });
  }
  if (blacklistFormTrigger) {
    blacklistFormTrigger.addEventListener('click', () => {
      setBlacklistFormExpanded(true);
    });
  }
  [
    [blacklistMatchExactInput, 'exact'],
    [blacklistMatchPrefixInput, 'prefix'],
    [blacklistMatchSuffixInput, 'suffix']
  ].forEach(([input, mode]) => {
    if (!input) {
      return;
    }
    input.addEventListener('change', () => {
      syncBlacklistMatchModeAvailability(mode);
    });
  });
  if (blacklistCancelButton) {
    blacklistCancelButton.addEventListener('click', () => {
      resetBlacklistForm();
    });
  }
  if (blacklistUrlInput) {
    blacklistUrlInput.addEventListener('input', () => {
      setBlacklistError('');
      updateBlacklistInputPresentation();
    });
    blacklistUrlInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        if (blacklistAddButton) {
          blacklistAddButton.click();
        }
      }
    });
  }
  if (bookmarkCountSelect) {
    bookmarkCountSelect.addEventListener('change', () => {
      const nextCount = normalizeBookmarkCount(bookmarkCountSelect.value);
      updateBookmarkColumnsSelectVisibility(nextCount);
      if (!storageArea) {
        return;
      }
      storageArea.set({ [BOOKMARK_COUNT_STORAGE_KEY]: nextCount });
      notifyNewtabSectionsRefresh('bookmarks');
    });
  }
  if (bookmarkColumnsSelect) {
    bookmarkColumnsSelect.addEventListener('change', () => {
      const nextColumns = normalizeBookmarkColumns(bookmarkColumnsSelect.value);
      if (!storageArea) {
        return;
      }
      storageArea.set({ [BOOKMARK_COLUMNS_STORAGE_KEY]: nextColumns });
      notifyNewtabSectionsRefresh('bookmarks');
    });
  }
  if (overlayTabQuickSwitchToggle) {
    overlayTabQuickSwitchToggle.addEventListener('change', () => {
      const next = Boolean(overlayTabQuickSwitchToggle.checked);
      if (!storageArea) {
        return;
      }
      storageArea.set({ [OVERLAY_TAB_PRIORITY_STORAGE_KEY]: next });
    });
  }
  if (newtabWordmarkToggle) {
    newtabWordmarkToggle.addEventListener('change', () => {
      const next = normalizeNewtabWordmarkVisible(newtabWordmarkToggle.checked);
      if (!storageArea) {
        return;
      }
      storageArea.set({ [NEWTAB_WORDMARK_VISIBLE_STORAGE_KEY]: next });
    });
  }
  if (autoPipToggle) {
    autoPipToggle.addEventListener('change', () => {
      const next = Boolean(autoPipToggle.checked);
      if (!storageArea) {
        return;
      }
      storageArea.set({ [AUTO_PIP_ENABLED_STORAGE_KEY]: next });
    });
  }
  if (documentPipToggle) {
    documentPipToggle.addEventListener('change', () => {
      const next = Boolean(documentPipToggle.checked);
      if (!storageArea) {
        return;
      }
      storageArea.set({ [DOCUMENT_PIP_ENABLED_STORAGE_KEY]: next });
    });
  }
  if (pinnedTabRecoveryToggle) {
    pinnedTabRecoveryToggle.addEventListener('change', () => {
      const next = Boolean(pinnedTabRecoveryToggle.checked);
      if (!storageArea) {
        return;
      }
      storageArea.set({ [PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY]: next });
    });
  }

  if (restrictedActionSelect) {
    restrictedActionSelect.addEventListener('change', () => {
      const next = restrictedActionSelect.value || 'default';
      setRestrictedActionTabState(next);
      if (!storageArea) {
        return;
      }
      storageArea.set({ [RESTRICTED_ACTION_STORAGE_KEY]: next });
    });
  }
  if (restrictedActionTabButtons.length > 0) {
    restrictedActionTabButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const nextAction = button.getAttribute('data-restricted-action') === 'none' ? 'none' : 'default';
        setRestrictedActionTabState(nextAction);
        if (restrictedActionSelect) {
          restrictedActionSelect.value = nextAction;
        }
        if (!storageArea) {
          return;
        }
        storageArea.set({ [RESTRICTED_ACTION_STORAGE_KEY]: nextAction });
      });
    });
  }

  if (openShortcutsPageButton) {
    openShortcutsPageButton.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openExtensionShortcutsPage' }, (response) => {
        if (chrome.runtime && chrome.runtime.lastError) {
          showToast(getMessage('toast_error', '操作失败，请重试'), true);
          return;
        }
        if (!response || response.ok === false) {
          showToast(getMessage('toast_error', '操作失败，请重试'), true);
        }
      });
    });
  }

  if (fallbackShortcutInput) {
    const handleFallbackShortcutKeydown = (event) => {
      if (!event) {
        return;
      }
      if (event.key === 'Tab') {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (event.key === 'Escape') {
        fallbackShortcutInput.value = '';
        renderFallbackShortcutTokens(currentShortcutLabel || getDefaultFallbackShortcut());
        stopFallbackShortcutCapture();
        return;
      }
      const nextShortcut = buildShortcutFromEvent(event);
      if (nextShortcut) {
        fallbackShortcutInput.value = '';
        const normalized = normalizeFallbackShortcut(nextShortcut);
        if (!normalized) {
          return;
        }
        if (isReservedBrowserShortcut(normalized)) {
          showToast(getMessage('settings_shortcuts_invalid', '快捷键无效，请按组合键（如 Ctrl+K）'), true);
          renderFallbackShortcutTokens(currentShortcutLabel || '');
          return;
        }
        if (normalized === currentShortcutLabel) {
          renderFallbackShortcutTokens(normalized, true);
          stopFallbackShortcutCaptureDeferred(260);
          return;
        }
        setFallbackShortcutLabel(normalized, true);
        persistFallbackShortcut(normalized, (ok) => {
          if (!ok) {
            showToast(getMessage('toast_error', '操作失败，请重试'), true);
          }
        });
        stopFallbackShortcutCaptureDeferred(260);
      }
    };
    const captureWindowKeydown = (event) => {
      if (!isCapturingFallbackShortcut) {
        return;
      }
      handleFallbackShortcutKeydown(event);
    };
    window.addEventListener('keydown', captureWindowKeydown, true);
    if (fallbackShortcutWrap) {
      fallbackShortcutWrap.addEventListener('pointerdown', (event) => {
        const target = event && event.target;
        if (target && target.closest && target.closest('button')) {
          return;
        }
        event.preventDefault();
        fallbackShortcutInput.focus();
      });
      fallbackShortcutWrap.addEventListener('mouseleave', () => {
        if (!cancelCaptureOnMouseLeave) {
          return;
        }
        cancelCaptureOnMouseLeave = false;
        stopFallbackShortcutCapture();
      });
    }
    fallbackShortcutInput.addEventListener('focus', () => {
      isCapturingFallbackShortcut = true;
      if (fallbackShortcutWrap) {
        fallbackShortcutWrap.setAttribute('data-capturing', 'true');
      }
      fallbackShortcutInput.value = '';
      if (!currentShortcutLabel) {
        renderFallbackShortcutTokens('');
      }
    });
    fallbackShortcutInput.addEventListener('blur', () => {
      stopFallbackShortcutCapture();
    });
    fallbackShortcutInput.addEventListener('input', () => {
      fallbackShortcutInput.value = '';
    });
    fallbackShortcutInput.addEventListener('keydown', handleFallbackShortcutKeydown);
  }

  if (clearShortcutButton) {
    clearShortcutButton.addEventListener('click', () => {
      setFallbackShortcutLabel('');
      persistFallbackShortcut('', (ok) => {
        if (!ok) {
          showToast(getMessage('toast_error', '操作失败，请重试'), true);
        }
      });
      cancelCaptureOnMouseLeave = true;
      if (fallbackShortcutInput) {
        fallbackShortcutInput.focus();
      }
    });
  }

  if (resetShortcutButton) {
    resetShortcutButton.addEventListener('click', () => {
      const defaultShortcut = getDefaultFallbackShortcut();
      setFallbackShortcutLabel(defaultShortcut, true);
      persistFallbackShortcut(defaultShortcut, (ok) => {
        if (!ok) {
          showToast(getMessage('toast_error', '操作失败，请重试'), true);
        }
      });
      cancelCaptureOnMouseLeave = true;
      if (fallbackShortcutInput) {
        fallbackShortcutInput.focus();
      }
    });
  }

  loadCurrentShortcut();
  requestAnimationFrame(syncFallbackShortcutWrapWidth);
  window.addEventListener('focus', () => {
    loadCurrentShortcut();
  }, true);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      loadCurrentShortcut();
    }
  }, true);

  if (syncNowButton) {
    syncNowButton.addEventListener('click', () => {
      if (!storageArea || storageAreaName !== 'sync') {
        updateSyncStatusText('sync_status_unavailable', '同步不可用');
        return;
      }
      const isRotated = syncNowButton.getAttribute('data-rotated') === 'true';
      syncNowButton.setAttribute('data-rotated', isRotated ? 'false' : 'true');
      storageArea.get(SYNC_KEYS, (result) => {
        const payload = {};
        SYNC_KEYS.forEach((key) => {
          if (typeof result[key] !== 'undefined') {
            payload[key] = result[key];
          }
        });
        payload[SYNC_META_KEY] = {
          lastSyncAt: Date.now(),
          source: 'manual'
        };
        storageArea.set(payload, () => {
          if (chrome.runtime && chrome.runtime.lastError) {
            const reason = chrome.runtime && chrome.runtime.lastError
              ? chrome.runtime.lastError.message
              : '';
            setTimeout(() => {
              showToast(formatTemplate(getMessage('sync_status_failed_reason', '同步失败：{reason}'), {
                reason: reason || getMessage('sync_status_failed', '同步失败')
              }), true);
            }, 360);
            return;
          }
          const toastDelay = 360;
          setTimeout(() => {
            showToast(getMessage('sync_status_done', '同步完成'), false);
          }, toastDelay);
          setTimeout(() => {
            updateSyncNowTooltip(formatSyncTime(Date.now()));
          }, toastDelay + 60);
        });
      });
    });
  }

  if (syncExportButton) {
    syncExportButton.addEventListener('click', () => {
      if (!storageArea) {
        return;
      }
      storageArea.get(SYNC_KEYS, (result) => {
        const payload = buildSyncPayload(result || {});
        downloadJson(`lumno-settings-${Date.now()}.json`, payload);
        showToast(getMessage('sync_export_done', '已导出配置'), false);
      });
    });
  }

  if (syncImportButton && syncImportInput) {
    syncImportButton.addEventListener('click', () => {
      syncImportInput.click();
    });
    syncImportInput.addEventListener('change', (event) => {
      const file = event.target && event.target.files ? event.target.files[0] : null;
      if (!file) {
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        let parsed = null;
        try {
          parsed = JSON.parse(String(reader.result || ''));
        } catch (e) {
          parsed = null;
        }
        const data = parsed && parsed.data ? parsed.data : parsed;
        if (!data || typeof data !== 'object') {
          showToast(getMessage('sync_import_invalid', '配置文件无效'), true);
          syncImportInput.value = '';
          return;
        }
        const payload = {};
        SYNC_KEYS.forEach((key) => {
          if (Object.prototype.hasOwnProperty.call(data, key)) {
            payload[key] = data[key];
          }
        });
        if (Object.keys(payload).length === 0) {
          showToast(getMessage('sync_import_invalid', '配置文件无效'), true);
          syncImportInput.value = '';
          return;
        }
        if (storageArea) {
          payload[SYNC_META_KEY] = {
            lastSyncAt: Date.now(),
            source: 'import'
          };
          storageArea.set(payload, () => {
            if (chrome.runtime && chrome.runtime.lastError) {
              const reason = chrome.runtime && chrome.runtime.lastError
                ? chrome.runtime.lastError.message
                : '';
              showToast(formatTemplate(getMessage('sync_status_failed_reason', '同步失败：{reason}'), {
                reason: reason || getMessage('sync_status_failed', '同步失败')
              }), true);
              syncImportInput.value = '';
              return;
            }
            showToast(getMessage('sync_import_done', '导入完成'), false);
            refreshSyncStatus();
          });
        }
        syncImportInput.value = '';
      };
      reader.readAsText(file);
    });
  }


  function retryApplyLanguageFromStorage(delayMs) {
    if (!storageArea) {
      return;
    }
    const wait = Number.isFinite(delayMs) ? delayMs : 180;
    setTimeout(() => {
      storageArea.get([LANGUAGE_STORAGE_KEY], (retryResult) => {
        if (!retryResult || !Object.prototype.hasOwnProperty.call(retryResult, LANGUAGE_STORAGE_KEY)) {
          return;
        }
        const retryMode = normalizeLanguageMode(retryResult[LANGUAGE_STORAGE_KEY]);
        applyLanguageMode(retryMode);
      });
    }, wait);
  }

  if (storageArea) {
    storageArea.get([LANGUAGE_STORAGE_KEY], (result) => {
      const hasStored = Object.prototype.hasOwnProperty.call(result, LANGUAGE_STORAGE_KEY);
      const syncArea = chrome && chrome.storage ? chrome.storage.sync : null;
      const localArea = chrome && chrome.storage ? chrome.storage.local : null;
      if (hasStored) {
        const storedRaw = result[LANGUAGE_STORAGE_KEY];
        const stored = normalizeLanguageMode(storedRaw);
        if (storedRaw !== stored) {
          storageArea.set({ [LANGUAGE_STORAGE_KEY]: stored });
        }
        if (localArea) {
          localArea.set({ [LANGUAGE_STORAGE_KEY]: stored });
        }
        applyLanguageMode(stored);
        return;
      }
      if (storageArea === syncArea && localArea) {
        localArea.get([LANGUAGE_STORAGE_KEY], (localResult) => {
          const localHasStored = Object.prototype.hasOwnProperty.call(localResult, LANGUAGE_STORAGE_KEY);
          if (localHasStored) {
            const localRaw = localResult[LANGUAGE_STORAGE_KEY];
            const localMode = normalizeLanguageMode(localRaw);
            localArea.set({ [LANGUAGE_STORAGE_KEY]: localMode });
            storageArea.set({ [LANGUAGE_STORAGE_KEY]: localMode });
            applyLanguageMode(localMode);
            return;
          }
          // 避免刷新瞬间把尚未完成写入的语言偏好覆盖为 system。
          applyLanguageMode('system');
          retryApplyLanguageFromStorage(180);
        });
        return;
      }
      // 读不到时只做 UI 回退，不落盘，防止竞态覆盖用户刚设置的值。
      applyLanguageMode('system');
      retryApplyLanguageFromStorage(180);
    });

    storageArea.get([RECENT_COUNT_STORAGE_KEY], (result) => {
      const stored = result[RECENT_COUNT_STORAGE_KEY];
      const count = normalizeRecentCount(stored);
      if (recentCountSelect) {
        recentCountSelect.value = String(count);
      }
      updateRecentModeTabsVisibility(count);
      if (stored !== count) {
        storageArea.set({ [RECENT_COUNT_STORAGE_KEY]: count });
      }
      refreshCustomSelects();
    });
    storageArea.get([NEWTAB_WIDTH_MODE_STORAGE_KEY], (result) => {
      const stored = result[NEWTAB_WIDTH_MODE_STORAGE_KEY];
      const mode = normalizeNewtabWidthMode(stored);
      if (newtabWidthSelect) {
        newtabWidthSelect.value = mode;
      }
      setNewtabWidthTabState(mode);
      if (stored !== mode) {
        storageArea.set({ [NEWTAB_WIDTH_MODE_STORAGE_KEY]: mode });
      }
      refreshCustomSelects();
    });
    storageArea.get([OVERLAY_SIZE_MODE_STORAGE_KEY], (result) => {
      const stored = result[OVERLAY_SIZE_MODE_STORAGE_KEY];
      const mode = normalizeOverlaySizeMode(stored);
      setOverlaySizeTabState(mode);
      if (stored !== mode) {
        storageArea.set({ [OVERLAY_SIZE_MODE_STORAGE_KEY]: mode });
      }
      refreshCustomSelects();
    });
    storageArea.get([SEARCH_RESULT_PRIORITY_STORAGE_KEY], (result) => {
      const stored = result[SEARCH_RESULT_PRIORITY_STORAGE_KEY];
      const priority = normalizeSearchResultPriority(stored);
      if (searchResultPrioritySelect) {
        searchResultPrioritySelect.value = priority;
      }
      setSearchResultPriorityTabState(priority);
      if (stored !== priority) {
        storageArea.set({ [SEARCH_RESULT_PRIORITY_STORAGE_KEY]: priority });
      }
      refreshCustomSelects();
    });
    storageArea.get([RECENT_MODE_STORAGE_KEY], (result) => {
      const stored = result[RECENT_MODE_STORAGE_KEY];
      const hasStored = stored === 'latest' || stored === 'most';
      const mode = hasStored ? stored : 'most';
      if (recentModeSelect) {
        recentModeSelect.value = mode;
      }
      setRecentModeTabState(mode);
      if (!hasStored) {
        storageArea.set({ [RECENT_MODE_STORAGE_KEY]: mode });
      }
      refreshCustomSelects();
    });
    storageArea.get([BOOKMARK_COUNT_STORAGE_KEY], (result) => {
      const stored = result[BOOKMARK_COUNT_STORAGE_KEY];
      const count = normalizeBookmarkCount(stored);
      if (bookmarkCountSelect) {
        bookmarkCountSelect.value = String(count);
      }
      updateBookmarkColumnsSelectVisibility(count);
      if (stored !== count) {
        storageArea.set({ [BOOKMARK_COUNT_STORAGE_KEY]: count });
      }
      refreshCustomSelects();
    });
    storageArea.get([BOOKMARK_COLUMNS_STORAGE_KEY], (result) => {
      const stored = result[BOOKMARK_COLUMNS_STORAGE_KEY];
      const columns = normalizeBookmarkColumns(stored);
      if (bookmarkColumnsSelect) {
        bookmarkColumnsSelect.value = String(columns);
      }
      if (stored !== columns) {
        storageArea.set({ [BOOKMARK_COLUMNS_STORAGE_KEY]: columns });
      }
      refreshCustomSelects();
    });
    storageArea.get([OVERLAY_TAB_PRIORITY_STORAGE_KEY], (result) => {
      const rawValue = result[OVERLAY_TAB_PRIORITY_STORAGE_KEY];
      const stored = normalizeOverlayTabQuickSwitch(rawValue);
      if (overlayTabQuickSwitchToggle) {
        overlayTabQuickSwitchToggle.checked = stored;
      }
      if (rawValue !== stored) {
        storageArea.set({ [OVERLAY_TAB_PRIORITY_STORAGE_KEY]: stored });
      }
      refreshCustomSelects();
    });
    storageArea.get([NEWTAB_WORDMARK_VISIBLE_STORAGE_KEY], (result) => {
      const rawValue = result[NEWTAB_WORDMARK_VISIBLE_STORAGE_KEY];
      const stored = normalizeNewtabWordmarkVisible(rawValue);
      if (newtabWordmarkToggle) {
        newtabWordmarkToggle.checked = stored;
      }
      if (rawValue !== stored) {
        storageArea.set({ [NEWTAB_WORDMARK_VISIBLE_STORAGE_KEY]: stored });
      }
      refreshCustomSelects();
    });
    storageArea.get([AUTO_PIP_ENABLED_STORAGE_KEY], (result) => {
      const rawValue = result[AUTO_PIP_ENABLED_STORAGE_KEY];
      const stored = normalizeAutoPipEnabled(rawValue);
      if (autoPipToggle) {
        autoPipToggle.checked = stored;
      }
      if (rawValue !== stored) {
        storageArea.set({ [AUTO_PIP_ENABLED_STORAGE_KEY]: stored });
      }
      refreshCustomSelects();
    });
    storageArea.get([DOCUMENT_PIP_ENABLED_STORAGE_KEY], (result) => {
      const rawValue = result[DOCUMENT_PIP_ENABLED_STORAGE_KEY];
      const stored = normalizeDocumentPipEnabled(rawValue);
      if (documentPipToggle) {
        documentPipToggle.checked = stored;
      }
      if (rawValue !== stored) {
        storageArea.set({ [DOCUMENT_PIP_ENABLED_STORAGE_KEY]: stored });
      }
      refreshCustomSelects();
    });
    storageArea.get([PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY], (result) => {
      const rawValue = result[PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY];
      const stored = normalizePinnedTabRecoveryEnabled(rawValue);
      if (pinnedTabRecoveryToggle) {
        pinnedTabRecoveryToggle.checked = stored;
      }
      if (rawValue !== stored) {
        storageArea.set({ [PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY]: stored });
      }
      refreshCustomSelects();
    });

    storageArea.get([RESTRICTED_ACTION_STORAGE_KEY], (result) => {
      const stored = result[RESTRICTED_ACTION_STORAGE_KEY];
      const normalizedStored = stored === 'lumno' ? 'default' : stored;
      const hasStored = normalizedStored === 'default' || normalizedStored === 'none';
      const nextAction = hasStored ? normalizedStored : 'default';
      if (restrictedActionSelect) {
        restrictedActionSelect.value = nextAction;
      }
      setRestrictedActionTabState(nextAction);
      if (!hasStored || normalizedStored !== stored) {
        storageArea.set({ [RESTRICTED_ACTION_STORAGE_KEY]: nextAction });
      }
      refreshCustomSelects();
    });
  }

  customSelectWraps.forEach((wrapper) => {
    const { select, trigger } = getCustomSelectElements(wrapper);
    if (!select || !trigger) {
      return;
    }
    trigger.addEventListener('click', () => {
      const isOpen = wrapper.getAttribute('data-open') === 'true';
      setCustomSelectOpen(wrapper, !isOpen);
    });
    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        setCustomSelectOpen(wrapper, true);
        const delta = event.key === 'ArrowDown' ? 1 : -1;
        const nextIndex = getCustomSelectActiveIndex(wrapper) + delta;
        setCustomSelectActiveIndex(wrapper, nextIndex);
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const isOpen = wrapper.getAttribute('data-open') === 'true';
        if (!isOpen) {
          setCustomSelectOpen(wrapper, true);
          return;
        }
        const { menu } = getCustomSelectElements(wrapper);
        const activeIndex = getCustomSelectActiveIndex(wrapper);
        const item = menu && menu.children ? menu.children[activeIndex] : null;
        if (item) {
          item.click();
        }
      }
    });
    select.addEventListener('change', () => {
      syncCustomSelectUI(select, wrapper);
    });
  });

  document.addEventListener('click', (event) => {
    if (!openCustomSelect) {
      return;
    }
    if (openCustomSelect.contains(event.target)) {
      return;
    }
    closeCustomSelect();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeCustomSelect();
    }
    if (!openCustomSelect) {
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = getCustomSelectActiveIndex(openCustomSelect) + delta;
      setCustomSelectActiveIndex(openCustomSelect, nextIndex);
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const { menu } = getCustomSelectElements(openCustomSelect);
      const activeIndex = getCustomSelectActiveIndex(openCustomSelect);
      const item = menu && menu.children ? menu.children[activeIndex] : null;
      if (item) {
        item.click();
      }
    }
  });

  document.addEventListener('click', (event) => {
    if (!activePopconfirm) {
      return;
    }
    const wrap = activePopconfirm.closest('._x_extension_popconfirm_wrap_2024_unique_');
    if (wrap && wrap.contains(event.target)) {
      return;
    }
    closeActivePopconfirm();
  });

  function resetSiteSearchForm() {
    if (siteSearchKeyInput) siteSearchKeyInput.value = '';
    if (siteSearchNameInput) siteSearchNameInput.value = '';
    if (siteSearchTemplateInput) siteSearchTemplateInput.value = '';
    if (siteSearchAliasInput) siteSearchAliasInput.value = '';
    setSiteSearchError('');
    setEditingState(null);
    setSiteSearchFormExpanded(false);
  }

  setSiteSearchFormExpanded(false);
  setBlacklistFormExpanded(false);

  function renderSiteSearchList() {
    if (!siteSearchCustomList || !siteSearchBuiltinList || !siteSearchAiBuiltinList) {
      return;
    }
    siteSearchCustomList.innerHTML = '';
    siteSearchBuiltinList.innerHTML = '';
    siteSearchAiBuiltinList.innerHTML = '';
    const builtinRowByTemplate = new Map();
    const customKeys = new Set(customSiteSearchProviders.map((item) => String(item.key || '').toLowerCase()));
    const displayDefaults = defaultSiteSearchProviders.filter((item) => {
      const key = String(item.key || '').toLowerCase();
      return key && !customKeys.has(key) && !disabledSiteSearchKeys.has(key);
    });
    const classicBuiltinProviders = displayDefaults.filter((item) => !isBuiltinAiSiteSearchProvider(item));
    const aiBuiltinProviders = displayDefaults.filter((item) => isBuiltinAiSiteSearchProvider(item));
    const builtinTemplateSet = new Set(defaultSiteSearchProviders.map((item) => normalizeSiteSearchTemplate(String(item.template || '').trim())).filter(Boolean));
    function isBuiltinAiSiteSearchProvider(item) {
      if (!item) {
        return false;
      }
      if (String(item.action || '').trim() === 'openAndSubmit') {
        return true;
      }
      const template = normalizeSiteSearchTemplate(String(item.template || '').trim());
      return Boolean(template) && !template.includes('{query}');
    }
    function canEditSiteSearchItem(item) {
      return Boolean(item);
    }
    function getLocalizedBuiltinProviderName(item) {
      if (item && !item._xIsCustom && SITE_SEARCH_PROVIDER_UTILS.getSiteSearchDisplayName) {
        return SITE_SEARCH_PROVIDER_UTILS.getSiteSearchDisplayName(
          item,
          getMessage,
          getMessage('site_search_default', '站内')
        );
      }
      return item && (item.name || item.key) ? (item.name || item.key) : '';
    }
    const renderItem = (item, list) => {
      const row = document.createElement('div');
      row.className = '_x_extension_shortcut_item_2024_unique_';
      row.setAttribute('data-expanded', 'false');
      row.dataset.key = item.key || '';
      row.dataset.type = item._xIsCustom ? 'custom' : 'builtin';
      const normalizedTemplate = normalizeSiteSearchTemplate(String(item.template || '').trim());
      if (!item._xIsCustom && normalizedTemplate) {
        row.dataset.template = normalizedTemplate;
        builtinRowByTemplate.set(normalizedTemplate, row);
      }
      const header = document.createElement('div');
      header.className = '_x_extension_shortcut_item_header_2024_unique_';
      const info = document.createElement('div');
      info.className = '_x_extension_shortcut_item_info_2024_unique_';
      const title = document.createElement('div');
      title.className = '_x_extension_shortcut_item_title_2024_unique_';
      const badge = document.createElement('div');
      badge.className = '_x_extension_shortcut_badge_2024_unique_';
      if (item._xIsCustom) {
        badge.textContent = getMessage('shortcuts_badge_custom', '自定义');
      } else if (isBuiltinAiSiteSearchProvider(item)) {
        badge.textContent = getMessage('shortcuts_badge_builtin_ai', 'AI');
      } else {
        badge.textContent = getMessage('shortcuts_badge_builtin', '内置');
      }
      const iconUrl = isBuiltinAiSiteSearchProvider(item) ? getCachedSiteSearchIconUrl(item) : '';
      const titleText = document.createElement('span');
      titleText.textContent = getLocalizedBuiltinProviderName(item);
      title.appendChild(badge);
      if (iconUrl) {
        const logo = document.createElement('img');
        logo.className = '_x_extension_shortcut_title_logo_2026_unique_';
        logo.alt = '';
        logo.loading = 'lazy';
        logo.decoding = 'async';
        logo.referrerPolicy = 'no-referrer';
        logo.src = iconUrl;
        logo.addEventListener('error', () => {
          logo.remove();
        }, { once: true });
        title.appendChild(logo);
      }
      if (item._xIsCustom && normalizedTemplate && builtinTemplateSet.has(normalizedTemplate)) {
        const duplicateTag = document.createElement('button');
        duplicateTag.type = 'button';
        duplicateTag.className = '_x_extension_shortcut_badge_2024_unique_ _x_extension_shortcut_badge_warn_2024_unique_';
        duplicateTag.setAttribute('data-template', normalizedTemplate);
        duplicateTag.setAttribute('title', getMessage('shortcuts_duplicate_action', '定位内置项'));
        duplicateTag.setAttribute('aria-label', getMessage('shortcuts_duplicate_action', '定位内置项'));
        duplicateTag.innerHTML = `${getRiSvg('ri-question-line', 'ri-size-12')}${getMessage('shortcuts_duplicate_tag', '与内置重复')}`;
        duplicateTag.addEventListener('click', (event) => {
          event.stopPropagation();
          const targetRow = builtinRowByTemplate.get(normalizedTemplate);
          if (!targetRow) {
            return;
          }
          targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetRow.removeAttribute('data-flash');
          void targetRow.offsetWidth;
          targetRow.setAttribute('data-flash', 'true');
          const onFlashEnd = () => {
            targetRow.removeAttribute('data-flash');
            targetRow.removeEventListener('animationend', onFlashEnd);
          };
          targetRow.addEventListener('animationend', onFlashEnd);
        });
        title.appendChild(duplicateTag);
      }
      title.appendChild(titleText);
      const meta = document.createElement('div');
      meta.className = '_x_extension_shortcut_item_meta_2024_unique_';
      meta.textContent = `${item.key} · ${item.template || ''}`;
      info.appendChild(title);
      info.appendChild(meta);
      const actions = document.createElement('div');
      actions.className = '_x_extension_shortcut_item_actions_2024_unique_';
      if (canEditSiteSearchItem(item)) {
        const editButton = document.createElement('button');
        editButton.className = '_x_extension_shortcut_edit_2024_unique_';
        editButton.innerHTML = getRiSvg('ri-edit-line', 'ri-size-14');
        editButton.dataset.editKey = item.key || '';
        editButton.dataset.editType = item._xIsCustom ? 'custom' : 'builtin';
        actions.appendChild(editButton);
      }
      const removeButton = document.createElement('button');
      removeButton.className = '_x_extension_shortcut_remove_2024_unique_';
      removeButton.innerHTML = getRiSvg('ri-delete-bin-4-line', 'ri-size-14');
      removeButton.setAttribute('aria-label', getMessage('shortcuts_remove', '移除'));
      actions.appendChild(removeButton);
      const popconfirm = document.createElement('div');
      popconfirm.className = '_x_extension_popconfirm_2024_unique_';
      popconfirm.setAttribute('data-open', 'false');
      const popText = document.createElement('div');
      popText.className = '_x_extension_popconfirm_text_2024_unique_';
      popText.textContent = getMessage('confirm_remove_item', '确认移除该项？');
      const popActions = document.createElement('div');
      popActions.className = '_x_extension_popconfirm_actions_2024_unique_';
      const popCancel = document.createElement('button');
      popCancel.className = '_x_extension_shortcut_secondary_2024_unique_';
      popCancel.textContent = getMessage('confirm_cancel', '取消');
      const popOk = document.createElement('button');
      popOk.className = '_x_extension_shortcut_submit_2024_unique_ _x_extension_shortcut_submit_primary_2024_unique_ _x_extension_shortcut_save_2024_unique_';
      popOk.textContent = getMessage('confirm_ok', '确认');
      popActions.appendChild(popCancel);
      popActions.appendChild(popOk);
      popconfirm.appendChild(popText);
      popconfirm.appendChild(popActions);
      const popWrap = document.createElement('div');
      popWrap.className = '_x_extension_popconfirm_wrap_2024_unique_';
      popWrap.appendChild(removeButton);
      popWrap.appendChild(popconfirm);
      actions.appendChild(popWrap);
      header.appendChild(info);
      header.appendChild(actions);
      row.appendChild(header);
      if (!canEditSiteSearchItem(item)) {
        list.appendChild(row);
        return;
      }
      const editor = document.createElement('div');
      editor.className = '_x_extension_shortcut_editor_2024_unique_';
      const templateField = document.createElement('div');
      templateField.className = '_x_extension_shortcut_field_2024_unique_';
      const templateLabelRow = document.createElement('div');
      templateLabelRow.className = '_x_extension_shortcut_label_row_2024_unique_';
      const templateLabel = document.createElement('label');
      templateLabel.className = '_x_extension_shortcut_label_2024_unique_';
      const templateLabelText = document.createElement('span');
      templateLabelText.setAttribute('data-i18n', 'shortcuts_label_template');
      templateLabelText.textContent = getMessage('shortcuts_label_template', '搜索模板');
      const templateRequired = document.createElement('span');
      templateRequired.className = '_x_extension_shortcut_required_2024_unique_';
      templateRequired.textContent = '*';
      const templateHint = document.createElement('span');
      templateHint.className = '_x_extension_shortcut_hint_2024_unique_ _x_extension_shortcut_group_action_2024_unique_';
      templateHint.setAttribute('data-tooltip', getMessage(
        'shortcuts_template_help',
        '1.打开你想添加的网站\n2.输入任一搜索词，触发搜索\n3.将搜索结果页面 url 粘贴在此处\n4.将关键词替换为{query}'
      ));
      templateHint.setAttribute('aria-label', getMessage(
        'shortcuts_template_help',
        '1.打开你想添加的网站\n2.输入任一搜索词，触发搜索\n3.将搜索结果页面 url 粘贴在此处\n4.将关键词替换为{query}'
      ));
      templateHint.innerHTML = getRiSvg('ri-question-line', 'ri-size-14');
      templateLabel.appendChild(templateLabelText);
      templateLabel.appendChild(templateRequired);
      templateLabelRow.appendChild(templateLabel);
      templateLabelRow.appendChild(templateRequired);
      templateLabelRow.appendChild(templateHint);
      const templateInput = document.createElement('input');
      templateInput.className = '_x_extension_shortcut_input_2024_unique_';
      templateInput.value = item.template || '';
      templateInput.disabled = !item._xIsCustom;
      templateField.appendChild(templateLabelRow);
      templateField.appendChild(templateInput);

      const keyField = document.createElement('div');
      keyField.className = '_x_extension_shortcut_field_2024_unique_';
      const keyLabel = document.createElement('label');
      keyLabel.className = '_x_extension_shortcut_label_2024_unique_';
      const keyLabelText = document.createElement('span');
      keyLabelText.setAttribute('data-i18n', 'shortcuts_label_key');
      keyLabelText.textContent = getMessage('shortcuts_label_key', '触发词');
      const keyRequired = document.createElement('span');
      keyRequired.className = '_x_extension_shortcut_required_2024_unique_';
      keyRequired.textContent = '*';
      keyLabel.appendChild(keyLabelText);
      keyLabel.appendChild(keyRequired);
      const keyInput = document.createElement('input');
      keyInput.className = '_x_extension_shortcut_input_2024_unique_';
      keyInput.value = item.key || '';
      keyInput.placeholder = getMessage('shortcuts_placeholder_required', '必填，如有多个用英文逗号分隔，如 jd,bili');
      keyField.appendChild(keyLabel);
      keyField.appendChild(keyInput);

      const nameField = document.createElement('div');
      nameField.className = '_x_extension_shortcut_field_2024_unique_';
      const nameLabel = document.createElement('label');
      nameLabel.className = '_x_extension_shortcut_label_2024_unique_';
      nameLabel.textContent = getMessage('shortcuts_label_name', '显示名称');
      const nameInput = document.createElement('input');
      nameInput.className = '_x_extension_shortcut_input_2024_unique_';
      nameInput.value = item.name || item.key || '';
      nameInput.placeholder = getMessage('shortcuts_placeholder_optional_default', '选填，默认使用触发词');
      nameField.appendChild(nameLabel);
      nameField.appendChild(nameInput);

      const aliasField = document.createElement('div');
      aliasField.className = '_x_extension_shortcut_field_2024_unique_';
      const aliasLabel = document.createElement('label');
      aliasLabel.className = '_x_extension_shortcut_label_2024_unique_';
      const aliasLabelText = document.createElement('span');
      aliasLabelText.setAttribute('data-i18n', 'shortcuts_label_alias');
      aliasLabelText.textContent = getMessage('shortcuts_label_alias', '别名');
      const aliasRequired = document.createElement('span');
      aliasRequired.className = '_x_extension_shortcut_required_2024_unique_';
      aliasRequired.textContent = '*';
      aliasLabel.appendChild(aliasLabelText);
      aliasLabel.appendChild(aliasRequired);
      const aliasInput = document.createElement('input');
      aliasInput.className = '_x_extension_shortcut_input_2024_unique_';
      aliasInput.value = Array.isArray(item.aliases) ? item.aliases.join(',') : '';
      aliasInput.placeholder = getMessage('shortcuts_placeholder_alias', '选填，例如 小破站、油管等');
      aliasField.appendChild(aliasLabel);
      aliasField.appendChild(aliasInput);

      const editorActions = document.createElement('div');
      editorActions.className = '_x_extension_shortcut_editor_actions_2024_unique_';
      const saveButton = document.createElement('button');
      saveButton.className = '_x_extension_shortcut_submit_2024_unique_ _x_extension_shortcut_submit_primary_2024_unique_ _x_extension_shortcut_save_2024_unique_';
      saveButton.textContent = getMessage('shortcuts_save', '保存修改');
      const cancelButton = document.createElement('button');
      cancelButton.className = '_x_extension_shortcut_secondary_2024_unique_';
      cancelButton.textContent = getMessage('shortcuts_cancel', '取消');
      editorActions.appendChild(cancelButton);
      editorActions.appendChild(saveButton);
      attachSaveButtonAnimation(saveButton);

      cancelButton.addEventListener('click', () => {
        row.setAttribute('data-expanded', 'false');
      });
      saveButton.addEventListener('click', () => {
        suspendSiteSearchRefresh(260);
        const nextKeyRaw = String(keyInput.value || '').trim();
        const isBuiltinAiProvider = !item._xIsCustom && isBuiltinAiSiteSearchProvider(item);
        if (!nextKeyRaw) {
          showToast(getMessage('shortcuts_error_key', '请填写触发词。'), true);
          return;
        }
        if (/\s/.test(nextKeyRaw)) {
          showToast(getMessage('shortcuts_error_key_space', '触发词不能包含空格。'), true);
          return;
        }
        const templateRaw = String(templateInput.value || '').trim();
        const template = normalizeSiteSearchTemplate(templateRaw);
        if (!template || (!isBuiltinAiProvider && !template.includes('{query}'))) {
          showToast(getMessage('toast_error_template', '搜索模板必须包含 {query}。'), true);
          return;
        }
        const aliases = normalizeAliases(aliasInput.value || '');
        const normalizedKey = nextKeyRaw.toLowerCase();
        let next = customSiteSearchProviders.filter((entry) => String(entry.key || '').toLowerCase() !== normalizedKey);
        const previousKey = String(item.key || '').toLowerCase();
        if (previousKey && previousKey !== normalizedKey) {
          next = next.filter((entry) => String(entry.key || '').toLowerCase() !== previousKey);
        }
        const shouldDisable = item._xIsCustom && isDuplicateTemplate(template, defaultSiteSearchProviders);
        next.unshift({
          key: nextKeyRaw,
          name: String(nameInput.value || '').trim() || nextKeyRaw,
          template: template,
          aliases: aliases,
          action: item._xIsCustom ? undefined : item.action,
          submitStrategy: item._xIsCustom ? undefined : item.submitStrategy,
          disabled: shouldDisable,
          disabledReason: shouldDisable ? 'duplicate' : ''
        });
        disabledSiteSearchKeys.delete(normalizedKey);
        Promise.all([
          saveCustomSiteSearchProviders(next),
          saveDisabledSiteSearchKeys(disabledSiteSearchKeys)
        ]).then(() => {
          customSiteSearchProviders = next;
          row.setAttribute('data-expanded', 'false');
          const finalize = () => {
            showToast(getMessage('toast_saved', '已保存'), false);
          };
          if (saveButton.classList.contains('_x_extension_shortcut_save_2024_unique_')) {
            setTimeout(finalize, 220);
          } else {
            finalize();
          }
        }).catch(() => {
          showToast(getMessage('toast_error', '操作失败，请重试'), true);
        });
      });

      editor.appendChild(templateField);
      editor.appendChild(keyField);
      editor.appendChild(nameField);
      editor.appendChild(aliasField);
      editor.appendChild(editorActions);
      row.appendChild(editor);
      removeButton.addEventListener('click', (event) => {
        event.stopPropagation();
        if (activePopconfirm && activePopconfirm !== popconfirm) {
          closeActivePopconfirm();
        }
        const isOpen = popconfirm.getAttribute('data-open') === 'true';
        if (isOpen) {
          popconfirm.setAttribute('data-open', 'false');
          activePopconfirm = null;
        } else {
          popconfirm.setAttribute('data-open', 'true');
          activePopconfirm = popconfirm;
        }
      });
      popCancel.addEventListener('click', (event) => {
        event.stopPropagation();
        popconfirm.setAttribute('data-open', 'false');
        if (activePopconfirm === popconfirm) {
          activePopconfirm = null;
        }
      });
      popOk.addEventListener('click', (event) => {
        event.stopPropagation();
        popconfirm.setAttribute('data-open', 'false');
        if (activePopconfirm === popconfirm) {
          activePopconfirm = null;
        }
        removeSiteSearchItem(item.key || '', !item._xIsCustom);
      });
      list.appendChild(row);
    };
    if (customSiteSearchProviders.length === 0) {
      // 保持为空，沿用原有交互，只显示下方添加区域
    } else {
      customSiteSearchProviders.forEach((item) => {
        renderItem({ ...item, _xIsCustom: true }, siteSearchCustomList);
      });
    }
    if (classicBuiltinProviders.length === 0) {
      const empty = document.createElement('div');
      empty.className = '_x_extension_settings_placeholder_2024_unique_';
      empty.textContent = getMessage('shortcuts_empty_builtin', '暂无内置站内搜索');
      siteSearchBuiltinList.appendChild(empty);
    } else {
      classicBuiltinProviders.forEach((item) => {
        renderItem({ ...item, _xIsCustom: false }, siteSearchBuiltinList);
      });
    }
    if (aiBuiltinProviders.length === 0) {
      const empty = document.createElement('div');
      empty.className = '_x_extension_settings_placeholder_2024_unique_';
      empty.textContent = getMessage('shortcuts_empty_builtin_ai', '暂无 AI 站内搜索');
      siteSearchAiBuiltinList.appendChild(empty);
    } else {
      aiBuiltinProviders.forEach((item) => {
        renderItem({ ...item, _xIsCustom: false }, siteSearchAiBuiltinList);
      });
    }
    initTooltips();
  }

  function loadDefaultSiteSearchProviders() {
    const localUrl = chrome.runtime.getURL('public/assets/data/site-search.json');
    return fetch(localUrl)
      .then((resp) => resp.json())
      .then((data) => {
        const items = data && Array.isArray(data.items) ? data.items : [];
        return items.length > 0 ? items : fallbackSiteSearchProviders;
      })
      .catch(() => new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'getSiteSearchProviders' }, (response) => {
          const items = response && Array.isArray(response.items) ? response.items : [];
          resolve(items.length > 0 ? items : fallbackSiteSearchProviders);
        });
      }));
  }

  function normalizeAliasList(list) {
    const items = Array.isArray(list) ? list : [];
    const cleaned = items
      .map((item) => String(item || '').trim().toLowerCase())
      .filter(Boolean);
    return Array.from(new Set(cleaned)).sort();
  }

  function isSameProviderContent(a, b) {
    if (!a || !b) {
      return false;
    }
    const nameA = String(a.name || a.key || '').trim();
    const nameB = String(b.name || b.key || '').trim();
    const templateA = normalizeSiteSearchTemplate(String(a.template || '').trim());
    const templateB = normalizeSiteSearchTemplate(String(b.template || '').trim());
    if (nameA !== nameB || templateA !== templateB) {
      return false;
    }
    const aliasA = normalizeAliasList(a.aliases);
    const aliasB = normalizeAliasList(b.aliases);
    return JSON.stringify(aliasA) === JSON.stringify(aliasB);
  }

  function filterRedundantCustomProviders(defaults, custom) {
    const map = new Map((defaults || []).map((item) => [String(item.key || '').toLowerCase(), item]));
    return (custom || []).filter((item) => {
      const key = String(item.key || '').toLowerCase();
      const base = map.get(key);
      if (!base) {
        return true;
      }
      return !isSameProviderContent(item, base);
    });
  }

  function loadCustomSiteSearchProviders() {
    return new Promise((resolve) => {
      if (!storageArea) {
        resolve([]);
        return;
      }
      storageArea.get([SITE_SEARCH_STORAGE_KEY], (result) => {
        const items = Array.isArray(result[SITE_SEARCH_STORAGE_KEY]) ? result[SITE_SEARCH_STORAGE_KEY] : [];
        resolve(items);
      });
    });
  }

  function loadDisabledSiteSearchKeys() {
    return new Promise((resolve) => {
      if (!storageArea) {
        resolve([]);
        return;
      }
      storageArea.get([SITE_SEARCH_DISABLED_STORAGE_KEY], (result) => {
        const items = Array.isArray(result[SITE_SEARCH_DISABLED_STORAGE_KEY])
          ? result[SITE_SEARCH_DISABLED_STORAGE_KEY]
          : [];
        resolve(items.map((item) => String(item).toLowerCase()).filter(Boolean));
      });
    });
  }

  function saveDisabledSiteSearchKeys(keys) {
    const payload = Array.from(keys || [])
      .map((item) => String(item).toLowerCase())
      .filter(Boolean);
    return new Promise((resolve) => {
      if (!storageArea) {
        resolve();
        return;
      }
      storageArea.set({ [SITE_SEARCH_DISABLED_STORAGE_KEY]: payload }, () => resolve());
    });
  }

  function saveCustomSiteSearchProviders(items) {
    return new Promise((resolve) => {
      if (!storageArea) {
        resolve();
        return;
      }
      storageArea.set({ [SITE_SEARCH_STORAGE_KEY]: items }, () => resolve());
    });
  }

  function loadSearchBlacklistItems() {
    return new Promise((resolve) => {
      if (!storageArea) {
        resolve([]);
        return;
      }
      storageArea.get([SEARCH_BLACKLIST_STORAGE_KEY], (result) => {
        resolve(normalizeSearchBlacklistItems(result && result[SEARCH_BLACKLIST_STORAGE_KEY]));
      });
    });
  }

  function saveSearchBlacklistItems(items) {
    return new Promise((resolve) => {
      if (!storageArea) {
        resolve([]);
        return;
      }
      const normalized = normalizeSearchBlacklistItems(items);
      storageArea.set({ [SEARCH_BLACKLIST_STORAGE_KEY]: normalized }, () => resolve(normalized));
    });
  }

  function renderSearchBlacklistList() {
    if (!blacklistList) {
      return;
    }
    blacklistList.innerHTML = '';
    if (!Array.isArray(searchBlacklistItems) || searchBlacklistItems.length === 0) {
      // 保留输入区域即可，和站内搜索空状态保持一致
      return;
    }
    searchBlacklistItems.forEach((item) => {
      const itemKey = buildBlacklistItemKey(item);
      const row = document.createElement('div');
      row.className = '_x_extension_shortcut_item_2024_unique_';
      row.setAttribute('data-expanded', 'false');
      const header = document.createElement('div');
      header.className = '_x_extension_shortcut_item_header_2024_unique_';
      const info = document.createElement('div');
      info.className = '_x_extension_shortcut_item_info_2024_unique_';
      const title = document.createElement('div');
      title.className = '_x_extension_shortcut_item_title_2024_unique_';
      const badge = document.createElement('div');
      badge.className = '_x_extension_shortcut_badge_2024_unique_';
      const badgeConfig = getBlacklistMatchBadgeConfig(item.matchModes);
      badge.setAttribute('data-tone', badgeConfig.tone);
      badge.textContent = badgeConfig.text;
      const titleText = document.createElement('span');
      titleText.textContent = formatBlacklistPatternForDisplay(item);
      title.appendChild(badge);
      title.appendChild(titleText);
      info.appendChild(title);
      const actions = document.createElement('div');
      actions.className = '_x_extension_shortcut_item_actions_2024_unique_';
      const editButton = document.createElement('button');
      editButton.className = '_x_extension_shortcut_edit_2024_unique_';
      editButton.innerHTML = getRiSvg('ri-edit-line', 'ri-size-14');
      editButton.setAttribute('aria-label', getMessage('shortcuts_edit', '编辑'));
      const removeButton = document.createElement('button');
      removeButton.className = '_x_extension_shortcut_remove_2024_unique_';
      removeButton.innerHTML = getRiSvg('ri-delete-bin-4-line', 'ri-size-14');
      removeButton.setAttribute('aria-label', getMessage('shortcuts_remove', '移除'));
      const popconfirm = document.createElement('div');
      popconfirm.className = '_x_extension_popconfirm_2024_unique_';
      popconfirm.setAttribute('data-open', 'false');
      const popText = document.createElement('div');
      popText.className = '_x_extension_popconfirm_text_2024_unique_';
      popText.textContent = getMessage('confirm_remove_item', '确认移除该项？');
      const popActions = document.createElement('div');
      popActions.className = '_x_extension_popconfirm_actions_2024_unique_';
      const popCancel = document.createElement('button');
      popCancel.className = '_x_extension_shortcut_secondary_2024_unique_';
      popCancel.textContent = getMessage('confirm_cancel', '取消');
      const popOk = document.createElement('button');
      popOk.className = '_x_extension_shortcut_submit_2024_unique_ _x_extension_shortcut_submit_primary_2024_unique_ _x_extension_shortcut_save_2024_unique_';
      popOk.textContent = getMessage('confirm_ok', '确认');
      popActions.appendChild(popCancel);
      popActions.appendChild(popOk);
      popconfirm.appendChild(popText);
      popconfirm.appendChild(popActions);
      const popWrap = document.createElement('div');
      popWrap.className = '_x_extension_popconfirm_wrap_2024_unique_';
      popWrap.appendChild(removeButton);
      popWrap.appendChild(popconfirm);
      actions.appendChild(editButton);
      actions.appendChild(popWrap);
      header.appendChild(info);
      header.appendChild(actions);
      row.appendChild(header);

      const editor = document.createElement('div');
      editor.className = '_x_extension_shortcut_editor_2024_unique_';

      const urlField = document.createElement('div');
      urlField.className = '_x_extension_shortcut_field_2024_unique_';
      const urlLabel = document.createElement('div');
      urlLabel.className = '_x_extension_shortcut_label_2024_unique_';
      const urlLabelText = document.createElement('span');
      const urlRequired = document.createElement('span');
      urlRequired.className = '_x_extension_shortcut_required_2024_unique_';
      urlRequired.textContent = '*';
      urlLabel.appendChild(urlLabelText);
      urlLabel.appendChild(urlRequired);
      const urlAffix = document.createElement('div');
      urlAffix.className = '_x_extension_shortcut_input_affix_2026_unique_';
      const urlPrefix = document.createElement('span');
      urlPrefix.className = '_x_extension_shortcut_input_prefix_2026_unique_';
      const urlInput = document.createElement('input');
      urlInput.className = '_x_extension_shortcut_input_2024_unique_';
      urlInput.value = getBlacklistPatternInputValue(item);
      urlAffix.appendChild(urlPrefix);
      urlAffix.appendChild(urlInput);
      urlField.appendChild(urlLabel);
      urlField.appendChild(urlAffix);

      const matchField = document.createElement('div');
      matchField.className = '_x_extension_shortcut_field_2024_unique_';
      const matchLabel = document.createElement('div');
      matchLabel.className = '_x_extension_shortcut_label_2024_unique_';
      matchLabel.textContent = getMessage('blacklist_match_label', '匹配方式');
      const matchModes = document.createElement('div');
      matchModes.className = '_x_extension_blacklist_match_modes_2026_unique_';

      function createModeOption(mode, textKey, fallback, tooltipKey, tooltipFallback) {
        const wrap = document.createElement('label');
        wrap.className = '_x_extension_blacklist_match_mode_2026_unique_';
        const input = document.createElement('input');
        input.type = 'checkbox';
        const text = document.createElement('span');
        text.textContent = getMessage(textKey, fallback);
        const hint = document.createElement('span');
        hint.className = '_x_extension_shortcut_hint_2024_unique_ _x_extension_tooltip_host_2024_unique_';
        hint.setAttribute('data-tooltip', getMessage(tooltipKey, tooltipFallback));
        hint.innerHTML = getRiSvg('ri-question-line', 'ri-size-14');
        wrap.appendChild(input);
        wrap.appendChild(text);
        wrap.appendChild(hint);
        return { wrap, input };
      }

      const exactOption = createModeOption(
        'exact',
        'blacklist_match_exact',
        '当前页面',
        'blacklist_match_exact_tooltip',
        '只屏蔽这一页\n────────\n例如，填 x.com/home 后，只有这一页不会出现，其他页面不受影响'
      );
      const prefixOption = createModeOption(
        'prefix',
        'blacklist_match_prefix',
        '当前站点路径',
        'blacklist_match_prefix_tooltip',
        '只屏蔽这个站点下这一路径的页面\n────────\n例如，填 baidu.com/search 后，baidu.com/search 和 baidu.com/search/1 不会出现，但 baidu.com/news 不受影响'
      );
      const suffixOption = createModeOption(
        'suffix',
        'blacklist_match_suffix',
        '整个网站',
        'blacklist_match_suffix_tooltip',
        '屏蔽这个网站的所有页面，也包括它的子网站\n────────\n例如，填 baidu.com 后，baidu.com/search 和 tieba.baidu.com 都不会出现'
      );
      matchModes.appendChild(suffixOption.wrap);
      matchModes.appendChild(exactOption.wrap);
      matchModes.appendChild(prefixOption.wrap);
      matchField.appendChild(matchLabel);
      matchField.appendChild(matchModes);

      const editorError = document.createElement('div');
      editorError.className = '_x_extension_shortcut_error_2024_unique_';
      editorError.style.display = 'none';
      function setEditorError(message) {
        const text = String(message || '').trim();
        editorError.textContent = text;
        editorError.style.display = text ? 'block' : 'none';
      }

      function getEditorMatchModes() {
        return normalizeBlacklistMatchModes([
          exactOption.input.checked ? 'exact' : '',
          prefixOption.input.checked ? 'prefix' : '',
          suffixOption.input.checked ? 'suffix' : ''
        ], null);
      }

      function syncEditorMatchModeAvailability(changedMode) {
        syncBlacklistModeSelection(
          {
            exact: exactOption.input,
            prefix: prefixOption.input,
            suffix: suffixOption.input
          },
          changedMode,
          {
            exact: exactOption.wrap,
            prefix: prefixOption.wrap,
            suffix: suffixOption.wrap
          },
          (modes) => applyBlacklistInputPresentationToElements(
            urlLabelText,
            urlPrefix,
            urlInput,
            modes
          )
        );
      }

      exactOption.input.addEventListener('change', () => syncEditorMatchModeAvailability('exact'));
      prefixOption.input.addEventListener('change', () => syncEditorMatchModeAvailability('prefix'));
      suffixOption.input.addEventListener('change', () => syncEditorMatchModeAvailability('suffix'));
      urlInput.addEventListener('input', () => {
        setEditorError('');
      });

      const initialModes = normalizeBlacklistMatchModes(item.matchModes);
      exactOption.input.checked = initialModes.includes('exact');
      prefixOption.input.checked = initialModes.includes('prefix');
      suffixOption.input.checked = initialModes.includes('suffix');
      syncEditorMatchModeAvailability();

      const editorActions = document.createElement('div');
      editorActions.className = '_x_extension_shortcut_editor_actions_2024_unique_';
      const cancelButton = document.createElement('button');
      cancelButton.className = '_x_extension_shortcut_secondary_2024_unique_';
      cancelButton.textContent = getMessage('shortcuts_cancel', '取消');
      const saveButton = document.createElement('button');
      saveButton.className = '_x_extension_shortcut_submit_2024_unique_ _x_extension_shortcut_submit_primary_2024_unique_ _x_extension_shortcut_save_2024_unique_';
      saveButton.textContent = getMessage('shortcuts_save', '保存修改');
      attachSaveButtonAnimation(saveButton);
      cancelButton.addEventListener('click', () => {
        row.setAttribute('data-expanded', 'false');
      });
      saveButton.addEventListener('click', () => {
        const nextModes = getEditorMatchModes();
        if (nextModes.length === 0) {
          setEditorError(getMessage('blacklist_error_match_mode', '请选择至少一种匹配方式'));
          return;
        }
        const nextPattern = normalizeBlacklistPattern(urlInput.value, nextModes);
        if (!nextPattern) {
          const message = nextModes.includes('suffix')
            ? getMessage('blacklist_error_domain', '请输入网站域名')
            : getMessage('blacklist_error_url', '请输入站点域名或完整 URL');
          setEditorError(message);
          return;
        }
        setEditorError('');
        const nextItems = [{ pattern: nextPattern, matchModes: nextModes }].concat(
          searchBlacklistItems.filter((entry) => buildBlacklistItemKey(entry) !== itemKey && entry.pattern !== nextPattern)
        );
        saveSearchBlacklistItems(nextItems).then((savedItems) => {
          searchBlacklistItems = savedItems;
          renderSearchBlacklistList();
          notifyNewtabSectionsRefresh('recent');
          const finalize = () => {
            showToast(getMessage('toast_saved', '已保存'), false);
          };
          if (saveButton.classList.contains('_x_extension_shortcut_save_2024_unique_')) {
            setTimeout(finalize, 220);
          } else {
            finalize();
          }
        }).catch(() => {
          showToast(getMessage('toast_error', '操作失败，请重试'), true);
        });
      });
      editorActions.appendChild(cancelButton);
      editorActions.appendChild(saveButton);

      editor.appendChild(urlField);
      editor.appendChild(matchField);
      editor.appendChild(editorActions);
      editor.appendChild(editorError);
      row.appendChild(editor);

      editButton.addEventListener('click', (event) => {
        event.stopPropagation();
        row.setAttribute('data-expanded', row.getAttribute('data-expanded') === 'true' ? 'false' : 'true');
      });
      removeButton.addEventListener('click', (event) => {
        event.stopPropagation();
        if (activePopconfirm && activePopconfirm !== popconfirm) {
          closeActivePopconfirm();
        }
        const isOpen = popconfirm.getAttribute('data-open') === 'true';
        if (isOpen) {
          popconfirm.setAttribute('data-open', 'false');
          activePopconfirm = null;
        } else {
          popconfirm.setAttribute('data-open', 'true');
          activePopconfirm = popconfirm;
        }
      });
      popCancel.addEventListener('click', (event) => {
        event.stopPropagation();
        popconfirm.setAttribute('data-open', 'false');
        if (activePopconfirm === popconfirm) {
          activePopconfirm = null;
        }
      });
      popOk.addEventListener('click', (event) => {
        event.stopPropagation();
        popconfirm.setAttribute('data-open', 'false');
        if (activePopconfirm === popconfirm) {
          activePopconfirm = null;
        }
        const nextItems = searchBlacklistItems.filter((entry) => buildBlacklistItemKey(entry) !== itemKey);
        saveSearchBlacklistItems(nextItems).then((savedItems) => {
          searchBlacklistItems = savedItems;
          renderSearchBlacklistList();
          notifyNewtabSectionsRefresh('recent');
          showToast(getMessage('blacklist_removed_toast', '已从黑名单移除'), false);
          if (blacklistUrlInput) {
            blacklistUrlInput.focus();
          }
        }).catch(() => {
          showToast(getMessage('toast_error', '操作失败，请重试'), true);
        });
      });
      blacklistList.appendChild(row);
    });
    initTooltips();
  }

  function refreshSiteSearchProviders() {
    if (!siteSearchCustomList || !siteSearchBuiltinList || !siteSearchAiBuiltinList) {
      return;
    }
    if (defaultSiteSearchProviders.length === 0) {
      defaultSiteSearchProviders = fallbackSiteSearchProviders.slice();
      renderSiteSearchList();
    }
    Promise.all([
      loadDefaultSiteSearchProviders(),
      loadCustomSiteSearchProviders(),
      loadDisabledSiteSearchKeys()
    ]).then(([defaults, custom, disabled]) => {
      defaultSiteSearchProviders = defaults;
      const filteredCustom = filterRedundantCustomProviders(defaults, custom);
      const withoutDebug = filteredCustom.filter((item) => String(item.key || '').toLowerCase() !== DEBUG_DUPLICATE_CUSTOM_KEY);
      const didFilter = filteredCustom.length !== (custom || []).length;
      const didRemoveDebug = withoutDebug.length !== filteredCustom.length;
      let nextCustom = withoutDebug.map((item) => {
        const shouldDisable = isDuplicateTemplate(item.template, defaults);
        return {
          ...item,
          disabled: shouldDisable,
          disabledReason: shouldDisable ? 'duplicate' : ''
        };
      });
      const didUpdateDisabled = nextCustom.some((item, index) => {
        const before = filteredCustom[index] || {};
        return Boolean(before.disabled) !== Boolean(item.disabled) ||
          String(before.disabledReason || '') !== String(item.disabledReason || '');
      });
      customSiteSearchProviders = nextCustom;
      disabledSiteSearchKeys = new Set(disabled || []);
      if (didFilter || didUpdateDisabled || didRemoveDebug) {
        saveCustomSiteSearchProviders(nextCustom);
      }
      const filteredBase = defaultSiteSearchProviders.filter((item) => {
        const key = String(item && item.key ? item.key : '').toLowerCase();
        return key && !disabledSiteSearchKeys.has(key);
      });
      if (filteredBase.length === 0 && customSiteSearchProviders.length === 0 && defaultSiteSearchProviders.length > 0) {
        disabledSiteSearchKeys = new Set();
        saveDisabledSiteSearchKeys(disabledSiteSearchKeys);
      }
      defaultSiteSearchProviders.forEach((item) => {
        if (isBuiltinAiSiteSearchProvider(item)) {
          primeSiteSearchIconCache(item);
        }
      });
      renderSiteSearchList();
    });
  }

  if (siteSearchCustomList && siteSearchBuiltinList && siteSearchAiBuiltinList) {
    ensureSiteSearchIconCacheLoaded().finally(() => {
      refreshSiteSearchProviders();
    });
  }
  if (blacklistList) {
    loadSearchBlacklistItems().then((items) => {
      searchBlacklistItems = items;
      syncBlacklistMatchModeAvailability();
      renderSearchBlacklistList();
    });
  }

  function handleSiteSearchListClick(event) {
      const target = event.target;
      if (!target) {
        return;
      }
      const editTarget = target.closest ? target.closest('button[data-edit-key]') : null;
      if (editTarget) {
        const key = String(editTarget.dataset.editKey || '');
        const isBuiltin = editTarget.dataset.editType === 'builtin';
        const match = isBuiltin
          ? defaultSiteSearchProviders.find((item) => String(item.key || '') === key)
          : customSiteSearchProviders.find((item) => String(item.key || '') === key);
        if (match) {
          const row = editTarget.closest('._x_extension_shortcut_item_2024_unique_');
          if (row) {
            row.setAttribute('data-expanded', row.getAttribute('data-expanded') === 'true' ? 'false' : 'true');
          }
          return;
        }
        return;
      }
      if (target.closest && target.closest('._x_extension_popconfirm_2024_unique_')) {
        return;
      }
    }

  if (siteSearchCustomList) {
    siteSearchCustomList.addEventListener('click', handleSiteSearchListClick);
  }
  if (siteSearchBuiltinList) {
    siteSearchBuiltinList.addEventListener('click', handleSiteSearchListClick);
  }
  if (siteSearchAiBuiltinList) {
    siteSearchAiBuiltinList.addEventListener('click', handleSiteSearchListClick);
  }
  siteSearchBuiltinTabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const nextTab = button.getAttribute('data-site-search-builtin-tab') === 'ai' ? 'ai' : 'builtin';
      setSiteSearchBuiltinTabState(nextTab);
    });
  });
  document.addEventListener('click', (event) => {
    if (!activePopconfirm) {
      return;
    }
    if (event.target && event.target.closest && event.target.closest('._x_extension_popconfirm_2024_unique_')) {
      return;
    }
    if (event.target && event.target.closest && event.target.closest('._x_extension_shortcut_remove_2024_unique_')) {
      return;
    }
    closeActivePopconfirm();
  });

  if (siteSearchCancelButton) {
    siteSearchCancelButton.addEventListener('click', function() {
      resetSiteSearchForm();
    });
  }

  if (siteSearchFormTrigger) {
    siteSearchFormTrigger.addEventListener('click', () => {
      setSiteSearchFormExpanded(true);
    });
  }

  if (siteSearchAddButton) {
    attachSaveButtonAnimation(siteSearchAddButton);
    siteSearchAddButton.addEventListener('click', function() {
      if (!siteSearchFormExpanded) {
        setSiteSearchFormExpanded(true);
        return;
      }
      suspendSiteSearchRefresh(260);
      setSiteSearchError('');
      const key = String(siteSearchKeyInput ? siteSearchKeyInput.value : '').trim();
      const name = String(siteSearchNameInput ? siteSearchNameInput.value : '').trim();
      const templateRaw = String(siteSearchTemplateInput ? siteSearchTemplateInput.value : '').trim();
      const aliases = normalizeAliases(siteSearchAliasInput ? siteSearchAliasInput.value : '');
      if (!key) {
        setSiteSearchError(getMessage('shortcuts_error_key', '请填写触发词。'));
        return;
      }
      if (/\s/.test(key)) {
        setSiteSearchError(getMessage('shortcuts_error_key_space', '触发词不能包含空格。'));
        return;
      }
      const template = normalizeSiteSearchTemplate(templateRaw);
      if (!template || !template.includes('{query}')) {
        setSiteSearchError(getMessage('toast_error_template', '搜索模板必须包含 {query}。'));
        return;
      }
      const normalizedKey = key.toLowerCase();
      let next = customSiteSearchProviders.filter((item) => String(item.key || '').toLowerCase() !== normalizedKey);
      if (editingSiteSearchKey && editingSiteSearchKey.toLowerCase() !== normalizedKey) {
        next = next.filter((item) => String(item.key || '').toLowerCase() !== editingSiteSearchKey.toLowerCase());
      }
      next.unshift({
        key: key,
        name: name || key,
        template: template,
        aliases: aliases
      });
      const lowerKey = normalizedKey;
      disabledSiteSearchKeys.delete(lowerKey);
      Promise.all([
        saveCustomSiteSearchProviders(next),
        saveDisabledSiteSearchKeys(disabledSiteSearchKeys)
      ]).then(() => {
        customSiteSearchProviders = next;
        renderSiteSearchList();
        refreshSiteSearchProviders();
        resetSiteSearchForm();
        setTimeout(() => {
          showToast(getMessage('toast_saved', '已保存'), false);
        }, 220);
      });
    });
  }

  if (builtinResetButton) {
    attachPopconfirm(
      builtinResetButton,
      'confirm_reset_builtin',
      '确认重置内置列表？',
      () => {
        Promise.all([loadDefaultSiteSearchProviders(), loadCustomSiteSearchProviders()]).then(([defaults, custom]) => {
          const defaultKeys = new Set((defaults || []).map((item) => String(item.key || '').toLowerCase()));
          const filteredCustom = (custom || []).filter((item) => {
            const key = String(item && item.key ? item.key : '').toLowerCase();
            return key && !defaultKeys.has(key);
          });
          Promise.all([
            saveCustomSiteSearchProviders(filteredCustom),
            saveDisabledSiteSearchKeys(new Set())
          ]).then(() => {
            customSiteSearchProviders = filteredCustom;
            disabledSiteSearchKeys = new Set();
            renderSiteSearchList();
          }).catch(() => {
            showToast(getMessage('toast_error', '操作失败，请重试'), true);
          });
        }).catch(() => {
          showToast(getMessage('toast_error', '操作失败，请重试'), true);
        });
      }
    );
  }

  if (customClearButton) {
    attachPopconfirm(
      customClearButton,
      'confirm_clear_custom',
      '确认清空自定义搜索？',
      () => {
        saveCustomSiteSearchProviders([]).then(() => {
          customSiteSearchProviders = [];
          renderSiteSearchList();
          showToast(getMessage('toast_cleared', '已清空'), false);
        }).catch(() => {
          showToast(getMessage('toast_error', '操作失败，请重试'), true);
        });
      }
    );
  }

  if (blacklistClearButton) {
    attachPopconfirm(
      blacklistClearButton,
      'confirm_clear_blacklist',
      '确认清空黑名单？',
      () => {
        saveSearchBlacklistItems([]).then((savedItems) => {
          searchBlacklistItems = savedItems;
          renderSearchBlacklistList();
          resetBlacklistForm();
          notifyNewtabSectionsRefresh('recent');
          showToast(getMessage('toast_cleared', '已清空'), false);
        }).catch(() => {
          showToast(getMessage('toast_error', '操作失败，请重试'), true);
        });
      }
    );
  }

  /*
  if (confirmOk) {
    confirmOk.addEventListener('click', () => closeConfirm(true));
  }
  if (confirmCancel) {
    confirmCancel.addEventListener('click', () => closeConfirm(false));
  }
  if (confirmMask) {
    confirmMask.addEventListener('click', (event) => {
      if (event.target === confirmMask) {
        closeConfirm(false));
      }
    });
  }
  */

  chrome.storage.onChanged.addListener((changes, areaName) => {
    const isPrimaryArea = Boolean(storageAreaName) && areaName === storageAreaName;
    if (!isPrimaryArea) {
      return;
    }
    if (changes[SYNC_META_KEY] ||
        changes[THEME_STORAGE_KEY] ||
        changes[LANGUAGE_STORAGE_KEY] ||
        changes[RECENT_MODE_STORAGE_KEY] ||
        changes[RECENT_COUNT_STORAGE_KEY] ||
        changes[NEWTAB_WIDTH_MODE_STORAGE_KEY] ||
        changes[OVERLAY_SIZE_MODE_STORAGE_KEY] ||
        changes[BOOKMARK_COUNT_STORAGE_KEY] ||
        changes[BOOKMARK_COLUMNS_STORAGE_KEY] ||
        changes[AUTO_PIP_ENABLED_STORAGE_KEY] ||
        changes[PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY] ||
        changes[OVERLAY_TAB_PRIORITY_STORAGE_KEY] ||
        changes[NEWTAB_WORDMARK_VISIBLE_STORAGE_KEY] ||
        changes[RESTRICTED_ACTION_STORAGE_KEY] ||
        changes[SEARCH_RESULT_PRIORITY_STORAGE_KEY] ||
        changes[FALLBACK_SHORTCUT_STORAGE_KEY] ||
        changes[SITE_SEARCH_STORAGE_KEY] ||
        changes[SITE_SEARCH_DISABLED_STORAGE_KEY] ||
        changes[SEARCH_BLACKLIST_STORAGE_KEY] ||
        changes[DEFAULT_SEARCH_ENGINE_STORAGE_KEY]) {
      refreshSyncStatus();
    }
    if (changes[THEME_STORAGE_KEY]) {
      const nextMode = changes[THEME_STORAGE_KEY].newValue || 'system';
      updateThemeButtons(nextMode);
      applyResolvedTheme(resolveTheme(nextMode));
    }
    if (changes[LANGUAGE_STORAGE_KEY]) {
      applyLanguageMode(changes[LANGUAGE_STORAGE_KEY].newValue || 'system');
    }
    if (changes[RECENT_COUNT_STORAGE_KEY] && recentCountSelect) {
      const count = normalizeRecentCount(changes[RECENT_COUNT_STORAGE_KEY].newValue);
      recentCountSelect.value = String(count);
      updateRecentModeTabsVisibility(count);
      refreshCustomSelects();
    }
    if (changes[NEWTAB_WIDTH_MODE_STORAGE_KEY] && newtabWidthSelect) {
      const mode = normalizeNewtabWidthMode(changes[NEWTAB_WIDTH_MODE_STORAGE_KEY].newValue);
      newtabWidthSelect.value = mode;
      setNewtabWidthTabState(mode);
      refreshCustomSelects();
    }
    if (changes[OVERLAY_SIZE_MODE_STORAGE_KEY]) {
      const mode = normalizeOverlaySizeMode(changes[OVERLAY_SIZE_MODE_STORAGE_KEY].newValue);
      setOverlaySizeTabState(mode);
      refreshCustomSelects();
    }
    if (changes[SEARCH_RESULT_PRIORITY_STORAGE_KEY]) {
      const nextValue = normalizeSearchResultPriority(changes[SEARCH_RESULT_PRIORITY_STORAGE_KEY].newValue);
      if (searchResultPrioritySelect) {
        searchResultPrioritySelect.value = nextValue;
      }
      setSearchResultPriorityTabState(nextValue);
      refreshCustomSelects();
    }
    if (changes[RECENT_MODE_STORAGE_KEY] && recentModeSelect) {
      const nextValue = changes[RECENT_MODE_STORAGE_KEY].newValue;
      const mode = nextValue === 'most' ? 'most' : 'latest';
      recentModeSelect.value = mode;
      setRecentModeTabState(mode);
      refreshCustomSelects();
    }
    if (changes[BOOKMARK_COUNT_STORAGE_KEY] && bookmarkCountSelect) {
      const stored = normalizeBookmarkCount(changes[BOOKMARK_COUNT_STORAGE_KEY].newValue);
      bookmarkCountSelect.value = String(stored);
      updateBookmarkColumnsSelectVisibility(stored);
      refreshCustomSelects();
    }
    if (changes[BOOKMARK_COLUMNS_STORAGE_KEY] && bookmarkColumnsSelect) {
      const stored = normalizeBookmarkColumns(changes[BOOKMARK_COLUMNS_STORAGE_KEY].newValue);
      bookmarkColumnsSelect.value = String(stored);
      refreshCustomSelects();
    }
    if (changes[OVERLAY_TAB_PRIORITY_STORAGE_KEY] && overlayTabQuickSwitchToggle) {
      const next = normalizeOverlayTabQuickSwitch(changes[OVERLAY_TAB_PRIORITY_STORAGE_KEY].newValue);
      overlayTabQuickSwitchToggle.checked = next;
      if (changes[OVERLAY_TAB_PRIORITY_STORAGE_KEY].newValue !== next && storageArea) {
        storageArea.set({ [OVERLAY_TAB_PRIORITY_STORAGE_KEY]: next });
      }
      refreshCustomSelects();
    }
    if (changes[NEWTAB_WORDMARK_VISIBLE_STORAGE_KEY] && newtabWordmarkToggle) {
      const raw = changes[NEWTAB_WORDMARK_VISIBLE_STORAGE_KEY].newValue;
      const next = normalizeNewtabWordmarkVisible(raw);
      newtabWordmarkToggle.checked = next;
      if (raw !== next && storageArea) {
        storageArea.set({ [NEWTAB_WORDMARK_VISIBLE_STORAGE_KEY]: next });
      }
      refreshCustomSelects();
    }
    if (changes[AUTO_PIP_ENABLED_STORAGE_KEY] && autoPipToggle) {
      const raw = changes[AUTO_PIP_ENABLED_STORAGE_KEY].newValue;
      const next = normalizeAutoPipEnabled(raw);
      autoPipToggle.checked = next;
      if (raw !== next && storageArea) {
        storageArea.set({ [AUTO_PIP_ENABLED_STORAGE_KEY]: next });
      }
      refreshCustomSelects();
    }
    if (changes[DOCUMENT_PIP_ENABLED_STORAGE_KEY] && documentPipToggle) {
      const raw = changes[DOCUMENT_PIP_ENABLED_STORAGE_KEY].newValue;
      const next = normalizeDocumentPipEnabled(raw);
      documentPipToggle.checked = next;
      if (raw !== next && storageArea) {
        storageArea.set({ [DOCUMENT_PIP_ENABLED_STORAGE_KEY]: next });
      }
      refreshCustomSelects();
    }
    if (changes[PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY] && pinnedTabRecoveryToggle) {
      const raw = changes[PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY].newValue;
      const next = normalizePinnedTabRecoveryEnabled(raw);
      pinnedTabRecoveryToggle.checked = next;
      if (raw !== next && storageArea) {
        storageArea.set({ [PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY]: next });
      }
      refreshCustomSelects();
    }
    if (changes[RESTRICTED_ACTION_STORAGE_KEY] && restrictedActionSelect) {
      const raw = changes[RESTRICTED_ACTION_STORAGE_KEY].newValue;
      const nextValue = raw === 'none' ? 'none' : 'default';
      restrictedActionSelect.value = nextValue;
      setRestrictedActionTabState(nextValue);
      if (raw !== nextValue && storageArea) {
        storageArea.set({ [RESTRICTED_ACTION_STORAGE_KEY]: nextValue });
      }
      refreshCustomSelects();
    }
    if (changes[FALLBACK_SHORTCUT_STORAGE_KEY]) {
      loadCurrentShortcut();
    }
    if (changes[SEARCH_BLACKLIST_STORAGE_KEY]) {
      searchBlacklistItems = normalizeSearchBlacklistItems(changes[SEARCH_BLACKLIST_STORAGE_KEY].newValue);
      renderSearchBlacklistList();
    }
    if (!changes[SITE_SEARCH_STORAGE_KEY] && !changes[SITE_SEARCH_DISABLED_STORAGE_KEY]) {
      return;
    }
    const now = Date.now();
    if (siteSearchRefreshSuppressUntil && now < siteSearchRefreshSuppressUntil) {
      if (siteSearchRefreshTimer) {
        clearTimeout(siteSearchRefreshTimer);
      }
      const delay = Math.max(siteSearchRefreshSuppressUntil - now, 0) + 40;
      siteSearchRefreshTimer = setTimeout(() => {
        siteSearchRefreshTimer = null;
        refreshSiteSearchProviders();
      }, delay);
      return;
    }
    refreshSiteSearchProviders();
  });
})();
