<p align="center">
  <img src="./public/assets/images/lumno.png" alt="Lumno logo" width="96" height="96" />
</p>

<h1 align="center">Lumno</h1>

<p align="center">
  A lightweight command bar for Chromium browsers.
  <br />
  Open a floating search overlay from any page, search faster, jump to URLs, switch tabs, and upgrade the new tab experience.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-MV3-111827?style=flat-square" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/Browser-Chromium-2563eb?style=flat-square" alt="Chromium" />
  <img src="https://img.shields.io/badge/Language-JavaScript-f59e0b?style=flat-square" alt="JavaScript" />
  <img src="https://img.shields.io/badge/License-GPL--3.0-16a34a?style=flat-square" alt="GPL-3.0" />
  <img src="https://img.shields.io/badge/Build-No%20build%20step-7c3aed?style=flat-square" alt="No build step" />
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/59161f7d-0089-4997-b57f-8d3b936a4619" alt="Lumno preview 1" width="100%" /> 
  &nbsp;
  <img src="https://github.com/user-attachments/assets/8057bd2b-51db-41f8-8d11-c6a13f8308ac" alt="Lumno preview 3" width="100%" />
</p>

## ✨ Why Lumno

Lumno turns the browser into a faster command surface:

- Open a unified search overlay on top of any page.
- Search history, bookmarks, top sites, open tabs, and web suggestions in one place.
- Jump directly to URLs and internal browser pages with keyword shortcuts.
- Use the same search workflow in the overridden new tab page.
- Add site search shortcuts like `gh`, `yt`, `bb`, or your own custom providers.
- Enable automatic Picture-in-Picture for supported video sites when switching tabs.
- Arc-styed search experience.

## 🚀 Highlights

### Global command overlay

- Trigger Lumno from anywhere with a keyboard shortcut.
- Recognize URLs instantly and navigate without extra clicks.
- Use Tab autocomplete to accept smart completions quickly.
- Switch to already opened tabs instead of opening duplicates.

### Smarter search flows

- Mix results from browser history, bookmarks, top sites, and suggestions.
- Use built-in commands like `settings` or `extensions` for fast browser navigation.
- Trigger site-specific search with a keyword, then press Tab to lock the search target.
- Add, edit, disable, reset, export, or import custom site-search shortcuts in the settings page.

### Better new tab page

- Replace the default new tab with the same Lumno search input.
- Show recent or most visited sites.
- Show bookmarks with configurable counts and columns.
- Support theme mode, wallpaper, language selection, and synced settings.

### Extra quality-of-life features

- Optional automatic Picture-in-Picture for supported sites such as YouTube, Bilibili, iQIYI, Youku, Tencent Video, and Douyin.
- Separate handling for restricted pages where overlays cannot be injected.
- Localized UI with English, Simplified Chinese, Traditional Chinese (Taiwan), and Traditional Chinese (Hong Kong).

## 📦 Installation

Install from the Chrome Web Store:

[Install Lumno on Chrome Web Store](https://chromewebstore.google.com/detail/nggfkkbmogmadfoikakkfegkoilfcfao?utm_source=item-share-cb)

For manual installation:

1. Clone or download this repository.
2. Open `chrome://extensions`.
3. Enable `Developer mode`.
4. Click `Load unpacked` and select the repository folder.

## 🛠️ Basic usage

```text
Open overlay         -> Press the configured shortcut
Search GitHub        -> Type gh react query, then press Tab
Open a URL           -> Type example.com, then press Enter
Switch to open tab   -> Type a matching tab title, then press Enter
Open settings        -> Type settings
```

## 🔎 Built-in site search examples

Lumno ships with built-in providers such as:

- `gh` for GitHub
- `yt` for YouTube
- `bb` for Bilibili
- `gg` for Google
- `bi` for Bing
- `zh` for Zhihu
- `rd` for Reddit
- `wk` for Wikipedia

You can also add your own providers using a URL template like:

```text
https://example.com/search?q={query}
```

## 🙌 Credits

- Created and maintained by [Kubai087](https://github.com/kubai087)
- Bundled icon set: [Remix Icon](https://remixicon.com/)
- Bundled typeface: Open Sans

[![Star History Chart](https://api.star-history.com/svg?repos=kubai087/lumno-extension&type=Date)](https://www.star-history.com/#kubai087/lumno-extension&Date)
