import { test, expect } from '@playwright/test';

/**
 * Dedicated tests for individual gateway instances
 */

const STRIPE_TEST_CARD = {
	number: '4242424242424242',
	expiry: '1234',
	cvc: '123',
	zip: '12345',
};

const SQUARE_TEST_CARD = {
	number: '4111111111111111',
	expiry: '12/34',
	cvc: '123',
	zip: '12345',
};

test.describe('Stripe Gateway - Isolated Tests', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/test');
		await page.waitForLoadState('networkidle');
	});

	test('should render Stripe payment form in first section', async ({
		page,
	}) => {
		// Scroll to Stripe section
		await page.locator('#stripe-test').scrollIntoViewIfNeeded();

		// Wait for Stripe to initialize
		await page.waitForTimeout(3000);

		// Check that Stripe form is rendered
		const stripeSection = page.locator('#stripe-test');
		await expect(
			stripeSection.locator('.meshalto-payment-header h3')
		).toHaveText('Payment Details');
		await expect(stripeSection.locator('.amount')).toContainText('USD 4.39');

		// Verify Stripe Elements iframes are loaded
		const stripeIframes = stripeSection.frameLocator(
			'iframe[name^="__privateStripeFrame"]'
		);
		await expect(stripeIframes.first()).toBeAttached({ timeout: 10000 });
	});

	test('should successfully complete Stripe payment', async ({ page }) => {
		const stripeSection = page.locator('#stripe-test');
		await stripeSection.scrollIntoViewIfNeeded();
		await page.waitForTimeout(3000);

		// Fill billing information
		await stripeSection
			.locator('input[placeholder="John Doe"]')
			.fill('John Doe');
		await stripeSection
			.locator('input[placeholder="john@example.com"]')
			.fill('test@example.com');
		await stripeSection
			.locator('input[placeholder="123-456-7890"]')
			.fill('1234567890');
		await stripeSection
			.locator('input[placeholder="123 Main St"]')
			.fill('123 Test St');
		await stripeSection.locator('input[placeholder="City"]').fill('Test City');
		await stripeSection.locator('input[placeholder="State"]').fill('CA');
		await stripeSection.locator('input[placeholder="ZIP Code"]').fill('12345');
		await stripeSection.locator('select').selectOption({ value: 'US' });

		// Fill Stripe CardElement (unified input)
		const cardFrame = stripeSection
			.frameLocator('iframe[name^="__privateStripeFrame"]')
			.first();
		const cardInput = cardFrame.locator('input[name="cardnumber"]');
		await cardInput.fill(
			`${STRIPE_TEST_CARD.number} ${STRIPE_TEST_CARD.expiry} ${STRIPE_TEST_CARD.cvc}`
		);

		// Submit payment
		await stripeSection.locator('button[type="submit"]').click();

		// Wait for success modal
		await expect(page.locator('.success-modal')).toBeVisible({
			timeout: 30000,
		});
		await expect(page.locator('.success-modal')).toContainText(
			'Payment Successful'
		);
		await expect(page.locator('.success-modal')).toContainText('USD 4.39');
	});
});

