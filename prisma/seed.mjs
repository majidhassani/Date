// Plain-JS, dependency-light seed used inside the Docker runtime image
// (the standalone image has no tsx). Idempotent: reuses an existing invitation.
import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const prisma = new PrismaClient();

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
function slugId(n = 12) {
  const bytes = crypto.randomBytes(n);
  let out = "";
  for (let i = 0; i < n; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

async function main() {
  const inviteeName = process.env.INVITEE_NAME || "نیلو";
  const ownerName = process.env.OWNER_NAME || "مجید";
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );

  const envSlug = (process.env.INVITATION_SLUG || "").trim();
  let slug = envSlug;
  if (!slug) {
    const existing = await prisma.invitation.findFirst({
      orderBy: { createdAt: "asc" },
    });
    slug = existing?.slug ?? `nilou-${slugId()}`;
  }

  const invitation = await prisma.invitation.upsert({
    where: { slug },
    update: { inviteeName, ownerName },
    create: { slug, inviteeName, ownerName, status: "PENDING" },
  });

  console.log("──────────────────────────────────────────────");
  console.log("✅ Invitation ready for", inviteeName);
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
