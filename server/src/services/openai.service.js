import OpenAI from 'openai';
import { config } from '../config/env.js';

export const openai = new OpenAI({
    apiKey: config.openaiApiKey
});

export async function createEmbedding(text){
    const cleaned = (text||'').replace(/\s+/g, ' ').trim();
    const res = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: cleaned || 'empty',
    });
    return res.data[0].embedding;
}

export async function prettyExplainChoice(movies, groupSummary){
    const userMsg = [
        `Group summary: ${groupSummary}`,
        `Candidates:`,
        ...movies.map((m, i) => `${i + 1}. ${m.title} (${m.year}) — ${m.description?.slice(0, 240) || ''}`),
            `Give a short 1-2 sentence reason why #1 is best for this group.`,
        ].join('\n');
    
    const res = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: 'You are a concise movie recommender. Keep it under 40 words.' },
            { role: 'user', content: userMsg }
        ]
    });
    return res.choices?.[0]?.message?.content?.trim() || '';
}