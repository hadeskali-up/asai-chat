'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SURFACE_FLAGS } from '@oriveo/config';

/**
 * Custom-relay setup is not part of this deployment: the only provider is the locked asAi relay,
 * so this route redirects to the asAi setup screen. Kept as a route (rather than deleted) so a
 * bookmark or an old deep link lands somewhere useful instead of a 404.
 */
export default function RelayNewPage() {
  const router = useRouter();

  useEffect(() => {
    if (!SURFACE_FLAGS.allowCustomRelay) {
      router.replace('/providers/new');
    }
  }, [router]);

  return null;
}
