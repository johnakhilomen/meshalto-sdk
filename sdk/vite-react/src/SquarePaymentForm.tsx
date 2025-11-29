import React, { useEffect, useRef, useState } from 'react';
import './SquarePaymentForm.css';

const SQUARE_APP_ID = 'sandbox-sq0idb-Y2-0klxMNN5svvpFgGmwIQ';
const SQUARE_LOCATION_ID = 'L5CR9TRH0WSVC';

const SquarePaymentForm: React.FC = () => {
	const cardRef = useRef<HTMLDivElement>(null);
	const [card, setCard] = useState<any>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const initializedRef = useRef(false);

	// Form state
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [address, setAddress] = useState('');
	const [city, setCity] = useState('');
	const [state, setState] = useState('');
	const [zipCode, setZipCode] = useState('');
	const [country, setCountry] = useState('US');

	useEffect(() => {
		// Prevent duplicate initialization in React Strict Mode
		if (initializedRef.current) return;
		initializedRef.current = true;

		async function initializeSquare() {
			if (!window.Square) {
				setError('Square Web Payments SDK not loaded.');
				return;
			}
			try {
				// Get theme colors from CSS variables
				const computedStyle = getComputedStyle(document.documentElement);
				const primaryColor =
					computedStyle.getPropertyValue('--color-primary').trim() || '#8b5cf6';
				const textColor =
					computedStyle.getPropertyValue('--color-text').trim() || '#ffffff';
				const surfaceColor =
					computedStyle.getPropertyValue('--color-surface').trim() || '#1e293b';
				const textMutedColor =
					computedStyle.getPropertyValue('--color-text-muted').trim() ||
					'#64748b';

				const paymentsInstance = (window as any).Square.payments(
					SQUARE_APP_ID,
					SQUARE_LOCATION_ID
				);

				console.log('Theme colors:', {
					primaryColor,
					textColor,
					surfaceColor,
					textMutedColor,
				});
				const cardInstance = await paymentsInstance.card({
					style: {
						'.input-container': {
							borderColor: surfaceColor,
							borderRadius: '8px',
						},
						'.input-container.is-focus': {
							borderColor: primaryColor,
						},
						'.input-container.is-error': {
							borderColor: '#ef4444',
						},
						input: {
							backgroundColor: surfaceColor || '#1e293b',
							color: textColor || '#ffffff',
							fontSize: '16px',
						},
						'input.is-error': {
							color: '#ef4444',
						},
						'input.is-focus': {
							color: '#000000',
						},
						'.message-text': {
							color: textColor,
						},
						'.message-text.is-error': {
							color: '#ef4444',
						},
						'.message-icon': {
							color: textColor,
						},
					},
				});
				await cardInstance.attach(cardRef.current);
				cardInstance.focus();
				setCard(cardInstance);
			} catch (err: any) {
				setError(err.message);
			}
		}
		initializeSquare();
	}, []);

	const handlePayment = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		// Validate form fields
		if (!name || !email || !address || !city || !state || !zipCode) {
			setError('Please fill in all required fields.');
			setLoading(false);
			return;
		}

		if (!card) {
			setError('Card element not initialized.');
			setLoading(false);
			return;
		}

		try {
			const result = await card.tokenize();
			if (result.status === 'OK') {
				console.log('Payment token:', result.token);
				console.log('Billing details:', {
					name,
					email,
					phone,
					address,
					city,
					state,
					zipCode,
					country,
				});

				// Send payment to backend
				const apiBase = import.meta.env.VITE_MESHALTO_API_URL;
				const squarePath =
					import.meta.env.VITE_MESHALTO_API_URL_SQUARE_PATH ||
					'/process-square';

				const response = await fetch(`${apiBase}${squarePath}`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-API-Key': import.meta.env.VITE_MESHALTO_API_KEY ?? '',
					},
					body: JSON.stringify({
						amount: 4.39, // TODO: Get from props
						currency: 'USD',
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
							token: result.token,
							token_type: 'card',
						},
					}),
				});

				const responseData = await response.json();

				if (response.ok) {
					alert(
						'Payment successful! Transaction ID: ' + responseData.transaction_id
					);
					// TODO: Call onSuccess callback
				} else {
					setError(
						responseData.error ||
							responseData.message ||
							'Payment processing failed'
					);
				}
			} else {
				setError(result.errors?.[0]?.message || 'Tokenization failed');
			}
		} catch (err: any) {
			setError(err.message);
		}
		setLoading(false);
	};

	return (
		<div className="square-payment-wrapper">
			{error && <div className="square-error-message">{error}</div>}
			<form
				onSubmit={handlePayment}
				className="square-payment-form"
			>
				<div className="square-form-group">
					<label>Name *</label>
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="John Doe"
						required
						className="square-form-input"
					/>
				</div>

				<div className="square-form-group">
					<label>Email *</label>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="john@example.com"
						required
						className="square-form-input"
					/>
				</div>

				<div className="square-form-group">
					<label>Phone (Optional)</label>
					<input
						type="tel"
						value={phone}
						onChange={(e) => setPhone(e.target.value)}
						placeholder="+1 (555) 123-4567"
						className="square-form-input"
					/>
				</div>

				<div className="square-form-group">
					<label>Address *</label>
					<input
						type="text"
						value={address}
						onChange={(e) => setAddress(e.target.value)}
						placeholder="123 Main Street"
						required
						className="square-form-input"
					/>
				</div>

				<div className="square-form-row">
					<div className="square-form-group">
						<label>City *</label>
						<input
							type="text"
							value={city}
							onChange={(e) => setCity(e.target.value)}
							placeholder="New York"
							required
							className="square-form-input"
						/>
					</div>
					<div className="square-form-group">
						<label>State *</label>
						<input
							type="text"
							value={state}
							onChange={(e) => setState(e.target.value)}
							placeholder="NY"
							required
							className="square-form-input"
						/>
					</div>
				</div>

				<div className="square-form-row">
					<div className="square-form-group">
						<label>ZIP Code *</label>
						<input
							type="text"
							value={zipCode}
							onChange={(e) => setZipCode(e.target.value)}
							placeholder="10001"
							required
							className="square-form-input"
						/>
					</div>
					<div className="square-form-group">
						<label>Country *</label>
						<select
							value={country}
							onChange={(e) => setCountry(e.target.value)}
							required
							className="square-form-input"
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

				<div className="square-form-group">
					<label>Card Details *</label>
					<div
						ref={cardRef}
						className="square-card-element"
					/>
				</div>

				<button
					type="submit"
					className="square-submit-button"
					disabled={loading || !card}
				>
					{loading ? 'Processing...' : 'Pay with Square'}
				</button>
			</form>
		</div>
	);
};

export default SquarePaymentForm;
