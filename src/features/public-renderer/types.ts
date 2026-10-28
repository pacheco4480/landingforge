export type PublicFormField = {
  id: string;
  label: string;
  name: string;
  type: string;
  placeholder: string | null;
  helpText: string | null;
  defaultValue: string | null;
  options: unknown;
  conditionalLogic: unknown;
  isRequired: boolean;
  isVisible: boolean;
};

export type PublicForm = {
  id: string;
  gdprConsentLabel: string;
  gdprConsentRequired: boolean;
  gdprConsentVersion: string;
  fields: PublicFormField[];
};

export type PublicPageSection = {
  id: string;
  sectionKey: string;
  sectionType: string;
  name: string;
  sortOrder: number;
  isVisible: boolean;
  content: unknown;
  settings: unknown;
};

export type PublicTheme = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string | null;
  surfaceColor: string | null;
  textPrimaryColor: string | null;
  textSecondaryColor: string | null;
  headingFont: string | null;
  bodyFont: string | null;
  borderRadius: string | null;
};

export type PublicPageData = {
  id: string;
  title: string;
  slug: string;
  isDemo?: boolean;
  template: { key: string } | null;
  templateVariant: { key: string } | null;
  theme: PublicTheme | null;
  sections: PublicPageSection[];
  forms: PublicForm[];
};

export type PublicSiteData = {
  businessName: string;
  businessType: string | null;
  contactEmail: string;
  contactPhone: string | null;
  city: string | null;
  country: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoMedia: { publicUrl: string | null; altText: string | null } | null;
};

export type PublicRendererContext = {
  page: PublicPageData;
  site: PublicSiteData;
  previewMode?: boolean;
  integrations?: {
    submitFormAction?: (formData: FormData) => Promise<{
      ok: boolean;
      fieldErrors: Record<string, string>;
      formError: string | null;
    }>;
    turnstileEnabled?: boolean;
    turnstileSiteKey?: string | null;
  };
};

export type PublicSectionProps = {
  section: PublicPageSection;
  context: PublicRendererContext;
};
