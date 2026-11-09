import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const fixture = JSON.parse(
  readFileSync("src/lib/pivot/fixtures/live-save-v2-c3c4fa5.json", "utf8"),
);
const keys = [
  "pivot-v2-save",
  "pivot-v2-save-backup",
  "pivot-v2-save-backup-prev",
  "pivot-v2-save-crashed",
];
function raw(engine = "3.0.0", schema = 2) {
  const value = structuredClone(fixture);
  value.v = schema;
  value.player.engineVersion = engine;
  const { c: _c, ...body } = value;
  void _c;
  return (
    JSON.stringify({
      ...body,
      c: createHash("sha256")
        .update(JSON.stringify(body))
        .digest("hex")
        .slice(0, 16),
    }) + "\n  "
  );
}
for (const store of ["localStorage", "sessionStorage"] as const)
  for (const key of keys)
    for (const kind of ["engine", "schema"] as const)
      test(`boot/autosave/pagehide/reload preserves ${store}/${key} future ${kind}`, async ({
        page,
      }) => {
        const source = raw(
            kind === "engine" ? "2.25.0-beta" : "2.24.0-beta",
            kind === "schema" ? 3 : 2,
          ),
          value =
            key === keys[0]
              ? source
              : JSON.stringify({
                  v: 1,
                  at: 1,
                  raw: source,
                  reason: "synthetic",
                });
        await page.addInitScript(
          ({ store, key, value }) => {
            if (sessionStorage.getItem("synthetic-initialized") !== "yes") {
              globalThis[store].setItem(key, value);
              sessionStorage.setItem("synthetic-initialized", "yes");
            }
          },
          { store, key, value },
        );
        await page.goto("/");
        const panel = page.getByTestId("live-protection");
        await expect(panel).toHaveAttribute("data-reason", "data");
        await expect(panel).toHaveAttribute("data-ready", "true");
        await expect(
          page.getByRole("button", { name: /^Inizia$/ }),
        ).toHaveCount(0);
        await page.waitForTimeout(550);
        await page.evaluate(() => {
          window.dispatchEvent(
            new PageTransitionEvent("pagehide", { persisted: true }),
          );
          window.dispatchEvent(
            new PageTransitionEvent("pageshow", { persisted: true }),
          );
          window.dispatchEvent(new Event("focus"));
        });
        expect(
          await page.evaluate(
            ({ store, key }) => globalThis[store].getItem(key),
            { store, key },
          ),
        ).toBe(value);
        await page.reload();
        await expect(panel).toHaveAttribute("data-reason", "data");
        expect(
          await page.evaluate(
            ({ store, key }) => globalThis[store].getItem(key),
            { store, key },
          ),
        ).toBe(value);
        const other = await page.evaluate(
          (keys) =>
            keys.map((k) => [
              k,
              localStorage.getItem(k),
              sessionStorage.getItem(k),
            ]),
          keys,
        );
        expect(other.filter(([k, l, s]) => k !== key && (l || s))).toEqual([]);
      });
