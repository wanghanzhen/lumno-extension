(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoSiteSearchProviders = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const BUILTIN_PROVIDER_MESSAGE_MAP = Object.freeze({
    so: Object.freeze({ messageKey: 'site_search_name_baidu', fallback: 'Baidu' }),
    zh: Object.freeze({ messageKey: 'site_search_name_zhihu', fallback: 'Zhihu' }),
    db: Object.freeze({ messageKey: 'site_search_name_douban', fallback: 'Douban' }),
    jd: Object.freeze({ messageKey: 'site_search_name_juejin', fallback: 'Juejin' }),
    jj: Object.freeze({ messageKey: 'site_search_name_juejin', fallback: 'Juejin' }),
    tb: Object.freeze({ messageKey: 'site_search_name_taobao', fallback: 'Taobao' }),
    tm: Object.freeze({ messageKey: 'site_search_name_tmall', fallback: 'Tmall' }),
    wx: Object.freeze({ messageKey: 'site_search_name_wechat', fallback: 'WeChat' }),
    zw: Object.freeze({ messageKey: 'site_search_name_wikipedia', fallback: 'Wikipedia' })
  });

  function getBuiltinProviderMessage(providerKey) {
    const normalizedKey = String(providerKey || '').trim().toLowerCase();
    return BUILTIN_PROVIDER_MESSAGE_MAP[normalizedKey] || null;
  }

  function normalizeHost(hostname) {
    const raw = String(hostname || '').trim().toLowerCase();
    if (!raw) {
      return '';
    }
    return raw.replace(/^www\./, '');
  }

  function buildSearchUrl(template, query) {
    if (!template) {
      return '';
    }
    return String(template).replace(/\{query\}/g, encodeURIComponent(String(query || '')));
  }

  function normalizeSiteSearchTemplate(template) {
    if (!template) {
      return '';
    }
    return String(template)
      .replace(/\{\{\{s\}\}\}/g, '{query}')
      .replace(/\{s\}/g, '{query}')
      .replace(/\{searchTerms\}/g, '{query}');
  }

  function isInteractiveSiteSearchProvider(provider) {
    return Boolean(
      provider &&
      provider.action === 'openAndSubmit' &&
      provider.submitStrategy === 'geminiPrompt'
    );
  }

  function shouldRestrictInteractiveSiteSearchSuggestions(provider, query) {
    return Boolean(
      isInteractiveSiteSearchProvider(provider) &&
      String(query || '').trim()
    );
  }

  function normalizeSiteSearchProvider(item) {
    if (!item || !item.key || !item.template) {
      return null;
    }
    const template = normalizeSiteSearchTemplate(item.template);
    if (!template) {
      return null;
    }
    return {
      key: String(item.key).trim(),
      aliases: Array.isArray(item.aliases) ? item.aliases.filter(Boolean) : [],
      name: item.name || item.key,
      template: template,
      action: String(item.action || '').trim(),
      submitStrategy: String(item.submitStrategy || '').trim(),
      icon: item.icon || '',
      iconUrl: item.iconUrl || '',
      disabled: item.disabled === true
    };
  }

  function sanitizeSiteSearchProviders(items) {
    if (!Array.isArray(items)) {
      return [];
    }
    return items
      .map(normalizeSiteSearchProvider)
      .filter((item) => {
        if (!item || !item.key || !item.template) {
          return false;
        }
        if (item.template.includes('{query}')) {
          return true;
        }
        return isInteractiveSiteSearchProvider(item);
      });
  }

  function mergeCustomProviders(baseItems, customItems, options) {
    const settings = options && typeof options === 'object' ? options : {};
    const skipDisabledCustom = settings.skipDisabledCustom === true;
    const merged = [];
    const seen = new Set();

    (Array.isArray(customItems) ? customItems : []).forEach((item) => {
      if (skipDisabledCustom && item && item.disabled) {
        return;
      }
      const key = String(item && item.key ? item.key : '').toLowerCase();
      if (!key || seen.has(key)) {
        return;
      }
      seen.add(key);
      merged.push(item);
    });

    (Array.isArray(baseItems) ? baseItems : []).forEach((item) => {
      const key = String(item && item.key ? item.key : '').toLowerCase();
      if (!key || seen.has(key)) {
        return;
      }
      seen.add(key);
      merged.push(item);
    });

    return merged;
  }

  function getProviderHost(provider) {
    if (!provider || !provider.template) {
      return '';
    }
    try {
      const url = String(provider.template).replace(/\{query\}/g, 'test');
      return normalizeHost(new URL(url).hostname);
    } catch (error) {
      return '';
    }
  }

  function getSuggestionHost(suggestion) {
    if (!suggestion || !suggestion.url) {
      return '';
    }
    try {
      return normalizeHost(new URL(suggestion.url).hostname);
    } catch (error) {
      return '';
    }
  }

  function hostsMatch(a, b) {
    if (!a || !b) {
      return false;
    }
    return a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`);
  }

  function findSiteSearchProvider(trigger, providers) {
    const key = String(trigger || '').toLowerCase();
    if (!key) {
      return null;
    }
    return (providers || []).find((provider) => {
      const providerKey = String(provider && provider.key ? provider.key : '').toLowerCase();
      if (providerKey === key) {
        return true;
      }
      const aliases = Array.isArray(provider && provider.aliases) ? provider.aliases : [];
      return aliases.some((alias) => String(alias).toLowerCase() === key);
    }) || null;
  }

  function findSiteSearchProviderByKey(trigger, providers) {
    const key = String(trigger || '').toLowerCase();
    if (!key) {
      return null;
    }
    return (providers || []).find((provider) => String(provider && provider.key ? provider.key : '').toLowerCase() === key) || null;
  }

  function suggestionMatchesProvider(suggestion, provider) {
    if (!suggestion || !provider || !suggestion.url) {
      return false;
    }
    const normalizedSuggestion = getSuggestionHost(suggestion);
    const normalizedProvider = getProviderHost(provider);
    if (!normalizedSuggestion || !normalizedProvider) {
      return false;
    }
    return hostsMatch(normalizedSuggestion, normalizedProvider);
  }

  function isAsciiToken(token) {
    return /^[a-z0-9]+$/i.test(token || '');
  }

  function isProviderTokenEligible(token) {
    if (!token) {
      return false;
    }
    const normalized = String(token).trim();
    if (!normalized) {
      return false;
    }
    if (isAsciiToken(normalized)) {
      return normalized.length >= 3;
    }
    return normalized.length >= 2;
  }

  function providerMatchesSuggestion(provider, suggestion) {
    if (!provider || !suggestion) {
      return false;
    }
    if (suggestionMatchesProvider(suggestion, provider)) {
      return true;
    }
    const titleText = String(suggestion.title || '').toLowerCase();
    const urlText = String(suggestion.url || '').toLowerCase();
    const hostText = normalizeHost(getSuggestionHost(suggestion));
    const haystack = `${titleText} ${urlText} ${hostText}`;
    const tokens = [provider.key, provider.name].concat(provider.aliases || []);
    for (let i = 0; i < tokens.length; i += 1) {
      const token = String(tokens[i] || '').toLowerCase().trim();
      if (!isProviderTokenEligible(token)) {
        continue;
      }
      if (token && haystack.includes(token)) {
        return true;
      }
    }
    return false;
  }

  function findProviderForSuggestionMatch(suggestion, providers, options) {
    if (!suggestion) {
      return null;
    }
    const settings = options && typeof options === 'object' ? options : {};
    const eligibleTypes = settings.eligibleTypes || ['topSite', 'history', 'bookmark'];
    if (!eligibleTypes.includes(suggestion.type) && !suggestion.isTopSite) {
      return null;
    }
    return (providers || []).find((provider) => providerMatchesSuggestion(provider, suggestion)) || null;
  }

  function findSiteSearchProviderByInput(input, providers) {
    const raw = String(input || '').trim();
    if (!raw) {
      return null;
    }
    const firstToken = raw.split(/\s+/)[0];
    const keyMatch = findSiteSearchProvider(firstToken, providers) ||
      findSiteSearchProviderByKey(firstToken, providers);
    if (keyMatch) {
      return keyMatch;
    }
    let host = '';
    if (/[./]/.test(firstToken)) {
      try {
        const url = firstToken.includes('://') ? firstToken : `https://${firstToken}`;
        host = new URL(url).hostname;
      } catch (error) {
        host = firstToken.split('/')[0] || '';
      }
    }
    if (!host) {
      return null;
    }
    const normalizedHost = normalizeHost(host);
    return (providers || []).find((provider) => {
      const providerHost = normalizeHost(getProviderHost(provider));
      if (!providerHost) {
        return false;
      }
      return hostsMatch(normalizedHost, providerHost);
    }) || null;
  }

  function getInlineSiteSearchCandidate(input, providers) {
    const raw = String(input || '').trim();
    if (!raw) {
      return null;
    }
    const tokens = raw.split(/\s+/);
    if (tokens.length < 2) {
      return null;
    }
    const provider = findSiteSearchProviderByInput(raw, providers);
    if (!provider) {
      return null;
    }
    const firstToken = tokens[0];
    const remainder = raw.slice(raw.indexOf(firstToken) + firstToken.length).trim();
    if (!remainder) {
      return null;
    }
    return { provider, query: remainder };
  }

  function providerMatchesInputPrefix(provider, input) {
    const needle = String(input || '').toLowerCase();
    if (!needle || !provider) {
      return false;
    }
    const allowPrefix = needle.length >= 2;
    const tokens = [provider.key, provider.name].concat(provider.aliases || []);
    for (let i = 0; i < tokens.length; i += 1) {
      const token = String(tokens[i] || '').toLowerCase();
      if (!token) {
        continue;
      }
      if (token === needle || (allowPrefix && token.startsWith(needle))) {
        return true;
      }
    }
    const host = normalizeHost(getProviderHost(provider));
    if (host) {
      const hostToken = host.split('.')[0] || host;
      if (hostToken === needle || (allowPrefix && hostToken.startsWith(needle))) {
        return true;
      }
    }
    return false;
  }

  function getSiteSearchTriggerCandidate(input, providers, topSiteMatch, options) {
    const trimmed = String(input || '').trim();
    const settings = options && typeof options === 'object' ? options : {};
    const matchesTopSitePrefix = typeof settings.matchesTopSitePrefix === 'function'
      ? settings.matchesTopSitePrefix
      : (() => false);
    if (!trimmed || /\s/.test(trimmed)) {
      return null;
    }
    let provider = findSiteSearchProvider(trimmed, providers) ||
      findSiteSearchProviderByKey(trimmed, providers);
    if (!provider && topSiteMatch) {
      provider = (providers || []).find((candidate) => {
        if (!suggestionMatchesProvider(topSiteMatch, candidate)) {
          return false;
        }
        return providerMatchesInputPrefix(candidate, trimmed);
      }) || null;
    }
    if (!provider) {
      return null;
    }
    if (topSiteMatch && trimmed.length <= 2 && matchesTopSitePrefix(topSiteMatch, trimmed)) {
      const providerHost = getProviderHost(provider);
      const topHost = getSuggestionHost(topSiteMatch);
      if (!hostsMatch(providerHost, topHost)) {
        return null;
      }
    }
    return provider;
  }

  function getSiteSearchDisplayName(provider, translate, defaultText) {
    const fallbackText = defaultText || '站内';
    if (!provider) {
      return fallbackText;
    }
    const messageInfo = getBuiltinProviderMessage(provider.key);
    if (messageInfo) {
      if (typeof translate === 'function') {
        return translate(messageInfo.messageKey, messageInfo.fallback);
      }
      return messageInfo.fallback;
    }
    return provider.name || provider.key || fallbackText;
  }

  return Object.freeze({
    BUILTIN_PROVIDER_MESSAGE_MAP,
    buildSearchUrl,
    getBuiltinProviderMessage,
    getInlineSiteSearchCandidate,
    getProviderHost,
    getSiteSearchTriggerCandidate,
    getSiteSearchDisplayName
    ,
    getSuggestionHost,
    hostsMatch,
    isInteractiveSiteSearchProvider,
    mergeCustomProviders,
    normalizeHost,
    normalizeSiteSearchProvider,
    normalizeSiteSearchTemplate,
    providerMatchesInputPrefix,
    providerMatchesSuggestion,
    sanitizeSiteSearchProviders,
    shouldRestrictInteractiveSiteSearchSuggestions,
    suggestionMatchesProvider,
    findProviderForSuggestionMatch,
    findSiteSearchProvider,
    findSiteSearchProviderByInput,
    findSiteSearchProviderByKey
  });
});
