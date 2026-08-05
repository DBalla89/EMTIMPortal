// frontend/app/layout.tsx
// Root layout — avvolge tutta l'app con AuthProvider e la Navbar principale.

import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: {
    default: 'Project Work EMTIM XVIII Portal',
    template: '%s | PW EMTIM XVIII',
  },
  description:
    'Portale ufficiale del Project Work EMTIM XVIII. Pubblica proposte, candidati a iniziative e costruisci il tuo progetto.',
  keywords: ['project work', 'EMTIM', 'proposte', 'candidature', 'collaborazione'],
  openGraph: {
    title: 'Project Work EMTIM XVIII Portal',
    description: 'Proponi, candidati, collabora.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
