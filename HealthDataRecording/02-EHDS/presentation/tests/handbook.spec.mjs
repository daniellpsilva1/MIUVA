import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { expect, test } from '@playwright/test';

const REPO_ROOT = new URL('..', import.meta.url).pathname;

test.describe('Handbook', () => {
  test('loads with 9 chapters and no page errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('requestfailed', (r) => {
      if (!r.url().includes('favicon')) errors.push('FAILED: ' + r.url());
    });
    await page.goto('/handbook.html', { waitUntil: 'networkidle' });
    const sections = await page.locator('main section').count();
    expect(sections).toBe(9);
    expect(errors).toHaveLength(0);
  });

  test('table of contents links match chapters', async ({ page }) => {
    await page.goto('/handbook.html');
    const tocLinks = await page.locator('.handbook-toc a').count();
    expect(tocLinks).toBe(9);
    const firstHref = await page.locator('.handbook-toc a').first().getAttribute('href');
    expect(firstHref).toContain('#ch-');
  });

  test('does not contain team logistics or framing terms', async ({ page }) => {
    await page.goto('/handbook.html');
    const body = (await page.locator('body').textContent())?.toLowerCase() || '';
    const forbiddenTerms = [
      'group roles', 'presenter assignment', 'speaking role',
      'handover instructions', 'work distribution table',
      'task allocation', 'assigned speakers', 'handovers',
      'university seminar', "colleagues' notes",
      "colleagues' reading notes", "colleagues' contribution",
      'seminar handbook', 'team preparation',
    ];
    for (const term of forbiddenTerms) {
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

  test('uses correct legal article references', async ({ page }) => {
    await page.goto('/handbook.html');
    const body = (await page.locator('body').textContent())?.toLowerCase() || '';
    // Article 61(5) is the significant-findings provision, not Article 105
    expect(body).toContain('61(5)');
    expect(body).toContain('58(3)');
    // Article 105 must be associated with entry into force, not significant findings
    expect(body).toContain('105 (entry into force');
    // Article 78 is the data quality and utility label
    expect(body).toContain('article 78');
  });

  test('revised PDF exists and has reasonable page count', () => {
    const pdfPath = REPO_ROOT + 'EHDS_Presentation_Handbook_Revised.pdf';
    expect(existsSync(pdfPath)).toBeTruthy();
    const info = execSync('pdfinfo ' + JSON.stringify(pdfPath), { encoding: 'utf-8' });
    const pagesMatch = info.match(/Pages:\s+(\d+)/);
    const pages = pagesMatch ? parseInt(pagesMatch[1], 10) : 0;
    expect(pages).toBeGreaterThanOrEqual(8);
    expect(pages).toBeLessThanOrEqual(11);
  });

  test('revised PDF contains model answer body text', () => {
    const pdfPath = REPO_ROOT + 'EHDS_Presentation_Handbook_Revised.pdf';
    const text = execSync('pdftotext ' + JSON.stringify(pdfPath) + ' -', { encoding: 'utf-8' });
    expect(text).toContain('MODEL ANSWER');
    expect(text.toLowerCase()).toContain('unit harmonisation fixes a syntactic problem');
  });

  test('renders at mobile width without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/handbook.html', { waitUntil: 'networkidle' });
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBeFalsy();
  });

  test('lists all five beneficiary groups including industry', async ({ page }) => {
    await page.goto('/handbook.html');
    const body = (await page.locator('body').textContent())?.toLowerCase() || '';
    for (const term of ['citizens', 'professionals', 'researchers', 'policymakers', 'industry']) {
      expect(body).toContain(term);
    }
  });

  test('contains both discussion questions', async ({ page }) => {
    await page.goto('/handbook.html');
    const body = (await page.locator('body').textContent())?.toLowerCase() || '';
    expect(body).toContain('trust');
    expect(body).toContain('responsibility');
  });

  test('contains the three introductory learning goals', async ({ page }) => {
    await page.goto('/handbook.html');
    const body = (await page.locator('body').textContent())?.toLowerCase() || '';
    expect(body).toContain('what the ehds is');
    expect(body).toContain('primary versus secondary use');
    expect(body).toContain('who benefits');
  });
});
