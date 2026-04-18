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

  function buildBlacklistProbeUrlFromTemplate(template, query) {
    const rawTemplate = String(template || '');
    if (!rawTemplate) {
      return '';
    }
    if (!rawTemplate.includes('{query}')) {
      return rawTemplate;
    }
    return rawTemplate.replace(/\{query\}/g, encodeURIComponent(String(query || '')));
  }

  function isSuggestionBlockedBySearchBlacklist(suggestion, items, queryForProvider, options) {
    if (!suggestion) {
      return false;
    }
    if (suggestion.type === 'newtab') {
      return false;
    }
    const settings = options && typeof options === 'object' ? options : {};
    const isBlockedUrl = typeof settings.isBlockedUrl === 'function'
      ? settings.isBlockedUrl
      : (() => false);
    if (suggestion.url && isBlockedUrl(suggestion.url, items)) {
      return true;
    }
    if (suggestion.type === 'siteSearchPrompt' && suggestion.provider) {
      const probeQuery = String(queryForProvider || '').trim() || 'test';
      const probeUrl = buildBlacklistProbeUrlFromTemplate(suggestion.provider.template, probeQuery);
      return Boolean(probeUrl) && isBlockedUrl(probeUrl, items);
    }
    return false;
  }

  function filterBlacklistedSuggestions(list, items, queryForProvider, options) {
    if (!Array.isArray(list) || list.length === 0) {
      return [];
    }
    return list.filter((suggestion) => (
      !isSuggestionBlockedBySearchBlacklist(suggestion, items, queryForProvider, options)
    ));
  }

  function getRecentPopularityBoost(suggestion, options) {
    if (!suggestion) {
      return 0;
    }
    const settings = options && typeof options === 'object' ? options : {};
    const now = Number.isFinite(Number(settings.now)) ? Number(settings.now) : Date.now();
    let boost = 0;
    const visitCount = Number(suggestion.visitCount) > 0 ? Number(suggestion.visitCount) : 0;
    const typedCount = Number(suggestion.typedCount) > 0 ? Number(suggestion.typedCount) : 0;
    if (visitCount > 0) {
      boost += Math.min(10, Math.log2(visitCount + 1) * 2.5);
    }
    if (typedCount > 0) {
      boost += Math.min(6, typedCount * 1.25);
    }
    const lastVisitTime = Number(suggestion.lastVisitTime) || 0;
    if (lastVisitTime > 0) {
      const hoursSinceVisit = (now - lastVisitTime) / (1000 * 60 * 60);
      if (hoursSinceVisit < 2) boost += 10;
      else if (hoursSinceVisit < 24) boost += 6;
      else if (hoursSinceVisit < 72) boost += 3;
    }
    return boost;
  }

  function getSearchSuggestionSourceRank(suggestion) {
    if (!suggestion) {
      return 0;
    }
    if (suggestion.type === 'bookmark') {
      return 3;
    }
    if (suggestion.type === 'history') {
      return 2;
    }
    if (suggestion.type === 'topSite' || suggestion.isTopSite) {
      return 1;
    }
    return 0;
  }

  function compareSearchSuggestions(a, b, options) {
    const settings = options && typeof options === 'object' ? options : {};
    const popularityOptions = {
      now: settings.now
    };
    const scoreDiff = (
      (Number(b && b.score) || 0) + getRecentPopularityBoost(b, popularityOptions)
    ) - (
      (Number(a && a.score) || 0) + getRecentPopularityBoost(a, popularityOptions)
    );
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    const sourceRankDiff = getSearchSuggestionSourceRank(b) - getSearchSuggestionSourceRank(a);
    if (sourceRankDiff !== 0) {
      return sourceRankDiff;
    }
    const visitDiff = (Number(b && b.visitCount) || 0) - (Number(a && a.visitCount) || 0);
    if (visitDiff !== 0) {
      return visitDiff;
    }
    const aVisit = Number(a && a.lastVisitTime) || 0;
    const bVisit = Number(b && b.lastVisitTime) || 0;
    return bVisit - aVisit;
  }

  function createSearchSuggestion(item, sourceType, score, extras) {
    const entry = item && typeof item === 'object' ? item : {};
    const extraValues = extras && typeof extras === 'object' ? extras : {};
    return {
      type: sourceType,
      title: entry.title || entry.url,
      url: entry.url,
      favicon: extraValues.favicon ? extraValues.favicon : '',
      score,
      lastVisitTime: Number(entry.lastVisitTime) || 0,
      visitCount: Number(entry.visitCount) || 0,
      typedCount: Number(entry.typedCount) || 0,
      reasons: Array.isArray(extraValues.reasons) ? extraValues.reasons : [],
      ...extraValues
    };
  }

  function buildSearchSuggestionReasons(item, sourceType, context, options) {
    const entry = item && typeof item === 'object' ? item : {};
    const queryContext = context && typeof context === 'object' ? context : {};
    const settings = options && typeof options === 'object' ? options : {};
    const now = Number.isFinite(Number(settings.now)) ? Number(settings.now) : Date.now();
    const getTitlePinyinMatchScore = typeof settings.getTitlePinyinMatchScore === 'function'
      ? settings.getTitlePinyinMatchScore
      : (() => ({ score: 0, reason: '' }));
    const reasons = [];
    if (sourceType === 'bookmark') {
      reasons.push('来源：书签');
    } else if (sourceType === 'topSite') {
      reasons.push('来源：常用站点');
    } else if (sourceType === 'history') {
      reasons.push('来源：浏览历史');
    }
    const pinyinMatch = getTitlePinyinMatchScore(entry.title, queryContext.normalizedPinyinQuery);
    if (pinyinMatch.reason === 'initials-exact' || pinyinMatch.reason === 'initials-prefix') {
      reasons.push('标题首字母匹配');
    } else if (pinyinMatch.score > 0) {
      reasons.push('标题拼音匹配');
    }
    if (entry.lastVisitTime) {
      const hoursSinceVisit = (now - entry.lastVisitTime) / (1000 * 60 * 60);
      if (hoursSinceVisit < 24) {
        reasons.push('最近 24 小时访问');
      } else if (hoursSinceVisit < 72) {
        reasons.push('最近 3 天访问');
      }
    }
    const visitCount = Number(entry.visitCount) || 0;
    if (visitCount > 1) {
      reasons.push(`访问 ${visitCount} 次`);
    }
    return reasons.slice(0, 3);
  }

  return {
    buildBlacklistProbeUrlFromTemplate,
    buildBookmarkSearchRequest,
    buildSearchSuggestionReasons,
    compareSearchSuggestions,
    createSearchSuggestion,
    filterBlacklistedSuggestions,
    getRecentPopularityBoost,
    getSearchSuggestionSourceRank,
    isSuggestionBlockedBySearchBlacklist,
    mergeSearchItems,
    normalizeSearchSuggestionsMode
  };
});
