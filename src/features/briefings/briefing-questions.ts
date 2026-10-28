export type BriefingQuestion = {
  key: string;
  group: string;
  label: string;
  helpText?: string;
  options?: string[];
  maxLength: number;
};

export type BriefingSectionCapability = {
  key: string;
  name: string;
  editableFields: string[];
};

export function sectionFieldAnswerKey(sectionKey: string, field: string) {
  return `section:${encodeURIComponent(sectionKey)}:${encodeURIComponent(field)}`;
}

export function sectionFieldAnswers(answers: Record<string, string>) {
  return Object.entries(answers).flatMap(([key, value]) => {
    const match = /^section:([^:]+):([^:]+)$/.exec(key);
    if (!match) return [];
    try {
      return [
        {
          sectionKey: decodeURIComponent(match[1]),
          field: decodeURIComponent(match[2]),
          value,
        },
      ];
    } catch {
      return [];
    }
  });
}

export function sectionCapabilitiesFromSnapshot(
  snapshot: unknown,
): BriefingSectionCapability[] {
  if (
    !snapshot ||
    typeof snapshot !== "object" ||
    !("page" in snapshot) ||
    !("capabilities" in snapshot)
  )
    return [];
  const value = snapshot as {
    page?: {
      sections?: Array<{
        sectionKey?: unknown;
        name?: unknown;
        isVisible?: unknown;
        content?: unknown;
      }>;
    };
    capabilities?: {
      sections?: Array<{ key?: unknown; editableFields?: unknown }>;
    };
  };
  const visible = new Map(
    (value.page?.sections ?? [])
      .filter(
        (section) =>
          section.isVisible === true && typeof section.sectionKey === "string",
      )
      .map((section) => [
        section.sectionKey as string,
        {
          name:
            typeof section.name === "string"
              ? section.name
              : (section.sectionKey as string),
          content:
            section.content &&
            typeof section.content === "object" &&
            !Array.isArray(section.content)
              ? (section.content as Record<string, unknown>)
              : {},
        },
      ]),
  );
  return (value.capabilities?.sections ?? [])
    .slice(0, 80)
    .flatMap((capability) => {
      if (
        typeof capability.key !== "string" ||
        !visible.has(capability.key) ||
        !Array.isArray(capability.editableFields)
      )
        return [];
      const section = visible.get(capability.key)!;
      return [
        {
          key: capability.key,
          name: section.name,
          editableFields: capability.editableFields
            .filter(
              (field): field is string =>
                typeof field === "string" &&
                (section.content[field] === null ||
                  typeof section.content[field] === "string"),
            )
            .slice(0, 40),
        },
      ];
    })
    .filter(({ editableFields }) => editableFields.length > 0);
}

const sharedQuestions: BriefingQuestion[] = [
  {
    key: "business_description",
    group: "Negócio",
    label: "O que faz a empresa e que produtos ou serviços pretende destacar?",
    maxLength: 3000,
  },
  {
    key: "target_audience",
    group: "Negócio",
    label: "Quem é o público prioritário?",
    maxLength: 2000,
  },
  {
    key: "business_goal",
    group: "Conversão",
    label: "Qual é o principal resultado que a landing deve gerar?",
    options: [
      "Pedidos de contacto",
      "Chamadas",
      "Marcações",
      "Reservas",
      "Vendas",
      "Outro",
    ],
    maxLength: 1000,
  },
  {
    key: "customer_journey",
    group: "Conversão",
    label:
      "Como chega normalmente o visitante e o que precisa de perceber antes de agir?",
    maxLength: 2500,
  },
  {
    key: "main_objections",
    group: "Conversão",
    label: "Que dúvidas ou objeções impedem o contacto ou a compra?",
    maxLength: 2500,
  },
  {
    key: "trust_signals",
    group: "Confiança",
    label:
      "Que provas reais podemos apresentar? Indica avaliações, certificações, experiência ou parceiros e a respetiva fonte. Não inventes testemunhos nem métricas.",
    maxLength: 3000,
  },
  {
    key: "brand_assets",
    group: "Marca",
    label:
      "Que logótipo, cores, tipografia, guia de marca ou materiais aprovados existem?",
    maxLength: 2500,
  },
  {
    key: "voice_and_style",
    group: "Marca",
    label:
      "Como deve soar e parecer a marca? Indica referências e o que deve ser evitado.",
    maxLength: 2500,
  },
  {
    key: "seo_local",
    group: "SEO",
    label:
      "Que serviços, localidades e termos de pesquisa são prioritários? Indica se já foram validados.",
    maxLength: 2500,
  },
  {
    key: "competitors_references",
    group: "Referências",
    label:
      "Partilha sites de referência ou concorrentes e explica o que é relevante em cada um.",
    maxLength: 3000,
  },
  {
    key: "functional_requirements",
    group: "Âmbito",
    label:
      "Que integrações ou funcionalidades são necessárias? Identifica como preferência ou requisito obrigatório.",
    maxLength: 2500,
  },
  {
    key: "success_criteria",
    group: "Âmbito",
    label: "Como vamos avaliar se a landing está pronta e cumpre o objetivo?",
    maxLength: 2000,
  },
];

