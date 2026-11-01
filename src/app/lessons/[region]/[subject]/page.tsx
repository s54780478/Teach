import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LessonsListing } from '@/components/LessonsListing';
import {
  buildLessonsPath,
  buildLessonsTitle,
  resolveRegionParam,
  resolveSubjectParam,
  regionDisplayName,
} from '@/lib/seoRoutes';

interface LessonsPageProps {
  params: Promise<{ region: string; subject: string }>;
}

export async function generateMetadata({
  params,
}: LessonsPageProps): Promise<Metadata> {
  const { region, subject } = await params;
  const regionResolved = resolveRegionParam(region);
  const subjectResolved = resolveSubjectParam(subject);
  const regionLabel = regionDisplayName(regionResolved.canonicalSlug);
  const subjectLabel = subjectResolved.displaySubject || '熱門';
  const title = buildLessonsTitle(regionLabel, subjectLabel);

  return {
    // layout template 會再加「｜ idaltu」
    title,
    description: `探索${regionLabel}${subjectLabel}家教課程，瀏覽驗證師資、時薪與首堂免費試聽。訂閱 Student Pass 即可聯繫導師。`,
  };
}

export default async function LessonsSeoPage({ params }: LessonsPageProps) {
  const { region, subject } = await params;
  const regionResolved = resolveRegionParam(region);
  const subjectResolved = resolveSubjectParam(subject);

  if (regionResolved.needsRedirect || subjectResolved.needsRedirect) {
    redirect(
      buildLessonsPath(
        regionResolved.canonicalSlug,
        subjectResolved.canonicalSlug === 'all'
          ? 'all'
          : subjectResolved.displaySubject || subjectResolved.canonicalSlug
      )
    );
  }

  return (
    <LessonsListing
      regionSlug={regionResolved.canonicalSlug}
      subjectSlug={subjectResolved.canonicalSlug}
    />
  );
}
