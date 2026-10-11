const { chromium } = require("C:/Users/黄超/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");

(async () => {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: true,
    args: ["--no-sandbox"]
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto("file:///E:/codex检测与学习/吉邦精密新官网/index.html", { waitUntil: "networkidle" });

  const before = await page.evaluate(() => {
    const nav = document.querySelector(".main-nav");
    return { display: getComputedStyle(nav).display, bodySW: document.body.scrollWidth };
  });
  await page.click(".nav-toggle");
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => {
    const nav = document.querySelector(".main-nav");
    const r = nav.getBoundingClientRect();
    const toggle = document.querySelector(".nav-toggle");
    return {
      display: getComputedStyle(nav).display,
      open: nav.classList.contains("open"),
      rect: { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) },
      toggleExpanded: toggle.getAttribute("aria-expanded"),
      linkVisible: nav.querySelector("a").getBoundingClientRect().height > 0,
      bodySW: document.body.scrollWidth
    };
  });
  await page.click(".main-nav a[href='about.html']");
  await page.waitForTimeout(350);
  const closed = await page.evaluate(() => ({
    open: document.querySelector(".main-nav").classList.contains("open"),
    display: getComputedStyle(document.querySelector(".main-nav")).display,
    toggleExpanded: document.querySelector(".nav-toggle").getAttribute("aria-expanded"),
    url: location.href
  }));

  console.log("before:", JSON.stringify(before));
  console.log("after open:", JSON.stringify(after));
  console.log("after link click:", JSON.stringify(closed));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
