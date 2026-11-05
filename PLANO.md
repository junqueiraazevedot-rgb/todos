# Plano do Projeto — App de Saúde da Família

2026-10-19 · @Carlos

## Visão geral e objetivos

Um app pessoal (PWA) que guarda a memória de saúde completa de cada membro da família, humanos e pets, com documentos lidos por IA, pendências que não se perdem e lembretes automáticos. Projeto 100% pessoal, sem nenhuma infraestrutura da empresa.

Objetivos:

- Registrar tudo de saúde de cada membro: consultas, receitas, exames, avaliações físicas, vacinas, medidas, sintomas, procedimentos, gastos, incluindo o histórico anterior ao app.
- Nenhuma consulta fica "solta": toda consulta passada fica pendente até ser encerrada com comparecimento, resumo e encaminhamento.
- Receita vira calendário de doses com lembretes e registro de cada dose tomada.
- IA lê fotos e PDFs (receitas, pedidos e resultados de exame, carteira de vacina) e preenche os dados para revisão humana.
- Arquivos originais organizados automaticamente no Google Drive pessoal.
- Linha do tempo por membro e gráficos de evolução dos exames.

Fora do escopo da primeira versão: integração com convênios, telemedicina, compartilhamento com médicos (pode virar fase futura).

## Stack e arquitetura

Front estático na Hostinger pessoal e todo o back-end no Supabase pessoal, sem servidor próprio nem n8n.

| Camada | Tecnologia | Custo |
|---|---|---|
| Front | React + Vite + TypeScript + Tailwind, PWA (vite-plugin-pwa) | Hospedagem que você já tem |
| Hospedagem | Subdomínio na Hostinger pessoal, SSL grátis, deploy por GitHub Action via FTP | — |
| Banco e login | Supabase free: Postgres, Auth, RLS | Grátis |
| Lógica de servidor | Supabase Edge Functions (Deno/TypeScript) | Grátis (500 mil chamadas/mês no plano free) |
| Agendamentos | pg_cron + pg_net no Supabase | Grátis |
| Arquivos | Google Drive pessoal via API (OAuth) | Cota do seu Drive |
| Agenda | Google Agenda pessoal via API | Grátis |
| IA | OpenAI API, modelo com visão, chave pessoal | Centavos por documento |
| Avisos | Web Push (VAPID) e/ou bot do Telegram | Grátis |

O app nunca chama Google ou OpenAI direto: tudo passa pelas Edge Functions, que guardam os segredos.

## Membros e perfis

Cada membro tem um perfil do tipo humano ou pet; os módulos se adaptam ao tipo.

| Membro | Tipo | Observação |
|---|---|---|
| Você | Humano | Titular, administrador |
| Eduarda | Humano | Administradora |
| Bella | Humano | Bebê: curva de crescimento e calendário vacinal infantil |
| Adir | Humano | Pode ter acesso só de leitura |
| Mayta | Humano | Pode ter acesso só de leitura |
| Chanel | Pet (cão) | Vira-lata |
| Bartô | Pet (gato) | Gato dos sogros |

**Ficha fixa de humanos:** nome, data de nascimento, sexo, tipo sanguíneo, foto, CPF (opcional), cartão SUS, convênio e número da carteirinha, alergias, condições crônicas, cirurgias anteriores, medicamentos de uso contínuo, histórico familiar, médicos de referência, contatos de emergência.

**Ficha fixa de pets:** nome, espécie, raça, sexo, data de nascimento (ou estimada), cor, microchip, castrado (sim/não e data), peso atual, alergias, condições crônicas, veterinário de referência, plano de saúde pet.

**Acesso:** cada usuário do app (login) tem permissão por membro: administrador (edita tudo), editor ou leitor.

## Módulos funcionais e regras de negócio

São 16 módulos; os marcados com (H) são só humanos e (P) só pets.

