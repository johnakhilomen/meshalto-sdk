# Meshalto Payment SDK - Vue 3 Component

Beautiful, customizable payment component for Vue 3 applications with
Composition API.

## Installation

```bash
npm install @meshalto/vue
# or
yarn add @meshalto/vue
```

## Quick Start

```vue
<template>
	<MeshaltoPayment
		api-url="https://your-api.railway.app"
		:api-key="apiKey"
		:amount="99.99"
		currency="USD"
		@success="handleSuccess"
		@error="handleError"
	/>
</template>

<script setup>
import { MeshaltoPayment } from '@meshalto/vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const apiKey = import.meta.env.VITE_MESHALTO_API_KEY;

const handleSuccess = (result) => {
	console.log('Payment successful:', result);
	router.push('/success');
};

const handleError = (error) => {
	console.error('Payment failed:', error);
};
</script>
```

## Props

| Prop            | Type   | Required | Default   | Description                                            |
| --------------- | ------ | -------- | --------- | ------------------------------------------------------ |
| `api-url`       | String | Yes      | -         | Your Meshalto API URL                                  |
| `api-key`       | String | Yes      | -         | Your API key                                           |
| `amount`        | Number | Yes      | -         | Payment amount                                         |
| `currency`      | String | No       | 'USD'     | Currency code (USD, EUR, GBP, etc.)                    |
| `gateway`       | String | No       | 'auto'    | Payment gateway ('stripe', 'square', 'paypal', 'auto') |
| `theme`         | String | No       | 'light'   | UI theme ('light' or 'dark')                           |
| `primary-color` | String | No       | '#6366f1' | Primary color for buttons                              |

## Events

| Event     | Payload          | Description                   |
| --------- | ---------------- | ----------------------------- |
| `success` | `result: object` | Emitted when payment succeeds |
| `error`   | `error: Error`   | Emitted when payment fails    |
| `cancel`  | -                | Emitted when user cancels     |

## Examples

### Auto Gateway Selection

```vue
<template>
	<MeshaltoPayment
		api-url="https://your-api.railway.app"
		:api-key="apiKey"
		:amount="149.99"
		gateway="auto"
		@success="onSuccess"
	/>
</template>

<script setup>
import { MeshaltoPayment } from '@meshalto/vue';

const onSuccess = (result) => {
	console.log('Used gateway:', result.gateway);
	console.log('Transaction ID:', result.transaction_id);
};
</script>
```

### Dark Theme

```vue
<template>
	<MeshaltoPayment
		api-url="https://your-api.railway.app"
		:api-key="apiKey"
		:amount="49.99"
		theme="dark"
		primary-color="#8b5cf6"
	/>
</template>
```

### With Cancel Handler

```vue
<template>
	<MeshaltoPayment
		api-url="https://your-api.railway.app"
		:api-key="apiKey"
		:amount="29.99"
		@success="router.push('/success')"
		@error="handleError"
		@cancel="router.push('/cart')"
	/>
</template>

<script setup>
import { ref } from 'vue';
import { MeshaltoPayment } from '@meshalto/vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const handleError = (error) => {
	console.error(error);
};
</script>
```

### Multi-Currency with Reactive Props

```vue
<template>
	<div>
		<select v-model="currency">
			<option value="USD">USD</option>
			<option value="EUR">EUR</option>
			<option value="GBP">GBP</option>
		</select>

		<MeshaltoPayment
			api-url="https://your-api.railway.app"
			:api-key="apiKey"
			:amount="amount"
			:currency="currency"
		/>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MeshaltoPayment } from '@meshalto/vue';

const currency = ref('USD');
const amount = ref(99.99);
</script>
```

### Complete Checkout Flow

```vue
<template>
	<div class="checkout-page">
		<div
			v-if="!paymentComplete"
			class="payment-section"
		>
			<h2>Complete Your Purchase</h2>

			<div
				v-if="errorMessage"
				class="error-banner"
			>
				{{ errorMessage }}
			</div>

			<MeshaltoPayment
				api-url="https://your-api.railway.app"
				:api-key="apiKey"
				:amount="cartTotal"
				currency="USD"
				theme="light"
				@success="handleSuccess"
				@error="handleError"
				@cancel="handleCancel"
			/>
		</div>

		<div
			v-else
			class="success-section"
		>
			<h2>✓ Payment Successful!</h2>
			<p>Transaction ID: {{ transactionId }}</p>
			<button @click="router.push('/orders')">View Orders</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { MeshaltoPayment } from '@meshalto/vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '@/stores/cart';

const router = useRouter();
const cartStore = useCartStore();

const apiKey = import.meta.env.VITE_MESHALTO_API_KEY;
const paymentComplete = ref(false);
const transactionId = ref('');
const errorMessage = ref('');

const cartTotal = computed(() => cartStore.total);

const handleSuccess = (result: any) => {
	paymentComplete.value = true;
	transactionId.value = result.transaction_id;
	cartStore.clear();
};

const handleError = (error: Error) => {
	errorMessage.value = error.message;
	// Send to error tracking
	console.error('Payment error:', error);
};

const handleCancel = () => {
	router.push('/cart');
};
</script>

<style scoped>
.checkout-page {
	max-width: 600px;
	margin: 0 auto;
	padding: 2rem;
}

.error-banner {
	background: #fee;
	color: #c00;
	padding: 1rem;
	border-radius: 8px;
	margin-bottom: 1rem;
}

.success-section {
	text-align: center;
	padding: 3rem;
}
</style>
```

## TypeScript Support

Full TypeScript support with type definitions:

```vue
<script setup lang="ts">
import { MeshaltoPayment } from '@meshalto/vue';

interface PaymentResult {
	status: string;
	transaction_id: string;
	gateway: string;
	amount: number;
}

const handleSuccess = (result: PaymentResult) => {
	console.log(result.transaction_id);
};
</script>
```

## Composables (Advanced)

Create reusable payment logic:

```typescript
// composables/usePayment.ts
import { ref } from 'vue';
import axios from 'axios';

export function usePayment(apiUrl: string, apiKey: string) {
	const loading = ref(false);
	const error = ref<string | null>(null);

	const processPayment = async (amount: number, currency: string) => {
		loading.value = true;
		error.value = null;

		try {
			const response = await axios.post(
				`${apiUrl}/api/v1/payments`,
				{ amount, currency },
				{ headers: { 'X-API-Key': apiKey } }
			);
			return response.data;
		} catch (err: any) {
			error.value = err.message;
			throw err;
		} finally {
			loading.value = false;
		}
	};

	return { loading, error, processPayment };
}
```

## Styling

Customize with CSS variables:

```vue
<style>
.meshalto-payment {
	--primary-color: #8b5cf6;
	--error-color: #dc2626;
	--border-color: #d1d5db;
}
</style>
```

## Global Registration

Register globally (optional):

```typescript
// main.ts
import { createApp } from 'vue';
import { MeshaltoPayment } from '@meshalto/vue';
import App from './App.vue';

const app = createApp(App);
app.component('MeshaltoPayment', MeshaltoPayment);
app.mount('#app');
```

Then use without importing:

```vue
<template>
	<MeshaltoPayment
		api-url="..."
		:api-key="..."
		:amount="99.99"
	/>
</template>
```

## License

Apache-2.0
