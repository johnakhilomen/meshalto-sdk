import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

const PAYPAL_CLIENT_ID = 'YOUR_PAYPAL_CLIENT_ID'; // TODO: Replace with your PayPal client ID

const PayPalPaymentForm: React.FC = () => {
	return (
		<div className="meshalto-paypal-form">
			<h3>PayPal Payment Form</h3>
			<PayPalScriptProvider options={{ 'client-id': PAYPAL_CLIENT_ID }}>
				<PayPalButtons
					style={{ layout: 'vertical' }}
					createOrder={(data, actions) => {
						return actions.order.create({
							purchase_units: [
								{
									amount: {
										value: '10.00', // TODO: Replace with dynamic amount
									},
								},
							],
						});
					}}
					onApprove={(data, actions) => {
						return actions.order.capture().then((details) => {
							alert(
								'Transaction completed by ' + details.payer.name.given_name
							);
							// TODO: Send details.id to backend for payment confirmation
						});
					}}
				/>
			</PayPalScriptProvider>
		</div>
	);
};

export default PayPalPaymentForm;
