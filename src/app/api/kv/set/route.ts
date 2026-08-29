import { NextResponse } from 'next/server';
import { LsmTreeEngine } from '@/lib/engine/lsm-tree';
import { EvictionEngine } from '@/lib/engine/eviction';
import { KvSetSchema } from '@/lib/security/validation';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`kv:set:${ip}`, { maxRequests: 100, windowMs: 60000 });
    if (!rate.success) {
      return NextResponse.json({ error: `Write IOPS rate limit reached. Retry in ${rate.resetInSeconds}s.` }, { status: 429 });
    }

    const body = await req.json();
    const parsed = KvSetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid set parameters' }, { status: 400 });
    }

    const { keyspaceName, key, value, ttlSeconds } = parsed.data;

    // 1. Write to LSM-Tree (WAL + MemTable)
    const result = await LsmTreeEngine.set(keyspaceName, key, value, ttlSeconds);

    // 2. Enforce Eviction Policy (LRU / LFU / TTL)
    const keyspace = await prisma.keyspace.findUnique({ where: { name: keyspaceName } });
    if (keyspace) {
      await EvictionEngine.enforceEviction(keyspace.id);
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('[KV_SET_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Set failed' }, { status: 500 });
  }
}
