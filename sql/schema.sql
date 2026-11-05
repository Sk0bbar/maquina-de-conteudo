-- Máquina de Conteúdo: schema base no Supabase (PostgreSQL).
-- Multi-cliente: cada cliente da agência é uma linha em mdc_clientes, com o perfil de marca em jsonb.
-- Rodar uma vez no SQL Editor do Supabase.
-- Versão de portfólio: as tabelas de clientes, peças e relatórios seguem o schema de produção;
-- as de datas comemorativas e de autorizados do bot foram reescritas a partir da documentação.

create table if not exists mdc_clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  status text not null default 'piloto' check (status in ('piloto', 'ativo', 'pausado', 'encerrado')),
  -- tom de voz, restrições, público, datas incluídas/excluídas e config_entrega
  perfil_marca jsonb not null default '{}'::jsonb,
  drive_folder_id text,
  created_at timestamptz not null default now()
);

-- Peças/rascunhos do calendário (usadas na primeira versão do produto, antes do pivô).
create table if not exists mdc_pecas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references mdc_clientes(id) on delete cascade,
  data date not null,
  titulo text not null,
  formato text not null,
  status text not null default 'rascunho' check (status in ('rascunho', 'pendente', 'aprovado')),
  objetivo text,
  tom_de_voz text,
  tom_de_voz_motivo text,
  preview text,
  link_texto text,
  link_imagem text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mdc_pecas_cliente_data_idx on mdc_pecas (cliente_id, data);

-- Datas comemorativas com fonte (mundiais, nacionais e regionais).
create table if not exists mdc_datas_comemorativas (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  nome text not null,
  abrangencia text not null check (abrangencia in ('mundial', 'nacional', 'estadual', 'municipal')),
  tipo text not null default 'dia' check (tipo in ('dia', 'semana', 'mes')),
  fonte text not null
);
create index if not exists mdc_datas_data_idx on mdc_datas_comemorativas (data);

-- Relatórios mensais de desempenho (números calculados por script, nunca pelo modelo).
create table if not exists mdc_relatorios_desempenho (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references mdc_clientes(id) on delete cascade,
  periodo_inicio date not null,
  periodo_fim date not null,
  alcance integer,
  engajamento_pct numeric,
  salvamentos integer,
  cliques_link integer,
  novos_seguidores integer,
  cresc_base_pct numeric,
  insights_positivos jsonb not null default '[]'::jsonb,
  pontos_atencao jsonb not null default '[]'::jsonb,
  drive_doc_link text,
  gerado_em timestamptz not null default now()
);
create index if not exists mdc_relatorios_cliente_periodo_idx on mdc_relatorios_desempenho (cliente_id, periodo_inicio);

-- Quem pode pedir coisas ao bot do Telegram (liberado com o comando /liberar pelo administrador).
create table if not exists mdc_bot_autorizados (
  chat_id bigint primary key,
  nome text,
  ativo boolean not null default true,
  liberado_em timestamptz not null default now()
);

-- Row Level Security: o painel interno lê/escreve com sessão autenticada;
-- o n8n usa a chave de serviço (guardada como credencial do n8n, nunca no código).
alter table mdc_clientes enable row level security;
alter table mdc_pecas enable row level security;
alter table mdc_datas_comemorativas enable row level security;
alter table mdc_relatorios_desempenho enable row level security;
alter table mdc_bot_autorizados enable row level security;

drop policy if exists "authenticated full access" on mdc_clientes;
create policy "authenticated full access" on mdc_clientes for all to authenticated using (true) with check (true);
drop policy if exists "authenticated full access" on mdc_pecas;
create policy "authenticated full access" on mdc_pecas for all to authenticated using (true) with check (true);
drop policy if exists "authenticated read" on mdc_datas_comemorativas;
create policy "authenticated read" on mdc_datas_comemorativas for select to authenticated using (true);
drop policy if exists "authenticated full access" on mdc_relatorios_desempenho;
create policy "authenticated full access" on mdc_relatorios_desempenho for all to authenticated using (true) with check (true);

create or replace function mdc_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists mdc_pecas_touch_updated_at on mdc_pecas;
create trigger mdc_pecas_touch_updated_at
before update on mdc_pecas
for each row execute function mdc_set_updated_at();

-- Seed de demonstração (cliente fictício), útil para testar o painel sem dados reais.
insert into mdc_clientes (nome, slug, status, perfil_marca)
values (
  'Hotel Exemplo', 'hotel-exemplo', 'piloto',
  '{"tom": "caloroso e próximo", "restricoes": ["sem preço no post", "sem promessas"], "config_entrega": {"dia_geracao": 20}}'
)
on conflict (slug) do nothing;
