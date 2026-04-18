(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoOverlayShell = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  function createOverlayElement(doc, options) {
    const settings = options && typeof options === 'object' ? options : {};
    const overlay = doc.createElement('div');
    overlay.id = settings.id || '_x_extension_overlay_2024_unique_';
    const width = Number(settings.width) || 760;
    const maxHeightVh = Number(settings.maxHeightVh) || 75;
    overlay.style.cssText = `
      all: unset !important;
      position: fixed !important;
      top: 20vh !important;
      left: 50% !important;
      transform: translateX(-50%) translateY(10px) scale(0.985) !important;
      transform-origin: top center !important;
      width: ${width}px !important;
      max-width: calc(100vw - 24px) !important;
      max-height: ${maxHeightVh}vh !important;
      background: var(--x-ov-bg, rgba(255, 255, 255, 0.95)) !important;
      backdrop-filter: blur(var(--x-ov-blur, 24px)) saturate(var(--x-ov-saturate, 165%)) !important;
      -webkit-backdrop-filter: blur(var(--x-ov-blur, 24px)) saturate(var(--x-ov-saturate, 165%)) !important;
      border: 1px solid var(--x-ov-border, rgba(0, 0, 0, 0.08)) !important;
      border-radius: 28px !important;
      box-shadow: var(--x-ov-shadow, 0 17px 120px 0 rgba(0, 0, 0, 0.05), 0 32px 44.5px 0 rgba(0, 0, 0, 0.10), 0 80px 120px 0 rgba(0, 0, 0, 0.15)) !important;
      z-index: 2147483647 !important;
      font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      overflow: hidden !important;
      contain: layout style !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: 0 !important;
      line-height: 1 !important;
      text-decoration: none !important;
      list-style: none !important;
      outline: none !important;
      color: var(--x-ov-text, #111827) !important;
      font-size: 100% !important;
      font: inherit !important;
      vertical-align: baseline !important;
      opacity: 0 !important;
      filter: blur(6px) !important;
      will-change: transform, opacity, filter !important;
      transition: transform 340ms cubic-bezier(0.2, 1, 0.36, 1), opacity 220ms ease, filter 300ms ease !important;
    `;
    return overlay;
  }

  function appendOverlayStyleNodes(doc) {
    const head = doc && doc.head ? doc.head : null;
    if (!head) {
      return;
    }

    const scrollbarStyle = doc.createElement('style');
    scrollbarStyle.id = '_x_extension_scrollbar_style_2024_unique_';
    scrollbarStyle.textContent = `
      #_x_extension_overlay_2024_unique_ *::-webkit-scrollbar {
        display: none !important;
      }
      #_x_extension_overlay_2024_unique_ * {
        -ms-overflow-style: none !important;
        scrollbar-width: none !important;
      }
    `;
    head.appendChild(scrollbarStyle);

    const overlayThemeStyle = doc.createElement('style');
    overlayThemeStyle.id = '_x_extension_overlay_theme_style_2024_unique_';
    overlayThemeStyle.textContent = `
      #_x_extension_overlay_2024_unique_ .ri-icon {
        width: var(--ri-size, 16px);
        height: var(--ri-size, 16px);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        font-size: var(--ri-size, 16px);
        flex-shrink: 0;
        font-style: normal !important;
        font-variant: normal !important;
        text-transform: none !important;
      }
      #_x_extension_overlay_2024_unique_ button .ri-icon,
      #_x_extension_overlay_2024_unique_ [role="button"] .ri-icon,
      #_x_extension_overlay_2024_unique_ a .ri-icon {
        cursor: inherit !important;
        pointer-events: none !important;
      }
      #_x_extension_overlay_2024_unique_ .ri-icon::before {
        font-style: normal !important;
        font-variant: normal !important;
        text-transform: none !important;
      }
      #_x_extension_overlay_2024_unique_ .ri-size-8 { --ri-size: 8px; }
      #_x_extension_overlay_2024_unique_ .ri-size-12 { --ri-size: 12px; }
      #_x_extension_overlay_2024_unique_ .ri-size-16 { --ri-size: 16px; }
      #_x_extension_overlay_2024_unique_ .ri-size-20 { --ri-size: 20px; }
      #_x_extension_overlay_2024_unique_ .ri-size-24 { --ri-size: 24px; }
      #_x_extension_search_input_2024_unique_ {
        text-align: left !important;
      }
      #_x_extension_search_input_2024_unique_::placeholder {
        color: var(--x-ov-placeholder, #9CA3AF) !important;
        opacity: 0.68 !important;
        text-align: left !important;
      }
      #_x_extension_search_input_2024_unique_::-webkit-input-placeholder {
        color: var(--x-ov-placeholder, #9CA3AF) !important;
        opacity: 0.68 !important;
      }
      #_x_extension_search_input_2024_unique_::selection {
        background: #CFE8FF !important;
        color: #1E3A8A !important;
      }
    `;
    head.appendChild(overlayThemeStyle);
  }

  return Object.freeze({
    appendOverlayStyleNodes,
    createOverlayElement
  });
});
