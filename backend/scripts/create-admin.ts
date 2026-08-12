import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

// Load DATABASE_URL from backend/.env so the script works standalone.
if (existsSync(path.join(process.cwd(), '.env'))) {
  try {
    process.loadEnvFile('.env');
  } catch {
    // Node < 20.12: ignore, Prisma resolves env from its own loader.
  }
}

const prisma = new PrismaClient();

const argv = process.argv.slice(2);

function flagValue(flag: string): string | undefined {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : undefined;
}

async function main(): Promise<void> {
  const rl = readline.createInterface({ input, output });

  try {
    const username =
      flagValue('--username') ??
      argv[0] ??
      ((await rl.question('Admin username [admin]: ')) || 'admin');
    const password =
      flagValue('--password') ?? argv[1] ?? (await rl.question('Admin password: '));

    if (!password || password.length < 6) {
      console.error('Password must be at least 6 characters long.');
      process.exitCode = 1;
      return;
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const user = await prisma.user.upsert({
      where: { username },
      update: { role: 'admin', passwordHash },
      create: { username, passwordHash, role: 'admin' },
    });

    console.log(`Admin ready: ${user.username} (role: ${user.role})`);
    console.log('Sign in from the portal by typing "admin" in the token box, then this password.');
  } finally {
    rl.close();
  }
}

main()
  .catch((error: unknown) => {
    console.error('Failed to create admin:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
