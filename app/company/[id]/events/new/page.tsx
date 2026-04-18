import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCompanyById } from "@/lib/db/company";
import { Navbar } from "@/components/navbar";
import EventForm from "./event-form";

export default async function NewEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const company = await getCompanyById(id);
  if (!company) notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user || session.user.id !== company.creatorId) {
    redirect(`/company/${id}`);
  }

  if (company.verificationLevel !== "STRONG") {
    redirect(`/company/${id}`);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar profileUsername={session.user.name?.split(" ").join("").toLowerCase()} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 animate-fade-in">
        <EventForm companyId={company._id!} companyName={company.name} />
      </main>
    </div>
  );
}
