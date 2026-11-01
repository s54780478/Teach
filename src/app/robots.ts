import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://idaltu.tw';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // 允許 /tutor/apply 被索引（吸導師）；後台／帳戶／付款不進搜尋
      disallow: ['/account/', '/api/', '/tutor/dashboard', '/pay/'],
    },
    sitemap: `${base.replace(/\/$/, '')}/sitemap.xml`,
  };
}
