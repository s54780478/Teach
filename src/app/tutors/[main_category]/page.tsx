import type { Metadata } from 'next';
import { isMainCategoryKey } from '@/types/mainCategory';
import { TutorsTagListing } from '@/components/TutorsTagListing';
import { mainCategoryDisplayName } from '@/lib/tutorTagRoutes';

interface TutorsCategoryPageProps {
  params: Promise<{ main_category: string }>;
}

export async function generateMetadata({
  params,
}: TutorsCategoryPageProps): Promise<Metadata> {
  const { main_category } = await params;
  const categoryName = mainCategoryDisplayName(main_category);
  const title = `${categoryName}家教課程推薦`;
  const description = `尋找最適合你的${categoryName}私人導師。免費瀏覽履歷與介紹影片，學生訂閱解鎖聯繫方式。`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'zh_TW',
      siteName: 'idaltu',
    },
  };
}

export default async function TutorsCategoryPage({
  params,
}: TutorsCategoryPageProps) {
  const { main_category } = await params;
  const categoryValid = isMainCategoryKey(main_category);

  return (
    <TutorsTagListing
      key={`${main_category}:`}
      mainCategory={main_category}
      tag=""
      categoryValid={categoryValid}
    />
  );
}
