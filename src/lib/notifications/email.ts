import "server-only";
import nodemailer from "nodemailer";
import { env, isEmailConfigured } from "../env";

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (cachedTransporter) return cachedTransporter;
  const port = Number(env.SMTP_PORT) || 587;
  cachedTransporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: env.SMTP_USER
      ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
      : undefined,
  });
  return cachedTransporter;
}

export async function sendEmail(subject: string, text: string): Promise<void> {
  if (!isEmailConfigured) {
    throw new Error("Email is not configured.");
  }
  await getTransporter().sendMail({
    from: env.EMAIL_FROM,
    to: env.EMAIL_TO,
    subject,
    text,
  });
}
