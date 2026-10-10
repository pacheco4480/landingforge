import {
  DemoStatus,
  FormFieldType,
  FormStatus,
  FormType,
  LegalDocumentType,
  PageStatus,
  PageType,
} from "../../src/generated/prisma/client";
import type { PrismaClient } from "../../src/generated/prisma/client";

const templates = [
  ["universal", "Universal Base"],
  ["real_estate", "Real Estate"],
  ["clinic", "Clinic"],
  ["restaurant", "Restaurant"],
  ["bakery", "Bakery"],
  ["gym", "Gym"],
  ["construction", "Construction"],
  ["beauty", "Beauty"],
] as const;

const templateVariants = {
  universal: [
    ["standard", "Standard"],
    ["modern", "Modern"],
    ["premium", "Premium"],
  ],
  real_estate: [
    ["local_agency", "Local Agency"],
    ["premium", "Premium"],
    ["luxury", "Luxury"],
  ],
  clinic: [
    ["corporate", "Corporate"],
    ["modern", "Modern"],
    ["luxury", "Luxury"],
  ],
  restaurant: [
    ["casual", "Casual"],
    ["premium", "Premium"],
    ["fine_dining", "Fine Dining"],
    ["playful", "Playful"],
  ],
  bakery: [
    ["warm", "Warm"],
    ["modern", "Modern"],
    ["premium", "Premium"],
  ],
  gym: [
    ["performance", "Performance"],
    ["modern", "Modern"],
    ["premium", "Premium"],
  ],
  construction: [
    ["reliable", "Reliable"],
    ["modern", "Modern"],
    ["premium", "Premium"],
  ],
  beauty: [
    ["elegant", "Elegant"],
    ["modern", "Modern"],
    ["premium", "Premium"],
  ],
} as const;

const demoSections = [
  ["hero", "Hero"],
  ["services", "Services"],
  ["faq", "FAQ"],
  ["testimonials", "Testimonials"],
  ["contact", "Contact"],
  ["cta", "CTA"],
] as const;

const defaultMediaFolders = [
  "Logos",
  "Hero Images",
  "Gallery",
  "Documents",
  "Videos",
] as const;

const themeSeeds = [
  ["universal-base", "Universal Base", "#123c69", "#256d85", "#f59e0b"],
  [
    "real-estate-local-agency",
    "Real Estate Local Agency",
    "#123c69",
    "#256d85",
    "#f59e0b",
  ],
  ["real-estate-premium", "Real Estate Premium", "#172026", "#5f6f7a", "#b7791f"],
  ["real-estate-luxury", "Real Estate Luxury", "#020617", "#334155", "#d4af37"],
  ["bakery-warm", "Bakery Warm", "#92400e", "#b45309", "#f59e0b"],
  ["bakery-modern", "Bakery Modern", "#14532d", "#0f766e", "#f59e0b"],
  ["bakery-premium", "Bakery Premium", "#111827", "#6b7280", "#d97706"],
  ["clinic-corporate", "Clinic Corporate", "#1d4ed8", "#0f766e", "#38bdf8"],
  ["clinic-modern", "Clinic Modern", "#0f766e", "#2563eb", "#14b8a6"],
  ["clinic-luxury", "Clinic Luxury", "#111827", "#475569", "#c084fc"],
  ["restaurant-casual", "Restaurant Casual", "#991b1b", "#b45309", "#facc15"],
  ["restaurant-premium", "Restaurant Premium", "#111827", "#374151", "#d97706"],
  [
    "restaurant-fine-dining",
    "Restaurant Fine Dining",
    "#020617",
    "#334155",
    "#eab308",
  ],
  ["restaurant-playful", "Restaurant Playful", "#ff6b35", "#7c2d12", "#ffd166"],
] as const;

const genericDemoSectionKeys = ["services", "faq", "testimonials", "contact", "cta"] as const;

async function hideGenericDemoSections(
  prisma: PrismaClient,
  pageId: string,
  activeSectionKeys: string[],
) {
  const hiddenSectionKeys = genericDemoSectionKeys.filter(
    (sectionKey) => !activeSectionKeys.includes(sectionKey),
  );

  if (!hiddenSectionKeys.length) {
    return;
  }

  await prisma.pageSection.updateMany({
    where: {
      pageId,
      sectionKey: { in: hiddenSectionKeys },
    },
    data: { isVisible: false },
  });
}

export async function seedContent(prisma: PrismaClient) {
  const templateRecords = new Map<string, { id: string; name: string }>();

  await prisma.industry.upsert({
    where: { key: "universal" },
    update: { name: "Universal", isActive: true },
    create: { key: "universal", name: "Universal" },
  });

  for (const [key, name] of templates) {
    const industry = await prisma.industry.findUniqueOrThrow({
      where: { key },
      select: { id: true },
    });

    const template = await prisma.template.upsert({
      where: { key },
      update: { name, industryId: industry.id, isActive: true },
      create: { key, name, industryId: industry.id },
      select: { id: true, name: true },
    });

    templateRecords.set(key, template);

    for (const [variantKey, variantName] of templateVariants[key]) {
      await prisma.templateVariant.upsert({
        where: {
          templateId_key: {
            templateId: template.id,
            key: variantKey,
          },
        },
        update: { name: variantName, isActive: true },
        create: {
          templateId: template.id,
          key: variantKey,
          name: variantName,
        },
      });
    }
  }

  await prisma.theme.upsert({
    where: { key: "landingforge-default" },
    update: {},
    create: {
      key: "landingforge-default",
      name: "LandingForge Default",
      primaryColor: "#171717",
      secondaryColor: "#525252",
      accentColor: "#2563eb",
      backgroundColor: "#ffffff",
      surfaceColor: "#f5f5f5",
      textPrimaryColor: "#171717",
      textSecondaryColor: "#525252",
      headingFont: "Arial",
      bodyFont: "Arial",
      borderRadius: "medium",
      shadowStyle: "small",
      settings: {},
    },
  });

  for (const [
    key,
    name,
    primaryColor,
    secondaryColor,
    accentColor,
  ] of themeSeeds) {
    await prisma.theme.upsert({
      where: { key },
      update: { name, primaryColor, secondaryColor, accentColor },
      create: {
        key,
        name,
        primaryColor,
        secondaryColor,
        accentColor,
        backgroundColor: "#ffffff",
        surfaceColor: "#f8fafc",
        textPrimaryColor: "#111827",
        textSecondaryColor: "#475569",
        headingFont: "Arial",
        bodyFont: "Arial",
        borderRadius: "medium",
        shadowStyle: "small",
        settings: {
          spacing: "medium",
          animations: "subtle",
        },
      },
    });
  }

  for (const name of defaultMediaFolders) {
    const existingFolder = await prisma.mediaFolder.findFirst({
      where: { parentId: null, name },
      select: { id: true },
    });

    if (!existingFolder) {
      await prisma.mediaFolder.create({ data: { name } });
    }
  }

  const existingSiteSetting = await prisma.siteSetting.findFirst({
    select: { id: true },
  });

  if (!existingSiteSetting) {
    await prisma.siteSetting.create({
      data: {
        siteName: "LandingForge",
        businessName: "LandingForge",
        businessType: "landing_page_platform",
        contactEmail: "hello@example.com",
        primaryColor: "#171717",
        secondaryColor: "#525252",
        accentColor: "#2563eb",
      },
    });
  }

  const existingClientSetting = await prisma.clientSetting.findFirst({
    select: { id: true },
  });

  if (!existingClientSetting) {
    await prisma.clientSetting.create({ data: {} });
  }

  const page = await prisma.page.upsert({
    where: { slug: "home" },
    update: {},
    create: {
      title: "Main Landing Page",
      slug: "home",
      status: PageStatus.DRAFT,
      pageType: PageType.LANDING,
    },
  });

  await prisma.seoSetting.upsert({
    where: { pageId: page.id },
    update: {},
    create: {
      pageId: page.id,
      metaTitle: "LandingForge Premium Landing Page Platform",
      metaDescription:
        "LandingForge creates fast, professional and conversion-focused landing pages with strong SEO, clear content and simple lead generation workflows.",
      canonicalUrl: "http://localhost:3000",
      twitterCardType: "summary_large_image",
      schemaJson: {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "LandingForge",
      },
    },
  });

  await prisma.pageSection.upsert({
    where: {
      pageId_sectionKey: {
        pageId: page.id,
        sectionKey: "hero",
      },
    },
    update: {},
    create: {
      pageId: page.id,
      sectionKey: "hero",
      sectionType: "hero",
      name: "Hero",
      sortOrder: 0,
      content: {
        title: "LandingForge",
        description: "Premium landing page platform.",
      },
      settings: {},
    },
  });

  await seedLegalFoundation(prisma);

  for (const [templateKey] of templates) {
    const template = templateRecords.get(templateKey);
    if (!template) continue;

    for (const [variantKey, variantName] of templateVariants[templateKey]) {
      const variant = await prisma.templateVariant.findUniqueOrThrow({
        where: {
          templateId_key: {
            templateId: template.id,
            key: variantKey,
          },
        },
        select: { id: true },
      });

      const demoKey = `${templateKey}-${variantKey}-demo`;
      const demoPage = await prisma.page.upsert({
        where: { demoKey },
        update: {
          templateId: template.id,
          templateVariantId: variant.id,
          isDemo: true,
          demoStatus: DemoStatus.DRAFT,
          portfolioVisible: false,
        },
        create: {
          title: `${template.name} ${variantName} Demo`,
          slug: demoKey,
          status: PageStatus.DRAFT,
          pageType: PageType.LANDING,
          isDemo: true,
          demoKey,
          demoStatus: DemoStatus.DRAFT,
          portfolioVisible: false,
          templateId: template.id,
          templateVariantId: variant.id,
        },
      });

      await prisma.seoSetting.upsert({
        where: { pageId: demoPage.id },
        update: {},
        create: {
          pageId: demoPage.id,
          metaTitle: `${template.name} ${variantName} Demo Landing Page`,
          metaDescription: `${template.name} ${variantName} demo landing page prepared with editable content, structured sections and SEO-ready metadata.`,
          canonicalUrl: `http://localhost:3000/${demoKey}`,
          robotsIndex: false,
          robotsFollow: false,
          twitterCardType: "summary_large_image",
          schemaJson: {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: `${template.name} ${variantName} Demo`,
          },
        },
      });

      for (const [
        sortOrder,
        [sectionKey, sectionName],
      ] of demoSections.entries()) {
        await prisma.pageSection.upsert({
          where: {
            pageId_sectionKey: {
              pageId: demoPage.id,
              sectionKey,
            },
          },
          update: {
            sectionType: sectionKey,
            name: sectionName,
            sortOrder,
            isVisible: true,
          },
          create: {
            pageId: demoPage.id,
            sectionKey,
            sectionType: sectionKey,
            name: sectionName,
            sortOrder,
            content: {
              title: `${sectionName} for ${template.name}`,
              text: `${variantName} demo content for ${template.name}.`,
            },
            settings: {
              variant: variantKey,
            },
          },
        });
      }
    }
  }

  const form = await prisma.form.upsert({
    where: {
      pageId_key: {
        pageId: page.id,
        key: "contact",
      },
    },
    update: {},
    create: {
      pageId: page.id,
      name: "Contact Form",
      key: "contact",
      type: FormType.CONTACT,
      status: FormStatus.PUBLISHED,
      successMessage: "Thank you. We will contact you shortly.",
      errorMessage: "We could not send your request. Please try again.",
      recipientEmail: "hello@example.com",
    },
  });

  const formFields = [
    ["name", "Name", FormFieldType.TEXT, true],
    ["email", "Email", FormFieldType.EMAIL, true],
    ["phone", "Phone", FormFieldType.PHONE, false],
    ["message", "Message", FormFieldType.TEXTAREA, false],
  ] as const;

  for (const [
    sortOrder,
    [name, label, type, isRequired],
  ] of formFields.entries()) {
    await prisma.formField.upsert({
      where: {
        formId_name: {
          formId: form.id,
          name,
        },
      },
      update: { label, type, isRequired, sortOrder },
      create: {
        formId: form.id,
        name,
        label,
        type,
        isRequired,
        sortOrder,
      },
    });
  }

  await seedUniversalDemo(prisma);
  await seedRealEstateDemos(prisma);
  await seedClinicDemos(prisma);
  await seedRestaurantDemos(prisma);
}

