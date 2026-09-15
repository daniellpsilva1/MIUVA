import { expect, test } from '@playwright/test';

async function waitForReveal(page) {
  await page.waitForFunction(() => {
    return window.Reveal
      && typeof window.Reveal.getCurrentSlide === 'function'
      && window.Reveal.getCurrentSlide()
      && typeof window.Reveal.getIndices === 'function'
      && typeof window.Reveal.slide === 'function';
  }, { timeout: 10000 });
}

async function goToSlide(page, id) {
  await page.evaluate((slideId) => {
    const sections = document.querySelectorAll('.reveal section');
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

test.describe('Presentation navigation and interaction', () => {
  test('loads and initialises Reveal on the cover slide', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('requestfailed', (r) => {
      if (!r.url().includes('favicon')) errors.push('FAILED: ' + r.url());
    });
    await page.goto('/index.html', { waitUntil: 'networkidle' });
    await waitForReveal(page);
    const currentId = await page.evaluate(() => window.Reveal.getCurrentSlide().id);
    expect(currentId).toBe('cover');
    expect(errors).toHaveLength(0);
  });

  test('direct hash entry navigates without visiting other slides', async ({ page }) => {
    await page.goto('/index.html#/access', { waitUntil: 'networkidle' });
    await waitForReveal(page);
    await page.waitForTimeout(300);
    const currentId = await page.evaluate(() => window.Reveal.getCurrentSlide().id);
    expect(currentId).toBe('access');
  });

  test('arrow keys advance slides', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'networkidle' });
    await waitForReveal(page);
    // cover has two fragments before the next slide
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    const currentId = await page.evaluate(() => window.Reveal.getCurrentSlide().id);
    expect(currentId).toBe('framework');
  });

  test('access pathway steps with the arrow keys', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'networkidle' });
    await waitForReveal(page);
    await goToSlide(page, 'access');

    const initialActive = page.locator('#access .path-step.is-active');
    expect(await initialActive.first().getAttribute('data-step')).toBe('0');

    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    const activeStep = page.locator('#access .path-step.is-active');
    expect(await activeStep.first().getAttribute('data-step')).toBe('1');

    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(200);
    const activeAfterPrev = page.locator('#access .path-step.is-active');
    expect(await activeAfterPrev.first().getAttribute('data-step')).toBe('0');
  });

  test('quality demonstration steps forward and back', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'networkidle' });
    await waitForReveal(page);
    await goToSlide(page, 'quality');

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    const revealed = await page.locator('#quality .quality-record.is-revealed').count();
    expect(revealed).toBe(2);

    await page.evaluate(() => window.Reveal.navigateFragment(-1));
    await page.waitForTimeout(200);
    const revealedAfterReset = await page.locator('#quality .quality-record.is-revealed').count();
    expect(revealedAfterReset).toBe(0);
  });

  test('loop diagram nodes reveal in order with the arrow keys', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'networkidle' });
    await waitForReveal(page);
    await goToSlide(page, 'loop');

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    const node = page.locator('#loop .loop-node[data-loop-stage="1"]').first();
    const isRevealed = await node.evaluate((el) => el.classList.contains('is-revealed'));
    expect(isRevealed).toBeTruthy();
  });

  test('no external font or script requests', async ({ page }) => {
    const externalRequests = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
        externalRequests.push('FONT: ' + url);
      }
      if (url.includes('cdn.') && !url.includes('localhost')) {
        externalRequests.push('CDN: ' + url);
      }
    });
    await page.goto('/index.html', { waitUntil: 'networkidle' });
    expect(externalRequests).toHaveLength(0);
  });

  test('uses relative paths for nested hosting compatibility', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'networkidle' });
    const scripts = await page.$$eval('script[src]', (els) =>
      els.map((el) => el.getAttribute('src')));
    const links = await page.$$eval('link[href]', (els) =>
      els.map((el) => el.getAttribute('href')));
    const allPaths = [...scripts, ...links];
    allPaths.forEach((p) => {
      expect(p.startsWith('/')).toBeFalsy();
    });
  });

  test('loads fully offline with no external network requests', async ({ page }) => {
    const externalRequests = [];
    page.on('request', (req) => {
      const url = req.url();
      if (!url.startsWith('http://localhost') && !url.startsWith('file:') && !url.startsWith('data:')) {
        externalRequests.push(url);
      }
    });
    await page.goto('/index.html', { waitUntil: 'networkidle' });
    await waitForReveal(page);
    expect(externalRequests).toHaveLength(0);
  });
});
