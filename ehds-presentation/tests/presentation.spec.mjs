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
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    const currentId = await page.evaluate(() => window.Reveal.getCurrentSlide().id);
    expect(currentId).toBe('purposes');
  });

  test('access pathway Next/Previous controls work', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'networkidle' });
    await waitForReveal(page);
    await goToSlide(page, 'access');

    const next = page.locator('[data-pathway-next]');
    const prev = page.locator('[data-pathway-prev]');

    await next.click();
    await page.waitForTimeout(200);
    const activeStep = page.locator('.rail-item.is-active');
    const stepNum = await activeStep.first().getAttribute('data-step');
    expect(stepNum).toBe('1');

    await prev.click();
    await page.waitForTimeout(200);
    const activeAfterPrev = page.locator('.rail-item.is-active');
    const stepNumAfter = await activeAfterPrev.first().getAttribute('data-step');
    expect(stepNumAfter).toBe('0');
  });

  test('quality demonstration steps forward and resets', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'networkidle' });
    await waitForReveal(page);
    await goToSlide(page, 'quality');

    const next = page.locator('[data-quality-next]');
    const reset = page.locator('[data-quality-reset]');

    await next.click();
    await next.click();
    await page.waitForTimeout(200);
    const visibleSteps = await page.locator('.quality-step.visible').count();
    expect(visibleSteps).toBe(2);

    await reset.click();
    await page.waitForTimeout(200);
    const visibleAfterReset = await page.locator('.quality-step.visible').count();
    expect(visibleAfterReset).toBe(0);
  });

  test('loop diagram stages are keyboard accessible', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'networkidle' });
    await waitForReveal(page);
    await goToSlide(page, 'loop');

    const stage = page.locator('[data-loop-stage="1"]').first();
    await stage.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    const isActive = await stage.evaluate((el) => el.classList.contains('is-active'));
    expect(isActive).toBeTruthy();
  });

  test('resources dialog opens and closes', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'networkidle' });
    await waitForReveal(page);
    await page.waitForTimeout(300);
    const openBtn = page.locator('[data-resources-open]');
    await openBtn.click();
    await page.waitForTimeout(200);
    const dialog = page.locator('#resources-dialog');
    const isOpen = await dialog.evaluate((el) => el.open);
    expect(isOpen).toBeTruthy();

    const closeBtn = page.locator('[data-dialog-close]');
    await closeBtn.click();
    await page.waitForTimeout(200);
    const isClosed = await dialog.evaluate((el) => !el.open);
    expect(isClosed).toBeTruthy();
  });

  test('dialog keyboard events do not navigate slides', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'networkidle' });
    await waitForReveal(page);
    await page.waitForTimeout(300);
    const openBtn = page.locator('[data-resources-open]');
    await openBtn.click();
    await page.waitForTimeout(200);

    const currentSlideBefore = await page.evaluate(() =>
      window.Reveal.getCurrentSlide().getAttribute('id'));
    expect(currentSlideBefore).toBe('cover');

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press(' ');
    await page.waitForTimeout(200);

    const currentSlideAfter = await page.evaluate(() =>
      window.Reveal.getCurrentSlide().getAttribute('id'));
    expect(currentSlideAfter).toBe('cover');

    const dialog = page.locator('#resources-dialog');
    await dialog.evaluate((el) => el.close());
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
