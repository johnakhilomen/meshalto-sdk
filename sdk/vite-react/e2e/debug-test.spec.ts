import { test, expect } from '@playwright/test';

test('debug - check what loads on the page', async ({ page }) => {
	await page.goto('/');

	// Wait a bit for the page to load
	await page.waitForTimeout(5000);

	// Take a screenshot
	await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });

	// Log the page content
	const content = await page.content();
	console.log('Page HTML length:', content.length);

	// Check for meshalto-payment
	const meshaltoPayment = page.locator('.meshalto-payment');
	const isVisible = await meshaltoPayment.isVisible().catch(() => false);
	console.log('meshalto-payment visible:', isVisible);

	// Check for gateway selector
	const gatewaySelector = page.locator('select.meshalto-form-select');
	const selectorVisible = await gatewaySelector.isVisible().catch(() => false);
	console.log('gateway selector visible:', selectorVisible);

	if (selectorVisible) {
		const value = await gatewaySelector.inputValue();
		console.log('Current gateway:', value);

		// Get all options
		const options = await gatewaySelector.locator('option').allTextContents();
		console.log('Available gateways:', options);
	}

	// Check for input fields
	const inputs = await page.locator('input[placeholder]').all();
	console.log('Number of input fields:', inputs.length);

	for (const input of inputs) {
		const placeholder = await input.getAttribute('placeholder');
		const type = await input.getAttribute('type');
		console.log(`Input: type=${type}, placeholder=${placeholder}`);
	}

	// Check for iframes
	const iframes = await page.locator('iframe').all();
	console.log('Number of iframes:', iframes.length);

	for (const iframe of iframes) {
		const name = await iframe.getAttribute('name');
		const title = await iframe.getAttribute('title');
		console.log(`Iframe: name=${name}, title=${title}`);
	}
});
