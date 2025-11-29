import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		environment: 'happy-dom',
		setupFiles: './src/test/setup.ts',
		include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
		exclude: ['node_modules', 'e2e', 'dist', 'build'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov'],
			exclude: [
				'node_modules/',
				'src/test/',
				'**/*.spec.ts',
				'**/*.test.tsx',
				'e2e/',
			],
		},
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
		},
	},
});
