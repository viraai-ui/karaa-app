import vercelConfig from '../../../vercel.json';

describe('Vercel mobile-web routing', () => {
  it('keeps API routes ahead of the SPA deep-link fallback', () => {
    expect(vercelConfig.rewrites).toEqual([
      { source: '/health', destination: '/api?route=/health' },
      { source: '/v1/:path*', destination: '/api?route=/v1/:path*' },
      { source: '/:path*', destination: '/index.html' },
    ]);
  });

  it('leaves the API function mounted at /api', () => {
    expect(vercelConfig.functions['api/index.ts']).toBeDefined();
  });
});