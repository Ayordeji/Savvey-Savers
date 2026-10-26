import JoinInvitationForm from './JoinInvitationForm';

type JoinPageProps = {
  searchParams: Promise<{ ref?: string | string[] }>;
};

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const { ref } = await searchParams;
  const referrerId = Array.isArray(ref) ? ref[0] : ref;

  return <JoinInvitationForm referrerId={referrerId || ''} />;
}
