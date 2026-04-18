(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoStorageKeys = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const STORAGE_KEYS = Object.freeze({
    GLOBAL_PIP_OWNER: '_x_lumno_global_pip_owner_2026_',
    THEME: '_x_extension_theme_mode_2024_unique_',
    LANGUAGE: '_x_extension_language_2024_unique_',
    LANGUAGE_MESSAGES: '_x_extension_language_messages_2024_unique_',
    RECENT_MODE: '_x_extension_recent_mode_2024_unique_',
    RECENT_COUNT: '_x_extension_recent_count_2024_unique_',
    NEWTAB_WIDTH_MODE: '_x_extension_newtab_width_mode_2026_unique_',
    OVERLAY_SIZE_MODE: '_x_extension_overlay_size_mode_2026_unique_',
    BOOKMARK_COUNT: '_x_extension_bookmark_count_2024_unique_',
    BOOKMARK_COLUMNS: '_x_extension_bookmark_columns_2024_unique_',
    AUTO_PIP_ENABLED: '_x_extension_auto_pip_enabled_2026_unique_',
    DOCUMENT_PIP_ENABLED: '_x_extension_document_pip_enabled_2026_unique_',
    PINNED_TAB_RECOVERY_ENABLED: '_x_extension_pinned_tab_recovery_enabled_2026_unique_',
    OVERLAY_TAB_PRIORITY: '_x_extension_overlay_tab_priority_2024_unique_',
    NEWTAB_WORDMARK_VISIBLE: '_x_extension_newtab_wordmark_visible_2026_unique_',
    RESTRICTED_ACTION: '_x_extension_restricted_action_2024_unique_',
    SEARCH_RESULT_PRIORITY: '_x_extension_search_result_priority_2026_unique_',
    SITE_SEARCH_ICON_CACHE: '_x_extension_site_search_icon_cache_2026_unique_',
    FALLBACK_SHORTCUT: '_x_extension_fallback_hotkey_2024_unique_',
    SITE_SEARCH: '_x_extension_site_search_custom_2024_unique_',
    SITE_SEARCH_DISABLED: '_x_extension_site_search_disabled_2024_unique_',
    SEARCH_BLACKLIST: '_x_extension_search_blacklist_2026_unique_',
    DEFAULT_SEARCH_ENGINE: '_x_extension_default_search_engine_2024_unique_',
    TAB_RANK_SCORE_DEBUG: '_x_extension_tab_rank_score_debug_2026_unique_',
    FAVICON_PERSIST: '_x_extension_favicon_url_cache_2024_unique_',
    FAVICON_DATA_PERSIST: '_x_extension_favicon_data_cache_2024_unique_',
    FAVICON_VISIT_DIRTY: '_x_extension_favicon_visit_dirty_2026_unique_',
    NEWTAB_RECENT_CACHE: '_x_extension_newtab_recent_cache_2024_unique_',
    NEWTAB_BOOKMARK_CACHE: '_x_extension_newtab_bookmark_cache_2024_unique_',
    PINNED_RECENT_SITES: '_x_extension_newtab_pinned_recent_sites_2026_unique_',
    HIDDEN_RECENT_SITES: '_x_extension_newtab_hidden_recent_sites_2026_unique_',
    PINNED_TAB_SNAPSHOT: '_x_extension_pinned_tab_snapshot_2026_unique_',
    TAB_SWITCH_STATS: '_x_extension_tab_switch_stats_2026_unique_',
    AI_PROVIDER: '_x_extension_ai_provider_2026_unique_',
    AI_DISABLED: '_x_extension_ai_disabled_2026_unique_',
    AI_MODEL: '_x_extension_ai_model_2026_unique_',
    AI_API_KEY: '_x_extension_ai_api_key_2026_unique_',
    AI_SEARCH_MODE: '_x_extension_ai_search_mode_2026_unique_',
    AI_HISTORY_ENABLED: '_x_extension_ai_history_enabled_2026_unique_'
  });

  const REMOVED_AI_SYNC_STORAGE_KEYS = Object.freeze([
    STORAGE_KEYS.AI_PROVIDER,
    STORAGE_KEYS.AI_DISABLED
  ]);

  const REMOVED_AI_LOCAL_STORAGE_KEYS = Object.freeze([
    STORAGE_KEYS.AI_MODEL,
    STORAGE_KEYS.AI_API_KEY,
    STORAGE_KEYS.AI_SEARCH_MODE,
    STORAGE_KEYS.AI_HISTORY_ENABLED
  ]);

  return Object.freeze({
    STORAGE_KEYS,
    REMOVED_AI_LOCAL_STORAGE_KEYS,
    REMOVED_AI_SYNC_STORAGE_KEYS,
    GLOBAL_PIP_OWNER_STORAGE_KEY: STORAGE_KEYS.GLOBAL_PIP_OWNER,
    THEME_STORAGE_KEY: STORAGE_KEYS.THEME,
    LANGUAGE_STORAGE_KEY: STORAGE_KEYS.LANGUAGE,
    LANGUAGE_MESSAGES_STORAGE_KEY: STORAGE_KEYS.LANGUAGE_MESSAGES,
    RECENT_MODE_STORAGE_KEY: STORAGE_KEYS.RECENT_MODE,
    RECENT_COUNT_STORAGE_KEY: STORAGE_KEYS.RECENT_COUNT,
    NEWTAB_WIDTH_MODE_STORAGE_KEY: STORAGE_KEYS.NEWTAB_WIDTH_MODE,
    OVERLAY_SIZE_MODE_STORAGE_KEY: STORAGE_KEYS.OVERLAY_SIZE_MODE,
    BOOKMARK_COUNT_STORAGE_KEY: STORAGE_KEYS.BOOKMARK_COUNT,
    BOOKMARK_COLUMNS_STORAGE_KEY: STORAGE_KEYS.BOOKMARK_COLUMNS,
    AUTO_PIP_ENABLED_STORAGE_KEY: STORAGE_KEYS.AUTO_PIP_ENABLED,
    DOCUMENT_PIP_ENABLED_STORAGE_KEY: STORAGE_KEYS.DOCUMENT_PIP_ENABLED,
    PINNED_TAB_RECOVERY_ENABLED_STORAGE_KEY: STORAGE_KEYS.PINNED_TAB_RECOVERY_ENABLED,
    OVERLAY_TAB_PRIORITY_STORAGE_KEY: STORAGE_KEYS.OVERLAY_TAB_PRIORITY,
    NEWTAB_WORDMARK_VISIBLE_STORAGE_KEY: STORAGE_KEYS.NEWTAB_WORDMARK_VISIBLE,
    RESTRICTED_ACTION_STORAGE_KEY: STORAGE_KEYS.RESTRICTED_ACTION,
    SEARCH_RESULT_PRIORITY_STORAGE_KEY: STORAGE_KEYS.SEARCH_RESULT_PRIORITY,
    SITE_SEARCH_ICON_CACHE_STORAGE_KEY: STORAGE_KEYS.SITE_SEARCH_ICON_CACHE,
    FALLBACK_SHORTCUT_STORAGE_KEY: STORAGE_KEYS.FALLBACK_SHORTCUT,
    SITE_SEARCH_STORAGE_KEY: STORAGE_KEYS.SITE_SEARCH,
    SITE_SEARCH_DISABLED_STORAGE_KEY: STORAGE_KEYS.SITE_SEARCH_DISABLED,
    SEARCH_BLACKLIST_STORAGE_KEY: STORAGE_KEYS.SEARCH_BLACKLIST,
    DEFAULT_SEARCH_ENGINE_STORAGE_KEY: STORAGE_KEYS.DEFAULT_SEARCH_ENGINE,
    TAB_RANK_SCORE_DEBUG_STORAGE_KEY: STORAGE_KEYS.TAB_RANK_SCORE_DEBUG,
    FAVICON_PERSIST_STORAGE_KEY: STORAGE_KEYS.FAVICON_PERSIST,
    FAVICON_DATA_PERSIST_STORAGE_KEY: STORAGE_KEYS.FAVICON_DATA_PERSIST,
    FAVICON_VISIT_DIRTY_STORAGE_KEY: STORAGE_KEYS.FAVICON_VISIT_DIRTY,
    NEWTAB_RECENT_CACHE_STORAGE_KEY: STORAGE_KEYS.NEWTAB_RECENT_CACHE,
    NEWTAB_BOOKMARK_CACHE_STORAGE_KEY: STORAGE_KEYS.NEWTAB_BOOKMARK_CACHE,
    PINNED_RECENT_SITES_STORAGE_KEY: STORAGE_KEYS.PINNED_RECENT_SITES,
    HIDDEN_RECENT_SITES_STORAGE_KEY: STORAGE_KEYS.HIDDEN_RECENT_SITES,
    PINNED_TAB_SNAPSHOT_STORAGE_KEY: STORAGE_KEYS.PINNED_TAB_SNAPSHOT,
    TAB_SWITCH_STATS_STORAGE_KEY: STORAGE_KEYS.TAB_SWITCH_STATS
  });
});
