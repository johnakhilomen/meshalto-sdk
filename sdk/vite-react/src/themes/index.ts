import lightTheme from './default.json';
import darkTheme from './dark.json';
import oceanTheme from './ocean.json';

export interface Theme {
	name: string;
	id: string;
	colors: {
		primary: string;
		primaryHover: string;
		primaryLight: string;
		secondary: string;
		success: string;
		error: string;
		warning: string;
		background: string;
		surface: string;
		surfaceHover: string;
		border: string;
		borderFocus: string;
		text: string;
		textSecondary: string;
		textMuted: string;
		shadow: string;
		shadowMedium: string;
		shadowLarge: string;
		overlay: string;
	};
	spacing: {
		xs: string;
		sm: string;
		md: string;
		lg: string;
		xl: string;
		'2xl': string;
	};
	borderRadius: {
		sm: string;
		md: string;
		lg: string;
		xl: string;
		full: string;
	};
	typography: {
		fontFamily: string;
		fontSizeBase: string;
		fontSizeSmall: string;
		fontSizeLarge: string;
		fontSizeH1: string;
		fontSizeH2: string;
		fontSizeH3: string;
		fontWeightNormal: string;
		fontWeightMedium: string;
		fontWeightSemibold: string;
		fontWeightBold: string;
		lineHeight: string;
		lineHeightTight: string;
	};
	effects: {
		transition: string;
		transitionSlow: string;
		shadowButton: string;
		shadowCard: string;
		shadowModal: string;
	};
	components: {
		input: {
			height: string;
			paddingX: string;
			fontSize: string;
			borderWidth: string;
			focusRing: string;
		};
		button: {
			height: string;
			paddingX: string;
			fontSize: string;
			fontWeight: string;
			borderRadius: string;
		};
		modal: {
			maxWidth: string;
			padding: string;
			borderRadius: string;
		};
		card: {
			padding: string;
			borderRadius: string;
		};
	};
}

export const themes: Record<string, Theme> = {
	'light-modern': lightTheme as Theme,
	'dark-elegance': darkTheme as Theme,
	'ocean-breeze': oceanTheme as Theme,
};

export const getTheme = (themeId: string): Theme => {
	return themes[themeId] || themes['light-modern'];
};

export const applyTheme = (theme: Theme, element: HTMLElement) => {
	const cssVars: Record<string, string> = {
		// Colors
		'--color-primary': theme.colors.primary,
		'--color-primary-hover': theme.colors.primaryHover,
		'--color-primary-light': theme.colors.primaryLight,
		'--color-secondary': theme.colors.secondary,
		'--color-success': theme.colors.success,
		'--color-error': theme.colors.error,
		'--color-warning': theme.colors.warning,
		'--color-background': theme.colors.background,
		'--color-surface': theme.colors.surface,
		'--color-surface-hover': theme.colors.surfaceHover,
		'--color-border': theme.colors.border,
		'--color-border-focus': theme.colors.borderFocus,
		'--color-text': theme.colors.text,
		'--color-text-secondary': theme.colors.textSecondary,
		'--color-text-muted': theme.colors.textMuted,
		'--color-shadow': theme.colors.shadow,
		'--color-shadow-medium': theme.colors.shadowMedium,
		'--color-shadow-large': theme.colors.shadowLarge,
		'--color-overlay': theme.colors.overlay,

		// Spacing
		'--spacing-xs': theme.spacing.xs,
		'--spacing-sm': theme.spacing.sm,
		'--spacing-md': theme.spacing.md,
		'--spacing-lg': theme.spacing.lg,
		'--spacing-xl': theme.spacing.xl,
		'--spacing-2xl': theme.spacing['2xl'],

		// Border Radius
		'--radius-sm': theme.borderRadius.sm,
		'--radius-md': theme.borderRadius.md,
		'--radius-lg': theme.borderRadius.lg,
		'--radius-xl': theme.borderRadius.xl,
		'--radius-full': theme.borderRadius.full,

		// Typography
		'--font-family': theme.typography.fontFamily,
		'--font-size-base': theme.typography.fontSizeBase,
		'--font-size-small': theme.typography.fontSizeSmall,
		'--font-size-large': theme.typography.fontSizeLarge,
		'--font-size-h1': theme.typography.fontSizeH1,
		'--font-size-h2': theme.typography.fontSizeH2,
		'--font-size-h3': theme.typography.fontSizeH3,
		'--font-weight-normal': theme.typography.fontWeightNormal,
		'--font-weight-medium': theme.typography.fontWeightMedium,
		'--font-weight-semibold': theme.typography.fontWeightSemibold,
		'--font-weight-bold': theme.typography.fontWeightBold,
		'--line-height': theme.typography.lineHeight,
		'--line-height-tight': theme.typography.lineHeightTight,

		// Effects
		'--transition': theme.effects.transition,
		'--transition-slow': theme.effects.transitionSlow,
		'--shadow-button': theme.effects.shadowButton,
		'--shadow-card': theme.effects.shadowCard,
		'--shadow-modal': theme.effects.shadowModal,
	};

	Object.entries(cssVars).forEach(([key, value]) => {
		element.style.setProperty(key, value);
	});
};

export default themes;
