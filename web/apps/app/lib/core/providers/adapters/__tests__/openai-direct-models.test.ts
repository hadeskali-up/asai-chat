import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../metadata/metadata-client', () => ({
  initMetadata: vi.fn().mockResolvedValue(undefined),
  listProviderModelIds: vi.fn().mockReturnValue([]),
  resolveCatalogModel: vi.fn().mockReturnValue(null),
}));

import { syncModelsDirect } from '../openai';

describe('syncModelsDirect', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps text-only when a direct model does not declare input modalities', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: [
        { id: 'asai/text-model', object: 'model', created: 1, owned_by: 'asai' },
      ] }), { status: 200 }),
    );
    const result = await syncModelsDirect('asai_sk_test', 'https://serveras.click/v1');
    expect(result.models[0]?.capabilities).toEqual(['text']);
  });

  it('preserves declared image and video input modalities from an OpenAI-compatible catalog', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        data: [{
          id: 'asai/vision-model',
          object: 'model',
          created: 1_728_000_000,
          owned_by: 'asai',
          input_modalities: ['text', 'image', 'video', 'future_modality'],
        }],
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await syncModelsDirect('asai_sk_test', 'https://serveras.click/v1');

    expect(result.models).toHaveLength(1);
    expect(result.models[0]).toMatchObject({
      id: 'asai/vision-model',
      capabilities: ['text', 'image', 'video'],
    });
  });
});
