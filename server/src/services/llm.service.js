import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Service for handling LLM interactions and suggestions
 */
class LLMService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.apiUrl = 'https://api.openai.com/v1/chat/completions';
    this.model = process.env.LLM_MODEL || 'gpt-4o-mini';
  }

  /**
   * Check if LLM service is configured
   */
  isConfigured() {
    return Boolean(this.apiKey);
  }

  /**
   * Generate suggestions for document content
   */
  async generateSuggestions(content, context = {}) {
    if (!this.isConfigured()) {
      throw new Error('LLM service not configured');
    }

    const {
      action = 'improve',
      tone = 'professional',
      length = 'maintain',
      language = 'en',
      additionalInstructions = ''
    } = context;

    const systemPrompt = `You are an expert editor and writing assistant. Your task is to provide helpful suggestions for improving written content.

Guidelines:
- Focus on clarity, grammar, style, and effectiveness
- Maintain the author's voice and intent
- Provide specific, actionable suggestions
- Suggest improvements without completely rewriting unless specifically requested
- Consider the specified tone: ${tone}
- Consider length preference: ${length}
- Respond in ${language}

Return your response as a JSON object with the following structure:
{
  "suggestions": [
    {
      "type": "grammar|style|clarity|structure|content",
      "description": "Brief description of the suggestion",
      "original": "original text that could be improved",
      "suggested": "suggested replacement or improvement",
      "explanation": "why this change improves the text"
    }
  ],
  "summary": "Brief overall assessment and recommendations"
}`;

    const userPrompt = `Please analyze and provide suggestions for the following text:

Action requested: ${action}
Additional instructions: ${additionalInstructions}

Text to analyze:
${content}`;

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from LLM');
      }

      // Parse the JSON response
      try {
        const parsed = JSON.parse(content);
        return {
          suggestions: parsed.suggestions || [],
          summary: parsed.summary || 'Analysis complete',
          timestamp: new Date().toISOString()
        };
      } catch (parseError) {
        // If JSON parsing fails, return a structured error
        console.error('Failed to parse LLM response:', content);
        return {
          suggestions: [],
          summary: 'Unable to process suggestions at this time',
          timestamp: new Date().toISOString(),
          error: 'Response parsing failed'
        };
      }

    } catch (error) {
      console.error('LLM service error:', error);
      throw new Error(`Failed to generate suggestions: ${error.message}`);
    }
  }

  /**
   * Apply suggestions to content
   */
  applySuggestions(originalContent, suggestions) {
    let modifiedContent = originalContent;

    // Sort suggestions by position to avoid offset issues
    const sortedSuggestions = suggestions
      .filter(s => s.original && s.suggested)
      .sort((a, b) => {
        const aIndex = modifiedContent.indexOf(a.original);
        const bIndex = modifiedContent.indexOf(b.original);
        return aIndex - bIndex;
      });

    // Apply each suggestion
    for (const suggestion of sortedSuggestions) {
      if (suggestion.applied !== false) { // Allow skipping suggestions
        modifiedContent = modifiedContent.replace(suggestion.original, suggestion.suggested);
      }
    }

    return {
      originalContent,
      modifiedContent,
      changes: sortedSuggestions.filter(s => s.applied !== false)
    };
  }

  /**
   * Generate content summary
   */
  async summarizeContent(content, maxLength = 100) {
    if (!this.isConfigured()) {
      throw new Error('LLM service not configured');
    }

    const prompt = `Please provide a concise summary of the following text in ${maxLength} words or less:

${content}`;

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        summary: data.choices[0]?.message?.content?.trim() || 'Summary not available',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('LLM summary error:', error);
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
  }

  /**
   * Check content for issues (grammar, clarity, etc.)
   */
  async checkContent(content) {
    if (!this.isConfigured()) {
      return {
        score: 0,
        issues: [],
        message: 'LLM service not configured'
      };
    }

    const prompt = `Analyze the following text for writing quality. Rate it on a scale of 1-10 and identify any issues:

${content}

Respond with JSON:
{
  "score": number (1-10),
  "issues": ["issue1", "issue2"],
  "strengths": ["strength1", "strength2"]
}`;

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      try {
        const parsed = JSON.parse(content);
        return {
          score: parsed.score || 5,
          issues: parsed.issues || [],
          strengths: parsed.strengths || [],
          timestamp: new Date().toISOString()
        };
      } catch (parseError) {
        return {
          score: 5,
          issues: ['Unable to analyze content'],
          strengths: [],
          timestamp: new Date().toISOString()
        };
      }

    } catch (error) {
      console.error('LLM content check error:', error);
      return {
        score: 0,
        issues: [`Analysis failed: ${error.message}`],
        strengths: [],
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default LLMService;
