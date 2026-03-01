import { PrismaClient } from '@/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

let _prismaInstance: PrismaClient | undefined;

function getPrismaClient(): PrismaClient {
  if (_prismaInstance) {
    return _prismaInstance;
  }

  if (globalForPrisma.prisma) {
    _prismaInstance = globalForPrisma.prisma;
    return _prismaInstance;
  }

  let client: PrismaClient;

  if (process.env.DATABASE_URL) {
    const pool =
      globalForPrisma.pool ??
      new Pool({ connectionString: process.env.DATABASE_URL });
    if (process.env.NODE_ENV !== 'production') globalForPrisma.pool = pool;

    const adapter = new PrismaPg(pool);

    client = new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });
  } else {
    // Fallback without adapter when DATABASE_URL is not available
    client = new PrismaClient({
      log: ['error'],
    });
  }

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }

  _prismaInstance = client;
  return client;
}

// Use a Proxy to defer initialization until first use
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    return Reflect.get(client as object, prop, receiver);
  },
});

export default prisma;
