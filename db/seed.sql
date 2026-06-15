-- ============================================================
-- Cafe Teria - Dados mockados (seed)
-- ------------------------------------------------------------
-- Popula o catalogo e cria alguns pedidos em status variados,
-- para que a tela da Cozinha ja tenha conteudo ao subir o
-- sistema. Execute APOS o schema.sql.
--
-- Os precos foram escolhidos de forma consistente com o cenario
-- BDD (cappuccino + chantilly = 12.00; cappuccino + leite = 10.50).
-- ============================================================

-- Limpa antes de inserir, para o seed ser reexecutavel sem duplicar.
truncate table pedidos;
truncate table produtos;

-- ------------------------------------------------------------
-- Produtos
-- ------------------------------------------------------------

-- Cafes
insert into produtos (nome, preco, categoria) values
    ('espresso',   6.00, 'cafe'),
    ('cappuccino', 9.00, 'cafe'),
    ('latte',      8.50, 'cafe'),
    ('mocha',     10.00, 'cafe');

-- Sucos
insert into produtos (nome, preco, categoria) values
    ('suco de laranja',  7.00, 'suco'),
    ('suco de morango',  8.00, 'suco'),
    ('limonada',         6.50, 'suco');

-- Comidas (produto pronto - sem tamanho, sem adicionais)
insert into produtos (nome, preco, categoria) values
    ('pao de queijo',      5.00, 'comida'),
    ('bolo de cenoura',    7.00, 'comida'),
    ('croissant',          6.50, 'comida'),
    ('sanduiche natural', 12.00, 'comida');

-- Adicionais de cafe
insert into produtos (nome, preco, categoria) values
    ('leite',     1.50, 'adicional_cafe'),
    ('chantilly', 3.00, 'adicional_cafe'),
    ('canela',    1.00, 'adicional_cafe');

-- Adicionais de suco
insert into produtos (nome, preco, categoria) values
    ('hortela',  1.50, 'adicional_suco'),
    ('gengibre', 1.50, 'adicional_suco');

-- Adicionais de tamanho (Decorators de preco: medio +2, grande +4)
insert into produtos (nome, preco, categoria) values
    ('medio',  2.00, 'adicional_tamanho'),
    ('grande', 4.00, 'adicional_tamanho');

-- ------------------------------------------------------------
-- Pedidos (em status variados, para popular o kanban da cozinha)
-- Os totais batem com os precos do catalogo acima.
-- ------------------------------------------------------------
insert into pedidos (nome_cliente, item_preparado, total_pago, metodo_pagamento, status, criado_em) values
    ('Mesa 01', 'cappuccino | chantilly',      12.00, 'pix',      'Na fila da cozinha', now() - interval '2 minutes'),
    ('Mesa 07', 'latte | leite | medio',        12.00, 'pix',      'Em preparo',          now() - interval '6 minutes'),
    ('Mesa 03', 'espresso | grande',            10.00, 'cartao',   'Em preparo',          now() - interval '9 minutes'),
    ('Mesa 05', 'suco de laranja | medio',       9.00, 'dinheiro', 'Pronto',              now() - interval '12 minutes'),
    ('Mesa 02', 'pao de queijo',                 5.00, 'pix',      'Entregue',            now() - interval '20 minutes');