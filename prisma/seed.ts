import { PrismaClient } from "@prisma/client";
import { customAlphabet } from "nanoid";

const prisma = new PrismaClient();

// Kept local to the seed so it has no dependency on the app's env module.
const nanoidSlug = customAlphabet("abcdefghijkmnpqrstuvwxyz23456789", 12);
const generateSlug = () => `nilou-${nanoidSlug()}`;

async function main() {
  const inviteeName = process.env.INVITEE_NAME || "نیلو";
  const ownerName = process.env.OWNER_NAME || "مجید";
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );

  const envSlug = process.env.INVITATION_SLUG?.trim();

  // Idempotent: reuse an explicit slug, else the first existing invitation,
  // else create a fresh one with a secure random slug.
  let slug = envSlug || "";
  if (!slug) {
    const existing = await prisma.invitation.findFirst({
      orderBy: { createdAt: "asc" },
    });
    slug = existing?.slug ?? generateSlug();
  }

  const invitation = await prisma.invitation.upsert({
    where: { slug },
    update: { inviteeName, ownerName },
    create: { slug, inviteeName, ownerName, status: "PENDING" },
  });

  // Safe output only — never print secrets, tokens, keys, or phone numbers.
  console.log("──────────────────────────────────────────────");
  console.log("✅ Seed complete — invitation ready for", inviteeName);
  console.log("──────────────────────────────────────────────");
  console.log(`Invitation link : ${appUrl}/invite/${invitation.slug}`);
  console.log(`Admin dashboard : ${appUrl}/admin`);
  console.log("──────────────────────────────────────────────");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
