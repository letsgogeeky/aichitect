import { pageMeta } from "@/lib/metadata";
import ProfileClient from "./ProfileClient";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { username } = await params;
  return pageMeta({
    title: `${username}'s AI Stack — AIchitect`,
    description: `See the AI tools ${username} actually uses in production, tracked on AIchitect.`,
    path: `/profile/${username}`,
  });
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  return <ProfileClient username={username} />;
}
