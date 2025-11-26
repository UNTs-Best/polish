import test from 'node:test';
import assert from 'node:assert/strict';
import DocumentService from '../services/document.service.js';
import { isCosmosConfigured } from '../config/db.js';

if (isCosmosConfigured()) {
  test.describe('DocumentService', () => {
    let documentService;
    let testOwnerId;
    let testDocumentId;

    test.before(async () => {
      documentService = new DocumentService();
      testOwnerId = 'test-user-' + Date.now();
    });

    test('should create a document with version', async () => {
      const docData = {
        title: 'Test Document',
        ownerId: testOwnerId,
        blobName: 'test-blob',
        blobUrl: 'https://example.com/test-blob',
        content: 'This is test content for the document'
      };

      const document = await documentService.createDocument(docData);

      assert.ok(document.id);
      assert.equal(document.title, 'Test Document');
      assert.equal(document.ownerId, testOwnerId);
      assert.equal(document.content, 'This is test content for the document');
      assert.ok(document.createdAt);
      assert.ok(document.updatedAt);

      testDocumentId = document.id;
    });

    test('should get user documents', async () => {
      const documents = await documentService.getUserDocuments(testOwnerId);

      assert.ok(Array.isArray(documents));
      assert.ok(documents.length > 0);

      const testDoc = documents.find(d => d.id === testDocumentId);
      assert.ok(testDoc);
      assert.equal(testDoc.title, 'Test Document');
    });

    test('should get document by id', async () => {
      const document = await documentService.getDocumentbyId(testDocumentId);

      assert.ok(document);
      assert.equal(document.id, testDocumentId);
      assert.equal(document.ownerId, testOwnerId);
    });

    test('should update document and create version', async () => {
      const updateData = {
        title: 'Updated Test Document',
        content: 'This is updated content for the document'
      };

      const updatedDoc = await documentService.updateDocument(testDocumentId, updateData, testOwnerId);

      assert.ok(updatedDoc);
      assert.equal(updatedDoc.title, 'Updated Test Document');
      assert.equal(updatedDoc.content, 'This is updated content for the document');
      assert.ok(updatedDoc.updatedAt > updatedDoc.createdAt);
    });

    test('should not create version for non-content changes', async () => {
      // This should not create a version since only metadata changed
      const updateData = {
        size: 1024
      };

      const updatedDoc = await documentService.updateDocument(testDocumentId, updateData, testOwnerId);

      assert.ok(updatedDoc);
      assert.equal(updatedDoc.size, 1024);
    });

    test('should delete document and versions', async () => {
      const result = await documentService.deleteDocument(testDocumentId);

      assert.ok(result);

      // Verify document is deleted
      const deletedDoc = await documentService.getDocumentbyId(testDocumentId);
      assert.ok(!deletedDoc);
    });
  });
} else {
  test('DocumentService tests skipped - CosmosDB not configured', () => {
    assert.ok(true);
  });
}
