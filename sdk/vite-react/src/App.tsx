import './App.css';
import MeshaltoPayment from './MeshaltoPayment';
import Header from './Header';
import Footer from './Footer';

function App() {
	return (
		<div className="w-full overflow-x-hidden">
			<Header />
			<section
				id="payment"
				className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-slate-900 flex items-center justify-center min-h-[70vh]"
				style={{ scrollMarginTop: '80px' }}
			>
				<div className="w-full max-w-lg mx-auto">
					<MeshaltoPayment
						apiUrl="http://localhost:8002"
						apiKey={import.meta.env.VITE_MESHALTO_API_KEY as string}
						amount={4.39}
						currency="USD"
						gateway="auto"
						themeName="dark-elegance"
						onSuccess={(result) => console.log('Payment successful!', result)}
						onError={(error) => console.error('Payment failed', error)}
					/>
				</div>
			</section>
			<Footer />
		</div>
	);
}

export default App;
