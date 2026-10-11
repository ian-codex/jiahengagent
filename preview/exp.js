const { chromium } = require("C:/Users/黄超/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const path = require("path");

(async () => {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: true,
    args: ["--no-sandbox"]
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto("file:///E:/codex检测与学习/吉邦精密新官网/index.html", { waitUntil: "networkidle" });
  const base = await page.evaluate(() => ({
    docSW: document.documentElement.scrollWidth,
    bodySW: document.body.scrollWidth,
    docW: document.documentElement.getBoundingClientRect().width,
    clientW: document.documentElement.clientWidth
  }));
  console.log("base:", JSON.stringify(base));

  await page.addStyleTag({ content: ".main-nav { visibility: hidden !important; }" });
  const vis = await page.evaluate(() => ({
    docSW: document.documentElement.scrollWidth,
    bodySW: document.body.scrollWidth,
    docW: document.documentElement.getBoundingClientRect().width,
    clientW: document.documentElement.clientWidth
  }));
  console.log("visibility hidden:", JSON.stringify(vis));

  await page.addStyleTag({ content: ".main-nav { visibility: visible !important; transform: translateX(100%) !important; }" });
  await page.waitForTimeout(100);
  const tr = await page.evaluate(() => ({
    docSW: document.documentElement.scrollWidth,
    bodySW: document.body.scrollWidth,
    docW: document.documentElement.getBoundingClientRect().width,
    clientW: document.documentElement.clientWidth
  }));
  console.log("transform only:", JSON.stringify(tr));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
