import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const SLUG = "e2e-nilou";
const OWNER_DISPLAY = "۰۹۱۲ ۹۲۸ ۴۴۰۲";

async function start(page: Page) {
  await page.goto(`/invite/${SLUG}`);
  await page.getByRole("button", { name: "شروع کنیم" }).click();
}

async function pickActivityAndTime(page: Page) {
  // Activity — check the accessible radio directly (deterministic)
  await page.getByTestId("activity-WALK_AND_COFFEE").check({ force: true });
  await page.getByRole("button", { name: "ادامه" }).click();

  // Date + time
  await page.getByTestId("date-quick-0").check({ force: true });
  await page.getByRole("button", { name: "۱۸:۰۰" }).click();
  await page.getByRole("button", { name: "افزودن به انتخاب‌ها" }).click();
  await page.getByRole("button", { name: "ادامه" }).click();
}

test("Nilou accepts on the first attempt and sees Majid's number", async ({
  page,
}) => {
  await start(page);
  await page.getByTestId("answer-yes").click();
  await pickActivityAndTime(page);

  // Skip the optional phone step
  await page.getByRole("button", { name: "رد کردن این مرحله" }).click();

  // Review -> submit
  await expect(page.getByRole("heading", { name: /یه نگاه آخر/ })).toBeVisible();
  await page.getByRole("button", { name: /بفرست برای مجید/ }).click();

  // Success + contact card
  await expect(page.getByRole("heading", { name: /ثبت شد/ })).toBeVisible();
  await expect(page.getByText(OWNER_DISPLAY)).toBeVisible();
});

test("Nilou clicks No a few times then accepts", async ({ page }) => {
  await start(page);

  await page.getByTestId("answer-no").click();
  await page.getByTestId("answer-no").click();
  await page.getByTestId("answer-no").click();
  await page.getByTestId("answer-yes").click();

  await expect(
    page.getByRole("heading", { name: /چه مدل برنامه‌ای/ }),
  ).toBeVisible();
});

test("Nilou gives a definitive, respectful decline", async ({ page }) => {
  await start(page);

  await page.getByTestId("answer-no").click();
  await page.getByTestId("answer-no").click();
  await page.getByTestId("answer-decline").click();

  await expect(
    page.getByRole("heading", { name: /کاملاً قابل احترامه/ }),
  ).toBeVisible();
  // The owner's number must NOT appear after a decline.
  await expect(page.getByText(OWNER_DISPLAY)).toHaveCount(0);
});

test("Nilou accepts with a valid phone number and consent", async ({ page }) => {
  await start(page);
  await page.getByTestId("answer-yes").click();
  await pickActivityAndTime(page);

  await page.getByLabel("شماره موبایل").fill("09121112233");
  await page.getByRole("checkbox").click();
  await page.getByRole("button", { name: "ادامه" }).click();

  // Review shows a masked number, not the full one
  await expect(page.getByText("***")).toBeVisible();
  await page.getByRole("button", { name: /بفرست برای مجید/ }).click();

  await expect(page.getByRole("heading", { name: /ثبت شد/ })).toBeVisible();
  await expect(page.getByText(/شماره‌ت هم با موفقیت/)).toBeVisible();
});

test("welcome screen has no serious accessibility violations", async ({
  page,
}) => {
  await page.goto(`/invite/${SLUG}`);
  await expect(page.getByRole("button", { name: "شروع کنیم" })).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(serious).toEqual([]);
});
