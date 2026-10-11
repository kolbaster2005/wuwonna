import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Пока .env не заполнен — supabase будет null, и приложение работает
// на локальных демо-данных (src/data/seed.js). Как только пропишешь
// переменные окружения (см. .env.example), всё само переключится на базу.
export const supabase = url && anonKey ? createClient(url, anonKey) : null

export const isSupabaseConfigured = Boolean(supabase)
