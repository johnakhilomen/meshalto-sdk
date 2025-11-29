<template>
	<div
		:class="['meshalto-payment', theme]"
		:style="{ '--primary-color': primaryColor }"
	>
		<div class="meshalto-payment-container">
			<div class="meshalto-payment-header">
				<h3>Payment Details</h3>
				<div class="amount">{{ currency }} {{ formattedAmount }}</div>
			</div>

			<div
				v-if="error"
				class="meshalto-payment-error"
			>
				{{ error }}
			</div>

			<form
				@submit.prevent="handleSubmit"
				class="meshalto-payment-form"
			>
				<div
					v-if="gateway === 'auto'"
					class="meshalto-form-group"
				>
					<label>Payment Gateway</label>
					<select
						v-model="selectedGateway"
						class="meshalto-form-select"
					>
						<option value="auto">Auto Select (Best Rate)</option>
						<option value="stripe">Stripe</option>
						<option value="square">Square</option>
						<option value="paypal">PayPal</option>
					</select>
				</div>

				<div class="meshalto-form-group">
					<label>Cardholder Name</label>
					<input
						v-model="cardholderName"
						type="text"
						placeholder="John Doe"
						class="meshalto-form-input"
						:disabled="loading"
					/>
				</div>

				<div class="meshalto-form-group">
					<label>Card Number</label>
					<input
						:value="cardNumber"
						@input="handleCardNumberChange"
						type="text"
						placeholder="1234 5678 9012 3456"
						class="meshalto-form-input"
						:disabled="loading"
					/>
				</div>

				<div class="meshalto-form-row">
					<div class="meshalto-form-group">
						<label>Expiry Date</label>
						<input
							:value="expiryDate"
							@input="handleExpiryDateChange"
							type="text"
							placeholder="MM/YY"
							class="meshalto-form-input"
							:disabled="loading"
						/>
					</div>

					<div class="meshalto-form-group">
						<label>CVV</label>
						<input
							:value="cvv"
							@input="handleCvvChange"
							type="text"
							placeholder="123"
							class="meshalto-form-input"
							:disabled="loading"
						/>
					</div>
				</div>

				<div class="meshalto-form-actions">
					<button
						type="submit"
						class="meshalto-btn meshalto-btn-primary"
						:disabled="loading"
					>
						<span
							v-if="loading"
							class="meshalto-spinner"
						></span>
						{{
							loading ? 'Processing...' : `Pay ${currency} ${formattedAmount}`
						}}
					</button>

					<button
						v-if="onCancel"
						type="button"
						class="meshalto-btn meshalto-btn-secondary"
						@click="handleCancel"
						:disabled="loading"
					>
						Cancel
					</button>
				</div>
			</form>

			<div class="meshalto-payment-footer">
				<div class="meshalto-secure-badge">
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
						/>
					</svg>
					Secure Payment
				</div>
				<div class="meshalto-powered-by">
					Powered by <strong>Meshalto</strong>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import axios from 'axios';

interface Props {
	apiUrl: string;
	apiKey: string;
	amount: number;
	currency?: string;
	gateway?: 'stripe' | 'square' | 'paypal' | 'auto';
	theme?: 'light' | 'dark';
	primaryColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
	currency: 'USD',
	gateway: 'auto',
	theme: 'light',
	primaryColor: '#6366f1',
});

const emit = defineEmits<{
	(e: 'success', result: any): void;
	(e: 'error', error: Error): void;
	(e: 'cancel'): void;
}>();

const loading = ref(false);
const selectedGateway = ref(props.gateway);
const cardNumber = ref('');
const expiryDate = ref('');
const cvv = ref('');
const cardholderName = ref('');
const error = ref<string | null>(null);

const formattedAmount = computed(() => props.amount.toFixed(2));

const formatCardNumber = (value: string): string => {
	const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
	const matches = v.match(/\d{4,16}/g);
	const match = (matches && matches[0]) || '';
	const parts = [];

	for (let i = 0, len = match.length; i < len; i += 4) {
		parts.push(match.substring(i, i + 4));
	}

	return parts.length ? parts.join(' ') : value;
};

const formatExpiryDate = (value: string): string => {
	const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
	if (v.length >= 2) {
		return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
	}
	return v;
};

const handleCardNumberChange = (e: Event) => {
	const target = e.target as HTMLInputElement;
	const formatted = formatCardNumber(target.value);
	if (formatted.length <= 19) {
		cardNumber.value = formatted;
	}
};

const handleExpiryDateChange = (e: Event) => {
	const target = e.target as HTMLInputElement;
	const formatted = formatExpiryDate(target.value);
	if (formatted.length <= 5) {
		expiryDate.value = formatted;
	}
};

const handleCvvChange = (e: Event) => {
	const target = e.target as HTMLInputElement;
	const value = target.value.replace(/[^0-9]/gi, '');
	if (value.length <= 4) {
		cvv.value = value;
	}
};

const handleCancel = () => {
	emit('cancel');
};

