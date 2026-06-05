# Feature Specification: Centralizar Pedidos Marketplaces

**Feature Branch**: `001-centralizar-pedidos-marketplaces`

**Created**: 2026-06-04

**Status**: Draft

**Input**: User description: "/speckit.specify ## 1.2. Usuários do Sistema

- **Analista de Operações / Administrador:** Usuário autenticado responsável por realizar o upload manual dos arquivos de pedidos e de reposição de estoque, além de monitorar o status do inventário e das compras.

## 1.3. Clarificações Necessárias

- **Q1:** O arquivo CSV de pedidos deve incluir um identificador de marketplace separado, ou o `order_id` será único entre todos os marketplaces?
- **Resposta:** `order_id` será único entre todos os marketplaces
- **Q2:** Qual esquema exato de colunas devemos aceitar para o CSV de reposição de estoque do fornecedor? Por exemplo: `sku`, `quantity`, `purchase_order_id`, `delivery_date`, `supplier_reference`.
- **Resposta:** esquema: order-id, order-item-id, purchase-date, payments-date, buyer-email, buyer-name, cpf, buyer-phone-number, sku, product-name, quantity-purchased, currency, item-price,ship-service-level, recipient-name, ship-address-1, ship-address-2, ship-address-3, ship-city, ship-state, ship-postal-code, ship-country, ioss-number
- **Q3:** O sistema deve processar e reconciliar compras pendentes apenas quando o estoque for recebido na totalidade, ou também deve marcar compras parcialmente recebidas como `Recebido` para os itens entregues?
- **Resposta**: compras parcialmente recebidas também devem ser marcadas como `Recebido` para os itens entregues

## 1.4. Requisitos Funcionais (RF)

**ID**
**Requisito Funcional**
**Descrição**

**RF01**
Autenticação de Usuários
O sistema deve permitir o cadastro de usuários administradores e login seguro utilizando tokens JWT.

**RF02**
Upload de CSV de Pedidos
O sistema deve disponibilizar um endpoint para upload manual do arquivo CSV contendo os pedidos unificados dos marketplaces.

**RF03**
Ingestão em Staging
Ao receber o arquivo, os dados brutos devem ser validados e salvos imediatamente na tabela temporária `staging_pedidos`.

**RF04**
Processamento Assíncrono
O processamento pesado de migração da tabela de staging para as tabelas finais do sistema deve rodar em background, liberando a rota HTTP imediatamente.

**RF05**
Conciliação de Cadastros
Durante o processamento, novos clientes e novos produtos contidos no arquivo devem ser cadastrados automaticamente.

**RF06**
Priorização por Valor
O sistema deve processar a fila de novos pedidos ordenando-os do maior valor total para o menor.

**RF07**
Atendimento e Baixa de Estoque
Pedidos com estoque totalmente disponível devem ser marcados como 'Atendidos', registrando a movimentação e debitando o saldo de produtos.

**RF08**
Geração de Ordens de Compra
Pedidos que não puderem ser atendidos por falta de estoque devem ser marcados como 'Aguardando Estoque' e os itens faltantes devem gerar registros na tabela `compras`.

**RF09**
Reposição de Estoque via CSV
O usuário poderá enviar um arquivo CSV do fornecedor contendo os produtos entregues. O sistema atualizará o estoque e marcará as compras pendentes como 'Recebido'.

**RF10**
Consulta de Dados (CRUD)
A API deve expor endpoints para listar e gerenciar Clientes, Produtos, Pedidos, Estoque e Compras.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload de Pedidos Marketplace (Priority: P1)

O Analista de Operações faz login no sistema, envia um arquivo CSV consolidado com pedidos dos marketplaces e recebe uma confirmação de que o arquivo foi aceito para processamento.

**Why this priority**: Esta é a principal entrada de pedidos e aciona todo o ciclo de processamento de pedidos e estoque.

**Independent Test**: Enviar um CSV válido e confirmar que o sistema aceita o upload com `202 Accepted` e que o lote é registrado para processamento em background.

**Acceptance Scenarios**:

