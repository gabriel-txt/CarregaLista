import axios, { AxiosInstance } from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const API_URL = 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
  validateStatus: () => true,
});

interface TestResult {
  name: string;
  status: number;
  success: boolean;
  message?: string;
  data?: unknown;
}

const results: TestResult[] = [];
const uniqueEmail = `teste+${Date.now()}@example.com`;
let authToken: string | null = null;

async function login() {
  console.log('🔐 Fazendo login...');
  const registerRes = await api.post('/auth/register', {
    name: 'Teste Upload',
    email: uniqueEmail,
    password: 'senha123',
  });

  if (registerRes.status !== 201) {
    console.log('❌ Falha no registro:', registerRes.data);
    return false;
  }

  const loginRes = await api.post('/auth/login', {
    email: uniqueEmail,
    password: 'senha123',
  });

  if (loginRes.status !== 200 || !loginRes.data?.token) {
    console.log('❌ Falha no login:', loginRes.data);
    return false;
  }

  authToken = loginRes.data.token;
  api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  console.log('✅ Login realizado com sucesso\n');
  return true;
}

async function uploadFile(endpoint: string, filePath: string, testName: string) {
  console.log(`📤 ${testName}`);
  
  try {
    const fileContent = fs.readFileSync(filePath);
    const form = new FormData();
    form.append('file', fileContent, path.basename(filePath));

    const response = await api.post(endpoint, form, {
      headers: form.getHeaders(),
    });

    results.push({
      name: testName,
      status: response.status,
      success: response.status === 202,
      message: response.data?.batchId || response.data?.message,
      data: response.data,
    });

    console.log(`  Status: ${response.status}`);
    if (response.status === 202) {
      console.log(`  Batch ID: ${response.data.batchId}`);
      console.log(`  ✅ Upload aceito\n`);
    } else {
      console.log(`  ❌ Erro: ${JSON.stringify(response.data)}\n`);
    }
  } catch (error) {
    results.push({
      name: testName,
      status: 0,
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log(`  ❌ Erro: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
  }
}

async function queryData(endpoint: string, testName: string) {
  console.log(`📊 ${testName}`);
  
  const response = await api.get(endpoint);
  const count = Array.isArray(response.data) ? response.data.length : 0;
  
  results.push({
    name: testName,
    status: response.status,
    success: response.status === 200,
    message: `${count} registros`,
    data: response.data,
  });

  console.log(`  Status: ${response.status}`);
  console.log(`  Registros: ${count}`);
  if (response.status === 200 && count > 0) {
    console.log(`  Primeiro registro:`, JSON.stringify(response.data[0], null, 2).substring(0, 200) + '...');
  }
  console.log();
}

async function runTests() {
  console.log('🚀 TESTE COMPLETO DO BACKEND\n');
  console.log('='.repeat(70) + '\n');

  // 1. Login
  if (!(await login())) {
    console.log('❌ Falha ao fazer login. Abortando testes.');
    process.exit(1);
  }

  // 2. Upload de pedidos
  await uploadFile('/pedidos/upload', './test-data/pedidos.csv', 'Upload de Pedidos CSV');

  // 3. Upload de estoque
  await uploadFile('/estoque/reposicao', './test-data/estoque.csv', 'Upload de Estoque CSV');

  // Aguardar um pouco para processamento em background
  console.log('⏳ Aguardando processamento em background...');
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log('✅ Continuando...\n');

  // 4. Consultar pedidos
  await queryData('/pedidos/list', 'Listagem de Pedidos');

  // 5. Consultar estoque
  await queryData('/estoque/stockList', 'Listagem de Estoque');

  // 6. Consultar movimentações
  await queryData('/estoque/movements', 'Movimentações de Estoque');

  // 7. Consultar compras
  await queryData('/estoque/purchaseList', 'Listagem de Compras');

  // Resumo
  console.log('='.repeat(70));
  console.log('📊 RESUMO FINAL\n');
  let successCount = 0;
  results.forEach((result) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name.padEnd(35)} | Status: ${result.status.toString().padEnd(3)} | ${result.message}`);
    if (result.success) successCount++;
  });
  console.log(`\n✅ ${successCount}/${results.length} testes passaram`);
  console.log('='.repeat(70));

  if (successCount === results.length) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM! Backend funcionando perfeitamente!\n');
  } else {
    console.log('\n⚠️  Alguns testes falharam. Verifique os logs acima.\n');
  }
}

runTests().catch((err) => {
  console.error('Erro ao executar testes:', err.message);
  process.exit(1);
});
