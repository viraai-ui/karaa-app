import mobileVercelConfig from '../vercel.json';

describe('Vercel mobile-web routing', () => {
  it('defines the SPA fallback in the deployed mobile project root', () => {
    expect(mobileVercelConfig.rewrites).toEqual([
      { source: '/:path*', destination: '/index.html' },
    ]);
  });
});
