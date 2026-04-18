(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoSearchQueryContext = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  function toTermSet(items) {
    if (items instanceof Set) {
      return items;
    }
    return new Set(Array.isArray(items) ? items : []);
  }

  function splitSearchTerms(value) {
    return Array.from(new Set(
      String(value || '')
        .toLowerCase()
        .split(/[^a-z0-9\u4e00-\u9fff]+/i)
        .map((item) => item.trim())
        .filter(Boolean)
    ));
  }

  function looksLikeNavigationQuery(query) {
    const value = String(query || '').trim().toLowerCase();
    if (!value) {
      return false;
    }
    if (value.includes('://')) {
      return true;
    }
    if (/^[a-z0-9-]+(\.[a-z0-9-]+)+([/#?].*)?$/i.test(value)) {
      return true;
    }
    return false;
  }

  function looksLikeVersionSegment(segment) {
    const value = String(segment || '').trim().toLowerCase();
    if (!value) {
      return false;
    }
    return /^v?\d+(\.\d+){1,3}([.-][a-z0-9]+)?$/i.test(value);
  }

  function classifySearchIntent(query, queryTerms, options) {
    const settings = options && typeof options === 'object' ? options : {};
    const pathIntentTerms = toTermSet(settings.pathIntentTerms);
    const raw = String(query || '').trim().toLowerCase();
    const terms = Array.isArray(queryTerms) ? queryTerms.filter(Boolean) : [];
    if (looksLikeNavigationQuery(raw)) {
      return 'navigation';
    }

    if (terms.some((term) => pathIntentTerms.has(term))) {
      return 'path';
    }

    if (terms.some((term) => looksLikeVersionSegment(term)) || /v?\d+(\.\d+){1,3}/i.test(raw)) {
      return 'revisit';
    }

    if (terms.length >= 2) {
      if (terms.some((term) => /\d/.test(term))) {
        return 'revisit';
      }
      return 'object';
    }

    if (terms.length === 1) {
      return 'brand';
    }

    return 'object';
  }

  function buildSearchQueryContext(query, options) {
    const settings = options && typeof options === 'object' ? options : {};
    const lookupQuery = String(query || '');
    const queryLower = lookupQuery.trim().toLowerCase();
    const normalizePinyinQuery = typeof settings.normalizePinyinQuery === 'function'
      ? settings.normalizePinyinQuery
      : (() => '');
    const normalizedPinyinQuery = String(normalizePinyinQuery(lookupQuery) || '');
    const queryTerms = splitSearchTerms(queryLower);
    if (queryLower && !queryTerms.includes(queryLower)) {
      queryTerms.unshift(queryLower);
    }
    const settingsIntentTerms = toTermSet(settings.settingsIntentTerms);
    const informationalTerms = toTermSet(settings.informationalTerms);
    return {
      lookupQuery,
      queryLower,
      normalizedPinyinQuery,
      useTitlePinyinMatch: Boolean(normalizedPinyinQuery),
      queryTerms,
      intentType: classifySearchIntent(lookupQuery, queryTerms, {
        pathIntentTerms: settings.pathIntentTerms
      }),
      hasSettingsIntent: queryTerms.some((term) => settingsIntentTerms.has(term)),
      hasInformationalIntent: queryTerms.some((term) => informationalTerms.has(term))
    };
  }

  function matchesSearchQueryText(item, context) {
    if (!item || !item.url || !context) {
      return false;
    }
    const titleLower = item.title ? item.title.toLowerCase() : '';
    const urlLower = String(item.url || '').toLowerCase();
    if (titleLower.includes(context.queryLower) || urlLower.includes(context.queryLower)) {
      return true;
    }
    return (Array.isArray(context.queryTerms) ? context.queryTerms : []).some((term) => (
      term &&
      (titleLower.includes(term) || urlLower.includes(term))
    ));
  }

  function collectSearchMatches(items, context, options) {
    const settings = options && typeof options === 'object' ? options : {};
    const matchesTitlePinyin = typeof settings.matchesTitlePinyin === 'function'
      ? settings.matchesTitlePinyin
      : (() => false);
    const isBlocked = typeof settings.isBlocked === 'function'
      ? settings.isBlocked
      : (() => false);
    return (Array.isArray(items) ? items : []).filter((item) => (
      (matchesSearchQueryText(item, context) || matchesTitlePinyin(item, context)) &&
      !isBlocked(item)
    ));
  }

  return Object.freeze({
    buildSearchQueryContext,
    classifySearchIntent,
    collectSearchMatches,
    looksLikeNavigationQuery,
    looksLikeVersionSegment,
    matchesSearchQueryText,
    splitSearchTerms
  });
});
