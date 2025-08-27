export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import SignupClient from '@/components/auth/SignupClient';

export default function Page() {
  return <SignupClient />;
}
