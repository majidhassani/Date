import bcrypt from "bcryptjs";

const password = process.argv[2] || process.env.ADMIN_PASSWORD;

if (!password) {
  console.error("Usage: npm run admin:hash -- 'YourStrongPassword'");
  process.exit(1);
}

bcrypt
  .hash(password, 12)
  .then((hash) => {
    console.log("# Add this to your .env:");
    console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  })
  .catch((err) => {
    console.error("Failed to hash password:", err);
    process.exit(1);
  });
