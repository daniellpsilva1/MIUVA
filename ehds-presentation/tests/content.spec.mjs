import { expect, test } from '@playwright/test';

const SLIDE_IDS = [
  'cover', 'purposes', 'access', 'privacy', 'quality',
  'fitness', 'practice', 'loop', 'assessment', 'discussion',
];

const LOGISTICS_TERMS = [
  'group roles', 'presenter assignment', 'speaking role',
  'handover instructions', 'work distribution table',
  'coordinator', 'task allocation',
];

const FRAMING_TERMS = [
  'university seminar', "colleagues' notes",
  "colleagues' contribution", "colleagues' reading",
  'seminar handbook',
];

const CONCEPT_TERMS = [
  'primary use', 'secondary use', 'pseudonymisation', 'anonymisation',
  'interoperability', 'data quality', 'closing the loop',
];

test.describe('Presentation content', () => {
  test('has exactly 10 main sections with stable IDs', async ({ page }) => {
    await page.goto('/index.html');
    const sections = await page.locator('.reveal > .slides > section').all();
    expect(sections).toHaveLength(10);
    for (let i = 0; i < SLIDE_IDS.length; i++) {
      const id = await sections[i].getAttribute('id');
      expect(id).toBe(SLIDE_IDS[i]);
    }
  });

  test('every slide has non-empty speaker notes', async ({ page }) => {
    await page.goto('/index.html');
    const notes = await page.locator('aside.notes').all();
    expect(notes).toHaveLength(10);
    for (const note of notes) {
      const text = (await note.textContent())?.trim();
      expect(text && text.length > 20).toBeTruthy();
    }
  });

  test('does not contain team logistics terms', async ({ page }) => {
    await page.goto('/index.html');
    const body = await page.locator('body').textContent();
    for (const term of LOGISTICS_TERMS) {
      expect(body?.toLowerCase()).not.toContain(term);
    }
  });

  test('does not contain seminar framing or colleagues attribution', async ({ page }) => {
    await page.goto('/index.html');
    const body = (await page.locator('body').textContent())?.toLowerCase() || '';
    for (const term of FRAMING_TERMS) {
      expect(body).not.toContain(term.toLowerCase());
    }
  });

  test('contains all five core concept groups', async ({ page }) => {
    await page.goto('/index.html');
    const body = (await page.locator('body').textContent())?.toLowerCase() || '';
    for (const term of CONCEPT_TERMS) {
      expect(body).toContain(term);
    }
  });

  test('timeline distinguishes 2029 from 2031', async ({ page }) => {
    await page.goto('/index.html');
    const body = await page.locator('body').textContent();
    expect(body).toContain('2029');
    expect(body).toContain('2031');
  });

  test('fictional examples are labelled', async ({ page }) => {
    await page.goto('/index.html');
    const body = (await page.locator('body').textContent())?.toLowerCase() || '';
    expect(body).toContain('fictional');
  });

  test('cover slide states plain-language purpose in visible text', async ({ page }) => {
    await page.goto('/index.html');
    const text = (await slideTextExcludingNotes(page, 'cover')).toLowerCase();
    expect(text).toContain('health data recording and reuse');
  });

  test('purposes slide lists all five beneficiary groups in visible text', async ({ page }) => {
    await page.goto('/index.html');
    const text = (await slideTextExcludingNotes(page, 'purposes')).toLowerCase();
    for (const term of ['citizens', 'professionals', 'researchers', 'policymakers', 'industry']) {
      expect(text).toContain(term);
    }
  });

  test('access slide introduces the HDAB as a public gatekeeper in visible text', async ({ page }) => {
    await page.goto('/index.html');
    const text = (await slideTextExcludingNotes(page, 'access')).toLowerCase();
    expect(text).toContain('health data access body');
    expect(text).toContain('gatekeeper');
  });

  test('assessment slide labels convincing and challenging in visible text', async ({ page }) => {
    await page.goto('/index.html');
    const text = (await slideTextExcludingNotes(page, 'assessment')).toLowerCase();
    expect(text).toContain('convincing');
    expect(text).toContain('challenging');
  });

  test('discussion slide shows three learning goals in visible text', async ({ page }) => {
    await page.goto('/index.html');
    const text = (await slideTextExcludingNotes(page, 'discussion')).toLowerCase();
    expect(text).toContain('what the ehds is');
    expect(text).toContain('primary versus secondary use');
    expect(text).toContain('who benefits');
  });

  test('discussion slide shows both discussion questions in visible text', async ({ page }) => {
    await page.goto('/index.html');
    const text = (await slideTextExcludingNotes(page, 'discussion')).toLowerCase();
    expect(text).toContain('trust');
    expect(text).toContain('responsibility');
  });

  test('fitness slide names a course connection in visible text', async ({ page }) => {
    await page.goto('/index.html');
    const text = (await slideTextExcludingNotes(page, 'fitness')).toLowerCase();
    expect(text).toContain('course');
  });
});

async function slideTextExcludingNotes(page, slideId) {
  return page.evaluate((id) => {
    const section = document.getElementById(id);
    if (!section) return '';
    const clone = section.cloneNode(true);
    clone.querySelectorAll('aside.notes').forEach((n) => n.remove());
    return clone.textContent || '';
  }, slideId);
}
