import ProfileClient from "./ProfileClient";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  return <ProfileClient username={username} />;
}
