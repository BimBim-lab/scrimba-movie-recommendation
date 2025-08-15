import { v4 as uuid } from 'uuid';
import { assert } from '../utils/validate.js';
import { createEmbedding, prettyExplainChoice } from '../services/openai.service.js';
import { getSessionResponses, matchMovies, storeUserResponse } from '../services/supabase.service.js';

/* ---------- helpers ---------- */

/** Pastikan embedding dari DB jadi array<number> */
function toArrayEmbedding(e) {
  if (Array.isArray(e)) {
    return e.map(Number);
  }
  // Supabase kadang mengembalikan { data: [...] }
  if (e && typeof e === 'object' && Array.isArray(e.data)) {
    return e.data.map(Number);
  }
  // Atau string "[0.1, -0.2, ...]"
  if (typeof e === 'string') {
    try {
      const maybe = JSON.parse(e);
      if (Array.isArray(maybe)) return maybe.map(Number);
    } catch {
      // fallback parser simple
      const parts = e.replace(/[^\dEe+\-.,]+/g, '').split(',');
      const arr = parts.map(n => Number(n)).filter(Number.isFinite);
      if (arr.length) return arr;
    }
  }
  throw new Error('Embedding from DB is not an array');
}

/* ---------- controllers ---------- */

export const startSession = async (req, res, next) => {
  try {
    const { totalPeople, timeLimit } = req.body || {};
    assert(!Number.isNaN(Number(totalPeople)) && Number(totalPeople) > 0, 'totalPeople invalid');

    const sessionId = uuid();
    res.json({ sessionId, totalPeople: Number(totalPeople), timeLimit: timeLimit || '' });
  } catch (e) {
    next(e);
  }
};

export const submitAnswers = async (req, res, next) => {
  try {
    const { sessionId, personNum, answers } = req.body || {};
    assert(sessionId, 'sessionId required');
    assert(personNum != null, 'personNum required');

    // gabung jawaban untuk di-embedding
    const merged = [
      `Favorite/Why: ${answers?.favoriteWhy || ''}`,
      `Era: ${answers?.era || ''}`,
      `Moods: ${(answers?.moods || []).join(', ')}`,
      `IslandWho: ${answers?.islandWho || ''}`,
      `TimeLimit: ${answers?.timeLimit || ''}`,
    ].join('\n');

    const embedding = await createEmbedding(merged);

    await storeUserResponse({
      session_id: sessionId,
      person_num: Number(personNum),
      answers,
      embedding,
    });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};

export const recommend = async (req, res, next) => {
  try {
    const { sessionId } = req.query || {};
    assert(sessionId, 'sessionId required');

    // Ambil semua embedding jawaban di session
    const rows = await getSessionResponses(sessionId);
    assert(rows.length > 0, 'no responses found');

    // Normalisasi -> array<number>
    const embeddings = rows.map(({ embedding }) => toArrayEmbedding(embedding));
    const dim = embeddings[0].length;

    // Pastikan semua dimensi konsisten
    for (const e of embeddings) {
      if (e.length !== dim) {
        throw new Error(`Embedding dimension mismatch: expected ${dim}, got ${e.length}`);
      }
    }

    // Hitung rata-rata vektor
    const avg = Array(dim).fill(0);
    for (const vec of embeddings) {
      for (let i = 0; i < dim; i++) avg[i] += vec[i];
    }
    for (let i = 0; i < dim; i++) avg[i] /= embeddings.length;

    // Cari film yang paling mirip
    const movies = await matchMovies({ query_embedding: avg, match_count: 6 });

    if (!movies.length) {
      return res.json({ movies: [] });
    }

    // Bikin alasan singkat untuk kandidat #1 (pakai 3 teratas supaya konteks bagus)
    const summary = `People: ${embeddings.length}.`;
    let pretty = '';
    try {
      pretty = await prettyExplainChoice(movies.slice(0, 3), summary);
    } catch {
      // diamkan jika GPT gagal
      pretty = '';
    }

    const out = movies.map((m, idx) => ({
      ...m,
      pretty_reason: idx === 0 && pretty ? pretty : undefined,
    }));

    res.json({ movies: out });
  } catch (e) {
    next(e);
  }
};