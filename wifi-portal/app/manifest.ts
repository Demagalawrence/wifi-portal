import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WiFi Hotspot Portal',
    short_name: 'WiFi Portal',
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
