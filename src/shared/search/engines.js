(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoSearchEngines = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const SEARCH_ENGINE_DEFS = Object.freeze([
    Object.freeze({
      id: 'google',
      name: 'Google',
      hostMatches: Object.freeze(['google.']),
      searchTemplate: 'https://www.google.com/search?q={query}'
    }),
    Object.freeze({
      id: 'bing',
      name: 'Bing',
      hostMatches: Object.freeze(['bing.com']),
      searchTemplate: 'https://www.bing.com/search?q={query}'
    }),
    Object.freeze({
      id: 'baidu',
      name: 'Baidu',
      hostMatches: Object.freeze(['baidu.com']),
      searchTemplate: 'https://www.baidu.com/s?wd={query}'
    }),
    Object.freeze({
      id: 'duckduckgo',
      name: 'DuckDuckGo',
      hostMatches: Object.freeze(['duckduckgo.com']),
      searchTemplate: 'https://duckduckgo.com/?q={query}'
    }),
    Object.freeze({
      id: 'yahoo',
      name: 'Yahoo',
      hostMatches: Object.freeze(['search.yahoo.com']),
      searchTemplate: 'https://search.yahoo.com/search?p={query}'
    }),
    Object.freeze({
      id: 'yandex',
      name: 'Yandex',
      hostMatches: Object.freeze(['yandex.com']),
      searchTemplate: 'https://yandex.com/search/?text={query}'
    }),
    Object.freeze({
      id: 'sogou',
      name: '搜狗',
      hostMatches: Object.freeze(['sogou.com']),
      searchTemplate: 'https://www.sogou.com/web?query={query}'
    }),
    Object.freeze({
      id: 'so',
      name: '360搜索',
      hostMatches: Object.freeze(['so.com']),
      searchTemplate: 'https://www.so.com/s?q={query}'
    }),
    Object.freeze({
      id: 'shenma',
      name: '神马',
      hostMatches: Object.freeze(['sm.cn']),
      searchTemplate: 'https://m.sm.cn/s?q={query}'
    })
  ]);

  function normalizeSearchEngineHost(hostname) {
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

  function buildSearchUrlFromTemplate(searchTemplate, query) {
    const template = String(searchTemplate || '').trim();
    if (!template) {
      return '';
    }
    return template.replace(/\{query\}/g, encodeURIComponent(String(query || '')));
  }

  function getSearchEngineById(id) {
    if (!id) {
      return null;
    }
    return SEARCH_ENGINE_DEFS.find((engine) => engine.id === id) || null;
  }

  function getSearchEngineByHostname(hostname) {
    const normalized = normalizeSearchEngineHost(hostname);
    if (!normalized) {
      return null;
    }
    return SEARCH_ENGINE_DEFS.find((engine) =>
      engine.hostMatches.some((match) => normalized.includes(match))
    ) || null;
  }

  function buildSearchEngineUrl(engineOrId, query) {
    const engine = typeof engineOrId === 'string'
      ? getSearchEngineById(engineOrId)
      : engineOrId;
    if (!engine || !engine.searchTemplate) {
      return buildSearchUrlFromTemplate('https://www.google.com/search?q={query}', query);
    }
    return buildSearchUrlFromTemplate(engine.searchTemplate, query);
  }

  function isSearchEngineResultUrl(url) {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();
      const path = parsedUrl.pathname.toLowerCase();
      const engine = getSearchEngineByHostname(hostname);
      if (!engine) {
        return false;
      }
      if (path === '/' && (
        parsedUrl.searchParams.has('q') ||
        parsedUrl.searchParams.has('wd') ||
        parsedUrl.searchParams.has('query') ||
        parsedUrl.searchParams.has('text') ||
        parsedUrl.searchParams.has('p')
      )) {
        return true;
      }
      return [
        '/search',
        '/s',
        '/s/2',
        '/web'
      ].some((prefix) => path.startsWith(prefix));
    } catch (error) {
      return false;
    }
  }

  return Object.freeze({
    SEARCH_ENGINE_DEFS,
    buildSearchEngineUrl,
    buildSearchUrlFromTemplate,
    getSearchEngineByHostname,
    getSearchEngineById,
    isSearchEngineResultUrl,
    normalizeSearchEngineHost
  });
});
