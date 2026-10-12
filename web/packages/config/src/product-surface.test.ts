import { describe, expect, it } from 'vitest';
import {
  ASAIChat,
  ALLOWED_PROVIDER_KINDS,
  SURFACE_FLAGS,
  isAllowedProviderKind,
} from './product-surface';

/**
 * The product surface is the gate that keeps this fork to a single locked provider. These
 * assertions pin the contract: if someone widens the surface, they have to change a test that
 * says out loud what the surface is meant to be.
 */
describe('asAi product surface', () => {
  it('exposes exactly one provider kind', () => {
    expect(ALLOWED_PROVIDER_KINDS).toEqual(['relay']);
  });

  it('locks the asAi connection contract', () => {
    expect(ASAIChat.transport).toBe('openai_chat_completions');
    expect(ASAIChat.relayKind).toBe('openai_compatible');
    expect(ASAIChat.authMode).toBe('bearer');
  });

  it('points at the public asAi API by default', () => {
    // A trailing slash would produce `//chat/completions`; the value is normalised to no slash.
    expect(ASAIChat.apiBaseURL.endsWith('/v1')).toBe(true);
  });

  it('treats any non-asAi kind as outside the surface', () => {
    expect(isAllowedProviderKind('relay')).toBe(true);
    expect(isAllowedProviderKind('openai')).toBe(false);
    expect(isAllowedProviderKind('anthropic')).toBe(false);
    expect(isAllowedProviderKind('')).toBe(false);
  });

  it('keeps every out-of-scope surface flag off', () => {
    expect(SURFACE_FLAGS.allowProviderBaseURLEdit).toBe(false);
    expect(SURFACE_FLAGS.allowCustomRelay).toBe(false);
    expect(SURFACE_FLAGS.allowSubscriptionSignIn).toBe(false);
    expect(SURFACE_FLAGS.allowOtherProviders).toBe(false);
    expect(SURFACE_FLAGS.libraryEnabled).toBe(false);
    expect(SURFACE_FLAGS.imageGeneration).toBe(false);
    expect(SURFACE_FLAGS.mcpEnabled).toBe(false);
  });
});
