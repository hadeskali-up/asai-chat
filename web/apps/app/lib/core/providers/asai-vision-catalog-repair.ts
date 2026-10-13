import type { StoreApi } from 'zustand';
import type { AIModel, Provider } from '@oriveo/shared';
import { ASAIChat } from '@oriveo/config';
import type { AppStore } from '../store/app-store';
import { getActiveUIDSync } from '../../infra/storage/partition';
import { readPartitionedStore, writePartitionedStore } from '../../infra/storage/partitioned-local-store';
import { syncModelsDirect } from './adapters/openai';

const REPAIR_MARKER = 'asaiVisionCatalog.v1';

function isLockedAsai(provider: Provider): boolean {
  return provider.kind === ASAIChat.providerKind
    && provider.relayKind === 'openai_compatible'
    && provider.baseURLText?.replace(/\/+$/, '') === ASAIChat.apiBaseURL
    && provider.relayResolvedTransport === ASAIChat.transport
    && provider.relayResolvedAuthMode === 'bearer'
    && provider.apiKey.startsWith('asai_sk_')
    && provider.models.length > 0;
}

/** Repair only the previously enabled models; do not add/enable a new model or change a user's default. */
function mergeInputCapabilities(enabled: AIModel[], catalog: AIModel[]): AIModel[] {
  const byId = new Map(catalog.map((model) => [model.id, model]));
  return enabled.map((model) => {
    const advertised = byId.get(model.id)?.capabilities;
    if (!advertised || advertised.every((cap) => model.capabilities.includes(cap))) return model;
    return { ...model, capabilities: [...new Set([...model.capabilities, ...advertised])] };
  });
}

/** Best-effort, per-browser repair of old asAi catalog entries that lost input_modalities. */
export async function repairAsaiVisionCatalogIfNeeded(store: StoreApi<AppStore>): Promise<void> {
  if (readPartitionedStore(REPAIR_MARKER) === 'done') return;
  const uid = getActiveUIDSync();
  const original = store.getState().providers.find(isLockedAsai);
  if (!original) return;
  try {
    // GET /models directly from this browser; never forward the key to the app server.
    const result = await syncModelsDirect(original.apiKey, ASAIChat.apiBaseURL);
    if (!result.models?.length || getActiveUIDSync() !== uid) return;
    if (store.getState().providers.find((item) => item.id === original.id) !== original) return;
    const models = mergeInputCapabilities(original.models, result.models);
    // Called only once the normal provider subscriber is installed. It writes the changed
    // provider to IDB; no create-only IDB helper may be used for an existing row.
    store.getState().updateProvider(original.id, { models });
    writePartitionedStore(REPAIR_MARKER, 'done');
  } catch {
    // Unavailable /models or storage must never break chat or claim a completed repair.
  }
}
