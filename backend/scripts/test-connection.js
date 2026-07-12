/**
 * Quick connectivity test — runs a raw SELECT 1 via Prisma.
 * If the DATABASE_URL is correct this will succeed.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error'],
});

async function test() {
  try {
    console.log('Testing connection to:', process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ':***@'));
    const result = await prisma.$queryRaw`SELECT 1 AS ok, current_database() AS db, version() AS pg_version`;
    console.log('✅ Connection OK:', JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('❌ Connection FAILED:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
test();
