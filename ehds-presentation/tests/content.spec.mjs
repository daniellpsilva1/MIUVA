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
});
