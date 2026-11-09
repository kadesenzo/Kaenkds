import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { saveWorkshopFieldToCloud } from './firebase';
import { getWorkshopData, mergeUniqueById, saveWorkshopData } from './storage';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}

// Built-in Default Supabase Configuration (Can be placed directly in code so Git updates never lose it)
export const DEFAULT_SUPABASE_URL = '';
export const DEFAULT_SUPABASE_ANON_KEY = '';

const STORAGE_KEY_URL = 'kaen_supabase_url';
const STORAGE_KEY_KEY = 'kaen_supabase_anon_key';

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL ? String((import.meta as any).env.VITE_SUPABASE_URL) : '').trim();
  const envKey = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ? String((import.meta as any).env.VITE_SUPABASE_ANON_KEY) : '').trim();

  let storedUrl = '';
  let storedKey = '';
  if (typeof window !== 'undefined') {
    storedUrl = (localStorage.getItem(STORAGE_KEY_URL) || '').trim();
    storedKey = (localStorage.getItem(STORAGE_KEY_KEY) || '').trim();
  }

  const url = storedUrl || envUrl || DEFAULT_SUPABASE_URL;
  const anonKey = storedKey || envKey || DEFAULT_SUPABASE_ANON_KEY;

  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey && url.startsWith('http'))
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window === 'undefined') return;

  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();

  localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
  localStorage.setItem(STORAGE_KEY_KEY, cleanKey);

  cachedClient = null;
  lastUrl = '';
  lastKey = '';

  window.dispatchEvent(new CustomEvent('kaen_supabase_config_updated'));
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig().isConfigured;
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  if (cachedClient && lastUrl === url && lastKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    lastUrl = url;
    lastKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Erro ao instanciar cliente Supabase:', err);
    return null;
  }
}

/**
 * SQL snippet to create the table in Supabase SQL editor
 */
export const SUPABASE_SETUP_SQL = `-- EXECUTE ESTE SQL NO EDITOR SQL DO SEU SUPABASE (SQL EDITOR)
-- CRIA A TABELA DO BANCO RESERVA DA OFICINA KAEN

create table if not exists public.kaen_store (
  key text primary key,
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilita Row Level Security com permissão pública anon
alter table public.kaen_store enable row level security;

create policy "Permitir leitura anon"
on public.kaen_store for select
to anon
using (true);

create policy "Permitir gravacao anon"
on public.kaen_store for insert
to anon
with check (true);

create policy "Permitir atualizacao anon"
on public.kaen_store for update
to anon
using (true);
`;

/**
 * Test connectivity with Supabase
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase não está configurado. Preencha a URL e a Chave Anon.' };
  }

  try {
    const { data, error } = await client
      .from('kaen_store')
      .select('key')
      .limit(1);

    if (error) {
      if (error.code === '42P01' || error.message.includes('relation "public.kaen_store" does not exist')) {
        return {
          success: false,
          message: 'Conectou ao Supabase, mas a tabela "kaen_store" ainda não foi criada. Copie o script SQL abaixo e execute no painel do Supabase.'
        };
      }
      return { success: false, message: `Erro ao consultar Supabase: ${error.message}` };
    }

    return { success: true, message: 'Conexão com o Supabase estabelecida com sucesso!' };
  } catch (err: any) {
    return { success: false, message: `Falha na requisição Supabase: ${err.message || String(err)}` };
  }
}

/**
 * Save data to Supabase (Secondary failover database)
 */
