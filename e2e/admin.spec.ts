import { test, expect } from "@playwright/test";

// Matches the local .env used by the dev server during e2e.
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "Nilou-Admin-2026!";

test("rejects invalid admin credentials", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("ایمیل").fill(ADMIN_EMAIL);
  await page.getByLabel("رمز عبور").fill("wrong-password");
  await page.getByRole("button", { name: "ورود" }).click();
  await expect(page.getByText(/درست نیست/)).toBeVisible();
});

test("logs in with valid credentials and reaches the dashboard", async ({
  page,
}) => {
  await page.goto("/admin/login");
  await page.getByLabel("ایمیل").fill(ADMIN_EMAIL);
  await page.getByLabel("رمز عبور").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "ورود" }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "پاسخ‌ها" })).toBeVisible();

  // Log out
  await page.getByRole("button", { name: "خروج" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("protects the dashboard from anonymous access", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
});
