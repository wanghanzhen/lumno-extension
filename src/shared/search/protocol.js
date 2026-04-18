(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoSearchProtocol = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const SEARCH_ACTION_GET_SUGGESTIONS = 'getSearchSuggestions';
  const SEARCH_SUGGESTIONS_MODE_CLASSIC = 'classic';

  function normalizeSearchSuggestionsMode(mode) {
    return mode === SEARCH_SUGGESTIONS_MODE_CLASSIC
      ? SEARCH_SUGGESTIONS_MODE_CLASSIC
      : SEARCH_SUGGESTIONS_MODE_CLASSIC;
  }

  return Object.freeze({
    SEARCH_ACTION_GET_SUGGESTIONS,
    SEARCH_SUGGESTIONS_MODE_CLASSIC,
    normalizeSearchSuggestionsMode
  });
});
