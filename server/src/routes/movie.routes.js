import { Router } from 'express';
import { ping } from '../controllers/movie.controller.js';

export const router = Router();

router.get('/ping', ping);