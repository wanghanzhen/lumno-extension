(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoSearchSuggestions = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  function normalizeSearchSuggestionsMode(mode) {
    return mode === 'classic' ? 'classic' : 'classic';
  }

  function buildBookmarkSearchRequest(context) {
    const requestContext = context && typeof context === 'object' ? context : {};
    return {
      query: typeof requestContext.lookupQuery === 'string' ? requestContext.lookupQuery : ''
    };
  }

  function mergeSearchItems(itemGroups, options) {
    const merged = [];
    const mergedIndexByKey = new Map();
    const settings = options && typeof options === 'object' ? options : {};
    const buildKey = typeof settings.buildKey === 'function'
      ? settings.buildKey
      : ((item) => String(item && item.url ? item.url : '').trim().toLowerCase());
    const shouldReplace = typeof settings.shouldReplace === 'function'
      ? settings.shouldReplace
      : (() => false);
    const isBlocked = typeof settings.isBlocked === 'function'
      ? settings.isBlocked
      : (() => false);

    (Array.isArray(itemGroups) ? itemGroups : []).forEach((items) => {
      (Array.isArray(items) ? items : []).forEach((item) => {
        if (!item || isBlocked(item)) {
          return;
        }
        const key = buildKey(item);
        if (!key) {
          return;
        }
        const existingIndex = mergedIndexByKey.get(key);
        if (typeof existingIndex === 'number') {
          if (shouldReplace(item, merged[existingIndex])) {
            merged[existingIndex] = item;
          }
          return;
        }
        mergedIndexByKey.set(key, merged.length);
        merged.push(item);
      });
    });

    return merged;
  }

  return {
    buildBookmarkSearchRequest,
    mergeSearchItems,
    normalizeSearchSuggestionsMode
  };
});
