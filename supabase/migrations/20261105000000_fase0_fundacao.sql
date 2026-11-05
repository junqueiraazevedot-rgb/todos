-- Fase 0 — Fundação
-- Tabelas: familias, usuarios_familia, membros, fichas_saude (todas com RLS).
-- Convenções: chaves uuid, created_at/updated_at, nomes em português sem acento.

-- ---------------------------------------------------------------------------
-- Utilitários
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.papel_familia as enum ('admin', 'editor', 'leitor');
create type public.tipo_membro   as enum ('humano', 'pet');
create type public.sexo          as enum ('feminino', 'masculino', 'outro');

-- ---------------------------------------------------------------------------
-- familias
-- ---------------------------------------------------------------------------
create table public.familias (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null check (length(trim(nome)) > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger familias_updated_at before update on public.familias
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- usuarios_familia (quem do login acessa qual família, e com que papel)
-- ---------------------------------------------------------------------------
create table public.usuarios_familia (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  familia_id  uuid not null references public.familias (id) on delete cascade,
  papel       public.papel_familia not null default 'leitor',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, familia_id)
);

create index usuarios_familia_familia_idx on public.usuarios_familia (familia_id);

create trigger usuarios_familia_updated_at before update on public.usuarios_familia
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- membros (humanos e pets)
-- ---------------------------------------------------------------------------
create table public.membros (
  id               uuid primary key default gen_random_uuid(),
  familia_id       uuid not null references public.familias (id) on delete cascade,
  tipo             public.tipo_membro not null,
  nome             text not null check (length(trim(nome)) > 0),
  nascimento       date,
  nascimento_estimado boolean not null default false,
  sexo             public.sexo,
  foto_url         text,
  -- humanos
  tipo_sanguineo   text check (tipo_sanguineo in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  -- pets
  especie          text,           -- cão, gato…
  raca             text,
  cor              text,
  microchip        text,
  castrado         boolean,
  castrado_em      date,
  peso_atual_kg    numeric(6,2),
  -- integração (fase 1)
  drive_folder_id  text,
  ativo            boolean not null default true,
  observacao       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index membros_familia_idx on public.membros (familia_id);

create trigger membros_updated_at before update on public.membros
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- fichas_saude (ficha fixa, 1:1 com membros)
-- ---------------------------------------------------------------------------
create table public.fichas_saude (
  id                      uuid primary key default gen_random_uuid(),
  membro_id               uuid not null unique references public.membros (id) on delete cascade,
  alergias                text[] not null default '{}',
  condicoes_cronicas      text[] not null default '{}',
  medicamentos_continuos  text[] not null default '{}',
  cirurgias               text,
  historico_familiar      text,
  -- humanos
  cpf                     text,
  cartao_sus              text,
  convenio                text,
  carteirinha             text,
  medicos_referencia      text,
  contatos_emergencia     text,
  -- pets
  veterinario_referencia  text,
  plano_saude_pet         text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger fichas_saude_updated_at before update on public.fichas_saude
  for each row execute function public.set_updated_at();

-- Toda inclusão de membro já cria a ficha vazia.
create or replace function public.criar_ficha_saude()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.fichas_saude (membro_id) values (new.id)
  on conflict (membro_id) do nothing;
  return new;
end;
$$;

create trigger membros_criar_ficha after insert on public.membros
  for each row execute function public.criar_ficha_saude();

-- ---------------------------------------------------------------------------
-- Funções de permissão (security definer para não recursar nas policies)
-- ---------------------------------------------------------------------------
create or replace function public.papel_na_familia(p_familia_id uuid)
returns public.papel_familia
language sql
stable
security definer
set search_path = ''
as $$
  select uf.papel
  from public.usuarios_familia uf
  where uf.familia_id = p_familia_id
    and uf.user_id = (select auth.uid())
$$;

create or replace function public.pode_ler_familia(p_familia_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.papel_na_familia(p_familia_id) is not null
$$;

create or replace function public.pode_editar_familia(p_familia_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.papel_na_familia(p_familia_id) in ('admin', 'editor'), false)
$$;

create or replace function public.e_admin_familia(p_familia_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.papel_na_familia(p_familia_id) = 'admin', false)
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.familias          enable row level security;
alter table public.usuarios_familia  enable row level security;
alter table public.membros           enable row level security;
alter table public.fichas_saude      enable row level security;

-- familias: criadas só pela função criar_familia; admin renomeia.
create policy familias_select on public.familias
  for select to authenticated using (public.pode_ler_familia(id));
create policy familias_update on public.familias
  for update to authenticated using (public.e_admin_familia(id)) with check (public.e_admin_familia(id));
create policy familias_delete on public.familias
  for delete to authenticated using (public.e_admin_familia(id));

-- usuarios_familia: todos da família veem; só admin gerencia.
create policy usuarios_familia_select on public.usuarios_familia
  for select to authenticated using (public.pode_ler_familia(familia_id));
create policy usuarios_familia_update on public.usuarios_familia
  for update to authenticated using (public.e_admin_familia(familia_id)) with check (public.e_admin_familia(familia_id));
create policy usuarios_familia_delete on public.usuarios_familia
  for delete to authenticated using (public.e_admin_familia(familia_id) and user_id <> (select auth.uid()));

-- membros
create policy membros_select on public.membros
  for select to authenticated using (public.pode_ler_familia(familia_id));
create policy membros_insert on public.membros
  for insert to authenticated with check (public.pode_editar_familia(familia_id));
create policy membros_update on public.membros
  for update to authenticated using (public.pode_editar_familia(familia_id)) with check (public.pode_editar_familia(familia_id));
create policy membros_delete on public.membros
  for delete to authenticated using (public.e_admin_familia(familia_id));

-- fichas_saude (permissão herdada do membro)
create policy fichas_saude_select on public.fichas_saude
  for select to authenticated using (
    exists (select 1 from public.membros m where m.id = membro_id and public.pode_ler_familia(m.familia_id))
  );
create policy fichas_saude_insert on public.fichas_saude
  for insert to authenticated with check (
    exists (select 1 from public.membros m where m.id = membro_id and public.pode_editar_familia(m.familia_id))
  );
create policy fichas_saude_update on public.fichas_saude
  for update to authenticated using (
    exists (select 1 from public.membros m where m.id = membro_id and public.pode_editar_familia(m.familia_id))
  ) with check (
    exists (select 1 from public.membros m where m.id = membro_id and public.pode_editar_familia(m.familia_id))
  );

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

-- Cria uma família e torna o usuário atual admin dela.
create or replace function public.criar_familia(p_nome text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_familia_id uuid;
begin
  if v_uid is null then
    raise exception 'não autenticado';
  end if;

  insert into public.familias (nome) values (p_nome) returning id into v_familia_id;
  insert into public.usuarios_familia (user_id, familia_id, papel)
    values (v_uid, v_familia_id, 'admin');
  return v_familia_id;
end;
$$;

-- Admin dá acesso a outra pessoa que já fez login pelo menos uma vez.
create or replace function public.adicionar_usuario_familia(
  p_familia_id uuid,
  p_email text,
  p_papel public.papel_familia
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_id uuid;
begin
  if not public.e_admin_familia(p_familia_id) then
    raise exception 'apenas administradores podem adicionar usuários';
  end if;

  select u.id into v_user_id from auth.users u where lower(u.email) = lower(trim(p_email));
  if v_user_id is null then
    raise exception 'usuário % ainda não fez login no app', p_email;
  end if;

  insert into public.usuarios_familia (user_id, familia_id, papel)
    values (v_user_id, p_familia_id, p_papel)
  on conflict (user_id, familia_id) do update set papel = excluded.papel
  returning id into v_id;
  return v_id;
end;
$$;

-- Lista usuários da família com e-mail (auth.users não é exposto ao front).
create or replace function public.listar_usuarios_familia(p_familia_id uuid)
returns table (id uuid, user_id uuid, email text, papel public.papel_familia)
language sql
stable
security definer
set search_path = ''
as $$
  select uf.id, uf.user_id, u.email::text, uf.papel
  from public.usuarios_familia uf
  join auth.users u on u.id = uf.user_id
  where uf.familia_id = p_familia_id
    and public.pode_ler_familia(p_familia_id)
  order by uf.created_at
$$;

revoke execute on function public.criar_familia(text) from public, anon;
revoke execute on function public.adicionar_usuario_familia(uuid, text, public.papel_familia) from public, anon;
revoke execute on function public.listar_usuarios_familia(uuid) from public, anon;
grant execute on function public.criar_familia(text) to authenticated;
grant execute on function public.adicionar_usuario_familia(uuid, text, public.papel_familia) to authenticated;
grant execute on function public.listar_usuarios_familia(uuid) to authenticated;
