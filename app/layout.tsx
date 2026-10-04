import type { Metadata, Viewport } from 'next';
import { DESCRICAO_APP, NOME_APP } from '@/lib/config';
import './globals.css';

export const metadata: Metadata = {
  title: NOME_APP,
  description: DESCRICAO_APP,
  applicationName: NOME_APP,
  appleWebApp: { capable: true, title: NOME_APP, statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0b0b0b',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