1. **Consultas** — especialidade, profissional, local, data/hora, motivo, modalidade (presencial/online), convênio ou particular. Status: a agendar, agendada, aguardando encerramento, faltou, cancelada, encerrada. O encerramento registra comparecimento, resumo e encaminhamentos (retorno, receita, pedido de exame, especialista).
2. **Pendências** — tudo que aguarda ação, aberto e fechado automaticamente pela cadeia de pendências (ver Fluxos). Cada pendência tem membro, origem, prazo e status: aberta, resolvida ou dispensada com motivo.
3. **Receitas** — data, profissional, consulta de origem, arquivo. Itens: medicamento, concentração, forma, dose, via, frequência, horários, duração (dias) ou uso contínuo, instruções ("em jejum", "após refeição"). Regra: só gera doses após confirmação manual.
4. **Doses (calendário de medicamentos)** — geradas a partir dos itens da receita. Status: pendente, tomada, pulada, atrasada. Regra: lembrete no horário e novo aviso 30 min depois se não marcada.
5. **Estoque de medicamentos** — quantidade em casa, consumo por dia, aviso quando restar menos de 7 dias (uso contínuo).
6. **Pedidos de exame** — data, profissional, exames pedidos. Status: a agendar, agendado (data, local, preparo), aguardando resultado, resultado recebido. Regra: todo pedido de exame obriga um retorno na consulta de origem.
7. **Resultados de exame** — laboratório, data da coleta, arquivo. Cada valor vira uma medição ligada ao catálogo de parâmetros (valor, unidade, faixa de referência, alterado sim/não), o que permite acompanhar qualquer parâmetro por anos, mesmo vindo de laboratórios diferentes.
8. **Catálogo de parâmetros** — lista padronizada de tudo que se mede: sangue, urina, imagem com números, avaliação física, sinais vitais, crescimento. Cada parâmetro tem nome padrão, sinônimos ("TGO" = "AST"), unidade padrão, conversões, categoria e faixas de referência por sexo, idade e espécie. A IA mapeia o nome do laudo para o parâmetro; nomes novos vão para revisão.
9. **Avaliações físicas** — data, avaliador (personal, nutricionista, médico do esporte), método (bioimpedância, dobras cutâneas, DEXA), arquivo. Parâmetros: peso, altura, IMC, % de gordura, massa magra, massa muscular, gordura visceral, água corporal, taxa metabólica basal, dobras, perímetros (cintura, quadril, braço, coxa), pressão e frequência cardíaca de repouso, VO2 máx, testes de força e flexibilidade. Tudo gravado como medições no mesmo catálogo.
10. **Medidas avulsas** — peso, pressão, glicemia, temperatura, frequência cardíaca; para a Bella, altura e perímetro cefálico (curva de crescimento). Também usam o catálogo.
11. **Vacinas** — vacina, dose, data, lote, local, próxima dose prevista. Calendário infantil para a Bella (H) e protocolo pet: V8/V10, antirrábica, gripe, giárdia (cães), V3/V4/V5 e antirrábica (gatos) (P).
12. **Sintomas / diário** — data/hora, descrição, intensidade, temperatura, medicação dada. Útil para levar à consulta.
13. **Procedimentos e internações** — cirurgias, exames de imagem, odontologia, internações, com datas e arquivos.
14. **Cuidados recorrentes (P)** — vermífugo, antipulgas/carrapaticida, banho e tosa, troca de ração, com intervalo e próxima data.
15. **Financeiro** — valor, forma de pagamento, reembolso do convênio (pedido/recebido), recibo anexado. Filtro de despesas dedutíveis do IR (só humanos).
16. **Linha do tempo** — tudo de um membro em ordem cronológica, com filtros por tipo e busca.

**Tela inicial:** pendências abertas de todos os membros, por prazo: consultas a encerrar, retornos e exames a agendar, resultados a anexar ou a levar ao retorno, doses do dia, vacinas e cuidados pet vencendo, documentos aguardando revisão.

## Fluxos principais

Quatro fluxos sustentam o app: o ciclo da consulta, a receita virando doses, o exame do pedido ao gráfico e a leitura de documentos por IA.

### Ciclo da consulta

Uma consulta só sai das pendências quando é encerrada; se precisar de retorno, o app cria a próxima consulta como "a agendar", com data limite.

### Cadeia de pendências

O encerramento de uma consulta abre uma pendência para cada encaminhamento; cada pendência, ao ser resolvida, abre a próxima, até o retorno ser encerrado e o ciclo recomeçar.

