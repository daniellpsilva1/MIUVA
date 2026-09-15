/**
 * EHDS Presentation — Reveal lifecycle, interactions, keyboard.
 * Uses Reveal.getIndices().f as the single source of stage state for
 * stepped slides; per-card is-revealed toggles for free-explore slides.
 */

(function () {
  'use strict';

  const MAX_ACCESS = 4;
  const MAX_QUALITY = 3;
  const MOTION_CARDS = '.journey-card, .myth-card, .europe-card, .country-card,'
    + ' .loop-node, .path-step, .quality-record, .road-card, .goal-row,'
    + ' .ask-card, .stat-tile';

  function prefersReducedMotion() {
    return window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function findCurrentSlide() {
    if (window.Reveal && typeof window.Reveal.getCurrentSlide === 'function') {
      return window.Reveal.getCurrentSlide();
    }
    return document.querySelector('.reveal .present');
  }

  function getFragmentIndex() {
    if (window.Reveal && typeof window.Reveal.getIndices === 'function') {
      const idx = window.Reveal.getIndices();
      return idx ? idx.f : -1;
    }
    return -1;
  }

  function getSlideId(slide) {
    if (!slide) return null;
    const id = slide.getAttribute('id');
    if (id) return id;
    const section = slide.closest('section');
    return section ? section.getAttribute('id') : null;
  }

  /* Slide counter — "n / 9" bottom-right */
  function initCounter() {
    if (document.querySelector('.slide-counter')) return;
    const counter = document.createElement('div');
    counter.className = 'slide-counter';
    counter.setAttribute('aria-hidden', 'true');
    const reveal = document.querySelector('.reveal');
    (reveal || document.body).appendChild(counter);
    updateCounter();
  }

  function updateCounter() {
    const counter = document.querySelector('.slide-counter');
    if (!counter || !window.Reveal) return;
    const total = document.querySelectorAll('.reveal > .slides > section').length;
    const idx = window.Reveal.getIndices();
    counter.textContent = (idx.h + 1) + ' / ' + total;
  }

  /* Free-explore card toggles (journey, myths, europe, loop) */
  function setCard(card, revealed) {
    card.classList.toggle('is-revealed', revealed);
    card.setAttribute('aria-expanded', revealed ? 'true' : 'false');
  }

  function updateMythCounter(scope) {
    const counter = scope.querySelector('[data-myth-counter]');
    if (!counter) return;
    const myths = scope.querySelectorAll('[data-card][data-myth]');
    const done = scope.querySelectorAll('[data-card][data-myth].is-revealed');
    counter.textContent = 'Myths busted: ' + done.length + ' / ' + myths.length;
  }

  function initCards() {
    document.querySelectorAll('[data-card]').forEach(function (card) {
      if (card.getAttribute('data-bound')) return;
      card.setAttribute('data-bound', 'true');
      card.addEventListener('click', function () {
        setCard(card, !card.classList.contains('is-revealed'));
        const scope = card.closest('section');
        if (scope) updateMythCounter(scope);
      });
    });

    document.querySelectorAll('[data-reveal-all]').forEach(function (btn) {
      if (btn.getAttribute('data-bound')) return;
      btn.setAttribute('data-bound', 'true');
      btn.addEventListener('click', function () {
        const scope = btn.closest('section');
        if (!scope) return;
        scope.querySelectorAll('[data-card]').forEach(function (card) {
          setCard(card, true);
        });
        updateMythCounter(scope);
      });
    });

    document.querySelectorAll('[data-reset-cards]').forEach(function (btn) {
      if (btn.getAttribute('data-bound')) return;
      btn.setAttribute('data-bound', 'true');
      btn.addEventListener('click', function () {
        const scope = btn.closest('section');
        if (!scope) return;
        scope.querySelectorAll('[data-card]').forEach(function (card) {
          setCard(card, false);
        });
        updateMythCounter(scope);
      });
    });
  }

  /* Access pathway — fragment-stepped, f = -1..4; step 1 is active at f = -1 */
  function updateAccessView(f) {
    const stage = f + 1;
    const steps = document.querySelectorAll('#access .path-step');
    steps.forEach(function (step) {
      const i = parseInt(step.getAttribute('data-step'), 10);
      step.classList.remove('is-active', 'is-done');
      if (i < stage) step.classList.add('is-done');
      else if (i === stage) step.classList.add('is-active');
    });
    const prev = document.querySelector('[data-pathway-prev]');
    const next = document.querySelector('[data-pathway-next]');
    if (prev) prev.disabled = f < 0;
    if (next) next.disabled = f >= MAX_ACCESS;
  }

  function initAccess() {
    const next = document.querySelector('[data-pathway-next]');
    const prev = document.querySelector('[data-pathway-prev]');
    if (!next || !prev) return;
    if (next.getAttribute('data-bound')) return;
    next.setAttribute('data-bound', 'true');
    prev.setAttribute('data-bound', 'true');

    next.addEventListener('click', function () {
      const f = getFragmentIndex();
      if (f < MAX_ACCESS) window.Reveal.navigateFragment(f + 1);
    });
    prev.addEventListener('click', function () {
      const f = getFragmentIndex();
      if (f >= 0) window.Reveal.navigateFragment(f - 1);
    });

    document.querySelectorAll('#access [data-rail-btn]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const step = parseInt(btn.getAttribute('data-step'), 10);
        window.Reveal.navigateFragment(step);
      });
    });
  }

  /* Quality records — fragment-stepped, f = -1..3 */
  function updateQualityView(f) {
    const recA = document.querySelector('[data-record="A"]');
    const recB = document.querySelector('[data-record="B"]');
    const recC = document.querySelector('[data-record="C"]');
    [
      [recA, 0, 'is-ok'],
      [recB, 1, 'is-problem'],
      [recC, 2, 'is-problem'],
    ].forEach(function (entry) {
      const rec = entry[0];
      const threshold = entry[1];
      const mark = entry[2];
      if (!rec) return;
      rec.classList.toggle('is-revealed', f >= threshold);
      rec.classList.toggle(mark, f >= threshold);
    });

    const prev = document.querySelector('[data-quality-prev]');
    const next = document.querySelector('[data-quality-next]');
    if (prev) prev.disabled = f < 0;
    if (next) next.disabled = f >= MAX_QUALITY;
  }

  function initQuality() {
    const next = document.querySelector('[data-quality-next]');
    const prev = document.querySelector('[data-quality-prev]');
    const reset = document.querySelector('[data-quality-reset]');
    if (!next || !prev) return;
    if (next.getAttribute('data-bound')) return;
    next.setAttribute('data-bound', 'true');
    prev.setAttribute('data-bound', 'true');
    if (reset) reset.setAttribute('data-bound', 'true');

    next.addEventListener('click', function () {
      const f = getFragmentIndex();
      if (f < MAX_QUALITY) window.Reveal.navigateFragment(f + 1);
    });
    prev.addEventListener('click', function () {
      const f = getFragmentIndex();
      if (f >= 0) window.Reveal.navigateFragment(f - 1);
    });
    if (reset) {
      reset.addEventListener('click', function () {
        window.Reveal.navigateFragment(-1);
      });
    }

    document.querySelectorAll('[data-quality-advance]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const f = getFragmentIndex();
        if (f < MAX_QUALITY) window.Reveal.navigateFragment(f + 1);
      });
    });
  }

  /* Discussion cards — one open at a time */
  function initAskCards() {
    document.querySelectorAll('[data-ask-card]').forEach(function (card) {
      if (card.getAttribute('data-bound')) return;
      card.setAttribute('data-bound', 'true');
      card.addEventListener('click', function () {
        const open = card.classList.contains('is-open');
        document.querySelectorAll('[data-ask-card]').forEach(function (c) {
          c.classList.remove('is-open');
          c.setAttribute('aria-expanded', 'false');
        });
        if (!open) {
          card.classList.add('is-open');
          card.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* Friend-test countdown timer */
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function initTimer() {
    const btn = document.querySelector('[data-timer]');
    if (!btn || btn.getAttribute('data-bound')) return;
    btn.setAttribute('data-bound', 'true');
    const label = btn.querySelector('.timer-label');
    const display = btn.querySelector('.timer-display');
    const total = parseInt(btn.getAttribute('data-timer-seconds'), 10) || 60;
    let remaining = total;
    let interval = null;

    function render() {
      if (display) display.textContent = formatTime(remaining);
    }

    function stop() {
      if (interval) {
        window.clearInterval(interval);
        interval = null;
      }
      btn.classList.remove('is-running');
    }

    btn.addEventListener('click', function () {
      if (interval) {
        stop();
        remaining = total;
        render();
        if (label) label.textContent = 'Start ' + total + ' s';
        return;
      }
      if (remaining <= 0) {
        remaining = total;
        render();
        if (label) label.textContent = 'Start ' + total + ' s';
        return;
      }
      btn.classList.add('is-running');
      if (label) label.textContent = 'Running';
      interval = window.setInterval(function () {
        remaining -= 1;
        render();
        if (remaining <= 0) {
          stop();
          if (label) label.textContent = 'Reset';
        }
      }, 1000);
    });
  }

  /* Staggered entrance — fade-up cards on the incoming slide */
  function animateSlideCards(slide) {
    if (!slide) return;
    const cards = slide.querySelectorAll(MOTION_CARDS);
    cards.forEach(function (card) {
      card.classList.remove('is-in');
    });
    cards.forEach(function (card, i) {
      window.setTimeout(function () {
        card.classList.add('is-in');
      }, 30 + i * 40);
    });
  }

  /* "r" toggles Reveal all / Reset on the current card slide */
  function initRevealKey() {
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'r' && e.key !== 'R') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA'
          || t.isContentEditable)) return;
      const slide = findCurrentSlide();
      if (!slide) return;
      const cards = slide.querySelectorAll('[data-card]');
      if (!cards.length) return;
      const allRevealed = Array.prototype.every.call(cards, function (c) {
        return c.classList.contains('is-revealed');
      });
      cards.forEach(function (c) {
        setCard(c, !allRevealed);
      });
      updateMythCounter(slide);
    });
  }

  function updateSlideState(slideId) {
    const f = getFragmentIndex();
    if (slideId === 'access') {
      updateAccessView(f);
    } else if (slideId === 'quality') {
      updateQualityView(f);
    }
  }

  function initAll() {
    initCounter();
    initCards();
    initAccess();
    initQuality();
    initAskCards();
    initTimer();
    initRevealKey();
    if (!prefersReducedMotion()) {
      const reveal = document.querySelector('.reveal');
      if (reveal) reveal.classList.add('has-motion');
      animateSlideCards(findCurrentSlide());
    }
    updateSlideState(getSlideId(findCurrentSlide()));
  }

  function onSlideChanged() {
    updateCounter();
    const slide = findCurrentSlide();
    if (!prefersReducedMotion()) animateSlideCards(slide);
    updateSlideState(getSlideId(slide));
  }

  function onFragmentChanged() {
    updateSlideState(getSlideId(findCurrentSlide()));
  }

  function initReveal() {
    if (!window.Reveal || window.Reveal.__ehdsInit) return;
    window.Reveal.__ehdsInit = true;

    const reducedMotion = prefersReducedMotion();
    const transition = reducedMotion ? 'none' : 'fade';

    window.Reveal.initialize({
      controls: true,
      hash: true,
      height: 720,
      margin: 0.06,
      maxScale: 2.0,
      minScale: 0.2,
      plugins: window.RevealNotes ? [window.RevealNotes] : [],
      progress: true,
      slideNumber: false,
      transition: transition,
      transitionSpeed: reducedMotion ? 'fast' : 'default',
      width: 1280,
    }).then(initAll);

    window.Reveal.on('slidechanged', onSlideChanged);
    window.Reveal.on('fragmentshown', onFragmentChanged);
    window.Reveal.on('fragmenthidden', onFragmentChanged);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReveal);
  } else {
    initReveal();
  }
})();
