import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

export const E2E_SLUG = "e2e-nilou";

// Load DATABASE_URL from .env without any external dependency (Playwright's
// runner doesn't auto-load .env for the global setup process).
function ensureDatabaseUrl() {
  if (process.env.DATABASE_URL) return;
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*DATABASE_URL\s*=\s*"?([^"\n]+)"?\s*$/);
    if (m && m[1]) {
      process.env.DATABASE_URL = m[1];
      break;
    }
  }
}

/** Ensures a fixed, clean invitation exists for deterministic e2e runs. */
export default async function globalSetup() {
  ensureDatabaseUrl();
  const prisma = new PrismaClient();
  try {
    const invitation = await prisma.invitation.upsert({
      where: { slug: E2E_SLUG },
      update: { status: "PENDING", inviteeName: "نیلو", ownerName: "مجید" },
      create: {
        slug: E2E_SLUG,
        inviteeName: "نیلو",
        ownerName: "مجید",
        status: "PENDING",
      },
    });
    await prisma.response.deleteMany({ where: { invitationId: invitation.id } });
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "PENDING" },
    });
  } finally {
    await prisma.$disconnect();
  }
}
