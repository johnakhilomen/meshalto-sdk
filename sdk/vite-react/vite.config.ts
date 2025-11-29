import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	// Library mode for publishing to npm
	if (mode === 'library') {
		return {
			plugins: [
				react(),
				dts({
					insertTypesEntry: true,
					include: ['src/**/*.{ts,tsx}'],
					exclude: [
						'src/**/*.test.{ts,tsx}',
						'src/**/*.spec.{ts,tsx}',
						'src/test/**/*',
					],
					skipDiagnostics: true,
					copyDtsFiles: true,
				}),
			],
			build: {
				lib: {
					entry: resolve(__dirname, 'src/index.ts'),
					name: 'MeshaltoReact',
					formats: ['es', 'cjs'],
					fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`,
				},
				rollupOptions: {
					external: [
						'react',
						'react-dom',
						'react/jsx-runtime',
						'@stripe/stripe-js',
						'@stripe/react-stripe-js',
						'@paypal/react-paypal-js',
						'axios',
					],
					output: {
						globals: {
							react: 'React',
							'react-dom': 'ReactDOM',
							'react/jsx-runtime': 'react/jsx-runtime',
						},
					},
				},
				sourcemap: true,
				emptyOutDir: true,
			},
		};
	}

	// Development mode (default)
	return {
		plugins: [react()],
	};
});
