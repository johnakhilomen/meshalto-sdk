import { test, expect } from '@playwright/test';

const STRIPE_TEST_CARD = {
	number: '4242424242424242',
	expiry: '1234', // Will be typed as 12/34
	cvc: '123',
};

test.describe('Stripe Payment Tests', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.meshalto-payment')).toBeVisible();
	});

	test('should load Stripe payment form correctly', async ({ page }) => {
		await expect(page.locator('.meshalto-payment-header h3')).toHaveText(
			'Payment Details'
		);
		await expect(page.locator('.amount')).toContainText('USD 4.39');

		// Wait for Stripe Elements to load
		await page.waitForTimeout(3000);

		// Check that Stripe iframe is visible
		const stripeIframe = page.locator('iframe[name^="__privateStripeFrame"]');
		await expect(stripeIframe.first()).toBeVisible();
	});

	test('should successfully process Stripe payment with test card', async ({
		page,
	}) => {
		// Wait for Stripe Elements to fully load
		await page.waitForTimeout(3000);

		// Fill in the billing information with correct placeholders
		await page.fill('input[placeholder="John Doe"]', 'John Doe');
		await page.fill(
			'input[placeholder="john@example.com"]',
			'test@example.com'
		);
		await page.fill('input[placeholder="+1 (555) 123-4567"]', '1234567890');
		await page.fill('input[placeholder="123 Main Street"]', '123 Test St');
		await page.fill('input[placeholder="New York"]', 'Test City');
		await page.fill('input[placeholder="NY"]', 'CA');
		await page.fill('input[placeholder="10001"]', '12345');

		// Fill in country select
		await page.selectOption('select', { value: 'US' });

		// Fill in Stripe CardElement (unified single iframe)
		const cardFrame = page
			.frameLocator('iframe[name^="__privateStripeFrame"]')
			.first();

		// Type card number using placeholder selector
		const cardInput = cardFrame.locator('input[placeholder="Card number"]');
		await cardInput.waitFor({ state: 'visible', timeout: 5000 });
		await cardInput.click();
		await cardInput.pressSequentially(STRIPE_TEST_CARD.number, { delay: 100 });

		// Wait for card validation
		await page.waitForTimeout(1000);

		// Type expiry using placeholder selector
		const expiryInput = cardFrame.locator('input[placeholder="MM / YY"]');
		await expiryInput.waitFor({ state: 'visible', timeout: 5000 });
		await expiryInput.click();
		await expiryInput.pressSequentially(STRIPE_TEST_CARD.expiry, {
			delay: 100,
		});

		// Wait for expiry validation
		await page.waitForTimeout(500);

		// Type CVC using placeholder selector
		const cvcInput = cardFrame.locator('input[placeholder="CVC"]');
		await cvcInput.waitFor({ state: 'visible', timeout: 5000 });
		await cvcInput.click();
		await cvcInput.pressSequentially(STRIPE_TEST_CARD.cvc, { delay: 100 });

		// Wait for CVC validation
		await page.waitForTimeout(500);

		// Type ZIP code (Stripe CardElement also includes postal code)
		const zipInput = cardFrame.locator('input[placeholder="ZIP"]');
		await zipInput.waitFor({ state: 'visible', timeout: 5000 });
		await zipInput.click();
		await zipInput.pressSequentially('12345', { delay: 100 });

		// Click the Pay button
		await page.click('button[type="submit"]');

		// Wait for success modal (the payment processing happens in the background)
		await expect(page.locator('.success-modal')).toBeVisible({
			timeout: 30000,
		});

		// Verify success message
		await expect(page.locator('.success-modal')).toContainText(
			'Payment Successful'
		);
		await expect(page.locator('.success-modal')).toContainText(
			'Transaction ID'
		);
		await expect(page.locator('.success-modal')).toContainText('USD 439.00');
	});

	test('should display error for declined card', async ({ page }) => {
		// Wait for Stripe Elements to load
		await page.waitForTimeout(3000);

		// Fill in billing information
		await page.fill('input[placeholder="John Doe"]', 'John Doe');
		await page.fill(
			'input[placeholder="john@example.com"]',
			'test@example.com'
		);

		// Fill with declined card number (4000000000000002)
		const cardFrame = page
			.frameLocator('iframe[name^="__privateStripeFrame"]')
			.first();

		const cardInput = cardFrame.locator('input:not([disabled])').first();
		await cardInput.fill('4000000000000002'); // Declined card

		await cardInput.press('Tab');
		await page.waitForTimeout(500);

		const expiryInput = cardFrame.locator('input:not([disabled])').nth(1);
		await expiryInput.fill(STRIPE_TEST_CARD.expiry);

		await expiryInput.press('Tab');
		await page.waitForTimeout(500);

		const cvcInput = cardFrame.locator('input:not([disabled])').nth(2);
		await cvcInput.fill(STRIPE_TEST_CARD.cvc);

		// Complete billing fields
		await page.fill('input[placeholder="+1 (555) 123-4567"]', '1234567890');
		await page.fill('input[placeholder="123 Main Street"]', '123 Test St');
		await page.fill('input[placeholder="New York"]', 'Test City');
		await page.fill('input[placeholder="NY"]', 'CA');
		await page.fill('input[placeholder="10001"]', '12345');
		await page.selectOption('select', { value: 'US' });

		// Click pay button
		await page.click('button[type="submit"]');

		// Wait for error modal
		await expect(page.locator('.error-modal')).toBeVisible({ timeout: 30000 });

		// Verify error message is displayed
		await expect(page.locator('.error-modal')).toContainText('Payment Failed');
	});
});