test("read-only export preserves raw UTF16 code units and failure leaves bytes intact", async ({
  page,
}) => {
  const source = '{ "v":3,"opaque":"\ud800" }\n  ';
  await page.addInitScript(
    (source) => localStorage.setItem("pivot-v2-save", source),
    source,
  );
  await page.goto("/");
  await expect(page.getByTestId("live-protection")).toHaveAttribute(
    "data-ready",
    "true",
  );
  const button = page.getByRole("button", {
    name: "Esporta localStorage/pivot-v2-save",
    exact: true,
  });
  const done = page.waitForEvent("download");
  await button.click();
  const download = await done;
  const file = await download.path();
  expect(file).toBeTruthy();
  expect(readFileSync(file!)).toEqual(Buffer.from(source, "utf16le"));
  await page.evaluate(() => {
    URL.createObjectURL = () => {
      throw new Error("synthetic export failure");
    };
  });
  await button.click();
  await expect(page.getByText(/Esportazione non riuscita/)).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("pivot-v2-save"))).toBe(
    source,
  );
});
test("same-career concurrent tab cannot autosave; future write wins over pending timer/pagehide", async ({
  page,
  context,
}) => {
  const legacy = raw("2.24.0-beta");
  await page.addInitScript(
    (legacy) => localStorage.setItem("pivot-v2-save", legacy),
    legacy,
  );
  await page.goto("/");
  await expect(
    page.getByRole("group", { name: "Sezioni della carriera" }),
  ).toBeVisible();
  await expect(page.getByTestId("live-protection")).toHaveCount(0);
  const second = await context.newPage();
  await second.goto("/");
  await expect(second.getByTestId("live-protection")).toHaveAttribute(
    "data-reason",
    "writer",
  );
  await expect(second.getByTestId("live-protection")).toHaveAttribute(
    "data-ready",
    "true",
  );
  const future = raw();
  await second.evaluate(
    (future) => localStorage.setItem("pivot-v2-save", future),
    future,
  );
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByTestId("live-protection")).toHaveAttribute(
    "data-reason",
    "data",
  );
  await page.waitForTimeout(1200);
  await page.evaluate(() =>
    window.dispatchEvent(new PageTransitionEvent("pagehide")),
  );
  expect(
    await second.evaluate(() => localStorage.getItem("pivot-v2-save")),
  ).toBe(future);
  await second.close();
});
for (const mode of ["missing", "getter", "rejects"])
  for (const engine of ["2.24.0-beta", "3.0.0"])
    test(`Web Locks ${mode}: fails closed and preserves engine ${engine}`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const value = raw(engine);
      await page.addInitScript(
        ({ value, mode }) => {
          if (mode === "getter")
            Object.defineProperty(navigator, "locks", {
              get() {
                throw new Error("synthetic denied");
              },
            });
          else
            Object.defineProperty(navigator, "locks", {
              value:
                mode === "missing"
                  ? undefined
                  : {
                      request() {
                        return Promise.reject(new Error("synthetic denied"));
                      },
                    },
            });
          localStorage.setItem("pivot-v2-save", value);
        },
        { value, mode },
      );
      await page.goto("/");
      await expect(page.getByTestId("live-protection")).toHaveAttribute(
        "data-reason",
        engine === "3.0.0" ? "data" : "writer",
      );
      await expect(page.getByTestId("live-protection")).toHaveAttribute(
        "data-ready",
        "true",
      );
      expect(
        await page.evaluate(() => localStorage.getItem("pivot-v2-save")),
      ).toBe(value);
      expect(errors).toEqual([]);
    });

for (const engine of [undefined, null, 225, "", "garbage"])
  test(`unknown engine ${String(engine)} boots read-only, not a fresh career`, async ({
    page,
  }) => {
    const value = structuredClone(fixture);
    if (engine === undefined) delete value.player.engineVersion;
    else value.player.engineVersion = engine;
    const source = JSON.stringify(value);
    await page.addInitScript(
      (source) => localStorage.setItem("pivot-v2-save", source),
      source,
    );
    await page.goto("/");
    await expect(page.getByTestId("live-protection")).toHaveAttribute(
      "data-reason",
      "data",
    );
    await page.waitForTimeout(550);
    expect(
      await page.evaluate(() => localStorage.getItem("pivot-v2-save")),
    ).toBe(source);
    await expect(
      page.getByRole("group", { name: "Sezioni della carriera" }),
    ).toHaveCount(0);
  });

test("unreadable primary storage never mounts or falls back to a valid legacy session", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const value = raw("2.24.0-beta");
  await page.addInitScript((value) => {
    const original = window.localStorage;
    original.setItem("pivot-v2-save", value);
    sessionStorage.setItem("pivot-v2-save", value);
    Object.defineProperty(window, "__syntheticReadLocal", {
      value: () => original.getItem("pivot-v2-save"),
    });
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("synthetic denied", "SecurityError");
      },
    });
  }, value);
  await page.goto("/");
  await expect(page.getByTestId("live-protection")).toHaveAttribute(
    "data-reason",
    "data",
  );
  await expect(page.getByTestId("live-protection")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page.waitForTimeout(650);
  await page.evaluate(() =>
    window.dispatchEvent(new PageTransitionEvent("pagehide")),
  );
  expect(
    await page.evaluate(() =>
      (
        window as unknown as { __syntheticReadLocal(): string }
      ).__syntheticReadLocal(),
    ),
  ).toBe(value);
  expect(
    await page.evaluate(() => sessionStorage.getItem("pivot-v2-save")),
  ).toBe(value);
  await expect(
    page.getByRole("group", { name: "Sezioni della carriera" }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});
