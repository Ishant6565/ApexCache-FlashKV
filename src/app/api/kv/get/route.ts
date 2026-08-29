import { NextResponse } from 'next/server';
import { LsmTreeEngine } from '@/lib/engine/lsm-tree';
import { KvGetSchema } from '@/lib/security/validation';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`kv:get:${ip}`, { maxRequests: 200, windowMs: 60000 });
    if (!rate.success) {
      return NextResponse.json({ error: `IOPS rate limit reached. Retry in ${rate.resetInSeconds}s.` }, { status: 429 });
    }

    const body = await req.json();
    const parsed = KvGetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid get request parameters' }, { status: 400 });
    }

    const { keyspaceName, key } = parsed.data;
    const result = await LsmTreeEngine.get(keyspaceName, key);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('[KV_GET_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Get failed' }, { status: 500 });
  }
}
