import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Sagana Mobile',
  description: 'Technical Documentation for Sagana Mobile Application',
  base: '/',
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#15803d' }],
  ],

  themeConfig: {
    siteTitle: '🌿 Sagana Mobile',
    logo: undefined,

    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Architecture', link: '/guide/architecture' },
      { text: 'Core Systems', link: '/core/authentication' },
      { text: 'Reference', link: '/reference/env-vars' },
    ],

    sidebar: [
      {
        text: '📖 Overview & Setup',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Architecture & Layers', link: '/guide/architecture' },
          { text: 'Routing & Navigation', link: '/guide/routing-navigation' },
        ],
      },
      {
        text: '⚙️ Core Engineering',
        items: [
          { text: 'Authentication & Clerk', link: '/core/authentication' },
          { text: 'API Client & Contracts', link: '/core/api-client' },
          { text: 'State Management (TanStack)', link: '/core/state-management' },
          { text: 'Design System & Uniwind', link: '/core/design-system' },
          { text: 'Logging & Telemetry', link: '/core/logging-telemetry' },
        ],
      },
      {
        text: '📚 Reference',
        items: [
          { text: 'Environment Variables', link: '/reference/env-vars' },
          { text: 'Troubleshooting & FAQ', link: '/reference/troubleshooting' },
        ],
      },
    ],

    search: {
      provider: 'local',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/likha-innovations/sagana-mobile' },
    ],

    footer: {
      message: 'Sagana Mobile Client — Built for Likha Innovations',
      copyright: 'Copyright © 2026 Likha Innovations. All rights reserved.',
    },
  },
});
