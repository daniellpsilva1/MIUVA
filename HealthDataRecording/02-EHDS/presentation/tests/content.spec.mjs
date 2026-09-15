import { expect, test } from '@playwright/test';

const SLIDE_IDS = [
  'cover', 'framework', 'journey', 'access', 'myths', 'quality',
  'europe', 'loop', 'assessment', 'closing',
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

  test('contains all core concept groups', async ({ page }) => {
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

  test('framework slide lists all five beneficiary groups in visible text', async ({ page }) => {
    await page.goto('/index.html');
    const text = (await slideTextExcludingNotes(page, 'framework')).toLowerCase();
    for (const term of ['citizens', 'professionals', 'researchers', 'policymakers', 'industry']) {
      expect(text).toContain(term);
    }
  });

  test('framework road card reveals with the arrow keys', async ({ page }) => {
    await page.goto('/index.html');
    await goToSlide(page, 'framework');
    const card = page.locator('#framework .road-card').first();
    await page.keyboard.press('ArrowRight');
    await expect(card).toHaveClass(/is-revealed/);
    await expect(card).toHaveAttribute('aria-expanded', 'true');
  });

  test('pressing "r" reveals all cards on the myths slide and again resets', async ({ page }) => {
    await page.goto('/index.html');
    await goToSlide(page, 'myths');
    await page.keyboard.press('r');
    await page.waitForTimeout(200);
    expect(await page.locator('#myths [data-card].is-revealed').count()).toBe(5);
    await page.keyboard.press('r');
    await page.waitForTimeout(200);
    expect(await page.locator('#myths [data-card].is-revealed').count()).toBe(0);
  });

  test('journey card reveals its verdict with the arrow keys', async ({ page }) => {
    await page.goto('/index.html');
    await goToSlide(page, 'journey');
    const card = page.locator('#journey .journey-card').first();
    await page.keyboard.press('ArrowRight');
    await expect(card).toHaveClass(/is-revealed/);
    await expect(card).toHaveAttribute('aria-expanded', 'true');
  });

  test('myths statements are hidden until the first arrow', async ({ page }) => {
    await page.goto('/index.html');
    await goToSlide(page, 'myths');
    expect(await page.locator('#myths [data-card].is-revealed').count()).toBe(0);
    const visibility = await page.locator('#myths .myth-verdict').first().evaluate(
      (el) => window.getComputedStyle(el).visibility);
    expect(visibility).toBe('hidden');
    const card = page.locator('#myths .myth-card[data-myth]').first();
    const counter = page.locator('#myths [data-myth-counter]');
    await expect(counter).toHaveText('Myths busted: 0 / 4');
    await page.keyboard.press('ArrowRight');
    await expect(card).toHaveClass(/is-revealed/);
    await expect(counter).toHaveText('Myths busted: 1 / 4');
  });

  test('europe names reveal one by one after the questions', async ({ page }) => {
    await page.goto('/index.html');
    await goToSlide(page, 'europe');
    expect(await page.locator('#europe [data-card].is-revealed').count()).toBe(0);
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#europe .europe-card').first()).toHaveClass(/is-revealed/);
    expect(await page.locator('#europe [data-card].is-revealed').count()).toBe(1);
    await expect(page.locator('#europe .europe-card').first().locator('.europe-country strong')).toHaveText('Germany');
  });

  test('loop node reveals its break panel with the arrow keys', async ({ page }) => {
    await page.goto('/index.html');
    await goToSlide(page, 'loop');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    const node = page.locator('#loop .loop-node[data-loop-stage="2"]');
    await expect(node).toHaveClass(/is-revealed/);
    await page.waitForTimeout(400);
    const opacity = await node.locator('.loop-break').evaluate(
      (el) => window.getComputedStyle(el).opacity);
    expect(opacity).toBe('1');
  });

  test('closing timer starts on the next arrow and resets when leaving', async ({ page }) => {
    await page.goto('/index.html');
    await goToSlide(page, 'closing');
    const timer = page.locator('#closing [data-timer]');
    await expect(timer).not.toHaveClass(/is-running/);
    await page.keyboard.press('ArrowRight');
    await expect(timer).toHaveClass(/is-running/);
    await page.waitForFunction(() => {
      const t = document.querySelector('#closing [data-timer] .timer-display');
      return t && t.textContent !== '01:00';
    }, { timeout: 2500 });
    await goToSlide(page, 'assessment');
    await goToSlide(page, 'closing');
    await expect(timer).not.toHaveClass(/is-running/);
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

  test('closing slide shows three learning goals in visible text', async ({ page }) => {
    await page.goto('/index.html');
    const text = (await slideTextExcludingNotes(page, 'closing')).toLowerCase();
    expect(text).toContain('what the ehds is');
    expect(text).toContain('primary versus secondary use');
    expect(text).toContain('who benefits');
  });

  test('closing slide shows both discussion questions in visible text', async ({ page }) => {
    await page.goto('/index.html');
    const text = (await slideTextExcludingNotes(page, 'closing')).toLowerCase();
    expect(text).toContain('trust');
    expect(text).toContain('responsibility');
  });
});

async function goToSlide(page, id) {
  await page.waitForFunction(() =>
    window.Reveal && typeof window.Reveal.slide === 'function'
    && window.Reveal.getCurrentSlide());
  await page.evaluate((slideId) => {
    const sections = document.querySelectorAll('.reveal > .slides > section');
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].id === slideId) {
        window.Reveal.slide(i);
        return;
      }
    }
  }, id);
  await page.waitForFunction((slideId) => {
    const s = window.Reveal.getCurrentSlide();
    return s && s.id === slideId;
  }, id, { timeout: 5000 });
}

async function slideTextExcludingNotes(page, slideId) {
  return page.evaluate((id) => {
    const section = document.getElementById(id);
    if (!section) return '';
    const clone = section.cloneNode(true);
    clone.querySelectorAll('aside.notes').forEach((n) => n.remove());
    return clone.textContent || '';
  }, slideId);
}
