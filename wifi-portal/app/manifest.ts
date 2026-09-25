import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Netify',
    short_name: 'Netify',
    description: 'Buy WiFi plans and connect instantly.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#00d2ff',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