async function seedClinicDemos(prisma: PrismaClient) {
  const template = await prisma.template.findUniqueOrThrow({
    where: { key: "clinic" },
    select: { id: true },
  });

  const configs = [
    {
      variantKey: "corporate",
      themeKey: "clinic-corporate",
      demoKey: "clinic-corporate-demo",
      title: "ClaraMed | Clínica Multiespecialidade",
      portfolioOrder: 21,
      seoTitle: "ClaraMed — Clínica Multiespecialidade em Lisboa",
      seoDescription:
        "Clínica multiespecialidade com equipa qualificada, consultas programadas e atendimento claro para famílias e profissionais.",
      hero: {
        brandName: "ClaraMed",
        headerVariant: "classic",
        headerCtaLabel: "Marcar consulta",
        headerCtaHref: "#booking",
        headerLinks: [
          { label: "Especialidades", href: "#clinic-specialties" },
          { label: "Equipa", href: "#clinic-doctors" },
          { label: "Horários", href: "#clinic-locations" },
        ],
        footerVariant: "classic",
        footerCtaLabel: "Marcar consulta",
        footerCtaHref: "#booking",
        footerLinks: [
          { label: "Especialidades", href: "#clinic-specialties" },
          { label: "Equipa", href: "#clinic-doctors" },
          { label: "Contacto", href: "#contact" },
        ],
        eyebrow: "Clínica multiespecialidade",
        headline: "Cuidados médicos claros para cada etapa da família",
        subheadline:
          "Consultas programadas, equipa credenciada e comunicação simples desde o primeiro contacto.",
        ctaPrimary: "Marcar consulta",
        ctaSecondary: "Ver especialidades",
        proofLabel: "Resposta organizada",
        proofText:
          "A equipa confirma disponibilidade e indica os próximos passos sem recolher dados clínicos sensíveis no primeiro contacto.",
        stats: [
          { label: "Especialidades", value: "12" },
          { label: "Anos de prática", value: "15+" },
          { label: "Resposta media", value: "24h" },
        ],
      },
    },
    {
      variantKey: "modern",
      themeKey: "clinic-modern",
      demoKey: "clinic-modern-demo",
      title: "NexaCare Studio | Clínica Moderna",
      portfolioOrder: 22,
      seoTitle: "NexaCare Studio — Clínica Moderna com Marcação Simples",
      seoDescription:
        "Clínica moderna em Lisboa para consultas, tratamentos e acompanhamento com equipa humana, privacidade clara e marcação simples.",
      hero: {
        brandName: "NexaCare Studio",
        headerVariant: "cta-focused",
        headerCtaLabel: "Agendar consulta",
        headerCtaHref: "#booking",
        headerLinks: [
          { label: "Tratamentos", href: "#clinic-specialties" },
          { label: "Como funciona", href: "#clinic-process" },
          { label: "Equipa", href: "#clinic-doctors" },
        ],
        footerVariant: "cta-focused",
        footerCtaLabel: "Agendar consulta",
        footerCtaHref: "#booking",
        footerLinks: [
          { label: "Tratamentos", href: "#clinic-specialties" },
          { label: "Processo", href: "#clinic-process" },
          { label: "Localização", href: "#clinic-locations" },
        ],
        eyebrow: "NexaCare Studio — saúde simples e humana",
        headline: "Cuidados de saúde modernos, claros e humanos",
        subheadline:
          "Uma clínica urbana que combina triagem humana, explicações claras e marcação simples para pacientes que procuram tempo, respeito e privacidade.",
        ctaPrimary: "Agendar consulta",
        ctaSecondary: "Conhecer areas de cuidado",
        proofLabel: "Resposta em linguagem clara",
        proofText:
          "O primeiro contacto recolhe apenas o essencial. A equipa confirma disponibilidade e explica o próximo passo sem pedir histórico médico detalhado.",
        heroImage:
          "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80",
        heroImageAlt: "Clínica moderna luminosa com profissional de saúde a acompanhar paciente",
        stats: [
          { label: "Pedidos respondidos", value: "< 24h" },
          { label: "Areas de cuidado", value: "8" },
          { label: "Reviews verificadas", value: "4.8/5" },
        ],
        brandKit: {
          audience: "Pacientes urbanos que querem marcar rápido sem perder cuidado humano.",
          behanceAssets: [
            "Mobile booking flow",
            "Patient journey cards",
            "Privacy-first form detail",
          ],
          corePromise: "Saúde privada simples, clara e humana antes da primeira consulta.",
          personality: "Calma, moderna, proxima, transparente.",
          photographyStyle: "Clínica luminosa, retratos naturais, detalhes de cuidado humano.",
          tagline: "Saúde simples, humana e bem acompanhada.",
          typography: "Sans-serif limpa, headings fortes, microcopy muito legivel.",
          voice: "Clara, tranquilizadora, sem jargão médico.",
        },
      },
    },
    {
      variantKey: "luxury",
      themeKey: "clinic-luxury",
      demoKey: "clinic-luxury-demo",
      title: "Aurea Privé | Medicina Privada & Longevidade",
      portfolioOrder: 23,
      seoTitle: "Aurea Privé — Clínica Privada Premium em Lisboa",
      seoDescription:
        "Clínica privada premium em Lisboa com consultas discretas, medicina personalizada, longevidade e acompanhamento sénior.",
      hero: {
        brandName: "Aurea Privé",
        headerVariant: "luxury",
        headerCtaLabel: "Consulta privada",
        headerCtaHref: "#booking",
        headerLinks: [
          { label: "Experiência", href: "#private-experience" },
          { label: "Tratamentos", href: "#clinic-specialties" },
          { label: "Equipa", href: "#clinic-doctors" },
        ],
        footerVariant: "luxury",
        footerCtaLabel: "Consulta privada",
        footerCtaHref: "#booking",
        footerLinks: [
          { label: "Experiência privada", href: "#private-experience" },
          { label: "Tratamentos", href: "#clinic-specialties" },
          { label: "Contacto", href: "#contact" },
        ],
        eyebrow: "Aurea Privé — medicina privada e longevidade",
        headline: "Cuidado privado para quem valoriza tempo, discrição e critério clínico",
        subheadline:
          "Uma experiência de saúde reservada em Lisboa, conduzida por especialistas sénior, com consultas prolongadas, comunicação discreta e planos claros antes de qualquer tratamento.",
        ctaPrimary: "Solicitar consulta privada",
        ctaSecondary: "Ver experiência privada",
        proofLabel: "Privacidade desde o primeiro pedido",
        proofText:
          "A equipa recolhe apenas o essencial para coordenar a consulta. O histórico clínico detalhado fica reservado para canais apropriados.",
        heroImage:
          "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80",
        heroImageAlt: "Ambiente premium de clínica privada com consulta discreta e luminosa",
        stats: [
          { label: "Consulta inicial", value: "75m" },
          { label: "Especialistas senior", value: "7" },
          { label: "Acesso privado", value: "24h" },
        ],
        brandKit: {
          audience: "Pacientes premium que valorizam discrição, tempo e acompanhamento sénior.",
          behanceAssets: [
            "Private consultation journey",
            "Champagne/charcoal identity system",
            "Editorial clinic photography board",
          ],
          corePromise: "Tempo protegido, escuta atenta e acompanhamento com total discrição.",
          personality: "Reservada, editorial, calma, sofisticada.",
          photographyStyle: "Interiores privados, luz controlada, retratos sénior e detalhes tácteis.",
          tagline: "Private care, quietly handled.",
          typography: "Headings editoriais amplos, body sans-serif refinado.",
          voice: "Discreta, precisa, premium, sem pressao comercial.",
        },
      },
    },
  ] as const;

  const specialties = [
    {
      category: "Primeira consulta",
      description:
        "Conversa inicial para perceber objetivo, sintomas gerais e melhor percurso de acompanhamento.",
      duration: "45-60 min",
      name: "Avaliação orientada",
      priceLabel: "Confirmado pela equipa",
    },
    {
      category: "Planos de cuidado",
      description:
        "Consultas e tratamentos explicados com linguagem acessível, alternativas claras e acompanhamento profissional.",
      duration: "Plano personalizado",
      name: "Tratamentos explicados",
      priceLabel: "Mediante avaliação",
    },
    {
      category: "Seguimento",
      description:
        "Follow-up para quem precisa de continuidade, revisão, exames ou acompanhamento depois da primeira consulta.",
      duration: "Follow-up",
      name: "Acompanhamento próximo",
      priceLabel: "Por consulta",
    },
    {
      category: "Contacto rápido",
      description:
        "Pedido simples para quem quer falar com a equipa antes de marcar e perceber o acompanhamento indicado.",
      duration: "Resposta < 24h",
      name: "Pedido de orientação",
      priceLabel: "Sem custo inicial",
    },
  ] as const;

  const doctors = [
    {
      bio: "Coordena consultas de avaliação, comunicação com pacientes e definição de planos seguros.",
      credentials: "Ordem profissional ativa, formação contínua e experiência em contexto privado.",
      availability: "Consultas presenciais e follow-up",
      image:
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=700&q=80",
      imageAlt: "Medica senior em ambiente clinico",
      languages: "PT / EN",
      name: "Dra. Leonor Maia",
      role: "Diretora Clínica",
      specialty: "Medicina preventiva",
    },
    {
      bio: "Acompanha pacientes que precisam de um plano claro, conversa tranquila e contacto humano depois da consulta.",
      credentials: "Especialização clínica, atendimento humanizado e coordenação de percursos de cuidado.",
      availability: "Triagem e consulta programada",
      image:
        "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=700&q=80",
      imageAlt: "Médico especialista com bata branca",
      imagePosition: "center",
      languages: "PT / ES",
      name: "Dr. Vicente Araujo",
      role: "Especialista",
      specialty: "Consulta e acompanhamento",
    },
  ] as const;

  const credentials = [
    {
      description: "Equipa identificada, qualificações verificadas e comunicação clara em cada etapa.",
      title: "Equipa identificada",
    },
    {
      description: "O primeiro pedido recolhe apenas dados essenciais para contacto e marcação.",
      title: "Privacidade desde o primeiro clique",
    },
    {
      description: "Marcação simples, resposta humana e próximos passos explicados sem jargão médico.",
      title: "Experiência moderna",
    },
    {
      description: "Conteudo factual, sem promessas exageradas, claims absolutos ou linguagem alarmista.",
      title: "Informação responsável",
    },
  ] as const;

  const process = [
    {
      description: "O paciente escolhe a área de cuidado, deixa contacto e indica disponibilidade geral.",
      title: "Pedido inicial",
    },
    {
      description: "A equipa confirma informação essencial e responde pelo canal preferido.",
      title: "Confirmação humana",
    },
    {
      description: "A consulta esclarece contexto, objetivos e melhor percurso com linguagem clara.",
      title: "Consulta",
    },
    {
      description: "O paciente recebe indicacao de seguimento, exames ou tratamento quando aplicavel.",
      title: "Plano claro",
    },
  ] as const;

  for (const config of configs) {
    const specialtyItems =
      config.variantKey === "luxury"
        ? [
            {
              category: "Consulta privada",
              description:
                "Avaliação prolongada para compreender objetivos, contexto, histórico relevante e prioridades sem pressa.",
              duration: "75 min",
              name: "Consulta de medicina privada",
              priceLabel: "Sob proposta",
            },
            {
              category: "Longevidade",
              description:
                "Plano de acompanhamento para energia, prevenção, sono, exames e hábitos, sempre com orientação clínica responsável.",
              duration: "Plano trimestral",
              name: "Programa de longevidade",
              priceLabel: "Avaliação prévia",
            },
            {
              category: "Estetica médica",
              description:
                "Tratamentos discretos e progressivos, apresentados com limites, alternativas e expectativas realistas.",
              duration: "Consulta + plano",
              name: "Harmonização subtil",
              priceLabel: "Personalizado",
            },
            {
              category: "Acompanhamento",
              description:
                "Coordenação privada para pacientes que precisam de continuidade, seguimento ou articulação com outros especialistas.",
              duration: "Acesso reservado",
              name: "Concierge clinico",
              priceLabel: "Por plano",
            },
          ]
        : specialties;
    const doctorItems =
      config.variantKey === "luxury"
        ? [
            {
              availability: "Consultas privadas e plano anual",
              bio: "Coordena percursos de medicina privada, prevenção e acompanhamento para pacientes que exigem tempo protegido e comunicação discreta.",
              credentials:
                "Especialista senior, experiência em medicina privada e acompanhamento personalizado.",
              image:
                "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=700&q=80",
              imageAlt: "Médica sénior de clínica privada",
              languages: "PT / EN / FR",
              name: "Dra. Matilde Vilar",
              role: "Diretora Medica",
              specialty: "Medicina privada",
            },
            {
              availability: "Longevidade, estética médica e follow-up",
              bio: "Desenha planos discretos para bem-estar, tratamentos progressivos e decisões clínicas com expectativas realistas.",
              credentials:
                "Formação avançada em longevidade, estética médica e comunicação clínica privada.",
              image:
                "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=700&q=80",
              imageAlt: "Especialista de clínica premium em consulta",
              languages: "PT / EN",
              name: "Dr. Henrique Salgado",
              role: "Especialista Senior",
              specialty: "Longevidade e estética médica",
            },
          ]
        : doctors;
    const credentialItems =
      config.variantKey === "luxury"
        ? [
            {
              description:
                "Consultas prolongadas, agenda controlada e comunicação preparada para pacientes com pouco tempo.",
              title: "Tempo protegido",
            },
            {
              description:
                "Pedido inicial minimalista, equipa identificada e canais apropriados para informação sensível.",
              title: "Privacidade operacional",
            },
            {
              description:
                "Planos discutidos com benefícios, limites, alternativas e expectativas responsáveis.",
              title: "Decisão sem pressão",
            },
            {
              description:
                "Especialistas sénior, acompanhamento documentado e coordenação clara antes de cada etapa.",
              title: "Equipa sénior",
            },
          ]
        : credentials;
    const processItems =
      config.variantKey === "luxury"
        ? [
            {
              description:
                "O pedido recolhe apenas dados essenciais para a equipa indicar o melhor canal de acompanhamento.",
              title: "Pedido discreto",
            },
            {
              description:
                "A equipa confirma disponibilidade, privacidade e adequação do tipo de consulta.",
              title: "Triagem privada",
            },
            {
              description:
                "A consulta protege tempo para contexto, objetivos, dúvidas e próximos passos.",
              title: "Consulta prolongada",
            },
            {
              description:
                "O paciente recebe orientação clara, opções e plano de acompanhamento quando fizer sentido.",
              title: "Plano reservado",
            },
          ]
        : process;
    const variant = await prisma.templateVariant.findUniqueOrThrow({
      where: {
        templateId_key: { templateId: template.id, key: config.variantKey },
      },
      select: { id: true },
    });
    const theme = await prisma.theme.findUniqueOrThrow({
      where: { key: config.themeKey },
      select: { id: true },
    });

    const page = await prisma.page.upsert({
      where: { demoKey: config.demoKey },
      update: {
        title: config.title,
        templateId: template.id,
        templateVariantId: variant.id,
        themeId: theme.id,
        isDemo: true,
        demoStatus: DemoStatus.READY,
        portfolioVisible: config.variantKey !== "corporate",
        portfolioOrder: config.portfolioOrder,
        status: PageStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      create: {
        title: config.title,
        slug: config.demoKey,
        status: PageStatus.PUBLISHED,
        pageType: PageType.LANDING,
        isDemo: true,
        demoKey: config.demoKey,
        demoStatus: DemoStatus.READY,
        portfolioVisible: config.variantKey !== "corporate",
        portfolioOrder: config.portfolioOrder,
        templateId: template.id,
        templateVariantId: variant.id,
        themeId: theme.id,
        publishedAt: new Date(),
      },
    });

    await prisma.seoSetting.upsert({
      where: { pageId: page.id },
      update: {
        canonicalUrl: `http://localhost:3000/${config.demoKey}`,
        metaDescription: config.seoDescription,
        metaTitle: config.seoTitle,
        robotsFollow: false,
        robotsIndex: false,
        schemaJson: {
          "@context": "https://schema.org",
          "@type": "MedicalClinic",
          medicalSpecialty: ["Consultation", "PrivateHealthcare"],
          name: config.title,
          url: `http://localhost:3000/${config.demoKey}`,
        },
      },
      create: {
        pageId: page.id,
        canonicalUrl: `http://localhost:3000/${config.demoKey}`,
        metaDescription: config.seoDescription,
        metaTitle: config.seoTitle,
        robotsFollow: false,
        robotsIndex: false,
        twitterCardType: "summary_large_image",
        schemaJson: {
          "@context": "https://schema.org",
          "@type": "MedicalClinic",
          medicalSpecialty: ["Consultation", "PrivateHealthcare"],
          name: config.title,
          url: `http://localhost:3000/${config.demoKey}`,
        },
      },
    });

    const privateExperience =
      config.variantKey === "luxury"
        ? ([
            [
              "private-experience",
              "clinic_private_experience",
              "Private Experience",
              {
                title: "Uma experiência privada antes, durante e depois da consulta",
                text: "A Aurea Privé foi desenhada para pacientes que valorizam entrada discreta, tempo protegido, informação clara e continuidade sem exposição desnecessária.",
                items: [
                  {
                    title: "Entrada discreta",
                    description: "Chegada coordenada, equipa preparada e percurso pensado para reduzir espera e exposição.",
                  },
                  {
                    title: "Consulta prolongada",
                    description: "Tempo para contexto, prioridades, perguntas e decisao acompanhada por especialista senior.",
                  },
                  {
                    title: "Follow-up reservado",
                    description: "Próximos passos documentados, canais apropriados e acompanhamento sem pressão comercial.",
                  },
                ],
              },
            ],
          ] as const)
        : [];

    const sections = [
      ["hero", "clinic_hero", "Clinic Hero", config.hero],
      [
        "specialties",
        "clinic_specialties",
        "Clinic Specialties",
        {
          title:
            config.variantKey === "luxury"
              ? "Consultas signature para decisoes cuidadas"
              : config.variantKey === "modern"
              ? "Areas de cuidado para uma escolha tranquila"
                : "Especialidades explicadas com clareza",
          text:
            config.variantKey === "luxury"
              ? "Consultas e tratamentos explicados com discrição, expectativas realistas e acompanhamento privado."
              : config.variantKey === "modern"
              ? "A NexaCare organiza cada área com linguagem simples, tempo estimado e próximo passo claro para marcar sem ansiedade."
                : "Especialidades apresentadas com descrição clara, duração esperada e chamada para marcação.",
          items: specialtyItems,
        },
      ],
      ...privateExperience,
      [
        "credentials",
        "clinic_credentials",
        "Clinic Credentials",
        {
          title: "Porque os pacientes confiam na equipa",
          text:
            config.variantKey === "luxury"
              ? "A confiança nasce de privacidade operacional, equipa sénior, tempo protegido e comunicação sem pressão."
              : config.variantKey === "modern"
                ? "Equipa identificada, privacidade clara e processo simples para quem procura marcar com tranquilidade."
                : "Credenciais, privacidade e informação clara para reduzir ansiedade.",
          items: credentialItems,
        },
      ],
      [
        "team",
        "clinic_doctors",
        "Clinic Doctors",
        {
          title:
            config.variantKey === "modern"
              ? "Profissionais que explicam antes de avançar"
              : config.variantKey === "luxury"
                ? "Especialistas senior para acompanhamento reservado"
              : "Equipa preparada para explicar e acompanhar",
          text:
            config.variantKey === "luxury"
              ? "Perfis apresentados com critério clínico, discrição e experiência real."
              : config.variantKey === "modern"
                ? "Uma equipa pequena, identificada e preparada para orientar o paciente sem pressa nem linguagem complicada."
                : "Médicos, terapeutas e coordenadores apresentados com funções claras.",
          items: doctorItems,
        },
      ],
      [
        "process",
        "clinic_patient_journey",
        "Patient Journey",
        {
          title:
            config.variantKey === "modern"
              ? "Do pedido à consulta em quatro passos previsíveis"
              : config.variantKey === "luxury"
                ? "Um percurso privado, claro e sem exposição desnecessária"
              : "O que acontece depois de pedir contacto",
          text:
            config.variantKey === "luxury"
              ? "Cada etapa protege tempo, privacidade e clareza durante o acompanhamento."
              : config.variantKey === "modern"
                ? "O paciente sabe quem responde, quando responde e que informação será necessária para marcar."
                : "Um percurso simples, com resposta humana e próximos passos claros.",
          items: processItems,
        },
      ],
      [
        "testimonials",
        "testimonials",
        "Patient Testimonials",
        {
          title:
            config.variantKey === "modern"
              ? "Pacientes que valorizam tempo, escuta e discrição"
              : config.variantKey === "luxury"
                ? "Pacientes que procuram discrição e tempo protegido"
                : "Pacientes acompanhados com informação clara",
          text:
            config.variantKey === "modern"
              ? "Experiências partilhadas por pacientes que procuravam acompanhamento atento e reservado."
              : config.variantKey === "luxury"
                ? "Testemunhos discretos, anonimizados e focados em experiência, clareza e privacidade."
              : "Testemunhos com linguagem ética, humana e sem promessas exageradas.",
          items: [
            {
              image:
                config.variantKey === "luxury"
                  ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80"
                  : "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=600&q=80",
              imageAlt:
                config.variantKey === "luxury"
                  ? "Paciente privada em ambiente discreto"
                  : "Paciente satisfeita após consulta",
              name:
                config.variantKey === "modern"
                  ? "Ana Rodrigues"
                  : config.variantKey === "luxury"
                    ? "Marta Valente"
                  : "Paciente acompanhada",
              quote:
                config.variantKey === "modern"
                  ? "Percebi exatamente que informação precisava de enviar e o que iria acontecer a seguir. Isso fez muita diferença."
                  : config.variantKey === "luxury"
                    ? "Senti que o meu tempo foi respeitado e que cada passo foi explicado com discrição."
                  : "A equipa explicou os passos com calma e confirmou tudo antes da consulta.",
            },
            {
              image:
                config.variantKey === "luxury"
                  ? "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80"
                  : "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
              imageAlt:
                config.variantKey === "luxury"
                  ? "Paciente em plano privado"
                  : "Paciente em consulta moderna",
              imagePosition:
                config.variantKey === "luxury"
                  ? "center 28%"
                  : "center 28%",
              name:
                config.variantKey === "modern"
                  ? "Miguel Fernandes"
                  : config.variantKey === "luxury"
                    ? "Henrique Ramos"
                  : "Paciente em acompanhamento",
              quote:
                config.variantKey === "modern"
                  ? "A marcação foi simples, sem chamadas desnecessárias, e recebi uma resposta clara no mesmo dia."
                  : config.variantKey === "luxury"
                    ? "O plano foi apresentado sem pressa, com limites claros e opções realistas."
                  : "Senti acompanhamento desde o primeiro contacto, sempre com privacidade.",
            },
            {
              image:
                config.variantKey === "luxury"
                  ? "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80"
                  : "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
              imageAlt:
                config.variantKey === "luxury"
                  ? "Paciente privada em acompanhamento"
                  : "Familiar cuidadora em acompanhamento",
              imagePosition: "center 28%",
              name:
                config.variantKey === "luxury"
                  ? "Sofia Almeida"
                  : "Cláudia Martins",
              quote:
                config.variantKey === "luxury"
                  ? "O atendimento foi discreto, bem preparado e sem pressa."
                  : "Foi fácil entender horários, localização e o tipo de consulta indicado.",
            },
          ],
        },
      ],
      [
        "facilities",
        "clinic_facilities",
        "Clinic Facilities",
        {
          title:
            config.variantKey === "modern"
              ? "Uma clínica pensada para chegar com tranquilidade"
              : config.variantKey === "luxury"
                ? "Espaços privados com calma editorial"
              : "Instalações e experiência do paciente",
          text:
            config.variantKey === "luxury"
              ? "Ambientes discretos, salas preparadas e tecnologia apresentada como suporte ao cuidado, não como espetáculo."
              : config.variantKey === "modern"
                ? "Detalhes de espaço e atendimento que transformam a visita numa experiência mais calma, transparente e humana."
                : "Ambiente preparado para consultas tranquilas, tecnologia essencial e conforto durante toda a visita.",
          items: [
            {
              title:
                config.variantKey === "luxury"
                  ? "Entrada reservada"
                  : config.variantKey === "modern" ? "Rececao orientada" : "Rececao calma",
              image:
                config.variantKey === "luxury"
                  ? "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80"
                  : "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=900&q=80",
              imageAlt:
                config.variantKey === "luxury"
                  ? "Entrada reservada de clínica privada"
                  : "Receção luminosa de clínica moderna",
              description:
                config.variantKey === "luxury"
                  ? "Chegada coordenada para reduzir espera, ruído e exposição desnecessária."
                  : config.variantKey === "modern"
                    ? "Chegada simples, confirmação de dados e indicação clara sobre tempos e próximos passos."
                    : "Entrada organizada, tempo de espera reduzido e informação visível.",
            },
            {
              title:
                config.variantKey === "luxury"
                  ? "Salas privadas"
                  : config.variantKey === "modern" ? "Salas luminosas" : "Salas preparadas",
              image:
                config.variantKey === "luxury"
                  ? "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=900&q=80"
                  : "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80",
              imageAlt:
                config.variantKey === "luxury"
                  ? "Sala privada de consulta premium"
                  : "Sala clínica clara e moderna",
              description:
                config.variantKey === "luxury"
                  ? "Consultas com tempo, luz controlada, conforto e confidencialidade operacional."
                  : config.variantKey === "modern"
                    ? "Espaços claros, privados e preparados para consultas com conversa, explicação e seguimento."
                    : "Ambientes limpos, privados e adequados a consultas ou tratamentos.",
            },
            {
              title:
                config.variantKey === "luxury"
                  ? "Equipamento integrado"
                  : config.variantKey === "modern" ? "Chegada tranquila" : "Acessibilidade",
              image:
                config.variantKey === "luxury"
                  ? "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80"
                  : "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=900&q=80",
              imageAlt:
                config.variantKey === "luxury"
                  ? "Espaço discreto para acompanhamento privado"
                  : "Equipa clínica em acompanhamento de paciente",
              description:
                config.variantKey === "luxury"
                  ? "Tecnologia apresentada com sobriedade, como apoio à avaliação e acompanhamento."
                  : config.variantKey === "modern"
                    ? "Informação sobre estacionamento, transportes, mobilidade e contacto rápido antes da visita."
                    : "Informação sobre estacionamento, mobilidade e chegada.",
            },
          ],
        },
      ],
      [
        "cta",
        "cta",
        "Clinic CTA",
        {
          headline:
            config.variantKey === "modern"
              ? "Pronto para marcar sem complicar o primeiro contacto?"
              : config.variantKey === "luxury"
                ? "Reserve tempo privado para decidir com discrição"
                : "Marque uma consulta com informação clara",
          text:
            config.variantKey === "modern"
              ? "O primeiro pedido recolhe apenas o essencial para a equipa responder com disponibilidade, área indicada e próximo passo."
              : config.variantKey === "luxury"
                ? "Um pedido discreto para coordenar disponibilidade e contacto, deixando informação sensível para o canal adequado."
              : "Envie o pedido e receba confirmação humana com os próximos passos.",
          ctaPrimary:
            config.variantKey === "luxury" ? "Solicitar consulta privada" : "Pedir contacto",
        },
      ],
      [
        "locations",
        "clinic_locations",
        "Clinic Locations",
        {
          title: "Localização, contacto e horários",
          text:
            config.variantKey === "modern"
              ? "Contacto, horários e acesso apresentados de forma simples para marcar sem dúvidas."
              : config.variantKey === "luxury"
                ? "Localização privada, horários reservados e contacto direto para coordenação discreta."
              : "Informação local útil para planear a visita com tranquilidade.",
          items: [
            {
              address:
                config.variantKey === "luxury"
                  ? "Avenida da Liberdade 190, Lisboa"
                  : config.variantKey === "modern"
                    ? "Rua Rodrigo da Fonseca 88, Lisboa"
                    : "Avenida da Saúde 120, Lisboa",
              mapQuery:
                config.variantKey === "luxury"
                  ? "Avenida da Liberdade 190 Lisboa Portugal"
                  : config.variantKey === "modern"
                    ? "Rua Rodrigo da Fonseca 88 Lisboa Portugal"
                    : "Avenida da Saúde 120 Lisboa Portugal",
              name: config.hero.brandName,
              openingHours:
                config.variantKey === "luxury"
                  ? "Consultas privadas por marcação, segunda a sábado"
                  : config.variantKey === "modern"
                    ? "Segunda a sexta, 08:00-20:00; sabado, 09:00-13:00"
                    : "Segunda a sexta, 08:30-19:00",
            },
          ],
        },
      ],
      [
        "booking",
        "clinic_booking",
        "Clinic Booking",
        {
          ctaPrimary: "Enviar pedido",
          headline:
            config.variantKey === "luxury"
              ? "Solicite uma consulta privada com total discrição"
              : "Peça contacto para marcar consulta",
          text:
            config.variantKey === "modern"
              ? "Deixe contacto, área de cuidado e disponibilidade. A equipa responde com próximos passos sem pedir detalhes clínicos sensíveis no primeiro pedido."
              : config.variantKey === "luxury"
                ? "Partilhe apenas contacto, canal preferido e objetivo geral. A equipa privada responde com disponibilidade e indica o canal adequado para detalhes sensíveis."
              : "Partilhe apenas os dados essenciais para contacto e marcação. Informação clínica sensível deve ficar para canais apropriados.",
          ...(config.variantKey === "luxury"
            ? {
                privacyText:
                  "Aurea Privé não solicita histórico clínico detalhado neste primeiro pedido. O contacto serve apenas para coordenar atendimento reservado.",
                privacyTitle: "Consulta privada, dados minimos",
              }
            : config.variantKey === "modern"
            ? {
                privacyText:
                  "O pedido serve para coordenar contacto e marcação. Informação clínica detalhada deve ser partilhada apenas em canais apropriados da clínica.",
                privacyTitle: "Menos dados, mais clareza",
              }
            : {}),
        },
      ],
      [
        "faq",
        "faq",
        "FAQ",
        {
          title: "Perguntas frequentes",
          items: [
            {
              question: "Posso marcar sem explicar detalhes clinicos?",
              answer:
                "Sim. O pedido inicial deve conter apenas contacto, serviço pretendido e disponibilidade geral.",
            },
            {
              question: "A equipa confirma a consulta?",
              answer:
                "Sim. A clínica confirma disponibilidade e próximos passos pelo canal indicado.",
            },
            {
              question: "Os dados sao tratados com privacidade?",
              answer:
                "Sim. Cada pedido inclui consentimento claro, informação de privacidade e contacto seguro da equipa.",
            },
          ],
        },
      ],
      [
        "contact",
        "contact",
        "Contact",
        {
          email: "hello@example.com",
          phone: "+351 210 000 030",
          text:
            config.variantKey === "luxury"
              ? "Envie um pedido discreto e a equipa privada confirma disponibilidade pelo canal indicado."
              : "Envie o pedido e a equipa confirma disponibilidade.",
          title:
            config.variantKey === "luxury" ? "Pedido de consulta privada" : "Pedido de marcação",
        },
      ],
    ] as const;

    for (const [sortOrder, [sectionKey, sectionType, name, content]] of sections.entries()) {
      await prisma.pageSection.upsert({
        where: { pageId_sectionKey: { pageId: page.id, sectionKey } },
        update: { content, isVisible: true, name, sectionType, sortOrder },
        create: {
          content,
          isVisible: true,
          name,
          pageId: page.id,
          sectionKey,
          sectionType,
          settings: { variant: config.variantKey },
          sortOrder,
        },
      });
    }

    await hideGenericDemoSections(
      prisma,
      page.id,
      sections.map(([sectionKey]) => sectionKey),
    );

    const form = await prisma.form.upsert({
      where: { pageId_key: { pageId: page.id, key: "clinic-appointment" } },
      update: {
        name: "Clinic Appointment Form",
        recipientEmail: "hello@example.com",
        status: FormStatus.PUBLISHED,
        type: FormType.APPOINTMENT,
      },
      create: {
        errorMessage: "Nao foi possivel enviar o pedido. Tente novamente.",
        key: "clinic-appointment",
        name: "Clinic Appointment Form",
        pageId: page.id,
        recipientEmail: "hello@example.com",
        status: FormStatus.PUBLISHED,
        successMessage: "Pedido recebido. A equipa entrara em contacto em breve.",
        type: FormType.APPOINTMENT,
      },
    });

    const fields = [
      ["name", "Nome", FormFieldType.TEXT, true],
      ["email", "Email", FormFieldType.EMAIL, true],
      ["phone", "Telefone", FormFieldType.PHONE, true],
      ["service", "Especialidade ou tratamento", FormFieldType.SELECT, true],
      ["preferredContact", "Contacto preferido", FormFieldType.SELECT, false],
      ["preferredTime", "Disponibilidade", FormFieldType.TEXT, false],
      ["message", "Mensagem breve", FormFieldType.TEXTAREA, false],
    ] as const;

    for (const [sortOrder, [name, label, type, isRequired]] of fields.entries()) {
      await prisma.formField.upsert({
        where: { formId_name: { formId: form.id, name } },
        update: {
          isRequired,
          label,
          options:
            name === "service"
              ? ["Consulta de avaliação", "Tratamento personalizado", "Acompanhamento", "Consulta privada"]
              : name === "preferredContact"
                ? ["Telefone", "Email", "WhatsApp"]
                : undefined,
          sortOrder,
          type,
        },
        create: {
          formId: form.id,
          isRequired,
          label,
          name,
          options:
            name === "service"
              ? ["Consulta de avaliação", "Tratamento personalizado", "Acompanhamento", "Consulta privada"]
              : name === "preferredContact"
                ? ["Telefone", "Email", "WhatsApp"]
                : undefined,
          sortOrder,
          type,
        },
      });
    }
  }
}

async function seedRealEstateDemos(prisma: PrismaClient) {
  const template = await prisma.template.findUniqueOrThrow({
    where: { key: "real_estate" },
    select: { id: true },
  });

  const configs = [
    {
      variantKey: "local_agency",
      themeKey: "real-estate-local-agency",
      demoKey: "real-estate-local-agency-demo",
      title: "Aura Living | Imobiliária de Autor",
      portfolioOrder: 11,
      seoTitle: "Aura Living — Imobiliária de Proximidade e Consultoria de Bairro",
      seoDescription:
        "Especialistas em compra, venda e avaliação de imóveis residenciais com acompanhamento próximo e conhecimento profundo do mercado local.",
      hero: {
        brandName: "Aura Living",
        headerVariant: "local-business",
        headerCtaLabel: "Pedir avaliação",
        headerCtaHref: "#valuation",
        headerLinks: [
          { label: "Imóveis", href: "#featured-properties" },
          { label: "Bairros", href: "#local-expertise" },
          { label: "Equipa", href: "#agents" },
        ],
        footerVariant: "local-business",
        footerCtaLabel: "Pedir avaliação local",
        footerCtaHref: "#valuation",
        footerLinks: [
          { label: "Imóveis selecionados", href: "#featured-properties" },
          { label: "Conhecimento local", href: "#local-expertise" },
          { label: "Consultores", href: "#agents" },
          { label: "Perguntas frequentes", href: "#faq" },
        ],
        eyebrow: "Aura Living — Consultoria Imobiliária desde 2014",
        headline: "Casas escolhidas com critério por quem conhece cada bairro",
        subheadline:
          "A Aura Living combina avaliação honesta, leitura real do mercado local e acompanhamento próximo para famílias, proprietários e compradores exigentes.",
        ctaPrimary: "Pedir avaliação gratuita",
        ctaSecondary: "Ver casas selecionadas",
        stats: [
          { label: "Reviews verificadas", value: "4.9/5" },
          { label: "Anos de bairro", value: "+10" },
          { label: "Familias apoiadas", value: "850+" },
        ],
        brandKit: {
          audience: "Famílias, proprietários locais e compradores que valorizam confiança de bairro.",
          behanceAssets: [
            "Neighborhood cards",
            "Local valuation flow",
            "Consultant portrait system",
          ],
          corePromise: "Comprar ou vender com alguém que conhece a rua, não apenas o mercado.",
          personality: "Próxima, honesta, local, experiente.",
          photographyStyle: "Ruas de bairro, casas luminosas, consultores em contexto real.",
          tagline: "Casas com critério de bairro.",
          typography: "Sans-serif calorosa com hierarquia editorial simples.",
          voice: "Direta, humana, transparente e sem pressao.",
        },
        properties: [
          {
            tag: "Seleção Aura",
            title: "Apartamento T3 com terraço e luz de fim de tarde",
            location: "Avenida Central, Lisboa",
            price: "345.000 EUR",
            status: "Novo no Mercado",
            type: "Apartamento T3",
            beds: "3",
            baths: "2",
            area: "142 m2",
            image:
              "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
            imageAlt: "Sala de estar ampla com luz natural e acabamentos modernos",
            description:
              "Uma casa luminosa para famílias que valorizam escolas, comércio local, garagem e uma varanda para viver a cidade com calma.",
            ctaLabel: "Marcar visita",
          },
        ],
      },
      properties: [
        {
          title: "T3 com varanda perto de escolas",
          location: "Centro histórico renovado",
          price: "285.000 EUR",
          status: "Novo",
          type: "Apartamento familiar",
          beds: "3",
          baths: "2",
          area: "128 m2",
          image:
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
          imageAlt: "Apartamento familiar luminoso com sala aberta",
        },
        {
          title: "Moradia familiar com jardim sul",
          location: "Bairro residencial tranquilo",
          price: "420.000 EUR",
          status: "Exclusivo",
          type: "Moradia",
          beds: "4",
          baths: "3",
          area: "220 m2",
          image:
            "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
          imageAlt: "Moradia familiar com jardim e fachada moderna",
        },
        {
          title: "Loja com montra em rua de passagem",
          location: "Rua principal do bairro",
          price: "1.250 EUR/mês",
          status: "Arrendamento",
          type: "Comercial local",
          beds: "-",
          baths: "1",
          area: "78 m2",
          image:
            "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
          imageAlt: "Espaco comercial luminoso preparado para atendimento",
        },
      ],
      highlights: [
        {
          title: "Leitura real do bairro",
          description:
            "Comparamos preço, procura, escolas, acessos e dinâmica de rua antes de recomendar qualquer passo.",
        },
        {
          title: "Visitas com contexto",
          description:
            "Cada visita chega com informação de zona, pontos fortes, alertas e próximos passos claros.",
        },
        {
          title: "Avaliação honesta",
          description:
            "Estimamos valor com comparáveis reais, timing de mercado e posicionamento para evitar promessas vazias.",
        },
        {
          title: "Fecho acompanhado",
          description:
            "Ajudamos na preparação documental, negociação e comunicação entre comprador, vendedor e parceiros.",
        },
      ],
      agents: [
        {
          name: "Marta Silva",
          role: "Consultora local",
          phone: "+351 210 000 001",
          email: "marta@example.com",
          image:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
          imageAlt: "Consultora imobiliaria Marta Silva",
          bio: "Especialista em casas familiares, zonas escolares e comunicacao clara com proprietarios.",
        },
        {
          name: "Rui Martins",
          role: "Avaliação e angariação",
          phone: "+351 210 000 002",
          email: "rui@example.com",
          image:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
          imageAlt: "Consultor imobiliario Rui Martins",
          bio: "Responsável por avaliação, leitura de mercado e estratégia de venda por bairro.",
        },
      ],
      localAreas: [
        {
          name: "Centro histórico",
          profile: "Para quem quer comércio, cultura, serviços e mobilidade a poucos minutos.",
          trend: "Alta procura",
          averagePrice: "2.420 EUR/m2",
          averageTime: "29 dias",
          image:
            "https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=900&q=80",
          imageAlt: "Rua histórica com comércio local e edifícios renovados",
        },
        {
          name: "Zona escolar",
          profile: "Forte procura de famílias por escolas, parques, segurança e acessos diários.",
          trend: "Familiar",
          averagePrice: "2.180 EUR/m2",
          averageTime: "34 dias",
          image:
            "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=900&q=80",
          imageAlt: "Bairro residencial calmo perto de escolas e parques",
        },
        {
          name: "Bairro jardim",
          profile: "Moradias, ruas calmas, espaços verdes e bom potencial de valorização.",
          trend: "Estavel",
          averagePrice: "2.650 EUR/m2",
          averageTime: "41 dias",
          image:
            "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=900&q=80",
          imageAlt: "Zona residencial com jardim e ruas arborizadas",
        },
        {
          name: "Eixo comercial",
          profile: "Boa visibilidade para lojas, serviços de proximidade e pequenos negócios.",
          trend: "Comercial",
          averagePrice: "18 EUR/m2",
          averageTime: "37 dias",
          image:
            "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80",
          imageAlt: "Rua comercial urbana com montras e movimento local",
        },
      ],
      localProof: [
        { label: "Reviews verificadas", value: "4.9/5" },
        { label: "Negócios locais", value: "260+" },
        { label: "Resposta média", value: "< 24h" },
      ],
    },
    {
      variantKey: "premium",
      themeKey: "real-estate-premium",
      demoKey: "real-estate-premium-demo",
      title: "Vela Estates | Consultoria Imobiliária Premium",
      portfolioOrder: 12,
      seoTitle: "Vela Estates — Consultoria Imobiliária Premium e Casas Curadas",
      seoDescription:
        "Imobiliária premium para clientes que procuram casas selecionadas, avaliação estratégica e acompanhamento discreto.",
      hero: {
        brandName: "Vela Estates",
        headerVariant: "premium",
        headerCtaLabel: "Agendar reuniao",
        headerCtaHref: "#contact",
        headerLinks: [
          { label: "Casas", href: "#featured-properties" },
          { label: "Método", href: "#services" },
          { label: "Processo", href: "#process" },
        ],
        footerVariant: "premium",
        footerCtaLabel: "Solicitar market brief",
        footerCtaHref: "#contact",
        footerLinks: [
          { label: "Casas selecionadas", href: "#featured-properties" },
          { label: "Método Vela", href: "#services" },
          { label: "Processo", href: "#process" },
          { label: "Contacto privado", href: "#contact" },
        ],
        eyebrow: "Vela Estates — Premium Real Estate Advisory",
        headline: "Casas premium apresentadas como ativos de desejo",
        subheadline:
          "A Vela Estates combina casas cuidadosamente selecionadas, leitura de mercado e acompanhamento discreto para compradores, vendedores e investidores exigentes.",
        ctaPrimary: "Agendar reunião privada",
        ctaSecondary: "Ver casas selecionadas",
        stats: [
          { label: "Casas acompanhadas", value: "32" },
          { label: "Valor médio", value: "740k" },
          { label: "Visitas preparadas", value: "68%" },
        ],
        brandKit: {
          audience: "Compradores, vendedores e investidores premium que querem critério e dados.",
          behanceAssets: [
            "Dossier privado",
            "Market intelligence cards",
            "Editorial property showcase",
          ],
          corePromise: "Transformar casas premium em ativos desejáveis, bem posicionados e bem negociados.",
          personality: "Editorial, analítica, sofisticada, precisa.",
          photographyStyle: "Arquitetura premium, detalhes de materiais, interiores com luz dramática.",
          tagline: "Curated homes. Sharper decisions.",
          typography: "Editorial premium com sans-serif refinada e numeros fortes.",
          voice: "Consultiva, segura, seletiva e orientada por dados.",
        },
        properties: [
          {
            tag: "Private dossier",
            title: "Penthouse skyline com terraço social",
            location: "Avenida da Liberdade, Lisboa",
            price: "895.000 EUR",
            status: "Curated",
            type: "Penthouse",
            beds: "4",
            baths: "3",
            area: "245 m2",
            description:
              "Vista aberta, sala social fluida, suites silenciosas e um terraço desenhado para receber ao fim do dia.",
            ctaLabel: "Solicitar dossier",
            image:
              "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
            imageAlt: "Penthouse premium com arquitetura contemporanea e terraco panoramico",
          },
        ],
      },
      properties: [
        {
          title: "Penthouse skyline com terraço social",
          location: "Avenida da Liberdade, Lisboa",
          price: "895.000 EUR",
          status: "Curated",
          type: "Penthouse",
          beds: "4",
          baths: "3",
          area: "245 m2",
          image:
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
          imageAlt: "Penthouse premium com arquitetura contemporânea e terraço panorâmico",
        },
        {
          title: "Apartamento waterfront com luz poente",
          location: "Parque das Nacoes, Lisboa",
          price: "735.000 EUR",
          status: "Disponivel",
          type: "Apartamento",
          beds: "3",
          baths: "3",
          area: "188 m2",
          image:
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
          imageAlt: "Apartamento contemporâneo junto ao rio com interiores luminosos",
        },
        {
          title: "Moradia atelier em condominio reservado",
          location: "Cascais, Quinta da Marinha",
          price: "1.150.000 EUR",
          status: "Exclusivo",
          type: "Moradia",
          beds: "5",
          baths: "4",
          area: "360 m2",
          image:
            "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
          imageAlt: "Moradia contemporanea com piscina e jardim em condominio reservado",
        },
      ],
      highlights: [
        {
          title: "Curadoria editorial",
          description:
            "Seleção e apresentação de imóveis por arquitetura, liquidez, luz, contexto e potencial de valorização.",
        },
        {
          title: "Leitura de interesse",
          description:
            "Perguntas certas para perceber interesse, timing e capacidade antes de avançar para uma visita.",
        },
        {
          title: "Narrativa de valor",
          description:
            "Cada ativo ganha uma história comercial: lifestyle, localização, argumentos de compra e objeções respondidas.",
        },
        {
          title: "Acompanhamento até ao fecho",
          description:
            "Acompanhamento desde o dossier privado até à visita, proposta, negociação e próximo passo documentado.",
        },
      ],
      agents: [
        {
          name: "Ines Valente",
          role: "Head of Curated Homes",
          phone: "+351 210 000 011",
          email: "ines@vela-estates.example",
          bio: "Especialista em posicionamento de casas premium, storytelling imobiliário e experiência de compra para clientes exigentes.",
          image:
            "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
          imageAlt: "Advisor imobiliaria Ines Valente",
        },
        {
          name: "Marco Seixas",
          role: "Investment and Market Advisor",
          phone: "+351 210 000 012",
          email: "marco@vela-estates.example",
          bio: "Analisa liquidez, comparáveis, yield potencial e timing de mercado para compradores e proprietários premium.",
          image:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
          imageAlt: "Advisor imobiliário Marco Seixas",
        },
      ],
    },
    {
      variantKey: "luxury",
      themeKey: "real-estate-luxury",
      demoKey: "real-estate-luxury-demo",
      title: "Maison Orla | Private Luxury Real Estate",
      portfolioOrder: 13,
      seoTitle: "Maison Orla — Private Luxury Real Estate",
      seoDescription:
        "Residências privadas, acompanhamento discreto e consultoria premium para compradores de alto valor.",
      hero: {
        brandName: "Maison Orla",
        headerVariant: "luxury",
        headerCtaLabel: "Consulta privada",
        headerCtaHref: "#contact",
        headerLinks: [
          { label: "Portfolio", href: "#featured-properties" },
          { label: "Advisory", href: "#luxury-advisory" },
          { label: "FAQ", href: "#faq" },
        ],
        footerVariant: "luxury",
        footerCtaLabel: "Consulta privada",
        footerCtaHref: "#contact",
        footerLinks: [
          { label: "Private listings", href: "#featured-properties" },
          { label: "Advisory", href: "#luxury-advisory" },
          { label: "Perguntas frequentes", href: "#faq" },
        ],
        eyebrow: "Private luxury real estate",
        headline: "Residências exclusivas com curadoria e total discrição",
        subheadline:
          "Um percurso reservado para clientes que procuram ativos raros, negociação cuidada e acesso a oportunidades selecionadas.",
        ctaPrimary: "Solicitar consulta privada",
        ctaSecondary: "Ver propriedades privadas",
        stats: [
          { label: "Private listings", value: "18" },
          { label: "Valor médio", value: "2.4M" },
          { label: "Mercados", value: "5" },
        ],
        properties: [
          {
            tag: "Private listing",
            title: "Villa oceanfront com piscina infinita",
            location: "Costa premium",
            price: "Sob consulta",
            status: "Off-market",
            type: "Villa",
            beds: "6",
            baths: "7",
            area: "780 m2",
            description:
              "Arquitetura contemporânea, privacidade e vista aberta sobre o mar.",
            ctaLabel: "Pedir acesso",
          },
        ],
      },
      properties: [
        {
          title: "Villa oceanfront com piscina infinita",
          location: "Costa premium",
          price: "Sob consulta",
          status: "Off-market",
          type: "Villa",
          beds: "6",
          baths: "7",
          area: "780 m2",
        },
        {
          title: "Quinta histórica renovada",
          location: "Região vinícola",
          price: "3.850.000 EUR",
          status: "Private",
          type: "Estate",
          beds: "8",
          baths: "9",
          area: "1.240 m2",
        },
        {
          title: "Penthouse duplex skyline",
          location: "Centro prime",
          price: "2.100.000 EUR",
          status: "By request",
          type: "Penthouse",
          beds: "5",
          baths: "5",
          area: "410 m2",
        },
      ],
      highlights: [
        {
          title: "Private listings",
          description:
            "Acesso a oportunidades reservadas antes de chegarem ao mercado aberto.",
        },
        {
          title: "Discrição",
          description:
            "Processo controlado para proteger identidade, timing e negociação.",
        },
        {
          title: "Curadoria internacional",
          description:
            "Seleção de ativos por localização, escassez, arquitetura e legado.",
        },
        {
          title: "Concierge imobiliário",
          description:
            "Apoio premium antes, durante e depois da aquisição.",
        },
      ],
      agents: [
        {
          name: "Sofia Almeida",
          role: "Luxury advisor",
          phone: "+351 210 000 021",
          email: "sofia@example.com",
          bio: "Acompanha compradores e proprietários em transações de alto valor.",
        },
        {
          name: "Miguel Duarte",
          role: "Private market director",
          phone: "+351 210 000 022",
          email: "miguel@example.com",
          bio: "Especialista em mercado privado, carteira discreta e negociação confidencial.",
        },
      ],
      luxury: [
        {
          title: "Private access",
          description:
            "Pedido de informação filtrado antes da partilha de detalhes sensíveis.",
        },
        {
          title: "Asset narrative",
          description:
            "História, arquitetura, contexto e argumentos de valor do imóvel.",
        },
        {
          title: "Qualified viewings",
          description:
            "Visitas preparadas apenas para perfis alinhados com o ativo.",
        },
      ],
    },
  ] as const;

  for (const config of configs) {
    const variant = await prisma.templateVariant.findUniqueOrThrow({
      where: {
        templateId_key: { templateId: template.id, key: config.variantKey },
      },
      select: { id: true },
    });
    const theme = await prisma.theme.findUniqueOrThrow({
      where: { key: config.themeKey },
      select: { id: true },
    });

    const page = await prisma.page.upsert({
      where: { demoKey: config.demoKey },
      update: {
        title: config.title,
        templateId: template.id,
        templateVariantId: variant.id,
        themeId: theme.id,
        isDemo: true,
        demoStatus: DemoStatus.READY,
        portfolioVisible: true,
        portfolioOrder: config.portfolioOrder,
        status: PageStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      create: {
        title: config.title,
        slug: config.demoKey,
        status: PageStatus.PUBLISHED,
        pageType: PageType.LANDING,
        isDemo: true,
        demoKey: config.demoKey,
        demoStatus: DemoStatus.READY,
        portfolioVisible: true,
        portfolioOrder: config.portfolioOrder,
        templateId: template.id,
        templateVariantId: variant.id,
        themeId: theme.id,
        publishedAt: new Date(),
      },
    });

    await prisma.seoSetting.upsert({
      where: { pageId: page.id },
      update: {
        metaTitle: config.seoTitle,
        metaDescription: config.seoDescription,
        canonicalUrl: `http://localhost:3000/${config.demoKey}`,
        robotsIndex: false,
        robotsFollow: false,
        schemaJson: {
          "@context": "https://schema.org",
          "@type": "RealEstateAgent",
          name: config.title,
          url: `http://localhost:3000/${config.demoKey}`,
          ...(config.variantKey === "local_agency"
            ? {
                areaServed: [
                  "Centro",
                  "Zona escolar",
                  "Bairro residencial",
                  "Rua principal",
                ],
              }
            : {}),
        },
      },
      create: {
        pageId: page.id,
        metaTitle: config.seoTitle,
        metaDescription: config.seoDescription,
        canonicalUrl: `http://localhost:3000/${config.demoKey}`,
        robotsIndex: false,
        robotsFollow: false,
        twitterCardType: "summary_large_image",
        schemaJson: {
          "@context": "https://schema.org",
          "@type": "RealEstateAgent",
          name: config.title,
          url: `http://localhost:3000/${config.demoKey}`,
          ...(config.variantKey === "local_agency"
            ? {
                areaServed: [
                  "Centro",
                  "Zona escolar",
                  "Bairro residencial",
                  "Rua principal",
                ],
              }
            : {}),
        },
      },
    });

    const localAreaSections =
      "localAreas" in config
        ? ([
            [
              "local-expertise",
              "local_area_expertise",
              "Local Area Expertise",
              {
                title: "Conhecimento local que ajuda a decidir melhor",
                text: "Dados simples sobre zonas, procura e tempos médios para compradores e proprietários avaliarem o próximo passo com mais segurança.",
                items: config.localAreas,
                proof: config.localProof,
              },
            ],
          ] as const)
        : [];

    const sections = [
      [
        "hero",
        "real_estate_hero",
        "Real Estate Hero",
        {
          ...config.hero,
          properties: config.hero.properties,
        },
      ],
      [
        "featured-properties",
        "featured_properties",
        "Featured Properties",
        {
          title:
            config.variantKey === "premium"
              ? "Casas premium em destaque"
              : "Imóveis em destaque",
          text:
            config.variantKey === "premium"
              ? "Uma seleção rigorosa de casas com liquidez, arquitetura e narrativa comercial fortes."
              : "Casas escolhidas pela localização, estado de conservação e potencial para famílias que querem decidir com segurança.",
          items: config.properties,
        },
      ],
      [
        "services",
        "property_highlights",
        "Property Highlights",
        {
          title:
            config.variantKey === "premium"
              ? "Método premium de apresentação"
              : "Como ajudamos em cada passo",
          text:
            config.variantKey === "premium"
              ? "Curadoria, dados e apresentação cuidada para posicionar cada casa com critério."
              : "Acompanhamento local para comprar, vender ou avaliar casa com mais clareza.",
          items: config.highlights,
        },
      ],
      ...localAreaSections,
      [
        "valuation",
        "property_valuation",
        "Property Valuation",
        {
          eyebrow:
            config.variantKey === "premium"
              ? "Vela Market Brief"
              : "Avaliação",
          headline:
            config.variantKey === "premium"
              ? "Venda com uma estratégia antes de anunciar."
              : "Tem um imóvel para vender? Comece por uma avaliação clara.",
          text:
            config.variantKey === "premium"
              ? "Criamos uma leitura de mercado com comparáveis, narrativa de valor, perfil de comprador e plano de apresentação antes de avançar."
              : "Recolhemos os dados essenciais e ajudamos a perceber o melhor posicionamento.",
          ctaPrimary:
            config.variantKey === "premium"
              ? "Solicitar market brief"
              : "Pedir avaliação",
        },
      ],
      [
        "team",
        "real_estate_agents",
        "Real Estate Agents",
        {
          title:
            config.variantKey === "premium"
              ? "Advisors para decisoes premium"
              : "Consultores que conhecem a zona",
          text:
            config.variantKey === "premium"
              ? "Uma equipa pequena e senior para compradores exigentes, venda estrategica e investimento residencial."
              : "Uma equipa próxima, disponível e habituada a acompanhar famílias em momentos importantes.",
          items: config.agents,
        },
      ],
      [
        "process",
        "real_estate_process",
        "Real Estate Process",
        {
          title:
            config.variantKey === "premium"
              ? "Processo de venda orientado por dados"
              : "Um processo simples e previsível",
          text:
            config.variantKey === "premium"
              ? "Uma sequência clara para proteger valor, preparar visitas e acompanhar cada etapa com discrição."
              : "Da primeira conversa até à visita, proposta ou avaliação.",
          items: [
            {
              title:
                config.variantKey === "premium"
                  ? "Brief privado"
                  : "Diagnóstico",
              description:
                config.variantKey === "premium"
                  ? "Mapeamos objetivo, perfil de comprador, timing, preço desejado e argumentos do ativo."
                  : "Entendemos objetivo, prazo, localização e critérios.",
            },
            {
              title:
                config.variantKey === "premium"
                  ? "Curadoria"
                  : "Seleção",
              description:
                config.variantKey === "premium"
                  ? "Preparamos dossier, narrativa, imagens e critérios para apresentar apenas oportunidades relevantes."
                  : "Apresentamos imóveis, dados de mercado ou plano de venda.",
            },
            {
              title:
                config.variantKey === "premium"
                  ? "Qualificação"
                  : "Visita ou avaliação",
              description:
                config.variantKey === "premium"
                  ? "Confirmamos alinhamento, timing e contexto antes de marcar reuniões ou visitas."
                  : "Agendamos o próximo passo com informação pronta para decidir.",
            },
            {
              title:
                config.variantKey === "premium"
                  ? "Negociação"
                  : "Proposta",
              description:
                config.variantKey === "premium"
                  ? "Acompanhamos proposta, margem, documentos e decisão final com contexto e discrição."
                  : "Apoiamos negociação, documentos e acompanhamento final.",
            },
          ],
        },
      ],
      [
        "testimonials",
        "testimonials",
        "Testimonials",
        {
          title:
            config.variantKey === "premium"
              ? "Clientes que valorizam processo e critério"
              : "Histórias de clientes da zona",
          items: [
            {
              image:
                config.variantKey === "premium"
                  ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80"
                  : "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
              imageAlt:
                config.variantKey === "premium"
                  ? "Proprietária em Lisboa"
                  : "Cliente vendedora da zona",
              imagePosition: "center 28%",
              name:
                config.variantKey === "premium"
                  ? "Helena Costa"
                  : "Sofia Martins",
              quote:
                config.variantKey === "premium"
                  ? "A casa foi apresentada com cuidado, contexto e uma seleção de visitas muito mais alinhada com o seu valor."
                  : "Recebemos orientação clara, visitas bem preparadas e acompanhamento próximo desde o início.",
            },
            {
              image:
                config.variantKey === "premium"
                  ? "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80"
                  : "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80",
              imageAlt:
                config.variantKey === "premium"
                  ? "Comprador investidor"
                  : "Comprador de imóvel local",
              imagePosition:
                config.variantKey === "premium"
                  ? "center 28%"
                  : "center 28%",
              name:
                config.variantKey === "premium"
                  ? "Miguel Ramos"
                  : "Tiago Almeida",
              quote:
                config.variantKey === "premium"
                  ? "Recebi contexto de mercado e comparáveis antes da visita. Cheguei muito melhor preparado."
                  : "A equipa ajudou-nos a comparar opções, perceber a zona e avançar com tranquilidade.",
            },
          ],
        },
      ],
      [
        "faq",
        "faq",
        "FAQ",
        {
          title: "Perguntas frequentes",
          items: [
            {
              question: "Posso pedir avaliação antes de decidir vender?",
              answer:
                "Sim. A avaliação inicial ajuda a perceber preço, timing e procura.",
            },
            {
              question: "As visitas são agendadas pela equipa?",
              answer:
                "Sim. Deixe o contacto e a equipa confirma disponibilidade.",
            },
            {
              question: "Trabalham com imóveis off-market?",
              answer:
                "Sim. A equipa trabalha também oportunidades privadas e partilha detalhes apenas com clientes alinhados.",
            },
          ],
        },
      ],
      [
        "contact",
        "contact",
        "Contact",
        {
          title: "Fale com um consultor",
          text: "Envie o seu pedido e receba uma resposta com próximos passos.",
          email: "hello@example.com",
          phone: "+351 210 000 000",
        },
      ],
    ] as const;

    for (const [sortOrder, [sectionKey, sectionType, name, content]] of sections.entries()) {
      await prisma.pageSection.upsert({
        where: { pageId_sectionKey: { pageId: page.id, sectionKey } },
        update: { sectionType, name, sortOrder, isVisible: true, content },
        create: {
          pageId: page.id,
          sectionKey,
          sectionType,
          name,
          sortOrder,
          isVisible: true,
          content,
          settings: { variant: config.variantKey },
        },
      });
    }

    if ("luxury" in config) {
      await prisma.pageSection.upsert({
        where: {
          pageId_sectionKey: {
            pageId: page.id,
            sectionKey: "luxury-advisory",
          },
        },
        update: {
          sectionType: "luxury_advisory",
          name: "Luxury Advisory",
          sortOrder: sections.length,
          isVisible: true,
          content: {
            eyebrow: "Private advisory",
            title: "Uma experiência discreta para ativos raros",
            text: "Acompanhamento reservado para compradores e vendedores que precisam de curadoria, confidencialidade e critério premium.",
            items: config.luxury,
          },
        },
        create: {
          pageId: page.id,
          sectionKey: "luxury-advisory",
          sectionType: "luxury_advisory",
          name: "Luxury Advisory",
          sortOrder: sections.length,
          isVisible: true,
          content: {
            eyebrow: "Private advisory",
            title: "Uma experiência discreta para ativos raros",
            text: "Conteúdo reservado para compradores e vendedores que precisam de curadoria, confidencialidade e acompanhamento premium.",
            items: config.luxury,
          },
          settings: { variant: config.variantKey },
        },
      });
    }

    await hideGenericDemoSections(
      prisma,
      page.id,
      sections.map(([sectionKey]) => sectionKey),
    );

    const form = await prisma.form.upsert({
      where: { pageId_key: { pageId: page.id, key: "real-estate-inquiry" } },
      update: {
        name: "Real Estate Inquiry Form",
        type: FormType.QUOTE,
        status: FormStatus.PUBLISHED,
        recipientEmail: "hello@example.com",
      },
      create: {
        pageId: page.id,
        name: "Real Estate Inquiry Form",
        key: "real-estate-inquiry",
        type: FormType.QUOTE,
        status: FormStatus.PUBLISHED,
        successMessage: "Pedido recebido. Entraremos em contacto em breve.",
        errorMessage: "Nao foi possivel enviar. Tente novamente.",
        recipientEmail: "hello@example.com",
      },
    });

    const fields = [
      ["name", "Nome", FormFieldType.TEXT, true],
      ["email", "Email", FormFieldType.EMAIL, true],
      ["phone", "Telefone", FormFieldType.PHONE, true],
      ["interest", "Objetivo", FormFieldType.SELECT, true],
      ["location", "Localização pretendida", FormFieldType.TEXT, false],
      ["budget", "Orcamento ou valor estimado", FormFieldType.TEXT, false],
      ["message", "Mensagem", FormFieldType.TEXTAREA, false],
    ] as const;

    for (const [sortOrder, [name, label, type, isRequired]] of fields.entries()) {
      await prisma.formField.upsert({
        where: { formId_name: { formId: form.id, name } },
        update: {
          label,
          type,
          isRequired,
          sortOrder,
          options:
            name === "interest"
              ? ["Comprar", "Vender", "Avaliar imovel", "Investir"]
              : undefined,
        },
        create: {
          formId: form.id,
          name,
          label,
          type,
          isRequired,
          sortOrder,
          options:
            name === "interest"
              ? ["Comprar", "Vender", "Avaliar imovel", "Investir"]
              : undefined,
        },
      });
    }
  }
}

async function seedRestaurantDemos(prisma: PrismaClient) {
  const template = await prisma.template.findUniqueOrThrow({
    where: { key: "restaurant" },
    select: { id: true },
  });

  const demoConfigs = [
    {
      demoKey: "restaurant-fine-dining-demo",
      portfolioOrder: 7,
      themeKey: "restaurant-fine-dining",
      variantKey: "fine_dining",
      title: "Nocturne Table | Fine Dining",
      seo: {
        metaTitle: "Nocturne Table | Menu Degustação e Fine Dining em Lisboa",
        metaDescription:
          "Reserve mesa no Nocturne Table, uma experiência fine dining em Lisboa com menu degustação, chef residente e ambiente editorial.",
        schemaType: "Restaurant",
      },
      sections: [
        {
          key: "hero",
          name: "Fine Dining Hero",
          type: "restaurant_hero",
          content: {
            brandKit: {
              audience:
                "Casais, viajantes e clientes premium que procuram uma experiência de mesa memorável em Lisboa.",
              behanceAssets:
                "Cartas de degustação, fotografia escura editorial, notas de harmonização e detalhes de sala",
              corePromise:
                "Uma noite conduzida por técnica, sazonalidade e serviço discreto do primeiro contacto ao último prato.",
              personality: "Editorial, sensorial, reservada, precisa e profundamente portuguesa.",
              photographyStyle:
                "Food macro dramático, interiores com baixa luz, detalhes de mesa e cozinha aberta.",
              tagline: "Tasting nights, quietly unforgettable.",
              typography:
                "Headings editoriais amplos com sans-serif refinada para detalhes de menu.",
              voice: "Sofisticada, contida e focada na experiência.",
            },
            brandName: "Nocturne Table",
            headerVariant: "luxury",
            headerCtaLabel: "Reservar mesa",
            headerCtaHref: "#reservation",
            headerLinks: [
              { label: "Menu", href: "#menu" },
              { label: "Experiência", href: "#experience" },
              { label: "Localização", href: "#location" },
            ],
            footerVariant: "luxury",
            footerCtaLabel: "Reservar mesa",
            footerCtaHref: "#reservation",
            footerLinks: [
              { label: "Menu", href: "#menu" },
              { label: "Chef", href: "#chef" },
              { label: "Localização", href: "#location" },
            ],
            ctaPrimary: "Reservar degustação",
            ctaSecondary: "Ver menu",
            eyebrow: "Nocturne Table",
            headline: "Fine dining sazonal para noites que merecem tempo.",
            heroImage:
              "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1400&q=82",
            heroImageAlt:
              "Mesa fine dining intimista com pratos de degustação e luz baixa",
            highlights: [
              { label: "Menu", value: "7 momentos" },
              { label: "Sala", value: "32 lugares" },
              { label: "Reserva", value: "48h" },
            ],
            proofLabel: "Experiência guiada",
            proofText:
              "Menu, harmonização, horários e pedido de reserva apresentados com clareza e sobriedade.",
            subheadline:
              "Menus sazonais, sala intimista e reserva acompanhada para noites que pedem tempo.",
          },
        },
        {
          key: "menu",
          name: "Menu Highlights",
          type: "restaurant_menu_highlights",
          content: {
            layout: "fine_dining",
            text: "Uma sequência curta de pratos sazonais, técnica precisa e sabores pensados para guardar surpresa até à mesa.",
            title: "Sete momentos, uma narrativa.",
            items: [
              {
                category: "I. Frio",
                description:
                  "Ostra fria, kombucha de citrinos e azeite verde para abrir a noite com acidez limpa.",
                price: "Abertura",
                title: "Atlântico breve",
              },
              {
                category: "IV. Fogo",
                description:
                  "Peixe de linha, caldo escuro de legumes assados, alho negro e ervas de inverno.",
                price: "Principal",
                title: "Costa lenta",
              },
              {
                category: "VII. Final",
                description:
                  "Chocolate 72%, sal fumado, baunilha e azeite para fechar a degustação sem peso.",
                price: "Doce",
                title: "Noite amarga",
              },
            ],
          },
        },
        {
          key: "signature-dishes",
          name: "Signature Dishes",
          type: "restaurant_signature_dishes",
          content: {
            text: "Produto, vinho, ritmo e sala alinhados para uma noite calma e memorável.",
            title: "Porque esta noite merece reserva",
            items: [
              {
                description:
                  "Produto português tratado com composição contemporânea e leitura simples, sem teatralidade vazia.",
                image:
                  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=82",
                imageAlt: "Prato fine dining sazonal com apresentação cuidada",
                label: "Sazonal",
                title: "Menu muda com a estação",
              },
              {
                description:
                  "Harmonização opcional com escolhas pensadas para acompanhar cada momento do menu.",
                image:
                  "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=82",
                imageAlt: "Vinhos selecionados para harmonização de menu",
                label: "Vinhos",
                title: "Pairing sem pressa",
              },
              {
                description:
                  "Sala pequena, luz baixa e equipa presente sem interromper a conversa.",
                image:
                  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=82",
                imageAlt: "Sala fine dining intimista com mesas preparadas",
                label: "Ambiente",
                title: "32 lugares, zero ruído visual",
              },
              {
                description:
                  "Reserva guiada com notas alimentares para preparar a noite antes da chegada.",
                image:
                  "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=900&q=82",
                imageAlt: "Equipa de cozinha a preparar serviço antes da chegada dos clientes",
                label: "Reserva",
                title: "Alergias tratadas antes da mesa",
              },
            ],
          },
        },
        {
          key: "experience",
          name: "Dining Experience",
          type: "restaurant_experience",
          content: {
            layout: "fine_dining",
            text: "Da chegada ao último copo, cada momento é preparado para deixar a noite respirar.",
            title: "Uma noite em quatro tempos",
            items: [
              {
                description:
                  "Confirmação discreta, preferências alimentares revistas e mesa preparada sem espera.",
                title: "01. Receção calma",
              },
              {
                description:
                  "Menu explicado com linguagem clara, sem tornar a experiência rígida ou distante.",
                title: "02. Menu guiado",
              },
              {
                description:
                  "Final com café, digestivo opcional e convite para a próxima carta sazonal.",
                title: "03. Fecho memorável",
              },
            ],
          },
        },
        {
          key: "chef",
          name: "Chef Story",
          type: "restaurant_chef_story",
          content: {
            eyebrow: "Chef residente",
            notes: [
              { label: "Produto", value: "Peixe de linha, legumes locais e fermentados da casa." },
              { label: "Técnica", value: "Fogo, acidez e caldos longos em vez de excesso visual." },
              { label: "Sala", value: "Serviço silencioso, cadência medida e mesas espaçadas." },
            ],
            portraitImage:
              "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=1100&q=82",
            portraitAlt:
              "Chef em cozinha profissional a preparar prato fine dining",
            text: "A cozinha do Nocturne Table parte de produto português, técnicas precisas e menus curtos que respeitam o tempo do cliente. Cada serviço privilegia silêncio, cadência e uma mesa concentrada na noite.",
            title: "Uma assinatura discreta, não uma performance.",
          },
        },
        {
          key: "reviews",
          name: "Reviews",
          type: "restaurant_reviews",
          content: {
            text: "Comentários discretos de quem valoriza cozinha, sala e ritmo de serviço.",
            title: "Reservas que voltam",
            items: [
              {
                context: "Jantar a dois",
                image:
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
                imageAlt: "Cliente Marta após jantar fine dining",
                name: "Marta F.",
                quote:
                  "Uma noite calma, com comida precisa e serviço atento sem excesso.",
              },
              {
                context: "Reserva de aniversário",
                image:
                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
                imageAlt: "Cliente João após reserva de aniversário",
                name: "João R.",
                quote:
                  "O menu explicou-se sozinho. Reservar foi simples e a experiência correspondeu.",
              },
              {
                context: "Menu degustação",
                image:
                  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80",
                imageAlt: "Cliente Clara após menu degustação",
                name: "Clara M.",
                quote:
                  "Ambiente intimista, pratos memoráveis e excelente ritmo de sala.",
              },
            ],
          },
        },
        {
          key: "reservation",
          name: "Reservation",
          type: "restaurant_reservation",
          content: {
            ctaPrimary: "Pedir mesa",
            details: [
              { label: "Horário", value: "Quarta a sábado, 19:30-23:00" },
              { label: "Mesa", value: "Reserva recomendada com 48h" },
              { label: "Notas", value: "Alergias e restrições no pedido" },
            ],
            eyebrow: "Mesa limitada",
            text: "Pedido simples, resposta humana e uma chegada preparada ao detalhe.",
            title: "Reserve uma noite com intenção.",
          },
        },
        {
          key: "gallery",
          name: "Editorial Gallery",
          type: "restaurant_gallery",
          content: {
            layout: "fine_dining",
            text: "Cada detalhe prepara o ambiente antes da primeira garfada: luz, sala, vinho e ritmo de serviço.",
            title: "Detalhes que definem a noite",
            items: [
              {
                description:
                  "Produto sazonal, técnicas precisas e pratos pensados para chegar no momento certo.",
                image:
                  "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=82",
                imageAlt: "Prato sazonal preparado com detalhe editorial",
                label: "Cozinha",
              },
              {
                description:
                  "Sala pequena, luz baixa, mesas espaçadas e uma cadência que deixa a conversa respirar.",
                image:
                  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=82",
                imageAlt: "Sala de restaurante com luz baixa e mesas preparadas",
                label: "Sala",
              },
              {
                description:
                  "Harmonização opcional com vinhos escolhidos para acompanhar a narrativa do menu.",
                image:
                  "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=900&q=82",
                imageAlt: "Garrafa de vinho e copos em mesa elegante",
                label: "Vinhos",
              },
              {
                description:
                  "Pedido acompanhado por email para confirmar mesa, horário e restrições alimentares.",
                image:
                  "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=82",
                imageAlt: "Mesa reservada em restaurante intimista",
                label: "Reserva",
              },
            ],
          },
        },
        {
          key: "location",
          name: "Location",
          type: "restaurant_location",
          content: {
            address: "Rua da Escola Politécnica 88, Lisboa",
            hours: "Quarta a sábado, 19:30-23:00",
            reservationNote: "Mesas limitadas. Confirmação enviada por email.",
            text: "Localização, horários e expectativas de reserva sempre visíveis.",
            title: "No coração de Lisboa",
            mapQuery: "Rua da Escola Politécnica 88 Lisboa Portugal",
          },
        },
      ],
    },
    {
      demoKey: "restaurant-playful-demo",
      portfolioOrder: 8,
      themeKey: "restaurant-playful",
      variantKey: "playful",
      title: "Boca Pop | Restaurante Vibrante",
      seo: {
        metaTitle: "Boca Pop | Restaurante Vibrante para Grupos em Lisboa",
        metaDescription:
          "Reserve mesa no Boca Pop, restaurante vibrante em Lisboa para grupos, pratos partilhados, cocktails autorais e noites com energia.",
        schemaType: "Restaurant",
      },
      sections: [
        {
          key: "hero",
          name: "Playful Restaurant Hero",
          type: "restaurant_hero",
          content: {
            brandKit: {
              audience:
                "Grupos de amigos, aniversários, after-work e clientes que escolhem restaurantes pelo ambiente social.",
              behanceAssets:
                "Stickers, cartões de menu, sinalética luminosa, guardanapos ilustrados e posts coloridos",
              corePromise:
                "Juntar amigos à volta de comida colorida, bebidas vivas e uma mesa fácil de combinar.",
              personality: "Vibrante, irreverente, social, calorosa.",
              photographyStyle:
                "Food close-ups coloridos, mesas cheias, cocktails, flash social e textura urbana.",
              tagline: "Bring the table to life.",
              typography:
                "Sans-serif bold, detalhes compactos e labels com ritmo gráfico.",
              voice: "Curta, divertida, direta e cheia de apetite.",
            },
            brandName: "Boca Pop",
            headerVariant: "playful",
            headerCtaLabel: "Reservar grupo",
            headerCtaHref: "#reservation",
            headerLinks: [
              { label: "Favoritos", href: "#menu" },
              { label: "Mesa", href: "#signature-dishes" },
              { label: "Chegar", href: "#location" },
            ],
            footerVariant: "playful",
            footerCtaLabel: "Reservar grupo",
            footerCtaHref: "#reservation",
            footerLinks: [
              { label: "Favoritos", href: "#menu" },
              { label: "Grupos", href: "#reviews" },
              { label: "Chegar", href: "#location" },
            ],
            ctaPrimary: "Reservar grupo",
            ctaSecondary: "Ver favoritos",
            eyebrow: "Boca Pop",
            headline: "Comida para partilhar. Noites para repetir.",
            heroImage:
              "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=82",
            heroImageAlt:
              "Mesa de restaurante vibrante com amigos a partilhar pratos coloridos",
            secondaryImage:
              "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=82",
            secondaryImageAlt:
              "Prato colorido com massa e ingredientes vibrantes",
            highlights: [
              { label: "Grupos", value: "2-14 pax" },
              { label: "Cocktails", value: "18 autorais" },
              { label: "Energia", value: "Todos os dias" },
            ],
            proofLabel: "Reserva sem drama",
            proofText:
              "Pratos partilhados, grupos e aniversários aparecem logo no primeiro contacto.",
            stickers: [
              { label: "spicy tables" },
              { label: "birthday ready" },
              { label: "share first" },
              { label: "neon nights" },
            ],
            ticker: [
              { label: "book the table" },
              { label: "bring the group" },
              { label: "hot plates" },
              { label: "late cocktails" },
              { label: "story ready" },
            ],
            subheadline:
              "Junta o grupo, escolhe pratos para partilhar e reserva uma mesa cheia de cor, cocktails e boa energia.",
          },
        },
        {
          key: "menu",
          name: "Menu Highlights",
          type: "restaurant_menu_highlights",
          content: {
            layout: "playful",
            text: "Pratos para partilhar, bebidas da casa e escolhas fáceis para grupos que querem combinar tudo depressa.",
            title: "Favoritos que chegam ao centro.",
            items: [
              {
                category: "Para dividir",
                description:
                  "Tacos crocantes, pickles vivos e três molhos da casa para começar sem pedir opinião a toda a mesa.",
                price: "Desde 9",
                title: "Taco Chaos",
              },
              {
                category: "Principal",
                description:
                  "Frango glaceado, lima, ervas frescas e arroz tostado. Chega grande, desaparece depressa.",
                price: "18",
                title: "Fire Bird Bowl",
              },
              {
                category: "Cocktail",
                description:
                  "Manga, chili, citrinos e sal. Fotogénico, picante e feito para o primeiro brinde.",
                price: "11",
                title: "Hot Mango Spritz",
              },
            ],
          },
        },
        {
          key: "signature-dishes",
          name: "Signature Dishes",
          type: "restaurant_signature_dishes",
          content: {
            layout: "playful",
            text: "Pratos, bebidas e mesas pensados para amigos, grupos e datas que pedem energia.",
            title: "O que faz a mesa dizer sim",
            items: [
              {
                description:
                  "Pratos coloridos para dividir, fotografar e pedir sem complicar a mesa.",
                image:
                  "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=900&q=82",
                imageAlt: "Tacos coloridos para partilhar no centro da mesa",
                label: "Social",
                title: "Pratos que chegam ao centro",
              },
              {
                description:
                  "Mesas de grupo, aniversários e noites especiais com pedido simples para a equipa organizar tudo.",
                image:
                  "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=900&q=82",
                imageAlt: "Grupo de amigos a jantar e brindar no restaurante",
                label: "Grupos",
                title: "Mesas que juntam pessoas",
              },
              {
                description:
                  "Cocktails autorais com cor, sabor e brinde fácil para começar a noite.",
                image:
                  "https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=900&q=82",
                imageAlt: "Cocktails coloridos servidos numa mesa vibrante",
                label: "Cocktails",
                title: "Primeiro brinde garantido",
              },
              {
                description:
                  "Aniversários, after-work e pré-noite tratados com pedido simples e resposta clara.",
                image:
                  "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=900&q=82",
                imageAlt: "Equipa de restaurante a preparar reserva de grupo",
                label: "Eventos",
                title: "Planos sem conversa infinita",
              },
            ],
          },
        },
        {
          key: "experience",
          name: "Playful Experience",
          type: "restaurant_experience",
          content: {
            layout: "playful",
            text: "Do convite no grupo à mesa marcada, tudo foi pensado para decidir depressa e chegar com vontade.",
            title: "Da mensagem no grupo à mesa marcada",
            items: [
              {
                description:
                  "Reserva rápida para amigos, aniversários e after-work, sem perguntas desnecessárias.",
                title: "01. Alguém manda o link",
              },
              {
                description:
                  "Menu fácil de escolher, com pratos para dividir e bebidas em destaque.",
                title: "02. A mesa escolhe rápido",
              },
              {
                description:
                  "A noite termina com vontade de recomendar e voltar com mais gente.",
                title: "03. Voltam com mais gente",
              },
            ],
          },
        },
        {
          key: "reviews",
          name: "Reviews",
          type: "restaurant_reviews",
          content: {
            text: "Opiniões de clientes que escolheram o Boca Pop para juntar amigos, celebrar e repetir a noite.",
            title: "Quem veio trouxe amigos",
            items: [
              {
                context: "Mesa de amigos",
                image:
                  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
                imageAlt: "Cliente Rita em noite com amigos",
                name: "Rita S.",
                quote:
                  "Fomos para jantar rápido e ficámos para cocktails. Ambiente incrível.",
              },
              {
                context: "Aniversário",
                image:
                  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
                imageAlt: "Cliente Tiago em jantar de grupo",
                name: "Tiago C.",
                quote:
                  "Perfeito para grupo. Fácil de reservar e menu sem complicações.",
              },
              {
                context: "After-work",
                image:
                  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
                imageAlt: "Cliente Inês em after-work no restaurante",
                name: "Inês P.",
                quote:
                  "Colorido, bom som e comida que toda a mesa quis provar.",
              },
            ],
          },
        },
        {
          key: "gallery",
          name: "Playful Brand Gallery",
          type: "restaurant_gallery",
          content: {
            layout: "playful",
            text: "Pratos, bebidas e detalhes pensados para mesas de grupo, aniversários e noites que acabam em histórias.",
            title: "Momentos que a mesa vai comentar",
            items: [
              {
                description:
                  "Pratos grandes, coloridos e fáceis de dividir sem transformar o pedido numa reunião.",
                image:
                  "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=900&q=82",
                imageAlt: "Pratos coloridos para partilhar",
                label: "Para partilhar",
              },
              {
                description:
                  "Cocktails autorais com sabores fortes, boa apresentação e primeiro brinde garantido.",
                image:
                  "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=900&q=82",
                imageAlt: "Cocktails coloridos com garnish vibrante",
                label: "Cocktails",
              },
              {
                description:
                  "Mesas para amigos, aniversários e after-work com pedido simples e resposta clara.",
                image:
                  "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=900&q=82",
                imageAlt: "Mesa de grupo em ambiente animado",
                label: "Grupos",
              },
              {
                description:
                  "Ambiente colorido, música certa e energia suficiente para querer marcar a próxima.",
                image:
                  "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=900&q=82",
                imageAlt: "Rua colorida e vibrante perto de zona de restaurantes",
                label: "Ambiente",
              },
            ],
          },
        },
        {
          key: "reservation",
          name: "Reservation",
          type: "restaurant_reservation",
          content: {
            ctaPrimary: "Reservar grupo",
            details: [
              { label: "Grupos", value: "Mesas até 14 pessoas" },
              { label: "Horário", value: "Todos os dias, 12:00-00:00" },
              { label: "Eventos", value: "Aniversários e after-work" },
            ],
            eyebrow: "Grupos e eventos",
            text: "Reservas individuais, aniversários e mesas de grupo tratados pela mesma equipa, com resposta clara.",
            title: "Junta a mesa antes que esgote.",
          },
        },
        {
          key: "location",
          name: "Location",
          type: "restaurant_location",
          content: {
            address: "Rua do Alecrim 42, Lisboa",
            hours: "Todos os dias, 12:00-00:00",
            reservationNote: "Reservas de grupo confirmadas por email.",
            text: "Morada, horário e notas de grupo sempre fáceis de encontrar.",
            title: "Perto da noite, fácil de chegar",
            mapQuery: "Rua do Alecrim 42 Lisboa Portugal",
          },
        },
      ],
    },
  ] as const;

  for (const config of demoConfigs) {
    const variant = await prisma.templateVariant.findUniqueOrThrow({
      where: {
        templateId_key: {
          templateId: template.id,
          key: config.variantKey,
        },
      },
      select: { id: true },
    });
    const theme = await prisma.theme.findUniqueOrThrow({
      where: { key: config.themeKey },
      select: { id: true },
    });

    const page = await prisma.page.upsert({
      where: { demoKey: config.demoKey },
      update: {
        demoStatus: DemoStatus.PUBLISHED,
        isDemo: true,
        pageType: PageType.LANDING,
        portfolioOrder: config.portfolioOrder,
        portfolioVisible: true,
        publishedAt: new Date(),
        status: PageStatus.PUBLISHED,
        templateId: template.id,
        templateVariantId: variant.id,
        themeId: theme.id,
        title: config.title,
      },
      create: {
        demoKey: config.demoKey,
        demoStatus: DemoStatus.PUBLISHED,
        isDemo: true,
        pageType: PageType.LANDING,
        portfolioOrder: config.portfolioOrder,
        portfolioVisible: true,
        publishedAt: new Date(),
        slug: config.demoKey,
        status: PageStatus.PUBLISHED,
        templateId: template.id,
        templateVariantId: variant.id,
        themeId: theme.id,
        title: config.title,
      },
    });

    await prisma.seoSetting.upsert({
      where: { pageId: page.id },
      update: {
        canonicalUrl: `http://localhost:3000/${config.demoKey}`,
        metaDescription: config.seo.metaDescription,
        metaTitle: config.seo.metaTitle,
        robotsFollow: false,
        robotsIndex: false,
        schemaJson: {
          "@context": "https://schema.org",
          "@type": config.seo.schemaType,
          name: config.title,
        },
        twitterCardType: "summary_large_image",
      },
      create: {
        canonicalUrl: `http://localhost:3000/${config.demoKey}`,
        metaDescription: config.seo.metaDescription,
        metaTitle: config.seo.metaTitle,
        pageId: page.id,
        robotsFollow: false,
        robotsIndex: false,
        schemaJson: {
          "@context": "https://schema.org",
          "@type": config.seo.schemaType,
          name: config.title,
        },
        twitterCardType: "summary_large_image",
      },
    });

    for (const [sortOrder, section] of config.sections.entries()) {
      await prisma.pageSection.upsert({
        where: {
          pageId_sectionKey: {
            pageId: page.id,
            sectionKey: section.key,
          },
        },
        update: {
          content: section.content,
          isVisible: true,
          name: section.name,
          sectionType: section.type,
          sortOrder,
        },
        create: {
          content: section.content,
          isVisible: true,
          name: section.name,
          pageId: page.id,
          sectionKey: section.key,
          sectionType: section.type,
          settings: {},
          sortOrder,
        },
      });
    }

    await hideGenericDemoSections(
      prisma,
      page.id,
      config.sections.map((section) => section.key),
    );

    const form = await prisma.form.upsert({
      where: { pageId_key: { pageId: page.id, key: "restaurant-reservation" } },
      update: {
        errorMessage:
          "Nao foi possivel enviar o pedido. Tente novamente ou contacte o restaurante.",
        recipientEmail: "hello@example.com",
        status: FormStatus.PUBLISHED,
        successMessage:
          "Pedido recebido. A equipa confirmara a disponibilidade em breve.",
        type: FormType.BOOKING,
      },
      create: {
        description: "Pedido de reserva recebido atraves da pagina publica do restaurante.",
        errorMessage:
          "Nao foi possivel enviar o pedido. Tente novamente ou contacte o restaurante.",
        key: "restaurant-reservation",
        name: "Restaurant Reservation Form",
        pageId: page.id,
        recipientEmail: "hello@example.com",
        status: FormStatus.PUBLISHED,
        successMessage:
          "Pedido recebido. A equipa confirmara a disponibilidade em breve.",
        type: FormType.BOOKING,
      },
    });

    const fields = [
      ["name", "Nome", FormFieldType.TEXT, true],
      ["email", "Email", FormFieldType.EMAIL, true],
      ["phone", "Telefone", FormFieldType.PHONE, true],
      ["partySize", "Numero de pessoas", FormFieldType.NUMBER, true],
      ["preferredDate", "Data pretendida", FormFieldType.TEXT, true],
      ["preferredTime", "Hora pretendida", FormFieldType.TEXT, false],
      ["occasion", "Ocasião", FormFieldType.TEXT, false],
      ["dietaryNotes", "Alergias ou restrições", FormFieldType.TEXTAREA, false],
      ["message", "Mensagem", FormFieldType.TEXTAREA, false],
    ] as const;

    for (const [sortOrder, [name, label, type, isRequired]] of fields.entries()) {
      await prisma.formField.upsert({
        where: { formId_name: { formId: form.id, name } },
        update: {
          isRequired,
          label,
          sortOrder,
          type,
        },
        create: {
          formId: form.id,
          isRequired,
          label,
          name,
          sortOrder,
          type,
        },
      });
    }
  }
}

async function seedUniversalDemo(prisma: PrismaClient) {
  const template = await prisma.template.findUniqueOrThrow({
    where: { key: "universal" },
    select: { id: true },
  });
  const variant = await prisma.templateVariant.findUniqueOrThrow({
    where: {
      templateId_key: { templateId: template.id, key: "standard" },
    },
    select: { id: true },
  });
  const theme = await prisma.theme.findUniqueOrThrow({
    where: { key: "universal-base" },
    select: { id: true },
  });

  const page = await prisma.page.upsert({
    where: { demoKey: "universal-demo" },
    update: {
      templateId: template.id,
      templateVariantId: variant.id,
      themeId: theme.id,
      isDemo: true,
      demoStatus: DemoStatus.PUBLISHED,
      portfolioVisible: true,
      portfolioOrder: 1,
      status: PageStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    create: {
      title: "Universal Base Demo",
      slug: "universal-demo",
      status: PageStatus.PUBLISHED,
      pageType: PageType.LANDING,
      isDemo: true,
      demoKey: "universal-demo",
      demoStatus: DemoStatus.PUBLISHED,
      portfolioVisible: true,
      portfolioOrder: 1,
      templateId: template.id,
      templateVariantId: variant.id,
      themeId: theme.id,
      publishedAt: new Date(),
    },
  });

  await prisma.seoSetting.upsert({
    where: { pageId: page.id },
    update: {
      metaTitle: "Universal Base Template for High-Converting Landing Pages",
      metaDescription:
        "Universal Base is the LandingForge reference template for fast, responsive and conversion-focused landing pages with SEO, forms and leads.",
      canonicalUrl: "http://localhost:3000/universal-demo",
      robotsIndex: true,
      robotsFollow: true,
    },
    create: {
      pageId: page.id,
      metaTitle: "Universal Base Template for High-Converting Landing Pages",
      metaDescription:
        "Universal Base is the LandingForge reference template for fast, responsive and conversion-focused landing pages with SEO, forms and leads.",
      canonicalUrl: "http://localhost:3000/universal-demo",
      robotsIndex: true,
      robotsFollow: true,
      twitterCardType: "summary_large_image",
      schemaJson: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Universal Base Demo",
      },
    },
  });

  const sections = [
    ["hero", "hero", "Hero", {
      eyebrow: "Universal Base Template",
      headline: "A reusable landing page foundation for every business",
      subheadline:
        "Validate content, theme, SEO, forms and leads with one polished base template before creating industry-specific designs.",
      ctaPrimary: "Request a demo",
      ctaSecondary: "Explore sections",
    }],
    ["features", "features", "Features", {
      title: "Built for reusable conversion systems",
      text: "A flexible structure for future templates without locking content into one industry.",
      items: [
        { title: "CMS editable", description: "Copy, sections, SEO and forms are managed from the CMS." },
        { title: "Theme ready", description: "Colors, typography, radius and surfaces follow the Theme Engine." },
        { title: "Lead focused", description: "Forms connect directly to leads, pipeline and notifications." },
      ],
    }],
    ["services", "services", "Services", {
      title: "Core landing page blocks",
      items: [
        { title: "Offer positioning", description: "Clear hero, CTA and business context." },
        { title: "Trust building", description: "Testimonials, process, stats and FAQ." },
        { title: "Lead capture", description: "Accessible contact form with spam protection." },
      ],
    }],
    ["process", "process", "Process", {
      title: "A simple conversion flow",
      items: [
        { title: "1. Present", description: "Explain the offer quickly." },
        { title: "2. Prove", description: "Show services, trust and answers." },
        { title: "3. Convert", description: "Guide visitors to the form." },
      ],
    }],
    ["stats", "stats", "Stats", {
      title: "Validation metrics",
      items: [
        { value: "14", label: "Supported sections" },
        { value: "100%", label: "CMS editable" },
        { value: "AA", label: "Accessibility target" },
        { value: "90+", label: "Lighthouse target" },
      ],
    }],
    ["testimonials", "testimonials", "Testimonials", {
      title: "Designed for trust",
      items: [
        { name: "Client Admin", quote: "The base template keeps content editing simple and predictable." },
        { name: "Super Admin", quote: "It gives us a safe reference before building industry templates." },
      ],
    }],
    ["pricing", "pricing", "Pricing", {
      title: "Flexible offer presentation",
      items: [
        { title: "Starter", description: "One landing page with essential sections." },
        { title: "Growth", description: "Landing page plus lead workflows and SEO." },
        { title: "Premium", description: "Advanced content, branding and integrations." },
      ],
    }],
    ["faq", "faq", "FAQ", {
      title: "Questions answered",
      items: [
        { question: "Is this industry-specific?", answer: "No. It is the universal reference for future templates." },
        { question: "Can it collect leads?", answer: "Yes. The contact form creates leads in the pipeline." },
        { question: "Can content be edited?", answer: "Yes. Sections remain editable through the CMS." },
      ],
    }],
    ["contact", "contact", "Contact", {
      title: "Request a demo",
      text: "Use this form to validate Forms, Leads and anti-spam protection.",
      email: "hello@example.com",
      phone: "+351 000 000 000",
    }],
    ["cta", "cta", "CTA", {
      headline: "Ready to build industry templates on a solid foundation?",
      text: "Universal Base validates the reusable core before expanding into real client-facing templates.",
      ctaPrimary: "Start with Universal Base",
    }],
  ] as const;

  for (const [sortOrder, [sectionKey, sectionType, name, content]] of sections.entries()) {
    await prisma.pageSection.upsert({
      where: { pageId_sectionKey: { pageId: page.id, sectionKey } },
      update: { sectionType, name, sortOrder, isVisible: true, content },
      create: {
        pageId: page.id,
        sectionKey,
        sectionType,
        name,
        sortOrder,
        isVisible: true,
        content,
        settings: {},
      },
    });
  }

  const form = await prisma.form.upsert({
    where: { pageId_key: { pageId: page.id, key: "universal-contact" } },
    update: { status: FormStatus.PUBLISHED },
    create: {
      pageId: page.id,
      name: "Universal Contact Form",
      key: "universal-contact",
      type: FormType.CONTACT,
      status: FormStatus.PUBLISHED,
      successMessage: "Thank you. We will contact you shortly.",
      errorMessage: "We could not send your request. Please try again.",
      recipientEmail: "hello@example.com",
    },
  });

  const fields = [
    ["name", "Name", FormFieldType.TEXT, true],
    ["email", "Email", FormFieldType.EMAIL, true],
    ["company", "Company", FormFieldType.TEXT, false],
    ["message", "Message", FormFieldType.TEXTAREA, true],
  ] as const;

  for (const [sortOrder, [name, label, type, isRequired]] of fields.entries()) {
    await prisma.formField.upsert({
      where: { formId_name: { formId: form.id, name } },
      update: { label, type, isRequired, sortOrder },
      create: { formId: form.id, name, label, type, isRequired, sortOrder },
    });
  }
}

async function seedLegalFoundation(prisma: PrismaClient) {
  const site = await prisma.siteSetting.findFirstOrThrow();
  const legalPages = [
    {
      slug: "politica-privacidade",
      title: "Politica de Privacidade",
      type: LegalDocumentType.PRIVACY_POLICY,
      description:
        "Informação sobre recolha, utilização e proteção de dados pessoais.",
    },
    {
      slug: "politica-cookies",
      title: "Politica de Cookies",
      type: LegalDocumentType.COOKIE_POLICY,
      description:
        "Informação sobre cookies necessários, analytics, marketing e preferências.",
    },
    {
      slug: "termos-condicoes",
      title: "Termos e Condicoes",
      type: LegalDocumentType.TERMS,
      description:
        "Termos gerais de utilizacao e condicoes aplicaveis ao website.",
    },
  ] as const;

  const createdPages = [];
  for (const pageConfig of legalPages) {
    const page = await prisma.page.upsert({
      where: { slug: pageConfig.slug },
      update: {
        pageType: PageType.LEGAL,
        status: PageStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      create: {
        title: pageConfig.title,
        slug: pageConfig.slug,
        status: PageStatus.PUBLISHED,
        pageType: PageType.LEGAL,
        publishedAt: new Date(),
      },
    });
    createdPages.push(page);

    await prisma.seoSetting.upsert({
      where: { pageId: page.id },
      update: {
        metaTitle: `${pageConfig.title} LandingForge`,
        metaDescription: pageConfig.description,
        canonicalUrl: `http://localhost:3000/${pageConfig.slug}`,
        robotsIndex: true,
        robotsFollow: true,
      },
      create: {
        pageId: page.id,
        metaTitle: `${pageConfig.title} LandingForge`,
        metaDescription: pageConfig.description,
        canonicalUrl: `http://localhost:3000/${pageConfig.slug}`,
        robotsIndex: true,
        robotsFollow: true,
        twitterCardType: "summary",
      },
    });

    const content = {
      title: pageConfig.title,
      text: pageConfig.description,
      items: [
        {
          title: "Responsavel pelo tratamento",
          description: site.businessName,
        },
        {
          title: "Contacto para pedidos",
          description: site.contactEmail,
        },
        {
          title: "Direitos do titular",
          description:
            "Pode solicitar acesso, correcao, exportacao ou eliminacao dos seus dados.",
        },
      ],
    };

    await prisma.pageSection.upsert({
      where: {
        pageId_sectionKey: { pageId: page.id, sectionKey: "legal-body" },
      },
      update: { content },
      create: {
        pageId: page.id,
        sectionKey: "legal-body",
        sectionType: "legal",
        name: pageConfig.title,
        sortOrder: 0,
        content,
        settings: {},
      },
    });

    await prisma.legalDocumentVersion.upsert({
      where: { pageId_version: { pageId: page.id, version: "1.0" } },
      update: {},
      create: {
        pageId: page.id,
        type: pageConfig.type,
        version: "1.0",
        title: pageConfig.title,
        summary: pageConfig.description,
        content,
      },
    });
  }

  await prisma.legalSetting.upsert({
    where: { siteSettingId: site.id },
    update: {
      privacyPageId: createdPages[0]?.id,
      cookiePageId: createdPages[1]?.id,
      termsPageId: createdPages[2]?.id,
    },
    create: {
      siteSettingId: site.id,
      consentVersion: "1.0",
      cookieBannerEnabled: true,
      analyticsCookiesEnabled: false,
      marketingCookiesEnabled: false,
      privacyPageId: createdPages[0]?.id,
      cookiePageId: createdPages[1]?.id,
      termsPageId: createdPages[2]?.id,
      retentionDays: 365,
      dataControllerName: site.businessName,
      dataControllerEmail: site.contactEmail,
    },
  });
}
