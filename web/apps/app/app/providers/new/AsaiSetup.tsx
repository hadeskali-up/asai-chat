'use client';

/**
 * asAi provider setup — the only provider-creation surface in this deployment.
 *
 * Replaces upstream's multi-provider picker. The customer does exactly one thing:
 * paste a dedicated asAi API key. Everything else about the connection (base URL,
 * transport, auth mode) is locked by `ASAIChat` in @oriveo/config and is not editable
 * here, so this screen cannot be used to reach an arbitrary endpoint.
 *
 * Key handling:
 *   - The key is validated with a single `GET {base}/models` (bearer), matching the
 *     relay adapter's validate path.
 *   - It is stored only in the browser (provider store / IndexedDB). It is never sent
 *     anywhere except as the bearer credential on the customer's own asAi requests.
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { AIModel, Provider } from '@oriveo/shared';
import { formatApiKeyPreview } from '@oriveo/shared';
import { ASAIChat } from '@oriveo/config';
import { Button, EyeIcon, EyeOffIcon } from '@oriveo/ui';
import { useAppStore, getVanillaStore } from '../../../providers/StoreProvider';
import * as providerOps from '../../../lib/core/provider-ops';
import { validateKeyDirect, syncModelsDirect } from '../../../lib/core/providers/adapters/openai';
import { makeDefaultProviderInstanceName } from '../../../lib/core/providers/provider-display';
import { createDeterministicProviderId } from '../../../lib/utils/id-utils';
import { isPrintableAsciiKey } from '../../../lib/utils/api-key-validation';
import { showToast } from '../../../components/Toast';
import styles from './AsaiSetup.module.css';

type SetupState = 'idle' | 'working' | 'success' | 'invalid' | 'network' | 'empty';

function classifyError(err: unknown): Exclude<SetupState, 'idle' | 'working' | 'success'> {
  const kind =
    typeof err === 'object' && err !== null && 'kind' in err
      ? String((err as { kind?: unknown }).kind)
      : '';
  if (kind === 'invalidKey' || kind === 'unauthorized') return 'invalid';
  if (kind === 'emptyModelCatalog') return 'empty';
  return 'network';
}

export function AsaiSetup() {
  const router = useRouter();
  const t = useTranslations('pages.asaiSetup');
  const providers = useAppStore((s) => s.providers);
  const setHasCompletedOnboarding = useAppStore((s) => s.setHasCompletedOnboarding);

  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [state, setState] = useState<SetupState>('idle');
  const [keyCharsError, setKeyCharsError] = useState<string | null>(null);
  const busyRef = useRef(false);

  const trimmedKey = apiKey.trim();
  const canSubmit = trimmedKey.length > 0 && !keyCharsError && state !== 'working';

  const guideHref = useMemo(() => ASAIChat.keyHelpURL, []);

  const onKeyChange = useCallback(
    (value: string) => {
      setApiKey(value);
      const trimmed = value.trim();
      // Reject only characters that can never appear in an API key, so a paste with a
      // stray newline is caught before the request rather than after a 401.
      if (trimmed.length > 0 && !isPrintableAsciiKey(trimmed)) {
        setKeyCharsError(t('keyCharsError'));
      } else {
        setKeyCharsError(null);
      }
    },
    [t],
  );

  const onSubmit = useCallback(async () => {
    if (busyRef.current) return;
    if (trimmedKey.length === 0 || keyCharsError) return;
    busyRef.current = true;
    setState('working');
    try {
      // 1. Validate the key (single GET /models with bearer).
      await validateKeyDirect(trimmedKey, ASAIChat.apiBaseURL);

      // 2. Fetch the model catalog from asAi.
      const sync = await syncModelsDirect(trimmedKey, ASAIChat.apiBaseURL);
      const models: AIModel[] = sync.models ?? [];
      if (models.length === 0) {
        setState('empty');
        return;
      }

      // 3. Seed the locked asAi relay provider exactly once (deterministic id merges
      //    repeated writes from several clients instead of creating duplicates).
      const id = await createDeterministicProviderId(ASAIChat.providerKind, '');
      const provider: Provider = {
        id,
        kind: ASAIChat.providerKind,
        status: { kind: 'connected' },
        models,
        catalogModels: [],
        lastCheckedAt: new Date().toISOString(),
        apiKey: trimmedKey,
        apiKeyPreview: formatApiKeyPreview(trimmedKey),
        baseURLText: ASAIChat.apiBaseURL,
        customName: makeDefaultProviderInstanceName(ASAIChat.providerKind, providers),
        // Locked relay contract — never user-editable in this build.
        relayKind: ASAIChat.relayKind,
        relayResolvedBaseURLText: ASAIChat.apiBaseURL,
        relayResolvedTransport: ASAIChat.transport,
        relayResolvedAuthMode: ASAIChat.authMode,
        relayRequested: {
          transport: ASAIChat.transport,
          authMode: ASAIChat.authMode,
          stream: true,
        },
      };

      await providerOps.addProvider(getVanillaStore(), provider);
      setHasCompletedOnboarding(true);
      setState('success');
      setTimeout(() => router.push('/chat'), 300);
    } catch (err) {
      const next = classifyError(err);
      setState(next);
      if (next === 'invalid') showToast(t('invalidKey'));
    } finally {
      busyRef.current = false;
    }
  }, [apiKey.length, keyCharsError, providers, router, setHasCompletedOnboarding, t, trimmedKey]);

  const errorText =
    state === 'invalid'
      ? t('invalidKey')
      : state === 'network'
        ? t('networkError')
        : state === 'empty'
          ? t('emptyCatalog')
          : keyCharsError;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.hero}>
          <div className={styles.logo} aria-hidden />
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.subtitle}>{t('subtitle')}</p>
        </div>

        <div className={styles.steps} aria-label={t('stepsLabel')}>
          <ol className={styles.stepList}>
            <li>{t('step1')}</li>
            <li>{t('step2')}</li>
            <li>{t('step3')}</li>
          </ol>
          <a className={styles.guideLink} href={guideHref} target="_blank" rel="noreferrer noopener">
            {t('guideLink')}
          </a>
        </div>

        <label className={styles.fieldLabel} htmlFor="asai-key">
          {t('keyLabel')}
        </label>
        <div className={styles.keyRow}>
          <input
            id="asai-key"
            className={styles.keyInput}
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => onKeyChange(e.target.value)}
            placeholder="asai_sk_..."
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={Boolean(keyCharsError)}
            aria-describedby={errorText ? 'asai-key-error' : undefined}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canSubmit) void onSubmit();
            }}
          />
          <button
            type="button"
            className={styles.revealButton}
            onClick={() => setShowKey((v) => !v)}
            aria-label={showKey ? t('hideKey') : t('showKey')}
            aria-pressed={showKey}
          >
            {showKey ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
          </button>
        </div>

        {errorText && (
          <p id="asai-key-error" className={styles.error} role="alert">
            {errorText}
          </p>
        )}

        <p className={styles.privacyNote}>{t('privacyNote')}</p>

        <Button
          onClick={() => void onSubmit()}
          disabled={!canSubmit}
          aria-busy={state === 'working'}
        >
          {state === 'working' ? t('connecting') : t('connect')}
        </Button>
      </div>
    </div>
  );
}
