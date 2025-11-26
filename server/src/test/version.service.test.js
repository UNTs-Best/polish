import test from 'node:test';
import assert from 'node:assert/strict';
import VersionService from '../services/version.service.js';
import { isCosmosConfigured } from '../config/db.js';

if (isCosmosConfigured()) {
  test.describe('VersionService', () => {
    let versionService;
    let testDocumentId;
    let testOwnerId;

    test.before(async () => {
      versionService = new VersionService();
      testDocumentId = 'test-doc-' + Date.now();
      testOwnerId = 'test-user-' + Date.now();
    });

    test('should create a new version', async () => {
      const versionData = {
        ownerId: testOwnerId,
        title: 'Test Document',
        content: 'This is test content',
        changes: ['Initial creation']
      };

      const version = await versionService.createVersion(testDocumentId, versionData);

      assert.ok(version.id);
      assert.equal(version.documentId, testDocumentId);
      assert.equal(version.version, 1);
      assert.equal(version.title, 'Test Document');
      assert.equal(version.content, 'This is test content');
      assert.ok(version.createdAt);
    });

    test('should get document versions', async () => {
      const versions = await versionService.getDocumentVersions(testDocumentId);

      assert.ok(Array.isArray(versions));
      assert.ok(versions.length > 0);
      assert.equal(versions[0].documentId, testDocumentId);
    });

    test('should get latest version', async () => {
      const latest = await versionService.getLatestVersion(testDocumentId);

      assert.ok(latest);
      assert.equal(latest.documentId, testDocumentId);
      assert.equal(latest.version, 1);
    });

    test('should create second version', async () => {
      const versionData = {
        ownerId: testOwnerId,
        title: 'Test Document Updated',
        content: 'This is updated test content',
        changes: ['Content updated']
      };

      const version = await versionService.createVersion(testDocumentId, versionData);

      assert.equal(version.version, 2);
      assert.equal(version.title, 'Test Document Updated');
      assert.equal(version.content, 'This is updated test content');
    });

    test('should get version by id', async () => {
      const versions = await versionService.getDocumentVersions(testDocumentId);
      const versionId = versions[0].id;

      const version = await versionService.getVersionById(versionId);

      assert.ok(version);
      assert.equal(version.id, versionId);
      assert.equal(version.documentId, testDocumentId);
    });

    test('should get version history', async () => {
      const history = await versionService.getVersionHistory(testDocumentId);

      assert.ok(Array.isArray(history));
      assert.ok(history.length >= 2);

      // Check that versions are ordered by version number descending
      for (let i = 0; i < history.length - 1; i++) {
        assert.ok(history[i].version > history[i + 1].version);
      }
    });

    test('should restore to previous version', async () => {
      const versions = await versionService.getDocumentVersions(testDocumentId);
      const firstVersion = versions.find(v => v.version === 1);

      const restoredVersion = await versionService.restoreVersion(
        testDocumentId,
        firstVersion.id,
        testOwnerId
      );

      assert.ok(restoredVersion);
      assert.equal(restoredVersion.version, 3);
      assert.equal(restoredVersion.title, firstVersion.title);
      assert.equal(restoredVersion.content, firstVersion.content);
    });

    test('should delete document versions', async () => {
      const deletedCount = await versionService.deleteDocumentVersions(testDocumentId);

      assert.ok(deletedCount >= 3);

      // Verify versions are deleted
      const versions = await versionService.getDocumentVersions(testDocumentId);
      assert.equal(versions.length, 0);
    });
  });
} else {
  test('VersionService tests skipped - CosmosDB not configured', () => {
    assert.ok(true);
  });
}
