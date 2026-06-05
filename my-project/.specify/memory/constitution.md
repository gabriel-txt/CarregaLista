# Constituição do Bazar TemTudo

## Princípios Centrais

### 1. Dominio em Primeiro Lugar (DDD)
O sistema deve ser modelado em torno do domínio de pedidos e marketplaces. Entidades, agregados, serviços de domínio e eventos de domínio representam as regras de negócio, não a infraestrutura.

### 2. Responsabilidade Única e Isolamento de Bounded Contexts
Cada componente deve ter uma única responsabilidade clara. Ingestão de marketplace, consolidação de pedidos, gerenciamento de estoque e geração de ordens de compra são contextos separados, com contratos bem definidos entre eles.

### 3. Priorização do Valor do Pedido
O atendimento deve priorizar pedidos de maior valor e maior urgência. Regras de priorização são parte do domínio e devem ser testadas como regras de negócio, não como detalhes de implementação.

### 4. Inventário em Tempo Real e Consistência Eventual Segura
O estoque deve ser atualizado em tempo real sempre que houver recebimento, reserva ou cancelamento. A consistência eventual é aceitável entre sistemas remotos, mas o domínio deve garantir que não ocorram vendas duplicadas ou alocações inconsistentes.

### 5. Automação de Reposição e Ordens de Compra
Itens esgotados geram ordens de compra automáticas. A lógica de reposição pertence ao domínio e deve ser observável, testável e configurável.

## Requisitos Arquiteturais

- Use DDD para definir modelos de domínio ricos: agregados de Pedido, Item de Pedido, Estoque, Marketplace e Ordem de Compra.
- Separe claramente camadas de domínio, aplicação e infraestrutura.
- Interface com marketplaces via adaptadores externos; mantenha o domínio isolado de detalhes de API e driver.
- Use padrões de eventos de domínio para propagar mudanças de estado relevantes entre bounded contexts.
- Mantenha o core de domínio independente de frameworks e da camada de persistência.

## Princípios SOLID Aplicados

- Single Responsibility: cada classe/serviço faz apenas uma coisa e tem um motivo único para mudar.
- Open/Closed: comportamento de negócio deve ser extensível sem modificar código existente, especialmente nas regras de priorização e ingestão de marketplaces.
- Liskov Substitution: implementações de adaptadores e serviços substitutos devem obedecer aos contratos definidos pelas interfaces.
- Interface Segregation: APIs internas devem ser finas e específicas para cada caso de uso (por exemplo, ingestão de pedidos, consulta de estoque, emissão de ordens de compra).
- Dependency Inversion: dependências de alto nível devem ser sobre abstrações de domínio; implementações concretas de infraestrutura são injetadas externamente.

## Fluxo de Desenvolvimento

- Inicie a modelagem com o domínio: identifique entidades, agregados, comandos e eventos antes de codificar serviços.
- Escreva testes de unidade para regras de negócio e testes de integração para fluxos de pedido e estoque.
- Priorize clareza de modelo e linguagem ubíqua entre negócio e código.
- Use revisões de código para validar aderência a DDD e SOLID, especialmente na modelagem de bounded contexts.

## Governança

- Esta constituição é o guia principal para decisões de arquitetura e design do sistema.
- Alterações significativas de modelo de domínio ou regras de prioridade devem ser documentadas e aprovadas antes da implementação.
- Todos os PRs devem incluir uma verificação de conformidade com DDD e SOLID para os novos componentes de domínio.
- A complexidade extra deve ser justificada por ganhos claros de alinhamento com o negócio ou de escalabilidade.

**Versão**: 1.0 | **Ratificada**: 2026-06-04 | **Última Emenda**: 2026-06-04
