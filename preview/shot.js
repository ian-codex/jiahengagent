const { chromium } = require("C:/Users/黄超/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const path = require("path");
const fs = require("fs");

const root = "E:/codex检测与学习/吉邦精密新官网";
const out = path.join(root, "preview");
const pages = ["index.html", "about.html", "solutions.html", "manufacturing.html", "quality.html", "history.html", "news.html", "contact.html"];

(async () => {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"]
  });

  const report = [];
  for (const file of pages) {
    for (const [label, width, height] of [["desktop", 1280, 900], ["mobile", 390, 844]]) {
      const context = await browser.newContext({ viewport: { width, height } });
      const page = await context.newPage();
      const errors = [];
      const failed = [];
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
      page.on("pageerror", (e) => errors.push(String(e)));
      page.on("requestfailed", (r) => failed.push(r.url()));

      const url = "file:///" + path.join(root, file).replace(/\\/g, "/");
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      await page.evaluate(() => {
        document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
        document.querySelectorAll("[data-count]").forEach((el) => {
          el.textContent = el.getAttribute("data-count") + (el.getAttribute("data-suffix") || "");
        });
      });
      await page.waitForTimeout(400);

      const brokenImgs = await page.evaluate(() => {
        return Array.from(document.images)
          .filter((img) => !img.complete || img.naturalWidth === 0)
          .map((img) => img.getAttribute("src"));
      });
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      }));

      const shotFile = `${file.replace(".html", "")}-${label}.png`;
      await page.screenshot({ path: path.join(out, shotFile), fullPage: true });

      report.push({
        page: file,
        viewport: label,
        errors,
        failed,
        brokenImgs,
        overflow
      });
      await context.close();
    }
  }

  fs.writeFileSync(path.join(out, "qa-report.json"), JSON.stringify(report, null, 2), "utf8");
  for (const r of report) {
    console.log(`== ${r.page} [${r.viewport}] ==`);
    console.log("  console/page errors:", r.errors.length ? r.errors.join(" | ") : "none");
    console.log("  failed requests:", r.failed.length ? r.failed.join(" | ") : "none");
    console.log("  broken images:", r.brokenImgs.length ? r.brokenImgs.join(" | ") : "none");
    console.log("  overflow:", r.overflow.scrollWidth > r.overflow.clientWidth ? `YES ${r.overflow.scrollWidth} > ${r.overflow.clientWidth}` : "no");
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
