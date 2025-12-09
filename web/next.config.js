/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,

  // Enable static exports
  output: 'export',

  // Base path for USB boot
  basePath: '',

  // Asset prefix for USB
  assetPrefix: '',

  // Image optimization
  images: {
    unoptimized: true, // Required for static export
    domains: ['localhost'],
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Handle Three.js
    config.externals = config.externals || [];

    // Aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
      '@components': require('path').resolve(__dirname, 'src/components'),
      '@styles': require('path').resolve(__dirname, 'src/styles'),
      '@utils': require('path').resolve(__dirname, 'src/utils'),
      '@hooks': require('path').resolve(__dirname, 'src/hooks'),
      '@context': require('path').resolve(__dirname, 'src/context'),
      '@api': require('path').resolve(__dirname, 'src/api'),
    };

    // GLSL shader support
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ['raw-loader', 'glslify-loader'],
    });

    return config;
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_NAME: '0RB SYSTEM',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
    NEXT_PUBLIC_APP_CODENAME: 'THE_AWAKENING',
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
