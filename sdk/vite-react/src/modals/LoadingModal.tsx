import React from 'react';
import { Modal } from './Modal';
import './LoadingModal.css';

export interface LoadingModalProps {
	isOpen: boolean;
	message?: string;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({
	isOpen,
	message = 'Processing payment...',
}) => {
	return (
		<Modal
			isOpen={isOpen}
			onClose={() => {}}
			showCloseButton={false}
			closeOnOverlayClick={false}
			closeOnEscape={false}
		>
			<div className="loading-modal">
				<div className="loading-spinner">
					<div className="spinner-ring"></div>
					<div className="spinner-ring"></div>
					<div className="spinner-ring"></div>
				</div>
				<p className="loading-message">{message}</p>
				<p className="loading-submessage">
					Please do not close or refresh this page
				</p>
			</div>
		</Modal>
	);
};

export default LoadingModal;
