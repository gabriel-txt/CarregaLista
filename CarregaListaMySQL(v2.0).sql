
-- criação do banco

DROP DATABASE IF EXISTS pedidos_db;
CREATE DATABASE pedidos_db;
USE pedidos_db;

-- tabela staging
CREATE TABLE staging_pedidos (
    order_id VARCHAR(50),
    order_item_id VARCHAR(50),
    purchase_date DATETIME,
    payments_date DATETIME,
    buyer_email VARCHAR(100),
    buyer_name VARCHAR(100),
    cpf VARCHAR(20),
    buyer_phone VARCHAR(20),
    sku VARCHAR(50),
    product_name VARCHAR(100),
    quantity INT,
    currency VARCHAR(10),
    item_price DECIMAL(10,2),
    ship_service_level VARCHAR(50),
    ship_address1 VARCHAR(150),
    ship_city VARCHAR(100),
    ship_state VARCHAR(10),
    ship_postal_code VARCHAR(20),
    ship_country VARCHAR(50)
);

-- mock de dados
INSERT INTO staging_pedidos VALUES
('PED1','1','2024-03-20','2024-03-20','a@email.com','Ana','111','219999','SKU1','Produto A',2,'BRL',10.00,'Normal','Rua A','RJ','RJ','20000','BR'),
('PED1','2','2024-03-20','2024-03-20','a@email.com','Ana','111','219999','SKU2','Produto B',1,'BRL',20.00,'Normal','Rua A','RJ','RJ','20000','BR'),
('PED2','1','2024-03-21','2024-03-21','b@email.com','Bruno','222','219888','SKU2','Produto B',3,'BRL',20.00,'Normal','Rua B','RJ','RJ','21000','BR');

-- modelagem

CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cpf VARCHAR(20) UNIQUE,
    nome VARCHAR(100),
    email VARCHAR(100),
    telefone VARCHAR(20)
);

CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) UNIQUE,
    nome VARCHAR(100),
    preco DECIMAL(10,2)
);

CREATE TABLE estoque (
    produto_id INT PRIMARY KEY,
    quantidade INT,
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50),
    cliente_id INT,
    data DATETIME,
    valor_total DECIMAL(10,2),
    status VARCHAR(30) DEFAULT 'Pendente',
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

CREATE TABLE itens_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT,
    produto_id INT,
    quantidade INT,
    preco_unit DECIMAL(10,2),
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

CREATE TABLE movimentacao_estoque (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT,
    pedido_id INT,
    quantidade INT,
    data_mov DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE compras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT,
    quantidade INT,
    status VARCHAR(20) DEFAULT 'Pendente'
);

-- processamento (atividade 1)

DELIMITER $$

CREATE PROCEDURE processar_carga()
BEGIN
    START TRANSACTION;

    INSERT INTO clientes (cpf, nome, email, telefone)
    SELECT DISTINCT sp.cpf, sp.buyer_name, sp.buyer_email, sp.buyer_phone
    FROM staging_pedidos sp
    WHERE NOT EXISTS (
        SELECT 1 FROM clientes c WHERE c.cpf = sp.cpf
    );

    INSERT INTO produtos (sku, nome, preco)
    SELECT DISTINCT sp.sku, sp.product_name, sp.item_price
    FROM staging_pedidos sp
    WHERE NOT EXISTS (
        SELECT 1 FROM produtos p WHERE p.sku = sp.sku
    );

    INSERT INTO estoque (produto_id, quantidade)
    SELECT p.id, 5
    FROM produtos p
    LEFT JOIN estoque e ON e.produto_id = p.id
    WHERE e.produto_id IS NULL;

    INSERT INTO pedidos (order_id, cliente_id, data, valor_total)
    SELECT 
        sp.order_id,
        c.id,
        MIN(sp.purchase_date),
        SUM(sp.item_price * sp.quantity)
    FROM staging_pedidos sp
    JOIN clientes c ON c.cpf = sp.cpf
    WHERE NOT EXISTS (
        SELECT 1 FROM pedidos p WHERE p.order_id = sp.order_id
    )
    GROUP BY sp.order_id, c.id;

    INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unit)
    SELECT 
        p.id,
        pr.id,
        sp.quantity,
        sp.item_price
    FROM staging_pedidos sp
    JOIN pedidos p ON p.order_id = sp.order_id
    JOIN produtos pr ON pr.sku = sp.sku
    WHERE NOT EXISTS (
        SELECT 1 FROM itens_pedido ip
        WHERE ip.pedido_id = p.id
        AND ip.produto_id = pr.id
    );

    COMMIT;

END $$

DELIMITER ;

-- priorização (atividade 2)
DELIMITER $$

CREATE PROCEDURE priorizar_pedidos()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_id INT;

    DECLARE cur CURSOR FOR
        SELECT id FROM pedidos ORDER BY valor_total DESC;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;

    LOOP1: LOOP
        FETCH cur INTO v_id;
        IF done THEN LEAVE LOOP1; END IF;

        IF NOT EXISTS (
            SELECT 1 FROM itens_pedido ip
            JOIN estoque e ON e.produto_id = ip.produto_id
            WHERE ip.pedido_id = v_id
            AND e.quantidade < ip.quantidade
        ) THEN
            UPDATE pedidos SET status = 'Prioritario' WHERE id = v_id;
        END IF;

    END LOOP;

    CLOSE cur;
END $$

DELIMITER ;

-- atendimento + movimentação + compra (atividade 3)
DELIMITER $$

CREATE PROCEDURE processar_pedidos()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_id INT;

    DECLARE cur CURSOR FOR
        SELECT id FROM pedidos ORDER BY valor_total DESC;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;

    LOOP2: LOOP
        FETCH cur INTO v_id;
        IF done THEN LEAVE LOOP2; END IF;

        IF NOT EXISTS (
            SELECT 1 FROM itens_pedido ip
            JOIN estoque e ON e.produto_id = ip.produto_id
            WHERE ip.pedido_id = v_id
            AND e.quantidade < ip.quantidade
        ) THEN

            -- MOVIMENTAÇÃO
            INSERT INTO movimentacao_estoque (produto_id, pedido_id, quantidade)
            SELECT produto_id, v_id, quantidade
            FROM itens_pedido WHERE pedido_id = v_id;

            -- BAIXA ESTOQUE
            UPDATE estoque e
            JOIN itens_pedido ip ON e.produto_id = ip.produto_id
            SET e.quantidade = e.quantidade - ip.quantidade
            WHERE ip.pedido_id = v_id;

            UPDATE pedidos SET status = 'Atendido' WHERE id = v_id;

        ELSE

            -- GERA COMPRA
            INSERT INTO compras (produto_id, quantidade)
            SELECT produto_id, quantidade
            FROM itens_pedido WHERE pedido_id = v_id;

            UPDATE pedidos SET status = 'Aguardando Estoque' WHERE id = v_id;

        END IF;

    END LOOP;

    CLOSE cur;
END $$

DELIMITER ;

-- fornecimento de produtos
DELIMITER $$

CREATE PROCEDURE entrada_estoque()
BEGIN
    UPDATE estoque e
    JOIN compras c ON c.produto_id = e.produto_id
    SET e.quantidade = e.quantidade + c.quantidade,
        c.status = 'Recebido'
    WHERE c.status = 'Pendente';
END $$

DELIMITER ;

-- execução

-- CALL processar_carga();
-- CALL priorizar_pedidos();
-- CALL processar_pedidos();
-- CALL entrada_estoque();

-- resultados
SELECT * FROM pedidos;
SELECT * FROM estoque;
SELECT * FROM movimentacao_estoque;
SELECT * FROM compras;