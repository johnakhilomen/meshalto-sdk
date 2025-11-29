import React from 'react';
import { Modal } from './Modal';
import './ErrorModal.css';

export interface ErrorModalProps {
	isOpen: boolean;
	onClose: () => void;
	error: {
		message: string;
		code?: string;
		details?: any;
	};
	onRetry?: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
	isOpen,
	onClose,
	error,
	onRetry,
}) => {
	const getErrorTitle = () => {
		if (error.code?.includes('CARD')) return 'Card Error';
		if (error.code?.includes('GATEWAY')) return 'Payment Gateway Error';
		if (error.code?.includes('NETWORK')) return 'Connection Error';
		return 'Payment Failed';
	};

	const getErrorIcon = () => (
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
				d="M12 8v4m0 4h.01"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			showCloseButton={false}
		>
			<div className="error-modal">
				<div className="error-icon">{getErrorIcon()}</div>

				<h2 className="error-title">{getErrorTitle()}</h2>
				<p className="error-message">{error.message}</p>

				{error.code && (
					<div className="error-code">
						<span className="error-code-label">Error Code:</span>
						<code className="error-code-value">{error.code}</code>
					</div>
				)}

				<div className="error-actions">
					{onRetry && (
						<button
							className="error-button error-button-primary"
							onClick={onRetry}
						>
							Try Again
						</button>
					)}
					<button
						className="error-button error-button-secondary"
						onClick={onClose}
					>
						{onRetry ? 'Cancel' : 'Close'}
					</button>
				</div>
			</div>
		</Modal>
	);
};

export default ErrorModal;