| Gatilho | Pendência aberta | Fecha quando |
|---|---|---|
| Data da consulta passou | Encerrar consulta | Consulta encerrada (compareceu ou faltou) |
| Encerramento com retorno | Agendar retorno, com prazo | Retorno agendado |
| Encerramento com receita | Tomar remédios (doses do dia) | Última dose do tratamento |
| Encerramento com pedido de exame | Agendar exame **e** agendar retorno (obrigatório) | Exame agendado; retorno agendado |
| Data do exame passou | Anexar resultado | Resultado anexado e revisado |
| Resultado revisado | Levar ao retorno (resultado aparece na tela de encerramento do retorno) | Retorno encerrado |
| Data do retorno passou | Encerrar retorno | Retorno encerrado, reiniciando a cadeia |
| Parâmetro fora da faixa | Alerta no perfil (não bloqueia) | Visto no encerramento do retorno |

Toda pendência pode ser dispensada com motivo (ex.: "desisti do exame", "médico liberou sem retorno"), para nada ficar aberto para sempre.

### Receita → calendário de doses

1. Usuário fotografa a receita (ou anexa ao encerrar a consulta).
2. IA extrai médico, data e cada medicamento com dose, frequência e duração.
3. Tela de revisão: usuário confere e define o horário da primeira dose (ex.: 8/8h começando às 7h → 7h, 15h, 23h).
4. Ao confirmar, o app gera as doses (7 dias × 3 doses = 21 lembretes) e, se for uso contínuo, uma janela de 30 dias renovada todo dia.
5. Em cada horário chega o aviso; o usuário marca tomada ou pulada. Sem resposta em 30 min, novo aviso.
6. Fim do tratamento: receita fica como concluída, com a adesão registrada.

### Exame: do pedido ao gráfico

1. Pedido de exame entra (foto ou encerramento da consulta) e fica pendente.
2. Fica pendente agendar o exame (data, local, preparo); ao agendar, vira evento na agenda. O retorno com o médico também fica obrigatório.
3. Resultado chega em PDF; a IA extrai cada marcador com valor, unidade e faixa de referência, e vincula ao pedido.
4. Marcadores fora da faixa ficam destacados; o pedido é encerrado.
5. Os valores alimentam o gráfico de evolução de cada parâmetro ao longo dos anos, e o resultado fica pendente de levar ao retorno.

### Leitura de documentos por IA

1. Upload: o app envia o arquivo e o membro (se escolhido) para `upload-documento`.
2. O arquivo vai para o Drive na pasta do membro e um registro em `documentos` é criado com `status_ia = pendente`.
3. `processar-documento` classifica o tipo e extrai os campos em JSON; se o nome do paciente não bater com o membro escolhido, sinaliza.
4. O documento aparece em "Aguardando revisão" na tela inicial.
5. Ao confirmar, os dados viram registros de verdade (receita, pedido, resultado, vacina) e o arquivo é renomeado no padrão.

### Importação do histórico

Tudo o que já existe (exames antigos, receitas, laudos, carteiras de vacina, avaliações físicas) pode entrar em lote para formar o histórico desde o início.

1. **Antes do app existir:** junte os arquivos no Drive em `Saúde da Família/_Importar/<membro>/` (fotos, PDFs, prints). Nome e ordem não importam; foto plana e bem iluminada ajuda a IA com papéis antigos.
2. **Tela Importar histórico:** escolhe a pasta `_Importar` (ou envia vários arquivos) e a função `importar-lote` coloca tudo numa fila, processando um arquivo por vez para controlar custo.
3. **IA classifica cada arquivo:** tipo, membro, data, profissional e os dados do documento; exames e avaliações físicas viram medições ligadas ao catálogo de parâmetros.
4. **Revisão em lote:** lista com miniatura, tipo, membro e data; confirma em massa e abre só os marcados como incertos ou com parâmetro novo.
5. **Entra como histórico:** consultas já encerradas, receitas sem gerar doses (salvo se marcar "ainda em uso"), pedidos sem pendência. Nada importado abre pendência ou lembrete.
6. **Organização:** cada arquivo sai de `_Importar` e vai para a pasta do membro e do ano, com o nome no padrão.

