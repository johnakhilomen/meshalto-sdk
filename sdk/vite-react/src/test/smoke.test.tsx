import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MeshaltoPayment from '../MeshaltoPayment';

describe('MeshaltoPayment - Smoke Tests', () => {
	const props = {
		apiUrl: 'http://localhost:8002',
		amount: 100,
		currency: 'USD' as const,
		onSuccess: vi.fn(),
		onError: vi.fn(),
	};

	it('renders without crashing', () => {
		const { container } = render(<MeshaltoPayment {...props} />);
		expect(container).toBeTruthy();
	});

	it('displays payment details header', () => {
		render(<MeshaltoPayment {...props} />);
		const headers = screen.getAllByText(/Payment Details/i);
		expect(headers.length).toBeGreaterThan(0);
	});

	it('displays the amount', () => {
		render(<MeshaltoPayment {...props} />);
		expect(screen.getByText(/100/)).toBeTruthy();
	});

	it('displays secure payment badge', () => {
		render(<MeshaltoPayment {...props} />);
		expect(screen.getByText(/Secure Payment/i)).toBeTruthy();
	});

	it('displays Meshalto branding', () => {
		render(<MeshaltoPayment {...props} />);
		expect(screen.getByText(/Meshalto/i)).toBeTruthy();
	});
});
