export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import SigninClient from '@/components/auth/SigninClient';

export default function Page() {
  return <SigninClient />;
}
