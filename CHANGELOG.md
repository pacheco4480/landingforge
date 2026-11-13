# Changelog

Notable project changes are recorded here by task and date.

## 2026-11-11

### Bakery Playful QA — rota pública e capturas
- Corrigida a invalidação imediata do cache público ao alterar o estado/visibilidade de uma demo; também são invalidados o slug atual e, se mudar, o slug anterior.
- Adicionado teste de regressão para a invalidação das rotas e da tag pública.
- Capturadas localmente as secções Bakery Playful para referência do portfolio. A demo na BD QA foi restaurada a `READY` e oculta; não houve publicação externa nem utilização da BD principal.

## 2026-11-10

### TASK 050B — Identidade do shell Master (implementação parcial)
- O wordmark LandingForge foi harmonizado entre sidebar desktop e cabeçalho móvel, com descrição funcional para a área operacional. O Client CMS e os templates públicos mantêm identidade separada.
- Teste unitário do lockup adicionado. A task continua Partial até inspeção visual com viewports CSS desktop/mobile controlados e revisão dos estados interativos.

### TASK 050D — Formulários, feedback e idioma (Concluída)
- Adicionados controlos estruturados no editor de campos Forms para opções de escolha, validações comuns e regras condicionais, mantendo o payload persistido existente. Strings tocadas em Forms e autenticação foram localizadas para PT-PT.
- `ActionFeedbackForm` recebeu proteção opt-in contra submissão duplicada, ativada somente nos formulários de gestão Forms; os restantes consumidores mantêm o comportamento anterior.
- Testes focalizados (13/13), suite (94 ficheiros passaram, 10 skipped; 342 testes passaram, 25 skipped, excluindo `auth.integration.test.ts` por depender de utilizadores reais da BD configurada), lint, typecheck e build QA passaram. O build confirmou `landingforge_qa`; sem migrations, seeds ou escritas. Permanecem 12 avisos preexistentes de tracing dinâmico no assembler de pacotes.
- Reteste autenticado em `:3021`: `/forms` observado em 1280×720 CSS px, DPR 1. SELECT/RADIO, adição local de opção/regra e disclosure avançada foram testados; Tab moveu foco com outline visível e Enter/Space abriram/fecharam a disclosure. O erro `mínimo 8 > máximo 3` foi apresentado numa região `role=alert`/`aria-live=polite` e preservou os valores; anúncio efetivamente percebido por leitor de ecrã não foi confirmado. Campo QA sintético foi gravado (loading/sucesso), removido pela UI e confirmado ausente após recarga; fixture restaurada com 9 campos. Teste de clique duplo rápido em “Adicionar campo” resultou num único registo; este foi removido pela UI e a fixture voltou a 9 campos após recarga. Consola sem erros/avisos. Em 390×844 CSS px, DPR 1, o editor empilhou os grupos sem overflow horizontal; override temporário removido. A alínea permanece Partial: confirmação por leitor de ecrã não verificada. A tentativa de dev em `:3021` ficou bloqueada a compilar `/forms`; a instância de produção QA em `:3037` iniciou, mas o browser integrado expirou ao abrir o formulário. Instâncias iniciadas nesta tentativa paradas.

### Reteste final da TASK 050D — 2026-11-10
- A região de erro foi corrigida para permanecer montada, com `role="alert"`, `aria-live="assertive"` e `aria-atomic="true"`; `tests/action-feedback-accessibility.test.ts` verifica a estrutura persistente.
- Com o Narrador do Windows ativo, o utilizador confirmou ouvir “Revê os valores mínimo e máximo; o mínimo não pode exceder o máximo.” no caso de limites inválidos. A operação não persistiu o campo sintético e a fixture QA permaneceu com 9 campos.
- Lint, typecheck, suite (95 ficheiros aprovados, 10 skipped; 343 testes passaram, 25 skipped) e build QA passaram. O build manteve 12 avisos de tracing dinâmico. Sem migrations/seeds, sem escrita na BD principal; servidor QA parado. 050D concluída no âmbito aprovado, sem alegação de conformidade WCAG.

### TASK 050E — Reconciliação das demos persistidas (Concluída)
- Comparação read-only na BD local `landingforge` confirmou que os alvos nomeados de UX-06 não têm contactos públicos preenchidos e identificou divergências de conteúdo Clinic Modern/Restaurant Playful face ao seed.
- Após aprovação explícita, foram atualizados somente seis campos nas duas secções autorizadas, com estado anterior guardado em `.landingforge/qa/task-050e/` e verificação read-only pós-commit. Sem seed integral, migration, publicação ou alteração de recipients.
- A variante Real Estate Luxury apresentou caminhos de contacto adicionais fora do alvo explícito; não foi alterada e está documentada para decisão de escopo separada. Sem validação visual pós-atualização.

