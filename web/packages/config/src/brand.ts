export const brand = {
  name: 'asAi Chat',
  tagline: 'Chat with every model, on your asAi credit',
  description:
    'Branded chat client for asAi customers. Add your own asAi API key, pick a model, and chat — billed against your asAi credit.',
  /**
   * Origin the app is served from. Used for canonical URLs, the sitemap, and
   * `metadataBase`. Override it when deploying somewhere other than the dev port.
   */
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
  /**
   * Public source repository for this deployed revision.
   *
   * REQUIRED by AGPL-3.0 §13: because this fork is offered to users over a network, the
   * complete corresponding source of the running revision must be reachable. The About
   * page links here. Keep it in sync with the deployed build (tracker A6/C6/H27).
   */
  repoUrl: process.env.NEXT_PUBLIC_SOURCE_URL || 'https://github.com/hadeskali-up/asai-chat',
  /** Upstream project this fork is derived from (attribution only — not the source offer). */
  upstreamUrl: 'https://github.com/oriveo/oriveo',
  /** Upstream license of this fork. */
  license: 'AGPL-3.0-or-later',
} as const;
