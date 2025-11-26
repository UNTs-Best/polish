import express from 'express';
import {
  getAuthProviders,
  getAuthUrl,
  handleCallback,
  initiateAuth
} from '../controllers/oauth.controller.js';

const router = express.Router();

// Get available OAuth providers
router.get('/providers', getAuthProviders);

// Get authorization URL for a provider
router.get('/:provider/url', getAuthUrl);

// Initiate OAuth flow (redirect or return URL)
router.get('/:provider', initiateAuth);

// Handle OAuth callback
router.get('/:provider/callback', handleCallback);

// Support POST callback for some providers
router.post('/:provider/callback', handleCallback);

export default router;
