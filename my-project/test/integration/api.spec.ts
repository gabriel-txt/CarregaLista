import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios, { AxiosInstance } from 'axios';

const API_URL = 'http://localhost:4000/api';

let api: AxiosInstance;
let authToken: string;
const testEmail = `test-${Date.now()}@test.com`;

describe('Backend API Integration Tests', () => {
  beforeAll(async () => {
    api = axios.create({
      baseURL: API_URL,
      validateStatus: () => true,
    });

    // Register and login for tests
    const registerRes = await api.post('/auth/register', {
      name: 'Test User',
      email: testEmail,
      password: 'test123456',
    });

    expect(registerRes.status).toBe(201);

    const loginRes = await api.post('/auth/login', {
      email: testEmail,
      password: 'test123456',
    });

    expect(loginRes.status).toBe(200);
    authToken = loginRes.data.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const email = `newuser-${Date.now()}@test.com`;
      const res = await api.post('/auth/register', {
        name: 'New User',
        email,
        password: 'password123',
      });

      expect(res.status).toBe(201);
      expect(res.data.id).toBeDefined();
      expect(res.data.email).toBe(email);
    });

    it('should not register user with invalid email', async () => {
      const res = await api.post('/auth/register', {
        name: 'Invalid User',
        email: 'not-an-email',
        password: 'password123',
      });

      expect(res.status).toBe(400);
    });

    it('should login with valid credentials', async () => {
      const res = await api.post('/auth/login', {
        email: testEmail,
        password: 'test123456',
      });

      expect(res.status).toBe(200);
      expect(res.data.token).toBeDefined();
    });

    it('should not login with invalid credentials', async () => {
      const res = await api.post('/auth/login', {
        email: testEmail,
        password: 'wrongpassword',
      });

      expect(res.status).toBe(400);
    });
  });

  describe('Protected Endpoints', () => {
    it('should return 401 without token', async () => {
      const noAuthApi = axios.create({
        baseURL: API_URL,
        validateStatus: () => true,
      });

      const res = await noAuthApi.get('/pedidos/list');
      expect(res.status).toBe(401);
    });

    it('should get pedidos list with token', async () => {
      const res = await api.get('/pedidos/list');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('should get estoque stockList with token', async () => {
      const res = await api.get('/estoque/stockList');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('should get estoque movements with token', async () => {
      const res = await api.get('/estoque/movements');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('should get estoque purchaseList with token', async () => {
      const res = await api.get('/estoque/purchaseList');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });
  });

  describe('API Response Format', () => {
    it('should return proper user object on register', async () => {
      const email = `format-test-${Date.now()}@test.com`;
      const res = await api.post('/auth/register', {
        name: 'Format Test',
        email,
        password: 'password123',
      });

      expect(res.data).toHaveProperty('id');
      expect(res.data).toHaveProperty('name');
      expect(res.data).toHaveProperty('email');
      expect(res.data).toHaveProperty('createdAt');
    });

    it('should return token object on login', async () => {
      const res = await api.post('/auth/login', {
        email: testEmail,
        password: 'test123456',
      });

      expect(res.data).toHaveProperty('token');
      expect(typeof res.data.token).toBe('string');
    });

    it('pedidos should have required fields', async () => {
      const res = await api.get('/pedidos/list');

      if (res.data.length > 0) {
        const pedido = res.data[0];
        expect(pedido).toHaveProperty('id');
        expect(pedido).toHaveProperty('orderId');
        expect(pedido).toHaveProperty('status');
        expect(pedido).toHaveProperty('data');
        expect(pedido).toHaveProperty('valorTotal');
      }
    });
  });
});
