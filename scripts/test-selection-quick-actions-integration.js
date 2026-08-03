const assert = require('assert');
const fs = require('fs');

const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const optionsHtml = fs.readFileSync('src/options/options.html', 'utf8');
const optionsSource = fs.readFileSync('src/options/options.js', 'utf8');
const backgroundSource = fs.readFileSync('src/background/background.js', 'utf8');
const contentSource = fs.readFileSync('src/content/selection-quick-actions.js', 'utf8');
const cloudSchemaSource = fs.readFileSync('src/shared/cloud-sync-schema.js', 'utf8');
const shortcutReferenceSource = fs.readFileSync('src/shared/shortcut-reference.js', 'utf8');
const localeNames = ['en', 'ja', 'zh_CN', 'zh_TW'];
const storageKey = '_x_extension_selection_quick_actions_enabled_2026_unique_';

const selectionContentScript = manifest.content_scripts.find((entry) => (
  Array.isArray(entry.js) && entry.js.includes('src/content/selection-quick-actions.js')
));
assert(selectionContentScript, 'manifest should inject the selection quick actions content script');
assert.deepStrictEqual(
  selectionContentScript.js,
  ['src/shared/settings.js', 'src/shared/selection-intent.js', 'src/content/selection-quick-actions.js'],
  'provider-aware settings and the selection classifier should load before the content interaction runtime'
);
assert.strictEqual(selectionContentScript.run_at, 'document_idle');
assert(manifest.permissions.includes('contextMenus'), 'selection actions should declare the contextMenus permission');
assert(
  manifest.commands['show-selection-quick-actions'],
  'manifest should expose an assignable selected-text command'
);
assert.strictEqual(
  manifest.commands['show-selection-quick-actions'].suggested_key,
  undefined,
  'selected-text command should not claim another default browser shortcut'
);
assert(
  shortcutReferenceSource.includes("commandName: 'show-selection-quick-actions'"),
  'settings shortcut reference should expose the selected-text command'
);

const optionsToggleTag = optionsHtml.match(
  /<input\b[^>]*id="_x_extension_selection_quick_actions_toggle_2026_unique_"[^>]*>/
);
assert(optionsToggleTag, 'Labs should render the selection quick actions toggle');
assert.doesNotMatch(
  optionsToggleTag[0],
  /\bchecked\b/,
  'Labs should show the selection quick actions toggle as disabled by default'
);
assert(optionsSource.includes(storageKey), 'options should persist the selection setting');
assert(
  /const SYNC_KEYS = \[[\s\S]*SELECTION_QUICK_ACTIONS_ENABLED_STORAGE_KEY[\s\S]*\];/.test(optionsSource),
  'selection setting should participate in sync/export/import'
);
assert(cloudSchemaSource.includes(storageKey), 'cloud settings schema should include the selection setting');

assert(
  /selectionQuickActions:[\s\S]*runSelectionQuickAction[\s\S]*handleSelectionQuickActionMessage/.test(backgroundSource),
  'background message routing should isolate the selection quick action feature'
);
assert(
  /SELECTION_TARGET\.openSelectionTarget\([\s\S]*groupTitle:\s*'Lumno AI'[\s\S]*groupColor:\s*'blue'/.test(backgroundSource),
  'selection targets should use the dedicated Lumno AI group fallback'
);
assert(
  /active:\s*false/.test(fs.readFileSync('src/background/selection-target.js', 'utf8')),
  'selection target tabs should open in the background'
);

assert(contentSource.includes("document.addEventListener('copy', hideSurface"));
assert(contentSource.includes("document.addEventListener('scroll', hideSurface"));
assert(contentSource.includes("event.key === 'Escape'"));
assert(contentSource.includes('let enabled = false;'), 'content runtime should start disabled');
assert(
  contentSource.includes('result[ENABLED_STORAGE_KEY] === true'),
  'content runtime should require an explicit enabled setting'
);
assert(
  backgroundSource.includes('result[SELECTION_QUICK_ACTIONS_ENABLED_STORAGE_KEY] === true'),
  'background actions should require an explicit enabled setting'
);
assert(
  backgroundSource.includes("action: 'openSelectionQuickActionsMenu'"),
  'browser command should ask the content runtime to open the explicit action menu'
);
assert(
  contentSource.includes("request.action === 'openSelectionQuickActionsMenu'"),
  'content runtime should handle the explicit selected-text command'
);
assert(
  backgroundSource.includes('handleSelectionQuickActionContextMenuClick'),
  'background should route native context menu actions into the selection submit flow'
);
assert(
  backgroundSource.includes("action: 'runSelectionContextMenuAction'"),
  'native context menu clicks should return to the content runtime for DOM sensitivity checks'
);
assert(
  contentSource.includes('editable || sensitive'),
  'explicit entrypoints should preserve editable and sensitive-field suppression'
);
assert(
  contentSource.includes("menu.addEventListener('keydown', handleMenuKeydown)"),
  'the explicit shortcut menu should support keyboard navigation'
);

localeNames.forEach((locale) => {
  const messages = JSON.parse(fs.readFileSync(`_locales/${locale}/messages.json`, 'utf8'));
  [
    'settings_selection_quick_actions_title',
    'settings_selection_quick_actions_desc',
    'selection_quick_action_ask',
    'selection_quick_action_translate',
    'selection_quick_action_explain',
    'selection_quick_action_summarize',
    'selection_quick_action_search',
    'selection_quick_action_calculate',
    'command_show_selection_quick_actions',
    'shortcut_reference_group_selection',
    'shortcut_reference_selection_quick_actions_title',
    'shortcut_reference_selection_quick_actions_desc'
  ].forEach((key) => {
    assert(messages[key] && String(messages[key].message || '').trim(), `${locale} should localize ${key}`);
  });
});

console.log('selection quick actions integration tests passed');
