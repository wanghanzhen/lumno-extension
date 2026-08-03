const assert = require('assert');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const selectionIntent = require('../src/shared/selection-intent.js');

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  const dom = new JSDOM('<!doctype html><html lang="zh-CN"><body><p id="copy">serendipity</p><div id="editable" contenteditable="true">private draft</div></body></html>', {
    pretendToBeVisual: true,
    runScripts: 'outside-only',
    url: 'https://example.com/article'
  });
  const { window } = dom;
  let runtimeMessageListener = null;
  const sentMessages = [];
  window.LumnoSelectionIntent = selectionIntent;
  window.Range.prototype.getBoundingClientRect = () => ({
    bottom: 44,
    height: 18,
    left: 20,
    right: 110,
    top: 26,
    width: 90
  });
  window.Range.prototype.getClientRects = () => [];
  window.chrome = {
    i18n: {
      getMessage() { return ''; },
      getUILanguage() { return 'zh-CN'; }
    },
    runtime: {
      getURL(path) { return `chrome-extension://lumno/${path}`; },
      lastError: null,
      onMessage: {
        addListener(listener) { runtimeMessageListener = listener; }
      },
      sendMessage(message, callback) {
        sentMessages.push(message);
        callback({ ok: true });
      }
    },
    storage: {
      local: {
        get(_keys, callback) { callback({}); }
      },
      onChanged: {
        addListener() {}
      },
      sync: {
        get(_keys, callback) {
          callback({ _x_extension_selection_quick_actions_enabled_2026_unique_: true });
        }
      }
    }
  };

  const paragraph = window.document.getElementById('copy');
  const range = window.document.createRange();
  range.selectNodeContents(paragraph);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  window.eval(fs.readFileSync('src/content/selection-quick-actions.js', 'utf8'));
  paragraph.dispatchEvent(new window.MouseEvent('pointerup', {
    bubbles: true,
    button: 0,
    clientX: 100,
    clientY: 40
  }));

  await wait(380);
  const host = window.document.getElementById('_x_extension_selection_quick_actions_host_2026_unique_');
  assert(host, 'high-confidence selection should create the quick action host');
  assert.strictEqual(host.hidden, false);
  assert.strictEqual(host.dataset.visible, 'true');

  window.document.dispatchEvent(new window.Event('copy', { bubbles: true }));
  assert.strictEqual(host.hidden, true, 'copy should dismiss the selection affordance');

  let explicitResponse = null;
  runtimeMessageListener(
    { action: 'openSelectionQuickActionsMenu' },
    {},
    (response) => { explicitResponse = response; }
  );
  await wait(20);
  assert(explicitResponse && explicitResponse.ok === true);
  assert.strictEqual(host.hidden, false, 'explicit shortcut should open the complete action menu');
  assert.strictEqual(host.dataset.visible, 'true');
  assert.strictEqual(
    window.document.activeElement,
    host,
    'explicit shortcut should move keyboard focus into the shadow-hosted action menu'
  );

  paragraph.dispatchEvent(new window.MouseEvent('contextmenu', {
    bubbles: true,
    clientX: 100,
    clientY: 40
  }));
  let contextResponse = null;
  runtimeMessageListener(
    {
      action: 'runSelectionContextMenuAction',
      expectedText: 'serendipity',
      intent: 'translate'
    },
    {},
    (response) => { contextResponse = response; }
  );
  assert(contextResponse && contextResponse.ok === true);
  assert.strictEqual(sentMessages.at(-1).action, 'runSelectionQuickAction');
  assert.strictEqual(sentMessages.at(-1).intent, 'translate');

  const editable = window.document.getElementById('editable');
  const editableRange = window.document.createRange();
  editableRange.selectNodeContents(editable);
  selection.removeAllRanges();
  selection.addRange(editableRange);
  editable.dispatchEvent(new window.MouseEvent('contextmenu', {
    bubbles: true,
    clientX: 100,
    clientY: 70
  }));
  let sensitiveResponse = null;
  runtimeMessageListener(
    {
      action: 'runSelectionContextMenuAction',
      expectedText: 'private draft',
      intent: 'ask'
    },
    {},
    (response) => { sensitiveResponse = response; }
  );
  assert(sensitiveResponse && sensitiveResponse.ok === false);
  assert.strictEqual(sensitiveResponse.reason, 'selection-unavailable');

  dom.window.close();
  console.log('selection quick actions DOM tests passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
