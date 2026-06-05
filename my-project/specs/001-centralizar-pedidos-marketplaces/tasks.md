# Tasks: Centralizar Pedidos Marketplaces

**Input**: Design documents from `/specs/001-centralizar-pedidos-marketplaces/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicializar o backend em Node.js/TypeScript e preparar a base do projeto.

- [ ] T001 Create project root structure with `src/`, `tests/`, `prisma/`, `src/domain/`, `src/application/`, `src/infrastructure/`, `src/infrastructure/api/`, `src/infrastructure/prisma/`, `src/infrastructure/jobs/`, `src/infrastructure/utils/`
- [ ] T002 Initialize `package.json`, `tsconfig.json`, and basic Node/TypeScript configuration
- [ ] T003 Install core dependencies: `express`, `prisma`, `@prisma/client`, `zod`, `jsonwebtoken`, `bcryptjs` (or `argon2`), `multer`, `dotenv`
- [ ] T004 Install devDependencies: `typescript`, `ts-node-dev`, `eslint`, `prettier`, `jest`/`vitest`, `supertest`, `@types/express`, `@types/jsonwebtoken`, `@types/node`, `@types/multer`
- [ ] T005 Configure environment management with `.env.example` and `src/infrastructure/utils/config.ts`
- [ ] T006 Setup linting, formatting, and TypeScript strict mode

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Criar a infraestrutura que suportará todos os fluxos do domínio.

- [ ] T007 Create `prisma/schema.prisma` using the proposed data model and configure `DATABASE_URL`
- [ ] T008 Run Prisma migration and generate `@prisma/client` in `src/infrastructure/prisma/client.ts`
- [ ] T009 Implement domain repository interfaces in `src/domain/repositories/`:
  - `IUserRepository.ts`
  - `IOrderRepository.ts`
  - `ICustomerRepository.ts`
  - `IProductRepository.ts`
  - `IStockRepository.ts`
  - `IOrderMovementRepository.ts`
  - `IPurchaseRepository.ts`
  - `IStagingPedidoRepository.ts`
- [ ] T010 Implement Zod validation schemas in `src/application/dto/validation/`:
  - `authSchemas.ts`
  - `marketplaceCsvSchemas.ts`
  - `stockReplenishmentCsvSchemas.ts`
- [ ] T011 Implement `src/infrastructure/api/middlewares/ensureAuthenticated.ts` for JWT validation
- [ ] T012 Implement Express app scaffolding in `src/infrastructure/api/app.ts` and route registration in `src/infrastructure/api/routes.ts`
- [ ] T013 Implement global error handling and request logging middleware in `src/infrastructure/api/middlewares/`
- [ ] T014 Implement an event bus / background worker in `src/infrastructure/jobs/` using Node `EventEmitter` or a lightweight queue abstraction
- [ ] T015 Implement Prisma-based repository adapters in `src/infrastructure/prisma/repositories/`
- [ ] T016 Implement domain entities and value objects in `src/domain/entities/` and `src/domain/value-objects/`
- [ ] T017 Implement `OrderProcessingService` in `src/domain/services/OrderProcessingService.ts` with injected repository interfaces

**Checkpoint**: Foundation ready for user story implementation.

---

## Phase 3: User Story 1 - Upload de Pedidos Marketplace (Priority: P1) 🎯 MVP

**Goal**: Permitir o upload seguro de CSVs de pedidos e gravar os dados brutos em `staging_pedidos`.

**Independent Test**: Enviar um CSV válido em `POST /api/pedidos/upload` e receber `202 Accepted` enquanto o lote é aceito para processamento.

### Implementation

- [ ] T018 [US1] Implement `AuthUseCase` in `src/application/use-cases/AuthUseCase.ts`
- [ ] T019 [US1] Implement `POST /api/auth/register` and `POST /api/auth/login` controllers in `src/infrastructure/api/controllers/AuthController.ts`
- [ ] T020 [US1] Implement `UploadOrdersUseCase` in `src/application/use-cases/UploadOrdersUseCase.ts`
- [ ] T021 [US1] Implement `StagingPedido` repository adapter and bulk insert method
- [ ] T022 [US1] Implement `POST /api/pedidos/upload` controller in `src/infrastructure/api/controllers/OrderUploadController.ts`
- [ ] T023 [US1] Add Multer file upload handling in `src/infrastructure/api/middlewares/uploadMiddleware.ts`
- [ ] T024 [US1] Validate CSV rows with Zod and convert fields to typed values before persisting to staging
- [ ] T025 [US1] Emit background job event after staging insert and return `202 Accepted`

### Tests

- [ ] T026 [US1] Add integration test for `POST /api/auth/register` and `POST /api/auth/login` in `tests/integration/auth.test.ts`
- [ ] T027 [US1] Add integration test for `POST /api/pedidos/upload` with valid and invalid CSV payloads in `tests/integration/orders-upload.test.ts`

---

## Phase 4: User Story 2 - Processamento Assíncrono de Pedidos (Priority: P1)

**Goal**: Processar lote de pedidos em background, priorizando por valor e atualizando estoque.

**Independent Test**: Verificar que o worker consome um lote de staging e atualiza pedidos para `Atendido` ou `Aguardando Estoque`.

### Implementation

- [ ] T028 [US2] Implement `ProcessOrdersUseCase` in `src/application/use-cases/ProcessOrdersUseCase.ts`
- [ ] T029 [US2] Implement `ProcessOrderBatchService` in `src/domain/services/OrderProcessingService.ts`
- [ ] T030 [US2] Implement `Pedido`, `ItemPedido`, `Compra`, `Estoque`, `MovimentacaoEstoque` domain logic and status transitions
- [ ] T031 [US2] Implement order prioritization by total value in the domain service
- [ ] T032 [US2] Implement customer and product reconciliation during processing
- [ ] T033 [US2] Implement stock validation, decrement and movement recording
- [ ] T034 [US2] Implement purchase order creation for missing items in `compras`
- [ ] T035 [US2] Implement background worker event handling and batch execution in `src/infrastructure/jobs/background-worker.ts`
- [ ] T036 [US2] Implement status update logic for `Atendido` and `Aguardando Estoque`

### Tests

- [ ] T037 [US2] Add unit tests for `OrderProcessingService` priority and stock rules in `tests/unit/order-processing.service.test.ts`
- [ ] T038 [US2] Add integration test for processing a staging batch and verifying final statuses in `tests/integration/order-processing.test.ts`

---

## Phase 5: User Story 3 - Upload de Reposição de Estoque (Priority: P1)

**Goal**: Permitir upload CSV de reposição de estoque e marcar compras pendentes como `Recebido`.

**Independent Test**: Enviar CSV de reposição e confirmar atualização de estoque e mudança de status de compras.

### Implementation

- [ ] T039 [US3] Implement `UploadStockReplenishmentUseCase` in `src/application/use-cases/UploadStockReplenishmentUseCase.ts`
- [ ] T040 [US3] Implement `POST /api/estoque/reposicao` controller in `src/infrastructure/api/controllers/StockReplenishmentController.ts`
- [ ] T041 [US3] Implement CSV validation for supplier deliveries and stock reconciliation
- [ ] T042 [US3] Update `Estoque` quantities and link delivered items to pending `Compra` records
- [ ] T043 [US3] Implement purchase status update to `Recebido` when supplier stock is reconciled
- [ ] T044 [US3] Ensure partial replenishments update only the delivered quantities

### Tests

- [ ] T045 [US3] Add integration test for `POST /api/estoque/reposicao` in `tests/integration/stock-replenishment.test.ts`
- [ ] T046 [US3] Add unit tests for stock reconciliation and purchase status updates in `tests/unit/stock-replenishment.service.test.ts`

---

## Phase 6: User Story 4 - Consulta e Gestão de Dados (Priority: P2)

**Goal**: Expor endpoints CRUD para Clientes, Produtos, Pedidos, Estoque e Compras.

**Independent Test**: Consultar e gerenciar recursos via API com respostas consistentes.

### Implementation

- [ ] T047 [US4] Implement `GET /api/pedidos` and `GET /api/pedidos/:id` controllers
- [ ] T048 [US4] Implement `GET /api/estoque` and `GET /api/estoque/movimentacoes` controllers
- [ ] T049 [US4] Implement `GET /api/compras` controller
- [ ] T050 [US4] Implement CRUD routes for `Clientes` and `Produtos` in `src/infrastructure/api/controllers/CustomerController.ts` and `ProductController.ts`
- [ ] T051 [US4] Implement filtering/pagination basics on list endpoints
- [ ] T052 [US4] Ensure routes are protected with `ensureAuthenticated`

### Tests

- [ ] T053 [US4] Add integration tests for listing and retrieving `Pedidos`, `Estoque`, `Compras`, `Clientes` and `Produtos`
- [ ] T054 [US4] Add tests for update/delete operations on `Clientes` and `Produtos`

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Refinamentos e garantias de qualidade finais.

- [ ] T055 [P] Add comprehensive logging for upload, processing, and replenishment flows
- [ ] T056 [P] Improve error handling and user-friendly validation responses
- [ ] T057 [P] Add API documentation or quickstart notes in `specs/001-centralizar-pedidos-marketplaces/quickstart.md`
- [ ] T058 [P] Write end-to-end smoke tests for the main upload-to-processing flow
- [ ] T059 [P] Review code for adherence to DDD and SOLID
- [ ] T060 [P] Clean up technical debt and refactor shared utilities

---

## Dependencies & Execution Order

- Phase 1 must complete before Phase 2 begins.
- Phase 2 is blocking: User Story implementation starts only after foundational infrastructure is ready.
- Phase 3, Phase 4 and Phase 5 can proceed in parallel after Phase 2, but should follow priority order if team capacity is limited.
- Phase 6 depends on Phase 2 and can begin once the domain model and API scaffolding exist.
- Phase 7 is final polishing after all feature stories are implemented.
