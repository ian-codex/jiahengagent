const { chromium } = require("C:/Users/黄超/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const fs = require("fs");
const path = require("path");

const root = "E:/codex检测与学习/吉邦精密新官网";
const files = ["index.html", "about.html", "solutions.html", "manufacturing.html", "quality.html", "history.html", "news.html", "contact.html"];

(async () => {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: true,
    args: ["--no-sandbox"]
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  let ok = true;
  for (const file of files) {
    const page = await context.newPage();
    await page.goto("file:///" + path.join(root, file).replace(/\\/g, "/"), { waitUntil: "networkidle" });

    // 吸顶与滚动状态
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);
    const sticky = await page.evaluate(() => {
      const h = document.querySelector(".site-header");
      const r = h.getBoundingClientRect();
      return { top: Math.round(r.top), scrolled: h.classList.contains("scrolled") };
    });

    // 站内链接完整性
    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a[href]"))
        .map((a) => a.getAttribute("href"))
        .filter((h) => h && !h.startsWith("http") && !h.startsWith("mailto") && !h.startsWith("tel") && !h.startsWith("#") && !h.startsWith("javascript"))
    );
    const missing = [];
    const missingFileAnchors = [];
    for (const l of links) {
      const [filePart, anchorPart] = l.split("#");
      const p = path.join(root, filePart);
      if (!fs.existsSync(p)) {
        missing.push(l);
        continue;
      }
      if (anchorPart) {
        const target = await context.newPage();
        await target.goto("file:///" + p.replace(/\\/g, "/"), { waitUntil: "domcontentloaded" });
        const exists = await target.evaluate((sel) => !!document.getElementById(sel), anchorPart);
        if (!exists) missingFileAnchors.push(l);
        await target.close();
      }
    }
    const anchors = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a[href^='#']")).map((a) => a.getAttribute("href"))
    );
    const missingAnchors = [];
    for (const a of anchors) {
      const exists = await page.evaluate((sel) => !!document.querySelector(sel), a);
      if (!exists) missingAnchors.push(a);
    }
    console.log(`== ${file} ==`);
    console.log("  sticky:", sticky.top === 0 ? "ok" : `FAIL top=${sticky.top}`, "| scrolled:", sticky.scrolled);
    console.log("  missing local links:", missing.length ? missing.join(", ") : "none");
    console.log("  missing file+anchor targets:", missingFileAnchors.length ? missingFileAnchors.join(", ") : "none");
    console.log("  missing anchors:", missingAnchors.length ? missingAnchors.join(", ") : "none");
    if (sticky.top !== 0 || !sticky.scrolled || missing.length || missingAnchors.length || missingFileAnchors.length) ok = false;
    await page.close();
  }
  await browser.close();
  console.log(ok ? "ALL OK" : "ISSUES FOUND");
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
