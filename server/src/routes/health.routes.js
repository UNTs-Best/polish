import express from 'express';
import { dbHealth } from '../controllers/health.controller.js';

const router = express.Router();

router.get('/db', dbHealth);

export default router;


