import { chromium } from "playwright";

const browser = await chromium.launch();

// Tall viewport: content should now shrink-wrap, no empty space at the bottom.
{
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto("http://127.0.0.1:5174/app", { waitUntil: "networkidle" });
  await page.waitForSelector("text=Clinical Variables");
  await page.screenshot({ path: ".tmp-tall.png", clip: { x: 0, y: 0, width: 1600, height: 900 } });
  await page.close();
}

// Short viewport: content should still scroll internally with rounded corners intact.
{
  const page = await browser.newPage({ viewport: { width: 1600, height: 420 } });
  await page.goto("http://127.0.0.1:5174/app", { waitUntil: "networkidle" });
  await page.waitForSelector("text=Clinical Variables");
  await page.evaluate(() => {
    const heading = [...document.querySelectorAll("h2,h3")].find((el) => el.textContent === "Clinical Variables");
    const card = heading.closest(".flex.flex-col") || heading.parentElement.parentElement;
    const scrollable = card.querySelector(".overflow-y-auto");
    scrollable.scrollTop = scrollable.scrollHeight;
  });
  await page.screenshot({ path: ".tmp-short-left-card.png", clip: { x: 24, y: 60, width: 370, height: 360 } });
  await page.close();
}

await browser.close();
console.log("done");
