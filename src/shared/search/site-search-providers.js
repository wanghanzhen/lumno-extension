(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoSiteSearchProviders = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const BUILTIN_PROVIDER_MESSAGE_MAP = Object.freeze({
    so: Object.freeze({ messageKey: 'site_search_name_baidu', fallback: 'Baidu' }),
    zh: Object.freeze({ messageKey: 'site_search_name_zhihu', fallback: 'Zhihu' }),
    db: Object.freeze({ messageKey: 'site_search_name_douban', fallback: 'Douban' }),
    jd: Object.freeze({ messageKey: 'site_search_name_juejin', fallback: 'Juejin' }),
    jj: Object.freeze({ messageKey: 'site_search_name_juejin', fallback: 'Juejin' }),
    tb: Object.freeze({ messageKey: 'site_search_name_taobao', fallback: 'Taobao' }),
    tm: Object.freeze({ messageKey: 'site_search_name_tmall', fallback: 'Tmall' }),
    wx: Object.freeze({ messageKey: 'site_search_name_wechat', fallback: 'WeChat' }),
    zw: Object.freeze({ messageKey: 'site_search_name_wikipedia', fallback: 'Wikipedia' })
  });

  function getBuiltinProviderMessage(providerKey) {
    const normalizedKey = String(providerKey || '').trim().toLowerCase();
    return BUILTIN_PROVIDER_MESSAGE_MAP[normalizedKey] || null;
  }

  function getSiteSearchDisplayName(provider, translate, defaultText) {
    const fallbackText = defaultText || '站内';
    if (!provider) {
      return fallbackText;
    }
    const messageInfo = getBuiltinProviderMessage(provider.key);
    if (messageInfo) {
      if (typeof translate === 'function') {
        return translate(messageInfo.messageKey, messageInfo.fallback);
      }
      return messageInfo.fallback;
    }
    return provider.name || provider.key || fallbackText;
  }

  return Object.freeze({
    BUILTIN_PROVIDER_MESSAGE_MAP,
    getBuiltinProviderMessage,
    getSiteSearchDisplayName
  });
});
