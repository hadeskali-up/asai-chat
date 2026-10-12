'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@oriveo/ui';
import { useAppStore } from '../../../providers/StoreProvider';
import { RelayDetail } from './RelayDetail';
import { OfficialProviderDetail } from './OfficialProviderDetail';
import { AsaiProviderDetail } from './AsaiProviderDetail';
import { isAllowedProviderKind } from '@oriveo/config';
import { sameNormalizedID } from '../../../lib/utils/id-utils';
import styles from './ProviderDetail.module.css';

interface ProviderDetailRouterProps {
  providerId: string;
}

export function ProviderDetailRouter({ providerId }: ProviderDetailRouterProps) {
  const router = useRouter();
  const t = useTranslations('pages.providerDetail');
  const tc = useTranslations('common');
  const providers = useAppStore((s) => s.providers);

  const provider = useMemo(
    () => providers.find((p) => sameNormalizedID(p.id, providerId)),
    [providers, providerId],
  );

  if (!provider) {
    return (
      <div className={styles.page}>
        <p>{t('notFound')}</p>
        <Button onClick={() => router.push('/providers')}>{tc('back')}</Button>
      </div>
    );
  }

  // In this deployment the only allowed provider kind is the locked asAi relay, so the full Relay
  // editor (which can repoint the app at an arbitrary endpoint) is not reachable. Anything else —
  // e.g. a provider synced down from another device before this build — falls through to the
  // standard detail views below, which now only render for non-surface kinds.
  if (isAllowedProviderKind(provider.kind) && provider.relayKind === 'openai_compatible') {
    return <AsaiProviderDetail provider={provider} />;
  }

  if (provider.kind === 'relay') {
    return <RelayDetail provider={provider} />;
  }

  return <OfficialProviderDetail provider={provider} />;
}
