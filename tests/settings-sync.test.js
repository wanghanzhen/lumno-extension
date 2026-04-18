const assert = require('node:assert/strict');

const settingsUtils = require('../src/shared/settings/overlay-tab-priority.js');

function run() {
  assert.equal(
    settingsUtils.normalizeOverlayTabQuickSwitch('switchTabFirst'),
    true,
    'switchTabFirst should keep quick switch enabled'
  );

  assert.equal(
    settingsUtils.normalizeOverlayTabQuickSwitch('newtabFirst'),
    false,
    'newtabFirst should disable quick switch'
  );

  assert.equal(
    settingsUtils.normalizeOverlayTabQuickSwitch(false),
    false,
    'stored false should stay disabled'
  );

  assert.equal(
    settingsUtils.normalizeOverlayTabQuickSwitch(undefined),
    true,
    'unset values should fall back to enabled'
  );
}

run();
console.log('settings sync tests passed');
