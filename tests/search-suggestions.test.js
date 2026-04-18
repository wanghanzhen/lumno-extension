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
}

run();
console.log('search suggestions tests passed');
