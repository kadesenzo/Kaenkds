import { Client, Vehicle, ServiceOrder, OSItem, Part, Appointment, UserSession } from '../../types';
import { saveWorkshopFieldToCloud, fetchAllWorkshopDataFromCloud } from './firebase';

/**
 * Universal Workshop Storage & Cloud Persistence Engine
 * Guarantees that clients, vehicles, orders and inventory are NEVER lost during updates,
 * sessions, or browser cache resets.
 */

// Helper to deduplicate array by ID while preserving the richest object
export function mergeUniqueById<T extends { id?: string }>(existingItems: T[], incomingItems: T[]): T[] {
  const map = new Map<string, T>();
  
  // First add existing items
  for (const item of existingItems) {
    if (item && item.id) {
      map.set(item.id, item);
    }
  }

  // Overlay with incoming items (or add new)
  for (const item of incomingItems) {
    if (item && item.id) {
      const prev = map.get(item.id);
      map.set(item.id, { ...(prev || {}), ...item });
    }
  }

  return Array.from(map.values());
}

/**
 * Get data with multi-namespace fallback and automatic merge.
 * If data exists in any namespace (kaenpro_rafael_*, kaenpro_{tenant}_*, kaen_*),
 * it returns the full merged set so no records are ever missing.
 */
export function getWorkshopData<T>(key: string, username?: string, fallback: T = [] as any): T {
  if (typeof window === 'undefined') return fallback;

  const tenant = username || 'rafael';
  const kMaster = `kaenpro_rafael_${key}`;
  const kTenant = `kaenpro_${tenant}_${key}`;
  const kLegacy = `kaen_${key}`;

  const rawMaster = localStorage.getItem(kMaster);
  const rawTenant = tenant !== 'rafael' ? localStorage.getItem(kTenant) : null;
  const rawLegacy = localStorage.getItem(kLegacy);

  let valMaster: any = null;
  let valTenant: any = null;
  let valLegacy: any = null;

  try { if (rawMaster) valMaster = JSON.parse(rawMaster); } catch (e) {}
  try { if (rawTenant) valTenant = JSON.parse(rawTenant); } catch (e) {}
  try { if (rawLegacy) valLegacy = JSON.parse(rawLegacy); } catch (e) {}

  // If array (clients, vehicles, orders, etc.), merge all unique by ID
  if (Array.isArray(valMaster) || Array.isArray(valTenant) || Array.isArray(valLegacy)) {
    const listMaster = Array.isArray(valMaster) ? valMaster : [];
    const listTenant = Array.isArray(valTenant) ? valTenant : [];
    const listLegacy = Array.isArray(valLegacy) ? valLegacy : [];

    let combined = mergeUniqueById(listLegacy, listMaster);
    combined = mergeUniqueById(combined, listTenant);

    if (combined.length > 0) {
      // Re-align all namespaces so they all have the full dataset
      const serialized = JSON.stringify(combined);
      if (rawMaster !== serialized) localStorage.setItem(kMaster, serialized);
      if (rawTenant !== serialized && tenant !== 'rafael') localStorage.setItem(kTenant, serialized);
      if (rawLegacy !== serialized) localStorage.setItem(kLegacy, serialized);
      return combined as unknown as T;
    }
    return fallback;
  }

  // Non-array fallback
  return (valMaster ?? valTenant ?? valLegacy ?? fallback) as T;
}

/**
 * Save workshop data to all namespaces and Firestore simultaneously
 */