### TASK 050C — Verificação curta de teclado e autenticação QA

- Verificada pela interface a sequência de foco do formulário de login (Email, Palavra-passe, Entrar, recuperação), com indicador de foco visível. A sessão Client CMS não foi obtida; por isso, teclado/auditoria axe do editor e viewport CSS móvel continuam bloqueados e a alínea permanece Partial.
- Corrigido apenas o ambiente do processo de QA: a instância de teste foi reiniciada com `CLIENT_CMS_RATE_LIMIT_SECRET` efémero após o log revelar a configuração ausente; a conta sintética continuou a ser rejeitada. Consulta read-only confirmou que a conta está ativa e associada ao Project esperado, sem consultar hash. Nenhuma password, conta, permissão ou conteúdo foi alterado. BD principal não usada; instância iniciada nesta passagem parada.

### TASK 050C — Reteste autenticado do editor

- Os logs confirmaram que o `next dev` existente em `:3046` carecia de `CLIENT_CMS_RATE_LIMIT_SECRET`; foi reiniciado com o segredo efémero e variáveis QA mínimas, depois de validar a ligação à BD descartável. O utilizador entrou com sucesso.
- No editor Client CMS, foi exercitado por teclado o foco e o comando de mover item numa lista; a mudança ficou apenas no estado não guardado e o reload confirmou a ordem original. Não houve gravação nem publicação.
- O viewport CSS móvel e a auditoria axe continuam parciais: a tab não permitiu emulação/medição de viewport e o runner disponível não inclui Playwright para axe. A BD principal não foi usada.

### TASK 050C — Reteste da coleção repetível no Client CMS

- Pela interface do pacote sintético Restaurant · Playful, validada a reordenação, criação, persistência após recarga e remoção de um item da coleção “Itens do menu”; os três itens e a ordem iniciais foram restaurados e confirmados após recarga.
- A página permaneceu em rascunho. O teste decorreu apenas na BD descartável `landingforge_qa_050c_client_install_20261109`; a BD principal não foi usada. O servidor de inspeção foi parado.
- Evidência visual raster aproximada 648×690 px; CSS viewport/DPR não medidos. Restam cobertura das restantes coleções/famílias/variantes, limite máximo, acessibilidade formal e medição responsiva. TASK 050C permanece Partial.
- Ao testar “Testemunhos e avaliações”, a validação nativa `type=url` bloqueou a gravação por causa de um caminho de imagem legado relativo (`/assets/...`). O componente estruturado partilhado foi corrigido para aceitar caminhos relativos no UI, mantendo validação server-side e tipos adequados para email/números; teste de regressão e validação focal passaram. A suite completa teve um timeout transitório no materializador do pacote, aprovado ao repetir isoladamente. Falta reexportar e retestar o pacote atualizado pela UI; a fixture QA ficou intacta e 050C continua Partial.
- Reexportado pela UI Master QA o pacote corrigido: 116 ficheiros, ~2,0 MB, SHA-256 `5f658a7528ea820a71ac82258629f93e0e2383a6a49f29ef2e7d1b68bd5f405e`. A transferência foi iniciada; localização e teste do pacote aguardam confirmação do utilizador. As permissões temporárias da role QA foram restauradas exatamente ao estado anterior; projeto e publicação não foram alterados. TASK 050C permanece Partial.
- Reteste concluído no pacote extraído `E:\Documentos\Transferências\landingforge-8c1f2456-781a-4d47-a0f4-e40ff6a34135`: instalação npm (100 pacotes, zero vulnerabilidades), typecheck e build passaram. Na BD descartável `landingforge_qa_050c_client_install_20261109`, a UI guardou e recarregou um quarto testemunho sintético com imagem relativa `/assets/qa-050c-relative-review.avif`; removeu-se apenas esse item, restaurando e confirmando os três originais também na pré-visualização privada. Sem publicação, seed ou acesso à BD principal. Corrigido o bloqueio de URL relativa para o caso testado; 050C permanece Partial pelas restantes lacunas de cobertura e validação.
- Continuado o teste pela UI da coleção “Detalhes” de Reservas: criação, gravação, persistência após recarga, remoção e restauro dos três valores originais confirmados no preview privado. Testes automatizados cobrem round-trip/preview para Clinic, Real Estate, Bakery e Gym, dados legados, versão divergente, capabilities e tipo de secção incompatíveis, limite FAQ 30/31 e conteúdo/capabilities/versão no pacote exportado. `npm run test:client-cms:isolation` passou 11/11 num PostgreSQL descartável temporário; lint e typecheck passaram; suite completa: 95 ficheiros passaram, 10 skipped; 343 testes passaram, 25 skipped. A cobertura visual continua apenas Restaurant · Playful; o pacote não foi reiniciado porque o `.env.local` QA privado já não existe. Sem medições CSS nem auditoria formal de acessibilidade. TASK 050C permanece Partial.
- Reaberto o login do pacote QA em `127.0.0.1:3046` com configuração temporária no processo e ligação confirmada apenas à BD descartável; `/cms/login` respondeu HTTP 200. Não houve sessão autenticada nesta observação, e o servidor foi parado sem escrita de conteúdo. A cobertura visual/acessibilidade continua parcial.

