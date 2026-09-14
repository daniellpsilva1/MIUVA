import { expect, test } from '@playwright/test';

async function waitForReveal(page) {
  await page.waitForFunction(() => {
    return window.Reveal && window.Reveal.getCurrentSlide && window.Reveal.getCurrentSlide();
  }, { timeout: 10000 });
}

async function goToSlide(page, id) {
  await page.evaluate((slideId) => {
    window.Reveal.slide(document.querySelectorAll('.reveal section').length);
    window.Reveal.slide(0);
    const sections = document.querySelectorAll('.reveal section');
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].id === slideId) {
        window.Reveal.slide(i);
        return;
      }
    }
  }, id);
  await page.waitForTimeout(500);
}

test.describe('Presentation navigation and interaction', () => {
  test('loads without page errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('requestfailed', (r) => {
      if (!r.url().includes('favicon')) errors.push('FAILED: ' + r.url());
    });
    await page.goto('/index.html', { waitUntil: 'networkidle' });
    await waitForReveal(page);
    expect(errors).toHaveLength(0);
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
    const activeStep = page.locator('.pathway-step.is-active');
    const stepNum = await activeStep.first().getAttribute('data-step');
    expect(stepNum).toBe('1');

    await prev.click();
    await page.waitForTimeout(200);
    const activeAfterPrev = page.locator('.pathway-step.is-active');
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
});
