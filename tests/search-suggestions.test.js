const assert = require('node:assert/strict');

const searchSuggestions = require('../src/shared/search/suggestions.js');

function run() {
  assert.deepEqual(
    searchSuggestions.buildBookmarkSearchRequest({ lookupQuery: 'lumno docs' }),
    { query: 'lumno docs' },
    'bookmark search requests should use the query context lookupQuery'
  );

  assert.equal(
    searchSuggestions.normalizeSearchSuggestionsMode('classic'),
    'classic',
    'classic mode should be preserved'
  );

  assert.equal(
    searchSuggestions.normalizeSearchSuggestionsMode('ai'),
    'classic',
    'unsupported modes should safely fall back to classic'
  );

  const merged = searchSuggestions.mergeSearchItems(
    [
      [
        { source: 'history', url: 'https://example.com/docs', title: 'Old Doc', lastVisitTime: 10 },
        { source: 'history', url: 'https://blocked.example.com', title: 'Blocked' }
      ],
      [
        { source: 'topSite', url: 'https://example.com/docs', title: 'Top Doc', lastVisitTime: 20 },
        { source: 'topSite', url: 'https://another.example.com', title: 'Another' }
      ],
      [
        { source: 'bookmark', url: 'https://book.example.com', title: 'Bookmark' }
      ]
    ],
    {
      buildKey: (item) => String(item.url || '').toLowerCase(),
      shouldReplace: (candidate, existing) => (candidate.lastVisitTime || 0) > (existing.lastVisitTime || 0),
      isBlocked: (item) => String(item.url || '').includes('blocked.example.com')
    }
  );

  assert.deepEqual(
    merged.map((item) => item.url),
    [
      'https://example.com/docs',
      'https://another.example.com',
      'https://book.example.com'
    ],
    'history, top sites, and bookmarks should merge, dedupe, and filter blocked entries'
  );

  assert.equal(
    merged[0].source,
    'topSite',
    'newer duplicates should replace older entries during merge'
  );

  assert.equal(
    searchSuggestions.buildBlacklistProbeUrlFromTemplate(
      'https://example.com/search?q={query}',
      'lumno docs'
    ),
    'https://example.com/search?q=lumno%20docs',
    'blacklist probe URLs should expand the shared {query} placeholder'
  );

  assert.equal(
    searchSuggestions.shouldIgnoreSearchDedupQueryParam('utm_source', {
      ignoredParamNames: new Set(['ref'])
    }),
    true,
    'dedup query filtering should ignore utm_* params'
  );

  assert.equal(
    searchSuggestions.buildSearchDedupUrlKey(
      'https://Example.com/docs/?b=2&utm_source=x&a=1#hash',
      {
        normalizeHost: (host) => String(host || '').toLowerCase().replace(/^www\./, ''),
        siteConfig: {},
        shouldIgnoreQueryParam: (paramName) => ['utm_source'].includes(paramName)
      }
    ),
    'https://example.com/docs?a=1&b=2',
    'dedup URL keys should normalize host, sort params, and drop ignored tracking params'
  );

  assert.equal(
    searchSuggestions.buildSearchDedupEntryKey(
      {
        title: '  Lumno   Docs ',
        url: 'https://example.com/docs?utm_source=test'
      },
      {
        buildDedupUrlKey: (url) => String(url || '').replace('?utm_source=test', ''),
        normalizeTitle: searchSuggestions.normalizeSearchDedupTitle
      }
    ),
    'url:https://example.com/docs::title:lumno docs',
    'dedup entry keys should combine normalized URL and title'
  );

  assert.equal(
    searchSuggestions.shouldReplaceDedupedSearchItem(
      { lastVisitTime: 20, typedCount: 1, visitCount: 1, title: 'Short' },
      { lastVisitTime: 10, typedCount: 5, visitCount: 5, title: 'Longer title' }
    ),
    true,
    'dedup replacement should prefer fresher entries before other signals'
  );

  assert.equal(
    searchSuggestions.isSuggestionBlockedBySearchBlacklist(
      {
        type: 'siteSearchPrompt',
        provider: { template: 'https://example.com/search?q={query}' }
      },
      ['https://example.com/search?q=lumno%20docs'],
      'lumno docs',
      {
        isBlockedUrl: (url, items) => items.includes(url)
      }
    ),
    true,
    'site-search prompts should be filtered through the shared blacklist helper'
  );

  assert.deepEqual(
    searchSuggestions.filterBlacklistedSuggestions(
      [
        { type: 'history', url: 'https://allowed.example.com' },
        { type: 'history', url: 'https://blocked.example.com' },
        { type: 'newtab', url: 'chrome://newtab' }
      ],
      ['https://blocked.example.com'],
      '',
      {
        isBlockedUrl: (url, items) => items.includes(url)
      }
    ).map((item) => item.url),
    ['https://allowed.example.com', 'chrome://newtab'],
    'shared blacklist filtering should keep allowed suggestions and preserve newtab entries'
  );

  const now = Date.UTC(2026, 3, 18, 12, 0, 0);
  const bookmarkSuggestion = {
    type: 'bookmark',
    score: 20,
    visitCount: 1,
    typedCount: 0,
    lastVisitTime: now - (1000 * 60 * 60)
  };
  const historySuggestion = {
    type: 'history',
    score: 20,
    visitCount: 1,
    typedCount: 0,
    lastVisitTime: now - (1000 * 60 * 60 * 48)
  };

  assert.equal(
    searchSuggestions.compareSearchSuggestions(bookmarkSuggestion, historySuggestion, { now }) < 0,
    true,
    'shared ranking should prefer fresher bookmark suggestions when base scores tie'
  );

  const createdSuggestion = searchSuggestions.createSearchSuggestion(
    {
      title: 'Lumno Docs',
      url: 'https://example.com/docs',
      lastVisitTime: now,
      visitCount: '4',
      typedCount: '2'
    },
    'history',
    42,
    { favicon: 'https://example.com/favicon.ico', reasons: ['来源：浏览历史'] }
  );

  assert.deepEqual(
    createdSuggestion,
    {
      type: 'history',
      title: 'Lumno Docs',
      url: 'https://example.com/docs',
      favicon: 'https://example.com/favicon.ico',
      score: 42,
      lastVisitTime: now,
      visitCount: 4,
      typedCount: 2,
      reasons: ['来源：浏览历史']
    },
    'shared suggestion factory should normalize numeric fields and preserve extras'
  );

  assert.equal(
    searchSuggestions.buildBookmarkPath(
      { id: '3', parentId: '2', url: 'https://example.com/guides/start' },
      {
        bookmarkNodeMap: new Map([
          ['2', { id: '2', title: 'Guides', parentId: '1', hasUrl: false }],
          ['1', { id: '1', title: 'Bookmarks bar', parentId: '', hasUrl: false }]
        ]),
        rootFolderTitles: new Set(['Bookmarks bar'])
      }
    ),
    'Guides',
    'shared bookmark path building should skip root folders and keep intermediate folders'
  );

  const localSuggestionBundle = searchSuggestions.buildLocalSearchSuggestions(
    [
      {
        title: 'GitHub Docs',
        url: 'https://github.com/features/copilot',
        lastVisitTime: now,
        visitCount: 3,
        typedCount: 1
      }
    ],
    [
      {
        title: 'GitHub Docs',
        url: 'https://github.com/features/copilot',
        lastVisitTime: now,
        visitCount: 3,
        typedCount: 1
      },
      {
        title: 'Fallback Site',
        url: 'https://fallback.example.com/'
      }
    ],
    [
      {
        id: '3',
        parentId: '2',
        title: 'Guide',
        url: 'https://example.com/guides/start',
        lastVisitTime: now - (1000 * 60 * 60),
        visitCount: 1,
        typedCount: 0
      }
    ],
    {
      lookupQuery: 'github',
      queryLower: 'github',
      queryTerms: ['github'],
      intentType: 'brand',
      hasSettingsIntent: false,
      hasInformationalIntent: false
    },
    {
      bookmarkNodeMap: new Map([
        ['2', { id: '2', title: 'Guides', parentId: '1', hasUrl: false }],
        ['1', { id: '1', title: 'Bookmarks bar', parentId: '', hasUrl: false }]
      ]),
      rootFolderTitles: new Set(['Bookmarks bar']),
      buildDedupEntryKey: (item) => item.url,
      calculateRelevanceScore: (item) => (
        item.url === 'https://fallback.example.com/' ? 0 : 10
      ),
      createSuggestion: (item, sourceType, score, extras) => ({ ...item, type: sourceType, score, ...extras }),
      buildSuggestionFavicon: (url) => `${url}favicon.ico`,
      buildSuggestionReasons: (_item, sourceType) => [`source:${sourceType}`],
      buildBrandDirectSuggestion: () => null,
      isSearchEngineResultUrl: () => false,
      isBlockedUrl: () => false,
      normalizeHost: (host) => String(host || '').toLowerCase()
    }
  );

  assert.deepEqual(
    localSuggestionBundle.suggestions.map((item) => ({
      type: item.type,
      url: item.url,
      score: item.score,
      isTopSite: item.isTopSite === true,
      path: item.path || ''
    })),
    [
      {
        type: 'history',
        url: 'https://github.com/features/copilot',
        score: 16,
        isTopSite: true,
        path: ''
      },
      {
        type: 'bookmark',
        url: 'https://example.com/guides/start',
        score: 14,
        isTopSite: false,
        path: 'Guides'
      }
    ],
    'shared local suggestion assembly should merge top sites into existing entries, keep bookmark paths, and preserve source-specific boosts'
  );

  assert.deepEqual(
    localSuggestionBundle.fallbackTopSites,
    [
      {
        title: 'Fallback Site',
        url: 'https://fallback.example.com/'
      }
    ],
    'shared local suggestion assembly should keep zero-score top sites for fallback use'
  );

  const engineSuggestionTarget = [
    { type: 'history', title: 'GitHub', url: 'https://github.com/', score: 12 }
  ];
  searchSuggestions.appendEngineSearchSuggestions(
    engineSuggestionTarget,
    ['github docs', 'github'],
    { lookupQuery: 'github' },
    {
      buildSearchUrl: (query) => `https://search.example.com?q=${encodeURIComponent(query)}`,
      getDefaultFaviconUrl: () => 'https://search.example.com/favicon.ico',
      getEngineSuggestionScore: () => 18,
      isSuggestionBlocked: (_item, query) => query === 'github docs'
    }
  );

  assert.deepEqual(
    engineSuggestionTarget,
    [
      { type: 'history', title: 'GitHub', url: 'https://github.com/', score: 12 }
    ],
    'shared engine suggestion assembly should skip blocked queries and exact query echoes'
  );

  searchSuggestions.appendEngineSearchSuggestions(
    engineSuggestionTarget,
    ['github copilot'],
    { lookupQuery: 'github' },
    {
      buildSearchUrl: (query) => `https://search.example.com?q=${encodeURIComponent(query)}`,
      getDefaultFaviconUrl: () => 'https://search.example.com/favicon.ico',
      getEngineSuggestionScore: () => 18,
      isSuggestionBlocked: () => false
    }
  );

  assert.deepEqual(
    engineSuggestionTarget[1],
    {
      type: 'googleSuggest',
      title: 'github copilot',
      url: 'https://search.example.com?q=github%20copilot',
      favicon: 'https://search.example.com/favicon.ico',
      score: 18,
      searchQuery: 'github copilot',
      forceSearch: true,
      reasons: ['来源：搜索建议']
    },
    'shared engine suggestion assembly should append search-engine candidates with injected score and URL helpers'
  );

  assert.deepEqual(
    searchSuggestions.buildSearchSuggestionReasons(
      {
        title: '知乎专栏',
        lastVisitTime: now - (1000 * 60 * 60 * 2),
        visitCount: 3
      },
      'history',
      { normalizedPinyinQuery: 'zh' },
      {
        now,
        getTitlePinyinMatchScore: () => ({ score: 10, reason: 'initials-prefix' })
      }
    ),
    ['来源：浏览历史', '标题首字母匹配', '最近 24 小时访问'],
    'shared suggestion reasons should stay deterministic with injected ranking helpers'
  );

  assert.equal(
    searchSuggestions.getSearchSourceAdjustment('bookmark', 'navigation'),
    24,
    'shared source adjustment should keep bookmark priority for navigation queries'
  );

  assert.equal(
    searchSuggestions.getSearchSourceAdjustment('history', 'path'),
    18,
    'shared source adjustment should keep history priority for path queries'
  );

  const relevanceScore = searchSuggestions.calculateSearchRelevanceScore(
    {
      title: 'Lumno Extension Docs',
      url: 'https://docs.example.com/guides/lumno-extension',
      lastVisitTime: now - (1000 * 60 * 60),
      visitCount: 8,
      typedCount: 2
    },
    'bookmark',
    {
      queryLower: 'lumno extension',
      queryTerms: ['lumno extension', 'lumno', 'extension'],
      normalizedPinyinQuery: '',
      intentType: 'object',
      hasSettingsIntent: false
    },
    {
      now,
      normalizeHost: (host) => String(host || '').toLowerCase(),
      splitSearchTerms: (value) => String(value || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean),
      getTitlePinyinMatchScore: () => ({ score: 0 }),
      shouldBlockFaviconForHost: (host) => host === 'docs.example.com',
      getSuggestionCategoryAdjustment: () => 6,
      getDirectNavigationAdjustment: () => 4,
      getOwnExtensionUtilityPenalty: () => 0
    }
  );

  assert.ok(
    Math.abs(relevanceScore - 342.67970000576923) < 1e-9,
    'shared relevance scoring should preserve text, behavior, and injected adjustment weights'
  );

  assert.equal(
    searchSuggestions.calculateSearchRelevanceScore(
      {
        title: 'Dashboard',
        url: 'https://internal.example.com/app'
      },
      'history',
      {
        queryLower: 'lumno',
        queryTerms: ['lumno'],
        normalizedPinyinQuery: '',
        intentType: 'brand',
        hasSettingsIntent: false
      },
      {
        normalizeHost: (host) => String(host || '').toLowerCase(),
        splitSearchTerms: (value) => String(value || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean),
        getTitlePinyinMatchScore: () => ({ score: 0 }),
        shouldBlockFaviconForHost: () => false,
        getSuggestionCategoryAdjustment: () => 0,
        getDirectNavigationAdjustment: () => 0,
        getOwnExtensionUtilityPenalty: () => 0
      }
    ),
    0,
    'shared relevance scoring should return zero when there is no text match signal'
  );

  assert.equal(
    searchSuggestions.hasSearchHomeTitle('GitHub Home', {
      splitSearchTerms: (value) => String(value || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean),
      homeTitleTerms: new Set(['home'])
    }),
    true,
    'shared home-title detection should honor injected title terms'
  );

  const clusterInfo = searchSuggestions.getSearchSuggestionClusterInfo(
    'https://github.com/openai/gpt-5/issues/123',
    {
      normalizeHost: (host) => String(host || '').toLowerCase(),
      looksLikeVersionSegment: (segment) => /^v?\d/.test(String(segment || '')),
      siteConfig: {
        'github.com': {
          repoAreaCategories: new Map([
            ['issues', 'repo-issues'],
            ['pulls', 'repo-pulls']
          ])
        }
      },
      utilitySegments: new Set(['settings']),
      actionSegments: new Set(['new'])
    }
  );

  assert.deepEqual(
    clusterInfo,
    {
      host: 'github.com',
      category: 'repo-issues',
      clusterKey: 'github.com/openai/gpt-5/issues',
      depth: 4,
      path: '/openai/gpt-5/issues/123'
    },
    'shared cluster info should classify repository areas with injected site config'
  );

  assert.equal(
    searchSuggestions.getSearchSuggestionCategoryAdjustment(
      { type: 'topSite', isTopSite: true, url: 'https://example.com/settings/profile' },
      ['lumno'],
      false,
      {
        getClusterInfo: () => ({
          category: 'utility',
          depth: 2
        })
      }
    ),
    -91,
    'shared category adjustment should preserve utility penalties while keeping top-site bonuses'
  );

  const representativeSignal = searchSuggestions.getSearchNavigationRepresentativeSignal(
    {
      type: 'topSite',
      isTopSite: true,
      title: 'GitHub',
      url: 'https://github.com/'
    },
    {
      queryLower: 'github',
      queryTerms: ['github']
    },
    {
      getClusterInfo: () => ({
        category: 'site-root',
        depth: 0
      }),
      normalizeHost: (host) => String(host || '').toLowerCase(),
      hasHomeTitle: () => false
    }
  );

  assert.equal(
    representativeSignal,
    11,
    'shared representative signal should reward site roots, exact title matches, host matches, and top sites'
  );

  assert.equal(
    searchSuggestions.getSearchDirectNavigationAdjustment(
      {
        type: 'topSite',
        isTopSite: true,
        title: 'GitHub',
        url: 'https://github.com/'
      },
      'topSite',
      {
        intentType: 'brand',
        queryLower: 'github',
        queryTerms: ['github'],
        hasInformationalIntent: false,
        hasSettingsIntent: false
      },
      {
        getClusterInfo: () => ({
          category: 'site-root',
          depth: 0
        }),
        hasHomeTitle: () => false,
        getRepresentativeSignal: () => 7
      }
    ),
    98,
    'shared direct-navigation adjustment should preserve site-root and representative bonuses'
  );

  assert.equal(
    searchSuggestions.getSearchEngineSuggestionScore(
      {
        intentType: 'brand',
        queryLower: 'github',
        queryTerms: ['github'],
        hasInformationalIntent: false,
        hasSettingsIntent: false
      },
      [
        { type: 'bookmark', url: 'https://github.com/' }
      ],
      {
        getRepresentativeSignal: () => 6
      }
    ),
    18,
    'shared engine suggestion scoring should downrank engine suggestions when a strong local direct match exists'
  );

  assert.deepEqual(
    searchSuggestions.buildSearchBrandDirectSuggestion(
      [
        {
          type: 'history',
          title: 'GitHub Docs',
          url: 'https://github.com/features/copilot',
          score: 120,
          lastVisitTime: now,
          visitCount: 5,
          typedCount: 1
        }
      ],
      {
        intentType: 'brand',
        queryLower: 'github',
        queryTerms: ['github'],
        hasInformationalIntent: false
      },
      {
        getClusterInfo: (url) => (
          url === 'https://github.com/features/copilot'
            ? { host: 'github.com', category: 'content', depth: 2 }
            : { host: 'github.com', category: 'site-root', depth: 0 }
        ),
        getBrandHostMatchScore: () => 100,
        getRepresentativeSignal: () => 4,
        hasHomeTitle: () => false,
        siteConfig: {
          'github.com': {
            directNavigationUrl: 'https://github.com/',
            directNavigationTitle: 'GitHub'
          }
        },
        calculateRelevanceScore: () => 80,
        buildSuggestionReasons: () => ['来源：浏览历史'],
        buildSuggestionFavicon: () => 'https://github.com/favicon.ico',
        createSuggestion: (item, sourceType, score, extras) => ({ ...item, type: sourceType, score, ...extras })
      }
    ),
    {
      title: 'GitHub',
      url: 'https://github.com/',
      lastVisitTime: now,
      visitCount: 5,
      typedCount: 1,
      type: 'history',
      score: 116,
      favicon: 'https://github.com/favicon.ico',
      reasons: ['站点直达', '来源：浏览历史'],
      isTopSite: true,
      isSyntheticDirect: true
    },
    'shared brand-direct builder should synthesize a site-root candidate from host groups'
  );

  assert.equal(
    searchSuggestions.buildSearchBrandDirectSuggestion(
      [
        {
          type: 'history',
          title: 'GitHub',
          url: 'https://github.com/',
          score: 120
        }
      ],
      {
        intentType: 'brand',
        queryLower: 'github',
        queryTerms: ['github'],
        hasInformationalIntent: false
      },
      {
        getClusterInfo: () => ({ host: 'github.com', category: 'site-root', depth: 0 }),
        getBrandHostMatchScore: () => 100,
        getRepresentativeSignal: () => 8,
        hasHomeTitle: () => false,
        calculateRelevanceScore: () => 80,
        buildSuggestionReasons: () => ['来源：浏览历史'],
        buildSuggestionFavicon: () => 'https://github.com/favicon.ico',
        createSuggestion: (item, sourceType, score, extras) => ({ ...item, type: sourceType, score, ...extras })
      }
    ),
    null,
    'shared brand-direct builder should skip synthesis when a representative root candidate already exists'
  );

  assert.deepEqual(
    searchSuggestions.takeTopUniqueSuggestions(
      [
        { title: 'A', url: 'https://example.com/a', score: 10 },
        { title: 'A', url: 'https://example.com/a', score: 9 },
        { title: 'B', url: 'https://example.com/b', score: 8 }
      ],
      {
        buildDedupEntryKey: (item) => item.url,
        limit: 2
      }
    ).map((item) => item.url),
    ['https://example.com/a', 'https://example.com/b'],
    'candidate-pool dedup should keep the first unique suggestions in score order'
  );

  assert.deepEqual(
    searchSuggestions.applySearchSuggestionHostDiversity(
      [
        { type: 'topSite', isTopSite: true, title: 'Root', url: 'https://example.com/' },
        { type: 'history', title: 'Doc 1', url: 'https://example.com/docs/one' },
        { type: 'history', title: 'Doc 2', url: 'https://example.com/docs/two' },
        { type: 'history', title: 'Other', url: 'https://other.com/' }
      ],
      {
        buildDedupEntryKey: (item) => item.url,
        getClusterInfo: (url) => {
          if (url === 'https://example.com/') return { host: 'example.com', clusterKey: 'example.com/', category: 'site-root' };
          if (url.startsWith('https://example.com/docs')) return { host: 'example.com', clusterKey: 'example.com/docs', category: 'content' };
          return { host: 'other.com', clusterKey: 'other.com/', category: 'site-root' };
        },
        policy: {
          finalSuggestionLimit: 3,
          topSiteRepresentativeHostLimit: 1,
          topSiteRepresentativeClusterLimit: 1,
          primaryHostLimit: 2,
          primaryClusterLimit: 1,
          secondaryHostLimit: 3,
          secondaryClusterLimit: 2
        }
      }
    ).map((item) => item.url),
    ['https://example.com/', 'https://example.com/docs/one', 'https://other.com/'],
    'host diversity should reserve representative top sites and then fill remaining slots with diverse hosts/clusters'
  );

  assert.deepEqual(
    searchSuggestions.buildFallbackTopSiteSuggestions(
      [
        { title: 'Example', url: 'https://example.com/' },
        { title: 'Other', url: 'https://other.com/' }
      ],
      {
        limit: 1,
        createSuggestion: (item, sourceType, score, extras) => ({ ...item, type: sourceType, score, ...extras }),
        buildSuggestionFavicon: (url) => `${url}favicon.ico`
      }
    ),
    [
      {
        title: 'Example',
        url: 'https://example.com/',
        type: 'topSite',
        score: 1,
        favicon: 'https://example.com/favicon.ico',
        reasons: ['来源：常用站点']
      }
    ],
    'fallback top sites should be converted into low-score topSite suggestions'
  );

  assert.deepEqual(
    searchSuggestions.finalizeSearchSuggestions(
      [
        { type: 'history', title: 'Example', url: 'https://example.com/', score: 10 },
        { type: 'history', title: 'Example', url: 'https://example.com/', score: 9 }
      ],
      [
        { title: 'Fallback', url: 'https://fallback.com/' }
      ],
      { lookupQuery: 'example' },
      {
        searchBlacklistItems: [],
        queryForProvider: 'example',
        policy: {
          candidatePoolLimit: 5,
          finalSuggestionLimit: 3,
          fallbackTopSiteLimit: 1
        },
        buildDedupEntryKey: (item) => item.url,
        filterBlacklistedSuggestions: (list) => list,
        applyHostDiversity: (list) => list,
        createSuggestion: (item, sourceType, score, extras) => ({ ...item, type: sourceType, score, ...extras }),
        buildSuggestionFavicon: (url) => `${url}favicon.ico`
      }
    ).map((item) => item.url),
    ['https://example.com/'],
    'final suggestion finalization should dedupe the candidate pool before returning results'
  );

  assert.deepEqual(
    searchSuggestions.finalizeSearchSuggestions(
      [],
      [
        { title: 'Fallback', url: 'https://fallback.com/' }
      ],
      { lookupQuery: 'fallback' },
      {
        searchBlacklistItems: [],
        queryForProvider: 'fallback',
        policy: {
          candidatePoolLimit: 5,
          finalSuggestionLimit: 3,
          fallbackTopSiteLimit: 1
        },
        buildDedupEntryKey: (item) => item.url,
        filterBlacklistedSuggestions: (list) => list,
        applyHostDiversity: (list) => list,
        createSuggestion: (item, sourceType, score, extras) => ({ ...item, type: sourceType, score, ...extras }),
        buildSuggestionFavicon: (url) => `${url}favicon.ico`
      }
    ).map((item) => item.url),
    ['https://fallback.com/'],
    'final suggestion finalization should fall back to top sites when no ranked results survive'
  );
}

run();
console.log('search suggestions tests passed');
