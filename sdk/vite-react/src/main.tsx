import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import TestPage from './TestPage.tsx';

// Check if we're on the test page route
const isTestPage = window.location.pathname === '/test';

createRoot(document.getElementById('root')!).render(
	<StrictMode>{isTestPage ? <TestPage /> : <App />}</StrictMode>
);
