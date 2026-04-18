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

  function hasSearchHomeTitle(title, options) {
    const settings = options && typeof options === 'object' ? options : {};
    const splitSearchTerms = typeof settings.splitSearchTerms === 'function'
      ? settings.splitSearchTerms
      : ((value) => String(value || '').toLowerCase().split(/[^a-z0-9\u4e00-\u9fff]+/i).filter(Boolean));
    const homeTitleTerms = settings.homeTitleTerms instanceof Set
      ? settings.homeTitleTerms
      : new Set(Array.isArray(settings.homeTitleTerms) ? settings.homeTitleTerms : []);
    const titleTerms = splitSearchTerms(String(title || '').toLowerCase());
    return titleTerms.some((term) => homeTitleTerms.has(term));
  }

  function isSearchLikelyBrandProductQuery(context) {
    const queryContext = context && typeof context === 'object' ? context : null;
    if (!queryContext || queryContext.intentType !== 'object') {
      return false;
    }
    if (queryContext.hasInformationalIntent || queryContext.hasSettingsIntent) {
      return false;
    }
    if (!Array.isArray(queryContext.queryTerms) || queryContext.queryTerms.length !== 2) {
      return false;
    }
    return String(queryContext.queryLower || '').length <= 28;
  }

  function isSearchLikelyDirectNavigationQuery(context) {
    const queryContext = context && typeof context === 'object' ? context : null;
    if (!queryContext || queryContext.hasInformationalIntent) {
      return false;
    }
    return queryContext.intentType === 'brand' || isSearchLikelyBrandProductQuery(queryContext);
  }

  function getSearchBrandHostMatchScore(host, context, options) {
    const queryContext = context && typeof context === 'object' ? context : null;
    if (!host || !queryContext || queryContext.intentType !== 'brand') {
      return 0;
    }
    const query = String(queryContext.queryLower || '').trim();
    if (!query) {
      return 0;
    }
    const settings = options && typeof options === 'object' ? options : {};
    const normalizeHost = typeof settings.normalizeHost === 'function'
      ? settings.normalizeHost
      : ((value) => String(value || '').trim().toLowerCase());
    const hostLabels = normalizeHost(host).split('.').filter(Boolean);
    let score = 0;
    hostLabels.forEach((label) => {
      if (label === query) {
        score = Math.max(score, 100);
        return;
      }
      if (query.length >= 2 && label.startsWith(query)) {
        score = Math.max(score, 60);
      }
    });
    return score;
  }

  function looksLikeOpaqueIdSegment(segment) {
    const value = String(segment || '').trim().toLowerCase();
    if (!value) {
      return false;
    }
    if (/^\d+$/.test(value)) {
      return true;
    }
    if (/^[0-9a-f]{8,}$/i.test(value)) {
      return true;
    }
    if (/^[0-9a-f]{8}-[0-9a-f-]{8,}$/i.test(value)) {
      return true;
    }
    return false;
  }

  function normalizeClusterSegment(segment, options) {
    const settings = options && typeof options === 'object' ? options : {};
    const looksLikeVersionSegment = typeof settings.looksLikeVersionSegment === 'function'
      ? settings.looksLikeVersionSegment
      : (() => false);
    const value = String(segment || '').trim().toLowerCase();
    if (!value) {
      return '';
    }
    if (looksLikeVersionSegment(value)) {
      return ':version';
    }
    if (looksLikeOpaqueIdSegment(value)) {
      return ':id';
    }
    return value;
  }

  function getSearchSuggestionClusterInfo(url, options) {
    const settings = options && typeof options === 'object' ? options : {};
    const normalizeHost = typeof settings.normalizeHost === 'function'
      ? settings.normalizeHost
      : ((value) => String(value || '').trim().toLowerCase());
    const looksLikeVersionSegment = typeof settings.looksLikeVersionSegment === 'function'
      ? settings.looksLikeVersionSegment
      : (() => false);
    const utilitySegments = settings.utilitySegments instanceof Set
      ? settings.utilitySegments
      : new Set(Array.isArray(settings.utilitySegments) ? settings.utilitySegments : []);
    const actionSegments = settings.actionSegments instanceof Set
      ? settings.actionSegments
      : new Set(Array.isArray(settings.actionSegments) ? settings.actionSegments : []);
    const siteConfig = settings.siteConfig && typeof settings.siteConfig === 'object'
      ? settings.siteConfig
      : {};

    if (!url) {
      return {
        host: '',
        category: 'unknown',
        clusterKey: '',
        depth: 0,
        path: '/'
      };
    }
    try {
      const parsed = new URL(url);
      const host = normalizeHost(parsed.hostname);
      const path = parsed.pathname !== '/' ? (parsed.pathname.replace(/\/+$/, '') || '/') : '/';
      const rawSegments = path.split('/').filter(Boolean).map((item) => decodeURIComponent(item).toLowerCase());
      const segments = rawSegments.map((item) => normalizeClusterSegment(item, { looksLikeVersionSegment }));
      const first = segments[0] || '';
      const second = segments[1] || '';
      const third = segments[2] || '';

      const hostConfig = siteConfig[host] || null;
      if (host === 'github.com' && segments.length >= 2) {
        const repoBase = `${host}/${segments[0]}/${segments[1]}`;
        if (segments.length === 2) {
          return { host, category: 'repo-root', clusterKey: repoBase, depth: segments.length, path };
        }
        const repoAreaCategories = hostConfig && hostConfig.repoAreaCategories
          ? hostConfig.repoAreaCategories
          : null;
        if (repoAreaCategories && repoAreaCategories.has(third)) {
          return { host, category: repoAreaCategories.get(third), clusterKey: `${repoBase}/${third}`, depth: segments.length, path };
        }
        if (third === 'tree' || third === 'blob') {
          const area = segments[4] || segments[3] || 'root';
          return { host, category: 'repo-code', clusterKey: `${repoBase}/code/${area}`, depth: segments.length, path };
        }
        return { host, category: 'repo-child', clusterKey: `${repoBase}/${third || 'root'}`, depth: segments.length, path };
      }

      if (segments.length === 0) {
        return { host, category: 'site-root', clusterKey: `${host}/`, depth: 0, path };
      }

      if (utilitySegments.has(first)) {
        return { host, category: 'utility', clusterKey: `${host}/utility/${first}`, depth: segments.length, path };
      }

      if (actionSegments.has(first)) {
        return { host, category: 'action', clusterKey: `${host}/action/${first}`, depth: segments.length, path };
      }

      if ((first === 'u' || first === 'user' || first === 'users' || first === 'profile' || first === 'profiles') && second) {
        return { host, category: 'user', clusterKey: `${host}/user/${second}`, depth: segments.length, path };
      }

      if (first === 'release' || first === 'releases' || first === 'onboarding' || first === 'changelog') {
        return { host, category: 'landing', clusterKey: `${host}/${first}`, depth: segments.length, path };
      }

      if (first === 'docs' || first === 'doc' || first === 'wiki' || first === 'help' || first === 'guide' || first === 'guides') {
        const docKey = second || 'root';
        return { host, category: 'docs', clusterKey: `${host}/${first}/${docKey}`, depth: segments.length, path };
      }

      if (segments.length === 1) {
        return { host, category: 'section', clusterKey: `${host}/${first}`, depth: segments.length, path };
      }

      return { host, category: 'content', clusterKey: `${host}/${first}/${second}`, depth: segments.length, path };
    } catch (error) {
      return {
        host: '',
        category: 'unknown',
        clusterKey: String(url).trim().toLowerCase(),
        depth: 0,
        path: '/'
      };
    }
  }

  function getSearchSuggestionCategoryAdjustment(item, queryTerms, hasSettingsIntent, options) {
    const entry = item && typeof item === 'object' ? item : null;
    if (!entry || !entry.url) {
      return 0;
    }
    const settings = options && typeof options === 'object' ? options : {};
    const getClusterInfo = typeof settings.getClusterInfo === 'function'
      ? settings.getClusterInfo
      : ((url) => getSearchSuggestionClusterInfo(url, settings));
    const info = getClusterInfo(entry.url);
    const querySet = new Set(Array.isArray(queryTerms) ? queryTerms : []);
    const hasActionIntent = querySet.has('new') || querySet.has('edit') || querySet.has('create') || querySet.has('settings') || querySet.has('设置');
    let adjustment = 0;

    if (info.category === 'site-root' || info.category === 'repo-root') {
      adjustment += 18;
    } else if (info.category === 'section') {
      adjustment += 8;
    } else if (info.category === 'landing' || info.category === 'docs') {
      adjustment += 10;
    }

    if (entry.type === 'topSite' || entry.isTopSite) {
      if (info.category === 'site-root' || info.category === 'repo-root') {
        adjustment += 20;
      } else if (info.category === 'section' || info.category === 'landing') {
        adjustment += 10;
      } else {
        adjustment += 4;
      }
    }

    if (info.depth >= 3 && info.category !== 'docs' && info.category !== 'repo-code') {
      adjustment -= Math.min(16, (info.depth - 2) * 4);
    }

    if (info.category === 'utility') {
      adjustment -= hasSettingsIntent ? 10 : 95;
    }

    if (info.category === 'action') {
      adjustment -= hasActionIntent ? 8 : 80;
    }

    if (info.category === 'repo-code') {
      adjustment -= 18;
    }

    if (info.category === 'repo-child' && info.depth >= 4) {
      adjustment -= 14;
    }

    return adjustment;
  }

  function getSearchNavigationRepresentativeSignal(item, context, options) {
    const entry = item && typeof item === 'object' ? item : null;
    const queryContext = context && typeof context === 'object' ? context : {};
    if (!entry || !entry.url) {
      return 0;
    }
    const settings = options && typeof options === 'object' ? options : {};
    const getClusterInfo = typeof settings.getClusterInfo === 'function'
      ? settings.getClusterInfo
      : ((url) => getSearchSuggestionClusterInfo(url, settings));
    const normalizeHost = typeof settings.normalizeHost === 'function'
      ? settings.normalizeHost
      : ((value) => String(value || '').trim().toLowerCase());
    const hasHomeTitle = typeof settings.hasHomeTitle === 'function'
      ? settings.hasHomeTitle
      : ((title) => hasSearchHomeTitle(title, settings));

    const info = getClusterInfo(entry.url);
    const titleLower = String(entry.title || '').toLowerCase();
    const titleHasHome = hasHomeTitle(titleLower);
    let signal = 0;

    if (info.category === 'site-root' || info.category === 'repo-root') {
      signal += 4;
    } else if (info.category === 'section' || info.category === 'landing') {
      signal += 3;
    } else if (titleHasHome && info.category !== 'utility' && info.category !== 'action') {
      signal += 3;
    } else if (info.category === 'content' && info.depth <= 2) {
      signal += 1;
    }

    if (info.category === 'utility' || info.category === 'action' || info.category === 'user') {
      signal -= 3;
    } else if (info.category === 'content' && info.depth >= 2 && !titleHasHome) {
      signal -= 1;
    }

    if (titleLower === queryContext.queryLower) {
      signal += 4;
    } else if (titleLower.startsWith(queryContext.queryLower)) {
      signal += 3;
    } else if ((Array.isArray(queryContext.queryTerms) ? queryContext.queryTerms : []).every((term) => term && titleLower.includes(term))) {
      signal += 2;
    }

    try {
      const hostLabels = normalizeHost(new URL(entry.url).hostname).split('.').filter(Boolean);
      (Array.isArray(queryContext.queryTerms) ? queryContext.queryTerms : []).forEach((term) => {
        if (!term) {
          return;
        }
        if (hostLabels.includes(term)) {
          signal += 2;
          return;
        }
        if (term.length >= 2 && hostLabels.some((label) => label.startsWith(term))) {
          signal += 1;
        }
      });
    } catch (error) {
      // Ignore invalid URL.
    }

    if (entry.type === 'topSite' || entry.isTopSite) {
      signal += 1;
    } else if (entry.type === 'bookmark') {
      signal += 1;
    }

    return signal;
  }

  function getSearchDirectNavigationAdjustment(item, sourceType, context, options) {
    const entry = item && typeof item === 'object' ? item : null;
    const queryContext = context && typeof context === 'object' ? context : null;
    if (!queryContext || !entry || !entry.url || !isSearchLikelyDirectNavigationQuery(queryContext)) {
      return 0;
    }
    const settings = options && typeof options === 'object' ? options : {};
    const getClusterInfo = typeof settings.getClusterInfo === 'function'
      ? settings.getClusterInfo
      : ((url) => getSearchSuggestionClusterInfo(url, settings));
    const hasHomeTitle = typeof settings.hasHomeTitle === 'function'
      ? settings.hasHomeTitle
      : ((title) => hasSearchHomeTitle(title, settings));
    const getRepresentativeSignal = typeof settings.getRepresentativeSignal === 'function'
      ? settings.getRepresentativeSignal
      : ((candidate, candidateContext) => getSearchNavigationRepresentativeSignal(candidate, candidateContext, settings));

    const info = getClusterInfo(entry.url);
    const titleHasHome = hasHomeTitle(entry.title);
    const representativeSignal = getRepresentativeSignal(entry, queryContext);
    let adjustment = 0;

    if (queryContext.intentType === 'brand') {
      if (info.category === 'site-root' || info.category === 'repo-root') {
        adjustment += 70;
      } else if (info.category === 'section' || info.category === 'landing') {
        adjustment += 32;
      } else if (titleHasHome) {
        adjustment += 42;
      } else if (info.category === 'content' && info.depth >= 2) {
        adjustment -= 28;
      }
    } else if (isSearchLikelyBrandProductQuery(queryContext)) {
      if (info.category === 'site-root' || info.category === 'repo-root') {
        adjustment += 34;
      } else if (info.category === 'section' || info.category === 'landing' || titleHasHome) {
        adjustment += 28;
      } else if (info.category === 'content' && info.depth >= 2) {
        adjustment -= 12;
      }
    }

    if (representativeSignal >= 6) {
      adjustment += 18;
    } else if (representativeSignal <= 0) {
      adjustment -= 12;
    }

    if ((info.category === 'utility' || info.category === 'action' || info.category === 'user') && !queryContext.hasSettingsIntent) {
      adjustment -= 36;
    }

    if (sourceType === 'topSite' && (info.category === 'site-root' || titleHasHome)) {
      adjustment += 10;
    }

    return adjustment;
  }

  function getSearchEngineSuggestionScore(context, localSuggestions, options) {
    const queryContext = context && typeof context === 'object' ? context : {};
    const settings = options && typeof options === 'object' ? options : {};
    const getRepresentativeSignal = typeof settings.getRepresentativeSignal === 'function'
      ? settings.getRepresentativeSignal
      : ((candidate, candidateContext) => getSearchNavigationRepresentativeSignal(candidate, candidateContext, settings));
    const candidates = Array.isArray(localSuggestions) ? localSuggestions : [];
    const hasStrongLocalDirectMatch = candidates.some((suggestion) => (
      suggestion &&
      suggestion.type !== 'googleSuggest' &&
      getRepresentativeSignal(suggestion, queryContext) >= 6
    ));

    if (queryContext.intentType === 'brand') {
      return hasStrongLocalDirectMatch ? 18 : 48;
    }
    if (isSearchLikelyBrandProductQuery(queryContext)) {
      return hasStrongLocalDirectMatch ? 34 : 78;
    }
    if (queryContext.intentType === 'path' || queryContext.intentType === 'revisit') {
      return 52;
    }
    if (queryContext.hasInformationalIntent) {
      return 220;
    }
    return 160;
  }

  function buildSearchBrandDirectSuggestion(candidates, context, options) {
    const queryContext = context && typeof context === 'object' ? context : {};
    if (queryContext.intentType !== 'brand' || queryContext.hasInformationalIntent) {
      return null;
    }
    const settings = options && typeof options === 'object' ? options : {};
    const getClusterInfo = typeof settings.getClusterInfo === 'function'
      ? settings.getClusterInfo
      : ((url) => getSearchSuggestionClusterInfo(url, settings));
    const getBrandHostMatchScore = typeof settings.getBrandHostMatchScore === 'function'
      ? settings.getBrandHostMatchScore
      : ((host, candidateContext) => getSearchBrandHostMatchScore(host, candidateContext, settings));
    const getRepresentativeSignal = typeof settings.getRepresentativeSignal === 'function'
      ? settings.getRepresentativeSignal
      : ((candidate, candidateContext) => getSearchNavigationRepresentativeSignal(candidate, candidateContext, settings));
    const hasHomeTitle = typeof settings.hasHomeTitle === 'function'
      ? settings.hasHomeTitle
      : ((title) => hasSearchHomeTitle(title, settings));
    const siteConfig = settings.siteConfig && typeof settings.siteConfig === 'object'
      ? settings.siteConfig
      : {};
    const calculateRelevanceScore = typeof settings.calculateRelevanceScore === 'function'
      ? settings.calculateRelevanceScore
      : ((item, sourceType, candidateContext) => calculateSearchRelevanceScore(item, sourceType, candidateContext, settings));
    const buildSuggestionReasons = typeof settings.buildSuggestionReasons === 'function'
      ? settings.buildSuggestionReasons
      : ((item, sourceType, candidateContext) => buildSearchSuggestionReasons(item, sourceType, candidateContext, settings));
    const buildSuggestionFavicon = typeof settings.buildSuggestionFavicon === 'function'
      ? settings.buildSuggestionFavicon
      : (() => '');
    const createSuggestion = typeof settings.createSuggestion === 'function'
      ? settings.createSuggestion
      : ((item, sourceType, score, extras) => createSearchSuggestion(item, sourceType, score, extras));

    const hostGroups = new Map();
    (Array.isArray(candidates) ? candidates : []).forEach((suggestion) => {
      if (!suggestion || !suggestion.url || suggestion.type === 'googleSuggest') {
        return;
      }
      const info = getClusterInfo(suggestion.url);
      if (!info.host) {
        return;
      }
      const list = hostGroups.get(info.host) || [];
      list.push(suggestion);
      hostGroups.set(info.host, list);
    });

    let bestGroup = null;
    hostGroups.forEach((group, host) => {
      const hostScore = getBrandHostMatchScore(host, queryContext);
      if (hostScore <= 0) {
        return;
      }
      const sourceSuggestion = group
        .slice()
        .sort((a, b) => {
          const signalDiff = getRepresentativeSignal(b, queryContext) -
            getRepresentativeSignal(a, queryContext);
          if (signalDiff !== 0) {
            return signalDiff;
          }
          return (Number(b && b.score) || 0) - (Number(a && a.score) || 0);
        })[0];
      const hasRepresentative = group.some((suggestion) => {
        const info = getClusterInfo(suggestion && suggestion.url);
        return info.category === 'site-root' ||
          info.category === 'repo-root' ||
          info.category === 'section' ||
          info.category === 'landing' ||
          hasHomeTitle(suggestion && suggestion.title);
      });
      const totalScore = hostScore +
        Math.max(0, getRepresentativeSignal(sourceSuggestion, queryContext)) +
        Math.min(8, group.length * 2);
      if (!bestGroup || totalScore > bestGroup.totalScore) {
        bestGroup = {
          host,
          sourceSuggestion,
          hasRepresentative,
          totalScore
        };
      }
    });

    if (!bestGroup || bestGroup.hasRepresentative || !bestGroup.sourceSuggestion) {
      return null;
    }

    const hostConfig = siteConfig[bestGroup.host] || null;
    const directUrl = hostConfig && hostConfig.directNavigationUrl
      ? hostConfig.directNavigationUrl
      : `https://${bestGroup.host}/`;
    const directTitle = hostConfig && hostConfig.directNavigationTitle
      ? hostConfig.directNavigationTitle
      : (bestGroup.sourceSuggestion.title || bestGroup.host);
    const sourceType = bestGroup.sourceSuggestion.type === 'bookmark'
      ? 'bookmark'
      : ((bestGroup.sourceSuggestion.type === 'topSite' || bestGroup.sourceSuggestion.isTopSite) ? 'topSite' : 'history');
    const directItem = {
      title: directTitle,
      url: directUrl,
      lastVisitTime: bestGroup.sourceSuggestion.lastVisitTime || 0,
      visitCount: Number(bestGroup.sourceSuggestion.visitCount) || 0,
      typedCount: Number(bestGroup.sourceSuggestion.typedCount) || 0
    };
    const baseScore = calculateRelevanceScore(directItem, sourceType, queryContext);
    if (baseScore <= 0) {
      return null;
    }
    const reasons = ['站点直达']
      .concat(buildSuggestionReasons(directItem, sourceType, queryContext))
      .slice(0, 3);
    return createSuggestion(directItem, sourceType, baseScore + 36, {
      favicon: buildSuggestionFavicon(directUrl),
      reasons,
      isTopSite: true,
      isSyntheticDirect: true
    });
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
    buildSearchBrandDirectSuggestion,
    buildSearchSuggestionReasons,
    calculateSearchRelevanceScore,
    compareSearchSuggestions,
    createSearchSuggestion,
    filterBlacklistedSuggestions,
    getRecentPopularityBoost,
    getSearchBrandHostMatchScore,
    getSearchDirectNavigationAdjustment,
    getSearchEngineSuggestionScore,
    getSearchNavigationRepresentativeSignal,
    getSearchSourceAdjustment,
    getSearchSuggestionCategoryAdjustment,
    getSearchSuggestionClusterInfo,
    getSearchSuggestionSourceRank,
    hasSearchHomeTitle,
    isSuggestionBlockedBySearchBlacklist,
    isSearchLikelyBrandProductQuery,
    isSearchLikelyDirectNavigationQuery,
    looksLikeOpaqueIdSegment,
    mergeSearchItems,
    normalizeClusterSegment,
    normalizeSearchSuggestionsMode
  };
});
