import { redirect } from 'next/navigation';

type JoinPageProps = {
  searchParams: Promise<{ ref?: string | string[] }>;
};

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const { ref } = await searchParams;
  const referrerId = Array.isArray(ref) ? ref[0] : ref;

  if (!referrerId) {
    redirect('/');
  }

  redirect(`/?${new URLSearchParams({ ref: referrerId })}`);
}
