# Azure OpenAI Service Setup Guide

This application uses Azure OpenAI Service (via Azure AI Foundry) for AI-powered resume suggestions.

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Azure OpenAI Service Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com
AZURE_OPENAI_API_KEY=your-azure-openai-api-key-here
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

## Getting Your Azure OpenAI Credentials

### 1. Access Azure Portal or AI Studio

- **Azure Portal**: https://portal.azure.com
- **AI Studio**: https://ai.azure.com

### 2. Find Your OpenAI Resource

1. Navigate to your Azure OpenAI resource
2. Go to **Keys and Endpoint** section (in Azure Portal) or **Deployments** (in AI Studio)

### 3. Get Your Endpoint

Your endpoint URL format: `https://{your-resource-name}.openai.azure.com`

Example: `https://my-resource.openai.azure.com`

### 4. Get Your API Key

- In Azure Portal: Copy either **Key 1** or **Key 2** from the Keys section
- Store this securely - you won't be able to view it again after leaving the page

### 5. Get Your Deployment Name

This is the name you gave your model deployment. Common names:
- `gpt-4o`
- `gpt-4`
- `gpt-35-turbo`
- `gpt-4-turbo`

You can find this in:
- **AI Studio**: Go to Deployments section
- **Azure Portal**: Go to Model deployments section

### 6. Set API Version (Optional)

The default is `2024-02-15-preview`. You can use other versions like:
- `2023-12-01-preview`
- `2023-05-15`

Check Azure documentation for the latest supported version.

## Configuration Example

```bash
# .env.local
AZURE_OPENAI_ENDPOINT=https://my-polish-app.openai.azure.com
AZURE_OPENAI_API_KEY=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

## Fallback Behavior

If Azure OpenAI is not configured, the application will:
- Show a warning in the console
- Fall back to mock/hardcoded responses for basic functionality
- Display helpful error messages to users

## Testing Your Configuration

1. Start the development server: `npm run dev`
2. Open the editor page
3. Try asking the AI chat to improve a resume section
4. Check the browser console for any error messages
5. Check the server console for Azure OpenAI connection status

## Troubleshooting

### Error: "Azure OpenAI Service is not configured"

- Check that all required environment variables are set
- Ensure `.env.local` is in the root directory
- Restart the development server after adding environment variables

### Error: "401 Unauthorized"

- Verify your API key is correct
- Check that your API key hasn't expired or been rotated
- Ensure you're using the correct endpoint URL

### Error: "404 Not Found"

- Verify your deployment name is correct
- Check that the deployment exists in your Azure OpenAI resource
- Ensure the deployment is in "Succeeded" status

### Error: "429 Too Many Requests"

- You've hit rate limits on your Azure OpenAI resource
- Wait a moment and try again
- Consider upgrading your Azure OpenAI quota

## Security Notes

- **Never commit** your `.env.local` file to version control
- Store API keys securely
- Use different keys for development and production
- Rotate keys regularly for security


