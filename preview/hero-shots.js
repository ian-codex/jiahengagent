const { chromium } = require("C:/Users/黄超/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const path = require("path");

(async () => {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: true,
    args: ["--no-sandbox"]
  });
  const shots = [
    ["index.html", 1280, 800, "index-hero-desktop.png"],
    ["index.html", 390, 844, "index-hero-mobile.png"],
    ["solutions.html", 1280, 800, "solutions-hero-desktop.png"],
    ["manufacturing.html", 1280, 800, "manufacturing-hero-desktop.png"]
  ];
  for (const [file, w, h, name] of shots) {
    const context = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await context.newPage();
    await page.goto("file:///" + path.join("E:/codex检测与学习/吉邦精密新官网", file).replace(/\\/g, "/"), { waitUntil: "networkidle" });
    await page.evaluate(() => document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in")));
    await page.waitForTimeout(300);
    await page.screenshot({ path: "E:/codex检测与学习/吉邦精密新官网/preview/" + name });
    await context.close();
  }
  await browser.close();
  console.log("DONE");
})().catch((e) => { console.error(e); process.exit(1); });
