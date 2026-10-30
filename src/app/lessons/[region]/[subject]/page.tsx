import type { Metadata } from 'next';
import { LessonsListing } from '@/components/LessonsListing';
import {
  buildLessonsTitle,
  fromSubjectSlug,
  regionDisplayName,
} from '@/lib/seoRoutes';

interface LessonsPageProps {
  params: Promise<{ region: string; subject: string }>;
}

export async function generateMetadata({
  params,
}: LessonsPageProps): Promise<Metadata> {
  const { region, subject } = await params;
  const regionLabel = regionDisplayName(region);
  const subjectLabel = fromSubjectSlug(subject) || '熱門';
  const title = buildLessonsTitle(regionLabel, subjectLabel);

  return {
    title: `${title} ｜ idaltu`,
    description: `探索${regionLabel}${subjectLabel}家教課程，瀏覽驗證師資、時薪與首堂免費試聽。訂閱 Student Pass 即可聯繫導師。`,
  };
}

export default async function LessonsSeoPage({ params }: LessonsPageProps) {
  const { region, subject } = await params;
  return <LessonsListing regionSlug={region} subjectSlug={subject} />;
}
