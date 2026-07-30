import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { buildPublicConfig } from "@/lib/invitation-config";
import { AppShell } from "@/components/app-shell";
import { ErrorState } from "@/components/states";
import { InvitationExperience } from "@/components/invitation/invitation-experience";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "دعوت",
  robots: { index: false, follow: false, nocache: true },
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let invitation;
  try {
    invitation = await prisma.invitation.findUnique({
      where: { slug },
      include: { responses: { select: { id: true } } },
    });
  } catch {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <ErrorState description="در حال حاضر امکان بارگذاری این دعوت نیست. کمی بعد دوباره امتحان کن." />
        </div>
      </AppShell>
    );
  }

  if (!invitation || invitation.status === "CANCELLED") {
    notFound();
  }

  const config = buildPublicConfig(invitation);

  return (
    <AppShell hero>
      <InvitationExperience slug={slug} config={config} />
    </AppShell>
  );
}
