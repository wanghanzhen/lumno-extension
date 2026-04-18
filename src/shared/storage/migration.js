(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoStorageMigration = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  function hasDefinedKey(source, key) {
    return Boolean(source) && typeof source[key] !== 'undefined';
  }

  function buildMigrationPayload(keys, localResult, syncResult, options) {
    const sourceKeys = Array.isArray(keys) ? keys : [];
    const localData = localResult && typeof localResult === 'object' ? localResult : {};
    const syncData = syncResult && typeof syncResult === 'object' ? syncResult : {};
    const skipKeys = new Set(
      Array.isArray(options && options.skipKeys)
        ? options.skipKeys.map((key) => String(key))
        : []
    );
    const payload = {};
    let hasLocalData = false;
    let hasSyncData = false;

    sourceKeys.forEach((rawKey) => {
      const key = String(rawKey);
      const shouldSkip = skipKeys.has(key);
      if (!shouldSkip && hasDefinedKey(localData, key)) {
        hasLocalData = true;
        payload[key] = localData[key];
      }
      if (!shouldSkip && hasDefinedKey(syncData, key)) {
        hasSyncData = true;
      }
    });

    if (!hasLocalData || hasSyncData) {
      return null;
    }
    return Object.keys(payload).length > 0 ? payload : null;
  }

  return {
    buildMigrationPayload
  };
});
