import 'reflect-metadata';

import * as crypto from 'crypto';
import { config as loadEnv } from 'dotenv';
import { Repository } from 'typeorm';

import dataSource from '../../../typeorm.config';
import { UserRole } from '../../users/user.entity';
import { User } from '../../users/user.entity';

// Load environment variables from .env
loadEnv();

const HASH_BYTES = 32;
const SALT_BYTES = 16;
const PBKDF2_ITERATIONS = 310000;
const PBKDF2_DIGEST = 'sha256';

async function hashPassword(
  password: string
): Promise<{ hashedPassword: string; salt: string }> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(SALT_BYTES).toString('hex');

    crypto.pbkdf2(
      password,
      salt,
      PBKDF2_ITERATIONS,
      HASH_BYTES,
      PBKDF2_DIGEST,
      (err, derivedKey) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({ hashedPassword: derivedKey.toString('hex'), salt });
      }
    );
  });
}

async function ensureAdmin(userRepo: Repository<User>): Promise<void> {
  const adminCount = await userRepo.count({
    where: { role: UserRole.ADMIN },
  });
  if (adminCount > 0) {
    // At least one admin already exists – nothing to do
    console.log('[seed] Admin already exists. Skipping creation.');
    return;
  }

  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || 'Admin';

  if (!email) {
    throw new Error('Missing env ADMIN_EMAIL');
  }
  if (!password) {
    throw new Error('Missing env ADMIN_PASSWORD');
  }

  // If a user with the given email already exists, upgrade it to ADMIN
  const existingByEmail = await userRepo.findOne({ where: { email } });

  const { hashedPassword } = await hashPassword(password);

  if (existingByEmail) {
    existingByEmail.name = existingByEmail.name || name;
    existingByEmail.role = UserRole.ADMIN;
    existingByEmail.passwordHash = hashedPassword;
    await userRepo.save(existingByEmail);
    console.log(`[seed] Upgraded existing user to admin: ${email}`);
    return;
  }

  const admin = userRepo.create({
    name,
    email,
    passwordHash: hashedPassword,
    role: UserRole.ADMIN,
  });

  await userRepo.save(admin);
  console.log(`[seed] Created admin user: ${email}`);
}

async function run() {
  try {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    const userRepo = dataSource.getRepository(User);
    await ensureAdmin(userRepo);
  } catch (err) {
    console.error('[seed] Failed:', err);
    process.exitCode = 1;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// Execute only when run directly via ts-node
run();
