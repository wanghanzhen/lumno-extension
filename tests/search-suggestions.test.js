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
}

run();
console.log('search suggestions tests passed');
