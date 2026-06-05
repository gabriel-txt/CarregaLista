import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
  validateStatus: () => true,
});

interface TestResult {
  name: string;
  status: number;
  success: boolean;
  data?: unknown;
  error?: string;
}

const results: TestResult[] = [];

// Gerar email único com timestamp
const uniqueEmail = `teste+${Date.now()}@example.com`;

async function runTests() {
  console.log('🚀 Iniciando testes dos endpoints...\n');

  // 1. Testar registro de usuário
  console.log('1️⃣  Testando POST /auth/register');
  const registerRes = await api.post('/auth/register', {
    name: 'Teste User',
    email: uniqueEmail,
    password: 'senha123',
  });
  results.push({
    name: 'POST /auth/register',
    status: registerRes.status,
    success: registerRes.status === 201,
    data: registerRes.data,
  });
  console.log(`  Status: ${registerRes.status}`);
  console.log(`  Email: ${uniqueEmail}`);
  console.log(`  Response:`, registerRes.data, '\n');

  // 2. Testar login
  console.log('2️⃣  Testando POST /auth/login');
  const loginRes = await api.post('/auth/login', {
    email: uniqueEmail,
    password: 'senha123',
  });
  results.push({
    name: 'POST /auth/login',
    status: loginRes.status,
    success: loginRes.status === 200,
    data: loginRes.data,
  });
  const token = loginRes.data?.token;
  console.log(`  Status: ${loginRes.status}`);
  console.log(`  Token: ${token ? '✅ Recebido' : '❌ Não recebido'}`);
  if (token) {
    console.log(`  Token Válido: ${token.substring(0, 50)}...`);
  }
  console.log(`  Response:`, loginRes.data, '\n');

  // Configurar header com token para próximos testes
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // 3. Testar GET /pedidos/list
  console.log('3️⃣  Testando GET /pedidos/list (autenticado)');
  const listPedidosRes = await api.get('/pedidos/list');
  results.push({
    name: 'GET /pedidos/list',
    status: listPedidosRes.status,
    success: listPedidosRes.status === 200,
    data: listPedidosRes.data,
  });
  console.log(`  Status: ${listPedidosRes.status}`);
  console.log(`  Registros: ${Array.isArray(listPedidosRes.data) ? listPedidosRes.data.length : 'N/A'}`);
  console.log(`  Response:`, listPedidosRes.data, '\n');

  // 4. Testar GET /estoque/stockList
  console.log('4️⃣  Testando GET /estoque/stockList (autenticado)');
  const stockRes = await api.get('/estoque/stockList');
  results.push({
    name: 'GET /estoque/stockList',
    status: stockRes.status,
    success: stockRes.status === 200,
    data: stockRes.data,
  });
  console.log(`  Status: ${stockRes.status}`);
  console.log(`  Registros: ${Array.isArray(stockRes.data) ? stockRes.data.length : 'N/A'}`);
  console.log(`  Response:`, stockRes.data, '\n');

  // 5. Testar GET /estoque/movements
  console.log('5️⃣  Testando GET /estoque/movements (autenticado)');
  const movementsRes = await api.get('/estoque/movements');
  results.push({
    name: 'GET /estoque/movements',
    status: movementsRes.status,
    success: movementsRes.status === 200,
    data: movementsRes.data,
  });
  console.log(`  Status: ${movementsRes.status}`);
  console.log(`  Registros: ${Array.isArray(movementsRes.data) ? movementsRes.data.length : 'N/A'}`);
  console.log(`  Response:`, movementsRes.data, '\n');

  // 6. Testar GET /estoque/purchaseList
  console.log('6️⃣  Testando GET /estoque/purchaseList (autenticado)');
  const purchaseRes = await api.get('/estoque/purchaseList');
  results.push({
    name: 'GET /estoque/purchaseList',
    status: purchaseRes.status,
    success: purchaseRes.status === 200,
    data: purchaseRes.data,
  });
  console.log(`  Status: ${purchaseRes.status}`);
  console.log(`  Registros: ${Array.isArray(purchaseRes.data) ? purchaseRes.data.length : 'N/A'}`);
  console.log(`  Response:`, purchaseRes.data, '\n');

  // Resumo
  console.log('='.repeat(60));
  console.log('📊 RESUMO DOS TESTES\n');
  let successCount = 0;
  results.forEach((result) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name.padEnd(30)} Status: ${result.status}`);
    if (!result.success && typeof result.data === 'object' && result.data !== null) {
      const msg = (result.data as Record<string, unknown>).message;
      if (msg && typeof msg === 'string') {
        const errorLine = msg.split('\n')[0];
        console.log(`   └─ Erro: ${errorLine}`);
      }
    }
    if (result.success) successCount++;
  });
  console.log(`\n✅ ${successCount}/${results.length} testes passaram`);
  console.log('='.repeat(60));
}

runTests().catch((err) => {
  console.error('Erro ao executar testes:', err.message);
  process.exit(1);
});

