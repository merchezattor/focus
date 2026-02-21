import { expect, test } from "@playwright/test";

test.describe("Authentication", () => {
	test("should login with valid credentials", async ({ page }) => {
		await page.goto("/login");
		await page.fill('[name="email"]', "test@example.com");
		await page.fill('[name="password"]', "password");
		await page.click('button[type="submit"]');
		await expect(page).toHaveURL("/");
	});

	test("should redirect to login when accessing protected route", async ({
		page,
	}) => {
		await page.goto("/today");
		await expect(page).toHaveURL(/.*login.*/);
	});
});

test.describe("Tasks CRUD", () => {
	test("should create, edit, and delete a task", async ({ page }) => {
		await page.goto("/login");
		await page.fill('[name="email"]', "test@example.com");
		await page.fill('[name="password"]', "password");
		await page.click('button[type="submit"]');

		await page.click("text=Add Task");
		await page.fill('[name="title"]', "E2E Test Task");
		await page.click("text=Create Task");

		await expect(page.locator("text=E2E Test Task")).toBeVisible();
	});
});