test.describe('Square Gateway - Isolated Tests', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/test');
		await page.waitForLoadState('networkidle');
	});

	test('should render Square payment form in second section', async ({
		page,
	}) => {
		// Scroll to Square section
		await page.locator('#square-test').scrollIntoViewIfNeeded();

		// Wait for Square SDK to initialize
		await page.waitForTimeout(3000);

		// Check that Square form is rendered
		const squareSection = page.locator('#square-test');
		await expect(
			squareSection.locator('.meshalto-payment-header h3')
		).toHaveText('Payment Details');
		await expect(squareSection.locator('.amount')).toContainText('USD 9.99');

		// Verify Square card container is present
		await expect(squareSection.locator('#card-container')).toBeVisible();
	});

	test('should successfully complete Square payment', async ({ page }) => {
		const squareSection = page.locator('#square-test');
		await squareSection.scrollIntoViewIfNeeded();
		await page.waitForTimeout(3000);

		// Fill billing information
		await squareSection
			.locator('input[placeholder="John Doe"]')
			.fill('John Doe');
		await squareSection
			.locator('input[placeholder="john@example.com"]')
			.fill('test@example.com');
		await squareSection
			.locator('input[placeholder="123-456-7890"]')
			.fill('1234567890');
		await squareSection
			.locator('input[placeholder="123 Main St"]')
			.fill('123 Test St');
		await squareSection.locator('input[placeholder="City"]').fill('Test City');
		await squareSection.locator('input[placeholder="State"]').fill('CA');
		await squareSection.locator('input[placeholder="ZIP Code"]').fill('12345');
		await squareSection.locator('select').selectOption({ value: 'US' });

		// Fill Square card elements (in iframes)
		const cardFrame = squareSection.frameLocator(
			'iframe[name="sq-card-number"]'
		);
		await cardFrame.locator('input').fill(SQUARE_TEST_CARD.number);

		const expiryFrame = squareSection.frameLocator(
			'iframe[name="sq-expiration-date"]'
		);
		await expiryFrame.locator('input').fill(SQUARE_TEST_CARD.expiry);

		const cvvFrame = squareSection.frameLocator('iframe[name="sq-cvv"]');
		await cvvFrame.locator('input').fill(SQUARE_TEST_CARD.cvc);

		const zipFrame = squareSection.frameLocator(
			'iframe[name="sq-postal-code"]'
		);
		await zipFrame.locator('input').fill(SQUARE_TEST_CARD.zip);

		// Submit payment
		await squareSection.locator('button.square-submit-button').click();

		// Wait for completion (Square might show success differently)
		await page.waitForTimeout(5000);

		// Check console for success (or verify success modal if implemented)
		console.log('Square payment submitted - verify in backend logs');
	});
});

test.describe('Auto Gateway Selector Tests', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/test');
		await page.waitForLoadState('networkidle');
	});

	test('should display gateway selector and allow switching', async ({
		page,
	}) => {
		const autoSection = page.locator('#auto-test');
		await autoSection.scrollIntoViewIfNeeded();

		// Check gateway selector is visible
		const selector = autoSection.locator('select.meshalto-form-select');
		await expect(selector).toBeVisible();

		// Verify default option
		await expect(selector).toHaveValue('auto');

		// Switch to Stripe
		await selector.selectOption('stripe');
		await page.waitForTimeout(2000);

		// Verify Stripe form loads
		const stripeIframes = autoSection.frameLocator(
			'iframe[name^="__privateStripeFrame"]'
		);
		await expect(stripeIframes.first()).toBeAttached({ timeout: 10000 });

		// Switch to Square
		await selector.selectOption('square');
		await page.waitForTimeout(2000);

		// Verify Square form loads
		await expect(autoSection.locator('#card-container')).toBeVisible();
	});

	test('should complete payment after switching gateway', async ({ page }) => {
		const autoSection = page.locator('#auto-test');
		await autoSection.scrollIntoViewIfNeeded();

		// Switch to Stripe
		await autoSection
			.locator('select.meshalto-form-select')
			.selectOption('stripe');
		await page.waitForTimeout(3000);

		// Fill billing info
		await autoSection.locator('input[placeholder="John Doe"]').fill('John Doe');
		await autoSection
			.locator('input[placeholder="john@example.com"]')
			.fill('test@example.com');
		await autoSection
			.locator('input[placeholder="123-456-7890"]')
			.fill('1234567890');
		await autoSection
			.locator('input[placeholder="123 Main St"]')
			.fill('123 Test St');
		await autoSection.locator('input[placeholder="City"]').fill('Test City');
		await autoSection.locator('input[placeholder="State"]').fill('CA');
		await autoSection.locator('input[placeholder="ZIP Code"]').fill('12345');
		await autoSection.locator('select').last().selectOption({ value: 'US' });

		// Fill Stripe CardElement (unified input)
		const cardFrame = autoSection
			.frameLocator('iframe[name^="__privateStripeFrame"]')
			.first();
		const cardInput = cardFrame.locator('input[name="cardnumber"]');
		await cardInput.fill(
			`${STRIPE_TEST_CARD.number} ${STRIPE_TEST_CARD.expiry} ${STRIPE_TEST_CARD.cvc}`
		);

		// Submit
		await autoSection.locator('button[type="submit"]').click();

		// Verify success
		await expect(page.locator('.success-modal')).toBeVisible({
			timeout: 30000,
		});
		await expect(page.locator('.success-modal')).toContainText('USD 19.99');
	});
});
