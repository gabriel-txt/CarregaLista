-- =========================================================
-- 0. PREPARAÇÃO
-- =========================================================
USE pedidos_db;

SET FOREIGN_KEY_CHECKS = 0;

-- Limpa execuções anteriores (opcional se já recriou o banco)
TRUNCATE TABLE itens_pedido;
TRUNCATE TABLE pedidos;
TRUNCATE TABLE estoque;
TRUNCATE TABLE produtos;
TRUNCATE TABLE clientes;
TRUNCATE TABLE movimentacao_estoque;
TRUNCATE TABLE compras;

SET FOREIGN_KEY_CHECKS = 1;
-- =========================================================
-- 1. INSERÇÃO DE DADOS (STAGING)
-- =========================================================

TRUNCATE TABLE staging_pedidos;

INSERT INTO staging_pedidos VALUES
-- Pedido completo
('PED1','1','2024-03-20','2024-03-20','a@email.com','Ana','111','219999','SKU1','Produto A',2,'BRL',10.00,'Normal','Rua A','RJ','RJ','20000','BR'),
('PED1','2','2024-03-20','2024-03-20','a@email.com','Ana','111','219999','SKU2','Produto B',1,'BRL',20.00,'Normal','Rua A','RJ','RJ','20000','BR'),

-- Pedido que vai FALTAR estoque
('PED3','1','2024-03-22','2024-03-22','c@email.com','Carlos','333','219777','SKU1','Produto A',10,'BRL',10.00,'Normal','Rua C','RJ','RJ','22000','BR');

-- =========================================================
-- 🔎 CHECKPOINT 1: STAGING
-- =========================================================
SELECT 'CHECKPOINT 1 - STAGING' AS ETAPA_1;
SELECT * FROM staging_pedidos;

-- =========================================================
-- 2. PROCESSAR CARGA
-- =========================================================

CALL processar_carga();
SELECT '[processar_carga() executado]' AS FUNCAO_EXECUTADA;

-- =========================================================
-- 🔎 CHECKPOINT 2: APÓS CARGA
-- =========================================================
SELECT 'CHECKPOINT 2 - CLIENTES' AS ETAPA_2;
SELECT * FROM clientes;

SELECT 'CHECKPOINT 2 - PRODUTOS' AS ETAPA_2;
SELECT * FROM produtos;

SELECT 'CHECKPOINT 2 - PEDIDOS' AS ETAPA_2;
SELECT order_id, valor_total, status FROM pedidos;

SELECT 'CHECKPOINT 2 - ITENS' AS ETAPA_2;
SELECT * FROM itens_pedido;

SELECT 'CHECKPOINT 2 - ESTOQUE INICIAL' AS ETAPA_2;
SELECT * FROM estoque;

-- =========================================================
-- ⚠️ FORÇAR CENÁRIO DE FALTA DE ESTOQUE
-- =========================================================
-- Reduz estoque do SKU1 propositalmente
UPDATE estoque
SET quantidade = 3
WHERE produto_id = (SELECT id FROM produtos WHERE sku = 'SKU1');

-- =========================================================
-- 🔎 CHECKPOINT 3: ESTOQUE REDUZIDO
-- =========================================================
SELECT 'CHECKPOINT 3 - ESTOQUE AJUSTADO' AS ETAPA_3;
SELECT p.sku, e.quantidade
FROM estoque e
JOIN produtos p ON p.id = e.produto_id;

-- =========================================================
-- 3. PRIORIZAÇÃO
-- =========================================================
CALL priorizar_pedidos();
SELECT '[priorizar_pedidos() executado]' AS FUNCAO_EXECUTADA;

-- =========================================================
-- 🔎 CHECKPOINT 4: APÓS PRIORIZAÇÃO
-- =========================================================
SELECT 'CHECKPOINT 4 - PRIORIZAÇÃO' AS ETAPA_4;
SELECT order_id, valor_total, status FROM pedidos;

-- =========================================================
-- 4. PROCESSAMENTO DE PEDIDOS
-- =========================================================

CALL processar_pedidos();
SELECT '[processar_pedidos() executado]' AS FUNCAO_EXECUTADA;

-- =========================================================
-- 🔎 CHECKPOINT 5: APÓS ATENDIMENTO
-- =========================================================

-- STATUS DOS PEDIDOS
SELECT 'CHECKPOINT 5 - PEDIDOS' AS ETAPA_5;
SELECT order_id, status FROM pedidos;

-- MOVIMENTAÇÃO
SELECT 'CHECKPOINT 5 - MOVIMENTAÇÃO' AS ETAPA_5;
SELECT * FROM movimentacao_estoque;

-- ESTOQUE APÓS BAIXA
SELECT 'CHECKPOINT 5 - ESTOQUE FINAL' AS ETAPA_5;
SELECT p.sku, e.quantidade
FROM estoque e
JOIN produtos p ON p.id = e.produto_id;

-- COMPRAS GERADAS
SELECT 'CHECKPOINT 5 - COMPRAS' AS ETAPA_5;
SELECT * FROM compras;

-- =========================================================
-- 5. REPOSIÇÃO DE ESTOQUE (FORNECEDOR)
-- =========================================================
CALL entrada_estoque();
SELECT '[entrada_estoque() executado]' AS FUNCAO_EXECUTADA;

-- =========================================================
-- 🔎 CHECKPOINT 6: APÓS REPOSIÇÃO
-- =========================================================

SELECT 'CHECKPOINT 6 - ESTOQUE REPOSTO' AS ETAPA_6;
SELECT p.sku, e.quantidade
FROM estoque e
JOIN produtos p ON p.id = e.produto_id;

SELECT 'CHECKPOINT 6 - COMPRAS ATUALIZADAS' AS ETAPA_6;
SELECT * FROM compras;