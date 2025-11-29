import { test, expect } from '@playwright/test';

const STRIPE_TEST_CARD = {
	number: '4242424242424242',
	expiry: '1234',
	cvc: '123',
};

const SQUARE_TEST_CARD = {
	number: '4111111111111111',
	expiry: '1234',
	cvc: '123',
	zip: '12345',
};

test.describe('Payment Gateway E2E Tests', () => {
	test.beforeEach(async ({ page }) => {
		// Listen for console messages
		page.on('console', (msg) => {
			const type = msg.type();
			if (type === 'error' || type === 'warning') {
				console.log(`Browser ${type}: ${msg.text()}`);
			}
		});

		// Listen for page errors
		page.on('pageerror', (error) => {
			console.log(`Page error: ${error.message}`);
		});

		await page.goto('/');
		await expect(page.locator('.meshalto-payment')).toBeVisible();

		// Wait for the gateway selector to be visible
		const gatewaySelector = page.locator('select.meshalto-form-select');
		await expect(gatewaySelector).toBeVisible();
	});
	test('should successfully process Stripe payment', async ({ page }) => {
		// Select Stripe gateway
		const gatewaySelector = page.locator('select.meshalto-form-select');
		await gatewaySelector.selectOption('stripe');

		// Wait for Stripe Elements to load
		await page.waitForTimeout(3000);

		// Verify Stripe form is loaded
		const stripeIframe = page.locator('iframe[name^="__privateStripeFrame"]');
		await expect(stripeIframe.first()).toBeVisible({ timeout: 10000 });

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

		// Select country
		const countrySelect = page.locator('select').nth(1); // Second select is country
		await countrySelect.selectOption('US');

		// Fill in Stripe card details
		const cardFrame = page
			.frameLocator('iframe[name^="__privateStripeFrame"]')
			.first();

		// Wait for card number input to be visible
		const cardInput = cardFrame.locator('input[placeholder="Card number"]');
		await cardInput.waitFor({ state: 'visible', timeout: 10000 });
		await cardInput.click();
		await cardInput.pressSequentially(STRIPE_TEST_CARD.number, { delay: 100 });

		// Wait for validation
		await page.waitForTimeout(1000);

		// Fill expiry
		const expiryInput = cardFrame.locator('input[placeholder="MM / YY"]');
		await expiryInput.waitFor({ state: 'visible', timeout: 5000 });
		await expiryInput.click();
		await expiryInput.pressSequentially(STRIPE_TEST_CARD.expiry, {
			delay: 100,
		});

		// Wait for validation
		await page.waitForTimeout(500);

		// Fill CVC
		const cvcInput = cardFrame.locator('input[placeholder="CVC"]');
		await cvcInput.waitFor({ state: 'visible', timeout: 5000 });
		await cvcInput.click();
		await cvcInput.pressSequentially(STRIPE_TEST_CARD.cvc, { delay: 100 });

		// Wait for validation
		await page.waitForTimeout(500);

		// Try to fill ZIP code in Stripe iframe if it exists
		const zipInput = cardFrame.locator('input[placeholder="ZIP"]');
		const hasZip = await zipInput.isVisible().catch(() => false);
		if (hasZip) {
			await zipInput.click();
			await zipInput.pressSequentially('12345', { delay: 100 });
			await page.waitForTimeout(500);
		}

		// Wait for all validations
		await page.waitForTimeout(1500);

		// Click the Pay button
		const payButton = page.locator('button[type="submit"]');
		await payButton.click();

		// Wait for either success or error modal
		await page.waitForTimeout(10000);

		// Check if error modal appeared
		const errorModal = page.locator('.error-modal');
		const hasError = await errorModal.isVisible().catch(() => false);

		if (hasError) {
			const errorText = await errorModal.textContent();
			console.log('Stripe payment error:', errorText);
			await page.screenshot({ path: 'stripe-error.png', fullPage: true });
			throw new Error(`Stripe payment failed: ${errorText}`);
		}

		// Wait for success modal
		await expect(page.locator('.success-modal')).toBeVisible({
			timeout: 20000,
		});

		// Verify success message
		await expect(page.locator('.success-modal')).toContainText(
			'Payment Successful'
		);
		await expect(page.locator('.success-modal')).toContainText(
			'Transaction ID'
		);

		console.log('✅ Stripe payment test passed!');
	});

	test('should successfully process Square payment', async ({ page }) => {
		// Select Square gateway
		const gatewaySelector = page.locator('select.meshalto-form-select');
		await gatewaySelector.selectOption('square');

		// Wait for Square SDK to load
		await page.waitForTimeout(3000);

		// Verify Square card element is visible
		const squareCardDiv = page.locator('.square-card-element');
		await expect(squareCardDiv).toBeVisible({ timeout: 10000 });

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

		// Select country
		const countrySelect = page.locator('select').nth(1); // Second select is country
		await countrySelect.selectOption('US');

		// Handle Square card iframe
		let alertMessage = '';
		page.on('dialog', async (dialog) => {
			alertMessage = dialog.message();
			console.log('Square payment dialog:', alertMessage);
			await dialog.accept();
		});

		// Fill in Square card details - Square uses a unified iframe
		const squareFrame = page
			.frameLocator('iframe[title*="Secure"], iframe')
			.first();

		// Wait for card number input
		const cardInput = squareFrame.locator('input[placeholder="Card number"]');
		await cardInput.waitFor({ state: 'visible', timeout: 10000 });
		await cardInput.click();
		await cardInput.pressSequentially(SQUARE_TEST_CARD.number, { delay: 100 });

		await page.waitForTimeout(1000);

		// Fill expiry
		const expiryInput = squareFrame.locator('input[placeholder="MM/YY"]');
		await expiryInput.waitFor({ state: 'visible', timeout: 5000 });
		await expiryInput.click();
		await expiryInput.pressSequentially(SQUARE_TEST_CARD.expiry, {
			delay: 100,
		});

		await page.waitForTimeout(500);

		// Fill CVV
		const cvvInput = squareFrame.locator('input[placeholder="CVV"]');
		await cvvInput.waitFor({ state: 'visible', timeout: 5000 });
		await cvvInput.click();
		await cvvInput.pressSequentially(SQUARE_TEST_CARD.cvc, { delay: 100 });

		await page.waitForTimeout(500);

		// Fill ZIP
		const zipInput = squareFrame.locator('input[placeholder="ZIP"]');
		await zipInput.waitFor({ state: 'visible', timeout: 5000 });
		await zipInput.click();
		await zipInput.pressSequentially(SQUARE_TEST_CARD.zip, { delay: 100 });

		await page.waitForTimeout(1000);

		// Click the Pay with Square button
		const payButton = page.locator('button.square-submit-button');
		await payButton.click();

		// Wait for either alert or error message
		await page.waitForTimeout(10000);

		// Check if there's an error message shown
		const errorMsg = page.locator('.square-error-message');
		const hasError = await errorMsg.isVisible().catch(() => false);

		if (hasError) {
			const errorText = await errorMsg.textContent();
			console.log('Square payment error:', errorText);
			throw new Error(`Square payment failed: ${errorText}`);
		}

		// Verify the alert message
		if (!alertMessage) {
			// Take a screenshot for debugging
			await page.screenshot({ path: 'square-test-failed.png', fullPage: true });
			throw new Error(
				'No alert message received - payment may have failed silently'
			);
		}

		expect(alertMessage).toContain('Payment successful');
		expect(alertMessage).toContain('Transaction ID');
		console.log('✅ Square payment test passed!');
	});
});
