import React from 'react';
import { Modal } from './Modal';
import './SuccessModal.css';

export interface PaymentResponse {
	transaction_id: string;
	gateway: string;
	status: string;
	amount: string | number;
	currency: string;
	gateway_transaction_id?: string;
	fee?: string | number;
	savings?: string | number;
	created_at?: string;
	metadata?: Record<string, any>;
}

export interface SuccessModalProps {
	isOpen: boolean;
	onClose: () => void;
	paymentData: PaymentResponse;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
	isOpen,
	onClose,
	paymentData,
}) => {
	const formatAmount = (amount: string | number): string => {
		const num = typeof amount === 'string' ? parseFloat(amount) : amount;
		return num.toFixed(2);
	};

	const formatDate = (dateString?: string): string => {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			showCloseButton={false}
		>
			<div className="success-modal">
				<div className="success-icon">
					<svg
						width="64"
						height="64"
						viewBox="0 0 24 24"
						fill="none"
					>
						<circle
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="2"
						/>
						<path
							d="M8 12.5l2.5 2.5L16 9"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</div>

				<h2 className="success-title">Payment Successful!</h2>
				<p className="success-message">
					Your payment has been processed successfully.
				</p>

				<div className="success-details">
					<div className="success-detail-item">
						<span className="detail-label">Amount</span>
						<span className="detail-value amount">
							{paymentData.currency} {formatAmount(paymentData.amount)}
						</span>
					</div>

					{paymentData.fee && (
						<div className="success-detail-item">
							<span className="detail-label">Processing Fee</span>
							<span className="detail-value">
								{paymentData.currency} {formatAmount(paymentData.fee)}
							</span>
						</div>
					)}

					{paymentData.savings &&
						parseFloat(paymentData.savings.toString()) > 0 && (
							<div className="success-detail-item savings">
								<span className="detail-label">You Saved</span>
								<span className="detail-value">
									{paymentData.currency} {formatAmount(paymentData.savings)}
								</span>
							</div>
						)}

					<div className="success-detail-item">
						<span className="detail-label">Transaction ID</span>
						<span className="detail-value transaction-id">
							{paymentData.transaction_id.substring(0, 8)}...
						</span>
					</div>

					{paymentData.gateway_transaction_id && (
						<div className="success-detail-item">
							<span className="detail-label">Gateway Reference</span>
							<span className="detail-value transaction-id">
								{paymentData.gateway_transaction_id}
							</span>
						</div>
					)}

					<div className="success-detail-item">
						<span className="detail-label">Payment Gateway</span>
						<span className="detail-value gateway">
							{paymentData.gateway.charAt(0).toUpperCase() +
								paymentData.gateway.slice(1)}
						</span>
					</div>

					{paymentData.created_at && (
						<div className="success-detail-item">
							<span className="detail-label">Date & Time</span>
							<span className="detail-value">
								{formatDate(paymentData.created_at)}
							</span>
						</div>
					)}
				</div>

				<button
					className="success-button"
					onClick={onClose}
				>
					Done
				</button>
			</div>
		</Modal>
	);
};

export default SuccessModal;
