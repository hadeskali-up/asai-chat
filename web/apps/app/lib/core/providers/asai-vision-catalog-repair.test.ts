import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AIModel, Provider } from '@oriveo/shared';
import { createAppStore } from '../store/app-store';

const h = vi.hoisted(() => ({
  uid: 'guest',
  marker: null as string | null,
  sync: vi.fn(),
  writeMarker: vi.fn(),
}));
vi.mock('@oriveo/config', () => ({
  ASAIChat: {
    apiBaseURL: 'https://serveras.click/v1',
    providerKind: 'relay',
    transport: 'openai_chat_completions',
  },
}));
vi.mock('../../infra/storage/partition', () => ({ getActiveUIDSync: () => h.uid }));
vi.mock('../../infra/storage/partitioned-local-store', () => ({
  readPartitionedStore: () => h.marker,
  writePartitionedStore: (...args: unknown[]) => h.writeMarker(...args),
}));
vi.mock('./adapters/openai', () => ({ syncModelsDirect: (...args: unknown[]) => h.sync(...args) }));

import { repairAsaiVisionCatalogIfNeeded } from './asai-vision-catalog-repair';

const textModel: AIModel = {
  id: 'asai/vision', name: 'Vision', capabilities: ['text'], reasoningModeAvailable: false,
  isAvailable: true, isDefault: true, priceTier: '',
};
const refreshed: AIModel = { ...textModel, capabilities: ['text', 'image'] };
function provider(patch: Partial<Provider> = {}): Provider {
  return {
    id: 'existing-asai', kind: 'relay', status: { kind: 'connected' },
    apiKey: 'asai_sk_test', apiKeyPreview: '••••',
    models: [textModel], catalogModels: [],
    baseURLText: 'https://serveras.click/v1',
    relayKind: 'openai_compatible', relayResolvedTransport: 'openai_chat_completions',
    relayResolvedAuthMode: 'bearer',
    ...patch,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.uid = 'guest';
  h.marker = null;
  h.sync.mockResolvedValue({ models: [refreshed] });
});

describe('existing asAi vision catalog repair', () => {
  it('updates only existing enabled models and marks success after the store update', async () => {
    const store = createAppStore();
    const original = provider({ models: [textModel, { ...textModel, id: 'asai/old', isDefault: false }] });
    store.setState({ providers: [original] });

    await repairAsaiVisionCatalogIfNeeded(store);

    expect(h.sync).toHaveBeenCalledWith('asai_sk_test', 'https://serveras.click/v1');
    const next = store.getState().providers[0];
    expect(next?.models.map((m) => [m.id, m.capabilities, m.isDefault])).toEqual([
      ['asai/vision', ['text', 'image'], true],
      ['asai/old', ['text'], false],
    ]);
    expect(next?.apiKey).toBe(original.apiKey);
    expect(next?.baseURLText).toBe(original.baseURLText);
    expect(h.writeMarker).toHaveBeenCalledTimes(1);
  });

  it('leaves provider and marker untouched when GET /models fails', async () => {
    const store = createAppStore();
    const original = provider();
    store.setState({ providers: [original] });
    h.sync.mockRejectedValue(new Error('network'));
    await repairAsaiVisionCatalogIfNeeded(store);
    expect(store.getState().providers[0]).toBe(original);
    expect(h.writeMarker).not.toHaveBeenCalled();
  });

  it('never refreshes arbitrary relays, alternate endpoints, or already migrated providers', async () => {
    const store = createAppStore();
    store.setState({ providers: [
      provider({ id: 'other-endpoint', baseURLText: 'https://example.test/v1' }),
      provider({ id: 'non-asai', relayKind: 'custom' }),
    ] });
    await repairAsaiVisionCatalogIfNeeded(store);
    expect(h.sync).not.toHaveBeenCalled();
    h.marker = 'done';
    store.setState({ providers: [provider()] });
    await repairAsaiVisionCatalogIfNeeded(store);
    expect(h.sync).not.toHaveBeenCalled();
  });

  it('does not apply a stale response after the provider/key or partition changes', async () => {
    const store = createAppStore();
    store.setState({ providers: [provider()] });
    h.sync.mockImplementation(async () => {
      store.getState().updateProvider('existing-asai', { apiKey: 'rotated-locally' });
      return { models: [refreshed] };
    });
    await repairAsaiVisionCatalogIfNeeded(store);
    expect(store.getState().providers[0]?.models[0]?.capabilities).toEqual(['text']);
    expect(h.writeMarker).not.toHaveBeenCalled();
  });
});
