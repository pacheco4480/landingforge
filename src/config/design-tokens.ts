export const designTokens = {
  colors: {
    primary: "var(--primary)",
    secondary: "var(--secondary)",
    accent: "var(--accent)",
    success: "var(--success)",
    warning: "var(--warning)",
    error: "var(--error)",
    info: "var(--info)",
    neutral: "var(--neutral)",
  },
  typography: {
    display: "text-5xl font-bold leading-tight sm:text-6xl",
    h1: "text-4xl font-bold leading-tight",
    h2: "text-3xl font-semibold leading-tight",
    h3: "text-2xl font-semibold leading-snug",
    h4: "text-xl font-semibold leading-snug",
    bodyLarge: "text-lg leading-8",
    body: "text-base leading-7",
    bodySmall: "text-sm leading-6",
    caption: "text-xs leading-5",
  },
  spacing: [4, 8, 12, 16, 24, 32, 48, 64, 96, 128],
  radius: {
    small: "var(--radius-sm)",
    medium: "var(--radius-md)",
    large: "var(--radius-lg)",
    extraLarge: "var(--radius-xl)",
  },
  shadows: {
    small: "var(--shadow-sm)",
    medium: "var(--shadow-md)",
    large: "var(--shadow-lg)",
    extraLarge: "var(--shadow-xl)",
  },
} as const;

export type DesignTokens = typeof designTokens;

export type ThemeTokenSource = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textPrimaryColor: string;
  textSecondaryColor: string;
  borderRadius: string;
  shadowStyle: string;
};

export function themeToCssVariables(theme: ThemeTokenSource) {
  return {
    "--theme-primary": theme.primaryColor,
    "--theme-secondary": theme.secondaryColor,
    "--theme-accent": theme.accentColor,
    "--theme-background": theme.backgroundColor,
    "--theme-surface": theme.surfaceColor,
    "--theme-text-primary": theme.textPrimaryColor,
    "--theme-text-secondary": theme.textSecondaryColor,
    "--theme-radius": theme.borderRadius,
    "--theme-shadow": theme.shadowStyle,
  } as const;
}
