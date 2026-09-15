/**
 * EHDS Presentation — Reveal lifecycle and keyboard-driven reveals.
 * Card shells stay visible; answer fragments step in with the arrows.
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
      const answers = card.querySelectorAll('.fragment');
      let revealed = false;
      answers.forEach(function (el) {
        if (el.classList.contains('visible')) revealed = true;
      });
      setCard(card, revealed);
    });
    updateMythCounter(slide);
  }

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

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function initTimer() {
    const el = document.querySelector('[data-timer]');
    if (!el || el.getAttribute('data-bound')) {
      return el && el.__ehdsTimer;
    }
    el.setAttribute('data-bound', 'true');
    const label = el.querySelector('.timer-label');
    const display = el.querySelector('.timer-display');
    const total = parseInt(el.getAttribute('data-timer-seconds'), 10) || 60;
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
      el.classList.remove('is-running');
    }

    function reset() {
      stop();
      remaining = total;
      render();
      if (label) label.textContent = total + ' s';
    }

    function start() {
      if (interval) return;
      remaining = total;
      render();
      el.classList.add('is-running');
      if (label) label.textContent = 'Running';
      interval = window.setInterval(function () {
        remaining -= 1;
        render();
        if (remaining <= 0) {
          stop();
          if (label) label.textContent = 'Done';
        }
      }, 1000);
    }

    el.__ehdsTimer = { start: start, reset: reset };
    return el.__ehdsTimer;
  }

  function syncTimer(slideId) {
    const timer = initTimer();
    if (!timer) return;
    if (slideId === 'closing') timer.start();
    else timer.reset();
  }

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
    initTimer();
    initRevealKey();
    updateSlideState(findCurrentSlide());
    syncTimer(getSlideId(findCurrentSlide()));
  }

  function onSlideChanged() {
    updateCounter();
    const slide = findCurrentSlide();
    updateSlideState(slide);
    syncTimer(getSlideId(slide));
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
      transitionSpeed: reducedMotion ? 'fast' : 'slow',
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
