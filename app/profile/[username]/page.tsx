import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getProfileByUsername } from "@/lib/db/profile";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import ProfileView from "./profile-view";
import { getProfileByUserId } from "@/lib/db/profile";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) return { title: "Profile not found" };
  return {
    title: `${profile.headline ? `${profile.headline} | ` : ""}${username} — NexConnect`,
    description: profile.bio?.slice(0, 160) || `View ${username}'s professional profile on NexConnect`,
  };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const [profile, session] = await Promise.all([
    getProfileByUsername(username),
    auth.api.getSession({ headers: await headers() }).catch(() => null),
  ]);

  if (!profile) notFound();

  // Get viewer's own profile to pass username to navbar
  let viewerProfile = null;
  if (session?.user) {
    viewerProfile = await getProfileByUserId(session.user.id).catch(() => null);
  }

  const isOwner = session?.user?.id === profile.userId;

  return (
    <div className="min-h-screen bg-background">
      <Navbar profileUsername={viewerProfile?.username} />
      <ProfileView profile={JSON.parse(JSON.stringify(profile))} isOwner={isOwner} currentUser={session?.user || null} />
    </div>
  );
}
