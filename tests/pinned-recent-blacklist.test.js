const assert = require('node:assert/strict');
const blacklistUtils = require('../src/shared/blacklist-utils.js');

function shouldExcludeFromRecentSites(url, rules) {
  return blacklistUtils.isUrlBlocked(url, rules);
}

function normalizeRecentSiteRecord(item, rules, options) {
  const opts = options && typeof options === 'object' ? options : {};
  const ignoreBlacklist = opts.ignoreBlacklist === true;
  if (!item || !item.url) {
    return null;
  }
  const url = String(item.url).trim();
  if (!url || (!ignoreBlacklist && shouldExcludeFromRecentSites(url, rules))) {
    return null;
  }
  return {
    url,
    host: item.host || '',
    title: item.title || '',
    siteName: item.siteName || '',
    lastVisitTime: Number(item.lastVisitTime) || 0,
    visitCount: Number(item.visitCount) || 0,
    pinnedAt: Number(item.pinnedAt) || 0
  };
}

function isSameRecentSite(a, b) {
  return a && b && a.url === b.url;
}

function mergeRecentSitesWithPinned(items, pinnedItems, rules) {
  const merged = [];
  function append(item, isPinned) {
    const normalized = normalizeRecentSiteRecord(item, rules, { ignoreBlacklist: isPinned });
    if (!normalized) {
      return;
    }
    if (merged.some((existing) => isSameRecentSite(existing, normalized))) {
      return;
    }
    normalized._xPinned = isPinned;
    merged.push(normalized);
  }
  pinnedItems.forEach((item) => append(item, true));
  items.forEach((item) => append(item, false));
  return merged;
}

function run() {
  const rules = [{ pattern: 'baidu.com/', matchModes: ['exact'] }];
  const source = [{ url: 'https://baidu.com/', title: 'Baidu' }];
  const pinned = [{ url: 'https://baidu.com/', title: 'Baidu', pinnedAt: Date.now() }];

  const merged = mergeRecentSitesWithPinned(source, pinned, rules);
  assert.equal(merged.length, 1, 'pinned blacklisted item should still render once');
  assert.equal(merged[0]._xPinned, true, 'pinned item should keep pinned state');

  const unpinnedMerged = mergeRecentSitesWithPinned(source, [], rules);
  assert.equal(unpinnedMerged.length, 0, 'unpinned blacklisted item should still be filtered');

  const pinnedNormalized = normalizeRecentSiteRecord(
    { url: 'https://baidu.com/', title: 'Baidu' },
    rules,
    { ignoreBlacklist: true }
  );
  assert.ok(pinnedNormalized, 'pin/unpin operations should be able to normalize blacklisted pinned items');
}

run();
console.log('pinned recent blacklist tests passed');