Resultado: a linha do tempo e os gráficos de evolução já nascem com anos de dados.

## Modelo de dados

Postgres no Supabase, schema `public`, chaves `uuid`, todas as tabelas com `created_at`, `updated_at` e RLS ligado. Quase tudo se liga a `membros` por `membro_id`.

| Tabela | Campos principais | Liga com |
|---|---|---|
| `familias` | nome | — |
| `usuarios_familia` | user_id (auth), familia_id, papel (admin/editor/leitor) | familias, auth.users |
| `membros` | familia_id, tipo (humano/pet), nome, nascimento, sexo, especie, raca, tipo_sanguineo, microchip, castrado, foto_url, drive_folder_id, ativo | familias |
| `fichas_saude` | membro_id, alergias[], condicoes_cronicas[], cirurgias, historico_familiar, convenio, carteirinha, cartao_sus | membros |
| `profissionais` | nome, tipo (médico/vet/dentista/personal/nutricionista…), especialidade, registro (CRM/CRMV/CREF/CRN), telefone, endereco | — |
| `locais` | nome, tipo (clínica/lab/hospital/pet shop/academia), endereco, telefone | — |
| `consultas` | membro_id, profissional_id, local_id, especialidade, data_hora, motivo, status, compareceu, resumo, encaminhamento, precisa_retorno, retorno_prazo_dias, consulta_origem_id, historico, google_event_id | membros, profissionais, locais, consultas (retorno) |
| `pendencias` | membro_id, tipo (encerrar_consulta/agendar_retorno/tomar_remedios/agendar_exame/anexar_resultado/levar_ao_retorno/revisar_documento), origem_tabela, origem_id, titulo, prazo, status (aberta/resolvida/dispensada), motivo_dispensa, resolvida_em | membros e a origem |
| `documentos` | membro_id, tipo (receita/pedido/resultado/laudo/avaliacao/vacina/recibo/outro), data_documento, drive_file_id, drive_url, mime, origem (app/importacao), status_ia (pendente/processado/revisado/erro), extracao_json, consulta_id | membros, consultas |
| `receitas` | membro_id, consulta_id, documento_id, profissional_id, data, confirmada, historico | consultas, documentos |
| `receita_itens` | receita_id, medicamento, concentracao, forma, dose, via, frequencia_horas, horarios[], inicio, duracao_dias, uso_continuo, ainda_em_uso, instrucoes | receitas |
| `doses` | receita_item_id, membro_id, data_hora_prevista, status, data_hora_tomada, observacao | receita_itens |
| `estoque_medicamentos` | membro_id, medicamento, quantidade, unidade, consumo_diario, alerta_dias | membros |
| `pedidos_exame` | membro_id, consulta_id, documento_id, data, status, data_agendada, local_id, preparo, google_event_id, consulta_retorno_id | consultas, documentos, locais |
| `pedido_exame_itens` | pedido_id, exame, realizado | pedidos_exame |
| `resultados_exame` | membro_id, pedido_id, documento_id, laboratorio, data_coleta, consulta_retorno_id | pedidos_exame, documentos, consultas |
| `parametros` | nome, sinonimos[], categoria (sangue/urina/imagem/avaliacao_fisica/sinal_vital/crescimento), unidade_padrao, conversoes (json), especies[], casas_decimais | — |
| `parametro_referencias` | parametro_id, especie, sexo, idade_min, idade_max, ref_min, ref_max, fonte | parametros |
| `avaliacoes_fisicas` | membro_id, data, profissional_id, metodo (bioimpedancia/dobras/DEXA/outro), equipamento, documento_id, observacoes | membros, profissionais, documentos |
| `medicoes` | membro_id, parametro_id, data_hora, valor_num, valor_texto, unidade_original, valor_padrao, ref_min, ref_max, alterado, origem (resultado/avaliacao/avulsa), resultado_id, avaliacao_id | membros, parametros, resultados_exame, avaliacoes_fisicas |
| `vacinas` | membro_id, vacina, dose, data_aplicacao, lote, local_id, proxima_dose, documento_id | membros |
| `sintomas` | membro_id, data_hora, descricao, intensidade, temperatura, medicacao | membros |
| `procedimentos` | membro_id, tipo, descricao, data_inicio, data_fim, local_id, documento_id | membros |
| `cuidados_recorrentes` | membro_id, tipo (vermifugo/antipulgas/banho…), produto, intervalo_dias, ultima_data, proxima_data | membros |
| `despesas` | membro_id, consulta_id, descricao, valor, data, forma_pagamento, reembolso_status, valor_reembolsado, dedutivel_ir, documento_id | membros |
| `notificacoes` | usuario_id, tipo, referencia_id, enviar_em, enviada_em, canal (push/telegram) | — |
| `push_subscriptions` | user_id, endpoint, keys | auth.users |
| `integracoes_google` | user_id, refresh_token (criptografado), drive_root_folder_id, calendar_id | auth.users |