const handleSubmit = async () => {
	loading.value = true;
	error.value = null;

	try {
		// Validate inputs
		if (
			!cardNumber.value ||
			!expiryDate.value ||
			!cvv.value ||
			!cardholderName.value
		) {
			throw new Error('Please fill in all fields');
		}

		// Process payment
		const response = await axios.post(
			`${props.apiUrl}/api/v1/payments`,
			{
				amount: props.amount,
				currency: props.currency,
				gateway:
					selectedGateway.value === 'auto' ? undefined : selectedGateway.value,
				payment_method: {
					type: 'card',
					card: {
						number: cardNumber.value.replace(/\s/g, ''),
						expiry_month: expiryDate.value.split('/')[0],
						expiry_year: `20${expiryDate.value.split('/')[1]}`,
						cvv: cvv.value,
						cardholder_name: cardholderName.value,
					},
				},
			},
			{
				headers: {
					'Content-Type': 'application/json',
					'X-API-Key': props.apiKey,
				},
			}
		);

		if (response.data.status === 'success') {
			emit('success', response.data);
		} else {
			throw new Error(response.data.message || 'Payment failed');
		}
	} catch (err: any) {
		const errorMessage =
			err.response?.data?.message || err.message || 'Payment failed';
		error.value = errorMessage;
		emit('error', new Error(errorMessage));
	} finally {
		loading.value = false;
	}
};
</script>

<style scoped>
.meshalto-payment {
	--primary-color: #6366f1;
	--error-color: #ef4444;
	--success-color: #10b981;
	--border-color: #e5e7eb;
	--text-primary: #111827;
	--text-secondary: #6b7280;
	--bg-primary: #ffffff;
	--bg-secondary: #f9fafb;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
		'Helvetica Neue', Arial, sans-serif;
	width: 100%;
	max-width: 450px;
	margin: 0 auto;
}

.meshalto-payment.dark {
	--border-color: #374151;
	--text-primary: #f9fafb;
	--text-secondary: #9ca3af;
	--bg-primary: #1f2937;
	--bg-secondary: #111827;
}

.meshalto-payment-container {
	background: var(--bg-primary);
	border: 1px solid var(--border-color);
	border-radius: 12px;
	padding: 24px;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
		0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.meshalto-payment-header {
	margin-bottom: 24px;
	padding-bottom: 16px;
	border-bottom: 1px solid var(--border-color);
}

.meshalto-payment-header h3 {
	margin: 0 0 8px 0;
	font-size: 20px;
	font-weight: 600;
	color: var(--text-primary);
}

.meshalto-payment-header .amount {
	font-size: 32px;
	font-weight: 700;
	color: var(--primary-color);
}

.meshalto-payment-error {
	background: #fef2f2;
	border: 1px solid #fecaca;
	color: var(--error-color);
	padding: 12px 16px;
	border-radius: 8px;
	margin-bottom: 16px;
	font-size: 14px;
}

.meshalto-payment-form {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.meshalto-form-group {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.meshalto-form-group label {
	font-size: 14px;
	font-weight: 500;
	color: var(--text-primary);
}

.meshalto-form-input,
.meshalto-form-select {
	width: 100%;
	padding: 12px 16px;
	border: 1px solid var(--border-color);
	border-radius: 8px;
	font-size: 16px;
	color: var(--text-primary);
	background: var(--bg-primary);
	transition: border-color 0.2s, box-shadow 0.2s;
}

.meshalto-form-input:focus,
.meshalto-form-select:focus {
	outline: none;
	border-color: var(--primary-color);
	box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.meshalto-form-input:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.meshalto-form-row {
	display: grid;
	grid-template-columns: 2fr 1fr;
	gap: 16px;
}

.meshalto-form-actions {
	display: flex;
	gap: 12px;
	margin-top: 8px;
}

.meshalto-btn {
	flex: 1;
	padding: 14px 24px;
	border: none;
	border-radius: 8px;
	font-size: 16px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
}

.meshalto-btn-primary {
	background: var(--primary-color);
	color: white;
}

.meshalto-btn-primary:hover:not(:disabled) {
	background: #4f46e5;
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.meshalto-btn-primary:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.meshalto-btn-secondary {
	background: var(--bg-secondary);
	color: var(--text-primary);
	border: 1px solid var(--border-color);
}

.meshalto-btn-secondary:hover:not(:disabled) {
	background: #f3f4f6;
}

.meshalto-spinner {
	width: 16px;
	height: 16px;
	border: 2px solid rgba(255, 255, 255, 0.3);
	border-radius: 50%;
	border-top-color: white;
	animation: spin 0.8s linear infinite;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

.meshalto-payment-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 20px;
	padding-top: 16px;
	border-top: 1px solid var(--border-color);
	font-size: 12px;
	color: var(--text-secondary);
}

.meshalto-secure-badge {
	display: flex;
	align-items: center;
	gap: 4px;
}

.meshalto-powered-by {
	display: flex;
	align-items: center;
	gap: 4px;
}

.meshalto-powered-by strong {
	color: var(--primary-color);
	font-weight: 600;
}

@media (max-width: 480px) {
	.meshalto-payment-container {
		padding: 16px;
	}

	.meshalto-form-row {
		grid-template-columns: 1fr;
	}

	.meshalto-form-actions {
		flex-direction: column;
	}
}
</style>
