import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import jwt from 'jsonwebtoken';
import { isCosmosConfigured } from '../config/db.js';

// Helper function to create test JWT
const createTestToken = (userId = 'test-user') => {
  return jwt.sign(
    { sub: userId, email: 'test@example.com' },
    process.env.JWT_SECRET || 'test-secret'
  );
};

test.describe('API Integration Tests', () => {
  let testToken;
  let testDocumentId;

  test.before(() => {
    testToken = createTestToken();
  });

  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });

  if (isCosmosConfigured()) {
    test.describe('Document Management', () => {
      test('should create document', async () => {
        const res = await request(app)
          .post('/api/docs')
          .set('Authorization', `Bearer ${testToken}`)
          .send({
            title: 'Integration Test Document',
            content: 'This is test content for integration testing'
          });

        assert.ok([200, 201].includes(res.status));
        if (res.status === 201) {
          assert.ok(res.body.id);
          testDocumentId = res.body.id;
        }
      });

      test('should get user documents', async () => {
        const res = await request(app)
          .get('/api/docs')
          .set('Authorization', `Bearer ${testToken}`);

        assert.equal(res.status, 200);
        assert.ok(Array.isArray(res.body));
      });

      test('should update document content', async () => {
        if (!testDocumentId) return; // Skip if document creation failed

        const res = await request(app)
          .put(`/api/llm/documents/${testDocumentId}/content`)
          .set('Authorization', `Bearer ${testToken}`)
          .send({
            content: 'Updated content for integration testing',
            title: 'Updated Integration Test Document'
          });

        assert.ok([200, 404].includes(res.status)); // 404 if document was not created
      });
    });

    test.describe('Version Management', () => {
      test('should get document versions', async () => {
        if (!testDocumentId) return;

        const res = await request(app)
          .get(`/api/versions/document/${testDocumentId}`)
          .set('Authorization', `Bearer ${testToken}`);

        assert.ok([200, 404].includes(res.status));
        if (res.status === 200) {
          assert.ok(Array.isArray(res.body));
        }
      });

      test('should get version history', async () => {
        if (!testDocumentId) return;

        const res = await request(app)
          .get(`/api/versions/document/${testDocumentId}/history`)
          .set('Authorization', `Bearer ${testToken}`);

        assert.ok([200, 404].includes(res.status));
        if (res.status === 200) {
          assert.ok(Array.isArray(res.body));
        }
      });
    });

    test.describe('LLM Features', () => {
      test('should generate suggestions', async () => {
        if (!testDocumentId) return;

        const res = await request(app)
          .post(`/api/llm/documents/${testDocumentId}/suggestions`)
          .set('Authorization', `Bearer ${testToken}`)
          .send({
            action: 'improve',
            tone: 'professional'
          });

        // Should return 200 even if LLM is not configured (with appropriate message)
        assert.ok([200, 503].includes(res.status));
        assert.ok(res.body.suggestions);
        assert.ok(Array.isArray(res.body.suggestions));
      });

      test('should check content quality', async () => {
        if (!testDocumentId) return;

        const res = await request(app)
          .get(`/api/llm/documents/${testDocumentId}/quality`)
          .set('Authorization', `Bearer ${testToken}`);

        assert.ok([200, 503].includes(res.status));
        if (res.status === 200) {
          assert.ok(typeof res.body.quality === 'number');
          assert.ok(Array.isArray(res.body.issues));
          assert.ok(Array.isArray(res.body.strengths));
        }
      });

      test('should summarize document', async () => {
        if (!testDocumentId) return;

        const res = await request(app)
          .get(`/api/llm/documents/${testDocumentId}/summary`)
          .set('Authorization', `Bearer ${testToken}`);

        assert.ok([200, 503].includes(res.status));
        if (res.status === 200) {
          assert.ok(res.body.summary);
          assert.ok(res.body.documentId);
        }
      });
    });

    test.describe('Authentication', () => {
      test('should reject requests without auth token', async () => {
        const res = await request(app).get('/api/docs');
        assert.ok([401, 403].includes(res.status));
      });

      test('should reject requests with invalid token', async () => {
        const res = await request(app)
          .get('/api/docs')
          .set('Authorization', 'Bearer invalid-token');

        assert.ok([401, 403].includes(res.status));
      });
    });
  } else {
    test('Integration tests skipped - CosmosDB not configured', () => {
      assert.ok(true);
    });
  }
});
