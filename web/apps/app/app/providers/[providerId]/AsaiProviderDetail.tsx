'use client';

/**
 * Read-only detail for the locked asAi provider.
 *
 * Upstream, relay providers open the full Relay editor: endpoint, transport, auth mode, custom
 * headers, security mode. In this deployment the connection contract is fixed (see ASAIChat in
 * @oriveo/config), so the editor is not reachable. What a customer may still do here is the two
 * things that are theirs to control: rotate the asAi key, and choose which asAi models appear in
 * chat.
 *
 * This is deliberately separate from RelayDetail rather than a set of `disabled` flags inside it:
 * a locked deployment should not sit one `updateProviderRelaySettings` call away from a user
 * pointing the app at an arbitrary endpoint.
 */

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { AIModel, Provider } from '@oriveo/shared';
import { formatApiKeyPreview } from '@oriveo/shared';
import { ASAIChat } from '@oriveo/config';
import { Button } from '@oriveo/ui';
import { useAppStore, getVanillaStore } from '../../../providers/StoreProvider';
import * as providerOps from '../../../lib/core/provider-ops';
import { validateKeyDirect, syncModelsDirect } from '../../../lib/core/providers/adapters/openai';
import { isPrintableAsciiKey } from '../../../lib/utils/api-key-validation';
import { showToast } from '../../../components/Toast';
import { ModelBrowser } from './ModelBrowser';
import styles from './AsaiProviderDetail.module.css';

interface AsaiProviderDetailProps {
  provider: Provider;
}

export function AsaiProviderDetail({ provider }: AsaiProviderDetailProps) {
  const router = useRouter();
  const t = useTranslations('pages.asaiSetup');
  const td = useTranslations('pages.providerDetail');
  const tc = useTranslations('common');

  // Read models from the store so toggling is reflected immediately.
  const models = useAppStore(
    (s) => s.providers.find((p) => p.id === provider.id)?.models ?? provider.models,
  );

  const [rotating, setRotating] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [busy, setBusy] = useState(false);

  const keyPreview = provider.apiKeyPreview || formatApiKeyPreview(provider.apiKey ?? '');

  const onRotate = useCallback(async () => {
    const trimmed = newKey.trim();
    if (trimmed.length === 0) return;
    if (!isPrintableAsciiKey(trimmed)) {
      showToast(t('keyCharsError'));
      return;
    }
    setBusy(true);
    try {
      // Re-verify against asAi before storing: a bad rotation would otherwise overwrite a good
      // key and leave the provider unusable.
      await validateKeyDirect(trimmed, ASAIChat.apiBaseURL);
      const sync = await syncModelsDirect(trimmed, ASAIChat.apiBaseURL);
      const nextModels: AIModel[] = sync.models ?? [];
      await providerOps.updateProviderKey(getVanillaStore(), provider, trimmed);
      getVanillaStore().getState().updateProvider(provider.id, {
        ...(nextModels.length > 0 ? { models: nextModels } : {}),
        status: { kind: 'connected' },
        lastCheckedAt: new Date().toISOString(),
        lastError: undefined,
      });
      setNewKey('');
      setRotating(false);
      showToast(t('rotateSuccess'));
    } catch {
      showToast(t('invalidKey'));
    } finally {
      setBusy(false);
    }
  }, [newKey, provider, t]);

  const onRemoveKey = useCallback(async () => {
    setBusy(true);
    try {
      await providerOps.clearRelayCredentials(getVanillaStore(), provider);
      router.push('/providers/new');
    } finally {
      setBusy(false);
    }
  }, [provider, router]);

  const onToggleModel = useCallback(
    (model: AIModel) => {
      const current = getVanillaStore().getState().providers.find((p) => p.id === provider.id);
      if (!current) return;
      const has = current.models.some((m) => m.id === model.id);
      const next = has
        ? current.models.filter((m) => m.id !== model.id)
        : [...current.models, model];
      getVanillaStore().getState().updateProvider(provider.id, { models: next });
    },
    [provider.id],
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button type="button" className={styles.back} onClick={() => router.push('/providers')}>
          {tc('back')}
        </button>
        <h1 className={styles.title}>{ASAIChat.displayName}</h1>
      </div>

      <section className={styles.card} aria-label={t('connectionSection')}>
        <h2 className={styles.cardTitle}>{t('connectionSection')}</h2>
        <dl className={styles.list}>
          <div className={styles.row}>
            <dt>{td('baseURL')}</dt>
            <dd className={styles.mono}>{provider.baseURLText || ASAIChat.apiBaseURL}</dd>
          </div>
          <div className={styles.row}>
            <dt>{td('apiKey')}</dt>
            <dd className={styles.mono}>{keyPreview || t('noKey')}</dd>
          </div>
        </dl>
        <p className={styles.lockedNote}>{t('endpointLockedNote')}</p>

        <div className={styles.actions}>
          {!rotating ? (
            <Button tone="secondary" onClick={() => setRotating(true)} disabled={busy}>
              {t('rotateKey')}
            </Button>
          ) : (
            <div className={styles.rotateRow}>
              <input
                className={styles.keyInput}
                type="password"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="asai_sk_..."
                autoComplete="off"
                spellCheck={false}
                aria-label={t('keyLabel')}
              />
              <Button onClick={() => void onRotate()} disabled={busy || newKey.trim().length === 0}>
                {busy ? t('connecting') : t('saveKey')}
              </Button>
              <Button
                tone="secondary"
                onClick={() => {
                  setRotating(false);
                  setNewKey('');
                }}
                disabled={busy}
              >
                {tc('cancel')}
              </Button>
            </div>
          )}
          <Button tone="danger" onClick={() => void onRemoveKey()} disabled={busy}>
            {t('removeKey')}
          </Button>
        </div>
      </section>

      <section className={styles.card} aria-label={td('modelCatalog')}>
        <h2 className={styles.cardTitle}>{td('modelCatalog')}</h2>
        <ModelBrowser
          catalogModels={models}
          providerKind="relay"
          providerLabel={ASAIChat.displayName}
          provider={provider}
          onToggleModel={onToggleModel}
        />
      </section>
    </div>
  );
}
