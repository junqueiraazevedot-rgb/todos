-- Fecha as funções security definer para quem não fez login.
-- No Supabase, anon e authenticated recebem EXECUTE direto (não só via PUBLIC).

-- Função de trigger: ninguém precisa chamá-la via API.
revoke execute on function public.criar_ficha_saude() from public, anon, authenticated;

-- Auxiliares de permissão: usadas pelas policies, então authenticated precisa de EXECUTE.
-- Elas só revelam o papel do próprio usuário logado.
revoke execute on function public.papel_na_familia(uuid)    from public, anon;
revoke execute on function public.pode_ler_familia(uuid)    from public, anon;
revoke execute on function public.pode_editar_familia(uuid) from public, anon;
revoke execute on function public.e_admin_familia(uuid)     from public, anon;
grant  execute on function public.papel_na_familia(uuid)    to authenticated;
grant  execute on function public.pode_ler_familia(uuid)    to authenticated;
grant  execute on function public.pode_editar_familia(uuid) to authenticated;
grant  execute on function public.e_admin_familia(uuid)     to authenticated;
