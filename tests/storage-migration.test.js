const assert = require('node:assert/strict');

const storageMigration = require('../src/shared/storage/migration.js');

function run() {
  assert.deepEqual(
    storageMigration.buildMigrationPayload(
      ['theme', 'recentMode'],
      { theme: 'dark', recentMode: 'latest' },
      {}
    ),
    { theme: 'dark', recentMode: 'latest' },
    'local values should migrate into sync when sync has no values'
  );

  assert.equal(
    storageMigration.buildMigrationPayload(
      ['theme', 'recentMode'],
      { theme: 'dark', recentMode: 'latest' },
      { theme: 'light' }
    ),
    null,
    'existing sync values should prevent local overwrite during migration'
  );

  assert.deepEqual(
    storageMigration.buildMigrationPayload(
      ['language', 'languageMessages', 'searchResultPriority'],
      {
        language: 'zh_CN',
        languageMessages: { locale: 'zh_CN', messages: { huge: 'payload' } },
        searchResultPriority: 'autocomplete'
      },
      {},
      { skipKeys: ['languageMessages'] }
    ),
    {
      language: 'zh_CN',
      searchResultPriority: 'autocomplete'
    },
    'large cache-style values should be excluded from migration payloads'
  );
}

run();
console.log('storage migration tests passed');
