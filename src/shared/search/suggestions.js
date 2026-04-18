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

  function getSearchSourceAdjustment(sourceType, intentType) {
    const source = String(sourceType || '');
    const intent = String(intentType || 'object');

    if (intent === 'navigation' || intent === 'brand') {
      if (source === 'bookmark') {
        return 24;
      }
      if (source === 'topSite') {
        return 20;
      }
      if (source === 'history') {
        return 4;
      }
    }

    if (intent === 'path' || intent === 'revisit') {
      if (source === 'history') {
        return 18;
      }
      if (source === 'bookmark') {
        return 10;
      }
      if (source === 'topSite') {
        return 8;
      }
    }

    if (intent === 'object') {
      if (source === 'bookmark') {
        return 18;
      }
      if (source === 'history') {
        return 12;
      }
      if (source === 'topSite') {
        return 10;
      }
    }

    return 0;
  }

  function calculateSearchRelevanceScore(item, sourceType, context, options) {
    const entry = item && typeof item === 'object' ? item : {};
    const queryContext = context && typeof context === 'object' ? context : {};
    const settings = options && typeof options === 'object' ? options : {};
    const normalizeHost = typeof settings.normalizeHost === 'function'
      ? settings.normalizeHost
      : ((value) => String(value || '').trim().toLowerCase());
    const splitSearchTerms = typeof settings.splitSearchTerms === 'function'
      ? settings.splitSearchTerms
      : ((value) => String(value || '').toLowerCase().split(/[^a-z0-9\u4e00-\u9fff]+/i).filter(Boolean));
    const getTitlePinyinMatchScore = typeof settings.getTitlePinyinMatchScore === 'function'
      ? settings.getTitlePinyinMatchScore
      : (() => ({ score: 0 }));
    const shouldBlockFaviconForHost = typeof settings.shouldBlockFaviconForHost === 'function'
      ? settings.shouldBlockFaviconForHost
      : (() => false);
    const getSuggestionCategoryAdjustment = typeof settings.getSuggestionCategoryAdjustment === 'function'
      ? settings.getSuggestionCategoryAdjustment
      : (() => 0);
    const getDirectNavigationAdjustment = typeof settings.getDirectNavigationAdjustment === 'function'
      ? settings.getDirectNavigationAdjustment
      : (() => 0);
    const getOwnExtensionUtilityPenalty = typeof settings.getOwnExtensionUtilityPenalty === 'function'
      ? settings.getOwnExtensionUtilityPenalty
      : (() => 0);
    const now = Number.isFinite(Number(settings.now)) ? Number(settings.now) : Date.now();

    const titleLower = entry.title ? String(entry.title).toLowerCase() : '';
    const urlLower = String(entry.url || '').toLowerCase();
    let hostname = '';
    let hostLabels = [];
    let titleTokens = [];
    let pathTokens = [];
    let textScore = 0;
    let behaviorScore = 0;
    let sourceScore = 0;

    if (titleLower === queryContext.queryLower) textScore += 140;
    if (titleLower.startsWith(queryContext.queryLower)) textScore += 70;

    titleTokens = splitSearchTerms(titleLower);
    if (titleTokens.includes(queryContext.queryLower)) {
      textScore += 45;
    }

    (Array.isArray(queryContext.queryTerms) ? queryContext.queryTerms : []).forEach((word) => {
      if (!word) {
        return;
      }
      if (titleTokens.includes(word)) {
        textScore += 24;
        return;
      }
      if (titleTokens.some((token) => token.startsWith(word))) {
        textScore += 14;
        return;
      }
      if (titleLower.includes(word)) textScore += 8;
    });

    if (titleLower.includes(queryContext.queryLower)) textScore += 24;

    try {
      hostname = normalizeHost(new URL(entry.url).hostname);
      hostLabels = hostname.split('.').filter(Boolean);
      if (hostname.includes(queryContext.queryLower)) textScore += 14;
      if (hostname.startsWith(queryContext.queryLower)) textScore += 20;
      if (hostLabels.includes(queryContext.queryLower)) {
        textScore += 42;
      }
      (Array.isArray(queryContext.queryTerms) ? queryContext.queryTerms : []).forEach((word) => {
        if (!word) {
          return;
        }
        if (hostLabels.includes(word)) {
          textScore += 28;
          return;
        }
        if (hostLabels.some((label) => label.startsWith(word))) {
          textScore += 16;
          return;
        }
        if (hostname.includes(word)) {
          textScore += 8;
        }
      });
    } catch (error) {
      hostname = '';
    }

    if (urlLower.includes(queryContext.queryLower)) textScore += 10;
    try {
      const parsedUrl = new URL(entry.url);
      const pathnameLower = String(parsedUrl.pathname || '').toLowerCase();
      const decodedPathnameLower = decodeURIComponent(pathnameLower);
      const pathSegments = decodedPathnameLower.split('/').filter(Boolean);
      pathSegments.forEach((segment) => {
        const segmentTokens = segment.split(/[^a-z0-9\u4e00-\u9fff]+/i).filter(Boolean);
        if (segmentTokens.length > 0) {
          pathTokens.push(...segmentTokens);
        }
      });
      if (decodedPathnameLower) {
        (Array.isArray(queryContext.queryTerms) ? queryContext.queryTerms : []).forEach((word) => {
          if (!word) {
            return;
          }
          if (pathTokens.includes(word)) {
            textScore += 32;
            return;
          }
          if (pathTokens.some((token) => token.startsWith(word))) {
            textScore += 18;
            return;
          }
          if (pathTokens.some((token) => token.includes(word))) {
            textScore += 10;
            return;
          }
          if (decodedPathnameLower.includes(word)) {
            textScore += 8;
          }
        });
      }
    } catch (error) {
      // Ignore invalid URL parsing/decoding errors.
    }

    textScore += Number(getTitlePinyinMatchScore(entry.title, queryContext.normalizedPinyinQuery).score) || 0;

    if (hostname && shouldBlockFaviconForHost(hostname)) {
      if (titleLower === queryContext.queryLower) textScore += 60;
      else if (titleLower.startsWith(queryContext.queryLower)) textScore += 42;
      else if (titleLower.includes(queryContext.queryLower)) textScore += 24;
      else if (urlLower.includes(queryContext.queryLower)) textScore += 20;
    }

    if (textScore <= 0) {
      return 0;
    }

    if (entry.lastVisitTime) {
      const daysSinceVisit = (now - entry.lastVisitTime) / (1000 * 60 * 60 * 24);
      if (daysSinceVisit < 1) behaviorScore += 10;
      else if (daysSinceVisit < 7) behaviorScore += 5;
      else if (daysSinceVisit < 30) behaviorScore += 2;
    }

    const visitCount = Number(entry.visitCount) > 0 ? Number(entry.visitCount) : 0;
    const typedCount = Number(entry.typedCount) > 0 ? Number(entry.typedCount) : 0;
    if (visitCount > 0) {
      behaviorScore += Math.min(18, Math.log2(visitCount + 1) * 4);
    }
    if (typedCount > 0) {
      behaviorScore += Math.min(12, typedCount * 2);
    }
    if (entry.lastVisitTime) {
      const hoursSinceVisit = (now - entry.lastVisitTime) / (1000 * 60 * 60);
      if (hoursSinceVisit < 2) behaviorScore += 20;
      else if (hoursSinceVisit < 24) behaviorScore += 14;
      else if (hoursSinceVisit < 72) behaviorScore += 8;
    }

    if (sourceType === 'bookmark') {
      sourceScore += 12;
    } else if (sourceType === 'history') {
      sourceScore += 4;
    } else if (sourceType === 'topSite') {
      sourceScore += 6;
    }
    sourceScore += getSearchSourceAdjustment(sourceType, queryContext.intentType);

    return textScore +
      behaviorScore +
      sourceScore +
      getSuggestionCategoryAdjustment(entry, queryContext.queryTerms, queryContext.hasSettingsIntent) +
      getDirectNavigationAdjustment(entry, sourceType, queryContext) -
      getOwnExtensionUtilityPenalty(entry, queryContext.hasSettingsIntent);
  }

  return {
    buildBlacklistProbeUrlFromTemplate,
    buildBookmarkSearchRequest,
    buildSearchSuggestionReasons,
    calculateSearchRelevanceScore,
    compareSearchSuggestions,
    createSearchSuggestion,
    filterBlacklistedSuggestions,
    getRecentPopularityBoost,
    getSearchSourceAdjustment,
    getSearchSuggestionSourceRank,
    isSuggestionBlockedBySearchBlacklist,
    mergeSearchItems,
    normalizeSearchSuggestionsMode
  };
});
