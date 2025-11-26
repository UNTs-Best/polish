# Polish Server

A Node.js/Express server for document management with AI-powered editing capabilities.

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# CosmosDB Configuration
COSMOS_ENDPOINT=https://your-cosmos-account.documents.azure.com:443/
COSMOS_KEY=your-cosmos-key
COSMOS_DATABASE=polishdb

# Azure Blob Storage Configuration
AZURE_STORAGE_ACCOUNT=your-storage-account
AZURE_STORAGE_KEY=your-storage-key
AZURE_STORAGE_CONTAINER=documents

# JWT Authentication
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OAuth Configuration (Google)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback

# OAuth Configuration (GitHub)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=http://localhost:3000/api/oauth/github/callback

# OAuth Configuration (Apple)
APPLE_CLIENT_ID=your-apple-client-id
APPLE_CLIENT_SECRET=your-apple-client-secret
APPLE_REDIRECT_URI=http://localhost:3000/api/oauth/apple/callback

# Legacy Auth0 (Optional)
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_AUDIENCE=your-auth0-api-identifier
AUTH0_CLIENT_ID=your-auth0-client-id

# LLM Configuration (OpenAI)
OPENAI_API_KEY=your-openai-api-key
LLM_MODEL=gpt-4o-mini
```

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Production

```bash
npm run build
npm start
```

## Testing

```bash
npm test
```

## API Endpoints

### Documents
- `GET /api/docs` - Get user's documents
- `POST /api/docs` - Upload new document
- `PUT /api/docs/:id` - Update document
- `DELETE /api/docs/:id` - Delete document

### Versions
- `GET /api/versions/document/:documentId` - Get document versions
- `GET /api/versions/document/:documentId/history` - Get version history
- `GET /api/versions/:versionId` - Get specific version
- `POST /api/versions/document/:documentId/restore/:versionId` - Restore to version

### AI/LLM
- `POST /api/llm/documents/:documentId/suggestions` - Generate suggestions
- `POST /api/llm/documents/:documentId/apply-suggestions` - Apply suggestions
- `GET /api/llm/documents/:documentId/summary` - Summarize document
- `GET /api/llm/documents/:documentId/quality` - Check content quality
- `PUT /api/llm/documents/:documentId/content` - Update document content

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password

### OAuth Authentication
- `GET /api/oauth/providers` - Get available OAuth providers
- `GET /api/oauth/:provider/url` - Get OAuth authorization URL
- `GET /api/oauth/:provider` - Initiate OAuth flow
- `GET /api/oauth/:provider/callback` - Handle OAuth callback
- `POST /api/oauth/:provider/callback` - Handle OAuth callback (POST)

### Upload
- `POST /api/upload` - File upload

## Database

The application uses Azure CosmosDB with the following containers:
- `Documents` - Document metadata and content
- `Versions` - Document version history
- `Users` - User accounts
- `AIInteractions` - AI interaction logs
