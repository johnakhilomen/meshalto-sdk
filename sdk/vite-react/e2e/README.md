# End-to-End Testing for Meshalto Payment SDK

This directory contains automated UI tests using Playwright to verify payment
gateway functionality.

## Overview

The E2E tests verify:

- ✅ Stripe payment gateway integration
- ✅ Square payment gateway integration
- ✅ Gateway switching functionality
- ✅ Form validation
- ✅ Error handling
- ✅ Success flows with test cards

## Test Files

### `payment-gateways.spec.ts`

Tests the main application with single gateway instance at a time.

### `isolated-gateways.spec.ts`

Tests multiple gateway instances simultaneously on the test page (`/test`).

## Setup

1. **Install Playwright browsers:**

   ```bash
   npm run test:install
   ```

2. **Ensure backend is running:**

   ```bash
   cd ../server
   docker-compose up -d
   ```

3. **Configure environment variables:** Make sure `.env` files are properly
   configured with:
   - `VITE_MESHALTO_API_KEY`
   - `VITE_STRIPE_PUBLISHABLE_KEY`
   - Square credentials in backend `.env`

## Running Tests

### Run all tests (headless):

```bash
npm run test:e2e
```

### Run tests with UI mode (interactive):

```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser):

```bash
npm run test:e2e:headed
```

### Run specific test file:

```bash
npx playwright test isolated-gateways.spec.ts
```

### Run specific test:

```bash
npx playwright test -g "should successfully complete Stripe payment"
```

## Test Cards

### Stripe Test Cards

- **Success:** `4242424242424242`
- **Declined:** `4000000000000002`
- **Requires Authentication:** `4000002500003155`

All Stripe test cards:

- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

### Square Test Cards (Sandbox)

- **Success:** `4111111111111111`
- **CVV Error:** `4000111111111115`
- **Declined:** `4000111111111111`

All Square test cards:

- Expiry: Any future date (e.g., `12/34`)
- CVV: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

## Test Page

Visit `http://localhost:5173/test` to see all gateway instances rendered
simultaneously:

- Stripe Gateway ($4.39)
- Square Gateway ($9.99)
- Auto Gateway Selector ($19.99)

This page is useful for:

- Manual testing
- Visual verification
- Debugging gateway interactions

## CI/CD Integration

The tests are configured to run in CI environments:

- Automatic retries (2x)
- Single worker mode
- HTML report generation
- Screenshots on failure
- Video recordings on failure

## Debugging

### View test report:

```bash
npx playwright show-report
```

### Debug specific test:

```bash
npx playwright test --debug -g "should successfully complete Stripe payment"
```

### View trace:

```bash
npx playwright show-trace trace.zip
```

## Test Structure

Each test follows this pattern:

1. **Navigate** to the app or test page
2. **Wait** for payment SDKs to initialize
3. **Fill** billing and card information
4. **Submit** payment
5. **Verify** success/error modal appears
6. **Assert** payment details are correct

## Common Issues

### CSP Errors

If you see Content Security Policy errors, ensure `index.html` includes:

- `https://js.stripe.com` for Stripe
- `https://sandbox.web.squarecdn.com` for Square

### Backend Not Running

Tests will fail if backend API is not accessible at `http://localhost:8002`.

### Timeout Issues

Increase timeout in test if needed:

```typescript
await expect(page.locator('.success-modal')).toBeVisible({ timeout: 60000 });
```

## Writing New Tests

Example test structure:

```typescript
test('should do something', async ({ page }) => {
	// 1. Navigate
	await page.goto('/');

	// 2. Interact
	await page.fill('input[placeholder="Name"]', 'John Doe');

	// 3. Submit
	await page.click('button[type="submit"]');

	// 4. Assert
	await expect(page.locator('.success-modal')).toBeVisible();
});
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Square Testing](https://developer.squareup.com/docs/testing/test-values)
