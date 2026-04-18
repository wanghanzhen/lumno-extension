
try {
  importScripts(chrome.runtime.getURL('src/shared/blacklist-utils.js'));
} catch (error) {
  console.warn('Lumno: failed to load blacklist utils.', error);
}

try {
  importScripts(chrome.runtime.getURL('src/shared/storage/migration.js'));
} catch (error) {
  console.warn('Lumno: failed to load storage migration utils.', error);
}

try {
  importScripts(chrome.runtime.getURL('src/shared/storage/keys.js'));
} catch (error) {
  console.warn('Lumno: failed to load storage keys.', error);
}

try {
  importScripts(chrome.runtime.getURL('src/shared/settings/overlay-tab-priority.js'));
} catch (error) {
  console.warn('Lumno: failed to load settings utils.', error);
}

try {
  importScripts(chrome.runtime.getURL('src/shared/search/protocol.js'));
} catch (error) {
  console.warn('Lumno: failed to load search protocol.', error);
}

try {
  importScripts(chrome.runtime.getURL('src/shared/search/query-context.js'));
} catch (error) {
  console.warn('Lumno: failed to load search query context helpers.', error);
}

try {
  importScripts(chrome.runtime.getURL('src/shared/search/suggestions.js'));
} catch (error) {
  console.warn('Lumno: failed to load search suggestion utils.', error);
}

try {
  importScripts(chrome.runtime.getURL('src/shared/search/engines.js'));
} catch (error) {
  console.warn('Lumno: failed to load search engines.', error);
}

try {
  importScripts(chrome.runtime.getURL('src/shared/search/favicons.js'));
} catch (error) {
  console.warn('Lumno: failed to load favicon helpers.', error);
}

try {
  importScripts(chrome.runtime.getURL('src/shared/search/site-search-providers.js'));
} catch (error) {
  console.warn('Lumno: failed to load site search providers helpers.', error);
}

try {
  importScripts(chrome.runtime.getURL('public/assets/vendor/pinyin-pro.js'));
} catch (error) {
  console.warn('Lumno: failed to load pinyin support.', error);
}

function isBrowserExtensionProtocol(protocol) {
  const normalized = String(protocol || '').toLowerCase();
  return normalized === 'chrome-extension:' ||
    normalized === 'moz-extension:' ||
    normalized === 'ms-browser-extension:';
}

const STORAGE_KEYS = globalThis.LumnoStorageKeys || {};
const GLOBAL_PIP_OWNER_STORAGE_KEY = STORAGE_KEYS.GLOBAL_PIP_OWNER_STORAGE_KEY || '_x_lumno_global_pip_owner_2026_';
let globalPipOwnerCache = null;
let globalPipOwnerCacheLoaded = false;

function getSessionStorageArea() {
  if (!chrome || !chrome.storage) {
    return null;
  }
  return chrome.storage.session || chrome.storage.local || null;
}

function normalizePipOwnerRecord(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const kind = value.kind === 'document' ? 'document' : (value.kind === 'video' ? 'video' : '');
  const tabId = Number(value.tabId);
  if (!kind || !Number.isInteger(tabId) || tabId < 0) {
    return null;
  }
  const frameId = Number.isInteger(Number(value.frameId)) ? Number(value.frameId) : 0;
  const token = typeof value.token === 'string' && value.token
    ? value.token
    : '';
  if (!token) {
    return null;
  }
  return {
    kind: kind,
    tabId: tabId,
    frameId: frameId,
    token: token,
    url: typeof value.url === 'string' ? value.url : '',
    updatedAt: Number.isFinite(Number(value.updatedAt)) ? Number(value.updatedAt) : Date.now()
  };
}

function getGlobalPipOwnerRecord() {
  if (globalPipOwnerCacheLoaded) {
    return Promise.resolve(globalPipOwnerCache);
  }
  const storageArea = getSessionStorageArea();
  if (!storageArea || typeof storageArea.get !== 'function') {
    globalPipOwnerCacheLoaded = true;
    globalPipOwnerCache = null;
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    storageArea.get([GLOBAL_PIP_OWNER_STORAGE_KEY], (result) => {
      const normalized = normalizePipOwnerRecord(
        result ? result[GLOBAL_PIP_OWNER_STORAGE_KEY] : null
      );
      globalPipOwnerCacheLoaded = true;
      globalPipOwnerCache = normalized;
      resolve(normalized);
    });
  });
}

function setGlobalPipOwnerRecord(record) {
  const normalized = normalizePipOwnerRecord(record);
  globalPipOwnerCacheLoaded = true;
  globalPipOwnerCache = normalized;
  const storageArea = getSessionStorageArea();
  if (!storageArea || typeof storageArea.set !== 'function') {
    return Promise.resolve(normalized);
  }
  return new Promise((resolve) => {
    storageArea.set({ [GLOBAL_PIP_OWNER_STORAGE_KEY]: normalized }, () => {
      resolve(normalized);
    });
  });
}

function clearGlobalPipOwnerRecord(expectedToken) {
  const shouldClear = !expectedToken ||
    !globalPipOwnerCache ||
    globalPipOwnerCache.token === expectedToken;
  if (!shouldClear) {
    return Promise.resolve(false);
  }
  globalPipOwnerCacheLoaded = true;
  globalPipOwnerCache = null;
  const storageArea = getSessionStorageArea();
  if (!storageArea || typeof storageArea.remove !== 'function') {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    storageArea.remove(GLOBAL_PIP_OWNER_STORAGE_KEY, () => {
      resolve(true);
    });
  });
}

function createGlobalPipOwnerToken() {
  if (typeof crypto !== 'undefined' && crypto && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `pip-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getPipSenderContext(sender) {
  const senderTab = sender && sender.tab ? sender.tab : null;
  const tabId = senderTab && typeof senderTab.id === 'number' ? senderTab.id : null;
  if (typeof tabId !== 'number') {
    return null;
  }
  return {
    tabId: tabId,
    frameId: sender && typeof sender.frameId === 'number' ? sender.frameId : 0,
    url: getResolvedTabUrl(senderTab)
  };
}

function isSameGlobalPipOwner(owner, context, kind) {
  if (!owner || !context) {
    return false;
  }
  return owner.kind === kind &&
    owner.tabId === context.tabId &&
    owner.frameId === context.frameId;
}

function sendMessageToTab(tabId, message) {
  return new Promise((resolve) => {
    if (!chrome || !chrome.tabs || typeof chrome.tabs.sendMessage !== 'function') {
      resolve({ ok: false, reason: 'tabs-sendMessage-unavailable' });
      return;
    }
    try {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime && chrome.runtime.lastError) {
          resolve({
            ok: false,
            reason: chrome.runtime.lastError.message || 'sendMessage-failed'
          });
          return;
        }
        resolve(response && typeof response === 'object'
          ? response
          : { ok: false, reason: 'empty-response' });
      });
    } catch (error) {
      resolve({ ok: false, reason: String(error) });
    }
  });
}

async function forceSurrenderGlobalPipOwner(owner, requestedKind) {
  if (!owner) {
    return { ok: true, cleared: false };
  }
  const result = await sendMessageToTab(owner.tabId, {
    action: 'lumno:pip-force-surrender',
    reason: requestedKind === 'document' ? 'document-owner-takeover' : 'video-owner-takeover',
    ownerKind: owner.kind
  });
  if (result && result.ok) {
    await clearGlobalPipOwnerRecord(owner.token);
    return { ok: true, cleared: true };
  }
  const errorReason = String(result && result.reason ? result.reason : '');
  const isStaleOwner = errorReason.includes('Receiving end does not exist') ||
    errorReason.includes('No tab with id') ||
    errorReason.includes('message port closed');
  if (isStaleOwner) {
    await clearGlobalPipOwnerRecord(owner.token);
    return { ok: true, cleared: true };
  }
  return {
    ok: false,
    reason: result && result.reason ? result.reason : 'surrender-failed'
  };
}

async function requestGlobalPipOwnership(sender, kind) {
  const context = getPipSenderContext(sender);
  if (!context) {
    return { ok: false, granted: false, reason: 'no-tab' };
  }
  if (kind !== 'video' && kind !== 'document') {
    return { ok: false, granted: false, reason: 'invalid-kind' };
  }

  const currentOwner = await getGlobalPipOwnerRecord();
  if (currentOwner && isSameGlobalPipOwner(currentOwner, context, kind)) {
    return {
      ok: true,
      granted: true,
      token: currentOwner.token,
      owner: currentOwner
    };
  }

  if (currentOwner) {
    if (currentOwner.kind === 'document' && kind === 'video') {
      return {
        ok: false,
        granted: false,
        reason: 'document-owner-active',
        owner: currentOwner
      };
    }
    const surrenderResult = await forceSurrenderGlobalPipOwner(currentOwner, kind);
    if (!surrenderResult.ok) {
      return {
        ok: false,
        granted: false,
        reason: surrenderResult.reason || 'owner-busy',
        owner: currentOwner
      };
    }
  }

  const nextOwner = {
    kind: kind,
    tabId: context.tabId,
    frameId: context.frameId,
    token: createGlobalPipOwnerToken(),
    url: context.url,
    updatedAt: Date.now()
  };
  await setGlobalPipOwnerRecord(nextOwner);
  return {
    ok: true,
    granted: true,
    token: nextOwner.token,
    owner: nextOwner
  };
}

async function releaseGlobalPipOwnership(sender, token) {
  const context = getPipSenderContext(sender);
  if (!context) {
    return { ok: false, released: false, reason: 'no-tab' };
  }
  const currentOwner = await getGlobalPipOwnerRecord();
  if (!currentOwner) {
    return { ok: true, released: true, reason: 'no-owner' };
  }
  const matchesToken = typeof token === 'string' && token && currentOwner.token === token;
  const matchesSender = currentOwner.tabId === context.tabId &&
    currentOwner.frameId === context.frameId;
  if (!matchesToken && !matchesSender) {
    return { ok: true, released: false, reason: 'owner-mismatch' };
  }
  await clearGlobalPipOwnerRecord(currentOwner.token);
  return { ok: true, released: true };
}

function clearGlobalPipOwnerForTabId(tabId) {
  if (typeof tabId !== 'number') {
    return;
  }
  getGlobalPipOwnerRecord().then((owner) => {
    if (!owner || owner.tabId !== tabId) {
      return;
    }
    clearGlobalPipOwnerRecord(owner.token).catch(() => {});
  }).catch(() => {});
}

function isRestrictedUrl(url) {
  if (!url) {
    return true;
  }
  const lower = String(url).toLowerCase();
  if (lower.startsWith('chrome://') ||
    lower.startsWith('edge://') ||
    lower.startsWith('brave://') ||
    lower.startsWith('vivaldi://') ||
    lower.startsWith('opera://') ||
    lower.startsWith('about:')) {
    return true;
  }
  try {
    const parsed = new URL(url);
    const protocol = String(parsed.protocol || '').toLowerCase();
    if (isBrowserExtensionProtocol(protocol)) {
      return true;
    }
    if (protocol !== 'http:' && protocol !== 'https:') {
      return true;
    }
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();
    if ((host === 'chrome.google.com' && path.startsWith('/webstore')) ||
        host === 'chromewebstore.google.com' ||
        (host === 'microsoftedge.microsoft.com' && path.startsWith('/addons')) ||
        host === 'addons.opera.com') {
      return true;
    }
  } catch (e) {
    return true;
  }
  return false;
}

function canOpenOverlayOnUrl(url) {
  if (!url) {
    return false;
  }
  const lower = String(url).toLowerCase();
  if (lower.startsWith('chrome://') ||
    lower.startsWith('edge://') ||
    lower.startsWith('brave://') ||
    lower.startsWith('vivaldi://') ||
    lower.startsWith('opera://') ||
    lower.startsWith('about:')) {
    return false;
  }
  try {
    const parsed = new URL(url);
    const protocol = String(parsed.protocol || '').toLowerCase();
    if (isBrowserExtensionProtocol(protocol)) {
      return false;
    }
    if (protocol === 'file:') {
      return true;
    }
    if (protocol !== 'http:' && protocol !== 'https:') {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();
    if ((host === 'chrome.google.com' && path.startsWith('/webstore')) ||
        host === 'chromewebstore.google.com' ||
        (host === 'microsoftedge.microsoft.com' && path.startsWith('/addons')) ||
        host === 'addons.opera.com') {
      return false;
    }
  } catch (e) {
    return false;
  }
  return true;
}

function isLocalFileLikeTargetUrl(url) {
  if (!url) {
    return false;
  }
  try {
    const parsed = new URL(url);
    const protocol = String(parsed.protocol || '').toLowerCase();
    if (protocol === 'file:') {
      return true;
    }
    const pathname = String(parsed.pathname || '').toLowerCase();
    if (pathname.endsWith('.pdf') || pathname.endsWith('.htm') || pathname.endsWith('.html')) {
      return true;
    }
    const srcParam = parsed.searchParams ? parsed.searchParams.get('src') : '';
    if (srcParam) {
      try {
        const nested = new URL(srcParam);
        const nestedProtocol = String(nested.protocol || '').toLowerCase();
        const nestedPath = String(nested.pathname || '').toLowerCase();
        if (nestedProtocol === 'file:' ||
          nestedPath.endsWith('.pdf') ||
          nestedPath.endsWith('.htm') ||
          nestedPath.endsWith('.html')) {
          return true;
        }
      } catch (e) {
        const lowerSrc = String(srcParam).toLowerCase();
        if (lowerSrc.startsWith('file://') ||
          lowerSrc.includes('.pdf') ||
          lowerSrc.includes('.htm') ||
          lowerSrc.includes('.html')) {
          return true;
        }
      }
    }
  } catch (e) {
    const lower = String(url).toLowerCase();
    return lower.startsWith('file://') ||
      lower.includes('.pdf') ||
      lower.includes('.htm') ||
      lower.includes('.html');
  }
  return false;
}

function checkFileSchemeAccess(callback) {
  const done = typeof callback === 'function' ? callback : () => {};
  if (!chrome || !chrome.extension || typeof chrome.extension.isAllowedFileSchemeAccess !== 'function') {
    done(null);
    return;
  }
  try {
    chrome.extension.isAllowedFileSchemeAccess((isAllowed) => {
      if (chrome.runtime && chrome.runtime.lastError) {
        done(null);
        return;
      }
      done(Boolean(isAllowed));
    });
  } catch (e) {
    done(null);
  }
}

function getExtensionDetailsUrl() {
  if (!chrome || !chrome.runtime || !chrome.runtime.id) {
    return 'chrome://extensions/';
  }
  return `chrome://extensions/?id=${encodeURIComponent(chrome.runtime.id)}`;
}

function buildNewtabFallbackUrl(options) {
  const newtabUrl = new URL(chrome.runtime.getURL('src/newtab/newtab.html'));
  newtabUrl.searchParams.set('focus', '1');
  if (options && options.notice === 'file-access') {
    newtabUrl.searchParams.set('notice', 'file-access');
  }
  return newtabUrl.toString();
}

function openNewtabFallback(options) {
  const newtabUrl = buildNewtabFallbackUrl(options);
  chrome.tabs.create({ url: newtabUrl });
}

function openNewtabFallbackForUrl(url) {
  if (!isLocalFileLikeTargetUrl(url)) {
    openNewtabFallback();
    return;
  }
  checkFileSchemeAccess((isAllowed) => {
    if (isAllowed === false) {
      openNewtabFallback({ notice: 'file-access' });
      return;
    }
    openNewtabFallback();
  });
}

function getResolvedTabUrl(tab) {
  if (!tab || typeof tab !== 'object') {
    return '';
  }
  const directUrl = typeof tab.url === 'string' ? String(tab.url).trim() : '';
  if (directUrl) {
    return directUrl;
  }
  const pendingUrl = typeof tab.pendingUrl === 'string' ? String(tab.pendingUrl).trim() : '';
  return pendingUrl;
}

function isLumnoNewtabUrl(url) {
  const value = String(url || '');
  if (!value || !chrome || !chrome.runtime || typeof chrome.runtime.getURL !== 'function') {
    return false;
  }
  const lumnoNewtabPrefix = chrome.runtime.getURL('src/newtab/newtab.html');
  return value === lumnoNewtabPrefix || value.startsWith(`${lumnoNewtabPrefix}?`);
}

function isBrowserNewtabUrl(url) {
  const lower = String(url || '').toLowerCase();
  return lower === 'chrome://newtab/' ||
    lower === 'chrome://new-tab-page/' ||
    lower === 'edge://newtab/' ||
    lower === 'brave://newtab/' ||
    lower === 'opera://startpage/';
}

function isOwnExtensionUrl(url) {
  if (!url || !chrome || !chrome.runtime || !chrome.runtime.id) {
    return false;
  }
  try {
    const parsed = new URL(url);
    const protocol = String(parsed.protocol || '').toLowerCase();
    return isBrowserExtensionProtocol(protocol) &&
      String(parsed.hostname || '') === String(chrome.runtime.id);
  } catch (e) {
    return false;
  }
}

function getOwnExtensionFaviconUrl() {
  if (!chrome || !chrome.runtime || typeof chrome.runtime.getURL !== 'function') {
    return '';
  }
  return chrome.runtime.getURL('public/assets/images/lumno.png');
}

function shouldRecoverFromCommandNewtab(activeTab, source) {
  if (source !== 'commands' || !activeTab) {
    return false;
  }
  const activeUrl = getResolvedTabUrl(activeTab);
  return isLumnoNewtabUrl(activeUrl) || isBrowserNewtabUrl(activeUrl);
}

function pickRecoveryTargetTab(activeTab, tabs) {
  const tabList = Array.isArray(tabs) ? tabs : [];
  if (!activeTab || typeof activeTab.id !== 'number') {
    return null;
  }
  const openerTabId = typeof activeTab.openerTabId === 'number' ? activeTab.openerTabId : null;
  if (typeof openerTabId === 'number') {
    const openerTab = tabList.find((item) =>
      item &&
      item.id === openerTabId &&
      canOpenOverlayOnUrl(item.url || '')
    );
    if (openerTab) {
      return openerTab;
    }
  }
  const candidates = tabList
    .filter((item) =>
      item &&
      typeof item.id === 'number' &&
      item.id !== activeTab.id &&
      canOpenOverlayOnUrl(item.url || '')
    )
    .sort((a, b) => Number(b.lastAccessed || 0) - Number(a.lastAccessed || 0));
  return candidates[0] || null;
}

function recoverOverlayTargetFromCommandNewtab(activeTab, tabs, source) {
  if (!shouldRecoverFromCommandNewtab(activeTab, source)) {
    return false;
  }
  const targetTab = pickRecoveryTargetTab(activeTab, tabs);
  if (!targetTab || typeof targetTab.id !== 'number') {
    logHotkeyDebug('command-newtab-recover-missed', {
      reason: 'no-target',
      tabId: activeTab && typeof activeTab.id === 'number' ? activeTab.id : null,
      source: source || ''
    });
    return false;
  }
  logHotkeyDebug('command-newtab-recover-start', {
    source: source || '',
    fromTabId: activeTab.id,
    toTabId: targetTab.id,
    fromUrl: activeTab.url || '',
    toUrl: targetTab.url || ''
  });
  chrome.tabs.update(targetTab.id, { active: true }, () => {
    if (chrome.runtime && chrome.runtime.lastError) {
      logHotkeyDebug('command-newtab-recover-failed', {
        source: source || '',
        targetTabId: targetTab.id,
        error: chrome.runtime.lastError.message || 'unknown'
      });
      return;
    }
    if (typeof activeTab.id === 'number') {
      chrome.tabs.remove(activeTab.id, () => {
        if (chrome.runtime && chrome.runtime.lastError) {
          logHotkeyDebug('command-newtab-close-failed', {
            source: source || '',
            tabId: activeTab.id,
            error: chrome.runtime.lastError.message || 'unknown'
          });
        }
      });
    }
    openOverlayOnTab(targetTab, tabs, 'commands-recover');
  });
  return true;
}

function isSearchCommandSource(source) {
  return source === 'commands' || source === 'commands-prefill';
}

function requestFocusVisibleNewtabInput(source, tabId) {
  const payload = {
    action: 'lumno:newtab-focus-input',
    source: source || '',
    tabId: typeof tabId === 'number' ? tabId : null
  };
  try {
    chrome.runtime.sendMessage(payload, (response) => {
      if (chrome.runtime && chrome.runtime.lastError) {
        logHotkeyDebug('command-newtab-focus-send-failed', {
          source: source || '',
          tabId: typeof tabId === 'number' ? tabId : null,
          error: chrome.runtime.lastError.message || 'unknown'
        });
        return;
      }
      logHotkeyDebug('command-newtab-focus-send-done', {
        source: source || '',
        tabId: typeof tabId === 'number' ? tabId : null,
        ok: Boolean(response && response.ok)
      });
    });
  } catch (e) {
    logHotkeyDebug('command-newtab-focus-send-error', {
      source: source || '',
      tabId: typeof tabId === 'number' ? tabId : null,
      error: e && e.message ? e.message : String(e || '')
    });
  }
}

function openExtensionOptionsPage(callback) {
  const done = typeof callback === 'function' ? callback : () => {};
  const fallbackOpen = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/options/options.html') }, () => {
      done(!(chrome.runtime && chrome.runtime.lastError));
    });
  };

  if (!chrome.runtime || typeof chrome.runtime.openOptionsPage !== 'function') {
    fallbackOpen();
    return;
  }

  chrome.runtime.openOptionsPage(() => {
    if (chrome.runtime && chrome.runtime.lastError) {
      fallbackOpen();
      return;
    }
    done(true);
  });
}

const ONBOARDING_URL = 'https://lumno.kubai.design/onboarding/';
const RELEASE_URL = 'https://lumno.kubai.design/release/';

function openOnboardingPage(callback) {
  const done = typeof callback === 'function' ? callback : () => {};
  chrome.tabs.create({ url: ONBOARDING_URL }, () => {
    done(!(chrome.runtime && chrome.runtime.lastError));
  });
}

function getExtensionVersionTag() {
  const version = chrome && chrome.runtime && chrome.runtime.getManifest
    ? String((chrome.runtime.getManifest() || {}).version || '').trim()
    : '';
  if (!version) {
    return '';
  }
  return /^v/i.test(version) ? version : `v${version}`;
}

function buildReleaseUrl(options) {
  const params = new URLSearchParams();
  params.set('entry', 'ext');
  const reason = options && typeof options.reason === 'string' ? String(options.reason).trim().toLowerCase() : '';
  if (reason) {
    params.set('reason', reason);
  }
  const version = getExtensionVersionTag();
  if (version) {
    params.set('version', version);
  }
  return `${RELEASE_URL}?${params.toString()}`;
}

function openReleasePage(options, callback) {
  const done = typeof callback === 'function' ? callback : () => {};
  chrome.tabs.create({ url: buildReleaseUrl(options) }, () => {
    done(!(chrome.runtime && chrome.runtime.lastError));
  });
}

function getBookmarkManagerUrls() {
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent)
    ? String(navigator.userAgent).toLowerCase()
    : '';
  const candidates = [];
  const pushUnique = (url) => {
    const value = String(url || '').trim();
    if (!value || candidates.includes(value)) {
      return;
    }
    candidates.push(value);
  };

  if (ua.includes('firefox/')) {
    pushUnique('about:bookmarks');
    pushUnique('chrome://bookmarks/');
    return candidates;
  }
  if (ua.includes('edg/')) {
    pushUnique('edge://favorites/');
    pushUnique('edge://bookmarks/');
  } else if (ua.includes('vivaldi/')) {
    pushUnique('vivaldi://bookmarks/');
  } else if (ua.includes('opr/') || ua.includes('opera')) {
    pushUnique('opera://bookmarks/');
  } else if (ua.includes('brave/')) {
    pushUnique('brave://bookmarks/');
  }
  pushUnique('chrome://bookmarks/');
  return candidates;
}

function openBookmarkManagerPage() {
  const urls = getBookmarkManagerUrls();
  return new Promise((resolve, reject) => {
    const tryOpen = (index) => {
      if (index >= urls.length) {
        reject(new Error('no-bookmark-manager-url'));
        return;
      }
      const targetUrl = urls[index];
      chrome.tabs.create({ url: targetUrl }, () => {
        if (chrome.runtime && chrome.runtime.lastError) {
          tryOpen(index + 1);
          return;
        }
        resolve(targetUrl);
      });
    };
    tryOpen(0);
  });
}

function logHotkeyDebug(stage, payload) {
  try {
    const detail = payload && typeof payload === 'object' ? payload : {};
    console.log(`[Lumno][hotkey] ${stage}`, detail);
  } catch (e) {
    // Ignore logging errors.
  }
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
const STORAGE_MIGRATION_UTILS = globalThis.LumnoStorageMigration || {};
const SEARCH_PROTOCOL = globalThis.LumnoSearchProtocol || {};
const SEARCH_QUERY_CONTEXT_UTILS = globalThis.LumnoSearchQueryContext || {};
const SEARCH_SUGGESTION_UTILS = globalThis.LumnoSearchSuggestions || {};
const SEARCH_ENGINE_UTILS = globalThis.LumnoSearchEngines || {};
const SEARCH_FAVICON_UTILS = globalThis.LumnoSearchFavicons || {};
const SITE_SEARCH_PROVIDER_UTILS = globalThis.LumnoSiteSearchProviders || {};
const SETTINGS_UTILS = globalThis.LumnoSettings || {};
const RESTRICTED_ACTION_STORAGE_KEY = STORAGE_KEYS.RESTRICTED_ACTION_STORAGE_KEY || '_x_extension_restricted_action_2024_unique_';
const OVERLAY_TAB_PRIORITY_STORAGE_KEY = STORAGE_KEYS.OVERLAY_TAB_PRIORITY_STORAGE_KEY || '_x_extension_overlay_tab_priority_2024_unique_';
const TAB_RANK_SCORE_DEBUG_STORAGE_KEY = STORAGE_KEYS.TAB_RANK_SCORE_DEBUG_STORAGE_KEY || '_x_extension_tab_rank_score_debug_2026_unique_';
const DOCUMENT_PIP_ENABLED_STORAGE_KEY = STORAGE_KEYS.DOCUMENT_PIP_ENABLED_STORAGE_KEY || '_x_extension_document_pip_enabled_2026_unique_';
const PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY = STORAGE_KEYS.PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY || '_x_extension_pinned_tab_recovery_enabled_2026_unique_';
const FALLBACK_SHORTCUT_STORAGE_KEY = STORAGE_KEYS.FALLBACK_SHORTCUT_STORAGE_KEY || '_x_extension_fallback_hotkey_2024_unique_';
const SEARCH_RESULT_PRIORITY_STORAGE_KEY = STORAGE_KEYS.SEARCH_RESULT_PRIORITY_STORAGE_KEY || '_x_extension_search_result_priority_2026_unique_';
const FAVICON_VISIT_DIRTY_STORAGE_KEY = STORAGE_KEYS.FAVICON_VISIT_DIRTY_STORAGE_KEY || '_x_extension_favicon_visit_dirty_2026_unique_';
const FAVICON_VISIT_DIRTY_TTL_MS = 1000 * 60 * 60 * 24;
const FAVICON_VISIT_DIRTY_MAX_ENTRIES = 600;
const PINNED_TAB_SNAPSHOT_STORAGE_KEY = STORAGE_KEYS.PINNED_TAB_SNAPSHOT_STORAGE_KEY || '_x_extension_pinned_tab_snapshot_2026_unique_';
const REMOVED_AI_SYNC_STORAGE_KEYS = STORAGE_KEYS.REMOVED_AI_SYNC_STORAGE_KEYS || [
  '_x_extension_ai_search_mode_2026_unique_',
  '_x_extension_ai_provider_2026_unique_',
  '_x_extension_ai_entitlement_cache_2026_unique_'
];
const REMOVED_AI_LOCAL_STORAGE_KEYS = STORAGE_KEYS.REMOVED_AI_LOCAL_STORAGE_KEYS || [
  '_x_extension_ai_api_key_2026_unique_'
];
const SHOW_SEARCH_COMMAND_NAME = 'show-search';
const SHOW_SEARCH_PREFILL_COMMAND_NAME = 'show-search-prefill';
const SHOW_SEARCH_PREFILL_V_COMMAND_NAME = 'show-search-prefill-v';
const OVERLAY_SCRIPT_FILES = Object.freeze([
  'src/shared/blacklist-utils.js',
  'src/shared/search/favicons.js',
  'src/shared/search/site-search-providers.js',
  'src/overlay/lifecycle.js',
  'src/overlay/shell.js',
  'src/overlay/input-ui.js'
]);
const HOTKEY_DUP_GUARD_MS = 180;
const PAGE_HOTKEY_NEWTAB_RECOVER_MS = 1200;
const TAB_SWITCH_WINDOW_SHORT_MS = 30 * 60 * 1000;
const TAB_SWITCH_WINDOW_DAY_MS = 24 * 60 * 60 * 1000;
const TAB_SWITCH_HIGH_FREQ_SHORT_THRESHOLD = 2;
const TAB_SWITCH_HIGH_FREQ_DAY_THRESHOLD = 5;
const TAB_SWITCH_EVENT_HISTORY_LIMIT = 60;
const TAB_SWITCH_STATS_STORAGE_KEY = STORAGE_KEYS.TAB_SWITCH_STATS_STORAGE_KEY || '_x_extension_tab_switch_stats_2026_unique_';
const PINNED_TAB_SNAPSHOT_DEBOUNCE_MS = 600;
const PINNED_TAB_RESTORE_MAX_TABS = 24;
let restrictedActionCache = 'default';
let documentPipEnabledCache = false;
let pinnedTabRecoveryEnabledCache = false;
const hotkeyInvokeAtByTabId = new Map();
let lastPageHotkeyContext = null;
const tabSwitchEventsByTabId = new Map();
const tabLastAccessedByTabId = new Map();
let tabSwitchEventDebugTotal = 0;
let tabOverlayFetchSeq = 0;
let tabSwitchStatsLoaded = false;
let tabSwitchStatsLoadPromise = null;
let pinnedTabSnapshotTimer = null;
let pinnedTabRestoreAttempted = false;
const faviconVisitDirtyWriteDebounceMs = 400;
const faviconVisitDirtyMarkThrottleMs = 2 * 60 * 1000;
const faviconVisitDirtyMarkCache = new Map();
let faviconVisitDirtyPersistTimer = null;

function normalizeFaviconVisitDirtyHost(hostname) {
  if (!hostname) {
    return '';
  }
  return normalizeHost(String(hostname).trim());
}

function getFaviconVisitDirtyStorageArea() {
  if (!chrome || !chrome.storage || !chrome.storage.local) {
    return null;
  }
  return chrome.storage.local;
}

function getValidFaviconVisitDirtyEntries(rawEntries) {
  const now = Date.now();
  const input = rawEntries && typeof rawEntries === 'object' ? rawEntries : {};
  const valid = [];
  Object.keys(input).forEach((key) => {
    const updatedAt = Number(input[key] || 0);
    if (!key || !Number.isFinite(updatedAt)) {
      return;
    }
    if (now - updatedAt > FAVICON_VISIT_DIRTY_TTL_MS) {
      return;
    }
    valid.push({ key, updatedAt });
  });
  valid.sort((a, b) => b.updatedAt - a.updatedAt);
  return valid.slice(0, FAVICON_VISIT_DIRTY_MAX_ENTRIES);
}

function schedulePersistFaviconVisitDirtyHost(hostname) {
  const host = normalizeFaviconVisitDirtyHost(hostname);
  const storageArea = getFaviconVisitDirtyStorageArea();
  if (!host || !storageArea) {
    return;
  }
  const now = Date.now();
  const lastMarkedAt = Number(faviconVisitDirtyMarkCache.get(host) || 0);
  if (lastMarkedAt && (now - lastMarkedAt) < faviconVisitDirtyMarkThrottleMs) {
    return;
  }
  faviconVisitDirtyMarkCache.set(host, now);
  if (faviconVisitDirtyPersistTimer !== null) {
    clearTimeout(faviconVisitDirtyPersistTimer);
  }
  faviconVisitDirtyPersistTimer = setTimeout(() => {
    faviconVisitDirtyPersistTimer = null;
    storageArea.get([FAVICON_VISIT_DIRTY_STORAGE_KEY], (result) => {
      const payload = result && result[FAVICON_VISIT_DIRTY_STORAGE_KEY];
      const existing = getValidFaviconVisitDirtyEntries(payload && payload.entries ? payload.entries : null);
      const merged = new Map(existing.map((item) => [item.key, item.updatedAt]));
      faviconVisitDirtyMarkCache.forEach((updatedAt, key) => {
        merged.set(key, updatedAt);
      });
      const serializedEntries = Array.from(merged.entries())
        .map(([key, updatedAt]) => ({
          key: String(key || ''),
          updatedAt: Number(updatedAt || 0)
        }))
        .filter((item) => item.key && Number.isFinite(item.updatedAt))
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, FAVICON_VISIT_DIRTY_MAX_ENTRIES);
      const serialized = {};
      serializedEntries.forEach((item) => {
        serialized[item.key] = item.updatedAt;
      });
      storageArea.set({
        [FAVICON_VISIT_DIRTY_STORAGE_KEY]: {
          version: 1,
          entries: serialized,
          updatedAt: Date.now()
        }
      }, () => {
        faviconVisitDirtyMarkCache.clear();
      });
    });
  }, faviconVisitDirtyWriteDebounceMs);
}

function markFaviconDirtyForUrl(url) {
  if (!url) {
    return;
  }
  let parsed = null;
  try {
    parsed = new URL(url);
  } catch (e) {
    return;
  }
  if (!/^https?:$/i.test(parsed.protocol)) {
    return;
  }
  const host = normalizeFaviconVisitDirtyHost(parsed.hostname);
  if (!host || shouldBlockFaviconForHost(host)) {
    return;
  }
  schedulePersistFaviconVisitDirtyHost(host);
}

function cleanupRemovedAiStorageKeys() {
  if (!chrome || !chrome.storage) {
    return;
  }
  const syncArea = chrome.storage.sync;
  const localArea = chrome.storage.local;
  if (syncArea && typeof syncArea.remove === 'function') {
    syncArea.remove(REMOVED_AI_SYNC_STORAGE_KEYS, () => {});
  }
  if (localArea && typeof localArea.remove === 'function') {
    localArea.remove(REMOVED_AI_LOCAL_STORAGE_KEYS, () => {});
  }
}

function getTabSwitchStorageArea() {
  if (!chrome || !chrome.storage) {
    return null;
  }
  if (chrome.storage.session) {
    return chrome.storage.session;
  }
  if (chrome.storage.local) {
    return chrome.storage.local;
  }
  return null;
}

function normalizeTabSwitchStatEntry(raw, now) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const minTs = now - TAB_SWITCH_WINDOW_DAY_MS;
  const rawEvents = Array.isArray(raw.events) ? raw.events : [];
  const events = rawEvents
    .map((item) => Number(item) || 0)
    .filter((item) => item >= minTs)
    .sort((a, b) => a - b)
    .slice(-TAB_SWITCH_EVENT_HISTORY_LIMIT);
  const lastSwitchAtRaw = Number(raw.lastSwitchAt) || 0;
  const lastSwitchAt = Math.max(lastSwitchAtRaw, events.length > 0 ? events[events.length - 1] : 0);
  if (events.length <= 0 && lastSwitchAt <= 0) {
    return null;
  }
  return {
    events: events,
    lastSwitchAt: lastSwitchAt
  };
}

function mergeTabSwitchStat(target, incoming, now) {
  const left = normalizeTabSwitchStatEntry(target, now) || { events: [], lastSwitchAt: 0 };
  const right = normalizeTabSwitchStatEntry(incoming, now) || { events: [], lastSwitchAt: 0 };
  const mergedEvents = left.events.concat(right.events)
    .filter((item) => typeof item === 'number' && item > 0)
    .sort((a, b) => a - b)
    .slice(-TAB_SWITCH_EVENT_HISTORY_LIMIT);
  const lastSwitchAt = Math.max(left.lastSwitchAt || 0, right.lastSwitchAt || 0, mergedEvents.length > 0 ? mergedEvents[mergedEvents.length - 1] : 0);
  if (mergedEvents.length <= 0 && lastSwitchAt <= 0) {
    return null;
  }
  return {
    events: mergedEvents,
    lastSwitchAt: lastSwitchAt
  };
}

function applyPersistedTabSwitchStats(payload) {
  const now = Date.now();
  if (!payload || typeof payload !== 'object') {
    return;
  }
  Object.keys(payload).forEach((tabIdKey) => {
    const tabId = Number.parseInt(tabIdKey, 10);
    if (!Number.isFinite(tabId)) {
      return;
    }
    const incoming = normalizeTabSwitchStatEntry(payload[tabIdKey], now);
    if (!incoming) {
      return;
    }
    const existing = tabSwitchEventsByTabId.get(tabId) || null;
    const merged = mergeTabSwitchStat(existing, incoming, now);
    if (merged) {
      tabSwitchEventsByTabId.set(tabId, merged);
    }
  });
}

function exportTabSwitchStatsSnapshot() {
  const now = Date.now();
  const out = {};
  tabSwitchEventsByTabId.forEach((stat, tabId) => {
    if (typeof tabId !== 'number') {
      return;
    }
    const normalized = normalizeTabSwitchStatEntry(stat, now);
    if (!normalized) {
      return;
    }
    out[String(tabId)] = normalized;
  });
  return out;
}

function persistTabSwitchStatsNow() {
  const area = getTabSwitchStorageArea();
  if (!area) {
    return Promise.resolve(false);
  }
  const snapshot = exportTabSwitchStatsSnapshot();
  return new Promise((resolve) => {
    area.set({ [TAB_SWITCH_STATS_STORAGE_KEY]: snapshot }, () => {
      resolve(!(chrome.runtime && chrome.runtime.lastError));
    });
  });
}

function ensureTabSwitchStatsLoaded() {
  if (tabSwitchStatsLoaded) {
    return Promise.resolve();
  }
  if (tabSwitchStatsLoadPromise) {
    return tabSwitchStatsLoadPromise;
  }
  const area = getTabSwitchStorageArea();
  if (!area) {
    tabSwitchStatsLoaded = true;
    return Promise.resolve();
  }
  tabSwitchStatsLoadPromise = new Promise((resolve) => {
    area.get([TAB_SWITCH_STATS_STORAGE_KEY], (result) => {
      const payload = result ? result[TAB_SWITCH_STATS_STORAGE_KEY] : null;
      applyPersistedTabSwitchStats(payload);
      tabSwitchStatsLoaded = true;
      tabSwitchStatsLoadPromise = null;
      resolve();
    });
  });
  return tabSwitchStatsLoadPromise;
}

function queryTabsForPinnedSnapshot(queryInfo) {
  return new Promise((resolve) => {
    if (!chrome || !chrome.tabs || typeof chrome.tabs.query !== 'function') {
      resolve([]);
      return;
    }
    chrome.tabs.query(queryInfo || {}, (tabs) => {
      if (chrome.runtime && chrome.runtime.lastError) {
        resolve([]);
        return;
      }
      resolve(Array.isArray(tabs) ? tabs : []);
    });
  });
}

function getPinnedSnapshotFromStorage() {
  return new Promise((resolve) => {
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      resolve(null);
      return;
    }
    chrome.storage.local.get([PINNED_TAB_SNAPSHOT_STORAGE_KEY], (result) => {
      if (chrome.runtime && chrome.runtime.lastError) {
        resolve(null);
        return;
      }
      resolve(result ? result[PINNED_TAB_SNAPSHOT_STORAGE_KEY] : null);
    });
  });
}

function setPinnedSnapshotToStorage(snapshot) {
  return new Promise((resolve) => {
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      resolve(false);
      return;
    }
    chrome.storage.local.set({ [PINNED_TAB_SNAPSHOT_STORAGE_KEY]: snapshot }, () => {
      if (chrome.runtime && chrome.runtime.lastError) {
        resolve(false);
        return;
      }
      resolve(true);
    });
  });
}

function createPinnedTabForRestore(url, windowId) {
  return new Promise((resolve) => {
    if (!chrome || !chrome.tabs || typeof chrome.tabs.create !== 'function') {
      resolve(false);
      return;
    }
    const createWithWindow = (typeof windowId === 'number')
      ? { windowId, url, pinned: true, active: false }
      : { url, pinned: true, active: false };
    chrome.tabs.create(createWithWindow, () => {
      if (!(chrome.runtime && chrome.runtime.lastError)) {
        resolve(true);
        return;
      }
      if (typeof windowId !== 'number') {
        resolve(false);
        return;
      }
      chrome.tabs.create({ url, pinned: true, active: false }, () => {
        resolve(!(chrome.runtime && chrome.runtime.lastError));
      });
    });
  });
}

function getLastFocusedWindowIdForRestore() {
  return new Promise((resolve) => {
    if (!chrome || !chrome.windows || typeof chrome.windows.getLastFocused !== 'function') {
      resolve(null);
      return;
    }
    chrome.windows.getLastFocused({}, (windowInfo) => {
      if (chrome.runtime && chrome.runtime.lastError) {
        resolve(null);
        return;
      }
      const canUse = windowInfo &&
        typeof windowInfo.id === 'number' &&
        windowInfo.incognito !== true &&
        (!windowInfo.type || windowInfo.type === 'normal');
      resolve(canUse ? windowInfo.id : null);
    });
  });
}

function normalizePinnedTabSnapshot(rawValue) {
  const urls = [];
  if (Array.isArray(rawValue)) {
    rawValue.forEach((item) => {
      const url = String(item || '').trim();
      if (url && !isRestrictedUrl(url)) {
        urls.push(url);
      }
    });
    return urls.slice(0, PINNED_TAB_RESTORE_MAX_TABS);
  }
  if (!rawValue || typeof rawValue !== 'object' || !Array.isArray(rawValue.urls)) {
    return [];
  }
  rawValue.urls.forEach((item) => {
    const url = String(item || '').trim();
    if (url && !isRestrictedUrl(url)) {
      urls.push(url);
    }
  });
  return urls.slice(0, PINNED_TAB_RESTORE_MAX_TABS);
}

function countUrls(urls) {
  const map = new Map();
  urls.forEach((url) => {
    const current = map.get(url) || 0;
    map.set(url, current + 1);
  });
  return map;
}

async function persistPinnedTabSnapshotNow() {
  if (!pinnedTabRecoveryEnabledCache) {
    return;
  }
  const tabs = await queryTabsForPinnedSnapshot({ pinned: true });
  const urls = tabs
    .filter((tab) => tab && tab.incognito !== true)
    .sort((a, b) => {
      const winA = typeof a.windowId === 'number' ? a.windowId : 0;
      const winB = typeof b.windowId === 'number' ? b.windowId : 0;
      if (winA !== winB) {
        return winA - winB;
      }
      const indexA = typeof a.index === 'number' ? a.index : 0;
      const indexB = typeof b.index === 'number' ? b.index : 0;
      return indexA - indexB;
    })
    .map((tab) => getResolvedTabUrl(tab))
    .filter((url) => Boolean(url) && !isRestrictedUrl(url))
    .slice(0, PINNED_TAB_RESTORE_MAX_TABS);
  await setPinnedSnapshotToStorage({
    urls,
    capturedAt: Date.now()
  });
}

function schedulePersistPinnedTabSnapshot() {
  if (!pinnedTabRecoveryEnabledCache) {
    if (pinnedTabSnapshotTimer !== null) {
      clearTimeout(pinnedTabSnapshotTimer);
      pinnedTabSnapshotTimer = null;
    }
    return;
  }
  if (pinnedTabSnapshotTimer !== null) {
    clearTimeout(pinnedTabSnapshotTimer);
  }
  pinnedTabSnapshotTimer = setTimeout(() => {
    pinnedTabSnapshotTimer = null;
    persistPinnedTabSnapshotNow().catch(() => {});
  }, PINNED_TAB_SNAPSHOT_DEBOUNCE_MS);
}

async function restorePinnedTabsFromSnapshotOnStartup() {
  if (!pinnedTabRecoveryEnabledCache) {
    return;
  }
  if (pinnedTabRestoreAttempted) {
    return;
  }
  pinnedTabRestoreAttempted = true;
  const savedRaw = await getPinnedSnapshotFromStorage();
  const savedUrls = normalizePinnedTabSnapshot(savedRaw);
  if (!savedUrls.length) {
    return;
  }
  const currentTabs = await queryTabsForPinnedSnapshot({});
  const existingPinnedUrls = currentTabs
    .filter((tab) => tab && tab.pinned && tab.incognito !== true)
    .map((tab) => getResolvedTabUrl(tab))
    .filter((url) => Boolean(url) && !isRestrictedUrl(url));
  const required = countUrls(savedUrls);
  const existing = countUrls(existingPinnedUrls);
  const missingUrls = [];
  required.forEach((needCount, url) => {
    const existingCount = existing.get(url) || 0;
    for (let i = existingCount; i < needCount; i += 1) {
      missingUrls.push(url);
    }
  });
  if (!missingUrls.length) {
    return;
  }
  const targetWindowId = await getLastFocusedWindowIdForRestore();
  for (let i = 0; i < missingUrls.length && i < PINNED_TAB_RESTORE_MAX_TABS; i += 1) {
    await createPinnedTabForRestore(missingUrls[i], targetWindowId);
  }
  setTimeout(() => {
    schedulePersistPinnedTabSnapshot();
  }, 800);
}

function getTabSwitchStat(tabId, createIfMissing) {
  if (typeof tabId !== 'number') {
    return null;
  }
  const existing = tabSwitchEventsByTabId.get(tabId);
  if (existing || !createIfMissing) {
    return existing || null;
  }
  const created = {
    events: [],
    lastSwitchAt: 0
  };
  tabSwitchEventsByTabId.set(tabId, created);
  return created;
}

function pruneTabSwitchStat(stat, now) {
  if (!stat || !Array.isArray(stat.events)) {
    return;
  }
  const minTs = now - TAB_SWITCH_WINDOW_DAY_MS;
  stat.events = stat.events.filter((ts) => typeof ts === 'number' && ts >= minTs);
  if (stat.events.length > TAB_SWITCH_EVENT_HISTORY_LIMIT) {
    stat.events = stat.events.slice(-TAB_SWITCH_EVENT_HISTORY_LIMIT);
  }
}

function recordTabSwitchEvent(tabId, at) {
  const stat = getTabSwitchStat(tabId, true);
  if (!stat) {
    return;
  }
  const now = typeof at === 'number' ? at : Date.now();
  const lastRecordedAt = Number(stat.lastSwitchAt) || 0;
  if (lastRecordedAt > 0 && Math.abs(now - lastRecordedAt) < 450) {
    return;
  }
  stat.events.push(now);
  stat.lastSwitchAt = now;
  tabSwitchEventDebugTotal += 1;
  pruneTabSwitchStat(stat, now);
  persistTabSwitchStatsNow().catch(() => {});
}

function clearTabSwitchStat(tabId) {
  if (typeof tabId !== 'number') {
    return;
  }
  tabLastAccessedByTabId.delete(tabId);
  if (tabSwitchEventsByTabId.delete(tabId)) {
    persistTabSwitchStatsNow().catch(() => {});
  }
}

function syncTabSwitchStatsFromTabList(tabs) {
  const list = Array.isArray(tabs) ? tabs : [];
  const aliveIds = new Set();
  let mostRecentTabId = null;
  let mostRecentLastAccessed = 0;
  for (let i = 0; i < list.length; i += 1) {
    const tab = list[i];
    if (!tab || typeof tab.id !== 'number') {
      continue;
    }
    const tabId = tab.id;
    aliveIds.add(tabId);
    const lastAccessed = Number(tab.lastAccessed) || 0;
    if (lastAccessed <= 0) {
      continue;
    }
    if (lastAccessed > mostRecentLastAccessed) {
      mostRecentLastAccessed = lastAccessed;
      mostRecentTabId = tabId;
    }
    const previous = Number(tabLastAccessedByTabId.get(tabId)) || 0;
    tabLastAccessedByTabId.set(tabId, lastAccessed);
    if (previous > 0 && lastAccessed > previous + 250) {
      recordTabSwitchEvent(tabId, lastAccessed);
    }
  }
  const staleIds = [];
  tabLastAccessedByTabId.forEach((_, tabId) => {
    if (!aliveIds.has(tabId)) {
      staleIds.push(tabId);
    }
  });
  staleIds.forEach((tabId) => {
    tabLastAccessedByTabId.delete(tabId);
  });
  if (typeof mostRecentTabId === 'number' && mostRecentLastAccessed > 0) {
    const existing = getTabSwitchStat(mostRecentTabId, false);
    const lastRecordedAt = Number(existing && existing.lastSwitchAt) || 0;
    if (mostRecentLastAccessed > (lastRecordedAt + 250)) {
      recordTabSwitchEvent(mostRecentTabId, mostRecentLastAccessed);
    }
  }
}

function getTabSwitchRank(tab, now) {
  const safeNow = typeof now === 'number' ? now : Date.now();
  const stat = getTabSwitchStat(tab && typeof tab.id === 'number' ? tab.id : null, false);
  if (!stat) {
    return {
      score: 0,
      shortCount: 0,
      dayCount: 0,
      highFreq: false,
      hint: '',
      lastSwitchAt: 0
    };
  }
  pruneTabSwitchStat(stat, safeNow);
  const shortBoundary = safeNow - TAB_SWITCH_WINDOW_SHORT_MS;
  const dayBoundary = safeNow - TAB_SWITCH_WINDOW_DAY_MS;
  let shortCount = 0;
  let dayCount = 0;
  for (let i = 0; i < stat.events.length; i += 1) {
    const ts = Number(stat.events[i]) || 0;
    if (ts >= dayBoundary) {
      dayCount += 1;
    }
    if (ts >= shortBoundary) {
      shortCount += 1;
    }
  }
  const lastSwitchAt = Number(stat.lastSwitchAt) || 0;
  const minutesSinceSwitch = lastSwitchAt > 0 ? (safeNow - lastSwitchAt) / 60000 : 999999;
  const recencyBoost = Math.exp(-Math.max(0, minutesSinceSwitch) / 16);
  const score = (shortCount * 8) + (dayCount * 2.6) + (recencyBoost * 3.2);
  const highFreq = shortCount >= TAB_SWITCH_HIGH_FREQ_SHORT_THRESHOLD || dayCount >= TAB_SWITCH_HIGH_FREQ_DAY_THRESHOLD;
  const hint = highFreq
    ? (shortCount >= TAB_SWITCH_HIGH_FREQ_SHORT_THRESHOLD
      ? `近30分钟切换${shortCount}次`
      : `近24小时切换${dayCount}次`)
    : '';
  return {
    score: score,
    shortCount: shortCount,
    dayCount: dayCount,
    highFreq: highFreq,
    hint: hint,
    lastSwitchAt: lastSwitchAt
  };
}

function sortTabsForOverlay(tabs) {
  const list = Array.isArray(tabs) ? tabs.slice() : [];
  const now = Date.now();
  const sortAt = now;
  return list
    .map((tab, index) => {
      const rank = getTabSwitchRank(tab, now);
      const lastAccessed = Number(tab && tab.lastAccessed) || 0;
      const idleMinutes = lastAccessed > 0 ? (now - lastAccessed) / 60000 : 999999;
      const accessBoost = Math.exp(-Math.max(0, idleMinutes) / 30);
      return {
        tab: {
          ...tab,
          _xTabRankScore: rank.score,
          _xTabSwitchCount30m: rank.shortCount,
          _xTabSwitchCount24h: rank.dayCount,
          _xTabDebugEventTotal: tabSwitchEventDebugTotal,
          _xTabLastAccessedRaw: lastAccessed,
          _xTabSortAt: sortAt,
          _xTabRankHighFreq: rank.highFreq,
          _xTabRankHint: rank.hint
        },
        score: rank.score + accessBoost,
        lastAccessed: lastAccessed,
        index: index
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (b.lastAccessed !== a.lastAccessed) {
        return b.lastAccessed - a.lastAccessed;
      }
      return a.index - b.index;
    })
    .map((item) => item.tab);
}

if (storageArea) {
  storageArea.get([RESTRICTED_ACTION_STORAGE_KEY, DOCUMENT_PIP_ENABLED_STORAGE_KEY, PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY], (result) => {
    const stored = result[RESTRICTED_ACTION_STORAGE_KEY];
    const normalized = stored === 'none' ? 'none' : 'default';
    if (normalized !== stored) {
      storageArea.set({ [RESTRICTED_ACTION_STORAGE_KEY]: normalized });
    }
    restrictedActionCache = normalized;
    const documentPipStored = result[DOCUMENT_PIP_ENABLED_STORAGE_KEY];
    const normalizedDocumentPip = documentPipStored === true;
    if (documentPipStored !== normalizedDocumentPip) {
      storageArea.set({ [DOCUMENT_PIP_ENABLED_STORAGE_KEY]: normalizedDocumentPip });
    }
    documentPipEnabledCache = normalizedDocumentPip;
    const pinnedTabRecoveryStored = result[PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY];
    const normalizedPinnedTabRecovery = pinnedTabRecoveryStored === true;
    if (pinnedTabRecoveryStored !== normalizedPinnedTabRecovery) {
      storageArea.set({ [PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY]: normalizedPinnedTabRecovery });
    }
    pinnedTabRecoveryEnabledCache = normalizedPinnedTabRecovery;
    if (pinnedTabRecoveryEnabledCache) {
      schedulePersistPinnedTabSnapshot();
    }
  });
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
        ? STORAGE_MIGRATION_UTILS.buildMigrationPayload(keys, localResult, syncResult)
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

function shouldIgnoreDuplicateHotkey(tabId) {
  if (typeof tabId !== 'number') {
    return false;
  }
  const now = Date.now();
  const lastAt = hotkeyInvokeAtByTabId.get(tabId) || 0;
  hotkeyInvokeAtByTabId.set(tabId, now);
  return (now - lastAt) <= HOTKEY_DUP_GUARD_MS;
}

function rememberPageHotkeyContext(tab) {
  if (!tab || typeof tab.id !== 'number' || typeof tab.windowId !== 'number') {
    lastPageHotkeyContext = null;
    return;
  }
  lastPageHotkeyContext = {
    at: Date.now(),
    tabId: tab.id,
    windowId: tab.windowId
  };
}

function getRecentPageHotkeyContext(windowId) {
  if (!lastPageHotkeyContext) {
    return null;
  }
  const age = Date.now() - Number(lastPageHotkeyContext.at || 0);
  if (age > PAGE_HOTKEY_NEWTAB_RECOVER_MS) {
    lastPageHotkeyContext = null;
    return null;
  }
  if (typeof windowId === 'number' && lastPageHotkeyContext.windowId !== windowId) {
    return null;
  }
  return lastPageHotkeyContext;
}

function clearRecentPageHotkeyContext() {
  lastPageHotkeyContext = null;
}

function buildPrefillQueryForCurrentPage(tab) {
  return getResolvedTabUrl(tab);
}

function getOverlayPrefillQueryForSource(tab, source) {
  if (source !== 'page-hotkey-prefill' && source !== 'commands-prefill') {
    return '';
  }
  return buildPrefillQueryForCurrentPage(tab);
}

function recoverFromPageHotkeyNewtab(newTabId, windowId) {
  const recentContext = getRecentPageHotkeyContext(windowId);
  if (!recentContext || typeof newTabId !== 'number') {
    return;
  }
  chrome.tabs.query({ windowId: recentContext.windowId }, (tabs) => {
    const tabList = Array.isArray(tabs) ? tabs : [];
    const newTab = tabList.find((item) => item && item.id === newTabId) || null;
    const sourceTab = tabList.find((item) => item && item.id === recentContext.tabId) || null;
    const newTabUrl = getResolvedTabUrl(newTab);
    if (!newTab || (!isLumnoNewtabUrl(newTabUrl) && !isBrowserNewtabUrl(newTabUrl))) {
      return;
    }
    if (!sourceTab || !canOpenOverlayOnUrl(getResolvedTabUrl(sourceTab))) {
      clearRecentPageHotkeyContext();
      return;
    }
    clearRecentPageHotkeyContext();
    logHotkeyDebug('page-hotkey-newtab-recover-start', {
      windowId: recentContext.windowId,
      sourceTabId: sourceTab.id,
      newTabId: newTab.id,
      sourceUrl: getResolvedTabUrl(sourceTab),
      newTabUrl: newTabUrl
    });
    chrome.tabs.update(sourceTab.id, { active: true }, () => {
      if (chrome.runtime && chrome.runtime.lastError) {
        logHotkeyDebug('page-hotkey-newtab-recover-failed', {
          step: 'activate-source',
          sourceTabId: sourceTab.id,
          error: chrome.runtime.lastError.message || 'unknown'
        });
        return;
      }
      chrome.tabs.remove(newTab.id, () => {
        if (chrome.runtime && chrome.runtime.lastError) {
          logHotkeyDebug('page-hotkey-newtab-close-failed', {
            newTabId: newTab.id,
            error: chrome.runtime.lastError.message || 'unknown'
          });
        }
      });
    });
  });
}

function openOverlayOnTab(activeTab, tabs, source) {
  if (!activeTab || typeof activeTab.id !== 'number') {
    logHotkeyDebug('no-active-tab', { source: source || '' });
    openNewtabFallback();
    return;
  }
  if (shouldIgnoreDuplicateHotkey(activeTab.id)) {
    logHotkeyDebug('duplicate-ignored', { tabId: activeTab.id, source: source || '' });
    return;
  }
  const activeUrl = getResolvedTabUrl(activeTab);
  const rawUrl = typeof activeTab.url === 'string' ? activeTab.url : '';
  const rawPendingUrl = typeof activeTab.pendingUrl === 'string' ? activeTab.pendingUrl : '';
  const restricted = !canOpenOverlayOnUrl(activeUrl);
  logHotkeyDebug('active-tab', {
    tabId: activeTab.id,
    resolvedUrl: activeUrl,
    tabUrl: rawUrl,
    pendingUrl: rawPendingUrl,
    url: activeUrl,
    restricted: restricted,
    source: source || ''
  });
  if (restricted) {
    if (isSearchCommandSource(source) && (isLumnoNewtabUrl(activeUrl) || isBrowserNewtabUrl(activeUrl))) {
      requestFocusVisibleNewtabInput(source, activeTab.id);
      return;
    }
    if (recoverOverlayTargetFromCommandNewtab(activeTab, tabs, source)) {
      return;
    }
    const action = restrictedActionCache || 'default';
    logHotkeyDebug('restricted-url', {
      action: action,
      url: activeUrl,
      source: source || ''
    });
    if (action === 'none') {
      logHotkeyDebug('suppressed', { reason: 'restricted_action_none', source: source || '' });
      return;
    }
    if (action === 'default') {
      logHotkeyDebug('fallback-open-create-newtab', { reason: 'restricted_url', source: source || '' });
      openNewtabFallbackForUrl(activeUrl);
      return;
    }
    logHotkeyDebug('fallback-open-lumno-newtab', { reason: 'restricted_url', source: source || '' });
    openNewtabFallbackForUrl(activeUrl);
    return;
  }
  logHotkeyDebug('inject-start', { tabId: activeTab.id, files: OVERLAY_SCRIPT_FILES, source: source || '' });
  chrome.scripting.executeScript({
    target: {tabId: activeTab.id},
    files: OVERLAY_SCRIPT_FILES
  }, function() {
    if (chrome.runtime.lastError) {
      logHotkeyDebug('inject-failed', {
        step: OVERLAY_SCRIPT_FILES.join(','),
        tabId: activeTab.id,
        error: chrome.runtime.lastError.message || 'unknown',
        source: source || ''
      });
      openNewtabFallbackForUrl(activeUrl);
      return;
    }
    const runOverlayScript = (tabZoomFactor) => {
      const prefillQuery = getOverlayPrefillQueryForSource(activeTab, source);
      const prioritizeCurrentPageMatch = source === 'page-hotkey-prefill';
      chrome.scripting.executeScript({
        target: {tabId: activeTab.id},
        function: toggleBlackRectangle,
        args: [tabs, {
          tabZoomFactor: tabZoomFactor,
          prefillQuery: prefillQuery,
          prioritizeCurrentPageMatch: prioritizeCurrentPageMatch,
          currentTabId: typeof activeTab.id === 'number' ? activeTab.id : null,
          currentTabUrl: getResolvedTabUrl(activeTab)
        }]
      }, function() {
        if (chrome.runtime.lastError) {
          logHotkeyDebug('inject-failed', {
            step: 'toggleBlackRectangle',
            tabId: activeTab.id,
            error: chrome.runtime.lastError.message || 'unknown',
            source: source || ''
          });
          openNewtabFallback();
          return;
        }
        logHotkeyDebug('overlay-opened', {
          tabId: activeTab.id,
          tabCount: Array.isArray(tabs) ? tabs.length : 0,
          source: source || '',
          tabZoomFactor: tabZoomFactor
        });
      });
    };
    if (chrome.tabs && typeof chrome.tabs.getZoom === 'function') {
      chrome.tabs.getZoom(activeTab.id, (zoomFactor) => {
        const zoom = Number.isFinite(Number(zoomFactor)) && Number(zoomFactor) > 0
          ? Number(zoomFactor)
          : 1;
        runOverlayScript(zoom);
      });
      return;
    }
    runOverlayScript(1);
  });
}

function triggerShowSearchForTab(tab, source) {
  if (!tab || typeof tab.id !== 'number') {
    logHotkeyDebug('no-active-tab', { source: source || '' });
    openNewtabFallback();
    return;
  }
  const windowQuery = (typeof tab.windowId === 'number')
    ? { windowId: tab.windowId }
    : { currentWindow: true };
  chrome.tabs.query(windowQuery, (tabs) => {
    const tabList = Array.isArray(tabs) ? tabs : [];
    const resolvedTab = tabList.find((item) => item && item.id === tab.id) || tab;
    openOverlayOnTab(resolvedTab, tabList, source);
  });
}

function detectAnyActiveVideoPiP(callback) {
  chrome.tabs.query({}, (tabs) => {
    const tabList = Array.isArray(tabs) ? tabs : [];
    const candidates = tabList.filter((tab) => {
      if (!tab || typeof tab.id !== 'number') {
        return false;
      }
      const tabUrl = getResolvedTabUrl(tab);
      if (isRestrictedUrl(tabUrl)) {
        return false;
      }
      return true;
    });
    if (!candidates.length) {
      callback(false, { checked: 0, foundTabId: null });
      return;
    }
    let pending = candidates.length;
    let finished = false;
    let checked = 0;
    const done = (active, tabId) => {
      if (finished) {
        return;
      }
      finished = true;
      callback(Boolean(active), {
        checked: checked,
        foundTabId: typeof tabId === 'number' ? tabId : null
      });
    };
    candidates.forEach((tab) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: 'MAIN',
        func: () => {
          const pipElement = document.pictureInPictureElement;
          return {
            hasPiP: Boolean(pipElement),
            isVideoPiP: Boolean(pipElement && pipElement.tagName === 'VIDEO')
          };
        }
      }, (results) => {
        checked += 1;
        pending -= 1;
        if (finished) {
          return;
        }
        if (!chrome.runtime.lastError) {
          const payload = Array.isArray(results) && results[0] ? results[0].result : null;
          if (payload && payload.hasPiP && payload.isVideoPiP) {
            done(true, tab.id);
            return;
          }
        }
        if (pending <= 0) {
          done(false, null);
        }
      });
    });
  });
}

function openDocumentPipPickerOnTab(activeTab, source) {
  if (!documentPipEnabledCache) {
    logHotkeyDebug('document-pip-disabled', { source: source || '' });
    openExtensionOptionsPage();
    return;
  }
  if (!activeTab || typeof activeTab.id !== 'number') {
    logHotkeyDebug('document-pip-no-active-tab', { source: source || '' });
    openExtensionOptionsPage();
    return;
  }
  const activeUrl = getResolvedTabUrl(activeTab);
  const restricted = isRestrictedUrl(activeUrl);
  logHotkeyDebug('document-pip-active-tab', {
    tabId: activeTab.id,
    url: activeUrl,
    restricted: restricted,
    source: source || ''
  });
  if (restricted) {
    logHotkeyDebug('document-pip-restricted-url', {
      tabId: activeTab.id,
      url: activeUrl,
      source: source || ''
    });
    openExtensionOptionsPage();
    return;
  }
  const injectAndInvoke = (invokeMode) => {
    chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      files: ['src/content/document-pip-picker.js']
    }, () => {
      if (chrome.runtime.lastError) {
        logHotkeyDebug('document-pip-inject-failed', {
          step: 'src/content/document-pip-picker.js',
          tabId: activeTab.id,
          error: chrome.runtime.lastError.message || 'unknown',
          source: source || ''
        });
        openExtensionOptionsPage();
        return;
      }
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: (mode) => {
          const controller = window.__lumnoDocumentPiPPicker2026;
          if (!controller || typeof controller.toggle !== 'function') {
            return { ok: false, reason: 'picker-missing' };
          }
          if (mode === 'conflict-toast') {
            if (typeof controller.notifyVideoPiPConflict === 'function') {
              return controller.notifyVideoPiPConflict();
            }
            return { ok: false, reason: 'picker-conflict-handler-missing' };
          }
          return controller.toggle();
        },
        args: [invokeMode]
      }, (results) => {
        if (chrome.runtime.lastError) {
          logHotkeyDebug('document-pip-toggle-failed', {
            step: 'toggle',
            tabId: activeTab.id,
            error: chrome.runtime.lastError.message || 'unknown',
            source: source || '',
            mode: invokeMode || 'toggle'
          });
          return;
        }
        const result = Array.isArray(results) && results[0] ? results[0].result : null;
        logHotkeyDebug('document-pip-toggle', {
          tabId: activeTab.id,
          source: source || '',
          mode: invokeMode || 'toggle',
          result: result && typeof result === 'object' ? result : {}
        });
      });
    });
  };

  detectAnyActiveVideoPiP((hasActiveVideoPiP, detail) => {
    if (hasActiveVideoPiP) {
      logHotkeyDebug('document-pip-blocked-by-active-video-pip', {
        tabId: activeTab.id,
        source: source || '',
        checkedTabs: detail && typeof detail.checked === 'number' ? detail.checked : 0,
        pipTabId: detail && typeof detail.foundTabId === 'number' ? detail.foundTabId : null
      });
      injectAndInvoke('conflict-toast');
      return;
    }
    injectAndInvoke('toggle');
  });
}

function getDefaultFallbackShortcutByPlatform(platformOs) {
  return platformOs === 'mac' ? 'Command+Shift+K' : 'Ctrl+Shift+K';
}

function getDefaultFallbackShortcut(callback) {
  if (!chrome || !chrome.runtime || typeof chrome.runtime.getPlatformInfo !== 'function') {
    callback('Ctrl+Shift+K');
    return;
  }
  chrome.runtime.getPlatformInfo((info) => {
    const os = info && typeof info.os === 'string' ? info.os : '';
    callback(getDefaultFallbackShortcutByPlatform(os));
  });
}

function getConfiguredFallbackShortcut(callback) {
  getDefaultFallbackShortcut((defaultShortcut) => {
    if (!chrome || !chrome.commands || typeof chrome.commands.getAll !== 'function') {
      callback(defaultShortcut);
      return;
    }
    chrome.commands.getAll((commands) => {
      if (chrome.runtime && chrome.runtime.lastError) {
        callback(defaultShortcut);
        return;
      }
      const items = Array.isArray(commands) ? commands : [];
      const command = items.find((item) => item && item.name === SHOW_SEARCH_COMMAND_NAME);
      const shortcut = command && typeof command.shortcut === 'string'
        ? normalizeShortcutFromCommandsValue(command.shortcut)
        : '';
      callback(shortcut || defaultShortcut);
    });
  });
}

function normalizeShortcutFromCommandsValue(value) {
  const text = String(value || '').trim();
  if (!text || text.includes('%')) {
    return '';
  }
  const parts = text.split('+').map((item) => String(item || '').trim()).filter(Boolean);
  if (parts.length < 2) {
    return '';
  }
  const keyToken = parts[parts.length - 1];
  if (!/^[A-Za-z0-9]$/.test(keyToken) && !/^F\d{1,2}$/i.test(keyToken)) {
    const specialKeys = new Set([
      'Tab', 'Enter', 'Return', 'Escape', 'Esc', 'Space', 'Spacebar',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      ',', '.', '/', ';', '\'', '-', '+', '\\', '`', '[', ']'
    ]);
    if (!specialKeys.has(keyToken)) {
      return '';
    }
  }
  let hasModifier = false;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const token = parts[i].toLowerCase();
    const isModifier =
      token === 'ctrl' ||
      token === 'control' ||
      token === 'macctrl' ||
      token === 'alt' ||
      token === 'option' ||
      token === 'shift' ||
      token === 'command' ||
      token === 'cmd' ||
      token === 'meta' ||
      token === 'super';
    if (!isModifier) {
      return '';
    }
    hasModifier = true;
  }
  return hasModifier ? text : '';
}

function getConfiguredCopyUrlCommandShortcut(callback) {
  if (!chrome || !chrome.commands || typeof chrome.commands.getAll !== 'function') {
    callback('');
    return;
  }
  chrome.commands.getAll((commands) => {
    if (chrome.runtime && chrome.runtime.lastError) {
      callback('');
      return;
    }
    const items = Array.isArray(commands) ? commands : [];
    const command = items.find((item) => item && item.name === SHOW_SEARCH_PREFILL_V_COMMAND_NAME);
    const shortcut = command && typeof command.shortcut === 'string'
      ? normalizeShortcutFromCommandsValue(command.shortcut)
      : '';
    callback(shortcut || '');
  });
}

function openExtensionShortcutsPage(callback) {
  const done = typeof callback === 'function' ? callback : () => {};
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }, () => {
    done(!(chrome.runtime && chrome.runtime.lastError));
  });
}

function triggerCopyCurrentUrlForTab(activeTab, source) {
  if (!activeTab || typeof activeTab.id !== 'number') {
    logHotkeyDebug('copy-url-no-active-tab', { source: source || '' });
    return;
  }
  chrome.tabs.sendMessage(activeTab.id, { action: 'copyCurrentPageUrlFromCommand' }, (response) => {
    if (chrome.runtime && chrome.runtime.lastError) {
      logHotkeyDebug('copy-url-send-message-failed', {
        tabId: activeTab.id,
        source: source || '',
        error: chrome.runtime.lastError.message || 'unknown'
      });
      return;
    }
    logHotkeyDebug('copy-url-triggered', {
      tabId: activeTab.id,
      source: source || '',
      ok: Boolean(response && response.ok)
    });
  });
}

chrome.commands.onCommand.addListener(function(command) {
  if (
    command !== SHOW_SEARCH_COMMAND_NAME &&
    command !== SHOW_SEARCH_PREFILL_COMMAND_NAME &&
    command !== SHOW_SEARCH_PREFILL_V_COMMAND_NAME
  ) {
    return;
  }
  const source = command === SHOW_SEARCH_COMMAND_NAME
    ? 'commands'
    : (command === SHOW_SEARCH_PREFILL_COMMAND_NAME ? 'commands-prefill' : 'commands-copy-url');
  logHotkeyDebug('received', { command: command, source: source });
  chrome.tabs.query({active: true, currentWindow: true}, function(activeTabs) {
    if (command === SHOW_SEARCH_PREFILL_V_COMMAND_NAME) {
      triggerCopyCurrentUrlForTab(activeTabs[0], source);
      return;
    }
    triggerShowSearchForTab(activeTabs[0], source);
  });
});

chrome.tabs.onCreated.addListener((tab) => {
  const recentContext = getRecentPageHotkeyContext(tab && typeof tab.windowId === 'number' ? tab.windowId : null);
  if (!recentContext || !tab || typeof tab.id !== 'number') {
    schedulePersistPinnedTabSnapshot();
    return;
  }
  setTimeout(() => {
    recoverFromPageHotkeyNewtab(tab.id, recentContext.windowId);
  }, 120);
  schedulePersistPinnedTabSnapshot();
});

chrome.runtime.onInstalled.addListener((details) => {
  if (!details) {
    schedulePersistPinnedTabSnapshot();
    return;
  }
  const reason = String(details.reason || '');
  if (reason === 'install') {
    openOnboardingPage();
    schedulePersistPinnedTabSnapshot();
    return;
  }
  if (reason === 'update') {
    openReleasePage({ reason: 'update' });
  }
  schedulePersistPinnedTabSnapshot();
});

if (chrome && chrome.runtime && chrome.runtime.onStartup) {
  chrome.runtime.onStartup.addListener(() => {
    restorePinnedTabsFromSnapshotOnStartup().catch(() => {});
    schedulePersistPinnedTabSnapshot();
  });
}
schedulePersistPinnedTabSnapshot();
ensureTabSwitchStatsLoaded().catch(() => {});
cleanupRemovedAiStorageKeys();

if (chrome.action && chrome.action.onClicked) {
  chrome.action.onClicked.addListener((tab) => {
    openDocumentPipPickerOnTab(tab, 'action');
  });
}

if (chrome && chrome.tabs && chrome.tabs.onActivated) {
  chrome.tabs.onActivated.addListener((activeInfo) => {
    if (!activeInfo || typeof activeInfo.tabId !== 'number') {
      return;
    }
    recordTabSwitchEvent(activeInfo.tabId);
  });
}

if (chrome && chrome.tabs && chrome.tabs.onRemoved) {
  chrome.tabs.onRemoved.addListener((tabId) => {
    clearTabSwitchStat(tabId);
    schedulePersistPinnedTabSnapshot();
    clearGlobalPipOwnerForTabId(tabId);
  });
}

if (chrome && chrome.tabs && chrome.tabs.onUpdated) {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!changeInfo) {
      return;
    }
    if (typeof changeInfo.url === 'string') {
      // URL changed means the tab semantic target changed; reset historical switch stats.
      clearTabSwitchStat(tabId);
      clearGlobalPipOwnerForTabId(tabId);
    }
    if (changeInfo.pinned !== undefined || typeof changeInfo.url === 'string' || changeInfo.status === 'complete') {
      schedulePersistPinnedTabSnapshot();
    }
    if (changeInfo.status === 'complete') {
      const completedUrl = typeof changeInfo.url === 'string'
        ? changeInfo.url
        : (tab && typeof tab.url === 'string' ? tab.url : '');
      markFaviconDirtyForUrl(completedUrl);
    }
  });
}

if (chrome && chrome.tabs && chrome.tabs.onMoved) {
  chrome.tabs.onMoved.addListener(() => {
    schedulePersistPinnedTabSnapshot();
  });
}

function waitForTabComplete(tabId, timeoutMs) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let timeoutId = null;
    const finish = (tab, error) => {
      if (settled) {
        return;
      }
      settled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      chrome.tabs.onUpdated.removeListener(handleUpdated);
      if (error) {
        reject(error);
        return;
      }
      resolve(tab || null);
    };
    const handleUpdated = (updatedTabId, changeInfo, tab) => {
      if (updatedTabId !== tabId) {
        return;
      }
      if (changeInfo && changeInfo.status === 'complete') {
        finish(tab || null);
      }
    };
    chrome.tabs.onUpdated.addListener(handleUpdated);
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime && chrome.runtime.lastError) {
        finish(null, new Error(chrome.runtime.lastError.message || 'tab-unavailable'));
        return;
      }
      if (tab && tab.status === 'complete') {
        finish(tab);
      }
    });
    timeoutId = setTimeout(() => {
      chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime && chrome.runtime.lastError) {
          finish(null, new Error(chrome.runtime.lastError.message || 'tab-unavailable'));
          return;
        }
        finish(tab || null);
      });
    }, Math.max(1000, Number(timeoutMs) || 15000));
  });
}

function submitGeminiPromptInTab(tabId, prompt) {
  return new Promise((resolve) => {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: async (rawPrompt) => {
        const promptText = String(rawPrompt || '').trim();
        if (!promptText) {
          return { ok: false, reason: 'empty-prompt' };
        }
        const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
        const isVisible = (element) => {
          if (!element) {
            return false;
          }
          const style = window.getComputedStyle(element);
          if (style.display === 'none' || style.visibility === 'hidden') {
            return false;
          }
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        };
        const isActionableButton = (element) => {
          if (!isVisible(element) || element.disabled) {
            return false;
          }
          const style = window.getComputedStyle(element);
          const ariaDisabled = String(element.getAttribute('aria-disabled') || '').toLowerCase();
          return (
            ariaDisabled !== 'true' &&
            style.pointerEvents !== 'none' &&
            style.visibility !== 'hidden' &&
            style.display !== 'none' &&
            style.opacity !== '0'
          );
        };
        const editorSelectors = [
          '.ql-editor[contenteditable="true"][role="textbox"]',
          '[contenteditable="true"][role="textbox"][aria-label*="Gemini"]',
          '[contenteditable="true"][role="textbox"][aria-label*="gemini"]',
          '[contenteditable="true"][data-placeholder*="Gemini"]',
          '[contenteditable="true"][data-placeholder*="gemini"]',
          'rich-textarea .ql-editor[contenteditable="true"]',
          'textarea[aria-label*="Gemini"]',
          'textarea[aria-label*="gemini"]',
          'div[role="textbox"][contenteditable="true"]',
          'textarea'
        ];
        const sendButtonSelectors = [
          'button[aria-label="发送"]',
          'button[aria-label="Send"]',
          'button[aria-label*="发送"]',
          'button[aria-label*="提交"]',
          'button[aria-label*="Send"]',
          'button[aria-label*="send" i]',
          'button[aria-label*="submit" i]'
        ];
        const escapeHtml = (value) => value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        const dispatchInput = (element) => {
          element.dispatchEvent(new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            data: promptText,
            inputType: 'insertText'
          }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        };
        const findEditor = () => {
          for (const selector of editorSelectors) {
            const editor = Array.from(document.querySelectorAll(selector)).find(isVisible);
            if (editor) {
              return editor;
            }
          }
          return null;
        };
        const findSendButton = () => {
          for (const selector of sendButtonSelectors) {
            const button = Array.from(document.querySelectorAll(selector))
              .find((item) => isVisible(item));
            if (button) {
              return button;
            }
          }
          return null;
        };
        const setPrompt = (editor) => {
          editor.focus();
          if (editor instanceof HTMLTextAreaElement || editor instanceof HTMLInputElement) {
            editor.value = promptText;
            dispatchInput(editor);
            return editor.value === promptText;
          }
          const selection = window.getSelection();
          if (selection) {
            const range = document.createRange();
            range.selectNodeContents(editor);
            selection.removeAllRanges();
            selection.addRange(range);
          }
          if (typeof document.execCommand === 'function') {
            document.execCommand('insertText', false, promptText);
          }
          const currentText = String(editor.innerText || editor.textContent || '').trim();
          if (currentText !== promptText) {
            editor.innerHTML = `<p>${escapeHtml(promptText)}</p>`;
          }
          dispatchInput(editor);
          return String(editor.innerText || editor.textContent || '').trim() === promptText;
        };
        const pressEnter = (editor) => {
          ['keydown', 'keypress', 'keyup'].forEach((type) => {
            editor.dispatchEvent(new KeyboardEvent(type, {
              key: 'Enter',
              code: 'Enter',
              bubbles: true,
              cancelable: true
            }));
          });
        };
        for (let attempt = 0; attempt < 12; attempt += 1) {
          const editor = findEditor();
          if (!editor) {
            await sleep(400);
            continue;
          }
          const populated = setPrompt(editor);
          if (!populated) {
            await sleep(250);
            continue;
          }
          for (let sendAttempt = 0; sendAttempt < 24; sendAttempt += 1) {
            const sendButton = findSendButton();
            if (sendButton && isActionableButton(sendButton)) {
              sendButton.click();
              return { ok: true, method: 'button' };
            }
            await sleep(sendAttempt < 4 ? 150 : 250);
          }
          pressEnter(editor);
          return { ok: true, method: 'enter' };
        }
        return { ok: false, reason: 'editor-not-found' };
      },
      args: [prompt]
    }, (results) => {
      if (chrome.runtime && chrome.runtime.lastError) {
        resolve({ ok: false, reason: chrome.runtime.lastError.message || 'execute-script-failed' });
        return;
      }
      const result = Array.isArray(results) && results[0] ? results[0].result : null;
      resolve(result && typeof result === 'object' ? result : { ok: false, reason: 'empty-script-result' });
    });
  });
}

function runInteractiveSiteSearchProvider(provider, query, sender, disposition) {
  const prompt = String(query || '').trim();
  const entryUrl = getSiteSearchProviderEntryUrl(provider);
  const targetDisposition = disposition === 'currentTab' ? 'currentTab' : 'newTab';
  return new Promise((resolve) => {
    if (!entryUrl || !prompt || !isInteractiveSiteSearchProvider(provider)) {
      resolve({ ok: false, reason: 'invalid-provider-request' });
      return;
    }
    const finish = (result) => {
      resolve(result && typeof result === 'object' ? result : { ok: false, reason: 'unknown' });
    };
    const handleReadyTab = (tab) => {
      if (!tab || typeof tab.id !== 'number') {
        finish({ ok: false, reason: 'tab-unavailable' });
        return;
      }
      waitForTabComplete(tab.id, 15000)
        .catch(() => tab)
        .then(() => submitGeminiPromptInTab(tab.id, prompt))
        .then((result) => {
          finish({
            ok: Boolean(result && result.ok),
            tabId: tab.id,
            url: entryUrl,
            method: result && result.method ? result.method : '',
            reason: result && result.reason ? result.reason : ''
          });
        })
        .catch((error) => {
          finish({
            ok: false,
            tabId: tab.id,
            url: entryUrl,
            reason: error && error.message ? error.message : 'interactive-site-search-failed'
          });
        });
    };
    if (targetDisposition === 'currentTab' && sender && sender.tab && typeof sender.tab.id === 'number') {
      chrome.tabs.update(sender.tab.id, { url: entryUrl, active: true }, (tab) => {
        if (chrome.runtime && chrome.runtime.lastError) {
          finish({ ok: false, reason: chrome.runtime.lastError.message || 'tab-update-failed' });
          return;
        }
        handleReadyTab(tab);
      });
      return;
    }
    chrome.tabs.create({ url: entryUrl, active: true }, (tab) => {
      if (chrome.runtime && chrome.runtime.lastError) {
        finish({ ok: false, reason: chrome.runtime.lastError.message || 'tab-create-failed' });
        return;
      }
      handleReadyTab(tab);
    });
  });
}

// Listen for messages from content script to switch tabs
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'switchToTab') {
    if (typeof request.tabId === 'number') {
      recordTabSwitchEvent(request.tabId);
    }
    chrome.tabs.update(request.tabId, {active: true});
    sendResponse({ ok: true });
    return;
  } else if (request.action === 'reportTabVisible') {
    const senderTab = sender && sender.tab ? sender.tab : null;
    if (senderTab && typeof senderTab.id === 'number') {
      const at = Number(request && request.at);
      recordTabSwitchEvent(senderTab.id, Number.isFinite(at) ? at : Date.now());
    }
    sendResponse({ ok: true });
    return;
  } else if (request.action === 'pipRequestOwnership') {
    requestGlobalPipOwnership(sender, request && request.kind ? String(request.kind) : '')
      .then((result) => {
        sendResponse(result);
      })
      .catch((error) => {
        sendResponse({
          ok: false,
          granted: false,
          reason: error && error.message ? error.message : String(error || 'ownership-request-failed')
        });
      });
    return true;
  } else if (request.action === 'pipReleaseOwnership') {
    releaseGlobalPipOwnership(sender, request && request.token ? String(request.token) : '')
      .then((result) => {
        sendResponse(result);
      })
      .catch((error) => {
        sendResponse({
          ok: false,
          released: false,
          reason: error && error.message ? error.message : String(error || 'ownership-release-failed')
        });
      });
    return true;
  } else if (request.action === 'getShowSearchShortcut') {
    getConfiguredFallbackShortcut((shortcut) => {
      sendResponse({ shortcut: shortcut || '' });
    });
    return true;
  } else if (request.action === 'getCopyCurrentUrlCommandShortcut') {
    getConfiguredCopyUrlCommandShortcut((shortcut) => {
      sendResponse({ shortcut: shortcut || '' });
    });
    return true;
  } else if (request.action === 'triggerShowSearchFromPageHotkey') {
    const senderTab = sender && sender.tab ? sender.tab : null;
    if (!senderTab || typeof senderTab.id !== 'number') {
      logHotkeyDebug('page-hotkey-invalid-sender', {
        hasSender: Boolean(sender),
        hasTab: Boolean(sender && sender.tab)
      });
      sendResponse({ ok: false });
      return;
    }
    const shouldPrefillCurrentUrl = Boolean(request && request.prefillCurrentUrl);
    const triggerSource = shouldPrefillCurrentUrl ? 'page-hotkey-prefill' : 'page-hotkey';
    logHotkeyDebug('received', {
      command: SHOW_SEARCH_COMMAND_NAME,
      source: triggerSource,
      tabId: senderTab.id,
      url: senderTab.url || '',
      pendingUrl: senderTab.pendingUrl || '',
      prefillCurrentUrl: shouldPrefillCurrentUrl
    });
    rememberPageHotkeyContext(senderTab);
    triggerShowSearchForTab(senderTab, triggerSource);
    sendResponse({ ok: true });
    return;
  } else if (request.action === 'siteTryEnterPiPInMainWorld') {
    const senderTab = sender && sender.tab ? sender.tab : null;
    const tabId = senderTab && typeof senderTab.id === 'number' ? senderTab.id : null;
    if (typeof tabId !== 'number') {
      sendResponse({ ok: false, reason: 'no-tab' });
      return;
    }
    const frameId = sender && typeof sender.frameId === 'number' ? sender.frameId : 0;
    chrome.scripting.executeScript({
      target: { tabId: tabId, frameIds: [frameId] },
      world: 'MAIN',
      func: async () => {
        const result = {
          ok: true,
          before: Boolean(document.pictureInPictureElement),
          after: Boolean(document.pictureInPictureElement),
          attempted: false,
          used: '',
          error: ''
        };

        const selectors = [
          '.xgplayer video',
          '.xgplayer-video-wrap video',
          '.xg-video-container video',
          '.iqp-player-videolayer video',
          '.iqp-player video',
          '.bpx-player-video-wrap video',
          '#player video',
          'video'
        ];

        const host = String(location.hostname || '').toLowerCase();
        const isDouyinHost = host.endsWith('.douyin.com') || host === 'douyin.com';
        const isIqiyiHost = host.endsWith('.iqiyi.com') || host === 'iqiyi.com' || host.includes('.iqiyi.');
        const candidateVideos = [];
        const seen = new WeakSet();
        const pushVideo = (video) => {
          if (!(video instanceof HTMLVideoElement)) {
            return;
          }
          if (!video.isConnected || seen.has(video)) {
            return;
          }
          seen.add(video);
          candidateVideos.push(video);
        };

        for (const selector of selectors) {
          const nodes = Array.from(document.querySelectorAll(selector));
          for (const node of nodes) {
            pushVideo(node);
          }
        }
        Array.from(document.querySelectorAll('video')).forEach((node) => {
          pushVideo(node);
        });

        const getArea = (video) => {
          if (!video || typeof video.getBoundingClientRect !== 'function') {
            return 0;
          }
          const rect = video.getBoundingClientRect();
          const width = Math.max(0, Number(rect.width || 0));
          const height = Math.max(0, Number(rect.height || 0));
          return width * height;
        };

        const hasBoost = (video) => {
          if (!video || typeof video.closest !== 'function') {
            return false;
          }
          if (host.endsWith('.douyin.com') || host === 'douyin.com') {
            return Boolean(video.closest('.xgplayer, .xgplayer-video-wrap, .xg-video-container'));
          }
          if (host.endsWith('.iqiyi.com') || host === 'iqiyi.com' || host.includes('.iqiyi.')) {
            return Boolean(video.closest('.iqp-player, .iqp-player-videolayer, #flashbox, #player'));
          }
          if (host.endsWith('.bilibili.com') || host === 'bilibili.com') {
            return Boolean(video.closest('.bpx-player-video-wrap, .bilibili-player-video-wrap, #bilibili-player, #player'));
          }
          return false;
        };

        const scoreVideo = (video) => {
          if (!(video instanceof HTMLVideoElement) || !video.isConnected) {
            return -1;
          }
          const area = getArea(video);
          const resolution = Math.max(
            0,
            Number(video.videoWidth || 0) * Number(video.videoHeight || 0)
          );
          const hasFrame = resolution > 0 || Number(video.readyState || 0) >= 1;
          if (!hasFrame) {
            return -1;
          }
          const playingBoost = (!video.paused && !video.ended && Number(video.readyState || 0) >= 2)
            ? 1_000_000_000
            : 0;
          const profileBoost = hasBoost(video) ? 180_000_000 : 0;
          const resolutionBoost = Math.min(80_000_000, Math.floor(resolution / 24));
          return playingBoost + profileBoost + resolutionBoost + area;
        };

        candidateVideos.sort((a, b) => scoreVideo(b) - scoreVideo(a));

        for (const video of candidateVideos) {
          if (document.pictureInPictureElement) {
            break;
          }
          if (scoreVideo(video) < 0) {
            continue;
          }
          try {
            video.autoPictureInPicture = true;
          } catch (e) {}
          try {
            if (video.disablePictureInPicture) {
              video.disablePictureInPicture = false;
            }
          } catch (e) {}
          try {
            if (video.hasAttribute('disablepictureinpicture')) {
              video.removeAttribute('disablepictureinpicture');
            }
          } catch (e) {}
          if (isIqiyiHost && video.paused && !video.ended) {
            try {
              await video.play();
            } catch (e) {}
          }
          if (typeof video.requestPictureInPicture !== 'function') {
            continue;
          }
          try {
            result.attempted = true;
            result.used = 'video.requestPictureInPicture';
            await video.requestPictureInPicture();
            if (document.pictureInPictureElement) {
              break;
            }
          } catch (e) {
            result.error = e && e.name ? String(e.name) : String(e);
          }
        }

        result.after = Boolean(document.pictureInPictureElement);
        return result;
      }
    }, (results) => {
      if (chrome.runtime && chrome.runtime.lastError) {
        sendResponse({
          ok: false,
          reason: chrome.runtime.lastError.message || 'executeScript-failed'
        });
        return;
      }
      const first = Array.isArray(results) && results.length > 0 ? results[0] : null;
      const payload = first && typeof first.result === 'object' ? first.result : null;
      sendResponse(payload || { ok: false, reason: 'no-result' });
    });
    return true;
  } else if (request.action === 'iqiyiTryEnterPiPInMainWorld') {
    const senderTab = sender && sender.tab ? sender.tab : null;
    const tabId = senderTab && typeof senderTab.id === 'number' ? senderTab.id : null;
    if (typeof tabId !== 'number') {
      sendResponse({ ok: false, reason: 'no-tab' });
      return;
    }
    const frameId = sender && typeof sender.frameId === 'number' ? sender.frameId : 0;
    chrome.scripting.executeScript({
      target: { tabId: tabId, frameIds: [frameId] },
      world: 'MAIN',
      func: async () => {
        const result = {
          ok: true,
          before: Boolean(document.pictureInPictureElement),
          after: Boolean(document.pictureInPictureElement),
          attempted: false,
          used: '',
          error: ''
        };

        const callMethod = async (obj, candidates) => {
          if (!obj || typeof obj !== 'object' || !Array.isArray(candidates)) {
            return false;
          }
          for (const candidate of candidates) {
            const name = typeof candidate === 'string' ? candidate : candidate && candidate.name;
            const args = (candidate && Array.isArray(candidate.args)) ? candidate.args : [];
            if (typeof obj[name] !== 'function') {
              continue;
            }
            try {
              const output = obj[name].apply(obj, args);
              if (output && typeof output.then === 'function') {
                await output;
              }
              result.attempted = true;
              result.used = `method:${name}${args.length ? '(args)' : ''}`;
              if (document.pictureInPictureElement) {
                return true;
              }
            } catch (e) {
              // Try next candidate.
            }
          }
          return false;
        };

        const trySetPiPProperty = (obj) => {
          if (!obj || typeof obj !== 'object' || !('pictureInPicture' in obj)) {
            return false;
          }
          try {
            obj.pictureInPicture = true;
            result.attempted = true;
            result.used = 'property:pictureInPicture';
            return Boolean(document.pictureInPictureElement);
          } catch (e) {
            return false;
          }
        };

        const getPrimaryVideo = () => {
          const selectors = [
            '.iqp-player-videolayer video',
            '.iqp-player video',
            '#flashbox video',
            '#player video',
            'video'
          ];
          for (const selector of selectors) {
            const nodes = Array.from(document.querySelectorAll(selector));
            for (const node of nodes) {
              if (!(node instanceof HTMLVideoElement)) {
                continue;
              }
              if (node.matches('.player_outer_video video') || node.getAttribute('outer') === '1') {
                continue;
              }
              return node;
            }
          }
          return null;
        };

        const roots = [];
        const rootSet = new WeakSet();
        const pushRoot = (obj) => {
          if (!obj || typeof obj !== 'object') {
            return;
          }
          if (rootSet.has(obj)) {
            return;
          }
          rootSet.add(obj);
          roots.push(obj);
        };

        try {
          if (window.webPlay &&
              window.webPlay.wonder &&
              typeof window.webPlay.wonder.getPlayer === 'function') {
            pushRoot(window.webPlay.wonder.getPlayer());
          }
        } catch (e) {}
        try {
          if (window.webPlay &&
              window.webPlay.wonder &&
              typeof window.webPlay.wonder.getPCBridge === 'function') {
            pushRoot(window.webPlay.wonder.getPCBridge());
          }
        } catch (e) {}
        try {
          if (window.webPlay &&
              window.webPlay.wonder &&
              window.webPlay.wonder._manager &&
              window.webPlay.wonder._manager._players &&
              typeof window.webPlay.wonder._manager._players === 'object') {
            Object.values(window.webPlay.wonder._manager._players).forEach((player) => {
              pushRoot(player);
            });
          }
        } catch (e) {}

        const collectLoaderPlayers = async (timeoutMs) => {
          if (!window.QiyiPlayerLoader || typeof window.QiyiPlayerLoader.ready !== 'function') {
            return;
          }
          await new Promise((resolve) => {
            let done = false;
            const finish = () => {
              if (done) {
                return;
              }
              done = true;
              resolve();
            };
            const timer = setTimeout(finish, Math.max(120, Number(timeoutMs || 260)));
            try {
              window.QiyiPlayerLoader.ready((manager) => {
                try {
                  if (manager && typeof manager === 'object') {
                    pushRoot(manager);
                    if (manager._players && typeof manager._players === 'object') {
                      Object.values(manager._players).forEach((player) => {
                        pushRoot(player);
                      });
                    }
                    if (typeof manager.getPlayerById === 'function') {
                      ['mainContent', 'root', 'player', '5fcma2g3wzdcvv2smpk4d3h3vq'].forEach((id) => {
                        try {
                          pushRoot(manager.getPlayerById(id));
                        } catch (e) {}
                      });
                    }
                  }
                } catch (e) {
                  // Ignore manager traversal errors.
                } finally {
                  clearTimeout(timer);
                  finish();
                }
              });
            } catch (e) {
              clearTimeout(timer);
              finish();
            }
          });
        };

        await collectLoaderPlayers(280);
        if (!roots.length) {
          await collectLoaderPlayers(360);
        }

        const methodCandidates = [
          { name: 'openPictureInPicture', args: [] },
          { name: 'toggleBrowserPicInPic', args: [] },
          { name: 'togglePictureInPicture', args: [] },
          { name: 'togglePip', args: [] },
          { name: 'enterPictureInPicture', args: [] },
          { name: 'setSmallWindowMode', args: [true] }
        ];

        const nestedKeys = [
          '_playBack',
          'playBack',
          '_player',
          'player',
          '_playProxy',
          'videoInfo',
          '_videoInfo'
        ];

        for (const root of roots) {
          if (document.pictureInPictureElement) {
            break;
          }
          await callMethod(root, methodCandidates);
          if (document.pictureInPictureElement) {
            break;
          }
          trySetPiPProperty(root);
          if (document.pictureInPictureElement) {
            break;
          }
          for (const key of nestedKeys) {
            if (!root || typeof root !== 'object') {
              continue;
            }
            const nested = root[key];
            if (!nested || typeof nested !== 'object') {
              continue;
            }
            await callMethod(nested, methodCandidates);
            if (document.pictureInPictureElement) {
              break;
            }
            trySetPiPProperty(nested);
            if (document.pictureInPictureElement) {
              break;
            }
          }
        }

        if (!document.pictureInPictureElement) {
          const video = getPrimaryVideo();
          if (video && typeof video.requestPictureInPicture === 'function') {
            try {
              if (video.disablePictureInPicture) {
                video.disablePictureInPicture = false;
              }
              if (video.hasAttribute('disablepictureinpicture')) {
                video.removeAttribute('disablepictureinpicture');
              }
              result.attempted = true;
              result.used = 'video.requestPictureInPicture';
              await video.requestPictureInPicture();
            } catch (e) {
              result.error = e && e.name ? String(e.name) : String(e);
            }
          }
        }

        result.after = Boolean(document.pictureInPictureElement);
        return result;
      }
    }, (results) => {
      if (chrome.runtime && chrome.runtime.lastError) {
        sendResponse({
          ok: false,
          reason: chrome.runtime.lastError.message || 'executeScript-failed'
        });
        return;
      }
      const first = Array.isArray(results) && results.length > 0 ? results[0] : null;
      const payload = first && typeof first.result === 'object' ? first.result : null;
      sendResponse(payload || { ok: false, reason: 'no-result' });
    });
    return true;
  } else if (request.action === 'iqiyiSetupAutoPiPInMainWorld') {
    const senderTab = sender && sender.tab ? sender.tab : null;
    const tabId = senderTab && typeof senderTab.id === 'number' ? senderTab.id : null;
    if (typeof tabId !== 'number') {
      sendResponse({ ok: false, reason: 'no-tab' });
      return;
    }
    const frameId = sender && typeof sender.frameId === 'number' ? sender.frameId : 0;
    chrome.scripting.executeScript({
      target: { tabId: tabId, frameIds: [frameId] },
      world: 'MAIN',
      func: () => {
        const result = {
          ok: true,
          bound: false,
          preparedVideos: 0,
          error: ''
        };
        try {
          if (window.__lumnoIqiyiAutoPipSetupDone2026) {
            result.bound = true;
            return result;
          }

          const getPrimaryVideo = () => {
            const selectors = [
              '.iqp-player-videolayer video',
              '.iqp-player video',
              '#flashbox video',
              '#player video',
              'video'
            ];
            for (const selector of selectors) {
              const nodes = Array.from(document.querySelectorAll(selector));
              for (const node of nodes) {
                if (!(node instanceof HTMLVideoElement)) {
                  continue;
                }
                if (node.matches('.player_outer_video video') || node.getAttribute('outer') === '1') {
                  continue;
                }
                return node;
              }
            }
            return null;
          };

          const prepareVideo = (video) => {
            if (!(video instanceof HTMLVideoElement)) {
              return false;
            }
            if (video.matches('.player_outer_video video') || video.getAttribute('outer') === '1') {
              return false;
            }
            try {
              video.autoPictureInPicture = true;
            } catch (e) {}
            try {
              if (video.disablePictureInPicture) {
                video.disablePictureInPicture = false;
              }
            } catch (e) {}
            try {
              if (video.hasAttribute('disablepictureinpicture')) {
                video.removeAttribute('disablepictureinpicture');
              }
            } catch (e) {}
            return true;
          };

          const prepareExistingVideos = () => {
            let count = 0;
            const list = Array.from(document.querySelectorAll('video'));
            for (const video of list) {
              if (prepareVideo(video)) {
                count += 1;
              }
            }
            return count;
          };

          const mediaSession = ('mediaSession' in navigator) ? navigator.mediaSession : null;
          const proto = mediaSession ? Object.getPrototypeOf(mediaSession) : null;
          const nativeSetActionHandler = proto && typeof proto.setActionHandler === 'function'
            ? proto.setActionHandler
            : null;

          if (mediaSession && nativeSetActionHandler) {
            nativeSetActionHandler.call(mediaSession, 'enterpictureinpicture', async () => {
              const video = getPrimaryVideo();
              if (!video || typeof video.requestPictureInPicture !== 'function') {
                return;
              }
              try {
                prepareVideo(video);
                if (!video.paused || document.visibilityState === 'hidden') {
                  await video.requestPictureInPicture();
                }
              } catch (e) {}
            });
            nativeSetActionHandler.call(mediaSession, 'leavepictureinpicture', async () => {
              try {
                if (document.pictureInPictureElement && typeof document.exitPictureInPicture === 'function') {
                  await document.exitPictureInPicture();
                }
              } catch (e) {}
            });
            result.bound = true;
          }

          result.preparedVideos = prepareExistingVideos();

          if (!window.__lumnoIqiyiAutoPipObserver2026) {
            const observer = new MutationObserver(() => {
              prepareExistingVideos();
            });
            observer.observe(document.documentElement || document.body, {
              childList: true,
              subtree: true
            });
            window.__lumnoIqiyiAutoPipObserver2026 = observer;
          }

          window.__lumnoIqiyiAutoPipSetupDone2026 = true;
          return result;
        } catch (e) {
          result.ok = false;
          result.error = e && e.message ? String(e.message) : String(e);
          return result;
        }
      }
    }, (results) => {
      if (chrome.runtime && chrome.runtime.lastError) {
        sendResponse({
          ok: false,
          reason: chrome.runtime.lastError.message || 'executeScript-failed'
        });
        return;
      }
      const first = Array.isArray(results) && results.length > 0 ? results[0] : null;
      const payload = first && typeof first.result === 'object' ? first.result : null;
      sendResponse(payload || { ok: false, reason: 'no-result' });
    });
    return true;
  } else if (request.action === 'forceExitPiPInMainWorld') {
    const senderTab = sender && sender.tab ? sender.tab : null;
    const tabId = senderTab && typeof senderTab.id === 'number' ? senderTab.id : null;
    if (typeof tabId !== 'number') {
      sendResponse({ ok: false, reason: 'no-tab' });
      return;
    }
    const frameId = sender && typeof sender.frameId === 'number' ? sender.frameId : 0;
    chrome.scripting.executeScript({
      target: { tabId: tabId, frameIds: [frameId] },
      world: 'MAIN',
      func: async () => {
        const result = {
          ok: true,
          before: Boolean(document.pictureInPictureElement),
          after: Boolean(document.pictureInPictureElement),
          attemptedExit: false,
          error: ''
        };
        try {
          if (document.pictureInPictureElement && typeof document.exitPictureInPicture === 'function') {
            result.attemptedExit = true;
            await document.exitPictureInPicture();
          }
        } catch (e) {
          result.error = e && e.name ? String(e.name) : String(e);
        }
        result.after = Boolean(document.pictureInPictureElement);
        return result;
      }
    }, (results) => {
      if (chrome.runtime && chrome.runtime.lastError) {
        sendResponse({
          ok: false,
          reason: chrome.runtime.lastError.message || 'executeScript-failed'
        });
        return;
      }
      const first = Array.isArray(results) && results.length > 0 ? results[0] : null;
      const payload = first && typeof first.result === 'object' ? first.result : null;
      sendResponse(payload || { ok: false, reason: 'no-result' });
    });
    return true;
  } else if (request.action === 'ytForceExitPiPInMainWorld') {
    const senderTab = sender && sender.tab ? sender.tab : null;
    const tabId = senderTab && typeof senderTab.id === 'number' ? senderTab.id : null;
    if (typeof tabId !== 'number') {
      sendResponse({ ok: false, reason: 'no-tab' });
      return;
    }
    const frameId = sender && typeof sender.frameId === 'number' ? sender.frameId : 0;
    chrome.scripting.executeScript({
      target: { tabId: tabId, frameIds: [frameId] },
      world: 'MAIN',
      func: async () => {
        const result = {
          ok: true,
          before: Boolean(document.pictureInPictureElement),
          after: Boolean(document.pictureInPictureElement),
          attemptedExit: false,
          unminimized: false,
          error: ''
        };

        const getPlayer = () => {
          const moviePlayer = document.getElementById('movie_player');
          if (moviePlayer && typeof moviePlayer === 'object') {
            return moviePlayer;
          }
          const ytdPlayer = document.querySelector('ytd-player');
          if (ytdPlayer && typeof ytdPlayer.getPlayer === 'function') {
            try {
              return ytdPlayer.getPlayer();
            } catch (e) {
              return null;
            }
          }
          return null;
        };

        const callPlayerMethod = (player, name, args) => {
          if (!player || typeof player[name] !== 'function') {
            return false;
          }
          try {
            player[name].apply(player, Array.isArray(args) ? args : []);
            return true;
          } catch (e) {
            return false;
          }
        };

        const forceUnminimize = () => {
          const player = getPlayer();
          if (!player) {
            return false;
          }
          let changed = false;
          changed = callPlayerMethod(player, 'setMinimized', [false]) || changed;
          changed = callPlayerMethod(player, 'setMinimized', [0]) || changed;
          changed = callPlayerMethod(player, 'setMinimized', [null]) || changed;
          changed = callPlayerMethod(player, 'setMinimized', []) || changed;
          return changed;
        };

        result.unminimized = forceUnminimize();
        try {
          if (document.pictureInPictureElement && typeof document.exitPictureInPicture === 'function') {
            result.attemptedExit = true;
            await document.exitPictureInPicture();
          }
        } catch (e) {
          result.error = e && e.name ? String(e.name) : String(e);
        }
        result.unminimized = forceUnminimize() || result.unminimized;
        result.after = Boolean(document.pictureInPictureElement);
        return result;
      }
    }, (results) => {
      if (chrome.runtime && chrome.runtime.lastError) {
        sendResponse({
          ok: false,
          reason: chrome.runtime.lastError.message || 'executeScript-failed'
        });
        return;
      }
      const first = Array.isArray(results) && results.length > 0 ? results[0] : null;
      const payload = first && typeof first.result === 'object' ? first.result : null;
      sendResponse(payload || { ok: false, reason: 'no-result' });
    });
    return true;
  } else if (request.action === 'searchOrNavigate') {
    const query = request.query ? String(request.query) : '';
    const forceSearch = Boolean(request.forceSearch);
    loadShortcutRules().then((rules) => {
      const shortcutUrl = getShortcutUrl(query, rules);
      if (shortcutUrl) {
        chrome.tabs.create({ url: shortcutUrl });
        sendResponse({ ok: true, url: shortcutUrl });
        return;
      }
      const directUrl = !forceSearch ? getDirectNavigationUrl(query) : '';
      if (directUrl) {
        chrome.tabs.create({ url: directUrl });
        sendResponse({ ok: true, url: directUrl });
      } else {
        // It's a search query - use browser default search engine
        const fallbackUrl = buildDefaultSearchUrl(query);
        if (chrome && chrome.search && typeof chrome.search.query === 'function') {
          markPendingSearchTab(null);
          try {
            chrome.search.query({ text: query, disposition: 'NEW_TAB' }, () => {
              if (chrome.runtime && chrome.runtime.lastError) {
                pendingSearchAt = 0;
                pendingSearchTabId = null;
                chrome.tabs.create({ url: fallbackUrl });
                sendResponse({ ok: true, url: fallbackUrl });
                return;
              }
              sendResponse({ ok: true, url: fallbackUrl });
            });
            return;
          } catch (e) {
            pendingSearchAt = 0;
            pendingSearchTabId = null;
          }
        }
        chrome.tabs.create({ url: fallbackUrl });
        sendResponse({ ok: true, url: fallbackUrl });
      }
    });
    return true;
  } else if (request.action === (SEARCH_PROTOCOL.SEARCH_ACTION_GET_SUGGESTIONS || 'getSearchSuggestions')) {
    const query = request.query;
    const mode = normalizeSearchSuggestionsMode(request.mode);
    getSearchSuggestions(query, {
      mode: mode,
      context: request.context
    }).then(suggestions => {
      sendResponse({
        mode: mode,
        suggestions: suggestions
      });
    }).catch(() => {
      sendResponse({
        mode: mode,
        suggestions: []
      });
    });
    return true; // Keep the message channel open for async response
  } else if (request.action === 'deleteHistoryUrl') {
    const targetUrl = typeof request.url === 'string' ? request.url : '';
    if (!targetUrl) {
      sendResponse({ ok: false, reason: 'invalid-url' });
      return;
    }
    if (!chrome.history || typeof chrome.history.deleteUrl !== 'function') {
      sendResponse({ ok: false, reason: 'history-api-unavailable' });
      return;
    }
    chrome.history.deleteUrl({ url: targetUrl }, () => {
      if (chrome.runtime && chrome.runtime.lastError) {
        sendResponse({ ok: false, reason: chrome.runtime.lastError.message || 'delete-history-failed' });
        return;
      }
      sendResponse({ ok: true, url: targetUrl });
    });
    return true;
  } else if (request.action === 'getTabsForOverlay') {
    ensureTabSwitchStatsLoaded()
      .catch(() => {})
      .finally(() => {
        const currentTabId = sender && sender.tab && typeof sender.tab.id === 'number'
          ? sender.tab.id
          : null;
        chrome.tabs.query({}, (tabs) => {
          const normalizedTabs = (Array.isArray(tabs) ? tabs : [])
            .map((tab) => {
              const resolvedUrl = getResolvedTabUrl(tab);
              return {
                ...tab,
                url: resolvedUrl || ''
              };
            })
            .filter((tab) => (
              tab &&
              tab.incognito !== true
            ));
          syncTabSwitchStatsFromTabList(normalizedTabs);
          const sortedTabs = sortTabsForOverlay(normalizedTabs);
          tabOverlayFetchSeq += 1;
          const withSeq = sortedTabs.map((tab) => ({
            ...tab,
            _xTabFetchSeq: tabOverlayFetchSeq
          }));
          sendResponse({ tabs: withSeq, currentTabId: currentTabId });
        });
      });
    return true;
  } else if (request.action === 'getSiteSearchProviders') {
    loadSiteSearchProviders().then((items) => {
      sendResponse({ items: items });
    });
    return true;
  } else if (request.action === 'runSiteSearchProviderQuery') {
    runInteractiveSiteSearchProvider(
      request.provider,
      request.query,
      sender,
      request.disposition
    ).then((result) => {
      sendResponse(result);
    });
    return true;
  } else if (request.action === 'getShortcutRules') {
    loadShortcutRules().then((items) => {
      sendResponse({ items: items });
    });
    return true;
  } else if (request.action === 'trackSearchTab') {
    if (typeof request.tabId === 'number') {
      markPendingSearchTab(request.tabId);
      sendResponse({ ok: true });
    } else {
      sendResponse({ ok: false });
    }
    return true;
  } else if (request.action === 'getLocaleMessages') {
    const locale = normalizeLocaleForMessages(request.locale);
    const localePath = chrome.runtime.getURL(`public/_locales/${locale}/messages.json`);
    fetch(localePath)
      .then((response) => response.json())
      .then((messages) => {
        sendResponse({ messages: messages || {} });
      })
      .catch(() => {
        sendResponse({ messages: {} });
      });
    return true;
  } else if (request.action === 'getFileSchemeAccessStatus') {
    checkFileSchemeAccess((isAllowed) => {
      sendResponse({
        ok: true,
        allowed: isAllowed === true,
        supported: isAllowed !== null,
        detailsUrl: getExtensionDetailsUrl()
      });
    });
    return true;
  } else if (request.action === 'openOptionsPage') {
    openExtensionOptionsPage((ok) => {
      sendResponse({ ok: ok !== false });
    });
    return true;
  } else if (request.action === 'closeOtherTabsForOverlay') {
    const senderTab = sender && sender.tab ? sender.tab : null;
    if (!senderTab || typeof senderTab.id !== 'number' || typeof senderTab.windowId !== 'number') {
      sendResponse({ ok: false, reason: 'invalid-sender' });
      return;
    }
    chrome.tabs.query({ windowId: senderTab.windowId }, (tabs) => {
      if (chrome.runtime && chrome.runtime.lastError) {
        sendResponse({ ok: false, reason: chrome.runtime.lastError.message || 'query-failed' });
        return;
      }
      const ungroupedId = chrome && chrome.tabGroups && typeof chrome.tabGroups.TAB_GROUP_ID_NONE === 'number'
        ? chrome.tabGroups.TAB_GROUP_ID_NONE
        : -1;
      const toCloseIds = (Array.isArray(tabs) ? tabs : [])
        .filter((tab) => {
          if (!tab || typeof tab.id !== 'number') {
            return false;
          }
          if (tab.id === senderTab.id) {
            return false;
          }
          if (tab.pinned) {
            return false;
          }
          if (typeof tab.groupId === 'number' && tab.groupId !== ungroupedId) {
            return false;
          }
          return true;
        })
        .map((tab) => tab.id);
      if (toCloseIds.length <= 0) {
        sendResponse({ ok: true, closedCount: 0 });
        return;
      }
      chrome.tabs.remove(toCloseIds, () => {
        if (chrome.runtime && chrome.runtime.lastError) {
          sendResponse({ ok: false, reason: chrome.runtime.lastError.message || 'remove-failed' });
          return;
        }
        sendResponse({ ok: true, closedCount: toCloseIds.length });
      });
    });
    return true;
  } else if (request.action === 'openExtensionShortcutsPage') {
    openExtensionShortcutsPage((ok) => {
      sendResponse({ ok: ok !== false });
    });
    return true;
  } else if (request.action === 'openBookmarkManager') {
    openBookmarkManagerPage().then((url) => {
      sendResponse({ ok: true, url: url });
    }).catch(() => {
      sendResponse({ ok: false });
    });
    return true;
  } else if (request.action === 'createTab') {
    const targetUrl = typeof request.url === 'string' ? request.url : '';
    if (!targetUrl) {
      sendResponse({ ok: false });
      return;
    }
    chrome.tabs.create({ url: targetUrl }, () => {
      sendResponse({ ok: !(chrome.runtime && chrome.runtime.lastError) });
    });
    return true;
  } else if (request.action === 'openNewTab') {
    const newtabUrl = chrome.runtime.getURL('src/newtab/newtab.html?focus=1');
    chrome.tabs.create({ url: newtabUrl }, () => {
      sendResponse({ ok: !(chrome.runtime && chrome.runtime.lastError) });
    });
    return true;
  } else if (request.action === 'openExtensionDetailsPage') {
    const detailsUrl = getExtensionDetailsUrl();
    chrome.tabs.create({ url: detailsUrl }, () => {
      sendResponse({ ok: !(chrome.runtime && chrome.runtime.lastError), url: detailsUrl });
    });
    return true;
  } else if (request.action === 'resolveFaviconCandidates') {
    const targetUrl = request.url || '';
    const hostOverride = request.host || '';
    const fallbackUrl = request.fallbackUrl || '';
    const preferredTheme = request.preferredTheme || '';
    const options = {
      includeChromeFallback: request.excludeChromeFallback ? false : true
    };
    resolveFaviconCandidates(targetUrl, hostOverride, fallbackUrl, preferredTheme, options).then((urls) => {
      sendResponse({ urls: Array.isArray(urls) ? urls : [] });
    }).catch(() => {
      sendResponse({ urls: [] });
    });
    return true;
  } else if (request.action === 'getFaviconData') {
    const targetUrl = request.url || '';
    if (!targetUrl || typeof targetUrl !== 'string' || targetUrl.startsWith('data:') || isBlockedLocalFaviconUrl(targetUrl)) {
      if (targetUrl && isBlockedLocalFaviconUrl(targetUrl)) {
        logBlockedLocalFavicon(targetUrl, 'message:getFaviconData');
      }
      sendResponse({ data: '' });
      return;
    }
    try {
      const targetHost = new URL(targetUrl).hostname;
      if (shouldBlockFaviconForHost(targetHost)) {
        sendResponse({ data: '' });
        return;
      }
    } catch (e) {
      // Ignore parse failures and continue with non-local handling.
    }
    fetchFaviconData(targetUrl).then((dataUrl) => {
      sendResponse({ data: dataUrl || '' });
    }).catch(() => {
      sendResponse({ data: '' });
    });
    return true;
  }
  sendResponse({ ok: false });
  return;
});

let shortcutRulesCache = null;
let shortcutRulesPromise = null;
let siteSearchCache = null;
let siteSearchPromise = null;
let searchBlacklistCache = null;
let searchBlacklistPromise = null;
const SEARCH_ENGINE_SUGGEST_TIMEOUT_MS = 180;
const LOCAL_SUGGEST_SOURCE_TIMEOUT_MS = 800;
const HISTORY_FALLBACK_CACHE_TTL_MS = 45 * 1000;
const TOP_SITES_CACHE_TTL_MS = 30 * 1000;
const BOOKMARK_TREE_CACHE_TTL_MS = 2 * 60 * 1000;
let historyFallbackCache = {
  expiresAt: 0,
  items: []
};
let topSitesCache = {
  expiresAt: 0,
  items: []
};
let bookmarkTreeIndexCache = {
  expiresAt: 0,
  map: null
};
let bookmarkItemsCache = {
  expiresAt: 0,
  items: []
};
let bookmarkTreeIndexPromise = null;
let bookmarkItemsPromise = null;
let bookmarkTreeCacheListenersBound = false;
const SITE_SEARCH_STORAGE_KEY = STORAGE_KEYS.SITE_SEARCH_STORAGE_KEY || '_x_extension_site_search_custom_2024_unique_';
const SITE_SEARCH_DISABLED_STORAGE_KEY = STORAGE_KEYS.SITE_SEARCH_DISABLED_STORAGE_KEY || '_x_extension_site_search_disabled_2024_unique_';
const SEARCH_BLACKLIST_STORAGE_KEY = STORAGE_KEYS.SEARCH_BLACKLIST_STORAGE_KEY || '_x_extension_search_blacklist_2026_unique_';
const BLACKLIST_UTILS = globalThis.LumnoBlacklistUtils || {};
const DEFAULT_SEARCH_ENGINE_STORAGE_KEY = STORAGE_KEYS.DEFAULT_SEARCH_ENGINE_STORAGE_KEY || '_x_extension_default_search_engine_2024_unique_';
migrateStorageIfNeeded([
  DOCUMENT_PIP_ENABLED_STORAGE_KEY,
  PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY,
  DEFAULT_SEARCH_ENGINE_STORAGE_KEY,
  OVERLAY_TAB_PRIORITY_STORAGE_KEY,
  TAB_RANK_SCORE_DEBUG_STORAGE_KEY,
  RESTRICTED_ACTION_STORAGE_KEY,
  FALLBACK_SHORTCUT_STORAGE_KEY,
  SEARCH_RESULT_PRIORITY_STORAGE_KEY,
  SITE_SEARCH_STORAGE_KEY,
  SITE_SEARCH_DISABLED_STORAGE_KEY,
  SEARCH_BLACKLIST_STORAGE_KEY
]);
const FAVICON_GOOGLE_SIZE = 128;
const faviconDataCache = new Map();
const faviconPending = new Map();
const titlePinyinCache = new Map();
const faviconResolveCache = new Map();
const faviconResolvePending = new Map();
const blockedLocalFaviconLogCache = new Set();

function logBlockedLocalFavicon(url, source) {
  const key = `${source || 'unknown'}::${String(url || '')}`;
  if (blockedLocalFaviconLogCache.has(key)) {
    return;
  }
  blockedLocalFaviconLogCache.add(key);
  console.log('[Lumno][favicon-blocked-local]', {
    source: source || 'unknown',
    url: String(url || '')
  });
}

let defaultSearchEngineState = {
  id: '',
  name: '',
  host: '',
  searchTemplate: '',
  updatedAt: 0
};

let pendingSearchAt = 0;
let pendingSearchTabId = null;

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function getGoogleFaviconUrl(hostname) {
  return SEARCH_FAVICON_UTILS.getGoogleFaviconUrl(hostname, {
    runtimeGetUrl: chrome && chrome.runtime && typeof chrome.runtime.getURL === 'function'
      ? chrome.runtime.getURL.bind(chrome.runtime)
      : null,
    size: FAVICON_GOOGLE_SIZE
  });
}

function getFaviconIsUrl(hostname) {
  return SEARCH_FAVICON_UTILS.getFaviconIsUrl(hostname);
}

function normalizeHost(hostname) {
  return SEARCH_ENGINE_UTILS.normalizeSearchEngineHost(hostname);
}

function getSearchEngineByHostname(hostname) {
  return SEARCH_ENGINE_UTILS.getSearchEngineByHostname(hostname);
}

function getSearchEngineById(id) {
  return SEARCH_ENGINE_UTILS.getSearchEngineById(id);
}

function setDefaultSearchEngineState(nextState, shouldPersist) {
  if (!nextState || !nextState.id) {
    return;
  }
  const engine = getSearchEngineById(nextState.id);
  const updated = {
    id: nextState.id,
    name: nextState.name || '',
    host: nextState.host || '',
    searchTemplate: nextState.searchTemplate || (engine ? engine.searchTemplate : ''),
    updatedAt: nextState.updatedAt || Date.now()
  };
  defaultSearchEngineState = updated;
  if (shouldPersist && storageArea) {
    storageArea.set({ [DEFAULT_SEARCH_ENGINE_STORAGE_KEY]: updated });
  }
}

function loadDefaultSearchEngineState() {
  if (!storageArea) {
    return;
  }
  storageArea.get([DEFAULT_SEARCH_ENGINE_STORAGE_KEY], (result) => {
    const stored = result ? result[DEFAULT_SEARCH_ENGINE_STORAGE_KEY] : null;
    if (stored && stored.id) {
      setDefaultSearchEngineState(stored, false);
    }
  });
}

function isSearchEngineResultUrl(url) {
  return SEARCH_ENGINE_UTILS.isSearchEngineResultUrl(url);
}

function updateDefaultSearchEngineFromUrl(url) {
  if (!url || !isSearchEngineResultUrl(url)) {
    return false;
  }
  try {
    const parsedUrl = new URL(url);
    const engine = getSearchEngineByHostname(parsedUrl.hostname);
    if (!engine) {
      return false;
    }
    setDefaultSearchEngineState({
      id: engine.id,
      name: engine.name,
      host: normalizeHost(parsedUrl.hostname),
      searchTemplate: engine.searchTemplate,
      updatedAt: Date.now()
    }, true);
    return true;
  } catch (e) {
    return false;
  }
}

function buildDefaultSearchUrl(query) {
  const engine = getSearchEngineById(defaultSearchEngineState.id);
  return SEARCH_ENGINE_UTILS.buildSearchEngineUrl(engine || defaultSearchEngineState.id, query);
}

function isNumericHostLike(hostname) {
  if (!hostname) {
    return false;
  }
  if (!/^(\d{1,3})(\.\d{1,3}){0,3}$/.test(hostname)) {
    return false;
  }
  const parts = hostname.split('.');
  if (parts.length < 1 || parts.length > 4) {
    return false;
  }
  if (parts.length === 1) {
    return parts[0] === '127';
  }
  return parts.every((part) => {
    const value = Number(part);
    return Number.isInteger(value) && value >= 0 && value <= 255;
  });
}

function extractHostFromInput(rawInput) {
  const withoutScheme = String(rawInput || '').replace(/^https?:\/\//i, '');
  const authority = withoutScheme.split(/[/?#]/)[0] || '';
  if (!authority) {
    return '';
  }
  if (authority.startsWith('[')) {
    const endBracket = authority.indexOf(']');
    if (endBracket > 1) {
      return authority.slice(1, endBracket).toLowerCase();
    }
    return '';
  }
  if (authority.includes('::') && !authority.includes('.')) {
    return authority.toLowerCase();
  }
  return (authority.split(':')[0] || '').toLowerCase();
}

function isDevHostLike(hostname) {
  if (!hostname) {
    return false;
  }
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return true;
  }
  if (hostname === 'host.docker.internal') {
    return true;
  }
  if (
    hostname.endsWith('.local') ||
    hostname.endsWith('.test') ||
    hostname.endsWith('.localdev') ||
    hostname.endsWith('.internal')
  ) {
    return true;
  }
  return hostname === '::1' || hostname === '0:0:0:0:0:0:0:1';
}

function getDirectNavigationUrl(input) {
  const raw = String(input || '').trim();
  if (!raw) {
    return '';
  }
  const lower = raw.toLowerCase();
  const isInternal = ['chrome://', 'edge://', 'brave://', 'vivaldi://', 'opera://'].some((prefix) =>
    lower.startsWith(prefix)
  );
  let normalizedInput = raw.match(/^(\d{1,3})([.\s]\d{1,3}){0,3}(?::\d{1,5})?(?:[/?#].*)?$/)
    ? raw.replace(/\s+/g, '.').replace(/\.{2,}/g, '.')
    : raw;
  const hostOnly = extractHostFromInput(normalizedInput);
  const isDevHost = isDevHostLike(hostOnly);
  const isNumericLike = isNumericHostLike(hostOnly);
  const looksLikeUrl = (normalizedInput.includes('.') && !normalizedInput.includes(' ')) || isInternal || isDevHost || isNumericLike;
  if (!looksLikeUrl) {
    return '';
  }
  if (hostOnly.includes(':') && !/^https?:\/\//i.test(normalizedInput) && !normalizedInput.startsWith('[')) {
    normalizedInput = `[${normalizedInput}]`;
  }
  if (!isInternal && !normalizedInput.startsWith('http://') && !normalizedInput.startsWith('https://')) {
    return `https://${normalizedInput}`;
  }
  return normalizedInput;
}

function getDefaultSearchEngineThemeUrl() {
  const engine = getSearchEngineById(defaultSearchEngineState.id);
  return SEARCH_ENGINE_UTILS.buildSearchEngineUrl(engine || defaultSearchEngineState.id, 'test');
}

function getDefaultSearchEngineFaviconUrl() {
  if (defaultSearchEngineState.host) {
    return `https://${defaultSearchEngineState.host}/favicon.ico`;
  }
  const engine = getSearchEngineById(defaultSearchEngineState.id);
  if (engine) {
    try {
      const url = SEARCH_ENGINE_UTILS.buildSearchEngineUrl
        ? SEARCH_ENGINE_UTILS.buildSearchEngineUrl(engine, 'test')
        : engine.searchTemplate.replace(/\{query\}/g, encodeURIComponent('test'));
      const host = new URL(url).hostname;
      return `https://${host}/favicon.ico`;
    } catch (e) {
      return '';
    }
  }
  return 'https://www.google.com/favicon.ico';
}

function parseJsonpPayload(text) {
  if (!text) {
    return null;
  }
  const start = text.indexOf('(');
  const end = text.lastIndexOf(')');
  if (start < 0 || end <= start) {
    return null;
  }
  const payload = text.slice(start + 1, end);
  try {
    return JSON.parse(payload);
  } catch (e) {
    return null;
  }
}

function extractJsonArray(text) {
  if (!text) {
    return null;
  }
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start < 0 || end <= start) {
    return null;
  }
  const payload = text.slice(start, end + 1);
  try {
    return JSON.parse(payload);
  } catch (e) {
    return null;
  }
}

async function fetchJson(url) {
  if (!url) {
    return null;
  }
  const response = await fetch(url);
  if (!response || !response.ok) {
    return null;
  }
  return response.json();
}

async function fetchText(url) {
  if (!url) {
    return '';
  }
  const response = await fetch(url);
  if (!response || !response.ok) {
    return '';
  }
  return response.text();
}

async function fetchSearchSuggestionsForEngine(query) {
  const engineId = defaultSearchEngineState.id;
  if (!query || !engineId) {
    return [];
  }
  try {
    if (engineId === 'google') {
      const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`;
      const data = await fetchJson(url);
      if (Array.isArray(data) && Array.isArray(data[1])) {
        return data[1];
      }
      return [];
    }
    if (engineId === 'bing') {
      const url = `https://api.bing.com/osjson.aspx?query=${encodeURIComponent(query)}`;
      const data = await fetchJson(url);
      if (Array.isArray(data) && Array.isArray(data[1])) {
        return data[1];
      }
      return [];
    }
    if (engineId === 'baidu') {
      const url = `https://www.baidu.com/sugrec?ie=utf-8&json=1&prod=pc&wd=${encodeURIComponent(query)}`;
      const data = await fetchJson(url);
      if (data && Array.isArray(data.g)) {
        return data.g.map((item) => item && item.q).filter(Boolean);
      }
      return [];
    }
    if (engineId === 'sogou') {
      const url = `https://sor.html5.qq.com/api/getsug?m=searxng&key=${encodeURIComponent(query)}`;
      const text = await fetchText(url);
      const data = extractJsonArray(text);
      if (Array.isArray(data) && Array.isArray(data[1])) {
        return data[1];
      }
      return [];
    }
    if (engineId === 'so') {
      const url = `https://sug.so.360.cn/suggest?format=json&word=${encodeURIComponent(query)}`;
      const data = await fetchJson(url);
      if (data && Array.isArray(data.result)) {
        return data.result
          .map((item) => (item && (item.word || item.w)) || '')
          .filter(Boolean);
      }
      return [];
    }
    if (engineId === 'duckduckgo') {
      const url = `https://duckduckgo.com/ac/?type=list&q=${encodeURIComponent(query)}`;
      const data = await fetchJson(url);
      if (Array.isArray(data)) {
        if (Array.isArray(data[1])) {
          return data[1];
        }
        return data.map((item) => item && item.phrase).filter(Boolean);
      }
      return [];
    }
    if (engineId === 'yandex') {
      const url = `https://suggest.yandex.com/suggest-ff.cgi?part=${encodeURIComponent(query)}`;
      const data = await fetchJson(url);
      if (Array.isArray(data) && Array.isArray(data[1])) {
        return data[1];
      }
      return [];
    }
    if (engineId === 'quark') {
      const url = `https://sugs.m.sm.cn/web?q=${encodeURIComponent(query)}`;
      const data = await fetchJson(url);
      if (data && Array.isArray(data.r)) {
        return data.r.map((item) => item && item.w).filter(Boolean);
      }
      return [];
    }
    if (engineId === 'shenma') {
      const url = `https://sugs.m.sm.cn/web?q=${encodeURIComponent(query)}`;
      const data = await fetchJson(url);
      if (data && Array.isArray(data.r)) {
        return data.r.map((item) => item && item.w).filter(Boolean);
      }
      return [];
    }
    if (engineId === 'yahoo') {
      const url = `https://search.yahoo.com/sugg/gossip/gossip-us-ura/?output=sd1&command=${encodeURIComponent(query)}`;
      const text = await fetchText(url);
      const data = parseJsonpPayload(text) || extractJsonArray(text);
      if (Array.isArray(data)) {
        if (Array.isArray(data[1])) {
          return data[1];
        }
        if (data[0] && Array.isArray(data[0])) {
          return data[0];
        }
      }
      if (data && Array.isArray(data.gossip && data.gossip.results)) {
        return data.gossip.results.map((item) => item && item.key).filter(Boolean);
      }
      return [];
    }
    return [];
  } catch (e) {
    return [];
  }
}

function markPendingSearchTab(tabId) {
  pendingSearchAt = Date.now();
  pendingSearchTabId = typeof tabId === 'number' ? tabId : null;
}

loadDefaultSearchEngineState();

if (chrome && chrome.tabs) {
  chrome.tabs.onCreated.addListener((tab) => {
    if (!pendingSearchAt || !tab || typeof tab.id !== 'number') {
      return;
    }
    if (Date.now() - pendingSearchAt > 5000) {
      return;
    }
    pendingSearchTabId = tab.id;
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (!changeInfo || !changeInfo.url) {
      return;
    }
    if (!pendingSearchAt || (Date.now() - pendingSearchAt > 10000)) {
      return;
    }
    if (pendingSearchTabId !== null && tabId !== pendingSearchTabId) {
      return;
    }
    const updated = updateDefaultSearchEngineFromUrl(changeInfo.url);
    if (updated) {
      pendingSearchTabId = null;
      pendingSearchAt = 0;
    }
  });
}

function normalizeLocaleForMessages(locale) {
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

function isLocalNetworkHost(hostname) {
  const host = String(hostname || '').trim().toLowerCase().replace(/^\[|\]$/g, '');
  if (!host) {
    return false;
  }
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host === 'host.docker.internal'
  ) {
    return true;
  }
  if (/^\d{1,3}(?:\.\d{1,3}){0,2}$/.test(host)) {
    const shortParts = host.split('.').map((part) => Number(part));
    if (shortParts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)) {
      return true;
    }
  }
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
    const parts = host.split('.').map((part) => Number(part));
    if (parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
      return false;
    }
    if (
      parts[0] === 0 ||
      parts[0] === 10 ||
      parts[0] === 127 ||
      (parts[0] === 169 && parts[1] === 254)
    ) {
      return true;
    }
    if (parts[0] === 192 && parts[1] === 168) {
      return true;
    }
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
      return true;
    }
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) {
      return true;
    }
    return false;
  }
  const ipv6 = host.split('%')[0];
  if (
    ipv6 === '::1' ||
    ipv6 === '0:0:0:0:0:0:0:1' ||
    ipv6 === '::' ||
    /^fe[89ab][0-9a-f]*:/i.test(ipv6) ||
    /^[fd][0-9a-f]{1,3}:/i.test(ipv6)
  ) {
    return true;
  }
  const mappedIpv4 = ipv6.match(/::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mappedIpv4 && mappedIpv4[1]) {
    return isLocalNetworkHost(mappedIpv4[1]);
  }
  return false;
}

function isSuspiciousLocalFaviconHost(hostname) {
  const host = String(hostname || '').trim().toLowerCase().replace(/^\[|\]$/g, '');
  if (!host) {
    return false;
  }
  const ipv6 = host.split('%')[0];
  if (host.includes(':') || ipv6.includes(':')) {
    return false;
  }
  if (/^\d{1,3}(?:\.\d{1,3}){0,3}$/.test(host)) {
    return false;
  }
  if (!host.includes('.')) {
    return /^[a-z0-9-]+$/i.test(host);
  }
  const labels = host.split('.').filter(Boolean);
  if (labels.length < 2) {
    return false;
  }
  const suffix = labels[labels.length - 1];
  return [
    'internal',
    'intern',
    'test',
    'localdev',
    'lan',
    'home',
    'corp',
    'localdomain'
  ].includes(suffix);
}

function shouldBlockFaviconForHost(hostname) {
  return isLocalNetworkHost(hostname) || isSuspiciousLocalFaviconHost(hostname);
}

function isBlockedLocalFaviconUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) {
    return false;
  }
  const decodedRaw = (() => {
    try {
      return decodeURIComponent(raw);
    } catch (e) {
      return raw;
    }
  })();
  const withoutScheme = decodedRaw.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  const authority = withoutScheme.split(/[/?#]/)[0] || '';
  const hostCandidateRaw = authority.includes('@') ? authority.split('@').pop() : authority;
  const hostCandidate = (() => {
    const value = String(hostCandidateRaw || '').trim().toLowerCase();
    if (!value) {
      return '';
    }
    if (value.startsWith('[')) {
      const endBracket = value.indexOf(']');
      if (endBracket > 1) {
        return value.slice(1, endBracket);
      }
    }
    return value.replace(/^\[|\]$/g, '').split(':')[0];
  })();
  if (hostCandidate && shouldBlockFaviconForHost(hostCandidate)) {
    return true;
  }
  try {
    const parsed = new URL(raw);
    const protocol = String(parsed.protocol || '').toLowerCase();
    if ((protocol === 'http:' || protocol === 'https:') && shouldBlockFaviconForHost(parsed.hostname)) {
      return true;
    }
    if (protocol === 'chrome:' && parsed.hostname === 'favicon2') {
      const nested = parsed.searchParams.get('url') || '';
      if (nested) {
        try {
          const nestedUrl = new URL(nested);
          if (shouldBlockFaviconForHost(nestedUrl.hostname)) {
            return true;
          }
        } catch (e) {
          // Ignore malformed nested URL.
        }
      }
    }
  } catch (e) {
    // Ignore malformed URL.
  }
  return false;
}

function normalizeFaviconHost(hostname) {
  return SEARCH_FAVICON_UTILS.normalizeFaviconHost(hostname);
}

function getChromeFaviconUrl(url) {
  if (!url || !/^https?:\/\//i.test(url)) {
    return '';
  }
  return `chrome://favicon2/?size=128&scale_factor=2x&show_fallback_monogram=1&url=${encodeURIComponent(url)}`;
}

function normalizeThemePreference(theme) {
  if (theme === 'dark') {
    return 'dark';
  }
  if (theme === 'light') {
    return 'light';
  }
  return '';
}

function hasThemeTokenInUrl(url, token) {
  const lower = String(url || '').toLowerCase();
  return new RegExp(`(^|[._/-])${token}([._/-]|$)`).test(lower);
}

function shouldSkipThemeUpgradeCandidate(candidateUrl, preferredTheme, currentUrl) {
  const mode = normalizeThemePreference(preferredTheme);
  if (!mode) {
    return false;
  }
  const opposite = mode === 'dark' ? 'light' : 'dark';
  if (hasThemeTokenInUrl(candidateUrl, opposite)) {
    return true;
  }
  const currentHasPreferredToken = hasThemeTokenInUrl(currentUrl, mode);
  const candidateHasPreferredToken = hasThemeTokenInUrl(candidateUrl, mode);
  if (currentHasPreferredToken && !candidateHasPreferredToken) {
    return true;
  }
  return false;
}

function getKnownThemedFaviconCandidates(hostname, preferredTheme) {
  const host = normalizeFaviconHost(hostname);
  const mode = normalizeThemePreference(preferredTheme);
  if (!host) {
    return [];
  }
  if (host === 'lumno.kubai.design') {
    const lumnoIconUrl = (chrome && chrome.runtime && typeof chrome.runtime.getURL === 'function')
      ? chrome.runtime.getURL('public/assets/images/lumno.png')
      : 'https://lumno.kubai.design/favicon.png';
    return [
      { url: lumnoIconUrl, score: 58 }
    ];
  }
  if (host === 'github.com' || host.endsWith('.github.com')) {
    if (mode === 'dark') {
      return [
        { url: 'https://github.githubassets.com/favicons/favicon-dark.svg', score: 60 },
        { url: 'https://github.githubassets.com/favicons/favicon.svg', score: 42 },
        { url: 'https://github.githubassets.com/favicons/favicon.png', score: 36 }
      ];
    }
    if (mode === 'light') {
      return [
        { url: 'https://github.githubassets.com/favicons/favicon.svg', score: 60 },
        { url: 'https://github.githubassets.com/favicons/favicon-dark.svg', score: 40 },
        { url: 'https://github.githubassets.com/favicons/favicon.png', score: 36 }
      ];
    }
    return [
      { url: 'https://github.githubassets.com/favicons/favicon.svg', score: 52 },
      { url: 'https://github.githubassets.com/favicons/favicon-dark.svg', score: 52 },
      { url: 'https://github.githubassets.com/favicons/favicon.png', score: 36 }
    ];
  }
  return [];
}

function getThemeHintScore(url, mediaValue, preferredTheme) {
  const normalizedTheme = normalizeThemePreference(preferredTheme);
  if (!normalizedTheme) {
    return 0;
  }
  let score = 0;
  const lowerMedia = String(mediaValue || '').toLowerCase();
  if (lowerMedia.includes('prefers-color-scheme')) {
    const hasDark = /prefers-color-scheme\s*:\s*dark/.test(lowerMedia);
    const hasLight = /prefers-color-scheme\s*:\s*light/.test(lowerMedia);
    if ((normalizedTheme === 'dark' && hasDark) || (normalizedTheme === 'light' && hasLight)) {
      score += 34;
    }
    if ((normalizedTheme === 'dark' && hasLight) || (normalizedTheme === 'light' && hasDark)) {
      score -= 20;
    }
  }
  const lowerUrl = String(url || '').toLowerCase();
  const hasDarkToken = /(^|[._/-])dark([._/-]|$)/.test(lowerUrl);
  const hasLightToken = /(^|[._/-])light([._/-]|$)/.test(lowerUrl);
  if (normalizedTheme === 'dark') {
    if (hasDarkToken) {
      score += 16;
    }
    if (hasLightToken) {
      score -= 8;
    }
  } else if (normalizedTheme === 'light') {
    if (hasLightToken) {
      score += 16;
    }
    if (hasDarkToken) {
      score -= 8;
    }
  }
  return score;
}

function parseHtmlIconCandidates(html, pageUrl, preferredTheme) {
  if (!html || !pageUrl) {
    return [];
  }
  const normalizedTheme = normalizeThemePreference(preferredTheme);
  const list = [];
  const linkMatches = String(html).match(/<link\b[^>]*>/gi) || [];
  linkMatches.forEach((tag) => {
    const relMatch = tag.match(/\brel\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const hrefMatch = tag.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
    if (!relMatch || !hrefMatch) {
      return;
    }
    const rel = String(relMatch[2] || relMatch[3] || relMatch[4] || '').toLowerCase();
    const hrefRaw = String(hrefMatch[2] || hrefMatch[3] || hrefMatch[4] || '').trim();
    if (!rel.includes('icon') || !hrefRaw) {
      return;
    }
    let href = '';
    try {
      href = new URL(hrefRaw, pageUrl).href;
    } catch (e) {
      return;
    }
    const typeMatch = tag.match(/\btype\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const sizesMatch = tag.match(/\bsizes\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const mediaMatch = tag.match(/\bmedia\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const baseHrefMatch = tag.match(/\bdata-base-href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const type = String(typeMatch ? (typeMatch[2] || typeMatch[3] || typeMatch[4] || '') : '').toLowerCase();
    const sizes = String(sizesMatch ? (sizesMatch[2] || sizesMatch[3] || sizesMatch[4] || '') : '').toLowerCase();
    const media = String(mediaMatch ? (mediaMatch[2] || mediaMatch[3] || mediaMatch[4] || '') : '').toLowerCase();
    let score = 10;
    if (/\bicon\b/.test(rel)) {
      score += 20;
    }
    if (rel.includes('shortcut')) {
      score += 6;
    }
    if (rel.includes('apple-touch-icon')) {
      score += 8;
    }
    if (type.includes('svg') || href.toLowerCase().endsWith('.svg')) {
      score += 14;
    }
    if (href.toLowerCase().includes('favicon')) {
      score += 6;
    }
    score += getThemeHintScore(href, media, normalizedTheme);
    const sizeNumbers = sizes.match(/\d+/g);
    if (sizeNumbers && sizeNumbers.length > 0) {
      const size = Math.max(...sizeNumbers.map((n) => Number(n) || 0));
      score += Math.min(20, Math.floor(size / 8));
    }
    list.push({ url: href, score: score });
    if (normalizedTheme === 'dark' && /\/favicon\.svg(?:[?#].*)?$/i.test(href)) {
      list.push({
        url: href.replace(/\/favicon\.svg([?#].*)?$/i, '/favicon-dark.svg$1'),
        score: score + 14
      });
    }
    if (normalizedTheme === 'light' && /\/favicon-dark\.svg(?:[?#].*)?$/i.test(href)) {
      list.push({
        url: href.replace(/\/favicon-dark\.svg([?#].*)?$/i, '/favicon.svg$1'),
        score: score + 14
      });
    }
    const baseHrefRaw = String(baseHrefMatch ? (baseHrefMatch[2] || baseHrefMatch[3] || baseHrefMatch[4] || '') : '').trim();
    if (baseHrefRaw) {
      let baseHref = '';
      try {
        baseHref = new URL(baseHrefRaw, pageUrl).href;
      } catch (e) {
        baseHref = '';
      }
      if (baseHref) {
        if (normalizedTheme === 'dark') {
          list.push({ url: `${baseHref}-dark.svg`, score: score + 20 });
          list.push({ url: `${baseHref}.svg`, score: score + 8 });
        } else if (normalizedTheme === 'light') {
          list.push({ url: `${baseHref}.svg`, score: score + 20 });
          list.push({ url: `${baseHref}-light.svg`, score: score + 12 });
        } else {
          list.push({ url: `${baseHref}.svg`, score: score + 12 });
          list.push({ url: `${baseHref}-dark.svg`, score: score + 12 });
        }
      }
    }
  });
  return list;
}

function buildFaviconFallbackCandidates(pageUrl, hostOverride, fallbackUrl, preferredTheme, options) {
  const includeChromeFallback = !options || options.includeChromeFallback !== false;
  const normalizedTheme = normalizeThemePreference(preferredTheme);
  const candidates = [];
  const inputUrl = String(pageUrl || '').trim();
  const fallback = String(fallbackUrl || '').trim();
  let host = normalizeFaviconHost(hostOverride || '');
  if (!host && inputUrl) {
    try {
      host = normalizeFaviconHost(new URL(inputUrl).hostname);
    } catch (e) {
      host = '';
    }
  }
  if (host && shouldBlockFaviconForHost(host)) {
    return [];
  }
  if (host) {
    candidates.push(...getKnownThemedFaviconCandidates(host, normalizedTheme));
    if (normalizedTheme === 'dark') {
      candidates.push({ url: `https://${host}/favicon-dark.svg`, score: 34 });
      candidates.push({ url: `https://${host}/favicon.svg`, score: 28 });
      candidates.push({ url: `https://${host}/favicon-light.svg`, score: 16 });
    } else if (normalizedTheme === 'light') {
      candidates.push({ url: `https://${host}/favicon-light.svg`, score: 32 });
      candidates.push({ url: `https://${host}/favicon.svg`, score: 29 });
      candidates.push({ url: `https://${host}/favicon-dark.svg`, score: 15 });
    } else {
      candidates.push({ url: `https://${host}/favicon.svg`, score: 28 });
      candidates.push({ url: `https://${host}/favicon-dark.svg`, score: 20 });
      candidates.push({ url: `https://${host}/favicon-light.svg`, score: 20 });
    }
    candidates.push({ url: `https://${host}/favicon.ico`, score: 24 });
    candidates.push({ url: `https://${host}/apple-touch-icon.png`, score: 16 });
    candidates.push({ url: getGoogleFaviconUrl(host), score: 8 });
    candidates.push({ url: getFaviconIsUrl(host), score: 1 });
  }
  if (inputUrl && includeChromeFallback) {
    // Keep Chrome's built-in favicon resolver as a last-resort runtime fallback.
    candidates.push({ url: getChromeFaviconUrl(inputUrl), score: -4 });
  }
  if (fallback) {
    candidates.push({ url: fallback, score: 10 });
  }
  return candidates.filter((item) => item && item.url);
}

function dedupeAndSortFaviconCandidates(candidates) {
  const byUrl = new Map();
  (candidates || []).forEach((item) => {
    if (!item || !item.url) {
      return;
    }
    const key = String(item.url);
    const current = byUrl.get(key);
    if (!current || Number(item.score || 0) > Number(current.score || 0)) {
      byUrl.set(key, { url: key, score: Number(item.score || 0) });
    }
  });
  return Array.from(byUrl.values())
    .sort((a, b) => b.score - a.score)
    .map((item) => item.url);
}

function resolveFaviconCandidates(targetUrl, hostOverride, fallbackUrl, preferredTheme, options) {
  const includeChromeFallback = !options || options.includeChromeFallback !== false;
  const inputUrl = String(targetUrl || '').trim();
  if (!inputUrl) {
    return Promise.resolve([]);
  }
  let parsed = null;
  try {
    parsed = new URL(inputUrl);
  } catch (e) {
    return Promise.resolve([]);
  }
  if (!/^https?:$/i.test(parsed.protocol)) {
    return Promise.resolve([]);
  }
  if (shouldBlockFaviconForHost(parsed.hostname) || (hostOverride && shouldBlockFaviconForHost(hostOverride))) {
    logBlockedLocalFavicon(targetUrl || hostOverride || '', 'resolveFaviconCandidates');
    return Promise.resolve([]);
  }
  const normalizedTheme = normalizeThemePreference(preferredTheme);
  const normalizedHost = normalizeFaviconHost(hostOverride || parsed.hostname);
  const cacheKey = `${normalizedHost}::${parsed.origin}::${normalizedTheme || 'auto'}::chrome=${includeChromeFallback ? '1' : '0'}`;
  if (faviconResolveCache.has(cacheKey)) {
    const cached = faviconResolveCache.get(cacheKey);
    const extra = buildFaviconFallbackCandidates(inputUrl, hostOverride, fallbackUrl, normalizedTheme, { includeChromeFallback: includeChromeFallback });
    return Promise.resolve(dedupeAndSortFaviconCandidates([...(cached || []).map((url) => ({ url: url, score: 20 })), ...extra]));
  }
  if (faviconResolvePending.has(cacheKey)) {
    return faviconResolvePending.get(cacheKey);
  }
  const promise = fetch(inputUrl, { cache: 'force-cache' })
    .then((response) => {
      if (!response || !response.ok) {
        return '';
      }
      return response.text();
    })
    .then((html) => {
      const parsedCandidates = parseHtmlIconCandidates(html, inputUrl, normalizedTheme);
      const fallbackCandidates = buildFaviconFallbackCandidates(inputUrl, hostOverride, fallbackUrl, normalizedTheme, { includeChromeFallback: includeChromeFallback });
      const resolved = dedupeAndSortFaviconCandidates([...parsedCandidates, ...fallbackCandidates]);
      faviconResolveCache.set(cacheKey, resolved.slice(0, 8));
      faviconResolvePending.delete(cacheKey);
      return resolved;
    })
    .catch(() => {
      const fallbackCandidates = buildFaviconFallbackCandidates(inputUrl, hostOverride, fallbackUrl, normalizedTheme, { includeChromeFallback: includeChromeFallback });
      const resolved = dedupeAndSortFaviconCandidates(fallbackCandidates);
      faviconResolveCache.set(cacheKey, resolved.slice(0, 8));
      faviconResolvePending.delete(cacheKey);
      return resolved;
    });
  faviconResolvePending.set(cacheKey, promise);
  return promise;
}

function escapeRegExp(text) {
  return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sanitizeDisplayText(text) {
  const raw = String(text || '');
  const withoutSpecial = raw.replace(/[\u0000-\u001F\u007F-\u009F\uFEFF\uFFF9-\uFFFD]|\p{Co}/gu, '');
  return withoutSpecial.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
}

function renderHighlightedText(target, text, query, styles) {
  const safeText = sanitizeDisplayText(text);
  const needle = String(query || '').trim();
  if (!needle) {
    target.textContent = safeText;
    return;
  }
  const parts = safeText.split(new RegExp(`(${escapeRegExp(needle)})`, 'gi'));
  if (parts.length === 1) {
    target.textContent = safeText;
    return;
  }
  parts.forEach((part) => {
    if (!part) {
      return;
    }
    if (part.toLowerCase() === needle.toLowerCase()) {
      const mark = document.createElement('mark');
      mark.style.background = styles && styles.background
        ? styles.background
        : 'var(--x-ext-mark-bg, #CFE8FF)';
      mark.style.color = styles && styles.color
        ? styles.color
        : 'var(--x-ext-mark-text, #1E3A8A)';
      mark.style.padding = '0 1px';
      mark.style.borderRadius = '2px';
      mark.style.lineHeight = 'inherit';
      mark.style.fontFamily = "'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
      mark.textContent = part;
      target.appendChild(mark);
    } else {
      target.appendChild(document.createTextNode(part));
    }
  });
}

function fetchFaviconData(url) {
  if (!url) {
    return Promise.resolve(null);
  }
  if (isBlockedLocalFaviconUrl(url)) {
    logBlockedLocalFavicon(url, 'fetchFaviconData');
    return Promise.resolve(null);
  }
  try {
    const parsed = new URL(url);
    if (shouldBlockFaviconForHost(parsed.hostname)) {
      return Promise.resolve(null);
    }
  } catch (e) {
    // Keep existing behavior for non-standard URL formats.
  }
  if (faviconDataCache.has(url)) {
    return Promise.resolve(faviconDataCache.get(url));
  }
  if (faviconPending.has(url)) {
    return faviconPending.get(url);
  }
  const promise = fetch(url, { cache: 'force-cache' })
    .then((response) => {
      if (!response || !response.ok) {
        return null;
      }
      return response.blob();
    })
    .then((blob) => {
      if (!blob || blob.size > 256 * 1024) {
        return null;
      }
      return blob.arrayBuffer().then((buffer) => {
        const base64 = arrayBufferToBase64(buffer);
        return `data:${blob.type || 'image/png'};base64,${base64}`;
      });
    })
    .then((dataUrl) => {
      if (dataUrl) {
        faviconDataCache.set(url, dataUrl);
      }
      faviconPending.delete(url);
      return dataUrl;
    })
    .catch(() => {
      faviconPending.delete(url);
      return null;
    });
  faviconPending.set(url, promise);
  return promise;
}

function normalizeSiteSearchTemplate(template) {
  return SITE_SEARCH_PROVIDER_UTILS.normalizeSiteSearchTemplate(template);
}

function sanitizeSiteSearchProviders(items) {
  return SITE_SEARCH_PROVIDER_UTILS.sanitizeSiteSearchProviders(items);
}

function loadCustomSiteSearchProviders() {
  return new Promise((resolve) => {
    if (!storageArea) {
      resolve([]);
      return;
    }
    storageArea.get([SITE_SEARCH_STORAGE_KEY], (result) => {
      const items = sanitizeSiteSearchProviders(result[SITE_SEARCH_STORAGE_KEY]);
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

function normalizeSearchBlacklistMatchModes(value) {
  if (BLACKLIST_UTILS.normalizeMatchModes) {
    return BLACKLIST_UTILS.normalizeMatchModes(value, 'prefix');
  }
  return ['prefix'];
}

function normalizeSearchBlacklistItems(items) {
  if (BLACKLIST_UTILS.normalizeItems) {
    return BLACKLIST_UTILS.normalizeItems(items, 'prefix');
  }
  return [];
}

function loadSearchBlacklistItems() {
  if (searchBlacklistCache) {
    return Promise.resolve(searchBlacklistCache);
  }
  if (searchBlacklistPromise) {
    return searchBlacklistPromise;
  }
  searchBlacklistPromise = new Promise((resolve) => {
    if (!storageArea) {
      resolve([]);
      return;
    }
    storageArea.get([SEARCH_BLACKLIST_STORAGE_KEY], (result) => {
      const items = normalizeSearchBlacklistItems(result && result[SEARCH_BLACKLIST_STORAGE_KEY]);
      searchBlacklistCache = items;
      resolve(items);
    });
  }).finally(() => {
    searchBlacklistPromise = null;
  });
  return searchBlacklistPromise;
}

function isUrlBlockedBySearchBlacklist(url, items) {
  if (BLACKLIST_UTILS.isUrlBlocked) {
    return BLACKLIST_UTILS.isUrlBlocked(url, items);
  }
  return false;
}

function buildBlacklistProbeUrlFromTemplate(template, query) {
  return SEARCH_SUGGESTION_UTILS.buildBlacklistProbeUrlFromTemplate(template, query);
}

function isInteractiveSiteSearchProvider(provider) {
  return SITE_SEARCH_PROVIDER_UTILS.isInteractiveSiteSearchProvider(provider);
}

function getSiteSearchProviderEntryUrl(provider) {
  if (!provider || !provider.template) {
    return '';
  }
  return String(provider.template).replace(/\{query\}/g, '');
}

function isSuggestionBlockedBySearchBlacklist(suggestion, items, queryForProvider) {
  return SEARCH_SUGGESTION_UTILS.isSuggestionBlockedBySearchBlacklist(
    suggestion,
    items,
    queryForProvider,
    { isBlockedUrl: isUrlBlockedBySearchBlacklist }
  );
}

function filterBlacklistedSuggestions(list, items, queryForProvider) {
  return SEARCH_SUGGESTION_UTILS.filterBlacklistedSuggestions(
    list,
    items,
    queryForProvider,
    { isBlockedUrl: isUrlBlockedBySearchBlacklist }
  );
}

function mergeCustomProviders(baseItems, customItems) {
  const merged = [];
  const seen = new Set();
  customItems.forEach((item) => {
    if (item && item.disabled) {
      return;
    }
    const key = String(item.key || '').toLowerCase();
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);
    merged.push(item);
  });
  baseItems.forEach((item) => {
    const key = String(item.key || '').toLowerCase();
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);
    merged.push(item);
  });
  return merged;
}

function loadSiteSearchProviders() {
  if (siteSearchCache) {
    return Promise.resolve(siteSearchCache);
  }
  if (siteSearchPromise) {
    return siteSearchPromise;
  }
  const localUrl = chrome.runtime.getURL('public/assets/data/site-search.json');
  siteSearchPromise = fetch(localUrl)
    .then((response) => response.json())
    .then((data) => {
      const items = data && Array.isArray(data.items) ? data.items : [];
      return sanitizeSiteSearchProviders(items);
    })
    .catch(() => []);
  siteSearchPromise = siteSearchPromise.then((localItems) => {
    return localItems;
  }).then((items) => Promise.all([loadCustomSiteSearchProviders(), loadDisabledSiteSearchKeys()])
    .then(([customItems, disabledKeys]) => {
      const filteredBase = items.filter((item) => {
        const key = String(item && item.key ? item.key : '').toLowerCase();
        return key && !disabledKeys.includes(key);
      });
      const merged = mergeCustomProviders(filteredBase, customItems);
      siteSearchCache = merged;
      return merged;
    })).catch(() => {
    return loadCustomSiteSearchProviders().then((customItems) => {
      siteSearchCache = customItems;
      return customItems;
    });
  });
  return siteSearchPromise;
}

function loadShortcutRules() {
  if (shortcutRulesCache) {
    return Promise.resolve(shortcutRulesCache);
  }
  if (shortcutRulesPromise) {
    return shortcutRulesPromise;
  }
  const rulesUrl = chrome.runtime.getURL('public/assets/data/shortcut-rules.json');
  shortcutRulesPromise = fetch(rulesUrl)
    .then((response) => response.json())
    .then((data) => {
      const items = data && Array.isArray(data.items) ? data.items : [];
      shortcutRulesCache = items;
      return items;
    })
    .catch(() => []);
  return shortcutRulesPromise;
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (!storageAreaName || areaName !== storageAreaName) {
    return;
  }
  if (changes[RESTRICTED_ACTION_STORAGE_KEY]) {
    const next = changes[RESTRICTED_ACTION_STORAGE_KEY].newValue;
    restrictedActionCache = next === 'none' ? 'none' : 'default';
    if (typeof next !== 'undefined' && next !== restrictedActionCache && storageArea) {
      storageArea.set({ [RESTRICTED_ACTION_STORAGE_KEY]: restrictedActionCache });
    }
  }
  if (changes[DOCUMENT_PIP_ENABLED_STORAGE_KEY]) {
    const next = changes[DOCUMENT_PIP_ENABLED_STORAGE_KEY].newValue;
    const normalized = next === true;
    documentPipEnabledCache = normalized;
    if (typeof next !== 'undefined' && next !== normalized && storageArea) {
      storageArea.set({ [DOCUMENT_PIP_ENABLED_STORAGE_KEY]: normalized });
    }
  }
  if (changes[PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY]) {
    const next = changes[PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY].newValue;
    const normalized = next === true;
    pinnedTabRecoveryEnabledCache = normalized;
    if (typeof next !== 'undefined' && next !== normalized && storageArea) {
      storageArea.set({ [PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY]: normalized });
    }
    if (normalized) {
      schedulePersistPinnedTabSnapshot();
    }
  }
  if (changes[SITE_SEARCH_STORAGE_KEY] || changes[SITE_SEARCH_DISABLED_STORAGE_KEY]) {
    siteSearchCache = null;
    siteSearchPromise = null;
  }
  if (changes[SEARCH_BLACKLIST_STORAGE_KEY]) {
    searchBlacklistCache = null;
    searchBlacklistPromise = null;
  }
});

function getBrowserInternalScheme() {
  const ua = navigator.userAgent || '';
  if (ua.includes('Edg/')) {
    return 'edge://';
  }
  if (ua.includes('Brave')) {
    return 'brave://';
  }
  if (ua.includes('Vivaldi')) {
    return 'vivaldi://';
  }
  if (ua.includes('OPR/') || ua.includes('Opera')) {
    return 'opera://';
  }
  return 'chrome://';
}

function getShortcutUrl(query, rules) {
  if (!query || !Array.isArray(rules)) {
    return null;
  }
  const queryLower = query.toLowerCase();
  const scheme = getBrowserInternalScheme();
  for (let i = 0; i < rules.length; i += 1) {
    const rule = rules[i];
    if (!rule || !Array.isArray(rule.keys)) {
      continue;
    }
    const isMatch = rule.keys.some((key) => queryLower.startsWith(key));
    if (!isMatch) {
      continue;
    }
    if (rule.type === 'browserPage' && rule.path) {
      return `${scheme}${rule.path}`;
    }
    if (rule.type === 'url' && rule.url) {
      return rule.url;
    }
  }
  return null;
}

function withTimeout(promise, timeoutMs, fallbackValue) {
  const safePromise = promise
    .then((value) => value)
    .catch(() => fallbackValue);
  if (!timeoutMs || timeoutMs <= 0) {
    return safePromise;
  }
  return Promise.race([
    safePromise,
    new Promise((resolve) => {
      setTimeout(() => resolve(fallbackValue), timeoutMs);
    })
  ]);
}

function callChromeApiWithTimeout(invoke, fallbackValue, timeoutMs) {
  return withTimeout(new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(value);
    };
    try {
      invoke(finish);
    } catch (e) {
      finish(fallbackValue);
    }
  }), timeoutMs, fallbackValue);
}

function invalidateBookmarkTreeCache() {
  bookmarkTreeIndexCache = {
    expiresAt: 0,
    map: null
  };
  bookmarkItemsCache = {
    expiresAt: 0,
    items: []
  };
  bookmarkTreeIndexPromise = null;
  bookmarkItemsPromise = null;
}

function ensureBookmarkTreeCacheListeners() {
  if (bookmarkTreeCacheListenersBound || !chrome || !chrome.bookmarks) {
    return;
  }
  const events = [
    chrome.bookmarks.onCreated,
    chrome.bookmarks.onRemoved,
    chrome.bookmarks.onChanged,
    chrome.bookmarks.onMoved,
    chrome.bookmarks.onChildrenReordered,
    chrome.bookmarks.onImportEnded
  ];
  events.forEach((eventTarget) => {
    if (eventTarget && typeof eventTarget.addListener === 'function') {
      eventTarget.addListener(invalidateBookmarkTreeCache);
    }
  });
  bookmarkTreeCacheListenersBound = true;
}

function buildBookmarkNodeMap(tree) {
  const bookmarkNodeMap = new Map();
  function indexBookmarkNodes(node, parentId) {
    if (!node || !node.id) {
      return;
    }
    bookmarkNodeMap.set(node.id, {
      title: node.title || '',
      parentId: parentId || null,
      hasUrl: Boolean(node.url)
    });
    if (Array.isArray(node.children)) {
      node.children.forEach((child) => indexBookmarkNodes(child, node.id));
    }
  }
  if (Array.isArray(tree)) {
    tree.forEach((node) => indexBookmarkNodes(node, null));
  }
  return bookmarkNodeMap;
}

function buildBookmarkItems(tree) {
  const items = [];
  function collectBookmarkNodes(node) {
    if (!node || !node.id) {
      return;
    }
    if (node.url) {
      items.push({
        id: node.id,
        parentId: node.parentId || null,
        title: node.title || '',
        url: node.url
      });
    }
    if (Array.isArray(node.children)) {
      node.children.forEach((child) => collectBookmarkNodes(child));
    }
  }
  if (Array.isArray(tree)) {
    tree.forEach((node) => collectBookmarkNodes(node));
  }
  return items;
}

function getBookmarkNodeMapCached() {
  const now = Date.now();
  if (bookmarkTreeIndexCache.map && bookmarkTreeIndexCache.expiresAt > now) {
    return Promise.resolve(bookmarkTreeIndexCache.map);
  }
  if (bookmarkTreeIndexPromise) {
    return bookmarkTreeIndexPromise;
  }
  if (!chrome || !chrome.bookmarks || typeof chrome.bookmarks.getTree !== 'function') {
    return Promise.resolve(new Map());
  }
  ensureBookmarkTreeCacheListeners();
  bookmarkTreeIndexPromise = callChromeApiWithTimeout((done) => {
    chrome.bookmarks.getTree((tree) => {
      const map = buildBookmarkNodeMap(tree);
      bookmarkTreeIndexCache = {
        map: map,
        expiresAt: Date.now() + BOOKMARK_TREE_CACHE_TTL_MS
      };
      bookmarkTreeIndexPromise = null;
      done(map);
    });
  }, new Map(), LOCAL_SUGGEST_SOURCE_TIMEOUT_MS).catch(() => {
    bookmarkTreeIndexPromise = null;
    return new Map();
  });
  return bookmarkTreeIndexPromise;
}

function getAllBookmarksCached() {
  const now = Date.now();
  if (Array.isArray(bookmarkItemsCache.items) && bookmarkItemsCache.expiresAt > now) {
    return Promise.resolve(bookmarkItemsCache.items);
  }
  if (bookmarkItemsPromise) {
    return bookmarkItemsPromise;
  }
  if (!chrome || !chrome.bookmarks || typeof chrome.bookmarks.getTree !== 'function') {
    return Promise.resolve([]);
  }
  ensureBookmarkTreeCacheListeners();
  bookmarkItemsPromise = callChromeApiWithTimeout((done) => {
    chrome.bookmarks.getTree((tree) => {
      const items = buildBookmarkItems(tree);
      bookmarkItemsCache = {
        items: items,
        expiresAt: Date.now() + BOOKMARK_TREE_CACHE_TTL_MS
      };
      bookmarkItemsPromise = null;
      done(items);
    });
  }, [], LOCAL_SUGGEST_SOURCE_TIMEOUT_MS).catch(() => {
    bookmarkItemsPromise = null;
    return [];
  });
  return bookmarkItemsPromise;
}

function getTopSitesCached() {
  const now = Date.now();
  if (topSitesCache.expiresAt > now && Array.isArray(topSitesCache.items)) {
    return Promise.resolve(topSitesCache.items);
  }
  if (!chrome || !chrome.topSites || typeof chrome.topSites.get !== 'function') {
    return Promise.resolve([]);
  }
  return callChromeApiWithTimeout((done) => {
    chrome.topSites.get((items) => {
      const list = Array.isArray(items) ? items : [];
      topSitesCache = {
        items: list,
        expiresAt: Date.now() + TOP_SITES_CACHE_TTL_MS
      };
      done(list);
    });
  }, [], LOCAL_SUGGEST_SOURCE_TIMEOUT_MS).catch(() => []);
}

function getFallbackHistoryItemsCached() {
  const now = Date.now();
  if (historyFallbackCache.expiresAt > now && Array.isArray(historyFallbackCache.items)) {
    return Promise.resolve(historyFallbackCache.items);
  }
  if (!chrome || !chrome.history || typeof chrome.history.search !== 'function') {
    return Promise.resolve([]);
  }
  return callChromeApiWithTimeout((done) => {
    chrome.history.search({
      text: '',
      maxResults: 600,
      startTime: Date.now() - (365 * 24 * 60 * 60 * 1000)
    }, (items) => {
      const list = Array.isArray(items) ? items : [];
      historyFallbackCache = {
        items: list,
        expiresAt: Date.now() + HISTORY_FALLBACK_CACHE_TTL_MS
      };
      done(list);
    });
  }, [], LOCAL_SUGGEST_SOURCE_TIMEOUT_MS).catch(() => []);
}

function normalizeAsciiQueryForPinyin(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .trim();
}

function shouldUseTitlePinyinMatch(value) {
  const normalized = normalizeAsciiQueryForPinyin(value);
  return Boolean(normalized) && /^[a-z]+$/.test(normalized);
}

function getChineseCharacters(text) {
  const matches = String(text || '').match(/[\u4e00-\u9fff]/g);
  return Array.isArray(matches) ? matches : [];
}

function buildTitlePinyinIndex(title) {
  const rawTitle = String(title || '').trim();
  if (!rawTitle) {
    return {
      full: '',
      initials: '',
      chineseLength: 0
    };
  }
  if (titlePinyinCache.has(rawTitle)) {
    return titlePinyinCache.get(rawTitle);
  }
  let full = '';
  let initials = '';
  const chineseChars = getChineseCharacters(rawTitle);
  try {
    if (globalThis.pinyinPro && typeof globalThis.pinyinPro.pinyin === 'function') {
      const converted = globalThis.pinyinPro.pinyin(rawTitle, {
        toneType: 'none',
        type: 'array',
        nonZh: 'removed',
        v: false
      });
      const syllables = (Array.isArray(converted) ? converted : [])
        .map((item) => String(item || '').toLowerCase().replace(/[^a-z]+/g, ''))
        .filter(Boolean);
      full = syllables.join('');
      initials = syllables.map((item) => item.charAt(0)).join('');
    }
  } catch (error) {
    full = '';
    initials = '';
  }
  const result = {
    full: full,
    initials: initials,
    chineseLength: chineseChars.length
  };
  titlePinyinCache.set(rawTitle, result);
  return result;
}

function getTitlePinyinMatchScore(title, normalizedQuery) {
  if (!normalizedQuery || normalizedQuery.length < 2) {
    return {
      score: 0,
      reason: ''
    };
  }
  const index = buildTitlePinyinIndex(title);
  if (!index || (!index.full && !index.initials)) {
    return {
      score: 0,
      reason: ''
    };
  }
  if (index.full === normalizedQuery) {
    return {
      score: 42,
      reason: 'full-exact'
    };
  }
  if (index.full.startsWith(normalizedQuery)) {
    return {
      score: 28,
      reason: 'full-prefix'
    };
  }
  if (index.full.includes(normalizedQuery)) {
    return {
      score: 14,
      reason: 'full-contains'
    };
  }
  const canUseInitials = index.chineseLength >= 2 && normalizedQuery.length >= 2;
  if (canUseInitials && index.initials === normalizedQuery) {
    return {
      score: 18,
      reason: 'initials-exact'
    };
  }
  if (canUseInitials && index.initials.startsWith(normalizedQuery)) {
    return {
      score: 12,
      reason: 'initials-prefix'
    };
  }
  return {
    score: 0,
    reason: ''
  };
}

const SEARCH_POLICY = {
  lookupWindowDays: 180,
  fallbackHistoryWindowDays: 365,
  lookupMaxResults: 120,
  fallbackHistoryMaxResults: 600,
  maxEngineSuggestions: 5,
  candidatePoolLimit: 20,
  finalSuggestionLimit: 12,
  fallbackTopSiteLimit: 5,
  topSiteRepresentativeHostLimit: 1,
  topSiteRepresentativeClusterLimit: 1,
  primaryHostLimit: 3,
  primaryClusterLimit: 1,
  secondaryHostLimit: 5,
  secondaryClusterLimit: 2
};

const SEARCH_DEDUP_IGNORED_QUERY_PARAM_NAMES = new Set([
  'entry',
  'reason',
  'ref',
  'ref_src',
  'source',
  'from',
  'from_source',
  'feature',
  'feature_source',
  'campaign',
  'campaign_id',
  'campaign_source',
  'channel',
  'via',
  'trk',
  'track',
  'tracking',
  'tracking_id',
  'spm',
  'si'
]);

const SEARCH_SETTINGS_INTENT_TERMS = new Set([
  'setting',
  'settings',
  'option',
  'options',
  'config',
  'configure',
  'preference',
  'preferences',
  'prefs',
  '设置',
  '选项',
  '配置',
  '偏好',
  '管理'
]);

const SEARCH_PATH_INTENT_TERMS = new Set([
  'release',
  'releases',
  'issue',
  'issues',
  'pull',
  'pulls',
  'docs',
  'doc',
  'wiki',
  'guide',
  'guides',
  'pricing',
  'price',
  'download',
  'admin',
  'bookmark',
  'bookmarks',
  'chat',
  'message',
  'messages',
  'dm',
  'dms',
  'setting',
  'settings',
  'profile',
  'account',
  'notification',
  'notifications',
  '设置',
  '通知',
  '文档',
  '价格',
  '下载',
  '发布'
]);

const SEARCH_INFORMATIONAL_TERMS = new Set([
  'how',
  'what',
  'why',
  'when',
  'where',
  'tutorial',
  'tutorials',
  'guide',
  'guides',
  'learn',
  'docs',
  'doc',
  'help',
  'review',
  'reviews',
  'compare',
  'comparison',
  'price',
  'pricing',
  'news',
  '下载',
  '教程',
  '文档',
  '帮助',
  '对比',
  '价格',
  '评测',
  '为什么',
  '怎么',
  '如何'
]);

const SEARCH_HOME_TITLE_TERMS = new Set([
  'home',
  'homepage',
  'overview',
  'workspace',
  'console',
  'dashboard',
  '首页',
  '主页',
  '概览',
  '控制台',
  '工作台'
]);

const SEARCH_SITE_CONFIG = {
  'lumno.kubai.design': {
    ignoreAllSearchParamsPaths: new Set(['/', '/release', '/onboarding'])
  },
  'analytics.google.com': {
    directNavigationUrl: 'https://analytics.google.com/analytics/web/',
    directNavigationTitle: 'Google Analytics | 首页'
  },
  'github.com': {
    repoAreaCategories: new Map([
      ['issues', 'repo-issues'],
      ['pulls', 'repo-pulls'],
      ['discussions', 'repo-discussions'],
      ['actions', 'repo-actions'],
      ['wiki', 'repo-wiki'],
      ['releases', 'repo-releases']
    ])
  },
  'x.com': {
    directNavigationUrl: 'https://x.com/',
    directNavigationTitle: 'X'
  }
};

function shouldIgnoreSearchDedupQueryParam(paramName) {
  return SEARCH_SUGGESTION_UTILS.shouldIgnoreSearchDedupQueryParam(paramName, {
    ignoredParamNames: SEARCH_DEDUP_IGNORED_QUERY_PARAM_NAMES
  });
}

function buildSearchDedupUrlKey(url) {
  return SEARCH_SUGGESTION_UTILS.buildSearchDedupUrlKey(url, {
    normalizeHost,
    siteConfig: SEARCH_SITE_CONFIG,
    shouldIgnoreQueryParam: shouldIgnoreSearchDedupQueryParam
  });
}

function shouldReplaceDedupedSearchItem(candidate, existing) {
  return SEARCH_SUGGESTION_UTILS.shouldReplaceDedupedSearchItem(candidate, existing);
}

function normalizeSearchDedupTitle(title) {
  return SEARCH_SUGGESTION_UTILS.normalizeSearchDedupTitle(title);
}

function buildSearchDedupEntryKey(item) {
  return SEARCH_SUGGESTION_UTILS.buildSearchDedupEntryKey(item, {
    buildDedupUrlKey: buildSearchDedupUrlKey,
    normalizeTitle: normalizeSearchDedupTitle
  });
}

const SEARCH_UTILITY_SEGMENTS = new Set([
  'settings',
  'setting',
  'preferences',
  'preference',
  'prefs',
  'profile',
  'profiles',
  'account',
  'accounts',
  'notification',
  'notifications',
  'activity',
  'activities',
  'like',
  'likes',
  'admin',
  'dashboard',
  'manage',
  'management',
  'billing',
  'payment',
  'payments'
]);

const SEARCH_ACTION_SEGMENTS = new Set([
  'new',
  'edit',
  'create',
  'update',
  'delete',
  'compose'
]);

function splitSearchTerms(value) {
  return SEARCH_QUERY_CONTEXT_UTILS.splitSearchTerms(value);
}

function buildSearchQueryContext(query) {
  return SEARCH_QUERY_CONTEXT_UTILS.buildSearchQueryContext(query, {
    normalizePinyinQuery: (lookupQuery) => (
      shouldUseTitlePinyinMatch(lookupQuery)
        ? normalizeAsciiQueryForPinyin(lookupQuery)
        : ''
    ),
    pathIntentTerms: SEARCH_PATH_INTENT_TERMS,
    settingsIntentTerms: SEARCH_SETTINGS_INTENT_TERMS,
    informationalTerms: SEARCH_INFORMATIONAL_TERMS
  });
}

function hasSearchHomeTitle(title) {
  return SEARCH_SUGGESTION_UTILS.hasSearchHomeTitle(title, {
    splitSearchTerms,
    homeTitleTerms: SEARCH_HOME_TITLE_TERMS
  });
}

function isSearchLikelyBrandProductQuery(context) {
  return SEARCH_SUGGESTION_UTILS.isSearchLikelyBrandProductQuery(context);
}

function isSearchLikelyDirectNavigationQuery(context) {
  return SEARCH_SUGGESTION_UTILS.isSearchLikelyDirectNavigationQuery(context);
}

function getSearchBrandHostMatchScore(host, context) {
  return SEARCH_SUGGESTION_UTILS.getSearchBrandHostMatchScore(host, context, {
    normalizeHost
  });
}

function getSearchNavigationRepresentativeSignal(item, context) {
  return SEARCH_SUGGESTION_UTILS.getSearchNavigationRepresentativeSignal(item, context, {
    getClusterInfo: getSearchSuggestionClusterInfo,
    normalizeHost,
    hasHomeTitle: hasSearchHomeTitle
  });
}

function getSearchDirectNavigationAdjustment(item, sourceType, context) {
  return SEARCH_SUGGESTION_UTILS.getSearchDirectNavigationAdjustment(item, sourceType, context, {
    getClusterInfo: getSearchSuggestionClusterInfo,
    hasHomeTitle: hasSearchHomeTitle,
    getRepresentativeSignal: getSearchNavigationRepresentativeSignal
  });
}

function getSearchEngineSuggestionScore(context, localSuggestions) {
  return SEARCH_SUGGESTION_UTILS.getSearchEngineSuggestionScore(context, localSuggestions, {
    getRepresentativeSignal: getSearchNavigationRepresentativeSignal
  });
}

function looksLikeVersionSegment(segment) {
  return SEARCH_QUERY_CONTEXT_UTILS.looksLikeVersionSegment(segment);
}

function looksLikeOpaqueIdSegment(segment) {
  return SEARCH_SUGGESTION_UTILS.looksLikeOpaqueIdSegment(segment);
}

function normalizeClusterSegment(segment) {
  return SEARCH_SUGGESTION_UTILS.normalizeClusterSegment(segment, {
    looksLikeVersionSegment
  });
}

function getSearchSuggestionClusterInfo(url) {
  return SEARCH_SUGGESTION_UTILS.getSearchSuggestionClusterInfo(url, {
    normalizeHost,
    looksLikeVersionSegment,
    siteConfig: SEARCH_SITE_CONFIG,
    utilitySegments: SEARCH_UTILITY_SEGMENTS,
    actionSegments: SEARCH_ACTION_SEGMENTS
  });
}

function looksLikeNavigationQuery(query) {
  return SEARCH_QUERY_CONTEXT_UTILS.looksLikeNavigationQuery(query);
}

function classifySearchIntent(query, queryTerms) {
  return SEARCH_QUERY_CONTEXT_UTILS.classifySearchIntent(query, queryTerms, {
    pathIntentTerms: SEARCH_PATH_INTENT_TERMS
  });
}

function getSearchSourceAdjustment(sourceType, intentType) {
  return SEARCH_SUGGESTION_UTILS.getSearchSourceAdjustment(sourceType, intentType);
}

function matchesSearchQueryText(item, context) {
  return SEARCH_QUERY_CONTEXT_UTILS.matchesSearchQueryText(item, context);
}

function matchesSearchTitlePinyin(item, context) {
  if (!context.useTitlePinyinMatch || !item || !item.title) {
    return false;
  }
  return getTitlePinyinMatchScore(item.title, context.normalizedPinyinQuery).score > 0;
}

function getSearchSuggestionCategoryAdjustment(item, queryTerms, hasSettingsIntent) {
  return SEARCH_SUGGESTION_UTILS.getSearchSuggestionCategoryAdjustment(item, queryTerms, hasSettingsIntent, {
    getClusterInfo: getSearchSuggestionClusterInfo
  });
}

function getOwnExtensionUtilityPenalty(item, hasSettingsIntent) {
  if (!item || !item.url || !isOwnExtensionUrl(item.url) || hasSettingsIntent) {
    return 0;
  }
  try {
    const parsedUrl = new URL(item.url);
    const pathnameLower = String(parsedUrl.pathname || '').toLowerCase();
    if (pathnameLower.endsWith('/options.html') || pathnameLower.endsWith('options.html')) {
      return 110;
    }
  } catch (e) {
    return 0;
  }
  return 0;
}

function getRecentPopularityBoost(suggestion) {
  return SEARCH_SUGGESTION_UTILS.getRecentPopularityBoost(suggestion);
}

function getSearchSuggestionSourceRank(suggestion) {
  return SEARCH_SUGGESTION_UTILS.getSearchSuggestionSourceRank(suggestion);
}

function compareSearchSuggestions(a, b) {
  return SEARCH_SUGGESTION_UTILS.compareSearchSuggestions(a, b);
}

function createSearchSuggestion(item, sourceType, score, extras) {
  return SEARCH_SUGGESTION_UTILS.createSearchSuggestion(item, sourceType, score, extras);
}

function buildSearchSuggestionReasons(item, sourceType, context) {
  return SEARCH_SUGGESTION_UTILS.buildSearchSuggestionReasons(item, sourceType, context, {
    getTitlePinyinMatchScore
  });
}

function buildSearchBrandDirectSuggestion(candidates, context) {
  return SEARCH_SUGGESTION_UTILS.buildSearchBrandDirectSuggestion(candidates, context, {
    getClusterInfo: getSearchSuggestionClusterInfo,
    getBrandHostMatchScore: getSearchBrandHostMatchScore,
    getRepresentativeSignal: getSearchNavigationRepresentativeSignal,
    hasHomeTitle: hasSearchHomeTitle,
    siteConfig: SEARCH_SITE_CONFIG,
    calculateRelevanceScore: calculateSearchRelevanceScore,
    buildSuggestionReasons: buildSearchSuggestionReasons,
    buildSuggestionFavicon: buildSearchSuggestionFavicon,
    createSuggestion: createSearchSuggestion
  });
}

function calculateSearchRelevanceScore(item, sourceType, context) {
  return SEARCH_SUGGESTION_UTILS.calculateSearchRelevanceScore(item, sourceType, context, {
    normalizeHost,
    splitSearchTerms,
    getTitlePinyinMatchScore,
    shouldBlockFaviconForHost,
    getSuggestionCategoryAdjustment: getSearchSuggestionCategoryAdjustment,
    getDirectNavigationAdjustment: getSearchDirectNavigationAdjustment,
    getOwnExtensionUtilityPenalty
  });
}

function buildSearchSuggestionFavicon(url) {
  if (isOwnExtensionUrl(url)) {
    return getOwnExtensionFaviconUrl();
  }
  try {
    const urlObj = new URL(url);
    const host = normalizeHost(urlObj.hostname);
    return shouldBlockFaviconForHost(host) ? '' : getGoogleFaviconUrl(host);
  } catch (e) {
    const fallbackHost = extractHostFromInput(url);
    return shouldBlockFaviconForHost(fallbackHost) ? '' : url + '/favicon.ico';
  }
}

function collectSearchMatches(items, context, searchBlacklistItems) {
  return SEARCH_QUERY_CONTEXT_UTILS.collectSearchMatches(items, context, {
    matchesTitlePinyin: matchesSearchTitlePinyin,
    isBlocked: (item) => isUrlBlockedBySearchBlacklist(item && item.url, searchBlacklistItems)
  });
}

function applySearchSuggestionHostDiversity(list) {
  return SEARCH_SUGGESTION_UTILS.applySearchSuggestionHostDiversity(list, {
    buildDedupEntryKey: buildSearchDedupEntryKey,
    getClusterInfo: getSearchSuggestionClusterInfo,
    policy: SEARCH_POLICY
  });
}

function mergeItemsByUrl(itemGroups, searchBlacklistItems) {
  return SEARCH_SUGGESTION_UTILS.mergeSearchItems(itemGroups, {
    buildKey: buildSearchDedupEntryKey,
    shouldReplace: shouldReplaceDedupedSearchItem,
    isBlocked: (item) => isUrlBlockedBySearchBlacklist(item && item.url, searchBlacklistItems)
  });
}

// Function to get search suggestions from history and top sites
function normalizeSearchSuggestionsMode(mode) {
  return SEARCH_PROTOCOL.normalizeSearchSuggestionsMode(mode);
}

async function getSearchSuggestions(query, options) {
  const requestOptions = options && typeof options === 'object' ? options : {};
  const requestMode = normalizeSearchSuggestionsMode(requestOptions.mode);
  const context = buildSearchQueryContext(query);
  context.mode = requestMode;
  if (!context.queryLower) {
    return [];
  }
  const lookupStartTime = Date.now() - (SEARCH_POLICY.lookupWindowDays * 24 * 60 * 60 * 1000);
  const lookupEndTime = Date.now();

  try {
    const [
      engineSuggestions,
      historyItemsRaw,
      topSites,
      bookmarksRaw,
      fallbackHistoryItems,
      allBookmarks,
      searchBlacklistItems
    ] = await Promise.all([
      withTimeout(
        fetchSearchSuggestionsForEngine(query)
        .then((items) => (Array.isArray(items) ? items.slice(0, SEARCH_POLICY.maxEngineSuggestions) : []))
        .catch(() => []),
        SEARCH_ENGINE_SUGGEST_TIMEOUT_MS,
        []
      ),
      callChromeApiWithTimeout((done) => {
        chrome.history.search({
          text: context.lookupQuery,
          maxResults: SEARCH_POLICY.lookupMaxResults,
          startTime: lookupStartTime,
          endTime: lookupEndTime
        }, done);
      }, [], LOCAL_SUGGEST_SOURCE_TIMEOUT_MS),
      getTopSitesCached(),
      callChromeApiWithTimeout((done) => {
        const bookmarkRequest = SEARCH_SUGGESTION_UTILS.buildBookmarkSearchRequest(context);
        chrome.bookmarks.search(bookmarkRequest, done);
      }, [], LOCAL_SUGGEST_SOURCE_TIMEOUT_MS),
      getFallbackHistoryItemsCached(),
      getAllBookmarksCached(),
      loadSearchBlacklistItems()
    ]);
    const fallbackHistoryMatches = collectSearchMatches(fallbackHistoryItems, context, searchBlacklistItems);
    const historyItems = mergeItemsByUrl([
      Array.isArray(historyItemsRaw) ? historyItemsRaw : [],
      fallbackHistoryMatches
    ], searchBlacklistItems);
    const bookmarkTextMatches = collectSearchMatches(allBookmarks, context, searchBlacklistItems);
    const bookmarks = mergeItemsByUrl([
      Array.isArray(bookmarksRaw) ? bookmarksRaw : [],
      bookmarkTextMatches
    ], searchBlacklistItems);

    const bookmarkNodeMap = (Array.isArray(bookmarks) && bookmarks.length > 0)
      ? await getBookmarkNodeMapCached()
      : new Map();

    const rootFolderTitles = new Set([
      'Bookmarks bar',
      'Other bookmarks',
      'Mobile bookmarks',
      '书签栏',
      '其他书签',
      '移动设备书签'
    ]);
    const localSuggestionBundle = SEARCH_SUGGESTION_UTILS.buildLocalSearchSuggestions(
      historyItems,
      topSites,
      bookmarks,
      context,
      {
        bookmarkNodeMap,
        rootFolderTitles,
        buildDedupEntryKey: buildSearchDedupEntryKey,
        calculateRelevanceScore: calculateSearchRelevanceScore,
        createSuggestion: createSearchSuggestion,
        buildSuggestionFavicon: buildSearchSuggestionFavicon,
        buildSuggestionReasons: buildSearchSuggestionReasons,
        buildBrandDirectSuggestion: buildSearchBrandDirectSuggestion,
        isSearchEngineResultUrl,
        isBlockedUrl: (url) => isUrlBlockedBySearchBlacklist(url, searchBlacklistItems),
        normalizeHost
      }
    );
    const suggestions = localSuggestionBundle.suggestions;
    const fallbackTopSites = localSuggestionBundle.fallbackTopSites;

    SEARCH_SUGGESTION_UTILS.appendEngineSearchSuggestions(suggestions, engineSuggestions, context, {
      buildSearchUrl: buildDefaultSearchUrl,
      getDefaultFaviconUrl: getDefaultSearchEngineFaviconUrl,
      getEngineSuggestionScore: getSearchEngineSuggestionScore,
      isSuggestionBlocked: (suggestionItem, suggestionQuery) => (
        isSuggestionBlockedBySearchBlacklist(suggestionItem, searchBlacklistItems, suggestionQuery)
      )
    });

    suggestions.sort(compareSearchSuggestions);

    const finalSuggestions = SEARCH_SUGGESTION_UTILS.finalizeSearchSuggestions(suggestions, fallbackTopSites, context, {
      searchBlacklistItems,
      queryForProvider: context.lookupQuery,
      policy: SEARCH_POLICY,
      buildDedupEntryKey: buildSearchDedupEntryKey,
      filterBlacklistedSuggestions: filterBlacklistedSuggestions,
      applyHostDiversity: applySearchSuggestionHostDiversity,
      createSuggestion: createSearchSuggestion,
      buildSuggestionFavicon: buildSearchSuggestionFavicon
    });
    
    return finalSuggestions;
    
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return [];
  }
}

  async function toggleBlackRectangle(tabs, overlayContext) {
  let captureTabHandler = null;
  let overlayThemeStorageListener = null;
  let overlayLanguageStorageListener = null;
  let overlaySearchEngineStorageListener = null;
  let overlaySearchResultPriorityStorageListener = null;
  let overlaySearchBlacklistStorageListener = null;
  let overlaySizeStorageListener = null;
  let overlayTabPriorityStorageListener = null;
  let overlayTabScoreDebugStorageListener = null;
  let overlayThemeMediaListener = null;
  let overlayPageThemeObserver = null;
  let overlayPageThemeSyncRaf = null;
  let siteSearchStorageListener = null;
  let keydownHandler = null;
  let overlayKeyCaptureHandler = null;
  let clickOutsideHandler = null;
  let overlayEnterAnimationRafA = null;
  let overlayEnterAnimationRafB = null;
  let overlayScrollPauseResumeTimer = null;
  let overlayScrollPauseHandler = null;
  let overlayViewportResizeHandler = null;
  let overlayVisualViewportTarget = null;
  let overlayBaseDevicePixelRatio = null;
  let overlayBaseTopPx = null;
  let overlayInitialTabZoomFactor = 1;
  const normalizedOverlayContext = (overlayContext && typeof overlayContext === 'object') ? overlayContext : {};
  const requestedTabZoomFactorRaw = Number(normalizedOverlayContext.tabZoomFactor);
  const initialPrefillQuery = typeof normalizedOverlayContext.prefillQuery === 'string'
    ? String(normalizedOverlayContext.prefillQuery).trim()
    : '';
  const prioritizeCurrentPageMatch = Boolean(normalizedOverlayContext.prioritizeCurrentPageMatch);
  const initialContextTabId = Number.isFinite(Number(normalizedOverlayContext.currentTabId))
    ? Number(normalizedOverlayContext.currentTabId)
    : null;
  const initialContextTabUrl = typeof normalizedOverlayContext.currentTabUrl === 'string'
    ? String(normalizedOverlayContext.currentTabUrl).trim()
    : '';
  function isLocalFileLikeOverlayUrl(url) {
    if (!url) {
      return false;
    }
    try {
      const parsed = new URL(url);
      const protocol = String(parsed.protocol || '').toLowerCase();
      if (protocol === 'file:') {
        return true;
      }
      const pathname = String(parsed.pathname || '').toLowerCase();
      const srcParam = parsed.searchParams ? parsed.searchParams.get('src') : '';
      if (pathname.endsWith('.pdf')) {
        return true;
      }
      if (srcParam) {
        try {
          const nested = new URL(srcParam);
          if (String(nested.protocol || '').toLowerCase() === 'file:') {
            return true;
          }
          if (String(nested.pathname || '').toLowerCase().endsWith('.pdf')) {
            return true;
          }
        } catch (e) {
          if (String(srcParam).toLowerCase().startsWith('file://') || String(srcParam).toLowerCase().includes('.pdf')) {
            return true;
          }
        }
      }
    } catch (e) {
      return String(url).toLowerCase().startsWith('file://') || String(url).toLowerCase().includes('.pdf');
    }
    return false;
  }
  const shouldIgnoreTabZoomCompensation = isLocalFileLikeOverlayUrl(initialContextTabUrl);
  const initialOverlayTabs = Array.isArray(tabs)
    ? tabs.map((tab) => ({
      ...tab,
      url: tab && typeof tab.url === 'string' ? String(tab.url).trim() : ''
    }))
    : [];
  const requestedTabZoomFactor = Number.isFinite(requestedTabZoomFactorRaw) && requestedTabZoomFactorRaw > 0
    ? requestedTabZoomFactorRaw
    : 1;
  // This function executes in the page world, so it must read injected globals locally.
  const SEARCH_FAVICON_UTILS = globalThis.LumnoSearchFavicons || {};
  const SITE_SEARCH_PROVIDER_UTILS = globalThis.LumnoSiteSearchProviders || {};
  const OVERLAY_LIFECYCLE_UTILS = globalThis.LumnoOverlayLifecycle || {};
  const OVERLAY_SHELL_UTILS = globalThis.LumnoOverlayShell || {};
  const OVERLAY_SEARCH_PROTOCOL = Object.freeze({
    action: 'getSearchSuggestions',
    mode: 'classic'
  });
  const OVERLAY_STORAGE_KEYS = Object.freeze({
    theme: '_x_extension_theme_mode_2024_unique_',
    language: '_x_extension_language_2024_unique_',
    languageMessages: '_x_extension_language_messages_2024_unique_',
    defaultSearchEngine: '_x_extension_default_search_engine_2024_unique_',
    searchResultPriority: '_x_extension_search_result_priority_2026_unique_',
    searchBlacklist: '_x_extension_search_blacklist_2026_unique_',
    overlaySizeMode: '_x_extension_overlay_size_mode_2026_unique_',
    overlayTabPriority: '_x_extension_overlay_tab_priority_2024_unique_',
    tabRankScoreDebug: '_x_extension_tab_rank_score_debug_2026_unique_'
  });
  const THEME_STORAGE_KEY = OVERLAY_STORAGE_KEYS.theme;
  const LANGUAGE_STORAGE_KEY = OVERLAY_STORAGE_KEYS.language;
  const LANGUAGE_MESSAGES_STORAGE_KEY = OVERLAY_STORAGE_KEYS.languageMessages;
  const DEFAULT_SEARCH_ENGINE_STORAGE_KEY = OVERLAY_STORAGE_KEYS.defaultSearchEngine;
  const SEARCH_RESULT_PRIORITY_STORAGE_KEY = OVERLAY_STORAGE_KEYS.searchResultPriority;
  const SEARCH_BLACKLIST_STORAGE_KEY = OVERLAY_STORAGE_KEYS.searchBlacklist;
  const OVERLAY_SIZE_MODE_STORAGE_KEY = OVERLAY_STORAGE_KEYS.overlaySizeMode;
  const OVERLAY_TAB_PRIORITY_STORAGE_KEY = OVERLAY_STORAGE_KEYS.overlayTabPriority;
  const TAB_RANK_SCORE_DEBUG_STORAGE_KEY = OVERLAY_STORAGE_KEYS.tabRankScoreDebug;
  const storageArea = (chrome && chrome.storage && chrome.storage.sync)
    ? chrome.storage.sync
    : (chrome && chrome.storage ? chrome.storage.local : null);
  const storageAreaName = storageArea
    ? (storageArea === (chrome && chrome.storage ? chrome.storage.sync : null) ? 'sync' : 'local')
    : null;
  const RI_CSS_URL = (chrome && chrome.runtime && chrome.runtime.getURL)
    ? chrome.runtime.getURL('public/assets/remixicon/fonts/remixicon.css')
    : 'public/assets/remixicon/fonts/remixicon.css';
  const OPEN_SANS_CSS_URL = (chrome && chrome.runtime && chrome.runtime.getURL)
    ? chrome.runtime.getURL('public/assets/fonts/open-sans/open-sans.css')
    : 'public/assets/fonts/open-sans/open-sans.css';
  const overlayMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  let overlayThemeMode = 'system';
  let overlaySearchResultPriorityMode = 'autocomplete';
  let overlaySizeMode = 'standard';
  let overlaySearchBlacklistItems = [];
  let overlayThemeListenerAttached = false;

  function normalizeOverlaySearchBlacklistItems(items) {
    if (globalThis.LumnoBlacklistUtils && typeof globalThis.LumnoBlacklistUtils.normalizeItems === 'function') {
      return globalThis.LumnoBlacklistUtils.normalizeItems(items, 'prefix');
    }
    return [];
  }

  function buildOverlayBlacklistProbeUrlFromTemplate(template, query) {
    const rawTemplate = String(template || '');
    if (!rawTemplate) {
      return '';
    }
    if (!rawTemplate.includes('{query}')) {
      return rawTemplate;
    }
    return rawTemplate.replace(/\{query\}/g, encodeURIComponent(String(query || '')));
  }

  function isUrlBlockedByOverlaySearchBlacklist(url) {
    if (globalThis.LumnoBlacklistUtils && typeof globalThis.LumnoBlacklistUtils.isUrlBlocked === 'function') {
      return globalThis.LumnoBlacklistUtils.isUrlBlocked(url, overlaySearchBlacklistItems);
    }
    return false;
  }

  function isOverlaySuggestionBlockedBySearchBlacklist(suggestion, queryForProvider) {
    if (!suggestion || suggestion.type === 'newtab') {
      return false;
    }
    if (suggestion.url && isUrlBlockedByOverlaySearchBlacklist(suggestion.url)) {
      return true;
    }
    if (suggestion.type === 'siteSearchPrompt' && suggestion.provider) {
      const probeQuery = String(queryForProvider || '').trim() || 'test';
      const probeUrl = buildOverlayBlacklistProbeUrlFromTemplate(suggestion.provider.template, probeQuery);
      return Boolean(probeUrl) && isUrlBlockedByOverlaySearchBlacklist(probeUrl);
    }
    return false;
  }

  function filterOverlayBlacklistedSuggestions(list, queryForProvider) {
    if (!Array.isArray(list) || list.length === 0) {
      return [];
    }
    return list.filter((suggestion) => !isOverlaySuggestionBlockedBySearchBlacklist(suggestion, queryForProvider));
  }

  function loadOverlaySearchBlacklistItems() {
    if (!storageArea) {
      overlaySearchBlacklistItems = [];
      return;
    }
    storageArea.get([SEARCH_BLACKLIST_STORAGE_KEY], (result) => {
      overlaySearchBlacklistItems = normalizeOverlaySearchBlacklistItems(
        result ? result[SEARCH_BLACKLIST_STORAGE_KEY] : null
      );
      if (latestOverlayQuery) {
        updateSearchSuggestions(lastSuggestionResponse, latestOverlayQuery);
      }
    });
  }

  function normalizeSearchResultPriority(value) {
    return value === 'search' ? 'search' : 'autocomplete';
  }

  function isInjectedBrowserExtensionProtocol(protocol) {
    const normalized = String(protocol || '').toLowerCase();
    return normalized === 'chrome-extension:' ||
      normalized === 'moz-extension:' ||
      normalized === 'ms-browser-extension:';
  }

  function stopOverlayPageThemeObserver() {
    if (overlayPageThemeSyncRaf !== null) {
      cancelAnimationFrame(overlayPageThemeSyncRaf);
      overlayPageThemeSyncRaf = null;
    }
    if (overlayPageThemeObserver) {
      overlayPageThemeObserver.disconnect();
      overlayPageThemeObserver = null;
    }
  }

  function escapeRegExp(text) {
    return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function sanitizeDisplayText(text) {
    const raw = String(text || '');
    const withoutSpecial = raw.replace(/[\u0000-\u001F\u007F-\u009F\uFEFF\uFFF9-\uFFFD]|\p{Co}/gu, '');
    return withoutSpecial.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
  }

  function renderHighlightedText(target, text, query, styles) {
    applyNoTranslate(target);
    const safeText = sanitizeDisplayText(text);
    const needle = String(query || '').trim();
    if (!needle) {
      target.textContent = safeText;
      return;
    }
    const parts = safeText.split(new RegExp(`(${escapeRegExp(needle)})`, 'gi'));
    if (parts.length === 1) {
      target.textContent = safeText;
      return;
    }
    parts.forEach((part) => {
      if (!part) {
        return;
      }
      if (part.toLowerCase() === needle.toLowerCase()) {
        const mark = document.createElement('mark');
        applyNoTranslate(mark);
        mark.style.background = styles && styles.background
          ? styles.background
          : 'var(--x-ext-mark-bg, #CFE8FF)';
        mark.style.color = styles && styles.color
          ? styles.color
          : 'var(--x-ext-mark-text, #1E3A8A)';
        mark.style.padding = '0 1px';
        mark.style.borderRadius = '2px';
        mark.style.lineHeight = 'inherit';
        mark.style.fontFamily = "'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
        mark.textContent = part;
        target.appendChild(mark);
      } else {
        target.appendChild(document.createTextNode(part));
      }
    });
  }

  function applyNoTranslate(element) {
    if (!element || !element.setAttribute) {
      return element;
    }
    element.setAttribute('translate', 'no');
    element.setAttribute('lang', 'zxx');
    element.setAttribute('data-no-translate', 'true');
    if (element.classList) {
      element.classList.add('notranslate');
    }
    return element;
  }

  function applyNoTranslateDeep(root) {
    if (!root || typeof root !== 'object') {
      return root;
    }
    applyNoTranslate(root);
    if (!root.querySelectorAll) {
      return root;
    }
    root.querySelectorAll('*').forEach((element) => {
      applyNoTranslate(element);
    });
    return root;
  }

  function setProtectedPlainText(element, text) {
    if (!element) {
      return element;
    }
    const safeText = sanitizeDisplayText(text);
    element._xProtectedRender = function() {
      applyNoTranslate(element);
      if (element.textContent !== safeText || element.childNodes.length !== 1 || element.firstChild.nodeType !== Node.TEXT_NODE) {
        element.textContent = safeText;
      }
    };
    element._xProtectedRender();
    return element;
  }

  function setProtectedHighlightedText(element, text, query, styles) {
    if (!element) {
      return element;
    }
    const safeText = sanitizeDisplayText(text);
    const safeQuery = String(query || '');
    element._xProtectedRender = function() {
      applyNoTranslate(element);
      element.textContent = '';
      renderHighlightedText(element, safeText, safeQuery, styles);
    };
    element._xProtectedRender();
    return element;
  }

  function restoreProtectedNode(node) {
    if (node && typeof node._xProtectedRender === 'function') {
      node._xProtectedRender();
      return true;
    }
    return false;
  }

  function restoreProtectedAncestors(node, root) {
    let current = node && node.nodeType === Node.ELEMENT_NODE
      ? node
      : node && node.parentElement
        ? node.parentElement
        : null;
    while (current) {
      if (restoreProtectedNode(current)) {
        return true;
      }
      if (current === root) {
        break;
      }
      current = current.parentElement;
    }
    return false;
  }

  const OVERLAY_ANTI_TRANSLATE_GUARD_WINDOW_MS = 1500;
  const OVERLAY_ANTI_TRANSLATE_MAX_MUTATIONS_PER_WINDOW = 120;
  const OVERLAY_ANTI_TRANSLATE_MAX_CALLBACKS_PER_WINDOW = 12;
  const OVERLAY_ANTI_TRANSLATE_BACKOFF_MS = 900;
  const OVERLAY_ANTI_TRANSLATE_SCROLL_PAUSE_MS = 180;

  let overlayAntiTranslateObserver = null;
  let overlayAntiTranslateObserverState = null;

  function stopOverlayAntiTranslateObserver() {
    if (overlayScrollPauseResumeTimer !== null) {
      clearTimeout(overlayScrollPauseResumeTimer);
      overlayScrollPauseResumeTimer = null;
    }
    if (overlayAntiTranslateObserverState && overlayAntiTranslateObserverState.flushTimer) {
      clearTimeout(overlayAntiTranslateObserverState.flushTimer);
    }
    if (overlayAntiTranslateObserverState && overlayAntiTranslateObserverState.resumeTimer) {
      clearTimeout(overlayAntiTranslateObserverState.resumeTimer);
    }
    overlayAntiTranslateObserverState = null;
    if (overlayAntiTranslateObserver) {
      overlayAntiTranslateObserver.disconnect();
      overlayAntiTranslateObserver = null;
    }
  }

  function observeOverlayAntiTranslateRoot(root) {
    if (!overlayAntiTranslateObserver || !root || !root.isConnected) {
      return;
    }
    overlayAntiTranslateObserver.observe(root, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  function restoreProtectedSubtree(root) {
    if (!root || root.nodeType !== Node.ELEMENT_NODE) {
      return;
    }
    const nodes = [root];
    if (typeof root.querySelectorAll === 'function') {
      root.querySelectorAll('*').forEach((node) => {
        nodes.push(node);
      });
    }
    nodes.forEach((node) => {
      restoreProtectedNode(node);
    });
  }

  function pauseOverlayAntiTranslateObserverForScroll() {
    const state = overlayAntiTranslateObserverState;
    if (!state || state.paused) {
      return;
    }
    state.paused = true;
    if (state.flushTimer) {
      clearTimeout(state.flushTimer);
      state.flushTimer = null;
    }
    if (overlayAntiTranslateObserver) {
      overlayAntiTranslateObserver.disconnect();
    }
    if (overlayScrollPauseResumeTimer !== null) {
      clearTimeout(overlayScrollPauseResumeTimer);
    }
    overlayScrollPauseResumeTimer = setTimeout(() => {
      overlayScrollPauseResumeTimer = null;
      const activeState = overlayAntiTranslateObserverState;
      if (!activeState || activeState !== state || activeState.resumeTimer) {
        return;
      }
      if (!state.root || !state.root.isConnected) {
        return;
      }
      state.guardWindowStartedAt = 0;
      state.mutationCountInWindow = 0;
      state.callbackCountInWindow = 0;
      state.pendingProtectedNodes.clear();
      state.pendingNoTranslateRoots.clear();
      state.paused = false;
      observeOverlayAntiTranslateRoot(state.root);
    }, OVERLAY_ANTI_TRANSLATE_SCROLL_PAUSE_MS);
  }

  function backoffOverlayAntiTranslateObserver(reason, detail) {
    const state = overlayAntiTranslateObserverState;
    if (!state || state.paused) {
      return;
    }
    state.paused = true;
    if (state.flushTimer) {
      clearTimeout(state.flushTimer);
      state.flushTimer = null;
    }
    if (overlayAntiTranslateObserver) {
      overlayAntiTranslateObserver.disconnect();
    }
    state.pendingProtectedNodes.clear();
    state.pendingNoTranslateRoots.clear();
    if (state.resumeTimer) {
      clearTimeout(state.resumeTimer);
    }
    state.resumeTimer = setTimeout(() => {
      const activeState = overlayAntiTranslateObserverState;
      if (!activeState || activeState !== state) {
        return;
      }
      state.resumeTimer = null;
      if (!state.root || !state.root.isConnected) {
        return;
      }
      applyNoTranslateDeep(state.root);
      restoreProtectedSubtree(state.root);
      state.guardWindowStartedAt = 0;
      state.mutationCountInWindow = 0;
      state.callbackCountInWindow = 0;
      state.paused = false;
      observeOverlayAntiTranslateRoot(state.root);
    }, OVERLAY_ANTI_TRANSLATE_BACKOFF_MS);
    try {
      console.warn('[Lumno] Backing off overlay anti-translate observer to avoid DOM churn', {
        reason: reason || 'unknown',
        detail: detail || null
      });
    } catch (error) {
      // Ignore console serialization failures.
    }
  }

  function setInlineLabelWithIcon(container, labelText, iconHtml) {
    if (!container) {
      return;
    }
    container.textContent = '';
    const label = document.createElement('span');
    setProtectedPlainText(label, labelText);
    label.style.cssText = `
      all: unset !important;
      display: inline-flex !important;
      align-items: center !important;
      line-height: 1 !important;
    `;
    const icon = document.createElement('span');
    applyNoTranslate(icon);
    icon.innerHTML = iconHtml;
    icon.style.cssText = `
      all: unset !important;
      display: inline-flex !important;
      align-items: center !important;
      line-height: 1 !important;
    `;
    container.appendChild(label);
    container.appendChild(icon);
  }

  function startOverlayAntiTranslateObserver(root) {
    stopOverlayAntiTranslateObserver();
    if (!root || typeof MutationObserver !== 'function') {
      return;
    }
    let isRestoring = false;
    overlayAntiTranslateObserverState = {
      root: root,
      flushTimer: null,
      pendingProtectedNodes: new Set(),
      pendingNoTranslateRoots: new Set(),
      guardWindowStartedAt: 0,
      mutationCountInWindow: 0,
      callbackCountInWindow: 0,
      paused: false,
      resumeTimer: null
    };
    overlayAntiTranslateObserver = new MutationObserver((mutations) => {
      const state = overlayAntiTranslateObserverState;
      if (isRestoring || !state || state.paused) {
        return;
      }
      const now = Date.now();
      if (!state.guardWindowStartedAt || now - state.guardWindowStartedAt > OVERLAY_ANTI_TRANSLATE_GUARD_WINDOW_MS) {
        state.guardWindowStartedAt = now;
        state.mutationCountInWindow = 0;
        state.callbackCountInWindow = 0;
      }
      state.mutationCountInWindow += mutations.length;
      state.callbackCountInWindow += 1;
      if (state.mutationCountInWindow > OVERLAY_ANTI_TRANSLATE_MAX_MUTATIONS_PER_WINDOW ||
          state.callbackCountInWindow > OVERLAY_ANTI_TRANSLATE_MAX_CALLBACKS_PER_WINDOW) {
        backoffOverlayAntiTranslateObserver('mutation-budget-exceeded', {
          mutationCountInWindow: state.mutationCountInWindow,
          callbackCountInWindow: state.callbackCountInWindow
        });
        return;
      }
      mutations.forEach((mutation) => {
        if (mutation.target) {
          const restored = restoreProtectedAncestors(mutation.target, root);
          if (!restored && mutation.target.nodeType === Node.ELEMENT_NODE) {
            state.pendingNoTranslateRoots.add(mutation.target);
          }
        }
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            state.pendingNoTranslateRoots.add(node);
          }
          let current = node && node.nodeType === Node.ELEMENT_NODE
            ? node
            : node && node.parentElement
              ? node.parentElement
              : null;
          while (current) {
            if (typeof current._xProtectedRender === 'function') {
              state.pendingProtectedNodes.add(current);
              break;
            }
            if (current === root) {
              break;
            }
            current = current.parentElement;
          }
        });
      });
      if (state.pendingProtectedNodes.size <= 0 && state.pendingNoTranslateRoots.size <= 0) {
        return;
      }
      if (state.flushTimer) {
        return;
      }
      state.flushTimer = setTimeout(() => {
        const activeState = overlayAntiTranslateObserverState;
        if (!activeState || activeState !== state || activeState.paused) {
          return;
        }
        state.flushTimer = null;
        const noTranslateRoots = Array.from(state.pendingNoTranslateRoots);
        const protectedNodes = Array.from(state.pendingProtectedNodes);
        state.pendingNoTranslateRoots.clear();
        state.pendingProtectedNodes.clear();
        isRestoring = true;
        if (overlayAntiTranslateObserver) {
          overlayAntiTranslateObserver.disconnect();
        }
        noTranslateRoots.forEach((node) => {
          applyNoTranslate(node);
        });
        protectedNodes.forEach((node) => {
          restoreProtectedNode(node);
        });
        isRestoring = false;
        observeOverlayAntiTranslateRoot(root);
      }, 0);
    });
    observeOverlayAntiTranslateRoot(root);
  }

  let modeBadge = null;
  let overlayLanguageMode = 'system';
  let overlayTabQuickSwitchEnabled = true;
  let overlayTabScoreDebugEnabled = false;
  let currentMessages = null;
  let defaultPlaceholderText = '搜索或输入网址...';
  let lastSuggestionResponse = [];
  let overlaySearchEngineState = {
    id: '',
    name: '',
    host: '',
    searchTemplate: ''
  };

  async function ensureRemixIconStyles() {
    if (document.getElementById('_x_extension_remixicon_css_2024_unique_')) {
      return;
    }
    const host = document.head || document.documentElement;
    if (!host) {
      return;
    }
    const link = document.createElement('link');
    link.id = '_x_extension_remixicon_css_2024_unique_';
    link.rel = 'stylesheet';
    link.href = RI_CSS_URL;
    host.appendChild(link);
  }

  async function ensureOpenSansStyles() {
    if (document.getElementById('_x_extension_open_sans_css_2024_unique_')) {
      return;
    }
    const host = document.head || document.documentElement;
    if (!host) {
      return;
    }
    const link = document.createElement('link');
    link.id = '_x_extension_open_sans_css_2024_unique_';
    link.rel = 'stylesheet';
    link.href = OPEN_SANS_CSS_URL;
    host.appendChild(link);
  }

  await ensureOpenSansStyles();
  await ensureRemixIconStyles();

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

  function loadLocaleMessages(locale) {
    const normalized = normalizeLocale(locale);
    if (!chrome || !chrome.runtime || typeof chrome.runtime.getURL !== 'function') {
      return Promise.resolve({});
    }
    const localePath = chrome.runtime.getURL(`public/_locales/${normalized}/messages.json`);
    const isInvalidExtensionUrl = (() => {
      if (!localePath) {
        return true;
      }
      try {
        const parsed = new URL(localePath);
        return isInjectedBrowserExtensionProtocol(parsed.protocol) &&
          String(parsed.hostname || '').toLowerCase() === 'invalid';
      } catch (e) {
        return false;
      }
    })();
    if (isInvalidExtensionUrl) {
      return new Promise((resolve) => {
        if (!chrome.runtime.sendMessage) {
          resolve({});
          return;
        }
        chrome.runtime.sendMessage({ action: 'getLocaleMessages', locale: normalized }, (response) => {
          resolve((response && response.messages) || {});
        });
      });
    }
    return fetch(localePath)
      .then((response) => response.json())
      .catch(() => new Promise((resolve) => {
        if (!chrome.runtime.sendMessage) {
          resolve({});
          return;
        }
        chrome.runtime.sendMessage({ action: 'getLocaleMessages', locale: normalized }, (response) => {
          resolve((response && response.messages) || {});
        });
      }));
  }

  function t(key, fallback) {
    if (currentMessages && currentMessages[key] && currentMessages[key].message) {
      return currentMessages[key].message;
    }
    if (chrome && chrome.i18n && chrome.i18n.getMessage) {
      const message = chrome.i18n.getMessage(key);
      if (message) {
        return message;
      }
    }
    return fallback || '';
  }

  function getStorageValuesAsync(keys) {
    return new Promise((resolve) => {
      if (!storageArea || !storageArea.get) {
        resolve({});
        return;
      }
      storageArea.get(keys, (result) => {
        resolve(result || {});
      });
    });
  }

  async function bootstrapOverlayLanguageForInitialRender() {
    const result = await getStorageValuesAsync([LANGUAGE_STORAGE_KEY, LANGUAGE_MESSAGES_STORAGE_KEY]);
    overlayLanguageMode = result[LANGUAGE_STORAGE_KEY] || 'system';
    const targetLocale = overlayLanguageMode === 'system'
      ? getSystemLocale()
      : normalizeLocale(overlayLanguageMode);
    const payload = result[LANGUAGE_MESSAGES_STORAGE_KEY];
    if (payload && payload.locale === targetLocale && payload.messages) {
      currentMessages = payload.messages || {};
      return;
    }
    currentMessages = await loadLocaleMessages(targetLocale).catch(() => ({}));
  }

  function formatMessage(key, fallback, params) {
    let text = t(key, fallback);
    if (!params) {
      return text;
    }
    Object.keys(params).forEach((token) => {
      const value = params[token];
      text = text.replace(new RegExp(`\\{${token}\\}`, 'g'), value);
    });
    return text;
  }

  function normalizeOverlayTabPriorityMode(mode) {
    if (SETTINGS_UTILS.normalizeOverlayTabQuickSwitch) {
      return SETTINGS_UTILS.normalizeOverlayTabQuickSwitch(mode);
    }
    if (mode === 'switchTabFirst') {
      return true;
    }
    if (mode === 'newtabFirst') {
      return false;
    }
    if (mode === false) {
      return false;
    }
    return true;
  }

  function normalizeTabRankScoreDebugMode(mode) {
    return mode === true;
  }

  function normalizeOverlaySizeMode(mode) {
    if (mode === 'compact' || mode === 'large') {
      return mode;
    }
    return 'standard';
  }

  function getOverlaySizePreset(mode) {
    const normalizedMode = normalizeOverlaySizeMode(mode);
    if (normalizedMode === 'compact') {
      return { width: 680, maxHeightVh: 72, uiScale: 0.94 };
    }
    if (normalizedMode === 'large') {
      return { width: 840, maxHeightVh: 80, uiScale: 1.06 };
    }
    return { width: 760, maxHeightVh: 75, uiScale: 1 };
  }

  function formatTabRankDebugText(tab) {
    const scoreRaw = Number(tab && tab._xTabRankScore);
    const score = Number.isFinite(scoreRaw) ? scoreRaw.toFixed(2) : '0.00';
    const count30mRaw = Number(tab && tab._xTabSwitchCount30m);
    const count24hRaw = Number(tab && tab._xTabSwitchCount24h);
    const debugTotalRaw = Number(tab && tab._xTabDebugEventTotal);
    const lastAccessedRaw = Number(tab && tab._xTabLastAccessedRaw);
    const sortAtRaw = Number(tab && tab._xTabSortAt);
    const fetchSeqRaw = Number(tab && tab._xTabFetchSeq);
    const count30m = Number.isFinite(count30mRaw) ? Math.max(0, Math.round(count30mRaw)) : 0;
    const count24h = Number.isFinite(count24hRaw) ? Math.max(0, Math.round(count24hRaw)) : 0;
    const debugTotal = Number.isFinite(debugTotalRaw) ? Math.max(0, Math.round(debugTotalRaw)) : 0;
    const lastAccessedSec = Number.isFinite(lastAccessedRaw) && lastAccessedRaw > 0 ? Math.round(lastAccessedRaw / 1000) : 0;
    const sortAtSec = Number.isFinite(sortAtRaw) && sortAtRaw > 0 ? Math.round(sortAtRaw / 1000) : 0;
    const fetchSeq = Number.isFinite(fetchSeqRaw) ? Math.max(0, Math.round(fetchSeqRaw)) : 0;
    return `score ${score} · 30m ${count30m} · 24h ${count24h} · ev ${debugTotal} · la ${lastAccessedSec} · s ${sortAtSec} · fs ${fetchSeq} · build 20260308-1`;
  }

  function getRiSvg(id, sizeClass, extraClass) {
    const size = sizeClass || 'ri-size-16';
    const extra = extraClass ? ` ${extraClass}` : '';
    return '<i class="ri-icon ' + size + extra + ' ' + id + '" aria-hidden="true" ' +
      'style="font-style: normal !important; font-variant: normal !important; text-transform: none !important;"></i>';
  }

  function buildSearchUrlFromTemplate(template, query) {
    if (!template) {
      return '';
    }
    return template.replace(/\{query\}/g, encodeURIComponent(query || ''));
  }

  function getOverlaySearchEngineState() {
    return overlaySearchEngineState || {};
  }

  function buildDefaultSearchUrlForOverlay(query) {
    const state = getOverlaySearchEngineState();
    if (state.searchTemplate) {
      return buildSearchUrlFromTemplate(state.searchTemplate, query);
    }
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }

  function getDefaultSearchEngineFaviconUrlForOverlay() {
    const state = getOverlaySearchEngineState();
    if (state.host) {
      return `https://${state.host}/favicon.ico`;
    }
    if (state.searchTemplate) {
      try {
        const url = buildSearchUrlFromTemplate(state.searchTemplate, 'test');
        const host = new URL(url).hostname;
        return `https://${host}/favicon.ico`;
      } catch (e) {
        return '';
      }
    }
    return 'https://www.google.com/favicon.ico';
  }

  function getDefaultSearchEngineThemeUrlForOverlay() {
    const state = getOverlaySearchEngineState();
    if (state.searchTemplate) {
      return buildSearchUrlFromTemplate(state.searchTemplate, 'test');
    }
    if (state.host) {
      return `https://${state.host}`;
    }
    return 'https://www.google.com';
  }

  function getSearchActionLabel() {
    const state = getOverlaySearchEngineState();
    if (state.name) {
      return formatMessage('action_search_engine', '在 {engine} 中搜索', {
        engine: state.name
      });
    }
    return t('action_search', '搜索');
  }

  function loadOverlaySearchEngineState() {
    if (!storageArea) {
      return;
    }
    storageArea.get([DEFAULT_SEARCH_ENGINE_STORAGE_KEY], (result) => {
      const stored = result ? result[DEFAULT_SEARCH_ENGINE_STORAGE_KEY] : null;
      if (stored && stored.id) {
        overlaySearchEngineState = stored;
        if (latestOverlayQuery) {
          updateSearchSuggestions(lastSuggestionResponse, latestOverlayQuery);
        }
      }
    });
  }


  function isLocalNetworkHost(hostname) {
    const host = String(hostname || '').trim().toLowerCase().replace(/^\[|\]$/g, '');
    if (!host) {
      return false;
    }
    if (
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      host.endsWith('.local') ||
      host === 'host.docker.internal'
    ) {
      return true;
    }
    if (/^\d{1,3}(?:\.\d{1,3}){0,2}$/.test(host)) {
      const shortParts = host.split('.').map((part) => Number(part));
      if (shortParts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)) {
        return true;
      }
    }
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
      const parts = host.split('.').map((part) => Number(part));
      if (parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
        return false;
      }
      if (
        parts[0] === 0 ||
        parts[0] === 10 ||
        parts[0] === 127 ||
        (parts[0] === 169 && parts[1] === 254)
      ) {
        return true;
      }
      if (parts[0] === 192 && parts[1] === 168) {
        return true;
      }
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
        return true;
      }
      if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) {
        return true;
      }
    }
    const ipv6 = host.split('%')[0];
    if (
      ipv6 === '::1' ||
      ipv6 === '0:0:0:0:0:0:0:1' ||
      ipv6 === '::' ||
      /^fe[89ab][0-9a-f]*:/i.test(ipv6) ||
      /^[fd][0-9a-f]{1,3}:/i.test(ipv6)
    ) {
      return true;
    }
    const mappedIpv4 = ipv6.match(/::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
    if (mappedIpv4 && mappedIpv4[1]) {
      return isLocalNetworkHost(mappedIpv4[1]);
    }
    return false;
  }

  function isSuspiciousLocalFaviconHost(hostname) {
    const host = String(hostname || '').trim().toLowerCase().replace(/^\[|\]$/g, '');
    if (!host) {
      return false;
    }
    const ipv6 = host.split('%')[0];
    if (host.includes(':') || ipv6.includes(':')) {
      return false;
    }
    if (/^\d{1,3}(?:\.\d{1,3}){0,3}$/.test(host)) {
      return false;
    }
    if (!host.includes('.')) {
      return /^[a-z0-9-]+$/i.test(host);
    }
    const labels = host.split('.').filter(Boolean);
    if (labels.length < 2) {
      return false;
    }
    const suffix = labels[labels.length - 1];
    return [
      'internal',
      'intern',
      'test',
      'localdev',
      'lan',
      'home',
      'corp',
      'localdomain'
    ].includes(suffix);
  }

  function shouldBlockFaviconForHost(hostname) {
    return isLocalNetworkHost(hostname) || isSuspiciousLocalFaviconHost(hostname);
  }

  function isLocalNetworkInput(input) {
    const raw = String(input || '').trim().toLowerCase();
    if (!raw) {
      return false;
    }
    const withoutScheme = raw.replace(/^[a-z][a-z0-9+.-]*:\/\//, '');
    const authority = withoutScheme.split(/[/?#]/)[0] || '';
    const host = authority.includes('@') ? authority.split('@').pop() : authority;
    const normalizedHost = (() => {
      const value = String(host || '').trim().toLowerCase();
      if (!value) {
        return '';
      }
      if (value.startsWith('[')) {
        const endBracket = value.indexOf(']');
        if (endBracket > 1) {
          return value.slice(1, endBracket);
        }
      }
      return value.replace(/^\[|\]$/g, '').split(':')[0];
    })();
    if (!normalizedHost) {
      return false;
    }
    return isLocalNetworkHost(normalizedHost);
  }
  function clearOverlayEnterAnimationFrames() {
    if (overlayEnterAnimationRafA !== null) {
      cancelAnimationFrame(overlayEnterAnimationRafA);
      overlayEnterAnimationRafA = null;
    }
    if (overlayEnterAnimationRafB !== null) {
      cancelAnimationFrame(overlayEnterAnimationRafB);
      overlayEnterAnimationRafB = null;
    }
  }

  function stopOverlayViewportSizeSync() {
    if (!overlayViewportResizeHandler) {
      overlayBaseDevicePixelRatio = null;
      overlayBaseTopPx = null;
      overlayInitialTabZoomFactor = 1;
      return;
    }
    window.removeEventListener('resize', overlayViewportResizeHandler);
    if (overlayVisualViewportTarget && typeof overlayVisualViewportTarget.removeEventListener === 'function') {
      overlayVisualViewportTarget.removeEventListener('resize', overlayViewportResizeHandler);
    }
    overlayViewportResizeHandler = null;
    overlayVisualViewportTarget = null;
    overlayBaseDevicePixelRatio = null;
    overlayBaseTopPx = null;
    overlayInitialTabZoomFactor = 1;
  }

  function applyOverlaySizeForPageZoom(overlayElement) {
    if (!overlayElement || !overlayElement.isConnected) {
      return;
    }
    const sizePreset = getOverlaySizePreset(overlaySizeMode);
    const visualViewport = window.visualViewport;
    const viewportWidth = visualViewport && Number.isFinite(visualViewport.width) && visualViewport.width > 0
      ? visualViewport.width
      : (window.innerWidth || document.documentElement.clientWidth || 0);
    const viewportHeight = visualViewport && Number.isFinite(visualViewport.height) && visualViewport.height > 0
      ? visualViewport.height
      : (window.innerHeight || document.documentElement.clientHeight || 0);
    const currentDpr = Number.isFinite(window.devicePixelRatio) && window.devicePixelRatio > 0
      ? window.devicePixelRatio
      : 1;
    const baseDpr = Number.isFinite(overlayBaseDevicePixelRatio) && overlayBaseDevicePixelRatio > 0
      ? overlayBaseDevicePixelRatio
      : currentDpr;
    const dprScaleDelta = currentDpr / baseDpr;
    const tabZoomFactor = Number.isFinite(overlayInitialTabZoomFactor) && overlayInitialTabZoomFactor > 0
      ? overlayInitialTabZoomFactor
      : 1;
    // 不对双指手势缩放做反向补偿，保持与网页一致缩放感知。
    const zoomScale = tabZoomFactor * dprScaleDelta;
    const safeZoomScale = Math.max(0.5, Math.min(3, zoomScale));
    const presetUiScale = Number.isFinite(sizePreset.uiScale) && sizePreset.uiScale > 0
      ? sizePreset.uiScale
      : 1;
    const finalOverlayZoom = (1 / safeZoomScale) * presetUiScale;
    const safeFinalOverlayZoom = Math.max(0.35, Math.min(4, finalOverlayZoom));
    const maxWidth = Math.max(280, viewportWidth - 24);
    const baseTop = Number.isFinite(overlayBaseTopPx) && overlayBaseTopPx > 0
      ? overlayBaseTopPx
      : (viewportHeight * 0.2);
    const compensatedTop = baseTop * safeZoomScale;
    const topPx = Math.max(16, Math.min(compensatedTop, Math.max(16, viewportHeight - 120)));
    overlayElement.style.setProperty('width', `${sizePreset.width}px`, 'important');
    overlayElement.style.setProperty('max-width', `${maxWidth}px`, 'important');
    overlayElement.style.setProperty('max-height', `${sizePreset.maxHeightVh}vh`, 'important');
    overlayElement.style.setProperty('top', `${topPx}px`, 'important');
    overlayElement.style.setProperty('zoom', `${safeFinalOverlayZoom}`, 'important');
  }

  function startOverlayViewportSizeSync(overlayElement) {
    stopOverlayViewportSizeSync();
    if (!overlayElement) {
      return;
    }
    overlayBaseDevicePixelRatio = Number.isFinite(window.devicePixelRatio) && window.devicePixelRatio > 0
      ? window.devicePixelRatio
      : 1;
    overlayInitialTabZoomFactor = shouldIgnoreTabZoomCompensation ? 1 : requestedTabZoomFactor;
    const visualViewport = window.visualViewport;
    const viewportHeight = visualViewport && Number.isFinite(visualViewport.height) && visualViewport.height > 0
      ? visualViewport.height
      : (window.innerHeight || document.documentElement.clientHeight || 0);
    overlayBaseTopPx = viewportHeight * 0.2;
    overlayViewportResizeHandler = () => {
      applyOverlaySizeForPageZoom(overlayElement);
    };
    window.addEventListener('resize', overlayViewportResizeHandler);
    if (visualViewport && typeof visualViewport.addEventListener === 'function') {
      visualViewport.addEventListener('resize', overlayViewportResizeHandler);
      overlayVisualViewportTarget = visualViewport;
    }
    applyOverlaySizeForPageZoom(overlayElement);
  }

  let aiModeDecor = null;
  let aiModeSweep = null;
  let aiModeSweepActive = false;

  // Helper function to remove overlay and clean up styles
  function removeOverlay(overlayElement) {
    const cleanupState = OVERLAY_LIFECYCLE_UTILS.cleanupOverlay({
      overlayElement,
      documentTarget: document,
      windowTarget: window,
      chromeStorage: chrome && chrome.storage ? chrome.storage : null,
      overlayMediaQuery,
      updateSiteSearchPrefixLayout,
      clearOverlayEnterAnimationFrames,
      clearSiteSearchShellAnimation,
      stopOverlayViewportSizeSync,
      stopOverlayAntiTranslateObserver,
      stopOverlayPageThemeObserver,
      aiModeDecor,
      aiModeSweep,
      captureTabHandler,
      keydownHandler,
      clickOutsideHandler,
      overlayKeyCaptureHandler,
      overlayThemeStorageListener,
      overlayLanguageStorageListener,
      overlaySearchEngineStorageListener,
      overlaySearchResultPriorityStorageListener,
      overlaySearchBlacklistStorageListener,
      overlayTabPriorityStorageListener,
      overlayTabScoreDebugStorageListener,
      overlaySizeStorageListener,
      overlayThemeMediaListener,
      overlayScrollPauseHandler,
      siteSearchStorageListener
    });
    aiModeDecor = cleanupState.aiModeDecor;
    aiModeSweep = cleanupState.aiModeSweep;
    aiModeSweepActive = cleanupState.aiModeSweepActive;
    captureTabHandler = cleanupState.captureTabHandler;
    keydownHandler = cleanupState.keydownHandler;
    clickOutsideHandler = cleanupState.clickOutsideHandler;
    overlayKeyCaptureHandler = cleanupState.overlayKeyCaptureHandler;
    overlayThemeStorageListener = cleanupState.overlayThemeStorageListener;
    overlayLanguageStorageListener = cleanupState.overlayLanguageStorageListener;
    overlaySearchEngineStorageListener = cleanupState.overlaySearchEngineStorageListener;
    overlaySearchResultPriorityStorageListener = cleanupState.overlaySearchResultPriorityStorageListener;
    overlaySearchBlacklistStorageListener = cleanupState.overlaySearchBlacklistStorageListener;
    overlayTabPriorityStorageListener = cleanupState.overlayTabPriorityStorageListener;
    overlayTabScoreDebugStorageListener = cleanupState.overlayTabScoreDebugStorageListener;
    overlaySizeStorageListener = cleanupState.overlaySizeStorageListener;
    overlayThemeMediaListener = cleanupState.overlayThemeMediaListener;
    overlayScrollPauseHandler = cleanupState.overlayScrollPauseHandler;
    siteSearchStorageListener = cleanupState.siteSearchStorageListener;
  }
  
  // Check if the overlay already exists
  let overlay = document.getElementById('_x_extension_overlay_2024_unique_');
  
  if (overlay) {
    // If it exists, remove it (toggle off)
    removeOverlay(overlay);
  } else {
    // If it doesn't exist, create it (toggle on)
    const initialOverlaySizePreset = getOverlaySizePreset(overlaySizeMode);
    overlay = OVERLAY_SHELL_UTILS.createOverlayElement(document, {
      id: '_x_extension_overlay_2024_unique_',
      width: initialOverlaySizePreset.width,
      maxHeightVh: initialOverlaySizePreset.maxHeightVh
    });
    applyNoTranslate(overlay);


    const applyOverlayTheme = (mode) => {
      overlayThemeMode = mode;
      const previousResolvedTheme = overlay ? overlay.getAttribute('data-theme') : '';
      applyOverlayThemeVariables(overlay, mode);
      const nextResolvedTheme = overlay ? overlay.getAttribute('data-theme') : '';
      if (aiModeDecor && typeof aiModeDecor.setTheme === 'function') {
        syncAiModeDecorAppearance();
      }
      if (aiModeSweep && typeof aiModeSweep.setTheme === 'function') {
        aiModeSweep.setTheme('auto');
      }
      suggestionItems.forEach((item) => {
        if (item && item._xTheme) {
          applyThemeVariables(item, item._xTheme);
        }
      });
      updateSelection();
      updateModeBadge(searchInput ? searchInput.value : '');
      if (previousResolvedTheme !== nextResolvedTheme) {
        refreshOverlayThemeAwareFavicons();
      }
      if (mode === 'system') {
        startOverlayPageThemeObserver();
        if (!overlayThemeListenerAttached) {
          overlayThemeMediaListener = function() {
            if (overlayThemeMode === 'system') {
              // 仅更新容器变量会导致建议项主题变量滞后，系统主题切换时完整刷新。
              applyOverlayTheme('system');
            }
          };
          overlayMediaQuery.addEventListener('change', overlayThemeMediaListener);
          overlayThemeListenerAttached = true;
        }
        return;
      }
      stopOverlayPageThemeObserver();
      if (overlayThemeListenerAttached) {
        overlayMediaQuery.removeEventListener('change', overlayThemeMediaListener);
        overlayThemeMediaListener = null;
        overlayThemeListenerAttached = false;
      }
    };
    
    // 使用系统字体，避免外链字体依赖。
    
    // Add style to hide scrollbars for WebKit browsers
    OVERLAY_SHELL_UTILS.appendOverlayStyleNodes(document);

    
    if (typeof window._x_extension_createSearchInput_2024_unique_ !== 'function') {
      console.warn('Lumno: input UI helper not available.');
      removeOverlay(overlay);
      return;
    }

    await bootstrapOverlayLanguageForInitialRender();

    const inputParts = window._x_extension_createSearchInput_2024_unique_({
      placeholder: t('overlay_search_placeholder', t('search_placeholder', defaultPlaceholderText)),
      inputId: '_x_extension_search_input_2024_unique_',
      iconId: '_x_extension_search_icon_2024_unique_',
      containerId: '_x_extension_input_container_2024_unique_',
      rightIconUrl: chrome.runtime.getURL('public/assets/images/lumno-input-light.png'),
      rightIconStyleOverrides: {
        cursor: 'pointer'
      },
      showUnderlineWhenEmpty: true
    });
    const searchInput = inputParts.input;
    const inputContainer = inputParts.container;
    const rightIcon = inputParts.rightIcon;
    const overlayInputHeight = 56;
    applyNoTranslate(searchInput);
    applyNoTranslate(inputContainer);
    applyNoTranslate(rightIcon);
    if (inputContainer) {
      inputContainer.style.setProperty('height', `${overlayInputHeight}px`, 'important');
      inputContainer.style.setProperty('min-height', `${overlayInputHeight}px`, 'important');
      inputContainer.style.setProperty('max-height', `${overlayInputHeight}px`, 'important');
      inputContainer.style.setProperty('overflow', 'visible', 'important');
    }
    if (searchInput) {
      searchInput.style.setProperty('height', `${overlayInputHeight}px`, 'important');
      searchInput.style.setProperty('min-height', `${overlayInputHeight}px`, 'important');
      searchInput.style.setProperty('max-height', `${overlayInputHeight}px`, 'important');
      searchInput.style.setProperty('line-height', '1.3', 'important');
      searchInput.style.setProperty('padding-top', '0', 'important');
      searchInput.style.setProperty('padding-bottom', '0', 'important');
      searchInput.style.setProperty('padding-right', '92px', 'important');
    }
    if (rightIcon) {
      rightIcon.style.setProperty('right', '50px', 'important');
    }
    const topActionTooltip = document.createElement('div');
    applyNoTranslate(topActionTooltip);
    topActionTooltip.id = '_x_extension_top_action_tooltip_2026_unique_';
    topActionTooltip.style.cssText = `
      all: unset !important;
      position: absolute !important;
      left: 8px !important;
      top: 8px !important;
      display: block !important;
      visibility: hidden !important;
      width: max-content !important;
      max-width: 420px !important;
      padding: 8px 12px !important;
      border-radius: 10px !important;
      background: #0F172A !important;
      color: #F9FAFB !important;
      border: 1px solid rgba(15, 23, 42, 0.12) !important;
      font-size: 13px !important;
      font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
      font-weight: 500 !important;
      line-height: 1.35 !important;
      white-space: normal !important;
      overflow-wrap: break-word !important;
      text-align: left !important;
      box-sizing: border-box !important;
      pointer-events: none !important;
      z-index: 4 !important;
      box-shadow: 0 10px 22px rgba(0, 0, 0, 0.18) !important;
      opacity: 0 !important;
      transform: translateY(4px) !important;
      transition: opacity 120ms ease, transform 120ms ease, visibility 120ms ease !important;
    `;
    overlay.appendChild(topActionTooltip);
    let topActionTooltipHideTimer = null;
    const showTopActionTooltip = (button, text) => {
      if (!button || !text || !topActionTooltip) {
        return;
      }
      if (topActionTooltipHideTimer) {
        clearTimeout(topActionTooltipHideTimer);
        topActionTooltipHideTimer = null;
      }
      topActionTooltip.textContent = text;
      const isDark = overlay && overlay.getAttribute('data-theme') === 'dark';
      topActionTooltip.style.setProperty('background', isDark ? '#020617' : '#0F172A', 'important');
      topActionTooltip.style.setProperty('color', '#F8FAFC', 'important');
      topActionTooltip.style.setProperty(
        'border',
        isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(15, 23, 42, 0.12)',
        'important'
      );
      topActionTooltip.style.setProperty(
        'box-shadow',
        isDark ? '0 14px 30px rgba(0, 0, 0, 0.45)' : '0 10px 22px rgba(0, 0, 0, 0.18)',
        'important'
      );
      const overlayRect = overlay.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      const availableWidth = Math.max(180, Math.floor(overlayRect.width - 16));
      const resolvedMaxWidth = Math.min(420, availableWidth);
      topActionTooltip.style.setProperty('max-width', `${resolvedMaxWidth}px`, 'important');
      topActionTooltip.style.setProperty('width', 'max-content', 'important');
      topActionTooltip.style.setProperty('visibility', 'hidden', 'important');
      topActionTooltip.style.setProperty('opacity', '0', 'important');
      topActionTooltip.style.setProperty('transform', 'translateY(4px)', 'important');
      const tooltipRect = topActionTooltip.getBoundingClientRect();
      const spacing = 10;
      let tooltipTop = Math.round(buttonRect.top - overlayRect.top - tooltipRect.height - spacing);
      if (tooltipTop < 8) {
        tooltipTop = Math.round(buttonRect.bottom - overlayRect.top + spacing);
      }
      let tooltipLeft = Math.round(
        buttonRect.left - overlayRect.left + (buttonRect.width - tooltipRect.width) / 2
      );
      const minLeft = 8;
      const maxLeft = Math.max(minLeft, Math.round(overlayRect.width - tooltipRect.width - 8));
      tooltipLeft = Math.max(minLeft, Math.min(maxLeft, tooltipLeft));
      topActionTooltip.style.setProperty('top', `${tooltipTop}px`, 'important');
      topActionTooltip.style.setProperty('left', `${tooltipLeft}px`, 'important');
      topActionTooltip.style.setProperty('visibility', 'visible', 'important');
      requestAnimationFrame(() => {
        topActionTooltip.style.setProperty('opacity', '1', 'important');
        topActionTooltip.style.setProperty('transform', 'translateY(0)', 'important');
      });
    };
    const hideTopActionTooltip = () => {
      if (!topActionTooltip) {
        return;
      }
      topActionTooltip.style.setProperty('opacity', '0', 'important');
      topActionTooltip.style.setProperty('transform', 'translateY(4px)', 'important');
      if (topActionTooltipHideTimer) {
        clearTimeout(topActionTooltipHideTimer);
      }
      topActionTooltipHideTimer = setTimeout(() => {
        topActionTooltip.style.setProperty('visibility', 'hidden', 'important');
      }, 120);
    };
    const closeOtherTabsButton = document.createElement('button');
    applyNoTranslate(closeOtherTabsButton);
    closeOtherTabsButton.id = '_x_extension_search_close_other_tabs_2026_unique_';
    closeOtherTabsButton.type = 'button';
    closeOtherTabsButton.innerHTML = getRiSvg('ri-brush-2-line', 'ri-size-16');
    closeOtherTabsButton.setAttribute('aria-label', t('overlay_close_other_tabs_tooltip', '清理本页外的其他标签页（除置顶与群组）'));
    closeOtherTabsButton.style.cssText = `
      all: unset !important;
      position: absolute !important;
      right: 14px !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      width: 30px !important;
      height: 30px !important;
      border-radius: 8px !important;
      z-index: 2 !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: 0 !important;
      line-height: 1 !important;
      text-decoration: none !important;
      list-style: none !important;
      outline: none !important;
      background: transparent !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 0 !important;
      color: var(--x-ext-input-icon, #9CA3AF) !important;
      cursor: pointer !important;
      transition: background-color 140ms ease, color 140ms ease, transform 160ms ease !important;
    `;
    const closeOtherTabsIcon = closeOtherTabsButton.querySelector('.ri-icon');
    if (closeOtherTabsIcon) {
      closeOtherTabsIcon.style.setProperty('display', 'inline-flex', 'important');
      closeOtherTabsIcon.style.setProperty('align-items', 'center', 'important');
      closeOtherTabsIcon.style.setProperty('justify-content', 'center', 'important');
      closeOtherTabsIcon.style.setProperty('line-height', '1', 'important');
      closeOtherTabsIcon.style.setProperty('transform', 'none', 'important');
      closeOtherTabsIcon.style.setProperty('pointer-events', 'none', 'important');
      closeOtherTabsIcon.style.setProperty('cursor', 'pointer', 'important');
    }
    const resetCloseOtherTabsButtonVisualState = () => {
      closeOtherTabsButton.style.setProperty('background', 'transparent', 'important');
      closeOtherTabsButton.style.setProperty('color', 'var(--x-ext-input-icon, #9CA3AF)', 'important');
      closeOtherTabsButton.style.setProperty('transform', 'translateY(-50%)', 'important');
    };
    resetCloseOtherTabsButtonVisualState();
    closeOtherTabsButton.addEventListener('mouseenter', () => {
      closeOtherTabsButton.style.setProperty('background', 'var(--x-ext-input-icon-hover-bg, rgba(148, 163, 184, 0.16))', 'important');
      closeOtherTabsButton.style.setProperty('color', 'var(--x-ext-input-icon-hover, #4B5563)', 'important');
      closeOtherTabsButton.style.setProperty('transform', 'translateY(-50%) scale(1.06)', 'important');
    });
    closeOtherTabsButton.addEventListener('mouseleave', resetCloseOtherTabsButtonVisualState);
    closeOtherTabsButton.addEventListener('blur', resetCloseOtherTabsButtonVisualState);
    closeOtherTabsButton.addEventListener('pointerup', resetCloseOtherTabsButtonVisualState);
    closeOtherTabsButton.addEventListener('pointercancel', resetCloseOtherTabsButtonVisualState);
    inputContainer.appendChild(closeOtherTabsButton);
    modeBadge = document.createElement('div');
    modeBadge.id = '_x_extension_mode_badge_2024_unique_';
    applyNoTranslate(modeBadge);
    modeBadge.style.cssText = `
      all: unset !important;
      position: absolute !important;
      right: 86px !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      display: none !important;
      align-items: center !important;
      gap: 6px !important;
      background: var(--x-ov-tag-bg, #F3F4F6) !important;
      color: var(--x-ov-tag-text, #6B7280) !important;
      border: 1px solid var(--x-ov-border, rgba(0, 0, 0, 0.08)) !important;
      border-radius: 999px !important;
      padding: 4px 8px !important;
      font-size: 11px !important;
      font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
      font-weight: 500 !important;
      line-height: 1 !important;
      white-space: nowrap !important;
      max-width: 180px !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      box-sizing: border-box !important;
      pointer-events: none !important;
      z-index: 1 !important;
    `;
    inputContainer.appendChild(modeBadge);

    function updateInputRightPadding() {
      if (!searchInput) {
        return;
      }
      const baseRightReserve = 92;
      const badgeVisible = Boolean(modeBadge && modeBadge.style.getPropertyValue('display') !== 'none');
      if (!badgeVisible) {
        searchInput.style.setProperty('padding-right', `${baseRightReserve}px`, 'important');
        return;
      }
      const badgeWidth = Math.ceil(modeBadge.getBoundingClientRect().width || 0);
      const totalReserve = Math.max(baseRightReserve, 86 + badgeWidth + 12);
      searchInput.style.setProperty('padding-right', `${totalReserve}px`, 'important');
    }


    function applyLanguageStrings() {
      const settingsTooltipText = formatMessage('command_settings', '打开 Lumno 设置', { name: 'Lumno' });
      const closeOtherTooltipText = t('overlay_close_other_tabs_tooltip', '清理本页外的其他标签页（除置顶与群组）');
      if (searchInput) {
        defaultPlaceholderText = t('overlay_search_placeholder', t('search_placeholder', defaultPlaceholderText));
        if (!siteSearchState) {
          searchInput.placeholder = defaultPlaceholderText;
        }
      }
      if (rightIcon) {
        rightIcon.setAttribute('aria-label', settingsTooltipText);
      }
      if (closeOtherTabsButton) {
        closeOtherTabsButton.setAttribute('aria-label', closeOtherTooltipText);
      }
      if (modeBadge) {
        updateModeBadge(searchInput ? searchInput.value : '');
      }
      if (siteSearchState) {
        setSiteSearchPrefix(siteSearchState);
        updateSiteSearchPrefixLayout();
      }
      if (latestOverlayQuery) {
        updateSearchSuggestions(lastSuggestionResponse, latestOverlayQuery);
      } else {
        requestTabsAndRender();
      }
    }

    function applyLanguageMode(mode) {
      overlayLanguageMode = mode || 'system';
      const targetLocale = overlayLanguageMode === 'system'
        ? getSystemLocale()
        : normalizeLocale(overlayLanguageMode);
      if (storageArea) {
        storageArea.get([LANGUAGE_MESSAGES_STORAGE_KEY], (result) => {
          const payload = result[LANGUAGE_MESSAGES_STORAGE_KEY];
          if (payload && payload.locale === targetLocale && payload.messages) {
            currentMessages = payload.messages || {};
            applyLanguageStrings();
            return;
          }
          loadLocaleMessages(targetLocale).then((messages) => {
            currentMessages = messages || {};
            applyLanguageStrings();
          });
        });
        return;
      }
      loadLocaleMessages(targetLocale).then((messages) => {
        currentMessages = messages || {};
        applyLanguageStrings();
      });
    }

    function getThemeModeLabel(mode) {
      if (mode === 'dark') {
        return t('theme_label_dark', '深色');
      }
      if (mode === 'light') {
        return t('theme_label_light', '浅色');
      }
      return t('theme_label_system', '跟随系统');
    }

    const commandDefinitions = [
      {
        type: 'commandNewTab',
        primary: '/new',
        aliases: ['/n', '/newtab', '/nt']
      },
      {
        type: 'commandSettings',
        primary: '/settings',
        aliases: ['/set', '/settings', '/s']
      }
    ];

    function getCommandMatch(rawInput) {
      const input = String(rawInput || '').trim().toLowerCase();
      if (!input.startsWith('/')) {
        return null;
      }
      for (let i = 0; i < commandDefinitions.length; i += 1) {
        const command = commandDefinitions[i];
        const tokens = [command.primary].concat(command.aliases || []);
        for (let j = 0; j < tokens.length; j += 1) {
          const token = tokens[j];
          if (token.startsWith(input) || input.startsWith(token)) {
            return {
              command: command,
              completion: command.primary
            };
          }
        }
      }
      return null;
    }

    function buildCommandSuggestion(command) {
      let titleText = '';
      if (command.type === 'commandSettings') {
        titleText = formatMessage('command_settings', '打开 Lumno 设置', {
          name: 'Lumno'
        });
      } else {
        titleText = t('command_newtab', '新建标签页');
      }
      return {
        type: command.type,
        title: titleText,
        url: '',
        commandText: command.primary,
        commandAliases: command.aliases || []
      };
    }

    function updateModeBadge(rawValue) {
      if (!modeBadge) {
        return;
      }
      const shouldShow = isModeCommand(rawValue || '');
      if (!shouldShow) {
        modeBadge.style.setProperty('display', 'none', 'important');
        updateInputRightPadding();
        return;
      }
      if (overlayThemeMode === 'system') {
        const pageTheme = detectPageTheme();
        if (pageTheme) {
          modeBadge.textContent = formatMessage('mode_badge_follow_site', '模式：{mode}（跟随网站）', {
            mode: getThemeModeLabel(pageTheme)
          });
        } else {
          const systemResolved = overlayMediaQuery.matches ? 'dark' : 'light';
          modeBadge.textContent = formatMessage('mode_badge_follow_system', '模式：{mode}（跟随系统）', {
            mode: getThemeModeLabel(systemResolved)
          });
        }
      } else {
        modeBadge.textContent = formatMessage('mode_badge', '模式：{mode}', {
          mode: getThemeModeLabel(overlayThemeMode)
        });
      }
      modeBadge.style.setProperty('display', 'inline-flex', 'important');
      updateInputRightPadding();
    }

    function getNextThemeMode(mode) {
      const order = ['system', 'light', 'dark'];
      const index = order.indexOf(mode);
      if (index === -1) {
        return 'light';
      }
      return order[(index + 1) % order.length];
    }

    function isModeCommand(input) {
      const raw = String(input || '').trim().toLowerCase();
      return raw === '/mode' || raw.startsWith('/mode ');
    }

    function buildModeSuggestion() {
      const nextMode = getNextThemeMode(overlayThemeMode || 'system');
      return {
        type: 'modeSwitch',
        title: formatMessage('mode_switch_title', `Lumno：切换到${getThemeModeLabel(nextMode)}模式`, {
          name: 'Lumno',
          mode: getThemeModeLabel(nextMode)
        }),
        url: '',
        favicon: chrome.runtime.getURL('public/assets/images/lumno.png'),
        nextMode: nextMode
      };
    }

    function applyThemeModeChange(mode) {
      const nextMode = mode || 'system';
      if (storageArea) {
        storageArea.set({ [THEME_STORAGE_KEY]: nextMode });
      }
      applyOverlayTheme(nextMode);
      if (isModeCommand(searchInput.value || '')) {
        updateSearchSuggestions([], (searchInput.value || '').trim());
      }
    }

    if (rightIcon) {
      const settingsTooltipText = () => formatMessage('command_settings', '打开 Lumno 设置', { name: 'Lumno' });
      rightIcon.addEventListener('mouseenter', function() {
        showTopActionTooltip(rightIcon, settingsTooltipText());
      });
      rightIcon.addEventListener('focus', function() {
        showTopActionTooltip(rightIcon, settingsTooltipText());
      });
      rightIcon.addEventListener('mouseleave', hideTopActionTooltip);
      rightIcon.addEventListener('blur', hideTopActionTooltip);
      rightIcon.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        hideTopActionTooltip();
        chrome.runtime.sendMessage({ action: 'openOptionsPage' });
        removeOverlay(overlay);
        if (clickOutsideHandler) {
          document.removeEventListener('click', clickOutsideHandler);
        }
        if (keydownHandler) {
          document.removeEventListener('keydown', keydownHandler);
        }
        if (captureTabHandler) {
          document.removeEventListener('keydown', captureTabHandler, true);
        }
      });
    }
    if (closeOtherTabsButton) {
      const closeOtherTooltipText = () => t('overlay_close_other_tabs_tooltip', '清理本页外的其他标签页（除置顶与群组）');
      closeOtherTabsButton.addEventListener('mouseenter', function() {
        showTopActionTooltip(closeOtherTabsButton, closeOtherTooltipText());
      });
      closeOtherTabsButton.addEventListener('focus', function() {
        showTopActionTooltip(closeOtherTabsButton, closeOtherTooltipText());
      });
      closeOtherTabsButton.addEventListener('mouseleave', hideTopActionTooltip);
      closeOtherTabsButton.addEventListener('blur', hideTopActionTooltip);
      closeOtherTabsButton.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        hideTopActionTooltip();
        chrome.runtime.sendMessage({ action: 'closeOtherTabsForOverlay' }, (response) => {
          resetCloseOtherTabsButtonVisualState();
          if (typeof closeOtherTabsButton.blur === 'function') {
            closeOtherTabsButton.blur();
          }
          if (!response || response.ok !== true) {
            return;
          }
          if (latestOverlayQuery) {
            chrome.runtime.sendMessage({
              action: SEARCH_PROTOCOL.SEARCH_ACTION_GET_SUGGESTIONS || 'getSearchSuggestions',
              query: latestOverlayQuery,
              context: 'overlay'
            }, (refreshResponse) => {
              const suggestions = refreshResponse && Array.isArray(refreshResponse.suggestions)
                ? refreshResponse.suggestions
                : [];
              updateSearchSuggestions(suggestions, latestOverlayQuery);
            });
            return;
          }
          requestTabsAndRender();
        });
      });
    }

    // Add focus styles
    searchInput.addEventListener('focus', function() {
      selectedIndex = -1;
      updateSelection();
    });
    
    searchInput.addEventListener('blur', function() {
      // Don't change selectedIndex here to allow keyboard navigation
    });
    
    let tabs = [];
    let currentOverlayTabId = null;
    if (initialOverlayTabs.length > 0) {
      tabs = initialOverlayTabs;
    }
    if (typeof initialContextTabId === 'number') {
      currentOverlayTabId = initialContextTabId;
    }
    let latestOverlayQuery = '';
    let latestRawInputValue = '';
    let lastDeletionAt = 0;
    let autocompleteState = null;
    let inlineSearchState = null;
    let siteSearchTriggerState = null;
    let isComposing = false;
    function isImeCompositionEvent(event) {
      if (!event) {
        return isComposing;
      }
      return Boolean(
        isComposing ||
        event.isComposing ||
        event.keyCode === 229 ||
        event.which === 229 ||
        event.key === 'Process'
      );
    }
    let siteSearchState = null;
    let openTabsSearchModeActive = false;
    let siteSearchShellAnimationTimers = [];
    const defaultPlaceholder = searchInput.placeholder;
    let siteSearchProvidersCache = null;
    let pendingProviderReload = false;
    const defaultSiteSearchProviders = [
      { key: 'yt', aliases: ['youtube'], name: 'YouTube', template: 'https://www.youtube.com/results?search_query={query}' },
      { key: 'bb', aliases: ['bilibili', 'bili'], name: 'Bilibili', template: 'https://search.bilibili.com/all?keyword={query}' },
      { key: 'gh', aliases: ['github'], name: 'GitHub', template: 'https://github.com/search?q={query}' },
      { key: 'gm', aliases: ['gemini'], name: 'Gemini', template: 'https://gemini.google.com/app', action: 'openAndSubmit', submitStrategy: 'geminiPrompt' },
      { key: 'so', aliases: ['baidu', 'bd'], name: 'Baidu', template: 'https://www.baidu.com/s?wd={query}' },
      { key: 'bi', aliases: ['bing'], name: 'Bing', template: 'https://www.bing.com/search?q={query}' },
      { key: 'gg', aliases: ['google'], name: 'Google', template: 'https://www.google.com/search?q={query}' },
      { key: 'zh', aliases: ['zhihu'], name: 'Zhihu', template: 'https://www.zhihu.com/search?q={query}' },
      { key: 'db', aliases: ['douban'], name: 'Douban', template: 'https://www.douban.com/search?q={query}' },
      { key: 'jd', aliases: ['juejin'], name: 'Juejin', template: 'https://juejin.cn/search?query={query}' },
      { key: 'tb', aliases: ['taobao'], name: 'Taobao', template: 'https://s.taobao.com/search?q={query}' },
      { key: 'tm', aliases: ['tmall'], name: 'Tmall', template: 'https://list.tmall.com/search_product.htm?q={query}' },
      { key: 'wx', aliases: ['weixin', 'wechat'], name: 'WeChat', template: 'https://weixin.sogou.com/weixin?query={query}' },
      { key: 'tw', aliases: ['twitter', 'x'], name: 'X', template: 'https://x.com/search?q={query}' },
      { key: 'rd', aliases: ['reddit'], name: 'Reddit', template: 'https://www.reddit.com/search/?q={query}' },
      { key: 'wk', aliases: ['wiki', 'wikipedia'], name: 'Wikipedia', template: 'https://en.wikipedia.org/wiki/Special:Search?search={query}' },
      { key: 'zw', aliases: ['zhwiki'], name: 'Wikipedia', template: 'https://zh.wikipedia.org/wiki/Special:Search?search={query}' }
    ];
    const defaultAccentColor = [59, 130, 246];
    const themeColorCache = window._x_extension_theme_color_cache_2024_unique_ || new Map();
    window._x_extension_theme_color_cache_2024_unique_ = themeColorCache;
    const themeHostCache = window._x_extension_theme_host_cache_2024_unique_ || new Map();
    window._x_extension_theme_host_cache_2024_unique_ = themeHostCache;
    const defaultCaretColor = searchInput.style.caretColor || '#7DB7FF';
    let baseInputPaddingLeft = null;
    const prefixGap = 6;

    function mixColor(color, target, amount) {
      return [
        Math.round(color[0] + (target[0] - color[0]) * amount),
        Math.round(color[1] + (target[1] - color[1]) * amount),
        Math.round(color[2] + (target[2] - color[2]) * amount)
      ];
    }

    function rgbToCss(rgb) {
      return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    }

    function parseCssColor(color) {
      if (!color || typeof color !== 'string') {
        return null;
      }
      const trimmed = color.trim().toLowerCase();
      if (trimmed.startsWith('#')) {
        const hex = trimmed.slice(1);
        if (hex.length === 3) {
          const r = parseInt(hex[0] + hex[0], 16);
          const g = parseInt(hex[1] + hex[1], 16);
          const b = parseInt(hex[2] + hex[2], 16);
          if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
            return [r, g, b];
          }
        }
        if (hex.length === 6) {
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);
          if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
            return [r, g, b];
          }
        }
        return null;
      }
      const rgbMatch = trimmed.match(/^rgb\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\s*\)$/);
      if (rgbMatch) {
        const r = Number(rgbMatch[1]);
        const g = Number(rgbMatch[2]);
        const b = Number(rgbMatch[3]);
        if ([r, g, b].every((value) => Number.isFinite(value))) {
          return [r, g, b];
        }
      }
      return null;
    }

    function getHighlightColors(theme) {
      const resolvedTheme = getThemeForMode(theme);
      if (!resolvedTheme || !resolvedTheme._xIsBrand) {
        return {
          bg: 'var(--x-ov-hover-bg, #F3F4F6)',
          border: 'transparent'
        };
      }
      return {
        bg: resolvedTheme.highlightBg,
        border: resolvedTheme.highlightBorder
      };
    }

    function getLuminance(rgb) {
      const [r, g, b] = rgb.map((value) => {
        const channel = value / 255;
        return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    function getReadableTextColor(bgRgb) {
      if (!bgRgb || bgRgb.length !== 3) {
        return '#111827';
      }
      const darkText = [17, 24, 39];
      const lightText = [248, 250, 252];
      const bgLum = getLuminance(bgRgb);
      const darkLum = getLuminance(darkText);
      const lightLum = getLuminance(lightText);
      const contrastWithDark = (Math.max(bgLum, darkLum) + 0.05) / (Math.min(bgLum, darkLum) + 0.05);
      const contrastWithLight = (Math.max(bgLum, lightLum) + 0.05) / (Math.min(bgLum, lightLum) + 0.05);
      return contrastWithDark >= contrastWithLight ? '#111827' : '#F8FAFC';
    }

    function normalizeAccentColor(rgb) {
      if (!rgb || rgb.length !== 3) {
        return defaultAccentColor;
      }
      const luminance = getLuminance(rgb);
      if (luminance < 0.12) {
        return mixColor(rgb, [255, 255, 255], 0.55);
      }
      if (luminance > 0.9) {
        return mixColor(rgb, [0, 0, 0], 0.2);
      }
      return rgb;
    }

    function buildThemeVariant(accent, mode) {
      const isDark = mode === 'dark';
      const base = isDark ? [48, 48, 48] : [255, 255, 255];
      const highlightBg = mixColor(accent, base, isDark ? 0.82 : 0.86);
      const highlightBorder = mixColor(accent, base, isDark ? 0.66 : 0.62);
      const markBg = mixColor(accent, base, isDark ? 0.74 : 0.78);
      const tagBg = mixColor(accent, base, isDark ? 0.76 : 0.74);
      const keyBg = mixColor(accent, base, isDark ? 0.88 : 0.9);
      const tagBorder = mixColor(accent, base, isDark ? 0.62 : 0.58);
      const keyBorder = mixColor(accent, base, isDark ? 0.7 : 0.18);
      const buttonBg = mixColor(accent, base, isDark ? 0.8 : 0.94);
      const buttonBorder = mixColor(accent, base, isDark ? 0.68 : 0.7);
      const buttonText = isDark
        ? getReadableTextColor(buttonBg)
        : (getLuminance(accent) > 0.8
          ? rgbToCss(mixColor(accent, [0, 0, 0], 0.6))
          : rgbToCss(accent));
      const placeholderText = isDark
        ? rgbToCss(mixColor(accent, [255, 255, 255], 0.2))
        : buttonText;
      return {
        accent: rgbToCss(accent),
        accentRgb: accent,
        highlightBg: rgbToCss(highlightBg),
        highlightBorder: rgbToCss(highlightBorder),
        markBg: rgbToCss(markBg),
        markText: getReadableTextColor(markBg),
        tagBg: rgbToCss(tagBg),
        tagText: getReadableTextColor(tagBg),
        tagBorder: rgbToCss(tagBorder),
        keyBg: rgbToCss(keyBg),
        keyText: getReadableTextColor(keyBg),
        keyBorder: rgbToCss(keyBorder),
        buttonText: buttonText,
        buttonBg: rgbToCss(buttonBg),
        buttonBorder: rgbToCss(buttonBorder),
        placeholderText: placeholderText
      };
    }

    function buildTheme(rgb) {
      const accent = normalizeAccentColor(rgb);
      return buildThemeVariant(accent, 'light');
    }

    const defaultTheme = buildTheme(defaultAccentColor);
    defaultTheme._xIsDefault = true;
    const urlHighlightTheme = buildTheme(defaultAccentColor);
    urlHighlightTheme._xIsBrand = true;
    urlHighlightTheme._xIsUrl = true;
    const overlayThemeTokens = {
      light: {
        bg: 'linear-gradient(135deg, rgba(255, 255, 255, 0.97) 0%, rgba(255, 255, 255, 0.95) 100%)',
        border: 'rgba(0, 0, 0, 0.14)',
        shadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.7), 0 16px 40px rgba(15, 23, 42, 0.12), 0 40px 90px rgba(15, 23, 42, 0.12)',
        text: '#111827',
        subtext: '#6B7280',
        link: '#2563EB',
        placeholder: '#9CA3AF',
        hoverBg: 'rgba(200, 208, 218, 0.45)',
        tagBg: '#F3F4F6',
        tagText: '#6B7280',
        bookmarkTagBg: '#FEF3C7',
        bookmarkTagText: '#D97706',
        underline: '#E5E7EB',
        dividerOpacity: '0.5',
        dividerInset: '24px',
        blur: '14px',
        saturate: '175%'
      },
      dark: {
        bg: 'rgba(20, 20, 20, 0.62)',
        border: 'rgba(255, 255, 255, 0.16)',
        shadow: '0 24px 90px rgba(0, 0, 0, 0.65)',
        text: '#E5E7EB',
        subtext: '#9CA3AF',
        link: '#D1D5DB',
        placeholder: '#9CA3AF',
        hoverBg: 'rgba(255, 255, 255, 0.08)',
        tagBg: 'rgba(255, 255, 255, 0.12)',
        tagText: '#E5E7EB',
        bookmarkTagBg: 'rgba(245, 158, 11, 0.22)',
        bookmarkTagText: '#FBBF24',
        underline: 'rgba(255, 255, 255, 0.18)',
        dividerOpacity: '0.35',
        dividerInset: '24px',
        blur: '40px',
        saturate: '145%'
      }
    };
    function resolveOverlayTheme(mode) {
      if (mode === 'dark') {
        return 'dark';
      }
      if (mode === 'light') {
        return 'light';
      }
      const pageTheme = detectPageTheme();
      if (pageTheme) {
        return pageTheme;
      }
      return overlayMediaQuery.matches ? 'dark' : 'light';
    }

    function detectPageTheme() {
      const docEl = document.documentElement;
      const body = document.body;
      if (!docEl) {
        return null;
      }
      // Some sites use boolean dark/light attributes instead of data-theme tokens.
      if (docEl.hasAttribute('dark') || (body && body.hasAttribute('dark'))) {
        return 'dark';
      }
      if (docEl.hasAttribute('light') || (body && body.hasAttribute('light'))) {
        return 'light';
      }
      const darkAttrNode = document.querySelector(
        'html[dark], body[dark], ytd-app[dark], ytm-app[dark], [data-dark], [dark-mode], [theme="dark"], [color-scheme="dark"], [data-color-mode="dark"], [data-mode="dark"], [data-appearance="dark"]'
      );
      if (darkAttrNode) {
        return 'dark';
      }
      const lightAttrNode = document.querySelector(
        '[theme="light"], [color-scheme="light"], [data-color-mode="light"], [data-mode="light"], [data-appearance="light"]'
      );
      if (lightAttrNode) {
        return 'light';
      }
      const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
      if (colorSchemeMeta) {
        const metaContent = String(colorSchemeMeta.getAttribute('content') || '').toLowerCase();
        if (metaContent.includes('dark') && !metaContent.includes('light')) {
          return 'dark';
        }
        if (metaContent.includes('light') && !metaContent.includes('dark')) {
          return 'light';
        }
      }
      const schemeValue = (window.getComputedStyle(docEl).colorScheme || '').toLowerCase();
      if (schemeValue.includes('dark') && !schemeValue.includes('light')) {
        return 'dark';
      }
      if (schemeValue.includes('light') && !schemeValue.includes('dark')) {
        return 'light';
      }
      const attrCandidates = [
        docEl.getAttribute('data-theme'),
        docEl.getAttribute('data-color-scheme'),
        docEl.getAttribute('data-color-mode'),
        docEl.getAttribute('data-mode'),
        docEl.getAttribute('data-appearance'),
        docEl.getAttribute('color-scheme'),
        docEl.getAttribute('theme'),
        docEl.getAttribute('data-bs-theme'),
        body ? body.getAttribute('data-theme') : null,
        body ? body.getAttribute('data-color-scheme') : null,
        body ? body.getAttribute('data-color-mode') : null,
        body ? body.getAttribute('data-mode') : null,
        body ? body.getAttribute('data-appearance') : null,
        body ? body.getAttribute('color-scheme') : null,
        body ? body.getAttribute('theme') : null,
        body ? body.getAttribute('data-bs-theme') : null
      ];
      for (let i = 0; i < attrCandidates.length; i += 1) {
        const value = String(attrCandidates[i] || '').toLowerCase();
        if (!value) {
          continue;
        }
        if (
          value.includes('dark') ||
          value.includes('night') ||
          value === '1' ||
          value === 'true' ||
          value === 'on'
        ) {
          return 'dark';
        }
        if (
          value.includes('light') ||
          value.includes('day') ||
          value === '0' ||
          value === 'false' ||
          value === 'off'
        ) {
          return 'light';
        }
      }
      const classTokens = [
        docEl.className || '',
        body ? body.className || '' : ''
      ];
      for (let i = 0; i < classTokens.length; i += 1) {
        const classText = String(classTokens[i] || '').toLowerCase();
        const tokenList = classText.split(/\s+/);
        if (tokenList.includes('dark')) {
          return 'dark';
        }
        if (tokenList.includes('light')) {
          return 'light';
        }
        if (/(^|[\s_-])(dark|darkmode|dark-theme|theme-dark|night)([\s_-]|$)/.test(classText)) {
          return 'dark';
        }
        if (/(^|[\s_-])(light|lightmode|light-theme|theme-light|day)([\s_-]|$)/.test(classText)) {
          return 'light';
        }
      }
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        const themeColor = String(themeColorMeta.getAttribute('content') || '').trim();
        const rgb = parseCssColor(themeColor);
        if (rgb && rgb.length === 3) {
          return getLuminance(rgb) < 0.42 ? 'dark' : 'light';
        }
      }
      const bodyStyle = body ? window.getComputedStyle(body) : null;
      const docStyle = window.getComputedStyle(docEl);
      const bgColor = (bodyStyle && bodyStyle.backgroundColor && bodyStyle.backgroundColor !== 'transparent')
        ? bodyStyle.backgroundColor
        : docStyle.backgroundColor;
      const rgb = parseCssColor(bgColor);
      if (rgb && rgb.length === 3) {
        return getLuminance(rgb) < 0.42 ? 'dark' : 'light';
      }
      return null;
    }

    function scheduleOverlayPageThemeSync() {
      if (overlayPageThemeSyncRaf !== null) {
        return;
      }
      overlayPageThemeSyncRaf = requestAnimationFrame(() => {
        overlayPageThemeSyncRaf = null;
        if (!overlay || !overlay.isConnected || overlayThemeMode !== 'system') {
          return;
        }
        applyOverlayTheme('system');
      });
    }

    function startOverlayPageThemeObserver() {
      if (overlayPageThemeObserver || overlayThemeMode !== 'system') {
        return;
      }
      const themeAttrFilter = [
        'class',
        'style',
        'data-theme',
        'data-color-scheme',
        'data-color-mode',
        'data-mode',
        'data-appearance',
        'theme',
        'color-scheme',
        'dark',
        'light',
        'data-bs-theme'
      ];
      overlayPageThemeObserver = new MutationObserver(() => {
        scheduleOverlayPageThemeSync();
      });
      const docEl = document.documentElement;
      if (docEl) {
        overlayPageThemeObserver.observe(docEl, {
          attributes: true,
          attributeFilter: themeAttrFilter
        });
      }
      const body = document.body;
      if (body) {
        overlayPageThemeObserver.observe(body, {
          attributes: true,
          attributeFilter: themeAttrFilter
        });
      }
      const head = document.head;
      if (head) {
        overlayPageThemeObserver.observe(head, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['name', 'content', 'media']
        });
      }
      scheduleOverlayPageThemeSync();
    }

    function applyOverlayThemeVariables(target, mode) {
      if (!target) {
        return;
      }
      const resolved = resolveOverlayTheme(mode);
      const tokens = overlayThemeTokens[resolved] || overlayThemeTokens.light;
      target.setAttribute('data-theme', resolved);
      target.style.setProperty('--x-ov-bg', tokens.bg, 'important');
      target.style.setProperty('--x-ov-border', tokens.border, 'important');
      target.style.setProperty('--x-ov-shadow', tokens.shadow, 'important');
      target.style.setProperty('--x-ov-text', tokens.text, 'important');
      target.style.setProperty('--x-ov-subtext', tokens.subtext, 'important');
      target.style.setProperty('--x-ov-link', tokens.link, 'important');
      target.style.setProperty('--x-ov-placeholder', tokens.placeholder, 'important');
      target.style.setProperty('--x-ov-hover-bg', tokens.hoverBg, 'important');
      target.style.setProperty('--x-ov-tag-bg', tokens.tagBg, 'important');
      target.style.setProperty('--x-ov-tag-text', tokens.tagText, 'important');
      target.style.setProperty('--x-ov-bookmark-tag-bg', tokens.bookmarkTagBg, 'important');
      target.style.setProperty('--x-ov-bookmark-tag-text', tokens.bookmarkTagText, 'important');
      target.style.setProperty('--x-ov-blur', tokens.blur, 'important');
      target.style.setProperty('--x-ov-saturate', tokens.saturate, 'important');
      target.style.setProperty('--x-ext-input-text', tokens.text, 'important');
      target.style.setProperty('--x-ext-input-caret', tokens.link, 'important');
      target.style.setProperty('--x-ext-input-icon', tokens.subtext, 'important');
      target.style.setProperty('--x-ext-input-icon-hover-bg', tokens.hoverBg, 'important');
      target.style.setProperty('--x-ext-input-icon-hover', tokens.text, 'important');
      target.style.setProperty('--x-ext-input-underline', tokens.underline, 'important');
      target.style.setProperty('--x-ext-input-divider-inset', tokens.dividerInset, 'important');
      target.style.setProperty('--x-ext-input-divider-opacity', tokens.dividerOpacity, 'important');
    }

    if (storageArea) {
      storageArea.get([THEME_STORAGE_KEY], (result) => {
        applyOverlayTheme(result[THEME_STORAGE_KEY] || 'system');
      });
    }
    overlayThemeStorageListener = (changes, areaName) => {
      if (!storageAreaName || areaName !== storageAreaName || !changes[THEME_STORAGE_KEY]) {
        return;
      }
      applyOverlayTheme(changes[THEME_STORAGE_KEY].newValue || 'system');
    };
    chrome.storage.onChanged.addListener(overlayThemeStorageListener);

    if (storageArea) {
      storageArea.get([LANGUAGE_STORAGE_KEY], (result) => {
        applyLanguageMode(result[LANGUAGE_STORAGE_KEY] || 'system');
      });
    }
    overlayLanguageStorageListener = (changes, areaName) => {
      if (!storageAreaName || areaName !== storageAreaName) {
        return;
      }
      if (changes[LANGUAGE_STORAGE_KEY]) {
        applyLanguageMode(changes[LANGUAGE_STORAGE_KEY].newValue || 'system');
      }
      if (changes[LANGUAGE_MESSAGES_STORAGE_KEY]) {
        const payload = changes[LANGUAGE_MESSAGES_STORAGE_KEY].newValue;
        const targetLocale = overlayLanguageMode === 'system'
          ? getSystemLocale()
          : normalizeLocale(overlayLanguageMode);
        if (payload && payload.locale === targetLocale && payload.messages) {
          currentMessages = payload.messages || {};
          applyLanguageStrings();
        }
      }
    };
    chrome.storage.onChanged.addListener(overlayLanguageStorageListener);

    loadOverlaySearchEngineState();
    overlaySearchEngineStorageListener = (changes, areaName) => {
      if (!storageAreaName || areaName !== storageAreaName || !changes[DEFAULT_SEARCH_ENGINE_STORAGE_KEY]) {
        return;
      }
      const nextValue = changes[DEFAULT_SEARCH_ENGINE_STORAGE_KEY].newValue;
      if (nextValue && nextValue.id) {
        overlaySearchEngineState = nextValue;
        if (latestOverlayQuery) {
          updateSearchSuggestions(lastSuggestionResponse, latestOverlayQuery);
        }
      }
    };
    chrome.storage.onChanged.addListener(overlaySearchEngineStorageListener);
    if (storageArea) {
      storageArea.get([SEARCH_RESULT_PRIORITY_STORAGE_KEY], (result) => {
        overlaySearchResultPriorityMode = normalizeSearchResultPriority(result[SEARCH_RESULT_PRIORITY_STORAGE_KEY]);
      });
    }
    loadOverlaySearchBlacklistItems();
    overlaySearchResultPriorityStorageListener = (changes, areaName) => {
      if (!storageAreaName || areaName !== storageAreaName || !changes[SEARCH_RESULT_PRIORITY_STORAGE_KEY]) {
        return;
      }
      overlaySearchResultPriorityMode = normalizeSearchResultPriority(changes[SEARCH_RESULT_PRIORITY_STORAGE_KEY].newValue);
      if (latestOverlayQuery) {
        updateSearchSuggestions(lastSuggestionResponse, latestOverlayQuery);
      }
    };
    chrome.storage.onChanged.addListener(overlaySearchResultPriorityStorageListener);
    overlaySearchBlacklistStorageListener = (changes, areaName) => {
      if (!storageAreaName || areaName !== storageAreaName || !changes[SEARCH_BLACKLIST_STORAGE_KEY]) {
        return;
      }
      overlaySearchBlacklistItems = normalizeOverlaySearchBlacklistItems(
        changes[SEARCH_BLACKLIST_STORAGE_KEY].newValue
      );
      if (latestOverlayQuery) {
        updateSearchSuggestions(lastSuggestionResponse, latestOverlayQuery);
      }
    };
    chrome.storage.onChanged.addListener(overlaySearchBlacklistStorageListener);

    if (storageArea) {
      storageArea.get([OVERLAY_TAB_PRIORITY_STORAGE_KEY], (result) => {
        overlayTabQuickSwitchEnabled = normalizeOverlayTabPriorityMode(result[OVERLAY_TAB_PRIORITY_STORAGE_KEY]);
      });
    }
    overlayTabPriorityStorageListener = (changes, areaName) => {
      if (!storageAreaName || areaName !== storageAreaName || !changes[OVERLAY_TAB_PRIORITY_STORAGE_KEY]) {
        return;
      }
      overlayTabQuickSwitchEnabled = normalizeOverlayTabPriorityMode(changes[OVERLAY_TAB_PRIORITY_STORAGE_KEY].newValue);
      if (latestOverlayQuery) {
        updateSearchSuggestions(lastSuggestionResponse, latestOverlayQuery);
      }
    };
    chrome.storage.onChanged.addListener(overlayTabPriorityStorageListener);
    if (storageArea) {
      storageArea.get([OVERLAY_SIZE_MODE_STORAGE_KEY], (result) => {
        overlaySizeMode = normalizeOverlaySizeMode(result[OVERLAY_SIZE_MODE_STORAGE_KEY]);
        applyOverlaySizeForPageZoom(overlay);
      });
    }
    overlaySizeStorageListener = (changes, areaName) => {
      if (!storageAreaName || areaName !== storageAreaName || !changes[OVERLAY_SIZE_MODE_STORAGE_KEY]) {
        return;
      }
      overlaySizeMode = normalizeOverlaySizeMode(changes[OVERLAY_SIZE_MODE_STORAGE_KEY].newValue);
      applyOverlaySizeForPageZoom(overlay);
    };
    chrome.storage.onChanged.addListener(overlaySizeStorageListener);
    if (storageArea) {
      storageArea.get([TAB_RANK_SCORE_DEBUG_STORAGE_KEY], (result) => {
        overlayTabScoreDebugEnabled = normalizeTabRankScoreDebugMode(result[TAB_RANK_SCORE_DEBUG_STORAGE_KEY]);
      });
    }
    overlayTabScoreDebugStorageListener = (changes, areaName) => {
      if (!storageAreaName || areaName !== storageAreaName || !changes[TAB_RANK_SCORE_DEBUG_STORAGE_KEY]) {
        return;
      }
      overlayTabScoreDebugEnabled = normalizeTabRankScoreDebugMode(changes[TAB_RANK_SCORE_DEBUG_STORAGE_KEY].newValue);
      if (!latestOverlayQuery || !latestOverlayQuery.trim()) {
        requestTabsAndRender();
      }
    };
    chrome.storage.onChanged.addListener(overlayTabScoreDebugStorageListener);

    function isOverlayDarkMode() {
      return overlay && overlay.getAttribute('data-theme') === 'dark';
    }

    function getThemeForMode(theme) {
      if (!theme) {
        return defaultTheme;
      }
      if (!isOverlayDarkMode()) {
        return theme;
      }
      if (theme._xDark) {
        return theme._xDark;
      }
      const accentRgb = theme.accentRgb || parseCssColor(theme.accent) || defaultAccentColor;
      const darkTheme = buildThemeVariant(accentRgb, 'dark');
      darkTheme._xIsDefault = Boolean(theme._xIsDefault);
      darkTheme._xIsBrand = Boolean(theme._xIsBrand);
      theme._xDark = darkTheme;
      return darkTheme;
    }

    function getHoverColors(theme) {
      const resolvedTheme = getThemeForMode(theme);
      const accentRgb = resolvedTheme.accentRgb || parseCssColor(resolvedTheme.accent) || defaultAccentColor;
      const isDark = isOverlayDarkMode();
      const base = isDark ? [48, 48, 48] : [255, 255, 255];
      return {
        bg: rgbToCss(mixColor(accentRgb, base, isDark ? 0.6 : 0.9)),
        border: rgbToCss(mixColor(accentRgb, base, isDark ? 0.4 : 0.72))
      };
    }

    function getNeutralHoverActionColors() {
      return isOverlayDarkMode()
        ? {
          bg: 'rgba(255, 255, 255, 0.10)',
          border: 'rgba(255, 255, 255, 0.18)',
          text: '#E5E7EB'
        }
        : {
          bg: 'rgba(200, 208, 218, 0.45)',
          border: 'rgba(148, 163, 184, 0.28)',
          text: '#4B5563'
        };
    }
    const brandAccentMap = {
      'github.com': [36, 41, 46],
      'docs.github.com': [36, 41, 46],
      'douban.com': [0, 181, 29],
      'zhihu.com': [23, 127, 255],
      'bilibili.com': [0, 174, 236],
      'youtube.com': [255, 0, 0],
      'youtu.be': [255, 0, 0],
      'google.com': [66, 133, 244],
      'bing.com': [0, 120, 215],
      'baidu.com': [41, 98, 255],
      'taobao.com': [255, 80, 0],
      'tmall.com': [226, 35, 26],
      'juejin.cn': [30, 128, 255],
      'reddit.com': [255, 69, 0],
      'wikipedia.org': [64, 64, 64],
      'zh.wikipedia.org': [64, 64, 64],
      'x.com': [17, 24, 39],
      'twitter.com': [29, 161, 242]
    };

    function normalizeHost(hostname) {
      if (!hostname) {
        return '';
      }
      const lower = String(hostname).toLowerCase();
      const stripped = lower.replace(/^www\./i, '');
      if (stripped === 'my.feishu.cn') {
        return 'feishu.cn';
      }
      return stripped;
    }

    function normalizeFaviconHost(hostname) {
      return SEARCH_FAVICON_UTILS.normalizeFaviconHost(hostname);
    }

    function getGoogleFaviconUrl(hostname) {
      return SEARCH_FAVICON_UTILS.getGoogleFaviconUrl(hostname, {
        runtimeGetUrl: chrome && chrome.runtime && typeof chrome.runtime.getURL === 'function'
          ? chrome.runtime.getURL.bind(chrome.runtime)
          : null,
        size: 128
      });
    }

    function getFaviconIsUrl(hostname) {
      return SEARCH_FAVICON_UTILS.getFaviconIsUrl(hostname);
    }

    function getBrandAccentForHost(hostname) {
      const host = String(hostname || '').toLowerCase();
      if (!host) {
        return null;
      }
      if (brandAccentMap[host]) {
        return brandAccentMap[host];
      }
      const entry = Object.keys(brandAccentMap).find((key) => host === key || host.endsWith(`.${key}`));
      return entry ? brandAccentMap[entry] : null;
    }

    function getBrandAccentForUrl(url) {
      if (!url) {
        return null;
      }
      try {
        const hostname = normalizeHost(new URL(url).hostname);
        return getBrandAccentForHost(hostname);
      } catch (e) {
        return null;
      }
    }

    function hashStringToHue(value) {
      if (!value) {
        return 0;
      }
      let hash = 0;
      for (let i = 0; i < value.length; i += 1) {
        hash = ((hash << 5) - hash) + value.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash) % 360;
    }

    function hslToRgb(h, s, l) {
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const hp = h / 60;
      const x = c * (1 - Math.abs((hp % 2) - 1));
      let r = 0;
      let g = 0;
      let b = 0;
      if (hp >= 0 && hp < 1) {
        r = c; g = x; b = 0;
      } else if (hp >= 1 && hp < 2) {
        r = x; g = c; b = 0;
      } else if (hp >= 2 && hp < 3) {
        r = 0; g = c; b = x;
      } else if (hp >= 3 && hp < 4) {
        r = 0; g = x; b = c;
      } else if (hp >= 4 && hp < 5) {
        r = x; g = 0; b = c;
      } else if (hp >= 5 && hp < 6) {
        r = c; g = 0; b = x;
      }
      const m = l - c / 2;
      return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255)
      ];
    }

    function rgbToHsl(rgb) {
      const r = rgb[0] / 255;
      const g = rgb[1] / 255;
      const b = rgb[2] / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      let h = 0;
      const l = (max + min) / 2;
      let s = 0;
      if (delta !== 0) {
        s = delta / (1 - Math.abs(2 * l - 1));
        switch (max) {
          case r:
            h = 60 * (((g - b) / delta) % 6);
            break;
          case g:
            h = 60 * (((b - r) / delta) + 2);
            break;
          default:
            h = 60 * (((r - g) / delta) + 4);
            break;
        }
      }
      if (h < 0) {
        h += 360;
      }
      return [h, s, l];
    }

    function buildFallbackThemeForHost(hostname) {
      if (!hostname) {
        return null;
      }
      const hue = hashStringToHue(hostname);
      const accent = hslToRgb(hue, 0.55, 0.52);
      const theme = buildTheme(accent);
      theme._xIsBrand = true;
      theme._xIsFallback = true;
      return theme;
    }

    function getHostFromUrl(url) {
      if (!url) {
        return '';
      }
      try {
        return normalizeHost(new URL(url).hostname);
      } catch (e) {
        return '';
      }
    }

    function applyFaviconOpticalShift(img) {
      if (!img) {
        return;
      }
      const targetSize = 16;
      const visualCenter = (targetSize - 1) / 2;
      try {
        if (!(img.complete && img.naturalWidth > 0 && img.naturalHeight > 0)) {
          img.style.setProperty('transform', 'none', 'important');
          return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
          img.style.setProperty('transform', 'none', 'important');
          return;
        }
        context.clearRect(0, 0, targetSize, targetSize);
        context.drawImage(img, 0, 0, targetSize, targetSize);
        const data = context.getImageData(0, 0, targetSize, targetSize).data;
        let sumAlpha = 0;
        let weightedX = 0;
        let weightedY = 0;
        for (let y = 0; y < targetSize; y += 1) {
          for (let x = 0; x < targetSize; x += 1) {
            const alpha = data[(y * targetSize + x) * 4 + 3];
            if (alpha < 18) {
              continue;
            }
            sumAlpha += alpha;
            weightedX += x * alpha;
            weightedY += y * alpha;
          }
        }
        if (sumAlpha <= 0) {
          img.style.setProperty('transform', 'none', 'important');
          return;
        }
        const contentCenterX = weightedX / sumAlpha;
        const contentCenterY = weightedY / sumAlpha;
        const clamp = (value) => Math.max(-2, Math.min(2, value));
        let offsetX = clamp(visualCenter - contentCenterX);
        let offsetY = clamp(visualCenter - contentCenterY);
        if (Math.abs(offsetX) < 0.4) {
          offsetX = 0;
        }
        if (Math.abs(offsetY) < 0.4) {
          offsetY = 0;
        }
        img.style.setProperty('transform', `translate(${offsetX}px, ${offsetY}px)`, 'important');
      } catch (e) {
        img.style.setProperty('transform', 'none', 'important');
      }
    }

    function applyFaviconOpticalAlignment(img) {
      if (!img) {
        return;
      }
      img.style.setProperty('object-fit', 'contain', 'important');
      img.style.setProperty('object-position', 'center center', 'important');
      applyFaviconOpticalShift(img);
    }

    function extractAverageColor(image) {
      const size = 16;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) {
        return null;
      }
      try {
        context.drawImage(image, 0, 0, size, size);
        const data = context.getImageData(0, 0, size, size).data;
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha < 32) {
            continue;
          }
          const red = data[i];
          const green = data[i + 1];
          const blue = data[i + 2];
          const brightness = (red + green + blue) / 3;
          if (brightness > 245) {
            continue;
          }
          r += red;
          g += green;
          b += blue;
          count += 1;
        }
        if (!count) {
          for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3];
            if (alpha < 32) {
              continue;
            }
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count += 1;
          }
        }
        if (!count) {
          return null;
        }
        return [
          Math.round(r / count),
          Math.round(g / count),
          Math.round(b / count)
        ];
      } catch (e) {
        return null;
      }
    }

    function isFaviconProxyUrl(url) {
      if (!url) {
        return false;
      }
      return /google\.com\/s2\/favicons/i.test(url) || /gstatic\.com\/favicon/i.test(url);
    }

    function getThemeFromUrl(url, hostOverride) {
      if (!url) {
        return Promise.resolve(defaultTheme);
      }
      const hostKey = hostOverride || getHostFromUrl(url);
      if (isBlockedLocalFaviconUrl(url) || (hostKey && shouldBlockFaviconForHost(hostKey))) {
        const fallbackTheme = buildFallbackThemeForHost(hostKey);
        return Promise.resolve(fallbackTheme || defaultTheme);
      }
      const isProxy = isFaviconProxyUrl(url);
      const useHostCache = hostKey && (!isProxy || Boolean(hostOverride));
      if (useHostCache && themeHostCache.has(hostKey)) {
        return Promise.resolve(themeHostCache.get(hostKey));
      }
      if (themeColorCache.has(url)) {
        return Promise.resolve(themeColorCache.get(url));
      }
      const brandAccent = (isProxy && hostOverride) ? null : getBrandAccentForUrl(url);
      if (brandAccent) {
        const brandTheme = buildTheme(brandAccent);
        brandTheme._xIsBrand = true;
        themeColorCache.set(url, brandTheme);
        if (useHostCache) {
          themeHostCache.set(hostKey, brandTheme);
        }
        return Promise.resolve(brandTheme);
      }
      const cachedFaviconData = faviconDataCache.get(url);
      if (cachedFaviconData) {
        return new Promise((resolve) => {
          const image = new Image();
          image.onload = function() {
            const avg = extractAverageColor(image);
            if (!avg) {
              themeColorCache.set(url, defaultTheme);
              resolve(defaultTheme);
              return;
            }
            const theme = buildTheme(avg);
            theme._xIsBrand = true;
            themeColorCache.set(url, theme);
            if (useHostCache) {
              themeHostCache.set(hostKey, theme);
            }
            resolve(theme);
          };
          image.onerror = function() {
            themeColorCache.set(url, defaultTheme);
            resolve(defaultTheme);
          };
          image.src = cachedFaviconData;
        });
      }
      if (isProxy) {
        return requestFaviconData(url).then((dataUrl) => {
          if (!dataUrl) {
            themeColorCache.set(url, defaultTheme);
            return defaultTheme;
          }
          return new Promise((resolve) => {
            const image = new Image();
            image.onload = function() {
              const avg = extractAverageColor(image);
              if (!avg) {
                themeColorCache.set(url, defaultTheme);
                resolve(defaultTheme);
                return;
              }
              const theme = buildTheme(avg);
              theme._xIsBrand = true;
              themeColorCache.set(url, theme);
              if (useHostCache) {
                themeHostCache.set(hostKey, theme);
              }
              resolve(theme);
            };
            image.onerror = function() {
              themeColorCache.set(url, defaultTheme);
              resolve(defaultTheme);
            };
            image.src = dataUrl;
          });
        });
      }
      return new Promise((resolve) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = function() {
          const avg = extractAverageColor(image);
          if (!avg) {
            themeColorCache.set(url, defaultTheme);
            resolve(defaultTheme);
            return;
          }
          const theme = buildTheme(avg);
          theme._xIsBrand = true;
          themeColorCache.set(url, theme);
          if (useHostCache) {
            themeHostCache.set(hostKey, theme);
          }
          resolve(theme);
        };
        image.onerror = function() {
          themeColorCache.set(url, defaultTheme);
          resolve(defaultTheme);
        };
        image.src = url;
      });
    }

    function getThemeForProvider(provider) {
      if (provider && provider.template) {
        const brandAccent = getBrandAccentForUrl(provider.template);
        if (brandAccent) {
          const brandTheme = buildTheme(brandAccent);
          brandTheme._xIsBrand = true;
          return Promise.resolve(brandTheme);
        }
      }
      return getThemeFromUrl(getProviderIcon(provider));
    }

    function shouldUseBrandTheme(suggestion) {
      if (!suggestion) {
        return false;
      }
    const neutralTypes = ['googleSuggest', 'newtab', 'modeSwitch', 'chatgpt', 'perplexity', 'commandNewTab', 'commandSettings'];
      if (neutralTypes.includes(suggestion.type)) {
        return false;
      }
      return true;
    }

    function getThemeForSuggestion(suggestion) {
      if (!shouldUseBrandTheme(suggestion)) {
        return Promise.resolve(defaultTheme);
      }
      if (suggestion && suggestion.provider) {
        return getThemeForProvider(suggestion.provider);
      }
      if (suggestion && suggestion.url) {
        const brandAccent = getBrandAccentForUrl(suggestion.url);
        if (brandAccent) {
          const brandTheme = buildTheme(brandAccent);
          brandTheme._xIsBrand = true;
          return Promise.resolve(brandTheme);
        }
      }
      const hostKey = suggestion && suggestion.url ? getHostFromUrl(suggestion.url) : '';
      if (hostKey && shouldBlockFaviconForHost(hostKey)) {
        const fallbackTheme = buildFallbackThemeForHost(hostKey);
        return Promise.resolve(fallbackTheme || defaultTheme);
      }
      const siteFavicon = hostKey ? getSiteFaviconUrl(hostKey) : '';
      if (siteFavicon) {
        return getThemeFromUrl(siteFavicon, hostKey).then((theme) => {
          if (theme && !theme._xIsDefault) {
            return theme;
          }
          return getThemeFromUrl(getThemeSourceForSuggestion(suggestion), hostKey);
        });
      }
      return getThemeFromUrl(getThemeSourceForSuggestion(suggestion), hostKey);
    }

    function getImmediateThemeForSuggestion(suggestion) {
      if (!shouldUseBrandTheme(suggestion)) {
        return defaultTheme;
      }
      if (suggestion && suggestion.provider) {
        const brandAccent = getBrandAccentForUrl(suggestion.provider.template);
        if (brandAccent) {
          const brandTheme = buildTheme(brandAccent);
          brandTheme._xIsBrand = true;
          return brandTheme;
        }
      }
      if (suggestion && suggestion.url) {
        const hostKey = getHostFromUrl(suggestion.url);
        if (hostKey && themeHostCache.has(hostKey)) {
          return themeHostCache.get(hostKey);
        }
        if (themeColorCache.has(suggestion.url)) {
          return themeColorCache.get(suggestion.url);
        }
        const brandAccent = getBrandAccentForUrl(suggestion.url);
        if (brandAccent) {
          const brandTheme = buildTheme(brandAccent);
          brandTheme._xIsBrand = true;
          return brandTheme;
        }
        const fallbackTheme = buildFallbackThemeForHost(hostKey);
        if (fallbackTheme) {
          return fallbackTheme;
        }
      }
      return null;
    }

    function applyThemeVariables(target, theme) {
      if (!target || !theme) {
        return;
      }
      const resolvedTheme = getThemeForMode(theme);
      target.style.setProperty('--x-ext-mark-bg', resolvedTheme.markBg, 'important');
      target.style.setProperty('--x-ext-mark-text', resolvedTheme.markText, 'important');
      target.style.setProperty('--x-ext-tag-bg', resolvedTheme.tagBg, 'important');
      target.style.setProperty('--x-ext-tag-text', resolvedTheme.tagText, 'important');
      target.style.setProperty('--x-ext-tag-border', resolvedTheme.tagBorder, 'important');
      target.style.setProperty('--x-ext-key-bg', resolvedTheme.keyBg, 'important');
      target.style.setProperty('--x-ext-key-text', resolvedTheme.keyText, 'important');
      target.style.setProperty('--x-ext-key-border', resolvedTheme.keyBorder, 'important');
      target.style.setProperty('--x-ext-icon-color', resolvedTheme.accent, 'important');
    }

    function applyMarkVariables(target, theme) {
      if (!target || !theme) {
        return;
      }
      const resolvedTheme = getThemeForMode(theme);
      target.style.setProperty('--x-ext-mark-bg', resolvedTheme.markBg, 'important');
      target.style.setProperty('--x-ext-mark-text', resolvedTheme.markText, 'important');
    }

    const iconPreloadCache = new Map();
    const faviconDataCache = new Map();
    const faviconDataPending = new Map();
    const resolvedFaviconUrlCache = window._x_extension_overlay_favicon_url_cache_2024_unique_ || new Map();
    window._x_extension_overlay_favicon_url_cache_2024_unique_ = resolvedFaviconUrlCache;

    function dedupeOverlayFaviconCandidateUrls(urls) {
      const unique = [];
      const seen = new Set();
      (urls || []).forEach((item) => {
        const value = String(item || '').trim();
        if (!value || seen.has(value)) {
          return;
        }
        seen.add(value);
        unique.push(value);
      });
      return unique;
    }

    function isChromeMonogramFaviconUrl(url) {
      return /^chrome:\/\/favicon2\//i.test(String(url || '').trim());
    }

    function getKnownOverlayThemedFaviconCandidates(hostname, preferredTheme) {
      const host = normalizeFaviconHost(hostname);
      if (!host) {
        return [];
      }
      if (host === 'lumno.kubai.design') {
        const lumnoIconUrl = (chrome && chrome.runtime && typeof chrome.runtime.getURL === 'function')
          ? chrome.runtime.getURL('public/assets/images/lumno.png')
          : 'https://lumno.kubai.design/favicon.png';
        return [lumnoIconUrl];
      }
      if (host === 'github.com' || host.endsWith('.github.com')) {
        if (preferredTheme === 'dark') {
          return [
            'https://github.githubassets.com/favicons/favicon-dark.svg',
            'https://github.githubassets.com/favicons/favicon.svg',
            'https://github.githubassets.com/favicons/favicon.png'
          ];
        }
        return [
          'https://github.githubassets.com/favicons/favicon.svg',
          'https://github.githubassets.com/favicons/favicon-dark.svg',
          'https://github.githubassets.com/favicons/favicon.png'
        ];
      }
      return [];
    }

    function overlayHostHasExplicitDarkFavicon(hostname) {
      const host = normalizeFaviconHost(hostname);
      if (!host) {
        return false;
      }
      return host === 'github.com' || host.endsWith('.github.com');
    }

    function isBlockedLocalFaviconUrl(url) {
      const raw = String(url || '').trim();
      if (!raw) {
        return false;
      }
      const decodedRaw = (() => {
        try {
          return decodeURIComponent(raw);
        } catch (e) {
          return raw;
        }
      })();
      const withoutScheme = decodedRaw.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
      const authority = withoutScheme.split(/[/?#]/)[0] || '';
      const hostCandidateRaw = authority.includes('@') ? authority.split('@').pop() : authority;
      const hostCandidate = (() => {
        const value = String(hostCandidateRaw || '').trim().toLowerCase();
        if (!value) {
          return '';
        }
        if (value.startsWith('[')) {
          const endBracket = value.indexOf(']');
          if (endBracket > 1) {
            return value.slice(1, endBracket);
          }
        }
        return value.replace(/^\[|\]$/g, '').split(':')[0];
      })();
      if (hostCandidate && shouldBlockFaviconForHost(hostCandidate)) {
        return true;
      }
      try {
        const parsed = new URL(raw);
        const protocol = String(parsed.protocol || '').toLowerCase();
        if ((protocol === 'http:' || protocol === 'https:') && shouldBlockFaviconForHost(parsed.hostname)) {
          return true;
        }
        if (protocol === 'chrome:' && parsed.hostname === 'favicon2') {
          const nested = parsed.searchParams.get('url') || '';
          if (nested) {
            try {
              const nestedUrl = new URL(nested);
              if (shouldBlockFaviconForHost(nestedUrl.hostname)) {
                return true;
              }
            } catch (e) {
              // Ignore malformed nested URL.
            }
          }
        }
      } catch (e) {
        // Ignore malformed URL.
      }
      return false;
    }

    function requestFaviconData(url) {
      if (!url || url.startsWith('data:') || isBlockedLocalFaviconUrl(url)) {
        return Promise.resolve(null);
      }
      if (faviconDataCache.has(url)) {
        return Promise.resolve(faviconDataCache.get(url));
      }
      if (faviconDataPending.has(url)) {
        return faviconDataPending.get(url);
      }
      const promise = new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'getFaviconData', url: url }, (response) => {
          const dataUrl = response && response.data ? response.data : '';
          if (dataUrl) {
            faviconDataCache.set(url, dataUrl);
          }
          faviconDataPending.delete(url);
          resolve(dataUrl || null);
        });
      });
      faviconDataPending.set(url, promise);
      return promise;
    }

    function setFaviconSrcWithAnimation(img, nextSrc) {
      if (!img || !nextSrc || isBlockedLocalFaviconUrl(nextSrc)) {
        return false;
      }
      const currentSrc = img.getAttribute('data-favicon-current-src') || '';
      if (currentSrc === nextSrc) {
        return false;
      }
      const hasAppeared = img.getAttribute('data-favicon-has-appeared') === 'true';
      const shouldAnimate = !hasAppeared;
      img._xFaviconLoadToken = (img._xFaviconLoadToken || 0) + 1;
      const token = img._xFaviconLoadToken;
      const finalize = () => {
        if (!img || token !== img._xFaviconLoadToken) {
          return;
        }
        img.setAttribute('data-favicon-current-src', nextSrc);
        img.setAttribute('data-favicon-has-appeared', 'true');
        applyFaviconOpticalShift(img);
        if (!shouldAnimate) {
          img.style.setProperty('filter', 'none', 'important');
          img.style.setProperty('opacity', '1', 'important');
          img.style.setProperty('transition', 'none', 'important');
          return;
        }
        img.style.setProperty('transition', 'none', 'important');
        img.style.setProperty('filter', 'blur(4px)', 'important');
        img.style.setProperty('opacity', '0.72', 'important');
        requestAnimationFrame(() => {
          if (!img || token !== img._xFaviconLoadToken) {
            return;
          }
          img.style.setProperty('transition', 'filter 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 240ms cubic-bezier(0.22, 1, 0.36, 1)', 'important');
          img.style.setProperty('filter', 'blur(0)', 'important');
          img.style.setProperty('opacity', '1', 'important');
        });
      };
      img.addEventListener('load', finalize, { once: true });
      img.src = nextSrc;
      if (img.complete && img.naturalWidth > 0) {
        finalize();
      }
      return true;
    }

    function canReuseCurrentFavicon(img, nextSrc) {
      if (!img || !nextSrc) {
        return false;
      }
      const currentSrc = img.getAttribute('data-favicon-current-src') || img.src || '';
      if (currentSrc !== nextSrc) {
        return false;
      }
      const currentResolved = img.getAttribute('data-favicon-current-src') || '';
      if (currentResolved === nextSrc) {
        return true;
      }
      return Boolean(img.complete && img.naturalWidth > 0);
    }

    function getLastWorkingFaviconSrc(img) {
      if (!img) {
        return '';
      }
      const resolved = img.getAttribute('data-favicon-current-src') || '';
      if (resolved) {
        return resolved;
      }
      if (img.complete && img.naturalWidth > 0) {
        return img.src || '';
      }
      return '';
    }

    function restoreWorkingFaviconOrFail(img, previousSrc, onFailed) {
      const fallbackSrc = String(previousSrc || '').trim();
      if (fallbackSrc) {
        const applied = setFaviconSrcWithAnimation(img, fallbackSrc);
        if (applied || canReuseCurrentFavicon(img, fallbackSrc)) {
          return true;
        }
      }
      if (typeof onFailed === 'function') {
        onFailed();
      }
      return false;
    }

    function createOverlayThemeAwareFaviconState(img, pageUrl, hostKey, fallbackUrl, onFailed) {
      img._xOverlayThemeFaviconSession = (img._xOverlayThemeFaviconSession || 0) + 1;
      const session = img._xOverlayThemeFaviconSession;
      const normalizedHostKey = hostKey || getHostFromUrl(pageUrl);
      const preferredTheme = isOverlayDarkMode() ? 'dark' : 'light';
      const cacheKey = `${String(normalizedHostKey || '')}::${String(pageUrl || '')}::${String(fallbackUrl || '')}::${preferredTheme}`;
      const shouldBypassCachedUrl = normalizeFaviconHost(normalizedHostKey || '') === 'lumno.kubai.design';
      const cachedUrl = resolvedFaviconUrlCache.get(cacheKey) || '';
      const safeCachedUrl = (shouldBypassCachedUrl || isBlockedLocalFaviconUrl(cachedUrl) || isChromeMonogramFaviconUrl(cachedUrl))
        ? ''
        : cachedUrl;
      const safeFallbackUrl = isBlockedLocalFaviconUrl(fallbackUrl) ? '' : String(fallbackUrl || '');

      return {
        pageUrl: String(pageUrl || ''),
        hostKey: String(normalizedHostKey || ''),
        faviconHostKey: normalizeFaviconHost(normalizedHostKey || ''),
        fallbackUrl: safeFallbackUrl,
        preferredTheme,
        previousWorkingSrc: getLastWorkingFaviconSrc(img),
        cacheKey,
        safeCachedUrl,
        googleFavicon: normalizedHostKey ? getGoogleFaviconUrl(normalizedHostKey) : '',
        faviconIsFavicon: normalizedHostKey ? getFaviconIsUrl(normalizedHostKey) : '',
        handleFailed: typeof onFailed === 'function' ? onFailed : function() {},
        shouldPreferDarkTokenUpgrades: preferredTheme === 'dark' &&
          overlayHostHasExplicitDarkFavicon(normalizedHostKey),
        isSessionCurrent() {
          return Boolean(img && img._xOverlayThemeFaviconSession === session);
        },
        isSessionMounted() {
          return Boolean(img && img.isConnected && img._xOverlayThemeFaviconSession === session);
        }
      };
    }

    function syncOverlayThemeAwareFaviconAttributes(img, state) {
      img.setAttribute('data-x-ov-theme-favicon', '1');
      img.setAttribute('data-x-ov-favicon-page-url', state.pageUrl);
      img.setAttribute('data-x-ov-favicon-host', state.hostKey);
      img.setAttribute('data-x-ov-favicon-fallback-url', state.fallbackUrl);
    }

    function buildOverlayThemeAwareFaviconCandidatePlan(state) {
      const siteSvgFavicon = state.faviconHostKey ? `https://${state.faviconHostKey}/favicon.svg` : '';
      const siteDarkSvgFavicon = state.faviconHostKey ? `https://${state.faviconHostKey}/favicon-dark.svg` : '';
      const siteLightSvgFavicon = state.faviconHostKey ? `https://${state.faviconHostKey}/favicon-light.svg` : '';
      const siteIcoFavicon = state.faviconHostKey ? `https://${state.faviconHostKey}/favicon.ico` : '';
      const themedCandidates = state.preferredTheme === 'dark'
        ? [siteDarkSvgFavicon, siteSvgFavicon, siteIcoFavicon, siteLightSvgFavicon]
        : [siteLightSvgFavicon, siteSvgFavicon, siteIcoFavicon, siteDarkSvgFavicon];
      const knownThemedCandidates = getKnownOverlayThemedFaviconCandidates(state.faviconHostKey, state.preferredTheme);

      return {
        localCandidates: dedupeOverlayFaviconCandidateUrls([
          state.safeCachedUrl,
          state.fallbackUrl,
          ...knownThemedCandidates,
          ...themedCandidates,
          state.googleFavicon,
          state.faviconIsFavicon
        ]).filter((candidate) => !isBlockedLocalFaviconUrl(candidate))
      };
    }

    function tryApplyOverlayThemeAwareFaviconCandidate(img, state, tried, nextUrl) {
      if (!nextUrl || !img || !state.isSessionCurrent()) {
        return false;
      }
      if (tried.has(nextUrl)) {
        return false;
      }
      tried.add(nextUrl);
      const applied = setFaviconSrcWithAnimation(img, nextUrl);
      const reused = !applied && canReuseCurrentFavicon(img, nextUrl);
      if (!applied && !reused) {
        return false;
      }
      img.style.setProperty('visibility', 'visible', 'important');
      if (!isChromeMonogramFaviconUrl(nextUrl) && state.cacheKey) {
        resolvedFaviconUrlCache.set(state.cacheKey, nextUrl);
      }
      return true;
    }

    function requestResolvedOverlayThemeAwareFaviconCandidates(state) {
      if (!state.pageUrl) {
        return Promise.resolve([]);
      }
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          {
            action: 'resolveFaviconCandidates',
            url: state.pageUrl,
            host: state.hostKey,
            fallbackUrl: state.fallbackUrl,
            preferredTheme: state.preferredTheme
          },
          (response) => {
            const resolved = response && Array.isArray(response.urls) ? response.urls : [];
            resolve(
              dedupeOverlayFaviconCandidateUrls(resolved)
                .filter((candidate) => candidate && !isBlockedLocalFaviconUrl(candidate))
            );
          }
        );
      });
    }

    function tryUpgradeOverlayThemeAwareFaviconCandidates(img, state, candidateUrls) {
      const currentSrc = img && img.src ? String(img.src) : '';
      const upgrades = dedupeOverlayFaviconCandidateUrls(candidateUrls).filter((candidate) => {
        if (!candidate || candidate === currentSrc || isChromeMonogramFaviconUrl(candidate)) {
          return false;
        }
        if (state.shouldPreferDarkTokenUpgrades && !/(^|[._/-])dark([._/-]|$)/i.test(String(candidate || ''))) {
          return false;
        }
        if (shouldSkipThemeUpgradeCandidate(candidate, state.preferredTheme, currentSrc)) {
          return false;
        }
        return true;
      });
      if (upgrades.length === 0) {
        return;
      }

      const tryUpgrade = (index) => {
        if (!state.isSessionMounted() || index >= upgrades.length) {
          return;
        }
        const candidate = upgrades[index];
        const probe = new Image();
        probe.referrerPolicy = 'no-referrer';
        probe.onload = () => {
          if (!state.isSessionMounted()) {
            return;
          }
          setFaviconSrcWithAnimation(img, candidate);
          img.style.setProperty('visibility', 'visible', 'important');
          if (state.cacheKey) {
            resolvedFaviconUrlCache.set(state.cacheKey, candidate);
          }
        };
        probe.onerror = () => {
          tryUpgrade(index + 1);
        };
        probe.src = candidate;
      };

      tryUpgrade(0);
    }

    function finalizeOverlayThemeAwareFaviconFailure(img, state) {
      img.style.removeProperty('visibility');
      restoreWorkingFaviconOrFail(img, state.previousWorkingSrc, state.handleFailed);
    }

    function attachResolvedFaviconWithFallbacks(img, pageUrl, hostKey, fallbackUrl, onFailed) {
      if (!img) {
        return;
      }
      const state = createOverlayThemeAwareFaviconState(img, pageUrl, hostKey, fallbackUrl, onFailed);
      if (state.hostKey && shouldBlockFaviconForHost(state.hostKey)) {
        state.handleFailed();
        return;
      }
      syncOverlayThemeAwareFaviconAttributes(img, state);
      const candidatePlan = buildOverlayThemeAwareFaviconCandidatePlan(state);
      const tried = new Set();
      let resolvedCandidates = [];
      let resolvedCandidatesLoaded = !state.pageUrl;

      if (img._xOverlayThemeFaviconErrorHandler) {
        img.removeEventListener('error', img._xOverlayThemeFaviconErrorHandler);
        img._xOverlayThemeFaviconErrorHandler = null;
      }

      const tryNextAvailableCandidate = () => {
        const candidatePool = dedupeOverlayFaviconCandidateUrls([
          ...candidatePlan.localCandidates,
          ...resolvedCandidates
        ]);
        for (let i = 0; i < candidatePool.length; i += 1) {
          if (tryApplyOverlayThemeAwareFaviconCandidate(img, state, tried, candidatePool[i])) {
            return true;
          }
        }
        return false;
      };

      const handleImageError = () => {
        if (!state.isSessionCurrent()) {
          return;
        }
        if (tryNextAvailableCandidate()) {
          return;
        }
        if (!resolvedCandidatesLoaded) {
          img.style.setProperty('visibility', 'hidden', 'important');
          return;
        }
        finalizeOverlayThemeAwareFaviconFailure(img, state);
      };

      img._xOverlayThemeFaviconErrorHandler = handleImageError;
      img.addEventListener('error', handleImageError);

      const appliedInitial = tryNextAvailableCandidate();
      if (!state.pageUrl) {
        if (!appliedInitial) {
          finalizeOverlayThemeAwareFaviconFailure(img, state);
        }
        return;
      }

      requestResolvedOverlayThemeAwareFaviconCandidates(state)
        .then((resolved) => {
          if (!state.isSessionCurrent()) {
            return;
          }
          resolvedCandidates = resolved;
          resolvedCandidatesLoaded = true;

          if (!appliedInitial || img.style.visibility === 'hidden') {
            if (!tryNextAvailableCandidate()) {
              finalizeOverlayThemeAwareFaviconFailure(img, state);
            }
            return;
          }

          tryUpgradeOverlayThemeAwareFaviconCandidates(img, state, [
            ...resolvedCandidates,
            ...candidatePlan.localCandidates
          ]);
        })
        .catch(() => {
          resolvedCandidatesLoaded = true;
          if (!state.isSessionCurrent()) {
            return;
          }
          if (!appliedInitial || img.style.visibility === 'hidden') {
            finalizeOverlayThemeAwareFaviconFailure(img, state);
          }
        });
    }

    function refreshOverlayThemeAwareFavicons() {
      if (!overlay) {
        return;
      }
      overlay.querySelectorAll('img[data-x-ov-theme-favicon="1"]').forEach((img) => {
        if (!img || !img.isConnected) {
          return;
        }
        const pageUrl = img.getAttribute('data-x-ov-favicon-page-url') || '';
        if (!pageUrl) {
          return;
        }
        const hostKey = img.getAttribute('data-x-ov-favicon-host') || '';
        const fallbackUrl = img.getAttribute('data-x-ov-favicon-fallback-url') || '';
        attachResolvedFaviconWithFallbacks(img, pageUrl, hostKey, fallbackUrl);
      });
    }

    function attachFaviconData(img, url, hostOverride) {
      if (!img || !url) {
        return;
      }
      const cached = faviconDataCache.get(url);
      if (cached) {
        setFaviconSrcWithAnimation(img, cached);
        preloadThemeFromFavicon(url, cached, hostOverride);
        return;
      }
      requestFaviconData(url).then((dataUrl) => {
        if (!dataUrl || !img.isConnected) {
          return;
        }
        setFaviconSrcWithAnimation(img, dataUrl);
        preloadThemeFromFavicon(url, dataUrl, hostOverride);
      });
    }

    function preloadThemeFromFavicon(url, dataUrl, hostOverride) {
      if (!url || themeColorCache.has(url)) {
        return;
      }
      const hostKey = hostOverride || getHostFromUrl(url);
      const useHostCache = hostKey && (Boolean(hostOverride) || !isFaviconProxyUrl(url));
      if (useHostCache && themeHostCache.has(hostKey)) {
        return;
      }
      if (!dataUrl) {
        return;
      }
      const image = new Image();
      image.onload = function() {
        const avg = extractAverageColor(image);
        if (!avg) {
          return;
        }
        const theme = buildTheme(avg);
        theme._xIsBrand = true;
        themeColorCache.set(url, theme);
        if (useHostCache) {
          themeHostCache.set(hostKey, theme);
        }
      };
      image.onerror = function() {};
      image.src = dataUrl;
    }

    function preloadIcon(url) {
      if (!url || url.startsWith('data:') || iconPreloadCache.has(url) || isBlockedLocalFaviconUrl(url)) {
        return;
      }
      const host = getHostFromUrl(url);
      if (host && shouldBlockFaviconForHost(host)) {
        return;
      }
      const img = new Image();
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      img.src = url;
      iconPreloadCache.set(url, img);
    }

    function warmIconCache(list) {
      if (!Array.isArray(list)) {
        return;
      }
      list.forEach((item) => {
        if (!item) {
          return;
        }
        const skipType = item.type === 'browserPage' ||
          item.type === 'directUrl' ||
          item.type === 'newtab' ||
          item.type === 'googleSuggest';
        if (item.favicon && !skipType) {
          preloadIcon(item.favicon);
          const hostKey = item && item.url ? getHostFromUrl(item.url) : '';
          requestFaviconData(item.favicon).then((dataUrl) => {
            if (dataUrl) {
              preloadThemeFromFavicon(item.favicon, dataUrl, hostKey);
            }
          });
        }
        const hostKeyForTheme = item && item.url ? getHostFromUrl(item.url) : '';
        if (hostKeyForTheme && !themeHostCache.has(hostKeyForTheme)) {
          const siteFavicon = getSiteFaviconUrl(hostKeyForTheme);
          if (siteFavicon) {
            requestFaviconData(siteFavicon).then((dataUrl) => {
              if (dataUrl) {
                preloadThemeFromFavicon(siteFavicon, dataUrl, hostKeyForTheme);
              }
            });
          }
        }
      });
    }

  function createSearchIcon() {
    const icon = document.createElement('span');
    icon.innerHTML = getRiSvg('ri-search-line', 'ri-size-16');
      icon.style.cssText = `
        all: unset !important;
        width: 16px !important;
        height: 16px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-sizing: border-box !important;
        margin: 0 !important;
        padding: 0 !important;
        line-height: 1 !important;
        text-decoration: none !important;
        list-style: none !important;
        outline: none !important;
        background: transparent !important;
        color: inherit !important;
        font-size: 100% !important;
        font: inherit !important;
        vertical-align: baseline !important;
      `;
      return icon;
    }

    function createLinkIcon() {
      const icon = document.createElement('span');
      icon.innerHTML = getRiSvg('ri-link', 'ri-size-16');
      icon.style.cssText = `
        all: unset !important;
        width: 16px !important;
        height: 16px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-sizing: border-box !important;
        margin: 0 !important;
        padding: 0 !important;
        line-height: 1 !important;
        text-decoration: none !important;
        list-style: none !important;
        outline: none !important;
        background: transparent !important;
        color: inherit !important;
        font-size: 100% !important;
        font: inherit !important;
        vertical-align: baseline !important;
      `;
      return icon;
    }

    function getNonFaviconIconBg() {
      return isOverlayDarkMode() ? 'rgba(255, 255, 255, 0.12)' : '#FFFFFF';
    }

    function getOverlayActionTagPalette() {
      if (isOverlayDarkMode()) {
        return {
          tagBg: 'rgba(59, 130, 246, 0.22)',
          tagText: '#DBEAFE',
          tagBorder: 'rgba(147, 197, 253, 0.52)',
          keyBg: 'rgba(15, 23, 42, 0.45)',
          keyText: '#DBEAFE',
          keyBorder: 'rgba(147, 197, 253, 0.46)'
        };
      }
      return {
        tagBg: '#EEF6FF',
        tagText: '#1E3A8A',
        tagBorder: '#BFDBFE',
        keyBg: '#FFFFFF',
        keyText: '#1E3A8A',
        keyBorder: '#BFDBFE'
      };
    }

    function setNonFaviconIconBg(item, isActive) {
      if (!item || !item._xIconWrap || item._xIconIsFavicon) {
        return;
      }
      item._xIconWrap.style.setProperty(
        'background-color',
        isActive ? getNonFaviconIconBg() : 'transparent',
        'important'
      );
    }

    function createActionTag(labelText, keyLabel) {
      const tag = document.createElement('span');
      applyNoTranslate(tag);
      tag.style.cssText = `
        all: unset !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
        background: var(--x-ext-tag-bg, #EEF6FF) !important;
        color: var(--x-ext-tag-text, #1E3A8A) !important;
        border: 1px solid var(--x-ext-tag-border, #BFDBFE) !important;
        padding: 4px 10px 4px 8px !important;
        border-radius: 999px !important;
        font-size: 11px !important;
        font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
        line-height: 1 !important;
        text-decoration: none !important;
        list-style: none !important;
        outline: none !important;
        box-sizing: border-box !important;
        vertical-align: middle !important;
        white-space: nowrap !important;
      `;

      const label = document.createElement('span');
      setProtectedPlainText(label, labelText);
      label.style.cssText = `
        all: unset !important;
        font-weight: 500 !important;
        line-height: 1 !important;
      `;

      const keycap = document.createElement('span');
      setProtectedPlainText(keycap, keyLabel);
      keycap.style.cssText = `
        all: unset !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 2px 7px !important;
        border-radius: 6px !important;
        background: var(--x-ext-key-bg, #FFFFFF) !important;
        color: var(--x-ext-key-text, #1E3A8A) !important;
        border: 1px solid var(--x-ext-key-border, #BFDBFE) !important;
        box-shadow: 0 1px 0 rgba(0, 0, 0, 0.12) !important;
        font-size: 10px !important;
        font-weight: 500 !important;
        line-height: 1 !important;
      `;

      tag.appendChild(label);
      tag.appendChild(keycap);
      return tag;
    }

    function getThemeSourceForSuggestion(suggestion) {
      if (suggestion && suggestion.url) {
        try {
          const hostname = normalizeHost(new URL(suggestion.url).hostname);
          if (hostname) {
            if (shouldBlockFaviconForHost(hostname)) {
              return '';
            }
            return getGoogleFaviconUrl(hostname) || getFaviconIsUrl(hostname);
          }
        } catch (e) {
          // Ignore malformed URLs.
        }
      }
      return suggestion && suggestion.favicon ? suggestion.favicon : '';
    }

    function getSiteFaviconUrl(hostname) {
      if (!hostname) {
        return '';
      }
      return `https://${hostname}/favicon.ico`;
    }

    const siteSearchPrefix = document.createElement('span');
    siteSearchPrefix.id = '_x_extension_site_search_prefix_2024_unique_';
    siteSearchPrefix.setAttribute('data-ai-sweep-distort', 'prefix');
    siteSearchPrefix.style.cssText = `
      all: unset !important;
      position: absolute !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      left: 50px !important;
      display: none !important;
      align-items: center !important;
      max-width: 0 !important;
      padding: 0 8px !important;
      height: 22px !important;
      border-radius: 8px !important;
      border: none !important;
      background: var(--x-ext-tag-bg, #EEF6FF) !important;
      color: #FFFFFF !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
      font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
      font-size: 12px !important;
      font-weight: 500 !important;
      line-height: 1 !important;
      pointer-events: none !important;
      z-index: 1 !important;
    `;
    const siteSearchPrefixLabel = document.createElement('span');
    applyNoTranslate(siteSearchPrefixLabel);
    siteSearchPrefixLabel.style.cssText = `
      all: unset !important;
      display: block !important;
      min-width: 0 !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
      line-height: 1 !important;
    `;
    siteSearchPrefix.appendChild(siteSearchPrefixLabel);
    inputContainer.appendChild(siteSearchPrefix);
    inputContainer.style.setProperty('position', 'relative', 'important');
    inputContainer.style.setProperty('z-index', '2', 'important');

    function ensureAiModeDecor() {
      if (aiModeDecor) {
        return aiModeDecor;
      }
      if (typeof window._x_extension_createBorderBeamEffect_2026_unique_ !== 'function') {
        return null;
      }
      aiModeDecor = window._x_extension_createBorderBeamEffect_2026_unique_({
        target: overlay,
        themeTarget: overlay,
        borderRadius: 28,
        borderWidth: 1,
        zIndex: 1,
        spread: 0,
        duration: 2.4,
        hueRange: 13,
        strength: 0.82,
        theme: 'auto',
        active: false
      });
      return aiModeDecor;
    }

    function ensureAiModeSweep() {
      if (aiModeSweep) {
        return aiModeSweep;
      }
      if (!overlay || typeof window._x_extension_createAiSweepEffect_2026_unique_ !== 'function') {
        return null;
      }
      aiModeSweep = window._x_extension_createAiSweepEffect_2026_unique_({
        target: overlay,
        themeTarget: overlay,
        borderRadius: 28,
        zIndex: 4,
        duration: 2280,
        maxDisplacement: 24,
        distortionSelector: '[data-ai-sweep-distort]'
      });
      return aiModeSweep;
    }

    function syncAiModeDecorAppearance() {
      if (!aiModeDecor || !aiModeDecor.beam || !overlay) {
        return;
      }
      const resolvedTheme = overlay.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const strength = resolvedTheme === 'light' ? 0.64 : 0.82;
      aiModeDecor.beam.style.setProperty('--beam-strength', String(strength), 'important');
      aiModeDecor.setTheme(resolvedTheme);
    }

    function setAiModeDecorActive(active) {
      const nextActive = Boolean(active);
      const decor = ensureAiModeDecor();
      if (decor) {
        syncAiModeDecorAppearance();
        decor.setActive(nextActive);
      }
      const sweep = ensureAiModeSweep();
      if (sweep) {
        sweep.setTheme('auto');
        if (nextActive && !aiModeSweepActive) {
          sweep.play();
        }
      }
      aiModeSweepActive = nextActive;
    }

    function getBaseInputPaddingLeft() {
      if (baseInputPaddingLeft === null) {
        const computed = parseFloat(window.getComputedStyle(searchInput).paddingLeft);
        baseInputPaddingLeft = Number.isFinite(computed) ? computed : 50;
      }
      return baseInputPaddingLeft;
    }

    function updateSiteSearchPrefixLayout() {
      const basePadding = getBaseInputPaddingLeft();
      siteSearchPrefix.style.setProperty('left', `${basePadding}px`, 'important');
      if (siteSearchPrefix.style.display === 'none') {
        siteSearchPrefix.style.setProperty('max-width', '0px', 'important');
        searchInput.style.setProperty('padding-left', `${basePadding}px`, 'important');
        return;
      }
      const inputContainerWidth = inputContainer ? inputContainer.getBoundingClientRect().width : 0;
      const availableWidth = Math.max(72, Math.floor(inputContainerWidth - basePadding - 108));
      siteSearchPrefix.style.setProperty('max-width', `${availableWidth}px`, 'important');
      const prefixWidth = siteSearchPrefix.getBoundingClientRect().width;
      const paddedLeft = Math.max(basePadding + prefixWidth + prefixGap, basePadding);
      searchInput.style.setProperty('padding-left', `${paddedLeft}px`, 'important');
    }

    function setInputModePrefix(prefixText, theme) {
      setProtectedPlainText(siteSearchPrefixLabel, prefixText);
      siteSearchPrefix.style.setProperty('display', 'inline-flex', 'important');
      const resolvedTheme = getThemeForMode(theme || defaultTheme);
      const accentRgb = resolvedTheme && (resolvedTheme.accentRgb || parseCssColor(resolvedTheme.accent))
        ? (resolvedTheme.accentRgb || parseCssColor(resolvedTheme.accent))
        : defaultAccentColor;
      const [h, s, l] = rgbToHsl(accentRgb);
      let nextS = s;
      let nextL = l;
      if (s < 0.52) {
        nextS = Math.min(0.78, s + 0.18 + ((0.52 - s) * 0.42));
      }
      if (l > 0.58) {
        nextL = Math.max(0.42, l - (0.08 + ((l - 0.58) * 0.55)));
      } else if (l < 0.34) {
        nextL = Math.min(0.46, l + 0.06);
      }
      const compensatedAccent = hslToRgb(h, nextS, nextL);
      const backgroundColor = rgbToCss(mixColor(compensatedAccent, [255, 255, 255], isOverlayDarkMode() ? 0.02 : 0.05));
      const shadowAlpha = isOverlayDarkMode() ? 0.26 : 0.22;
      const shadowSoftAlpha = isOverlayDarkMode() ? 0.14 : 0.12;
      const tagShadow = `0 4px 10px rgba(${compensatedAccent[0]}, ${compensatedAccent[1]}, ${compensatedAccent[2]}, ${shadowAlpha}), 0 1px 2px rgba(${compensatedAccent[0]}, ${compensatedAccent[1]}, ${compensatedAccent[2]}, ${shadowSoftAlpha})`;
      siteSearchPrefix.style.setProperty('background', backgroundColor, 'important');
      siteSearchPrefix.style.setProperty('color', '#FFFFFF', 'important');
      siteSearchPrefix.style.setProperty('border', 'none', 'important');
      siteSearchPrefix.style.setProperty('box-shadow', tagShadow, 'important');
      searchInput.placeholder = '';
      if (resolvedTheme && resolvedTheme.accent) {
        searchInput.style.setProperty('caret-color', resolvedTheme.accent, 'important');
      }
      updateSiteSearchPrefixLayout();
    }

    function clearInputModePrefix() {
      siteSearchPrefixLabel.textContent = '';
      siteSearchPrefix.style.setProperty('display', 'none', 'important');
      siteSearchPrefix.style.setProperty('background', 'var(--x-ext-tag-bg, #EEF6FF)', 'important');
      siteSearchPrefix.style.setProperty('color', '#FFFFFF', 'important');
      siteSearchPrefix.style.setProperty('border', 'none', 'important');
      siteSearchPrefix.style.setProperty('box-shadow', 'none', 'important');
      searchInput.placeholder = defaultPlaceholderText || defaultPlaceholder;
      searchInput.style.setProperty('caret-color', defaultCaretColor, 'important');
      setAiModeDecorActive(false);
      updateSiteSearchPrefixLayout();
    }

    function setSiteSearchPrefix(provider, theme) {
      const prefixText = formatMessage('search_in_site', '在 {site} 中搜索', {
        site: getSiteSearchDisplayName(provider)
      });
      setInputModePrefix(prefixText, theme);
      setAiModeDecorActive(isInteractiveSiteSearchProvider(provider));
    }

    function setOpenTabsSearchPrefix(theme) {
      setInputModePrefix(
        t('search_open_tabs_only_prefix', '仅搜索已打开标签页｜'),
        theme
      );
    }

    function clearSiteSearchPrefix() {
      clearInputModePrefix();
    }

    window.addEventListener('resize', updateSiteSearchPrefixLayout);

    function isEnglishQuery(query) {
      if (!query) {
        return false;
      }
      return /^[A-Za-z0-9\s._/-]+$/.test(query);
    }

    function getUrlDisplay(url) {
      if (!url) {
        return '';
      }
      try {
        const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./i, '');
        const path = parsed.pathname === '/' ? '' : parsed.pathname;
        return `${host}${path}${parsed.search || ''}${parsed.hash || ''}`;
      } catch (e) {
        return url;
      }
    }

    function normalizeTabSearchToken(value) {
      return String(value || '').trim().toLowerCase();
    }

    function buildTabSearchText(tab) {
      if (!tab) {
        return '';
      }
      const parts = [];
      if (tab.title) {
        parts.push(String(tab.title));
      }
      if (tab.url) {
        parts.push(String(tab.url));
      }
      try {
        const parsed = new URL(tab.url || '');
        if (parsed.hostname) {
          parts.push(parsed.hostname);
        }
        if (parsed.pathname) {
          parts.push(parsed.pathname);
        }
      } catch (e) {
        // Ignore malformed URLs.
      }
      return parts.join(' ').toLowerCase();
    }

    function filterTabsForOverlay(tabList, queryText) {
      const list = Array.isArray(tabList) ? tabList : [];
      const normalized = normalizeTabSearchToken(queryText);
      if (!normalized) {
        if (list.length < 2 || typeof currentOverlayTabId !== 'number') {
          return list.slice();
        }
        if (!list[0] || list[0].id !== currentOverlayTabId) {
          return list.slice();
        }
        const reordered = list.slice();
        const currentTab = reordered.shift();
        if (currentTab) {
          reordered.splice(1, 0, currentTab);
        }
        return reordered;
      }
      const tokens = normalized.split(/\s+/).filter(Boolean);
      if (tokens.length === 0) {
        return list.slice();
      }
      return list.filter((tab) => {
        const haystack = buildTabSearchText(tab);
        if (!haystack) {
          return false;
        }
        return tokens.every((token) => haystack.includes(token));
      });
    }

    function normalizeTabMatchUrl(url) {
      if (!url) {
        return '';
      }
      try {
        const parsed = new URL(url);
        const protocol = String(parsed.protocol || '').toLowerCase();
        if (protocol !== 'http:' && protocol !== 'https:') {
          return String(url).trim().toLowerCase();
        }
        const host = normalizeHost(parsed.hostname);
        let path = parsed.pathname || '/';
        path = path.replace(/\/+$/, '');
        if (!path) {
          path = '/';
        }
        return `${host}${path}${parsed.search || ''}`;
      } catch (e) {
        return String(url).trim().toLowerCase();
      }
    }

    function normalizeTabMatchUrlWithoutSearch(url) {
      if (!url) {
        return '';
      }
      try {
        const parsed = new URL(url);
        const protocol = String(parsed.protocol || '').toLowerCase();
        if (protocol !== 'http:' && protocol !== 'https:') {
          return String(url).trim().toLowerCase();
        }
        const host = normalizeHost(parsed.hostname);
        let path = parsed.pathname || '/';
        path = path.replace(/\/+$/, '');
        if (!path) {
          path = '/';
        }
        return `${host}${path}`;
      } catch (e) {
        return String(url).trim().toLowerCase();
      }
    }

    function getMatchedOpenTabIdForSuggestion(suggestion) {
      if (!suggestion || !suggestion.url || !Array.isArray(tabs) || tabs.length === 0) {
        return null;
      }
      const target = normalizeTabMatchUrl(suggestion.url);
      if (!target) {
        return null;
      }
      for (let i = 0; i < tabs.length; i += 1) {
        const tab = tabs[i];
        if (!tab || typeof tab.id !== 'number' || !tab.url) {
          continue;
        }
        const current = normalizeTabMatchUrl(tab.url);
        if (current && current === target) {
          return tab.id;
        }
      }
      if (prioritizeCurrentPageMatch && typeof currentOverlayTabId === 'number') {
        const currentTab = tabs.find((tab) => tab && tab.id === currentOverlayTabId) || null;
        const targetNoSearch = normalizeTabMatchUrlWithoutSearch(suggestion.url);
        const currentNoSearch = currentTab ? normalizeTabMatchUrlWithoutSearch(currentTab.url) : '';
        if (targetNoSearch && currentNoSearch && targetNoSearch === currentNoSearch) {
          return currentOverlayTabId;
        }
      }
      return null;
    }

    function isCurrentOverlayTabUrl(url) {
      if (!prioritizeCurrentPageMatch || !url) {
        return false;
      }
      const currentTab = typeof currentOverlayTabId === 'number'
        ? (tabs.find((tab) => tab && tab.id === currentOverlayTabId) || null)
        : null;
      const currentUrl = currentTab && currentTab.url
        ? currentTab.url
        : initialContextTabUrl;
      if (!currentUrl) {
        return false;
      }
      const targetFull = normalizeTabMatchUrl(url);
      const currentFull = normalizeTabMatchUrl(currentUrl);
      if (targetFull && currentFull && targetFull === currentFull) {
        return true;
      }
      const targetNoSearch = normalizeTabMatchUrlWithoutSearch(url);
      const currentNoSearch = normalizeTabMatchUrlWithoutSearch(currentUrl);
      return Boolean(targetNoSearch && currentNoSearch && targetNoSearch === currentNoSearch);
    }

    function getAutocompleteCandidate(allSuggestions, rawQuery) {
      if (!Array.isArray(allSuggestions) || !rawQuery) {
        return null;
      }
      const rawLower = rawQuery.toLowerCase();
      const passes = [true, false];
      for (let passIndex = 0; passIndex < passes.length; passIndex += 1) {
        const skipGoogleSuggest = passes[passIndex];
        for (let i = 0; i < allSuggestions.length; i += 1) {
          const suggestion = allSuggestions[i];
          if (!suggestion || suggestion.type === 'newtab') {
            continue;
          }
          if (skipGoogleSuggest && suggestion.type === 'googleSuggest') {
            continue;
          }
          if (suggestion.commandText) {
            const commandText = String(suggestion.commandText).toLowerCase();
            if (commandText.startsWith(rawLower)) {
              return {
                completion: suggestion.commandText,
                url: '',
                title: suggestion.title || '',
                type: 'command'
              };
            }
            const aliases = Array.isArray(suggestion.commandAliases) ? suggestion.commandAliases : [];
            for (let aliasIndex = 0; aliasIndex < aliases.length; aliasIndex += 1) {
              const alias = String(aliases[aliasIndex] || '').toLowerCase();
              if (alias && alias.startsWith(rawLower)) {
                return {
                  completion: aliases[aliasIndex],
                  url: '',
                  title: suggestion.title || '',
                  type: 'command'
                };
              }
            }
          }
          const urlText = getUrlDisplay(suggestion.url);
          if (urlText && urlText.toLowerCase().startsWith(rawLower)) {
            return {
              completion: urlText,
              url: suggestion.url || '',
              title: suggestion.title || '',
              type: 'url'
            };
          }
          const titleText = suggestion.title || '';
          if (titleText && titleText.toLowerCase().startsWith(rawLower)) {
            return {
              completion: titleText,
              url: suggestion.url || '',
              title: suggestion.title || '',
              type: 'title'
            };
          }
        }
      }
      return null;
    }

    function splitNavigationMatchTerms(value) {
      return Array.from(new Set(
        String(value || '')
          .toLowerCase()
          .split(/[^a-z0-9\u4e00-\u9fff]+/i)
          .map((item) => item.trim())
          .filter(Boolean)
      ));
    }

    function buildComparableNavigationUrl(url) {
      try {
        const parsed = new URL(String(url || '').trim());
        parsed.protocol = String(parsed.protocol || '').toLowerCase();
        parsed.hostname = normalizeHost(parsed.hostname);
        if ((parsed.protocol === 'http:' && parsed.port === '80') || (parsed.protocol === 'https:' && parsed.port === '443')) {
          parsed.port = '';
        }
        parsed.hash = '';
        parsed.pathname = parsed.pathname !== '/'
          ? (parsed.pathname.replace(/\/+$/, '') || '/')
          : '/';
        return parsed.toString().toLowerCase();
      } catch (e) {
        return String(url || '').trim().toLowerCase();
      }
    }

    function getNavigationSuggestionPathDepth(url) {
      try {
        return new URL(String(url || '').trim()).pathname.split('/').filter(Boolean).length;
      } catch (e) {
        return Number.MAX_SAFE_INTEGER;
      }
    }

    function getStrongNavigationMatchScore(suggestion, rawQuery) {
      if (!suggestion || !suggestion.url || suggestion.type === 'newtab' || suggestion.type === 'googleSuggest') {
        return 0;
      }
      const query = String(rawQuery || '').trim();
      if (!query) {
        return 0;
      }

      const queryLower = query.toLowerCase();
      const directUrl = getDirectNavigationUrl(query);
      const suggestionUrlKey = buildComparableNavigationUrl(suggestion.url);
      const suggestionUrlText = (getUrlDisplay(suggestion.url) || '').toLowerCase();
      const titleLower = String(suggestion.title || '').toLowerCase();

      if (directUrl) {
        const directUrlKey = buildComparableNavigationUrl(directUrl);
        if (suggestion.type !== 'directUrl' && suggestionUrlKey === directUrlKey) {
          return 520;
        }
        if (suggestionUrlText && suggestionUrlText === queryLower) {
          return suggestion.type === 'directUrl' ? 420 : 480;
        }
        if (suggestion.type === 'directUrl' && suggestionUrlKey === directUrlKey) {
          return 400;
        }
        if (suggestionUrlText && suggestionUrlText.startsWith(queryLower)) {
          return suggestion.type === 'directUrl' ? 320 : 280;
        }
        return 0;
      }

      if (/\s/.test(query) || queryLower.length < 4) {
        return 0;
      }

      const genericTerms = new Set(['home', 'login', 'account', 'settings', 'dashboard', 'search', 'docs', 'help', 'api']);
      if (genericTerms.has(queryLower)) {
        return 0;
      }

      let score = 0;
      const titleTerms = splitNavigationMatchTerms(titleLower);
      if (titleTerms.includes(queryLower)) {
        score += 140;
      } else if (titleLower.startsWith(queryLower)) {
        score += 100;
      } else if (titleLower.includes(queryLower)) {
        score += 42;
      } else {
        return 0;
      }

      const depth = getNavigationSuggestionPathDepth(suggestion.url);
      if (depth === 0) {
        score += 90;
      } else if (depth === 1) {
        score += 36;
      } else if (Number.isFinite(depth)) {
        score -= Math.min(32, (depth - 1) * 8);
      }

      if (/(^|[\s-])(home|首页)([\s-]|$)/i.test(titleLower)) {
        score += 28;
      }
      if (suggestion.type === 'bookmark') {
        score += 16;
      } else if (suggestion.type === 'history') {
        score += 10;
      } else if (suggestion.type === 'topSite' || suggestion.isTopSite) {
        score += 12;
      }

      return score;
    }

    function promoteStrongNavigationMatch(list, rawQuery) {
      if (!Array.isArray(list)) {
        return null;
      }
      let bestIndex = -1;
      let bestScore = 0;
      for (let i = 0; i < list.length; i += 1) {
        const score = getStrongNavigationMatchScore(list[i], rawQuery);
        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }
      if (bestScore < 140 || bestIndex < 0) {
        return null;
      }
      if (bestIndex > 0) {
        const [picked] = list.splice(bestIndex, 1);
        list.unshift(picked);
        return picked;
      }
      return list[0] || null;
    }

    function getDomainPrefixCandidate(allSuggestions, rawQuery) {
      if (!Array.isArray(allSuggestions) || !rawQuery) {
        return null;
      }
      const rawLower = rawQuery.toLowerCase();
      for (let i = 0; i < allSuggestions.length; i += 1) {
        const suggestion = allSuggestions[i];
        if (!suggestion || suggestion.type === 'newtab') {
          continue;
        }
        const urlText = getUrlDisplay(suggestion.url);
        if (!urlText) {
          continue;
        }
        const host = urlText.split('/')[0] || '';
        if (host.toLowerCase().startsWith(rawLower)) {
          return {
            completion: urlText,
            url: suggestion.url || '',
            title: suggestion.title || '',
            type: 'url'
          };
        }
      }
      return null;
    }

    function getAutocompleteCandidateFromSuggestion(suggestion, rawQuery) {
      if (!suggestion || !rawQuery || suggestion.type === 'newtab') {
        return null;
      }
      const rawLower = rawQuery.toLowerCase();
      if (suggestion.commandText) {
        const commandText = String(suggestion.commandText).toLowerCase();
        if (commandText.startsWith(rawLower)) {
          return {
            completion: suggestion.commandText,
            url: '',
            title: suggestion.title || '',
            type: 'command'
          };
        }
        const aliases = Array.isArray(suggestion.commandAliases) ? suggestion.commandAliases : [];
        for (let aliasIndex = 0; aliasIndex < aliases.length; aliasIndex += 1) {
          const alias = String(aliases[aliasIndex] || '');
          if (alias.toLowerCase().startsWith(rawLower)) {
            return {
              completion: alias,
              url: '',
              title: suggestion.title || '',
              type: 'command'
            };
          }
        }
      }
      const urlText = getUrlDisplay(suggestion.url);
      if (urlText) {
        const host = urlText.split('/')[0] || '';
        if (host.toLowerCase().startsWith(rawLower) || urlText.toLowerCase().startsWith(rawLower)) {
          return {
            completion: urlText,
            url: suggestion.url || '',
            title: suggestion.title || '',
            type: 'url'
          };
        }
      }
      const titleText = suggestion.title || '';
      if (titleText && titleText.toLowerCase().startsWith(rawLower)) {
        return {
          completion: titleText,
          url: suggestion.url || '',
          title: suggestion.title || '',
          type: 'title'
        };
      }
      return null;
    }

    function clearAutocomplete() {
      autocompleteState = null;
    }

    function dismissAutocompletePreviewOnNonTabKey(event) {
      if (!event || event.key === 'Tab') {
        return false;
      }
      const isModifierOnly = event.key === 'Shift' || event.key === 'Control' || event.key === 'Alt' || event.key === 'Meta';
      if (isModifierOnly) {
        return false;
      }
      if (!autocompleteState || !autocompleteState.completion) {
        return false;
      }
      const rawQuery = typeof autocompleteState.rawQuery === 'string'
        ? autocompleteState.rawQuery
        : String(latestRawInputValue || '');
      if (searchInput && searchInput.value !== rawQuery) {
        searchInput.value = rawQuery;
        searchInput.setSelectionRange(rawQuery.length, rawQuery.length);
      }
      latestRawInputValue = rawQuery;
      latestOverlayQuery = rawQuery.trim();
      clearAutocomplete();
      return true;
    }

    function applyAutocomplete(allSuggestions, primarySuggestion, primaryHighlightReason) {
      const rawQuery = latestRawInputValue;
      const trimmedQuery = rawQuery.trim();
      if (overlaySearchResultPriorityMode === 'search') {
        if (searchInput && searchInput.value !== rawQuery) {
          searchInput.value = rawQuery;
          searchInput.setSelectionRange(rawQuery.length, rawQuery.length);
        }
        clearAutocomplete();
        return;
      }
      if (Date.now() - lastDeletionAt < 250) {
        clearAutocomplete();
        return;
      }
      if (siteSearchState) {
        clearAutocomplete();
        return;
      }
      if (!isEnglishQuery(trimmedQuery) || !rawQuery) {
        clearAutocomplete();
        return;
      }
      if (!allSuggestions || !Array.isArray(allSuggestions)) {
        clearAutocomplete();
        return;
      }
      if (searchInput.selectionStart !== searchInput.value.length || searchInput.selectionEnd !== searchInput.value.length) {
        return;
      }
      const shouldForcePrimaryAlignment = Boolean(
        primarySuggestion &&
        primaryHighlightReason &&
        primaryHighlightReason !== 'autocomplete' &&
        primaryHighlightReason !== 'default'
      );
      let candidate = null;
      if (primarySuggestion) {
        candidate = getAutocompleteCandidateFromSuggestion(primarySuggestion, rawQuery);
      }
      if (!candidate && shouldForcePrimaryAlignment) {
        clearAutocomplete();
        return;
      }
      if (!candidate) {
        candidate = getDomainPrefixCandidate(allSuggestions, rawQuery) ||
          getAutocompleteCandidate(allSuggestions, rawQuery);
      }
      if (!candidate || !candidate.completion) {
        clearAutocomplete();
        return;
      }
      if (candidate.type === 'title') {
        clearAutocomplete();
        return;
      }
      if (candidate.completion.length <= rawQuery.length) {
        clearAutocomplete();
        return;
      }
      if (!candidate.completion.toLowerCase().startsWith(rawQuery.toLowerCase())) {
        clearAutocomplete();
        return;
      }
      const displayText = candidate.completion;
      searchInput.value = displayText;
      searchInput.setSelectionRange(rawQuery.length, displayText.length);
      autocompleteState = {
        completion: candidate.completion,
        displayText: displayText,
        url: candidate.url || '',
        rawQuery: rawQuery,
        title: candidate.title || '',
        type: candidate.type || ''
      };
    }

    function buildSearchUrl(template, query) {
      return SITE_SEARCH_PROVIDER_UTILS.buildSearchUrl(template, query);
    }

    function isInteractiveSiteSearchProvider(provider) {
      return SITE_SEARCH_PROVIDER_UTILS.isInteractiveSiteSearchProvider(provider);
    }

    function shouldRestrictInteractiveSiteSearchSuggestions(provider, query) {
      return SITE_SEARCH_PROVIDER_UTILS.shouldRestrictInteractiveSiteSearchSuggestions(provider, query);
    }

    function openSiteSearchProviderQuery(provider, query) {
      const trimmedQuery = String(query || '').trim();
      if (!provider || !trimmedQuery) {
        return false;
      }
      if (isInteractiveSiteSearchProvider(provider)) {
        chrome.runtime.sendMessage({
          action: 'runSiteSearchProviderQuery',
          provider: provider,
          query: trimmedQuery,
          disposition: 'newTab'
        });
        return true;
      }
      const siteUrl = buildSearchUrl(provider.template, trimmedQuery);
      if (!siteUrl) {
        return false;
      }
      chrome.runtime.sendMessage({
        action: 'createTab',
        url: siteUrl
      });
      return true;
    }

    function getProviderIcon(provider) {
      return SEARCH_FAVICON_UTILS.getSiteSearchProviderIconUrl(provider, {
        includeFaviconIsFallback: true,
        runtimeGetUrl: chrome && chrome.runtime && typeof chrome.runtime.getURL === 'function'
          ? chrome.runtime.getURL.bind(chrome.runtime)
          : null,
        size: FAVICON_GOOGLE_SIZE
      });
    }

    function mergeCustomProvidersLocal(baseItems, customItems) {
      return SITE_SEARCH_PROVIDER_UTILS.mergeCustomProviders(baseItems, customItems, {
        skipDisabledCustom: true
      });
    }

    function getSiteSearchProviders() {
      if (siteSearchProvidersCache) {
        return Promise.resolve(siteSearchProvidersCache);
      }
      const localUrl = chrome.runtime.getURL('public/assets/data/site-search.json');
      const localFallback = fetch(localUrl)
        .then((response) => response.json())
        .then((data) => {
          const items = data && Array.isArray(data.items) ? data.items : [];
          return items;
        })
        .catch(() => []);
      const customFallback = new Promise((resolve) => {
        if (!storageArea) {
          resolve([]);
          return;
        }
        storageArea.get([SITE_SEARCH_STORAGE_KEY], (result) => {
          const items = Array.isArray(result[SITE_SEARCH_STORAGE_KEY]) ? result[SITE_SEARCH_STORAGE_KEY] : [];
          resolve(items);
        });
      });
      const disabledFallback = new Promise((resolve) => {
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
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'getSiteSearchProviders' }, (response) => {
          const items = response && Array.isArray(response.items) ? response.items : [];
          if (items.length > 0) {
            siteSearchProvidersCache = items;
            resolve(items);
            return;
          }
          Promise.all([localFallback, customFallback, disabledFallback])
            .then(([localItems, customItems, disabledKeys]) => {
            const baseItems = localItems.length > 0 ? localItems : defaultSiteSearchProviders;
            const filteredBase = baseItems.filter((item) => {
              const key = String(item && item.key ? item.key : '').toLowerCase();
              return key && !disabledKeys.includes(key);
            });
            const merged = mergeCustomProvidersLocal(filteredBase, customItems);
            siteSearchProvidersCache = merged;
            resolve(merged);
          });
        });
      });
    }

    getSiteSearchProviders();

    siteSearchStorageListener = (changes, areaName) => {
      if (!storageAreaName || areaName !== storageAreaName ||
          (!changes[SITE_SEARCH_STORAGE_KEY] && !changes[SITE_SEARCH_DISABLED_STORAGE_KEY])) {
        return;
      }
      if (!storageArea) {
        return;
      }
      storageArea.get([SITE_SEARCH_STORAGE_KEY, SITE_SEARCH_DISABLED_STORAGE_KEY], (result) => {
        const customItems = Array.isArray(result[SITE_SEARCH_STORAGE_KEY]) ? result[SITE_SEARCH_STORAGE_KEY] : [];
        const disabledKeys = Array.isArray(result[SITE_SEARCH_DISABLED_STORAGE_KEY])
          ? result[SITE_SEARCH_DISABLED_STORAGE_KEY].map((item) => String(item).toLowerCase()).filter(Boolean)
          : [];
        const baseItems = defaultSiteSearchProviders.filter((item) => {
          const key = String(item && item.key ? item.key : '').toLowerCase();
          return key && !disabledKeys.includes(key);
        });
        siteSearchProvidersCache = mergeCustomProvidersLocal(baseItems, customItems);
        if (latestOverlayQuery) {
          chrome.runtime.sendMessage({
            action: OVERLAY_SEARCH_PROTOCOL.action,
            query: latestOverlayQuery,
            context: 'overlay',
            mode: OVERLAY_SEARCH_PROTOCOL.mode
          }, function(response) {
            if (response && response.suggestions) {
              updateSearchSuggestions(response.suggestions, latestOverlayQuery);
            }
          });
        }
      });
    };
    chrome.storage.onChanged.addListener(siteSearchStorageListener);

    function getSiteSearchDisplayName(provider) {
      return SITE_SEARCH_PROVIDER_UTILS.getSiteSearchDisplayName(
        provider,
        t,
        t('site_search_default', '站内')
      );
    }

    function findProviderForSuggestionMatch(suggestion, providers) {
      return SITE_SEARCH_PROVIDER_UTILS.findProviderForSuggestionMatch(suggestion, providers);
    }

    function getInlineSiteSearchCandidate(input, providers) {
      return SITE_SEARCH_PROVIDER_UTILS.getInlineSiteSearchCandidate(input, providers);
    }

    function matchesTopSitePrefix(suggestion, input) {
      if (!suggestion || !(suggestion.type === 'topSite' || suggestion.isTopSite)) {
        return false;
      }
      const query = String(input || '').trim().toLowerCase();
      if (!query) {
        return false;
      }
      const titleText = String(suggestion.title || '').toLowerCase();
      if (titleText.startsWith(query)) {
        return true;
      }
      const urlText = getUrlDisplay(suggestion.url || '');
      if (!urlText) {
        return false;
      }
      const host = urlText.split('/')[0] || '';
      return host.toLowerCase().startsWith(query);
    }

    function getTopSiteMatchCandidate(list, input) {
      if (!Array.isArray(list)) {
        return null;
      }
      const query = String(input || '').trim();
      if (!query || /\s/.test(query)) {
        return null;
      }
      let fallback = null;
      for (let i = 0; i < list.length; i += 1) {
        const suggestion = list[i];
        if (!suggestion || !(suggestion.type === 'topSite' || suggestion.isTopSite)) {
          continue;
        }
        const urlText = getUrlDisplay(suggestion.url || '');
        const host = urlText ? (urlText.split('/')[0] || '') : '';
        if (host && host.toLowerCase().startsWith(query.toLowerCase())) {
          return suggestion;
        }
        if (!fallback && matchesTopSitePrefix(suggestion, query)) {
          fallback = suggestion;
        }
      }
      return fallback;
    }

    function promoteTopSiteMatch(list, queryText) {
      const match = getTopSiteMatchCandidate(list, queryText);
      if (!match) {
        return null;
      }
      const matchIndex = list.indexOf(match);
      if (matchIndex > 0) {
        const [picked] = list.splice(matchIndex, 1);
        list.unshift(picked);
        return picked;
      }
      if (matchIndex === 0) {
        return list[0];
      }
      return null;
    }

    function getSiteSearchTriggerCandidate(input, providers, topSiteMatch) {
      return SITE_SEARCH_PROVIDER_UTILS.getSiteSearchTriggerCandidate(input, providers, topSiteMatch, {
        matchesTopSitePrefix
      });
    }

    function activateSiteSearch(provider) {
      if (!provider) {
        return;
      }
      openTabsSearchModeActive = false;
      siteSearchState = provider;
      inlineSearchState = null;
      searchInput.value = '';
      latestRawInputValue = '';
      latestOverlayQuery = '';
      clearAutocomplete();
      setSiteSearchPrefix(provider, defaultTheme);
      const providerIcon = getProviderIcon(provider);
      getThemeForProvider(provider).then((theme) => {
        if (siteSearchState === provider) {
          setSiteSearchPrefix(provider, theme);
        }
      });
      clearSearchSuggestions();
      playSiteSearchShellAnimation();
    }

    function clearSiteSearchShellAnimation() {
      if (siteSearchShellAnimationTimers.length > 0) {
        siteSearchShellAnimationTimers.forEach((timer) => clearTimeout(timer));
        siteSearchShellAnimationTimers = [];
      }
    }

    function playSiteSearchShellAnimation() {
      if (!overlay || !overlay.isConnected) {
        return;
      }
      const settleTransform = 'translateX(-50%) translateY(0) scale(1)';
      const shrinkTransform = 'translateX(-50%) translateY(0) scale(0.972)';
      const reboundTransform = 'translateX(-50%) translateY(0) scale(1.012)';
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        clearSiteSearchShellAnimation();
        overlay.style.setProperty('transform', settleTransform, 'important');
        return;
      }
      clearSiteSearchShellAnimation();
      overlay.style.setProperty('transform-origin', 'top center', 'important');
      overlay.style.setProperty('transition', 'none', 'important');
      overlay.style.setProperty('transform', settleTransform, 'important');
      void overlay.offsetWidth;
      overlay.style.setProperty('transition', 'transform 180ms cubic-bezier(0.32, 0.72, 0, 1), opacity 220ms ease, filter 300ms ease', 'important');
      requestAnimationFrame(() => {
        if (!overlay || !overlay.isConnected) {
          return;
        }
        overlay.style.setProperty('transform', shrinkTransform, 'important');
        siteSearchShellAnimationTimers.push(setTimeout(() => {
          if (!overlay || !overlay.isConnected) {
            return;
          }
          overlay.style.setProperty('transition', 'transform 210ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 220ms ease, filter 300ms ease', 'important');
          overlay.style.setProperty('transform', reboundTransform, 'important');
        }, 165));
        siteSearchShellAnimationTimers.push(setTimeout(() => {
          if (!overlay || !overlay.isConnected) {
            return;
          }
          overlay.style.setProperty('transition', 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease, filter 300ms ease', 'important');
          overlay.style.setProperty('transform', settleTransform, 'important');
        }, 335));
        siteSearchShellAnimationTimers.push(setTimeout(() => {
          if (!overlay || !overlay.isConnected) {
            return;
          }
          siteSearchShellAnimationTimers = [];
          overlay.style.setProperty('transition', 'transform 340ms cubic-bezier(0.2, 1, 0.36, 1), opacity 220ms ease, filter 300ms ease', 'important');
          overlay.style.setProperty('transform', settleTransform, 'important');
        }, 585));
      });
    }

    function clearSiteSearch() {
      if (!siteSearchState) {
        return;
      }
      siteSearchState = null;
      inlineSearchState = null;
      clearSiteSearchPrefix();
      clearAutocomplete();
    }

    function activateOpenTabsSearchMode() {
      openTabsSearchModeActive = true;
      siteSearchState = null;
      inlineSearchState = null;
      siteSearchTriggerState = null;
      clearAutocomplete();
      setOpenTabsSearchPrefix(defaultTheme);
      latestRawInputValue = searchInput.value || '';
      latestOverlayQuery = latestRawInputValue.trim();
      requestTabsAndRender(latestOverlayQuery);
    }

    function clearOpenTabsSearchMode() {
      if (!openTabsSearchModeActive) {
        return;
      }
      openTabsSearchModeActive = false;
      clearSiteSearchPrefix();
      clearAutocomplete();
      const rawValue = searchInput.value || '';
      const query = rawValue.trim();
      latestRawInputValue = rawValue;
      latestOverlayQuery = query;
      if (!query) {
        clearSearchSuggestions();
        return;
      }
      if (isModeCommand(query) || getCommandMatch(query)) {
        updateSearchSuggestions([], query);
        return;
      }
      chrome.runtime.sendMessage({
        action: OVERLAY_SEARCH_PROTOCOL.action,
        query: query,
        context: 'overlay',
        mode: OVERLAY_SEARCH_PROTOCOL.mode
      }, function(response) {
        if (response && response.suggestions) {
          updateSearchSuggestions(response.suggestions, query);
        }
      });
    }

    // Add input event for search suggestions
    searchInput.addEventListener('compositionstart', function() {
      isComposing = true;
      clearAutocomplete();
    });

    searchInput.addEventListener('compositionend', function(e) {
      isComposing = false;
      const rawValue = e.target.value || '';
      const query = rawValue.trim();
      updateModeBadge(rawValue);
      if (selectedIndex >= 0) {
        selectedIndex = -1;
        updateSelection();
      }
      latestOverlayQuery = query;
      latestRawInputValue = rawValue;
      clearAutocomplete();
      if (query.length > 0) {
        if (openTabsSearchModeActive) {
          requestTabsAndRender(query);
          return;
        }
        if (isModeCommand(query) || getCommandMatch(query)) {
          updateSearchSuggestions([], query);
          return;
        }
        chrome.runtime.sendMessage({
          action: OVERLAY_SEARCH_PROTOCOL.action,
          query: query,
          context: 'overlay',
          mode: OVERLAY_SEARCH_PROTOCOL.mode
        }, function(response) {
          if (response && response.suggestions) {
            updateSearchSuggestions(response.suggestions, query);
          }
        });
      } else {
        if (openTabsSearchModeActive) {
          requestTabsAndRender('');
          return;
        }
        clearSearchSuggestions();
      }
    });

    searchInput.addEventListener('input', function(event) {
      const rawValue = this.value;
      const query = rawValue.trim();
      if (overlay && overlay.dataset) {
        overlay.dataset.debugInputQuery = query;
        overlay.dataset.debugInputRaw = rawValue;
      }
      console.log('[Lumno overlay debug] input', {
        rawValue: rawValue,
        query: query
      });
      updateModeBadge(rawValue);
      const inputType = event && event.inputType;
      const isPaste = inputType === 'insertFromPaste';
      const isDelete = inputType && inputType.startsWith('delete');
      if (isDelete) {
        lastDeletionAt = Date.now();
      }
      if (isComposing) {
        latestRawInputValue = rawValue;
        latestOverlayQuery = query;
        return;
      }
      if (selectedIndex >= 0) {
        selectedIndex = -1;
        updateSelection();
      }
      if (!query && siteSearchState) {
        latestOverlayQuery = '';
        latestRawInputValue = '';
        clearAutocomplete();
        clearSearchSuggestions();
        return;
      }
      latestOverlayQuery = query;
      latestRawInputValue = rawValue;
      clearAutocomplete();
      if (query.length > 0) {
        if (openTabsSearchModeActive) {
          requestTabsAndRender(query);
          return;
        }
        if (isPaste || getDirectUrlSuggestion(query)) {
          updateSearchSuggestions([], query);
        }
        if (isModeCommand(query) || getCommandMatch(query)) {
          updateSearchSuggestions([], query);
          return;
        }
        // Get search suggestions
        chrome.runtime.sendMessage({
          action: OVERLAY_SEARCH_PROTOCOL.action,
          query: query,
          context: 'overlay',
          mode: OVERLAY_SEARCH_PROTOCOL.mode
        }, function(response) {
          if (overlay && overlay.dataset) {
            overlay.dataset.debugCallbackQuery = query;
            overlay.dataset.debugCallbackCount = response && Array.isArray(response.suggestions)
              ? String(response.suggestions.length)
              : 'null';
            overlay.dataset.debugCallbackLastError = chrome.runtime && chrome.runtime.lastError
              ? String(chrome.runtime.lastError.message || 'lastError')
              : '';
          }
          console.log('[Lumno overlay debug] suggestions callback', {
            query: query,
            hasLastError: Boolean(chrome.runtime && chrome.runtime.lastError),
            responseCount: response && Array.isArray(response.suggestions) ? response.suggestions.length : null
          });
          if (response && response.suggestions) {
            updateSearchSuggestions(response.suggestions, query);
          }
        });
      } else {
        if (openTabsSearchModeActive) {
          requestTabsAndRender('');
          return;
        }
        // Clear suggestions and show tabs
        clearSearchSuggestions();
      }
    });
    
    // Add click outside to close functionality
    clickOutsideHandler = function(e) {
      if (!overlay.contains(e.target)) {
        removeOverlay(overlay);
        document.removeEventListener('click', clickOutsideHandler);
      }
    };
    document.addEventListener('click', clickOutsideHandler);
    
    function handleTabKey(e) {
      if (siteSearchState || openTabsSearchModeActive) {
        return false;
      }
      const rawValue = searchInput.value;
      const rawTrigger = latestRawInputValue || rawValue;
      const triggerInput = (rawTrigger || rawValue).trim();
      if (siteSearchTriggerState &&
          siteSearchTriggerState.rawInput === triggerInput &&
          siteSearchTriggerState.provider) {
        e.preventDefault();
        activateSiteSearch(siteSearchTriggerState.provider);
        return true;
      }
      if (triggerInput) {
        e.preventDefault();
        const providers = (siteSearchProvidersCache && siteSearchProvidersCache.length > 0)
          ? siteSearchProvidersCache
          : defaultSiteSearchProviders;
        const topSiteMatch = getTopSiteMatchCandidate(currentSuggestions, triggerInput);
        const directProvider = getSiteSearchTriggerCandidate(triggerInput, providers, topSiteMatch);
        if (directProvider) {
          activateSiteSearch(directProvider);
          return true;
        }
        getSiteSearchProviders().then((items) => {
          const asyncTopSiteMatch = getTopSiteMatchCandidate(currentSuggestions, triggerInput);
          const asyncProvider = getSiteSearchTriggerCandidate(triggerInput, items, asyncTopSiteMatch);
          if (asyncProvider) {
            activateSiteSearch(asyncProvider);
            return;
          }
          if (autocompleteState && autocompleteState.completion) {
            searchInput.value = autocompleteState.completion;
            searchInput.setSelectionRange(autocompleteState.completion.length, autocompleteState.completion.length);
            latestRawInputValue = autocompleteState.completion;
            latestOverlayQuery = autocompleteState.completion.trim();
            autocompleteState = null;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });
        return true;
      }
      if (autocompleteState && autocompleteState.completion) {
        e.preventDefault();
        searchInput.value = autocompleteState.completion;
        searchInput.setSelectionRange(autocompleteState.completion.length, autocompleteState.completion.length);
        latestRawInputValue = autocompleteState.completion;
        latestOverlayQuery = autocompleteState.completion.trim();
        autocompleteState = null;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
      if (!triggerInput && suggestionItems.length > 0) {
        const firstItem = suggestionItems[0];
        const autoIndex = getAutoHighlightIndex();
        if (firstItem && !firstItem._xIsSearchSuggestion && autoIndex === 0) {
          e.preventDefault();
          activateOpenTabsSearchMode();
          return true;
        }
      }
      return false;
    }

    captureTabHandler = function(e) {
      if (e.key !== 'Tab') {
        return;
      }
      if (document.activeElement !== searchInput) {
        return;
      }
      handleTabKey(e);
    };
    document.addEventListener('keydown', captureTabHandler, true);

    searchInput.addEventListener('keydown', function(e) {
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        e.stopPropagation();
      }
      dismissAutocompletePreviewOnNonTabKey(e);
      if (e.key !== 'Backspace' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        latestRawInputValue = searchInput.value;
        latestOverlayQuery = searchInput.value.trim();
      }
      if (e.key === 'Escape' && siteSearchState) {
        e.preventDefault();
        e.stopPropagation();
        clearSiteSearch();
        return;
      }
      if (e.key === 'Escape' && openTabsSearchModeActive) {
        e.preventDefault();
        e.stopPropagation();
        clearOpenTabsSearchMode();
        return;
      }
      if (e.key === 'Backspace' && siteSearchState && !searchInput.value) {
        clearSiteSearch();
        return;
      }
      if (e.key === 'Backspace' && openTabsSearchModeActive && !searchInput.value) {
        clearOpenTabsSearchMode();
        return;
      }
      if (isImeCompositionEvent(e)) {
        return;
      }
      if (e.key === 'Tab') {
        handleTabKey(e);
      }
    });
    searchInput.addEventListener('keypress', function(e) {
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        e.stopPropagation();
      }
    });
    searchInput.addEventListener('keyup', function(e) {
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        e.stopPropagation();
      }
    });

    // Add keyboard navigation
    let selectedIndex = -1; // -1 means input is focused, 0+ means suggestion is selected
    const suggestionItems = [];
    let currentSuggestions = []; // Store current suggestions for keyboard navigation
    let lastRenderedQuery = '';

    function getAutoHighlightIndex() {
      return suggestionItems.findIndex((item) => Boolean(item && item._xIsAutocompleteTop));
    }

    function shouldSwitchMatchedTabSuggestion(suggestion, index) {
      if (!suggestion || typeof suggestion._xMatchedTabId !== 'number') {
        return false;
      }
      if (prioritizeCurrentPageMatch &&
        typeof currentOverlayTabId === 'number' &&
        suggestion._xMatchedTabId === currentOverlayTabId &&
        index === 0) {
        return true;
      }
      if (!overlayTabQuickSwitchEnabled) {
        return false;
      }
      return index === 0;
    }
    
    keydownHandler = function(e) {
      if (isImeCompositionEvent(e)) {
        return;
      }
      dismissAutocompletePreviewOnNonTabKey(e);
      if (e.key === 'Escape' && overlay) {
        removeOverlay(overlay);
        document.removeEventListener('keydown', keydownHandler);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (suggestionItems.length === 0) {
          return;
        }
        if (selectedIndex === -1) {
          // Move from auto highlight (or input) to next suggestion
          const autoIndex = getAutoHighlightIndex();
          selectedIndex = autoIndex >= 0
            ? (autoIndex + 1) % suggestionItems.length
            : 0;
        } else {
          // Move to next suggestion
          selectedIndex = (selectedIndex + 1) % suggestionItems.length;
        }
        updateSelection();
        searchInput.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (suggestionItems.length === 0) {
          return;
        }
        if (selectedIndex === 0) {
          // Wrap from first suggestion to the last suggestion
          selectedIndex = suggestionItems.length - 1;
        } else if (selectedIndex === -1) {
          const autoIndex = getAutoHighlightIndex();
          if (autoIndex > 0) {
            selectedIndex = autoIndex - 1;
          } else if (autoIndex === 0) {
            selectedIndex = suggestionItems.length - 1;
          } else {
            // Move from input to last suggestion
            selectedIndex = suggestionItems.length - 1;
          }
        } else {
          // Move to previous suggestion
          selectedIndex = selectedIndex - 1;
        }
        updateSelection();
        searchInput.focus();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const query = searchInput.value.trim();
        const commandMatch = getCommandMatch(query);
        if (commandMatch && selectedIndex === -1) {
          if (commandMatch.command.type === 'commandNewTab') {
            chrome.runtime.sendMessage({ action: 'openNewTab' });
          } else if (commandMatch.command.type === 'commandSettings') {
            chrome.runtime.sendMessage({ action: 'openOptionsPage' });
          }
          removeOverlay(overlay);
          document.removeEventListener('click', clickOutsideHandler);
          document.removeEventListener('keydown', keydownHandler);
          document.removeEventListener('keydown', captureTabHandler, true);
          return;
        }
        if (isModeCommand(query) && selectedIndex === -1) {
          applyThemeModeChange(getNextThemeMode(overlayThemeMode || 'system'));
          return;
        }
        
        const activeSuggestionIndex = selectedIndex >= 0
          ? selectedIndex
          : ((query.length > 0 || openTabsSearchModeActive) ? getAutoHighlightIndex() : -1);
        if (activeSuggestionIndex >= 0 && suggestionItems[activeSuggestionIndex]) {
          // Check if we're showing search suggestions or tab suggestions
          const isSearchSuggestion = query.length > 0 && !openTabsSearchModeActive;
          
          if (isSearchSuggestion && currentSuggestions[activeSuggestionIndex]) {
            const selectedSuggestion = currentSuggestions[activeSuggestionIndex];
            if (selectedSuggestion.type === 'modeSwitch') {
              applyThemeModeChange(selectedSuggestion.nextMode);
              searchInput.focus();
              return;
            }
            if (selectedSuggestion.type === 'commandNewTab') {
              chrome.runtime.sendMessage({ action: 'openNewTab' });
              removeOverlay(overlay);
              document.removeEventListener('click', clickOutsideHandler);
              document.removeEventListener('keydown', keydownHandler);
              document.removeEventListener('keydown', captureTabHandler, true);
              return;
            }
            if (selectedSuggestion.type === 'commandSettings') {
              chrome.runtime.sendMessage({ action: 'openOptionsPage' });
              removeOverlay(overlay);
              document.removeEventListener('click', clickOutsideHandler);
              document.removeEventListener('keydown', keydownHandler);
              document.removeEventListener('keydown', captureTabHandler, true);
              return;
            }
            if (selectedSuggestion.type === 'siteSearchPrompt' && selectedSuggestion.provider) {
              activateSiteSearch(selectedSuggestion.provider);
              searchInput.focus();
              return;
            }
            if (selectedSuggestion.provider && selectedSuggestion.searchQuery) {
              openSiteSearchProviderQuery(selectedSuggestion.provider, selectedSuggestion.searchQuery);
            } else if (shouldSwitchMatchedTabSuggestion(selectedSuggestion, activeSuggestionIndex)) {
              chrome.runtime.sendMessage({
                action: 'switchToTab',
                tabId: selectedSuggestion._xMatchedTabId
              });
            } else if (selectedSuggestion.forceSearch && selectedSuggestion.searchQuery) {
              chrome.runtime.sendMessage({
                action: 'searchOrNavigate',
                query: selectedSuggestion.searchQuery,
                forceSearch: true
              });
            } else {
              // Navigate to the suggested URL
              console.log('Opening URL from keyboard:', selectedSuggestion.url);
              chrome.runtime.sendMessage({
                action: 'createTab',
                url: selectedSuggestion.url
              });
            }
          } else if (!isSearchSuggestion && selectedIndex >= 0) {
            const activeItem = suggestionItems[activeSuggestionIndex];
            if (activeItem && activeItem._xIsOpenTabsModeEntry) {
              activateOpenTabsSearchMode();
              searchInput.focus();
              return;
            }
            // Switch to existing tab
            if (activeItem && typeof activeItem._xTabId === 'number') {
              chrome.runtime.sendMessage({
                action: 'switchToTab',
                tabId: activeItem._xTabId
              });
            }
          }
          removeOverlay(overlay);
          document.removeEventListener('click', clickOutsideHandler);
          document.removeEventListener('keydown', keydownHandler);
          document.removeEventListener('keydown', captureTabHandler, true);
        } else if (query) {
          if (siteSearchState) {
            if (openSiteSearchProviderQuery(siteSearchState, query)) {
              removeOverlay(overlay);
              document.removeEventListener('click', clickOutsideHandler);
              document.removeEventListener('keydown', keydownHandler);
              document.removeEventListener('keydown', captureTabHandler, true);
              return;
            }
          }
          const currentRawInput = (latestRawInputValue || searchInput.value || '').trim();
          if (inlineSearchState && inlineSearchState.isAuto &&
              inlineSearchState.rawInput === currentRawInput) {
            if (inlineSearchState.provider && inlineSearchState.query) {
              if (openSiteSearchProviderQuery(inlineSearchState.provider, inlineSearchState.query)) {
                removeOverlay(overlay);
                document.removeEventListener('click', clickOutsideHandler);
                document.removeEventListener('keydown', keydownHandler);
                document.removeEventListener('keydown', captureTabHandler, true);
                return;
              }
            }
            if (inlineSearchState.url) {
              chrome.runtime.sendMessage({
                action: 'createTab',
                url: inlineSearchState.url
              });
              removeOverlay(overlay);
              document.removeEventListener('click', clickOutsideHandler);
              document.removeEventListener('keydown', keydownHandler);
              document.removeEventListener('keydown', captureTabHandler, true);
              return;
            }
          }
          if (autocompleteState && autocompleteState.url) {
            chrome.runtime.sendMessage({
              action: 'createTab',
              url: autocompleteState.url
            });
            removeOverlay(overlay);
            document.removeEventListener('click', clickOutsideHandler);
            document.removeEventListener('keydown', keydownHandler);
            document.removeEventListener('keydown', captureTabHandler, true);
            return;
          }
          resolveQuickNavigation(query).then((targetUrl) => {
            if (targetUrl) {
              chrome.runtime.sendMessage({
                action: 'createTab',
                url: targetUrl
              });
            } else {
              // Handle search or URL navigation
              chrome.runtime.sendMessage({
                action: 'searchOrNavigate',
                query: query
              });
            }
            removeOverlay(overlay);
            document.removeEventListener('click', clickOutsideHandler);
            document.removeEventListener('keydown', keydownHandler);
            document.removeEventListener('keydown', captureTabHandler, true);
          });
        }
      }
    };

    overlayKeyCaptureHandler = function(e) {
      if (!overlay || !overlay.isConnected) {
        return;
      }
      if (document.activeElement !== searchInput) {
        return;
      }
      if (isImeCompositionEvent(e)) {
        return;
      }
      if (e.key === 'Tab') {
        handleTabKey(e);
        e.stopImmediatePropagation();
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Escape') {
        keydownHandler(e);
        e.stopImmediatePropagation();
      }
    };

    window.addEventListener('keydown', overlayKeyCaptureHandler, true);
    document.addEventListener('keydown', keydownHandler);
    
    function applySearchSuggestionHighlight(item, theme) {
      const highlight = getHighlightColors(theme);
      item.style.setProperty('background', highlight.bg, 'important');
      item.style.setProperty('border', `1px solid ${highlight.border}`, 'important');
    }

    function resetSearchSuggestion(item) {
      item.style.setProperty('background', 'transparent', 'important');
      item.style.setProperty('border', '1px solid transparent', 'important');
    }

    function applySearchActionStyles(item, theme, isActive) {
      const resolvedTheme = getThemeForMode(theme);
      applyMarkVariables(item, isActive ? resolvedTheme : defaultTheme);
      const shouldHideSourceTags = Boolean(item._xHasSwitchAction);
      if (item._xVisitButton) {
        const shouldHide = Boolean(item._xAlwaysHideVisitButton || (isActive && item._xHasActionTags));
        item._xVisitButton.style.setProperty('display', shouldHide ? 'none' : 'inline-flex', 'important');
        if (shouldHide) {
          item._xVisitButton.style.setProperty('background-color', 'transparent', 'important');
          item._xVisitButton.style.setProperty('border', '1px solid transparent', 'important');
        }
        if (isActive) {
          item._xVisitButton.style.setProperty('color', resolvedTheme.buttonText, 'important');
          item._xVisitButton.style.setProperty('background-color', resolvedTheme.buttonBg, 'important');
          item._xVisitButton.style.setProperty('border', `1px solid ${resolvedTheme.buttonBorder}`, 'important');
        } else {
          item._xVisitButton.style.setProperty('color', 'var(--x-ov-subtext, #9CA3AF)', 'important');
          item._xVisitButton.style.setProperty('background-color', 'transparent', 'important');
          item._xVisitButton.style.setProperty('border', '1px solid transparent', 'important');
        }
      }
      if (item._xHistoryDeleteButton) {
        const shouldShowHistoryDelete = Boolean(item._xHasHistoryDeleteButton && item._xIsHovering);
        if (item._xHistoryDeleteSlot) {
          item._xHistoryDeleteSlot.style.setProperty('width', shouldShowHistoryDelete ? '28px' : '0px', 'important');
          item._xHistoryDeleteSlot.style.setProperty('margin-left', shouldShowHistoryDelete ? '8px' : '0px', 'important');
          item._xHistoryDeleteSlot.style.setProperty('opacity', shouldShowHistoryDelete ? '1' : '0', 'important');
          item._xHistoryDeleteSlot.style.setProperty('pointer-events', shouldShowHistoryDelete ? 'auto' : 'none', 'important');
        }
        item._xHistoryDeleteButton.style.setProperty('visibility', shouldShowHistoryDelete ? 'visible' : 'hidden', 'important');
        item._xHistoryDeleteButton.style.setProperty('pointer-events', shouldShowHistoryDelete ? 'auto' : 'none', 'important');
        item._xHistoryDeleteButton.style.setProperty('opacity', shouldShowHistoryDelete ? '1' : '0', 'important');
        item._xHistoryDeleteButton.style.setProperty(
          'transform',
          shouldShowHistoryDelete ? 'translateX(0)' : 'translateX(4px)',
          'important'
        );
        if (shouldShowHistoryDelete) {
          item._xHistoryDeleteButton.style.setProperty(
            'color',
            isActive ? resolvedTheme.buttonText : 'var(--x-ext-input-icon, #9CA3AF)',
            'important'
          );
          item._xHistoryDeleteButton.style.setProperty(
            'background',
            isActive ? resolvedTheme.buttonBg : 'transparent',
            'important'
          );
          item._xHistoryDeleteButton.style.setProperty(
            'border',
            isActive ? `1px solid ${resolvedTheme.buttonBorder}` : '1px solid transparent',
            'important'
          );
        } else {
          item._xHistoryDeleteButton.style.setProperty('background', 'transparent', 'important');
          item._xHistoryDeleteButton.style.setProperty('border', '1px solid transparent', 'important');
          item._xHistoryDeleteButton.style.setProperty('color', 'var(--x-ext-input-icon, #9CA3AF)', 'important');
        }
      }
      if (item._xHistoryTag) {
        item._xHistoryTag.style.setProperty('display', shouldHideSourceTags ? 'none' : 'inline-flex', 'important');
        if (isActive) {
          item._xHistoryTag.style.setProperty('background', resolvedTheme.tagBg, 'important');
          item._xHistoryTag.style.setProperty('color', resolvedTheme.tagText, 'important');
          item._xHistoryTag.style.setProperty('border', `1px solid ${resolvedTheme.tagBorder}`, 'important');
        } else {
          item._xHistoryTag.style.setProperty('background', item._xHistoryTag._xDefaultBg || 'var(--x-ov-tag-bg, #F3F4F6)', 'important');
          item._xHistoryTag.style.setProperty('color', item._xHistoryTag._xDefaultText || 'var(--x-ov-tag-text, #6B7280)', 'important');
          item._xHistoryTag.style.setProperty('border', `1px solid ${item._xHistoryTag._xDefaultBorder || 'transparent'}`, 'important');
        }
      }
      if (item._xBookmarkTag) {
        item._xBookmarkTag.style.setProperty('display', shouldHideSourceTags ? 'none' : 'inline-flex', 'important');
        if (isActive) {
          item._xBookmarkTag.style.setProperty('background', resolvedTheme.tagBg, 'important');
          item._xBookmarkTag.style.setProperty('color', resolvedTheme.tagText, 'important');
          item._xBookmarkTag.style.setProperty('border', `1px solid ${resolvedTheme.tagBorder}`, 'important');
        } else {
          item._xBookmarkTag.style.setProperty('background', item._xBookmarkTag._xDefaultBg || 'var(--x-ov-bookmark-tag-bg, #FEF3C7)', 'important');
          item._xBookmarkTag.style.setProperty('color', item._xBookmarkTag._xDefaultText || 'var(--x-ov-bookmark-tag-text, #D97706)', 'important');
          item._xBookmarkTag.style.setProperty('border', `1px solid ${item._xBookmarkTag._xDefaultBorder || 'transparent'}`, 'important');
        }
      }
      if (item._xTopSiteTag) {
        item._xTopSiteTag.style.setProperty('display', shouldHideSourceTags ? 'none' : 'inline-flex', 'important');
        if (isActive) {
          item._xTopSiteTag.style.setProperty('background', resolvedTheme.tagBg, 'important');
          item._xTopSiteTag.style.setProperty('color', resolvedTheme.tagText, 'important');
          item._xTopSiteTag.style.setProperty('border', `1px solid ${resolvedTheme.tagBorder}`, 'important');
        } else {
          item._xTopSiteTag.style.setProperty('background', item._xTopSiteTag._xDefaultBg || 'var(--x-ov-tag-bg, #F3F4F6)', 'important');
          item._xTopSiteTag.style.setProperty('color', item._xTopSiteTag._xDefaultText || 'var(--x-ov-tag-text, #6B7280)', 'important');
          item._xTopSiteTag.style.setProperty('border', `1px solid ${item._xTopSiteTag._xDefaultBorder || 'transparent'}`, 'important');
        }
      }
      if (item._xOpenTabTag) {
        item._xOpenTabTag.style.setProperty('display', item._xHasSwitchAction ? 'inline-flex' : 'none', 'important');
        if (isActive) {
          item._xOpenTabTag.style.setProperty('background', resolvedTheme.tagBg, 'important');
          item._xOpenTabTag.style.setProperty('color', resolvedTheme.tagText, 'important');
          item._xOpenTabTag.style.setProperty('border', `1px solid ${resolvedTheme.tagBorder}`, 'important');
        } else {
          item._xOpenTabTag.style.setProperty('background', item._xOpenTabTag._xDefaultBg || 'var(--x-ov-tag-bg, #F3F4F6)', 'important');
          item._xOpenTabTag.style.setProperty('color', item._xOpenTabTag._xDefaultText || 'var(--x-ov-tag-text, #6B7280)', 'important');
          item._xOpenTabTag.style.setProperty('border', `1px solid ${item._xOpenTabTag._xDefaultBorder || 'transparent'}`, 'important');
        }
      }
      if (item._xTagContainer) {
        const shouldShow = isActive && item._xHasActionTags;
        item._xTagContainer.style.setProperty('display', shouldShow ? 'inline-flex' : 'none', 'important');
      }
      if (item._xTitle) {
        item._xTitle.style.setProperty('font-weight', isActive ? '600' : '400', 'important');
      }
    }

    function updateSelection() {
      suggestionItems.forEach((item, index) => {
        const isSelected = index === selectedIndex;
        const shouldAutoHighlight = selectedIndex === -1 && item._xIsAutocompleteTop;
        const isHighlighted = isSelected || shouldAutoHighlight;
        if (item._xIsSearchSuggestion) {
          const theme = item._xTheme || defaultTheme;
          const shouldUseBlue = !(theme && theme._xIsBrand) && (isSelected || item._xIsAutocompleteTop);
          const highlightTheme = shouldUseBlue ? urlHighlightTheme : theme;
          if (isHighlighted) {
            applySearchSuggestionHighlight(item, highlightTheme);
          } else {
            resetSearchSuggestion(item);
          }
          applySearchActionStyles(item, theme, isHighlighted);
          setNonFaviconIconBg(item, Boolean(isHighlighted || item._xIsHovering));
          if (item._xDirectIconWrap) {
            const shouldShow = isHighlighted && theme && theme._xIsBrand;
            const resolvedTheme = getThemeForMode(theme || defaultTheme);
            item._xDirectIconWrap.style.setProperty(
              'color',
              shouldShow ? resolvedTheme.accent : 'var(--x-ov-subtext, #9CA3AF)',
              'important'
            );
          }
          return;
        }
        setNonFaviconIconBg(item, Boolean(isHighlighted || item._xIsHovering));
        const theme = item._xTheme || defaultTheme;
        const shouldUseBlue = !(theme && theme._xIsBrand) && isHighlighted;
        const highlightTheme = shouldUseBlue ? urlHighlightTheme : theme;
        if (isHighlighted) {
          applySearchSuggestionHighlight(item, highlightTheme);
          if (item._xEntryActionTag) {
            const palette = getOverlayActionTagPalette();
            item._xEntryActionTag.style.setProperty('--x-ext-tag-bg', palette.tagBg, 'important');
            item._xEntryActionTag.style.setProperty('--x-ext-tag-text', palette.tagText, 'important');
            item._xEntryActionTag.style.setProperty('--x-ext-tag-border', palette.tagBorder, 'important');
            item._xEntryActionTag.style.setProperty('--x-ext-key-bg', palette.keyBg, 'important');
            item._xEntryActionTag.style.setProperty('--x-ext-key-text', palette.keyText, 'important');
            item._xEntryActionTag.style.setProperty('--x-ext-key-border', palette.keyBorder, 'important');
          }
          if (item._xSwitchButton) {
            item._xSwitchButton.style.setProperty('color', 'var(--x-ov-text, #1F2937)', 'important');
            const shouldShowTags = Boolean(item._xTagContainer && item._xHasActionTags);
            item._xSwitchButton.style.setProperty('display', shouldShowTags ? 'none' : 'inline-flex', 'important');
          }
          if (item._xTagContainer) {
            item._xTagContainer.style.setProperty(
              'display',
              item._xHasActionTags ? 'inline-flex' : 'none',
              'important'
            );
          }
        } else {
          resetSearchSuggestion(item);
          if (item._xSwitchButton) {
            item._xSwitchButton.style.setProperty('color', 'var(--x-ov-subtext, #9CA3AF)', 'important');
            item._xSwitchButton.style.setProperty('display', 'inline-flex', 'important');
          }
          if (item._xTagContainer) {
            item._xTagContainer.style.setProperty('display', 'none', 'important');
          }
        }
        if (item._xTitle) {
          item._xTitle.style.setProperty('font-weight', isHighlighted ? '600' : '400', 'important');
        }
      });
    }

    function animateSuggestionsGrowth(container, fromHeight) {
      if (!container || !fromHeight) {
        return;
      }
      const toHeight = container.getBoundingClientRect().height;
      if (toHeight <= fromHeight + 1) {
        return;
      }
      container.style.setProperty('height', `${fromHeight}px`, 'important');
      container.style.setProperty('overflow', 'hidden', 'important');
      container.style.setProperty('transition', 'height 180ms ease', 'important');
      requestAnimationFrame(() => {
        container.style.setProperty('height', `${toHeight}px`, 'important');
      });
      const cleanup = () => {
        container.style.removeProperty('height');
        container.style.removeProperty('overflow');
        container.style.removeProperty('transition');
        container.removeEventListener('transitionend', cleanup);
      };
      container.addEventListener('transitionend', cleanup);
      setTimeout(cleanup, 220);
    }

    function renderOverlayEmptyState(message) {
      const isDark = isOverlayDarkMode();
      const empty = document.createElement('div');
      applyNoTranslate(empty);
      empty.style.cssText = `
        all: unset !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 8px !important;
        padding: 16px 14px !important;
        margin: 0 !important;
        border: none !important;
        border-radius: 14px !important;
        background: ${isDark ? 'transparent' : 'color-mix(in srgb, var(--x-ov-bg, #FFFFFF) 90%, var(--x-ov-hover-bg, #F3F4F6) 10%)'} !important;
        color: var(--x-ov-subtext, #6B7280) !important;
        box-sizing: border-box !important;
        line-height: 1.4 !important;
        text-decoration: none !important;
        list-style: none !important;
        outline: none !important;
        font-size: 13px !important;
        font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
        vertical-align: baseline !important;
      `;
      const icon = document.createElement('span');
      applyNoTranslate(icon);
      icon.innerHTML = getRiSvg('ri-file-3-line', 'ri-size-16');
      icon.style.cssText = `
        all: unset !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        color: var(--x-ov-subtext, #9CA3AF) !important;
        line-height: 1 !important;
      `;
      const text = document.createElement('span');
      setProtectedPlainText(text, message || t('overlay_empty_result', '无匹配结果'));
      text.style.cssText = `
        all: unset !important;
        line-height: 1.35 !important;
      `;
      empty.appendChild(icon);
      empty.appendChild(text);
      suggestionsContainer.appendChild(empty);
    }

    function renderTabSuggestions(tabList) {
      suggestionsContainer.innerHTML = '';
      suggestionItems.length = 0;
      currentSuggestions = [];
      lastRenderedQuery = '';
      const list = Array.isArray(tabList) ? tabList : [];
      const showOpenTabsModeEntry = false;
      const totalItems = list.length + (showOpenTabsModeEntry ? 1 : 0);
      if (totalItems === 0) {
        const emptyText = openTabsSearchModeActive
          ? t('overlay_empty_open_tabs', '未找到匹配的已打开标签页')
          : t('overlay_empty_result', '无匹配结果');
        renderOverlayEmptyState(emptyText);
        return;
      }
      list.forEach((tab) => {
        if (tab && tab.favIconUrl) {
          preloadIcon(tab.favIconUrl);
        }
      });
      if (showOpenTabsModeEntry) {
        const entryItem = document.createElement('div');
        applyNoTranslate(entryItem);
        entryItem.id = '_x_extension_open_tabs_mode_entry_2026_unique_';
        const entryIsLast = totalItems === 1;
        entryItem.style.cssText = `
          all: unset !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 12px 16px !important;
          background: transparent !important;
          border: 1px solid transparent !important;
          border-radius: 16px !important;
          cursor: pointer !important;
          transition: background-color 0.2s ease !important;
          box-sizing: border-box !important;
          margin: 0 0 ${entryIsLast ? '0' : '4px'} 0 !important;
          line-height: 1.5 !important;
          text-decoration: none !important;
          list-style: none !important;
          outline: none !important;
          color: inherit !important;
          font-size: 100% !important;
          font: inherit !important;
          vertical-align: baseline !important;
        `;
        entryItem._xIsSearchSuggestion = false;
        entryItem._xIsOpenTabsModeEntry = true;
        entryItem._xIsAutocompleteTop = false;
        entryItem._xTheme = defaultTheme;
        suggestionItems.push(entryItem);

        const entryLeft = document.createElement('div');
        entryLeft.style.cssText = `
          all: unset !important;
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          flex: 1 !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1 !important;
          text-decoration: none !important;
          list-style: none !important;
          outline: none !important;
          background: transparent !important;
          color: inherit !important;
          font-size: 100% !important;
          font: inherit !important;
          vertical-align: baseline !important;
        `;
        const entryIconSlot = document.createElement('span');
        entryIconSlot.style.cssText = `
          all: unset !important;
          width: 24px !important;
          height: 24px !important;
          flex: 0 0 24px !important;
          flex-shrink: 0 !important;
          border-radius: 8px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1 !important;
          text-decoration: none !important;
          list-style: none !important;
          outline: none !important;
          background: transparent !important;
          transition: background-color 0.2s ease !important;
          color: var(--x-ov-subtext, #9CA3AF) !important;
          font-size: 100% !important;
          font: inherit !important;
          vertical-align: baseline !important;
        `;
        const entryIcon = document.createElement('span');
        entryIcon.innerHTML = getRiSvg('ri-search-line', 'ri-size-16');
        entryIconSlot.appendChild(entryIcon);
        entryItem._xIconWrap = entryIconSlot;
        entryItem._xIconIsFavicon = false;

        const entryTitle = document.createElement('span');
        applyNoTranslate(entryTitle);
        setProtectedPlainText(entryTitle, t('search_open_tabs_only_entry', '搜索已打开标签页'));
        entryTitle.style.cssText = `
          all: unset !important;
          color: var(--x-ov-text, #111827) !important;
          font-size: 14px !important;
          font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1.5 !important;
          text-decoration: none !important;
          list-style: none !important;
          outline: none !important;
          background: transparent !important;
          display: inline-block !important;
          vertical-align: baseline !important;
        `;
        entryItem._xTitle = entryTitle;

        const entryActionTags = document.createElement('div');
        entryActionTags.style.cssText = `
          all: unset !important;
          display: none !important;
          align-items: center !important;
          gap: 6px !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1 !important;
          text-decoration: none !important;
          list-style: none !important;
          outline: none !important;
          background: transparent !important;
          color: inherit !important;
          font-size: 100% !important;
          font: inherit !important;
          vertical-align: baseline !important;
          flex-shrink: 0 !important;
        `;
        const entryActionTag = createActionTag(t('action_search', '搜索'), 'Tab');
        entryActionTag.style.setProperty('cursor', 'pointer', 'important');
        const entryTagPalette = getOverlayActionTagPalette();
        entryActionTag.style.setProperty('--x-ext-tag-bg', entryTagPalette.tagBg, 'important');
        entryActionTag.style.setProperty('--x-ext-tag-text', entryTagPalette.tagText, 'important');
        entryActionTag.style.setProperty('--x-ext-tag-border', entryTagPalette.tagBorder, 'important');
        entryActionTag.style.setProperty('--x-ext-key-bg', entryTagPalette.keyBg, 'important');
        entryActionTag.style.setProperty('--x-ext-key-text', entryTagPalette.keyText, 'important');
        entryActionTag.style.setProperty('--x-ext-key-border', entryTagPalette.keyBorder, 'important');
        entryItem._xEntryActionTag = entryActionTag;
        entryActionTags.appendChild(entryActionTag);
        entryItem._xTagContainer = entryActionTags;
        entryItem._xHasActionTags = true;

        const entryVisitButton = document.createElement('button');
        applyNoTranslate(entryVisitButton);
        entryVisitButton.style.cssText = `
          all: unset !important;
          background: transparent !important;
          color: var(--x-ov-subtext, #9CA3AF) !important;
          border: 1px solid transparent !important;
          border-radius: 16px !important;
          font-size: 12px !important;
          font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
          cursor: pointer !important;
          transition: background-color 0.2s ease !important;
          padding: 6px 12px !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          line-height: 1 !important;
          text-decoration: none !important;
          list-style: none !important;
          outline: none !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 4px !important;
          vertical-align: baseline !important;
        `;
        setInlineLabelWithIcon(
          entryVisitButton,
          t('action_search', '搜索'),
          getRiSvg('ri-arrow-right-line', 'ri-size-12')
        );
        entryItem._xSwitchButton = entryVisitButton;

        entryItem.addEventListener('mouseenter', function() {
          if (suggestionItems.indexOf(this) !== selectedIndex) {
            this._xIsHovering = true;
            setNonFaviconIconBg(this, true);
            if (selectedIndex === -1 && this._xIsAutocompleteTop) {
              return;
            }
            this.style.setProperty('background-color', 'var(--x-ov-hover-bg)', 'important');
            this.style.setProperty('border', '1px solid transparent', 'important');
          }
        });
        entryItem.addEventListener('mouseleave', function() {
          if (suggestionItems.indexOf(this) !== selectedIndex) {
            this._xIsHovering = false;
            updateSelection();
          }
        });
        const activateEntry = function() {
          activateOpenTabsSearchMode();
          searchInput.focus();
        };
        const activateEntryFromAction = function(e) {
          e.stopPropagation();
          activateEntry();
        };
        entryActionTag.addEventListener('click', activateEntryFromAction);
        entryVisitButton.addEventListener('click', activateEntryFromAction);
        entryItem.addEventListener('click', activateEntry);

        entryLeft.appendChild(entryIconSlot);
        entryLeft.appendChild(entryTitle);
        const entryRight = document.createElement('div');
        entryRight.style.cssText = `
          all: unset !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 8px !important;
          flex-shrink: 0 !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1 !important;
          text-decoration: none !important;
          list-style: none !important;
          outline: none !important;
          background: transparent !important;
          color: inherit !important;
          font-size: 100% !important;
          font: inherit !important;
          vertical-align: baseline !important;
        `;
        entryRight.appendChild(entryActionTags);
        entryRight.appendChild(entryVisitButton);
        entryItem.appendChild(entryLeft);
        entryItem.appendChild(entryRight);
        applyNoTranslateDeep(entryItem);
        suggestionsContainer.appendChild(entryItem);
      }
      list.forEach((tab, tabIndex) => {
        const index = tabIndex + (showOpenTabsModeEntry ? 1 : 0);
        const suggestionItem = document.createElement('div');
        applyNoTranslate(suggestionItem);
        suggestionItem.id = `_x_extension_suggestion_item_${index}_2024_unique_`;
        const isLastItem = index === totalItems - 1;
        suggestionItem.style.cssText = `
          all: unset !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 12px 16px !important;
          background: transparent !important;
          border: 1px solid transparent !important;
          border-radius: 16px !important;
          cursor: pointer !important;
          transition: background-color 0.2s ease !important;
          box-sizing: border-box !important;
          margin: 0 0 ${isLastItem ? '0' : '4px'} 0 !important;
          line-height: 1.5 !important;
          text-decoration: none !important;
          list-style: none !important;
          outline: none !important;
          color: inherit !important;
          font-size: 100% !important;
          font: inherit !important;
          vertical-align: baseline !important;
        `;
        suggestionItem._xIsSearchSuggestion = false;
        
        // Store reference to suggestion item
        suggestionItems.push(suggestionItem);
        suggestionItem._xIsAutocompleteTop = tabIndex === 0;
        suggestionItem._xTheme = defaultTheme;
        suggestionItem._xTabId = tab && typeof tab.id === 'number' ? tab.id : null;

        // Create left side with icon and title
        const leftSide = document.createElement('div');
        leftSide.id = `_x_extension_left_side_${index}_2024_unique_`;
        leftSide.style.cssText = `
          all: unset !important;
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          flex: 1 !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1 !important;
          text-decoration: none !important;
          list-style: none !important;
          outline: none !important;
          background: transparent !important;
          color: inherit !important;
          font-size: 100% !important;
          font: inherit !important;
          vertical-align: baseline !important;
        `;

        // Create favicon
        let favicon = null;
        let hostForTab = '';
        try {
          hostForTab = tab && tab.url ? new URL(tab.url).hostname : '';
        } catch (e) {
          hostForTab = '';
        }
        const useFallback = !tab.favIconUrl || shouldBlockFaviconForHost(hostForTab);
        let iconNode = null;
        let isFaviconIcon = false;
        if (useFallback) {
          iconNode = createLinkIcon();
        } else {
          favicon = document.createElement('img');
          favicon.id = `_x_extension_favicon_${index}_2024_unique_`;
          favicon.decoding = 'async';
          favicon.loading = 'eager';
          favicon.referrerPolicy = 'no-referrer';
          if (index < 4) {
            favicon.fetchPriority = 'high';
          }
          favicon.style.cssText = `
            all: unset !important;
            width: 16px !important;
            height: 16px !important;
            border-radius: 2px !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
            line-height: 1 !important;
            text-decoration: none !important;
            list-style: none !important;
            outline: none !important;
            background: transparent !important;
            color: inherit !important;
            font-size: 100% !important;
            font: inherit !important;
            vertical-align: baseline !important;
            display: block !important;
          `;
          applyFaviconOpticalAlignment(favicon);
          attachResolvedFaviconWithFallbacks(
            favicon,
            tab && tab.url ? tab.url : '',
            hostForTab,
            tab.favIconUrl || '',
            () => {
              if (favicon && favicon.parentNode) {
                favicon.parentNode.replaceChild(createLinkIcon(), favicon);
              }
            }
          );
          iconNode = favicon;
          isFaviconIcon = true;
        }
        const iconSlot = document.createElement('span');
        iconSlot.style.cssText = `
          all: unset !important;
          width: 24px !important;
          height: 24px !important;
          flex: 0 0 24px !important;
          flex-shrink: 0 !important;
          border-radius: 8px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1 !important;
          text-decoration: none !important;
          list-style: none !important;
          outline: none !important;
          background: transparent !important;
          transition: background-color 0.2s ease !important;
          color: var(--x-ov-subtext, #9CA3AF) !important;
          font-size: 100% !important;
          font: inherit !important;
          vertical-align: baseline !important;
        `;
        iconSlot.appendChild(iconNode);
        suggestionItem._xIconWrap = iconSlot;
        suggestionItem._xIconIsFavicon = isFaviconIcon;

        // Create title
        const title = document.createElement('span');
        applyNoTranslate(title);
        title.id = `_x_extension_title_${index}_2024_unique_`;
        setProtectedPlainText(title, tab.title || t('untitled', '无标题'));
        title.style.cssText = `
          all: unset !important;
          color: var(--x-ov-text, #111827) !important;
          font-size: 14px !important;
          font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1.5 !important;
          text-decoration: none !important;
          list-style: none !important;
          outline: none !important;
          background: transparent !important;
          display: inline-block !important;
          vertical-align: baseline !important;
        `;
        suggestionItem._xTitle = title;

        // Create switch button
        const switchButton = document.createElement('button');
        applyNoTranslate(switchButton);
        switchButton.id = `_x_extension_switch_button_${index}_2024_unique_`;
        switchButton.style.cssText = `
          all: unset !important;
          background: transparent !important;
          color: var(--x-ov-subtext, #4B5563) !important;
          border: none !important;
          border-radius: 6px !important;
          font-size: 12px !important;
          font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
          cursor: pointer !important;
          transition: background-color 0.2s ease !important;
          height: 26px !important;
          padding: 0 12px !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          line-height: 1 !important;
          text-decoration: none !important;
          list-style: none !important;
          outline: none !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 4px !important;
          vertical-align: baseline !important;
        `;
        const switchButtonLabel = document.createElement('span');
        setProtectedPlainText(switchButtonLabel, t('switch_to_tab', '切换到标签页'));
        switchButtonLabel.style.cssText = `
          all: unset !important;
          display: inline-flex !important;
          align-items: center !important;
          line-height: 1 !important;
        `;
        const switchButtonIcon = document.createElement('span');
        applyNoTranslate(switchButtonIcon);
        switchButtonIcon.innerHTML = getRiSvg('ri-arrow-right-line', 'ri-size-12');
        switchButtonIcon.style.cssText = `
          all: unset !important;
          display: inline-flex !important;
          align-items: center !important;
          line-height: 1 !important;
        `;
        switchButton.appendChild(switchButtonLabel);
        switchButton.appendChild(switchButtonIcon);
        suggestionItem._xSwitchButton = switchButton;

        const actionTags = document.createElement('div');
        actionTags.style.cssText = `
          all: unset !important;
          display: none !important;
          align-items: center !important;
          gap: 6px !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1 !important;
          text-decoration: none !important;
          list-style: none !important;
          outline: none !important;
          background: transparent !important;
          color: inherit !important;
          font-size: 100% !important;
          font: inherit !important;
          vertical-align: baseline !important;
          flex-shrink: 0 !important;
        `;
        actionTags.appendChild(createActionTag(t('action_switch', '切换'), 'Enter'));
        suggestionItem._xTagContainer = actionTags;
        suggestionItem._xHasActionTags = actionTags.childNodes.length > 0;

        // Add hover effects
        suggestionItem.addEventListener('mouseenter', function() {
          if (suggestionItems.indexOf(this) !== selectedIndex) {
            this._xIsHovering = true;
            setNonFaviconIconBg(this, true);
            if (selectedIndex === -1 && this._xIsAutocompleteTop) {
              return;
            }
            const theme = this._xTheme;
            if (theme && theme._xIsBrand) {
              const hover = getHoverColors(theme);
              this.style.setProperty('background-color', hover.bg, 'important');
              this.style.setProperty('border', `1px solid ${hover.border}`, 'important');
            } else {
              this.style.setProperty('background-color', 'var(--x-ov-hover-bg)', 'important');
              this.style.setProperty('border', '1px solid transparent', 'important');
            }
          }
        });

        suggestionItem.addEventListener('mouseleave', function() {
          if (suggestionItems.indexOf(this) !== selectedIndex) {
            this._xIsHovering = false;
            updateSelection();
          }
        });

        // Add click handler to switch to tab
        switchButton.addEventListener('click', function(e) {
          e.stopPropagation();
          chrome.runtime.sendMessage({
            action: 'switchToTab',
            tabId: tab.id
          });
          removeOverlay(overlay);
          document.removeEventListener('keydown', keydownHandler);
        });

        // Add click handler to select item
        suggestionItem.addEventListener('click', function() {
          chrome.runtime.sendMessage({
            action: 'switchToTab',
            tabId: tab.id
          });
          removeOverlay(overlay);
          document.removeEventListener('keydown', keydownHandler);
        });

        leftSide.appendChild(iconSlot);
        leftSide.appendChild(title);
        if (overlayTabScoreDebugEnabled) {
          const rankDebug = document.createElement('span');
          applyNoTranslate(rankDebug);
          setProtectedPlainText(rankDebug, formatTabRankDebugText(tab));
          rankDebug.style.cssText = `
            all: unset !important;
            display: inline-flex !important;
            align-items: center !important;
            margin-left: 8px !important;
            padding: 1px 6px !important;
            border-radius: 999px !important;
            color: var(--x-ov-subtext, #6B7280) !important;
            background: color-mix(in srgb, var(--x-ov-bg, #FFFFFF) 70%, #94A3B8 30%) !important;
            border: 1px solid color-mix(in srgb, var(--x-ov-border, rgba(0, 0, 0, 0.08)) 75%, #94A3B8 25%) !important;
            font-size: 10px !important;
            font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
            line-height: 1.2 !important;
            white-space: nowrap !important;
            vertical-align: baseline !important;
            flex-shrink: 0 !important;
          `;
          leftSide.appendChild(rankDebug);
        }
        const rightSide = document.createElement('div');
        rightSide.style.cssText = `
          all: unset !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 8px !important;
          flex-shrink: 0 !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1 !important;
          text-decoration: none !important;
          list-style: none !important;
          outline: none !important;
          background: transparent !important;
          color: inherit !important;
          font-size: 100% !important;
          font: inherit !important;
          vertical-align: baseline !important;
        `;
        rightSide.appendChild(actionTags);
        rightSide.appendChild(switchButton);
        suggestionItem.appendChild(leftSide);
        suggestionItem.appendChild(rightSide);
        applyNoTranslateDeep(suggestionItem);
        suggestionsContainer.appendChild(suggestionItem);

        const themeSourceSuggestion = {
          url: tab.url || '',
          favicon: tab.favIconUrl || ''
        };
        const immediateTheme = getImmediateThemeForSuggestion(themeSourceSuggestion) || defaultTheme;
        suggestionItem._xTheme = immediateTheme;
        applyThemeVariables(suggestionItem, immediateTheme);
        getThemeForSuggestion(themeSourceSuggestion).then((theme) => {
          if (!suggestionItem.isConnected) {
            return;
          }
          suggestionItem._xTheme = theme;
          applyThemeVariables(suggestionItem, theme);
          updateSelection();
        });
      });

      selectedIndex = -1;
      updateSelection();
    }

    function requestTabsAndRender(filterQuery) {
      chrome.runtime.sendMessage({ action: 'getTabsForOverlay' }, (response) => {
        const freshTabs = response && Array.isArray(response.tabs) ? response.tabs : [];
        currentOverlayTabId = (response && typeof response.currentTabId === 'number')
          ? response.currentTabId
          : null;
        const queryText = typeof filterQuery === 'string'
          ? filterQuery
          : String(searchInput.value || '').trim();
        const filteredTabs = filterTabsForOverlay(freshTabs, queryText);
        tabs = filteredTabs;
        renderTabSuggestions(filteredTabs);
      });
    }
    
    function getBrowserInternalScheme() {
      const ua = navigator.userAgent || '';
      if (ua.includes('Edg/')) {
        return 'edge://';
      }
      if (ua.includes('Brave')) {
        return 'brave://';
      }
      if (ua.includes('Vivaldi')) {
        return 'vivaldi://';
      }
      if (ua.includes('OPR/') || ua.includes('Opera')) {
        return 'opera://';
      }
      return 'chrome://';
    }

    function getShortcutRules() {
      const cacheKey = '_x_extension_shortcut_rules_2024_unique_';
      const promiseKey = '_x_extension_shortcut_rules_promise_2024_unique_';
      if (window[cacheKey]) {
        return Promise.resolve(window[cacheKey]);
      }
      if (window[promiseKey]) {
        return window[promiseKey];
      }
      const rulesUrl = chrome.runtime.getURL('public/assets/data/shortcut-rules.json');
      const rulesPromise = fetch(rulesUrl)
        .then((response) => response.json())
        .then((data) => {
          const items = data && Array.isArray(data.items) ? data.items : [];
          window[cacheKey] = items;
          return items;
        })
        .catch(() => new Promise((resolve) => {
          chrome.runtime.sendMessage({ action: 'getShortcutRules' }, (response) => {
            const items = response && Array.isArray(response.items) ? response.items : [];
            window[cacheKey] = items;
            resolve(items);
          });
        }));
      window[promiseKey] = rulesPromise;
      return rulesPromise;
    }

    function buildKeywordSuggestions(input, rules) {
      const queryLower = input.toLowerCase();
      const scheme = getBrowserInternalScheme();
      const matches = [];
      rules.forEach((rule) => {
        if (!rule || !Array.isArray(rule.keys)) {
          return;
        }
        const isMatch = rule.keys.some((key) => queryLower.startsWith(key));
        if (!isMatch) {
          return;
        }
        if (rule.type === 'browserPage' && rule.path) {
          const targetUrl = `${scheme}${rule.path}`;
          matches.push({
            type: 'browserPage',
            title: formatMessage('open_url', '打开 {url}', { url: targetUrl }),
            url: targetUrl,
            favicon: 'https://img.icons8.com/?size=100&id=1LqgD1Q7n2fy&format=png&color=000000'
          });
        } else if (rule.type === 'url' && rule.url) {
          matches.push({
            type: 'browserPage',
            title: formatMessage('open_url', '打开 {url}', { url: rule.url }),
            url: rule.url,
            favicon: 'https://img.icons8.com/?size=100&id=1LqgD1Q7n2fy&format=png&color=000000'
          });
        }
      });
      return matches;
    }

    function isNumericHostLike(hostname) {
      if (!hostname) {
        return false;
      }
      if (!/^(\d{1,3})(\.\d{1,3}){0,3}$/.test(hostname)) {
        return false;
      }
      const parts = hostname.split('.');
      if (parts.length < 1 || parts.length > 4) {
        return false;
      }
      if (parts.length === 1) {
        return parts[0] === '127';
      }
      return parts.every((part) => {
        const value = Number(part);
        return Number.isInteger(value) && value >= 0 && value <= 255;
      });
    }

    function extractHostFromInput(rawInput) {
      const withoutScheme = String(rawInput || '').replace(/^https?:\/\//i, '');
      const authority = withoutScheme.split(/[/?#]/)[0] || '';
      if (!authority) {
        return '';
      }
      if (authority.startsWith('[')) {
        const endBracket = authority.indexOf(']');
        if (endBracket > 1) {
          return authority.slice(1, endBracket).toLowerCase();
        }
        return '';
      }
      if (authority.includes('::') && !authority.includes('.')) {
        return authority.toLowerCase();
      }
      return (authority.split(':')[0] || '').toLowerCase();
    }

    function isDevHostLike(hostname) {
      if (!hostname) {
        return false;
      }
      if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
        return true;
      }
      if (hostname === 'host.docker.internal') {
        return true;
      }
      if (
        hostname.endsWith('.local') ||
        hostname.endsWith('.test') ||
        hostname.endsWith('.localdev') ||
        hostname.endsWith('.internal')
      ) {
        return true;
      }
      return hostname === '::1' || hostname === '0:0:0:0:0:0:0:1';
    }

    function getDirectNavigationUrl(input) {
      const raw = String(input || '').trim();
      if (!raw) {
        return '';
      }
      const queryLower = raw.toLowerCase();
      const isInternal = ['chrome://', 'edge://', 'brave://', 'vivaldi://', 'opera://'].some((prefix) =>
        queryLower.startsWith(prefix)
      );
      let normalizedInput = raw.match(/^(\d{1,3})([.\s]\d{1,3}){0,3}(?::\d{1,5})?(?:[/?#].*)?$/)
        ? raw.replace(/\s+/g, '.').replace(/\.{2,}/g, '.')
        : raw;
      const hostOnly = extractHostFromInput(normalizedInput);
      const isDevHost = isDevHostLike(hostOnly);
      const isNumericLike = isNumericHostLike(hostOnly);
      const looksLikeUrl = (normalizedInput.includes('.') && !normalizedInput.includes(' ')) || isInternal || isDevHost || isNumericLike;
      if (!looksLikeUrl) {
        return '';
      }
      if (hostOnly.includes(':') && !/^https?:\/\//i.test(normalizedInput) && !normalizedInput.startsWith('[')) {
        normalizedInput = `[${normalizedInput}]`;
      }
      if (!isInternal && !normalizedInput.startsWith('http://') && !normalizedInput.startsWith('https://')) {
        return `https://${normalizedInput}`;
      }
      return normalizedInput;
    }

    function getDirectUrlSuggestion(input) {
      const targetUrl = getDirectNavigationUrl(input);
      if (!targetUrl) {
        return null;
      }
      let isLocalNetwork = isLocalNetworkInput(input);
      if (!isLocalNetwork) {
        const host = getHostFromUrl(targetUrl);
        isLocalNetwork = isLocalNetworkHost(host);
      }
      return {
        type: 'directUrl',
        title: formatMessage('open_url', '打开 {url}', { url: targetUrl }),
        url: targetUrl,
        favicon: '',
        isLocalNetwork: isLocalNetwork
      };
    }

    function resolveQuickNavigation(query) {
      const directUrlSuggestion = getDirectUrlSuggestion(query);
      if (directUrlSuggestion) {
        return Promise.resolve(directUrlSuggestion.url);
      }
      return getShortcutRules().then((rules) => {
        const keywordSuggestions = buildKeywordSuggestions(query, rules);
        if (keywordSuggestions.length > 0) {
          return keywordSuggestions[0].url;
        }
        return null;
      });
    }

    function isSameSuggestion(a, b) {
      if (!a || !b) {
        return false;
      }
      if (a.type !== b.type) {
        return false;
      }
      if ((a.url || '') !== (b.url || '')) {
        return false;
      }
      if ((a.title || '') !== (b.title || '')) {
        return false;
      }
      const providerA = a.provider && a.provider.key ? a.provider.key : '';
      const providerB = b.provider && b.provider.key ? b.provider.key : '';
      return providerA === providerB;
    }

    function isSuggestionPrefix(previous, next) {
      if (!Array.isArray(previous) || !Array.isArray(next)) {
        return false;
      }
      if (previous.length === 0 || previous.length > next.length) {
        return false;
      }
      for (let i = 0; i < previous.length; i += 1) {
        if (!isSameSuggestion(previous[i], next[i])) {
          return false;
        }
      }
      return true;
    }

    function updateSearchSuggestions(suggestions, query) {
      if (overlay && overlay.dataset) {
        overlay.dataset.debugUpdateQuery = query;
        overlay.dataset.debugUpdateLatestQuery = latestOverlayQuery;
        overlay.dataset.debugUpdateCount = Array.isArray(suggestions) ? String(suggestions.length) : 'null';
      }
      console.log('[Lumno overlay debug] updateSearchSuggestions', {
        query: query,
        latestOverlayQuery: latestOverlayQuery,
        suggestionCount: Array.isArray(suggestions) ? suggestions.length : null
      });
      if (query !== latestOverlayQuery) {
        return;
      }
      lastSuggestionResponse = Array.isArray(suggestions) ? suggestions : [];
      const rawTagInput = (latestRawInputValue || query || '').trim();
      const modeCommandActive = isModeCommand(rawTagInput);
      if (modeCommandActive) {
        if (storageArea) {
          storageArea.get([THEME_STORAGE_KEY], (result) => {
            const storedMode = result[THEME_STORAGE_KEY] || 'system';
            if (storedMode !== overlayThemeMode && query === latestOverlayQuery) {
              applyOverlayTheme(storedMode);
              updateSearchSuggestions([], query);
            }
          });
        }
      }
      
      // Add New Tab suggestion as first item
      const newTabSuggestion = modeCommandActive
        ? null
        : {
          type: 'newtab',
          title: formatMessage('search_query', '搜索 "{query}"', {
            query: query
          }),
          url: buildDefaultSearchUrlForOverlay(query),
          favicon: getDefaultSearchEngineFaviconUrlForOverlay(),
          searchQuery: query,
          forceSearch: true
        };

      // Add ChatGPT suggestion as second item
      // const chatGptSuggestion = {
      //   type: 'chatgpt',
      //   title: `Ask ChatGPT: "${query}"`,
      //   url: `https://chatgpt.com/?q=${encodeURIComponent(query)}`,
      //   favicon: 'https://img.icons8.com/?size=100&id=fO5yVwARGUEB&format=png&color=ffffff'
      // };

      // Add Perplexity suggestion as third item
      // const perplexitySuggestion = {
      //   type: 'perplexity',
      //   title: `Ask Perplexity: "${query}"`,
      //   url: `https://perplexity.ai/search?q=${encodeURIComponent(query)}`,
      //   favicon: 'https://img.icons8.com/?size=100&id=kzJWN5jCDzpq&format=png&color=000000'
      // };

      function buildUrlLine(url) {
        if (!url) {
          return null;
        }
        const urlLine = document.createElement('span');
        setProtectedPlainText(urlLine, url);
        urlLine.style.cssText = `
          all: unset !important;
          color: var(--x-ov-link, #2563EB) !important;
          font-size: 12px !important;
          font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
          text-decoration: none !important;
          display: inline-block !important;
          max-width: 60% !important;
          line-height: 1.4 !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          padding: 0 !important;
        `;
        return urlLine;
      }

      getShortcutRules().then((rules) => {
        if (query !== latestOverlayQuery) {
          return;
        }
        const commandMatch = !modeCommandActive ? getCommandMatch(rawTagInput) : null;
        const hasCommand = Boolean(commandMatch);
        const preSuggestions = [];
        if (modeCommandActive) {
          preSuggestions.push(buildModeSuggestion());
        } else {
          if (hasCommand) {
            preSuggestions.push(buildCommandSuggestion(commandMatch.command));
          }
          const directUrlSuggestion = getDirectUrlSuggestion(query);
          if (directUrlSuggestion && !isCurrentOverlayTabUrl(directUrlSuggestion.url)) {
            preSuggestions.push(directUrlSuggestion);
          }
          const keywordSuggestions = buildKeywordSuggestions(query, rules);
          preSuggestions.push(...keywordSuggestions);
        }

        const providersForTags = (siteSearchProvidersCache && siteSearchProvidersCache.length > 0)
          ? siteSearchProvidersCache
          : defaultSiteSearchProviders;
        if (!siteSearchProvidersCache && !pendingProviderReload) {
          pendingProviderReload = true;
          getSiteSearchProviders().then((items) => {
            pendingProviderReload = false;
            if (query !== latestOverlayQuery) {
              return;
            }
            siteSearchProvidersCache = items;
            updateSearchSuggestions(suggestions, query);
          });
        }
        const rawTagInputForInline = (latestRawInputValue || searchInput.value || '').trim();
        const inlineCandidate = (!siteSearchState && !modeCommandActive && !hasCommand)
          ? getInlineSiteSearchCandidate(rawTagInputForInline, providersForTags)
          : null;
        let inlineSuggestion = null;
        if (inlineCandidate) {
          const inlineUrl = buildSearchUrl(inlineCandidate.provider.template, inlineCandidate.query);
          if (inlineUrl) {
            inlineSuggestion = {
              type: 'inlineSiteSearch',
              title: formatMessage('search_in_site', '在 {site} 中搜索', {
                site: getSiteSearchDisplayName(inlineCandidate.provider)
              }),
              url: inlineUrl,
              favicon: getProviderIcon(inlineCandidate.provider),
              provider: inlineCandidate.provider,
              searchQuery: inlineCandidate.query
            };
          }
        }

        // Add New Tab, ChatGPT and Perplexity suggestions to the beginning
        let allSuggestions = modeCommandActive
          ? [...preSuggestions]
          : [...preSuggestions, newTabSuggestion, /*chatGptSuggestion, perplexitySuggestion,*/ ...suggestions];
        allSuggestions.forEach((item) => {
          if (!item || !item.url) {
            return;
          }
          const matchedTabId = getMatchedOpenTabIdForSuggestion(item);
          if (typeof matchedTabId === 'number') {
            item._xMatchedTabId = matchedTabId;
            return;
          }
          if (Object.prototype.hasOwnProperty.call(item, '_xMatchedTabId')) {
            delete item._xMatchedTabId;
          }
        });
        if (!modeCommandActive && siteSearchState && query) {
          const siteUrl = buildSearchUrl(siteSearchState.template, query);
          if (siteUrl) {
            allSuggestions.unshift({
              type: 'siteSearch',
              title: formatMessage('search_in_site_query', '在 {site} 中搜索 "{query}"', {
                site: getSiteSearchDisplayName(siteSearchState),
                query: query
              }),
              url: siteUrl,
              favicon: getProviderIcon(siteSearchState),
              provider: siteSearchState,
              searchQuery: query
            });
          }
        }
        if (shouldRestrictInteractiveSiteSearchSuggestions(siteSearchState, query)) {
          const primaryInteractiveSuggestion = allSuggestions.find((item) =>
            item &&
            item.provider === siteSearchState &&
            item.searchQuery === query
          );
          allSuggestions = primaryInteractiveSuggestion ? [primaryInteractiveSuggestion] : [];
        }
        allSuggestions = filterOverlayBlacklistedSuggestions(allSuggestions, query);
        const onlyKeywordSuggestions = allSuggestions.length > 0 &&
          allSuggestions.every((item) => item && (item.type === 'googleSuggest' || item.type === 'newtab'));

        let autocompleteCandidate = null;
        let primaryHighlightIndex = -1;
        let primaryHighlightReason = 'none';
        let strongNavigationMatch = null;
        let topSiteMatch = null;
        let siteSearchPrompt = null;
        const inlineEnabled = Boolean(inlineSuggestion);
        let siteSearchTrigger = null;
        let mergedProvider = null;
        let primarySuggestion = null;
        const preferAutocompleteFirst = overlaySearchResultPriorityMode !== 'search';
        if (!modeCommandActive && !hasCommand) {
          if (!siteSearchState && !inlineEnabled && preferAutocompleteFirst) {
            strongNavigationMatch = promoteStrongNavigationMatch(allSuggestions, latestRawInputValue.trim());
            if (strongNavigationMatch) {
              primaryHighlightIndex = 0;
              primaryHighlightReason = 'navigation';
            }
            topSiteMatch = promoteTopSiteMatch(allSuggestions, latestRawInputValue.trim());
          }
          siteSearchTrigger = (!siteSearchState && !inlineEnabled)
            ? getSiteSearchTriggerCandidate(rawTagInput, providersForTags, topSiteMatch)
            : null;
          if (siteSearchTrigger && !topSiteMatch && !strongNavigationMatch) {
            siteSearchPrompt = {
              type: 'siteSearchPrompt',
              title: formatMessage('search_in_site', '在 {site} 中搜索', {
                site: getSiteSearchDisplayName(siteSearchTrigger)
              }),
              url: '',
              favicon: getProviderIcon(siteSearchTrigger),
              provider: siteSearchTrigger
            };
            if (!isOverlaySuggestionBlockedBySearchBlacklist(siteSearchPrompt, rawTagInput)) {
              allSuggestions.unshift(siteSearchPrompt);
              primaryHighlightIndex = 0;
              primaryHighlightReason = 'siteSearchPrompt';
            } else {
              siteSearchPrompt = null;
            }
          }
          if (!siteSearchState && !inlineEnabled && !siteSearchPrompt && !strongNavigationMatch && preferAutocompleteFirst) {
            autocompleteCandidate = getAutocompleteCandidate(allSuggestions, latestRawInputValue);
            if (autocompleteCandidate) {
              const candidateIndex = allSuggestions.findIndex((suggestion) => {
                if (!suggestion || suggestion.type === 'newtab') {
                  return false;
                }
                if (autocompleteCandidate.url && suggestion.url === autocompleteCandidate.url) {
                  return true;
                }
                const suggestionUrlText = getUrlDisplay(suggestion.url);
                if (suggestionUrlText && suggestionUrlText.toLowerCase() === autocompleteCandidate.completion.toLowerCase()) {
                  return true;
                }
                if (suggestion.title && suggestion.title.toLowerCase().startsWith(autocompleteCandidate.completion.toLowerCase())) {
                  return true;
                }
                return false;
              });
              if (candidateIndex >= 0 && candidateIndex !== 0) {
                const [candidateSuggestion] = allSuggestions.splice(candidateIndex, 1);
                allSuggestions.unshift(candidateSuggestion);
              }
              primaryHighlightIndex = 0;
              primaryHighlightReason = 'autocomplete';
            }
          }
          if (inlineSuggestion) {
            allSuggestions.unshift(inlineSuggestion);
            allSuggestions = filterOverlayBlacklistedSuggestions(allSuggestions, query);
            primaryHighlightIndex = 0;
            primaryHighlightReason = 'inline';
          } else if (!siteSearchPrompt && !strongNavigationMatch && topSiteMatch && preferAutocompleteFirst) {
            primaryHighlightIndex = 0;
            primaryHighlightReason = 'topSite';
          }
          if (!siteSearchState && query && (overlayTabQuickSwitchEnabled || prioritizeCurrentPageMatch)) {
            const preferredCurrentTabMatchIndex = prioritizeCurrentPageMatch && typeof currentOverlayTabId === 'number'
              ? allSuggestions.findIndex((item) =>
                item &&
                item.type !== 'newtab' &&
                item._xMatchedTabId === currentOverlayTabId
              )
              : -1;
            if (preferredCurrentTabMatchIndex >= 0) {
              if (preferredCurrentTabMatchIndex > 0) {
                const [preferredCurrentTabMatch] = allSuggestions.splice(preferredCurrentTabMatchIndex, 1);
                allSuggestions.unshift(preferredCurrentTabMatch);
              }
              primaryHighlightIndex = 0;
              primaryHighlightReason = 'currentOpenTab';
            }
            if (preferredCurrentTabMatchIndex < 0) {
              const openTabMatchIndex = allSuggestions.findIndex((item) =>
                item &&
                item.type !== 'newtab' &&
                typeof item._xMatchedTabId === 'number'
              );
              if (openTabMatchIndex >= 0) {
                if (openTabMatchIndex > 0) {
                  const [openTabMatch] = allSuggestions.splice(openTabMatchIndex, 1);
                  allSuggestions.unshift(openTabMatch);
                }
                primaryHighlightIndex = 0;
                primaryHighlightReason = 'openTab';
              }
            }
          }
          if (query && primaryHighlightIndex < 0 && allSuggestions.length > 0) {
            primaryHighlightIndex = 0;
            primaryHighlightReason = 'default';
          }
          if (primaryHighlightIndex >= 0) {
            primarySuggestion = allSuggestions[primaryHighlightIndex] || null;
            mergedProvider = findProviderForSuggestionMatch(primarySuggestion, providersForTags);
          }
          applyAutocomplete(allSuggestions, primarySuggestion, primaryHighlightReason);
          const inlineAutoHighlight = Boolean(inlineSuggestion && primaryHighlightIndex === 0);
          inlineSearchState = inlineSuggestion
            ? {
              url: inlineSuggestion.url,
              rawInput: rawTagInputForInline,
              isAuto: inlineAutoHighlight,
              provider: inlineSuggestion.provider || null,
              query: inlineSuggestion.searchQuery || ''
            }
            : null;
          const resolvedProvider = mergedProvider || siteSearchTrigger;
          siteSearchTriggerState = resolvedProvider
            ? { provider: resolvedProvider, rawInput: rawTagInputForInline }
            : null;
        } else if (modeCommandActive) {
          clearAutocomplete();
          inlineSearchState = null;
          siteSearchTriggerState = null;
          primaryHighlightIndex = 0;
          primaryHighlightReason = 'modeSwitch';
        } else if (hasCommand) {
          clearAutocomplete();
          inlineSearchState = null;
          siteSearchTriggerState = null;
          primaryHighlightIndex = 0;
          primaryHighlightReason = 'command';
        }
        if (hasCommand) {
          applyAutocomplete(allSuggestions, primarySuggestion, primaryHighlightReason);
        }
        const canAppend = query === lastRenderedQuery &&
          isSuggestionPrefix(currentSuggestions, allSuggestions);
        const startIndex = canAppend ? currentSuggestions.length : 0;
        const shouldAnimateGrowth = canAppend && startIndex < allSuggestions.length;
        const previousHeight = shouldAnimateGrowth
          ? suggestionsContainer.getBoundingClientRect().height
          : 0;
        if (!canAppend) {
          // Clear existing suggestions
          suggestionsContainer.innerHTML = '';
          suggestionItems.length = 0;
          selectedIndex = -1;
        } else {
          suggestionItems.forEach((item, index) => {
            item._xIsAutocompleteTop = index === primaryHighlightIndex;
          });
        }

        currentSuggestions = allSuggestions; // Store current suggestions including ChatGPT
        lastRenderedQuery = query;
        warmIconCache(allSuggestions);
        
        // Add search suggestions
        allSuggestions.forEach((suggestion, index) => {
          if (index < startIndex) {
            return;
          }
          const suggestionItem = document.createElement('div');
          applyNoTranslate(suggestionItem);
          suggestionItem.id = `_x_extension_suggestion_item_${index}_2024_unique_`;
          const isLastItem = index === allSuggestions.length - 1;
          const isPrimaryHighlight = index === primaryHighlightIndex;
          const shouldSwitchMatchedTab = isPrimaryHighlight &&
            (primaryHighlightReason === 'openTab' || primaryHighlightReason === 'currentOpenTab') &&
            shouldSwitchMatchedTabSuggestion(suggestion, index);
          const isPrimarySearchSuggest = isPrimaryHighlight && suggestion.type === 'googleSuggest';
          let immediateTheme = getImmediateThemeForSuggestion(suggestion) || defaultTheme;
          if (suggestion.type === 'directUrl' || suggestion.type === 'browserPage') {
            immediateTheme = urlHighlightTheme;
          }
          const shouldUseSearchEngineTheme = isPrimarySearchSuggest ||
            (onlyKeywordSuggestions && isPrimaryHighlight && suggestion.type === 'newtab');
          if (shouldUseSearchEngineTheme) {
            const engineAccent = getBrandAccentForUrl(getDefaultSearchEngineThemeUrlForOverlay());
            if (engineAccent) {
              immediateTheme = buildTheme(engineAccent);
              immediateTheme._xIsBrand = true;
            }
          }
          const initialHighlight = isPrimaryHighlight ? getHighlightColors(immediateTheme) : null;
          suggestionItem.style.cssText = `
            all: unset !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            padding: 12px 16px !important;
            background: ${isPrimaryHighlight ? initialHighlight.bg : 'transparent'} !important;
            border: ${isPrimaryHighlight ? `1px solid ${initialHighlight.border}` : '1px solid transparent'} !important;
            border-radius: 16px !important;
            margin-bottom: ${isLastItem ? '0' : '4px'} !important;
            cursor: pointer !important;
            transition: background-color 0.2s ease !important;
            box-sizing: border-box !important;
            margin: 0 0 ${isLastItem ? '0' : '4px'} 0 !important;
            line-height: 1.5 !important;
            text-decoration: none !important;
            list-style: none !important;
            outline: none !important;
            color: inherit !important;
            font-size: 100% !important;
            font: inherit !important;
            vertical-align: baseline !important;
          `;
          
          suggestionItems.push(suggestionItem);
          suggestionItem._xIsSearchSuggestion = true;
          suggestionItem._xIsAutocompleteTop = isPrimaryHighlight;
          suggestionItem._xTheme = immediateTheme;
          applyThemeVariables(suggestionItem, immediateTheme);
          
          // Create left side with icon and title
          const leftSide = document.createElement('div');
          leftSide.style.cssText = `
            all: unset !important;
            display: flex !important;
            align-items: center !important;
            gap: 12px !important;
            flex: 1 !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
            line-height: 1 !important;
            text-decoration: none !important;
            list-style: none !important;
            outline: none !important;
            background: transparent !important;
            color: inherit !important;
            font-size: 100% !important;
            font: inherit !important;
            vertical-align: baseline !important;
            transition: gap 160ms ease, transform 160ms ease !important;
          `;
          
          let iconNode = null;
          let iconWrapper = null;
          if (suggestion.type === 'browserPage') {
            const themedIcon = document.createElement('span');
            themedIcon.innerHTML = getRiSvg('ri-link', 'ri-size-16');
            themedIcon.style.cssText = `
              all: unset !important;
              width: 16px !important;
              height: 16px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              box-sizing: border-box !important;
              margin: 0 !important;
              padding: 0 !important;
              line-height: 1 !important;
              text-decoration: none !important;
              list-style: none !important;
              outline: none !important;
              background: transparent !important;
              color: inherit !important;
              font-size: 100% !important;
              font: inherit !important;
              vertical-align: baseline !important;
            `;
            iconNode = themedIcon;
          } else if (suggestion.type === 'directUrl') {
            const directUrlHost = suggestion && suggestion.url ? getHostFromUrl(suggestion.url) : '';
            const isLocalDirectUrl = Boolean(
              suggestion && suggestion.isLocalNetwork
            ) || (directUrlHost && isLocalNetworkHost(directUrlHost));
            iconNode = isLocalDirectUrl
              ? createLinkIcon()
              : createSearchIcon();
          } else if (suggestion.type === 'commandNewTab') {
            const plusIcon = document.createElement('span');
            plusIcon.innerHTML = getRiSvg('ri-add-line', 'ri-size-16');
            plusIcon.style.cssText = `
              all: unset !important;
              width: 16px !important;
              height: 16px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              box-sizing: border-box !important;
              margin: 0 !important;
              padding: 0 !important;
              line-height: 1 !important;
              text-decoration: none !important;
              list-style: none !important;
              outline: none !important;
              background: transparent !important;
              color: var(--x-ov-subtext, #9CA3AF) !important;
              font-size: 100% !important;
              font: inherit !important;
              vertical-align: baseline !important;
            `;
            iconNode = plusIcon;
          } else if (suggestion.type === 'commandSettings') {
            const gearIcon = document.createElement('span');
            gearIcon.innerHTML = getRiSvg('ri-settings-3-line', 'ri-size-16');
            gearIcon.style.cssText = `
              all: unset !important;
              width: 16px !important;
              height: 16px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              box-sizing: border-box !important;
              margin: 0 !important;
              padding: 0 !important;
              line-height: 1 !important;
              text-decoration: none !important;
              list-style: none !important;
              outline: none !important;
              background: transparent !important;
              color: var(--x-ov-subtext, #9CA3AF) !important;
              font-size: 100% !important;
              font: inherit !important;
              vertical-align: baseline !important;
            `;
            iconNode = gearIcon;
          } else if (suggestion.type === 'modeSwitch' && suggestion.favicon) {
            const favicon = document.createElement('img');
            favicon.decoding = 'async';
            favicon.loading = 'eager';
            favicon.referrerPolicy = 'no-referrer';
            if (index < 4) {
              favicon.fetchPriority = 'high';
            }
            favicon.style.cssText = `
              all: unset !important;
              width: 16px !important;
              height: 16px !important;
              border-radius: 2px !important;
              box-sizing: border-box !important;
              margin: 0 !important;
              padding: 0 !important;
              line-height: 1 !important;
              text-decoration: none !important;
              list-style: none !important;
              outline: none !important;
              background: transparent !important;
              color: inherit !important;
              font-size: 100% !important;
              font: inherit !important;
              vertical-align: baseline !important;
              display: block !important;
            `;
            applyFaviconOpticalAlignment(favicon);
            favicon.src = suggestion.favicon || '';
            favicon.onerror = function() {
              const fallbackDiv = createSearchIcon();
              fallbackDiv.style.setProperty('color', 'var(--x-ov-subtext, #9CA3AF)', 'important');
              if (favicon.parentNode) {
                favicon.parentNode.replaceChild(fallbackDiv, favicon);
              }
            };
            iconNode = favicon;
          } else if (suggestion.type === 'newtab' || suggestion.type === 'googleSuggest') {
            const searchIcon = createSearchIcon();
            searchIcon.style.setProperty('color', 'var(--x-ov-subtext, #9CA3AF)', 'important');
            iconNode = searchIcon;
          } else {
            const suggestionHost = suggestion.url ? getHostFromUrl(suggestion.url) : '';
            if (suggestionHost && shouldBlockFaviconForHost(suggestionHost)) {
              iconNode = createLinkIcon();
            } else if (suggestion.favicon) {
              // Create icon for suggestions - always use img for all types
              const favicon = document.createElement('img');
              favicon.decoding = 'async';
              favicon.loading = 'eager';
              favicon.referrerPolicy = 'no-referrer';
              if (index < 4) {
                favicon.fetchPriority = 'high';
              }
              attachFaviconData(
                favicon,
                suggestion.favicon || '',
                suggestion && suggestion.url ? getHostFromUrl(suggestion.url) : ''
              );
              favicon.style.cssText = `
                all: unset !important;
                width: 16px !important;
                height: 16px !important;
                border-radius: 2px !important;
                box-sizing: border-box !important;
                margin: 0 !important;
                padding: 0 !important;
                line-height: 1 !important;
                text-decoration: none !important;
                list-style: none !important;
                outline: none !important;
                background: transparent !important;
                color: inherit !important;
                font-size: 100% !important;
                font: inherit !important;
                vertical-align: baseline !important;
                display: block !important;
                object-fit: contain !important;
              `;
              applyFaviconOpticalAlignment(favicon);
              const replaceWithFallbackIcon = function() {
                const fallbackDiv = createLinkIcon();
                if (favicon.parentNode) {
                  favicon.parentNode.replaceChild(fallbackDiv, favicon);
                }
              };
              attachResolvedFaviconWithFallbacks(
                favicon,
                suggestion && suggestion.url ? suggestion.url : '',
                suggestionHost,
                suggestion.favicon || '',
                replaceWithFallbackIcon
              );
              iconNode = favicon;
            } else {
              const searchIcon = createSearchIcon();
              searchIcon.style.setProperty('color', 'var(--x-ov-subtext, #9CA3AF)', 'important');
              iconNode = searchIcon;
            }
          }
          
          if (iconNode) {
            const isFaviconIcon = iconNode.tagName === 'IMG';
            const iconSlot = document.createElement('span');
            iconSlot.style.cssText = `
              all: unset !important;
              width: 24px !important;
              height: 24px !important;
              flex: 0 0 24px !important;
              flex-shrink: 0 !important;
              border-radius: 8px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              box-sizing: border-box !important;
              margin: 0 !important;
              padding: 0 !important;
              line-height: 1 !important;
              text-decoration: none !important;
              list-style: none !important;
              outline: none !important;
              background: transparent !important;
              transition: background-color 0.2s ease !important;
              color: var(--x-ov-subtext, #9CA3AF) !important;
              font-size: 100% !important;
              font: inherit !important;
              vertical-align: baseline !important;
            `;
            iconSlot._xIsFavicon = isFaviconIcon;
            iconSlot.appendChild(iconNode);
            iconNode = iconSlot;
            suggestionItem._xIconWrap = iconSlot;
            suggestionItem._xIconIsFavicon = isFaviconIcon;
            if (suggestion.type === 'directUrl' || suggestion.type === 'browserPage') {
              iconWrapper = iconSlot;
            }
          }
          
          // Create text wrapper for title and tag
          const textWrapper = document.createElement('div');
          textWrapper.setAttribute('data-ai-sweep-distort', 'text');
          textWrapper.style.cssText = `
            all: unset !important;
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
            flex: 1 !important;
            min-width: 0 !important;
            overflow: visible !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 8px 0 0 !important;
            line-height: 1 !important;
            text-decoration: none !important;
            list-style: none !important;
            outline: none !important;
            background: transparent !important;
            color: inherit !important;
            font-size: 100% !important;
            font: inherit !important;
            vertical-align: baseline !important;
          `;
          
          // Create title with highlighted query
          const title = document.createElement('span');
          applyNoTranslate(title);
          let highlightedTitle;
          if (isPrimarySearchSuggest ||
              suggestion.type === 'chatgpt' ||
              suggestion.type === 'perplexity' ||
              suggestion.type === 'newtab' ||
              suggestion.type === 'siteSearch' ||
              suggestion.type === 'inlineSiteSearch' ||
              suggestion.type === 'siteSearchPrompt' ||
              suggestion.type === 'modeSwitch') {
            // For ChatGPT, Perplexity, and New Tab, don't highlight the query part
            highlightedTitle = suggestion.title;
          } else {
            // For other suggestions, highlight the query
            highlightedTitle = suggestion.title;
          }
          setProtectedHighlightedText(title, highlightedTitle, query, {
            background: 'var(--x-ext-mark-bg, #CFE8FF)',
            color: 'var(--x-ext-mark-text, #1E3A8A)'
          });
          title.style.cssText = `
            all: unset !important;
            color: var(--x-ov-text, #111827) !important;
            font-size: 14px !important;
            font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
            font-weight: 400 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
            line-height: 1.5 !important;
            text-decoration: none !important;
            list-style: none !important;
            outline: none !important;
            background: transparent !important;
            display: inline-block !important;
            vertical-align: baseline !important;
          `;
          suggestionItem._xTitle = title;
          
          textWrapper.appendChild(title);
          const reasonText = Array.isArray(suggestion.reasons)
            ? suggestion.reasons.map((item) => String(item || '').trim()).filter(Boolean).join(' · ')
            : '';
          if (overlayTabScoreDebugEnabled && reasonText) {
            const reasonLine = document.createElement('span');
            setProtectedPlainText(reasonLine, reasonText);
            reasonLine.style.cssText = `
              all: unset !important;
              color: var(--x-ov-subtext, #6B7280) !important;
              font-size: 11px !important;
              font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
              line-height: 1.2 !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
              max-width: 100% !important;
              display: inline-block !important;
              vertical-align: middle !important;
            `;
            textWrapper.appendChild(reasonLine);
          }
          
          // Add history tag if type is history
          if (suggestion.type === 'history' && !suggestion.isTopSite) {
            const urlLine = buildUrlLine(suggestion.url || '');
            if (urlLine) {
              textWrapper.appendChild(urlLine);
            }
            const historyTag = document.createElement('span');
            setProtectedPlainText(historyTag, t('search_tag_history', '历史'));
            historyTag._xDefaultBg = 'var(--x-ov-tag-bg, #F3F4F6)';
            historyTag._xDefaultText = 'var(--x-ov-tag-text, #6B7280)';
            historyTag._xDefaultBorder = 'transparent';
            historyTag.style.cssText = `
              all: unset !important;
              background: var(--x-ov-tag-bg, #F3F4F6) !important;
              color: var(--x-ov-tag-text, #6B7280) !important;
              font-size: 10px !important;
              font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
              padding: 4px 6px !important;
              border-radius: 8px !important;
              box-sizing: border-box !important;
              line-height: 1.2 !important;
              text-decoration: none !important;
              list-style: none !important;
              outline: none !important;
              border: 1px solid transparent !important;
              display: inline-flex !important;
              align-items: center !important;
              vertical-align: middle !important;
              flex-shrink: 0 !important;
            `;
            textWrapper.appendChild(historyTag);
            suggestionItem._xHistoryTag = historyTag;
          }
          
          // Add topSite tag if type is topSite
          if (suggestion.type === 'topSite' || suggestion.isTopSite) {
            const urlLine = buildUrlLine(suggestion.url || '');
            if (urlLine) {
              textWrapper.appendChild(urlLine);
            }
            const topSiteTag = document.createElement('span');
            setProtectedPlainText(topSiteTag, t('search_tag_top_site', '常用'));
            topSiteTag._xDefaultBg = 'var(--x-ov-tag-bg, #F3F4F6)';
            topSiteTag._xDefaultText = 'var(--x-ov-tag-text, #6B7280)';
            topSiteTag._xDefaultBorder = 'transparent';
            topSiteTag.style.cssText = `
              all: unset !important;
              background: var(--x-ov-tag-bg, #F3F4F6) !important;
              color: var(--x-ov-tag-text, #6B7280) !important;
              font-size: 10px !important;
              font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
              padding: 4px 6px !important;
              border-radius: 8px !important;
              box-sizing: border-box !important;
              line-height: 1.2 !important;
              text-decoration: none !important;
              list-style: none !important;
              outline: none !important;
              border: 1px solid transparent !important;
              display: inline-flex !important;
              align-items: center !important;
              vertical-align: middle !important;
              flex-shrink: 0 !important;
            `;
            textWrapper.appendChild(topSiteTag);
            suggestionItem._xTopSiteTag = topSiteTag;
          }
          
          // Add bookmark tag if type is bookmark
          if (suggestion.type === 'bookmark') {
            if (suggestion.path) {
              const bookmarkPath = document.createElement('span');
              setProtectedPlainText(bookmarkPath, suggestion.path);
              bookmarkPath.style.cssText = `
                all: unset !important;
                color: var(--x-ov-link, #2563EB) !important;
                font-size: 12px !important;
                font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
                text-decoration: none !important;
                white-space: nowrap !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                max-width: 100% !important;
                box-sizing: border-box !important;
                margin: 0 !important;
                padding: 0 !important;
                line-height: 1.2 !important;
                display: inline-block !important;
                vertical-align: middle !important;
              `;
              textWrapper.appendChild(bookmarkPath);
            }
          const bookmarkTag = document.createElement('span');
          setProtectedPlainText(bookmarkTag, t('search_tag_bookmark', '书签'));
          bookmarkTag._xDefaultBg = 'var(--x-ov-bookmark-tag-bg, #FEF3C7)';
          bookmarkTag._xDefaultText = 'var(--x-ov-bookmark-tag-text, #D97706)';
          bookmarkTag._xDefaultBorder = 'transparent';
          bookmarkTag.style.cssText = `
            all: unset !important;
            background: var(--x-ov-bookmark-tag-bg, #FEF3C7) !important;
            color: var(--x-ov-bookmark-tag-text, #D97706) !important;
            font-size: 10px !important;
              font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
              padding: 4px 6px !important;
              border-radius: 8px !important;
              box-sizing: border-box !important;
              line-height: 1.2 !important;
              text-decoration: none !important;
              list-style: none !important;
              outline: none !important;
              border: 1px solid transparent !important;
              display: inline-flex !important;
              align-items: center !important;
              vertical-align: middle !important;
              flex-shrink: 0 !important;
            `;
            textWrapper.appendChild(bookmarkTag);
            suggestionItem._xBookmarkTag = bookmarkTag;
          }
          if (shouldSwitchMatchedTab) {
            const openTabTag = document.createElement('span');
            setProtectedPlainText(openTabTag, t('search_tag_open_tab', '已打开'));
            openTabTag._xDefaultBg = 'var(--x-ov-tag-bg, #F3F4F6)';
            openTabTag._xDefaultText = 'var(--x-ov-tag-text, #6B7280)';
            openTabTag._xDefaultBorder = 'transparent';
            openTabTag.style.cssText = `
              all: unset !important;
              background: var(--x-ov-tag-bg, #F3F4F6) !important;
              color: var(--x-ov-tag-text, #6B7280) !important;
              font-size: 10px !important;
              font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
              padding: 4px 6px !important;
              border-radius: 8px !important;
              box-sizing: border-box !important;
              line-height: 1.2 !important;
              text-decoration: none !important;
              list-style: none !important;
              outline: none !important;
              border: 1px solid transparent !important;
              display: inline-flex !important;
              align-items: center !important;
              vertical-align: middle !important;
              flex-shrink: 0 !important;
            `;
            textWrapper.appendChild(openTabTag);
            suggestionItem._xOpenTabTag = openTabTag;
          }
          
          const rightSide = document.createElement('div');
          rightSide.style.cssText = `
            all: unset !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 8px !important;
            flex-shrink: 0 !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
            line-height: 1 !important;
            text-decoration: none !important;
            list-style: none !important;
            outline: none !important;
            background: transparent !important;
            color: inherit !important;
            font-size: 100% !important;
            font: inherit !important;
            vertical-align: baseline !important;
          `;

          const actionTags = document.createElement('div');
          actionTags.style.cssText = `
            all: unset !important;
            display: none !important;
            align-items: center !important;
            gap: 6px !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
            line-height: 1 !important;
            text-decoration: none !important;
            list-style: none !important;
            outline: none !important;
            background: transparent !important;
            color: inherit !important;
            font-size: 100% !important;
            font: inherit !important;
            vertical-align: baseline !important;
            flex-shrink: 0 !important;
          `;

          const isTopSiteMatch = Boolean(topSiteMatch && suggestion === topSiteMatch);
          const isDirectHighlight = isPrimaryHighlight &&
            (suggestion.type === 'directUrl' || suggestion.type === 'browserPage');
          const isMergedHighlight = Boolean(mergedProvider && primarySuggestion === suggestion && isPrimaryHighlight);
          const shouldShowEnterTag = !isPrimarySearchSuggest && isPrimaryHighlight &&
            !onlyKeywordSuggestions &&
            (primaryHighlightReason === 'topSite' ||
              primaryHighlightReason === 'inline' ||
              primaryHighlightReason === 'autocomplete' ||
              primaryHighlightReason === 'openTab' ||
              primaryHighlightReason === 'currentOpenTab' ||
              isDirectHighlight ||
              isMergedHighlight);
          const shouldShowSiteSearchTag = !isPrimarySearchSuggest && isPrimaryHighlight &&
            ((siteSearchTrigger && (primaryHighlightReason === 'siteSearchPrompt' || isTopSiteMatch)) ||
              isMergedHighlight);
          if (shouldSwitchMatchedTab) {
            actionTags.appendChild(createActionTag(t('action_switch', '切换'), 'Enter'));
          } else if (shouldShowEnterTag) {
            actionTags.appendChild(createActionTag(t('action_open_new_tab', '新开'), 'Enter'));
          }
          if (shouldShowSiteSearchTag) {
            actionTags.appendChild(createActionTag(t('action_search', '搜索'), 'Tab'));
          }
          if (isPrimaryHighlight && onlyKeywordSuggestions && suggestion.type === 'newtab') {
            actionTags.appendChild(createActionTag(getSearchActionLabel(), 'Enter'));
          }

          // Create visit button
          const visitButton = document.createElement('button');
          applyNoTranslate(visitButton);
          visitButton.style.cssText = `
            all: unset !important;
            background: transparent !important;
            color: var(--x-ov-subtext, #9CA3AF) !important;
            border: 1px solid transparent !important;
            border-radius: 16px !important;
            font-size: 12px !important;
            font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
            cursor: pointer !important;
            transition: background-color 0.2s ease !important;
            padding: 6px 12px !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            line-height: 1 !important;
            text-decoration: none !important;
            list-style: none !important;
            outline: none !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 4px !important;
            vertical-align: baseline !important;
            transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 160ms ease !important;
          `;
          applyNoTranslate(visitButton);
          suggestionItem._xAlwaysHideVisitButton = suggestion.type === 'modeSwitch';
          if (suggestionItem._xAlwaysHideVisitButton) {
            visitButton.style.setProperty('display', 'none', 'important');
          }
          
          if (suggestion.type === 'newtab') {
            setInlineLabelWithIcon(visitButton, getSearchActionLabel(), getRiSvg('ri-arrow-right-line', 'ri-size-12'));
          } else if (suggestion.type === 'commandNewTab') {
            setInlineLabelWithIcon(visitButton, t('command_newtab', '新建标签页'), getRiSvg('ri-arrow-right-line', 'ri-size-12'));
          } else if (suggestion.type === 'commandSettings') {
            setInlineLabelWithIcon(
              visitButton,
              formatMessage('command_settings', '打开 Lumno 设置', { name: 'Lumno' }),
              getRiSvg('ri-arrow-right-line', 'ri-size-12')
            );
          } else if (shouldSwitchMatchedTab) {
            setInlineLabelWithIcon(visitButton, t('action_switch', '切换'), getRiSvg('ri-arrow-right-line', 'ri-size-12'));
          } else if (
            suggestion.type === 'siteSearch' ||
            suggestion.type === 'siteSearchPrompt' ||
            suggestion.type === 'inlineSiteSearch'
          ) {
            setInlineLabelWithIcon(visitButton, t('action_search', '搜索'), getRiSvg('ri-arrow-right-line', 'ri-size-12'));
          } else if (suggestion.type === 'directUrl' || suggestion.type === 'browserPage') {
            setInlineLabelWithIcon(visitButton, t('action_open', '打开'), getRiSvg('ri-arrow-right-line', 'ri-size-12'));
          } else if (suggestion.type === 'googleSuggest') {
            setInlineLabelWithIcon(visitButton, getSearchActionLabel(), getRiSvg('ri-arrow-right-line', 'ri-size-12'));
          } else {
            setInlineLabelWithIcon(visitButton, t('action_open_new_tab', '新开'), getRiSvg('ri-arrow-right-line', 'ri-size-12'));
          }

          let historyDeleteButton = null;
          let historyDeleteSlot = null;
          if (suggestion.type === 'history' && !suggestion.isTopSite) {
            historyDeleteSlot = document.createElement('div');
            applyNoTranslate(historyDeleteSlot);
            historyDeleteSlot.style.cssText = `
              all: unset !important;
              width: 0 !important;
              height: 28px !important;
              flex: 0 0 auto !important;
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
              box-sizing: border-box !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
              line-height: 1 !important;
              text-decoration: none !important;
              list-style: none !important;
              outline: none !important;
              background: transparent !important;
              vertical-align: baseline !important;
              opacity: 0 !important;
              transition: width 180ms ease, margin-left 180ms ease, opacity 160ms ease !important;
            `;
            historyDeleteButton = document.createElement('button');
            applyNoTranslate(historyDeleteButton);
            historyDeleteButton.type = 'button';
            const removeHistoryTooltipText = t('search_remove_history_tooltip', '移除该历史');
            historyDeleteButton.innerHTML = getRiSvg('ri-delete-bin-6-line', 'ri-size-14');
            historyDeleteButton.setAttribute('aria-label', removeHistoryTooltipText);
            historyDeleteButton.setAttribute('title', removeHistoryTooltipText);
            historyDeleteButton.style.cssText = `
              all: unset !important;
              width: 24px !important;
              height: 24px !important;
              flex: 0 0 24px !important;
              border-radius: 8px !important;
              box-sizing: border-box !important;
              margin: 0 !important;
              padding: 0 !important;
              line-height: 1 !important;
              text-decoration: none !important;
              list-style: none !important;
              outline: none !important;
              background: transparent !important;
              color: var(--x-ext-input-icon, #9CA3AF) !important;
              display: inline-flex !important;
              visibility: hidden !important;
              pointer-events: none !important;
              opacity: 0 !important;
              align-items: center !important;
              justify-content: center !important;
              font-size: 0 !important;
              cursor: pointer !important;
              transform: translateX(4px) !important;
              transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease, transform 160ms ease, opacity 160ms ease, visibility 160ms ease !important;
            `;
            const historyDeleteIcon = historyDeleteButton.querySelector('.ri-icon');
            if (historyDeleteIcon) {
              historyDeleteIcon.style.setProperty('display', 'inline-flex', 'important');
              historyDeleteIcon.style.setProperty('align-items', 'center', 'important');
              historyDeleteIcon.style.setProperty('justify-content', 'center', 'important');
              historyDeleteIcon.style.setProperty('line-height', '1', 'important');
              historyDeleteIcon.style.setProperty('transform', 'none', 'important');
              historyDeleteIcon.style.setProperty('pointer-events', 'none', 'important');
              historyDeleteIcon.style.setProperty('cursor', 'pointer', 'important');
            }
            historyDeleteButton.addEventListener('mouseenter', () => {
              const itemIndex = suggestionItems.indexOf(suggestionItem);
              const isSelected = itemIndex === selectedIndex;
              const shouldAutoHighlight = selectedIndex === -1 && suggestionItem._xIsAutocompleteTop;
              const shouldUseThemeHover = Boolean(isSelected || shouldAutoHighlight);
              const buttonThemeSource = suggestionItem._xTheme || defaultTheme;
              const resolvedTheme = getThemeForMode(buttonThemeSource);
              const hoverColors = shouldUseThemeHover
                ? getHoverColors(buttonThemeSource)
                : getNeutralHoverActionColors();
              showTopActionTooltip(historyDeleteButton, removeHistoryTooltipText);
              historyDeleteButton.style.setProperty(
                'background',
                hoverColors.bg,
                'important'
              );
              historyDeleteButton.style.setProperty(
                'border',
                `1px solid ${hoverColors.border}`,
                'important'
              );
              historyDeleteButton.style.setProperty(
                'color',
                shouldUseThemeHover ? resolvedTheme.buttonText : hoverColors.text,
                'important'
              );
              historyDeleteButton.style.setProperty('transform', 'scale(1.06)', 'important');
            });
            historyDeleteButton.addEventListener('mouseleave', () => {
              hideTopActionTooltip();
              historyDeleteButton.style.setProperty('background', 'transparent', 'important');
              historyDeleteButton.style.setProperty('border', '1px solid transparent', 'important');
              historyDeleteButton.style.setProperty('transform', 'none', 'important');
            });
            historyDeleteButton.addEventListener('blur', () => {
              hideTopActionTooltip();
              historyDeleteButton.style.setProperty('background', 'transparent', 'important');
              historyDeleteButton.style.setProperty('border', '1px solid transparent', 'important');
              historyDeleteButton.style.setProperty('transform', 'none', 'important');
            });
            historyDeleteButton.addEventListener('pointerup', () => {
              historyDeleteButton.style.setProperty('transform', 'none', 'important');
            });
            historyDeleteButton.addEventListener('pointercancel', () => {
              historyDeleteButton.style.setProperty('transform', 'none', 'important');
            });
            historyDeleteButton.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              chrome.runtime.sendMessage({
                action: 'deleteHistoryUrl',
                url: suggestion.url
              }, function(response) {
                if (!response || response.ok !== true) {
                  return;
                }
                const queryToRefresh = latestOverlayQuery || (searchInput ? String(searchInput.value || '').trim() : '');
                if (!queryToRefresh) {
                  updateSearchSuggestions([], '');
                  return;
                }
                chrome.runtime.sendMessage({
                  action: OVERLAY_SEARCH_PROTOCOL.action,
                  query: queryToRefresh,
                  context: 'overlay',
                  mode: OVERLAY_SEARCH_PROTOCOL.mode
                }, function(nextResponse) {
                  if (chrome.runtime && chrome.runtime.lastError) {
                    return;
                  }
                  updateSearchSuggestions(
                    nextResponse && Array.isArray(nextResponse.suggestions) ? nextResponse.suggestions : [],
                    queryToRefresh
                  );
                });
              });
            });
            historyDeleteSlot.appendChild(historyDeleteButton);
          }
          
          // Add hover effects
          suggestionItem.addEventListener('mouseenter', function() {
            this._xIsHovering = true;
            setNonFaviconIconBg(this, true);
            updateSelection();
            if (suggestionItems.indexOf(this) !== selectedIndex) {
              if (selectedIndex === -1 && this._xIsAutocompleteTop) {
                return;
              }
              this.style.setProperty('background', 'var(--x-ov-hover-bg)', 'important');
              this.style.setProperty('border', '1px solid transparent', 'important');
            }
          });
          
          suggestionItem.addEventListener('mouseleave', function() {
            this._xIsHovering = false;
            updateSelection();
          });
          
          // Add click handler to visit URL
          visitButton.addEventListener('click', function(e) {
            e.stopPropagation();
            if (suggestion.type === 'commandNewTab') {
              chrome.runtime.sendMessage({ action: 'openNewTab' });
              removeOverlay(overlay);
              document.removeEventListener('click', clickOutsideHandler);
              document.removeEventListener('keydown', keydownHandler);
              document.removeEventListener('keydown', captureTabHandler, true);
              return;
            }
            if (suggestion.type === 'commandSettings') {
              chrome.runtime.sendMessage({ action: 'openOptionsPage' });
              removeOverlay(overlay);
              document.removeEventListener('click', clickOutsideHandler);
              document.removeEventListener('keydown', keydownHandler);
              document.removeEventListener('keydown', captureTabHandler, true);
              return;
            }
            if (suggestion.type === 'siteSearchPrompt' && suggestion.provider) {
              activateSiteSearch(suggestion.provider);
              searchInput.focus();
              return;
            }
            if (shouldSwitchMatchedTabSuggestion(suggestion, index)) {
              chrome.runtime.sendMessage({
                action: 'switchToTab',
                tabId: suggestion._xMatchedTabId
              });
              removeOverlay(overlay);
              document.removeEventListener('click', clickOutsideHandler);
              document.removeEventListener('keydown', keydownHandler);
              document.removeEventListener('keydown', captureTabHandler, true);
              return;
            }
            if (suggestion.provider && suggestion.searchQuery) {
              if (openSiteSearchProviderQuery(suggestion.provider, suggestion.searchQuery)) {
                removeOverlay(overlay);
                document.removeEventListener('click', clickOutsideHandler);
                document.removeEventListener('keydown', keydownHandler);
                document.removeEventListener('keydown', captureTabHandler, true);
              }
              return;
            }
            if (suggestion.forceSearch && suggestion.searchQuery) {
              chrome.runtime.sendMessage({
                action: 'searchOrNavigate',
                query: suggestion.searchQuery,
                forceSearch: true
              });
            } else {
              console.log('Opening URL:', suggestion.url);
              chrome.runtime.sendMessage({
                action: 'createTab',
                url: suggestion.url
              });
            }
            removeOverlay(overlay);
            document.removeEventListener('click', clickOutsideHandler);
            document.removeEventListener('keydown', keydownHandler);
            document.removeEventListener('keydown', captureTabHandler, true);
          });
          
          // Add click handler to select item
          suggestionItem.addEventListener('click', function() {
            if (suggestion.type === 'commandNewTab') {
              chrome.runtime.sendMessage({ action: 'openNewTab' });
              removeOverlay(overlay);
              document.removeEventListener('click', clickOutsideHandler);
              document.removeEventListener('keydown', keydownHandler);
              document.removeEventListener('keydown', captureTabHandler, true);
              return;
            }
            if (suggestion.type === 'commandSettings') {
              chrome.runtime.sendMessage({ action: 'openOptionsPage' });
              removeOverlay(overlay);
              document.removeEventListener('click', clickOutsideHandler);
              document.removeEventListener('keydown', keydownHandler);
              document.removeEventListener('keydown', captureTabHandler, true);
              return;
            }
            if (suggestion.type === 'siteSearchPrompt' && suggestion.provider) {
              activateSiteSearch(suggestion.provider);
              searchInput.focus();
              return;
            }
            if (suggestion.type === 'modeSwitch') {
              applyThemeModeChange(suggestion.nextMode);
              searchInput.focus();
              return;
            }
            if (suggestion.provider && suggestion.searchQuery) {
              if (openSiteSearchProviderQuery(suggestion.provider, suggestion.searchQuery)) {
                removeOverlay(overlay);
                document.removeEventListener('click', clickOutsideHandler);
                document.removeEventListener('keydown', keydownHandler);
                document.removeEventListener('keydown', captureTabHandler, true);
              }
              return;
            }
            if (shouldSwitchMatchedTabSuggestion(suggestion, index)) {
              chrome.runtime.sendMessage({
                action: 'switchToTab',
                tabId: suggestion._xMatchedTabId
              });
              removeOverlay(overlay);
              document.removeEventListener('click', clickOutsideHandler);
              document.removeEventListener('keydown', keydownHandler);
              document.removeEventListener('keydown', captureTabHandler, true);
              return;
            }
            if (suggestion.forceSearch && suggestion.searchQuery) {
              chrome.runtime.sendMessage({
                action: 'searchOrNavigate',
                query: suggestion.searchQuery,
                forceSearch: true
              });
            } else {
              console.log('Opening URL:', suggestion.url);
              chrome.runtime.sendMessage({
                action: 'createTab',
                url: suggestion.url
              });
            }
            removeOverlay(overlay);
            document.removeEventListener('click', clickOutsideHandler);
            document.removeEventListener('keydown', keydownHandler);
            document.removeEventListener('keydown', captureTabHandler, true);
          });
          
          leftSide.appendChild(iconNode);
          leftSide.appendChild(textWrapper);
          suggestionItem.appendChild(leftSide);
          rightSide.appendChild(actionTags);
          rightSide.appendChild(visitButton);
          suggestionItem.appendChild(rightSide);
          suggestionItem._xVisitButton = visitButton;
          suggestionItem._xTagContainer = actionTags;
          suggestionItem._xHasActionTags = actionTags.childNodes.length > 0;
          suggestionItem._xHasSwitchAction = shouldSwitchMatchedTab;
          suggestionItem._xHistoryDeleteSlot = historyDeleteSlot;
          suggestionItem._xHistoryDeleteButton = historyDeleteButton;
          suggestionItem._xHasHistoryDeleteButton = Boolean(historyDeleteButton);
          if (iconWrapper) {
            suggestionItem._xDirectIconWrap = iconWrapper;
          }
          if (historyDeleteSlot) {
            rightSide.appendChild(historyDeleteSlot);
          }
          applyNoTranslateDeep(suggestionItem);
          suggestionsContainer.appendChild(suggestionItem);

          if (!shouldUseSearchEngineTheme &&
              !(onlyKeywordSuggestions && suggestion.type === 'newtab') &&
              suggestion.type !== 'directUrl' &&
              suggestion.type !== 'browserPage') {
            getThemeForSuggestion(suggestion).then((theme) => {
              if (!suggestionItem.isConnected) {
                return;
              }
              suggestionItem._xTheme = theme;
              applyThemeVariables(suggestionItem, theme);
              updateSelection();
            });
          }
        });
        updateSelection();
        if (shouldAnimateGrowth) {
          animateSuggestionsGrowth(suggestionsContainer, previousHeight);
        }
      
      // Update keyboard navigation
      if (!canAppend) {
        selectedIndex = -1;
      }
      });
    }
    
    function clearSearchSuggestions() {
      inlineSearchState = null;
      siteSearchTriggerState = null;
      lastSuggestionResponse = [];
      requestTabsAndRender();
    }
    
    // Focus the input when created
    setTimeout(() => searchInput.focus(), 100);
    

    
    // Create suggestions container
    const suggestionsContainer = document.createElement('div');
    applyNoTranslate(suggestionsContainer);
    suggestionsContainer.id = '_x_extension_suggestions_container_2024_unique_';
    suggestionsContainer.style.cssText = `
      all: unset !important;
      width: 100% !important;
      flex: 1 1 auto !important;
      min-height: 0 !important;
      max-height: 50vh !important;
      overflow-y: auto !important;
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
      background: transparent !important;
      border-radius: 0 0 28px 28px !important;
      padding: 12px !important;
      box-sizing: border-box !important;
      display: block !important;
      line-height: 1 !important;
      text-decoration: none !important;
      list-style: none !important;
      outline: none !important;
      color: inherit !important;
      font-size: 100% !important;
      font: inherit !important;
      vertical-align: baseline !important;
    `;
    suggestionsContainer.style.setProperty('position', 'relative', 'important');
    suggestionsContainer.style.setProperty('z-index', '2', 'important');

    overlay.appendChild(inputContainer);
    overlay.appendChild(suggestionsContainer);
    applyNoTranslateDeep(overlay);
    document.body.appendChild(overlay);
    startOverlayViewportSizeSync(overlay);
    startOverlayAntiTranslateObserver(overlay);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      overlay.style.setProperty('opacity', '1', 'important');
      overlay.style.setProperty('transform', 'translateX(-50%) translateY(0) scale(1)', 'important');
      overlay.style.setProperty('filter', 'blur(0)', 'important');
    } else {
      clearOverlayEnterAnimationFrames();
      // Flush initial style state before starting transition to avoid skipped enter animations.
      void overlay.offsetHeight;
      overlayEnterAnimationRafA = requestAnimationFrame(() => {
        overlayEnterAnimationRafA = null;
        overlayEnterAnimationRafB = requestAnimationFrame(() => {
          overlayEnterAnimationRafB = null;
          if (!overlay.isConnected) {
            return;
          }
          overlay.style.setProperty('opacity', '1', 'important');
          overlay.style.setProperty('transform', 'translateX(-50%) translateY(0) scale(1)', 'important');
          overlay.style.setProperty('filter', 'blur(0)', 'important');
        });
      });
    }
    // Let the container paint first so the enter transition is visible on busy pages.
    const queueInitialOverlayRender = () => {
      if (!overlay.isConnected) {
        return;
      }
      if (initialPrefillQuery) {
        searchInput.value = initialPrefillQuery;
        if (typeof searchInput.setSelectionRange === 'function') {
          searchInput.setSelectionRange(initialPrefillQuery.length, initialPrefillQuery.length);
        }
        latestRawInputValue = initialPrefillQuery;
        latestOverlayQuery = initialPrefillQuery.trim();
        updateModeBadge(initialPrefillQuery);
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
      requestTabsAndRender();
    };
    requestAnimationFrame(() => {
      requestAnimationFrame(queueInitialOverlayRender);
    });
    overlayScrollPauseHandler = () => {
      pauseOverlayAntiTranslateObserverForScroll();
    };
    window.addEventListener('scroll', overlayScrollPauseHandler, true);
    window.addEventListener('wheel', overlayScrollPauseHandler, { passive: true, capture: true });
    window.addEventListener('touchmove', overlayScrollPauseHandler, { passive: true, capture: true });
  }
}
