import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isMainCategoryKey } from '@/types/mainCategory';
import { TutorsTagListing } from '@/components/TutorsTagListing';
import {
  buildTutorsTagDescription,
  buildTutorsTagPath,
  buildTutorsTagTitle,
  mainCategoryDisplayName,
  resolveTagParam,
} from '@/lib/tutorTagRoutes';

interface TutorsTagPageProps {
  params: Promise<{ main_category: string; tag: string }>;
}

export async function generateMetadata({
  params,
}: TutorsTagPageProps): Promise<Metadata> {
  const { main_category, tag } = await params;
  const { displayTag } = resolveTagParam(tag);
  const categoryName = mainCategoryDisplayName(main_category);
  const title = displayTag
    ? buildTutorsTagTitle(displayTag, categoryName)
    : `${categoryName}家教課程推薦`;
  const description = displayTag
    ? buildTutorsTagDescription(displayTag)
    : `尋找最適合你的${categoryName}私人導師。免費瀏覽履歷與介紹影片，學生訂閱解鎖聯繫方式。`;

  const ogTitle = `${title} | idaltu`;
  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description,
      type: 'website',
      locale: 'zh_TW',
      siteName: 'idaltu',
    },
  };
}

export default async function TutorsTagPage({ params }: TutorsTagPageProps) {
  const { main_category, tag } = await params;
  const categoryValid = isMainCategoryKey(main_category);
  const resolved = resolveTagParam(tag);

  // 舊中文／非正規 path → 301 到英文 slug
  if (
    categoryValid &&
    resolved.displayTag &&
    resolved.canonicalSlug &&
    resolved.needsRedirect
  ) {
    redirect(buildTutorsTagPath(main_category, resolved.displayTag));
  }

  return (
    <TutorsTagListing
      key={`${main_category}:${resolved.canonicalSlug || resolved.displayTag}`}
      mainCategory={main_category}
      tag={resolved.displayTag}
      categoryValid={categoryValid}
    />
  );
}
