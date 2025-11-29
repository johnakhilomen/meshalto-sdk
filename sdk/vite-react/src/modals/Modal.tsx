import React, { useEffect } from 'react';
import './Modal.css';

export interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	children: React.ReactNode;
	closeOnOverlayClick?: boolean;
	closeOnEscape?: boolean;
	showCloseButton?: boolean;
	maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
	isOpen,
	onClose,
	children,
	closeOnOverlayClick = true,
	closeOnEscape = true,
	showCloseButton = true,
	maxWidth = '32rem',
}) => {
	useEffect(() => {
		if (!isOpen) return;

		const handleEscape = (e: KeyboardEvent) => {
			if (closeOnEscape && e.key === 'Escape') {
				onClose();
			}
		};

		document.addEventListener('keydown', handleEscape);
		document.body.style.overflow = 'hidden';

		return () => {
			document.removeEventListener('keydown', handleEscape);
			document.body.style.overflow = 'unset';
		};
	}, [isOpen, closeOnEscape, onClose]);

	if (!isOpen) return null;

	return (
		<div
			className="modal-overlay"
			onClick={closeOnOverlayClick ? onClose : undefined}
		>
			<div
				className="modal-container"
				style={{ maxWidth }}
				onClick={(e) => e.stopPropagation()}
			>
				{showCloseButton && (
					<button
						className="modal-close-button"
						onClick={onClose}
						aria-label="Close"
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				)}
				{children}
			</div>
		</div>
	);
};

export default Modal;