1. **Given** um administrador autenticado e um CSV de pedidos válido, **When** ele envia o arquivo para `POST /api/pedidos/upload`, **Then** o sistema retorna `202 Accepted` com `{"status":"Processando"}`.
2. **Given** um CSV inválido ou corrompido, **When** o upload é recebido, **Then** o sistema retorna `400 Bad Request` com mensagem de validação apropriada.

---

### User Story 2 - Processamento Assíncrono de Pedidos (Priority: P1)

Após o upload, o sistema processa os registros de forma assíncrona, valida clientes e produtos, prioriza pedidos por valor e atualiza o estoque.

**Why this priority**: Garante que o upload não bloqueie o usuário e que o processamento siga as regras de negócio.

**Independent Test**: Confirmar que o upload retorna imediatamente e que, posteriormente, o lote é consumido pelo processo de background e os pedidos são inseridos corretamente.

**Acceptance Scenarios**:

1. **Given** um arquivo aceito em staging, **When** o processo em background inicia, **Then** os pedidos são ordenados pelo valor total e processados do maior para o menor.
2. **Given** um pedido com estoque completo, **When** ele é processado, **Then** o status é atualizado para `Atendido` e o estoque é debitado.
3. **Given** um pedido com itens em falta, **When** ele é processado, **Then** o status é atualizado para `Aguardando Estoque` e são criadas linhas em `compras` para os itens faltantes.

---

### User Story 3 - Upload de Reposição de Estoque (Priority: P1)

O Analista de Operações faz upload de um CSV de entrega de fornecedor e o sistema reconcilia o estoque, atualiza o saldo e marca compras pendentes como recebidas.

**Why this priority**: Este fluxo garante que os pedidos aguardando estoque possam ser atendidos automaticamente após reposição.

**Independent Test**: Enviar um CSV de reposição e confirmar que o estoque é atualizado e que compras pendentes relevantes são marcadas como `Recebido`.

**Acceptance Scenarios**:

1. **Given** um administrador autenticado e um CSV de reposição válido, **When** ele envia o arquivo para `POST /api/estoque/repor`, **Then** o sistema retorna `202 Accepted` e inicia a reconciliação.
2. **Given** itens de compra pendentes correspondentes, **When** o estoque é atualizado, **Then** os registros em `compras` relacionados são marcados como `Recebido`.

---

### User Story 4 - Consulta e Gestão de Dados (Priority: P2)

O Analista de Operações usa a API para listar e administrar Clientes, Produtos, Pedidos, Estoque e Compras.

**Why this priority**: Permite visibilidade e intervenção manual quando necessário, mas não é o gatilho principal do processamento.

**Independent Test**: Fazer requisições GET/POST/PUT/DELETE nos recursos e confirmar o comportamento CRUD básico conforme os contratos de API.

**Acceptance Scenarios**:

1. **Given** um administrador autenticado, **When** ele consulta `/api/pedidos`, **Then** ele recebe uma lista paginada de pedidos com status e valores.
2. **Given** um administrador autenticado, **When** ele atualiza um produto ou cliente válido, **Then** a alteração é persistida e refletida nas consultas subsequentes.

## Edge Cases

- Processar um CSV contendo linhas de pedidos duplicados: o sistema deve evitar duplicação de pedidos ou criar lógica de deduplicação de acordo com a chave de negócio.
- Pedido com cliente novo e produto novo em um mesmo lote: ambos devem ser cadastrados antes do processamento do pedido.
- Reposição parcial de estoque: apenas os itens entregues devem ser atualizados e os pedidos permanecem em `Aguardando Estoque` até que todas as faltas sejam resolvidas.
- Comunicação de erro de infraestrutura no processamento em background: o sistema deve registrar falhas e permitir reprocessamento manual do lote.

## Requirements *(mandatory)*

### Functional Requirements

