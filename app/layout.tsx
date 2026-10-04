import type { Metadata, Viewport } from 'next';
import { Newsreader, Public_Sans } from 'next/font/google';
import { NOME_APP } from '@/lib/config';
import './globals.css';

const newsreader = Newsreader({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-newsreader' });
const publicSans = Public_Sans({ subsets: ['latin'], variable: '--font-public' });

export const metadata: Metadata = {
  title: NOME_APP,
  applicationName: NOME_APP,
  appleWebApp: { capable: true, title: NOME_APP, statusBarStyle: 'default' },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ecebe4' },
    { media: '(prefers-color-scheme: dark)', color: '#15171c' },
  ],
};

// roda antes da primeira pintura, para a página não piscar clara antes de ficar escura
const TEMA_INICIAL = `try{var t=localStorage.getItem('tema');if(t==='escuro'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${newsreader.variable} ${publicSans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA_INICIAL }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