- Reteste autenticado final: o editor do pacote ligado apenas a `landingforge_qa_050c_client_install_20261109` mostrou oito secções estruturadas, campos nomeados/ajuda/limites e coleções repetíveis. O campo “Nome da marca” foi editado, guardado, confirmado após recarga e observado na pré-visualização privada; o valor original foi restaurado e confirmado no editor e preview. A página permaneceu em rascunho, sem publicação. Viewport CSS observado: 1280×720, DPR 1; a tentativa de emular viewport móvel não teve efeito. Sem auditoria axe/teclado completa. Servidor parado e porta 3046 sem listener; BD principal intocada. 050C continua Partial.

## 2026-11-09

### TASK 050C — Edição estruturada de conteúdo

- Substituídos os campos JSON de conteúdo nos editores Master e Client por controlos partilhados por catálogo semântico, incluindo texto, URLs/imagens/alt e listas; capabilities novas expõem apenas chaves suportadas e snapshots legados continuam legíveis.
- Validação server-side limita alterações às chaves permitidas, mantém os campos técnicos/legados intactos e preserva campos desconhecidos dos itens ao editar/reordenar coleções. Não houve alteração ao JSONB/schema nem a dados.
- Adicionados perfis com campos obrigatórios e limites específicos para FAQs, testemunhos e destaques de menu, e IDs/nome acessível únicos para os campos de coleções.
- Reconciliados estaticamente exemplos dos seeds de clínica, imobiliário, restaurante, ginásio e pastelaria; adicionadas coberturas para estatísticas, imóveis, profissionais e prova social, mantendo brand kit/cor de marca fora da edição editorial comum.
- Criada `docs/UI_UX_CONTENT_EDITOR_FIELD_MATRIX_050C.md`. Lint, typecheck, suite completa (95 ficheiros passaram, 10 skipped; 329 testes passaram, 25 skipped) e build QA passaram; o build usou exclusivamente `landingforge_qa`, sem migrations ou seeds, com 12 avisos existentes de tracing dinâmico. O teste de montagem do pacote Client CMS passou com timeout ajustado de 20 para 45 segundos após exceder o limite apenas sob a carga da suite completa; isoladamente terminou em menos de 14 segundos.
- Inspeção autenticada Master em `/content/875b7af4-08aa-4dc0-ab6d-674b0dd34f2d`: campos de Hero e ajuda contextual observados; preview Desktop/Mobile carregou e manteve o conteúdo. Não foram guardados dados. Captura inline raster 759×690; CSS viewport/DPR não medidos. A fixture disponível não cobre coleções repetíveis e não foi possível abrir um Client CMS correspondente.
- Reteste autenticado na mesma BD QA criou pela UI a página sintética em rascunho `QA 050C — Conteúdo repetível` (`fc5dfe23-accb-4a7f-b142-44e77d4ea52d`). FAQ com segundo item foi editada/guardada e confirmada no preview Desktop e no preset Mobile; labels por item, ajuda, limites e contador foram observados. Nenhuma publicação ocorreu. Captura inline raster 759×690; CSS viewport/DPR não medidos.
- Testes de regressão alinharam a validação server-side dos perfis FAQ, avaliação e menu com limites e obrigatoriedade da UI, sem bloquear campos legados vazios inalterados. A filtragem de segurança agora permite `credentials`/`credential` editoriais de Clínica e continua a excluir `authToken`/`apiKey`.
- Corrigida a edição numérica de coleções: apagar o valor deixa-o vazio para validação, em vez de o converter silenciosamente em `0`; teste unitário cobre vazio, zero e decimal.
- Revalidação final: lint/typecheck passaram; suite completa (95 ficheiros passaram, 10 skipped; 332 testes passaram, 25 skipped) e build pelo launcher QA passaram. Build confirmou `landingforge_qa` e emitiu 12 avisos conhecidos de tracing dinâmico. A tentativa de abrir `/projects` para obter fixture Client redirecionou a `access-denied` (403); permissões e estado comercial não foram alterados. 050C permanece Partial.
- A matriz ainda requer conferência por template/variante, outras coleções e inspeção visual do Client CMS; remoção/limite não foram exercitados. A alínea permanece Partial.
- Continuação autenticada QA: observados pela interface a cópia privada sintética `Restaurant · Playful` e o editor de conteúdo Master; sem gravação ou publicação. A suite de isolamento tenant passou 11/11 após alinhar uma expectativa de mensagem com o copy atual. Exportação/auditoria do pacote Client CMS registou 116 ficheiros (~2,0 MB) e checksum `216e65b5d21e17e68402b0f7f618f493d7faca6c9c59aca66a5d06bebfc3424a`; ZIP não localizado, pelo que instalação e validação visual Client permanecem bloqueadas. Papel QA temporário removido; BD principal não usada. TASK 050C continua Partial.
- Continuação após o utilizador localizar o ZIP: pasta extraída confirmada. `npm ci` instalou 100 pacotes e encontrou 0 vulnerabilidades; `npm run typecheck` e `npm run build` passaram. `/cms/login` abriu no browser integrado. Sem BD ou administrador inicial, não foi possível autenticar nem testar o editor Client; nenhum login foi submetido e a BD principal não foi usada. 050C permanece Partial.
- Preparação adicional QA: criada a BD isolada `landingforge_qa_050c_client_install_20261109` em PostgreSQL local e aplicadas as duas migrations do pacote; sem seeds. `.env.local` privado aponta apenas para essa BD, contém segredos aleatórios e mantém vazia a palavra-passe do administrador para entrada local pelo utilizador. Servidor sem BD parado; login e editor ainda por testar. BD principal intocada; 050C permanece Partial.
- Bootstrap Client QA concluído pelo utilizador depois de definir localmente a palavra-passe temporária. Consulta read-only confirmou uma instalação, um administrador ativo e uma página sintética na BD dedicada. Login aberto em `127.0.0.1:3002`; aguarda-se autenticação pelo utilizador para observar o editor. Nenhum segredo foi exposto e a BD principal permanece intocada.
- Reteste autenticado do pacote em `127.0.0.1:3002`: dashboard confirmou fixture sintética `QA 050C Synthetic Studio` (`restaurant/playful@1.0.0`), oito secções e um formulário. Na secção “Destaques do menu”, o campo estruturado “Texto de introdução” foi editado pela UI, guardado, confirmado após recarga e visto na pré-visualização privada. O texto original foi reposto, guardado e confirmado após nova recarga. Página permaneceu em rascunho; nenhuma publicação ocorreu. Tudo decorreu na BD descartável `landingforge_qa_050c_client_install_20261109`; a BD principal não foi usada. Captura inline raster 759×690 px, sem medição de CSS viewport/DPR. 050C continua Partial: falta cobertura das restantes famílias/variantes, coleções e layouts, entre outros critérios.

