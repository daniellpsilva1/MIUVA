/**
 * Export the handbook HTML to a tagged A4 PDF using Playwright Chromium.
 * Usage: node scripts/export-handbook.mjs [destination]
 * Default output: EHDS_Presentation_Handbook_Revised.pdf in the repo root.
 */

import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const defaultOutput = join(root, 'EHDS_Presentation_Handbook_Revised.pdf');
const destArg = process.argv[2];
const output = destArg ? destArg : defaultOutput;

const handbookPath = join(root, 'handbook.html');
const fileUrl = 'file://' + handbookPath;

async function exportPdf() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  await page.pdf({
    path: output,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: '18mm', bottom: '16mm', left: '18mm', right: '18mm' },
    tagged: true,
    outline: true,
  });

  await browser.close();

  console.log('Exported:', output);

  if (destArg && existsSync(destArg)) {
    console.log('Copy destination set:', destArg);
  }
}

exportPdf().catch((err) => {
  console.error('Export failed:', err);
  process.exit(1);
});
