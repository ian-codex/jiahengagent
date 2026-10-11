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
  await page.evaluate(() => document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in")));
  const offenders = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out = [];
    document.querySelectorAll("*").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > vw + 1) {
        out.push({
          tag: el.tagName,
          cls: String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className).slice(0, 60),
          id: el.id || "",
          w: Math.round(r.width),
          right: Math.round(r.right),
          text: (el.textContent || "").trim().slice(0, 26)
        });
      }
    });
    return out.slice(0, 30);
  });
  console.log(JSON.stringify(offenders, null, 2));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
