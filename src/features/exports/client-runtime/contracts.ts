export type ClientRuntimePayload = {
  format: "landingforge-client-runtime";
  formatVersion: 1;
  templateVersion: string;
  templateKey: string;
  variantKey: string;
  page: {
    title: string;
    slug: string;
    theme: {
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
      backgroundColor: string;
      surfaceColor: string;
      textPrimaryColor: string;
      textSecondaryColor: string;
      headingFont: string;
      bodyFont: string;
      borderRadius: string;
    };
    sections: Array<{
      sectionKey: string;
      sectionType: string;
      name: string;
      sortOrder: number;
      content: unknown;
      settings: unknown;
    }>;
    forms: Array<{
      name: string;
      key: string;
      type: string;
      successMessage: string;
      errorMessage: string;
      gdprConsentRequired?: boolean;
      gdprConsentLabel?: string;
      gdprConsentVersion?: string;
      fields: Array<{
        label: string;
        name: string;
        type: string;
        placeholder: string | null;
        helpText: string | null;
        defaultValue: string | null;
        options: unknown;
        validation: unknown;
        conditionalLogic: unknown;
        isRequired: boolean;
      }>;
    }>;
    seo: {
      metaTitle: string;
      metaDescription: string;
      keywords: string | null;
      ogTitle: string | null;
      ogDescription: string | null;
      twitterCardType: string | null;
      robotsIndex: boolean;
      robotsFollow: boolean;
    } | null;
  };
};
