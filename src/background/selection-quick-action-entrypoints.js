(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoSelectionQuickActionEntrypoints = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  const CONTEXT_MENU_ROOT_ID = 'lumno-selection-quick-actions';
  const CONTEXT_MENU_ITEM_PREFIX = `${CONTEXT_MENU_ROOT_ID}:`;
  const ACTIONS = Object.freeze([
    'ask',
    'translate',
    'explain',
    'summarize',
    'search',
    'calculate'
  ]);
  const ACTION_MESSAGES = Object.freeze({
    ask: ['selection_quick_action_ask', 'Ask AI'],
    translate: ['selection_quick_action_translate', 'Translate'],
    explain: ['selection_quick_action_explain', 'Explain'],
    summarize: ['selection_quick_action_summarize', 'Summarize'],
    search: ['selection_quick_action_search', 'Research'],
    calculate: ['selection_quick_action_calculate', 'Convert']
  });

  function getChromeApi(chromeApi) {
    return chromeApi || (typeof chrome !== 'undefined' ? chrome : null);
  }

  function getRuntimeError(api) {
    return api && api.runtime && api.runtime.lastError
      ? String(api.runtime.lastError.message || 'context-menu-error')
      : '';
  }

  function getMessage(api, key, fallback) {
    try {
      const value = api && api.i18n && typeof api.i18n.getMessage === 'function'
        ? api.i18n.getMessage(key)
        : '';
      return value || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function getMenuItemId(action) {
    return `${CONTEXT_MENU_ITEM_PREFIX}${action}`;
  }

  function getActionForMenuItem(menuItemId) {
    const id = String(menuItemId || '');
    if (!id.startsWith(CONTEXT_MENU_ITEM_PREFIX)) {
      return '';
    }
    const action = id.slice(CONTEXT_MENU_ITEM_PREFIX.length);
    return ACTIONS.includes(action) ? action : '';
  }

  function removeContextMenus(chromeApi, callback) {
    const api = getChromeApi(chromeApi);
    const done = typeof callback === 'function' ? callback : () => {};
    if (!api || !api.contextMenus || typeof api.contextMenus.remove !== 'function') {
      done({ ok: false, reason: 'context-menus-unavailable' });
      return;
    }
    try {
      api.contextMenus.remove(CONTEXT_MENU_ROOT_ID, () => {
        // A missing root is the expected first-run state. Reading lastError keeps
        // Chromium from reporting it as an unchecked extension error.
        getRuntimeError(api);
        done({ ok: true });
      });
    } catch (error) {
      done({
        ok: false,
        reason: error && error.message ? error.message : 'context-menu-remove-failed'
      });
    }
  }

  function createMenuItem(api, properties, callback) {
    const done = typeof callback === 'function' ? callback : () => {};
    try {
      api.contextMenus.create(properties, () => {
        const reason = getRuntimeError(api);
        done(!reason, reason);
      });
    } catch (error) {
      done(false, error && error.message ? error.message : 'context-menu-create-failed');
    }
  }

  function createContextMenus(chromeApi, callback) {
    const api = getChromeApi(chromeApi);
    const done = typeof callback === 'function' ? callback : () => {};
    if (!api || !api.contextMenus || typeof api.contextMenus.create !== 'function') {
      done({ ok: false, reason: 'context-menus-unavailable' });
      return;
    }
    const entries = [
      {
        id: CONTEXT_MENU_ROOT_ID,
        title: getMessage(
          api,
          'selection_quick_action_open_menu',
          'Use Lumno with selected text'
        ),
        contexts: ['selection']
      },
      ...ACTIONS.map((action) => {
        const copy = ACTION_MESSAGES[action] || ACTION_MESSAGES.ask;
        return {
          id: getMenuItemId(action),
          parentId: CONTEXT_MENU_ROOT_ID,
          title: getMessage(api, copy[0], copy[1]),
          contexts: ['selection']
        };
      })
    ];
    let index = 0;
    const createNext = () => {
      if (index >= entries.length) {
        done({ ok: true, count: entries.length });
        return;
      }
      const entry = entries[index++];
      createMenuItem(api, entry, (ok, reason) => {
        if (!ok) {
          done({ ok: false, reason: reason || 'context-menu-create-failed' });
          return;
        }
        createNext();
      });
    };
    createNext();
  }

  function syncContextMenus(chromeApi, enabled, callback) {
    const done = typeof callback === 'function' ? callback : () => {};
    removeContextMenus(chromeApi, (removeResult) => {
      if (!enabled) {
        done(removeResult && removeResult.ok === false
          ? removeResult
          : { ok: true, enabled: false, count: 0 });
        return;
      }
      createContextMenus(chromeApi, (createResult) => {
        done({ ...createResult, enabled: createResult && createResult.ok === true });
      });
    });
  }

  return Object.freeze({
    ACTIONS,
    CONTEXT_MENU_ITEM_PREFIX,
    CONTEXT_MENU_ROOT_ID,
    createContextMenus,
    getActionForMenuItem,
    getMenuItemId,
    removeContextMenus,
    syncContextMenus
  });
});
