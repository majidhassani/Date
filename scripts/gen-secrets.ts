import crypto from "node:crypto";

// Generate the two random secrets the app needs. Paste these into your .env.
const sessionSecret = crypto.randomBytes(48).toString("base64url");
const phoneKey = crypto.randomBytes(32).toString("base64");

console.log("# Add these to your .env (keep them private):");
console.log(`SESSION_SECRET=${sessionSecret}`);
console.log(`PHONE_ENCRYPTION_KEY=${phoneKey}`);
