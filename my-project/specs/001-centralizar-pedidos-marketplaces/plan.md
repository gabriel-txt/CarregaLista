# Implementation Plan: Centralizar Pedidos Marketplaces

**Branch**: `001-centralizar-pedidos-marketplaces` | **Date**: 2026-06-04 | **Spec**: `spec.md`

**Input**: Feature specification from `/specs/001-centralizar-pedidos-marketplaces/spec.md`

## Summary

Construir uma API backend em Node.js com TypeScript, Express e PrismaORM para centralizar pedidos consolidados de marketplaces. O sistema receberá uploads de CSV de pedidos e de reposição de estoque, validará dados com Zod, gravará entradas brutas em `staging_pedidos`, processará pedidos em background com priorização por valor e manterá o estoque e compras atualizados.

## Technical Context

**Language/Version**: Node.js (20+) com TypeScript estrito

**Primary Dependencies**:
- `express` para o servidor HTTP
- `prisma` e `@prisma/client` para ORM MySQL
- `zod` para validação de payloads e linhas de CSV
- `jsonwebtoken` para JWT
- `multer` para upload multipart/form-data
- `dotenv` para configuração de ambiente
- `supertest` / `jest` (ou `vitest`) para testes de API e integração

**Storage**: MySQL 8.0 rodando em container Docker

**Testing**: testes de unidade e integração com foco em domínio, validação e APIs REST

**Target Platform**: servidor Node.js backend, containerizado via Docker

**Project Type**: web-service API backend com arquitetura DDD

**Performance Goals**:
- Resposta `202 Accepted` para upload de CSV em menos de 500ms
- Processamento de pedidos em background sem bloquear o event loop
- Suporte a uploads concorrentes e consultas CRUD simultâneas

**Constraints**:
- Estrita separação de camadas DDD: domínio, aplicação e infraestrutura
- Dependência de alto nível apenas sobre abstrações e contratos
- Persistência em MySQL via Prisma com tipagem forte
- Validação de CSV e payloads em tempo de execução com Zod

**Scale/Scope**:
- MVP para ingestão de pedidos via arquivos CSV consolidados
- Gestão de clientes, produtos, pedidos, estoque e compras
- Não abrange integração direta com APIs Marketplace nesta fase

## Constitution Check

Este plano está alinhado à constituição do projeto, que exige:
- Modelagem de domínio rica e independente de infraestrutura
- Bounded contexts claros para upload, processamento, estoque e compras
- Aplicação dos princípios SOLID, com serviços de domínio e interfaces finas
- Uso de testes para validar regras de priorização e processamento de pedidos

**GATE**: Deve passar antes do design detalhado. Este plano atende aos princípios DDD/SOLID e mantém o domínio isolado de frameworks e da camada de persistência.

## Project Structure

### Documentation (this feature)

```text
specs/001-centralizar-pedidos-marketplaces/
├── plan.md
├── spec.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
src/
├── application/
│   ├── use-cases/
│   │   ├── UploadOrdersUseCase.ts
│   │   ├── ProcessOrdersUseCase.ts
│   │   ├── UploadStockReplenishmentUseCase.ts
│   │   └── AuthUseCase.ts
│   ├── dto/
│   └── events/
├── domain/
│   ├── entities/
│   │   ├── Cliente.ts
│   │   ├── Produto.ts
│   │   ├── Pedido.ts
│   │   ├── ItemPedido.ts
│   │   ├── Estoque.ts
│   │   └── Compra.ts
│   ├── services/
│   │   └── OrderProcessingService.ts
│   ├── repositories/
│   │   ├── ICustomerRepository.ts
│   │   ├── IProductRepository.ts
│   │   ├── IOrderRepository.ts
│   │   ├── IStockRepository.ts
│   │   ├── IOrderMovementRepository.ts
│   │   └── IPurchaseRepository.ts
│   └── value-objects/
├── infrastructure/
│   ├── prisma/
│   │   ├── client.ts
│   │   ├── repositories/
│   │   └── migrations/
│   ├── api/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   └── routes.ts
│   ├── jobs/
│   │   ├── background-worker.ts
│   │   └── event-bus.ts
│   └── utils/
└── tests/
    ├── unit/
    ├── integration/
    └── fixtures/
```