**Medições unificadas:** exame de laboratório, avaliação física e medida avulsa gravam na mesma tabela `medicoes`, ligada ao catálogo `parametros`. Assim um único gráfico mostra, por exemplo, o peso vindo da balança de casa, da bioimpedância e da consulta. O valor original é preservado e convertido para a unidade padrão.

**Views úteis:** `v_evolucao_parametro` (medições por membro e parâmetro, com faixa de referência), `v_linha_tempo` (union de eventos por membro), `v_doses_hoje`.

**Regras automáticas:** triggers no banco abrem e fecham as pendências conforme a cadeia descrita em Fluxos; a `rotina-diaria` abre as que dependem de data (consulta ou exame cuja data passou). Registros com `historico = true` (importados) nunca geram pendências, doses ou lembretes.

## Edge Functions, cron e integrações

Toda a lógica de servidor fica em Supabase Edge Functions (Deno/TypeScript); segredos ficam em Supabase Secrets, nunca no front.

| Função | Gatilho | O que faz |
|---|---|---|
| `google-oauth` | Botão "Conectar Google" | Fluxo OAuth com a conta Google pessoal; guarda o refresh token criptografado em `integracoes_google` |
| `upload-documento` | App (upload de foto/PDF) | Cria pastas no Drive se faltarem, salva com nome padronizado, grava em `documentos` e chama `processar-documento` |
| `processar-documento` | Após upload ou reprocessar | Envia o arquivo à OpenAI, recebe JSON estruturado, grava em `extracao_json` com `status_ia = processado` |
| `confirmar-documento` | Usuário aprova a revisão | Cria receita + itens + doses, ou pedido, ou resultado + marcadores, ou vacina, conforme o tipo |
| `gerar-doses` | Chamada por `confirmar-documento` | Expande frequência × duração em linhas de `doses`; uso contínuo gera janela de 30 dias, renovada pelo cron |
| `sync-agenda` | Criar/editar consulta | Cria ou atualiza o evento no Google Agenda e guarda `google_event_id` |
| `enviar-lembretes` | pg_cron a cada 15 min | Lê `notificacoes` vencidas e envia por Web Push e/ou Telegram |
| `rotina-diaria` | pg_cron 1×/dia às 6h | Agenda notificações do dia, marca consultas "aguardando encerramento", renova doses de uso contínuo, alerta estoque, vacinas e cuidados pet |
| `telegram-webhook` | Mensagens ao bot | Permite responder "tomei" a um lembrete e enviar foto de documento pelo Telegram (opcional, fase 4) |

**OpenAI:** modelo com visão (GPT-4o ou equivalente atual) via Structured Outputs, com um schema JSON por tipo de documento. O prompt pede para classificar o tipo, identificar o paciente (nome) e extrair os campos; campos ilegíveis voltam `null` com flag `incerto`. PDFs com várias páginas são convertidos em imagens ou enviados como arquivo.

**Google:** projeto pessoal no Google Cloud com Drive API e Calendar API; escopos `drive.file` (só arquivos criados pelo app) e `calendar.events`.

**Notificações:** Web Push com chaves VAPID (o PWA precisa estar instalado na tela inicial no iPhone) e/ou bot do Telegram criado no BotFather, enviando para um grupo da família.

## Organização do Google Drive

