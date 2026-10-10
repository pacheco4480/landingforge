import type { PublicRendererContext } from "@/features/public-renderer/types";

export function ThemeStyle({ context }: { context: PublicRendererContext }) {
  const theme = context.page.theme;
  const site = context.site;
  const css = `
    :root {
      --public-primary: ${theme?.primaryColor ?? site.primaryColor};
      --public-secondary: ${theme?.secondaryColor ?? site.secondaryColor};
      --public-accent: ${theme?.accentColor ?? site.accentColor};
      --public-background: ${theme?.backgroundColor ?? "#ffffff"};
      --public-surface: ${theme?.surfaceColor ?? "#f8fafc"};
      --public-text: ${theme?.textPrimaryColor ?? "#172026"};
      --public-muted: ${theme?.textSecondaryColor ?? "#5f6b7a"};
      --public-radius: ${theme?.borderRadius ?? "8px"};
      --public-heading-font: ${theme?.headingFont ?? "Inter, Arial, sans-serif"};
      --public-body-font: ${theme?.bodyFont ?? "Inter, Arial, sans-serif"};
    }
  `;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
