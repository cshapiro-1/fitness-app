const { chromium } = require('playwright');

const VIEWPORTS = [
  { name: 'Narrow Mobile (360x800)', width: 360, height: 800 },
  { name: 'iPhone SE/Mini (375x667)', width: 375, height: 667 },
  { name: 'iPhone 14 (390x844)', width: 390, height: 844 },
  { name: 'Android / Galaxy (412x915)', width: 412, height: 915 },
  { name: 'iPhone 14 Pro Max (430x932)', width: 430, height: 932 },
];

const URLS = [
  'https://www.strkyr.fit/',
  'https://www.strkyr.fit/preview-analytics',
  'https://www.strkyr.fit/recovery',
  'https://www.strkyr.fit/onboarding',
  'https://www.strkyr.fit/dashboard',
  'http://localhost:3000/preview-analytics',
  'http://localhost:3000/recovery',
  'http://localhost:3000/onboarding',
];

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  for (const vp of VIEWPORTS) {
    console.log(`\n======================================================`);
    console.log(`VIEWPORT: ${vp.name} (${vp.width}px x ${vp.height}px)`);
    console.log(`======================================================`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    for (const url of URLS) {
      if (url.startsWith('https://') && URLS.indexOf(url) > 4) continue;
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 12000 });
        await page.waitForTimeout(600);

        const check = await page.evaluate((targetWidth) => {
          const docScrollWidth = document.documentElement.scrollWidth;
          const bodyScrollWidth = document.body.scrollWidth;
          const winInnerWidth = window.innerWidth;
          const hasScrollOverflow = docScrollWidth > winInnerWidth || bodyScrollWidth > winInnerWidth;

          const overflowing = [];
          const all = document.querySelectorAll('*');
          all.forEach(el => {
            const r = el.getBoundingClientRect();
            // Check if element spills beyond window width
            if (r.right > winInnerWidth + 1) {
              overflowing.push({
                tag: el.tagName,
                cls: (el.className || '').toString().slice(0, 50),
                id: el.id,
                right: Math.round(r.right),
                width: Math.round(r.width),
                diff: Math.round(r.right - winInnerWidth),
                snippet: el.outerHTML.slice(0, 120).replace(/\s+/g, ' '),
              });
            }
          });

          return {
            winInnerWidth,
            docScrollWidth,
            bodyScrollWidth,
            hasScrollOverflow,
            overflowCount: overflowing.length,
            topItems: overflowing.slice(0, 5),
          };
        }, vp.width);

        const status = check.hasScrollOverflow ? '❌ OVERFLOW' : (check.overflowCount > 0 ? '⚠️ VISUAL BLEED' : '✅ OK');
        console.log(`[${status}] ${url}`);
        console.log(`   InnerWidth: ${check.winInnerWidth}px | DocScroll: ${check.docScrollWidth}px | BodyScroll: ${check.bodyScrollWidth}px | Bleed elements: ${check.overflowCount}`);
        if (check.topItems.length > 0) {
          check.topItems.forEach((it, i) => {
            console.log(`     ${i + 1}. <${it.tag}> class="${it.cls}" diff=+${it.diff}px width=${it.width}px right=${it.right}px`);
            console.log(`        ${it.snippet}`);
          });
        }
      } catch (e) {
        console.log(`[ERR] ${url}: ${e.message}`);
      }
    }
    await context.close();
  }

  await browser.close();
})();
