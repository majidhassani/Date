import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const SLUG = "e2e-nilou";
const OWNER_DISPLAY = "۰۹۱۲ ۹۲۸ ۴۴۰۲";

async function startAndAccept(page: Page) {
  await page.goto(`/invite/${SLUG}`);
  await page.getByRole("button", { name: "شروع کنیم" }).click();
  await page.getByRole("button", { name: /چرا که نه/ }).click();
}

async function pickActivityAndTime(page: Page) {
  // Activity
  await page.getByText("پیاده‌روی و قهوه").click();
  await page.getByRole("button", { name: "ادامه" }).click();

  // Date + time
  await page.getByText("فردا", { exact: true }).click();
  await page.getByRole("button", { name: "۱۸:۰۰" }).click();
  await page.getByRole("button", { name: "افزودن به انتخاب‌ها" }).click();
  await page.getByRole("button", { name: "ادامه" }).click();
}

test("Nilou accepts on the first attempt and sees Majid's number", async ({
  page,
}) => {
  await startAndAccept(page);
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
  await page.goto(`/invite/${SLUG}`);
  await page.getByRole("button", { name: "شروع کنیم" }).click();

  await page.getByRole("button", { name: /فعلاً نه/ }).click();
  await page.getByRole("button", { name: /مطمئنی/ }).click();
  await page.getByRole("button", { name: /قهوه کوچولو/ }).click();
  // Now say yes (Yes button is the prominent first button)
  await page.locator("button").first().click();

  await expect(page.getByRole("heading", { name: /چه مدل برنامه‌ای/ })).toBeVisible();
});

test("Nilou gives a definitive, respectful decline", async ({ page }) => {
  await page.goto(`/invite/${SLUG}`);
  await page.getByRole("button", { name: "شروع کنیم" }).click();

  await page.getByRole("button", { name: /فعلاً نه/ }).click();
  await page.getByRole("button", { name: /مطمئنی/ }).click();
  await page.getByRole("button", { name: "جدی می‌گم، فعلاً نمی‌خوام" }).click();

  await expect(page.getByRole("heading", { name: /کاملاً قابل احترامه/ })).toBeVisible();
  // The owner's number must NOT appear after a decline.
  await expect(page.getByText(OWNER_DISPLAY)).toHaveCount(0);
});

test("Nilou accepts with a valid phone number and consent", async ({ page }) => {
  await startAndAccept(page);
  await pickActivityAndTime(page);

  await page.getByLabel("شماره موبایل").fill("09121112233");
  await page.getByText("موافقم شماره‌م").click();
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