export async function saveToSupabase(key: string, data: any): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const cleanKey = key.replace(/^kaenpro_[^_]+_/, '').replace(/^kaen_/, '');
    const { error } = await client
      .from('kaen_store')
      .upsert({
        key: cleanKey,
        data: data,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

    if (error) {
      console.warn('Aviso Supabase upsert:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Erro ao salvar no Supabase:', err);
    return false;
  }
}

/**
 * Fetch all workshop records stored in Supabase
 */
export async function fetchAllFromSupabase(): Promise<Record<string, any> | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('kaen_store')
      .select('key, data, updated_at');

    if (error || !data) {
      console.warn('Aviso busca Supabase:', error?.message);
      return null;
    }

    const result: Record<string, any> = {};
    for (const row of data) {
      if (row.key && typeof row.data !== 'undefined') {
        result[row.key] = row.data;
      }
    }
    return result;
  } catch (err) {
    console.warn('Erro ao buscar dados do Supabase:', err);
    return null;
  }
}

/**
 * PASS INFOS FROM SUPABASE (RESERVE) TO ORIGINAL (FIRESTORE)
 * Fulfills user request: "esse outro passa as info ao original"
 */
export async function replicateSupabaseToOriginalFirestore(): Promise<{
  success: boolean;
  message: string;
  clientsCount: number;
  vehiclesCount: number;
  ordersCount: number;
  syncedKeys: string[];
}> {
  try {
    // 1. Fetch all records from Supabase
    const supabaseData = await fetchAllFromSupabase();
    
    // Fallback: If Supabase has no data or table yet, use the local workshop data
    const keysToSync = ['clients', 'vehicles', 'orders', 'parts', 'appointments', 'invoices'];
    let clientsCount = 0;
    let vehiclesCount = 0;
    let ordersCount = 0;
    const syncedKeys: string[] = [];

    // Temporarily allow Firestore writes for replication
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kaen_firestore_quota_exhausted');
      sessionStorage.removeItem('kaen_firestore_quota_exhausted');
    }

    for (const key of keysToSync) {
      // Get the best available data from Supabase or LocalStorage
      const valFromSupabase = supabaseData ? supabaseData[key] : null;
      const localVal = getWorkshopData<any[]>(key, 'rafael', []);

      let dataToPush: any[] = [];
      if (Array.isArray(valFromSupabase) && Array.isArray(localVal)) {
        dataToPush = mergeUniqueById(localVal, valFromSupabase);
      } else if (Array.isArray(valFromSupabase)) {
        dataToPush = valFromSupabase;
      } else {
        dataToPush = localVal;
      }

      if (dataToPush && dataToPush.length > 0) {
        if (key === 'clients') clientsCount = dataToPush.length;
        if (key === 'vehicles') vehiclesCount = dataToPush.length;
        if (key === 'orders') ordersCount = dataToPush.length;

        // Save to original Firestore
        await saveWorkshopFieldToCloud(`kaenpro_rafael_${key}`, dataToPush);
        syncedKeys.push(key);
      }
    }

    return {
      success: true,
      message: `Informações do Supabase e cache repassadas com sucesso ao Firestore Original!`,
      clientsCount,
      vehiclesCount,
      ordersCount,
      syncedKeys
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro ao repassar dados para o Firestore: ${err.message || String(err)}`,
      clientsCount: 0,
      vehiclesCount: 0,
      ordersCount: 0,
      syncedKeys: []
    };
  }
}

/**
 * REPLICATE EVERYTHING FROM FIRESTORE / LOCAL TO SUPABASE
 * Keeps the reserve database 100% up to date with the original
 */
export async function replicateOriginalToSupabase(): Promise<{
  success: boolean;
  message: string;
  totalSynced: number;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Configure a URL e Chave Anon do Supabase primeiro.', totalSynced: 0 };
  }

  const keys = ['clients', 'vehicles', 'orders', 'parts', 'appointments', 'invoices'];
  let totalSynced = 0;

  for (const k of keys) {
    const data = getWorkshopData<any[]>(k, 'rafael', []);
    if (data && data.length > 0) {
      const ok = await saveToSupabase(k, data);
      if (ok) totalSynced += data.length;
    }
  }

  return {
    success: true,
    message: `Dados espelhados com sucesso no Supabase (${totalSynced} registros sincronizados)!`,
    totalSynced
  };
}
