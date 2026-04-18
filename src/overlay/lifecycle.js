(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoOverlayLifecycle = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  function removeEventListener(target, eventName, listener, options) {
    if (!target || !listener || typeof target.removeEventListener !== 'function') {
      return;
    }
    target.removeEventListener(eventName, listener, options);
  }

  function removeStorageChangeListener(chromeStorage, listener) {
    if (!chromeStorage || !chromeStorage.onChanged || !listener) {
      return;
    }
    chromeStorage.onChanged.removeListener(listener);
  }

  function removeNodeById(doc, nodeId) {
    if (!doc || !nodeId || typeof doc.getElementById !== 'function') {
      return;
    }
    const node = doc.getElementById(nodeId);
    if (node && typeof node.remove === 'function') {
      node.remove();
    }
  }

  function cleanupOverlay(options) {
    const settings = options && typeof options === 'object' ? options : {};
    const overlayElement = settings.overlayElement || null;
    const doc = settings.documentTarget || null;
    const win = settings.windowTarget || null;
    const chromeStorage = settings.chromeStorage || null;
    const overlayMediaQuery = settings.overlayMediaQuery || null;

    if (typeof settings.clearOverlayEnterAnimationFrames === 'function') {
      settings.clearOverlayEnterAnimationFrames();
    }
    if (typeof settings.clearSiteSearchShellAnimation === 'function') {
      settings.clearSiteSearchShellAnimation();
    }
    if (typeof settings.stopOverlayViewportSizeSync === 'function') {
      settings.stopOverlayViewportSizeSync();
    }
    if (typeof settings.stopOverlayAntiTranslateObserver === 'function') {
      settings.stopOverlayAntiTranslateObserver();
    }

    if (settings.aiModeDecor && typeof settings.aiModeDecor.destroy === 'function') {
      settings.aiModeDecor.destroy();
    }
    if (settings.aiModeSweep && typeof settings.aiModeSweep.destroy === 'function') {
      settings.aiModeSweep.destroy();
    }

    if (overlayElement && typeof overlayElement.remove === 'function') {
      overlayElement.remove();
    }

    removeNodeById(doc, '_x_extension_scrollbar_style_2024_unique_');
    removeNodeById(doc, '_x_extension_overlay_theme_style_2024_unique_');

    removeEventListener(doc, 'keydown', settings.captureTabHandler, true);
    removeEventListener(doc, 'keydown', settings.keydownHandler);
    removeEventListener(doc, 'click', settings.clickOutsideHandler);
    removeEventListener(win, 'keydown', settings.overlayKeyCaptureHandler, true);

    removeStorageChangeListener(chromeStorage, settings.overlayThemeStorageListener);
    removeStorageChangeListener(chromeStorage, settings.overlayLanguageStorageListener);
    removeStorageChangeListener(chromeStorage, settings.overlaySearchEngineStorageListener);
    removeStorageChangeListener(chromeStorage, settings.overlaySearchResultPriorityStorageListener);
    removeStorageChangeListener(chromeStorage, settings.overlaySearchBlacklistStorageListener);
    removeStorageChangeListener(chromeStorage, settings.overlayTabPriorityStorageListener);
    removeStorageChangeListener(chromeStorage, settings.overlayTabScoreDebugStorageListener);
    removeStorageChangeListener(chromeStorage, settings.overlaySizeStorageListener);
    removeStorageChangeListener(chromeStorage, settings.siteSearchStorageListener);

    removeEventListener(overlayMediaQuery, 'change', settings.overlayThemeMediaListener);
    removeEventListener(win, 'scroll', settings.overlayScrollPauseHandler, true);
    removeEventListener(win, 'wheel', settings.overlayScrollPauseHandler, true);
    removeEventListener(win, 'touchmove', settings.overlayScrollPauseHandler, true);
    removeEventListener(win, 'resize', settings.updateSiteSearchPrefixLayout);

    if (typeof settings.stopOverlayPageThemeObserver === 'function') {
      settings.stopOverlayPageThemeObserver();
    }

    return {
      aiModeDecor: null,
      aiModeSweep: null,
      aiModeSweepActive: false,
      captureTabHandler: null,
      keydownHandler: null,
      clickOutsideHandler: null,
      overlayKeyCaptureHandler: null,
      overlayThemeStorageListener: null,
      overlayLanguageStorageListener: null,
      overlaySearchEngineStorageListener: null,
      overlaySearchResultPriorityStorageListener: null,
      overlaySearchBlacklistStorageListener: null,
      overlayTabPriorityStorageListener: null,
      overlayTabScoreDebugStorageListener: null,
      overlaySizeStorageListener: null,
      overlayThemeMediaListener: null,
      overlayScrollPauseHandler: null,
      siteSearchStorageListener: null
    };
  }

  return Object.freeze({
    cleanupOverlay,
    removeEventListener,
    removeNodeById,
    removeStorageChangeListener
  });
});
