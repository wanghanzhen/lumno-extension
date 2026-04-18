(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoSearchFavicons = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  function normalizeFaviconHost(hostname) {
    if (!hostname) {
      return '';
    }
    const host = String(hostname).toLowerCase().replace(/^www\./i, '');
    if (host === 'feishu.cn' || host.endsWith('.feishu.cn')) {
      return 'feishu.cn';
    }
    return host;
  }

  function getGoogleFaviconUrl(hostname, options) {
    const normalized = normalizeFaviconHost(hostname);
    const settings = options && typeof options === 'object' ? options : {};
    if (!normalized) {
      return '';
    }
    if (normalized === 'lumno.kubai.design') {
      if (typeof settings.runtimeGetUrl === 'function') {
        return settings.runtimeGetUrl('public/assets/images/lumno.png');
      }
      return 'https://lumno.kubai.design/favicon.png';
    }
    const size = Number.isFinite(Number(settings.size)) ? Number(settings.size) : 128;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(normalized)}&sz=${size}`;
  }

  function getFaviconIsUrl(hostname) {
    const normalized = normalizeFaviconHost(hostname);
    if (!normalized) {
      return '';
    }
    return `https://favicon.is/${encodeURIComponent(normalized)}`;
  }

  function normalizeProviderHost(hostname) {
    if (!hostname) {
      return '';
    }
    return String(hostname).trim().toLowerCase().replace(/^www\./i, '');
  }

  function getSiteSearchProviderHost(provider) {
    if (!provider || !provider.template) {
      return '';
    }
    try {
      const resolvedUrl = String(provider.template).replace(/\{query\}/g, 'test');
      return normalizeProviderHost(new URL(resolvedUrl).hostname);
    } catch (error) {
      return '';
    }
  }

  function getSiteSearchProviderIconUrl(provider, options) {
    const settings = options && typeof options === 'object' ? options : {};
    if (provider && provider.icon) {
      return String(provider.icon).trim();
    }
    if (provider && provider.iconUrl) {
      return String(provider.iconUrl).trim();
    }
    const host = getSiteSearchProviderHost(provider);
    if (!host) {
      return '';
    }
    const googleFaviconUrl = getGoogleFaviconUrl(host, settings);
    if (googleFaviconUrl) {
      return googleFaviconUrl;
    }
    return settings.includeFaviconIsFallback ? getFaviconIsUrl(host) : '';
  }

  return Object.freeze({
    getFaviconIsUrl,
    getGoogleFaviconUrl,
    getSiteSearchProviderHost,
    getSiteSearchProviderIconUrl,
    normalizeFaviconHost,
    normalizeProviderHost
  });
});