### TASK 050B — Tokens base do Client CMS

- Corrigida a folha CSS gerada do Client CMS para incluir os tokens semânticos consumidos pelos respetivos ecrãs, alinhados com a paleta base do Master CMS.
- Acrescentado teste de regressão na montagem do pacote.
- Lint, typecheck, testes (320 passaram, 25 skipped) e build QA passaram; o build usou apenas `landingforge_qa` e manteve 12 avisos existentes de tracing.
- Estado da alínea: Partial enquanto faltar inspeção visual autenticada desktop/mobile das superfícies Master e Client.
- Continuação autenticada: observados Dashboard e Forms no Master CMS em build QA; o shell parece consistente na captura inline, mas não foi possível medir CSS viewport nem configurar desktop/mobile. Client CMS atualizado permanece sem inspeção visual. Forms apresenta strings em inglês para triagem pela 050D. Estado continua Partial.
- Continuação adicional: foi gerado, compilado e aberto no browser o login de um Client CMS atual, a partir de snapshot QA sintético e sem BD; tokens e CTA verde renderizam. Capturas Master/Client foram observadas, mas o browser não permitiu medir CSS viewport nem fazer emulação móvel, e o dashboard Client não foi autenticado. Servidores parados; 050B continua Partial.
- Reteste QA adicional: Viewer autenticado observou Dashboard, Pages e Forms; ações de configuração ficaram read-only/disabled, sem alterações de conteúdo. A pré-visualização local do formulário foi apenas inspecionada, não submetida. Screenshot Forms 759×690 px raster, sem medida CSS/DPR nem mobile. Textos mistos em Forms foram registados para 050D. A credencial sintética foi reposta com autorização, apenas na BD QA; servidor parado. 050B permanece Partial.
- O dashboard atual do Client CMS foi observado autenticado em pacote temporário montado e compilado independentemente. Foi necessário usar `next dev`: `next start` recusou corretamente a BD localhost em modo production. O utilizador concluiu o reset e o login; a consulta read-only confirmou o token consumido. Captura 774×690 px raster, sem CSS viewport/DPR ou mobile; focus/hover não foram revistos sistematicamente. Sem alterações a conteúdo; pacote e servidor QA removidos/parados. 050B permanece Partial.
- Reteste focado de `tests/client-cms-package.test.ts`: 2 passaram e 2 skipped; aviso `configLoader: native` não bloqueante.

