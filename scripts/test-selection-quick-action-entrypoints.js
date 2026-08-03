const assert = require('assert');
const entrypoints = require('../src/background/selection-quick-action-entrypoints.js');

function createChromeApi() {
  const created = [];
  const removed = [];
  return {
    created,
    removed,
    api: {
      contextMenus: {
        create(properties, callback) {
          created.push({ ...properties });
          callback();
        },
        remove(id, callback) {
          removed.push(id);
          callback();
        }
      },
      i18n: {
        getMessage(key) {
          return `i18n:${key}`;
        }
      },
      runtime: {
        lastError: null
      }
    }
  };
}

function sync(api, enabled) {
  return new Promise((resolve) => entrypoints.syncContextMenus(api, enabled, resolve));
}

(async () => {
  const disabledChrome = createChromeApi();
  const disabledResult = await sync(disabledChrome.api, false);
  assert.strictEqual(disabledResult.ok, true);
  assert.deepStrictEqual(disabledChrome.removed, [entrypoints.CONTEXT_MENU_ROOT_ID]);
  assert.deepStrictEqual(disabledChrome.created, []);

  const enabledChrome = createChromeApi();
  const enabledResult = await sync(enabledChrome.api, true);
  assert.strictEqual(enabledResult.ok, true);
  assert.strictEqual(enabledResult.enabled, true);
  assert.strictEqual(enabledChrome.created.length, entrypoints.ACTIONS.length + 1);
  assert.deepStrictEqual(enabledChrome.created[0].contexts, ['selection']);
  entrypoints.ACTIONS.forEach((action, index) => {
    const item = enabledChrome.created[index + 1];
    assert.strictEqual(item.id, entrypoints.getMenuItemId(action));
    assert.strictEqual(item.parentId, entrypoints.CONTEXT_MENU_ROOT_ID);
    assert.strictEqual(entrypoints.getActionForMenuItem(item.id), action);
  });
  assert.strictEqual(entrypoints.getActionForMenuItem('unrelated-menu'), '');

  console.log('selection quick action entrypoint tests passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
