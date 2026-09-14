/**
 * Export the handbook HTML to a tagged A4 PDF using Playwright Chromium.
 * Usage: node scripts/export-handbook.mjs [destination]
 * Default output: EHDS_Presentation_Handbook_Revised.pdf in the repo root.
 */

import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const defaultOutput = join(root, 'EHDS_Presentation_Handbook_Revised.pdf');
const destArg = process.argv[2];
const output = destArg ? destArg : defaultOutput;

const handbookPath = join(root, 'handbook.html');
const fileUrl = pathToFileURL(handbookPath).href;

function validateAssets() {
  const required = [
    join(root, 'handbook.html'),
    join(root, 'css/base.css'),
    join(root, 'css/handbook.css'),
  ];
  const missing = required.filter((p) => !existsSync(p));
  if (missing.length > 0) {
    throw new Error('Missing required assets: ' + missing.join(', '));
  }
}

async function exportPdf() {
  validateAssets();

  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto(fileUrl, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    await page.evaluate(() => {
      document.querySelectorAll('details').forEach((el) => {
        el.setAttribute('open', '');
      });
    });

    await page.addStyleTag({
      content: `
        @page {
          @bottom-center {
            content: counter(page) " / " counter(pages);
            font-family: 'Titillium Web', sans-serif;
            font-size: 9pt;
            color: #6b6357;
          }
        }
      `,
    });

    await page.pdf({
      path: output,
      format: 'A4',
      margin: { bottom: '16mm', left: '18mm', right: '18mm', top: '18mm' },
      outline: true,
      preferCSSPageSize: true,
      printBackground: true,
      tagged: true,
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
