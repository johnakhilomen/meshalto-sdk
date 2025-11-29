# Automated E2E Testing Guide

Complete automated UI testing for Meshalto Payment SDK with Stripe and Square
gateways.

## 🎯 What's Tested

✅ **Stripe Gateway**

- Form rendering and initialization
- Payment processing with test cards
- Success modal verification
- Error handling

✅ **Square Gateway**

- Form rendering and initialization
- Payment processing with test cards
- Billing information capture
- Backend API integration

✅ **Gateway Switching**

- Dynamic gateway selection
- Component remounting
- State synchronization

✅ **Form Validation**

- Required field validation
- Invalid card error handling
- Test card decline scenarios

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd sdk/vite-react
npm install
npm run test:install
```

### 2. Start Backend

```bash
cd sdk/server
docker-compose up -d
```

### 3. Configure Environment

Create `sdk/vite-react/.env`:

```env
VITE_MESHALTO_API_KEY=your-api-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 4. Run Tests

**Headless (CI mode):**

```bash
./run-e2e-tests.sh
```

**With UI (Interactive):**

```bash
./run-e2e-tests.sh --ui
```

**Headed (See Browser):**

```bash
./run-e2e-tests.sh --headed
```

**Debug Mode:**

```bash
./run-e2e-tests.sh --debug
```

## 📁 Project Structure

```
sdk/vite-react/
├── e2e/
│   ├── payment-gateways.spec.ts    # Main app tests
│   ├── isolated-gateways.spec.ts   # Isolated gateway tests
│   └── README.md                   # E2E test documentation
├── src/
│   ├── TestPage.tsx                # Test page with multiple gateways
│   ├── StripePaymentForm.tsx       # Stripe integration
│   ├── SquarePaymentForm.tsx       # Square integration
│   └── MeshaltoPayment.tsx         # Main component
├── playwright.config.ts            # Playwright configuration
└── run-e2e-tests.sh               # Test runner script
```

## 🧪 Test Scenarios

### Stripe Tests

```typescript
test('should successfully process Stripe payment', async ({ page }) => {
	// Uses Stripe test card: 4242424242424242
	// Verifies success modal with transaction ID
});

test('should handle declined Stripe card', async ({ page }) => {
	// Uses declined card: 4000000000000002
	// Verifies error modal appears
});
```

### Square Tests

```typescript
test('should successfully process Square payment', async ({ page }) => {
	// Uses Square test card: 4111111111111111
	// Verifies backend integration
});
```

### Gateway Switching

```typescript
test('should switch between gateways', async ({ page }) => {
	// Verifies component remounting
	// Tests state synchronization
});
```

## 🃏 Test Cards

### Stripe

| Card Number      | Scenario     | Expiry | CVC | ZIP   |
| ---------------- | ------------ | ------ | --- | ----- |
| 4242424242424242 | ✅ Success   | 12/34  | 123 | 12345 |
| 4000000000000002 | ❌ Declined  | 12/34  | 123 | 12345 |
| 4000002500003155 | 🔐 3D Secure | 12/34  | 123 | 12345 |

### Square (Sandbox)

| Card Number      | Scenario     | Expiry | CVV | ZIP   |
| ---------------- | ------------ | ------ | --- | ----- |
| 4111111111111111 | ✅ Success   | 12/34  | 123 | 12345 |
| 4000111111111115 | ❌ CVV Error | 12/34  | 123 | 12345 |
| 4000111111111111 | ❌ Declined  | 12/34  | 123 | 12345 |

## 🌐 Test Page

Visit `http://localhost:5173/test` to manually test all gateways:

- **Stripe Section** - $4.39 payment
- **Square Section** - $9.99 payment
- **Auto Selector** - $19.99 payment with gateway dropdown

## 📊 View Results

**HTML Report:**

```bash
npx playwright show-report
```

**Trace Viewer:**

```bash
npx playwright show-trace trace.zip
```

**Screenshots:** Located in `test-results/` directory after test failures.

## 🔧 Configuration

### Playwright Config (`playwright.config.ts`)

```typescript
export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	retries: process.env.CI ? 2 : 0,
	use: {
		baseURL: 'http://localhost:5173',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
	},
	webServer: {
		command: 'npm run dev',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI,
	},
});
```

### Environment Variables

**Frontend (`.env`):**

```env
VITE_MESHALTO_API_KEY=your-api-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Backend (`server/.env`):**

```env
STRIPE_SECRET_KEY=sk_test_...
SQUARE_ACCESS_TOKEN=sandbox-...
SQUARE_LOCATION_ID=L5CR9TRH0WSVC
SQUARE_ENVIRONMENT=sandbox
```

## 🤖 CI/CD Integration

Tests run automatically on:

- Push to `main` or `develop` branches
- Pull requests
- Manual workflow dispatch

**GitHub Actions:**

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run E2E tests
        run: npm run test:e2e
```

## 🐛 Troubleshooting

### Tests Timeout

**Solution:** Increase timeout in test:

```typescript
await expect(page.locator('.modal')).toBeVisible({ timeout: 60000 });
```

### CSP Errors

**Solution:** Verify `index.html` includes required domains:

```html
<meta
	http-equiv="Content-Security-Policy"
	content="
  script-src 'self' https://js.stripe.com https://sandbox.web.squarecdn.com;
  frame-src 'self' https://js.stripe.com https://sandbox.web.squarecdn.com;
"
/>
```

### Backend Not Running

**Solution:** Start backend and verify health:

```bash
cd sdk/server && docker-compose up -d
curl http://localhost:8002/health
```

### Stripe Elements Not Loading

**Solution:** Check Stripe publishable key is set:

```bash
echo $VITE_STRIPE_PUBLISHABLE_KEY
```

### Square SDK Not Initializing

**Solution:** Verify Square script tag in `index.html`:

```html
<script src="https://sandbox.web.squarecdn.com/v1/square.js"></script>
```

## 📝 Writing New Tests

### Basic Test Template

```typescript
import { test, expect } from '@playwright/test';

test('should do something', async ({ page }) => {
	// 1. Navigate
	await page.goto('/');

	// 2. Wait for SDK
	await page.waitForTimeout(3000);

	// 3. Fill form
	await page.fill('input[placeholder="Name"]', 'John Doe');

	// 4. Submit
	await page.click('button[type="submit"]');

	// 5. Verify
	await expect(page.locator('.success-modal')).toBeVisible();
});
```

### Working with Iframes

**Stripe Elements:**

```typescript
const cardFrame = page
	.frameLocator('iframe[name^="__privateStripeFrame"]')
	.first();
await cardFrame.locator('input[name="cardnumber"]').fill('4242424242424242');
```

**Square Elements:**

```typescript
const cardFrame = page.frameLocator('iframe[name="sq-card-number"]');
await cardFrame.locator('input').fill('4111111111111111');
```

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Square Testing Guide](https://developer.squareup.com/docs/testing/test-values)
- [Payment SDK Documentation](../README.md)

## 🤝 Contributing

1. Write tests for new features
2. Run tests locally before committing
3. Ensure all tests pass in CI
4. Update this README with new test scenarios

## 📧 Support

For issues or questions:

- Open an issue on GitHub
- Check existing test failures in CI
- Review Playwright trace files
