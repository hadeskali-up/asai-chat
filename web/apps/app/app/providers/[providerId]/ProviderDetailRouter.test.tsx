import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('@oriveo/ui', () => ({
  Button: (props: { children: unknown; onClick?: () => void }) => (
    <button type="button" onClick={props.onClick}>{props.children as string}</button>
  ),
}));

const providersState: { providers: Array<{ id: string; kind: string; relayKind?: string }> } = { providers: [] };
vi.mock('../../../providers/StoreProvider', () => ({
  useAppStore: (sel: (s: typeof providersState) => unknown) => sel(providersState),
}));
vi.mock('./RelayDetail', () => ({ RelayDetail: () => <div>relay-detail</div> }));
vi.mock('./OfficialProviderDetail', () => ({ OfficialProviderDetail: () => <div>official-detail</div> }));
vi.mock('./AsaiProviderDetail', () => ({ AsaiProviderDetail: () => <div>asai-detail</div> }));

import { ProviderDetailRouter } from './ProviderDetailRouter';

describe('ProviderDetailRouter', () => {
  it('renders official detail for BYOK providers', () => {
    providersState.providers = [{ id: 'openai', kind: 'openai' }];
    render(<ProviderDetailRouter providerId="openai" />);
    expect(screen.getByText('official-detail')).toBeTruthy();
  });

  it('renders the read-only asAi detail for the locked relay provider', () => {
    providersState.providers = [{ id: 'asai-primary', kind: 'relay', relayKind: 'openai_compatible' }];
    render(<ProviderDetailRouter providerId="asai-primary" />);
    expect(screen.getByText('asai-detail')).toBeTruthy();
  });

  it('does not send a non-asAi relay provider to the asAi detail', () => {
    // A relay synced from another device before this build has no openai_compatible relayKind,
    // so it must fall through rather than be presented as the locked asAi provider.
    providersState.providers = [{ id: 'other-relay', kind: 'relay', relayKind: 'custom' }];
    render(<ProviderDetailRouter providerId="other-relay" />);
    expect(screen.getByText('relay-detail')).toBeTruthy();
  });
});
