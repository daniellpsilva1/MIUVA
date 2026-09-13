/**
 * EHDS Presentation — Interactivity
 * - Accordion expand/collapse
 * - Clickable loop diagram stages
 * - Keyboard accessibility
 */

(function () {
  'use strict';

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
      if (node.getAttribute('data-bound')) return;
      node.setAttribute('data-bound', 'true');

      node.addEventListener('click', function () {
        var stage = parseInt(node.getAttribute('data-stage'), 10);
        nodes.forEach(function (n) { n.classList.remove('active'); });
        node.classList.add('active');
        desc.style.opacity = '0';
        setTimeout(function () {
          desc.textContent = loopStages[stage] || '';
          desc.style.opacity = '1';
        }, 150);
      });
    });
  }

  function toggleExpandable(header) {
    var panel = header.parentElement;
    panel.classList.toggle('open');
  }

  function initAccordions() {
    var headers = document.querySelectorAll('.expandable-header');
    headers.forEach(function (header) {
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
    });
  }

  function initAll() {
    initAccordions();
    initLoopDiagram();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  document.addEventListener('ready', initAll);
  document.addEventListener('slidechanged', function (event) {
    initAll();
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
