import type { MetadataRoute } from 'next';
import { MAIN_CATEGORIES } from '@/data/mainCategories';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://idaltu.tw'
  ).replace(/\/$/, '');

  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    {
      url: `${base}/tutor/apply`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  const tutorCategoryRoutes: MetadataRoute.Sitemap = MAIN_CATEGORIES.map((cat) => ({
    url: `${base}/tutors/${cat.key}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const lessonRoutes: MetadataRoute.Sitemap = MAIN_CATEGORIES.map((cat) => ({
    url: `${base}/lessons/all/${cat.key}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...tutorCategoryRoutes, ...lessonRoutes];
}
