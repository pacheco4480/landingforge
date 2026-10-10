import type { PublicRendererContext } from "@/features/public-renderer/types";
import { PublicLayout } from "@/features/public-renderer/components/public-layout";
import { PublicSectionRenderer } from "@/features/public-renderer/components/public-section-renderer";
import { ThemeStyle } from "@/features/public-renderer/components/theme-style";

export function PublicPageRenderer({
  context,
}: {
  context: PublicRendererContext;
}) {
  return (
    <>
      <ThemeStyle context={context} />
      <style>
        {`
          .public-card {
            border: 1px solid rgba(15, 23, 42, 0.12);
            border-radius: var(--public-radius);
            background: var(--public-surface);
            padding: 1.25rem;
          }
          .public-button-primary,
          .public-button-outline {
            min-height: 2.75rem;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: var(--public-radius);
            padding: 0.65rem 1rem;
            font-size: 0.875rem;
            font-weight: 700;
            text-decoration: none;
          }
          .public-button-primary {
            color: #fff;
            background: var(--public-primary);
          }
          .public-button-outline {
            color: var(--public-primary);
            border: 1px solid color-mix(in srgb, var(--public-primary), transparent 55%);
            background: transparent;
          }
          h1, h2, h3 {
            font-family: var(--public-heading-font);
          }
        `}
      </style>
      <PublicLayout context={context}>
        <PublicSectionRenderer context={context} />
      </PublicLayout>
    </>
  );
}
