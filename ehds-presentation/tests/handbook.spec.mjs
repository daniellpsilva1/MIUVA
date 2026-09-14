import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { expect, test } from '@playwright/test';

const REPO_ROOT = new URL('..', import.meta.url).pathname;

test.describe('Handbook', () => {
  test('loads with 12 chapters and no page errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('requestfailed', (r) => {
      if (!r.url().includes('favicon')) errors.push('FAILED: ' + r.url());
    });
    await page.goto('/handbook.html', { waitUntil: 'networkidle' });
    const sections = await page.locator('main section').count();
    expect(sections).toBe(12);
    expect(errors).toHaveLength(0);
  });

  test('table of contents links match chapters', async ({ page }) => {
    await page.goto('/handbook.html');
    const tocLinks = await page.locator('.handbook-toc a').count();
    expect(tocLinks).toBe(12);
    const firstHref = await page.locator('.handbook-toc a').first().getAttribute('href');
    expect(firstHref).toContain('#ch-');
  });

  test('does not contain team logistics terms', async ({ page }) => {
    await page.goto('/handbook.html');
    const body = (await page.locator('body').textContent())?.toLowerCase() || '';
    const logisticsTerms = [
      'group roles', 'presenter assignment', 'speaking role',
      'handover instructions', 'work distribution table',
      'task allocation',
    ];
    for (const term of logisticsTerms) {
      expect(body).not.toContain(term);
    }
  });

  test('contains key EHDS concepts', async ({ page }) => {
    await page.goto('/handbook.html');
    const body = (await page.locator('body').textContent())?.toLowerCase() || '';
    for (const term of ['primary use', 'secondary use', 'pseudonymisation', 'anonymisation', 'interoperability', 'data quality']) {
      expect(body).toContain(term);
    }
  });

  test('revised PDF exists and has reasonable page count', () => {
    const pdfPath = REPO_ROOT + 'EHDS_Presentation_Handbook_Revised.pdf';
    expect(existsSync(pdfPath)).toBeTruthy();
    const info = execSync('pdfinfo ' + JSON.stringify(pdfPath), { encoding: 'utf-8' });
    const pagesMatch = info.match(/Pages:\s+(\d+)/);
    const pages = pagesMatch ? parseInt(pagesMatch[1], 10) : 0;
    expect(pages).toBeGreaterThanOrEqual(20);
    expect(pages).toBeLessThanOrEqual(40);
  });

  test('renders at mobile width without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/handbook.html', { waitUntil: 'networkidle' });
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBeFalsy();
  });
});