**Structure Decision**: Será um único projeto backend organizado por camadas DDD. O código ficará em `src/` e os testes em `tests/`.

## Data Model Alignment

O modelo de dados técnico já foi definido pelo `schema.prisma` proposto e cobre:
- `User` para autenticação JWT
- `StagingPedido` para carga bruta de CSV
- `Cliente`, `Produto`, `Estoque`, `Pedido`, `ItemPedido`, `MovimentacaoEstoque`, `Compra`

Esse esquema satisfaz os requisitos de ingestão em staging, registro de clientes/produtos novos, controle de estoque e geração de ordens de compra.

## Phase Plan

### Phase 0 — Bootstrapping e Core Design

- Configurar projeto Node.js + TypeScript + Express + Prisma + Zod + dotenv
- Criar `schema.prisma` com o modelo proposto e gerar `prisma client`
- Definir contratos de repositório no domínio para abstração de persistência
- Definir esquemas Zod para autenticação, upload de pedidos e upload de reposição
- Definir eventos internos para processamento assíncrono (EventEmitter ou fila simples in-memory)

### Phase 1 — Implementação dos fluxos principais

- Implementar autenticação JWT com `POST /api/auth/register` e `POST /api/auth/login`
- Implementar middleware `ensureAuthenticated` para rotas privadas
- Implementar endpoint `POST /api/pedidos/upload` com `multer` para CSV multipart
- Validar cada linha do CSV de pedidos com Zod e inserir em lote em `staging_pedidos`
- Retornar `202 Accepted` imediatamente após persistir em staging
- Implementar worker de background que consome lotes e invoca `ProcessOrdersUseCase`
- Implementar `OrderProcessingService` no domínio para:
  - ordenar pedidos do maior valor para o menor
  - cadastrar clientes/produtos novos
  - verificar estoque e realizar baixa
  - marcar pedidos como `Atendido` ou `Aguardando Estoque`
  - gerar ordens de compra em `compras` para itens faltantes
- Implementar endpoint `POST /api/estoque/reposicao` para upload de CSV de reposição
- Reconciliar estoque e marcar compras pendentes como `Recebido`
- Implementar endpoints CRUD protegidos para Clientes, Produtos, Pedidos, Estoque e Compras

### Phase 2 — Testes e estabilidade

- Criar testes de unidade para serviços de domínio e validação Zod
- Criar testes de integração para endpoints de upload e processamento
- Validar cenário de prioridade por valor e atualização de estoque
- Validar upload de reposição e alteração de status de compras
- Implementar tratamento de falhas e logging em background worker

## Contracts and API

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`

### File operations (JWT required)
- `POST /api/pedidos/upload`
- `POST /api/estoque/reposicao`

### CRUD operations (JWT required)
- `GET /api/pedidos`
- `GET /api/pedidos/:id`
- `GET /api/estoque`
- `GET /api/estoque/movimentacoes`
- `GET /api/compras`
- `GET/POST/PUT/DELETE` para Clientes e Produtos conforme necessidade

## Risk Mitigation

- **CSV inconsistências**: validar cada linha com Zod e rejeitar lotes inválidos com erro claro
- **Carga pesada**: upload aceita rapidamente e processamento ocorre em worker separado
- **Esgotamento de estoque**: lógica de pedido `Atendido` vs `Aguardando Estoque` protegida por verificação prévia de disponibilidade
- **Dependências de infraestrutura**: manter domínio isolado e usar repositórios injetáveis para facilitar testes e mudanças de armazenamento

## Next Steps

1. Executar `npx prisma migrate dev --name init` após definir `schema.prisma`
2. Implementar as abstrações de repositório em `domain/repositories`
3. Implementar `OrderProcessingService` e casos de uso de upload/processamento
4. Criar testes de domínio para priorização por valor e baixa de estoque
5. Validar os endpoints de upload com testes de integração e resposta `202 Accepted`

## Complexity Tracking

Nenhuma violação de constituição identificada. A arquitetura DDD/SOLID já está refletida no plano e será mantida pela separação de domínio, aplicação e infraestrutura.
