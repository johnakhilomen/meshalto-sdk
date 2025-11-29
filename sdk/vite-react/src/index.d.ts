import { FC, ReactNode } from 'react';

export interface MeshaltoPaymentProps {
	amount: number;
	currency?: string;
	customerId?: string;
	onSuccess?: (response: any) => void;
	onError?: (error: any) => void;
	theme?: 'light' | 'dark' | 'professional' | 'minimal';
	enabledGateways?: string[];
	preferredGateway?: string;
}

export const MeshaltoPayment: FC<MeshaltoPaymentProps>;

export interface StripePaymentFormProps {
	amount: number;
	currency?: string;
	onSuccess?: (response: any) => void;
	onError?: (error: any) => void;
}

export const StripePaymentForm: FC<StripePaymentFormProps>;

export interface SquarePaymentFormProps {
	amount: number;
	currency?: string;
	onSuccess?: (response: any) => void;
	onError?: (error: any) => void;
}

export const SquarePaymentForm: FC<SquarePaymentFormProps>;

export interface PayPalPaymentFormProps {
	amount: number;
	currency?: string;
	onSuccess?: (response: any) => void;
	onError?: (error: any) => void;
}

export const PayPalPaymentForm: FC<PayPalPaymentFormProps>;

export interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	children: ReactNode;
}

export const Modal: FC<ModalProps>;

export interface SuccessModalProps {
	isOpen: boolean;
	onClose: () => void;
	message?: string;
}

export const SuccessModal: FC<SuccessModalProps>;

export interface ErrorModalProps {
	isOpen: boolean;
	onClose: () => void;
	error?: string;
}

export const ErrorModal: FC<ErrorModalProps>;

export interface LoadingModalProps {
	isOpen: boolean;
	message?: string;
}

export const LoadingModal: FC<LoadingModalProps>;

export interface Theme {
	primary: string;
	secondary: string;
	background: string;
	text: string;
	border: string;
	error: string;
	success: string;
}

export const themes: {
	light: Theme;
	dark: Theme;
	professional: Theme;
	minimal: Theme;
};
