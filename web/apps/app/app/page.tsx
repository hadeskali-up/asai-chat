import { buildAppPageMetadata } from '../lib/seo/public-metadata';
import { RootRedirect } from './RootRedirect';

export const metadata = buildAppPageMetadata({
  title: 'Open App',
  description:
    'Open the asAi Chat web app for multi-model AI chat with your own asAi key and real-time cost tracking.',
  path: '/',
  index: false,
  canonicalPath: '/chat',
});

export default function RootPage() {
  return <RootRedirect />;
}
