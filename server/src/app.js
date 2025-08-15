// server/src/app.js
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { router as sessionRouter } from './routes/session.routes.js';
import { router as movieRouter } from './routes/movie.routes.js';
import { errorHandler } from './middlewares/error-handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// 🔹 Health for quick test
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// 🔹 MOUNT API ROUTES (harus sebelum static)
app.use('/api/session', sessionRouter);
app.use('/api/movies', movieRouter);

// 🔹 Serve frontend (setelah API)
const publicDir = path.resolve(__dirname, '../../client/public');
app.use(express.static(publicDir));
app.get('*', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));

// 🔹 Error last
app.use(errorHandler);

export default app;