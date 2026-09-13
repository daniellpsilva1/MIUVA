/**
 * EHDS Presentation — Enhanced Interactivity
 * - Smooth accordion expand/collapse
 * - Clickable loop diagram stages with descriptions
 * - Animated flow diagram on slide entry
 * - Keyboard accessibility
 */

(function () {
  'use strict';

  /* === Loop diagram stage descriptions === */
  var loopStages = [
    'Care & recording — Clinicians record laboratory results, medications and complications during patient care.',
    'Governed access — Health data access bodies assess and manage secure access to data for secondary use.',
    'Research & analysis — Researchers analyse outcomes across populations to identify patterns and hypotheses.',
    'Evaluation — Findings and tools are evaluated for safety, effectiveness and fitness for clinical practice.',
    'Clinical adoption — Evaluated innovations are integrated into workflows, with guidance, training and funding.'
  ];

  function initLoopDiagram() {
    var nodes = document.querySelectorAll('.loop-node');
    var desc = document.getElementById('loop-desc');
    if (!nodes.length || !desc) return;

    nodes.forEach(function (node) {
      node.addEventListener('click', function () {
        var stage = parseInt(node.getAttribute('data-stage'), 10);
        nodes.forEach(function (n) { n.classList.remove('active'); });
        node.classList.add('active');
        desc.style.opacity = '0';
        setTimeout(function () {
          desc.textContent = loopStages[stage] || '';
          desc.style.opacity = '1';
        }, 200);
      });
      node.style.cursor = 'pointer';
    });
  }

  /* === Accordion toggle === */
  function toggleExpandable(header) {
    var panel = header.parentElement;
    panel.classList.toggle('open');
  }

  function initAccordions() {
    var headers = document.querySelectorAll('.expandable-header');
    headers.forEach(function (header) {
      // Prevent double-binding
      if (header.getAttribute('data-bound')) return;
      header.setAttribute('data-bound', 'true');

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
      header.setAttribute('aria-expanded', 'false');
    });
  }

  /* === Animated flow diagram === */
  function animateFlowDiagram(slide) {
    var flowNodes = slide.querySelectorAll('.flow-node');
    var flowArrows = slide.querySelectorAll('.flow-arrow');
    if (!flowNodes.length) return;

    flowNodes.forEach(function (node, i) {
      node.style.opacity = '0';
      node.style.transform = 'translateY(15px) scale(0.9)';
      node.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      setTimeout(function () {
        node.style.opacity = '1';
        node.style.transform = 'translateY(0) scale(1)';
      }, 200 + i * 150);
    });

    flowArrows.forEach(function (arrow, i) {
      arrow.style.opacity = '0';
      arrow.style.transition = 'opacity 0.3s ease';
      setTimeout(function () {
        arrow.style.opacity = '';
      }, 200 + (i + 1) * 150);
    });
  }

  /* === Initialize everything === */
  function initAll() {
    initAccordions();
    initLoopDiagram();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // Re-init when Reveal.js is ready
  document.addEventListener('ready', function (event) {
    initAll();
    // Animate flow diagram on the first content slide if it's visible
    if (event.indexh === 1) {
      animateFlowDiagram(event.currentSlide);
    }
  });

  // Animate flow diagram and re-init on each slide change
  document.addEventListener('slidechanged', function (event) {
    initAll();
    animateFlowDiagram(event.currentSlide);
    // Reset loop description
    var desc = document.getElementById('loop-desc');
    if (desc && event.currentSlide.querySelector('.loop-svg')) {
      desc.textContent = 'Click a stage to learn more \u00b7 Read clockwise: a continuous learning cycle';
      desc.style.opacity = '1';
      document.querySelectorAll('.loop-node').forEach(function (n) {
        n.classList.remove('active');
      });
    }
  });
})();
