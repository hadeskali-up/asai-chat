/**
 * Product surface for the asAi Chat deployment.
 *
 * This fork ships a single, locked provider: asAi. Everything else in upstream Oriveo
 * (other BYOK providers, arbitrary relay endpoints, subscription sign-in, Library,
 * image generation, MCP) is out of scope for Release 1 and must not be reachable from
 * the UI.
 *
 * Centralising the surface here means the gate is one place to read and one place to
 * change, instead of a scatter of `if (provider.kind === 'relay')` checks that drift.
 *
 * The values are compile-time constants (not env) so a misconfigured deployment cannot
 * silently widen the surface. Only the base URL is env-overridable, and only to point a
 * staging build at a staging asAi host.
 */

/**
 * The one provider kind this build exposes. asAi speaks the OpenAI Chat Completions
 * protocol with bearer auth, which is exactly Oriveo's `relay` adapter, so the app runs
 * as a pre-seeded, locked relay whose base URL and transport cannot be edited by the user.
 */
export const ASAIChat = {
  /** ProviderKind that backs the asAi provider. */
  providerKind: 'relay',
  /** Product-name shown anywhere a provider name is rendered. */
  displayName: 'asAi',
  /**
   * asAi OpenAI-compatible API root.
   *
   * Defaults to the public customer API. `NEXT_PUBLIC_ASAI_API_BASE_URL` may override it
   * for a staging deployment; the value is read at build time like every other
   * NEXT_PUBLIC_* constant.
   */
  apiBaseURL: (process.env.NEXT_PUBLIC_ASAI_API_BASE_URL || 'https://serveras.click/v1').replace(/\/+$/, ''),
  /** Relay transport literal: standard OpenAI Chat Completions. */
  transport: 'openai_chat_completions' as const,
  /** Relay kind literal: an OpenAI-compatible endpoint. */
  relayKind: 'openai_compatible' as const,
  /** Auth mode: `Authorization: Bearer <key>`. */
  authMode: 'bearer' as const,
  /** Where a customer creates their key. Shown in the setup guide and the settings row. */
  keyHelpURL: 'https://serverasai.com',
  /** Stable id for the pre-seeded provider instance, so it is created exactly once. */
  seedProviderId: 'asai-primary',
} as const;

/** Provider kinds the UI is allowed to display, create or sync. */
export const ALLOWED_PROVIDER_KINDS = [ASAIChat.providerKind] as const;

export type AllowedProviderKind = (typeof ALLOWED_PROVIDER_KINDS)[number];

/** Whether a provider kind is part of this deployment's product surface. */
export function isAllowedProviderKind(kind: string): boolean {
  return (ALLOWED_PROVIDER_KINDS as readonly string[]).includes(kind);
}

/**
 * Feature gates for Release 1. Every entry defaults to the safe (off) value; a surface
 * that is off must be hidden, not merely disabled, so the UI can never present a control
 * that leads to an unsupported capability (tracker item H21).
 */
export const SURFACE_FLAGS = {
  /** Editing provider base URLs. Off: the asAi preset is locked. */
  allowProviderBaseURLEdit: false,
  /** Adding arbitrary relay endpoints. Off: relay setup UI is not reachable. */
  allowCustomRelay: false,
  /** Subscription (ChatGPT / Grok) sign-in. Off. */
  allowSubscriptionSignIn: false,
  /** Creating or validating any provider other than asAi. Off. */
  allowOtherProviders: false,
  /** Library surfaces (need an external connector). Off. */
  libraryEnabled: false,
  /** Image generation / editing from the chat surface. Off (Studio owns this). */
  imageGeneration: false,
  /** MCP server management. Off. */
  mcpEnabled: false,
} as const;

export type SurfaceFlag = keyof typeof SURFACE_FLAGS;
