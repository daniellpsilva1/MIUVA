/**
 * EHDS Presentation — custom interactivity
 * Handles expandable/accordion elements and keyboard accessibility.
 */

(function () {
  'use strict';

  function toggleExpandable(header) {
    var panel = header.parentElement;
    panel.classList.toggle('open');
  }

  function init() {
    var headers = document.querySelectorAll('.expandable-header');
    headers.forEach(function (header) {
      header.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleExpandable(header);
      });
      header.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleExpandable(header);
        }
      });
      header.setAttribute('tabindex', '0');
      header.setAttribute('role', 'button');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-initialise after Reveal.js is ready (slides may be re-rendered)
  document.addEventListener('ready', init);
})();
