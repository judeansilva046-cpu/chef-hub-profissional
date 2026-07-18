-- Sprint 06: `profiles` só tem policy "select own" (0002) — necessário para
-- não vazar dados de qualquer usuário para qualquer usuário autenticado.
-- Isso quebra dois pontos novos do módulo Financeiro que precisam enxergar
-- o perfil de OUTRA pessoa: (1) a Auditoria mostrando quem fez cada
-- alteração, (2) a tela de Permissões listando os membros da empresa e
-- buscando alguém pra convidar por e-mail. Duas funções SECURITY DEFINER
-- resolvem isso com escopo mínimo, sem abrir uma policy geral de leitura.

-- Convite: busca exata por e-mail, devolve só o necessário para confirmar
-- "é essa pessoa mesmo" antes de convidar — não é uma busca/listagem geral.
create function public.fn_buscar_usuario_por_email(p_email text)
returns table (id uuid, nome_completo text, email text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.nome_completo, p.email
  from public.profiles p
  where lower(p.email) = lower(trim(p_email))
  limit 1;
$$;

grant execute on function public.fn_buscar_usuario_por_email(text) to authenticated;
revoke execute on function public.fn_buscar_usuario_por_email(text) from public, anon;

-- Auditoria/Permissões: perfis de quem já interagiu com o financeiro de uma
-- empresa (membro atual ou autor de algum registro de auditoria) — só
-- visível pra quem já tem acesso àquela empresa (fn_tem_acesso_financeiro).
create function public.fn_perfis_visiveis_financeiro(p_empresa_id uuid)
returns table (id uuid, nome_completo text, email text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.nome_completo, p.email
  from public.profiles p
  where public.fn_tem_acesso_financeiro(p_empresa_id, false)
    and (
      p.id in (select usuario_id from public.usuarios_empresa where empresa_id = p_empresa_id)
      or p.id in (select usuario_id from public.empresas where id = p_empresa_id)
      or p.id in (select usuario_id from public.financeiro_auditoria where empresa_id = p_empresa_id)
    );
$$;

grant execute on function public.fn_perfis_visiveis_financeiro(uuid) to authenticated;
revoke execute on function public.fn_perfis_visiveis_financeiro(uuid) from public, anon;
