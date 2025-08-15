import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';

export const supabase = createClient(config.supabaseUrl, config.supabaseKey);

/** Insert/Upsert movie with embedding */
export async function upsertMovie(movie){
    // expects: { id?, title, year, description, poster_url, embedding, genres?, duration?, rating? }
    const { data, error } = await supabase
        .from('movies')
        .upsert(movie)
        .select()
        .limit(1)
        .maybeSingle();
    if(error) throw error;
    return data;
}

export async function storeUserResponse({session_id, person_num, answers, embedding}) {
    const { data, error } = await supabase
        .from('user_responses')
        .insert([{
            session_id,
            person_num,
            answers,
            embedding
        }])
        .select()
        .single();
    if(error) throw error;
    return data;
}

export async function getSessionResponses(session_id){
    const {data, error} = await supabase
        .from('user_responses')
        .select('embedding')
        .eq('session_id', session_id)
        .order('person_num', {ascending: true});
    if(error) throw error;
    return data || [];
}



export async function matchMovies({query_embedding, match_count = 3}){
    const {data,error} = await supabase.rpc('match_movies', {
        query_embedding,
        match_count,
    });
    if(error) throw error;
    return data || [];
}

