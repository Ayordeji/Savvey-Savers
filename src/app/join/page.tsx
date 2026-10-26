import { redirect } from 'next/navigation';

type JoinPageProps = {
  searchParams: Promise<{ ref?: string | string[] }>;
};

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const { ref } = await searchParams;
  const invitationId = Array.isArray(ref) ? ref[0] : ref;

  if (!invitationId) {
    redirect('/activate');
  }

  redirect(`/activate?${new URLSearchParams({ invite: invitationId })}`);
}
