import SiteShell from '@/components/site/SiteShell';
import '@/styles/globals.css';
export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
