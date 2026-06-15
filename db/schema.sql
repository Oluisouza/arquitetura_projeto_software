-- ============================================================
-- Cafe Teria - Schema do banco de dados (PostgreSQL / Supabase)
-- ------------------------------------------------------------
-- Cria as duas tabelas do sistema: produtos e pedidos.
-- Pode ser executado no SQL Editor do Supabase ou em qualquer
-- instancia PostgreSQL (psql, Supabase CLI, etc).
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Tabela: produtos
-- Catalogo da cafeteria. O ItemFactory le esta tabela e
-- instancia os itens dinamicamente (Factory data-driven / OCP).
-- ------------------------------------------------------------
create table if not exists produtos (
    id          uuid        primary key default gen_random_uuid(),
    nome        text        not null,                 
    preco       numeric(10,2) not null check (preco >= 0),
    categoria   text        not null check (categoria in (
                    'cafe',
                    'suco',
                    'comida',
                    'adicional_cafe',
                    'adicional_suco',
                    'adicional_tamanho'
                )),
    imagem_url  text                                  
);

-- ------------------------------------------------------------
-- Tabela: pedidos
-- Registra os pedidos pagos. O status acompanha o fluxo da
-- cozinha e dispara eventos SSE a cada mudanca.
-- ------------------------------------------------------------
create table if not exists pedidos (
    id               uuid        primary key default gen_random_uuid(),
    nome_cliente     text        not null,            -- ex: "Mesa 07"
    item_preparado   text        not null,            -- nomes separados por " | "
    total_pago       numeric(10,2) not null check (total_pago >= 0),
    metodo_pagamento text        not null check (metodo_pagamento in (
                         'pix', 'cartao', 'dinheiro'
                     )),
    status           text        not null default 'Na fila da cozinha'
                                 check (status in (
                         'Na fila da cozinha',
                         'Em preparo',
                         'Pronto',
                         'Entregue'
                     )),
    criado_em        timestamptz not null default now()
);

-- Indice para acelerar a consulta da cozinha (pedidos ativos por data).
create index if not exists idx_pedidos_criado_em on pedidos (criado_em desc);