const industryQuestions: Record<string, BriefingQuestion[]> = {
  "real-estate": [
    {
      key: "property_services",
      group: "Imobiliário",
      label:
        "Que serviços são prestados (venda, arrendamento, avaliação ou gestão)?",
      maxLength: 2000,
    },
    {
      key: "property_areas",
      group: "Imobiliário",
      label: "Que zonas e tipos de imóvel são prioritários?",
      maxLength: 2000,
    },
    {
      key: "property_process",
      group: "Imobiliário",
      label:
        "Que etapas e documentos fazem parte do acompanhamento ao cliente?",
      maxLength: 2000,
    },
  ],
  clinic: [
    {
      key: "clinic_specialties",
      group: "Clínica",
      label:
        "Que especialidades e serviços profissionais devem ser apresentados? Não incluas dados clínicos de pacientes.",
      maxLength: 2000,
    },
    {
      key: "clinic_booking",
      group: "Clínica",
      label:
        "Como são feitas as marcações, que seguros são aceites e que acessibilidades devem ser indicadas? Não incluas informação de saúde de pessoas.",
      maxLength: 2000,
    },
  ],
  restaurant: [
    {
      key: "restaurant_offer",
      group: "Restaurante",
      label:
        "Que pratos, menus, opções alimentares e serviços (sala, take-away ou entrega) devem ser destacados? Confirma a fonte do menu.",
      maxLength: 2500,
    },
    {
      key: "restaurant_reservations",
      group: "Restaurante",
      label: "Como funcionam reservas, grupos e eventos?",
      maxLength: 2000,
    },
  ],
  bakery: [
    {
      key: "bakery_offer",
      group: "Pastelaria",
      label:
        "Que produtos, encomendas personalizadas e opções de entrega estão disponíveis?",
      maxLength: 2500,
    },
    {
      key: "bakery_orders",
      group: "Pastelaria",
      label:
        "Com que antecedência se fazem encomendas e como são levantadas ou entregues?",
      maxLength: 2000,
    },
  ],
  gym: [
    {
      key: "gym_services",
      group: "Fitness",
      label:
        "Que modalidades, planos, horários e sessões de experimentação estão disponíveis?",
      maxLength: 2500,
    },
    {
      key: "gym_coaching",
      group: "Fitness",
      label:
        "Que qualificações, acompanhamento e regras de segurança devem ser comunicados?",
      maxLength: 2000,
    },
  ],
  construction: [
    {
      key: "construction_services",
      group: "Construção",
      label: "Que tipos de obra, remodelação e serviços são prestados?",
      maxLength: 2500,
    },
    {
      key: "construction_proof",
      group: "Construção",
      label:
        "Que projetos, licenças, certificações e garantias podem ser comprovados? Indica fontes e limites.",
      maxLength: 2500,
    },
  ],
  beauty: [
    {
      key: "beauty_services",
      group: "Beleza",
      label:
        "Que tratamentos, profissionais e produtos devem ser apresentados?",
      maxLength: 2500,
    },
    {
      key: "beauty_booking",
      group: "Beleza",
      label:
        "Como funcionam marcações, preparação, contraindicações profissionais e política de cancelamento? Não incluas dados pessoais de clientes.",
      maxLength: 2000,
    },
  ],
};