- **RF01**: O sistema deve permitir cadastro e login de administradores utilizando tokens JWT.
- **RF02**: O sistema deve expor um endpoint para upload manual de CSV de pedidos unificados dos marketplaces.
- **RF03**: Ao receber o CSV de pedidos, os dados devem ser validados e salvos imediatamente na tabela `staging_pedidos`.
- **RF04**: O processamento da migração de staging para as tabelas finais deve ser executado em background e liberar a rota HTTP imediatamente.
- **RF05**: Durante o processamento, novos clientes e novos produtos presentes no arquivo devem ser cadastrados automaticamente.
- **RF06**: A fila de processamento deve priorizar pedidos do maior valor total para o menor.
- **RF07**: Pedidos com estoque totalmente disponível devem ser marcados como `Atendido`, com movimentação registrada e estoque debitado.
- **RF08**: Pedidos com itens sem estoque disponível devem ser marcados como `Aguardando Estoque` e gerar registros em `compras` para os itens faltantes.
- **RF09**: O sistema deve disponibilizar um endpoint para upload de CSV de reposição de estoque e atualizar o inventário, marcando compras pendentes como `Recebido`.
- **RF10**: A API deve oferecer endpoints CRUD para Clientes, Produtos, Pedidos, Estoque e Compras.

### Non-Functional Requirements

- **RNF01**: A arquitetura deve seguir Domain-Driven Design (DDD) para separar domínio, aplicação e infraestrutura.
- **RNF02**: O código deve aplicar princípios SOLID, especialmente Responsabilidade Única e Inversão de Dependência.
- **RNF03**: A implementação deve usar Node.js com TypeScript estrito e Express para o servidor de rotas.
- **RNF04**: A persistência deve ser gerenciada via PrismaORM sobre MySQL 8.0 em container Docker.
- **RNF05**: Validação de payloads de API e linhas de CSV deve ser feita em tempo de execução usando Zod.
- **RNF06**: O processamento em background não deve bloquear a execução de novas requisições na API.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um upload de CSV válido retorna `202 Accepted` em menos de 500ms e confirma que o lote está em processamento.
- **SC-002**: Todos os registros válidos do CSV são persistidos em `staging_pedidos` antes de qualquer processamento final.
- **SC-003**: O processamento do lote ocorre em background e não impede novos uploads ou consultas à API.
- **SC-004**: Pedidos com estoque suficiente são atualizados para `Atendido` e refletem redução correspondente no estoque.
- **SC-005**: Pedidos com falta de estoque são marcados `Aguardando Estoque` e geram registros válidos em `compras`.
- **SC-006**: O endpoint de reposição de estoque percebe entregas de fornecedor e marca compras pendentes como `Recebido`.
- **SC-007**: O sistema oferece endpoints de consulta para Clientes, Produtos, Pedidos, Estoque e Compras com resposta bem formada.

## Assumptions

- O usuário administrativo terá credenciais seguras e operará via API ou interface web autorizada.
- Os arquivos CSV de pedidos e de reposição têm esquema consistente e podem ser validados linha a linha.
- A primeira versão não precisa suportar todos os marketplaces com APIs diretas, mas sim a ingestão de arquivos consolidados.
- A reconciliação de estoque e de compras é feita por item e por pedido, em vez de por lote inteiro.
- A retenção dos dados de staging é suficiente para reprocessamento ou auditoria antes da limpeza.

## Key Entities *(include if feature involves data)*

- **Analista de Operações / Administrador**: Usuário que carrega arquivos, monitora estoque e gerencia compras.
- **Cliente**: Pessoa ou entidade que realiza o pedido e é registrada automaticamente durante o processamento.
- **Produto**: Item comercializado nos marketplaces, com código, descrição e saldo de estoque.
- **Pedido**: Pedido consolidado de marketplace com itens, valor total, status e referências de cliente.
- **StagingPedido**: Registro temporário dos dados brutos de CSV antes do processamento final.
- **Estoque**: Quantidade disponível de produtos, atualizada por atendimento de pedidos e reposição de fornecedor.
- **Compra**: Ordem de compra gerada para itens em falta, com status e vínculo ao pedido ou produto.

## Success Criteria

- **SC-008**: O sistema fornece rastreabilidade clara do ciclo de cada pedido entre `staging_pedidos`, `Atendido` e `Aguardando Estoque`.
- **SC-009**: Todas as regras de priorização por valor são documentadas e verificáveis em um conjunto de testes automatizados.
- **SC-010**: O sistema é capaz de cadastrar automaticamente clientes e produtos novos sem intervenção manual.