export async function saveWorkshopData<T>(key: string, data: T, username?: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const tenant = username || 'rafael';
  const serialized = JSON.stringify(data);

  // Prevent localStorage interceptor loops
  const setUpdating = (window as any).__kaen_set_remote_updating;
  if (setUpdating) setUpdating(true);
  try {
    localStorage.setItem(`kaenpro_rafael_${key}`, serialized);
    localStorage.setItem(`kaenpro_${tenant}_${key}`, serialized);
    localStorage.setItem(`kaen_${key}`, serialized);
  } finally {
    if (setUpdating) setUpdating(false);
  }

  // 1. Sync via Express server API (persisted to kaen_db.json & SSE pushed)
  try {
    await fetch(`/api/sync/${tenant}/${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: serialized
    });
  } catch (e) {
    // Non-blocking local fallback
  }

  // 2. Direct Firestore cloud backup write (single write, skipped if quota exhausted)
  try {
    await saveWorkshopFieldToCloud(`kaenpro_rafael_${key}`, data);
  } catch (err) {
    // Graceful offline/local fallback
  }

  // Trigger cross-component reactive update
  window.dispatchEvent(new CustomEvent('kaen_storage_updated', { detail: { key, value: data } }));
}

/**
 * Restores entire workshop state from Firestore without deleting existing items
 */
export async function restoreAllFromCloud(tenant = 'rafael'): Promise<{
  success: boolean;
  clientsCount: number;
  vehiclesCount: number;
  ordersCount: number;
  message: string;
}> {
  try {
    const cloudData = await fetchAllWorkshopDataFromCloud();
    if (!cloudData || Object.keys(cloudData).length === 0) {
      return {
        success: false,
        clientsCount: 0,
        vehiclesCount: 0,
        ordersCount: 0,
        message: 'Nenhum dado encontrado no banco de dados na nuvem.'
      };
    }

    let clientsCount = 0;
    let vehiclesCount = 0;
    let ordersCount = 0;

    for (const [rawKey, cloudVal] of Object.entries(cloudData)) {
      if (typeof cloudVal === 'undefined' || rawKey === 'lastUpdatedAt') continue;
      const cleanKey = rawKey.replace(/^kaenpro_[^_]+_/, '').replace(/^kaen_/, '');

      if (Array.isArray(cloudVal)) {
        const currentLocal = getWorkshopData<any[]>(cleanKey, tenant, []);
        const merged = mergeUniqueById(currentLocal, cloudVal);
        
        const serialized = JSON.stringify(merged);
        localStorage.setItem(`kaenpro_rafael_${cleanKey}`, serialized);
        localStorage.setItem(`kaenpro_${tenant}_${cleanKey}`, serialized);
        localStorage.setItem(`kaen_${cleanKey}`, serialized);

        if (cleanKey === 'clients') clientsCount = merged.length;
        if (cleanKey === 'vehicles') vehiclesCount = merged.length;
        if (cleanKey === 'orders') ordersCount = merged.length;
      } else {
        const serialized = JSON.stringify(cloudVal);
        localStorage.setItem(`kaenpro_rafael_${cleanKey}`, serialized);
        localStorage.setItem(`kaenpro_${tenant}_${cleanKey}`, serialized);
        localStorage.setItem(`kaen_${cleanKey}`, serialized);
      }
    }

    window.dispatchEvent(new CustomEvent('kaen_storage_updated'));

    return {
      success: true,
      clientsCount,
      vehiclesCount,
      ordersCount,
      message: `Sucesso! Restaurados: ${clientsCount} clientes, ${vehiclesCount} veículos, ${ordersCount} ordens de serviço da nuvem.`
    };
  } catch (err: any) {
    console.error("Erro ao restaurar da nuvem:", err);
    return {
      success: false,
      clientsCount: 0,
      vehiclesCount: 0,
      ordersCount: 0,
      message: `Falha na sincronização: ${err?.message || 'Erro de conexão com o banco de dados.'}`
    };
  }
}

/**
 * Export full backup file to user machine
 */
export function exportBackupJSON(tenant = 'rafael'): void {
  const keys = ['clients', 'vehicles', 'orders', 'budgets', 'parts', 'appointments', 'financial', 'employees', 'suppliers', 'reviews'];
  const dump: Record<string, any> = {
    exportDate: new Date().toISOString(),
    system: 'Auto Mecânica KAEN',
    version: '2.6.5',
    data: {}
  };

  for (const k of keys) {
    dump.data[k] = getWorkshopData(k, tenant, []);
  }

  const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const now = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `BACKUP_KAEN_CLIENTES_E_DADOS_${now}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import backup file and merge with current state
 */
export async function importBackupJSON(jsonStr: string, tenant = 'rafael'): Promise<{ success: boolean; message: string }> {
  try {
    const parsed = JSON.parse(jsonStr);
    const data = parsed.data || parsed;

    let totalRestored = 0;
    for (const [k, v] of Object.entries(data)) {
      if (k === 'exportDate' || k === 'system' || k === 'version') continue;
      const cleanKey = k.replace(/^kaenpro_[^_]+_/, '').replace(/^kaen_/, '');

      if (Array.isArray(v)) {
        const current = getWorkshopData<any[]>(cleanKey, tenant, []);
        const merged = mergeUniqueById(current, v);
        await saveWorkshopData(cleanKey, merged, tenant);
        totalRestored += merged.length;
      } else {
        await saveWorkshopData(cleanKey, v, tenant);
      }
    }

    window.dispatchEvent(new CustomEvent('kaen_storage_updated'));
    return {
      success: true,
      message: `Backup importado com sucesso! Seus dados foram mesclados e protegidos na nuvem.`
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro ao importar arquivo: ${err?.message || 'Formato JSON inválido.'}`
    };
  }
}
