# CLAUDE.md — App de Saúde da Família

App pessoal (PWA) com a memória de saúde de cada membro da família (humanos e pets).
O plano completo, com módulos, fluxos, modelo de dados e fases, está em `PLANO.md`. Leia a seção relevante antes de implementar algo.

## Estado atual

- **Fase 0 — Fundação**: implementada (scaffold PWA, login por link mágico, `familias`, `usuarios_familia`, `membros`, `fichas_saude` com RLS, cadastro dos membros, deploy por FTP).
- Próxima: **Fase 1 — Consultas e Drive**. Trabalhe uma fase por vez; ao concluir, marque os itens em `PLANO.md`.

## Stack

| Camada | Tecnologia |
|---|---|
| Front | React 19 + Vite 8 + TypeScript + Tailwind CSS 4 (`@tailwindcss/vite`), PWA via `vite-plugin-pwa` |
| Rotas | `react-router-dom` (BrowserRouter; `public/.htaccess` faz o fallback da SPA na Hostinger) |
| Banco / login | Supabase (Postgres + Auth + RLS), cliente `@supabase/supabase-js` |
| Servidor | Supabase Edge Functions (Deno/TS) em `supabase/functions/` — a partir da Fase 1 |
| Agendamentos | `pg_cron` + `pg_net` — a partir da Fase 2 |
| Deploy | GitHub Action `.github/workflows/deploy.yml` (build + FTP para a Hostinger) |

## Comandos

```bash
npm install
npm run dev          # http://localhost:5173 (precisa de .env.local, ver .env.example)
npm run build        # tsc -b + vite build (gera dist/ com sw.js e manifest)
npm run lint         # oxlint
npm run db:start     # Supabase local (Docker)
npm run db:reset     # recria o banco local aplicando supabase/migrations
npm run db:nova nome # nova migration vazia em supabase/migrations
npm run db:push      # aplica migrations no projeto remoto (após `npx supabase link`)
```

## Estrutura

```
src/
  lib/supabase.ts   cliente (só anon key)
  lib/auth.tsx      AuthProvider / useAuth (sessão)
  lib/familia.tsx   FamiliaProvider / useFamilia (família atual, papel, podeEditar)
  lib/types.ts      tipos das tabelas e constantes (MEMBROS_INICIAIS)
  components/       Layout (barra inferior de 5 abas), Avatar, EmBreve…
  pages/            uma tela por arquivo (Inicio, Familia, MembroPerfil, MembroEditar, Adicionar, Agenda, Mais, Login, CriarFamilia)
supabase/
  config.toml       config do Supabase local
  migrations/       SQL versionado — única forma de mudar o schema
```

## Convenções

- **Idioma**: interface, nomes de tabelas, colunas, funções e variáveis de domínio em português sem acento (`membros`, `fichas_saude`, `pode_editar_familia`). Termos técnicos genéricos podem ficar em inglês.
- **Schema só por migration** (`supabase/migrations/AAAAMMDDHHMMSS_descricao.sql`). Nunca criar tabela pelo painel. Não editar migrations já aplicadas no remoto; crie uma nova.
- **Toda tabela**: `id uuid default gen_random_uuid()`, `created_at`, `updated_at` (trigger `set_updated_at`), **RLS ligado** com policies usando `pode_ler_familia`, `pode_editar_familia`, `e_admin_familia`. Tabelas ligadas a membro checam via `membros.familia_id`.
- **Funções SQL** `security definer` sempre com `set search_path = ''` e nomes qualificados (`public.x`, `auth.uid()`).
- **Papéis** (por família, em `usuarios_familia`): `admin` (tudo, gerencia usuários), `editor` (cria/edita), `leitor` (só lê). O front esconde botões com `useFamilia().podeEditar`, mas a segurança é do RLS.
- **Segredos**: o front só conhece `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Chaves da OpenAI, Google, Telegram, VAPID e service role ficam em Supabase Secrets e são usadas só nas Edge Functions. `.env.local` nunca vai para o Git.
- **IA nunca grava direto**: toda extração passa pela tela de revisão (ver PLANO.md › Segurança).
- **Registros importados** (`historico = true`) nunca geram pendências, doses ou lembretes.
- **UI**: mobile first, Tailwind com as classes utilitárias de `src/index.css` (`.campo`, `.rotulo`, `.botao`, `.botao-sec`, `.cartao`) e a cor `marca-*`. Datas exibidas em pt-BR.
- Antes de commitar: `npm run lint && npm run build`.
