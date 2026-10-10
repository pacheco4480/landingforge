export const sectionTypes = [
  "hero",
  "features",
  "services",
  "process",
  "testimonials",
  "faq",
  "gallery",
  "video",
  "team",
  "stats",
  "pricing",
  "contact",
  "map",
  "cta",
] as const;

export type SectionType = (typeof sectionTypes)[number];

export const sectionTypeOptions = sectionTypes.map((type) => ({
  value: type,
  label: type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" "),
}));

export function createDefaultSectionContent(type: SectionType) {
  switch (type) {
    case "hero":
      return {
        headline: "Your headline",
        subheadline: "Explain the core offer clearly.",
        ctaPrimary: "Get started",
        ctaSecondary: "Learn more",
      };
    case "faq":
      return {
        title: "Frequently asked questions",
        items: [
          {
            question: "What should visitors know?",
            answer: "Add a clear answer.",
          },
        ],
      };
    case "testimonials":
      return {
        title: "What clients say",
        items: [{ name: "Client Name", quote: "Add a short testimonial." }],
      };
    case "services":
      return {
        title: "Services",
        items: [
          { title: "Service name", description: "Describe the service." },
        ],
      };
    case "contact":
      return {
        title: "Contact us",
        email: "hello@example.com",
        phone: "",
        address: "",
      };
    case "cta":
      return {
        headline: "Ready to take the next step?",
        ctaPrimary: "Contact us",
      };
    default:
      return {
        title:
          sectionTypeOptions.find((option) => option.value === type)?.label ??
          type,
        text: "Add content for this section.",
      };
  }
}

export function createDefaultSectionSettings() {
  return {
    layout: "standard",
    spacing: "medium",
  };
}
