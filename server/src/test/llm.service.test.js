import test from 'node:test';
import assert from 'node:assert/strict';
import LLMService from '../services/llm.service.js';

// Mock fetch for testing
const originalFetch = global.fetch;
let mockFetchResponse = {};

test.before(() => {
  global.fetch = async (url, options) => {
    return {
      ok: true,
      status: 200,
      json: async () => mockFetchResponse
    };
  };
});

test.after(() => {
  global.fetch = originalFetch;
});

test.describe('LLMService', () => {
  let llmService;

  test.before(() => {
    llmService = new LLMService();
    // Set a fake API key for testing
    process.env.OPENAI_API_KEY = 'test-key';
  });

  test.after(() => {
    delete process.env.OPENAI_API_KEY;
  });

  test('should be configured when API key is set', () => {
    assert.ok(llmService.isConfigured());
  });

  test('should not be configured when API key is not set', () => {
    delete process.env.OPENAI_API_KEY;
    assert.ok(!llmService.isConfigured());
    // Restore for other tests
    process.env.OPENAI_API_KEY = 'test-key';
  });

  test('should generate suggestions', async () => {
    mockFetchResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            suggestions: [
              {
                type: 'grammar',
                description: 'Fixed grammar error',
                original: 'This is a test',
                suggested: 'This is a test.',
                explanation: 'Added missing period'
              }
            ],
            summary: 'Grammar improvements made'
          })
        }
      }]
    };

    const result = await llmService.generateSuggestions('This is a test');

    assert.ok(result.suggestions);
    assert.ok(Array.isArray(result.suggestions));
    assert.equal(result.suggestions.length, 1);
    assert.equal(result.summary, 'Grammar improvements made');
    assert.ok(result.timestamp);
  });

  test('should apply suggestions', () => {
    const originalContent = 'This is a test';
    const suggestions = [
      {
        original: 'This is a test',
        suggested: 'This is a test.',
        applied: true
      }
    ];

    const result = llmService.applySuggestions(originalContent, suggestions);

    assert.equal(result.originalContent, originalContent);
    assert.equal(result.modifiedContent, 'This is a test.');
    assert.equal(result.changes.length, 1);
  });

  test('should skip unapplied suggestions', () => {
    const originalContent = 'This is a test';
    const suggestions = [
      {
        original: 'This is a test',
        suggested: 'This is a test.',
        applied: false
      }
    ];

    const result = llmService.applySuggestions(originalContent, suggestions);

    assert.equal(result.originalContent, originalContent);
    assert.equal(result.modifiedContent, 'This is a test');
    assert.equal(result.changes.length, 0);
  });

  test('should generate summary', async () => {
    mockFetchResponse = {
      choices: [{
        message: {
          content: 'This is a summary of the content.'
        }
      }]
    };

    const result = await llmService.summarizeContent('Long content here', 50);

    assert.equal(result.summary, 'This is a summary of the content.');
    assert.ok(result.timestamp);
  });

  test('should check content quality', async () => {
    mockFetchResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            score: 8,
            issues: ['Minor grammar issue'],
            strengths: ['Good structure']
          })
        }
      }]
    };

    const result = await llmService.checkContent('Good content');

    assert.equal(result.score, 8);
    assert.ok(Array.isArray(result.issues));
    assert.ok(Array.isArray(result.strengths));
    assert.ok(result.timestamp);
  });

  test('should handle malformed JSON responses gracefully', async () => {
    mockFetchResponse = {
      choices: [{
        message: {
          content: 'Invalid JSON response'
        }
      }]
    };

    const result = await llmService.generateSuggestions('Test content');

    assert.ok(result.suggestions);
    assert.ok(Array.isArray(result.suggestions));
    assert.ok(result.summary);
    assert.ok(result.error);
  });

  test('should handle API errors', async () => {
    // Mock a failed response
    global.fetch = async () => {
      return {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      };
    };

    try {
      await llmService.generateSuggestions('Test content');
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.ok(error.message.includes('LLM API error'));
    }

    // Restore mock
    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => mockFetchResponse
    });
  });
});
