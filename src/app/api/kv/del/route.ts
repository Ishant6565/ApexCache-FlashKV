import { NextResponse } from 'next/server';
import { LsmTreeEngine } from '@/lib/engine/lsm-tree';
import { KvDelSchema } from '@/lib/security/validation';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = KvDelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid del parameters' }, { status: 400 });
    }

    const { keyspaceName, key } = parsed.data;
    const result = await LsmTreeEngine.del(keyspaceName, key);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Del failed' }, { status: 500 });
  }
}
