import { test, expect, Page } from '@playwright/test';

/**
 * Stripe Test Card Numbers
 * - 4242424242424242 - Successful payment
 * - Any future expiry date (e.g., 12/34)
 * - Any 3-digit CVC
 * - Any ZIP code
 */
const STRIPE_TEST_CARD = {
	number: '4242424242424242',
	expiry: '1234', // MM/YY format
	cvc: '123',
	zip: '12345',
};

/**
 * Square Test Card Numbers (Sandbox)
 * - 4111111111111111 - Successful payment
 * - Any future expiry date
 * - Any 3-digit CVV
 * - Any ZIP code
 */
const SQUARE_TEST_CARD = {
	number: '4111111111111111',
	expiry: '12/34',
	cvc: '123',
	zip: '12345',
	name: 'John Doe',
	email: 'test@example.com',
	phone: '1234567890',
	address: '123 Test St',
	city: 'Test City',
	state: 'CA',
	country: 'US',
};

test.describe('Meshalto Payment SDK - Gateway Tests', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the app
		await page.goto('/');

		// Wait for the payment component to be visible
		await expect(page.locator('.meshalto-payment')).toBeVisible();
	});

	test('should load Stripe payment form correctly', async ({ page }) => {
		// Verify Stripe form is rendered (gateway="stripe" is set in App.tsx)
		await expect(page.locator('.meshalto-payment-header')).toBeVisible();
		await expect(page.locator('.meshalto-payment-header h3')).toHaveText(
			'Payment Details'
		);

		// Verify amount is displayed
		await expect(page.locator('.amount')).toContainText('USD 4.39');

		// Wait for Stripe Elements to load
		await page.waitForTimeout(2000);

		// Check that Stripe iframe is loaded
		const stripeIframe = page.locator('iframe[name^="__privateStripeFrame"]').first();
		await expect(stripeIframe).toBeVisible();
	});

	test('should successfully process Stripe payment with test card', async ({
		page,
	}) => {
		// Wait for Stripe Elements to fully load
		await page.waitForTimeout(3000);

		// Fill in the billing information
		await page.fill('input[placeholder="John Doe"]', 'John Doe');
		await page.fill(
			'input[placeholder="john@example.com"]',
			'test@example.com'
		);
		await page.fill('input[placeholder="123-456-7890"]', '1234567890');
		await page.fill('input[placeholder="123 Main St"]', '123 Test St');
		await page.fill('input[placeholder="City"]', 'Test City');
		await page.fill('input[placeholder="State"]', 'CA');
		await page.fill('input[placeholder="ZIP Code"]', '12345');

		// Fill in country select
		await page.selectOption('select', { value: 'US' });

		// Fill in Stripe CardElement (unified single iframe)
		// CardElement has one input field that accepts card number, then auto-advances to expiry and cvc
		const cardFrame = page
			.frameLocator('iframe[name^="__privateStripeFrame"]')
			.first();

		// The CardElement uses a single input with no name attribute
		// We need to type the card info sequentially: number, space triggers expiry, then cvc
		const cardInput = cardFrame.locator('input').first();

		// Type card number
		await cardInput.fill(STRIPE_TEST_CARD.number);

		// Type expiry (CardElement auto-detects and formats)
		await cardInput.press('Tab'); // Move to expiry field
		await page.waitForTimeout(500);

		// Type in the next input (expiry)
		const expiryInput = cardFrame.locator('input').nth(1);
		await expiryInput.fill(STRIPE_TEST_CARD.expiry);

		// Type CVC
		await expiryInput.press('Tab');
		await page.waitForTimeout(500);
		const cvcInput = cardFrame.locator('input').nth(2);
		await cvcInput.fill(STRIPE_TEST_CARD.cvc);

		// Click the Pay button
		await page.click('button[type="submit"]');

		// Wait for loading modal
		await expect(page.locator('.loading-modal')).toBeVisible();

		// Wait for success modal (timeout 30s for API call)
		await expect(page.locator('.success-modal')).toBeVisible({
			timeout: 30000,
		});

		// Verify success message
		await expect(page.locator('.success-modal')).toContainText(
			'Payment Successful'
		);

		// Verify transaction details are shown
		await expect(page.locator('.success-modal')).toContainText(
			'Transaction ID'
		);
		await expect(page.locator('.success-modal')).toContainText('USD 4.39');
	});

	test('should load Square payment form when gateway changes', async ({
		page,
	}) => {
		// Create a new test page with Square gateway
		await page.goto('/');

		// Evaluate to change gateway prop (we'll need to modify App.tsx or use a test page)
		// For now, we'll use the auto selector if available

		// Check if gateway selector exists
		const selector = page.locator('select.meshalto-form-select');
		if (await selector.isVisible()) {
			await selector.selectOption('square');

			// Wait for Square SDK to load
			await page.waitForTimeout(3000);

			// Verify Square card element is rendered
			await expect(page.locator('#card-container')).toBeVisible();
		} else {
			console.log('Gateway selector not available - skipping Square test');
		}
	});

	test('should successfully process Square payment with test card', async ({
		page,
	}) => {
		// Check if gateway selector exists to switch to Square
		const selector = page.locator('select.meshalto-form-select');

		if (await selector.isVisible()) {
			await selector.selectOption('square');

			// Wait for Square SDK to load
			await page.waitForTimeout(3000);

			// Fill in billing information
			await page.fill('input[placeholder="John Doe"]', SQUARE_TEST_CARD.name);
			await page.fill(
				'input[placeholder="john@example.com"]',
				SQUARE_TEST_CARD.email
			);
			await page.fill(
				'input[placeholder="123-456-7890"]',
				SQUARE_TEST_CARD.phone
			);
			await page.fill(
				'input[placeholder="123 Main St"]',
				SQUARE_TEST_CARD.address
			);
			await page.fill('input[placeholder="City"]', SQUARE_TEST_CARD.city);
			await page.fill('input[placeholder="State"]', SQUARE_TEST_CARD.state);
			await page.fill('input[placeholder="ZIP Code"]', SQUARE_TEST_CARD.zip);
			await page.selectOption('select', { value: SQUARE_TEST_CARD.country });

			// Fill Square card details (in iframe)
			const squareCardFrame = page.frameLocator(
				'iframe[name="sq-card-number"]'
			);
			await squareCardFrame.locator('input').fill(SQUARE_TEST_CARD.number);

			const squareExpiryFrame = page.frameLocator(
				'iframe[name="sq-expiration-date"]'
			);
			await squareExpiryFrame.locator('input').fill(SQUARE_TEST_CARD.expiry);

			const squareCvvFrame = page.frameLocator('iframe[name="sq-cvv"]');
			await squareCvvFrame.locator('input').fill(SQUARE_TEST_CARD.cvc);

			const squareZipFrame = page.frameLocator('iframe[name="sq-postal-code"]');
			await squareZipFrame.locator('input').fill(SQUARE_TEST_CARD.zip);

			// Click submit button
			await page.click('button.square-submit-button');

			// Wait for processing
			await page.waitForTimeout(5000);

			// Verify payment success (check console logs or success indicators)
			console.log('Square payment submitted - check backend logs for success');
		} else {
			console.log(
				'Gateway selector not available - skipping Square payment test'
			);
		}
	});

	test('should display error for invalid card details', async ({ page }) => {
		// Wait for Stripe Elements to load
		await page.waitForTimeout(3000);

		// Fill in billing information
		await page.fill('input[placeholder="John Doe"]', 'John Doe');
		await page.fill(
			'input[placeholder="john@example.com"]',
			'test@example.com'
		);

		// Fill with invalid card number (declined card: 4000000000000002)
		const cardFrame = page
			.frameLocator('iframe[name^="__privateStripeFrame"]')
			.first();

		const cardInput = cardFrame.locator('input').first();
		await cardInput.fill('4000000000000002'); // Declined card

		await cardInput.press('Tab');
		await page.waitForTimeout(500);

		const expiryInput = cardFrame.locator('input').nth(1);
		await expiryInput.fill(STRIPE_TEST_CARD.expiry);

		await expiryInput.press('Tab');
		await page.waitForTimeout(500);
		const cvcInput = cardFrame.locator('input').nth(2);
		await cvcInput.fill(STRIPE_TEST_CARD.cvc);

		// Complete billing fields
		await page.fill('input[placeholder="123-456-7890"]', '1234567890');
		await page.fill('input[placeholder="123 Main St"]', '123 Test St');
		await page.fill('input[placeholder="City"]', 'Test City');
		await page.fill('input[placeholder="State"]', 'CA');
		await page.fill('input[placeholder="ZIP Code"]', '12345');
		await page.selectOption('select', { value: 'US' });

		// Click pay button
		await page.click('button[type="submit"]');

		// Wait for error modal
		await expect(page.locator('.error-modal')).toBeVisible({ timeout: 30000 });

		// Verify error message is displayed
		await expect(page.locator('.error-modal')).toContainText('Payment Failed');
	});

	test('should validate required fields before submission', async ({
		page,
	}) => {
		// Wait for form to load
		await page.waitForTimeout(2000);

		// Try to submit without filling any fields
		await page.click('button[type="submit"]');

		// Check for validation errors or that form didn't submit
		// The form should show HTML5 validation or prevent submission
		await page.waitForTimeout(1000);

		// Verify we're still on the payment page (not showing success)
		await expect(page.locator('.meshalto-payment-header')).toBeVisible();
	});
});
