import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import { isCosmosConfigured } from '../config/db.js';

if (isCosmosConfigured()) {
  test.describe('Authentication System', () => {
    let testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'testpassword123',
      firstName: 'Test',
      lastName: 'User'
    };

    let accessToken;
    let refreshToken;

    test('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      assert.equal(res.status, 201);
      assert.ok(res.body.user);
      assert.equal(res.body.user.email, testUser.email);
      assert.ok(res.body.user.id);
      assert.ok(res.body.message.includes('registered'));
    });

    test('should login user and return tokens', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      assert.equal(res.status, 200);
      assert.ok(res.body.accessToken);
      assert.ok(res.body.refreshToken);
      assert.ok(res.body.user);
      assert.equal(res.body.user.email, testUser.email);
      assert.ok(res.body.expiresIn);

      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    test('should get current user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      assert.equal(res.status, 200);
      assert.ok(res.body.user);
      assert.equal(res.body.user.email, testUser.email);
      assert.equal(res.body.user.firstName, testUser.firstName);
    });

    test('should update user profile', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name'
        });

      assert.equal(res.status, 200);
      assert.ok(res.body.user);
      assert.equal(res.body.user.firstName, 'Updated');
      assert.equal(res.body.user.lastName, 'Name');
    });

    test('should refresh access token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      assert.equal(res.status, 200);
      assert.ok(res.body.accessToken);
      assert.ok(res.body.expiresIn);

      // Update access token for subsequent tests
      accessToken = res.body.accessToken;
    });

    test('should change password', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: 'newpassword123'
        });

      assert.equal(res.status, 200);
      assert.ok(res.body.message.includes('changed'));

      // Update password for cleanup
      testUser.password = 'newpassword123';
    });

    test('should login with new password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      assert.equal(res.status, 200);
      assert.ok(res.body.accessToken);

      // Update token
      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    test('should logout user', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      assert.equal(res.status, 200);
      assert.ok(res.body.message.includes('logged out'));
    });

    test('should reject requests with invalid token after logout', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      // Should fail because refresh token was invalidated
      assert.ok([401, 403].includes(res.status));
    });
  });

  test.describe('OAuth Endpoints', () => {
    test('should get available OAuth providers', async () => {
      const res = await request(app)
        .get('/api/oauth/providers');

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.providers));
      // Note: providers array will be empty if no OAuth is configured
    });
  });
} else {
  test('Authentication tests skipped - CosmosDB not configured', () => {
    assert.ok(true);
  });
}
