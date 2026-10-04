import type { MetadataRoute } from 'next';
import { DESCRICAO_APP, NOME_APP } from '@/lib/config';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: NOME_APP,
    short_name: NOME_APP,
    description: DESCRICAO_APP,
    start_url: '/',
    display: 'standalone',
    background_color: '#15171c',
    theme_color: '#15171c',
    lang: 'pt-BR',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
