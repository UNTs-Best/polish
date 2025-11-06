import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { me, list } from '../controllers/user.controller.js';

const router = express.Router();

// Current user info (upserts into Cosmos on first hit)
router.get('/me', requireAuth, me);

// Admin/list (for now no role check; relies on JWT when configured)
router.get('/', requireAuth, list);

export default router;


