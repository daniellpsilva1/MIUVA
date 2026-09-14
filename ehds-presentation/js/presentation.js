/**
 * EHDS Presentation — Reveal lifecycle, interactions, dialogs, keyboard.
 * Uses documented Reveal.on(...) subscriptions and one idempotent init path.
 */

(function () {
  'use strict';

  const MAX_QUALITY_STEP = 3;
  const MAX_LOOP_STAGE = 3;
  const MAX_PATHWAY_STEP = 4;

  let qualityStep = 0;
  let loopStage = 0;
  let pathwayStep = 0;

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

  function getSlideId(slide) {
    if (!slide) return null;
    const id = slide.getAttribute('id');
    if (id) return id;
    const section = slide.closest('section');
    return section ? section.getAttribute('id') : null;
  }

  function initDialogs() {
    const openBtn = document.querySelector('[data-resources-open]');
    const dialog = document.getElementById('resources-dialog');
    if (!openBtn || !dialog || dialog.getAttribute('data-bound')) return;
    dialog.setAttribute('data-bound', 'true');

    openBtn.addEventListener('click', function () {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.show();
    });

    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) closeDialog(dialog);
    });

    const closeBtn = dialog.querySelector('[data-dialog-close]');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () { closeDialog(dialog); });
    }
  }

  function updatePathwayControls() {
    const prev = document.querySelector('[data-pathway-prev]');
    const next = document.querySelector('[data-pathway-next]');
    if (prev) prev.disabled = pathwayStep === 0;
    if (next) next.disabled = pathwayStep === MAX_PATHWAY_STEP;
  }

  function updatePathwayView() {
    const steps = document.querySelectorAll('.pathway-step');
    steps.forEach(function (step, i) {
      step.classList.remove('is-active', 'is-done');
      if (i < pathwayStep) step.classList.add('is-done');
      else if (i === pathwayStep) step.classList.add('is-active');
    });
  }

  function initPathway() {
    const prev = document.querySelector('[data-pathway-prev]');
    const next = document.querySelector('[data-pathway-next]');
    if (!prev || !next) return;
    if (prev.getAttribute('data-bound')) return;
    prev.setAttribute('data-bound', 'true');
    next.setAttribute('data-bound', 'true');

    next.addEventListener('click', function () {
      if (pathwayStep < MAX_PATHWAY_STEP) {
        pathwayStep++;
        updatePathwayView();
        updatePathwayControls();
      }
    });
    prev.addEventListener('click', function () {
      if (pathwayStep > 0) {
        pathwayStep--;
        updatePathwayView();
        updatePathwayControls();
      }
    });
    updatePathwayView();
    updatePathwayControls();
  }

  function updateQualityControls() {
    const prev = document.querySelector('[data-quality-prev]');
    const next = document.querySelector('[data-quality-next]');
    if (prev) prev.disabled = qualityStep === 0;
    if (next) next.disabled = qualityStep === MAX_QUALITY_STEP;
  }

  function updateQualityView() {
    const records = document.querySelectorAll('.quality-record');
    const steps = document.querySelectorAll('.quality-step');
    const stepEls = document.querySelectorAll('[data-quality-step]');

    records.forEach(function (rec) {
      rec.classList.remove('is-harmonised', 'is-problem');
    });
    stepEls.forEach(function (el) {
      el.classList.remove('visible');
    });

    if (qualityStep >= 1) {
      const recA = document.querySelector('[data-record="A"]');
      const recB = document.querySelector('[data-record="B"]');
      if (recA) recA.classList.add('is-harmonised');
      if (recB) recB.classList.add('is-harmonised');
    }
    if (qualityStep >= 2) {
      const recB2 = document.querySelector('[data-record="B"]');
      const recC = document.querySelector('[data-record="C"]');
      if (recB2) recB2.classList.add('is-problem');
      if (recC) recC.classList.add('is-problem');
      const ctxB = document.querySelector('[data-record="B"] .quality-context');
      if (ctxB) ctxB.classList.add('is-missing');
    }

    steps.forEach(function (el) {
      const s = parseInt(el.getAttribute('data-quality-step'), 10);
      if (s <= qualityStep) el.classList.add('visible');
    });
  }

  function initQuality() {
    const prev = document.querySelector('[data-quality-prev]');
    const next = document.querySelector('[data-quality-next]');
    const reset = document.querySelector('[data-quality-reset]');
    if (!prev || !next) return;
    if (prev.getAttribute('data-bound')) return;
    prev.setAttribute('data-bound', 'true');
    next.setAttribute('data-bound', 'true');
    if (reset) reset.setAttribute('data-bound', 'true');

    next.addEventListener('click', function () {
      if (qualityStep < MAX_QUALITY_STEP) {
        qualityStep++;
        updateQualityView();
        updateQualityControls();
      }
    });
    prev.addEventListener('click', function () {
      if (qualityStep > 0) {
        qualityStep--;
        updateQualityView();
        updateQualityControls();
      }
    });
    if (reset) {
      reset.addEventListener('click', function () {
        qualityStep = 0;
        updateQualityView();
        updateQualityControls();
      });
    }
    updateQualityView();
    updateQualityControls();
  }

  function updateLoopView() {
    const stages = document.querySelectorAll('.loop-stage');
    const arrows = document.querySelectorAll('.loop-arrow');
    const ret = document.querySelector('[data-loop-return]');
    const gap = document.querySelector('[data-loop-gap]');

    stages.forEach(function (stage, i) {
      stage.classList.remove('is-active', 'is-done');
      if (i < loopStage) stage.classList.add('is-done');
      else if (i === loopStage) stage.classList.add('is-active');
    });
    arrows.forEach(function (arrow, i) {
      arrow.classList.remove('is-active');
      if (i < loopStage) arrow.classList.add('is-active');
    });
    if (ret) {
      ret.classList.remove('is-active');
      if (loopStage >= MAX_LOOP_STAGE) ret.classList.add('is-active');
    }
    if (gap) {
      gap.classList.remove('visible');
      if (loopStage >= MAX_LOOP_STAGE) gap.classList.add('visible');
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
        loopStage = s;
        updateLoopView();
      });
      stage.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          const s = parseInt(stage.getAttribute('data-loop-stage'), 10);
          loopStage = s;
          updateLoopView();
        }
      });
    });
    updateLoopView();
  }

  function resetSlideState(slideId) {
    if (slideId === 'access') {
      pathwayStep = 0;
      updatePathwayView();
      updatePathwayControls();
    } else if (slideId === 'quality') {
      qualityStep = 0;
      updateQualityView();
      updateQualityControls();
    } else if (slideId === 'loop') {
      loopStage = 0;
      updateLoopView();
    }
  }

  function initAll() {
    initDialogs();
    initLoop();
    initPathway();
    initQuality();
  }

  function onSlideChanged(event) {
    closeAllDialogs();
    const slide = event && event.currentSlide ? event.currentSlide : findCurrentSlide();
    const slideId = getSlideId(slide);
    resetSlideState(slideId);
  }

  function initReveal() {
    if (!window.Reveal || window.Reveal.__ehdsInit) return;
    window.Reveal.__ehdsInit = true;

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
      transition: 'fade',
      width: 1280,
    }).then(initAll);

    window.Reveal.on('slidechanged', onSlideChanged);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReveal);
  } else {
    initReveal();
  }
})();
