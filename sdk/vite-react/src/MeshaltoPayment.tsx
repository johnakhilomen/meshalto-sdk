import React, { useState, useEffect, useRef } from 'react';
import StripePaymentForm from './StripePaymentForm';
import SquarePaymentForm from './SquarePaymentForm';
import PayPalPaymentForm from './PayPalPaymentForm';
import { SuccessModal, ErrorModal, LoadingModal } from './modals';
import type { PaymentResponse } from './modals';
import { getTheme, applyTheme } from './themes';
import type { Theme } from './themes';
import axios from 'axios';
import './MeshaltoPayment.css';

export interface MeshaltoPaymentProps {
	apiUrl: string;
	apiKey: string;
	amount: number;
	currency?: string;
	gateway?: 'stripe' | 'square' | 'paypal' | 'auto';
	onSuccess?: (result: PaymentResponse) => void;
	onError?: (error: Error) => void;
	onCancel?: () => void;
	themeName?: 'light-modern' | 'dark-elegance' | 'ocean-breeze';
	customTheme?: Theme;
	formSize?: 'small' | 'large';
}

export const MeshaltoPayment: React.FC<MeshaltoPaymentProps> = ({
	apiUrl,
	apiKey,
	amount,
	currency = 'USD',
	gateway = 'auto',
	onSuccess,
	onError,
	onCancel,
	themeName = 'light-modern',
	customTheme,
	formSize = 'small',
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [loading, setLoading] = useState(false);
	const [selectedGateway, setSelectedGateway] = useState(gateway);
	const [cardNumber, setCardNumber] = useState('');
	const [expiryDate, setExpiryDate] = useState('');
	const [cvv, setCvv] = useState('');
	const [cardholderName, setCardholderName] = useState('');
	const [error, setError] = useState<string | null>(null);

	// Modal states
	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const [showErrorModal, setShowErrorModal] = useState(false);
	const [showLoadingModal, setShowLoadingModal] = useState(false);
	const [paymentData, setPaymentData] = useState<PaymentResponse | null>(null);
	const [errorData, setErrorData] = useState<{
		message: string;
		code?: string;
	} | null>(null);

	// Apply theme
	useEffect(() => {
		if (containerRef.current) {
			const theme = customTheme || getTheme(themeName);
			applyTheme(theme, containerRef.current);
		}
	}, [themeName, customTheme]);

	// Sync selectedGateway with gateway prop changes
	useEffect(() => {
		setSelectedGateway(gateway);
	}, [gateway]);

	const formatCardNumber = (value: string) => {
		const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
		const matches = v.match(/\d{4,16}/g);
		const match = (matches && matches[0]) || '';
		const parts = [];

		for (let i = 0, len = match.length; i < len; i += 4) {
			parts.push(match.substring(i, i + 4));
		}

		return parts.length ? parts.join(' ') : value;
	};

	const formatExpiryDate = (value: string) => {
		const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
		if (v.length >= 2) {
			return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
		}
		return v;
	};

	const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const formatted = formatCardNumber(e.target.value);
		if (formatted.length <= 19) {
			setCardNumber(formatted);
		}
	};

	const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const formatted = formatExpiryDate(e.target.value);
		if (formatted.length <= 5) {
			setExpiryDate(formatted);
		}
	};

	const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.replace(/[^0-9]/gi, '');
		if (value.length <= 4) {
			setCvv(value);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setShowLoadingModal(true);
		setError(null);

		try {
			// Validate inputs
			if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
				throw new Error('Please fill in all fields');
			}

			// Format API endpoint based on gateway
			const gatewayEndpoint =
				selectedGateway === 'auto' ? 'stripe' : selectedGateway;

			const response = await axios.post(
				`${apiUrl}/process/${gatewayEndpoint}`,
				{
					amount,
					currency,
					payment_method: 'card',
					description: `Payment of ${currency} ${amount}`,
					customer: {
						email: 'customer@example.com',
						name: cardholderName,
					},
					payment_token: {
						token: cardNumber.replace(/\s/g, '').substring(0, 16),
						brand: 'visa',
					},
				},
				{
					headers: {
						'Content-Type': 'application/json',
						'x-api-key': apiKey,
					},
				}
			);

			setShowLoadingModal(false);

			// Check if payment was successful
			if (response.data && response.data.status === 'completed') {
				setPaymentData(response.data);
				setShowSuccessModal(true);
				onSuccess?.(response.data);
			} else {
				throw new Error(response.data?.error_message || 'Payment failed');
			}
		} catch (err: any) {
			setShowLoadingModal(false);
			const errorMessage =
				err.response?.data?.detail ||
				err.response?.data?.message ||
				err.message ||
				'Payment failed';
			const errorCode = err.response?.data?.error_code;

			setError(errorMessage);
			setErrorData({ message: errorMessage, code: errorCode });
			setShowErrorModal(true);
			onError?.(new Error(errorMessage));
		} finally {
			setLoading(false);
		}
	};

	const handleRetry = () => {
		setShowErrorModal(false);
		setError(null);
		setErrorData(null);
	};

	const handleSuccessClose = () => {
		setShowSuccessModal(false);
		setPaymentData(null);
	};

	return (
		<>
			<div
				ref={containerRef}
				className="meshalto-payment"
			>
				<div
					className={`meshalto-payment-container meshalto-payment-container--${formSize}`}
				>
					<div className="meshalto-payment-header">
						<h3>Payment Details</h3>
						<div className="amount">
							{currency} {amount.toFixed(2)}
						</div>
					</div>

					{error && <div className="meshalto-payment-error">{error}</div>}

					{gateway === 'auto' && (
						<div className="meshalto-form-group">
							<label>Payment Gateway</label>
							<select
								value={selectedGateway}
								onChange={(e) => setSelectedGateway(e.target.value as any)}
								className="meshalto-form-select"
							>
								<option value="auto">Auto Select (Best Rate)</option>
								<option value="stripe">Stripe</option>
								<option value="square">Square</option>
								<option value="paypal">PayPal</option>
							</select>
						</div>
					)}

					{/* Render gateway-specific forms */}
					{selectedGateway === 'stripe' && (
						<StripePaymentForm
							key="stripe-form"
							amount={amount}
							currency={currency}
							onSuccess={(result) => {
								setPaymentData(result);
								setShowSuccessModal(true);
								onSuccess?.(result);
							}}
							onError={(error) => {
								setErrorData({
									message: error.message,
									code: 'PAYMENT_FAILED',
								});
								setShowErrorModal(true);
								onError?.(error);
							}}
						/>
					)}
					{selectedGateway === 'square' && (
						<SquarePaymentForm key="square-form" />
					)}
					{selectedGateway === 'paypal' && (
						<PayPalPaymentForm key="paypal-form" />
					)}
					{(selectedGateway === 'auto' ||
						!['stripe', 'square', 'paypal'].includes(selectedGateway)) && (
						<form
							onSubmit={handleSubmit}
							className="meshalto-payment-form"
						>
							<div className="meshalto-form-group">
								<label>Cardholder Name</label>
								<input
									type="text"
									value={cardholderName}
									onChange={(e) => setCardholderName(e.target.value)}
									placeholder="John Doe"
									className="meshalto-form-input"
									disabled={loading}
								/>
							</div>
							<div className="meshalto-form-group">
								<label>Card Number</label>
								<input
									type="text"
									value={cardNumber}
									onChange={handleCardNumberChange}
									placeholder="1234 5678 9012 3456"
									className="meshalto-form-input"
									disabled={loading}
								/>
							</div>
							<div className="meshalto-form-row">
								<div className="meshalto-form-group">
									<label>Expiry Date</label>
									<input
										type="text"
										value={expiryDate}
										onChange={handleExpiryDateChange}
										placeholder="MM/YY"
										className="meshalto-form-input"
										disabled={loading}
									/>
								</div>
								<div className="meshalto-form-group">
									<label>CVV</label>
									<input
										type="text"
										value={cvv}
										onChange={handleCvvChange}
										placeholder="123"
										className="meshalto-form-input"
										disabled={loading}
									/>
								</div>
							</div>
							<div className="meshalto-form-actions">
								<button
									type="submit"
									className="meshalto-btn meshalto-btn-primary"
									disabled={loading}
								>
									{loading ? (
										<>
											<span className="meshalto-spinner"></span>
											Processing...
										</>
									) : (
										`Pay`
									)}
								</button>
								{onCancel && (
									<button
										type="button"
										className="meshalto-btn meshalto-btn-secondary"
										onClick={onCancel}
										disabled={loading}
									>
										Cancel
									</button>
								)}
							</div>
						</form>
					)}
					<div className="meshalto-payment-footer">
						<div className="meshalto-secure-badge">
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
								/>
							</svg>
							Secure Payment
						</div>
						<div className="meshalto-powered-by">
							Payment Powered by <strong>Meshalto</strong>
						</div>
					</div>
				</div>
			</div>

			{/* Modals */}
			<LoadingModal
				isOpen={showLoadingModal}
				message="Processing your payment..."
			/>

			{paymentData && (
				<SuccessModal
					isOpen={showSuccessModal}
					onClose={handleSuccessClose}
					paymentData={paymentData}
				/>
			)}

			{errorData && (
				<ErrorModal
					isOpen={showErrorModal}
					onClose={() => setShowErrorModal(false)}
					error={errorData}
					onRetry={handleRetry}
				/>
			)}
		</>
	);
};

export default MeshaltoPayment;
