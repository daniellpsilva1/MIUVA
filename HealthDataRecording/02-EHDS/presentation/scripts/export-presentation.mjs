/**
 * Export the 10-slide deck to a landscape 16:9 PDF (answers revealed).
 * Usage: node scripts/export-presentation.mjs [destination]
 * Default output: EHDS_Presentation.pdf in the repo root.
 */

import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const defaultOutput = join(root, 'EHDS_Presentation.pdf');
const destArg = process.argv[2];
const output = destArg ? destArg : defaultOutput;
const SLIDE_WIDTH = 1280;
const SLIDE_HEIGHT = 720;

function validateAssets() {
  const required = [
    join(root, 'index.html'),
    join(root, 'css/base.css'),
    join(root, 'css/theme.css'),
    join(root, 'js/presentation.js'),
    join(root, 'lib/reveal.js'),
  ];
  const missing = required.filter((p) => !existsSync(p));
  if (missing.length > 0) {
    throw new Error('Missing required assets: ' + missing.join(', '));
  }
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function exportPdf() {
  validateAssets();

  const fileUrl = pathToFileURL(join(root, 'index.html')).href;
  let browser;
  try {
    browser = await chromium.launch();
    const context = await browser.newContext({
      deviceScaleFactor: 2,
      reducedMotion: 'reduce',
      viewport: { width: SLIDE_WIDTH, height: SLIDE_HEIGHT },
    });
    const page = await context.newPage();
    await page.goto(fileUrl, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => (
      window.Reveal && typeof window.Reveal.isReady === 'function' && window.Reveal.isReady()
    ));

    await page.addStyleTag({
      content: `
        .deck-rail,
        .slide-counter,
        .reveal .progress,
        aside.notes {
          display: none !important;
        }
      `,
    });

    const total = await page.evaluate(() => window.Reveal.getTotalSlides());
    const frames = [];

    for (let i = 0; i < total; i++) {
      await page.evaluate((h) => {
        window.Reveal.slide(h);
      }, i);
      await wait(200);
      await page.evaluate(() => {
        const slide = window.Reveal.getCurrentSlide();
        const fragments = slide.querySelectorAll('.fragment');
        if (fragments.length) {
          window.Reveal.navigateFragment(fragments.length - 1);
        }
        const timer = document.querySelector('#closing [data-timer]');
        if (timer) {
          timer.classList.remove('is-running');
          const label = timer.querySelector('.timer-label');
          const display = timer.querySelector('.timer-display');
          if (label) label.textContent = '60 s';
          if (display) display.textContent = '01:00';
        }
      });
      await wait(400);
      const png = await page.screenshot({
        clip: { x: 0, y: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT },
        type: 'png',
      });
      frames.push('data:image/png;base64,' + png.toString('base64'));
    }

    const printPage = await context.newPage();
    const imgs = frames.map((src) => '<img src="' + src + '" alt="">').join('');
    await printPage.setContent(
      '<!DOCTYPE html><html><head><style>'
      + '@page { size: ' + SLIDE_WIDTH + 'px ' + SLIDE_HEIGHT + 'px; margin: 0; }'
      + 'html, body { margin: 0; background: #f4efe6; }'
      + 'img { display: block; width: ' + SLIDE_WIDTH + 'px; height: ' + SLIDE_HEIGHT
      + 'px; page-break-after: always; }'
      + 'img:last-child { page-break-after: auto; }'
      + '</style></head><body>' + imgs + '</body></html>',
      { waitUntil: 'load' },
    );
    await printPage.evaluate(() => Promise.all(
      [...document.images].map((img) => (
        img.complete ? Promise.resolve() : new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        })
      )),
    ));

    await printPage.pdf({
      path: output,
      height: SLIDE_HEIGHT + 'px',
      printBackground: true,
      width: SLIDE_WIDTH + 'px',
    });
  } finally {
    if (browser) await browser.close();
  }

  console.log('Exported:', output);
}

exportPdf().catch((err) => {
  console.error('Export failed:', err);
  process.exit(1);
});
