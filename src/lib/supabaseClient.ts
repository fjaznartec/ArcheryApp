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

const supabaseAnonKey = getEnvValue(rawKey, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjanpob2hicmt2eWFvandvZ3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMTYwNTMsImV4cCI6MjA5NjU5MjA1M30._k_VQEd1X73VBxxb90bgJs3Ow68e3PpJUrBAEaAeCk8');

// final fallback confirmation for safety
const finalUrl = supabaseUrl.startsWith('http') ? supabaseUrl : 'https://bcjzhohbrkvyaojwogvk.supabase.co';

export const supabase = createClient(finalUrl, supabaseAnonKey);


