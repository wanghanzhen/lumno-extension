(function() {
  if (window._x_extension_createSearchInput_2024_unique_) {
    return;
  }

  function applyStyleOverrides(element, overrides) {
    if (!overrides) {
      return;
    }
    Object.keys(overrides).forEach((property) => {
      element.style.setProperty(property, overrides[property], 'important');
    });
  }

  function applyNoTranslate(element) {
    if (!element || !element.setAttribute) {
      return element;
    }
    element.setAttribute('translate', 'no');
    element.setAttribute('lang', 'zxx');
    element.setAttribute('data-no-translate', 'true');
    if (element.classList) {
      element.classList.add('notranslate');
    }
    return element;
  }

  function getMessage(key, fallback) {
    try {
      if (chrome && chrome.i18n && typeof chrome.i18n.getMessage === 'function') {
        const value = chrome.i18n.getMessage(key);
        if (value) {
          return value;
        }
      }
    } catch (error) {
      // Ignore i18n failures in page context.
    }
    return fallback;
  }

  let borderBeamInstanceCounter = 0;
  let aiSweepInstanceCounter = 0;

  function clampNumber(value, fallback, min, max) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, numeric));
  }

  function readResolvedThemeToken(element) {
    if (!element || typeof element.getAttribute !== 'function') {
      return '';
    }
    const value = String(element.getAttribute('data-theme') || '').toLowerCase();
    return value === 'dark' || value === 'light' ? value : '';
  }

  function resolveBorderBeamTheme(themeValue, target, themeTarget) {
    const explicitTheme = String(themeValue || '').toLowerCase();
    if (explicitTheme === 'dark' || explicitTheme === 'light') {
      return explicitTheme;
    }
    const resolvedTheme = readResolvedThemeToken(themeTarget) ||
      readResolvedThemeToken(target) ||
      readResolvedThemeToken(document.body) ||
      readResolvedThemeToken(document.documentElement);
    if (resolvedTheme) {
      return resolvedTheme;
    }
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (error) {
      return 'light';
    }
  }

  function withAlpha(color, alpha) {
    const rgbaMatch = String(color || '').match(
      /^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*[\d.]+\s*\)$/
    );
    if (rgbaMatch) {
      return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${alpha})`;
    }
    const rgbMatch = String(color || '').match(
      /^rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/
    );
    if (rgbMatch) {
      return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${alpha})`;
    }
    return color;
  }

  function createSvgElement(tagName) {
    return document.createElementNS('http://www.w3.org/2000/svg', tagName);
  }

  // Adapted from the MIT-licensed border-beam package by Jakub Antalik.
  const BORDER_BEAM_LINE_THEME_PRESETS = {
    dark: {
      strokeOpacity: 0.72,
      innerOpacity: 0.7,
      bloomOpacity: 0.8,
      innerShadow: 'rgba(255, 255, 255, 0.1)',
      saturation: 1.2
    },
    light: {
      strokeOpacity: 0.72,
      innerOpacity: 0.7,
      bloomOpacity: 0.8,
      innerShadow: 'rgba(0, 0, 0, 0.14)',
      saturation: 1.2
    }
  };

  const BORDER_BEAM_MEDIUM_COLORFUL_BORDER = [
    { color: 'rgb(255, 50, 100)', pos: '33% -7.4%', size: '70px 40px' },
    { color: 'rgb(40, 140, 255)', pos: '12% -5%', size: '60px 35px' },
    { color: 'rgb(50, 200, 80)', pos: '2.1% 68.3%', size: '40px 70px' },
    { color: 'rgb(30, 185, 170)', pos: '2.1% 68.3%', size: '20px 35px' },
    { color: 'rgb(100, 70, 255)', pos: '74.4% 100%', size: '180px 32px' },
    { color: 'rgb(40, 140, 255)', pos: '55% 100%', size: '85px 26px' },
    { color: 'rgb(255, 120, 40)', pos: '93.9% 0%', size: '74px 32px' },
    { color: 'rgb(240, 50, 180)', pos: '100% 27.1%', size: '26px 42px' },
    { color: 'rgb(180, 40, 240)', pos: '100% 27.1%', size: '52px 48px' }
  ];

  const BORDER_BEAM_LINE_COLORFUL = {
    border: [
      { color: 'rgb(50, 200, 80)', pos: '2% 68%', size: '9px 18px' },
      { color: 'rgb(30, 185, 170)', pos: '2% 68%', size: '4px 8px' },
      { color: 'rgb(255, 120, 40)', pos: '72% -3%', size: '59px 9px' },
      { color: 'rgb(100, 70, 255)', pos: '74% 100%', size: '42px 7px' },
      { color: 'rgb(240, 50, 180)', pos: '100% 27%', size: '10px 17px' },
      { color: 'rgb(180, 40, 240)', pos: '100% 27%', size: '10px 18px' },
      { color: 'rgb(40, 140, 255)', pos: '100% 27%', size: '5px 10px' },
      { color: 'rgb(255, 50, 100)', pos: '100% 27%', size: '11px 12px' }
    ],
    inner: [
      { color: 'rgba(50, 200, 80, 0.5)', pos: '2% 68%', size: '9px 18px' },
      { color: 'rgba(30, 185, 170, 0.45)', pos: '2% 68%', size: '4px 8px' },
      { color: 'rgba(255, 120, 40, 0.35)', pos: '72% -3%', size: '59px 9px' },
      { color: 'rgba(100, 70, 255, 0.35)', pos: '74% 100%', size: '42px 7px' },
      { color: 'rgba(240, 50, 180, 0.3)', pos: '100% 27%', size: '10px 17px' },
      { color: 'rgba(180, 40, 240, 0.4)', pos: '100% 27%', size: '10px 18px' },
      { color: 'rgba(40, 140, 255, 0.3)', pos: '100% 27%', size: '5px 10px' },
      { color: 'rgba(255, 50, 100, 0.3)', pos: '100% 27%', size: '11px 12px' }
    ],
    edgeDark: [
      { color: 'rgb(255, 50, 100)', sizeW: 36, sizeH: 36, offsetX: 0, offsetY: 2 },
      { color: 'rgb(40, 180, 220)', sizeW: 30, sizeH: 32, offsetX: 39, offsetY: 0 },
      { color: 'rgb(50, 200, 80)', sizeW: 33, sizeH: 28, offsetX: -36, offsetY: 2 },
      { color: 'rgb(180, 40, 240)', sizeW: 29, sizeH: 34, offsetX: -54, offsetY: 0 },
      { color: 'rgb(255, 160, 30)', sizeW: 27, sizeH: 30, offsetX: 51, offsetY: -1 },
      { color: 'rgb(100, 70, 255)', sizeW: 36, sizeH: 24, offsetX: 21, offsetY: 1 },
      { color: 'rgb(40, 140, 255)', sizeW: 30, sizeH: 22, offsetX: -21, offsetY: 0 },
      { color: 'rgb(240, 50, 180)', sizeW: 25, sizeH: 28, offsetX: 66, offsetY: 1 },
      { color: 'rgb(30, 185, 170)', sizeW: 23, sizeH: 30, offsetX: -66, offsetY: -1 }
    ],
    edgeLight: [
      { color: 'rgb(255, 50, 100)', sizeW: 45, sizeH: 36, offsetX: 0, offsetY: 2 },
      { color: 'rgb(40, 140, 255)', sizeW: 35, sizeH: 32, offsetX: 65, offsetY: 0 },
      { color: 'rgb(50, 200, 80)', sizeW: 40, sizeH: 28, offsetX: -60, offsetY: 2 },
      { color: 'rgb(180, 40, 240)', sizeW: 35, sizeH: 34, offsetX: -90, offsetY: 0 },
      { color: 'rgb(30, 185, 170)', sizeW: 38, sizeH: 30, offsetX: 85, offsetY: -1 },
      { color: 'rgb(100, 70, 255)', sizeW: 50, sizeH: 24, offsetX: 35, offsetY: 1 },
      { color: 'rgb(40, 140, 255)', sizeW: 40, sizeH: 22, offsetX: -35, offsetY: 0 },
      { color: 'rgb(255, 120, 40)', sizeW: 35, sizeH: 28, offsetX: 110, offsetY: 1 },
      { color: 'rgb(240, 50, 180)', sizeW: 30, sizeH: 30, offsetX: -110, offsetY: -1 }
    ],
    glow: [
      { color: 'rgba(255, 50, 100, 0.48)', sizeW: 33, sizeH: 30, offsetX: 0, offsetY: 0 },
      { color: 'rgba(40, 180, 220, 0.42)', sizeW: 24, sizeH: 26, offsetX: 39, offsetY: -3 },
      { color: 'rgba(50, 200, 80, 0.48)', sizeW: 27, sizeH: 24, offsetX: -36, offsetY: 0 },
      { color: 'rgba(180, 40, 240, 0.42)', sizeW: 23, sizeH: 28, offsetX: -54, offsetY: -2 },
      { color: 'rgba(255, 160, 30, 0.50)', sizeW: 24, sizeH: 24, offsetX: 51, offsetY: -1 },
      { color: 'rgba(100, 70, 255, 0.45)', sizeW: 30, sizeH: 20, offsetX: 21, offsetY: 0 },
      { color: 'rgba(40, 140, 255, 0.40)', sizeW: 25, sizeH: 18, offsetX: -21, offsetY: -2 },
      { color: 'rgba(240, 50, 180, 0.45)', sizeW: 21, sizeH: 24, offsetX: 66, offsetY: 0 },
      { color: 'rgba(30, 185, 170, 0.52)', sizeW: 18, sizeH: 26, offsetX: -66, offsetY: -1 }
    ],
    spikeDark: {
      primary: 'rgb(255, 60, 80)',
      secondary: 'rgba(40, 190, 180, 0.98)'
    },
    spikeLight: {
      primary: 'rgb(200, 30, 60)',
      secondary: 'rgb(20, 150, 140)'
    },
    bloomDark: [
      { color1: 'rgb(100, 70, 255)', color2: 'rgba(100, 70, 255, 1)' },
      { color1: 'rgba(255, 170, 40, 0.59)', color2: 'rgba(255, 170, 40, 0.29)' },
      { color1: 'rgb(50, 200, 100)', color2: 'rgba(50, 200, 100, 1)' },
      { color1: 'rgba(200, 50, 240, 0.91)', color2: 'rgba(200, 50, 240, 0.45)' },
      { color1: 'rgb(40, 140, 255)', color2: 'rgba(40, 140, 255, 1)' }
    ],
    bloomLight: [
      { color1: 'rgb(80, 50, 200)', color2: 'rgba(80, 50, 200, 0.8)' },
      { color1: 'rgba(210, 130, 0, 0.7)', color2: 'rgba(210, 130, 0, 0.46)' },
      { color1: 'rgb(30, 160, 70)', color2: 'rgba(30, 160, 70, 0.82)' },
      { color1: 'rgb(160, 30, 190)', color2: 'rgba(160, 30, 190, 0.7)' },
      { color1: 'rgb(30, 100, 200)', color2: 'rgba(30, 100, 200, 0.78)' }
    ]
  };

  function buildOffsetExpression(axisValue) {
    if (!axisValue) {
      return '';
    }
    return axisValue > 0 ? ` + ${axisValue}px` : ` - ${Math.abs(axisValue)}px`;
  }

  function parseBeamSizePair(size) {
    const parts = String(size || '').trim().split(/\s+/);
    return {
      width: clampNumber(parseFloat(parts[0]), 0, 0, 4000),
      height: clampNumber(parseFloat(parts[1]), 0, 0, 4000)
    };
  }

  function buildMediumScaledEllipse(size, id, factor) {
    const pair = parseBeamSizePair(size);
    const scaleFactor = Number.isFinite(Number(factor)) ? Number(factor) : 1;
    const width = Math.round(pair.width * scaleFactor * 10) / 10;
    const height = Math.round(pair.height * scaleFactor * 10) / 10;
    return `calc(${width}px * var(--beam-scale-x-${id}, 1)) calc(${height}px * var(--beam-scale-y-${id}, 1))`;
  }

  function computeBorderBeamAdaptiveScale(width, height) {
    const safeWidth = Math.max(280, Number.isFinite(width) ? width : 0);
    const safeHeight = Math.max(120, Number.isFinite(height) ? height : 0);
    const referenceWidth = 760;
    const referenceHeight = 320;
    const referencePerimeter = (referenceWidth + referenceHeight) * 2;
    const currentPerimeter = (safeWidth + safeHeight) * 2;
    const widthScale = Math.pow(safeWidth / referenceWidth, 0.42);
    const heightScale = Math.pow(safeHeight / referenceHeight, 0.38);
    const densityScale = Math.pow(currentPerimeter / referencePerimeter, 0.18);
    const scaleX = clampNumber(widthScale * densityScale, 1, 0.95, 2.2);
    const scaleY = clampNumber(heightScale * densityScale, 1, 0.95, 1.9);
    const blur = clampNumber(8 + ((scaleX + scaleY) / 2 - 1) * 3.8, 8, 8, 12.5);
    return {
      scaleX: scaleX,
      scaleY: scaleY,
      blur: blur
    };
  }

  function buildLineBorderGradient(theme, id) {
    const items = theme === 'dark'
      ? BORDER_BEAM_LINE_COLORFUL.edgeDark
      : BORDER_BEAM_LINE_COLORFUL.edgeLight;
    return items.map((item) => {
      const offsetX = buildOffsetExpression(item.offsetX);
      const offsetY = buildOffsetExpression(item.offsetY);
      return `radial-gradient(ellipse calc(${item.sizeW}px * var(--beam-w-${id})) calc(${item.sizeH}px * var(--beam-h-${id})) at calc(var(--beam-x-${id}) * 100%${offsetX}) calc(100%${offsetY}), ${item.color}, transparent)`;
    }).join(',\n       ');
  }

  function buildMediumBorderGradient(id) {
    return BORDER_BEAM_MEDIUM_COLORFUL_BORDER.map((item) => {
      return `radial-gradient(ellipse ${buildMediumScaledEllipse(item.size, id, 1)} at ${item.pos}, ${item.color}, transparent)`;
    }).join(',\n    ');
  }

  function buildMediumInnerGradient(id) {
    return BORDER_BEAM_MEDIUM_COLORFUL_BORDER.map((item) => {
      return `radial-gradient(ellipse ${buildMediumScaledEllipse(item.size, id, 0.9)} at ${item.pos}, ${withAlpha(item.color, 0.45)}, transparent)`;
    }).join(',\n    ');
  }

  function buildMediumBaseRingGradient(theme) {
    if (theme === 'dark') {
      return `conic-gradient(
        from -12deg,
        rgba(255, 120, 40, 0.16) 0deg,
        rgba(255, 70, 145, 0.24) 42deg,
        rgba(50, 165, 255, 0.22) 98deg,
        rgba(45, 205, 150, 0.20) 156deg,
        rgba(90, 90, 255, 0.22) 216deg,
        rgba(212, 65, 230, 0.26) 286deg,
        rgba(255, 120, 40, 0.16) 360deg
      )`;
    }
    return `conic-gradient(
      from -12deg,
      rgba(210, 120, 10, 0.10) 0deg,
      rgba(210, 45, 115, 0.15) 42deg,
      rgba(25, 110, 215, 0.13) 98deg,
      rgba(20, 150, 105, 0.11) 156deg,
      rgba(70, 60, 215, 0.13) 216deg,
      rgba(155, 35, 175, 0.15) 286deg,
      rgba(210, 120, 10, 0.10) 360deg
    )`;
  }

  function buildMediumBaseGlowGradient(theme) {
    if (theme === 'dark') {
      return `conic-gradient(
        from -8deg,
        transparent 0deg,
        rgba(255, 120, 40, 0.025) 36deg,
        rgba(255, 70, 145, 0.065) 78deg,
        rgba(50, 165, 255, 0.065) 136deg,
        rgba(45, 205, 150, 0.05) 196deg,
        rgba(90, 90, 255, 0.065) 258deg,
        rgba(212, 65, 230, 0.08) 320deg,
        transparent 360deg
      )`;
    }
    return `conic-gradient(
      from -8deg,
      transparent 0deg,
      rgba(210, 120, 10, 0.018) 36deg,
      rgba(210, 45, 115, 0.05) 78deg,
      rgba(25, 110, 215, 0.05) 136deg,
      rgba(20, 150, 105, 0.035) 196deg,
      rgba(70, 60, 215, 0.05) 258deg,
      rgba(155, 35, 175, 0.06) 320deg,
      transparent 360deg
    )`;
  }

  function buildMediumEdgeGradient(theme, id) {
    return theme === 'dark'
      ? `conic-gradient(
        from var(--beam-angle-${id}),
        transparent 0%, transparent 54%,
        rgba(255, 255, 255, 0.1) 57%,
        rgba(255, 255, 255, 0.3) 60%,
        rgba(255, 255, 255, 0.6) 63%,
        rgba(255, 255, 255, 0.75) 66%,
        rgba(255, 255, 255, 0.6) 69%,
        rgba(255, 255, 255, 0.3) 72%,
        rgba(255, 255, 255, 0.1) 75%,
        transparent 78%, transparent 100%
      )`
      : `conic-gradient(
        from var(--beam-angle-${id}),
        transparent 0%, transparent 54%,
        rgba(0, 0, 0, 0.08) 57%,
        rgba(0, 0, 0, 0.2) 60%,
        rgba(0, 0, 0, 0.4) 63%,
        rgba(0, 0, 0, 0.55) 66%,
        rgba(0, 0, 0, 0.4) 69%,
        rgba(0, 0, 0, 0.2) 72%,
        rgba(0, 0, 0, 0.08) 75%,
        transparent 78%, transparent 100%
      )`;
  }

  function buildMediumBloomGradient(theme, id) {
    return theme === 'dark'
      ? `conic-gradient(
        from var(--beam-angle-${id}),
        transparent 0%, transparent 58%,
        rgba(255, 255, 255, 0.03) 62%,
        rgba(255, 255, 255, 0.08) 65%,
        rgba(255, 255, 255, 0.2) 67%,
        rgba(255, 255, 255, 0.45) 69%,
        rgba(255, 255, 255, 0.85) 70%,
        rgba(255, 255, 255, 0.85) 70.5%,
        rgba(255, 255, 255, 0.45) 71.5%,
        rgba(255, 255, 255, 0.2) 73%,
        rgba(255, 255, 255, 0.08) 75%,
        rgba(255, 255, 255, 0.03) 78%,
        transparent 82%
      )`
      : `conic-gradient(
        from var(--beam-angle-${id}),
        transparent 0%, transparent 58%,
        rgba(0, 0, 0, 0.02) 62%,
        rgba(0, 0, 0, 0.08) 65%,
        rgba(0, 0, 0, 0.2) 67%,
        rgba(0, 0, 0, 0.4) 69%,
        rgba(0, 0, 0, 0.6) 70%,
        rgba(0, 0, 0, 0.6) 70.5%,
        rgba(0, 0, 0, 0.4) 71.5%,
        rgba(0, 0, 0, 0.2) 73%,
        rgba(0, 0, 0, 0.08) 75%,
        rgba(0, 0, 0, 0.02) 78%,
        transparent 82%
      )`;
  }

  function buildBorderBeamMediumStyle(config) {
    const id = config.id;
    const theme = config.theme === 'dark' ? 'dark' : 'light';
    const borderRadius = clampNumber(config.borderRadius, 36, 0, 999);
    const borderWidth = clampNumber(config.borderWidth, 1, 1, 6);
    const duration = clampNumber(config.duration, 1.96, 0.5, 30);
    const preset = BORDER_BEAM_LINE_THEME_PRESETS[theme];
    const brightness = clampNumber(config.brightness, 1.3, 0.1, 5);
    const saturation = clampNumber(config.saturation, theme === 'dark' ? 1.2 : 0.96, 0.1, 5);
    const hueRange = clampNumber(config.hueRange, 30, 0, 60);
    const glowRadius = Math.max(0, borderRadius - borderWidth);
    const edgeGradient = buildMediumEdgeGradient(theme, id);
    const borderGradient = buildMediumBorderGradient(id);
    const innerGradient = buildMediumInnerGradient(id);
    const baseRingGradient = buildMediumBaseRingGradient(theme);
    const baseGlowGradient = buildMediumBaseGlowGradient(theme);
    const bloomGradient = buildMediumBloomGradient(theme, id);
    return `
@property --beam-angle-${id} {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: true;
}

@property --beam-opacity-${id} {
  syntax: "<number>";
  initial-value: 0;
  inherits: true;
}

[data-beam="${id}"] {
  position: relative;
  border-radius: ${borderRadius}px;
  overflow: hidden;
}

[data-beam="${id}"][data-active] {
  animation:
    beam-spin-${id} ${duration}s linear infinite,
    beam-fade-in-${id} 0.6s ease forwards;
}

[data-beam="${id}"][data-fading] {
  animation:
    beam-spin-${id} ${duration}s linear infinite,
    beam-fade-out-${id} 0.5s ease forwards;
}

[data-beam="${id}"][data-active]::after,
[data-beam="${id}"][data-fading]::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: ${glowRadius}px;
  padding: ${borderWidth}px;
  clip-path: inset(0 round ${borderRadius}px);
  background: ${edgeGradient}, ${baseRingGradient}, ${borderGradient};
  -webkit-mask:
    conic-gradient(
      from var(--beam-angle-${id}),
      transparent 0%, transparent 30%,
      rgba(255, 255, 255, 0.1) 36%, rgba(255, 255, 255, 0.35) 44%,
      white 52%, white 80%,
      rgba(255, 255, 255, 0.35) 86%, rgba(255, 255, 255, 0.1) 92%,
      transparent 95%, transparent 100%
    ),
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: source-in, xor;
  mask:
    conic-gradient(
      from var(--beam-angle-${id}),
      transparent 0%, transparent 30%,
      rgba(255, 255, 255, 0.1) 36%, rgba(255, 255, 255, 0.35) 44%,
      white 52%, white 80%,
      rgba(255, 255, 255, 0.35) 86%, rgba(255, 255, 255, 0.1) 92%,
      transparent 95%, transparent 100%
    ),
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: intersect, exclude;
  pointer-events: none;
  z-index: 2;
  opacity: calc(var(--beam-opacity-${id}) * ${preset.strokeOpacity.toFixed(2)} * var(--beam-strength, 1));
  animation: beam-hue-shift-${id} 12s ease-in-out infinite;
}

[data-beam="${id}"][data-active]::before,
[data-beam="${id}"][data-fading]::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: ${borderRadius}px;
  background: ${baseRingGradient}, ${innerGradient};
  box-shadow: inset 0 0 9px 1px ${preset.innerShadow};
  -webkit-mask-image:
    conic-gradient(
      from var(--beam-angle-${id}),
      transparent 0%, transparent 30%,
      rgba(255, 255, 255, 0.1) 36%, rgba(255, 255, 255, 0.35) 44%,
      white 52%, white 80%,
      rgba(255, 255, 255, 0.35) 86%, rgba(255, 255, 255, 0.1) 92%,
      transparent 95%, transparent 100%
    ),
    linear-gradient(white, transparent 28px, transparent calc(100% - 28px), white),
    linear-gradient(to right, white, transparent 28px, transparent calc(100% - 28px), white);
  -webkit-mask-composite: source-in, source-over;
  mask-image:
    conic-gradient(
      from var(--beam-angle-${id}),
      transparent 0%, transparent 30%,
      rgba(255, 255, 255, 0.1) 36%, rgba(255, 255, 255, 0.35) 44%,
      white 52%, white 80%,
      rgba(255, 255, 255, 0.35) 86%, rgba(255, 255, 255, 0.1) 92%,
      transparent 95%, transparent 100%
    ),
    linear-gradient(white, transparent 28px, transparent calc(100% - 28px), white),
    linear-gradient(to right, white, transparent 28px, transparent calc(100% - 28px), white);
  mask-composite: intersect, add;
  pointer-events: none;
  z-index: 1;
  opacity: calc(var(--beam-opacity-${id}) * ${preset.innerOpacity.toFixed(2)} * var(--beam-strength, 1));
  clip-path: inset(0 round ${borderRadius}px);
  animation: beam-hue-shift-${id} 12s ease-in-out infinite;
}

[data-beam="${id}"] [data-beam-bloom] {
  display: none;
  position: absolute;
  inset: 0;
  border-radius: ${glowRadius}px;
  clip-path: inset(0 round ${borderRadius}px);
  background: ${baseGlowGradient}, ${bloomGradient};
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  padding: ${borderWidth}px;
  filter: blur(var(--beam-blur-${id}, 8px)) brightness(${brightness.toFixed(2)}) saturate(${saturation.toFixed(2)});
  pointer-events: none;
  z-index: 3;
  opacity: 0;
}

[data-beam="${id}"][data-active] [data-beam-bloom],
[data-beam="${id}"][data-fading] [data-beam-bloom] {
  display: block;
  opacity: calc(var(--beam-opacity-${id}) * ${preset.bloomOpacity.toFixed(2)} * var(--beam-strength, 1));
}

@keyframes beam-hue-shift-${id} {
  0% { filter: hue-rotate(-${hueRange}deg) brightness(${brightness.toFixed(2)}) saturate(${saturation.toFixed(2)}); }
  50% { filter: hue-rotate(${hueRange}deg) brightness(${brightness.toFixed(2)}) saturate(${saturation.toFixed(2)}); }
  100% { filter: hue-rotate(-${hueRange}deg) brightness(${brightness.toFixed(2)}) saturate(${saturation.toFixed(2)}); }
}

@keyframes beam-spin-${id} {
  to { --beam-angle-${id}: 360deg; }
}

@keyframes beam-fade-in-${id} {
  to { --beam-opacity-${id}: 1; }
}

@keyframes beam-fade-out-${id} {
  from { --beam-opacity-${id}: 1; }
  to { --beam-opacity-${id}: 0; }
}
`;
  }

  function buildLineInnerGradient(id) {
    return BORDER_BEAM_LINE_COLORFUL.glow.map((item) => {
      const offsetX = buildOffsetExpression(item.offsetX);
      const offsetY = item.offsetY === 0 ? '' : ` - ${Math.abs(item.offsetY)}px`;
      return `radial-gradient(ellipse calc(${item.sizeW}px * var(--beam-w-${id})) calc(${item.sizeH}px * var(--beam-h-${id})) at calc(var(--beam-x-${id}) * 100%${offsetX}) calc(100%${offsetY}), ${item.color}, transparent)`;
    }).join(',\n    ');
  }

  function buildLineBloomGradient(theme, id) {
    const spike = theme === 'dark'
      ? BORDER_BEAM_LINE_COLORFUL.spikeDark
      : BORDER_BEAM_LINE_COLORFUL.spikeLight;
    const palette = theme === 'dark'
      ? BORDER_BEAM_LINE_COLORFUL.bloomDark
      : BORDER_BEAM_LINE_COLORFUL.bloomLight;
    const primaryGlow = theme === 'dark' ? spike.primary : withAlpha(spike.primary, 0.85);
    const secondaryGlow = theme === 'dark' ? withAlpha(spike.secondary, 0.49) : withAlpha(spike.secondary, 0.7);
    const finalSpikeWidth = theme === 'dark' ? '0.6px' : '1px';
    const tailBloom = theme === 'dark'
      ? 'radial-gradient(ellipse calc(42px * var(--beam-w-${id})) calc(40px * var(--beam-h-${id})) at calc(var(--beam-x-${id}) * 100%) 100%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.12) 25%, rgba(255, 255, 255, 0.03) 55%, transparent 80%)'
      : 'radial-gradient(ellipse calc(50px * var(--beam-w-${id})) calc(32px * var(--beam-h-${id})) at calc(var(--beam-x-${id}) * 100%) calc(100%), rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.18) 30%, rgba(0, 0, 0, 0.03) 60%, transparent 85%)';
    return [
      `radial-gradient(ellipse calc(0.8px * var(--beam-spike-${id})) calc(92px * var(--beam-h-${id})) at 8% calc(100% - 2px), ${spike.primary}, ${primaryGlow} 30%, transparent 88%)`,
      `radial-gradient(ellipse calc(10px * var(--beam-spike2-${id})) calc(35px * var(--beam-h-${id})) at 22% calc(100% - 4px), ${spike.secondary}, ${secondaryGlow} 50%, transparent 95%)`,
      `radial-gradient(ellipse calc(2px * (2 - var(--beam-spike-${id}))) calc(72px * var(--beam-h-${id})) at 36% calc(100% - 3px), ${palette[0].color1}, ${palette[0].color2} 40%, transparent 90%)`,
      `radial-gradient(ellipse calc(14px * var(--beam-spike2-${id})) calc(28px * var(--beam-h-${id})) at 50% calc(100% - 2px), ${palette[1].color1}, ${palette[1].color2} 55%, transparent 96%)`,
      `radial-gradient(ellipse calc(1.2px * (2 - var(--beam-spike2-${id}))) calc(85px * var(--beam-h-${id})) at 64% calc(100% - 4px), ${palette[2].color1}, ${palette[2].color2} 35%, transparent 89%)`,
      `radial-gradient(ellipse calc(7px * var(--beam-spike-${id})) calc(45px * var(--beam-h-${id})) at 78% calc(100% - 2px), ${palette[3].color1}, ${palette[3].color2} 48%, transparent 94%)`,
      `radial-gradient(ellipse calc(${finalSpikeWidth} * (2 - var(--beam-spike-${id}))) calc(60px * var(--beam-h-${id})) at 92% calc(100% - 3px), ${palette[4].color1}, ${palette[4].color2} 42%, transparent 91%)`,
      `radial-gradient(ellipse calc(21px * var(--beam-spike-${id})) calc(15px * var(--beam-spike2-${id})) at calc(var(--beam-x-${id}) * 100%) calc(100% + 1px), rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.9) 20%, rgba(255, 255, 255, 0.5) 50%, transparent 100%)`,
      tailBloom.replace(/\$\{id\}/g, id)
    ].join(',\n       ');
  }

  function buildBorderBeamLineStyle(config) {
    const id = config.id;
    const theme = config.theme === 'dark' ? 'dark' : 'light';
    const borderRadius = clampNumber(config.borderRadius, 36, 0, 999);
    const borderWidth = clampNumber(config.borderWidth, 1, 1, 6);
    const duration = clampNumber(config.duration, 2.4, 0.5, 30);
    const preset = BORDER_BEAM_LINE_THEME_PRESETS[theme];
    const strokeOpacity = preset.strokeOpacity;
    const innerOpacity = preset.innerOpacity;
    const bloomOpacity = preset.bloomOpacity;
    const innerShadow = preset.innerShadow;
    const brightness = clampNumber(config.brightness, 1.3, 0.1, 5);
    const saturation = clampNumber(config.saturation, preset.saturation, 0.1, 5);
    const hueRange = clampNumber(config.hueRange, 13, 0, 13);
    const glowRadius = Math.max(0, borderRadius - borderWidth);
    const borderGradient = buildLineBorderGradient(theme, id);
    const innerGradient = buildLineInnerGradient(id);
    const bloomGradient = buildLineBloomGradient(theme, id);
    const edgeGradient = theme === 'dark'
      ? `radial-gradient(
        ellipse calc(24px * var(--beam-w-${id})) calc(28px * var(--beam-h-${id})) at calc(var(--beam-x-${id}) * 100%) calc(100% + 2px),
        rgba(255, 255, 255, 0.38) 0%,
        rgba(255, 255, 255, 0.12) 30%,
        transparent 65%
      )`
      : `radial-gradient(
        ellipse calc(35px * var(--beam-w-${id})) calc(28px * var(--beam-h-${id})) at calc(var(--beam-x-${id}) * 100%) calc(100% + 2px),
        rgba(0, 0, 0, 0.6) 0%,
        rgba(0, 0, 0, 0.25) 35%,
        transparent 70%
      )`;
    return `
@property --beam-x-${id} {
  syntax: "<number>";
  initial-value: 0;
  inherits: true;
}

@property --beam-w-${id} {
  syntax: "<number>";
  initial-value: 1;
  inherits: true;
}

@property --beam-h-${id} {
  syntax: "<number>";
  initial-value: 1;
  inherits: true;
}

@property --beam-spike-${id} {
  syntax: "<number>";
  initial-value: 1;
  inherits: true;
}

@property --beam-spike2-${id} {
  syntax: "<number>";
  initial-value: 1;
  inherits: true;
}

@property --beam-edge-${id} {
  syntax: "<number>";
  initial-value: 1;
  inherits: true;
}

@property --beam-opacity-${id} {
  syntax: "<number>";
  initial-value: 0;
  inherits: true;
}

[data-beam="${id}"] {
  position: relative;
  border-radius: ${borderRadius}px;
  overflow: hidden;
}

[data-beam="${id}"][data-active] {
  animation:
    beam-travel-${id} ${duration}s linear infinite,
    beam-edge-fade-${id} ${duration}s linear infinite,
    beam-breathe-${id} ${(duration * 1.3).toFixed(1)}s ease-in-out infinite,
    beam-spike-${id} ${(duration * 1.33).toFixed(1)}s ease-in-out infinite,
    beam-spike2-${id} ${(duration * 1.7).toFixed(1)}s ease-in-out infinite,
    beam-fade-in-${id} 0.6s ease forwards;
}

[data-beam="${id}"][data-fading] {
  animation:
    beam-travel-${id} ${duration}s linear infinite,
    beam-edge-fade-${id} ${duration}s linear infinite,
    beam-breathe-${id} ${(duration * 1.3).toFixed(1)}s ease-in-out infinite,
    beam-spike-${id} ${(duration * 1.33).toFixed(1)}s ease-in-out infinite,
    beam-spike2-${id} ${(duration * 1.7).toFixed(1)}s ease-in-out infinite,
    beam-fade-out-${id} 0.5s ease forwards;
}

[data-beam="${id}"][data-active]::after,
[data-beam="${id}"][data-fading]::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: ${glowRadius}px;
  padding: ${borderWidth}px;
  clip-path: inset(0 round ${borderRadius}px);
  background: ${edgeGradient}, ${borderGradient};
  -webkit-mask:
    radial-gradient(
      ellipse calc(78px * var(--beam-w-${id})) calc(60px * var(--beam-h-${id})) at calc(var(--beam-x-${id}) * 100%) 100%,
      white 0%, rgba(255, 255, 255, 0.5) 45%, transparent 100%
    ),
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: source-in, xor;
  mask:
    radial-gradient(
      ellipse calc(78px * var(--beam-w-${id})) calc(60px * var(--beam-h-${id})) at calc(var(--beam-x-${id}) * 100%) 100%,
      white 0%, rgba(255, 255, 255, 0.5) 45%, transparent 100%
    ),
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: intersect, exclude;
  pointer-events: none;
  z-index: 2;
  opacity: calc(var(--beam-opacity-${id}) * var(--beam-edge-${id}) * ${strokeOpacity.toFixed(2)} * var(--beam-strength, 1));
  animation: beam-hue-shift-${id} 12s ease-in-out infinite;
}

[data-beam="${id}"][data-active]::before,
[data-beam="${id}"][data-fading]::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: ${borderRadius}px;
  background: ${innerGradient};
  box-shadow: inset 0 0 9px 1px ${innerShadow};
  -webkit-mask-image:
    radial-gradient(
      ellipse calc(78px * var(--beam-w-${id})) calc(60px * var(--beam-h-${id})) at calc(var(--beam-x-${id}) * 100%) 100%,
      white 0%, rgba(255, 255, 255, 0.5) 45%, transparent 100%
    ),
    linear-gradient(white, transparent 28px, transparent calc(100% - 28px), white),
    linear-gradient(to right, white, transparent 28px, transparent calc(100% - 28px), white);
  -webkit-mask-composite: source-in, source-over;
  mask-image:
    radial-gradient(
      ellipse calc(78px * var(--beam-w-${id})) calc(60px * var(--beam-h-${id})) at calc(var(--beam-x-${id}) * 100%) 100%,
      white 0%, rgba(255, 255, 255, 0.5) 45%, transparent 100%
    ),
    linear-gradient(white, transparent 28px, transparent calc(100% - 28px), white),
    linear-gradient(to right, white, transparent 28px, transparent calc(100% - 28px), white);
  mask-composite: intersect, add;
  pointer-events: none;
  z-index: 1;
  opacity: calc(var(--beam-opacity-${id}) * var(--beam-edge-${id}) * ${innerOpacity.toFixed(2)} * var(--beam-strength, 1));
  clip-path: inset(0 round ${borderRadius}px);
  animation: beam-hue-shift-${id} 12s ease-in-out infinite;
}

[data-beam="${id}"] [data-beam-bloom] {
  display: none;
  position: absolute;
  inset: 0;
  border-radius: ${glowRadius}px;
  clip-path: inset(0 round ${borderRadius}px);
  padding: 0;
  -webkit-mask: radial-gradient(
    ellipse calc(84px * var(--beam-w-${id})) calc(110px * var(--beam-h-${id})) at calc(var(--beam-x-${id}) * 100%) 100%,
    white 0%, rgba(255, 255, 255, 0.5) 35%, transparent 100%
  );
  -webkit-mask-composite: source-over;
  mask: radial-gradient(
    ellipse calc(84px * var(--beam-w-${id})) calc(110px * var(--beam-h-${id})) at calc(var(--beam-x-${id}) * 100%) 100%,
    white 0%, rgba(255, 255, 255, 0.5) 35%, transparent 100%
  );
  mask-composite: add;
  background: ${bloomGradient};
  pointer-events: none;
  z-index: 3;
  opacity: 0;
}

[data-beam="${id}"][data-active] [data-beam-bloom],
[data-beam="${id}"][data-fading] [data-beam-bloom] {
  display: block;
  opacity: calc(var(--beam-opacity-${id}) * var(--beam-edge-${id}) * ${bloomOpacity.toFixed(2)} * var(--beam-strength, 1));
  animation: beam-hue-shift-bloom-${id} 8s ease-in-out infinite;
}

@keyframes beam-hue-shift-${id} {
  0% { filter: hue-rotate(-${hueRange}deg) brightness(${brightness.toFixed(2)}) saturate(${saturation.toFixed(2)}); }
  50% { filter: hue-rotate(${hueRange}deg) brightness(${brightness.toFixed(2)}) saturate(${saturation.toFixed(2)}); }
  100% { filter: hue-rotate(-${hueRange}deg) brightness(${brightness.toFixed(2)}) saturate(${saturation.toFixed(2)}); }
}

@keyframes beam-hue-shift-bloom-${id} {
  0% { filter: blur(8px) hue-rotate(-${hueRange + 10}deg) brightness(${brightness.toFixed(2)}) saturate(${saturation.toFixed(2)}); }
  50% { filter: blur(8px) hue-rotate(${hueRange + 10}deg) brightness(${brightness.toFixed(2)}) saturate(${saturation.toFixed(2)}); }
  100% { filter: blur(8px) hue-rotate(-${hueRange + 10}deg) brightness(${brightness.toFixed(2)}) saturate(${saturation.toFixed(2)}); }
}

@keyframes beam-travel-${id} {
  0%   { --beam-x-${id}: 0.06;  --beam-w-${id}: 0.5; }
  10%  { --beam-x-${id}: 0.15;  --beam-w-${id}: 0.8; }
  20%  { --beam-x-${id}: 0.25;  --beam-w-${id}: 1.1; }
  30%  { --beam-x-${id}: 0.35;  --beam-w-${id}: 1.3; }
  40%  { --beam-x-${id}: 0.44;  --beam-w-${id}: 1.45; }
  50%  { --beam-x-${id}: 0.5;   --beam-w-${id}: 1.5; }
  60%  { --beam-x-${id}: 0.56;  --beam-w-${id}: 1.45; }
  70%  { --beam-x-${id}: 0.65;  --beam-w-${id}: 1.3; }
  80%  { --beam-x-${id}: 0.75;  --beam-w-${id}: 1.1; }
  90%  { --beam-x-${id}: 0.85;  --beam-w-${id}: 0.8; }
  100% { --beam-x-${id}: 0.94;  --beam-w-${id}: 0.5; }
}

@keyframes beam-edge-fade-${id} {
  0%    { --beam-edge-${id}: 0; }
  12.5% { --beam-edge-${id}: 0; }
  32.5% { --beam-edge-${id}: 1; }
  67.5% { --beam-edge-${id}: 1; }
  87.5% { --beam-edge-${id}: 0; }
  100%  { --beam-edge-${id}: 0; }
}

@keyframes beam-breathe-${id} {
  0%, 100% { --beam-h-${id}: 0.8; }
  25%      { --beam-h-${id}: 1.25; }
  55%      { --beam-h-${id}: 0.85; }
  80%      { --beam-h-${id}: 1.3; }
}

@keyframes beam-spike-${id} {
  0%   { --beam-spike-${id}: 0.8; }
  25%  { --beam-spike-${id}: 1.3; }
  50%  { --beam-spike-${id}: 0.9; }
  75%  { --beam-spike-${id}: 1.4; }
  100% { --beam-spike-${id}: 0.8; }
}

@keyframes beam-spike2-${id} {
  0%   { --beam-spike2-${id}: 1.2; }
  25%  { --beam-spike2-${id}: 0.7; }
  50%  { --beam-spike2-${id}: 1.4; }
  75%  { --beam-spike2-${id}: 0.8; }
  100% { --beam-spike2-${id}: 1.2; }
}

@keyframes beam-fade-in-${id} {
  to { --beam-opacity-${id}: 1; }
}

@keyframes beam-fade-out-${id} {
  from { --beam-opacity-${id}: 1; }
  to { --beam-opacity-${id}: 0; }
}
`;
  }

  window._x_extension_createBorderBeamEffect_2026_unique_ = function(options) {
    const config = options || {};
    const target = config.target;
    if (!target || !target.appendChild) {
      return null;
    }
    const themeTarget = config.themeTarget && typeof config.themeTarget.getAttribute === 'function'
      ? config.themeTarget
      : target;
    const id = `_x_extension_border_beam_${Date.now().toString(36)}_${borderBeamInstanceCounter++}`;
    const borderWidth = clampNumber(config.borderWidth, 1, 1, 6);
    const spread = clampNumber(config.spread, 0, 0, 40);
    const edgeOffset = clampNumber(
      config.edgeOffset,
      borderWidth,
      0,
      12
    );
    const hostInset = spread + edgeOffset;
    const borderRadius = clampNumber(config.borderRadius, 32, 0, 999);
    const beamRadius = borderRadius + hostInset;
    const zIndex = Number.isFinite(Number(config.zIndex)) ? String(config.zIndex) : '3';
    const style = document.createElement('style');
    style.id = `${id}_style`;
    const host = document.createElement('div');
    applyNoTranslate(host);
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = `
      position: absolute !important;
      inset: -${hostInset}px !important;
      display: block !important;
      box-sizing: border-box !important;
      border-radius: ${beamRadius}px !important;
      pointer-events: none !important;
      z-index: ${zIndex} !important;
      overflow: visible !important;
    `;

    const beam = document.createElement('div');
    applyNoTranslate(beam);
    beam.setAttribute('aria-hidden', 'true');
    beam.setAttribute('data-beam', id);
    beam.style.cssText = `
      position: absolute !important;
      inset: 0 !important;
      display: block !important;
      box-sizing: border-box !important;
      pointer-events: none !important;
      --beam-strength: ${clampNumber(config.strength, 1, 0, 1)} !important;
    `;

    const bloom = document.createElement('div');
    applyNoTranslate(bloom);
    bloom.setAttribute('aria-hidden', 'true');
    bloom.setAttribute('data-beam-bloom', 'true');
    beam.appendChild(bloom);
    host.appendChild(beam);

    const previousInlinePosition = target.style.getPropertyValue('position');
    const previousInlinePositionPriority = target.style.getPropertyPriority('position');
    const previousInlineOverflow = target.style.getPropertyValue('overflow');
    const previousInlineOverflowPriority = target.style.getPropertyPriority('overflow');
    const computedTargetStyle = window.getComputedStyle(target);
    const updatedPosition = computedTargetStyle.position === 'static';
    const updatedOverflow = computedTargetStyle.overflow === 'hidden';
    if (updatedPosition) {
      target.style.setProperty('position', 'relative', 'important');
    }
    if (updatedOverflow) {
      target.style.setProperty('overflow', 'visible', 'important');
    }

    function updateTheme(nextTheme) {
      const resolvedTheme = resolveBorderBeamTheme(nextTheme, target, themeTarget);
      style.textContent = buildBorderBeamMediumStyle({
        id: id,
        theme: resolvedTheme,
        borderRadius: beamRadius,
        borderWidth: borderWidth,
        duration: config.duration,
        brightness: config.brightness,
        saturation: config.saturation,
        hueRange: config.hueRange
      });
    }

    function updateAdaptiveSizing() {
      const rect = host.getBoundingClientRect();
      const adaptiveScale = computeBorderBeamAdaptiveScale(rect.width, rect.height);
      beam.style.setProperty(`--beam-scale-x-${id}`, adaptiveScale.scaleX.toFixed(3));
      beam.style.setProperty(`--beam-scale-y-${id}`, adaptiveScale.scaleY.toFixed(3));
      beam.style.setProperty(`--beam-blur-${id}`, `${adaptiveScale.blur.toFixed(1)}px`);
    }

    let fadeTimer = null;
    let resizeObserver = null;
    let handleWindowResize = null;

    function setActive(active) {
      if (fadeTimer) {
        clearTimeout(fadeTimer);
        fadeTimer = null;
      }
      if (active) {
        beam.removeAttribute('data-fading');
        beam.setAttribute('data-active', '');
        return;
      }
      if (beam.hasAttribute('data-active')) {
        beam.removeAttribute('data-active');
        beam.setAttribute('data-fading', '');
        fadeTimer = window.setTimeout(() => {
          beam.removeAttribute('data-fading');
          fadeTimer = null;
        }, 560);
        return;
      }
      beam.removeAttribute('data-fading');
    }

    function destroy() {
      if (fadeTimer) {
        clearTimeout(fadeTimer);
      }
      if (resizeObserver && typeof resizeObserver.disconnect === 'function') {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      if (handleWindowResize) {
        window.removeEventListener('resize', handleWindowResize);
        handleWindowResize = null;
      }
      if (host.parentNode) {
        host.parentNode.removeChild(host);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
      if (updatedPosition) {
        if (previousInlinePosition) {
          target.style.setProperty('position', previousInlinePosition, previousInlinePositionPriority || '');
        } else {
          target.style.removeProperty('position');
        }
      }
      if (updatedOverflow) {
        if (previousInlineOverflow) {
          target.style.setProperty('overflow', previousInlineOverflow, previousInlineOverflowPriority || '');
        } else {
          target.style.removeProperty('overflow');
        }
      }
    }

    updateTheme(config.theme || 'auto');
    (document.head || document.documentElement).appendChild(style);
    target.insertBefore(host, target.firstChild);
    updateAdaptiveSizing();
    if (typeof window.ResizeObserver === 'function') {
      resizeObserver = new window.ResizeObserver(() => {
        updateAdaptiveSizing();
      });
      resizeObserver.observe(target);
      resizeObserver.observe(host);
    } else {
      handleWindowResize = () => {
        updateAdaptiveSizing();
      };
      window.addEventListener('resize', handleWindowResize);
    }
    setActive(Boolean(config.active));

    return {
      host: host,
      beam: beam,
      setActive: setActive,
      setTheme: updateTheme,
      destroy: destroy
    };
  };

  function buildAiSweepStyle(config) {
    const id = config.id;
    const theme = config.theme === 'dark' ? 'dark' : 'light';
    const borderRadius = clampNumber(config.borderRadius, 28, 0, 999);
    const durationMs = Math.round(clampNumber(config.duration, 2280, 220, 6000));
    const durationCss = `var(--ai-sweep-duration-${id}, ${durationMs}ms)`;
    const arcBlendMode = 'screen';
    const prismBlendMode = theme === 'dark' ? 'screen' : 'overlay';
    const washBlendMode = theme === 'dark' ? 'screen' : 'soft-light';
    const backdropBlurPx = theme === 'dark' ? 20 : 15;
    const backdropSaturate = theme === 'dark' ? 195 : 182;
    const backdropBrightness = theme === 'dark' ? 1.16 : 1.05;
    const whiteRim = theme === 'dark' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.92)';
    const magenta = theme === 'dark' ? 'rgba(255, 108, 163, 0.9)' : 'rgba(255, 108, 163, 0.54)';
    const amber = theme === 'dark' ? 'rgba(255, 193, 87, 0.74)' : 'rgba(255, 193, 87, 0.46)';
    const cyan = theme === 'dark' ? 'rgba(93, 208, 255, 0.86)' : 'rgba(93, 208, 255, 0.52)';
    const mint = theme === 'dark' ? 'rgba(104, 255, 214, 0.68)' : 'rgba(104, 255, 214, 0.4)';
    const violet = theme === 'dark' ? 'rgba(180, 126, 255, 0.76)' : 'rgba(180, 126, 255, 0.46)';
    const veilBase = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.22)';
    const veilCore = theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.3)';
    const lensVeil = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.12)';
    const lensCore = theme === 'dark' ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.2)';
    const prismCore = theme === 'dark' ? 'rgba(255, 255, 255, 0.52)' : 'rgba(255, 255, 255, 0.62)';
    const lensMaxOpacity = theme === 'dark' ? 0.54 : 0.4;
    const refractMaxOpacity = theme === 'dark' ? 0.34 : 0.24;
    const washMaxOpacity = theme === 'dark' ? 0.8 : 0.68;
    const prismMaxOpacity = theme === 'dark' ? 0.86 : 0.82;
    const edgeMaxOpacity = theme === 'dark' ? 0.84 : 0.9;
    return `
[data-ai-sweep="${id}"] {
  position: absolute;
  inset: 0;
  display: block;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: ${borderRadius}px;
  pointer-events: none;
  opacity: 0;
  contain: paint;
}

[data-ai-sweep="${id}"][data-playing] {
  opacity: 1;
}

[data-ai-sweep="${id}"] [data-ai-sweep-carrier] {
  position: absolute;
  left: -24%;
  top: -66%;
  width: 148%;
  height: 252%;
  pointer-events: none;
  will-change: transform, opacity, filter;
  transform: translate3d(0, 0%, 0) scaleX(1.01) scaleY(0.95);
}

[data-ai-sweep="${id}"] [data-ai-sweep-lens],
[data-ai-sweep="${id}"] [data-ai-sweep-refract-a],
[data-ai-sweep="${id}"] [data-ai-sweep-refract-b],
[data-ai-sweep="${id}"] [data-ai-sweep-wash],
[data-ai-sweep="${id}"] [data-ai-sweep-prism],
[data-ai-sweep="${id}"] [data-ai-sweep-edge] {
  position: absolute;
  inset: 0;
  display: block;
  border-radius: 50%;
  pointer-events: none;
  opacity: 0;
}

[data-ai-sweep="${id}"] [data-ai-sweep-lens] {
  display: none;
  background:
    radial-gradient(ellipse 62% 17% at 50% 61%, ${lensCore} 0%, transparent 76%),
    linear-gradient(90deg,
      rgba(255, 255, 255, 0.02) 0%,
      ${lensVeil} 18%,
      rgba(255, 255, 255, 0.02) 100%
    );
  backdrop-filter: blur(${backdropBlurPx + 2}px) saturate(${backdropSaturate + 10}%) brightness(${(backdropBrightness + 0.02).toFixed(2)});
  -webkit-backdrop-filter: blur(${backdropBlurPx + 2}px) saturate(${backdropSaturate + 10}%) brightness(${(backdropBrightness + 0.02).toFixed(2)});
  mix-blend-mode: ${theme === 'dark' ? 'screen' : 'soft-light'};
  -webkit-mask-image: radial-gradient(
    ellipse 74% 44% at 50% 100%,
    transparent 47%,
    rgba(0, 0, 0, 0.16) 51.5%,
    rgba(0, 0, 0, 0.98) 55.4%,
    rgba(0, 0, 0, 0.92) 58.8%,
    transparent 64.5%
  );
  mask-image: radial-gradient(
    ellipse 74% 44% at 50% 100%,
    transparent 47%,
    rgba(0, 0, 0, 0.16) 51.5%,
    rgba(0, 0, 0, 0.98) 55.4%,
    rgba(0, 0, 0, 0.92) 58.8%,
    transparent 64.5%
  );
}

[data-ai-sweep="${id}"] [data-ai-sweep-refract-a],
[data-ai-sweep="${id}"] [data-ai-sweep-refract-b] {
  display: none;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.001), rgba(255, 255, 255, 0.001));
  backdrop-filter: blur(${Math.max(2, backdropBlurPx - 8)}px) saturate(${backdropSaturate + 28}%) brightness(${(backdropBrightness + 0.05).toFixed(2)});
  -webkit-backdrop-filter: blur(${Math.max(2, backdropBlurPx - 8)}px) saturate(${backdropSaturate + 28}%) brightness(${(backdropBrightness + 0.05).toFixed(2)});
  mix-blend-mode: normal;
}

[data-ai-sweep="${id}"] [data-ai-sweep-refract-a] {
  -webkit-mask-image: radial-gradient(
    ellipse 78% 42% at 48.8% 100%,
    transparent 48.8%,
    rgba(0, 0, 0, 0.08) 52.2%,
    rgba(0, 0, 0, 0.98) 55.2%,
    rgba(0, 0, 0, 0.88) 57.6%,
    transparent 62.2%
  );
  mask-image: radial-gradient(
    ellipse 78% 42% at 48.8% 100%,
    transparent 48.8%,
    rgba(0, 0, 0, 0.08) 52.2%,
    rgba(0, 0, 0, 0.98) 55.2%,
    rgba(0, 0, 0, 0.88) 57.6%,
    transparent 62.2%
  );
}

[data-ai-sweep="${id}"] [data-ai-sweep-refract-b] {
  -webkit-mask-image: radial-gradient(
    ellipse 80% 43% at 51.2% 100%,
    transparent 49.8%,
    rgba(0, 0, 0, 0.08) 53%,
    rgba(0, 0, 0, 0.98) 56.1%,
    rgba(0, 0, 0, 0.84) 58.3%,
    transparent 62.8%
  );
  mask-image: radial-gradient(
    ellipse 80% 43% at 51.2% 100%,
    transparent 49.8%,
    rgba(0, 0, 0, 0.08) 53%,
    rgba(0, 0, 0, 0.98) 56.1%,
    rgba(0, 0, 0, 0.84) 58.3%,
    transparent 62.8%
  );
}

[data-ai-sweep="${id}"] [data-ai-sweep-wash] {
  background:
    radial-gradient(ellipse 72% 32% at 50% 61%, ${veilCore} 0%, transparent 74%),
    linear-gradient(90deg,
      rgba(255, 255, 255, 0.02) 0%,
      ${veilBase} 14%,
      rgba(255, 255, 255, 0.02) 100%
    );
  mix-blend-mode: ${washBlendMode};
  -webkit-mask-image: radial-gradient(
    ellipse 76% 55% at 50% 100%,
    transparent 42%,
    rgba(0, 0, 0, 0.24) 50%,
    rgba(0, 0, 0, 0.96) 58%,
    rgba(0, 0, 0, 0.78) 66%,
    transparent 78%
  );
  mask-image: radial-gradient(
    ellipse 76% 55% at 50% 100%,
    transparent 42%,
    rgba(0, 0, 0, 0.24) 50%,
    rgba(0, 0, 0, 0.96) 58%,
    rgba(0, 0, 0, 0.78) 66%,
    transparent 78%
  );
}

[data-ai-sweep="${id}"] [data-ai-sweep-prism] {
  background:
    radial-gradient(ellipse 70% 24% at 50% 61%, ${prismCore} 0%, transparent 73%),
    linear-gradient(90deg,
      ${magenta} 0%,
      ${amber} 18%,
      ${mint} 42%,
      ${cyan} 67%,
      ${violet} 86%,
      ${magenta} 100%
    );
  mix-blend-mode: ${prismBlendMode};
  filter: blur(${theme === 'dark' ? 24 : 20}px) saturate(${theme === 'dark' ? 1.48 : 1.3});
  -webkit-mask-image: radial-gradient(
    ellipse 82% 49% at 50% 100%,
    transparent 46%,
    rgba(0, 0, 0, 0.18) 54%,
    rgba(0, 0, 0, 0.95) 61.5%,
    transparent 75%
  );
  mask-image: radial-gradient(
    ellipse 82% 49% at 50% 100%,
    transparent 46%,
    rgba(0, 0, 0, 0.18) 54%,
    rgba(0, 0, 0, 0.95) 61.5%,
    transparent 75%
  );
}

[data-ai-sweep="${id}"] [data-ai-sweep-edge] {
  background:
    radial-gradient(ellipse 80% 44% at 50% 100%, transparent 51%, ${whiteRim} 57.8%, transparent 61.8%),
    radial-gradient(ellipse 82% 45% at 48.8% 100%, transparent 53%, ${magenta} 59.2%, transparent 64.4%),
    radial-gradient(ellipse 84% 46% at 50% 100%, transparent 54.5%, ${amber} 60.8%, transparent 66.4%),
    radial-gradient(ellipse 86% 47% at 51.2% 100%, transparent 55.6%, ${cyan} 62.1%, transparent 68.2%),
    radial-gradient(ellipse 88% 48% at 49.6% 100%, transparent 56.8%, ${mint} 63.4%, transparent 70%),
    radial-gradient(ellipse 90% 49% at 50.4% 100%, transparent 57.2%, ${violet} 64.6%, transparent 71.2%);
  mix-blend-mode: ${arcBlendMode};
  filter: blur(${theme === 'dark' ? 2.4 : 1.8}px) saturate(${theme === 'dark' ? 1.4 : 1.24});
  -webkit-mask-image: radial-gradient(
    ellipse 90% 50% at 50% 100%,
    transparent 47%,
    rgba(0, 0, 0, 0.12) 54%,
    rgba(0, 0, 0, 0.98) 61.8%,
    transparent 73%
  );
  mask-image: radial-gradient(
    ellipse 90% 50% at 50% 100%,
    transparent 47%,
    rgba(0, 0, 0, 0.12) 54%,
    rgba(0, 0, 0, 0.98) 61.8%,
    transparent 73%
  );
}

[data-ai-sweep="${id}"][data-playing] [data-ai-sweep-lens] {
  animation: ai-sweep-lens-${id} ${durationCss} cubic-bezier(0.16, 0.74, 0.22, 1) both;
}

[data-ai-sweep="${id}"][data-playing] [data-ai-sweep-refract-a] {
  animation: ai-sweep-refract-a-${id} ${durationCss} linear both;
}

[data-ai-sweep="${id}"][data-playing] [data-ai-sweep-refract-b] {
  animation: ai-sweep-refract-b-${id} ${durationCss} linear both;
}

[data-ai-sweep="${id}"][data-playing] [data-ai-sweep-wash] {
  animation: ai-sweep-wash-${id} ${durationCss} cubic-bezier(0.18, 0.72, 0.22, 1) both;
}

[data-ai-sweep="${id}"][data-playing] [data-ai-sweep-prism] {
  animation: ai-sweep-prism-${id} ${durationCss} cubic-bezier(0.18, 0.72, 0.22, 1) both;
}

[data-ai-sweep="${id}"][data-playing] [data-ai-sweep-edge] {
  animation: ai-sweep-edge-${id} ${durationCss} cubic-bezier(0.14, 0.8, 0.2, 1) both;
}

@keyframes ai-sweep-lens-${id} {
  0% {
    opacity: ${(lensMaxOpacity * 0.32).toFixed(3)};
  }
  12% {
    opacity: ${(lensMaxOpacity * 0.58).toFixed(3)};
  }
  28% {
    opacity: ${(lensMaxOpacity * 0.82).toFixed(3)};
  }
  46% {
    opacity: ${lensMaxOpacity.toFixed(3)};
  }
  68% {
    opacity: ${(lensMaxOpacity * 0.74).toFixed(3)};
  }
  84% {
    opacity: ${(lensMaxOpacity * 0.28).toFixed(3)};
  }
  100% {
    opacity: 0;
  }
}

@keyframes ai-sweep-refract-a-${id} {
  0% {
    opacity: ${(refractMaxOpacity * 0.26).toFixed(3)};
    transform: translate3d(-1.4%, 1.8%, 0) scaleX(1.035) scaleY(0.985);
  }
  20% {
    opacity: ${(refractMaxOpacity * 0.54).toFixed(3)};
    transform: translate3d(1.8%, 0.8%, 0) scaleX(0.995) scaleY(1);
  }
  42% {
    opacity: ${refractMaxOpacity.toFixed(3)};
    transform: translate3d(-2.2%, 0, 0) scaleX(1.05) scaleY(1.01);
  }
  62% {
    opacity: ${(refractMaxOpacity * 0.74).toFixed(3)};
    transform: translate3d(1.6%, -0.8%, 0) scaleX(0.99) scaleY(1.015);
  }
  82% {
    opacity: ${(refractMaxOpacity * 0.28).toFixed(3)};
    transform: translate3d(-0.8%, -1.4%, 0) scaleX(1.018) scaleY(1.01);
  }
  100% {
    opacity: 0;
    transform: translate3d(0, -1.6%, 0) scaleX(1) scaleY(1);
  }
}

@keyframes ai-sweep-refract-b-${id} {
  0% {
    opacity: ${(refractMaxOpacity * 0.18).toFixed(3)};
    transform: translate3d(1.2%, 2.2%, 0) scaleX(0.992) scaleY(0.988);
  }
  18% {
    opacity: ${(refractMaxOpacity * 0.48).toFixed(3)};
    transform: translate3d(-1.6%, 1.1%, 0) scaleX(1.026) scaleY(1.002);
  }
  36% {
    opacity: ${(refractMaxOpacity * 0.82).toFixed(3)};
    transform: translate3d(2.1%, 0.2%, 0) scaleX(0.986) scaleY(1.01);
  }
  56% {
    opacity: ${(refractMaxOpacity * 0.96).toFixed(3)};
    transform: translate3d(-1.8%, -0.4%, 0) scaleX(1.034) scaleY(1.016);
  }
  78% {
    opacity: ${(refractMaxOpacity * 0.32).toFixed(3)};
    transform: translate3d(0.9%, -1.3%, 0) scaleX(1.006) scaleY(1.01);
  }
  100% {
    opacity: 0;
    transform: translate3d(0, -1.8%, 0) scaleX(1) scaleY(1);
  }
}

@keyframes ai-sweep-wash-${id} {
  0% {
    opacity: ${(washMaxOpacity * 0.38).toFixed(3)};
  }
  8% {
    opacity: ${(washMaxOpacity * 0.68).toFixed(3)};
  }
  22% {
    opacity: ${(washMaxOpacity * 0.82).toFixed(3)};
  }
  40% {
    opacity: ${(washMaxOpacity * 0.96).toFixed(3)};
  }
  56% {
    opacity: ${washMaxOpacity.toFixed(3)};
  }
  78% {
    opacity: ${(washMaxOpacity * 0.54).toFixed(3)};
  }
  90% {
    opacity: ${(washMaxOpacity * 0.24).toFixed(3)};
  }
  100% {
    opacity: 0;
  }
}

@keyframes ai-sweep-prism-${id} {
  0% {
    opacity: ${(prismMaxOpacity * 0.34).toFixed(3)};
    transform: scale(0.955) translateY(9%);
  }
  8% {
    opacity: ${(prismMaxOpacity * 0.66).toFixed(3)};
    transform: scale(0.985) translateY(6%);
  }
  22% {
    opacity: ${(prismMaxOpacity * 0.88).toFixed(3)};
    transform: scale(1.008) translateY(3%);
  }
  38% {
    opacity: ${(prismMaxOpacity * 0.98).toFixed(3)};
    transform: scale(1.04) translateY(1%);
  }
  54% {
    opacity: ${prismMaxOpacity.toFixed(3)};
    transform: scale(1.03) translateY(0);
  }
  80% {
    opacity: ${(prismMaxOpacity * 0.52).toFixed(3)};
    transform: scale(1.06) translateY(-2%);
  }
  92% {
    opacity: ${(prismMaxOpacity * 0.18).toFixed(3)};
    transform: scale(1.07) translateY(-3%);
  }
  100% {
    opacity: 0;
    transform: scale(1.08) translateY(-4%);
  }
}

@keyframes ai-sweep-edge-${id} {
  0% {
    opacity: ${(edgeMaxOpacity * 0.44).toFixed(3)};
  }
  8% {
    opacity: ${(edgeMaxOpacity * 0.76).toFixed(3)};
  }
  22% {
    opacity: ${(edgeMaxOpacity * 0.9).toFixed(3)};
  }
  38% {
    opacity: ${(edgeMaxOpacity * 0.98).toFixed(3)};
  }
  54% {
    opacity: ${edgeMaxOpacity.toFixed(3)};
  }
  80% {
    opacity: ${(edgeMaxOpacity * 0.42).toFixed(3)};
  }
  92% {
    opacity: ${(edgeMaxOpacity * 0.16).toFixed(3)};
  }
  100% {
    opacity: 0;
  }
}
`;
  }

  window._x_extension_createAiSweepEffect_2026_unique_ = function(options) {
    const config = options || {};
    const target = config.target;
    if (!target || !target.appendChild) {
      return null;
    }
    const themeTarget = config.themeTarget && typeof config.themeTarget.getAttribute === 'function'
      ? config.themeTarget
      : target;
    const id = `_x_extension_ai_sweep_${Date.now().toString(36)}_${aiSweepInstanceCounter++}`;
    const filterId = `${id}_filter`;
    const borderRadius = clampNumber(config.borderRadius, 28, 0, 999);
    const zIndex = Number.isFinite(Number(config.zIndex)) ? String(config.zIndex) : '4';
    const durationMs = Math.round(clampNumber(config.duration, 2280, 220, 6000));
    const maxDisplacement = clampNumber(config.maxDisplacement, 24, 0, 40);
    const distortionSelector = typeof config.distortionSelector === 'string'
      ? config.distortionSelector.trim()
      : '';
    const style = document.createElement('style');
    style.id = `${id}_style`;
    const host = document.createElement('div');
    applyNoTranslate(host);
    host.setAttribute('aria-hidden', 'true');
    host.setAttribute('data-ai-sweep', id);
    host.style.cssText = `
      position: absolute !important;
      inset: 0 !important;
      display: block !important;
      box-sizing: border-box !important;
      border-radius: ${borderRadius}px !important;
      pointer-events: none !important;
      z-index: ${zIndex} !important;
      overflow: hidden !important;
    `;

    const carrier = document.createElement('div');
    applyNoTranslate(carrier);
    carrier.setAttribute('aria-hidden', 'true');
    carrier.setAttribute('data-ai-sweep-carrier', 'true');

    const lens = document.createElement('div');
    applyNoTranslate(lens);
    lens.setAttribute('aria-hidden', 'true');
    lens.setAttribute('data-ai-sweep-lens', 'true');

    const refractA = document.createElement('div');
    applyNoTranslate(refractA);
    refractA.setAttribute('aria-hidden', 'true');
    refractA.setAttribute('data-ai-sweep-refract-a', 'true');

    const refractB = document.createElement('div');
    applyNoTranslate(refractB);
    refractB.setAttribute('aria-hidden', 'true');
    refractB.setAttribute('data-ai-sweep-refract-b', 'true');

    const wash = document.createElement('div');
    applyNoTranslate(wash);
    wash.setAttribute('aria-hidden', 'true');
    wash.setAttribute('data-ai-sweep-wash', 'true');

    const prism = document.createElement('div');
    applyNoTranslate(prism);
    prism.setAttribute('aria-hidden', 'true');
    prism.setAttribute('data-ai-sweep-prism', 'true');

    const edge = document.createElement('div');
    applyNoTranslate(edge);
    edge.setAttribute('aria-hidden', 'true');
    edge.setAttribute('data-ai-sweep-edge', 'true');

    carrier.appendChild(lens);
    carrier.appendChild(refractA);
    carrier.appendChild(refractB);
    carrier.appendChild(wash);
    carrier.appendChild(prism);
    carrier.appendChild(edge);
    host.appendChild(carrier);

    const filterSvg = createSvgElement('svg');
    filterSvg.setAttribute('aria-hidden', 'true');
    filterSvg.setAttribute('focusable', 'false');
    filterSvg.setAttribute('width', '0');
    filterSvg.setAttribute('height', '0');
    filterSvg.style.cssText = 'position:absolute !important;width:0 !important;height:0 !important;overflow:hidden !important;pointer-events:none !important;';
    const filter = createSvgElement('filter');
    filter.setAttribute('id', filterId);
    filter.setAttribute('x', '-18%');
    filter.setAttribute('y', '-18%');
    filter.setAttribute('width', '136%');
    filter.setAttribute('height', '136%');
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    const turbulence = createSvgElement('feTurbulence');
    turbulence.setAttribute('type', 'fractalNoise');
    turbulence.setAttribute('baseFrequency', '0.007 0.022');
    turbulence.setAttribute('numOctaves', '2');
    turbulence.setAttribute('seed', '3');
    turbulence.setAttribute('stitchTiles', 'stitch');
    turbulence.setAttribute('result', 'noise');
    const displacement = createSvgElement('feDisplacementMap');
    displacement.setAttribute('in', 'SourceGraphic');
    displacement.setAttribute('in2', 'noise');
    displacement.setAttribute('scale', '0');
    displacement.setAttribute('xChannelSelector', 'R');
    displacement.setAttribute('yChannelSelector', 'G');
    filter.appendChild(turbulence);
    filter.appendChild(displacement);
    filterSvg.appendChild(filter);
    host.appendChild(filterSvg);

    const previousInlinePosition = target.style.getPropertyValue('position');
    const previousInlinePositionPriority = target.style.getPropertyPriority('position');
    const previousInlineOverflow = target.style.getPropertyValue('overflow');
    const previousInlineOverflowPriority = target.style.getPropertyPriority('overflow');
    const computedTargetStyle = window.getComputedStyle(target);
    const updatedPosition = computedTargetStyle.position === 'static';
    const updatedOverflow = computedTargetStyle.overflow !== 'hidden';
    if (updatedPosition) {
      target.style.setProperty('position', 'relative', 'important');
    }
    if (updatedOverflow) {
      target.style.setProperty('overflow', 'hidden', 'important');
    }

    let fadeTimer = null;
    let animationRaf = null;
    let playCounter = 0;
    let resolvedTheme = 'light';
    let currentPlayDurationMs = durationMs;
    let currentThemeKey = '';
    const distortionBaseStyles = typeof WeakMap === 'function' ? new WeakMap() : null;
    let distortionEntries = [];

    function computeDynamicDuration() {
      const geometry = measureSweepGeometry();
      const dynamic = 720 + (Math.max(0, geometry.travelPx) * 1.18);
      return Math.round(clampNumber(dynamic, durationMs, 860, 2280));
    }

    function updateTheme(nextTheme) {
      const nextResolvedTheme = resolveBorderBeamTheme(nextTheme, target, themeTarget);
      if (style.textContent && nextResolvedTheme === resolvedTheme && currentThemeKey === nextResolvedTheme) {
        return resolvedTheme;
      }
      resolvedTheme = nextResolvedTheme;
      currentThemeKey = nextResolvedTheme;
      style.textContent = buildAiSweepStyle({
        id: id,
        filterId: filterId,
        theme: resolvedTheme,
        borderRadius: borderRadius,
        duration: durationMs
      });
      return resolvedTheme;
    }

    function easeSweepTravel(progress) {
      const clamped = clampNumber(progress, 0, 0, 1);
      return 1 - Math.pow(1 - clamped, 2.6);
    }

    function measureSweepGeometry() {
      const rect = target.getBoundingClientRect();
      const width = Math.max(1, Number.isFinite(rect.width) ? rect.width : 0);
      const height = Math.max(1, Number.isFinite(rect.height) ? rect.height : 0);
      const carrierWidth = Math.max(width * 1.48, 360);
      const carrierHeight = Math.max(height * 2.52, carrierWidth / 2.12, 220);
      const left = (width - carrierWidth) / 2;
      const top = height - (carrierHeight * 0.659);
      const travelPx = carrierHeight * 0.74;
      return {
        width: width,
        height: height,
        carrierWidth: carrierWidth,
        carrierHeight: carrierHeight,
        left: left,
        top: top,
        travelPx: travelPx
      };
    }

    function syncCarrierGeometry() {
      const geometry = measureSweepGeometry();
      carrier.style.setProperty('left', `${geometry.left.toFixed(2)}px`, 'important');
      carrier.style.setProperty('top', `${geometry.top.toFixed(2)}px`, 'important');
      carrier.style.setProperty('width', `${geometry.carrierWidth.toFixed(2)}px`, 'important');
      carrier.style.setProperty('height', `${geometry.carrierHeight.toFixed(2)}px`, 'important');
      return geometry;
    }

    function computeCarrierTransform(progress, geometry) {
      const travelProgress = easeSweepTravel(progress);
      const sweepGeometry = geometry || measureSweepGeometry();
      const driftPx = -sweepGeometry.travelPx * travelProgress;
      const scaleX = 1.01 + (0.16 * Math.pow(travelProgress, 0.92));
      const scaleY = 0.95 + (0.1 * Math.pow(travelProgress, 1.08));
      return `translate3d(0, ${driftPx.toFixed(2)}px, 0) scaleX(${scaleX.toFixed(4)}) scaleY(${scaleY.toFixed(4)})`;
    }

    function stopDistortionLoop() {
      if (animationRaf !== null) {
        cancelAnimationFrame(animationRaf);
        animationRaf = null;
      }
    }

    function composeInlineTransform(baseTransform, extraTransform) {
      const base = String(baseTransform || '').trim();
      const extra = String(extraTransform || '').trim();
      if (base && extra) {
        return `${base} ${extra}`;
      }
      return base || extra || '';
    }

    function composeInlineFilter(baseFilter, extraFilter) {
      const base = String(baseFilter || '').trim();
      const extra = String(extraFilter || '').trim();
      if (base && extra) {
        return `${base} ${extra}`;
      }
      return base || extra || '';
    }

    function collectContentRefractionTargets() {
      distortionEntries = [];
    }

    function resetContentRefraction() {
      distortionEntries = [];
    }

    function applyContentRefraction(progress) {
      return;
    }

    function play() {
      if (!host.isConnected) {
        return;
      }
      if (fadeTimer) {
        clearTimeout(fadeTimer);
        fadeTimer = null;
      }
      stopDistortionLoop();
      const reducedMotion = (() => {
        try {
          return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        } catch (error) {
          return false;
        }
      })();
      playCounter += 1;
      const geometry = syncCarrierGeometry();
      currentPlayDurationMs = computeDynamicDuration();
      host.style.setProperty(`--ai-sweep-duration-${id}`, `${currentPlayDurationMs}ms`, 'important');
      turbulence.setAttribute('seed', String(3 + playCounter));
      carrier.style.transform = computeCarrierTransform(0, geometry);
      collectContentRefractionTargets();
      host.removeAttribute('data-playing');
      void host.offsetWidth;
      host.setAttribute('data-playing', 'true');

      if (!reducedMotion) {
        const startAt = performance.now();
        const playId = playCounter;
        const tick = (now) => {
          if (playId !== playCounter) {
            return;
          }
          const progress = Math.min(1, (now - startAt) / currentPlayDurationMs);
          carrier.style.transform = computeCarrierTransform(progress, geometry);
          if (progress < 1) {
            animationRaf = requestAnimationFrame(tick);
            return;
          }
          carrier.style.transform = computeCarrierTransform(1, geometry);
          stopDistortionLoop();
        };
        animationRaf = requestAnimationFrame(tick);
      } else {
        carrier.style.transform = computeCarrierTransform(1, geometry);
      }

      fadeTimer = window.setTimeout(() => {
        host.removeAttribute('data-playing');
        fadeTimer = null;
        stopDistortionLoop();
      }, currentPlayDurationMs + 80);
    }

    function destroy() {
      if (fadeTimer) {
        clearTimeout(fadeTimer);
        fadeTimer = null;
      }
      stopDistortionLoop();
      if (host.parentNode) {
        host.parentNode.removeChild(host);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
      if (updatedPosition) {
        if (previousInlinePosition) {
          target.style.setProperty('position', previousInlinePosition, previousInlinePositionPriority || '');
        } else {
          target.style.removeProperty('position');
        }
      }
      if (updatedOverflow) {
        if (previousInlineOverflow) {
          target.style.setProperty('overflow', previousInlineOverflow, previousInlineOverflowPriority || '');
        } else {
          target.style.removeProperty('overflow');
        }
      }
    }

    updateTheme(config.theme || 'auto');
    (document.head || document.documentElement).appendChild(style);
    target.insertBefore(host, target.firstChild);

    return {
      host: host,
      setTheme: updateTheme,
      play: play,
      destroy: destroy
    };
  };

  window._x_extension_createSearchInput_2024_unique_ = function(options) {
    const config = options || {};
    const input = document.createElement('input');
    applyNoTranslate(input);
    input.id = config.inputId || '_x_extension_search_input_2024_unique_';
    input.setAttribute('data-ai-sweep-distort', 'input');
    input.autocomplete = 'off';
    input.type = 'text';
    input.placeholder = config.placeholder || getMessage('search_placeholder', '搜索或输入网址...');
    input.style.cssText = `
      all: unset !important;
      width: 100% !important;
      padding: 20px 64px 20px 50px !important;
      background: transparent !important;
      border: none !important;
      border-bottom: none !important;
      color: var(--x-ext-input-text, #1F2937) !important;
      font-size: 16px !important;
      font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
      font-weight: 500 !important;
      outline: none !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      line-height: 1 !important;
      text-decoration: none !important;
      list-style: none !important;
      display: block !important;
      text-align: left !important;
      cursor: text !important;
      vertical-align: baseline !important;
      caret-color: var(--x-ext-input-caret, #7DB7FF) !important;
    `;
    applyStyleOverrides(input, config.inputStyleOverrides);

    const hasBorderOverride = Boolean(
      config.inputStyleOverrides &&
      Object.prototype.hasOwnProperty.call(config.inputStyleOverrides, 'border-bottom')
    );
    const showUnderlineWhenEmpty = Boolean(config.showUnderlineWhenEmpty);

    const divider = document.createElement('div');
    applyNoTranslate(divider);
    divider.id = config.dividerId || '_x_extension_input_divider_2024_unique_';
    divider.style.cssText = `
      all: unset !important;
      position: absolute !important;
      left: var(--x-ext-input-divider-inset, 20px) !important;
      right: var(--x-ext-input-divider-inset, 20px) !important;
      bottom: 0 !important;
      height: 1px !important;
      background: var(--x-ext-input-underline, #E5E7EB) !important;
      opacity: var(--x-ext-input-divider-opacity, 0.55) !important;
      pointer-events: none !important;
      display: block !important;
    `;
    applyStyleOverrides(divider, config.dividerStyleOverrides);

    function updateInputUnderline(value) {
      if (hasBorderOverride) {
        divider.style.setProperty('display', 'none', 'important');
        return;
      }
      if (showUnderlineWhenEmpty) {
        divider.style.setProperty('display', 'block', 'important');
        return;
      }
      const isEmpty = !value || !value.trim();
      divider.style.setProperty('display', isEmpty ? 'none' : 'block', 'important');
    }

    updateInputUnderline(input.value);

    if (typeof config.onInput === 'function') {
      input.addEventListener('input', config.onInput);
    }
    input.addEventListener('input', function(event) {
      updateInputUnderline(event.target.value);
    });
    if (typeof config.onFocus === 'function') {
      input.addEventListener('focus', config.onFocus);
    }
    if (typeof config.onBlur === 'function') {
      input.addEventListener('blur', config.onBlur);
    }
    if (typeof config.onKeyDown === 'function') {
      input.addEventListener('keydown', config.onKeyDown);
    }

    function ensureRemixIconStyles() {
      if (!chrome || !chrome.runtime || !chrome.runtime.getURL) {
        return;
      }
      if (document.getElementById('_x_extension_remixicon_css_2024_unique_')) {
        return;
      }
      const host = document.head || document.documentElement;
      if (!host) {
        return;
      }
      const link = document.createElement('link');
      link.id = '_x_extension_remixicon_css_2024_unique_';
      link.rel = 'stylesheet';
      link.href = chrome.runtime.getURL('public/assets/remixicon/fonts/remixicon.css');
      host.appendChild(link);
    }

    function ensureOpenSansStyles() {
      if (!chrome || !chrome.runtime || !chrome.runtime.getURL) {
        return;
      }
      if (document.getElementById('_x_extension_open_sans_css_2024_unique_')) {
        return;
      }
      const host = document.head || document.documentElement;
      if (!host) {
        return;
      }
      const link = document.createElement('link');
      link.id = '_x_extension_open_sans_css_2024_unique_';
      link.rel = 'stylesheet';
      link.href = chrome.runtime.getURL('public/assets/fonts/open-sans/open-sans.css');
      host.appendChild(link);
    }

    ensureOpenSansStyles();
    ensureRemixIconStyles();
    const icon = document.createElement('div');
    applyNoTranslate(icon);
    icon.id = config.iconId || '_x_extension_search_icon_2024_unique_';
    icon.innerHTML = '<i class="_x_extension_svg_2024_unique_ ri-icon ri-size-16 ri-search-line" aria-hidden="true"></i>';
    icon.style.cssText = `
      all: unset !important;
      position: absolute !important;
      left: 20px !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      color: var(--x-ext-input-icon, #9CA3AF) !important;
      pointer-events: none !important;
      z-index: 1 !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: 6px 0 !important;
      line-height: 1 !important;
      text-decoration: none !important;
      list-style: none !important;
      outline: none !important;
      background: transparent !important;
      font-size: 100% !important;
      font: inherit !important;
      vertical-align: baseline !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    `;
    applyStyleOverrides(icon, config.iconStyleOverrides);

    const rightIcon = document.createElement('button');
    applyNoTranslate(rightIcon);
    rightIcon.id = config.rightIconId || '_x_extension_search_right_icon_2024_unique_';
    rightIcon.type = 'button';
    rightIcon.innerHTML = config.rightIconHtml || '<i class="_x_extension_svg_2024_unique_ ri-icon ri-size-16 ri-settings-6-line" aria-hidden="true"></i>';
    rightIcon.setAttribute('aria-label', config.rightIconAlt || getMessage('settings_button_aria', 'Settings'));
    rightIcon.style.cssText = `
      all: unset !important;
      position: absolute !important;
      right: 14px !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      width: 30px !important;
      height: 30px !important;
      border-radius: 8px !important;
      z-index: 2 !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: 0 !important;
      line-height: 1 !important;
      text-decoration: none !important;
      list-style: none !important;
      outline: none !important;
      background: transparent !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      color: var(--x-ext-input-icon, #9CA3AF) !important;
      cursor: pointer !important;
      transition: background-color 140ms ease, color 140ms ease, transform 160ms ease !important;
    `;
    applyStyleOverrides(rightIcon, config.rightIconStyleOverrides);
    Array.from(rightIcon.querySelectorAll('*')).forEach((node) => {
      if (!node || !node.style) {
        return;
      }
      node.style.setProperty('pointer-events', 'none', 'important');
      node.style.setProperty('cursor', 'pointer', 'important');
    });
    const resetRightIconVisualState = () => {
      rightIcon.style.setProperty('background', 'transparent', 'important');
      rightIcon.style.setProperty('color', 'var(--x-ext-input-icon, #9CA3AF)', 'important');
      rightIcon.style.setProperty('transform', 'translateY(-50%)', 'important');
    };
    resetRightIconVisualState();
    rightIcon.addEventListener('mouseenter', () => {
      rightIcon.style.setProperty('background', 'var(--x-ext-input-icon-hover-bg, rgba(148, 163, 184, 0.16))', 'important');
      rightIcon.style.setProperty('color', 'var(--x-ext-input-icon-hover, #4B5563)', 'important');
      rightIcon.style.setProperty('transform', 'translateY(-50%) scale(1.06)', 'important');
    });
    rightIcon.addEventListener('mouseleave', resetRightIconVisualState);
    rightIcon.addEventListener('blur', resetRightIconVisualState);
    rightIcon.addEventListener('pointerup', resetRightIconVisualState);
    rightIcon.addEventListener('pointercancel', resetRightIconVisualState);
    rightIcon.addEventListener('click', () => {
      resetRightIconVisualState();
      if (typeof rightIcon.blur === 'function') {
        rightIcon.blur();
      }
    });

    const container = document.createElement('div');
    applyNoTranslate(container);
    container.id = config.containerId || '_x_extension_input_container_2024_unique_';
    container.style.cssText = `
      all: unset !important;
      position: relative !important;
      width: 100% !important;
      flex-shrink: 0 !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: 0 !important;
      line-height: 1 !important;
      text-decoration: none !important;
      list-style: none !important;
      outline: none !important;
      color: inherit !important;
      font-size: 100% !important;
      font: inherit !important;
      vertical-align: baseline !important;
      display: block !important;
      background: transparent !important;
      border-radius: 28px 28px 0 0 !important;
      overflow: hidden !important;
    `;
    applyStyleOverrides(container, config.containerStyleOverrides);

    container.appendChild(icon);
    container.appendChild(input);
    container.appendChild(divider);
    if (config.showRightIcon !== false) {
      container.appendChild(rightIcon);
    }

    return { container: container, input: input, icon: icon, rightIcon: rightIcon, divider: divider };
  };
})();
