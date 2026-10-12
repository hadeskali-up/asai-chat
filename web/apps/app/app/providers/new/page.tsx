import { AsaiSetup } from './AsaiSetup';

/**
 * Provider creation in this deployment.
 *
 * Upstream this route renders the multi-provider picker. This build exposes a single,
 * locked provider (asAi), so the route renders the asAi-only setup screen. The customer
 * pastes their own asAi API key; the base URL, transport and auth mode are fixed in
 * @oriveo/config and are not editable here.
 */
export default function NewProviderPage() {
  return <AsaiSetup />;
}
