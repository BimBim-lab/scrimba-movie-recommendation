import { Router } from 'express';
import { recommend, startSession, submitAnswers } from '../controllers/session.controller.js'

export const router = Router();

// POST /api/session/start
router.post('/start', startSession);

// POST /api/session/answers
router.post('/answers', submitAnswers);

// GET /api/session/recommend?sessionId=...
router.get('/recommend', recommend);