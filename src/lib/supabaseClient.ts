/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const getEnvValue = (val: any, fallback: string): string => {
  if (!val || typeof val !== 'string') return fallback;
  const cleaned = val.replace(/['"]/g, '').trim();
  if (!cleaned || cleaned === 'undefined' || cleaned === 'null') return fallback;
  return cleaned;
};

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseUrl = getEnvValue(rawUrl, 'https://bcjzhohbrkvyaojwogvk.supabase.co');

// Clean up trailing /rest/v1/ or /rest/v1 if present in user inputs
if (supabaseUrl.endsWith('/rest/v1/')) {
  supabaseUrl = supabaseUrl.slice(0, -9);
} else if (supabaseUrl.endsWith('/rest/v1')) {
  supabaseUrl = supabaseUrl.slice(0, -8);
}

const supabaseAnonKey = getEnvValue(rawKey, 'sb_publishable_xRvNrxwqhLAIApmzz8Ditg_W3-Oajzi');

// final fallback confirmation for safety
const finalUrl = supabaseUrl.startsWith('http') ? supabaseUrl : 'https://bcjzhohbrkvyaojwogvk.supabase.co';

export const supabase = createClient(finalUrl, supabaseAnonKey);


