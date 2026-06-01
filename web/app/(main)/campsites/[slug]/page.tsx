import { redirect } from 'next/navigation';

interface CampsitePageProps {
  params: Promise<{ slug: string }>;
}

export default async function CampsitePage({ params }: CampsitePageProps) {
  const { slug } = await params;
  redirect(`/land/${slug}`);
}
