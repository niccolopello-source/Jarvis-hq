import { expect, test } from "@playwright/test";

test("the brand icon is a real image, not the page, and the boot still shows the mark", async ({ page, request }) => {
  const ico = await request.get("/favicon.ico");
  expect(ico.status()).toBe(200);
  expect(ico.headers()["content-type"] ?? "").not.toMatch(/html/);
  const icoBytes = await ico.body();
  expect(icoBytes[0]).toBe(0);
  expect(icoBytes[1]).toBe(0);
  expect(icoBytes[2]).toBe(1);
  expect(icoBytes[3]).toBe(0);

  const png = await request.get("/icon-192.png");
  expect(png.status()).toBe(200);
  expect(png.headers()["content-type"] ?? "").toContain("image/png");
  const pngBytes = await png.body();
  expect([...pngBytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

  const apple = await request.get("/apple-touch-icon.png");
  expect(apple.status()).toBe(200);
  expect((await apple.body()).subarray(0, 4).toString("hex")).toBe("89504e47");

  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.status()).toBe(200);
  const body = await manifest.json();
  expect(body.display).toBe("browser");
  expect(body.icons.map((icon: { src: string }) => icon.src)).toEqual(["/icon-192.png", "/apple-touch-icon.png"]);

  await page.goto("/");
  await expect(page.locator('link[rel="icon"][href="/icon-192.png"]')).toHaveCount(1);
  await expect(page.locator(".boot-logo")).toBeVisible();
  await expect(page.locator("#boot")).toBeVisible();
});
