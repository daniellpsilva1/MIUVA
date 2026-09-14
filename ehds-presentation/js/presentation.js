/**
 * EHDS Presentation — Reveal lifecycle, interactions, dialogs, keyboard.
 * Uses Reveal.getIndices().f as the single source of stage state.
 */

(function () {
  'use strict';

  const MAX_ACCESS = 4;
  const MAX_LOOP = 3;
  const MAX_QUALITY = 3;

  function closeAllDialogs() {
    document.querySelectorAll('dialog[open]').forEach(function (d) {
      if (typeof d.close === 'function') d.close();
    });
  }

  function closeDialog(dialog) {
    if (dialog && dialog.open && typeof dialog.close === 'function') {
      dialog.close();
    }
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

  function initDialogs() {
    const dialog = document.getElementById('resources-dialog');
    const openBtn = document.querySelector('[data-resources-open]');
    if (!dialog || !openBtn || dialog.getAttribute('data-bound')) return;
    dialog.setAttribute('data-bound', 'true');

    openBtn.addEventListener('click', function () {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.show();
      openBtn.setAttribute('data-opener', 'true');
    });

    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) closeDialog(dialog);
    });

    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
          e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
          e.key === ' ' || e.key === 'PageUp' || e.key === 'PageDown') {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    dialog.addEventListener('close', function () {
      if (openBtn.getAttribute('data-opener') === 'true') {
        openBtn.focus();
        openBtn.removeAttribute('data-opener');
      }
    });

    const closeBtn = dialog.querySelector('[data-dialog-close]');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () { closeDialog(dialog); });
    }
  }

  function updateAccessView(f) {
    const stage = f + 1;
    const railItems = document.querySelectorAll('.rail-item');
    const detailPanels = document.querySelectorAll('.detail-panel');
    railItems.forEach(function (item, i) {
      item.classList.remove('is-active', 'is-done');
      if (i < stage) item.classList.add('is-done');
      else if (i === stage) item.classList.add('is-active');
    });
    detailPanels.forEach(function (panel) {
      const idx = parseInt(panel.getAttribute('data-detail'), 10);
      panel.classList.toggle('is-active', idx === stage);
    });
    const prev = document.querySelector('[data-pathway-prev]');
    const next = document.querySelector('[data-pathway-next]');
    if (prev) prev.disabled = f < 0;
    if (next) next.disabled = f >= MAX_ACCESS - 1;
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
      if (f < MAX_ACCESS - 1) window.Reveal.navigateFragment(f + 1);
    });
    prev.addEventListener('click', function () {
      const f = getFragmentIndex();
      if (f >= 0) window.Reveal.navigateFragment(f - 1);
    });

    const railButtons = document.querySelectorAll('[data-rail-btn]');
    railButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const step = parseInt(btn.getAttribute('data-step'), 10);
        window.Reveal.navigateFragment(step - 1);
      });
    });
  }

  function updateQualityView(f) {
    const annA = document.querySelector('[data-annotation="A"]');
    const annB = document.querySelector('[data-annotation="B"]');
    const annC = document.querySelector('[data-annotation="C"]');
    const records = document.querySelectorAll('.quality-record');
    const steps = document.querySelectorAll('.quality-step');

    records.forEach(function (rec) {
      rec.classList.remove('is-harmonised', 'is-problem');
    });
    records.forEach(function (rec) {
      const ctx = rec.querySelector('.quality-context');
      if (ctx) ctx.classList.remove('is-missing');
    });
    if (annA) annA.textContent = '';
    if (annB) annB.textContent = '';
    if (annC) annC.textContent = '';

    if (f >= 0) {
      const recA = document.querySelector('[data-record="A"]');
      const recB = document.querySelector('[data-record="B"]');
      if (recA) recA.classList.add('is-harmonised');
      if (recB) recB.classList.add('is-harmonised');
      if (annB) annB.textContent = '≈ 7.0 mmol/L';
    }
    if (f >= 1) {
      const recB = document.querySelector('[data-record="B"]');
      const recC = document.querySelector('[data-record="C"]');
      if (recB) recB.classList.add('is-problem');
      if (recC) recC.classList.add('is-problem');
      const ctxB = document.querySelector('[data-record="B"] .quality-context');
      if (ctxB) ctxB.classList.add('is-missing');
      if (annB) annB.textContent = 'Fasting unknown — cannot interpret';
      if (annC) annC.textContent = 'No number to convert';
    }
    if (f >= 2) {
      if (annA) annA.textContent = 'Valid, but one record only';
      if (annB) annB.textContent = 'Missing context + possible bias';
      if (annC) annC.textContent = 'Cannot contribute to numeric analysis';
    }

    steps.forEach(function (el) {
      const s = parseInt(el.getAttribute('data-quality-step'), 10);
      el.classList.toggle('visible', s <= f + 1);
    });

    const prev = document.querySelector('[data-quality-prev]');
    const next = document.querySelector('[data-quality-next]');
    if (prev) prev.disabled = f < 0;
    if (next) next.disabled = f >= MAX_QUALITY - 1;
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
      if (f < MAX_QUALITY - 1) window.Reveal.navigateFragment(f + 1);
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
  }

  function updateLoopView(f) {
    const stage = f + 1;
    const stages = document.querySelectorAll('.loop-stage');
    const arrows = document.querySelectorAll('.loop-arrow');
    const ret = document.querySelector('[data-loop-return]');
    const gap = document.querySelector('[data-loop-gap]');

    stages.forEach(function (el, i) {
      el.classList.remove('is-active', 'is-done');
      if (i < stage) el.classList.add('is-done');
      else if (i === stage) el.classList.add('is-active');
    });
    arrows.forEach(function (el, i) {
      el.classList.remove('is-active');
      if (i < stage) el.classList.add('is-active');
    });
    if (ret) {
      ret.classList.remove('is-active');
      if (f >= MAX_LOOP - 1) ret.classList.add('is-active');
    }
    if (gap) {
      gap.classList.remove('visible');
      if (f >= MAX_LOOP - 1) gap.classList.add('visible');
    }
  }

  function initLoop() {
    const container = document.querySelector('[data-loop-diagram]');
    if (!container) return;
    if (container.getAttribute('data-bound')) return;
    container.setAttribute('data-bound', 'true');

    const stages = container.querySelectorAll('.loop-stage');
    stages.forEach(function (stage) {
      stage.setAttribute('tabindex', '0');
      stage.setAttribute('role', 'button');
      stage.addEventListener('click', function () {
        const s = parseInt(stage.getAttribute('data-loop-stage'), 10);
        window.Reveal.navigateFragment(s - 1);
      });
      stage.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          const s = parseInt(stage.getAttribute('data-loop-stage'), 10);
          window.Reveal.navigateFragment(s - 1);
        }
      });
    });
  }

  function updateSlideState(slideId) {
    const f = getFragmentIndex();
    if (slideId === 'access') {
      updateAccessView(f);
    } else if (slideId === 'quality') {
      updateQualityView(f);
    } else if (slideId === 'loop') {
      updateLoopView(f);
    }
  }

  function initAll() {
    initDialogs();
    initAccess();
    initLoop();
    initQuality();
    updateSlideState(getSlideId(findCurrentSlide()));
  }

  function onSlideChanged(event) {
    closeAllDialogs();
    const slide = event && event.currentSlide ? event.currentSlide : findCurrentSlide();
    updateSlideState(getSlideId(slide));
  }

  function onFragmentChanged() {
    updateSlideState(getSlideId(findCurrentSlide()));
  }

  function initReveal() {
    if (!window.Reveal || window.Reveal.__ehdsInit) return;
    window.Reveal.__ehdsInit = true;

    const prefersReducedMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const transition = prefersReducedMotion ? 'none' : 'fade';

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
      transitionSpeed: prefersReducedMotion ? 'fast' : 'default',
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
