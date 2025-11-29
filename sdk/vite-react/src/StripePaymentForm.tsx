import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
	Elements,
	useStripe,
	useElements,
	CardElement,
} from '@stripe/react-stripe-js';
import pageData from './page.json';
import './StripePaymentForm.css';

const stripePromise = loadStripe(
	import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? ''
);

interface StripePaymentFormProps {
	amount?: number;
	currency?: string;
	onSuccess?: (result: any) => void;
	onError?: (error: Error) => void;
}

interface CheckoutFormProps {
	amount?: number;
	currency?: string;
	onSuccess?: (result: any) => void;
	onError?: (error: Error) => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({
	amount = 99.99,
	currency = 'USD',
	onSuccess,
	onError,
}) => {
	const stripe = useStripe();
	const elements = useElements();

	// Form state
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [address, setAddress] = useState('');
	const [city, setCity] = useState('');
	const [state, setState] = useState('');
	const [zipCode, setZipCode] = useState('');
	const [country, setCountry] = useState('US');
	const [isProcessing, setIsProcessing] = useState(false);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!stripe || !elements || isProcessing) return;

		setIsProcessing(true);

		const cardElement = elements.getElement(CardElement);
		if (!cardElement) {
			setIsProcessing(false);
			return;
		}

		try {
			const { error, paymentMethod } = await stripe.createPaymentMethod({
				type: 'card',
				card: cardElement,
				billing_details: {
					name,
					email,
					phone: phone || undefined,
					address: {
						line1: address,
						city,
						state,
						postal_code: zipCode,
						country,
					},
				},
			});

			if (error) {
				onError?.(new Error(error.message || 'Payment method creation failed'));
				setIsProcessing(false);
				return;
			}

			// Convert amount to cents for Stripe
			const amountInCents = Math.round(amount * 100);

			const apiBase = import.meta.env.VITE_MESHALTO_API_URL;
			const stripePath = import.meta.env.VITE_MESHALTO_API_URL_STRIPE_PATH;
			const response = await fetch(`${apiBase}${stripePath}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-API-Key': import.meta.env.VITE_MESHALTO_API_KEY ?? '',
				},
				body: JSON.stringify({
					amount: amountInCents,
					currency: currency.toUpperCase(),
					payment_method: 'card',
					customer: {
						email,
						name,
						phone: phone || undefined,
						address: {
							line1: address,
							city,
							state,
							postal_code: zipCode,
							country,
						},
					},
					payment_token: {
						token: paymentMethod.id,
						token_type: 'card',
					},
				}),
			});

			const result = await response.json();

			if (response.ok) {
				onSuccess?.(result);
			} else {
				onError?.(
					new Error(
						result.error || result.message || 'Payment processing failed'
					)
				);
			}
		} catch (err: any) {
			onError?.(new Error(err.message || 'Network error occurred'));
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="stripe-checkout-form"
		>
			<div className="stripe-form-header">
				<h3>{pageData.header.title}</h3>
			</div>

			<div className="stripe-form-group">
				<label>Name *</label>
				<input
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="John Doe"
					required
					className="stripe-form-input"
				/>
			</div>

			<div className="stripe-form-group">
				<label>Email *</label>
				<input
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="john@example.com"
					required
					className="stripe-form-input"
				/>
			</div>

			<div className="stripe-form-group">
				<label>Phone (Optional)</label>
				<input
					type="tel"
					value={phone}
					onChange={(e) => setPhone(e.target.value)}
					placeholder="+1 (555) 123-4567"
					className="stripe-form-input"
				/>
			</div>

			<div className="stripe-form-group">
				<label>Address *</label>
				<input
					type="text"
					value={address}
					onChange={(e) => setAddress(e.target.value)}
					placeholder="123 Main Street"
					required
					className="stripe-form-input"
				/>
			</div>

			<div className="stripe-form-row">
				<div className="stripe-form-group">
					<label>City *</label>
					<input
						type="text"
						value={city}
						onChange={(e) => setCity(e.target.value)}
						placeholder="New York"
						required
						className="stripe-form-input"
					/>
				</div>
				<div className="stripe-form-group">
					<label>State *</label>
					<input
						type="text"
						value={state}
						onChange={(e) => setState(e.target.value)}
						placeholder="NY"
						required
						className="stripe-form-input"
					/>
				</div>
			</div>

			<div className="stripe-form-row">
				<div className="stripe-form-group">
					<label>ZIP Code *</label>
					<input
						type="text"
						value={zipCode}
						onChange={(e) => setZipCode(e.target.value)}
						placeholder="10001"
						required
						className="stripe-form-input"
					/>
				</div>
				<div className="stripe-form-group">
					<label>Country *</label>
					<select
						value={country}
						onChange={(e) => setCountry(e.target.value)}
						required
						className="stripe-form-input"
					>
						<option value="US">United States</option>
						<option value="CA">Canada</option>
						<option value="GB">United Kingdom</option>
						<option value="AU">Australia</option>
						<option value="DE">Germany</option>
						<option value="FR">France</option>
					</select>
				</div>
			</div>

			<div className="stripe-form-group">
				<label>Card Details *</label>
				<div className="stripe-card-element">
					<CardElement
						options={{
							style: {
								base: {
									fontSize: '16px',
									color: 'var(--color-text, #ffffff)',
									'::placeholder': {
										color: 'var(--color-text-muted, #9ca3af)',
									},
								},
								invalid: {
									color: 'var(--color-error, #ef4444)',
								},
							},
						}}
					/>
				</div>
			</div>

			<button
				type="submit"
				disabled={!stripe || isProcessing}
				className="stripe-submit-button"
			>
				{isProcessing ? (
					<>
						<svg
							className="animate-spin h-5 w-5 mr-3 inline"
							viewBox="0 0 24 24"
						>
							<circle
								className="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								strokeWidth="4"
								fill="none"
							></circle>
							<path
								className="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Processing...
					</>
				) : (
					`Pay $${amount.toFixed(2)} ${currency}`
				)}
			</button>
		</form>
	);
};

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
	amount = 99.99,
	currency = 'USD',
	onSuccess,
	onError,
}) => (
	<div className="meshalto-stripe-form">
		<Elements stripe={stripePromise}>
			<CheckoutForm
				amount={amount}
				currency={currency}
				onSuccess={onSuccess}
				onError={onError}
			/>
		</Elements>
	</div>
);

export default StripePaymentForm;
