import type {
  Form,
  FormField,
  Page,
  PageSection,
  SeoSetting,
  SiteSetting,
  Template,
  TemplateVariant,
  Theme,
} from "@/generated/prisma/client";

export type PublicForm = Form & { fields: FormField[] };

export type PublicPageData = Page & {
  template: Template | null;
  templateVariant: TemplateVariant | null;
  theme: Theme | null;
  sections: PageSection[];
  forms: PublicForm[];
  seoSetting: SeoSetting | null;
};

export type PublicRendererContext = {
  page: PublicPageData;
  site: SiteSetting & {
    logoMedia: { publicUrl: string | null; altText: string | null } | null;
  };
};

export type PublicSectionProps = {
  section: PageSection;
  context: PublicRendererContext;
};