### TASK 049E — Client CMS resilience and structured editing

- Added an intentional internal-demo unavailable state while preserving the existing authorization boundary.
- Added typed, non-sensitive Client CMS media errors and accessible recoverable upload feedback; successful uploads expose the public URL for use in section image fields.
- Added structured Portuguese (Portugal) editing for existing FAQ/reviews/menu repeaters and six Restaurant Playful section types, retaining the persisted content contract and validated JSON for remaining types.
- Added deterministic regressions for disabled demos, media provider errors, content round-trip/unknown-field preservation, section validation and generated package source.
- Automated validation passed: lint, typecheck, 93 test files passed (10 skipped; 320 tests passed, 25 skipped), and production build. The build used the guarded `landingforge_qa` launcher and retained 12 existing dynamic-filesystem tracing warnings.
- No schema, seed, permission, publication or persistent customer data changed. An authenticated desktop/mobile browser review and live Storage retest were not available in this run; deterministic provider tests remain independent of those external checks.

### TASK 049D — Demo editorial and visual consistency

- Improved Bakery Playful featured CTA text and keyboard-focus contrast, with focused CSS contrast tests.
- Clarified Restaurant Playful sample menu currency and per-item pricing in the seed content.
- Removed public agent phone/email fields from the Real Estate Premium demo seed; internal form recipients were left unchanged.
- Corrected the Clinic Modern hero after authenticated runtime inspection showed the persisted image depicted a surgical team. Seed and the matching QA fixture now use an Unsplash image described as a doctor speaking with a patient; the reopened preview confirmed the replacement image and aligned alt text.
- Targeted transactions updated only the named Contact/Team fields, Restaurant Playful Menu and Clinic Modern Hero in `landingforge_qa`; no full seed was run, and the primary database/publication state was untouched.
- Authenticated CMS/preview checks confirmed the Bakery Playful CTA, Restaurant Playful pricing, Real Estate Premium agent cards and Clinic Modern hero. Browser preview Desktop/Mobile modes were used where available; the outer browser viewport was about 648 px and no 1440 px screenshot was archived. No screenshot of the final Clinic recheck was archived.

## 2026-11-08

### TASK 049C — CMS comprehension, navigation and PT-PT

- Clarified that Dashboard page/contact metrics are global and kept existing server calculations unchanged.
- Filtered Dashboard quick links through existing read permissions and hid Branding write controls for read-only roles.
- Added Escape dismissal and focus restoration to the Master CMS mobile disclosure.
- Localized identified CMS navigation, Dashboard, Pages/content editor, SEO, Branding, Settings, Analytics and section-type labels to PT-PT without changing persisted keys or server contracts.
- Corrected remaining legacy spellings and mixed-language SEO help found in the authenticated review; legal page options are presented with current PT-PT labels without changing stored values.
- Added regressions for permission-filtered quick links, supported section labels, PT-PT UI copy, SEO guidance and keyboard disclosure behavior.
- Automated validation passed. Authenticated visual retest observed Super Admin surfaces; exact viewport and Viewer checks were still pending at the time.
- Reproduced and fixed a real `/settings` horizontal clipping issue at 390 CSS px by making the base grid track explicitly shrinkable; preserved the existing two-column `lg` layout.
- Revalidated Dashboard, Branding, SEO and content editor at exact 1440×900 and 390×844 CSS viewports; Settings additionally passed 768×1024 and 648×900. Document/main widths showed no horizontal overflow after the fix.
- Confirmed mobile CMS navigation closes on Escape and restores focus. Viewer was not observed in runtime; existing automated permission tests remain evidence for its affordances. QA data and RBAC were not changed.
