import { test, expect } from '@playwright/test';

const SQUARE_TEST_CARD = {
	number: '4111111111111111',
	expiry: '1234', // Will be typed as 12/34
	cvc: '123',
	zip: '12345',
};

test.describe.configure({ mode: 'serial' });

test.describe('Square Payment Tests', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.meshalto-payment')).toBeVisible();

		// Switch to Square gateway
		const gatewaySelector = page.locator('select.meshalto-form-select');
		if (await gatewaySelector.isVisible()) {
			await gatewaySelector.selectOption('square');
			// Wait for Square SDK to load
			await page.waitForTimeout(3000);
		}
	});

	test('should load Square payment form correctly', async ({ page }) => {
		await expect(page.locator('.meshalto-payment-header h3')).toHaveText(
			'Payment Details'
		);
		await expect(page.locator('.amount')).toContainText('USD 4.39');

		// Wait for Square Elements to load
		await page.waitForTimeout(3000);

		// Check that Square iframe is visible (Square uses unified card element in single iframe)
		const cardFrame = page.locator('iframe[title*="Secure"], iframe').first();
		await expect(cardFrame).toBeVisible();
	});

	test('should successfully process Square payment with test card', async ({
		page,
	}) => {
		let alertMessage = '';

		// Listen for dialog/alert messages
		page.on('dialog', async (dialog) => {
			alertMessage = dialog.message();
			console.log('Dialog message:', alertMessage);
			await dialog.accept();
		});

		// Wait for Square Elements to fully load
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

		// Fill in country select (second select element after gateway selector)
		await page.locator('select').nth(1).selectOption({ value: 'US' });

		// Fill in Square unified card element (single iframe with multiple fields)
		const cardFrame = page
			.frameLocator('iframe[title*="Secure"], iframe')
			.first();

		// Type card number
		const cardInput = cardFrame.locator('input[placeholder="Card number"]');
		await cardInput.waitFor({ state: 'visible', timeout: 5000 });
		await cardInput.click();
		await cardInput.pressSequentially(SQUARE_TEST_CARD.number, { delay: 100 });

		// Wait for card number validation
		await page.waitForTimeout(1000);

		// Type expiry (MM/YY format) in the same iframe
		const expiryInput = cardFrame.locator('input[placeholder="MM/YY"]');
		await expiryInput.waitFor({ state: 'visible', timeout: 5000 });
		await expiryInput.click();
		await expiryInput.pressSequentially(SQUARE_TEST_CARD.expiry, {
			delay: 100,
		});

		// Wait for expiry validation
		await page.waitForTimeout(500);

		// Type CVV in the same iframe
		const cvvInput = cardFrame.locator('input[placeholder="CVV"]');
		await cvvInput.waitFor({ state: 'visible', timeout: 5000 });
		await cvvInput.click();
		await cvvInput.pressSequentially(SQUARE_TEST_CARD.cvc, { delay: 100 });

		// Wait for CVV validation
		await page.waitForTimeout(500);

		// Type ZIP in the same iframe
		const zipInput = cardFrame.locator('input[placeholder="ZIP"]');
		await zipInput.waitFor({ state: 'visible', timeout: 5000 });
		await zipInput.click();
		await zipInput.pressSequentially(SQUARE_TEST_CARD.zip, { delay: 100 });

		// Wait a moment for all validations to complete
		await page.waitForTimeout(1000);

		// Click the Pay with Square button
		await page.click('button.square-submit-button');

		// Wait for alert dialog to appear and be handled
		await page.waitForTimeout(5000);

		// Verify the alert message contains success information
		expect(alertMessage).toContain('Payment successful');
		expect(alertMessage).toContain('Transaction ID');
	});

	test('should display error for declined card', async ({ page }) => {
		// Wait for Square Elements to load
		await page.waitForTimeout(3000);

		// Fill in billing information
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
		await page.locator('select').nth(1).selectOption({ value: 'US' });

		// Use a declined test card (Square's declined card: 4000000000000002)
		const declinedCard = '4000000000000002';

		// Fill in Square unified card element (single iframe)
		const cardFrame = page
			.frameLocator('iframe[title*="Secure"], iframe')
			.first();

		// Type declined card number
		const cardInput = cardFrame.locator('input[placeholder="Card number"]');
		await cardInput.waitFor({ state: 'visible', timeout: 5000 });
		await cardInput.click();
		await cardInput.pressSequentially(declinedCard, { delay: 100 });

		// Wait for card validation
		await page.waitForTimeout(1000);

		// Type expiry
		const expiryInput = cardFrame.locator('input[placeholder="MM/YY"]');
		await expiryInput.waitFor({ state: 'visible', timeout: 5000 });
		await expiryInput.click();
		await expiryInput.pressSequentially(SQUARE_TEST_CARD.expiry, {
			delay: 100,
		});

		await page.waitForTimeout(500);

		// Type CVV
		const cvvInput = cardFrame.locator('input[placeholder="CVV"]');
		await cvvInput.waitFor({ state: 'visible', timeout: 5000 });
		await cvvInput.click();
		await cvvInput.pressSequentially(SQUARE_TEST_CARD.cvc, { delay: 100 });

		await page.waitForTimeout(500);

		// Type ZIP
		const zipInput = cardFrame.locator('input[placeholder="ZIP"]');
		await zipInput.waitFor({ state: 'visible', timeout: 5000 });
		await zipInput.click();
		await zipInput.pressSequentially(SQUARE_TEST_CARD.zip, { delay: 100 });

		// Wait a moment for all validations to complete
		await page.waitForTimeout(1000);

		// Click the Pay with Square button
		await page.click('button.square-submit-button');

		// Wait for error message to appear (declined cards show error div, not alert)
		await expect(page.locator('.square-error-message')).toBeVisible({
			timeout: 10000,
		});

		// Verify error message is displayed
		const errorText = await page.locator('.square-error-message').textContent();
		expect(errorText).toBeTruthy();
		console.log('Declined card error message:', errorText);
	});
});