O app cria e mantém uma pasta raiz com uma subpasta por membro e por ano; o banco guarda o `drive_file_id` de cada arquivo.

```
Saúde da Família/
  Bella/
    2026/
      2026-10-15_Receita_Pediatria_Dra-Ana.jpg
      2026-10-20_Resultado_Hemograma_Lab-X.pdf
  Chanel/
    2026/
      2026-09-02_Vacina_V10.jpg
  ...
```

**Padrão de nome:** `AAAA-MM-DD_Tipo_Detalhe_Profissional-ou-Local.ext`, sem acentos nem espaços no detalhe. A data é a do documento (não a do upload).

**Regras:**

- Escopo `drive.file`: o app só enxerga o que ele mesmo criou, o resto do Drive fica intocado.
- Se o usuário corrigir o membro ou a data na revisão, o arquivo é renomeado e movido.
- Exclusão no app manda o arquivo para a lixeira do Drive (recuperável por 30 dias), nunca apaga direto.

## Telas do app

Mobile first, navegação por barra inferior com 5 abas: Início, Família, Adicionar (+), Agenda, Mais.

| Tela | Conteúdo |
|---|---|
| Início | Pendências (consultas a encerrar, retornos, exames sem resultado, revisões da IA), doses de hoje com botão "tomei", próximos compromissos |
| Família | Cards dos membros com foto e alertas; filtro humanos/pets |
| Perfil do membro | Abas: Resumo (ficha fixa), Linha do tempo, Consultas, Medicamentos, Exames, Avaliações físicas, Vacinas, Medidas, Diário, Gastos (+ Cuidados para pets) |
| Adicionar (+) | Ações rápidas: Fotografar documento, Nova consulta, Registrar sintoma, Registrar medida, Registrar dose |
| Revisão da IA | Imagem do documento ao lado do formulário preenchido; campos incertos destacados; botões Confirmar, Editar, Descartar |
| Consulta (detalhe) | Dados, documentos vinculados, botão "Encerrar consulta" |
| Encerrar consulta | Compareceu? Resumo, encaminhamentos (receita, exames, especialista), precisa retorno? em quantos dias? anexar documentos |
| Agenda | Calendário com consultas, doses, vacinas e cuidados pet; filtro por membro |
| Medicamentos | Tratamentos ativos por membro, adesão (% de doses tomadas), estoque |
| Exame (marcador) | Gráfico de evolução de qualquer parâmetro (exame ou avaliação física) com faixa de referência; comparar parâmetros lado a lado |
| Mais | Importar histórico, Catálogo de parâmetros, Profissionais, Locais, Financeiro/IR, Configurações (Google, notificações, usuários da família) |

## Segurança e privacidade

Dados de saúde são sensíveis pela LGPD; o desenho parte de "ninguém acessa nada por padrão".

- **Contas separadas:** Supabase, Google Cloud e OpenAI em contas pessoais, sem nenhum vínculo com a EMA.
- **RLS em todas as tabelas:** acesso só se o usuário pertence à família do membro, e escrita só para papel admin ou editor.
- **Segredos no servidor:** chave da OpenAI, client secret do Google, token do Telegram e chaves VAPID só em Supabase Secrets. O front usa apenas a anon key.
- **Token do Google criptografado** no banco (pgsodium/Vault do Supabase).
- **Arquivos só no Drive**, em pastas privadas; o app não usa Supabase Storage, o que também poupa a cota free.
- **IA nunca grava direto:** toda extração passa pela tela de revisão. Receitas manuscritas e doses exigem confirmação explícita.
- **OpenAI:** dados enviados pela API não são usados para treinar modelos por padrão. Evitar mandar CPF e outros dados que não sejam necessários.
- **Login:** e-mail com link mágico ou Google; sessão persistente no celular.
- **Backup:** export mensal do banco (pg_dump ou CSV) salvo no próprio Drive.
- **Supabase free:** projeto pausa após 7 dias sem uso. O pg_cron chamando as Edge Functions tende a manter ativo; confirmar nas primeiras semanas.

## Fases de desenvolvimento

São 5 fases; cada uma termina com algo usável no dia a dia antes de seguir.

**Fase 0 — Fundação**

