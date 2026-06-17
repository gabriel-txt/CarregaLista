# CarregaLista

O CarregaLista é um sistema backend projetado para centralizar e processar pedidos consolidados de vários marketplaces. Construído com Node.js, TypeScript e Express, ele fornece uma API robusta para o envio de dados de pedidos e estoque via arquivos CSV. O sistema processa esses envios de forma assíncrona, gerencia o inventário e automatiza a geração de pedidos de compra com base nos níveis de estoque, seguindo uma arquitetura orientada a domínios (Domain-Driven Design - DDD).

## Principais Funcionalidades

* **Autenticação de Usuário:** Registro e login seguros de usuários utilizando JSON Web Tokens (JWT).
* **Processamento Assíncrono de CSV:** Recebe arquivos CSV para pedidos e reposição de estoque, processando-os em segundo plano sem bloquear as requisições da API.
* **Preparação e Reconciliação (Staging):** Os dados são inicialmente carregados em uma tabela `staging_pedidos` para validação antes de serem migrados para as tabelas principais do banco de dados.
* **Criação Dinâmica de Entidades:** Cria automaticamente novos registros de clientes e produtos encontrados nos arquivos de pedidos enviados.
* **Priorização de Pedidos Baseada em Valor:** Os pedidos são processados em ordem decrescente de valor total para maximizar a eficiência do atendimento.
* **Gerenciamento de Estoque em Tempo Real:** Deduz automaticamente o estoque para pedidos atendidos e atualiza os níveis de inventário a partir dos arquivos de reposição.
* **Pedidos de Compra Automatizados:** Gera pedidos de compra para itens que estão sem estoque para otimizar o processo de aquisição.
* **API RESTful:** Fornece rotas (endpoints) autenticadas para visualizar pedidos, níveis de estoque, movimentações de estoque e compras pendentes.

## Stack de Tecnologias

* **Backend:** Node.js, Express.js, TypeScript
* **Banco de Dados:** MySQL
* **ORM:** Prisma
* **Validação:** Zod
* **Autenticação:** JWT, bcryptjs
* **Upload de Arquivos:** Multer
* **Conteinerização:** Docker, Docker Compose
* **Testes:** Vitest, Supertest

## Arquitetura

O projeto é estruturado seguindo os princípios de Domain-Driven Design (DDD), garantindo uma separação clara de responsabilidades:

* **`src/domain`**: Contém a lógica de negócios central, entidades e interfaces de repositório, totalmente independentes de qualquer framework ou infraestrutura.
* **`src/application`**: Orquestra os casos de uso do sistema, agindo como uma ponte entre as camadas de domínio e de infraestrutura.
* **`src/infrastructure`**: Implementa os detalhes técnicos, como a API Express, repositórios de banco de dados Prisma e o barramento de eventos de trabalhos em segundo plano.

## Guia de Início

Siga estas instruções para rodar o projeto em sua máquina local.

### Pré-requisitos

* Node.js (v20 ou mais recente)
* npm
* Docker e Docker Compose

### Instalação

1.  Clone o repositório e navegue até o diretório do projeto:

    ```sh
    git clone [https://github.com/gabriel-txt/CarregaLista.git](https://github.com/gabriel-txt/CarregaLista.git)
    cd CarregaLista/my-project
    ```

2.  Inicie o banco de dados MySQL usando o Docker Compose:

    ```sh
    docker-compose up -d
    ```

3.  Crie um arquivo `.env` no diretório `my-project`. Adicione a string de conexão do banco de dados e a configuração do JWT:

    ```env
    DATABASE_URL="mysql://user:user123@localhost:3306/pedidos_db"
    JWT_SECRET="your-jwt-secret"
    JWT_EXPIRES_IN="1d"
    ```

4.  Instale as dependências do projeto:

    ```sh
    npm install
    ```

5.  Aplique o esquema do banco de dados usando o Prisma Migrate:

    ```sh
    npx prisma migrate dev
    ```

6.  Inicie o servidor de desenvolvimento:
    ```sh
    npm run dev
    ```
    O servidor estará rodando em `http://localhost:4000`.

## Rotas da API (Endpoints)

Todos os endpoints exigem um token JWT Bearer válido no cabeçalho `Authorization`, exceto por `/auth/register` e `/auth/login`.

| Método | Endpoint                       | Descrição                                                                       |
| :----- | :----------------------------- | :------------------------------------------------------------------------------ |
| `POST` | `/api/auth/register`           | Registra um novo usuário.                                     |
| `POST` | `/api/auth/login`              | Faz login de um usuário e retorna um JWT.                     |
| `POST` | `/api/pedidos/upload`          | Envia um arquivo CSV de pedidos para processamento em segundo plano.|
| `POST` | `/api/estoque/reposicao`       | Envia um arquivo CSV para reposição de estoque.               |
| `GET`  | `/api/pedidos/list`            | Lista todos os pedidos processados.                           |
| `GET`  | `/api/pedidos/detail/:id`      | Retorna os detalhes de um pedido específico pelo seu ID.      |
| `GET`  | `/api/estoque/stockList`       | Lista todos os produtos e seus níveis de estoque atuais.      |
| `GET`  | `/api/estoque/movements`       | Lista todas as movimentações de estoque.                      |
| `GET`  | `/api/estoque/purchaseList`    | Lista todos os pedidos de compra gerados.                     |

## Executando os Testes

O repositório inclui tanto testes de integração automatizados com Vitest quanto scripts de teste isolados para verificação manual.

1.  **Executar Testes de Integração:**
    Execute a suíte de testes Vitest para verificar todas as rotas e a lógica de autenticação.
    ```sh
    npm test
    ```

2.  **Executar Script de Teste de Endpoints:**
    Este script testa as principais rotas GET e POST, incluindo o registro e login de usuários.
    ```sh
    npx tsx test-endpoints.ts
    ```

3.  **Executar Script de Teste Completo de Upload E2E:**
    Este script realiza um ciclo completo: login, upload dos CSVs de pedidos e de estoque, aguarda o processamento em segundo plano e, em seguida, consulta os resultados.
    ```sh
    npx tsx test-upload-complete.ts
    ```