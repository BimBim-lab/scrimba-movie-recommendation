// server/scripts/ingest-movies.js
import { createEmbedding } from '../src/services/openai.service.js';
import { upsertMovie } from '../src/services/supabase.service.js';
import dataset from '../src/data/content.js';

async function run() {
  console.log(`Ingesting ${dataset.length} movies...`);
  let ok = 0, fail = 0;

  for (const item of dataset) {
    try {
      const text = [
        item.title,
        item.releaseYear,
        item.content,
        item.genres || '',
      ].join('\n');

      const embedding = await createEmbedding(text);

      await upsertMovie({
        title: item.title,
        year: Number(item.releaseYear) || 0,
        description: item.content || '',
        poster_url: item.poster_url || null,
        genres: item.genres || null,
        duration: item.duration || null,
        rating: item.rating || null,
        embedding,
      });

      ok++;
      process.stdout.write('.');
    } catch (e) {
      fail++;
      console.error('\nIngest error:', e.message);
    }
  }

  console.log(`\nDone. OK=${ok} FAIL=${fail}`);
  process.exit(0);
}

run();