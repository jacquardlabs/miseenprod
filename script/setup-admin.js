#!/usr/bin/env node
// If GHOST_ADMIN_EMAIL and GHOST_ADMIN_PASSWORD are set, update the admin
// user's password in the DB at startup. Safe to run on every deploy.

const path = require('node:path');
const fs = require('node:fs');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({path: envPath});
}

const adminEmail = process.env.GHOST_ADMIN_EMAIL;
const adminPassword = process.env.GHOST_ADMIN_PASSWORD;

if (!adminEmail || !adminPassword) {
  process.exit(0);
}

async function main() {
  const security = require('@tryghost/security');
  const mysql2 = require('mysql2/promise');

  const hash = await security.password.hash(adminPassword);

  const conn = await mysql2.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ghost'
  });

  try {
    const [result] = await conn.execute(
      'UPDATE users SET password = ?, status = "active" WHERE email = ?',
      [hash, adminEmail]
    );

    if (result.affectedRows === 0) {
      console.log(`setup-admin: no user found with email ${adminEmail}`);
    } else {
      console.log(`setup-admin: password set for ${adminEmail}`);
    }
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  // Log but don't block Ghost startup
  console.error('setup-admin error:', err.message);
});
