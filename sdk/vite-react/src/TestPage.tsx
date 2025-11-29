import './App.css';
import MeshaltoPayment from './MeshaltoPayment';

/**
 * Test page for E2E testing with separate gateway instances
 */
function TestPage() {
	const apiKey = import.meta.env.VITE_MESHALTO_API_KEY as string;
	const apiUrl = 'http://localhost:8002';

	return (
		<div className="w-full min-h-screen bg-slate-900 py-8">
			<div className="container mx-auto px-4">
				<h1 className="text-3xl font-bold text-white mb-8 text-center">
					Payment Gateway Testing
				</h1>

				{/* Stripe Gateway Instance */}
				<section
					id="stripe-test"
					className="mb-12"
				>
					<h2 className="text-2xl font-semibold text-white mb-4">
						Stripe Gateway Test
					</h2>
					<div className="max-w-lg mx-auto">
						<MeshaltoPayment
							apiUrl={apiUrl}
							apiKey={apiKey}
							amount={4.39}
							currency="USD"
							gateway="stripe"
							themeName="dark-elegance"
							onSuccess={(result) =>
								console.log('Stripe payment successful!', result)
							}
							onError={(error) => console.error('Stripe payment failed', error)}
						/>
					</div>
				</section>

				{/* Square Gateway Instance */}
				<section
					id="square-test"
					className="mb-12"
				>
					<h2 className="text-2xl font-semibold text-white mb-4">
						Square Gateway Test
					</h2>
					<div className="max-w-lg mx-auto">
						<MeshaltoPayment
							apiUrl={apiUrl}
							apiKey={apiKey}
							amount={9.99}
							currency="USD"
							gateway="square"
							themeName="dark-elegance"
							onSuccess={(result) =>
								console.log('Square payment successful!', result)
							}
							onError={(error) => console.error('Square payment failed', error)}
						/>
					</div>
				</section>

				{/* Auto Gateway Instance (for testing gateway selector) */}
				<section
					id="auto-test"
					className="mb-12"
				>
					<h2 className="text-2xl font-semibold text-white mb-4">
						Auto Gateway Test (Selector)
					</h2>
					<div className="max-w-lg mx-auto">
						<MeshaltoPayment
							apiUrl={apiUrl}
							apiKey={apiKey}
							amount={19.99}
							currency="USD"
							gateway="auto"
							themeName="dark-elegance"
							onSuccess={(result) =>
								console.log('Auto gateway payment successful!', result)
							}
							onError={(error) =>
								console.error('Auto gateway payment failed', error)
							}
						/>
					</div>
				</section>
			</div>
		</div>
	);
}

export default TestPage;