- [ ] Repositório no GitHub com Vite + React + TypeScript + Tailwind, configurado como PWA
- [ ] Projeto Supabase pessoal, Supabase CLI e migrations versionadas no repositório
- [ ] Login (link mágico) e tabelas `familias`, `usuarios_familia`, `membros`, `fichas_saude` com RLS
- [ ] Deploy automático: GitHub Action que faz build e envia por FTP para o subdomínio na Hostinger
- [ ] Cadastro dos 7 membros com ficha fixa

**Fase 1 — Consultas e Drive**

- [ ] Projeto Google Cloud, OAuth e função `google-oauth`
- [ ] `upload-documento` com criação de pastas e padrão de nome
- [ ] CRUD de profissionais, locais e consultas
- [ ] Tabela `pendencias` e triggers da cadeia (encerramento, retorno, exame, resultado)
- [ ] `sync-agenda` com Google Agenda
- [ ] Tela Início com pendências

**Fase 2 — IA e medicamentos**

- [ ] `processar-documento` com schemas por tipo e tela de Revisão da IA
- [ ] Receitas, itens e `gerar-doses`
- [ ] Web Push (VAPID) e/ou bot do Telegram; `enviar-lembretes` e `rotina-diaria` no pg_cron
- [ ] Marcar dose tomada/pulada e adesão
- [ ] Estoque de medicamentos

**Fase 3 — Exames e vacinas**

- [ ] Pedidos de exame com agendamento e retorno obrigatórios
- [ ] Catálogo `parametros` com sinônimos, unidades e faixas por sexo, idade e espécie
- [ ] Resultados de exame gravados em `medicoes` ligadas ao catálogo
- [ ] Avaliações físicas (bioimpedância, dobras, perímetros, testes)
- [ ] Gráfico de evolução por parâmetro, com comparação entre parâmetros
- [ ] Carteira de vacinação (infantil e pet) com próxima dose
- [ ] Importação em lote do histórico (pasta `_Importar` do Drive)

**Fase 4 — Completo**

- [ ] Cuidados recorrentes dos pets
- [ ] Medidas avulsas e curva de crescimento da Bella
- [ ] Diário de sintomas e procedimentos
- [ ] Financeiro e relatório de despesas dedutíveis do IR
- [ ] Linha do tempo com busca
- [ ] Backup mensal para o Drive
- [ ] Responder lembretes e enviar documentos pelo Telegram (opcional)

## Pré-requisitos e como usar com o Claude Code

Antes da primeira sessão, deixe as contas prontas; o Claude Code cuida do código.

**Contas e chaves (todas pessoais):**

- [ ] Conta GitHub com repositório privado criado
- [ ] Conta Supabase nova, projeto criado; anotar URL, anon key e service role key
- [ ] Google Cloud: projeto novo, Drive API e Calendar API ativadas, tela de consentimento OAuth (modo teste, com seu e-mail e o da Eduarda como usuários de teste), Client ID e Secret
- [ ] OpenAI: chave pessoal com limite de gasto mensal definido
- [ ] Hostinger: subdomínio criado, SSL ativo, usuário FTP
- [ ] Telegram (opcional): bot criado no BotFather e grupo da família

**Como conduzir no Claude Code:**

1. Exporte este documento em Markdown e salve na raiz do repositório como `PLANO.md`.
2. Na primeira sessão, peça para ele ler o `PLANO.md`, criar um `CLAUDE.md` com stack, convenções e comandos, e executar só a Fase 0.
3. Trabalhe uma fase por vez; ao fim de cada uma, teste no celular e marque os itens deste checklist.
4. Peça migrations SQL versionadas (`supabase/migrations`) em vez de criar tabelas pelo painel.
5. Guarde segredos em `.env.local` (fora do Git) e em Supabase Secrets; peça um `.env.example`.
6. Para a IA, peça primeiro os schemas JSON e teste com 3 ou 4 documentos reais de cada tipo antes de ligar a tela de revisão.

**Prompt inicial sugerido:** "Leia o PLANO.md. É um app pessoal de saúde da família. Crie o CLAUDE.md e implemente a Fase 0 completa, me explicando cada configuração externa que eu precisar fazer."
