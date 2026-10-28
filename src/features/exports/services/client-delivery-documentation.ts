import type { ClientRuntimeComposition } from "@/features/exports/services/client-runtime-composition";

function markdown(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replace(/[\\`*_{}\[\]()#+.!|>~-]/g, "\\$&")
    .replace(/\r?\n/g, " ");
}

function code(value: string) {
  return value.replaceAll("`", "");
}

const ownerLabels = {
  LANDINGFORGE: "LandingForge",
  CLIENT: "Cliente",
  SHARED: "Partilhado",
  NOT_APPLICABLE: "Não aplicável",
} as const;

const maintenanceLabels = {
  NONE: "Sem manutenção registada",
  ON_DEMAND: "Pedidos avulsos registados",
  CONTRACTED: "Manutenção contratada registada",
} as const;

export function buildClientDeliveryDocumentation(
  composition: ClientRuntimeComposition,
) {
  const { payload, mode, template, deliveryProfile: delivery } = composition;
  const cmsIncluded = mode === "LANDING_WITH_CMS";
  const sections = payload.page.sections;
  const capabilities = new Map(
    composition.capabilities.sections.map((capability) => [capability.key, capability]),
  );
  const forms = payload.page.forms
    .map((form) => {
      const fields = form.fields
        .map((field) => `${markdown(field.label)}${field.isRequired ? " (obrigatório)" : ""}`)
        .join(", ");
      return `- **${markdown(form.name)}**${fields ? `: ${fields}` : ": sem campos visíveis"}`;
    })
    .join("\n") || "- Não existem formulários no snapshot.";
  const sectionList = sections
    .map(({ name }) => `- ${markdown(name)}`)
    .join("\n") || "- Não existem secções visíveis no snapshot.";
  const theme = payload.page.theme;
  const brandSettings = [
    `- **Cores:** primária ${code(theme.primaryColor)}, secundária ${code(theme.secondaryColor)}, destaque ${code(theme.accentColor)}, fundo ${code(theme.backgroundColor)}, superfície ${code(theme.surfaceColor)}, texto ${code(theme.textPrimaryColor)}.`,
    `- **Tipografia:** títulos ${markdown(theme.headingFont)}; texto ${markdown(theme.bodyFont)}.`,
  ].join("\n");
  const seo = payload.page.seo
    ? [
        `- **Meta title:** ${markdown(payload.page.seo.metaTitle)}`,
        `- **Meta description:** ${markdown(payload.page.seo.metaDescription)}`,
        `- **Keywords:** ${payload.page.seo.keywords ? markdown(payload.page.seo.keywords) : "não definidas"}`,
        `- **Indexação:** ${payload.page.seo.robotsIndex ? "permitida" : "bloqueada"}; seguir links: ${payload.page.seo.robotsFollow ? "sim" : "não"}.`,
        `- **Open Graph:** título ${payload.page.seo.ogTitle ? markdown(payload.page.seo.ogTitle) : "herda o meta title"}; descrição ${payload.page.seo.ogDescription ? markdown(payload.page.seo.ogDescription) : "herda a meta description"}.`,
      ].join("\n")
    : "SEO não configurado no snapshot exportado; completar e validar antes da publicação.";
  const integrationNotes = cmsIncluded
    ? "O pacote CMS guarda os pedidos no CMS, sem notificação automática por email. Turnstile depende de configuração opcional no alojamento. O snapshot não confirma credenciais nem teste de integração."
    : "A entrega suporta notificações por Resend e Turnstile opcional quando configurados com credenciais do cliente. O snapshot não confirma credenciais, domínio remetente verificado nem testes; validar no destino antes da divulgação.";
  const cmsSections = sections
    .map((section) => {
      const capability = capabilities.get(section.sectionKey);
      const fields = capability?.editableFields ?? [];
      return [
        `### ${markdown(section.name)}`,
        "",
        `- **Chave de secção:** \`${code(section.sectionKey)}\``,
        `- **Chaves editáveis:** ${fields.length ? fields.map((field) => `\`${code(field)}\``).join(", ") : "nenhuma declarada"}`,
        "- **Formato:** conteúdo JSON; os valores podem ser texto, número, booleano, lista, objeto ou nulo, sujeitos aos limites abaixo.",
      ].join("\n");
    })
    .join("\n\n") || "Não existem secções visíveis com capacidades CMS neste snapshot.";
  const editing = cmsIncluded
    ? "Esta entrega inclui um CMS dedicado a este projeto. O editor trabalha com JSON por secção, não com controlos visuais campo a campo. Só são aceites as chaves listadas em GUIA-CMS.md."
    : "Esta entrega não inclui CMS, autenticação nem uma conta de edição. Não existe um CMS oculto no pacote. Alterações ao conteúdo ou à estrutura exigem intervenção técnica e nova publicação, segundo o serviço acordado.";
  const leadHandling = cmsIncluded
    ? "Os pedidos submetidos são consultáveis na área Contactos do CMS. Este runtime não envia notificações automáticas de lead por email."
    : "O envio de notificações depende da configuração indicada em FORMULARIOS-E-CONFIGURACAO.md. Faça um envio de teste controlado e confirme o destinatário antes de divulgar o site.";
  const deliveryProfile = delivery
    ? [
        `- **Gestão do site:** ${ownerLabels[delivery.siteManagementOwner]}`,
        `- **Alojamento:** ${ownerLabels[delivery.hostingOwner]}`,
        `- **Domínio:** ${ownerLabels[delivery.domainOwner]}`,
        `- **Conteúdo:** ${ownerLabels[delivery.contentOwner]}`,
        `- **Publicação:** ${ownerLabels[delivery.publishingOwner]}`,
        `- **Manutenção registada:** ${maintenanceLabels[delivery.maintenancePlan]}`,
        `- **Âmbito registado:** ${delivery.maintenanceScope ? markdown(delivery.maintenanceScope) : "Por confirmar na proposta/contrato"}`,
        `- **Canal registado:** ${delivery.maintenanceChannel ? markdown(delivery.maintenanceChannel) : "Por definir com o cliente"}`,
        `- **Janela registada:** ${delivery.maintenanceWindow ? markdown(delivery.maintenanceWindow) : "Por definir com o cliente"}`,
      ].join("\n")
    : "Responsabilidades e manutenção não foram fornecidas ao gerador. Preencher a partir do Project e confirmar contra a proposta/contrato antes de enviar.";

  const cmsGuide = cmsIncluded
    ? `# Guia do CMS deste projeto

## Acesso

- **Endereço:** \`https://<domínio-validado>/cms/login\` (substituir pelo endereço publicado).
- **Acesso inicial:** enviar convite individual por canal seguro; nunca inserir passwords neste documento.
- **Versão do template:** \`${code(payload.templateVersion)}\`
- **SHA-256 do snapshot:** \`${composition.sourceChecksum}\`

## Conteúdo e campos editáveis

O CMS permite editar o JSON de cada secção apresentada abaixo. A lista vem do manifesto imutável do snapshot e é validada pelo runtime. Não adicione chaves, remova secções ou altere a estrutura do JSON.

${cmsSections}

## Limites validados pelo editor

- Texto: máximo de 5 000 caracteres por valor.
- Listas: máximo de 100 elementos; objetos: máximo de 100 propriedades.
- Profundidade máxima da estrutura: 6 níveis.
- As chaves editáveis são as listadas acima; \`settings\`, SEO, branding e estrutura de secções não são apresentados como editáveis neste CMS.
- Estes são limites técnicos máximos, não uma recomendação de conteúdo nem garantia de boa apresentação com 100 itens. Validar o preview em mobile e desktop; conteúdos extensos podem exigir apoio técnico.

## Formulários, contactos e media

Os formulários e campos são fixados no pacote. O CMS permite ativar/desativar cada formulário, mas não editar os seus campos. Os pedidos aparecem em **Contactos** e o estado pode ser atualizado; não há notificações automáticas por email.

A Biblioteca de media permite carregar imagens autorizadas. O upload não atualiza automaticamente a página: introduza a URL na chave JSON correspondente e confirme o resultado. Não elimine imagens ainda usadas no conteúdo.

## Publicação e apresentação

O CMS permite alternar a página entre rascunho e publicada. SEO e branding estão fixados no pacote e não têm editor nesta instalação. O layout responsivo pertence ao template; não existe um controlo de breakpoint no CMS. Reveja alterações em mobile e desktop antes de publicar.

## Apoio

Use o canal e o âmbito indicados no handover aprovado. Os dados de manutenção registados no Project devem ser confirmados contra a proposta/contrato.`
    : null;

  const handover = `# Handover do pacote

> Minuta gerada a partir do pacote e da configuração atual do Project. Rever e completar após publicação; não é contrato nem prova de aceitação.

## Identificação

- **Site:** ${markdown(payload.page.title)}
- **Modo:** ${cmsIncluded ? "Landing + CMS" : "Landing Only"}
- **Template/variante:** ${markdown(template.key)} / ${markdown(template.variantKey)}
- **Versão:** ${markdown(payload.templateVersion)}
- **SHA-256 do snapshot:** \`${composition.sourceChecksum}\`
- **Domínio/URL publicada:** preencher após configuração e verificação.
- **Data de entrega/publicação:** preencher após execução.

## Responsabilidades registadas

${deliveryProfile}

Confirme cada responsabilidade e condição contra a proposta/contrato aprovado. A exportação não publica o site nem comprova que domínio, DNS, SSL, formulários, backups ou CMS foram testados no destino.

## Acessos

${cmsIncluded ? "CMS dedicado incluído. Inserir a URL publicada e indicar o método de convite individual; nunca incluir passwords, tokens ou chaves." : "Não existe CMS nem acesso de edição neste pacote."}

## Verificação pós-publicação

Preencher a checklist após testar o domínio real. Registar quem aprovou conteúdo e release, pendências aceites e confirmação de entrega pelo processo acordado.
`;

  return {
    "client-docs/RESUMO-DA-ENTREGA.md": `# Resumo da entrega

## Identificação do artefacto

- **Site/página:** ${markdown(payload.page.title)}
- **Template:** ${markdown(template.key)}
- **Variante:** ${markdown(template.variantKey)}
- **Versão do runtime:** ${markdown(payload.templateVersion)}
- **Modo:** ${cmsIncluded ? "Landing + CMS dedicado" : "Landing Only"}
- **SHA-256 do snapshot:** \`${composition.sourceChecksum}\`

Este resumo é gerado a partir do snapshot incluído no pacote. Não substitui proposta, contrato, aceitação do cliente nem confirmação de publicação.

## Secções incluídas

${sectionList}

## Formulários e campos incluídos

${forms}

## Identidade visual incluída

${brandSettings}
As cores e tipos acima são os valores do tema exportado. Não existe editor de branding no CMS desta entrega.

## SEO incluído

${seo}
Os metadados descrevem a configuração exportada; não garantem indexação, posicionamento nem tráfego. Confirmar domínio/canonical e apresentação nos motores de pesquisa após publicação.

## Integrações e notificações

${integrationNotes}

## Edição e alterações

${editing}

## Formulários recebidos

${leadHandling}

## Responsabilidades e manutenção

${deliveryProfile}

Confirme estes dados contra a proposta e complete o handover. A exportação não compra domínio, configura DNS, cria alojamento nem publica o site. Reveja DEPLOYMENT.md e ANTES-DE-PUBLICAR.md; os avisos legais do pacote não são aconselhamento jurídico.
`,
    "client-docs/FAQ.md": `# Perguntas frequentes

## Posso editar o site?

${editing}

## Posso acrescentar avaliações, perguntas frequentes ou itens de menu sem limite?

Não. Só as chaves declaradas no guia CMS podem ser alteradas. Os limites técnicos são máximos do validador e não garantem que listas extensas tenham apresentação adequada. A estrutura de secções exige alteração técnica.

## Como altero imagens ou textos?

${cmsIncluded ? "Use as chaves indicadas em GUIA-CMS.md. O editor exige JSON válido; valide o preview antes de publicar. O upload de media não associa automaticamente a imagem ao conteúdo." : "Envie o pedido pelo canal definido no handover. A alteração é feita na fonte técnica e requer nova publicação."}

## Como são tratados os pedidos do formulário?

${leadHandling}

## O site já está publicado e o domínio configurado?

Não necessariamente. O handover é uma minuta e a checklist fica por assinalar até serem executados testes no domínio real.

## Quem trata de manutenção e em quanto tempo responde?

Consulte as responsabilidades registadas e confirme-as contra a proposta/contrato. Este pacote não cria prazos nem um plano de manutenção.

## Posso enviar passwords ou chaves por email?

Não. Use convites individuais e um canal seguro acordado. Nunca inclua passwords, tokens ou chaves API em documentos partilhados.

## O SEO garante posições nos motores de pesquisa?

Não. Metadados técnicos não garantem indexação, posições, tráfego ou resultados comerciais.
`,
    "client-docs/CHECKLIST-DE-ENTREGA.md": `# Checklist de entrega e pós-publicação

Esta checklist só deve ser assinalada após execução do teste no destino real. Registe responsável, data e evidência no processo interno.

## Antes de publicar

- [ ] Confirmar modo, template/variante, versão e SHA-256 do snapshot.
- [ ] Confirmar aprovação do conteúdo e direitos de logótipos, imagens, testemunhos e marcas.
- [ ] Rever páginas legais com o responsável competente.
- [ ] Configurar domínio, DNS, HTTPS e variáveis no destino escolhido.
- [ ] Confirmar remetente/destinatário e testar o formulário.
- [ ] Confirmar consentimento, anti-spam e tratamento de erros.
- [ ] Rever navegação, links, acessibilidade básica, mobile e desktop.
- [ ] Rever SEO técnico sem prometer resultados de posicionamento.
${cmsIncluded ? "- [ ] Confirmar base de dados dedicada, acesso individual, permissões e recuperação CMS.\n- [ ] Confirmar backups/restauro e testar edição/publicação com conteúdo não sensível.\n- [ ] Confirmar processo de consulta de leads; este runtime não envia notificações automáticas por email.\n" : "- [ ] Confirmar que o pacote não contém CMS, autenticação nem dashboard.\n"}
## Depois de publicar

- [ ] Abrir o domínio público e confirmar HTTPS, conteúdo, imagens e navegação.
- [ ] Repetir o teste do formulário no domínio público e confirmar o processo de receção/armazenamento.
- [ ] Registar URL, data, versão e resultado no handover.
- [ ] Confirmar responsáveis por domínio, alojamento, leads e alterações.
- [ ] Entregar apenas documentos aplicáveis e remover instruções internas/campos por preencher.
- [ ] Registar pendências aceites e confirmação de entrega pelo processo acordado.

Não assinale publicação, backup, rollback, email, CMS ou integração como validados sem executar o teste no destino efetivo. Não inclua credenciais nem dados reais de leads.
`,
    "client-docs/HANDOVER.md": handover,
    ...(cmsGuide ? { "client-docs/GUIA-CMS.md": cmsGuide } : {}),
  };
}