export function getBriefingQuestions(
  industryKey?: string | null,
  sections: BriefingSectionCapability[] = [],
  serviceType?: string | null,
): BriefingQuestion[] {
  const key = industryKey?.toLowerCase().replaceAll("_", "-") ?? "";
  const industry =
    industryQuestions[key] ?? industryQuestions[key.split("-")[0]] ?? [];
  const serviceQuestions: BriefingQuestion[] =
    serviceType === "STRUCTURAL_CHANGE"
      ? [
          {
            key: "structural_request",
            group: "Alteração estrutural",
            label:
              "Que secções pretende acrescentar, remover ou reordenar? Indica o motivo, a prioridade e se é obrigatório ou uma preferência.",
            maxLength: 4000,
          },
        ]
      : serviceType === "NEW_TEMPLATE"
        ? [
            {
              key: "new_template_requirements",
              group: "Novo template",
              label:
                "Que público, objetivo, funcionalidades e conteúdo distinguem este template? Indica o que deve ser reutilizável e que referências devem ser evitadas.",
              maxLength: 4000,
            },
          ]
        : serviceType === "MAINTENANCE"
          ? [
              {
                key: "maintenance_request",
                group: "Manutenção",
                label:
                  "Qual é a página afetada, o resultado esperado, a urgência acordada e como podemos reproduzir o pedido? Não partilhes credenciais.",
                maxLength: 4000,
              },
            ]
          : [
              {
                key: "template_adaptation",
                group: "Adaptação de template",
                label:
                  "O que deve manter-se igual à variante escolhida e o que precisa de ser adaptado à marca do cliente?",
                maxLength: 3000,
              },
            ];
  const sectionQuestions: BriefingQuestion[] = sections.flatMap((section) =>
    section.editableFields.map(
      (field): BriefingQuestion => ({
        key: sectionFieldAnswerKey(section.key, field),
        group: section.name,
        label: `Conteúdo de «${field}»`,
        helpText: `Este valor será proposto para o campo «${field}» da secção «${section.name}». A aplicação à cópia do projeto exige revisão explícita.`,
        maxLength: 5000,
      }),
    ),
  );
  return [
    ...sharedQuestions,
    ...serviceQuestions,
    ...industry,
    ...sectionQuestions,
  ];
}

export function validateBriefingAnswers(
  input: unknown,
  industryKey?: string | null,
  sections: BriefingSectionCapability[] = [],
  serviceType?: string | null,
) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("As respostas do briefing têm um formato inválido.");
  }
  const allowed = new Map(
    getBriefingQuestions(industryKey, sections, serviceType).map((question) => [
      question.key,
      question,
    ]),
  );
  const entries = Object.entries(input as Record<string, unknown>);
  if (entries.length > allowed.size)
    throw new Error("O briefing contém perguntas não suportadas.");

  const answers: Record<string, string> = {};
  for (const [key, value] of entries) {
    const question = allowed.get(key);
    if (!question || typeof value !== "string")
      throw new Error("O briefing contém uma resposta não permitida.");
    const answer = value.trim();
    if (answer.length > question.maxLength)
      throw new Error(
        `A resposta a «${question.label}» excede o limite permitido.`,
      );
    if (question.options && answer && !question.options.includes(answer)) {
      throw new Error(
        `A resposta a «${question.label}» não pertence às opções disponíveis.`,
      );
    }
    if (answer) answers[key] = answer;
  }
  return answers;
}

export function briefingCompletion(
  answers: Record<string, string>,
  industryKey?: string | null,
  sections: BriefingSectionCapability[] = [],
  serviceType?: string | null,
) {
  const questions = getBriefingQuestions(industryKey, sections, serviceType);
  const completed = questions.filter(({ key }) =>
    Boolean(answers[key]?.trim()),
  ).length;
  return {
    completed,
    total: questions.length,
    percent: Math.round((completed / questions.length) * 100),
  };
}
