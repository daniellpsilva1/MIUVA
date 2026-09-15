/**
 * EHDS Presentation — Reveal lifecycle, interactions, keyboard.
 * Uses Reveal.getIndices().f as the single source of stage state.
 * Card slides are native fragments: Right / Next reveals them in order.
 */

(function () {
  'use strict';

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

  function syncCardReveals(slide) {
    if (!slide) return;
    slide.querySelectorAll('[data-card]').forEach(function (card) {
      setCard(card, card.classList.contains('visible'));
    });
    updateMythCounter(slide);
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
  }

  function initAccess() {
    document.querySelectorAll('#access [data-rail-btn]').forEach(function (btn) {
      if (btn.getAttribute('data-bound')) return;
      btn.setAttribute('data-bound', 'true');
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
  }

  function initQuality() {
    document.querySelectorAll('[data-quality-advance]').forEach(function (btn) {
      if (btn.getAttribute('data-bound')) return;
      btn.setAttribute('data-bound', 'true');
      btn.addEventListener('click', function () {
        const f = getFragmentIndex();
        if (f < 3) window.Reveal.navigateFragment(f + 1);
      });
    });
  }

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

  /* "r" reveals all fragments on the current slide, or resets them */
  function initRevealKey() {
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'r' && e.key !== 'R') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA'
          || t.isContentEditable)) return;
      const slide = findCurrentSlide();
      if (!slide) return;
      const fragments = slide.querySelectorAll('.fragment');
      if (!fragments.length) return;
      const f = getFragmentIndex();
      const last = fragments.length - 1;
      window.Reveal.navigateFragment(f >= last ? -1 : last);
    });
  }

  function updateSlideState(slide) {
    const slideId = getSlideId(slide);
    const f = getFragmentIndex();
    if (slideId === 'access') {
      updateAccessView(f);
    } else if (slideId === 'quality') {
      updateQualityView(f);
    }
    syncCardReveals(slide);
  }

  function initAll() {
    initCounter();
    initAccess();
    initQuality();
    initAskCards();
    initTimer();
    initRevealKey();
    updateSlideState(findCurrentSlide());
  }

  function onSlideChanged() {
    updateCounter();
    updateSlideState(findCurrentSlide());
  }

  function onFragmentChanged() {
    updateSlideState(findCurrentSlide());
  }

  function initReveal() {
    if (!window.Reveal || window.Reveal.__ehdsInit) return;
    window.Reveal.__ehdsInit = true;

    const reducedMotion = prefersReducedMotion();
    const transition = reducedMotion ? 'none' : 'fade';

    window.Reveal.initialize({
      backgroundTransition: 'none',
      controls: false,
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
