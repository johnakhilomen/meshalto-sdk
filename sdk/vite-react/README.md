# @meshalto/react

A comprehensive React payment SDK for Stripe, Square, and PayPal with automatic
cost optimization and intelligent gateway routing.

## Features

- 🎯 **Unified API** - Single interface for multiple payment gateways
- 💰 **Cost Optimization** - Automatic gateway selection to minimize fees
- 🔄 **Smart Routing** - Intelligent payment routing based on amount and
  currency
- 🎨 **Themeable** - Multiple built-in themes (light, dark, professional,
  minimal)
- 📦 **Type Safe** - Full TypeScript support with comprehensive type definitions
- ⚡ **Modern** - Built with React 18+ and latest payment SDKs

## Installation

```bash
npm install @meshalto/react
# or
yarn add @meshalto/react
# or
pnpm add @meshalto/react
```

### Peer Dependencies

This package requires React 18 or higher:

```bash
npm install react@^18.0.0 react-dom@^18.0.0
```

## Quick Start

### Basic Usage

```tsx
import { MeshaltoPayment } from '@meshalto/react';
import '@meshalto/react/styles.css';

function App() {
	const handleSuccess = (response: any) => {
		console.log('Payment successful:', response);
	};

	const handleError = (error: any) => {
		console.error('Payment failed:', error);
	};

	return (
		<MeshaltoPayment
			amount={99.99}
			currency="USD"
			onSuccess={handleSuccess}
			onError={handleError}
			theme="professional"
		/>
	);
}
```

### Using Individual Payment Forms

You can also use individual payment gateway components:

```tsx
import {
  StripePaymentForm,
  SquarePaymentForm,
  PayPalPaymentForm
} from '@meshalto/react';
import '@meshalto/react/styles.css';

// Stripe
<StripePaymentForm
  amount={49.99}
  currency="USD"
  onSuccess={handleSuccess}
  onError={handleError}
/>

// Square
<SquarePaymentForm
  amount={49.99}
  currency="USD"
  onSuccess={handleSuccess}
  onError={handleError}
/>

// PayPal
<PayPalPaymentForm
  amount={49.99}
  currency="USD"
  onSuccess={handleSuccess}
  onError={handleError}
/>
```

### Using Modals

```tsx
import { SuccessModal, ErrorModal, LoadingModal } from '@meshalto/react';

<SuccessModal
  isOpen={showSuccess}
  onClose={() => setShowSuccess(false)}
  message="Payment completed successfully!"
/>

<ErrorModal
  isOpen={showError}
  onClose={() => setShowError(false)}
  error="Payment failed. Please try again."
/>

<LoadingModal
  isOpen={isProcessing}
  message="Processing payment..."
/>
```

### Custom Themes

```tsx
import { themes } from '@meshalto/react';

// Available themes
const availableThemes = ['light', 'dark', 'professional', 'minimal'];

<MeshaltoPayment
	amount={99.99}
	theme="dark"
	// or use theme object directly
	// theme={themes.dark}
/>;
```

## API Reference

### `<MeshaltoPayment />`

The main payment component with automatic gateway selection.

#### Props

| Prop               | Type                                               | Default                          | Description                                  |
| ------------------ | -------------------------------------------------- | -------------------------------- | -------------------------------------------- |
| `amount`           | `number`                                           | Required                         | Payment amount                               |
| `currency`         | `string`                                           | `"USD"`                          | Currency code (ISO 4217)                     |
| `customerId`       | `string`                                           | -                                | Customer identifier                          |
| `onSuccess`        | `(response: any) => void`                          | -                                | Success callback                             |
| `onError`          | `(error: any) => void`                             | -                                | Error callback                               |
| `theme`            | `'light' \| 'dark' \| 'professional' \| 'minimal'` | `"light"`                        | UI theme                                     |
| `enabledGateways`  | `string[]`                                         | `["stripe", "square", "paypal"]` | Enabled payment gateways                     |
| `preferredGateway` | `string`                                           | -                                | Preferred gateway (overrides auto-selection) |

### Individual Payment Forms

All payment form components share these common props:

| Prop        | Type                      | Default  | Description      |
| ----------- | ------------------------- | -------- | ---------------- |
| `amount`    | `number`                  | Required | Payment amount   |
| `currency`  | `string`                  | `"USD"`  | Currency code    |
| `onSuccess` | `(response: any) => void` | -        | Success callback |
| `onError`   | `(error: any) => void`    | -        | Error callback   |

### Modal Components

#### `<SuccessModal />`

| Prop      | Type         | Required | Description            |
| --------- | ------------ | -------- | ---------------------- |
| `isOpen`  | `boolean`    | Yes      | Modal visibility       |
| `onClose` | `() => void` | Yes      | Close handler          |
| `message` | `string`     | No       | Custom success message |

#### `<ErrorModal />`

| Prop      | Type         | Required | Description      |
| --------- | ------------ | -------- | ---------------- |
| `isOpen`  | `boolean`    | Yes      | Modal visibility |
| `onClose` | `() => void` | Yes      | Close handler    |
| `error`   | `string`     | No       | Error message    |

#### `<LoadingModal />`

| Prop      | Type      | Required | Description      |
| --------- | --------- | -------- | ---------------- |
| `isOpen`  | `boolean` | Yes      | Modal visibility |
| `message` | `string`  | No       | Loading message  |

## Environment Variables

Configure your payment gateway credentials:

```env
# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Square
VITE_SQUARE_APPLICATION_ID=sandbox-sq0idb-...
VITE_SQUARE_LOCATION_ID=L...

# PayPal
VITE_PAYPAL_CLIENT_ID=AY...
```

## TypeScript Support

This package includes comprehensive TypeScript definitions. All components and
props are fully typed for the best development experience.

```tsx
import type {
	MeshaltoPaymentProps,
	StripePaymentFormProps,
	Theme,
} from '@meshalto/react';
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md)
for details.

## License

MIT © Meshalto

## Links

- [GitHub Repository](https://github.com/johnakhilomen/meshalto-payment-sdk)
- [Issue Tracker](https://github.com/johnakhilomen/meshalto-payment-sdk/issues)
- [Documentation](https://github.com/johnakhilomen/meshalto-payment-sdk#readme)

## Support

For questions and support, please
[open an issue](https://github.com/johnakhilomen/meshalto-payment-sdk/issues) on
GitHub.

import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([ globalIgnores(['dist']), { files:
['**/*.{ts,tsx}'], extends: [ // Other configs... // Enable lint rules for React
reactX.configs['recommended-typescript'], // Enable lint rules for React DOM
reactDom.configs.recommended, ], languageOptions: { parserOptions: { project:
['./tsconfig.node.json', './tsconfig.app.json'], tsconfigRootDir:
import.meta.dirname, }, // other options... }, }, ])

```

```
