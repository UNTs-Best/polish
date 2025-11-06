import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import jwt from 'jsonwebtoken';
import { isCosmosConfigured } from '../config/db.js';

test('POST /api/llm/suggest returns placeholder', async () => {
  const res = await request(app).post('/api/llm/suggest').send({ text: 'Hello' });
  assert.equal(res.status, 200);
  assert.ok(res.body.message);
});

test('GET unknown route returns 404', async () => {
  const res = await request(app).get('/nope-route-404');
  assert.equal(res.status, 404);
  assert.equal(res.body.message, 'Endpoint not found');
});

test('POST /api/auth/login without credentials returns 400', async () => {
  const res = await request(app).post('/api/auth/login');
  assert.equal(res.status, 400);
});

if (isCosmosConfigured()) {
  test('POST 6/api/auth/register creates user', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'test@example.com', password: 'pw' });
    assert.equal(res.status, 201);
    assert.equal(res.body.email, 'test@example.com');
  });
}

if (isCosmosConfigured()) {
  test('POST /api/auth/login issues JWT and GET /api/auth/me returns user', async () => {
    // Ensure user exists
    await request(app).post('/api/auth/register').send({ email: 'login@example.com', password: 'pw' });
    const loginRes = await request(app).post('/api/auth/login').send({ email: 'login@example.com', password: 'pw' });
    assert.equal(loginRes.status, 200);
    assert.ok(loginRes.body.token);
    const meRes = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${loginRes.body.token}`);
    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.user.email, 'login@example.com');
  });
}

test('GET /api/health/db reports status', async () => {
  const res = await request(app).get('/api/health/db');
  assert.ok([200,500].includes(res.status));
});

test('POST /api/upload without file returns 400', async () => {
  const res = await request(app).post('/api/upload');
  assert.equal(res.status, 400);
});

test('GET / returns home payload', async () => {
  const res = await request(app).get('/');
  assert.equal(res.status, 200);
  assert.equal(res.body.name, 'Polish API');
  assert.equal(res.body.status, 'ok');
});


